import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en', lang: 'English' }, { code: 'hi', lang: 'हिन्दी' }, { code: 'or', lang: 'ଓଡ଼ିଆ' }, { code: 'bn', lang: 'বাংলা' }, { code: 'te', lang: 'తెలుగు' }, { code: 'mr', lang: 'मराठी' }, { code: 'ta', lang: 'தமிழ்' }, { code: 'ur', lang: 'اردو' }, { code: 'gu', lang: 'ગુજરાતી' }, { code: 'kn', lang: 'ಕನ್ನಡ' }, { code: 'ml', lang: 'മലയാളം' },
];

function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-gray-900 bg-opacity-70 backdrop-blur-lg sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center p-4 text-white">
        <Link to="/" className="text-2xl font-bold text-cyan-400" onClick={() => setIsMenuOpen(false)}>
          {t('navbar.brand')}
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden md:flex space-x-6 items-center">
          <Link to="/" className="text-lg text-gray-300 hover:text-cyan-400 transition-colors">{t('navbar.home')}</Link>
          <Link to="/reports" className="text-lg text-gray-300 hover:text-cyan-400 transition-colors">{t('navbar.viewReports')}</Link>
          
          {profile?.role === 'admin' && (
            <Link to="/admin" className="text-lg font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">Admin</Link>
          )}

          <select onChange={(e) => changeLanguage(e.target.value)} value={i18n.language} className="bg-gray-800 border border-gray-700 rounded-md p-2 text-white">
            {languages.map((lng) => (<option key={lng.code} value={lng.code}>{lng.lang}</option>))}
          </select>

          {user ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400 hidden lg:block">{user.email}</span>
              <button onClick={handleSignOut} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg text-sm">{t('navbar.signOut')}</button>
            </div>
          ) : (
            <Link to="/auth" className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg text-sm">{t('navbar.login')}</Link>
          )}
        </nav>
        
        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-4 space-y-2 bg-gray-800">
          <Link to="/" className="block py-2 rounded-md text-gray-300 hover:text-white" onClick={() => setIsMenuOpen(false)}>{t('navbar.home')}</Link>
          <Link to="/reports" className="block py-2 rounded-md text-gray-300 hover:text-white" onClick={() => setIsMenuOpen(false)}>{t('navbar.viewReports')}</Link>
          
          {profile?.role === 'admin' && (
            <Link to="/admin" className="block py-2 rounded-md font-semibold text-cyan-400 hover:text-cyan-300" onClick={() => setIsMenuOpen(false)}>Admin</Link>
          )}

          <hr className="border-gray-700"/>
           {user ? (
            <div className="pt-2">
              <p className="text-sm text-gray-400 py-2">{user.email}</p>
              <button onClick={() => { handleSignOut(); setIsMenuOpen(false); }} className="w-full text-left text-red-400 hover:text-red-300 py-2">{t('navbar.signOut')}</button>
            </div>
          ) : (
            <Link to="/auth" className="block py-2 rounded-md text-gray-300 hover:text-white" onClick={() => setIsMenuOpen(false)}>{t('navbar.login')}</Link>
          )}
           <div className="pt-2">
             <select onChange={(e) => changeLanguage(e.target.value)} value={i18n.language} className="bg-gray-700 w-full rounded-md p-2 text-white">
                {languages.map((lng) => (<option key={lng.code} value={lng.code}>{lng.lang}</option>))}
              </select>
           </div>
        </div>
      )}
    </header>
  );
}
export default Navbar;