import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationBell from './NotificationBell';

const languages = [
  { code: 'en', lang: 'English' }, { code: 'hi', lang: 'हिन्दी' }, { code: 'or', lang: 'ଓଡ଼ିଆ' }, { code: 'bn', lang: 'বাংলা' }, { code: 'te', lang: 'తెలుగు' }, { code: 'mr', lang: 'Marathi' }, { code: 'ta', lang: 'தமிழ்' }, { code: 'ur', lang: 'اردو' }, { code: 'gu', lang: 'ગુજરાતી' }, { code: 'kn', lang: 'ಕನ್ನಡ' }, { code: 'ml', lang: 'മലയാളം' },
];

const getInitials = (email) => {
  if (!email) return '';
  const parts = email.split('@')[0].replace(/[^a-zA-Z\s]/g, ' ').split(' ');
  const validParts = parts.filter(p => p.length > 0);
  if (validParts.length >= 2) {
    return (validParts[0][0] + validParts[validParts.length - 1][0]).toUpperCase();
  } else if (validParts.length === 1) {
    return validParts[0].substring(0, 2).toUpperCase();
  }
  return 'U';
};

function NavLink({ to, title }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} className="relative px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">
      {title}
      {isActive && (
        <motion.div layoutId="activePill" className="absolute inset-0 bg-white/10 rounded-full" style={{ borderRadius: 9999 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
      )}
    </Link>
  );
}

function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuRef]);


  const handleSignOut = async () => { await signOut(); navigate('/'); };
  const changeLanguage = (lng) => i18n.changeLanguage(lng);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 px-4">
        <motion.div className="w-full max-w-5xl" initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, ease: 'easeOut' }}>
          <div className="hidden md:flex items-center justify-between w-full p-2 bg-gray-800 border border-gray-700 rounded-full shadow-lg">
            <div className="flex items-center flex-1">
              <Link to="/" className="text-xl font-bold text-white px-3 mr-2">{t('navbar.brand')}</Link>
              
              {profile?.role === 'admin' ? (
                <NavLink to="/admin" title="Admin Control" />
              ) : (
                <>
                  <NavLink to="/" title={t('navbar.home')} />
                  {user && <NavLink to="/reports" title={t('navbar.viewReports')} />}
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select onChange={(e) => changeLanguage(e.target.value)} value={i18n.language} className="bg-gray-700 border border-gray-600 rounded-full px-3 py-2 text-white text-sm focus:outline-none cursor-pointer">
                {languages.map((lng) => (<option key={lng.code} value={lng.code} className="bg-gray-800 font-semibold">{lng.lang}</option>))}
              </select>
              <div className="w-px h-6 bg-gray-600"></div>

              {/* NOTIFICATION BELL FOR LOGGED IN USERS (DESKTOP) */}
              {user && <NotificationBell />}

              <div ref={userMenuRef} className="relative">
                {user ? (
                  <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} title={user.email} className="h-10 w-10 flex items-center justify-center bg-cyan-600 rounded-full font-bold text-white text-sm hover:bg-cyan-500 transition-colors">
                    {getInitials(user.email)}
                  </button>
                ) : (
                  <Link to="/auth" className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-full text-sm">{t('navbar.login')}</Link>
                )}
                <AnimatePresence>
                  {isUserMenuOpen && user && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-full right-0 mt-2 w-72 bg-gray-800 border border-gray-700 rounded-lg shadow-lg">
                      <div className="p-4 border-b border-gray-700">
                        <p className="font-semibold text-white truncate">{user.email}</p>
                        {profile?.role === 'admin' && (<span className="text-xs font-bold bg-cyan-800 text-cyan-200 px-2 py-1 rounded-full">ADMIN</span>)}
                      </div>
                      <button onClick={handleSignOut} className="w-full text-left px-4 py-3 text-red-400 hover:bg-red-500/10">{t('navbar.signOut')}</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
          <div className="md:hidden flex items-center justify-between p-2 w-full bg-gray-800 border border-gray-700 rounded-full shadow-lg">
             <Link to="/" className="text-xl font-bold text-white pl-3">{t('navbar.brand')}</Link>
             <div className="flex items-center">
                {/* NOTIFICATION BELL FOR MOBILE */}
                {user && <NotificationBell />}
                <button onClick={() => setIsMenuOpen(true)} className="p-2 mr-1"><svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg></button>
             </div>
          </div>
        </motion.div>
      </header>
      <AnimatePresence>
        {isMenuOpen && ( <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center md:hidden">
            <button onClick={() => setIsMenuOpen(false)} className="absolute top-5 right-5 text-gray-400 hover:text-white p-2"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            <nav className="flex flex-col items-center gap-6 text-center">
              {profile?.role === 'admin' ? (
                <Link onClick={() => setIsMenuOpen(false)} to="/admin" className="text-2xl font-semibold text-cyan-400 hover:text-cyan-300">Dashboard</Link>
              ) : (
                <>
                  <Link onClick={() => setIsMenuOpen(false)} to="/" className="text-2xl text-gray-300 hover:text-cyan-400">{t('navbar.home')}</Link>
                  {user && (<Link onClick={() => setIsMenuOpen(false)} to="/reports" className="text-2xl text-gray-300 hover:text-cyan-400">{t('navbar.viewReports')}</Link>)}
                </>
              )}
            </nav>
        </motion.div> )}
      </AnimatePresence>
    </>
  );
}

export default Navbar;