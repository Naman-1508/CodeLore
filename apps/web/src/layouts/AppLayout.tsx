import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, GitMerge, Search, Shield, Bot, LayoutDashboard, 
  Activity, Users, Settings, User, Compass
} from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const location = useLocation();
  const [hovered, setHovered] = useState(false);

  // Animation variants for page transitions
  const pageVariants = {
    initial: { opacity: 0, y: 15, scale: 0.99 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2, ease: "easeIn" } }
  };

  return (
    <div className="flex flex-col min-h-screen text-slate-900 font-sans relative">
      
      {/* Floating Command Island */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
        <motion.nav 
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="glass-nav rounded-full px-4 py-3 flex items-center gap-2 shadow-2xl overflow-hidden"
          initial={{ width: 'auto' }}
          animate={{ 
            width: hovered ? 'auto' : 'auto',
            paddingLeft: hovered ? '1.5rem' : '1rem',
            paddingRight: hovered ? '1.5rem' : '1rem'
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {/* Logo / Context */}
          <div className="flex items-center gap-2 mr-4 border-r border-slate-300 pr-4">
            <div className="bg-indigo-500/20 p-1.5 rounded-full">
              <Compass className="text-indigo-600" size={18} />
            </div>
            <AnimatePresence>
              {hovered && (
                <motion.span 
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="font-bold text-sm whitespace-nowrap overflow-hidden"
                >
                  CodeLore
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            <NavItem to="/dashboard" icon={<LayoutDashboard size={18} />} label="Overview" hovered={hovered} />
            <NavItem to="/stories" icon={<BookOpen size={18} />} label="Stories" hovered={hovered} />
            <NavItem to="/architect" icon={<Shield size={18} />} label="Architect" hovered={hovered} />
            <NavItem to="/search" icon={<Search size={18} />} label="Search" hovered={hovered} />
            <NavItem to="/mentor" icon={<Bot size={18} />} label="Mentor" hovered={hovered} />
          </div>

          {/* User Profile */}
          <div className="ml-4 pl-4 border-l border-slate-300 flex items-center gap-2">
             <NavLink to="/profile" className={({isActive}) => `p-2 rounded-full transition-colors ${isActive ? 'bg-indigo-500/10 text-indigo-600' : 'text-slate-500 hover:text-slate-900 hover:bg-black/5'}`}>
               <User size={18} />
             </NavLink>
             <NavLink to="/settings" className={({isActive}) => `p-2 rounded-full transition-colors ${isActive ? 'bg-indigo-500/10 text-indigo-600' : 'text-slate-500 hover:text-slate-900 hover:bg-black/5'}`}>
               <Settings size={18} />
             </NavLink>
          </div>
        </motion.nav>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto pt-28 pb-12 px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

    </div>
  );
}

// NavItem Component tailored for the floating island
function NavItem({ to, icon, label, hovered }: { to: string, icon: React.ReactNode, label: string, hovered: boolean }) {
  return (
    <NavLink 
      to={to}
      className={({ isActive }) => `
        group relative flex items-center justify-center rounded-full transition-all duration-300
        ${isActive ? 'bg-indigo-500/10 text-indigo-700' : 'text-slate-600 hover:text-slate-900 hover:bg-black/5'}
        ${hovered ? 'px-4 py-2' : 'p-2.5'}
      `}
      title={!hovered ? label : undefined}
    >
      <motion.div layout="position" className="flex items-center gap-2">
        {icon}
        <AnimatePresence>
          {hovered && (
            <motion.span 
              initial={{ opacity: 0, width: 0, scale: 0.8 }}
              animate={{ opacity: 1, width: 'auto', scale: 1 }}
              exit={{ opacity: 0, width: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="text-sm font-medium whitespace-nowrap overflow-hidden"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </NavLink>
  );
}
