import express from 'express';
import { searchUsers } from '../controllers/userController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Rotta GET /api/users/search


// authenticateToken perché solo gli utenti loggati possono cercare altri utenti

router.get('/search', authenticateToken, searchUsers);

export default router;