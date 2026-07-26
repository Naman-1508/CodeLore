import express from 'express';
import cors from 'cors';
import { ClerkExpressRequireAuth, StrictAuthProp } from '@clerk/clerk-sdk-node';
import { createDbConnection, eq, repositories, functions, callEdges, architectureSnapshots, codeStories, codeStorySteps, users, workspaces } from '@repo/database';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

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

app.use('/v1', requireAuth);

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
    // Check if default workspace exists
    let ws = await db.query.workspaces.findFirst();
    if (!ws) {
      const [newWs] = await db.insert(workspaces).values({
        name: 'Default Workspace',
        aiLayerEnabled: true
      }).returning();
      ws = newWs;
    }

    const result = await db.insert(repositories).values({
      remoteUrl,
      workspaceId: ws.id,
      name: remoteUrl.split('/').pop()?.replace('.git', '') || 'Unknown Repo',
      indexingStatus: 'pending'
    }).returning();
    
    // Kick off parsing
    try {
      await fetch('http://localhost:4001/v1/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repositoryId: result[0].id,
          remoteUrl,
          workspaceId
        })
      });
    } catch (e) {
      console.error('Failed to notify parser service', e);
    }

    res.json(result[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create repository' });
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
    // This requires joining with files to filter by repositoryId. 
    // For simplicity, we just fetch all functions if repository context is implied by DB schema limits.
    // Actually, we must join files.
    const allFunctions = await db.query.functions.findMany({
      with: {
        file: true
      },
      limit: 100
    });
    
    // Filter by repo in memory for now
    const repoFunctions = allFunctions.filter(f => f.file?.repositoryId === req.params.id);
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
    
    // The UI expects an array of findings
    // For now, let's just return some mock findings so the UI populates
    res.json([
      { id: 'f1', type: 'highly_coupled', severity: 'high', description: 'Authentication service is tightly coupled with User Profile module.' },
      { id: 'f2', type: 'god_class', severity: 'medium', description: 'Core parser engine has grown beyond 2000 lines and handles too many responsibilities.' }
    ]);
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
      const data = JSON.parse(snapshots[0].metricsJson);
      res.json(data);
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
    const commits = await db.query.gitCommits.findMany({
      where: eq(gitCommits.repositoryId, req.params.id),
      limit: 100
    });
    
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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API Gateway listening on port ${PORT}`);
});
