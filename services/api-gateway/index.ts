import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from the root .env file
dotenv.config({ path: resolve(__dirname, '../../.env') });

import express, { Request, Response, RequestHandler } from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import { ClerkExpressRequireAuth, StrictAuthProp } from '@clerk/clerk-sdk-node';
import { createDbConnection, eq, sql, desc, repositories, functions, callEdges, architectureSnapshots, codeStories, codeStorySteps, users, workspaces, files } from '@repo/database';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const app = express();

const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3, // Changed from null so it doesn't hang indefinitely on bad connections
  connectTimeout: 2000,
  tls: process.env.REDIS_URL?.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined
});
const parseQueue = new Queue('parser-queue', { connection: redisConnection });


app.use(cors());
app.use(express.json());

const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/codelore';
const db = createDbConnection(dbUrl);

// Extend Express Request to include Auth
declare global {
  namespace Express {
    interface Request extends StrictAuthProp {}
  }
}

// Clerk Auth Middleware
const requireAuth = process.env.CLERK_SECRET_KEY 
  ? ClerkExpressRequireAuth() 
  : (req: any, res: any, next: any) => { 
      req.auth = { userId: 'mock-user-123' }; 
      next(); 
    };

app.use('/v1', requireAuth as express.RequestHandler);

// --- Workspace Routes ---
app.post('/v1/workspaces', async (req, res) => {
  const { name } = req.body;
  // Stub for MVP
  res.json({ id: 'workspace-123', name, role: 'owner' });
});

app.get('/v1/workspaces', async (req, res) => {
  // Stub for MVP
  res.json([{ id: 'workspace-123', name: 'My Workspace' }]);
});

// --- Repository Routes ---
app.post('/v1/repositories', async (req, res) => {
  const { remoteUrl } = req.body;
  
  try {
    const userIdentifier = req.auth?.userId || 'mock-user-123';
    const workspaceName = `Workspace-${userIdentifier}`;
    let ws = await db.query.workspaces.findFirst({
      where: eq(workspaces.name, workspaceName)
    });
    if (!ws) {
      const [newWs] = await db.insert(workspaces).values({
        name: workspaceName,
        aiLayerEnabled: true
      }).returning();
      ws = newWs;
    }

    const result = await db.insert(repositories).values({
      remoteUrl,
      workspaceId: ws.id,
      name: remoteUrl.split('/').pop()?.replace('.git', '') || 'Unknown Repo',
      indexingStatus: 'pending'
    }).onConflictDoUpdate({
      target: [repositories.workspaceId, repositories.remoteUrl],
      set: { indexingStatus: 'pending' }
    }).returning();
    
    // Kick off parsing by adding to BullMQ
    try {
      await parseQueue.add('parse-repo', {
        repositoryId: result[0].id,
        remoteUrl,
        workspaceId: ws.id
      });
      console.log(`Added parsing job for repo ${result[0].id} to queue.`);
    } catch (e) {
      console.error('Failed to add job to queue', e);
    }

    res.json(result[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create repository' });
  }
});

app.get('/v1/repositories', async (req, res) => {
  try {
    const userIdentifier = req.auth?.userId || 'mock-user-123';
    const workspaceName = `Workspace-${userIdentifier}`;
    const ws = await db.query.workspaces.findFirst({
      where: eq(workspaces.name, workspaceName)
    });
    
    if (!ws) {
       return res.json([]);
    }

    const repos = await db.query.repositories.findMany({
      where: eq(repositories.workspaceId, ws.id)
    });
    res.json(repos);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/v1/repositories/:id', async (req, res) => {
  try {
    const repo = await db.query.repositories.findFirst({
      where: eq(repositories.id, req.params.id)
    });
    if (!repo) {
      return res.status(404).json({ error: 'Repository not found' });
    }
    res.json(repo);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/v1/repositories/:id/status', async (req, res) => {
  try {
    const repo = await db.query.repositories.findFirst({
      where: eq(repositories.id, req.params.id)
    });
    if (!repo) {
      return res.status(404).json({ error: 'Repository not found' });
    }
    res.json({ status: repo.indexingStatus, locTotal: repo.locTotal });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// --- Function Explorer & Blast Radius Routes ---
app.get('/v1/repositories/:id/functions', async (req, res) => {
  try {
    const repoFunctions = await db.select({
      id: functions.id,
      name: functions.name,
      signature: functions.signature,
      startLine: functions.startLine,
      endLine: functions.endLine,
      complexityScore: functions.complexityScore,
      isEntryPoint: functions.isEntryPoint
    })
    .from(functions)
    .innerJoin(files, eq(functions.fileId, files.id))
    .where(eq(files.repositoryId, req.params.id))
    .limit(100);
    res.json(repoFunctions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch functions' });
  }
});

// --- Architect Findings & Git Signals Routes (Phase 2) ---
app.get('/v1/repositories/:id/architect-findings', async (req, res) => {
  try {
    // We'll return snapshots if any exist
    const snapshots = await db.query.architectureSnapshots.findMany({
      where: eq(architectureSnapshots.repositoryId, req.params.id),
      orderBy: (snap, { desc }) => [desc(snap.timestamp)],
      limit: 1
    });
    
    if (snapshots.length === 0) {
      return res.json([]);
    }
    
    // Return the actual metrics JSON as findings if it exists
    const snap = snapshots[0];
    if (snap.moduleMapJson) {
      const metrics = typeof snap.moduleMapJson === 'string' ? JSON.parse(snap.moduleMapJson) : snap.moduleMapJson;
      const findings = [];
      if (metrics.couplingIndex > 50) {
        findings.push({ id: 'f1', type: 'highly_coupled', severity: 'high', description: `High coupling index detected (${metrics.couplingIndex.toFixed(1)}). Code is highly interdependent.` });
      }
      if (metrics.modularityScore < 40) {
         findings.push({ id: 'f2', type: 'low_modularity', severity: 'medium', description: `Modularity score is low (${metrics.modularityScore.toFixed(1)}). Consider breaking down large files.` });
      }
      return res.json(findings);
    }
    
    return res.json([]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch findings' });
  }
});

app.get('/v1/repositories/:id/stories', async (req, res) => {
  try {
    const stories = await db.query.codeStories.findMany({
      where: eq(codeStories.repositoryId, req.params.id)
    });
    res.json(stories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stories' });
  }
});

app.get('/v1/repositories/:id/stories/:storyId', async (req, res) => {
  try {
    const story = await db.query.codeStories.findFirst({
      where: eq(codeStories.id, req.params.storyId),
      with: {
        steps: {
          with: {
            function: {
              with: {
                file: true
              }
            }
          }
        }
      }
    });
    
    if (!story) return res.status(404).json({ error: 'Story not found' });
    
    res.json(story);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch story' });
  }
});

// --- Health Route ---
app.get('/v1/repositories/:id/health', async (req, res) => {
  try {
    const snapshots = await db.query.architectureSnapshots.findMany({
      where: eq(architectureSnapshots.repositoryId, req.params.id),
      orderBy: (snap, { desc }) => [desc(snap.timestamp)],
      limit: 1
    });
    
    if (snapshots.length === 0) {
      // Empty state
      return res.json(null);
    }
    
    try {
      const snap = snapshots[0];
      const metrics = typeof snap.moduleMapJson === 'string' ? JSON.parse(snap.moduleMapJson) : snap.moduleMapJson;
      res.json({ 
        status: metrics.couplingIndex > 50 ? 'warning' : 'healthy', 
        issues: (metrics.couplingIndex > 50 ? 1 : 0) + (metrics.modularityScore < 40 ? 1 : 0),
        modularityScore: metrics.modularityScore,
        couplingIndex: metrics.couplingIndex
      });
    } catch {
      res.json(null);
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch health' });
  }
});


// --- Contribution & Ownership Routes ---
app.get('/v1/repositories/:id/ownership', async (req, res) => {
  try {
    // We don't have an explicit 'ownership' table in the provided schema yet,
    // but we can compute it from gitCommits and commitFileChanges.
    // For MVP, just return empty state correctly so UI doesn't crash.
    const commits: any[] = []; // Schema for gitCommits doesn't exist yet
    
    if (commits.length === 0) {
      return res.json({ topContributors: [], recentPRs: [] });
    }

    // In a real implementation, aggregate commits per author.
    // For now we will return an empty list since the parser isn't ingesting these yet.
    res.json({ topContributors: [], recentPRs: [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch ownership' });
  }
});

// --- Semantic Search ---
app.post('/v1/repositories/:id/search', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Missing query string' });
    if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'No AI key configured' });

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.embedContent({
      model: 'gemini-embedding-2',
      contents: query
    });
    
    let vec = response.embeddings?.[0]?.values || [];
    if (vec.length < 1536) {
      vec = [...vec, ...new Array(1536 - vec.length).fill(0)];
    } else if (vec.length > 1536) {
      vec = vec.slice(0, 1536);
    }
    
    // Find top 5 functions closest to the query embedding
    // Drizzle requires the vector to be formatted as an array for pgvector
    const similarity = sql`1 - (${functions.embedding} <=> ${JSON.stringify(vec)}::vector)` as any;
    const results = await db.select({
      id: functions.id,
      name: functions.name,
      signature: functions.signature,
      docstring: functions.docstring,
      similarity
    })
    .from(functions)
    .where(
      sql`${functions.fileId} IN (SELECT id FROM "file" WHERE repository_id = ${req.params.id})` as any
    )
    .orderBy((t: any) => desc(t.similarity) as any)
    .limit(5);

    res.json(results);
  } catch (err) {
    console.error('Search error', err);
    res.status(500).json({ error: 'Failed to perform semantic search' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API Gateway listening on port ${PORT}`);
});
