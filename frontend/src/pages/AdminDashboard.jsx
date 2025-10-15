import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const statusColors = {
  submitted: 'bg-yellow-800 text-yellow-200',
  in_progress: 'bg-blue-800 text-blue-200',
  resolved: 'bg-green-800 text-green-200',
};

function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const { session } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      if (!response.ok) {
        throw new Error('Failed to update status');
      }
      const updatedReport = await response.json();
      setReports(reports.map(r => r.id === reportId ? updatedReport.data : r));
    } catch (err) {
      console.error("Failed to update status:", err);
      alert(`Error: ${err.message}`);
    }
  };

  if (loading) { return <div className="bg-gray-900 min-h-screen text-white text-center p-10">Loading Dashboard...</div>; }
  if (error) { return <div className="bg-gray-900 min-h-screen text-red-500 text-center p-10">Error: {error}</div>; }

  return (
    <div className="bg-gray-900 min-h-screen text-white p-4 sm:p-8">
      <div className="container mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-cyan-400">Admin Dashboard</h1>
        <div className="overflow-x-auto bg-gray-800 rounded-lg shadow-xl">
          <table className="min-w-full text-sm text-left text-gray-300">
            <thead className="text-xs text-gray-400 uppercase bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3">Issue Type</th>
                <th scope="col" className="px-6 py-3">Description</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3">Reported At</th>
                <th scope="col" className="px-6 py-3">User ID</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} className="border-b border-gray-700 hover:bg-gray-600">
                  <td className="px-6 py-4 font-medium whitespace-nowrap">{t(`reportForm.issueTypes.${report.issue_type}`)}</td>
                  <td className="px-6 py-4 max-w-xs truncate" title={report.description}>{report.description}</td>
                  <td className="px-6 py-4">
                    <select
                      value={report.status}
                      onChange={(e) => handleStatusChange(report.id, e.target.value)}
                      className={`text-xs font-bold border-none rounded px-2 py-1 ${statusColors[report.status] || 'bg-gray-700'}`}
                    >
                      <option value="submitted">{t('reportsPage.statuses.submitted')}</option>
                      <option value="in_progress">{t('reportsPage.statuses.in_progress')}</option>
                      <option value="resolved">{t('reportsPage.statuses.resolved')}</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">{new Date(report.created_at).toLocaleString(i18n.language, { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td className="px-6 py-4 text-xs text-gray-400 truncate" title={report.user_id}>{report.user_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;