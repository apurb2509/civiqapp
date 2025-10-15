import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

function AuthPage() {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
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
      className="bg-gray-900 min-h-screen flex flex-col justify-center items-center p-4"
    >
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-sm">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">
          {isLogin ? t('authPage.loginTitle') : t('authPage.signUpTitle')}
        </h2>
        
        <form onSubmit={handleSubmit}>
          {/* Form content remains the same... */}
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-300 text-sm font-bold mb-2">{t('authPage.emailLabel')}</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="shadow appearance-none border rounded w-full py-3 px-4 bg-gray-700 border-gray-600 text-white leading-tight focus:outline-none focus:shadow-outline focus:border-cyan-500" required />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-300 text-sm font-bold mb-2">{t('authPage.passwordLabel')}</label>
            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="shadow appearance-none border rounded w-full py-3 px-4 bg-gray-700 border-gray-600 text-white leading-tight focus:outline-none focus:shadow-outline focus:border-cyan-500" required />
            <p className="text-gray-500 text-xs mt-2">{t('authPage.passwordHint')}</p>
          </div>
          {error && <p className="bg-red-800 text-red-200 text-sm p-3 rounded mb-4 text-center">{error}</p>}
          <div className="flex items-center justify-center mb-4">
            <button type="submit" disabled={loading} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-300 w-full disabled:bg-gray-500">
              {loading ? t('reportForm.submittingButton') : (isLogin ? t('authPage.loginTitle') : t('authPage.signUpTitle'))}
            </button>
          </div>
        </form>
        <p className="text-center text-gray-400 text-sm">
          {isLogin ? t('authPage.loginPrompt') : t('authPage.signUpPrompt')}
          <button onClick={() => setIsLogin(!isLogin)} className="font-semibold text-cyan-400 hover:text-cyan-300 ml-2">
            {isLogin ? t('authPage.signUpTitle') : t('authPage.loginTitle')}
          </button>
        </p>
      </div>
    </motion.div>
  );
}

export default AuthPage;