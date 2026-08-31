import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import prisma from '../models/prisma.js';
import { sendSuccess } from '../utils/response.js';
import { getUserPresence } from '../services/socketService.js';
import { z } from 'zod';

const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(50).optional(),
  bio: z.string().max(250).optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  status: z.enum(['ONLINE', 'AWAY', 'OFFLINE']).optional(),
});

export const updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validated = updateProfileSchema.parse(req.body);
    const name = validated.displayName || validated.name;

    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(validated.bio !== undefined && { bio: validated.bio.trim() }),
        ...(validated.avatarUrl && { avatar: validated.avatarUrl }),
        ...(validated.status && { status: validated.status }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
        bio: true,
        status: true,
        isAi: true,
      },
    });

    return sendSuccess(res, {
      ...updated,
      displayName: updated.name || updated.username,
      avatarUrl: updated.avatar,
    }, 'Profile updated successfully.');
  } catch (error) {
    next(error);
  }
};

export const searchUsers = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const query = (req.query.q as string || '').trim().toLowerCase();

    const users = await prisma.user.findMany({
      where: {
        isAi: false,
        ...(query
          ? {
              OR: [
                { username: { contains: query, mode: 'insensitive' } },
                { name: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      take: 20,
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        bio: true,
        status: true,
        isAi: true,
      },
    });

    const enriched = users.map((u) => ({
      ...u,
      displayName: u.name || u.username,
      avatarUrl: u.avatar,
      status: getUserPresence(u.id),
    }));

    return sendSuccess(res, enriched);
  } catch (error) {
    next(error);
  }
};
