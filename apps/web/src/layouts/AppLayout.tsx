import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { 
  BookOpen, GitMerge, Search, Shield, Bot, LayoutDashboard, 
  ChevronLeft, ChevronRight, Activity, Users, Settings, User
} from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useUser();

  return (
    <div className="flex h-screen bg-slate-950 text-slate-50 font-sans">
      {/* Left Rail */}
      <aside 
        className={`bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Repo Switcher / Logo */}
        <div className="h-16 flex items-center border-b border-slate-800 px-4 justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
              <BookOpen className="text-blue-400 flex-shrink-0" size={20} />
              <span className="font-bold text-sm">Naman-1508/CodeLore</span>
            </div>
          )}
          {collapsed && <BookOpen className="text-blue-400 mx-auto" size={20} />}
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-6">
          {/* Explore / Learn */}
          <nav className="flex flex-col gap-1 px-2">
            {!collapsed && <div className="text-xs font-semibold text-slate-500 px-3 mb-1 uppercase tracking-wider">Explore</div>}
            <NavItem to="/dashboard" icon={<LayoutDashboard size={18} />} label="Overview" collapsed={collapsed} />
            <NavItem to="/stories" icon={<BookOpen size={18} />} label="Code Stories" collapsed={collapsed} />
            <NavItem to="/architect" icon={<Shield size={18} />} label="Architect Mode" collapsed={collapsed} />
            <NavItem to="/replay" icon={<GitMerge size={18} />} label="Architecture Replay" collapsed={collapsed} />
            <NavItem to="/search" icon={<Search size={18} />} label="Semantic Search" collapsed={collapsed} />
          </nav>

          {/* Ask */}
          <nav className="flex flex-col gap-1 px-2">
            {!collapsed && <div className="text-xs font-semibold text-slate-500 px-3 mb-1 uppercase tracking-wider">Ask</div>}
            <NavItem to="/mentor" icon={<Bot size={18} />} label="Engineering Mentor" collapsed={collapsed} />
          </nav>

          {/* Assess / Plan */}
          <nav className="flex flex-col gap-1 px-2">
            {!collapsed && <div className="text-xs font-semibold text-slate-500 px-3 mb-1 uppercase tracking-wider">Assess</div>}
            <NavItem to="/health" icon={<Activity size={18} />} label="Health Dashboard" collapsed={collapsed} />
            <NavItem to="/contributions" icon={<Users size={18} />} label="Contribution Finder" collapsed={collapsed} />
          </nav>
        </div>

        {/* Bottom Rail Section */}
        <div className="border-t border-slate-800 p-2 flex flex-col gap-2">
          <NavItem to="/settings" icon={<Settings size={18} />} label="Settings" collapsed={collapsed} />
          <NavItem 
            to="/profile" 
            icon={
              user?.imageUrl ? 
                <img src={user.imageUrl} alt="Profile" className="w-5 h-5 rounded-full object-cover border border-slate-700" /> : 
                <User size={18} />
            } 
            label="Account Profile" 
            collapsed={collapsed} 
          />
          <button 
            onClick={() => setCollapsed(!collapsed)} 
            className="flex items-center justify-center p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded transition-colors"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-slate-950">
        {children}
      </main>
    </div>
  );
}

function NavItem({ to, icon, label, collapsed }: { to: string, icon: React.ReactNode, label: string, collapsed: boolean }) {
  return (
    <NavLink 
      to={to} 
      title={collapsed ? label : undefined}
      className={({ isActive }) => `
        flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium
        ${isActive ? 'bg-blue-900/30 text-blue-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}
        ${collapsed ? 'justify-center' : ''}
      `}
    >
      {icon}
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  );
}
