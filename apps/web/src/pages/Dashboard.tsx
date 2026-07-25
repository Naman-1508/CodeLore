import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Search, Loader2 } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';

export default function Dashboard() {
  const { getToken } = useAuth();
  const [data, setData] = useState<any>({ health: null, stories: [] });
  const [loading, setLoading] = useState(true);

  // We hardcode a repository ID for the MVP dashboard
  const REPO_ID = 'repo-123'; 

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getToken();
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

        const [healthRes, storiesRes] = await Promise.all([
          fetch(`http://localhost:4000/v1/repositories/${REPO_ID}/health`, { headers }),
          fetch(`http://localhost:4000/v1/repositories/${REPO_ID}/stories`, { headers })
        ]);

        const healthData = healthRes.ok ? await healthRes.json() : null;
        const storiesData = storiesRes.ok ? await storiesRes.json() : [];

        setData({
          health: healthData,
          stories: Array.isArray(storiesData) ? storiesData : []
        });
      } catch (e) {
        console.error("Failed to fetch dashboard data", e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [getToken]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-400">
        <Loader2 className="animate-spin mr-2" /> Loading repository data...
      </div>
    );
  }

  // If no data exists yet (empty state)
  if (!data.health && data.stories.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-slate-400 p-8 text-center max-w-lg mx-auto">
        <BookOpen size={48} className="text-slate-600 mb-6" />
        <h2 className="text-2xl font-bold text-slate-50 mb-2">No Repository Data</h2>
        <p className="mb-6 leading-relaxed">
          Your database is currently empty. Run the parser service on a repository to index it, and the architecture data will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-50 tracking-tight mb-2">Project Overview</h1>
        <p className="text-slate-400">Select a code story or use semantic search to explore the codebase.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Col: Semantic Search Widget */}
        <div className="md:col-span-2">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-8 shadow-sm">
            <h2 className="text-lg font-bold text-slate-50 mb-4 flex items-center gap-2">
              <Search size={20} className="text-blue-400" /> Ask the Codebase
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder="E.g. Where is the user session validated?" 
                className="w-full pl-10 pr-4 py-3 rounded-md bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-700 font-sans text-sm placeholder-slate-600 shadow-sm"
              />
            </div>
          </div>

          <h2 className="text-xl font-bold text-slate-50 mb-4 tracking-tight">Code Stories</h2>
          <div className="grid grid-cols-1 gap-4">
            {data.stories.length > 0 ? (
              data.stories.map((story: any) => (
                <Link to={`/stories/${story.id}`} key={story.id} className="block bg-slate-900 border border-slate-800 rounded-lg p-5 hover:border-slate-700 transition-colors shadow-sm group">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-100 group-hover:text-blue-400 transition-colors">{story.title}</h3>
                  </div>
                  <p className="text-slate-400 text-sm mb-4 leading-relaxed">{story.description}</p>
                  <div className="flex gap-2">
                    <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded font-medium border border-slate-700">Auto-generated</span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center border border-slate-800 border-dashed rounded-lg bg-slate-900/50">
                <p className="text-slate-500 text-sm">No code stories found.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: High-level Metrics */}
        <div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-50 mb-6 border-b border-slate-800 pb-2">Architecture Health</h2>
            
            {data.health ? (
              <>
                <div className="mb-8 text-center p-4 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="text-5xl font-bold text-emerald-400 font-mono tracking-tighter mb-1">{data.health.score || 0}</div>
                  <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Global Score</div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400 font-medium">Analyzed Modules</span>
                    <span className="font-mono text-slate-200">{data.health.modules || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400 font-medium">Entry Points</span>
                    <span className="font-mono text-slate-200">{data.health.entryPoints || 0}</span>
                  </div>
                  
                  {data.health.topModules && (
                    <div className="mt-8 pt-6 border-t border-slate-800">
                      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Core Domain Distribution</h3>
                      {data.health.topModules.map((m: any, i: number) => (
                        <div key={i} className="mb-3 last:mb-0">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-300 font-mono">{m.name}</span>
                            <span className="text-slate-500 font-mono">{m.percentage}%</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${m.percentage}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-500 text-sm">No health metrics available.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
