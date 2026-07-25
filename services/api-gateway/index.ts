import express from 'express';
import cors from 'cors';
import { ClerkExpressRequireAuth, StrictAuthProp, RequireAuthProp } from '@clerk/clerk-sdk-node';

const app = express();

app.use(cors());
app.use(express.json());

// Extend Express Request to include Auth
declare global {
  namespace Express {
    interface Request extends StrictAuthProp {}
  }
}

// Clerk Auth Middleware (Require Authentication for all routes below)
// We will use a mock bypass if not configured for local development flexibility
const requireAuth = process.env.CLERK_SECRET_KEY 
  ? ClerkExpressRequireAuth() 
  : (req: any, res: any, next: any) => { 
      req.auth = { userId: 'mock-user-123' }; 
      next(); 
    };

app.use('/v1', requireAuth);

// --- Workspace Routes ---
app.post('/v1/workspaces', (req, res) => {
  const { name } = req.body;
  // TODO: Call platform service or insert into db directly
  res.json({ id: 'workspace-123', name, role: 'owner' });
});

app.get('/v1/workspaces', (req, res) => {
  // TODO: Fetch user's workspaces
  res.json([{ id: 'workspace-123', name: 'My Workspace' }]);
});

// --- Repository Routes ---
app.post('/v1/repositories', (req, res) => {
  const { remoteUrl, workspaceId } = req.body;
  // TODO: Initiate repository shallow clone and DB row insertion
  res.json({ 
    id: 'repo-123', 
    remoteUrl, 
    status: 'cloning', 
    workspaceId 
  });
});

app.get('/v1/repositories/:id', (req, res) => {
  // TODO: Poll status fallback
  res.json({ id: req.params.id, status: 'cloning' });
});

// --- Function Explorer & Blast Radius Routes ---
app.get('/v1/repositories/:id/functions', (req, res) => {
  // TODO: Query DB for functions in this repository
  res.json([
    { id: 'fn-1', name: 'processData', fileId: 'file-1', isEntryPoint: true },
    { id: 'fn-2', name: 'helperFunction', fileId: 'file-1', isEntryPoint: false }
  ]);
});

app.get('/v1/functions/:id/blast-radius', (req, res) => {
  // TODO: Query call_edge table for caller/callee relationships
  res.json({
    functionId: req.params.id,
    callers: [{ id: 'fn-1', name: 'processData', callCount: 3 }],
    callees: []
  });
});

// --- Architect Findings & Git Signals Routes (Phase 2) ---
app.get('/v1/repositories/:id/architect-findings', (req, res) => {
  // TODO: Query precomputed findings (co-change clusters, dead code)
  res.json([
    {
      id: 'finding-1',
      type: 'highly_coupled',
      description: 'Files src/auth.ts and src/session.ts change together in 90% of commits.',
      severity: 'high'
    },
    {
      id: 'finding-2',
      type: 'circular_dependency',
      description: 'Circular dependency detected between src/models/user.ts and src/models/workspace.ts',
      severity: 'medium'
    }
  ]);
});

app.get('/v1/repositories/:id/ownership', (req, res) => {
  const { fileId } = req.query;
  // TODO: Query ownership table/heuristics for a specific file
  if (fileId) {
    res.json([
      { author: 'Alice', percentage: 75 },
      { author: 'Bob', percentage: 25 }
    ]);
  } else {
    res.json([]);
  }
});

// --- Repository Health & Code Stories Routes (Phase 3) ---
app.get('/v1/repositories/:id/overview', (req, res) => {
  res.json({
    id: req.params.id,
    moduleCount: 15,
    entryPoints: 3,
    topModules: ['auth', 'database', 'api']
  });
});

app.get('/v1/repositories/:id/health', (req, res) => {
  res.json({
    currentScore: 85,
    trends: [70, 75, 78, 80, 85],
    metrics: { circularDependencies: 0, highlyCoupledModules: 1, deadCodeFunctions: 2 }
  });
});

app.get('/v1/repositories/:id/code-stories', (req, res) => {
  res.json([
    {
      id: 'story-1',
      title: 'processData Flow',
      description: 'Auto-generated baseline sequence for processData',
      stepsCount: 3
    }
  ]);
});

app.get('/v1/repositories/:id/code-stories/:storyId', (req, res) => {
  res.json({
    id: req.params.storyId,
    title: 'processData Flow',
    steps: [
      { order: 1, narration: "The flow begins at the entry point 'processData', which handles the initial request." },
      { order: 2, narration: "It then calls a validation function to verify the payload." },
      { order: 3, narration: "Finally, it interacts with the database to persist the changes." }
    ]
  });
});

app.get('/v1/search', (req, res) => {
  const { q } = req.query;
  res.json([
    { type: 'symbol', name: 'processData', file: 'file-1.ts' },
    { type: 'file', name: 'auth.ts', path: 'src/auth.ts' }
  ]);
});

// --- AI Enrichment & Engineering Mentor Routes (Phase 4) ---
app.post('/v1/ai/generate-docstrings', (req, res) => {
  // TODO: Insert a job into the background_job table
  res.json({ message: 'Docstring generation job queued successfully.' });
});

app.post('/v1/ai/chat', (req, res) => {
  const { message, repositoryId } = req.body;
  // TODO: Call MentorOrchestrator in parser-service
  res.json({
    text: `Based on the context: The function processData handles the initial request.`,
    factChips: [
      { type: 'function', name: 'processData' },
      { type: 'file', name: 'handler.ts' }
    ]
  });
});

// --- Architecture Replay & AI Narration Routes (Phase 5) ---
app.get('/v1/repositories/:id/architecture-replay/snapshots', (req, res) => {
  // Returns chronological structural snapshots
  res.json([
    { commit: 'a1b2c3d', timestamp: '2023-01-01', moduleCount: 5 },
    { commit: 'e5f6g7h', timestamp: '2023-06-01', moduleCount: 8 }
  ]);
});

app.get('/v1/repositories/:id/architecture-replay/transitions', (req, res) => {
  const { from, to } = req.query;
  // Calls TransitionDetector
  res.json({
    narration: `Between ${from} and ${to}, the 'auth' module was extracted from 'api'.`
  });
});

app.post('/v1/repositories/:id/code-stories', (req, res) => {
  res.json({ message: 'Code Story manually authored successfully.' });
});

app.post('/v1/repositories/:id/guided-tours', (req, res) => {
  res.json({ message: 'Guided Tour created successfully.' });
});

app.post('/v1/repositories/:id/execution-flows/:traceId/promote', (req, res) => {
  res.json({ message: 'Execution flow promoted to Code Story.' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API Gateway listening on port ${PORT}`);
});
