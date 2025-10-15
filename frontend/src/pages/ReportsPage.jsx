import { useState, useEffect } from 'react';

function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/reports');
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
  }, []);

  if (loading) {
    return <div className="text-center p-10 text-white">Loading...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="bg-gray-900 min-h-screen text-white p-4 sm:p-8">
      <div className="container mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-cyan-400">All Submitted Reports</h1>
        
        {reports.length === 0 ? (
          <div className="text-center text-gray-400">
            <p>No reports have been submitted yet.</p>
            <p className="mt-2 text-sm">Why not be the first?</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <div key={report.id} className="bg-gray-800 rounded-lg shadow-xl overflow-hidden flex flex-col">
                {report.media_url && (
                  <a href={report.media_url} target="_blank" rel="noopener noreferrer">
                    <img src={report.media_url} alt={report.issue_type} className="w-full h-48 object-cover hover:opacity-80 transition-opacity" />
                  </a>
                )}
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-4">
                    <span className="inline-block bg-cyan-800 text-cyan-200 text-xs font-semibold px-3 py-1 rounded-full uppercase">
                      {report.issue_type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs font-bold uppercase px-3 py-1 rounded-full bg-yellow-800 text-yellow-200">
                      {report.status}
                    </span>
                  </div>
                  <p className="text-gray-300 mb-4 flex-grow">
                    {report.description}
                  </p>
                  <p className="text-gray-500 text-xs text-right mt-4">
                    {new Date(report.created_at).toLocaleString()}
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

export default ReportsPage;