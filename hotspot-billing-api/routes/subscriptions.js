const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// Get user's active subscription
router.get('/active', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT s.id, s.user_id, s.package_id, s.start_time, s.end_time, 
              s.data_used_mb, s.status, s.created_at, s.updated_at,
              p.name as package_name, p.description as package_description, 
              p.price as package_price, p.duration_hours as package_duration_hours,
              p.data_limit_mb as package_data_limit_mb
       FROM subscriptions s
       JOIN packages p ON s.package_id = p.id
       WHERE s.user_id = $1 AND s.status = 'active' AND s.end_time > NOW()
       ORDER BY s.created_at DESC
       LIMIT 1`,
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.json(null);
    }
    
    // Format the response to include package details
    const subscription = result.rows[0];
    const formattedSubscription = {
      id: subscription.id,
      user_id: subscription.user_id,
      package_id: subscription.package_id,
      start_time: subscription.start_time,
      end_time: subscription.end_time,
      data_used_mb: subscription.data_used_mb,
      status: subscription.status,
      created_at: subscription.created_at,
      updated_at: subscription.updated_at,
      package: {
        name: subscription.package_name,
        description: subscription.package_description,
        price: subscription.package_price,
        duration_hours: subscription.package_duration_hours,
        data_limit_mb: subscription.package_data_limit_mb
      }
    };
    
    res.json(formattedSubscription);
  } catch (error) {
    console.error('Get active subscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's subscription history
router.get('/history', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT s.id, s.user_id, s.package_id, s.start_time, s.end_time, 
              s.data_used_mb, s.status, s.created_at, s.updated_at,
              p.name as package_name, p.price as package_price
       FROM subscriptions s
       JOIN packages p ON s.package_id = p.id
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC`,
      [req.user.id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get subscription history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create subscription
router.post('/', auth, async (req, res) => {
  try {
    const { package_id } = req.body;
    
    // Get package details
    const packageResult = await db.query(
      'SELECT * FROM packages WHERE id = $1 AND is_active = true',
      [package_id]
    );
    
    if (packageResult.rows.length === 0) {
      return res.status(404).json({ message: 'Package not found or inactive' });
    }
    
    const packageData = packageResult.rows[0];
    
    // Calculate start and end times
    const startTime = new Date();
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + packageData.duration_hours);
    
    // Begin transaction
    await db.query('BEGIN');
    
    // Create subscription
    const subscriptionResult = await db.query(
      `INSERT INTO subscriptions 
       (user_id, package_id, start_time, end_time, data_used_mb, status)
       VALUES ($1, $2, $3, $4, 0, 'pending')
       RETURNING *`,
      [req.user.id, package_id, startTime, endTime]
    );
    
    const subscription = subscriptionResult.rows[0];
    
    // Create transaction record for this subscription
    await db.query(
      `INSERT INTO transactions 
       (user_id, subscription_id, amount, status, payment_method)
       VALUES ($1, $2, $3, 'pending', 'pending')
       RETURNING id`,
      [req.user.id, subscription.id, packageData.price]
    );
    
    // Commit transaction
    await db.query('COMMIT');
    
    res.status(201).json({
      subscription,
      message: 'Subscription created. Please complete payment to activate.'
    });
  } catch (error) {
    // Rollback transaction on error
    await db.query('ROLLBACK');
    console.error('Create subscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update subscription data usage
router.put('/:id/usage', auth, async (req, res) => {
  try {
    const { data_used_mb } = req.body;
    
    // Verify subscription belongs to user
    const subscriptionCheck = await db.query(
      'SELECT * FROM subscriptions WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    
    if (subscriptionCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Update data usage
    const result = await db.query(
      `UPDATE subscriptions
       SET data_used_mb = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [data_used_mb, req.params.id]
    );
    
    // Log usage
    await db.query(
      `INSERT INTO usage_logs (subscription_id, data_used_mb)
       VALUES ($1, $2)`,
      [req.params.id, data_used_mb]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update usage error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get all subscriptions
router.get('/admin', [auth, admin], async (req, res) => {
  try {
    const result = await db.query(
      `SELECT s.id, s.user_id, s.package_id, s.start_time, s.end_time, 
              s.data_used_mb, s.status, s.created_at, s.updated_at,
              u.email as user_email, u.full_name as user_name,
              p.name as package_name, p.price as package_price
       FROM subscriptions s
       JOIN users u ON s.user_id = u.id
       JOIN packages p ON s.package_id = p.id
       ORDER BY s.created_at DESC`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Admin get subscriptions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;