import { User, Room, RoomMember, Message, MessageReaction, Attachment, UserStatus, MemberRole, RoomType } from '@prisma/client';
import { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  status: UserStatus;
  isAi: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SocketUser {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  status: UserStatus;
  socketId: string;
  currentRoomId?: string;
}

export interface TypingData {
  roomId: string;
  userId: string;
  username: string;
  displayName: string;
  isTyping: boolean;
}

export interface MessageWithDetails extends Message {
  sender?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    status: UserStatus;
    isAi: boolean;
  } | null;
  reactions?: Array<{
    id: string;
    emoji: string;
    userId: string;
    user?: {
      id: string;
      username: string;
      displayName: string;
    };
  }>;
  attachments?: Attachment[];
  threadInfo?: {
    id: string;
    replyCount: number;
    lastReplyAt: Date | null;
  } | null;
  replyCount?: number;
}

export interface AiChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
}
