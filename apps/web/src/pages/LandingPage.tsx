import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Code2, GitMerge, Search, Shield, ArrowRight, Activity, Network } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="h-screen w-full relative overflow-hidden bg-transparent flex">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-mint-400/10 rounded-full blur-[120px] mix-blend-multiply" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-cyan-500/100/10 rounded-full blur-[120px] mix-blend-multiply" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-coral-500/5 rounded-full blur-[150px] mix-blend-multiply" />
        <FloatingParticles />
      </div>

      <IntegratedHeroCarousel />
    </div>
  );
}

const features = [
  { icon: <Code2 className="text-cyan-400" size={36} />, title: "Automated AST Parsing", desc: "Our Tree-sitter engine instantly breaks down any codebase into a queryable semantic map." },
  { icon: <Shield className="text-coral-500" size={36} />, title: "Architecture Health", desc: "Continuously monitor modularity and coupling indexes to prevent technical debt." },
  { icon: <GitMerge className="text-cyan-400" size={36} />, title: "PR Impact Analysis", desc: "See the architectural blast radius of every pull request before it gets merged." },
  { icon: <Search className="text-mint-500" size={36} />, title: "Semantic Search", desc: "Stop using regex. Ask questions in plain English and find exact architectural patterns." },
  { icon: <Activity className="text-indigo-400" size={36} />, title: "Code Stories", desc: "Auto-generated, interactive walkthroughs of complex user flows and database transactions." }
];

function IntegratedHeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % features.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const RADIUS = 400; // Larger radius for full screen
  const ANGLE_STEP = 25; // Degrees between each feature

  return (
    <div className="relative z-10 w-full h-full flex items-center max-w-[1600px] mx-auto">
      
      {/* The Massive Rotary Disk on the Left */}
      <motion.div 
        className="absolute top-1/2 left-0 w-[900px] h-[900px] rounded-full border border-cyan-500/20 bg-midnight-200/30 shadow-[inset_0_0_80px_rgba(6,182,212,0.1)] backdrop-blur-md"
        style={{ originX: 0.5, originY: 0.5, x: '-60%', y: '-50%' }}
        animate={{ rotate: -(currentIndex * ANGLE_STEP) }}
        transition={{ type: "spring", stiffness: 50, damping: 15 }}
      >
        {features.map((feat, i) => {
          const angle = (i * ANGLE_STEP) * (Math.PI / 180);
          const x = 450 + Math.cos(angle) * RADIUS; // 450 is center of 900px disk
          const y = 450 + Math.sin(angle) * RADIUS;

          return (
            <motion.div
              key={i}
              className="absolute w-24 h-24 -ml-12 -mt-12 rounded-full flex items-center justify-center bg-slate-900 border border-white/10 shadow-2xl transition-colors"
              style={{ left: x, top: y }}
              animate={{ rotate: (currentIndex * ANGLE_STEP) }}
              transition={{ type: "spring", stiffness: 50, damping: 15 }}
            >
              <div className={i === currentIndex ? "text-white scale-110 transition-transform" : "text-slate-600"}>
                {feat.icon}
              </div>
            </motion.div>
          );
        })}
        {/* Inner decorative circles */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-dashed border-white/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border border-cyan-500/10 bg-midnight-200/50" />
      </motion.div>

      {/* Right Side Content Area */}
      <div className="ml-[450px] flex-1 pr-12 lg:pr-24 h-full flex flex-col justify-center">
        
        {/* Hero Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-12"
        >
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="mb-6 inline-flex items-center gap-3 px-5 py-2 rounded-full bg-slate-900/50 border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)] backdrop-blur-md"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="text-cyan-400"
            >
              <Network size={20} />
            </motion.div>
            <span className="text-lg tracking-widest uppercase font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500">CodeLore</span>
          </motion.div>
          
          <h1 className="text-6xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.1] mb-6">
            Structural Intelligence for <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Engineering Teams.</span>
          </h1>

          <Link to="/sign-in" className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 hover:bg-slate-100 px-8 py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-cyan-500/20 hover:-translate-y-1 text-lg">
            Enter the Workspace <ArrowRight size={20} />
          </Link>
        </motion.div>

        {/* Feature Display matching the Rotary Disk */}
        <div className="glass-panel border border-white/10 rounded-3xl p-8 relative overflow-hidden min-h-[220px]">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent" />
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
              className="relative z-10"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-slate-900 rounded-xl border border-white/10">
                  {features[currentIndex].icon}
                </div>
                <div>
                  <span className="text-cyan-400 font-mono text-xs tracking-widest uppercase font-bold block mb-1">
                    Feature 0{currentIndex + 1}
                  </span>
                  <h3 className="text-3xl font-bold text-white tracking-tight">
                    {features[currentIndex].title}
                  </h3>
                </div>
              </div>
              <p className="text-xl text-slate-400 leading-relaxed ml-20">
                {features[currentIndex].desc}
              </p>
            </motion.div>
          </AnimatePresence>
          
          {/* Pagination Indicators */}
          <div className="absolute bottom-6 right-8 flex gap-2 pointer-events-none">
            {features.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? 'bg-cyan-400 w-8' : 'bg-white/20 w-3'}`} 
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-indigo-400/20 rounded-full"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          animate={{
            y: [null, Math.random() * -500],
            x: [null, Math.random() * 200 - 100],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            ease: "linear",
            delay: Math.random() * 10,
          }}
        />
      ))}
    </div>
  );
}
