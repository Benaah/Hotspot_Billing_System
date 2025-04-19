const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, email, full_name, phone_number, role, is_active, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/updateProfile', auth, async (req, res) => {
  try {
    const { full_name, phone_number } = req.body;
    
    const result = await db.query(
      'UPDATE users SET full_name = $1, phone_number = $2, updated_at = NOW() WHERE id = $3 RETURNING id, email, full_name, phone_number',
      [full_name, phone_number, req.user.id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update password
router.put('/updatePassword', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Get current user with password
    const user = await db.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.rows[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password
    await db.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, req.user.id]
    );
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get all users
router.get('/admin', [auth, admin], async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, email, full_name, phone_number, role, is_active, created_at FROM users ORDER BY created_at DESC'
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Update user
router.put('/admin/:id', [auth, admin], async (req, res) => {
  try {
    const { email, full_name, phone_number, role, is_active } = req.body;
    
    const result = await db.query(
      'UPDATE users SET email = $1, full_name = $2, phone_number = $3, role = $4, is_active = $5, updated_at = NOW() WHERE id = $6 RETURNING *',
      [email, full_name, phone_number, role, is_active, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Admin update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;