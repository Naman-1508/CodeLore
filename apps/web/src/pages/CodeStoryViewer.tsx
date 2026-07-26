import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Loader2, BookOpen } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';

export default function CodeStoryViewer() {
  const { id } = useParams();
  const { getToken } = useAuth();
  const [story, setStory] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // We hardcode a repository ID for the MVP dashboard
  const REPO_ID = localStorage.getItem('codelore_active_repo') || ''; 

  useEffect(() => {
    const fetchStory = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const token = await getToken();
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/v1/repositories/${REPO_ID}/stories/${id}`, { headers });
        if (res.ok) {
          const data = await res.json();
          setStory(data);
        } else {
          setStory(null);
        }
      } catch (e) {
        console.error("Failed to load story", e);
      } finally {
        setLoading(false);
      }
    };
    fetchStory();
  }, [id, getToken]);

  const [activeStep, setActiveStep] = useState(0);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500 bg-transparent">
        <Loader2 className="animate-spin mr-2" /> Loading code story...
      </div>
    );
  }

  if (!story || !story.steps || story.steps.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-slate-500 bg-transparent p-8 text-center">
        <BookOpen size={48} className="text-slate-400 mb-6" />
        <h2 className="text-2xl font-bold text-slate-50 mb-2">Story Not Found</h2>
        <p className="mb-6 leading-relaxed max-w-lg">
          We couldn't find the code story you were looking for. It may not have been indexed yet, or the repository has not been fully parsed.
        </p>
        <Link to="/dashboard" className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-2">
          <ChevronLeft size={16} /> Return to Dashboard
        </Link>
      </div>
    );
  }

  const currentStep = story.steps[activeStep];

  return (
    <div className="flex h-full bg-transparent font-sans">
      {/* Left Panel: Narration & Steps */}
      <div className="w-1/3 border-r border-white/10 glass-panel p-8 overflow-y-auto flex flex-col">
        <Link to="/dashboard" className="text-sm text-slate-500 hover:text-white mb-8 inline-flex items-center gap-1 font-medium transition-colors">
          <ChevronLeft size={16} /> Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-white mb-2">{story.title}</h1>
        <p className="text-slate-400 text-sm mb-10 leading-relaxed">{story.description}</p>
        
        <div className="space-y-6 flex-grow">
          {story.steps.map((step: any, index: number) => {
            const isActive = index === activeStep;
            return (
              <div 
                key={step.id}
                onClick={() => setActiveStep(index)}
                className={`cursor-pointer transition-all border-l-2 p-5 shadow-sm rounded-r-md border-y border-r ${
                  isActive 
                    ? 'border-l-indigo-500 bg-midnight-100 border-y-slate-200 border-r-slate-200 shadow-sm' 
                    : 'border-l-slate-300 bg-midnight-100/5 border-y-slate-200 border-r-slate-200 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide border ${
                    isActive 
                      ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/50' 
                      : 'bg-slate-100 text-slate-500 border-white/10'
                  }`}>
                    Step {index + 1}
                  </span>
                  <span className={`font-mono text-sm font-semibold ${isActive ? 'text-white' : 'text-slate-500'}`}>
                    {step.function?.name || 'Unknown Function'}
                  </span>
                </div>
                <p className={`${isActive ? 'text-slate-300' : 'text-slate-500'} text-sm leading-relaxed`}>
                  {step.narration}
                </p>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between mt-10 pt-6 border-t border-white/10">
          <button 
            disabled={activeStep === 0}
            onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
            className={`flex items-center gap-1 text-sm font-medium transition-colors ${
              activeStep === 0 ? 'text-slate-400 cursor-not-allowed' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ChevronLeft size={16} /> Prev
          </button>
          <button 
            disabled={activeStep === story.steps.length - 1}
            onClick={() => setActiveStep(Math.min(story.steps.length - 1, activeStep + 1))}
            className={`flex items-center gap-1 text-sm font-medium transition-colors ${
              activeStep === story.steps.length - 1 ? 'text-slate-400 cursor-not-allowed' : 'text-cyan-400 hover:text-cyan-300'
            }`}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      </div>
      
      {/* Right Panel: Source Code */}
      <div className="w-2/3 bg-transparent text-slate-300 p-8 overflow-y-auto font-mono text-sm">
        <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-6">
          <span className="text-slate-500 font-semibold">{currentStep?.function?.file?.path || 'Unknown File'}</span>
        </div>
        <pre className="leading-relaxed whitespace-pre-wrap">
<code>{currentStep?.function?.signature || '// Code chunk loading failed.'}</code>
        </pre>
      </div>
    </div>
  );
}
