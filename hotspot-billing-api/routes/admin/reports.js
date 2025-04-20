import express from 'express';
const router = express.Router();
import db from '../../db.js';
import auth from '../../middleware/auth.js';
import admin from '../../middleware/admin.js';

// Protect all routes
router.use(auth, admin);

// Get all reports summary
router.get('/', async (req, res) => {
  try {
    // Example: Fetch usage statistics, bandwidth usage, financial reports summary
    const usageStats = await db.query(
      `SELECT user_id, COUNT(*) as session_count, SUM(data_used_mb) as total_data_used
       FROM sessions
       GROUP BY user_id`
    );

    const bandwidthUsage = await db.query(
      `SELECT hotspot_id, SUM(data_used_mb) as total_bandwidth
       FROM sessions
       GROUP BY hotspot_id`
    );

    const financialSummary = await db.query(
      `SELECT 
         SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_revenue,
         COUNT(DISTINCT user_id) as paying_customers
       FROM transactions`
    );

    res.json({
      usageStats: usageStats.rows,
      bandwidthUsage: bandwidthUsage.rows,
      financialSummary: financialSummary.rows[0]
    });
  } catch (error) {
    console.error('Admin reports error:', error);
    res.status(500).json({ message: 'Server error fetching reports' });
  }
});

export default router;
