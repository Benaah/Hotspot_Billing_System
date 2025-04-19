import React, { useEffect, useState } from 'react';

const AdminReports: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/admin/reports');
      if (!response.ok) throw new Error('Failed to fetch reports');
      const data = await response.json();

      setReports(data);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Admin Reports</h1>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th>Report Name</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id}>
                <td>{report.name}</td>
                <td>{new Date(report.created_at).toLocaleDateString()}</td>
                <td>{report.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminReports;
