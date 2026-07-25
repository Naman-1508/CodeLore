import { useNavigate } from 'react-router-dom';
import { BookOpen, Zap, ChevronRight, Activity, FileText } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-slate-800 selection:text-slate-50">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 bg-slate-900/70 backdrop-blur-md sticky top-0 z-50 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <BookOpen className="text-slate-50" size={24} />
          <span className="text-xl font-bold tracking-tight text-slate-50">CodeLore</span>
        </div>
        <div className="flex items-center gap-6 text-sm font-medium">
          <button className="text-slate-400 hover:text-slate-100 transition-colors">Features</button>
          <button className="text-slate-400 hover:text-slate-100 transition-colors">Documentation</button>
          <button 
            onClick={() => navigate('/sign-in')} 
            className="text-slate-400 hover:text-slate-100 transition-colors"
          >
            Sign in
          </button>
          <button 
            onClick={() => navigate('/sign-in')} 
            className="bg-slate-50 text-slate-950 px-4 py-2 rounded-md hover:bg-slate-200 transition-colors shadow-sm font-semibold"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-8 max-w-5xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-50 mb-6 leading-tight">
          Understand any codebase <br />
          in an afternoon, not a sprint.
        </h1>
        <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
          CodeLore automatically parses, indexes, and narrates your software architecture. It reads the code so you don't have to.
        </p>

        <div className="max-w-xl mx-auto bg-slate-900 p-2 rounded-lg shadow-sm border border-slate-800 flex items-center mb-4 transition-shadow focus-within:shadow-md focus-within:border-slate-500">
          <input 
            type="text" 
            placeholder="Paste a public GitHub repository URL..." 
            className="flex-grow px-4 py-3 outline-none text-slate-300 placeholder-slate-500 bg-transparent font-mono text-sm"
          />
          <button 
            onClick={() => navigate('/sign-in')}
            className="bg-slate-50 text-slate-950 px-6 py-3 rounded-md font-semibold hover:bg-slate-200 transition-colors flex items-center gap-2"
          >
            Import
            <ChevronRight size={18} />
          </button>
        </div>
        <p className="text-sm text-slate-500 mb-16">No credit card required. Free for open-source repositories.</p>
      </section>

      {/* Proof Panels */}
      <section className="bg-slate-900 py-24 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-8">
          
          {/* Panel 1: Code Story */}
          <div className="flex flex-col md:flex-row items-center gap-16 mb-32">
            <div className="md:w-1/2">
              <div className="flex items-center gap-2 text-slate-400 font-semibold mb-4 text-sm uppercase tracking-wider">
                <FileText size={18} />
                <span>Code Stories</span>
              </div>
              <h2 className="text-3xl font-bold mb-4 text-slate-50">Read code like a narrative</h2>
              <p className="text-lg text-slate-400 leading-relaxed mb-6">
                Stop jumping between dozens of disconnected files. CodeLore extracts the critical execution path of any feature and presents it as a single, readable story with automated AI narration.
              </p>
            </div>
            <div className="md:w-1/2 bg-slate-950 rounded border border-slate-800 p-6 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-8 bg-slate-900 border-b border-slate-800 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                <div className="w-3 h-3 rounded-full bg-slate-700"></div>
              </div>
              <div className="pt-8 space-y-4 font-mono text-sm">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded shadow-sm">
                  <div className="text-slate-100 font-semibold mb-1">authenticateUser()</div>
                  <div className="text-slate-400 font-sans">Validates JWT token against Postgres DB.</div>
                </div>
                <div className="w-0.5 h-4 bg-slate-800 mx-auto"></div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded shadow-sm">
                  <div className="text-slate-100 font-semibold mb-1">fetchWorkspace()</div>
                  <div className="text-slate-400 font-sans">Loads tenant context based on auth principal.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Panel 2: Architect Mode */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-16 mb-32">
            <div className="md:w-1/2">
              <div className="flex items-center gap-2 text-slate-400 font-semibold mb-4 text-sm uppercase tracking-wider">
                <Activity size={18} />
                <span>Architect Mode</span>
              </div>
              <h2 className="text-3xl font-bold mb-4 text-slate-50">Measure structural health</h2>
              <p className="text-lg text-slate-400 leading-relaxed mb-6">
                Quantify your technical debt. Our deterministic engine scores your architecture based on coupling, cyclomatic complexity, and churn, without hallucination.
              </p>
            </div>
            <div className="md:w-1/2 bg-slate-950 rounded border border-slate-800 p-6 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-8 bg-slate-900 border-b border-slate-800 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                <div className="w-3 h-3 rounded-full bg-slate-700"></div>
              </div>
              <div className="pt-8 grid grid-cols-2 gap-4">
                <div className="bg-slate-900 p-4 rounded border border-slate-800 shadow-sm text-center">
                  <div className="text-4xl font-bold text-slate-50 mb-2">High</div>
                  <div className="text-xs text-slate-400 uppercase font-semibold">Coupling</div>
                </div>
                <div className="bg-slate-900 p-4 rounded border border-slate-800 shadow-sm text-center">
                  <div className="text-4xl font-bold text-slate-50 mb-2">92%</div>
                  <div className="text-xs text-slate-400 uppercase font-semibold">Health Score</div>
                </div>
              </div>
            </div>
          </div>

          {/* Panel 3: Blast Radius */}
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="md:w-1/2">
              <div className="flex items-center gap-2 text-slate-400 font-semibold mb-4 text-sm uppercase tracking-wider">
                <Zap size={18} />
                <span>Blast Radius</span>
              </div>
              <h2 className="text-3xl font-bold mb-4 text-slate-50">Predict the impact of a refactor</h2>
              <p className="text-lg text-slate-400 leading-relaxed mb-6">
                Before you change a core function, instantly see exactly which downstream services, modules, and API endpoints will break. No surprises in production.
              </p>
            </div>
            <div className="md:w-1/2 bg-slate-950 rounded border border-slate-800 p-6 shadow-sm overflow-hidden relative">
               <div className="absolute top-0 left-0 w-full h-8 bg-slate-900 border-b border-slate-800 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                <div className="w-3 h-3 rounded-full bg-slate-700"></div>
              </div>
              <div className="pt-8 flex flex-col items-center">
                 <div className="p-2 bg-slate-200 text-slate-900 rounded border border-slate-300 text-sm font-mono mb-4 shadow-sm z-10">
                   export const validateToken = ()
                 </div>
                 <div className="flex gap-16 relative">
                    <div className="absolute top-[-16px] left-1/2 w-px h-8 bg-slate-700 -translate-x-[4rem]"></div>
                    <div className="absolute top-[-16px] left-1/2 w-[8rem] h-px bg-slate-700 -translate-x-[4rem]"></div>
                    <div className="absolute top-[-16px] right-1/2 w-px h-8 bg-slate-700 -translate-x-[-4rem]"></div>
                    
                    <div className="p-2 bg-slate-900 rounded border border-slate-800 text-sm text-slate-300 shadow-sm mt-4 font-mono">api/auth.ts</div>
                    <div className="p-2 bg-slate-900 rounded border border-slate-800 text-sm text-slate-300 shadow-sm mt-4 font-mono">web/login.tsx</div>
                 </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-500 py-12 text-center border-t border-slate-800 text-sm">
        <p>© 2026 CodeLore. All rights reserved.</p>
      </footer>
    </div>
  );
}
