import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import * as authService from '../services/authService.js';
import { setSessionCookie, clearSessionCookie, validateDatabaseSession } from '../utils/session.js';
import { z } from 'zod';
import { logger } from '../utils/logger.js';

const registerSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  username: z.string().optional(),
  email: z.string().email('Invalid email address format.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  confirmPassword: z.string().min(6).optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
});

const loginSchema = z.object({
  identifier: z.string().min(1, 'Email is required.'),
  password: z.string().min(1, 'Password is required.'),
});

export const register = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validated = registerSchema.parse(req.body);
    const result = await authService.registerUser(validated as any);

    // Set secure HttpOnly session cookie
    setSessionCookie(res, result.sessionToken);

    return res.status(201).json({
      authenticated: true,
      user: result.user,
      sessionToken: result.sessionToken,
      token: result.token,
      message: 'Account registered successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validated = loginSchema.parse(req.body);
    const result = await authService.loginUser(validated as any);

    // Set secure HttpOnly session cookie
    setSessionCookie(res, result.sessionToken);

    return res.status(200).json({
      authenticated: true,
      user: result.user,
      sessionToken: result.sessionToken,
      token: result.token,
      message: 'Logged in successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const sessionCookie = req.cookies?.session_token;
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
    const token = sessionCookie || bearerToken;

    if (!token) {
      return res.status(200).json({
        authenticated: false,
        user: null,
      });
    }

    const authUser = await validateDatabaseSession(token);
    if (!authUser) {
      return res.status(200).json({
        authenticated: false,
        user: null,
      });
    }

    const userProfile = await authService.getUserProfileAndAccounts(authUser.id);
    if (!userProfile) {
      return res.status(200).json({
        authenticated: false,
        user: null,
      });
    }

    return res.status(200).json({
      authenticated: true,
      user: userProfile,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const sessionCookie = req.cookies?.session_token;
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
    const token = sessionCookie || bearerToken;

    await authService.logoutUser(token, req.user?.id);
    clearSessionCookie(res);

    logger.info('[AUTH DEBUG] User logged out and session destroyed.');
    return res.status(200).json({
      authenticated: false,
      user: null,
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
};
