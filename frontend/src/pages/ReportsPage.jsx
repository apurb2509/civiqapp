import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

function ReportsPage() {
  const { t, i18n } = useTranslation();
  const { session } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        if (!session) {
          // If no user is logged in, don't fetch any reports
          setReports([]);
          return;
        }

        const response = await fetch('http://localhost:8080/api/reports', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          }
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
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

  if (loading) {
    return <div className="text-center p-10 text-white bg-gray-900 min-h-screen">Loading...</div>;
  }
  if (error) {
    return <div className="text-center p-10 text-red-500 bg-gray-900 min-h-screen">Error: {error}</div>;
  }
  return (
    <div className="bg-gray-900 min-h-screen text-white p-4 sm:p-8">
      <div className="container mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-cyan-400">{t('reportsPage.title')}</h1>
        
        {!session ? (
           <div className="text-center text-gray-400 py-10"><p className="text-lg">Please log in to view your reports.</p></div>
        ) : reports.length === 0 ? (
          <div className="text-center text-gray-400 py-10">
            <p className="text-lg">{t('reportsPage.noReports')}</p>
            <p className="mt-2 text-sm">{t('reportsPage.beFirst')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <div key={report.id} className="bg-gray-800 rounded-lg shadow-xl overflow-hidden flex flex-col transition-transform transform hover:-translate-y-1">
                {report.media_url && (
                  <a href={report.media_url} target="_blank" rel="noopener noreferrer" className="block h-48 overflow-hidden">
                    <img src={report.media_url} alt={t(`reportForm.issueTypes.${report.issue_type}`)} className="w-full h-full object-cover hover:opacity-80 transition-opacity" />
                  </a>
                )}
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-4">
                    <span className="inline-block bg-cyan-800 text-cyan-200 text-xs font-semibold px-3 py-1 rounded-full uppercase">
                      {t(`reportForm.issueTypes.${report.issue_type}`)}
                    </span>
                    <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${statusColors[report.status] || 'bg-gray-700'}`}>
                      {t(`reportsPage.statuses.${report.status}`)}
                    </span>
                  </div>
                  <p className="text-gray-300 mb-4 flex-grow h-24 overflow-y-auto">{report.description}</p>
                  <p className="text-gray-500 text-xs text-right mt-4">
                    {t('reportsPage.reportedOn')} {new Date(report.created_at).toLocaleString(i18n.language, { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// You will need to add this small helper object at the top of the file
const statusColors = {
  submitted: 'bg-yellow-800 text-yellow-200',
  in_progress: 'bg-blue-800 text-blue-200',
  resolved: 'bg-green-800 text-green-200',
};

export default ReportsPage;