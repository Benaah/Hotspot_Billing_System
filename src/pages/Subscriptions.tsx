import React, { useEffect } from 'react';
import { Clock, Database, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { useSubscriptionStore } from '../pages/subscriptionStore';
import { format, isAfter } from 'date-fns';

const Subscriptions: React.FC = () => {
  const { subscriptions, fetchUserSubscriptions, isLoading } = useSubscriptionStore();

  useEffect(() => {
    fetchUserSubscriptions();
  }, [fetchUserSubscriptions]);

  if (isLoading && subscriptions.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="flex justify-center mb-4">
          <Calendar className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No subscription history</h3>
        <p className="text-gray-500 mb-6">You haven't purchased any packages yet.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Subscription History</h1>
        <p className="text-gray-600">View all your past and current subscriptions</p>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Package
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purchase Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {subscriptions.map((subscription) => {
                const now = new Date();
                const endTime = new Date(subscription.end_time);
                const isActive = subscription.is_active && isAfter(endTime, now);
                
                return (
                  <tr key={subscription.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {subscription.package?.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        ${subscription.package?.price.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock size={16} className="mr-1" />
                        {subscription.package?.duration_hours} hours
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(subscription.start_time), 'MMM d, h:mm a')} - 
                        {format(new Date(subscription.end_time), 'MMM d, h:mm a')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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