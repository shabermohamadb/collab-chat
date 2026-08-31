import prisma from '../models/prisma.js';
import { getConfig } from '../utils/config.js';
import { handleAiMention } from './aiService.js';
import { broadcastToRoom } from './socketService.js';

export const createMessage = async (
  userId: string,
  data: {
    roomId: string;
    content: string;
    parentMessageId?: string | null;
    attachmentIds?: string[];
  }
) => {
  const config = getConfig();
  const content = data.content.trim();

  if (!content && (!data.attachmentIds || data.attachmentIds.length === 0)) {
    throw new Error('Message cannot be empty.');
  }

  if (content.length > config.maxMessageLength) {
    throw new Error(`Message exceeds maximum allowed length of ${config.maxMessageLength} characters.`);
  }

  const membership = await prisma.roomMember.findUnique({
    where: {
      roomId_userId: {
        roomId: data.roomId,
        userId,
      },
    },
  });

  if (!membership) {
    throw new Error('You must join this room to send messages.');
  }

  const rawMessage = await prisma.message.create({
    data: {
      roomId: data.roomId,
      senderId: userId,
      content,
      parentMessageId: data.parentMessageId || null,
      attachments: data.attachmentIds && data.attachmentIds.length > 0
        ? {
            connect: data.attachmentIds.map((id) => ({ id })),
          }
        : undefined,
    },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
          status: true,
          isAi: true,
        },
      },
      reactions: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
            },
          },
        },
      },
      attachments: true,
      threadInfo: true,
    },
  });

  const message = {
    ...rawMessage,
    sender: rawMessage.sender
      ? {
          ...rawMessage.sender,
          displayName: rawMessage.sender.name || rawMessage.sender.username,
          avatarUrl: rawMessage.sender.avatar,
        }
      : null,
    reactions: rawMessage.reactions ? rawMessage.reactions.map((r: any) => ({
      ...r,
      user: r.user
        ? {
            ...r.user,
            displayName: r.user.name || r.user.username,
            avatarUrl: r.user.avatar,
          }
        : null,
    })) : [],
    attachments: rawMessage.attachments || [],
  };

  // If it's a reply in a thread, update or create the thread record
  if (data.parentMessageId) {
    await prisma.thread.upsert({
      where: { rootMessageId: data.parentMessageId },
      update: {
        replyCount: { increment: 1 },
        lastReplyAt: new Date(),
      },
      create: {
        rootMessageId: data.parentMessageId,
        replyCount: 1,
        lastReplyAt: new Date(),
      },
    });

    broadcastToRoom(data.roomId, 'thread:reply', {
      roomId: data.roomId,
      parentMessageId: data.parentMessageId,
      message,
    });
  }

  broadcastToRoom(data.roomId, 'message:new', message);

  // Trigger AI Assistant if mentioned or inside AI channel
  const room = await prisma.room.findUnique({
    where: { id: data.roomId },
    select: { id: true, name: true },
  });

  const isAiTrigger =
    /@(ai|gemini|bot|assistant)\b/i.test(content) ||
    /^\s*(\/ai|ai\b)/i.test(content) ||
    (room?.name && /ai|prompt|lab/i.test(room.name));

  if (isAiTrigger) {
    setTimeout(() => {
      handleAiMention(data.roomId, content, userId, data.parentMessageId);
    }, 150);
  }

  return message;
};

export const getRoomMessages = async (
  roomId: string,
  options: {
    cursor?: string;
    limit?: number;
    parentMessageId?: string | null;
  }
) => {
  const config = getConfig();
  const limit = Math.min(options.limit || config.pagination.defaultMessagesPerPage, config.pagination.maxMessagesPerPage);

  const whereClause: any = {
    roomId,
    isDeleted: false,
  };

  if (options.parentMessageId !== undefined) {
    whereClause.parentMessageId = options.parentMessageId;
  }

  let cursorObj = undefined;
  if (options.cursor) {
    cursorObj = { id: options.cursor };
  }

  const rawMessages = await prisma.message.findMany({
    where: whereClause,
    take: limit + 1,
    skip: options.cursor ? 1 : 0,
    cursor: cursorObj,
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
          status: true,
          isAi: true,
        },
      },
      reactions: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
            },
          },
        },
      },
      attachments: true,
      threadInfo: true,
    },
  });

  const hasMore = rawMessages.length > limit;
  const returnedMessages = hasMore ? rawMessages.slice(0, limit) : rawMessages;
  const nextCursor = hasMore ? returnedMessages[returnedMessages.length - 1].id : null;

  const formatted = returnedMessages.reverse().map((m: any) => ({
    ...m,
    sender: m.sender
      ? {
          ...m.sender,
          displayName: m.sender.name || m.sender.username,
          avatarUrl: m.sender.avatar,
        }
      : null,
    reactions: m.reactions ? m.reactions.map((r: any) => ({
      ...r,
      user: r.user
        ? {
            ...r.user,
            displayName: r.user.name || r.user.username,
            avatarUrl: r.user.avatar,
          }
        : null,
    })) : [],
    attachments: m.attachments || [],
  }));

  return {
    messages: formatted,
    nextCursor,
    hasMore,
  };
};

export const editMessage = async (userId: string, messageId: string, content: string) => {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error('Message content cannot be empty.');
  }

  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    throw new Error('Message not found.');
  }

  if (message.senderId !== userId) {
    throw new Error('You do not have permission to edit this message.');
  }

  if (message.isDeleted) {
    throw new Error('Cannot edit a deleted message.');
  }

  const updatedRaw = await prisma.message.update({
    where: { id: messageId },
    data: {
      content: trimmed,
      isEdited: true,
    },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
          status: true,
          isAi: true,
        },
      },
      reactions: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
            },
          },
        },
      },
      attachments: true,
      threadInfo: true,
    },
  });

  const formatted = {
    ...updatedRaw,
    sender: updatedRaw.sender
      ? {
          ...updatedRaw.sender,
          displayName: updatedRaw.sender.name || updatedRaw.sender.username,
          avatarUrl: updatedRaw.sender.avatar,
        }
      : null,
    reactions: updatedRaw.reactions ? updatedRaw.reactions.map((r: any) => ({
      ...r,
      user: r.user
        ? {
            ...r.user,
            displayName: r.user.name || r.user.username,
            avatarUrl: r.user.avatar,
          }
        : null,
    })) : [],
    attachments: updatedRaw.attachments || [],
  };

  broadcastToRoom(message.roomId, 'message:edit', formatted);

  return formatted;
};

export const deleteMessage = async (userId: string, messageId: string) => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    throw new Error('Message not found.');
  }

  if (message.senderId !== userId) {
    const membership = await prisma.roomMember.findUnique({
      where: {
        roomId_userId: {
          roomId: message.roomId,
          userId,
        },
      },
    });

    if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
      throw new Error('You do not have permission to delete this message.');
    }
  }

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: {
      isDeleted: true,
      content: 'This message was deleted.',
    },
  });

  broadcastToRoom(message.roomId, 'message:delete', {
    messageId,
    roomId: message.roomId,
  });

  return updated;
};

export const toggleReaction = async (userId: string, messageId: string, emoji: string) => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    throw new Error('Message not found.');
  }

  const existing = await prisma.messageReaction.findUnique({
    where: {
      messageId_userId_emoji: {
        messageId,
        userId,
        emoji,
      },
    },
  });

  if (existing) {
    await prisma.messageReaction.delete({
      where: { id: existing.id },
    });
  } else {
    await prisma.messageReaction.create({
      data: {
        messageId,
        userId,
        emoji,
      },
    });
  }

  const updatedReactionsRaw = await prisma.messageReaction.findMany({
    where: { messageId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
        },
      },
    },
  });

  const updatedReactions = updatedReactionsRaw.map((r: any) => ({
    ...r,
    user: r.user
      ? {
          ...r.user,
          displayName: r.user.name || r.user.username,
          avatarUrl: r.user.avatar,
        }
      : null,
  }));

  broadcastToRoom(message.roomId, 'reaction:update', {
    messageId,
    roomId: message.roomId,
    reactions: updatedReactions,
  });

  return updatedReactions;
};

export const getThreadReplies = async (rootMessageId: string) => {
  const rootMessageRaw = await prisma.message.findUnique({
    where: { id: rootMessageId },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
          status: true,
          isAi: true,
        },
      },
      reactions: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
            },
          },
        },
      },
      attachments: true,
      threadInfo: true,
    },
  });

  if (!rootMessageRaw) {
    throw new Error('Thread root message not found.');
  }

  const rootMessage = {
    ...rootMessageRaw,
    sender: rootMessageRaw.sender
      ? {
          ...rootMessageRaw.sender,
          displayName: rootMessageRaw.sender.name || rootMessageRaw.sender.username,
          avatarUrl: rootMessageRaw.sender.avatar,
        }
      : null,
    reactions: rootMessageRaw.reactions ? rootMessageRaw.reactions.map((r: any) => ({
      ...r,
      user: r.user
        ? {
            ...r.user,
            displayName: r.user.name || r.user.username,
            avatarUrl: r.user.avatar,
          }
        : null,
    })) : [],
    attachments: rootMessageRaw.attachments || [],
  };

  const repliesRaw = await prisma.message.findMany({
    where: {
      parentMessageId: rootMessageId,
      isDeleted: false,
    },
    orderBy: {
      createdAt: 'asc',
    },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
          status: true,
          isAi: true,
        },
      },
      reactions: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
            },
          },
        },
      },
      attachments: true,
    },
  });

  const replies = repliesRaw.map((r: any) => ({
    ...r,
    sender: r.sender
      ? {
          ...r.sender,
          displayName: r.sender.name || r.sender.username,
          avatarUrl: r.sender.avatar,
        }
      : null,
    reactions: r.reactions ? r.reactions.map((rx: any) => ({
      ...rx,
      user: rx.user
        ? {
            ...rx.user,
            displayName: rx.user.name || rx.user.username,
            avatarUrl: rx.user.avatar,
          }
        : null,
    })) : [],
    attachments: r.attachments || [],
  }));

  return {
    rootMessage,
    replies,
  };
};
