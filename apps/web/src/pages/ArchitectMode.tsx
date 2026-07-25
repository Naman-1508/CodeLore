import { useState, useEffect } from 'react';
import { Network, Zap, Loader2 } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';

export default function ArchitectMode() {
  const { getToken } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const REPO_ID = 'repo-123'; 

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getToken();
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await fetch(`http://localhost:4000/v1/repositories/${REPO_ID}/architect-findings`, { headers });
        if (res.ok) {
          const findings = await res.json();
          setData(Array.isArray(findings) ? findings : []);
        }
      } catch (e) {
        console.error("Failed to load architect findings", e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [getToken]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-400 bg-slate-950">
        <Loader2 className="animate-spin mr-2" /> Analyzing architectural patterns...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-slate-400 bg-slate-950 p-8 text-center max-w-lg mx-auto">
        <Network size={48} className="text-slate-600 mb-6" />
        <h2 className="text-2xl font-bold text-slate-50 mb-2">No Architectural Findings</h2>
        <p className="mb-6 leading-relaxed">
          We haven't detected any significant architectural findings or bottlenecks for this repository yet. Run the parser to populate these metrics.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto h-full flex flex-col bg-slate-950">
      <div className="mb-10 mt-2">
        <h1 className="text-3xl font-bold text-slate-50 tracking-tight mb-2">Architect Mode</h1>
        <p className="text-slate-400 max-w-2xl">Deterministic structural analysis. Identify tightly coupled modules, God classes, and dependency cycles before they become tech debt.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {data.map((finding: any) => (
          <div key={finding.id} className="bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-sm hover:border-slate-700 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded ${finding.severity === 'high' ? 'bg-red-950/30 text-red-400 border border-red-900/50' : 'bg-amber-950/30 text-amber-400 border border-amber-900/50'}`}>
                  {finding.type === 'highly_coupled' ? <Network size={20} /> : <Zap size={20} />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-50 capitalize">{finding.type.replace('_', ' ')}</h3>
                  <p className="text-slate-400 text-sm">{finding.description}</p>
                </div>
              </div>
              <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full border ${finding.severity === 'high' ? 'bg-red-950/30 text-red-400 border-red-900/50' : 'bg-amber-950/30 text-amber-400 border-amber-900/50'}`}>
                {finding.severity}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
