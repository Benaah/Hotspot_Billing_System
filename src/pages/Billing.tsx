import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { useAuthStore } from './store/authStore';
import { useTheme } from '../context/ThemeContext';
import { transactionService } from '../services/transactionService';
import { mpesaService } from '../services/mpesaService';
import LoadingRouter from '../components/LoadingRouter';

interface Transaction {
  transaction_id: string;
  created_at: string;
  amount: number;
  status: 'success' | 'failed' | 'pending';
  payment_method: string;
  merchant_request_id: string;
  checkout_request_id: string;
  mpesa_receipt_number?: string;
  userId?: number;
  phoneNumber?: string;
}

const Billing: React.FC = () => {
  const { user } = useAuthStore();
  const { theme } = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      if (!user) throw new Error('User not authenticated');
      const transactions = await transactionService.getUserTransactions(Number(user.id));
      setTransactions(transactions);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user, fetchTransactions]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!user) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    // Validate phone number format (Safaricom)
    const phoneRegex = /^(?:254|\+254|0)?([71](?:(?:[0-9][0-9])|(?:0[0-8]))[0-9]{6})$/;
    if (!phoneRegex.test(phoneNumber)) {
      setError('Invalid phone number format');
      setLoading(false);
      return;
    }

    // Format phone number to required format (254XXXXXXXXX)
    const formattedPhone = phoneNumber.replace(/^(?:\+254|0)/, '254');

    try {
      const response = await mpesaService.initiateSTKPush(formattedPhone, Number(amount));

      if (response.ResponseCode === '0') {
        setSuccess('Payment initiated successfully. Please check your phone to complete the transaction.');
        
        // Store transaction details in your backend with proper type conversion
        await transactionService.createTransaction({
          userId: parseInt(String(user.id), 10), // Convert to number explicitly
          amount: Number(amount),
          phoneNumber: formattedPhone,
          merchantRequestId: response.MerchantRequestID,
          checkoutRequestId: response.CheckoutRequestID
        });

        // Update transaction history
        fetchTransactions();
      } else {
        throw new Error(response.ResponseDescription || 'Payment initiation failed');
      }
    } catch (err) {
      setError('Payment failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div>Please log in to view your billing information.</div>;
  }

  return (
    <div className={`container mx-auto p-6 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
      <h1 className="text-2xl font-bold mb-6">M-Pesa Payment</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {loading && <LoadingRouter />}

      <form onSubmit={handlePayment} className="max-w-md">
        <div className="mb-4">
          <label htmlFor="phoneNumber" className="block text-sm font-medium mb-1">
            Phone Number
          </label>
          <input
            id="phoneNumber"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="254700000000"
            className="w-full px-4 py-2 border rounded-md"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="amount" className="block text-sm font-medium mb-1">
            Amount (KES)
          </label>
          <input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-2 border rounded-md"
            required
            min="1"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Processing...' : 'Pay with M-Pesa'}
        </button>
      </form>

      <h1 className="text-2xl font-bold mb-4">Billing History</h1>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <LoadingRouter size="large" />
        </div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left">Date</th>
              <th className="px-6 py-3 text-left">Amount</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Receipt No.</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.transaction_id} className="hover:bg-gray-50">
                <td className="px-6 py-4">{format(new Date(tx.created_at), 'PPP')}</td>
                <td className="px-6 py-4">KES {tx.amount.toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    tx.status === 'success' ? 'bg-green-100 text-green-800' :
                    tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {tx.status}
                  </span>
                </td>
                <td className="px-6 py-4">{tx.mpesa_receipt_number || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Billing;