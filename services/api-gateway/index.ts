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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API Gateway listening on port ${PORT}`);
});
