import api from './api';
import { Transaction } from '../pages/types';

// Define interfaces for the request and response data
interface CreateTransactionRequest {
  userId: number;
  subscriptionId?: string;
  amount: number;
  paymentMethod: string;
  merchantRequestId?: string;
  checkoutRequestId?: string;
  phoneNumber?: string;
}

interface TransactionResponse {
  id: string;
  user_id: string;
  subscription_id?: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  payment_method: string;
  merchant_request_id?: string;
  checkout_request_id?: string;
  mpesa_receipt_number?: string;
  created_at: string;
  phone_number?: string;
}

export const transactionService = {
  getUserTransactions: async (userId: number): Promise<Transaction[]> => {
    try {
      const response = await api.get(`/transactions/user/${userId}`);
      
      // Map the API response to match the Transaction interface in Billing.tsx
      return response.data.map((tx: TransactionResponse) => ({
        transaction_id: tx.id,
        created_at: tx.created_at,
        amount: tx.amount,
        status: tx.status === 'completed' ? 'success' : tx.status === 'pending' ? 'pending' : 'failed',
        payment_method: tx.payment_method,
        merchant_request_id: tx.merchant_request_id || '',
        checkout_request_id: tx.checkout_request_id || '',
        mpesa_receipt_number: tx.mpesa_receipt_number,
        userId: tx.user_id ? Number(tx.user_id) : undefined,
        phoneNumber: tx.phone_number
      }));
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  },
  
  createTransaction: async (transactionData: CreateTransactionRequest): Promise<TransactionResponse> => {
    try {
      const response = await api.post('/transactions', transactionData);
      return response.data;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }
};