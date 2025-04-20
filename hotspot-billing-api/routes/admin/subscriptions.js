import express from 'express';
const router = express.Router();
import db from '../../db.js';
import auth from '../../middleware/auth.js';
import admin from '../../middleware/admin.js';

// Protect all routes
router.use(auth, admin);

// Get all subscriptions with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status || '';
    const packageId = req.query.packageId || '';
    const userId = req.query.userId || '';
    
    // Build query conditions
    let conditions = [];
    let params = [];
    let paramIndex = 1;
    
    if (status) {
      conditions.push(`s.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }
    
    if (packageId) {
      conditions.push(`s.package_id = $${paramIndex}`);
      params.push(packageId);
      paramIndex++;
    }
    
    if (userId) {
      conditions.push(`s.user_id = $${paramIndex}`);
      params.push(userId);
      paramIndex++;
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Get subscriptions with pagination and filtering
    const query = `
      SELECT s.id, s.user_id, s.package_id, s.start_time, s.end_time, 
             s.data_used_mb, s.status, s.created_at, s.updated_at,
             u.email as user_email, u.full_name as user_name,
             p.name as package_name, p.price as package_price
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      JOIN packages p ON s.package_id = p.id
      ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(limit, offset);
    const subscriptionsResult = await db.query(query, params);
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM subscriptions s
      ${whereClause}
    `;
    
    const countResult = await db.query(countQuery, conditions.length > 0 ? params.slice(0, -2) : []);
    
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      subscriptions: subscriptionsResult.rows,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('Admin get subscriptions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get subscription details
router.get('/:id', async (req, res) => {
  try {
    // Get subscription details
    const subscriptionResult = await db.query(
      `SELECT s.id, s.user_id, s.package_id, s.start_time, s.end_time, 
              s.data_used_mb, s.status, s.created_at, s.updated_at,
              u.email as user_email, u.full_name as user_name, u.phone_number as user_phone,
              p.name as package_name, p.description as package_description, 
              p.price as package_price, p.duration_hours as package_duration,
              p.data_limit_mb as package_data_limit
       FROM subscriptions s
       JOIN users u ON s.user_id = u.id
       JOIN packages p ON s.package_id = p.id
       WHERE s.id = $1`,
      [req.params.id]
    );
    
    if (subscriptionResult.rows.length === 0) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    
    // Get related transactions
    const transactionsResult = await db.query(
      `SELECT id, amount, status, payment_method, created_at, mpesa_receipt_number
       FROM transactions
       WHERE subscription_id = $1
       ORDER BY created_at DESC`,
      [req.params.id]
    );
    
    // Get usage logs if available
    const usageLogsResult = await db.query(
      `SELECT id, data_used_mb, created_at
       FROM usage_logs
       WHERE subscription_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [req.params.id]
    );
    
    res.json({
      subscription: subscriptionResult.rows[0],
      transactions: transactionsResult.rows,
      usageLogs: usageLogsResult.rows
    });
  } catch (error) {
    console.error('Admin get subscription details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create subscription for user
router.post('/', async (req, res) => {
  try {
    const { user_id, package_id, start_time, end_time, status } = req.body;
    
    // Validate user and package
    const userCheck = await db.query('SELECT id FROM users WHERE id = $1', [user_id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const packageCheck = await db.query('SELECT id, price FROM packages WHERE id = $1', [package_id]);
    if (packageCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Package not found' });
    }
    
    // Begin transaction
    await db.query('BEGIN');
    
    // Create subscription
    const subscriptionResult = await db.query(
      `INSERT INTO subscriptions (user_id, package_id, start_time, end_time, data_used_mb, status)
       VALUES ($1, $2, $3, $4, 0, $5)
       RETURNING *`,
      [user_id, package_id, start_time, end_time, status]
    );
    
    // Create transaction record if subscription is active
    if (status === 'active') {
      await db.query(
        `INSERT INTO transactions (user_id, subscription_id, amount, status, payment_method)
         VALUES ($1, $2, $3, 'completed', 'admin')
         RETURNING id`,
        [user_id, subscriptionResult.rows[0].id, packageCheck.rows[0].price]
      );
    }
    
    // Commit transaction
    await db.query('COMMIT');
    
    res.status(201).json({
      subscription: subscriptionResult.rows[0],
      message: 'Subscription created successfully'
    });
  } catch (error) {
    // Rollback transaction on error
    await db.query('ROLLBACK');
    console.error('Admin create subscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update subscription
router.put('/:id', async (req, res) => {
  try {
    const { end_time, data_used_mb, status } = req.body;
    
    const result = await db.query(
      `UPDATE subscriptions
       SET end_time = COALESCE($1, end_time),
           data_used_mb = COALESCE($2, data_used_mb),
           status = COALESCE($3, status),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [end_time, data_used_mb, status, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    
    res.json({
      subscription: result.rows[0],
      message: 'Subscription updated successfully'
    });
  } catch (error) {
    console.error('Admin update subscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel subscription
router.post('/:id/cancel', async (req, res) => {
  try {
    const result = await db.query(
      `UPDATE subscriptions
       SET status = 'cancelled',
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    
    res.json({
      subscription: result.rows[0],
      message: 'Subscription cancelled successfully'
    });
  } catch (error) {
    console.error('Admin cancel subscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Extend subscription
router.post('/:id/extend', async (req, res) => {
  try {
    const { hours } = req.body;
    
    if (!hours || hours <= 0) {
      return res.status(400).json({ message: 'Valid extension hours required' });
    }
    
    // Get current subscription
    const subscriptionCheck = await db.query(
      'SELECT * FROM subscriptions WHERE id = $1',
      [req.params.id]
    );
    
    if (subscriptionCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    
    const subscription = subscriptionCheck.rows[0];
    
    // Calculate new end time
    let newEndTime;
    if (subscription.status === 'expired' || subscription.status === 'cancelled') {
      // If expired or cancelled, start from now
      newEndTime = new Date();
      newEndTime.setHours(newEndTime.getHours() + hours);
    } else {
      // If active, extend from current end time
      newEndTime = new Date(subscription.end_time);
      newEndTime.setHours(newEndTime.getHours() + hours);
    }
    
    // Update subscription
    const result = await db.query(
      `UPDATE subscriptions
       SET end_time = $1,
           status = 'active',
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [newEndTime, req.params.id]
    );
    
    res.json({
      subscription: result.rows[0],
      message: `Subscription extended by ${hours} hours`
    });
  } catch (error) {
    console.error('Admin extend subscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset data usage
router.post('/:id/reset-data', async (req, res) => {
  try {
    const result = await db.query(
      `UPDATE subscriptions
       SET data_used_mb = 0,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    
    res.json({
      subscription: result.rows[0],
      message: 'Data usage reset successfully'
    });
  } catch (error) {
    console.error('Admin reset data usage error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
