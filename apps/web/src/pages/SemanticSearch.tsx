import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';

export default function SemanticSearch() {
  const { getToken } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);

  const REPO_ID = 'repo-123'; 

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const token = await getToken();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      // For MVP, we will hit the functions endpoint as a search stub.
      // In Phase 2, this will hit a pgvector similarity search endpoint.
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/v1/repositories/${REPO_ID}/functions`, { headers });
      if (res.ok) {
        const functions = await res.json();
        // Just mock a client-side filter for now
        const filtered = functions.filter((f: any) => 
          f.name.toLowerCase().includes(query.toLowerCase()) || 
          (f.docstring && f.docstring.toLowerCase().includes(query.toLowerCase()))
        );
        setResults(filtered);
      } else {
        setResults([]);
      }
    } catch (e) {
      console.error("Search failed", e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto h-full flex flex-col bg-ivory-100">
      <div className="mb-10 mt-2">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Semantic Search</h1>
        <p className="text-slate-600">Search the codebase using natural language. We embed functions using OpenAI and search via pgvector.</p>
      </div>

      <div className="glass-panel border border-slate-200 rounded-lg p-6 mb-8 shadow-sm">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500" size={20} />
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. How does the authentication middleware work?" 
            className="w-full pl-12 pr-4 py-4 rounded-md bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans text-base placeholder-slate-400 shadow-sm"
          />
          <button 
            type="submit" 
            disabled={loading}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors disabled:opacity-50 flex items-center"
          >
            {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
            Search
          </button>
        </form>
      </div>

      <div className="flex-1 overflow-auto">
        {results === null ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <Search size={48} className="text-slate-800 mb-4" />
            <p className="text-slate-600">Enter a query to search the codebase.</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center p-8 glass-panel border border-slate-200 border-dashed rounded-lg">
            <p className="text-slate-400">No semantic matches found for "{query}".</p>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((result: any, i: number) => (
              <div key={i} className="glass-panel border border-slate-200 rounded-lg p-5 hover:border-indigo-300 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-mono text-indigo-700 font-bold">{result.name}</h3>
                  <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded border border-indigo-100">Score: {result.complexityScore || 'N/A'}</span>
                </div>
                <div className="text-sm text-slate-500 mb-3 font-mono">{result.file?.path || 'Unknown File'}</div>
                <p className="text-slate-700 text-sm leading-relaxed">{result.docstring || 'No docstring available.'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
