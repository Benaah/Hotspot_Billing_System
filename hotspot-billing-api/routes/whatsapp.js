import express from 'express';
import { whatsappService } from '../services/whatsappService.js';

const router = express.Router();

// Middleware to check authentication token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['x-auth-token'];
  const token = authHeader && authHeader.split(' ')[1] || authHeader;
  if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

  try {
    const jwt = await import('jsonwebtoken');
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// Use authentication middleware for all routes
router.use(authenticateToken);

// Endpoint to send a generic WhatsApp message
router.post('/send-message', async (req, res) => {
  const { to, body } = req.body;
  if (!to || !body) {
    return res.status(400).json({ message: 'Missing "to" or "body" in request' });
  }
  try {
    const message = await whatsappService.sendMessage(to, body);
    res.status(200).json({ message: 'Message sent', sid: message.sid });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send message', error: error.message });
  }
});

// Endpoint to send voucher code
router.post('/send-voucher', async (req, res) => {
  const { to, voucherCode } = req.body;
  if (!to || !voucherCode) {
    return res.status(400).json({ message: 'Missing "to" or "voucherCode" in request' });
  }
  try {
    const message = await whatsappService.sendVoucher(to, voucherCode);
    res.status(200).json({ message: 'Voucher sent', sid: message.sid });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send voucher', error: error.message });
  }
});

// Endpoint to send transaction status
router.post('/send-transaction-status', async (req, res) => {
  const { to, transaction } = req.body;
  if (!to || !transaction) {
    return res.status(400).json({ message: 'Missing "to" or "transaction" in request' });
  }
  try {
    const message = await whatsappService.sendTransactionStatus(to, transaction);
    res.status(200).json({ message: 'Transaction status sent', sid: message.sid });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send transaction status', error: error.message });
  }
});

// Endpoint to send package status
router.post('/send-package-status', async (req, res) => {
  const { to, packageInfo } = req.body;
  if (!to || !packageInfo) {
    return res.status(400).json({ message: 'Missing "to" or "packageInfo" in request' });
  }
  try {
    const message = await whatsappService.sendPackageStatus(to, packageInfo);
    res.status(200).json({ message: 'Package status sent', sid: message.sid });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send package status', error: error.message });
  }
});

// Endpoint to send subscription status
router.post('/send-subscription-status', async (req, res) => {
  const { to, subscription } = req.body;
  if (!to || !subscription) {
    return res.status(400).json({ message: 'Missing "to" or "subscription" in request' });
  }
  try {
    const message = await whatsappService.sendSubscriptionStatus(to, subscription);
    res.status(200).json({ message: 'Subscription status sent', sid: message.sid });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send subscription status', error: error.message });
  }
});

export default router;
