import express from 'express';
import { sendMessage, getMessagesByConversation } from '../controllers/messageController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// entrambe rotte necessitano token JWT
// per test, POST /api/messages/:conversationId -> invia un messaggio
router.post('/:conversationId', authenticateToken, sendMessage);

// e GET /api/messages/:conversationId -> legge lo storico
router.get('/:conversationId', authenticateToken, getMessagesByConversation);

export default router;