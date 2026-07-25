import { ClerkProvider, SignIn, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { LayoutDashboard, Settings, Code, GitMerge, Activity, AlertTriangle, Users, Search, BookOpen, ChevronRight, ChevronLeft, Bot, Sparkles, Send, X } from 'lucide-react'
import React, { useState } from 'react'

// Import your publishable key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  console.error("Missing Publishable Key")
}

const Dashboard = () => (
  <div className="p-8">
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold">CodeLore Dashboard</h1>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="Search symbols or files (⌘K)..." 
          className="pl-10 pr-4 py-2 border rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
        />
      </div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white border rounded-lg p-6 shadow-sm col-span-2">
        <h2 className="text-xl font-semibold mb-4">Repository Overview</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded text-center">
            <p className="text-3xl font-bold text-blue-600">15</p>
            <p className="text-sm text-gray-500">Modules</p>
          </div>
          <div className="bg-green-50 p-4 rounded text-center">
            <p className="text-3xl font-bold text-green-600">3</p>
            <p className="text-sm text-gray-500">Entry Points</p>
          </div>
          <div className="bg-purple-50 p-4 rounded text-center">
            <p className="text-3xl font-bold text-purple-600">85</p>
            <p className="text-sm text-gray-500">Health Score</p>
          </div>
        </div>
      </div>
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Top Modules</h2>
        <ul className="space-y-2 text-sm text-gray-700 font-mono">
          <li className="flex justify-between bg-gray-50 p-2 rounded"><span>auth</span> <span className="text-gray-400">35%</span></li>
          <li className="flex justify-between bg-gray-50 p-2 rounded"><span>database</span> <span className="text-gray-400">28%</span></li>
          <li className="flex justify-between bg-gray-50 p-2 rounded"><span>api</span> <span className="text-gray-400">15%</span></li>
        </ul>
      </div>
    </div>

    <h2 className="text-2xl font-bold mb-4">Code Stories</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Link to="/stories/story-1" className="block bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition">
        <div className="flex items-start gap-3">
          <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
            <BookOpen size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900">processData Flow</h3>
            <p className="text-gray-500 text-sm mt-1">Auto-generated baseline sequence for processData.</p>
            <span className="inline-block mt-3 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">3 Steps</span>
          </div>
        </div>
      </Link>
    </div>
  </div>
)

const CodeStoryViewer = () => (
  <div className="flex h-[calc(100vh-65px)]">
    {/* Left Panel: Narration & Steps */}
    <div className="w-1/3 border-r bg-gray-50 p-6 overflow-y-auto">
      <Link to="/" className="text-sm text-gray-500 hover:text-gray-800 mb-6 inline-block">← Back to Dashboard</Link>
      <h1 className="text-2xl font-bold mb-2">processData Flow</h1>
      <p className="text-gray-600 text-sm mb-8">Follow this sequence to understand the main data processing pipeline.</p>
      
      <div className="space-y-4">
        {/* Step 1 */}
        <div className="border-l-4 border-blue-500 bg-white p-4 shadow-sm rounded-r-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">Step 1</span>
            <span className="font-mono text-sm font-bold text-gray-700">processData</span>
          </div>
          <p className="text-gray-700 text-sm">The flow begins at the entry point 'processData', which handles the initial request.</p>
        </div>
        
        {/* Step 2 */}
        <div className="border-l-4 border-gray-300 bg-white p-4 rounded-r-lg opacity-60">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-gray-100 text-gray-800 text-xs font-bold px-2 py-1 rounded-full">Step 2</span>
            <span className="font-mono text-sm font-bold text-gray-700">validatePayload</span>
          </div>
          <p className="text-gray-700 text-sm">It then calls a validation function to verify the payload.</p>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button className="text-gray-400 cursor-not-allowed flex items-center gap-1"><ChevronLeft size={16} /> Prev</button>
        <button className="text-blue-600 hover:text-blue-800 flex items-center gap-1">Next <ChevronRight size={16} /></button>
      </div>
    </div>
    
    {/* Right Panel: Source Code */}
    <div className="w-2/3 bg-[#1e1e1e] text-white p-6 overflow-y-auto">
      <div className="flex justify-between items-center border-b border-gray-700 pb-2 mb-4">
        <span className="font-mono text-sm text-gray-400">src/api/handler.ts</span>
      </div>
      <pre className="font-mono text-sm leading-relaxed text-gray-300">
<code>{`export async function processData(req: Request) {
  // Step 1 highlighted
  const payload = await req.json();
  
  if (!validatePayload(payload)) {
    throw new Error('Invalid payload');
  }

  await db.insert(payload);
  return { success: true };
}`}</code>
      </pre>
    </div>
  </div>
)

const FunctionExplorer = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold mb-6">Function Explorer</h1>
    <div className="bg-white border rounded-lg p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Functions</h2>
      <div className="grid grid-cols-1 gap-4">
        {/* Mock Function List */}
        <div className="border rounded p-4 flex flex-col gap-2 relative">
          <div className="absolute top-4 right-4 flex gap-2">
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Entry Point</span>
          </div>
          <div>
            <span className="font-mono text-lg font-bold text-blue-600">processData</span>
            <span className="text-gray-400 text-sm ml-2">file-1.ts:L10-25</span>
          </div>
          <p className="text-gray-700 text-sm bg-gray-50 p-2 rounded border border-gray-100 flex items-start gap-2">
            <Sparkles className="text-purple-500 mt-0.5" size={14} />
            Validates the incoming payload against the schema and handles the initial request.
          </p>
          <div className="flex gap-4 mt-2 pt-2 border-t border-gray-100">
            <Link to="/functions/fn-1/blast-radius" className="text-sm text-blue-500 hover:underline flex items-center gap-1">
              <GitMerge size={14} /> Blast Radius
            </Link>
            <span className="text-sm text-gray-500 flex items-center gap-1" title="Top Contributor: Alice (75%)">
              <Users size={14} /> Alice (75%)
            </span>
          </div>
        </div>
        <div className="border rounded p-4 flex flex-col gap-2 relative">
          <div>
            <span className="font-mono text-lg font-bold text-blue-600">helperFunction</span>
            <span className="text-gray-400 text-sm ml-2">file-1.ts:L30-45</span>
          </div>
          <p className="text-gray-700 text-sm bg-gray-50 p-2 rounded border border-gray-100 flex items-start gap-2">
            <Sparkles className="text-purple-500 mt-0.5" size={14} />
            Computes the hash of the payload string for validation.
          </p>
          <div className="flex gap-4 mt-2 pt-2 border-t border-gray-100">
            <Link to="/functions/fn-2/blast-radius" className="text-sm text-blue-500 hover:underline flex items-center gap-1">
              <GitMerge size={14} /> Blast Radius
            </Link>
          </div>
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

const EngineeringMentor = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-purple-600 text-white p-4 rounded-full shadow-lg hover:bg-purple-700 transition flex items-center justify-center z-40"
      >
        <Bot size={24} />
      </button>

      {/* Slide-out Panel */}
      {isOpen && (
        <div className="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl border-l z-50 flex flex-col transform transition-transform duration-300">
          <div className="flex justify-between items-center p-4 border-b bg-gray-50">
            <div className="flex items-center gap-2 text-purple-700">
              <Sparkles size={20} />
              <h2 className="font-bold">Engineering Mentor</h2>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-800">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-grow p-4 overflow-y-auto bg-gray-50 flex flex-col gap-4">
            <div className="self-end bg-blue-600 text-white p-3 rounded-lg rounded-tr-none text-sm max-w-[85%] shadow-sm">
              How does processData work?
            </div>
            <div className="self-start bg-white border p-3 rounded-lg rounded-tl-none text-sm text-gray-800 max-w-[95%] shadow-sm">
              <p>Based on the context: The function processData handles the initial request and calls validatePayload.</p>
              
              <div className="mt-3 pt-3 border-t flex flex-wrap gap-2">
                <span className="text-[10px] uppercase font-bold text-gray-400 w-full">Fact Chips</span>
                <span className="flex items-center gap-1 bg-gray-100 border text-gray-700 px-2 py-1 rounded text-xs font-mono">
                  <Code size={10} /> processData
                </span>
                <span className="flex items-center gap-1 bg-blue-50 border border-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-mono">
                  <BookOpen size={10} /> handler.ts
                </span>
              </div>
            </div>
          </div>
          
          <div className="p-4 border-t bg-white">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Ask a question about the code..." 
                className="w-full pr-10 pl-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
              <button className="absolute right-2 top-1/2 transform -translate-y-1/2 text-purple-600 hover:text-purple-800">
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col bg-white text-gray-900 font-sans relative">
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
    <EngineeringMentor />
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
              <Route path="/stories/:id" element={<CodeStoryViewer />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </SignedIn>
      </BrowserRouter>
    </ClerkProvider>
  )
}

export default App
