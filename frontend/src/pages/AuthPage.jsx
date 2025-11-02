import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import PhoneAuth from '../components/PhoneAuth'; // Import the new component

function AuthPage() {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState('email'); // 'email' or 'phone'
  
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = isLogin 
        ? await signIn({ email, password }) 
        : await signUp({ email, password });
      if (error) throw error;
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-screen flex flex-col justify-center items-center px-4 py-8 sm:p-8 relative overflow-hidden"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <motion.div 
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.6 }}
        className="relative z-10 bg-gradient-to-br from-slate-800 to-slate-900 p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700/50"
      >
        {/* Decorative gradient overlay */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-cyan-600/10 to-transparent pointer-events-none rounded-t-2xl" />
        
        {/* Logo/Icon */}
        <div className="relative flex justify-center mb-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-lg shadow-cyan-500/30">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 text-center">
          {authMode === 'email' ? (isLogin ? t('authPage.loginTitle') : t('authPage.signUpTitle')) : 'Sign In with Phone'}
        </h2>
        <p className="text-gray-400 text-center mb-6 text-sm">
          {authMode === 'email' ? (isLogin ? 'Welcome back! Please sign in to continue.' : 'Create your account to get started.') : 'Enter your phone number to receive an OTP.'}
        </p>
        
        {/* === CONDITIONAL FORM RENDER === */}
        {authMode === 'email' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-gray-300 text-sm font-semibold mb-1.5">
                {t('authPage.emailLabel')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input 
                  type="email" 
                  id="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="w-full pl-10 sm:pl-12 pr-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                  placeholder="your.email@example.com"
                  required 
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-gray-300 text-sm font-semibold mb-1.5">
                {t('authPage.passwordLabel')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input 
                  type="password" 
                  id="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="w-full pl-10 sm:pl-12 pr-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                  placeholder="••••••••"
                  required 
                />
              </div>
              <p className="text-gray-500 text-xs mt-1.5 ml-1">
                {t('authPage.passwordHint')}
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-900/30 border border-red-500/50 text-red-300 text-sm p-2.5 rounded-lg flex items-center gap-2"
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </motion.div>
            )}

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all duration-200 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed shadow-lg shadow-cyan-600/20 hover:shadow-cyan-500/30 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{t('reportForm.submittingButton')}</span>
                </>
              ) : (
                <>
                  {isLogin ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  )}
                  <span>{isLogin ? t('authPage.loginTitle') : t('authPage.signUpTitle')}</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <PhoneAuth />
        )}

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-slate-700/50"></div>
          <span className="flex-shrink mx-4 text-gray-500 text-sm">OR</span>
          <div className="flex-grow border-t border-slate-700/50"></div>
        </div>

        {/* Toggle Auth Mode Button */}
        <button
          onClick={() => {
            setAuthMode(authMode === 'email' ? 'phone' : 'email');
            setError(null);
          }}
          className="w-full flex items-center justify-center gap-2 sm:gap-3 py-2.5 sm:py-3 px-4 bg-slate-700/50 hover:bg-slate-700/80 text-white font-semibold rounded-lg transition-all duration-200 text-sm sm:text-base"
        >
          {authMode === 'email' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
          )}
          {authMode === 'email' ? 'Sign in with Phone' : 'Sign in with Email'}
        </button>

        {/* Toggle Login/Signup */}
        {authMode === 'email' && (
          <div className="mt-6 pt-5 border-t border-slate-700/50">
            <p className="text-center text-gray-400 text-sm">
              {isLogin ? t('authPage.loginPrompt') : t('authPage.signUpPrompt')}
              <button 
                onClick={() => setIsLogin(!isLogin)} 
                className="font-semibold text-cyan-400 hover:text-cyan-300 ml-2 transition-colors duration-200"
              >
                {isLogin ? t('authPage.signUpTitle') : t('authPage.loginTitle')}
              </button>
            </p>
          </div>
        )}
      </motion.div>

      {/* Footer Text */}
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="relative z-10 mt-6 sm:mt-8 text-gray-500 text-xs sm:text-sm text-center px-4"
      >
        CiviQ - Real-Time Local Issue Reporting Platform
      </motion.p>
    </motion.div>
  );
}

export default AuthPage;