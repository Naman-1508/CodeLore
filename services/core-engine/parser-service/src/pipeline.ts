import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { createDbConnection, eq, repositories, files, classes, functions, callEdges } from '@repo/database';
import { CodeParser, ParsedFunction } from './parser';

const execAsync = promisify(exec);
const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/codelore';
const db = createDbConnection(dbUrl);
const parser = new CodeParser();

export async function runParsingPipeline(repositoryId: string, remoteUrl: string, workspaceId: string) {
  const tmpDir = path.join(__dirname, '..', 'tmp', repositoryId);

  try {
    // 1. Update status to cloning
    await db.update(repositories)
      .set({ indexingStatus: 'cloning' })
      .where(eq(repositories.id, repositoryId));

    // 2. Clone repository
    await fs.mkdir(path.join(__dirname, '..', 'tmp'), { recursive: true });
    // Remove if exists
    await fs.rm(tmpDir, { recursive: true, force: true });
    
    console.log(`Cloning ${remoteUrl} into ${tmpDir}...`);
    await execAsync(`git clone --depth 1 ${remoteUrl} ${tmpDir}`);

    // 3. Update status to parsing
    await db.update(repositories)
      .set({ indexingStatus: 'parsing' })
      .where(eq(repositories.id, repositoryId));

    console.log(`Traversing ${tmpDir}...`);
    // Traverse and parse
    const allFiles = await walkDir(tmpDir);
    const validExts = ['.js', '.jsx', '.ts', '.tsx'];
    
    const parsedData = [];
    let locTotal = 0;

    for (const file of allFiles) {
      if (validExts.some(ext => file.endsWith(ext))) {
        const content = await fs.readFile(file, 'utf8');
        const loc = content.split('\n').length;
        locTotal += loc;
        
        try {
          const { functions, classes } = parser.parse(content);
          const relativePath = path.relative(tmpDir, file).replace(/\\/g, '/');
          parsedData.push({
            path: relativePath,
            language: path.extname(file).replace('.', ''),
            loc,
            functions,
            classes,
          });
        } catch (e) {
          console.error(`Failed to parse ${file}`, e);
        }
      }
    }

    // 4. Update status to analyzing
    await db.update(repositories)
      .set({ indexingStatus: 'analyzing', locTotal })
      .where(eq(repositories.id, repositoryId));

    console.log(`Inserting data into DB...`);
    // Insert into DB
    const allFunctionsWithCalls: { dbId: string, calls: string[] }[] = [];
    const functionNameToIdMap = new Map<string, string>();

    for (const data of parsedData) {
      // Insert file
      const [dbFile] = await db.insert(files).values({
        repositoryId,
        path: data.path,
        language: data.language,
        loc: data.loc
      }).returning();

      // Insert classes
      for (const cls of data.classes) {
        await db.insert(classes).values({
          fileId: dbFile.id,
          name: cls.name
        });
      }

      // Insert functions
      for (const fn of data.functions) {
        const [dbFn] = await db.insert(functions).values({
          fileId: dbFile.id,
          name: fn.name,
          signature: fn.signature,
          startLine: fn.startLine,
          endLine: fn.endLine
        }).returning();

        allFunctionsWithCalls.push({ dbId: dbFn.id, calls: fn.calls });
        functionNameToIdMap.set(fn.name, dbFn.id);
      }
    }

    // Build Call Edges
    console.log(`Building call edges...`);
    const edgesToInsert = [];
    for (const fnData of allFunctionsWithCalls) {
      for (const callName of fnData.calls) {
        const calleeId = functionNameToIdMap.get(callName);
        if (calleeId && calleeId !== fnData.dbId) {
          edgesToInsert.push({
            repositoryId,
            callerFunctionId: fnData.dbId,
            calleeFunctionId: calleeId,
            callCount: 1
          });
        }
      }
    }

    if (edgesToInsert.length > 0) {
      // Insert in chunks to avoid query size limits
      const chunkSize = 1000;
      for (let i = 0; i < edgesToInsert.length; i += chunkSize) {
        await db.insert(callEdges).values(edgesToInsert.slice(i, i + chunkSize));
      }
    }

    // 5. Cleanup and mark ready
    await fs.rm(tmpDir, { recursive: true, force: true });
    
    await db.update(repositories)
      .set({ 
        indexingStatus: 'ready',
        lastIndexedAt: new Date()
      })
      .where(eq(repositories.id, repositoryId));
      
    console.log(`Finished parsing repository ${repositoryId}`);

  } catch (err) {
    console.error('Pipeline failed', err);
    await db.update(repositories)
      .set({ indexingStatus: 'error' })
      .where(eq(repositories.id, repositoryId));
  }
}

async function walkDir(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const res = path.resolve(dir, entry.name);
    // Ignore node_modules, .git, dist
    if (entry.isDirectory()) {
      if (['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
        return [];
      }
      return walkDir(res);
    } else {
      return res;
    }
  }));
  return Array.prototype.concat(...files);
}
