import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import SendMessageModal from '../components/SendMessageModal';
import MediaViewerModal from '../components/MediaViewerModal';

const statusStyles = {
  submitted: { badge: 'bg-amber-800 text-amber-100', text: 'text-amber-400' },
  in_progress: { badge: 'bg-indigo-800 text-indigo-100', text: 'text-indigo-400' },
  resolved: { badge: 'bg-emerald-800 text-emerald-100', text: 'text-emerald-400' },
};

// ✅ NEW: Helper to style the Priority badge
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

  useEffect(() => {
    const fetchAdminReports = async () => {
      if (!session) { setLoading(false); return; }
      try {
        const response = await fetch('http://localhost:8080/api/admin/reports', {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
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

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

  if (loading) { return <div className="bg-gray-900 min-h-screen text-white text-center p-10">Loading Dashboard...</div>; }
  if (error) { return <div className="bg-gray-900 min-h-screen text-red-500 text-center p-10">Error: {error}</div>; }

  return (
    <>
      <motion.div initial="hidden" animate="visible" exit={{ opacity: 0 }} variants={itemVariants} className="bg-gray-900 min-h-screen text-white p-4 sm:p-8">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-cyan-400">Admin Dashboard</h1>
            <button onClick={() => setShowBroadcast(true)} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-lg">Send Broadcast</button>
          </div>
          <div className="overflow-x-auto bg-gray-800 rounded-lg shadow-xl">
            <table className="min-w-full text-sm text-left text-gray-300">
              <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3">S.No.</th>
                  <th scope="col" className="px-6 py-3">User</th>
                  <th scope="col" className="px-6 py-3">Issue</th>
                  {/* ✅ NEW: Priority Column */}
                  <th scope="col" className="px-6 py-3">Priority</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                  <th scope="col" className="px-6 py-3">Timeline</th>
                  <th scope="col" className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <motion.tbody variants={containerVariants}>
                {reports.map((report, index) => (
                  <motion.tr key={report.id} variants={itemVariants} className="border-b border-gray-700 hover:bg-gray-700/50">
                    <td className="px-6 py-4">{index + 1}</td>
                    <td className="px-6 py-4 text-xs text-gray-400" title={report.user_id}>{report.profiles?.email || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium whitespace-nowrap">{t(`reportForm.issueTypes.${report.issue_type}`)}</div>
                      <div className="text-xs text-gray-400 max-w-xs truncate" title={report.description}>{report.description}</div>
                    </td>

                    {/* ✅ NEW: Priority Badge cell */}
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${getPriorityStyles(report.duplicate_count || 1)}`}>
                        {report.duplicate_count || 1} {report.duplicate_count > 1 ? 'Reports' : 'Report'}
                      </span>
                    </td>

                    <td className="px-6 py-4">
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

                    <td className="px-6 py-4 space-x-4">
                      <button onClick={() => setMessagingReport(report)} className="font-medium text-cyan-400 hover:underline">Message</button>

                      {/* Keep your existing media logic unchanged */}
                      {report.media_url && (
                        report.media_url.endsWith('.webm') ? (
                          <audio controls src={report.media_url} className="w-48 h-8 rounded-full" />
                        ) : (
                          <button onClick={() => setViewingMedia(report.media_url)} className="font-medium text-purple-400 hover:underline">View Media</button>
                        )
                      )}
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {messagingReport && <SendMessageModal report={messagingReport} onClose={() => setMessagingReport(null)} />}
        {showBroadcast && <SendMessageModal broadcast={true} onClose={() => setShowBroadcast(null)} />}
        {viewingMedia && <MediaViewerModal mediaUrl={viewingMedia} onClose={() => setViewingMedia(null)} />}
      </AnimatePresence>
    </>
  );
}

export default AdminDashboard;
