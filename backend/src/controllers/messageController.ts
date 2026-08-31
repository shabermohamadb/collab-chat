import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import * as messageService from '../services/messageService.js';
import { sendSuccess } from '../utils/response.js';
import { z } from 'zod';

const createMessageSchema = z.object({
  roomId: z.string().min(1),
  content: z.string().max(5000),
  parentMessageId: z.string().nullish(),
  attachmentIds: z.array(z.string()).optional(),
});

const editMessageSchema = z.object({
  content: z.string().min(1).max(5000),
});

export const sendMessage = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validated = createMessageSchema.parse(req.body);
    const message = await messageService.createMessage(req.user!.id, validated as any);
    return sendSuccess(res, message, 'Message sent.', 201);
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { roomId } = req.params;
    const { cursor, limit, parentMessageId } = req.query;

    const result = await messageService.getRoomMessages(roomId, {
      cursor: cursor as string | undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      parentMessageId: parentMessageId as string | undefined,
    });

    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const edit = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validated = editMessageSchema.parse(req.body);
    const updated = await messageService.editMessage(req.params.id, req.user!.id, validated.content);
    return sendSuccess(res, updated, 'Message edited.');
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await messageService.deleteMessage(req.params.id, req.user!.id);
    return sendSuccess(res, result, 'Message deleted.');
  } catch (error) {
    next(error);
  }
};

export const react = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { emoji } = req.body;
    if (!emoji) {
      throw new Error('Emoji is required.');
    }
    const reactions = await messageService.toggleReaction(req.params.id, req.user!.id, emoji);
    return sendSuccess(res, reactions);
  } catch (error) {
    next(error);
  }
};

export const getThread = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const threadData = await messageService.getThreadReplies(req.params.id);
    return sendSuccess(res, threadData);
  } catch (error) {
    next(error);
  }
};
