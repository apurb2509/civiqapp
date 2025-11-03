import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import HomePage from './pages/HomePage';
import Navbar from './components/Navbar';
import ReportsPage from './pages/ReportsPage';
import AuthPage from './pages/AuthPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminRoute from './components/auth/AdminRoute';
import MyBadgesPage from './pages/MyBadgesPage'; 
import ProfileSettingsPage from './pages/ProfileSettingsPage';
import AchievementsPage from './pages/AchievementsPage';

function AppRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/profile-settings" element={<ProfileSettingsPage />} />
        <Route path="/achievements" element={<AchievementsPage />} />
        <Route 
          path="/admin" 
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } 
        />
        {/* ✅ Added new badges route */}
        <Route path="/my-badges" element={<MyBadgesPage />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main className="pt-24 sm:pt-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <AppRoutes />
      </main>
    </BrowserRouter>
  );
}

export default App;
