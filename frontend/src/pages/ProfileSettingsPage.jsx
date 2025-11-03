import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

function ProfileSettingsPage() {
  const { session, user, profile: authProfile } = useAuth();
  const [formData, setFormData] = useState({
    full_name: '',
    dob: '',
    city: '',
    area: '',
    pincode: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // Fetch the current profile data to pre-fill the form
  useEffect(() => {
    if (authProfile) {
      setFormData({
        full_name: authProfile.full_name || '',
        dob: authProfile.dob || '',
        city: authProfile.city || '',
        area: authProfile.area || '',
        pincode: authProfile.pincode || ''
      });
      setLoading(false);
    }
  }, [authProfile]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch('http://localhost:8080/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update profile.');

      setMessage(data.message);
      // We should ideally re-fetch the profile in AuthContext, but for now, this works
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const displayContact = user?.phone || user?.email;

  if (loading) return <div className="text-center px-4 py-10 text-white bg-gray-900 min-h-screen text-sm sm:text-base">Loading Profile...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gray-900 min-h-screen text-white px-4 py-8 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-lg px-0">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 text-cyan-400">Profile Settings</h1>
        
        <form onSubmit={handleSubmit} className="bg-gray-800 p-4 sm:p-6 md:p-8 rounded-lg shadow-xl space-y-4 sm:space-y-6">
          {error && <div className="text-red-400 bg-red-900/50 p-2 sm:p-3 rounded-md text-sm sm:text-base">{error}</div>}
          {message && <div className="text-green-400 bg-green-900/50 p-2 sm:p-3 rounded-md text-sm sm:text-base">{message}</div>}

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-400 mb-1.5 sm:mb-2">Contact (Read-only)</label>
            <input
              type="text"
              value={displayContact || ''}
              disabled
              className="w-full p-2.5 sm:p-3 text-sm sm:text-base bg-gray-700/50 border border-gray-600 rounded-md text-gray-500"
            />
          </div>

          <div>
            <label htmlFor="full_name" className="block text-xs sm:text-sm font-semibold text-gray-300 mb-1.5 sm:mb-2">Full Name (Compulsory)</label>
            <input
              type="text"
              name="full_name"
              id="full_name"
              value={formData.full_name}
              onChange={handleChange}
              required
              className="w-full p-2.5 sm:p-3 text-sm sm:text-base bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label htmlFor="dob" className="block text-xs sm:text-sm font-semibold text-gray-300 mb-1.5 sm:mb-2">Date of Birth (Compulsory)</label>
            <input
              type="date"
              name="dob"
              id="dob"
              value={formData.dob}
              onChange={handleChange}
              required
              className="w-full p-2.5 sm:p-3 text-sm sm:text-base bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="block text-xs sm:text-sm font-semibold text-gray-300 mb-1.5 sm:mb-2">City (Compulsory)</label>
              <input
                type="text"
                name="city"
                id="city"
                value={formData.city}
                onChange={handleChange}
                required
                className="w-full p-2.5 sm:p-3 text-sm sm:text-base bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label htmlFor="pincode" className="block text-xs sm:text-sm font-semibold text-gray-300 mb-1.5 sm:mb-2">Pincode (Compulsory)</label>
              <input
                type="text"
                name="pincode"
                id="pincode"
                value={formData.pincode}
                onChange={handleChange}
                required
                className="w-full p-2.5 sm:p-3 text-sm sm:text-base bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="area" className="block text-xs sm:text-sm font-semibold text-gray-300 mb-1.5 sm:mb-2">Area / Locality (Compulsory)</label>
            <input
              type="text"
              name="area"
              id="area"
              value={formData.area}
              onChange={handleChange}
              required
              className="w-full p-2.5 sm:p-3 text-sm sm:text-base bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 sm:py-3 px-4 sm:px-6 text-sm sm:text-base bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg shadow-lg disabled:bg-gray-500 transition-all duration-200"
          >
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </motion.div>
  );
}

export default ProfileSettingsPage;