import express from 'express';
const router = express.Router();
import db from '../../db.js';
import auth from '../../middleware/auth.js';
import admin from '../../middleware/admin.js';

// Protect all routes
router.use(auth, admin);

// Get all support tickets
router.get('/tickets', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM support_tickets ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Get support tickets error:', error);
    res.status(500).json({ message: 'Server error fetching support tickets' });
  }
});

// Create new support ticket
router.post('/tickets', async (req, res) => {
  try {
    const { user_id, subject, message, status } = req.body;
    const result = await db.query(
      `INSERT INTO support_tickets (user_id, subject, message, status, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [user_id, subject, message, status || 'open']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create support ticket error:', error);
    res.status(500).json({ message: 'Server error creating support ticket' });
  }
});

// Update support ticket status or message
router.put('/tickets/:id', async (req, res) => {
  try {
    const { subject, message, status } = req.body;
    const result = await db.query(
      `UPDATE support_tickets
       SET subject = COALESCE($1, subject),
           message = COALESCE($2, message),
           status = COALESCE($3, status),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [subject, message, status, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Support ticket not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update support ticket error:', error);
    res.status(500).json({ message: 'Server error updating support ticket' });
  }
});

// Delete support ticket
router.delete('/tickets/:id', async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM support_tickets WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Support ticket not found' });
    }
    res.json({ message: 'Support ticket deleted successfully' });
  } catch (error) {
    console.error('Delete support ticket error:', error);
    res.status(500).json({ message: 'Server error deleting support ticket' });
  }
});

export default router;
