import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Email & Password
router.post('/register', authRateLimiter, authController.register);
router.post('/login', authRateLimiter, authController.login);

// Google OAuth 2.0
router.get('/google', authController.googleRedirect);
router.get('/google/callback', authController.googleCallback);

// GitHub OAuth
router.get('/github', authController.githubRedirect);
router.get('/github/callback', authController.githubCallback);

// Authenticated Sessions & Accounts
// Note: /me handles unauthenticated states gracefully by returning { authenticated: false, user: null }
router.get('/me', authController.getMe);
router.post('/logout', authController.logout);
router.post('/disconnect/:provider', authenticate, authController.disconnectProvider);

export default router;
