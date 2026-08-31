export type UserStatus = 'ONLINE' | 'AWAY' | 'OFFLINE';
export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type RoomType = 'CHANNEL' | 'DIRECT_MESSAGE';

export interface User {
  id: string;
  name?: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  avatar?: string | null;
  bio?: string | null;
  status: UserStatus;
  isAi: boolean;
  hasPassword?: boolean;
  emailVerified?: string | null;
  connectedAccounts?: string[];
  createdAt?: string;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

export interface ReactionUser {
  id: string;
  username: string;
  displayName: string;
}

export interface MessageReaction {
  id: string;
  emoji: string;
  userId: string;
  messageId: string;
  user?: ReactionUser;
}

export interface ThreadInfo {
  id: string;
  replyCount: number;
  lastReplyAt: string | null;
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string | null;
  content: string;
  isAiMessage: boolean;
  isEdited: boolean;
  editedAt: string | null;
  isDeleted: boolean;
  parentMessageId: string | null;
  createdAt: string;
  updatedAt: string;
  sender?: User | null;
  reactions?: MessageReaction[];
  attachments?: Attachment[];
  threadInfo?: ThreadInfo | null;
  replyCount?: number;
}

export interface RoomMember {
  id: string;
  roomId: string;
  userId: string;
  role: MemberRole;
  joinedAt: string;
  lastReadAt: string;
  user: User;
}

export interface Room {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: RoomType;
  isPrivate: boolean;
  isArchived: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  members: RoomMember[];
  currentUserRole?: MemberRole | null;
  isMember?: boolean;
  unreadCount?: number;
  _count?: {
    messages?: number;
    members?: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthResponse {
  user: User;
  token?: string;
  sessionToken?: string;
}

export interface Typer {
  userId: string;
  username: string;
  displayName: string;
}
