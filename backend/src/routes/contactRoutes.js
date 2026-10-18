import express from 'express';
import { submitContactMessage, getContactMessages } from '../controllers/contactController.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', submitContactMessage);
router.get('/', authenticateToken, requireAdmin, getContactMessages);

export default router;
