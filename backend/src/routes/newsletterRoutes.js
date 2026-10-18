import express from 'express';
import { subscribeNewsletter, getSubscribers } from '../controllers/newsletterController.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/subscribe', subscribeNewsletter);
router.get('/subscribers', authenticateToken, requireAdmin, getSubscribers);

export default router;
