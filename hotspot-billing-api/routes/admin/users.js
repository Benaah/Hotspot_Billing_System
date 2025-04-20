import express from 'express';
const router = express.Router();
import db from '../../db.js';
import bcrypt from 'bcrypt';
import auth from '../../middleware/auth.js';
import admin from '../../middleware/admin.js';

// Protect all routes
router.use(auth, admin);

// Get all users with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    
    // Get users with pagination and search
    const usersResult = await db.query(
      `SELECT id, email, full_name, phone_number, role, is_active, created_at, updated_at
       FROM users
       WHERE email ILIKE $1 OR full_name ILIKE $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [`%${search}%`, limit, offset]
    );
    
    // Get total count for pagination
    const countResult = await db.query(
      `SELECT COUNT(*) as total
       FROM users
       WHERE email ILIKE $1 OR full_name ILIKE $1`,
      [`%${search}%`]
    );
    
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      users: usersResult.rows,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user details with subscriptions and transactions
router.get('/:id', async (req, res) => {
  try {
    // Get user details
    const userResult = await db.query(
      `SELECT id, email, full_name, phone_number, role, is_active, created_at, updated_at
       FROM users
       WHERE id = $1`,
      [req.params.id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get user's subscriptions
    const subscriptionsResult = await db.query(
      `SELECT s.id, s.package_id, s.start_time, s.end_time, 
              s.data_used_mb, s.status, s.created_at,
              p.name as package_name, p.price as package_price
       FROM subscriptions s
       JOIN packages p ON s.package_id = p.id
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC`,
      [req.params.id]
    );
    
    // Get user's transactions
    const transactionsResult = await db.query(
      `SELECT id, amount, status, payment_method, created_at
       FROM transactions
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.params.id]
    );
    
    res.json({
      user: userResult.rows[0],
      subscriptions: subscriptionsResult.rows,
      transactions: transactionsResult.rows
    });
  } catch (error) {
    console.error('Admin get user details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new user
router.post('/', async (req, res) => {
  try {
    const { email, password, full_name, phone_number, role, is_active } = req.body;
    
    // Check if user already exists
    const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Insert new user
    const result = await db.query(
      `INSERT INTO users (email, password_hash, full_name, phone_number, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, full_name, phone_number, role, is_active, created_at`,
      [email, hashedPassword, full_name, phone_number, role, is_active]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Admin create user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const { email, full_name, phone_number, role, is_active } = req.body;
    
    // Check if email is already taken by another user
    if (email) {
      const emailCheck = await db.query(
        'SELECT * FROM users WHERE email = $1 AND id != $2',
        [email, req.params.id]
      );
      
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }
    
    // Update user
    const result = await db.query(
      `UPDATE users
       SET email = COALESCE($1, email),
           full_name = COALESCE($2, full_name),
           phone_number = COALESCE($3, phone_number),
           role = COALESCE($4, role),
           is_active = COALESCE($5, is_active),
           updated_at = NOW()
       WHERE id = $6
       RETURNING id, email, full_name, phone_number, role, is_active, created_at, updated_at`,
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

// Reset user password
router.post('/:id/reset-password', async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password
    const result = await db.query(
      `UPDATE users
       SET password_hash = $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING id`,
      [hashedPassword, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Admin reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user (soft delete by setting is_active to false)
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query(
      `UPDATE users
       SET is_active = false,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
