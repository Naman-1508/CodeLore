import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { createDbConnection, eq, inArray, repositories, files, classes, functions, callEdges, healthSnapshots, codeStories, codeStorySteps, sql } from '@repo/database';
import { CodeParser, ParsedFunction } from './parser';
import { HealthScorer } from './health-scorer';
import { CodeStoryGenerator } from './code-story-generator';
import { GeminiAdapter } from './gemini-adapter';

const execAsync = promisify(exec);
// DB connection created dynamically to ensure env vars are loaded first
const parser = new CodeParser();

export async function runParsingPipeline(repositoryId: string, remoteUrl: string, workspaceId: string) {
  const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/codelore';
  const db = createDbConnection(dbUrl);
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

    if (parsedData.length > 0) {
      const dbFiles = await db.insert(files).values(parsedData.map(d => ({
        repositoryId,
        path: d.path,
        language: d.language,
        loc: d.loc
      }))).onConflictDoUpdate({
        target: [files.repositoryId, files.path],
        set: { loc: sql`EXCLUDED.loc`, language: sql`EXCLUDED.language` }
      }).returning();
      
      const fileToDbId = new Map();
      dbFiles.forEach(f => fileToDbId.set(f.path, f.id));

      const classesToInsert = [];
      const functionsToInsert = [];

      parsedData.forEach(d => {
        const fId = fileToDbId.get(d.path);
        d.classes.forEach(c => classesToInsert.push({ fileId: fId, name: c.name }));
        d.functions.forEach(fn => functionsToInsert.push({ fileId: fId, name: fn.name, signature: fn.signature, startLine: fn.startLine, endLine: fn.endLine, calls: fn.calls }));
      });

      if (classesToInsert.length > 0) {
        for (let i = 0; i < classesToInsert.length; i += 1000) {
          await db.insert(classes).values(classesToInsert.slice(i, i + 1000)).onConflictDoNothing();
        }
      }

      if (functionsToInsert.length > 0) {
        for (let i = 0; i < functionsToInsert.length; i += 1000) {
          const chunk = functionsToInsert.slice(i, i + 1000);
          const dbFns = await db.insert(functions).values(chunk.map(fn => ({
            fileId: fn.fileId,
            name: fn.name,
            signature: fn.signature,
            startLine: fn.startLine,
            endLine: fn.endLine
          }))).onConflictDoUpdate({
            target: [functions.fileId, functions.name],
            set: { startLine: sql`EXCLUDED.start_line`, endLine: sql`EXCLUDED.end_line` }
          }).returning();
          
          for (let j = 0; j < chunk.length; j++) {
            allFunctionsWithCalls.push({ dbId: dbFns[j].id, calls: chunk[j].calls });
            functionNameToIdMap.set(chunk[j].name, dbFns[j].id);
          }
        }
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
        await db.insert(callEdges).values(edgesToInsert.slice(i, i + chunkSize)).onConflictDoNothing();
      }
    }

    // 5. Run Health Scorer and AI Generators
    console.log('Running AI generation and heuristics...');
    const allDbFiles = await db.query.files.findMany({ where: eq(files.repositoryId, repositoryId) });
    const fileIds = allDbFiles.map(f => f.id);
    const repoFunctions = fileIds.length > 0 ? await db.query.functions.findMany({ where: inArray(functions.fileId, fileIds) }) : [];
    
    // Calculate health
    const health = HealthScorer.calculateScore(repositoryId, allDbFiles, repoFunctions, edgesToInsert);
    await db.insert(healthSnapshots).values({
      repositoryId,
      score: health.modularityScore,
      metricsJson: health.metricsJson
    });

    // Generate Code Stories
    if (process.env.GEMINI_API_KEY) {
      const aiAdapter = new GeminiAdapter(process.env.GEMINI_API_KEY);
      // Mock finding an entry point (e.g. index.ts or main)
      const entryPoints = repoFunctions.filter(f => f.name.includes('index') || f.name.includes('main') || f.name.includes('App'));
      if (entryPoints.length > 0) {
        
        // CodeStoryGenerator expects functionsDbMap by ID. Let's create it:
        const functionsDbMap = new Map();
        for (const fn of repoFunctions) functionsDbMap.set(fn.id, fn);
        
        const actualStories = await CodeStoryGenerator.generateBaselineStories(
          repositoryId, 
          entryPoints.slice(0, 1), 
          edgesToInsert, 
          functionsDbMap, 
          aiAdapter
        );
        
        for (const story of actualStories) {
          const [dbStory] = await db.insert(codeStories).values({
            repositoryId,
            title: story.title,
            description: story.description,
            entryFunctionId: story.entryFunctionId
          }).returning();
          
          for (const step of story.steps) {
            await db.insert(codeStorySteps).values({
              storyId: dbStory.id,
              order: step.order,
              functionId: step.functionId,
              narration: step.narration
            });
          }
        }
      }
    }

    // 6. Mark ready
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
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(console.error);
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
