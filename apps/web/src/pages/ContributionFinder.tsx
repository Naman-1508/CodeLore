import { useState, useEffect } from 'react';
import { Users, GitCommit, GitPullRequest, Loader2 } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';

export default function ContributionFinder() {
  const { getToken } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const REPO_ID = localStorage.getItem('codelore_active_repo') || ''; 

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getToken();
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/v1/repositories/${REPO_ID}/ownership`, { headers });
        if (res.ok) {
          const ownershipData = await res.json();
          setData(ownershipData);
        } else {
          setData({ topContributors: [], recentPRs: [] });
        }
      } catch (e) {
        console.error("Failed to load ownership metrics", e);
        setData({ topContributors: [], recentPRs: [] });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [getToken]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500 bg-transparent">
        <Loader2 className="animate-spin mr-2" /> Analyzing git history and ownership...
      </div>
    );
  }

  if (!data || (data.topContributors.length === 0 && data.recentPRs.length === 0)) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-slate-500 bg-transparent p-8 text-center max-w-lg mx-auto">
        <Users size={48} className="text-slate-400 mb-6" />
        <h2 className="text-2xl font-bold text-white mb-2">No Contributor Data</h2>
        <p className="mb-6 leading-relaxed">
          The Git commit history has not been analyzed for this repository yet.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto h-full flex flex-col bg-transparent">
      <div className="mb-10 mt-2">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Contribution Insights</h1>
        <p className="text-slate-400">Identify domain experts and review high-impact structural changes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Contributors */}
        <div className="glass-panel border border-white/10 rounded-lg shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-800 flex items-center gap-2">
            <Users size={20} className="text-blue-400" />
            <h2 className="text-xl font-bold text-white">Top Contributors</h2>
          </div>
          <div className="flex-1 overflow-auto p-0">
            {data.topContributors.length > 0 ? (
              <table className="w-full text-left text-sm">
                <thead className="bg-midnight-100 text-slate-500 border-b border-white/10">
                  <tr>
                    <th className="p-4 font-semibold uppercase tracking-wider text-xs">Engineer</th>
                    <th className="p-4 font-semibold uppercase tracking-wider text-xs">Commits</th>
                    <th className="p-4 font-semibold uppercase tracking-wider text-xs">Code Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {data.topContributors.map((dev: any) => (
                    <tr key={dev.id} className="hover:bg-midnight-100/50 transition-colors">
                      <td className="p-4">
                        <span className="font-semibold text-white">{dev.name}</span>
                        <div className="text-xs text-slate-500">{dev.role || 'Contributor'}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-slate-400 font-mono">
                          <GitCommit size={14} /> {dev.commits}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-cyan-500/100 rounded-full" 
                              style={{ width: `${dev.impact}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono text-slate-500 w-8">{dev.impact}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-slate-500 text-sm">No contributors found.</div>
            )}
          </div>
        </div>

        {/* High Impact PRs */}
        <div className="glass-panel border border-white/10 rounded-lg shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-800 flex items-center gap-2">
            <GitPullRequest size={20} className="text-blue-400" />
            <h2 className="text-lg font-bold text-white">Structural Pull Requests</h2>
          </div>
          <div className="p-6 space-y-4">
            {data.recentPRs.length > 0 ? (
              data.recentPRs.map((pr: any) => (
                <div key={pr.id} className="p-4 bg-midnight-100 border border-white/10 rounded flex justify-between items-start group hover:border-cyan-500/50 transition-colors shadow-sm">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-slate-500">{pr.id}</span>
                    </div>
                    <div className="font-mono text-sm font-semibold text-white mb-1">
                      <a href={pr.url} target="_blank" rel="noreferrer" className="hover:text-cyan-400">{pr.title}</a>
                    </div>
                    <div className="text-sm text-slate-500">
                      Authored by <span className="text-slate-400">{pr.author}</span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    pr.impact === 'High' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-slate-100 text-slate-400 border-white/10'
                  }`}>
                    {pr.impact} Impact
                  </span>
                </div>
              ))
            ) : (
              <Link to="/dashboard" className="text-cyan-400 hover:text-indigo-500 font-medium">No high-impact PRs detected.</Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
