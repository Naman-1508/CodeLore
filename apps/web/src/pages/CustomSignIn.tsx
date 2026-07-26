import { useState } from 'react';
import { useSignIn } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowRight, Code2, Globe } from 'lucide-react';

export default function CustomSignIn() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle OAuth Sign In
  const handleOAuth = async (strategy: 'oauth_github' | 'oauth_google' | 'oauth_apple') => {
    if (!isLoaded) return;
    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/dashboard',
      });
    } catch (err: any) {
      console.error('OAuth error', err);
      setError(err.errors?.[0]?.message || 'OAuth sign in failed');
    }
  };

  // Handle Email/Password Sign In
  const handleEmailSignIn = async (e: React.FormEvent) => {
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
      } else {
        console.log(result);
        setError('Requires additional steps (e.g. 2FA).');
      }
    } catch (err: any) {
      console.error('Email sign in error', err);
      setError(err.errors?.[0]?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-transparent overflow-hidden relative">
      {/* Background Ambient Animation specific for Login */}
      <div className="absolute inset-0 z-0">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCI+CjxwYXRoIGQ9Ik0wIDBMMCA0MEw0MCA0MEw0MCAwWiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDEyOSwgMTQwLCAyNDgsIDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz4KPC9zdmc+')] opacity-40"
        />
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-mint-400/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-coral-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row w-full max-w-6xl mx-auto items-center p-8 gap-16">
        
        {/* Left Side: Marketing Value Prop */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full md:w-1/2 flex flex-col justify-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-midnight-100/10 border border-white/10 text-cyan-300 text-sm font-semibold shadow-sm w-fit">
            <span className="relative flex h-2 w-2 mr-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500/100"></span>
            </span>
            CodeLore Security
          </div>
          
          <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight tracking-tight mb-6">
            Enter the <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Workspace.</span>
          </h1>
          
          <p className="text-lg text-slate-400 leading-relaxed mb-10 max-w-lg">
            Sign in to securely access your organization's architectural indexes, code stories, and repository health metrics.
          </p>
          
          <div className="space-y-6">
            {[
              { icon: <Code2 className="text-cyan-400" size={24} />, text: 'End-to-end encrypted codebase analysis' },
              { icon: <Globe className="text-mint-500" size={24} />, text: 'Role-based architectural access control' }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + (i * 0.1), duration: 0.5 }}
                className="flex items-center gap-4 glass-panel px-6 py-4 rounded-xl w-fit"
              >
                {feature.icon}
                <span className="font-medium text-slate-200">{feature.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right Side: Glass Auth Form */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="w-full md:w-[450px]"
        >
          <div className="glass-panel p-8 md:p-10 rounded-3xl relative overflow-hidden">
            <div className="absolute -inset-0.5 bg-gradient-to-br from-indigo-500/5 to-coral-500/5 opacity-50 blur pointer-events-none"></div>
            
            <div className="relative">
              <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Welcome Back</h2>
              <p className="text-slate-500 mb-8">Sign in to access your workspaces</p>
              
              {/* OAuth Buttons */}
              <div className="space-y-3 mb-8">
                <motion.button 
                  whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.9)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleOAuth('oauth_github')}
                  className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-midnight-100/10 border border-white/10 rounded-xl text-slate-200 font-semibold transition-colors shadow-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg> Continue with GitHub
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.9)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleOAuth('oauth_google')}
                  className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-midnight-100/10 border border-white/10 rounded-xl text-slate-200 font-semibold transition-colors shadow-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 24c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 21.53 7.7 24 12 24z" />
                    <path fill="#FBBC05" d="M5.84 15.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V8.06H2.18C1.43 9.55 1 11.22 1 13s.43 3.45 1.18 4.94l3.66-2.84z" />
                    <path fill="#EA4335" d="M12 4.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.18 14.97 0 12 0 7.7 0 3.99 2.47 2.18 6.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  Continue with Google
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.9)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleOAuth('oauth_apple')}
                  className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-midnight-100/10 border border-white/10 rounded-xl text-slate-200 font-semibold transition-colors shadow-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14.73 3.65c-.09.91-.45 1.77-1.02 2.51-.54.67-1.25 1.18-2.06 1.48-.11-.89.28-1.79.83-2.48.53-.66 1.25-1.16 2.05-1.46.06-.05.13-.05.2 0zm5.18 6.64c-.03 1.96 1.02 3.79 2.66 4.88-.63 1.83-1.55 3.51-2.73 4.96-1.12 1.34-2.28 2.64-3.66 2.7-1.43.06-2.02-.73-3.67-.73-1.63 0-2.27.75-3.62.77-1.39.02-2.67-1.36-3.88-2.82C2.5 16.71 1.09 12.35 2.37 9.17c.63-1.57 1.73-2.91 3.14-3.83 1.35-.91 2.94-1.39 4.54-1.38 1.45.02 2.78.47 3.97 1.04 1.15.54 1.82.59 2.98.05 1.04-.49 2.21-.71 3.39-.63 1.68.12 3.25.91 4.38 2.23-1.8 1.25-2.84 3.31-2.86 5.64z"/>
                  </svg>
                  Continue with Apple
                </motion.button>
              </div>

              <div className="flex items-center gap-4 mb-8">
                <div className="h-px bg-slate-200 flex-1"></div>
                <span className="text-slate-400 text-sm font-medium">OR EMAIL</span>
                <div className="h-px bg-slate-200 flex-1"></div>
              </div>

              {/* Email Form */}
              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-300 ml-1">Email Address</label>
                  <input 
                    type="email" 
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    className="w-full bg-midnight-100/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
                    placeholder="you@company.com"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-300 ml-1">Password</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-midnight-100/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-coral-500 text-sm font-medium pt-2"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit" 
                  disabled={loading || !emailAddress || !password}
                  className="w-full mt-4 flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium py-3.5 rounded-xl transition-colors shadow-lg shadow-cyan-500/25"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : 'Sign In'}
                  {!loading && <ArrowRight size={18} />}
                </motion.button>
              </form>
            </div>
            
            <div className="mt-8 text-center text-sm">
              <span className="text-slate-500">Don't have an account? </span>
              <Link to="/sign-up" className="font-bold text-cyan-400 hover:text-indigo-500 transition-colors">
                Sign up
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
