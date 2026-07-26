import { useState, useEffect } from 'react';
import { Activity, ShieldAlert, GitBranch, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';

export default function HealthDashboard() {
  const { getToken } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const REPO_ID = 'repo-123'; 

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getToken();
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/v1/repositories/${REPO_ID}/health`, { headers });
        if (res.ok) {
          const healthData = await res.json();
          setData(healthData);
        } else {
          setData(null);
        }
      } catch (e) {
        console.error("Failed to load health metrics", e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [getToken]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500 bg-transparent">
        <Loader2 className="animate-spin mr-2" /> Computing architecture metrics...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-slate-500 bg-transparent p-8 text-center max-w-lg mx-auto">
        <Activity size={48} className="text-slate-400 mb-6" />
        <h2 className="text-2xl font-bold text-white mb-2">No Health Data</h2>
        <p className="mb-6 leading-relaxed">
          The health dashboard requires structural analysis data. Run the parser to populate Cyclomatic Complexity, Test Coverage, and Dependency Churn metrics.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col bg-transparent overflow-y-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Architecture Health</h1>
          <p className="text-slate-400">Holistic overview of structural integrity and technical debt.</p>
        </div>
        <div className="glass-panel border border-white/10 p-4 rounded-lg flex flex-col items-end min-w-[200px] shadow-sm">
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Global Health</span>
          <div className="flex items-center gap-3">
            <span className={`text-4xl font-mono font-bold ${data.status === 'healthy' ? 'text-emerald-400' : 'text-amber-400'}`}>
              {data.status === 'healthy' ? 'Good' : 'Warning'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="glass-panel border border-white/10 rounded-lg p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-400 mb-4">Modularity Score (Higher is better)</h3>
          <div className="flex justify-between items-end">
            <span className={`text-3xl font-bold ${data.modularityScore >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {data.modularityScore?.toFixed(1) || 'N/A'}
            </span>
            <span className="text-xs text-slate-500 uppercase font-semibold">Scale: 0-100</span>
          </div>
        </div>
        <div className="glass-panel border border-white/10 rounded-lg p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-400 mb-4">Coupling Index (Lower is better)</h3>
          <div className="flex justify-between items-end">
            <span className={`text-3xl font-bold ${data.couplingIndex <= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {data.couplingIndex?.toFixed(1) || 'N/A'}
            </span>
            <span className="text-xs text-slate-500 uppercase font-semibold">Scale: 0-100</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-panel border border-white/10 rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
            <ShieldAlert size={20} className="text-slate-400" />
            <h2 className="text-lg font-bold text-white">Detected Issues</h2>
          </div>
          <div className="space-y-4">
             {data.issues > 0 ? (
                <div className="flex justify-between items-center p-3 bg-red-900/20 rounded border border-red-500/30 shadow-sm">
                  <div>
                    <span className="text-red-400 font-medium">Architecture Warnings Detected</span>
                    <div className="text-xs text-slate-400">View Architect Mode for details on god classes and tight coupling.</div>
                  </div>
                  <div className="text-lg font-mono font-bold text-red-400">
                    {data.issues}
                  </div>
                </div>
             ) : (
                <p className="text-sm text-slate-500">No architecture issues detected. Great job!</p>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
