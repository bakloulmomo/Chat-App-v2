import express from 'express';
import { registerUser, loginUser, logoutUser, checkAuth } from '../controllers/authController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js'; // middleware per verificare il jwt

const router = express.Router();

// 1 REGISTRAZIONE
router.post('/signup', registerUser);

// 2 ACCESSO
router.post('/login', loginUser);

// 3 VERIFICA SESSIONE / PROFILO
router.get('/me', authenticateToken, checkAuth);

// 4 LOGOUT
router.post('/logout', logoutUser);

export default router;