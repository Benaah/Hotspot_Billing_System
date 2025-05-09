import express from 'express';
const router = express.Router();
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { generateToken } from '../../src/utils/jwt.js';
import pkg from 'pg';

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Register a new user
router.post('/signup', async (req, res) => {
  try {
    const { phone, password, fullName } = req.body;
    
    // Check if user already exists
    const userCheck = await pool.query(
      'SELECT * FROM users WHERE phone_number = $1',
      [phone]
    );
    
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Insert new user
    const result = await pool.query(
      'INSERT INTO users (phone_number, password, full_name, is_admin, is_verified, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id, phone_number, full_name, is_admin, is_verified, created_at',
      [phone, hashedPassword, fullName, false, false]
    );
    
    const user = result.rows[0];
    
    // Generate tokens
    const accessToken = generateToken(
      { id: user.id, is_admin: user.is_admin },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    const refreshToken = generateToken(
      { id: user.id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      user: {
        id: user.id,
        phone_number: user.phone_number,
        full_name: user.full_name,
        is_admin: user.is_admin,
        is_verified: user.is_verified,
        created_at: user.created_at
      },
      session: {
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'Bearer',
        expires_at: Date.now() + 3600000 // 1 hour from now
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// Login user
router.post('/signin', async (req, res) => {
  try {
    const { phone, password } = req.body;
    
    // Find user
    const result = await pool.query(
      'SELECT * FROM users WHERE phone_number = $1',
      [phone]
    );
    
    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid phone number or password' });
    }
    
    const user = result.rows[0];
    
    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid phone number or password' });
    }
    
    // Generate tokens
    const accessToken = generateToken(
      { id: user.id, is_admin: user.is_admin },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    const refreshToken = generateToken(
      { id: user.id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(200).json({
      user: {
        id: user.id,
        phone_number: user.phone_number,
        full_name: user.full_name,
        is_admin: user.is_admin,
        is_verified: user.is_verified,
        created_at: user.created_at
      },
      session: {
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'Bearer',
        expires_at: Date.now() + 3600000 // 1 hour from now
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Refresh token
router.post('/refresh-token', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    
    if (!refresh_token) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }
    
    // Verify refresh token
    const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET);
    
    // Get user
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [decoded.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = result.rows[0];
    
    // Generate new access token
    const accessToken = jwt.sign(
      { id: user.id, is_admin: user.is_admin },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.status(200).json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_at: Date.now() + 3600000 // 1 hour from now
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
});

// Get current user
router.get('/me', async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const result = await pool.query(
      'SELECT id, phone_number, email, full_name, is_admin, is_verified, created_at FROM users WHERE id = $1',
      [decoded.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(result.rows[0]);
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ message: 'Invalid token' });
    }
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout (optional - client-side can simply remove the token)
router.post('/signout', (req, res) => {
  // In a stateless JWT auth system, the client just needs to remove the token
  res.status(200).json({ message: 'Logged out successfully' });
});

// Forgot password - reset password by verifying username and phone number
router.post('/forgot-password', async (req, res) => {
  try {
    const { username, phoneNumber } = req.body;

    if (!username || !phoneNumber) {
      return res.status(400).json({ message: 'Username and phone number are required' });
    }

    // Find user by username and phone number
    const result = await pool.query(
      'SELECT * FROM users WHERE full_name = $1 AND phone_number = $2',
      [username, phoneNumber]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found with provided username and phone number' });
    }

    const user = result.rows[0];

    // Generate a new random password (for example, 8 characters alphanumeric)
    const newPassword = Math.random().toString(36).slice(-8);

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user's password in database
    await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, user.id]
    );

    // TODO: Send new password to user via SMS or other means
    // For now, just return the new password in response (not secure for production)
    res.status(200).json({ message: 'Password reset successfully', newPassword });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
});

export default router;
