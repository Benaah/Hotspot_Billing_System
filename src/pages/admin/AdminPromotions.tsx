import React, { useEffect, useState } from 'react';

interface Promotion {
  id: string;
  title: string;
  message: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

const AdminPromotions: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/admin/promotions');
      if (!response.ok) throw new Error('Failed to fetch promotions');
      const data = await response.json();

      setPromotions(data);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Promotional Messages</h1>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th>Title</th>
              <th>Message</th>
              <th>Active</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {promotions.map((promo) => (
              <tr key={promo.id}>
                <td>{promo.title}</td>
                <td>{promo.message}</td>
                <td>{promo.is_active ? 'Yes' : 'No'}</td>
                <td>{new Date(promo.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminPromotions;
