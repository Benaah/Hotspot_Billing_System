import React, { useEffect, useState } from 'react';
import { Clock, Database, Check, CreditCard } from 'lucide-react';
import { usePackageStore } from './store/packageStore';
import { useTheme } from '../context/ThemeContext';
import type { Package } from './types';
import LoadingRouter from '../components/LoadingRouter';

const Packages: React.FC = () => {
  const { packages, fetchPackages, purchasePackage, isLoading, error } = usePackageStore();
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const handlePurchase = async () => {
    if (!selectedPackage) return;
    
    setIsProcessing(true);
    const success = await purchasePackage(selectedPackage.id.toString(), paymentMethod);
    setIsProcessing(false);
    
    if (success) {
      setPurchaseSuccess(true);
      setTimeout(() => {
        setPurchaseSuccess(false);
        setSelectedPackage(null);
      }, 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingRouter size="medium" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-md">
        Error loading packages: {error}
      </div>
    );
  }

  return (
    <div className={theme === 'dark' ? 'text-white' : 'text-gray-800'}>
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${
          theme === 'dark' ? 'text-white' : 'text-gray-800'
        } mb-2`}>Internet Packages</h1>
        <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
          Choose the perfect package for your needs
        </p>
      </div>

      {purchaseSuccess && (
        <div className="bg-green-50 text-green-600 p-4 rounded-md mb-6 flex items-center">
          <Check className="mr-2" />
          Package purchased successfully! Your connection is now active.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {packages.map((pkg) => (
          <div 
            key={pkg.id}
            className={`bg-white rounded-lg shadow-md overflow-hidden transition-all ${
              selectedPackage?.id === pkg.id ? 'ring-2 ring-blue-500 transform scale-105' : 'hover:shadow-lg'
            }`}
            onClick={() => setSelectedPackage(pkg)}
          >
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">{pkg.name}</h3>
              <p className="text-gray-600 mb-4">{pkg.description}</p>
              
              <div className="text-3xl font-bold text-blue-600 mb-4">
                ${pkg.price.toFixed(2)}
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-gray-700">
                  <Clock size={18} className="mr-2 text-blue-500" />
                  <span>{pkg.duration_hours} hours</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Database size={18} className="mr-2 text-blue-500" />
                  <span>
                    {pkg.data_limit_mb ? `${pkg.data_limit_mb} MB data` : 'Unlimited data'}
                  </span>
                </div>
              </div>
              
              <button
                className={`w-full py-2 px-4 rounded-md font-medium ${
                  selectedPackage?.id === pkg.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
                onClick={() => setSelectedPackage(pkg)}
              >
                {selectedPackage?.id === pkg.id ? 'Selected' : 'Select Package'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedPackage && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Complete Your Purchase</h2>
          
          <div className="mb-6">
            <h3 className="font-medium mb-2">Selected Package</h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex justify-between mb-2">
                <span className="font-medium">{selectedPackage.name}</span>
                <span className="font-bold">${selectedPackage.price.toFixed(2)}</span>
              </div>
              <div className="text-sm text-gray-600">
                {selectedPackage.duration_hours} hours, 
                {selectedPackage.data_limit_mb 
                  ? ` ${selectedPackage.data_limit_mb} MB data` 
                  : ' Unlimited data'}
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="font-medium mb-2">Payment Method</h3>
            <div className="space-y-2">
              <label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="credit_card"
                  checked={paymentMethod === 'credit_card'}
                  onChange={() => setPaymentMethod('credit_card')}
                  className="h-4 w-4 text-blue-600"
                />
                <CreditCard size={20} className="ml-2 mr-2 text-gray-500" />
                <span>Credit Card</span>
              </label>
              
              <label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="mobile_money"
                  checked={paymentMethod === 'mobile_money'}
                  onChange={() => setPaymentMethod('mobile_money')}
                  className="h-4 w-4 text-blue-600"
                />
                <span className="ml-2 mr-2 h-5 w-5 flex items-center justify-center bg-green-500 text-white rounded-full text-xs">M</span>
                <span>Mobile Money</span>
              </label>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              className="mr-3 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              onClick={() => setSelectedPackage(null)}
            >
              Cancel
            </button>
            <button
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              onClick={handlePurchase}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : `Pay $${selectedPackage.price.toFixed(2)}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Packages;