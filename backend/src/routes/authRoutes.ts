import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Email & Password Authentication
router.post('/register', authRateLimiter, authController.register);
router.post('/login', authRateLimiter, authController.login);

// Session Verification & Logout
router.get('/me', authController.getMe);
router.post('/logout', authController.logout);

export default router;
