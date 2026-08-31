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
    throw new Error('Message content or attachment is required.');
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
    reactions: rawMessage.reactions.map((r) => ({
      ...r,
      user: r.user ? { ...r.user, displayName: r.user.name || r.user.username } : undefined,
    })),
  };

  await prisma.room.update({
    where: { id: data.roomId },
    data: { updatedAt: new Date() },
  });

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

  if (/@AI\b/i.test(content)) {
    setTimeout(() => {
      handleAiMention(data.roomId, content, userId, data.parentMessageId);
    }, 100);
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

  const messages = await prisma.message.findMany({
    where: {
      roomId,
      isDeleted: false,
      parentMessageId: options.parentMessageId || null,
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(options.cursor && {
      skip: 1,
      cursor: { id: options.cursor },
    }),
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
            },
          },
        },
      },
      attachments: true,
      threadInfo: true,
      _count: {
        select: {
          replies: true,
        },
      },
    },
  });

  const hasMore = messages.length > limit;
  const returnedMessages = hasMore ? messages.slice(0, limit) : messages;
  const nextCursor = hasMore ? returnedMessages[returnedMessages.length - 1].id : null;

  const formatted = returnedMessages.reverse().map((m) => ({
    ...m,
    sender: m.sender
      ? {
          ...m.sender,
          displayName: m.sender.name || m.sender.username,
          avatarUrl: m.sender.avatar,
        }
      : null,
    reactions: m.reactions.map((r) => ({
      ...r,
      user: r.user ? { ...r.user, displayName: r.user.name || r.user.username } : undefined,
    })),
    replyCount: m._count?.replies || m.threadInfo?.replyCount || 0,
  }));

  return {
    messages: formatted,
    nextCursor,
    hasMore,
  };
};

export const editMessage = async (messageId: string, userId: string, content: string) => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message) throw new Error('Message not found.');
  if (message.senderId !== userId) throw new Error('You can only edit your own messages.');
  if (message.isDeleted) throw new Error('Cannot edit a deleted message.');

  const updatedRaw = await prisma.message.update({
    where: { id: messageId },
    data: {
      content: content.trim(),
      isEdited: true,
      editedAt: new Date(),
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
            },
          },
        },
      },
      attachments: true,
      threadInfo: true,
    },
  });

  const updated = {
    ...updatedRaw,
    sender: updatedRaw.sender
      ? {
          ...updatedRaw.sender,
          displayName: updatedRaw.sender.name || updatedRaw.sender.username,
          avatarUrl: updatedRaw.sender.avatar,
        }
      : null,
    reactions: updatedRaw.reactions.map((r) => ({
      ...r,
      user: r.user ? { ...r.user, displayName: r.user.name || r.user.username } : undefined,
    })),
  };

  broadcastToRoom(updated.roomId, 'message:edited', updated);
  return updated;
};

export const deleteMessage = async (messageId: string, userId: string) => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      room: {
        include: {
          members: {
            where: { userId },
          },
        },
      },
    },
  });

  if (!message) throw new Error('Message not found.');

  const userMembership = message.room.members[0];
  const isSender = message.senderId === userId;
  const isAdminOrOwner = userMembership && (userMembership.role === 'OWNER' || userMembership.role === 'ADMIN');

  if (!isSender && !isAdminOrOwner) {
    throw new Error('You do not have permission to delete this message.');
  }

  await prisma.message.update({
    where: { id: messageId },
    data: {
      isDeleted: true,
      content: 'This message has been deleted.',
    },
  });

  broadcastToRoom(message.roomId, 'message:deleted', {
    messageId,
    roomId: message.roomId,
    parentMessageId: message.parentMessageId,
  });

  return { success: true };
};

export const toggleReaction = async (messageId: string, userId: string, emoji: string) => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message) throw new Error('Message not found.');

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
        },
      },
    },
  });

  const updatedReactions = updatedReactionsRaw.map((r) => ({
    ...r,
    user: r.user ? { ...r.user, displayName: r.user.name || r.user.username } : undefined,
  }));

  broadcastToRoom(message.roomId, 'reaction:updated', {
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
            },
          },
        },
      },
      attachments: true,
    },
  });

  if (!rootMessageRaw) throw new Error('Thread root message not found.');

  const rootMessage = {
    ...rootMessageRaw,
    sender: rootMessageRaw.sender
      ? {
          ...rootMessageRaw.sender,
          displayName: rootMessageRaw.sender.name || rootMessageRaw.sender.username,
          avatarUrl: rootMessageRaw.sender.avatar,
        }
      : null,
    reactions: rootMessageRaw.reactions.map((r) => ({
      ...r,
      user: r.user ? { ...r.user, displayName: r.user.name || r.user.username } : undefined,
    })),
  };

  const repliesRaw = await prisma.message.findMany({
    where: {
      parentMessageId: rootMessageId,
      isDeleted: false,
    },
    orderBy: { createdAt: 'asc' },
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
            },
          },
        },
      },
      attachments: true,
    },
  });

  const replies = repliesRaw.map((r) => ({
    ...r,
    sender: r.sender
      ? {
          ...r.sender,
          displayName: r.sender.name || r.sender.username,
          avatarUrl: r.sender.avatar,
        }
      : null,
    reactions: r.reactions.map((rx) => ({
      ...rx,
      user: rx.user ? { ...rx.user, displayName: rx.user.name || rx.user.username } : undefined,
    })),
  }));

  return {
    rootMessage,
    replies,
  };
};
