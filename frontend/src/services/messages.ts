import { request } from './api.ts';
import { Message, MessageReaction, Attachment } from '../types/index.ts';

export interface MessageListResponse {
  messages: Message[];
  nextCursor: string | null;
  hasMore: boolean;
}

export const getRoomMessages = async (
  roomId: string,
  options: { cursor?: string | null; limit?: number; parentMessageId?: string | null } = {}
): Promise<MessageListResponse> => {
  const params = new URLSearchParams();
  if (options.cursor) params.append('cursor', options.cursor);
  if (options.limit) params.append('limit', options.limit.toString());
  if (options.parentMessageId) params.append('parentMessageId', options.parentMessageId);

  return request<MessageListResponse>(`/messages/room/${roomId}?${params.toString()}`);
};

export const sendMessage = async (data: {
  roomId: string;
  content: string;
  parentMessageId?: string | null;
  attachmentIds?: string[];
}): Promise<Message> => {
  return request<Message>('/messages', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const editMessage = async (messageId: string, content: string): Promise<Message> => {
  return request<Message>(`/messages/${messageId}`, {
    method: 'PATCH',
    body: JSON.stringify({ content }),
  });
};

export const deleteMessage = async (messageId: string): Promise<{ success: boolean }> => {
  return request<{ success: boolean }>(`/messages/${messageId}`, {
    method: 'DELETE',
  });
};

export const toggleReaction = async (messageId: string, emoji: string): Promise<MessageReaction[]> => {
  return request<MessageReaction[]>(`/messages/${messageId}/react`, {
    method: 'POST',
    body: JSON.stringify({ emoji }),
  });
};

export const getThreadReplies = async (rootMessageId: string): Promise<{ rootMessage: Message; replies: Message[] }> => {
  return request<{ rootMessage: Message; replies: Message[] }>(`/messages/${rootMessageId}/thread`);
};

export const uploadAttachment = async (file: File, roomId?: string): Promise<Attachment> => {
  const formData = new FormData();
  formData.append('file', file);
  if (roomId) formData.append('roomId', roomId);

  return request<Attachment>('/upload', {
    method: 'POST',
    body: formData,
  });
};
