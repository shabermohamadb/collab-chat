import { Server, Socket } from 'socket.io';
import { UserStatus } from '@prisma/client';
import prisma from '../models/prisma.js';
import { setUserPresence, broadcastGlobal } from '../services/socketService.js';
import { logger } from '../utils/logger.js';

export const registerPresenceHandlers = (io: Server, socket: Socket) => {
  const user = socket.data.user;
  if (!user) return;

  socket.on('presence:status_change', async (data: { status: UserStatus }) => {
    try {
      const validStatuses = [UserStatus.ONLINE, UserStatus.AWAY, UserStatus.OFFLINE];
      if (!validStatuses.includes(data.status)) return;

      setUserPresence(user.id, data.status);
      await prisma.user.update({
        where: { id: user.id },
        data: { status: data.status },
      });

      broadcastGlobal('presence:update', {
        userId: user.id,
        username: user.username,
        status: data.status,
      });

      logger.debug(`User ${user.username} changed presence to ${data.status}`);
    } catch (error) {
      logger.error('Error changing presence status:', error);
    }
  });
};
