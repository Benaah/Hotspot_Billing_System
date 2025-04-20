import express from 'express';
const router = express.Router();
import db from '../../db.js';
import auth from '../../middleware/auth.js';
import admin from '../../middleware/admin.js';

// Protect all routes
router.use(auth, admin);

// Get all promotions
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM promotions ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Get promotions error:', error);
    res.status(500).json({ message: 'Server error fetching promotions' });
  }
});

// Create new promotion
router.post('/', async (req, res) => {
  try {
    const { title, message, is_active } = req.body;
    const result = await db.query(
      `INSERT INTO promotions (title, message, is_active, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [title, message, is_active]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create promotion error:', error);
    res.status(500).json({ message: 'Server error creating promotion' });
  }
});

// Update promotion
router.put('/:id', async (req, res) => {
  try {
    const { title, message, is_active } = req.body;
    const result = await db.query(
      `UPDATE promotions
       SET title = COALESCE($1, title),
           message = COALESCE($2, message),
           is_active = COALESCE($3, is_active),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [title, message, is_active, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Promotion not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update promotion error:', error);
    res.status(500).json({ message: 'Server error updating promotion' });
  }
});

// Delete promotion
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM promotions WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Promotion not found' });
    }
    res.json({ message: 'Promotion deleted successfully' });
  } catch (error) {
    console.error('Delete promotion error:', error);
    res.status(500).json({ message: 'Server error deleting promotion' });
  }
});

export default router;
