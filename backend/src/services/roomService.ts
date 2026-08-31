import prisma from '../models/prisma.js';
import { MemberRole, RoomType, UserStatus } from '@prisma/client';
import { getUserPresence } from './socketService.js';

export const createRoom = async (
  userId: string,
  data: {
    name: string;
    description?: string;
    isPrivate?: boolean;
  }
) => {
  const name = data.name.trim();
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') + `-${Math.floor(1000 + Math.random() * 9000)}`;

  const room = await prisma.room.create({
    data: {
      name,
      slug,
      description: data.description?.trim() || '',
      isPrivate: data.isPrivate || false,
      type: RoomType.CHANNEL,
      createdById: userId,
      members: {
        create: {
          userId,
          role: MemberRole.OWNER,
        },
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
              status: true,
              isAi: true,
            },
          },
        },
      },
    },
  });

  return {
    ...room,
    members: room.members.map((m) => ({
      ...m,
      user: {
        ...m.user,
        displayName: m.user.name || m.user.username,
        avatarUrl: m.user.avatar,
      },
    })),
  };
};

export const getUserRooms = async (userId: string) => {
  const memberships = await prisma.roomMember.findMany({
    where: { userId },
    include: {
      room: {
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                  avatar: true,
                  status: true,
                  isAi: true,
                },
              },
            },
          },
          _count: {
            select: {
              messages: true,
            },
          },
        },
      },
    },
    orderBy: {
      room: {
        updatedAt: 'desc',
      },
    },
  });

  return memberships.map((m) => {
    const enrichedMembers = m.room.members.map((mem) => ({
      ...mem,
      user: {
        ...mem.user,
        displayName: mem.user.name || mem.user.username,
        avatarUrl: mem.user.avatar,
        status: getUserPresence(mem.user.id),
      },
    }));

    return {
      ...m.room,
      members: enrichedMembers,
      unreadCount: 0,
      currentUserRole: m.role,
    };
  });
};

export const getPublicRooms = async (userId: string) => {
  const rooms = await prisma.room.findMany({
    where: {
      isPrivate: false,
      isArchived: false,
      type: RoomType.CHANNEL,
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
              status: true,
              isAi: true,
            },
          },
        },
      },
      _count: {
        select: {
          members: true,
          messages: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return rooms.map((room) => {
    const isMember = room.members.some((m) => m.userId === userId);
    return {
      ...room,
      isMember,
      members: room.members.map((m) => ({
        ...m,
        user: {
          ...m.user,
          displayName: m.user.name || m.user.username,
          avatarUrl: m.user.avatar,
        },
      })),
    };
  });
};

export const getRoomById = async (roomId: string, userId?: string) => {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      creator: {
        select: {
          id: true,
          username: true,
          name: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
              status: true,
              bio: true,
              isAi: true,
            },
          },
        },
      },
      _count: {
        select: {
          messages: true,
          members: true,
        },
      },
    },
  });

  if (!room) return null;

  const enrichedMembers = room.members.map((m) => ({
    ...m,
    user: {
      ...m.user,
      displayName: m.user.name || m.user.username,
      avatarUrl: m.user.avatar,
      status: getUserPresence(m.user.id),
    },
  }));

  const userMembership = userId ? room.members.find((m) => m.userId === userId) : null;

  return {
    ...room,
    members: enrichedMembers,
    currentUserRole: userMembership ? userMembership.role : null,
    isMember: !!userMembership,
  };
};

export const joinRoom = async (roomId: string, userId: string) => {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
  });

  if (!room) throw new Error('Room not found.');
  if (room.isArchived) throw new Error('Cannot join an archived room.');

  const member = await prisma.roomMember.upsert({
    where: {
      roomId_userId: {
        roomId,
        userId,
      },
    },
    update: {},
    create: {
      roomId,
      userId,
      role: MemberRole.MEMBER,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
          status: true,
          isAi: true,
        },
      },
    },
  });

  return {
    ...member,
    user: {
      ...member.user,
      displayName: member.user.name || member.user.username,
      avatarUrl: member.user.avatar,
    },
  };
};

export const leaveRoom = async (roomId: string, userId: string) => {
  const membership = await prisma.roomMember.findUnique({
    where: {
      roomId_userId: {
        roomId,
        userId,
      },
    },
  });

  if (!membership) throw new Error('You are not a member of this room.');
  if (membership.role === MemberRole.OWNER) {
    const memberCount = await prisma.roomMember.count({ where: { roomId } });
    if (memberCount > 1) {
      throw new Error('Room owners must transfer ownership or delete the room before leaving.');
    }
  }

  await prisma.roomMember.delete({
    where: {
      roomId_userId: {
        roomId,
        userId,
      },
    },
  });

  return { success: true };
};

export const updateRoom = async (
  roomId: string,
  userId: string,
  data: {
    name?: string;
    description?: string;
    isPrivate?: boolean;
    isArchived?: boolean;
  }
) => {
  const membership = await prisma.roomMember.findUnique({
    where: {
      roomId_userId: {
        roomId,
        userId,
      },
    },
  });

  if (!membership || (membership.role !== MemberRole.OWNER && membership.role !== MemberRole.ADMIN)) {
    throw new Error('You do not have permission to update this room.');
  }

  const updated = await prisma.room.update({
    where: { id: roomId },
    data: {
      ...(data.name && { name: data.name.trim() }),
      ...(data.description !== undefined && { description: data.description.trim() }),
      ...(data.isPrivate !== undefined && { isPrivate: data.isPrivate }),
      ...(data.isArchived !== undefined && { isArchived: data.isArchived }),
    },
  });

  return updated;
};

export const deleteRoom = async (roomId: string, userId: string) => {
  const membership = await prisma.roomMember.findUnique({
    where: {
      roomId_userId: {
        roomId,
        userId,
      },
    },
  });

  if (!membership || membership.role !== MemberRole.OWNER) {
    throw new Error('Only room owners can delete a room.');
  }

  await prisma.room.delete({
    where: { id: roomId },
  });

  return { success: true };
};

export const getOrCreateDirectMessage = async (currentUserId: string, targetUserId: string) => {
  if (currentUserId === targetUserId) {
    throw new Error('Cannot create direct message with yourself.');
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
  });
  if (!targetUser) throw new Error('Target user not found.');

  const existingRooms = await prisma.room.findMany({
    where: {
      type: RoomType.DIRECT_MESSAGE,
      members: {
        some: { userId: currentUserId },
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
              status: true,
              isAi: true,
            },
          },
        },
      },
    },
  });

  const existingDm = existingRooms.find((r) => r.members.some((m) => m.userId === targetUserId));
  if (existingDm) {
    return {
      ...existingDm,
      members: existingDm.members.map((m) => ({
        ...m,
        user: {
          ...m.user,
          displayName: m.user.name || m.user.username,
          avatarUrl: m.user.avatar,
        },
      })),
    };
  }

  const dmSlug = `dm-${[currentUserId, targetUserId].sort().join('-')}`;
  const newDm = await prisma.room.create({
    data: {
      name: `DM: ${targetUser.name || targetUser.username}`,
      slug: dmSlug,
      type: RoomType.DIRECT_MESSAGE,
      isPrivate: true,
      createdById: currentUserId,
      members: {
        create: [
          { userId: currentUserId, role: MemberRole.OWNER },
          { userId: targetUserId, role: MemberRole.MEMBER },
        ],
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
              status: true,
              isAi: true,
            },
          },
        },
      },
    },
  });

  return {
    ...newDm,
    members: newDm.members.map((m) => ({
      ...m,
      user: {
        ...m.user,
        displayName: m.user.name || m.user.username,
        avatarUrl: m.user.avatar,
      },
    })),
  };
};
