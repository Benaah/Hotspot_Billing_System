import express from 'express';
const router = express.Router();
import db from '../db.js';

// Get all active promotions for users
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM promotions WHERE is_active = true ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Get promotions error:', error);
    res.status(500).json({ message: 'Server error fetching promotions' });
  }
});

export default router;
