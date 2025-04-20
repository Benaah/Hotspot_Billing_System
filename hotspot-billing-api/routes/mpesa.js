import express from 'express';
import axios from 'axios';
import db from '../db.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// M-Pesa credentials
const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const MPESA_PASSKEY = process.env.MPESA_PASSKEY;
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE;
const MPESA_CALLBACK_URL = process.env.MPESA_CALLBACK_URL;

// Get OAuth token
const getAccessToken = async () => {
  try {
    const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');
    const response = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${auth}`
        }
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error('M-Pesa token error:', error);
    throw new Error('Failed to get M-Pesa access token');
  }
};

// Initiate STK Push
router.post('/stkpush', auth, async (req, res) => {
  try {
    const { phoneNumber, amount, subscriptionId } = req.body;
    
    // Format phone number (remove leading 0 or +254)
    const formattedPhone = phoneNumber.replace(/^(?:\+254|0)/, '254');
    
    // Generate timestamp
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    
    // Generate password
    const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString('base64');
    
    // Get access token
    const accessToken = await getAccessToken();
    
    // Make STK Push request
    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        BusinessShortCode: MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: formattedPhone,
        PartyB: MPESA_SHORTCODE,
        PhoneNumber: formattedPhone,
        CallBackURL: MPESA_CALLBACK_URL,
        AccountReference: 'Hotspot Billing',
        TransactionDesc: 'Payment for internet service'
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Create transaction record
    const transactionResult = await db.query(
      `INSERT INTO transactions 
       (user_id, subscription_id, amount, status, payment_method, merchant_request_id, checkout_request_id, phone_number)
       VALUES ($1, $2, $3, 'pending', 'mpesa', $4, $5, $6)
       RETURNING *`,
      [
              req.user.id, 
              subscriptionId, 
              amount, 
              response.data.MerchantRequestID, 
              response.data.CheckoutRequestID,
              formattedPhone
            ]
          )
    
          res.json({
            success: true,
            message: 'STK push initiated successfully',
            data: {
              MerchantRequestID: response.data.MerchantRequestID,
              CheckoutRequestID: response.data.CheckoutRequestID,
              ResponseCode: response.data.ResponseCode,
              ResponseDescription: response.data.ResponseDescription,
              transaction: transactionResult.rows[0]
            }
          })
        } catch (error) {
          console.error('STK push error:', error.response?.data || error.message)
          res.status(500).json({ 
            success: false, 
            message: 'Failed to initiate payment',
            error: error.response?.data || error.message
          })
        }
})

// M-Pesa callback endpoint
router.post('/callback', async (req, res) => {
        try {
          const { Body } = req.body
    
          // Log the callback for debugging
          console.log('M-Pesa callback received:', JSON.stringify(req.body))
    
          // Check if it's a successful transaction
          if (Body.stkCallback.ResultCode === 0) {
            const callbackData = Body.stkCallback
            const checkoutRequestId = callbackData.CheckoutRequestID
      
            // Extract M-Pesa receipt number and amount from callback metadata
            let mpesaReceiptNumber = ''
            let amount = 0
      
            callbackData.CallbackMetadata.Item.forEach(item => {
              if (item.Name === 'MpesaReceiptNumber') {
                mpesaReceiptNumber = item.Value
              } else if (item.Name === 'Amount') {
                amount = item.Value
              }
            })
      
            // Update transaction status
            const transactionResult = await db.query(
              `UPDATE transactions 
               SET status = 'completed', 
                   mpesa_receipt_number = $1, 
                   updated_at = NOW()
               WHERE checkout_request_id = $2
               RETURNING *`,
              [mpesaReceiptNumber, checkoutRequestId]
            )
      
            if (transactionResult.rows.length > 0) {
              const transaction = transactionResult.rows[0]
        
              // If transaction is for a subscription, activate it
              if (transaction.subscription_id) {
                await db.query(
                  `UPDATE subscriptions 
                   SET status = 'active', 
                       updated_at = NOW()
                   WHERE id = $1`,
                  [transaction.subscription_id]
                )
              }
            }
          } else {
            // Failed transaction
            await db.query(
              `UPDATE transactions 
               SET status = 'failed', 
                   updated_at = NOW()
               WHERE checkout_request_id = $1`,
              [Body.stkCallback.CheckoutRequestID]
            )
          }
    
          // Respond to M-Pesa
          res.json({ ResultCode: 0, ResultDesc: 'Accepted' })
        } catch (error) {
          console.error('M-Pesa callback error:', error)
          res.status(500).json({ ResultCode: 1, ResultDesc: 'Rejected' })
        }
})

// Query transaction status
router.get('/status/:checkoutRequestId', auth, async (req, res) => {
        try {
          // First check our database
          const dbResult = await db.query(
            `SELECT * FROM transactions WHERE checkout_request_id = $1 AND user_id = $2`,
            [req.params.checkoutRequestId, req.user.id]
          )
    
          if (dbResult.rows.length === 0) {
            return res.status(404).json({ message: 'Transaction not found' })
          }
    
          const transaction = dbResult.rows[0]
    
          // If transaction is already completed or failed, return it
          if (transaction.status !== 'pending') {
            return res.json(transaction)
          }
    
          // Otherwise, query M-Pesa for status
          const accessToken = await getAccessToken()
          const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3)
          const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString('base64')
    
          const response = await axios.post(
            'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
            {
              BusinessShortCode: MPESA_SHORTCODE,
              Password: password,
              Timestamp: timestamp,
              CheckoutRequestID: req.params.checkoutRequestId
            },
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              }
            }
          )
    
          // Update transaction based on query response
          if (response.data.ResultCode === 0) {
            await db.query(
              `UPDATE transactions 
               SET status = 'completed', 
                   updated_at = NOW()
               WHERE checkout_request_id = $1`,
              [req.params.checkoutRequestId]
            )
      
            transaction.status = 'completed'
          } else if (response.data.ResultCode === 1032) {
            // Transaction cancelled or timed out
            await db.query(
              `UPDATE transactions 
               SET status = 'failed', 
                   updated_at = NOW()
               WHERE checkout_request_id = $1`,
              [req.params.checkoutRequestId]
            )
      
            transaction.status = 'failed'
          }
    
          res.json({
            transaction,
            mpesaResponse: response.data
          })
        } catch (error) {
          console.error('Query transaction status error:', error.response?.data || error.message)
          res.status(500).json({ message: 'Failed to query transaction status' })
        }
})

export default router;
