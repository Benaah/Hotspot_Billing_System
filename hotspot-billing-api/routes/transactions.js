import express from 'express';
import db from '../db.js';
import auth from '../middleware/auth.js';
import admin from '../middleware/admin.js';

const router = express.Router();

// Get user transactions
router.get('/user/:userId', auth, async (req, res) => {
  try {
    // Check if user is requesting their own transactions or is admin
    if (req.user.id !== req.params.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const result = await db.query(
      `SELECT t.id, t.user_id, t.subscription_id, t.amount, t.status, 
              t.payment_method, t.merchant_request_id, t.checkout_request_id, 
              t.mpesa_receipt_number, t.created_at
       FROM transactions t
       WHERE t.user_id = $1
       ORDER BY t.created_at DESC`,
      [req.params.userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get user transactions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create transaction
router.post('/', auth, async (req, res) => {
  try {
    const { 
      userId, 
      subscriptionId, 
      amount, 
      paymentMethod, 
      merchantRequestId, 
      checkoutRequestId,
      phoneNumber 
    } = req.body;
    
    // Ensure user can only create transactions for themselves
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const result = await db.query(
      `INSERT INTO transactions 
       (user_id, subscription_id, amount, status, payment_method, 
        merchant_request_id, checkout_request_id, phone_number)
       VALUES ($1, $2, $3, 'pending', $4, $5, $6, $7)
       RETURNING *`,
      [userId, subscriptionId, amount, paymentMethod, merchantRequestId, checkoutRequestId, phoneNumber]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update transaction status (for M-Pesa callback)
router.put('/mpesa-callback', async (req, res) => {
  try {
    const { 
      CheckoutRequestID, 
      ResultCode, 
      ResultDesc, 
      MpesaReceiptNumber 
    } = req.body.Body.stkCallback;
    
    // Determine status based on result code
    const status = ResultCode === 0 ? 'completed' : 'failed';
    
    // Update transaction
    const result = await db.query(
      `UPDATE transactions 
       SET status = $1, 
           mpesa_receipt_number = $2, 
           updated_at = NOW()
       WHERE checkout_request_id = $3
       RETURNING *`,
      [status, MpesaReceiptNumber, CheckoutRequestID]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    // If payment was successful and for a subscription, activate the subscription
    if (status === 'completed' && result.rows[0].subscription_id) {
      await db.query(
        `UPDATE subscriptions 
         SET status = 'active', 
             updated_at = NOW()
         WHERE id = $1`,
        [result.rows[0].subscription_id]
      );
    }
    
    res.json({ message: 'Transaction updated successfully' });
  } catch (error) {
    console.error('M-Pesa callback error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all transactions (admin only)
router.get('/', [auth, admin], async (req, res) => {
  try {
    const result = await db.query(
      `SELECT t.id, t.user_id, t.subscription_id, t.amount, t.status, 
              t.payment_method, t.merchant_request_id, t.checkout_request_id, 
              t.mpesa_receipt_number, t.created_at, t.updated_at,
              u.email as user_email, u.full_name as user_name
       FROM transactions t
       JOIN users u ON t.user_id = u.id
       ORDER BY t.created_at DESC`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get all transactions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get transaction by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT t.id, t.user_id, t.subscription_id, t.amount, t.status, 
              t.payment_method, t.merchant_request_id, t.checkout_request_id, 
              t.mpesa_receipt_number, t.created_at, t.updated_at
       FROM transactions t
       WHERE t.id = $1`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    const transaction = result.rows[0];
    
    // Check if user is authorized to view this transaction
    if (req.user.id !== transaction.user_id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    res.json(transaction);
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Update transaction status
router.put('/:id', [auth, admin], async (req, res) => {
  try {
    const { status, mpesa_receipt_number, phone_number } = req.body;
    
    const result = await db.query(
      `UPDATE transactions 
       SET status = $1, 
           mpesa_receipt_number = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, mpesa_receipt_number, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    // If payment was successful and for a subscription, activate the subscription
    if (status === 'completed' && result.rows[0].subscription_id) {
      await db.query(
        `UPDATE subscriptions 
         SET status = 'active', 
             updated_at = NOW()
         WHERE id = $1`,
        [result.rows[0].subscription_id]
      );
    }
    
    // Send WhatsApp message about transaction status
    if (phone_number) {
      try {
        await whatsappService.sendTransactionStatus(phone_number, result.rows[0]);
      } catch (err) {
        console.error('Failed to send WhatsApp transaction status:', err);
      }
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get transaction statistics (admin only)
router.get('/stats/summary', [auth, admin], async (req, res) => {
  try {
    // Get total revenue
    const revenueResult = await db.query(
      `SELECT SUM(amount) as total_revenue
       FROM transactions
       WHERE status = 'completed'`
    );
    
    // Get transaction counts by status
    const statusCountResult = await db.query(
      `SELECT status, COUNT(*) as count
       FROM transactions
       GROUP BY status`
    );
    
    // Get transaction counts by payment method
    const methodCountResult = await db.query(
      `SELECT payment_method, COUNT(*) as count
       FROM transactions
       WHERE status = 'completed'
       GROUP BY payment_method`
    );
    
    // Get monthly revenue for the last 6 months
    const monthlyRevenueResult = await db.query(
      `SELECT 
         DATE_TRUNC('month', created_at) as month,
         SUM(amount) as revenue
       FROM transactions
       WHERE status = 'completed' AND created_at > NOW() - INTERVAL '6 months'
       GROUP BY month
       ORDER BY month`
    );
    
    res.json({
      totalRevenue: revenueResult.rows[0].total_revenue || 0,
      transactionsByStatus: statusCountResult.rows,
      transactionsByMethod: methodCountResult.rows,
      monthlyRevenue: monthlyRevenueResult.rows
    });
  } catch (error) {
    console.error('Get transaction stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;