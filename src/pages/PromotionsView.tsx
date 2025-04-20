import React, { useEffect, useState } from 'react';

interface Promotion {
  id: string;
  title: string;
  message: string;
  is_active: boolean;
  created_at: string;
}

const PromotionsView: React.FC = () => {
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

      const response = await fetch('/api/promotions');
      if (!response.ok) throw new Error('Failed to fetch promotions');
      const data = await response.json();

      setPromotions(data.filter((promo: Promotion) => promo.is_active));
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Promotions & Messages</h1>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <ul className="space-y-4">
          {promotions.map((promo) => (
            <li key={promo.id} className="border p-4 rounded shadow">
              <h2 className="text-xl font-semibold">{promo.title}</h2>
              <p className="mt-2">{promo.message}</p>
              <p className="text-sm text-gray-500 mt-1">Posted on: {new Date(promo.created_at).toLocaleDateString()}</p>
            </li>
          ))}
          {promotions.length === 0 && <p>No active promotions at this time.</p>}
        </ul>
      )}
    </div>
  );
};

export default PromotionsView;
