import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import Navbar from './components/Navbar';
import ReportsPage from './pages/ReportsPage';
import AuthPage from './pages/AuthPage';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/auth" element={<AuthPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;