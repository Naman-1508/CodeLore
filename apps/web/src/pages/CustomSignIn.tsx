import { useState } from 'react';
import { useSignIn } from '@clerk/clerk-react';
import { BookOpen, Activity, GitMerge, FileText, Loader2, GitBranch } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CustomSignIn() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const navigate = useNavigate();
  
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle standard email/password submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setLoading(true);
    setError('');

    try {
      const result = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        navigate('/dashboard');
      } else {
        // Needs MFA or other steps (simplifying for MVP)
        console.log(result);
        setError('Additional steps required. Please use OAuth for now.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.errors?.[0]?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  // Handle OAuth (Github/Google)
  const signInWith = (strategy: 'oauth_github' | 'oauth_google' | 'oauth_apple') => {
    if (!isLoaded) return;
    return signIn.authenticateWithRedirect({
      strategy,
      redirectUrl: '/sso-callback',
      redirectUrlComplete: '/dashboard',
    });
  };

  return (
    <div className="min-h-screen flex bg-slate-950 font-sans text-slate-50">
      {/* Left Side - Brand & Presentation */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 flex-col justify-center px-16 border-r border-slate-800">
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-10">
            <BookOpen size={28} className="text-blue-400" />
            <h1 className="text-3xl font-bold tracking-tight text-slate-50">CodeLore</h1>
          </div>
          
          <h2 className="text-4xl font-bold mb-6 text-slate-50 leading-tight">
            The reference <br/>documentation <br/>that writes itself.
          </h2>
          
          <p className="text-lg text-slate-400 mb-12 leading-relaxed">
            Sign in to access your indexed repositories, view architectural health scores, and interact with the Engineering Mentor.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="bg-slate-800 p-2 rounded text-slate-300 mt-1">
                <FileText size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-50">Automated Code Stories</h3>
                <p className="text-sm text-slate-400">Narratives for complex execution paths.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-slate-800 p-2 rounded text-slate-300 mt-1">
                <Activity size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-50">Architect Mode</h3>
                <p className="text-sm text-slate-400">Deterministic metrics for code health.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-slate-800 p-2 rounded text-slate-300 mt-1">
                <GitMerge size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-50">Architecture Replay</h3>
                <p className="text-sm text-slate-400">Timeline scrubber for codebase evolution.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Custom Headless Login */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 bg-slate-950 relative">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-10 justify-center">
            <BookOpen size={28} className="text-blue-400" />
            <h1 className="text-3xl font-bold text-slate-50 tracking-tight">CodeLore</h1>
          </div>

          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-2xl font-bold mb-2">Sign in to CodeLore</h2>
            <p className="text-slate-400 text-sm">Welcome back! Please enter your details.</p>
          </div>

          <div className="space-y-4 mb-6">
            <button 
              onClick={() => signInWith('oauth_github')}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-100 font-medium py-2.5 px-4 rounded-lg transition-colors shadow-sm"
            >
              <GitBranch size={18} />
              Sign in with GitHub
            </button>
            <button 
              onClick={() => signInWith('oauth_google')}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-100 font-medium py-2.5 px-4 rounded-lg transition-colors shadow-sm"
            >
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </button>
            <button 
              onClick={() => signInWith('oauth_apple')}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-100 font-medium py-2.5 px-4 rounded-lg transition-colors shadow-sm"
            >
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.62-1.496 3.6-2.948 1.13-1.65 1.597-3.25 1.62-3.337-.034-.014-3.136-1.203-3.17-4.79-.028-2.99 2.443-4.444 2.557-4.524-1.393-2.036-3.535-2.312-4.298-2.348-2.083-.178-4.21 1.258-4.595 1.258zm-2.083-4.74c1.134-1.371 1.897-3.28 1.689-5.187-1.634.066-3.666 1.089-4.83 2.446-1.04 1.207-1.928 3.161-1.689 5.021 1.832.142 3.693-.912 4.83-2.28z"/>
              </svg>
              Sign in with Apple
            </button>
          </div>

          <div className="relative flex items-center py-2 mb-6">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink-0 mx-4 text-slate-500 text-xs uppercase tracking-wider font-semibold">Or continue with email</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-950/50 border border-red-900/50 rounded text-red-400 text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-300">Email address</label>
              <input 
                type="email" 
                required
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono text-sm placeholder-slate-600"
                placeholder="you@company.com"
              />
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-slate-300">Password</label>
                <a href="#" className="text-xs text-blue-400 hover:text-blue-300 font-medium">Forgot password?</a>
              </div>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono text-sm placeholder-slate-600"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-8">
            Don't have an account? <a href="#" className="text-blue-400 font-medium hover:text-blue-300">Sign up</a>
          </p>
        </div>
      </div>
    </div>
  );
}
