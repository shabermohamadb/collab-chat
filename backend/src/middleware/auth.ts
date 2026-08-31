import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { validateDatabaseSession } from '../utils/session.js';
import { verifyToken } from '../utils/jwt.js';
import { sendError } from '../utils/response.js';
import prisma from '../models/prisma.js';

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    let user = null;

    // 1. Try Cookie Session Token
    const sessionCookie = req.cookies?.session_token;
    if (sessionCookie) {
      user = await validateDatabaseSession(sessionCookie);
    }

    // 2. Try Authorization Header Bearer Token
    if (!user) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        // Could be a database session token or JWT
        user = await validateDatabaseSession(token);
        if (!user) {
          user = verifyToken(token);
        }
      }
    }

    if (!user) {
      return sendError(res, 'Authentication required. Please log in.', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    return sendError(res, 'Authentication failed.', 401);
  }
};

export const optionalAuthenticate = async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  try {
    const sessionCookie = req.cookies?.session_token;
    if (sessionCookie) {
      const user = await validateDatabaseSession(sessionCookie);
      if (user) req.user = user;
    }
  } catch {}
  next();
};
