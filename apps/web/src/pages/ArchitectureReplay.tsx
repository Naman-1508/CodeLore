import { useState } from 'react';
import { Play, Pause, FastForward, Rewind } from 'lucide-react';

export default function ArchitectureReplay() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(45);

  return (
    <div className="p-8 max-w-6xl mx-auto h-full flex flex-col bg-ivory-100">
      <h1 className="text-3xl font-bold text-slate-50 mb-2">Architecture Replay</h1>
      <p className="text-slate-400 mb-8 leading-relaxed">Watch how the repository structure has evolved over time.</p>
      
      {/* Canvas Area */}
      <div className="flex-1 bg-white border border-slate-200 rounded-lg shadow-inner relative flex items-center justify-center overflow-hidden mb-8 p-8">
        {/* Mock visualization */}
        <div className="flex items-center justify-center gap-16 relative">
          <div className="w-32 h-32 bg-slate-900 border-2 border-slate-700 rounded shadow flex items-center justify-center font-mono text-slate-300 text-sm font-semibold z-10 transition-transform hover:scale-105 hover:border-blue-500/50">
            user-service
          </div>
          
          {/* Animated line */}
          <div className="absolute top-1/2 left-[8rem] w-[4rem] h-0.5 bg-blue-500/50">
            <div className="absolute w-2 h-32 bg-indigo-500/50 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)] z-20 left-[60%]"></div>
          </div>
          
          <div className="w-32 h-32 bg-slate-900 border-2 border-slate-700 rounded shadow flex items-center justify-center font-mono text-slate-300 text-sm font-semibold z-10 transition-transform hover:scale-105 hover:border-blue-500/50">
            auth-service
          </div>
        </div>
        
        {/* Overlay info */}
        <div className="absolute top-6 right-6 bg-slate-900 border border-slate-800 px-4 py-2 rounded shadow-sm text-sm font-mono text-slate-400">
          <span className="text-sm font-mono text-slate-500">Mar 12</span> (Oct 12, 2025)
        </div>
      </div>
      
      {/* Controls */}
      <div className="glass-panel border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col">
        <div className="flex items-center gap-6">
          <div className="flex gap-2">
            <button className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"><Rewind size={20} /></button>
            <button 
              className="p-2 text-slate-900 bg-slate-100 hover:bg-white rounded shadow-sm transition-colors"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"><FastForward size={20} /></button>
          </div>
          
          {/* Scrubber */}
          <div className="flex-1">
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500" 
            />
            <div className="mt-2 text-center text-xs text-slate-600 font-medium">
              <span>Initial Commit</span>
              <span>Present Day</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
