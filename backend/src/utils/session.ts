import crypto from 'crypto';
import { Response } from 'express';
import prisma from '../models/prisma.js';
import { AuthenticatedUser } from '../types/index.js';
import { logger } from './logger.js';

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const createDatabaseSession = async (userId: string): Promise<string> => {
  const sessionToken = crypto.randomBytes(48).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.session.create({
    data: {
      userId,
      sessionToken,
      expiresAt,
    },
  });

  logger.info(`[AUTH] Session created in database for userId: ${userId}`);
  return sessionToken;
};

export const validateDatabaseSession = async (
  sessionToken: string
): Promise<AuthenticatedUser | null> => {
  if (!sessionToken) return null;

  const session = await prisma.session.findUnique({
    where: { sessionToken },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          avatar: true,
          status: true,
          isAi: true,
        },
      },
    },
  });

  if (!session) {
    logger.debug('[AUTH] Session token not found in database.');
    return null;
  }

  // Check expiration
  if (new Date() > session.expiresAt) {
    logger.info(`[AUTH] Session expired for userId: ${session.userId}. Deleting session.`);
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    username: session.user.username,
    displayName: session.user.name || session.user.username,
    avatarUrl: session.user.avatar,
    status: session.user.status,
    isAi: session.user.isAi,
  };
};

export const destroyDatabaseSession = async (sessionToken: string): Promise<void> => {
  if (!sessionToken) return;
  await prisma.session.deleteMany({
    where: { sessionToken },
  });
  logger.info('[AUTH] Session deleted from database.');
};

export const setSessionCookie = (res: Response, sessionToken: string): void => {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('session_token', sessionToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: SESSION_DURATION_MS,
    path: '/',
  });
};

export const clearSessionCookie = (res: Response): void => {
  const isProduction = process.env.NODE_ENV === 'production';

  res.clearCookie('session_token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
  });
};
