import express from 'express';
import {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus
} from '../controllers/orderController.js';
import { authenticateToken, optionalAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Create order (guest or authenticated)
router.post('/', optionalAuth, createOrder);

// Customer view their own orders
router.get('/my', authenticateToken, getMyOrders);

// Admin view all orders
router.get('/', authenticateToken, requireAdmin, getAllOrders);

// Admin update order status
router.put('/:id/status', authenticateToken, requireAdmin, updateOrderStatus);

export default router;
