const express = require('express');
const router = express.Router();
const db = require('../../db');
const auth = require('../../middleware/auth');
const admin = require('../../middleware/admin');

// Protect all routes
router.use(auth, admin);

// Get all packages with subscription counts
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.id, p.name, p.description, p.price, p.duration_hours, 
              p.data_limit_mb, p.is_active, p.created_at, p.updated_at,
              COUNT(s.id) as subscription_count
       FROM packages p
       LEFT JOIN subscriptions s ON p.id = s.package_id
       GROUP BY p.id
       ORDER BY p.created_at DESC`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Admin get packages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get package details with active subscriptions
router.get('/:id', async (req, res) => {
  try {
    // Get package details
    const packageResult = await db.query(
      `SELECT id, name, description, price, duration_hours, 
              data_limit_mb, is_active, created_at, updated_at
       FROM packages
       WHERE id = $1`,
      [req.params.id]
    );
    
    if (packageResult.rows.length === 0) {
      return res.status(404).json({ message: 'Package not found' });
    }
    
    // Get active subscriptions for this package
    const subscriptionsResult = await db.query(
      `SELECT s.id, s.user_id, s.start_time, s.end_time, 
              s.data_used_mb, s.status, s.created_at,
              u.email as user_email, u.full_name as user_name
       FROM subscriptions s
       JOIN users u ON s.user_id = u.id
       WHERE s.package_id = $1 AND s.status = 'active'
       ORDER BY s.created_at DESC
       LIMIT 10`,
      [req.params.id]
    );
    
    // Get subscription stats
    const statsResult = await db.query(
      `SELECT 
         COUNT(*) as total_subscriptions,
         COUNT(CASE WHEN status = 'active' THEN 1 END) as active_subscriptions,
         COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_subscriptions,
         SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END)::float / 
           NULLIF(COUNT(*), 0) * 100 as active_percentage
       FROM subscriptions
       WHERE package_id = $1`,
      [req.params.id]
    );
    
    res.json({
      package: packageResult.rows[0],
      activeSubscriptions: subscriptionsResult.rows,
      stats: statsResult.rows[0]
    });
  } catch (error) {
    console.error('Admin get package details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create package
router.post('/', async (req, res) => {
  try {
    const { name, description, price, duration_hours, data_limit_mb, is_active } = req.body;
    
    const result = await db.query(
      `INSERT INTO packages (name, description, price, duration_hours, data_limit_mb, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, description, price, duration_hours, data_limit_mb, is_active]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Admin create package error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update package
router.put('/:id', async (req, res) => {
  try {
    const { name, description, price, duration_hours, data_limit_mb, is_active } = req.body;
    
    const result = await db.query(
      `UPDATE packages
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           price = COALESCE($3, price),
           duration_hours = COALESCE($4, duration_hours),
           data_limit_mb = COALESCE($5, data_limit_mb),
           is_active = COALESCE($6, is_active),
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [name, description, price, duration_hours, data_limit_mb, is_active, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Package not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Admin update package error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete package (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    // Check if package has active subscriptions
    const activeCheck = await db.query(
      `SELECT COUNT(*) as count
       FROM subscriptions
       WHERE package_id = $1 AND status = 'active'`,
      [req.params.id]
    );
    
    if (parseInt(activeCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete package with active subscriptions',
        activeSubscriptions: parseInt(activeCheck.rows[0].count)
      });
    }
    
    // Soft delete by setting is_active to false
    const result = await db.query(
      `UPDATE packages
       SET is_active = false,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Package not found' });
    }
    
    res.json({ message: 'Package deleted successfully' });
  } catch (error) {
    console.error('Admin delete package error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;