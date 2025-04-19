import React, { useEffect, useState } from 'react';

interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_hours: number;
  data_limit_mb?: number | null;
  is_active: boolean;
}

const AdminPackages: React.FC = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/admin/packages');
      if (!response.ok) throw new Error('Failed to fetch packages');
      const data = await response.json();

      setPackages(data);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Admin Packages</h1>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Price</th>
              <th>Duration (hours)</th>
              <th>Data Limit (MB)</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {packages.map((pkg) => (
              <tr key={pkg.id}>
                <td>{pkg.name}</td>
                <td>{pkg.description}</td>
                <td>{pkg.price}</td>
                <td>{pkg.duration_hours}</td>
                <td>{pkg.data_limit_mb ?? 'Unlimited'}</td>
                <td>{pkg.is_active ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminPackages;
