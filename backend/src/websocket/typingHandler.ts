import { Server, Socket } from 'socket.io';
import { broadcastToRoom } from '../services/socketService.js';

// Map of roomId -> Map<userId, { username, displayName, timeout }>
const roomTypers = new Map<string, Map<string, { username: string; displayName: string; timer: NodeJS.Timeout }>>();

export const registerTypingHandlers = (io: Server, socket: Socket) => {
  const user = socket.data.user;
  if (!user) return;

  socket.on('typing:start', (data: { roomId: string }) => {
    const { roomId } = data;
    if (!roomId) return;

    if (!roomTypers.has(roomId)) {
      roomTypers.set(roomId, new Map());
    }

    const typers = roomTypers.get(roomId)!;

    // Clear existing timer if any
    if (typers.has(user.id)) {
      clearTimeout(typers.get(user.id)!.timer);
    }

    // Auto-stop after 3.5 seconds of inactivity
    const timer = setTimeout(() => {
      if (roomTypers.has(roomId)) {
        roomTypers.get(roomId)!.delete(user.id);
        emitTypingUpdate(roomId);
      }
    }, 3500);

    typers.set(user.id, {
      username: user.username,
      displayName: user.displayName,
      timer,
    });

    emitTypingUpdate(roomId);
  });

  socket.on('typing:stop', (data: { roomId: string }) => {
    const { roomId } = data;
    if (!roomId) return;

    if (roomTypers.has(roomId)) {
      const typers = roomTypers.get(roomId)!;
      if (typers.has(user.id)) {
        clearTimeout(typers.get(user.id)!.timer);
        typers.delete(user.id);
        emitTypingUpdate(roomId);
      }
    }
  });

  const emitTypingUpdate = (roomId: string) => {
    const typers = roomTypers.get(roomId);
    const activeTypers: Array<{ userId: string; username: string; displayName: string }> = [];

    if (typers) {
      for (const [userId, val] of typers.entries()) {
        activeTypers.push({
          userId,
          username: val.username,
          displayName: val.displayName,
        });
      }
    }

    broadcastToRoom(roomId, 'typing:list', {
      roomId,
      typers: activeTypers,
    });
  };
};
