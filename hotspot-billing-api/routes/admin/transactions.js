import express from 'express';
const router = express.Router();
import db from '../../db.js';
import auth from '../../middleware/auth.js';
import admin from '../../middleware/admin.js';

// Protect all routes
router.use(auth, admin);

// Get all transactions with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status || '';
    const paymentMethod = req.query.paymentMethod || '';
    const startDate = req.query.startDate || '';
    const endDate = req.query.endDate || '';
    
    // Build query conditions
    let conditions = [];
    let params = [];
    let paramIndex = 1;
    
    if (status) {
      conditions.push(`t.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }
    
    if (paymentMethod) {
      conditions.push(`t.payment_method = $${paramIndex}`);
      params.push(paymentMethod);
      paramIndex++;
    }
    
    if (startDate) {
      conditions.push(`t.created_at >= $${paramIndex}`);
      params.push(startDate);
      paramIndex++;
    }
    
    if (endDate) {
      conditions.push(`t.created_at <= $${paramIndex}`);
      params.push(endDate);
      paramIndex++;
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Get transactions with pagination and filtering
    const query = `
      SELECT t.id, t.user_id, t.subscription_id, t.amount, t.status, 
             t.payment_method, t.merchant_request_id, t.checkout_request_id, 
             t.mpesa_receipt_number, t.created_at, t.updated_at,
             u.email as user_email, u.full_name as user_name
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(limit, offset);
    const transactionsResult = await db.query(query, params);
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM transactions t
      ${whereClause}
    `;
    
    const countResult = await db.query(countQuery, conditions.length > 0 ? params.slice(0, -2) : []);
    
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      transactions: transactionsResult.rows,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('Admin get transactions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get transaction details
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT t.id, t.user_id, t.subscription_id, t.amount, t.status, 
              t.payment_method, t.merchant_request_id, t.checkout_request_id, 
              t.mpesa_receipt_number, t.phone_number, t.created_at, t.updated_at,
              u.email as user_email, u.full_name as user_name,
              s.package_id, p.name as package_name
       FROM transactions t
       JOIN users u ON t.user_id = u.id
       LEFT JOIN subscriptions s ON t.subscription_id = s.id
       LEFT JOIN packages p ON s.package_id = p.id
       WHERE t.id = $1`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Admin get transaction details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update transaction status
router.put('/:id', async (req, res) => {
  try {
    const { status, mpesa_receipt_number } = req.body;
    
    // Begin transaction
    await db.query('BEGIN');
    
    // Update transaction
    const result = await db.query(
      `UPDATE transactions
       SET status = COALESCE($1, status),
           mpesa_receipt_number = COALESCE($2, mpesa_receipt_number),
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, mpesa_receipt_number, req.params.id]
    );
    
    if (result.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    const transaction = result.rows[0];
    
    // If status changed to completed and has subscription_id, activate the subscription
    if (status === 'completed' && transaction.subscription_id) {
      await db.query(
        `UPDATE subscriptions
         SET status = 'active',
             updated_at = NOW()
         WHERE id = $1`,
        [transaction.subscription_id]
      );
    }
    
    // Commit transaction
    await db.query('COMMIT');
    
    res.json({
      transaction,
      message: 'Transaction updated successfully'
    });
  } catch (error) {
    // Rollback on error
    await db.query('ROLLBACK');
    console.error('Admin update transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create manual transaction
router.post('/', async (req, res) => {
  try {
    const { user_id, subscription_id, amount, payment_method, status } = req.body;
    
    // Validate user
    const userCheck = await db.query('SELECT id FROM users WHERE id = $1', [user_id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Validate subscription if provided
    if (subscription_id) {
      const subscriptionCheck = await db.query('SELECT id FROM subscriptions WHERE id = $1', [subscription_id]);
      if (subscriptionCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Subscription not found' });
      }
    }
    
    // Begin transaction
    await db.query('BEGIN');
    
    // Create transaction
    const result = await db.query(
      `INSERT INTO transactions (user_id, subscription_id, amount, status, payment_method)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user_id, subscription_id, amount, status || 'completed', payment_method || 'admin']
    );
    
    // If transaction is completed and has subscription_id, activate the subscription
    if ((status === 'completed' || !status) && subscription_id) {
      await db.query(
        `UPDATE subscriptions
         SET status = 'active',
             updated_at = NOW()
         WHERE id = $1`,
        [subscription_id]
      );
    }
    
    // Commit transaction
    await db.query('COMMIT');
    
    res.status(201).json({
      transaction: result.rows[0],
      message: 'Transaction created successfully'
    });
  } catch (error) {
    // Rollback on error
    await db.query('ROLLBACK');
    console.error('Admin create transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get transaction statistics
router.get('/stats/summary', async (req, res) => {
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
         TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as month,
         SUM(amount) as revenue
       FROM transactions
       WHERE status = 'completed' AND created_at > NOW() - INTERVAL '6 months'
       GROUP BY DATE_TRUNC('month', created_at)
       ORDER BY DATE_TRUNC('month', created_at)`
    );
    
    res.json({
      totalRevenue: parseFloat(revenueResult.rows[0].total_revenue || 0),
      transactionsByStatus: statusCountResult.rows,
      transactionsByMethod: methodCountResult.rows,
      monthlyRevenue: monthlyRevenueResult.rows
    });
  } catch (error) {
    console.error('Admin get transaction stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;