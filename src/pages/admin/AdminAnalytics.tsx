import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface UserDataUsage {
  user_id: string;
  data_used: number;
}

interface User {
  id: string;
  is_active: boolean;
}

interface Subscription {
  package_id: string;
}

const AdminAnalytics: React.FC = () => {
  const [moneyReceived, setMoneyReceived] = useState<number>(0);
  const [dataUsage, setDataUsage] = useState<Record<string, number>>({});
  const [userStats, setUserStats] = useState<{ active: number; inactive: number; total: number }>({
    active: 0,
    inactive: 0,
    total: 0,
  });
  const [mostUsedPackage, setMostUsedPackage] = useState<string>('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Fetch total money received
        const { data: transactions, error: transactionsError } = await supabase
          .from('transactions')
          .select('amount');
        if (transactionsError) throw transactionsError;
        if (transactions) {
          const total = transactions.reduce((sum, t) => sum + (t.amount as number), 0);
          setMoneyReceived(total);
        }

        // Fetch data usage per user
        const { data: usageData, error: usageError } = await supabase
          .from<UserDataUsage>('user_data_usage')
          .select('user_id, data_used');
        if (usageError) throw usageError;
        if (usageData) {
          const usageMap: Record<string, number> = {};
          usageData.forEach((item) => {
            usageMap[item.user_id] = item.data_used;
          });
          setDataUsage(usageMap);
        }

        // Fetch user subscription stats
        const { data: users, error: usersError } = await supabase
          .from<User>('users')
          .select('id, is_active');
        if (usersError) throw usersError;
        if (users) {
          const activeCount = users.filter((u) => u.is_active).length;
          const inactiveCount = users.length - activeCount;
          setUserStats({ active: activeCount, inactive: inactiveCount, total: users.length });
        }

        // Fetch most used package
        const { data: packages, error: packagesError } = await supabase
          .from<Subscription>('subscriptions')
          .select('package_id');
        if (packagesError) throw packagesError;
        if (packages) {
          const packageCount: Record<string, number> = {};
          packages.forEach((sub) => {
            packageCount[sub.package_id] = (packageCount[sub.package_id] || 0) + 1;
          });
          const mostUsed = Object.entries(packageCount).sort((a, b) => b[1] - a[1])[0];
          setMostUsedPackage(mostUsed ? mostUsed[0] : '');
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Analytics</h1>
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Money Received</h2>
        <p className="text-lg">${moneyReceived.toFixed(2)}</p>
      </div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold">User Subscription Stats</h2>
        <p>Total Users: {userStats.total}</p>
        <p>Active Users: {userStats.active}</p>
        <p>Inactive Users: {userStats.inactive}</p>
      </div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Most Used Package</h2>
        <p>{mostUsedPackage}</p>
      </div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Data Usage Per User</h2>
        <ul>
          {Object.entries(dataUsage).map(([userId, dataUsed]) => (
            <li key={userId}>
              User {userId}: {dataUsed} MB
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AdminAnalytics;
