import express from 'express';
const router = express.Router();

import authRoutes from './auth.js';
import userRoutes from './users.js';
import packageRoutes from './packages.js';
import subscriptionRoutes from './subscriptions.js';
import transactionRoutes from './transactions.js';
import mpesaRoutes from './mpesa.js';
import whatsappRoutes from './whatsapp.js';
import promotionsRoutes from './promotions.js';
import supportRoutes from './support.js';
import adminRoutes from './admin.js';

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/packages', packageRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/transactions', transactionRoutes);
router.use('/mpesa', mpesaRoutes);
router.use('/whatsapp', whatsappRoutes);
router.use('/promotions', promotionsRoutes);
router.use('/support', supportRoutes);
router.use('/admin', adminRoutes);

export default router;
