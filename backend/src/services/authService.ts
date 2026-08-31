import prisma from '../models/prisma.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';
import { AuthenticatedUser } from '../types/index.js';
import { UserStatus } from '@prisma/client';
import { OAuthProfile } from './oauthService.js';
import { createDatabaseSession, destroyDatabaseSession } from '../utils/session.js';
import { logger } from '../utils/logger.js';

export const registerUser = async (data: {
  name?: string;
  username?: string;
  email: string;
  password: string;
  confirmPassword?: string;
  avatarUrl?: string;
}) => {
  const normalizedEmail = data.email.trim().toLowerCase();

  logger.info(`[AUTH DEBUG] REGISTER_REQUEST email=${normalizedEmail}`);

  if (data.confirmPassword && data.password !== data.confirmPassword) {
    throw new Error('Passwords do not match.');
  }

  if (data.password.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  // Check duplicate email
  const existingEmail = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingEmail) {
    throw new Error('This email is already registered.');
  }

  // Generate or sanitize username from email or input
  let normalizedUsername = data.username?.trim().toLowerCase();
  if (!normalizedUsername) {
    const base = normalizedEmail.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '') || 'user';
    normalizedUsername = base;
    let counter = 1;
    while (await prisma.user.findUnique({ where: { username: normalizedUsername } })) {
      normalizedUsername = `${base}${counter++}`;
    }
  } else {
    const existingUser = await prisma.user.findUnique({
      where: { username: normalizedUsername },
    });
    if (existingUser) {
      throw new Error('This username is already taken.');
    }
  }

  const passwordHash = await hashPassword(data.password);
  const name = data.name?.trim() || normalizedUsername.charAt(0).toUpperCase() + normalizedUsername.slice(1);
  const avatar =
    data.avatarUrl ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=0284c7,2563eb,4f46e5,7c3aed,059669`;

  const user = await prisma.user.create({
    data: {
      name,
      username: normalizedUsername,
      email: normalizedEmail,
      passwordHash,
      avatar,
      status: UserStatus.ONLINE,
    },
  });

  // Auto-join public general channels
  const generalRoom = await prisma.room.findFirst({
    where: { slug: 'general' },
  });

  if (generalRoom) {
    await prisma.roomMember.upsert({
      where: {
        roomId_userId: {
          roomId: generalRoom.id,
          userId: user.id,
        },
      },
      update: {},
      create: {
        roomId: generalRoom.id,
        userId: user.id,
        role: 'MEMBER',
      },
    });
  }

  const sessionToken = await createDatabaseSession(user.id);
  logger.info(`[AUTH DEBUG] USER_CREATED=true SESSION_CREATED=true SESSION_ID_PRESENT=true`);

  const authUser: AuthenticatedUser = {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.name || user.username,
    avatarUrl: user.avatar,
    status: user.status,
    isAi: user.isAi,
  };

  const jwtToken = signToken(authUser);

  return { user: authUser, sessionToken, token: sessionToken || jwtToken };
};

export const loginUser = async (credentials: { identifier: string; password: string }) => {
  const identifier = credentials.identifier.trim().toLowerCase();

  logger.info(`[AUTH DEBUG] LOGIN_REQUEST identifier=${identifier}`);

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }, { username: identifier }],
    },
    include: {
      accounts: true,
    },
  });

  if (!user || user.isAi) {
    logger.warn(`[AUTH DEBUG] USER_FOUND=false for identifier: ${identifier}`);
    throw new Error('Invalid email or password.');
  }

  logger.info(`[AUTH DEBUG] USER_FOUND=true userId=${user.id}`);

  if (!user.passwordHash) {
    const providers = user.accounts.map((a) => a.provider).join(' or ');
    throw new Error(`This account was created via ${providers || 'OAuth'}. Please sign in using your connected provider.`);
  }

  const isMatch = await comparePassword(credentials.password, user.passwordHash);
  if (!isMatch) {
    logger.warn(`[AUTH DEBUG] PASSWORD_VALID=false`);
    throw new Error('Invalid email or password.');
  }

  logger.info(`[AUTH DEBUG] PASSWORD_VALID=true`);

  // Update status to online
  await prisma.user.update({
    where: { id: user.id },
    data: { status: UserStatus.ONLINE },
  });

  const sessionToken = await createDatabaseSession(user.id);
  logger.info(`[AUTH DEBUG] SESSION_CREATED=true SESSION_ID_PRESENT=true`);

  const authUser: AuthenticatedUser = {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.name || user.username,
    avatarUrl: user.avatar,
    status: UserStatus.ONLINE,
    isAi: user.isAi,
  };

  const jwtToken = signToken(authUser);

  return { user: authUser, sessionToken, token: sessionToken || jwtToken };
};

export const linkOrFindOAuthUser = async (profile: OAuthProfile) => {
  logger.info(`[GOOGLE DEBUG] PROFILE_RECEIVED=true provider=${profile.provider} email=${profile.email}`);

  // 1. Check if this OAuth account is already connected
  const existingAccount = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: profile.provider,
        providerAccountId: profile.providerAccountId,
      },
    },
    include: {
      user: true,
    },
  });

  if (existingAccount) {
    logger.info(`[GOOGLE DEBUG] USER_FOUND_OR_CREATED=true existingAccount=true userId=${existingAccount.userId}`);
    await prisma.account.update({
      where: { id: existingAccount.id },
      data: {
        accessToken: profile.accessToken,
        refreshToken: profile.refreshToken,
      },
    });

    await prisma.user.update({
      where: { id: existingAccount.userId },
      data: { status: UserStatus.ONLINE },
    });

    const sessionToken = await createDatabaseSession(existingAccount.userId);
    logger.info(`[GOOGLE DEBUG] SESSION_CREATED=true`);

    const authUser: AuthenticatedUser = {
      id: existingAccount.user.id,
      email: existingAccount.user.email,
      username: existingAccount.user.username,
      displayName: existingAccount.user.name || existingAccount.user.username,
      avatarUrl: existingAccount.user.avatar,
      status: UserStatus.ONLINE,
      isAi: existingAccount.user.isAi,
    };
    const jwtToken = signToken(authUser);

    return { user: authUser, sessionToken, token: sessionToken || jwtToken };
  }

  // 2. Check if a user with the same email already exists (Account Linking)
  let user = await prisma.user.findUnique({
    where: { email: profile.email },
  });

  if (user) {
    logger.info(`[GOOGLE DEBUG] USER_FOUND_OR_CREATED=true linkedExistingEmail=true userId=${user.id}`);
    await prisma.account.create({
      data: {
        userId: user.id,
        provider: profile.provider,
        providerAccountId: profile.providerAccountId,
        accessToken: profile.accessToken,
        refreshToken: profile.refreshToken,
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        status: UserStatus.ONLINE,
        ...(profile.avatarUrl && !user.avatar && { avatar: profile.avatarUrl }),
        emailVerified: profile.emailVerified ? new Date() : user.emailVerified,
      },
    });
  } else {
    // 3. Create a brand new user
    logger.info(`[GOOGLE DEBUG] USER_FOUND_OR_CREATED=true createdNewUser=true email=${profile.email}`);
    const baseUsername = profile.email.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '') || 'user';
    let uniqueUsername = baseUsername;
    let counter = 1;
    while (await prisma.user.findUnique({ where: { username: uniqueUsername } })) {
      uniqueUsername = `${baseUsername}${counter++}`;
    }

    const avatar =
      profile.avatarUrl ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.name)}&backgroundColor=0284c7,2563eb,4f46e5,7c3aed,059669`;

    user = await prisma.user.create({
      data: {
        name: profile.name,
        username: uniqueUsername,
        email: profile.email,
        avatar,
        emailVerified: profile.emailVerified ? new Date() : null,
        status: UserStatus.ONLINE,
        accounts: {
          create: {
            provider: profile.provider,
            providerAccountId: profile.providerAccountId,
            accessToken: profile.accessToken,
            refreshToken: profile.refreshToken,
          },
        },
      },
    });

    // Auto-join #general
    const generalRoom = await prisma.room.findFirst({
      where: { slug: 'general' },
    });

    if (generalRoom) {
      await prisma.roomMember.create({
        data: {
          roomId: generalRoom.id,
          userId: user.id,
          role: 'MEMBER',
        },
      });
    }
  }

  const sessionToken = await createDatabaseSession(user.id);
  logger.info(`[GOOGLE DEBUG] SESSION_CREATED=true`);

  const authUser: AuthenticatedUser = {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.name || user.username,
    avatarUrl: user.avatar,
    status: UserStatus.ONLINE,
    isAi: user.isAi,
  };
  const jwtToken = signToken(authUser);

  return { user: authUser, sessionToken, token: sessionToken || jwtToken };
};

export const getUserProfileAndAccounts = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      avatar: true,
      bio: true,
      status: true,
      isAi: true,
      emailVerified: true,
      passwordHash: true,
      createdAt: true,
      accounts: {
        select: {
          id: true,
          provider: true,
          createdAt: true,
        },
      },
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    displayName: user.name || user.username,
    avatarUrl: user.avatar,
    bio: user.bio,
    status: user.status,
    isAi: user.isAi,
    hasPassword: !!user.passwordHash,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    connectedAccounts: user.accounts.map((a) => a.provider),
  };
};

export const disconnectOAuthProvider = async (userId: string, provider: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      accounts: true,
    },
  });

  if (!user) throw new Error('User not found.');

  const hasPassword = !!user.passwordHash;
  const remainingProviders = user.accounts.filter((a) => a.provider !== provider);

  if (!hasPassword && remainingProviders.length === 0) {
    throw new Error('Cannot disconnect this provider because it is your only login method. Please set a password first.');
  }

  await prisma.account.deleteMany({
    where: {
      userId,
      provider,
    },
  });

  return { success: true };
};

export const logoutUser = async (sessionToken?: string, userId?: string) => {
  if (sessionToken) {
    await destroyDatabaseSession(sessionToken);
  }
  if (userId) {
    await prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.OFFLINE },
    }).catch(() => {});
  }
};
