import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { testConnection } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import newsletterRoutes from './routes/newsletterRoutes.js';
import contactRoutes from './routes/contactRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', async (req, res) => {
  const isDbConnected = await testConnection();
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: isDbConnected ? 'connected' : 'disconnected'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/contact', contactRoutes);

// Serve frontend static files from 'motion 2' directory
const frontendPath = path.join(__dirname, '../../motion 2');
app.use(express.static(frontendPath));

// Fallback route for frontend client-side routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Centralized error handler
app.use(errorHandler);

// Start server
app.listen(PORT, async () => {
  console.log(`\n======================================================`);
  console.log(`  DE Luxury Clothing Store — Backend Server`);
  console.log(`======================================================`);
  console.log(`  Server running at:  http://localhost:${PORT}`);
  console.log(`  API Base URL:       http://localhost:${PORT}/api`);
  console.log(`  Health check:       http://localhost:${PORT}/api/health`);
  console.log(`  Frontend served at: http://localhost:${PORT}/`);
  console.log(`======================================================\n`);

  // Verify DB connection
  await testConnection();
});

export default app;
