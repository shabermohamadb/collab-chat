import { Server, Socket } from 'socket.io';
import { validateDatabaseSession } from '../utils/session.js';
import { verifyToken } from '../utils/jwt.js';
import { logger } from '../utils/logger.js';
import {
  registerUserSocket,
  unregisterUserSocket,
  broadcastGlobal,
} from '../services/socketService.js';
import { registerPresenceHandlers } from './presenceHandler.js';
import { registerTypingHandlers } from './typingHandler.js';
import { registerChatHandlers } from './chatHandler.js';
import { UserStatus } from '@prisma/client';
import prisma from '../models/prisma.js';

// Parse raw cookie string
const parseCookies = (cookieHeader?: string): Record<string, string> => {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;

  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    if (parts.length === 2) {
      cookies[parts[0].trim()] = decodeURIComponent(parts[1].trim());
    }
  });

  return cookies;
};

export const setupWebSocket = (io: Server) => {
  // Real authentication middleware for Socket.IO
  io.use(async (socket: Socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie;
      const cookies = parseCookies(cookieHeader);
      const sessionToken = cookies.session_token || socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!sessionToken) {
        return next(new Error('Authentication required for WebSocket connection.'));
      }

      // Verify session token against database
      let user = await validateDatabaseSession(sessionToken);

      // Fallback to verify JWT
      if (!user) {
        user = verifyToken(sessionToken);
      }

      if (!user) {
        return next(new Error('Invalid or expired authentication session.'));
      }

      socket.data.user = user;
      next();
    } catch (err) {
      return next(new Error('Socket session verification failed.'));
    }
  });

  io.on('connection', async (socket: Socket) => {
    const user = socket.data.user;
    if (!user) {
      socket.disconnect(true);
      return;
    }

    logger.info(`🔌 Authenticated Socket connected: User ${user.username} (${user.id}) on socket ${socket.id}`);

    // Register active user connection
    registerUserSocket(user.id, socket.id, UserStatus.ONLINE);

    // Update user status in DB
    await prisma.user.update({
      where: { id: user.id },
      data: { status: UserStatus.ONLINE },
    }).catch((e) => logger.error('Failed to update user status:', e));

    // Broadcast presence update
    broadcastGlobal('presence:update', {
      userId: user.id,
      username: user.username,
      status: UserStatus.ONLINE,
    });

    // Register sub-handlers
    registerPresenceHandlers(io, socket);
    registerTypingHandlers(io, socket);
    registerChatHandlers(io, socket);

    socket.on('disconnect', async () => {
      logger.info(`🔌 Authenticated Socket disconnected: User ${user.username} on socket ${socket.id}`);
      const isNowOffline = unregisterUserSocket(user.id, socket.id);

      if (isNowOffline) {
        await prisma.user.update({
          where: { id: user.id },
          data: { status: UserStatus.OFFLINE },
        }).catch((e) => logger.error('Failed to set user status offline:', e));

        broadcastGlobal('presence:update', {
          userId: user.id,
          username: user.username,
          status: UserStatus.OFFLINE,
        });
      }
    });
  });
};
