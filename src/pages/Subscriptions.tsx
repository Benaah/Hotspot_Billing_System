import React, { useEffect } from 'react';
import { Clock, Database, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { useSubscriptionStore } from '../pages/subscriptionStore';
import { format, isAfter } from 'date-fns';
import { useTheme } from '../context/ThemeContext';
import LoadingRouter from '../components/LoadingRouter';

const Subscriptions: React.FC = () => {
  const { subscriptions, fetchUserSubscriptions, isLoading } = useSubscriptionStore();
  const { theme } = useTheme();

  useEffect(() => {
    fetchUserSubscriptions();
  }, [fetchUserSubscriptions]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingRouter size="medium" />
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <div className={`${
        theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
      } rounded-lg shadow-md p-8 text-center`}>
        <div className="flex justify-center mb-4">
          <Calendar className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium mb-2">No subscription history</h3>
        <p className="mb-6">You haven't purchased any packages yet.</p>
      </div>
    );
  }

  return (
    <div className={theme === 'dark' ? 'text-white' : 'text-gray-800'}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Subscription History</h1>
        <p>View all your past and current subscriptions</p>
      </div>

      <div className={`${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      } rounded-lg shadow-md overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Package
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Duration
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Data
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Purchase Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {subscriptions.map((subscription) => {
                const now = new Date();
                const endTime = new Date(subscription.end_time);
                const isActive = subscription.is_active && isAfter(endTime, now);
                
                return (
                  <tr key={subscription.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">
                        {subscription.package?.name}
                      </div>
                      <div className="text-sm">
                        ${subscription.package?.price.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm">
                        <Clock size={16} className="mr-1" />
                        {subscription.package?.duration_hours} hours
                      </div>
                      <div className="text-xs">
                        {format(new Date(subscription.start_time), 'MMM d, h:mm a')} - 
                        {format(new Date(subscription.end_time), 'MMM d, h:mm a')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm">
                        <Database size={16} className="mr-1" />
                        {subscription.package?.data_limit_mb 
                          ? `${subscription.data_used_mb} / ${subscription.package.data_limit_mb} MB` 
                          : 'Unlimited'}
                      </div>
                      {subscription.package?.data_limit_mb && (
                        <div className="w-24 bg-gray-200 rounded-full h-1.5 mt-1">
                          <div 
                            className="h-1.5 rounded-full bg-blue-500"
                            style={{ 
                              width: `${Math.min(100, (subscription.data_used_mb / subscription.package.data_limit_mb) * 100)}%` 
                            }}
                          ></div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {format(new Date(subscription.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isActive ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          <CheckCircle size={14} className="mr-1" />
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          <XCircle size={14} className="mr-1" />
                          Expired
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Subscriptions;