const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// Get all active packages (public)
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, description, price, duration_hours, data_limit_mb, is_active, created_at
       FROM packages
       WHERE is_active = true
       ORDER BY price ASC`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get packages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get package by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, description, price, duration_hours, data_limit_mb, is_active, created_at
       FROM packages
       WHERE id = $1`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Package not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get package error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Create package
router.post('/', [auth, admin], async (req, res) => {
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
    console.error('Create package error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Update package
router.put('/:id', [auth, admin], async (req, res) => {
  try {
    const { name, description, price, duration_hours, data_limit_mb, is_active } = req.body;
    
    const result = await db.query(
      `UPDATE packages
       SET name = $1, description = $2, price = $3, duration_hours = $4, 
           data_limit_mb = $5, is_active = $6, updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [name, description, price, duration_hours, data_limit_mb, is_active, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Package not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update package error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Delete package (soft delete by setting is_active to false)
router.delete('/:id', [auth, admin], async (req, res) => {
  try {
    const result = await db.query(
      `UPDATE packages
       SET is_active = false, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Package not found' });
    }
    
    res.json({ message: 'Package deleted successfully' });
  } catch (error) {
    console.error('Delete package error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;