import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Database, Wifi, AlertTriangle } from 'lucide-react';
import { useSubscriptionStore } from '../pages/subscriptionStore';
import { formatDistanceToNow, format } from 'date-fns';

const Dashboard: React.FC = () => {
  const { activeSubscription, fetchActiveSubscription, isLoading } = useSubscriptionStore();

  useEffect(() => {
    fetchActiveSubscription();
  }, [fetchActiveSubscription]);

  const renderActiveSubscription = () => {
    if (isLoading) {
      return (
        <div className="animate-pulse flex flex-col space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      );
    }

    if (!activeSubscription) {
      return (
        <div className="text-center py-8">
          <div className="flex justify-center mb-4">
            <Wifi className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No active subscription</h3>
          <p className="text-gray-500 mb-6">Purchase a package to get started with our hotspot services.</p>
          <Link
            to="/packages"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Browse Packages
          </Link>
        </div>
      );
    }

    const endTime = new Date(activeSubscription.end_time);
    const timeRemaining = formatDistanceToNow(endTime, { addSuffix: true });
    
    const dataLimit = activeSubscription.package?.data_limit_mb;
    const dataUsed = activeSubscription.data_used_mb;
    
    let dataUsagePercent = 0;
    let dataUsageStatus = 'bg-green-500';
    
    if (dataLimit) {
      dataUsagePercent = Math.min(100, Math.round((dataUsed / dataLimit) * 100));
      
      if (dataUsagePercent > 90) {
        dataUsageStatus = 'bg-red-500';
      } else if (dataUsagePercent > 75) {
        dataUsageStatus = 'bg-yellow-500';
      }
    }

    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {activeSubscription.package?.name}
          </h3>
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            Active
          </span>
        </div>
        
        <div className="space-y-4">
          <div>
            <div className="flex items-center text-sm text-gray-500 mb-1">
              <Clock size={16} className="mr-1" />
              Time Remaining
            </div>
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">{timeRemaining}</div>
              <div className="text-sm text-gray-500">
                Expires: {format(endTime, 'MMM d, yyyy h:mm a')}
              </div>
            </div>
          </div>
          
          {dataLimit && (
            <div>
              <div className="flex items-center text-sm text-gray-500 mb-1">
                <Database size={16} className="mr-1" />
                Data Usage
              </div>
              <div className="mb-1">
                <div className="flex justify-between text-xs mb-1">
                  <span>{dataUsed} MB used</span>
                  <span>{dataLimit} MB total</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${dataUsageStatus}`}
                    style={{ width: `${dataUsagePercent}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {dataLimit - dataUsed} MB remaining
              </div>
            </div>
          )}
          
          {!dataLimit && (
            <div className="flex items-center text-sm text-gray-500">
              <Database size={16} className="mr-1" />
              Unlimited data
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Active Subscription</h2>
            {renderActiveSubscription()}
          </div>
        </div>
        
        <div>
          <div className="bg-white rounded-lg shadow-md p-6 h-full">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                to="/packages"
                className="block w-full text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Buy New Package
              </Link>
              <Link
                to="/subscriptions"
                className="block w-full text-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                View Subscription History
              </Link>
              <Link
                to="/billing"
                className="block w-full text-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Billing History
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-3 text-yellow-600 mb-4">
          <AlertTriangle />
          <h2 className="text-xl font-semibold">Connection Tips</h2>
        </div>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-1">How to connect to our hotspot</h3>
            <p className="text-gray-600">
              Look for the "HotSpot" network in your device's Wi-Fi settings and connect using your account credentials.
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-1">Experiencing slow connection?</h3>
            <p className="text-gray-600">
              Try moving closer to the access point or check if you've reached your data limit.
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-1">Need help?</h3>
            <p className="text-gray-600">
              Contact our support team at support@hotspot.example.com or call us at +1-234-567-8900.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;