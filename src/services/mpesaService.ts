import axios from 'axios';

interface STKPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export class MpesaService {
  private readonly baseUrl = 'https://sandbox.safaricom.co.ke';
  private readonly consumerKey = process.env.REACT_APP_MPESA_CONSUMER_KEY;
  private readonly consumerSecret = process.env.REACT_APP_MPESA_CONSUMER_SECRET;
  private readonly passkey = process.env.REACT_APP_MPESA_PASSKEY;
  private readonly shortcode = process.env.REACT_APP_MPESA_SHORTCODE;
  private readonly callbackUrl = process.env.REACT_APP_MPESA_CALLBACK_URL;

  private async getAccessToken(): Promise<string> {
    const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
    
    const response = await axios.get(
      `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );
    
    return response.data.access_token;
  }

  async initiateSTKPush(phoneNumber: string, amount: number): Promise<STKPushResponse> {
    const accessToken = await this.getAccessToken();
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 14);
    const password = Buffer.from(
      `${this.shortcode}${this.passkey}${timestamp}`
    ).toString('base64');

    const response = await axios.post(
      `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
      {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: phoneNumber,
        PartyB: this.shortcode,
        PhoneNumber: phoneNumber,
        CallBackURL: this.callbackUrl,
        AccountReference: 'HotspotBilling',
        TransactionDesc: 'Payment for internet services'
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.data;
  }

  async b2cPayment(phoneNumber: string, amount: number, remarks: string = 'Payment', occasion: string = ''): Promise<Record<string, unknown>> {
    const accessToken = await this.getAccessToken();

    const payload = {
      InitiatorName: process.env.REACT_APP_MPESA_INITIATOR_NAME,
      SecurityCredential: process.env.REACT_APP_MPESA_SECURITY_CREDENTIAL,
      CommandID: 'BusinessPayment',
      Amount: amount,
      PartyA: this.shortcode,
      PartyB: phoneNumber,
      Remarks: remarks,
      QueueTimeOutURL: `${this.callbackUrl}/timeout`,
      ResultURL: `${this.callbackUrl}/result`,
      Occasion: occasion
    };

    const response = await axios.post(
      `${this.baseUrl}/mpesa/b2c/v1/paymentrequest`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  }

  async b2bPayment(amount: number, partyA: string, partyB: string, accountReference: string, remarks: string = 'Business Payment'): Promise<Record<string, unknown>> {
    const accessToken = await this.getAccessToken();

    const payload = {
      Initiator: process.env.REACT_APP_MPESA_INITIATOR_NAME,
      SecurityCredential: process.env.REACT_APP_MPESA_SECURITY_CREDENTIAL,
      CommandID: 'BusinessToBusinessTransfer',
      SenderIdentifierType: '4',
      RecieverIdentifierType: '4',
      Amount: amount,
      PartyA: partyA,
      PartyB: partyB,
      AccountReference: accountReference,
      Remarks: remarks,
      QueueTimeOutURL: `${this.callbackUrl}/timeout`,
      ResultURL: `${this.callbackUrl}/result`
    };

    const response = await axios.post(
      `${this.baseUrl}/mpesa/b2b/v1/paymentrequest`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  }

  async reversal(transactionID: string, amount: number, receiverParty: string, remarks: string = 'Transaction Reversal', occasion: string = ''): Promise<Record<string, unknown>> {
    const accessToken = await this.getAccessToken();

    const payload = {
      Initiator: process.env.REACT_APP_MPESA_INITIATOR_NAME,
      SecurityCredential: process.env.REACT_APP_MPESA_SECURITY_CREDENTIAL,
      CommandID: 'TransactionReversal',
      TransactionID: transactionID,
      Amount: amount,
      ReceiverParty: receiverParty,
      RecieverIdentifierType: '4',
      ResultURL: `${this.callbackUrl}/result`,
      QueueTimeOutURL: `${this.callbackUrl}/timeout`,
      Remarks: remarks,
      Occasion: occasion
    };

    const response = await axios.post(
      `${this.baseUrl}/mpesa/reversal/v1/request`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  }
}

export const mpesaService = new MpesaService();