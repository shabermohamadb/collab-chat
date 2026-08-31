import { Server, Socket } from 'socket.io';
import * as messageService from '../services/messageService.js';
import * as roomService from '../services/roomService.js';
import { broadcastToRoom } from '../services/socketService.js';
import { logger } from '../utils/logger.js';

export const registerChatHandlers = (io: Server, socket: Socket) => {
  const user = socket.data.user;
  if (!user) return;

  // Join a room channel
  socket.on('room:join', async (data: { roomId: string }) => {
    try {
      const { roomId } = data;
      if (!roomId) return;

      socket.join(`room:${roomId}`);
      logger.debug(`User ${user.username} (${socket.id}) joined room channel room:${roomId}`);

      // Broadcast join notification to room
      socket.to(`room:${roomId}`).emit('room:user_joined', {
        roomId,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
        },
      });
    } catch (error) {
      logger.error('Error joining room socket:', error);
    }
  });

  // Leave a room channel
  socket.on('room:leave', (data: { roomId: string }) => {
    const { roomId } = data;
    if (!roomId) return;

    socket.leave(`room:${roomId}`);
    logger.debug(`User ${user.username} left room channel room:${roomId}`);

    socket.to(`room:${roomId}`).emit('room:user_left', {
      roomId,
      userId: user.id,
      username: user.username,
    });
  });

  // Send a message via WebSocket
  socket.on('message:send', async (data: { roomId: string; content: string; parentMessageId?: string; attachmentIds?: string[] }, callback) => {
    try {
      const message = await messageService.createMessage(user.id, data);
      if (typeof callback === 'function') {
        callback({ success: true, message });
      }
    } catch (error: any) {
      logger.error('Error sending message via socket:', error);
      if (typeof callback === 'function') {
        callback({ success: false, error: error.message || 'Failed to send message.' });
      }
    }
  });

  // Edit message
  socket.on('message:edit', async (data: { messageId: string; content: string }, callback) => {
    try {
      const updated = await messageService.editMessage(data.messageId, user.id, data.content);
      if (typeof callback === 'function') {
        callback({ success: true, message: updated });
      }
    } catch (error: any) {
      if (typeof callback === 'function') {
        callback({ success: false, error: error.message });
      }
    }
  });

  // Delete message
  socket.on('message:delete', async (data: { messageId: string }, callback) => {
    try {
      await messageService.deleteMessage(data.messageId, user.id);
      if (typeof callback === 'function') {
        callback({ success: true });
      }
    } catch (error: any) {
      if (typeof callback === 'function') {
        callback({ success: false, error: error.message });
      }
    }
  });

  // React to message
  socket.on('message:react', async (data: { messageId: string; emoji: string }, callback) => {
    try {
      const reactions = await messageService.toggleReaction(data.messageId, user.id, data.emoji);
      if (typeof callback === 'function') {
        callback({ success: true, reactions });
      }
    } catch (error: any) {
      if (typeof callback === 'function') {
        callback({ success: false, error: error.message });
      }
    }
  });
};
