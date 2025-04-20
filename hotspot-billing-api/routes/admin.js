import express from 'express';
const router = express.Router();
import db from '../db.js';
import auth from '../middleware/auth.js';
import admin from '../middleware/admin.js';

// Protect all admin routes with auth and admin middleware
router.use(auth, admin);

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

export default router;
