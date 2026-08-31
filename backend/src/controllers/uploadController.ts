import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import prisma from '../models/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const uploadFile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const file = req.file;
    if (!file) {
      return sendError(res, 'No file uploaded.', 400);
    }

    const { messageId } = req.body;
    const fileUrl = `/uploads/${file.filename}`;

    // If messageId is provided, attach immediately, otherwise create standalone attachment
    const attachment = await prisma.attachment.create({
      data: {
        fileName: file.originalname,
        fileUrl,
        fileType: file.mimetype,
        fileSize: file.size,
        ...(messageId
          ? {
              message: {
                connect: { id: messageId },
              },
            }
          : {
              // Standalone attachment connected during message send
              message: {
                create: {
                  roomId: req.body.roomId || '',
                  senderId: req.user!.id,
                  content: '',
                },
              },
            }),
      },
    });

    return sendSuccess(res, {
      id: attachment.id,
      fileName: attachment.fileName,
      fileUrl: attachment.fileUrl,
      fileType: attachment.fileType,
      fileSize: attachment.fileSize,
    }, 'File uploaded successfully.', 201);
  } catch (error) {
    next(error);
  }
};
