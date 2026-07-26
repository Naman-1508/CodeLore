import { useState, useRef, useEffect } from 'react';
import { useSignUp } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowRight, ShieldCheck, Mail, Code2, Globe, Shield, Activity, GitMerge, Search, Network } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function CustomSignUp() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Start the sign up process
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setLoading(true);
    setError('');

    try {
      await signUp.create({
        emailAddress,
        password,
      });

      // Send the email with the verification code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setError(err.errors?.[0]?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Verify the OTP code
  const onPressVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    
    const verificationCode = code.join('');
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (completeSignUp.status !== 'complete') {
        console.log(JSON.stringify(completeSignUp, null, 2));
        setError('Verification failed');
      }
      
      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId });
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setError(err.errors?.[0]?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  // OTP Input Handler
  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const features = [
    { icon: <Code2 className="text-cyan-400" size={28} />, title: "Automated AST Parsing", desc: "Instantly break down codebases." },
    { icon: <Shield className="text-coral-500" size={28} />, title: "Architecture Health", desc: "Monitor modularity and coupling." },
    { icon: <GitMerge className="text-cyan-400" size={28} />, title: "PR Impact Analysis", desc: "See the blast radius of changes." },
    { icon: <Search className="text-mint-500" size={28} />, title: "Semantic Search", desc: "Find exact architectural patterns." },
    { icon: <Activity className="text-indigo-400" size={28} />, title: "Code Stories", desc: "Auto-generated walkthroughs." }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % features.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const RADIUS = 350; 
  const ANGLE_STEP = 25; 

  return (
    <div className="flex min-h-screen bg-transparent overflow-hidden relative">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row w-full h-screen items-center">
        
        {/* Left Side: Rotary Auth Value Prop */}
        <div className="hidden lg:flex w-1/2 h-full relative items-center justify-center border-r border-white/5">
          <motion.div 
            className="absolute top-1/2 left-0 w-[800px] h-[800px] rounded-full border border-cyan-500/20 bg-midnight-200/30 shadow-[inset_0_0_80px_rgba(6,182,212,0.1)] backdrop-blur-md"
            style={{ originX: 0.5, originY: 0.5, x: '-60%', y: '-50%' }}
            animate={{ rotate: -(currentIndex * ANGLE_STEP) }}
            transition={{ type: "spring", stiffness: 50, damping: 15 }}
          >
            {features.map((feat, i) => {
              const angle = (i * ANGLE_STEP) * (Math.PI / 180);
              const x = 400 + Math.cos(angle) * RADIUS; 
              const y = 400 + Math.sin(angle) * RADIUS;
              return (
                <motion.div
                  key={i}
                  className="absolute w-20 h-20 -ml-10 -mt-10 rounded-full flex items-center justify-center bg-slate-900 border border-white/10 shadow-2xl transition-colors"
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
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-dashed border-white/5" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] rounded-full border border-cyan-500/10 bg-midnight-200/50" />
          </motion.div>

          <div className="ml-[250px] z-10 max-w-sm">
            <motion.div 
              className="mb-8 inline-flex items-center gap-3 px-4 py-2 rounded-full bg-slate-900/50 border border-cyan-500/30 shadow-sm backdrop-blur-md"
            >
              <Network size={20} className="text-cyan-400" />
              <span className="text-md tracking-widest uppercase font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500">CodeLore</span>
            </motion.div>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
              >
                <h1 className="text-4xl font-extrabold text-white leading-tight tracking-tight mb-4">
                  {features[currentIndex].title}
                </h1>
                <p className="text-lg text-slate-400 leading-relaxed mb-8">
                  {features[currentIndex].desc}
                </p>
              </motion.div>
            </AnimatePresence>
            
            <div className="flex gap-3 mt-4 pointer-events-none">
              {features.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? 'bg-cyan-400 w-8' : 'bg-white/20 w-3'}`} 
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8">
          
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="bg-midnight-100 p-3 rounded-2xl w-16 h-16 mx-auto mb-4 shadow-sm border border-slate-100 flex items-center justify-center">
              {pendingVerification ? (
                <ShieldCheck className="text-mint-500" size={32} />
              ) : (
                <Mail className="text-cyan-400" size={32} />
              )}
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              {pendingVerification ? 'Verify your email' : 'Create an account'}
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              {pendingVerification 
                ? `We sent a code to ${emailAddress}` 
                : 'Join CodeLore to index your first repository'}
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md glass-panel py-8 px-4 shadow-[0_8px_30px_rgb(0,0,0,0.4)] sm:rounded-3xl sm:px-10 border border-white/10/60 backdrop-blur-xl bg-midnight-100/5"
          >
          <AnimatePresence mode="wait">
            {!pendingVerification ? (
              <motion.form 
                key="signup-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleSubmit} 
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    className="w-full px-4 py-3 bg-midnight-100/10 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-slate-400 font-medium"
                    placeholder="you@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-midnight-100/10 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-slate-400 font-medium"
                    placeholder="••••••••"
                  />
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-coral-500 text-sm font-medium bg-coral-50 p-3 rounded-lg border border-coral-100"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-500/20 text-sm font-bold text-white bg-cyan-600 hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all active:scale-[0.98]"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : 'Continue'}
                </button>
              </motion.form>
            ) : (
              <motion.form 
                key="verify-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={onPressVerify} 
                className="space-y-8"
              >
                <div className="flex justify-center gap-2 sm:gap-3">
                  {code.map((digit, i) => (
                    <motion.div
                      key={i}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: i * 0.1, type: "spring", stiffness: 300 }}
                      className="relative"
                    >
                      <input
                        ref={(el) => (inputRefs.current[i] = el)}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleChange(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        className="w-10 h-14 sm:w-12 sm:h-16 text-center text-2xl font-bold bg-midnight-100 border-2 border-white/10 rounded-xl text-cyan-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all outline-none"
                      />
                      {/* Cool pulse effect when digit is entered */}
                      {digit && (
                        <motion.div 
                          initial={{ scale: 0.5, opacity: 1 }}
                          animate={{ scale: 1.5, opacity: 0 }}
                          transition={{ duration: 0.5 }}
                          className="absolute inset-0 bg-cyan-500/100 rounded-xl pointer-events-none"
                        />
                      )}
                    </motion.div>
                  ))}
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-coral-500 text-sm font-medium bg-coral-50 p-3 rounded-lg border border-coral-100 text-center"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={loading || code.join('').length !== 6}
                  className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-500/20 text-sm font-bold text-white bg-cyan-600 hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all active:scale-[0.98]"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : (
                    <>Verify Code <ArrowRight size={16} /></>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
          
          {!pendingVerification && (
            <div className="mt-8 text-center text-sm">
              <span className="text-slate-500">Already have an account? </span>
              <Link to="/sign-in" className="font-bold text-cyan-400 hover:text-indigo-500 transition-colors">
                Sign in
              </Link>
            </div>
          )}
        </motion.div>
        </div>
      </div>
    </div>
  );
}
