import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <header className="bg-gray-900 bg-opacity-70 backdrop-blur-lg sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center p-4 text-white">
        <Link to="/" className="text-2xl font-bold text-cyan-400">
          CiviQ
        </Link>
        <nav className="space-x-8">
          <Link to="/" className="text-lg text-gray-300 hover:text-cyan-400 transition-colors">
            Home
          </Link>
          <Link to="/reports" className="text-lg text-gray-300 hover:text-cyan-400 transition-colors">
            View Reports
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;