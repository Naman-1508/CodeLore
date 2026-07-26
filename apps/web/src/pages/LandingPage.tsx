import { motion } from 'framer-motion';
import { Code2, GitMerge, Search, Shield, ArrowRight, Activity, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-ivory-100">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-mint-400/10 rounded-full blur-[120px] mix-blend-multiply" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-indigo-500/10 rounded-full blur-[120px] mix-blend-multiply" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-coral-500/5 rounded-full blur-[150px] mix-blend-multiply" />
        <FloatingParticles />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 lg:py-32 flex flex-col items-center">
        
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center max-w-4xl mx-auto mb-20"
        >
          <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 border border-slate-200 text-indigo-700 text-sm font-semibold shadow-sm backdrop-blur-md">
            <span className="relative flex h-2 w-2 mr-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            CodeLore Platform 1.0 is Live
          </div>
          
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="text-6xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-8"
          >
            Structural Intelligence for <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-mint-500">Engineering Teams.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-xl text-slate-600 leading-relaxed mb-10 max-w-2xl mx-auto"
          >
            CodeLore automatically indexes your codebase to build visual call graphs, evaluate coupling, and generate architectural stories in seconds.
          </motion.p>

          <Link to="/sign-in" className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 text-lg">
            Enter the Workspace <ArrowRight size={20} />
          </Link>
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full"
        >
          <FeatureCard 
            icon={<Code2 className="text-indigo-600" size={28} />}
            title="Automated AST Parsing"
            description="Our Tree-sitter engine instantly breaks down any codebase into a queryable semantic map."
            delay={0}
          />
          <FeatureCard 
            icon={<Globe className="text-mint-500" size={28} />}
            title="Microservice Mapping"
            description="Visualize exactly how your services connect and communicate in real-time."
            delay={0.1}
          />
          <FeatureCard 
            icon={<Shield className="text-coral-500" size={28} />}
            title="Architecture Health"
            description="Continuously monitor modularity and coupling indexes to prevent technical debt."
            delay={0.2}
          />
          <FeatureCard 
            icon={<GitMerge className="text-indigo-600" size={28} />}
            title="PR Impact Analysis"
            description="See the architectural blast radius of every pull request before it gets merged."
            delay={0.3}
          />
          <FeatureCard 
            icon={<Search className="text-mint-500" size={28} />}
            title="Semantic Search"
            description="Stop using regex. Ask questions in plain English and find exact architectural patterns."
            delay={0.4}
          />
          <FeatureCard 
            icon={<Activity className="text-coral-500" size={28} />}
            title="Code Stories"
            description="Auto-generated, interactive walkthroughs of complex user flows and database transactions."
            delay={0.5}
          />
        </motion.div>

      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: number }) {
  return (
    <motion.div 
      variants={{
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24, delay } }
      }}
      whileHover={{ y: -5, scale: 1.02, transition: { duration: 0.2 } }}
      className="glass-panel rounded-3xl p-8 hover:bg-white transition-all group relative overflow-hidden shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 cursor-default"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="bg-white rounded-2xl w-14 h-14 flex items-center justify-center mb-6 shadow-sm border border-slate-100">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">
        {description}
      </p>
    </motion.div>
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
