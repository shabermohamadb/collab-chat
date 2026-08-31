import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import * as roomService from '../services/roomService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { z } from 'zod';

const createRoomSchema = z.object({
  name: z.string().min(2, 'Room name must be at least 2 characters.').max(50, 'Room name cannot exceed 50 characters.'),
  description: z.string().max(250).optional(),
  isPrivate: z.boolean().optional(),
});

const updateRoomSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  description: z.string().max(250).optional(),
  isPrivate: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});

export const create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validated = createRoomSchema.parse(req.body);
    const room = await roomService.createRoom(req.user!.id, validated);
    return sendSuccess(res, room, 'Room created successfully.', 201);
  } catch (error) {
    next(error);
  }
};

export const getUserRooms = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const rooms = await roomService.getUserRooms(req.user!.id);
    return sendSuccess(res, rooms);
  } catch (error) {
    next(error);
  }
};

export const getPublicRooms = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const rooms = await roomService.getPublicRooms(req.user!.id);
    return sendSuccess(res, rooms);
  } catch (error) {
    next(error);
  }
};

export const getRoom = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const room = await roomService.getRoomById(req.params.id, req.user!.id);
    if (!room) {
      return sendError(res, 'Room not found.', 404);
    }
    return sendSuccess(res, room);
  } catch (error) {
    next(error);
  }
};

export const join = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const member = await roomService.joinRoom(req.params.id, req.user!.id);
    return sendSuccess(res, member, 'Joined room successfully.');
  } catch (error) {
    next(error);
  }
};

export const leave = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await roomService.leaveRoom(req.params.id, req.user!.id);
    return sendSuccess(res, result, 'Left room successfully.');
  } catch (error) {
    next(error);
  }
};

export const update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validated = updateRoomSchema.parse(req.body);
    const updated = await roomService.updateRoom(req.params.id, req.user!.id, validated);
    return sendSuccess(res, updated, 'Room updated successfully.');
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await roomService.deleteRoom(req.params.id, req.user!.id);
    return sendSuccess(res, result, 'Room deleted successfully.');
  } catch (error) {
    next(error);
  }
};

export const directMessage = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId) {
      return sendError(res, 'targetUserId is required.', 400);
    }
    const dmRoom = await roomService.getOrCreateDirectMessage(req.user!.id, targetUserId);
    return sendSuccess(res, dmRoom);
  } catch (error) {
    next(error);
  }
};
