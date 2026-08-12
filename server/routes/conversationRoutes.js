import express from 'express';
import { createOrGetDirectConversation, getMyConversations } from '../controllers/conversationController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// entrambe le rotte sono sicure garzie a  authenticateToken
router.post('/direct', authenticateToken, createOrGetDirectConversation);
router.get('/', authenticateToken, getMyConversations);

export default router;