import express from 'express';
const router = express.Router();
import db from '../db.js';
import auth from '../middleware/auth.js';
import admin from '../middleware/admin.js';
import reportsRouter from './admin/reports.js';
import customerSupportRouter from './admin/customerSupport.js';
import promotionsRouter from './admin/promotions.js';
import hotspotDevicesRouter from './admin/hotspotDevices.js';

// Protect all admin routes with auth and admin middleware
router.use(auth, admin);

// Mount reports router
router.use('/reports', reportsRouter);
router.use('/customer-support', customerSupportRouter);
router.use('/promotions', promotionsRouter);
router.use('/hotspot-devices', hotspotDevicesRouter);

// Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    // Get total users count
    const usersResult = await db.query('SELECT COUNT(*) as total FROM users');
    
    // Get active subscriptions count
    const activeSubsResult = await db.query(
      "SELECT COUNT(*) as total FROM subscriptions WHERE status = 'active'"
    );
    
    // Get total revenue
    const revenueResult = await db.query(
      "SELECT SUM(amount) as total FROM transactions WHERE status = 'completed'"
    );
    
    // Get new users in last 30 days
    const newUsersResult = await db.query(
      "SELECT COUNT(*) as total FROM users WHERE created_at > NOW() - INTERVAL '30 days'"
    );
    
    // Get recent transactions
    const recentTransactionsResult = await db.query(
      `SELECT t.id, t.amount, t.status, t.payment_method, t.created_at, 
              u.email as user_email, u.full_name as user_name
       FROM transactions t
       JOIN users u ON t.user_id = u.id
       ORDER BY t.created_at DESC
       LIMIT 5`
    );
    
    res.json({
      totalUsers: parseInt(usersResult.rows[0].total),
      activeSubscriptions: parseInt(activeSubsResult.rows[0].total),
      totalRevenue: parseFloat(revenueResult.rows[0].total || 0),
      newUsers: parseInt(newUsersResult.rows[0].total),
      recentTransactions: recentTransactionsResult.rows
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get analytics data
router.get('/analytics', async (req, res) => {
  try {
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
    
    // Get user signups by month
    const userSignupsResult = await db.query(
      `SELECT 
         TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as month,
         COUNT(*) as count
       FROM users
       WHERE created_at > NOW() - INTERVAL '6 months'
       GROUP BY DATE_TRUNC('month', created_at)
       ORDER BY DATE_TRUNC('month', created_at)`
    );
    
    // Get package popularity
    const packagePopularityResult = await db.query(
      `SELECT 
         p.name,
         COUNT(s.id) as subscriptions
       FROM packages p
       LEFT JOIN subscriptions s ON p.id = s.package_id
       GROUP BY p.id, p.name
       ORDER BY COUNT(s.id) DESC`
    );
    
    // Get payment method distribution
    const paymentMethodsResult = await db.query(
      `SELECT 
         payment_method,
         COUNT(*) as count
       FROM transactions
       WHERE status = 'completed'
       GROUP BY payment_method`
    );
    
    res.json({
      monthlyRevenue: monthlyRevenueResult.rows,
      userSignups: userSignupsResult.rows,
      packagePopularity: packagePopularityResult.rows,
      paymentMethods: paymentMethodsResult.rows
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const result = await db.query('SELECT id, email, full_name, phone_number, is_active, created_at, role FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

// Update user details
router.put('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const { email, full_name, phone_number, role, is_active } = req.body;

    await db.query(
      'UPDATE users SET email = $1, full_name = $2, phone_number = $3, role = $4, is_active = $5 WHERE id = $6',
      [email, full_name, phone_number, role, is_active, userId]
    );

    res.status(200).json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error updating user' });
  }
});

// Toggle user active status
router.post('/users/:id/toggleStatus', async (req, res) => {
  try {
    const userId = req.params.id;

    // Get current status
    const result = await db.query('SELECT is_active FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentStatus = result.rows[0].is_active;
    const newStatus = !currentStatus;

    await db.query('UPDATE users SET is_active = $1 WHERE id = $2', [newStatus, userId]);

    res.status(200).json({ message: 'User status updated successfully', is_active: newStatus });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ message: 'Server error toggling user status' });
  }
});

export default router;
