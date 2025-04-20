import express from 'express';
import { body, param } from 'express-validator';
import { validationResult } from 'express-validator';
import SupportService from '../services/supportService.js';

const router = express.Router();

// Middleware to validate request data
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Get all support tickets
router.get('/tickets', async (req, res) => {
  try {
    const tickets = await SupportService.getAllTickets();
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get ticket by ID
router.get('/tickets/:id', 
  param('id').isMongoId(),
  validateRequest,
  async (req, res) => {
    try {
      const ticket = await SupportService.getTicketById(req.params.id);
      if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
      res.json(ticket);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// Create new support ticket
router.post('/tickets',
  body('userId').isMongoId().withMessage('Invalid user ID'),
  body('title').notEmpty().withMessage('Title is required'),
  body('description').isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('priority').isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
  body('status').isIn(['open', 'in_progress', 'closed']).withMessage('Invalid status'),
  validateRequest,
  async (req, res) => {
    try {
      const newTicket = await SupportService.createTicket(req.body);
      res.status(201).json(newTicket);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// Update support ticket
router.put('/tickets/:id',
  param('id').isMongoId(),
  body('title').optional().notEmpty().withMessage('Title is required'),
  body('description').optional().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
  body('status').optional().isIn(['open', 'in_progress', 'closed']).withMessage('Invalid status'),
  validateRequest,
  async (req, res) => {
    try {
      const updatedTicket = await SupportService.updateTicket(req.params.id, req.body);
      if (!updatedTicket) return res.status(404).json({ message: 'Ticket not found' });
      res.json(updatedTicket);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// Delete support ticket
router.delete('/tickets/:id',
  param('id').isMongoId(),
  validateRequest,
  async (req, res) => {
    try {
      const deletedTicket = await SupportService.deleteTicket(req.params.id);
      if (!deletedTicket) return res.status(404).json({ message: 'Ticket not found' });
      res.json({ message: 'Ticket deleted successfully', ticket: deletedTicket });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// Get tickets by status
router.get('/tickets/status/:status',
  param('status').isIn(['open', 'in_progress', 'closed']),
  validateRequest,
  async (req, res) => {
    try {
      const tickets = await SupportService.getTicketsByStatus(req.params.status);
      res.json(tickets);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// Get tickets by user
router.get('/tickets/user/:userId',
  param('userId').isMongoId(),
  validateRequest,
  async (req, res) => {
    try {
      const tickets = await SupportService.getTicketsByUser(req.params.userId);
      res.json(tickets);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

export default router;