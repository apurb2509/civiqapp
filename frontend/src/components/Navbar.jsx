import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import NotificationBell from "./NotificationBell";

const languages = [
  { code: "en", lang: "English" },
  { code: "hi", lang: "हिन्दी" },
  { code: "or", lang: "ଓଡ଼ିଆ" },
  { code: "bn", lang: "বাংলা" },
  { code: "te", lang: "తెలుగు" },
  { code: "mr", lang: "Marathi" },
  { code: "ta", lang: "தமிழ்" },
  { code: "ur", lang: "اردو" },
  { code: "gu", lang: "ગુજરાતી" },
  { code: "kn", lang: "ಕನ್ನಡ" },
  { code: "ml", lang: "മലയാളം" },
];

const getInitials = (email) => {
  if (!email) return "";
  const parts = email
    .split("@")[0]
    .replace(/[^a-zA-Z\s]/g, " ")
    .split(" ");
  const validParts = parts.filter((p) => p.length > 0);
  if (validParts.length >= 2)
    return (
      validParts[0][0] + validParts[validParts.length - 1][0]
    ).toUpperCase();
  if (validParts.length === 1)
    return validParts[0].substring(0, 2).toUpperCase();
  return "U";
};

function NavLink({ to, title }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      className="relative px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors flex items-center justify-center"
    >
      <span className="relative z-10">{title}</span>
      {isActive && (
        <motion.div
          layoutId="activePill"
          className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 opacity-20 pointer-events-none"
          style={{ borderRadius: 9999 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
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
      if (userMenuRef.current && !userMenuRef.current.contains(event.target))
        setIsUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuRef]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };
  const changeLanguage = (lng) => i18n.changeLanguage(lng);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 px-4">
        <motion.div
          className="w-full max-w-5xl relative overflow-visible"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Desktop Navbar */}
          <div className="hidden lg:flex items-center justify-between w-full p-3 bg-slate-900/70 backdrop-blur-xl border border-slate-700/40 rounded-full shadow-lg shadow-black/40">
            <div className="flex items-center flex-1 gap-4">
              <Link
                className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 drop-shadow-[0_0_15px_rgba(56,189,248,0.3)] px-3"
                to="/"
              >
                {t("navbar.brand")}
              </Link>
              {profile?.role === "admin" ? (
                <NavLink to="/admin" title="Admin Control" />
              ) : (
                <>
                  <NavLink to="/" title={t("navbar.home")} />
                  {user && (
                    <NavLink to="/reports" title={t("navbar.viewReports")} />
                  )}
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative inline-block">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="w-4 h-4 text-cyan-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                    />
                  </svg>
                </div>
                <select
                  onChange={(e) => changeLanguage(e.target.value)}
                  value={i18n.language}
                  className="appearance-none bg-gradient-to-r from-slate-800/80 to-slate-800/60 border border-slate-700/50 rounded-lg pl-10 pr-10 py-2.5 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200 cursor-pointer shadow-lg shadow-black/10 hover:border-cyan-500/30 hover:shadow-cyan-500/10"
                >
                  {languages.map((lng) => (
                    <option
                      key={lng.code}
                      value={lng.code}
                      className="bg-slate-900 text-white font-semibold py-2"
                    >
                      {lng.lang}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              <div className="w-px h-6 bg-gray-600"></div>
              {user && <NotificationBell />}

              <div ref={userMenuRef} className="relative">
                {user ? (
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    title={user.email}
                    className="h-10 w-10 flex items-center justify-center bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-full font-bold text-white text-sm shadow-lg shadow-cyan-500/20 hover:shadow-cyan-400/30 transition-all duration-300"
                  >
                    {getInitials(user.email)}
                  </button>
                ) : (
                  <Link
                    to="/auth"
                    className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 text-white font-bold py-2 px-4 rounded-full shadow-lg shadow-cyan-500/20 hover:shadow-cyan-400/30 transition-all duration-300 text-sm"
                  >
                    {t("navbar.login")}
                  </Link>
                )}

                <AnimatePresence>
                  {isUserMenuOpen && user && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full right-0 mt-2 w-72 bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-lg shadow-black/40"
                    >
                      <div className="p-4 border-b border-slate-700">
                        <p className="font-semibold text-white truncate">
                          {user.email}
                        </p>
                        {profile?.role === "admin" && (
                          <span className="text-xs font-bold bg-cyan-800 text-cyan-200 px-2 py-1 rounded-full">
                            ADMIN
                          </span>
                        )}
                      </div>

                      {/* ADD THESE LINKS */}
                      <Link
                        to="/profile-settings"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block w-full text-left px-4 py-3 text-gray-300 hover:bg-gray-700/50 transition-colors duration-200"
                      >
                        Profile Settings
                      </Link>

                      {profile?.role !== "admin" && (
                        <Link
                          to="/achievements"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="block w-full text-left px-4 py-3 text-gray-300 hover:bg-gray-700/50 transition-colors duration-200"
                        >
                          My Achievements
                        </Link>
                      )}

                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-b-xl transition-colors duration-200"
                      >
                        {t("navbar.signOut")}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Mobile Navbar */}
          <div className="lg:hidden flex items-center justify-between p-3 w-full bg-slate-900/70 backdrop-blur-xl border border-slate-700/40 rounded-2xl shadow-lg shadow-black/40 overflow-visible flex-wrap relative z-[9999]">
            <Link
              className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500"
              to="/"
            >
              {t("navbar.brand")}
            </Link>
            <div className="flex items-center gap-2 relative overflow-visible">
              <select
                onChange={(e) => changeLanguage(e.target.value)}
                value={i18n.language}
                className="bg-slate-900/90 text-white border border-cyan-600/40 rounded-lg px-2 py-1 text-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                {languages.map((lng) => (
                  <option key={lng.code} value={lng.code}>
                    {lng.lang}
                  </option>
                ))}
              </select>

              {user && (
                <div className="relative z-50">
                  <NotificationBell />
                </div>
              )}
              <button onClick={() => setIsMenuOpen(true)} className="p-2">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16m-7 6h7"
                  ></path>
                </svg>
              </button>
            </div>
          </div>
        </motion.div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center lg:hidden"
          >
            <button
              onClick={() => setIsMenuOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-white p-2"
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <nav className="flex flex-col items-center gap-6 text-center">
              {profile?.role === "admin" ? (
                <Link
                  onClick={() => setIsMenuOpen(false)}
                  to="/admin"
                  className="text-2xl font-semibold text-cyan-400 hover:text-cyan-300"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    onClick={() => setIsMenuOpen(false)}
                    to="/"
                    className="text-2xl text-gray-300 hover:text-cyan-400"
                  >
                    {t("navbar.home")}
                  </Link>
                  {user && (
                    <Link
                      onClick={() => setIsMenuOpen(false)}
                      to="/reports"
                      className="text-2xl text-gray-300 hover:text-cyan-400"
                    >
                      {t("navbar.viewReports")}
                    </Link>
                  )}
                </>
              )}
              {user && (
                <>
                  <Link
                    onClick={() => setIsMenuOpen(false)}
                    to="/profile-settings"
                    className="text-2xl text-gray-300 hover:text-cyan-400"
                  >
                    Profile Settings
                  </Link>

                  {profile?.role !== "admin" && (
                    <Link
                      onClick={() => setIsMenuOpen(false)}
                      to="/achievements"
                      className="text-2xl text-gray-300 hover:text-cyan-400"
                    >
                      My Achievements
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleSignOut();
                    }}
                    className="text-2xl text-red-400 hover:text-red-300"
                  >
                    {t("navbar.signOut")}
                  </button>
                </>
              )}

              {!user && (
                <Link
                  onClick={() => setIsMenuOpen(false)}
                  to="/auth"
                  className="text-2xl text-gray-300 hover:text-cyan-400"
                >
                  {t("navbar.login")}
                </Link>
              )}

              <select
                onChange={(e) => {
                  changeLanguage(e.target.value);
                  setIsMenuOpen(false);
                }}
                value={i18n.language}
                className="bg-slate-900/90 text-white border border-cyan-600/40 rounded-lg px-4 py-3 text-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                {languages.map((lng) => (
                  <option key={lng.code} value={lng.code}>
                    {lng.lang}
                  </option>
                ))}
              </select>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Navbar;
