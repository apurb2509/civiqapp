import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="bg-gray-900 bg-opacity-70 backdrop-blur-lg sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center p-4 text-white">
        <Link to="/" className="text-2xl font-bold text-cyan-400">
          CiviQ
        </Link>
        <nav className="space-x-6 flex items-center">
          <Link to="/" className="text-lg text-gray-300 hover:text-cyan-400 transition-colors">
            Home
          </Link>
          <Link to="/reports" className="text-lg text-gray-300 hover:text-cyan-400 transition-colors">
            View Reports
          </Link>
          {user ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400 hidden sm:block">{user.email}</span>
              <button 
                onClick={handleSignOut}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg text-sm"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link to="/auth" className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg text-sm">
              Login / Sign Up
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;