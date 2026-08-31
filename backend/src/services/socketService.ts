import { Server, Socket } from 'socket.io';
import { UserStatus } from '@prisma/client';
import { logger } from '../utils/logger.js';

let ioInstance: Server | null = null;

// Map to track connected users: userId -> Set of socketIds
const userSocketsMap = new Map<string, Set<string>>();

// Map to track user current presence status
const userStatusMap = new Map<string, UserStatus>();

export const initSocketService = (io: Server) => {
  ioInstance = io;
};

export const getIO = (): Server => {
  if (!ioInstance) {
    throw new Error('Socket.IO has not been initialized.');
  }
  return ioInstance;
};

export const registerUserSocket = (userId: string, socketId: string, status: UserStatus = UserStatus.ONLINE) => {
  if (!userSocketsMap.has(userId)) {
    userSocketsMap.set(userId, new Set());
  }
  userSocketsMap.get(userId)!.add(socketId);
  userStatusMap.set(userId, status);
  logger.debug(`User ${userId} registered socket ${socketId}. Active connections: ${userSocketsMap.get(userId)!.size}`);
};

export const unregisterUserSocket = (userId: string, socketId: string): boolean => {
  if (userSocketsMap.has(userId)) {
    const sockets = userSocketsMap.get(userId)!;
    sockets.delete(socketId);
    if (sockets.size === 0) {
      userSocketsMap.delete(userId);
      userStatusMap.set(userId, UserStatus.OFFLINE);
      logger.debug(`User ${userId} has disconnected all sockets.`);
      return true; // True indicates user is now fully offline
    }
  }
  return false;
};

export const isUserOnline = (userId: string): boolean => {
  const sockets = userSocketsMap.get(userId);
  return !!sockets && sockets.size > 0;
};

export const getUserPresence = (userId: string): UserStatus => {
  if (!isUserOnline(userId)) return UserStatus.OFFLINE;
  return userStatusMap.get(userId) || UserStatus.ONLINE;
};

export const setUserPresence = (userId: string, status: UserStatus) => {
  userStatusMap.set(userId, status);
};

export const broadcastToRoom = (roomId: string, event: string, data: any) => {
  if (ioInstance) {
    ioInstance.to(`room:${roomId}`).emit(event, data);
  }
};

export const broadcastToUser = (userId: string, event: string, data: any) => {
  if (ioInstance && userSocketsMap.has(userId)) {
    const sockets = userSocketsMap.get(userId)!;
    for (const socketId of sockets) {
      ioInstance.to(socketId).emit(event, data);
    }
  }
};

export const broadcastGlobal = (event: string, data: any) => {
  if (ioInstance) {
    ioInstance.emit(event, data);
  }
};
