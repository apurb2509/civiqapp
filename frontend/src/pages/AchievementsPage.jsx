import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import html2pdf from 'html2pdf.js';

// This is the component that defines the PDF layout
const AchievementCertificate = ({ user, achievement, message, date }) => {
  return (
    <div className="fixed top-0 left-[-9999px] w-[800px] h-[600px] bg-white text-gray-900 p-0 font-sans">
      <div id={`pdf-content-${achievement.level}`} className="w-full h-full relative overflow-hidden" style={{ backgroundColor: '#F5F1E8' }}>
        {/* Elegant border frame */}
        <div className="absolute inset-0 border-8 border-double border-amber-600"></div>
        <div className="absolute inset-3 border-2 border-amber-500"></div>
        
        {/* Decorative corners */}
        <div className="absolute top-8 left-8 w-16 h-16 border-t-4 border-l-4 border-amber-600"></div>
        <div className="absolute top-8 right-8 w-16 h-16 border-t-4 border-r-4 border-amber-600"></div>
        <div className="absolute bottom-8 left-8 w-16 h-16 border-b-4 border-l-4 border-amber-600"></div>
        <div className="absolute bottom-8 right-8 w-16 h-16 border-b-4 border-r-4 border-amber-600"></div>
        
        {/* Content */}
        <div className="relative h-full flex flex-col items-center justify-between p-12" style={{ paddingTop: '48px', paddingBottom: '48px' }}>
          {/* Header with icon */}
          <div className="flex flex-col items-center" style={{ marginTop: '20px' }}>
            <div className="w-16 h-16 mb-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <div className="w-full h-1 bg-gradient-to-r from-amber-600 to-blue-600 mb-3" style={{ width: '560px' }}></div>
            <h1 className="text-4xl font-bold text-center mb-3" style={{ color: '#1e40af', letterSpacing: '0.5px' }}>Certificate of Achievement</h1>
            <div className="w-full h-1 bg-gradient-to-r from-blue-600 to-amber-600" style={{ width: '560px' }}></div>
          </div>
          
          {/* Main content */}
          <div className="flex flex-col items-center text-center" style={{ marginTop: '24px', marginBottom: '24px' }}>
            <p className="text-lg text-gray-700 mb-5" style={{ fontSize: '14px' }}>This certificate is proudly presented to</p>
            <h2 className="text-4xl font-bold mb-6 tracking-wide" style={{ color: '#1e3a8a', fontSize: '36px' }}>{user.name}</h2>
            
            <p className="text-base text-gray-700 mb-2" style={{ fontSize: '14px' }}>For outstanding dedication to community service</p>
            <p className="text-base text-gray-700 mb-4" style={{ fontSize: '14px' }}>and achieving the distinguished title of</p>
            <h3 className="text-3xl font-bold mb-6 px-8 py-2" style={{ color: '#b45309', fontSize: '28px', letterSpacing: '1px' }}>{achievement.title}</h3>
            
            <div className="max-w-xl text-center px-8" style={{ marginTop: '16px', marginBottom: '16px' }}>
              <p className="text-sm text-gray-700 leading-relaxed mb-3" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                Your {achievement.level} resolved reports have made a tangible difference in our community. 
                Thank you for your unwavering commitment to making our city a better place for everyone.
              </p>
              <p className="text-sm font-semibold" style={{ color: '#1e40af', fontSize: '14px' }}>
                Continue inspiring change - your next milestone awaits!
              </p>
            </div>
          </div>
          
          {/* Footer */}
          <div className="flex justify-between items-end w-full pt-6 border-t-2 border-amber-600" style={{ marginTop: 'auto', paddingLeft: '24px', paddingRight: '24px' }}>
            <div className="text-left">
              <p className="text-xs text-gray-600" style={{ fontSize: '12px' }}>Date Issued</p>
              <p className="text-sm font-semibold text-gray-800" style={{ fontSize: '14px' }}>{date}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold" style={{ color: '#1e40af', fontSize: '24px' }}>CiviQ</p>
              <p className="text-xs text-gray-600" style={{ fontSize: '12px' }}>Community Platform</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// This is the main page component
function AchievementsPage() {
  const { session } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const achievements = [
    { level: 10, title: "Civic Champion" },
    { level: 15, title: "City Guardian" }
  ];

  const thankYouMessage = "Thank you for your dedication to improving our city. Your reports have made a real difference!";
  const today = new Date().toLocaleDateString();

  useEffect(() => {
    const fetchStats = async () => {
      if (!session) return;
      try {
        const response = await fetch('http://localhost:8080/api/achievements', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch achievement stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [session]);

  const downloadPDF = (level) => {
    const element = document.getElementById(`pdf-content-${level}`);
    const achievement = achievements.find(a => a.level === level);
    const opt = {
      margin: 0,
      filename: `CiviQ_Achievement_${achievement.title.replace(' ', '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
    };
    html2pdf().from(element).set(opt).save();
  };

  if (loading) return <div className="text-center px-4 py-10 text-white bg-gray-900 min-h-screen text-sm sm:text-base">Loading Achievements...</div>;
  if (!stats) return <div className="text-center px-4 py-10 text-white bg-gray-900 min-h-screen text-sm sm:text-base">Could not load achievements.</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gray-900 min-h-screen text-white px-4 py-8 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-cyan-400">My Achievements</h1>
        <p className="text-sm sm:text-base md:text-lg text-gray-300 mb-6 sm:mb-8">You have <span className="font-bold text-cyan-400 text-base sm:text-lg">{stats.resolvedCount}</span> resolved reports. {thankYouMessage}</p>

        <div className="space-y-4 sm:space-y-6">
          {achievements.map(ach => (
            <div key={ach.level} className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">{ach.title}</h2>
                <p className="text-sm sm:text-base text-gray-400">Awarded for {ach.level} resolved reports.</p>
              </div>
              {stats.resolvedCount >= ach.level ? (
                <button
                  onClick={() => downloadPDF(ach.level)}
                  className="bg-green-600 hover:bg-green-500 text-white font-semibold py-2 px-3 sm:px-4 rounded-lg text-sm sm:text-base w-full sm:w-auto"
                >
                  Download PDF
                </button>
              ) : (
                <button
                  disabled
                  className="bg-gray-600 text-gray-400 font-semibold py-2 px-3 sm:px-4 rounded-lg cursor-not-allowed text-sm sm:text-base w-full sm:w-auto"
                >
                  Locked ({ach.level - stats.resolvedCount} more to go)
                </button>
              )}
              {/* This component is hidden and only used for PDF generation */}
              <AchievementCertificate user={stats.user} achievement={ach} message={thankYouMessage} date={today} />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default AchievementsPage;