import React, { useEffect, useState } from 'react';
import { Bar, Pie } from 'react-chartjs-2';

interface Transaction {
  date?: string;
  label?: string;
  amount: number;
}

interface Usage {
  label: string;
  value: number;
}

interface User {
  name?: string;
  label?: string;
  count: number;
}

interface Package {
  name?: string;
  label?: string;
  count: number;
}

const AdminAnalytics: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [usageData, setUsageData] = useState<Usage[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/admin/analytics');
      if (!response.ok) throw new Error('Failed to fetch analytics data');
      const data = await response.json();

      setTransactions(data.transactions);
      setUsageData(data.usageData);
      setUsers(data.users);
      setPackages(data.packages);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // Chart data and options would be constructed here based on fetched data


  // Prepare chart data for transactions (Bar chart)
  const transactionLabels = transactions.map(t => t.date || t.label || '');
  const transactionAmounts = transactions.map(t => t.amount || 0);

  const transactionData = {
    labels: transactionLabels,
    datasets: [
      {
        label: 'Transactions',
        data: transactionAmounts,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
      },
    ],
  };

  const transactionOptions = {
    responsive: true,
    plugins: {
      legend: { display: true, position: 'top' as const },
      title: { display: true, text: 'Transactions Over Time' },
    },
  };

  // Prepare chart data for usageData (Bar chart)
  const usageLabels = usageData.map(u => u.label || '');
  const usageValues = usageData.map(u => u.value || 0);

  const usageChartData = {
    labels: usageLabels,
    datasets: [
      {
        label: 'Usage',
        data: usageValues,
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
      },
    ],
  };

  const usageChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: true, position: 'top' as const },
      title: { display: true, text: 'Usage Data' },
    },
  };

  // Prepare chart data for users (Pie chart)
  const userLabels = users.map(u => u.name || u.label || '');
  const userCounts = users.map(u => u.count || 0);

  const userChartData = {
    labels: userLabels,
    datasets: [
      {
        label: 'Users',
        data: userCounts,
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
        ],
      },
    ],
  };

  const userChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: true, position: 'right' as const },
      title: { display: true, text: 'User Distribution' },
    },
  };

  // Prepare chart data for packages (Pie chart)
  const packageLabels = packages.map(p => p.name || p.label || '');
  const packageCounts = packages.map(p => p.count || 0);

  const packageChartData = {
    labels: packageLabels,
    datasets: [
      {
        label: 'Packages',
        data: packageCounts,
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
        ],
      },
    ],
  };

  const packageChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: true, position: 'right' as const },
      title: { display: true, text: 'Package Distribution' },
    },
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Admin Analytics</h1>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          <div>
            <Bar data={transactionData} options={transactionOptions} />
          </div>
          <div>
            <Bar data={usageChartData} options={usageChartOptions} />
          </div>
          <div>
            <Pie data={userChartData} options={userChartOptions} />
          </div>
          <div>
            <Pie data={packageChartData} options={packageChartOptions} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnalytics;
