import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import SendMessageModal from '../components/SendMessageModal';
import MediaViewerModal from '../components/MediaViewerModal';
import SmartReplyModal from '../components/SmartReplyModal'; // ✅ IMPORTED NEW MODAL

const statusStyles = {
  submitted: { badge: 'bg-amber-800 text-amber-100', text: 'text-amber-400' },
  in_progress: { badge: 'bg-indigo-800 text-indigo-100', text: 'text-indigo-400' },
  resolved: { badge: 'bg-emerald-800 text-emerald-100', text: 'text-emerald-400' },
};

// Helper to style the Priority badge
const getPriorityStyles = (count) => {
  if (count >= 5) return 'bg-red-800 text-red-100';
  if (count >= 3) return 'bg-orange-800 text-orange-100';
  return 'bg-gray-700 text-gray-200';
};

function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const { session } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messagingReport, setMessagingReport] = useState(null);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [viewingMedia, setViewingMedia] = useState(null);
  const [replyingReport, setReplyingReport] = useState(null); // ✅ NEW STATE FOR SMART REPLY MODAL

  useEffect(() => {
    const fetchAdminReports = async () => {
      if (!session) { setLoading(false); return; }
      try {
        const response = await fetch(`http://localhost:8080/api/admin/reports?nocache=${Date.now()}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Cache-Control': 'no-cache',
          },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch admin reports');
        }
        const data = await response.json();
        setReports(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminReports();
  }, [session]);

  const handleStatusChange = async (reportId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:8080/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      const updatedReport = await response.json();
      setReports(reports.map(r => r.id === reportId ? updatedReport.data : r));
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // ✅ NEW: Function to handle selecting a smart reply
  const handleSelectSmartReply = (replyText) => {
    // 1. Close the SmartReplyModal (setReplyingReport(null))
    // 2. Open the SendMessageModal with the prefilled text
    setMessagingReport({ ...replyingReport, prefilledText: replyText });
    setReplyingReport(null);
  };

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

  if (loading) { return <div className="bg-gray-900 min-h-screen text-white text-center p-10">Loading Dashboard...</div>; }
  if (error) { return <div className="bg-gray-900 min-h-screen text-red-500 text-center p-10">Error: {error}</div>; }

  return (
    <>
      <motion.div initial="hidden" animate="visible" exit={{ opacity: 0 }} variants={itemVariants} className="bg-gray-900 min-h-screen text-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-cyan-400">Admin Dashboard</h1>
            <button onClick={() => setShowBroadcast(true)} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-3 sm:px-4 rounded-lg text-sm sm:text-base">Send Broadcast</button>
          </div>
          {/* Mobile Card View */}
<div className="md:hidden space-y-4">
  {reports.map((report, index) => (
    <motion.div
      key={report.id}
      variants={itemVariants}
      className="bg-gray-800 rounded-lg p-4 space-y-3"
    >
      <div className="flex justify-between items-start">
        <span className="text-gray-400 text-xs">#{index + 1}</span>
        <select
          value={report.status}
          onChange={(e) => handleStatusChange(report.id, e.target.value)}
          className={`text-xs font-bold rounded px-2 py-1 ${statusStyles[report.status]?.badge}`}
        >
          <option value="submitted">{t('reportsPage.statuses.submitted')}</option>
          <option value="in_progress">{t('reportsPage.statuses.in_progress')}</option>
          <option value="resolved">{t('reportsPage.statuses.resolved')}</option>
        </select>
      </div>
      
      <div>
        <div className="font-medium text-white">{t(`reportForm.issueTypes.${report.issue_type}`)}</div>
        <div className="text-xs text-gray-400 mt-1 line-clamp-2">{report.description}</div>
        <div className="text-xs text-gray-500 mt-1">{report.profiles?.email || 'N/A'}</div>
      </div>
      
      <div className="flex gap-2 flex-wrap">
        <span className={`px-2 py-1 text-xs rounded-full ${getPriorityStyles(report.duplicate_count || 1)}`}>
          {report.duplicate_count || 1} Report{report.duplicate_count > 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="flex gap-2 flex-wrap text-xs">
        <button onClick={() => setReplyingReport(report)} className="text-green-400 hover:underline">Smart Reply</button>
        <button onClick={() => setMessagingReport(report)} className="text-cyan-400 hover:underline">Message</button>
        {report.media_url && !report.media_url.endsWith('.webm') && (
          <button onClick={() => setViewingMedia(report.media_url)} className="text-purple-400 hover:underline">View Media</button>
        )}
        {report.media_url && report.media_url.endsWith('.webm') && (
          <audio controls src={report.media_url} className="w-full h-8 rounded-lg" />
        )}
      </div>
    </motion.div>
  ))}
</div>

{/* Desktop Table View */}
<div className="hidden md:block overflow-x-auto bg-gray-800 rounded-lg shadow-xl -mx-4 sm:mx-0">
            <table className="min-w-full text-xs sm:text-sm text-left text-gray-300">
              <thead className="text-[10px] sm:text-xs text-gray-400 uppercase bg-gray-700">
                <tr>
                  <th scope="col" className="px-2 sm:px-4 md:px-6 py-2 sm:py-3">S.No.</th>
                  <th scope="col" className="px-2 sm:px-4 md:px-6 py-2 sm:py-3">User</th>
                  <th scope="col" className="px-2 sm:px-4 md:px-6 py-2 sm:py-3">Issue</th>
                  
                  {/* Priority Column */}
                  <th scope="col" className="px-2 sm:px-4 md:px-6 py-2 sm:py-3">Priority</th>
                  <th scope="col" className="px-2 sm:px-4 md:px-6 py-2 sm:py-3">Status</th>
                  <th scope="col" className="px-2 sm:px-4 md:px-6 py-2 sm:py-3">Timeline</th>
                  <th scope="col" className="px-2 sm:px-4 md:px-6 py-2 sm:py-3">Actions</th>
                </tr>
              </thead>
              <motion.tbody variants={containerVariants}>
                {reports.map((report, index) => (
                  <motion.tr key={report.id} variants={itemVariants} className="border-b border-gray-700 hover:bg-gray-700/50">
                    <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-4">{index + 1}</td>
                    <td className="px-6 py-4 text-xs text-gray-400" title={report.user_id}>{report.profiles?.email || 'N/A'}</td>
                    <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-4">
                      <div className="font-medium whitespace-nowrap">{t(`reportForm.issueTypes.${report.issue_type}`)}</div>
                      <div className="text-xs text-gray-400 max-w-xs truncate" title={report.description}>{report.description}</div>
                    </td>

                    {/* Priority Badge cell */}
                    <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-4">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${getPriorityStyles(report.duplicate_count || 1)}`}>
                        {report.duplicate_count || 1} {report.duplicate_count > 1 ? 'Reports' : 'Report'}
                      </span>
                    </td>

                    <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-4">
                      <select value={report.status} onChange={(e) => handleStatusChange(report.id, e.target.value)} className={`text-xs font-bold border-none rounded px-2 py-1 ${statusStyles[report.status]?.badge || 'bg-gray-700'}`}>
                        <option value="submitted">{t('reportsPage.statuses.submitted')}</option>
                        <option value="in_progress">{t('reportsPage.statuses.in_progress')}</option>
                        <option value="resolved">{t('reportsPage.statuses.resolved')}</option>
                      </select>
                    </td>

                    <td className="px-6 py-4 text-xs whitespace-nowrap text-gray-400">
                      <ul className="space-y-1">
                        <li><strong className="font-semibold text-gray-200">Submitted:</strong> {new Date(report.created_at).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' })}</li>
                        {report.in_progress_at && <li className={statusStyles.in_progress.text}><strong className="font-semibold">In Progress:</strong> {new Date(report.in_progress_at).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' })}</li>}
                        {report.resolved_at && <li className={statusStyles.resolved.text}><strong className="font-semibold">Resolved:</strong> {new Date(report.resolved_at).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' })}</li>}
                      </ul>
                    </td>

                    <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-4">
                    <div className="flex flex-col items-start space-y-1 sm:space-y-2">
                      {/* ✅ NEW: Smart Reply Button */}
                      <button 
                        onClick={() => setReplyingReport(report)} 
                        className="font-medium text-green-400 hover:underline whitespace-nowrap"
                      >
                        Smart Reply
                      </button>
                      
                      <button onClick={() => setMessagingReport(report)} className="font-medium text-cyan-400 hover:underline whitespace-nowrap">Message</button>

                      {/* Keep your existing media logic unchanged */}
                      {report.media_url && (
                        report.media_url.endsWith('.webm') ? (
                          <audio controls src={report.media_url} className="w-32 sm:w-48 h-8 rounded-full" />
                        ) : (
                          <button onClick={() => setViewingMedia(report.media_url)} className="font-medium text-purple-400 hover:underline whitespace-nowrap">View Media</button>
                        )
                      )}
                    </div>
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {/* ✅ UPDATED: Pass prefilledText from smart reply to SendMessageModal */}
        {messagingReport && 
          <SendMessageModal 
            report={messagingReport} 
            initialMessage={messagingReport.prefilledText} // Pass prefilledText
            onClose={() => {
              setMessagingReport(null);
              // Clear prefilled text in case the user closes the modal without sending
              setReports(prev => prev.map(r => r.id === messagingReport.id ? { ...r, prefilledText: undefined } : r));
            }} 
          />}
        
        {showBroadcast && <SendMessageModal broadcast={true} onClose={() => setShowBroadcast(null)} />}
        
        {viewingMedia && <MediaViewerModal mediaUrl={viewingMedia} onClose={() => setViewingMedia(null)} />}
        
        {/* ✅ NEW: Show the SmartReplyModal */}
        {replyingReport && 
          <SmartReplyModal 
            report={replyingReport} 
            onSelectReply={handleSelectSmartReply} 
            onClose={() => setReplyingReport(null)} 
          />}
      </AnimatePresence>
    </>
  );
}

export default AdminDashboard;