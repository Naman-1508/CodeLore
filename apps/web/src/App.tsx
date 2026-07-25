import { ClerkProvider, SignIn, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { LayoutDashboard, Settings, Code, GitMerge, Activity, AlertTriangle, Users } from 'lucide-react'

// Import your publishable key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  console.error("Missing Publishable Key")
}

const Dashboard = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold mb-6">CodeLore Repository Dashboard</h1>
    <div className="bg-gray-50 border rounded-lg p-12 text-center text-gray-500">
      <p className="text-lg">No repositories imported yet.</p>
      <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition">
        Import Repository
      </button>
    </div>
  </div>
)

const FunctionExplorer = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold mb-6">Function Explorer</h1>
    <div className="bg-white border rounded-lg p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Functions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mock Function List */}
        <div className="border rounded p-4 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="font-mono text-sm font-bold text-blue-600">processData</span>
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Entry Point</span>
          </div>
          <p className="text-gray-500 text-sm truncate">file-1.ts:L10-25</p>
          <div className="flex gap-4 mt-2">
            <Link to="/functions/fn-1/blast-radius" className="text-sm text-blue-500 hover:underline flex items-center gap-1">
              <GitMerge size={14} /> Blast Radius
            </Link>
            <span className="text-sm text-purple-500 flex items-center gap-1" title="Top Contributor: Alice (75%)">
              <Users size={14} /> Alice
            </span>
          </div>
        </div>
        <div className="border rounded p-4 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="font-mono text-sm font-bold text-blue-600">helperFunction</span>
          </div>
          <p className="text-gray-500 text-sm truncate">file-1.ts:L30-45</p>
          <Link to="/functions/fn-2/blast-radius" className="mt-2 text-sm text-blue-500 hover:underline flex items-center gap-1">
            <GitMerge size={14} /> View Blast Radius
          </Link>
        </div>
      </div>
    </div>
  </div>
)

const BlastRadius = () => (
  <div className="p-8">
    <div className="mb-6 flex flex-col gap-2">
      <Link to="/functions" className="text-sm text-gray-500 hover:text-gray-800">← Back to Explorer</Link>
      <h1 className="text-3xl font-bold">Blast Radius</h1>
      <p className="text-gray-600 font-mono">Analyzing impact for function: fn-1</p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-bold text-red-600 mb-4 border-b pb-2">Callers (Dependents)</h2>
        <ul className="space-y-3">
          <li className="flex justify-between items-center bg-gray-50 p-3 rounded border">
            <span className="font-mono text-sm font-bold">apiHandler</span>
            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">3 calls</span>
          </li>
        </ul>
      </div>

      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-bold text-blue-600 mb-4 border-b pb-2">Callees (Dependencies)</h2>
        <ul className="space-y-3">
          <li className="flex justify-between items-center bg-gray-50 p-3 rounded border">
            <span className="font-mono text-sm font-bold">db.query</span>
            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">1 call</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
)

const ArchitectMode = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold mb-6">Architect Findings</h1>
    <div className="bg-white border rounded-lg p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Deterministic Code Anomalies</h2>
        <span className="bg-yellow-100 text-yellow-800 text-sm px-3 py-1 rounded-full font-medium">2 Findings</span>
      </div>
      
      <div className="space-y-4">
        <div className="border border-red-200 bg-red-50 rounded p-4 flex items-start gap-4">
          <AlertTriangle className="text-red-500 mt-1" size={24} />
          <div>
            <h3 className="font-bold text-red-800">Highly Coupled Modules</h3>
            <p className="text-red-600 text-sm mt-1">Files <code className="bg-red-100 px-1">src/auth.ts</code> and <code className="bg-red-100 px-1">src/session.ts</code> change together in 90% of commits.</p>
            <button className="mt-3 text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">View Git History</button>
          </div>
        </div>

        <div className="border border-yellow-200 bg-yellow-50 rounded p-4 flex items-start gap-4">
          <Activity className="text-yellow-500 mt-1" size={24} />
          <div>
            <h3 className="font-bold text-yellow-800">Circular Dependency</h3>
            <p className="text-yellow-700 text-sm mt-1">Circular dependency detected between <code className="bg-yellow-100 px-1">src/models/user.ts</code> and <code className="bg-yellow-100 px-1">src/models/workspace.ts</code></p>
            <button className="mt-3 text-xs bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700">View Call Graph</button>
          </div>
        </div>
      </div>
    </div>
  </div>
)

const WorkspaceSettings = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold mb-6">Workspace Settings</h1>
    <div className="bg-white border rounded-lg p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-4">AI Provider Configuration</h2>
      <p className="text-gray-600 mb-4">Configure your LLM provider for the AI Enrichment Layer.</p>
      <div className="flex flex-col gap-4 max-w-md">
        <label className="flex flex-col gap-1">
          <span className="font-medium text-sm text-gray-700">Provider</span>
          <select className="border rounded p-2 bg-gray-50">
            <option>None (AI Disabled)</option>
            <option>Anthropic</option>
            <option>OpenAI</option>
          </select>
        </label>
        <button className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 transition mt-2 self-start">Save Settings</button>
      </div>
    </div>
  </div>
)

const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col bg-white text-gray-900 font-sans">
    <header className="flex justify-between items-center p-4 border-b bg-gray-50">
      <div className="flex items-center gap-6">
        <span className="font-bold text-xl tracking-tight text-blue-700">CodeLore</span>
        <nav className="flex gap-4">
          <Link to="/" className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition">
            <LayoutDashboard size={18} /> Dashboard
          </Link>
          <Link to="/functions" className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition">
            <Code size={18} /> Explorer
          </Link>
          <Link to="/architect" className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition">
            <Activity size={18} /> Architect Mode
          </Link>
          <Link to="/settings" className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition">
            <Settings size={18} /> Settings
          </Link>
        </nav>
      </div>
      <div>
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
    <main className="flex-grow">
      {children}
    </main>
  </div>
)

function App() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY || "missing"} afterSignOutUrl="/">
      <BrowserRouter>
        <SignedOut>
          <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
            <div className="mb-8 text-center">
              <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">CodeLore</h1>
              <p className="text-lg text-gray-600">The Google Maps for your Software.</p>
            </div>
            <SignIn />
          </div>
        </SignedOut>
        <SignedIn>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/settings" element={<WorkspaceSettings />} />
              <Route path="/functions" element={<FunctionExplorer />} />
              <Route path="/architect" element={<ArchitectMode />} />
              <Route path="/functions/:id/blast-radius" element={<BlastRadius />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </SignedIn>
      </BrowserRouter>
    </ClerkProvider>
  )
}

export default App
