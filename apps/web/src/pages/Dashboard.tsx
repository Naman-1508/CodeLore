import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Search, Loader2, GitBranch, Play, Activity, FileCode2, Users } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { getToken } = useAuth();
  const [data, setData] = useState<any>({ health: null, stories: [] });
  const [loading, setLoading] = useState(true);
  const [repoUrl, setRepoUrl] = useState('https://github.com/expressjs/express');
  const [indexingStatus, setIndexingStatus] = useState<string | null>(null);
  const [repoId, setRepoId] = useState<string | null>(null);
  const [importLoading, setImportLoading] = useState(false);

  const fetchDashboardData = async () => {
    if (!repoId) {
      setLoading(false);
      return;
    }

    try {
      const token = await getToken();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const [healthRes, storiesRes] = await Promise.all([
        fetch(`http://localhost:4000/v1/repositories/${repoId}/architect-findings`, { headers }),
        fetch(`http://localhost:4000/v1/repositories/${repoId}/stories`, { headers })
      ]);

      const healthData = healthRes.ok ? await healthRes.json() : null;
      const storiesData = storiesRes.ok ? await storiesRes.json() : [];

      setData({
        health: healthData || { modularityScore: 8.5, couplingIndex: 3.2, techDebt: 4.1 }, // Fallback if API missing
        stories: Array.isArray(storiesData) && storiesData.length > 0 ? storiesData : [
          { id: '1', title: 'Authentication Flow Breakdown', description: 'Traces how a user request flows through the API Gateway, validating JWT tokens before reaching the User Service.', type: 'core' },
          { id: '2', title: 'Database Connection Pooling', description: 'Analysis of how the core engine manages Drizzle ORM connections to prevent connection exhaustion.', type: 'infra' },
          { id: '3', title: 'Webhook Processing Pipeline', description: 'Explores the async queueing mechanism used to process third-party webhooks robustly.', type: 'event' }
        ]
      });
    } catch (e) {
      console.error("Failed to fetch dashboard data", e);
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    if (!repoId) return;
    try {
      const token = await getToken();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`http://localhost:4000/v1/repositories/${repoId}/status`, { headers });
      if (res.ok) {
        const json = await res.json();
        setIndexingStatus(json.status);
        if (json.status === 'ready') {
          fetchDashboardData();
        }
      }
    } catch(e) {}
  };

  useEffect(() => {
    fetchDashboardData();
  }, [getToken, repoId]);

  useEffect(() => {
    if (indexingStatus && ['pending', 'cloning', 'parsing', 'analyzing'].includes(indexingStatus)) {
      const interval = setInterval(checkStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [indexingStatus, repoId]);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;
    setImportLoading(true);

    try {
      const token = await getToken();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
      
      const res = await fetch(`http://localhost:4000/v1/repositories`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          remoteUrl: repoUrl
        })
      });

      if (res.ok) {
        const newRepo = await res.json();
        setRepoId(newRepo.id);
        setIndexingStatus(newRepo.indexingStatus);
      }
    } catch(e) {
      console.error(e);
    } finally {
      setImportLoading(false);
    }
  };

  // Animation configuration
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };
  
  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500">
        <Loader2 className="animate-spin mr-2" /> Loading repository data...
      </div>
    );
  }

  // If currently indexing
  if (indexingStatus && indexingStatus !== 'ready' && indexingStatus !== 'error') {
    return (
      <div className="flex h-full flex-col items-center justify-center text-slate-500 p-8 text-center max-w-lg mx-auto">
        <Loader2 size={48} className="animate-spin text-indigo-600 mb-6" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2 capitalize">
          {indexingStatus}...
        </h2>
        <p className="mb-6 leading-relaxed">
          The parser service is currently analyzing the repository architecture. This may take a moment.
        </p>
      </div>
    );
  }

  // Empty state
  if (!data.health && data.stories.length === 0 && (!indexingStatus || indexingStatus === 'error')) {
    return (
      <div className="relative w-full h-[calc(100vh-64px)] flex flex-col items-center justify-center overflow-hidden bg-ivory-100">
        <RadarBackground />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
          className="relative z-10 glass-panel border border-slate-200/60 p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center max-w-xl mx-auto backdrop-blur-xl bg-white/40"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent rounded-3xl pointer-events-none" />
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="bg-indigo-50 w-20 h-20 rounded-2xl mx-auto mb-8 border border-indigo-100 shadow-sm flex items-center justify-center relative"
          >
            <div className="absolute inset-0 bg-indigo-400/20 blur-xl rounded-full" />
            <BookOpen size={40} className="text-indigo-600 relative z-10" />
          </motion.div>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight relative z-10">Import Repository</h2>
          <p className="mb-8 leading-relaxed text-slate-600 relative z-10">
            Your command center is offline. Point CodeLore to any Git repository to begin deep architectural indexing.
          </p>
          
          <form onSubmit={handleImport} className="w-full relative z-10">
            <div className="flex gap-3">
              <div className="relative flex-1 group">
                <div className="absolute inset-0 bg-indigo-500/10 rounded-xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                <GitBranch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 z-10" size={18} />
                <input 
                  type="text" 
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/expressjs/express" 
                  className="relative w-full pl-12 pr-4 py-4 rounded-xl bg-white/70 border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans text-sm shadow-sm backdrop-blur-md"
                />
              </div>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit" 
                disabled={importLoading || !repoUrl.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center shadow-lg shadow-indigo-600/20"
              >
                {importLoading ? <Loader2 size={18} className="animate-spin mr-2" /> : <Play size={18} className="mr-2" />}
                Index
              </motion.button>
            </div>
            {indexingStatus === 'error' && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-coral-500 text-sm mt-4 font-medium">
                An error occurred during indexing. Please try again.
              </motion.p>
            )}
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="p-4 md:p-8 w-full max-w-[1600px] mx-auto"
    >
      {/* Header Area */}
      <motion.div variants={itemVariants} className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Workspace Overview</h1>
          <p className="text-slate-600 text-lg max-w-2xl">
            Explore architectural insights, review recent codebase health metrics, and dive into auto-generated code stories.
          </p>
        </div>
        
        {/* Quick Action / Stats summary in header */}
        <div className="flex items-center gap-4">
          <div className="bg-white/60 border border-slate-200 rounded-lg px-4 py-2 shadow-sm backdrop-blur-md flex items-center gap-3">
            <div className="bg-mint-100 p-1.5 rounded-md">
              <Activity size={16} className="text-mint-600" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Indexing Status</div>
              <div className="text-sm font-bold text-slate-900">Up to date</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Grid Layout - Filling the entire space! */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Column: Search & Stories (Takes up more space) */}
        <div className="md:col-span-12 lg:col-span-8 flex flex-col gap-8">
          
          {/* Omni Search Bar */}
          <motion.div variants={itemVariants} className="glass-panel rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 relative z-10">
              <Search size={20} className="text-indigo-600" /> Ask the Codebase
            </h2>
            <div className="relative z-10">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="E.g. Where is the user session validated?" 
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors font-sans text-sm shadow-sm placeholder-slate-400"
              />
            </div>
          </motion.div>

          <div className="flex items-center justify-between mt-4 mb-2">
            <motion.h2 variants={itemVariants} className="text-2xl font-bold text-slate-900 tracking-tight">Code Stories</motion.h2>
            <motion.button variants={itemVariants} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">View All</motion.button>
          </div>
          
          {/* Stories Grid - 2 columns within the left panel */}
          <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.stories.map((story: any) => (
              <motion.div variants={itemVariants} key={story.id}>
                <Link to={`/stories/${story.id}`} className="block glass-panel rounded-2xl p-6 hover:border-indigo-300 hover:shadow-lg transition-all duration-300 group h-full relative overflow-hidden bg-white/40">
                  <div className="absolute -inset-px bg-gradient-to-br from-indigo-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none"></div>
                  
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className={`p-2 rounded-lg ${
                      story.type === 'infra' ? 'bg-coral-100 text-coral-600' :
                      story.type === 'event' ? 'bg-mint-100 text-mint-600' :
                      'bg-indigo-100 text-indigo-600'
                    }`}>
                      {story.type === 'infra' ? <GitBranch size={20} /> :
                       story.type === 'event' ? <Activity size={20} /> :
                       <FileCode2 size={20} />}
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-lg text-slate-900 group-hover:text-indigo-700 transition-colors mb-3 relative z-10">
                    {story.title}
                  </h3>
                  <p className="text-slate-600 text-sm mb-6 leading-relaxed relative z-10 line-clamp-3">
                    {story.description}
                  </p>
                  
                  <div className="flex gap-2 relative z-10 mt-auto">
                    <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-medium border border-slate-200">
                      Auto-generated
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Right Column: Health & Stats */}
        <div className="md:col-span-12 lg:col-span-4 flex flex-col gap-8">
          
          <motion.div variants={itemVariants} className="glass-panel rounded-2xl p-6 bg-white/40">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Activity size={20} className="text-coral-500" /> Architecture Health
            </h2>
            
            {data.health ? (
              <div className="space-y-6">
                <MetricBar 
                  label="Modularity Score" 
                  value={data.health.modularityScore} 
                  max={10} 
                  color="from-mint-400 to-emerald-500" 
                />
                <MetricBar 
                  label="Coupling Index" 
                  value={data.health.couplingIndex} 
                  max={10} 
                  color="from-coral-400 to-red-500" 
                />
                <MetricBar 
                  label="Technical Debt Est." 
                  value={data.health.techDebt || 4.1} 
                  max={10} 
                  color="from-amber-400 to-orange-500" 
                />
              </div>
            ) : (
              <div className="text-sm text-slate-500">Not analyzed yet.</div>
            )}
          </motion.div>
          
          <motion.div variants={itemVariants} className="glass-panel rounded-2xl p-6 bg-white/40">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Users size={20} className="text-indigo-500" /> Recent Contributors
            </h2>
            <div className="space-y-4">
              {[
                { name: "Alice Jenkins", commits: 14, role: "Core Architecture" },
                { name: "Bob Smith", commits: 8, role: "UI / Features" },
                { name: "Charlie Davis", commits: 3, role: "DevOps" }
              ].map((user, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/60 transition-colors border border-transparent hover:border-slate-200">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                    {user.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900 text-sm">{user.name}</div>
                    <div className="text-xs text-slate-500">{user.role}</div>
                  </div>
                  <div className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                    {user.commits} commits
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
          
        </div>
      </div>
    </motion.div>
  );
}

function MetricBar({ label, value, max, color }: { label: string, value: number, max: number, color: string }) {
  const percentage = (value / max) * 100;
  
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-slate-600 font-medium">{label}</span>
        <span className="text-slate-900 font-bold">{value.toFixed(1)} / {max}</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden shadow-inner">
        <motion.div 
          initial={{ width: 0 }}
          whileInView={{ width: `${percentage}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className={`bg-gradient-to-r ${color} h-full rounded-full`}
        />
      </div>
    </div>
  );
}

function RadarBackground() {
  return (
    <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden pointer-events-none">
      <div className="absolute w-[200%] h-[200%] bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [transform:perspective(500px)_rotateX(60deg)] origin-center" />
      <motion.div
        animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeOut" }}
        className="absolute w-[300px] h-[300px] border border-indigo-400 rounded-full"
      />
      <motion.div
        animate={{ scale: [1, 2.5], opacity: [0.4, 0] }}
        transition={{ duration: 4, delay: 1, repeat: Infinity, ease: "easeOut" }}
        className="absolute w-[300px] h-[300px] border border-indigo-300 rounded-full"
      />
      <motion.div
        animate={{ scale: [1, 2.5], opacity: [0.2, 0] }}
        transition={{ duration: 4, delay: 2, repeat: Infinity, ease: "easeOut" }}
        className="absolute w-[300px] h-[300px] border border-indigo-200 rounded-full"
      />
      
      {/* Floating Code Nodes */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, Math.random() * 40 - 20, 0],
            x: [0, Math.random() * 40 - 20, 0],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bg-white/40 border border-white/50 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-mono text-indigo-800 shadow-sm"
          style={{
            top: `${Math.random() * 80 + 10}%`,
            left: `${Math.random() * 80 + 10}%`,
          }}
        >
          {['<AST/>', '{data}', 'fn()', 'module.exports', 'import {}', 'SELECT *'][i]}
        </motion.div>
      ))}
    </div>
  );
}
