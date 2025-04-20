import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import pkg from 'pg';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const port = process.env.PORT || 5000;
const { Pool } = pkg;

// Set up middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'x-auth-token']
}));
app.use(express.json()); // Parse JSON bodies
app.use(morgan('dev')); // Logging

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/', apiLimiter);

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected successfully');
  }
});

// Routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import packageRoutes from './routes/packages.js';
import subscriptionRoutes from './routes/subscriptions.js';
import transactionRoutes from './routes/transactions.js';
import mpesaRoutes from './routes/mpesa.js';

// Admin routes
import adminDashboardRoutes from './routes/admin.js';
import adminUserRoutes from './routes/admin/users.js';
import adminPackageRoutes from './routes/admin/packages.js';
import adminSubscriptionRoutes from './routes/admin/subscriptions.js';
import adminTransactionRoutes from './routes/admin/transactions.js';

// Import WhatsApp routes
import whatsappRoutes from './routes/whatsapp.js';

// Ensure your auth routes are properly configured
app.use('/api/auth', authRoutes);

// Add a middleware to verify JWT tokens
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });
  
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(403).json({ message: 'Invalid token' });
  }
};

// Export the middleware for use in route files
app.locals.authenticateToken = authenticateToken;

app.use('/api/users', userRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/mpesa', mpesaRoutes);

// Use WhatsApp routes
app.use('/api/whatsapp', whatsappRoutes);

// Use admin routes
app.use('/api/admin', adminDashboardRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/packages', adminPackageRoutes);
app.use('/api/admin/subscriptions', adminSubscriptionRoutes);
app.use('/api/admin/transactions', adminTransactionRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});