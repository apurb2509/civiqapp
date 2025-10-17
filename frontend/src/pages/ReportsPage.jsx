import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const statusStyles = {
  submitted: {
    badge: 'bg-amber-800 text-amber-100',
    border: 'border-amber-500',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
  },
  in_progress: {
    badge: 'bg-indigo-800 text-indigo-100',
    border: 'border-indigo-500',
    text: 'text-indigo-400',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
  },
  resolved: {
    badge: 'bg-emerald-800 text-emerald-100',
    border: 'border-emerald-500',
    text: 'text-emerald-400',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
  },
};

function ReportsPage() {
  const { t, i18n } = useTranslation();
  const { session } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        if (!session) { setReports([]); return; }
        const response = await fetch('http://localhost:8080/api/reports', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setReports(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [session]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  if (loading) { return <div className="text-center p-10 text-white bg-gray-900 min-h-screen">Loading...</div>; }
  if (error) { return <div className="text-center p-10 text-red-500 bg-gray-900 min-h-screen">Error: {error}</div>; }

  return (
    <motion.div initial="hidden" animate="visible" exit={{ opacity: 0 }} className="bg-gray-900 min-h-screen text-white p-4 sm:p-8">
      <div className="container mx-auto">
        <motion.h1 variants={itemVariants} className="text-3xl sm:text-4xl font-bold mb-8 text-cyan-400">{t('reportsPage.title')}</motion.h1>
        
        {!session ? (
           <motion.div variants={itemVariants} className="text-center text-gray-400 py-10"><p className="text-lg">Please log in to view your reports.</p></motion.div>
        ) : reports.length === 0 ? (
          <motion.div variants={itemVariants} className="text-center text-gray-400 py-10">
            <p className="text-lg">{t('reportsPage.noReports')}</p>
            <p className="mt-2 text-sm">{t('reportsPage.beFirst')}</p>
          </motion.div>
        ) : (
          <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {reports.map((report) => {
              const currentStatus = statusStyles[report.status] || statusStyles.submitted;
              return (
                <motion.div key={report.id} variants={itemVariants} className={`bg-gray-800/50 rounded-lg shadow-lg border-l-4 ${currentStatus.border} flex flex-col`}>
                  {report.media_url && ( <a href={report.media_url} target="_blank" rel="noopener noreferrer" className="block h-48 overflow-hidden rounded-t-lg"><img src={report.media_url} alt={t(`reportForm.issueTypes.${report.issue_type}`)} className="w-full h-full object-cover hover:opacity-80 transition-opacity" /></a> )}
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-bold text-white uppercase tracking-wider">{t(`reportForm.issueTypes.${report.issue_type}`)}</span>
                      <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${currentStatus.badge}`}>
                        {t(`reportsPage.statuses.${report.status}`)}
                      </span>
                    </div>
                    <p className="text-gray-400 mb-4 flex-grow text-sm">{report.description}</p>
                    <div className="text-gray-500 text-xs mt-auto pt-4 border-t border-gray-700/50 space-y-2">
                      <div className="flex items-center gap-2">
                        {statusStyles.submitted.icon}
                        <span>Submitted: {new Date(report.created_at).toLocaleString(i18n.language, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>
                      {report.in_progress_at && <div className={`flex items-center gap-2 ${statusStyles.in_progress.text}`}>
                        {statusStyles.in_progress.icon}
                        <span>In Progress: {new Date(report.in_progress_at).toLocaleString(i18n.language, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>}
                      {report.resolved_at && <div className={`flex items-center gap-2 ${statusStyles.resolved.text}`}>
                        {statusStyles.resolved.icon}
                        <span>Resolved: {new Date(report.resolved_at).toLocaleString(i18n.language, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default ReportsPage;