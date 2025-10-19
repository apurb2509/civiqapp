import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import Badge from '../components/Badge';

function MyBadgesPage() {
  const { user } = useAuth();
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBadges = async () => {
      if (!user) { setLoading(false); return; }
      try {
        const response = await fetch(`http://localhost:8080/api/badges/${user.id}`);
        const data = await response.json();
        setBadges(data);
      } catch (error) {
        console.error("Failed to fetch badges", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBadges();
  }, [user]);

  if (loading) return <div className="text-center p-10 text-white bg-gray-900 min-h-screen">Loading Your Badges...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gray-900 min-h-screen text-white p-4 sm:p-8">
      <div className="container mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-cyan-400">My Badges & Achievements</h1>
        {badges.length === 0 ? (
          <p className="text-gray-400">You haven't earned any badges yet. Keep reporting issues to make your community better and earn rewards!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {badges.map(badge => (
              <Badge key={badge.id} title={badge.title} date={badge.created_at} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default MyBadgesPage;