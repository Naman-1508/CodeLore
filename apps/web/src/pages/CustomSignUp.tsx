import { useState, useRef, useEffect } from 'react';
import { useSignUp } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowRight, ShieldCheck, Mail } from 'lucide-react';
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

  return (
    <div className="min-h-screen relative overflow-hidden bg-ivory-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Background Gradients */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-mint-400/10 rounded-full blur-[120px] mix-blend-multiply" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-indigo-500/10 rounded-full blur-[120px] mix-blend-multiply" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="bg-white p-3 rounded-2xl w-16 h-16 mx-auto mb-4 shadow-sm border border-slate-100 flex items-center justify-center">
            {pendingVerification ? (
              <ShieldCheck className="text-mint-500" size={32} />
            ) : (
              <Mail className="text-indigo-600" size={32} />
            )}
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {pendingVerification ? 'Verify your email' : 'Create an account'}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {pendingVerification 
              ? `We sent a code to ${emailAddress}` 
              : 'Join CodeLore to index your first repository'}
          </p>
        </motion.div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel py-8 px-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:rounded-3xl sm:px-10 border border-slate-200/60 backdrop-blur-xl bg-white/40"
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
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    className="w-full px-4 py-3 bg-white/70 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-slate-400 font-medium"
                    placeholder="you@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white/70 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-slate-400 font-medium"
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
                  className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-500/20 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all active:scale-[0.98]"
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
                        className="w-10 h-14 sm:w-12 sm:h-16 text-center text-2xl font-bold bg-white border-2 border-slate-200 rounded-xl text-indigo-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all outline-none"
                      />
                      {/* Cool pulse effect when digit is entered */}
                      {digit && (
                        <motion.div 
                          initial={{ scale: 0.5, opacity: 1 }}
                          animate={{ scale: 1.5, opacity: 0 }}
                          transition={{ duration: 0.5 }}
                          className="absolute inset-0 bg-indigo-500 rounded-xl pointer-events-none"
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
                  className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-500/20 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all active:scale-[0.98]"
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
              <Link to="/sign-in" className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors">
                Sign in
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
