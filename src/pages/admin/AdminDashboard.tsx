import React, { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

interface Transaction {
  id: string;
  user_name: string;
  amount: number;
  status: string;
  created_at: string;
}

const AdminDashboard: React.FC = () => {
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPackages, setTotalPackages] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [activeSubscriptions, setActiveSubscriptions] = useState(0);
  const [newUsers, setNewUsers] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/admin/dashboard');
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      const data = await response.json();

      setTotalUsers(data.totalUsers);
      setTotalPackages(data.totalPackages);
      setTotalRevenue(data.totalRevenue);
      setActiveSubscriptions(data.activeSubscriptions);
      setNewUsers(data.newUsers);
      setRecentTransactions(data.recentTransactions);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={theme === 'dark' ? 'text-white' : 'text-gray-800'}>
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <div
            className={`${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            } p-4 rounded shadow`}
          >
            <h2 className="text-lg font-semibold">Total Users</h2>
            <p className="text-2xl">{totalUsers}</p>
          </div>
          <div
            className={`${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            } p-4 rounded shadow`}
          >
            <h2 className="text-lg font-semibold">Total Packages</h2>
            <p className="text-2xl">{totalPackages}</p>
          </div>
          <div
            className={`${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            } p-4 rounded shadow`}
          >
            <h2 className="text-lg font-semibold">Total Revenue</h2>
            <p className="text-2xl">${totalRevenue.toFixed(2)}</p>
          </div>
          <div
            className={`${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            } p-4 rounded shadow`}
          >
            <h2 className="text-lg font-semibold">Active Subscriptions</h2>
            <p className="text-2xl">{activeSubscriptions}</p>
          </div>
          <div
            className={`${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            } p-4 rounded shadow`}
          >
            <h2 className="text-lg font-semibold">New Users (30 days)</h2>
            <p className="text-2xl">{newUsers}</p>
          </div>
          <div
            className={`${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            } p-4 rounded shadow`}
          >
            <h2 className="text-lg font-semibold">Recent Transactions</h2>
            <ul className="list-disc list-inside max-h-40 overflow-y-auto">
              {recentTransactions.map((tx) => (
                <li key={tx.id}>
                  {tx.user_name} - ${tx.amount} - {tx.status} - {new Date(tx.created_at).toLocaleDateString()}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;