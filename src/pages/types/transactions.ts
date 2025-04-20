export interface Transaction {
    transaction_id: string;
    created_at: string;
    amount: number;
    status: 'success' | 'failed' | 'pending';
    payment_method: string;
    merchant_request_id: string;
    checkout_request_id: string;
    mpesa_receipt_number?: string | null;
    userId?: number | null;
    phoneNumber?: string | null;
  }
  
  export interface TransactionResponse {
    ResponseCode: string;
    ResponseDescription: string;
    MerchantRequestID: string;
    CheckoutRequestID: string;
    CustomerMessage?: string;
  }
  export interface TransactionRequest {
    BusinessShortCode: string;
    Password: string;
    Timestamp: string;
    TransactionType: string;
    Amount: number;
    PartyA: string;
    PartyB: string;
    PhoneNumber: string;
    CallBackURL: string;
    AccountReference?: string;
    TransactionDesc?: string;
  }