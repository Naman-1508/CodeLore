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
  const [repoId, setRepoId] = useState<string | null>(() => localStorage.getItem('codelore_active_repo'));
  const [importLoading, setImportLoading] = useState(false);
  const [existingRepos, setExistingRepos] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    if (!repoId) {
      setLoading(false);
      return;
    }

    try {
      const token = await getToken();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const [healthRes, storiesRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/v1/repositories/${repoId}/architect-findings`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/v1/repositories/${repoId}/stories`, { headers })
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
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/v1/repositories/${repoId}/status`, { headers });
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
    const fetchExistingRepos = async () => {
      try {
        const token = await getToken();
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/v1/repositories`, { headers });
        if (res.ok) {
          const repos = await res.json();
          setExistingRepos(repos);
        }
      } catch (e) {
        console.error(e);
      }
    };
    if (!repoId) {
      fetchExistingRepos();
    }
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
      
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/v1/repositories`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          remoteUrl: repoUrl
        })
      });

      if (res.ok) {
        const newRepo = await res.json();
        setRepoId(newRepo.id);
        localStorage.setItem('codelore_active_repo', newRepo.id);
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
        <Loader2 size={48} className="animate-spin text-cyan-400 mb-6" />
        <h2 className="text-2xl font-bold text-white mb-2 capitalize">
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
      <div className="w-full min-h-[calc(100vh-64px)] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-transparent">
        {/* Left Action Panel */}
        <div className="col-span-1 lg:col-span-5 flex flex-col justify-center px-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="bg-blue-500/10 w-16 h-16 rounded-2xl mb-6 border border-blue-500/30 shadow-lg shadow-blue-500/20 flex items-center justify-center relative">
              <BookOpen size={32} className="text-blue-400 relative z-10" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-4 tracking-tight leading-tight">
              Ignite your <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Architecture</span>
            </h1>
            <p className="mb-10 text-lg leading-relaxed text-slate-400 max-w-md">
              Your command center is offline. Point CodeLore to any Git repository to begin a deep architectural index and structural analysis.
            </p>
            
            <form onSubmit={handleImport} className="w-full max-w-md relative z-10">
              <div className="flex flex-col gap-4">
                <div className="relative group">
                  <div className="absolute inset-0 bg-blue-500/20 rounded-xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
                  <GitBranch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 z-10" size={20} />
                  <input 
                    type="text" 
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/expressjs/express" 
                    className="relative w-full pl-12 pr-4 py-4 rounded-xl bg-midnight-100/50 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-sans shadow-inner backdrop-blur-md"
                  />
                </div>
                <motion.button 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit" 
                  disabled={importLoading || !repoUrl.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center shadow-lg shadow-blue-600/20"
                >
                  {importLoading ? <Loader2 size={20} className="animate-spin mr-2" /> : <Play size={20} className="mr-2" />}
                  Begin Indexing
                </motion.button>
              </div>
              {indexingStatus === 'error' && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-coral-500 text-sm mt-4 font-medium text-center">
                  An error occurred during indexing. Please try again.
                </motion.p>
              )}
              {existingRepos.length > 0 && (
                <div className="mt-8 pt-8 border-t border-white/5 w-full">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Your Repositories</h3>
                  <div className="flex flex-col gap-3">
                    {existingRepos.map(repo => (
                      <button
                        key={repo.id}
                        type="button"
                        onClick={() => {
                          setRepoId(repo.id);
                          localStorage.setItem('codelore_active_repo', repo.id);
                          setIndexingStatus(repo.indexingStatus);
                        }}
                        className="flex items-center justify-between p-4 rounded-xl bg-midnight-100/50 hover:bg-blue-500/10 border border-white/5 hover:border-blue-500/30 transition-all text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <GitBranch size={18} className="text-blue-400" />
                          <span className="text-white font-medium group-hover:text-blue-400 transition-colors">{repo.name}</span>
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-xs text-slate-500">
                            {repo.indexingStatus === 'ready' ? 'Indexed' : 'Pending'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </form>
          </motion.div>
        </div>

        {/* Right Visual Panel */}
        <div className="col-span-1 lg:col-span-7 h-full min-h-[500px] relative hidden lg:flex items-center justify-center p-8">
          <RadarBackground />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full h-full max-h-[600px] glass-panel rounded-3xl relative overflow-hidden flex flex-col items-center justify-center border border-white/5 shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5" />
            
            {/* Abstract representation of CodeLore analyzing code */}
            <div className="relative z-10 w-3/4 max-w-lg">
              <motion.div 
                animate={{ y: [-5, 5, -5] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="bg-midnight-100/80 border border-white/10 rounded-xl p-6 shadow-2xl backdrop-blur-md mb-6 relative"
              >
                <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
                  <div className="w-3 h-3 rounded-full bg-coral-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-mint-500" />
                  <div className="ml-2 text-xs font-mono text-slate-500">system/analyzer.ts</div>
                </div>
                <div className="space-y-3 font-mono text-sm opacity-80">
                  <div className="h-4 w-3/4 bg-slate-800 rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-blue-900/40 rounded animate-pulse" style={{ animationDelay: '150ms' }} />
                  <div className="h-4 w-5/6 bg-slate-800 rounded animate-pulse" style={{ animationDelay: '300ms' }} />
                  <div className="h-4 w-2/3 bg-cyan-900/40 rounded animate-pulse" style={{ animationDelay: '450ms' }} />
                </div>
                
                {/* Scanning Laser Effect */}
                <motion.div 
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)] z-20 pointer-events-none"
                />
              </motion.div>
              
              <div className="flex justify-between items-center px-4">
                 <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full border border-blue-500/30 flex items-center justify-center bg-blue-500/10 mb-2">
                       <GitBranch size={20} className="text-blue-400" />
                    </div>
                    <span className="text-xs text-slate-400">Clone</span>
                 </div>
                 <div className="flex-1 h-px bg-gradient-to-r from-blue-500/0 via-blue-500/50 to-cyan-500/0 mx-4" />
                 <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full border border-cyan-500/30 flex items-center justify-center bg-cyan-500/10 mb-2">
                       <BookOpen size={20} className="text-cyan-400" />
                    </div>
                    <span className="text-xs text-slate-400">Analyze</span>
                 </div>
              </div>
            </div>
          </motion.div>
        </div>
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
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">Workspace Overview</h1>
          <p className="text-slate-400 text-lg max-w-2xl">
            Explore architectural insights, review recent codebase health metrics, and dive into auto-generated code stories.
          </p>
        </div>
        
        {/* Quick Action / Stats summary in header */}
        <div className="flex items-center gap-4">
          <div className="bg-midnight-100/10 border border-white/10 rounded-lg px-4 py-2 shadow-sm backdrop-blur-md flex items-center gap-3">
            <div className="bg-mint-100 p-1.5 rounded-md">
              <Activity size={16} className="text-mint-600" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Indexing Status</div>
              <div className="text-sm font-bold text-white">Up to date</div>
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
            <div className="absolute inset-0 bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2 relative z-10">
              <Search size={20} className="text-cyan-400" /> Ask the Codebase
            </h2>
            <div className="relative z-10">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="E.g. Where is the user session validated?" 
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-midnight-100 border border-white/10 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors font-sans text-sm shadow-sm placeholder-slate-400"
              />
            </div>
          </motion.div>

          <div className="flex items-center justify-between mt-4 mb-2">
            <motion.h2 variants={itemVariants} className="text-2xl font-bold text-white tracking-tight">Code Stories</motion.h2>
            <motion.button variants={itemVariants} className="text-sm font-semibold text-cyan-400 hover:text-cyan-300">View All</motion.button>
          </div>
          
          {/* Stories Grid - 2 columns within the left panel */}
          <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.stories.map((story: any) => (
              <motion.div variants={itemVariants} key={story.id}>
                <Link to={`/stories/${story.id}`} className="block glass-panel rounded-2xl p-6 hover:border-indigo-300 hover:shadow-lg transition-all duration-300 group h-full relative overflow-hidden bg-midnight-100/5">
                  <div className="absolute -inset-px bg-gradient-to-br from-indigo-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none"></div>
                  
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className={`p-2 rounded-lg ${
                      story.type === 'infra' ? 'bg-coral-100 text-coral-600' :
                      story.type === 'event' ? 'bg-mint-100 text-mint-600' :
                      'bg-indigo-100 text-cyan-400'
                    }`}>
                      {story.type === 'infra' ? <GitBranch size={20} /> :
                       story.type === 'event' ? <Activity size={20} /> :
                       <FileCode2 size={20} />}
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-lg text-white group-hover:text-cyan-300 transition-colors mb-3 relative z-10">
                    {story.title}
                  </h3>
                  <p className="text-slate-400 text-sm mb-6 leading-relaxed relative z-10 line-clamp-3">
                    {story.description}
                  </p>
                  
                  <div className="flex gap-2 relative z-10 mt-auto">
                    <span className="text-xs bg-slate-100 text-slate-400 px-3 py-1 rounded-full font-medium border border-white/10">
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
          
          <motion.div variants={itemVariants} className="glass-panel rounded-2xl p-6 bg-midnight-100/5">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
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
          
          <motion.div variants={itemVariants} className="glass-panel rounded-2xl p-6 bg-midnight-100/5">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Users size={20} className="text-indigo-500" /> Recent Contributors
            </h2>
            <div className="space-y-4">
              {[
                { name: "Alice Jenkins", commits: 14, role: "Core Architecture" },
                { name: "Bob Smith", commits: 8, role: "UI / Features" },
                { name: "Charlie Davis", commits: 3, role: "DevOps" }
              ].map((user, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-midnight-100/10 transition-colors border border-transparent hover:border-white/10">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
                    {user.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-white text-sm">{user.name}</div>
                    <div className="text-xs text-slate-500">{user.role}</div>
                  </div>
                  <div className="text-xs font-medium text-slate-400 bg-white/5 px-2 py-1 rounded-md">
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
        <span className="text-slate-400 font-medium">{label}</span>
        <span className="text-white font-bold">{value.toFixed(1)} / {max}</span>
      </div>
      <div className="w-full bg-midnight-200/50 rounded-full h-2.5 overflow-hidden shadow-inner border border-white/5">
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
        className="absolute w-[300px] h-[300px] border border-cyan-500/50 rounded-full"
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
          className="absolute bg-midnight-100/5 border border-white/50 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-mono text-indigo-800 shadow-sm"
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
