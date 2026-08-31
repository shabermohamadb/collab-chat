import { request } from './api.ts';
import { Room, RoomMember } from '../types/index.ts';

export const getUserRooms = async (): Promise<Room[]> => {
  return request<Room[]>('/rooms/user');
};

export const getPublicRooms = async (): Promise<Room[]> => {
  return request<Room[]>('/rooms/public');
};

export const getRoomById = async (roomId: string): Promise<Room> => {
  return request<Room>(`/rooms/${roomId}`);
};

export const createRoom = async (roomData: {
  name: string;
  description?: string;
  isPrivate?: boolean;
}): Promise<Room> => {
  return request<Room>('/rooms', {
    method: 'POST',
    body: JSON.stringify(roomData),
  });
};

export const joinRoom = async (roomId: string): Promise<RoomMember> => {
  return request<RoomMember>(`/rooms/${roomId}/join`, {
    method: 'POST',
  });
};

export const leaveRoom = async (roomId: string): Promise<{ success: boolean }> => {
  return request<{ success: boolean }>(`/rooms/${roomId}/leave`, {
    method: 'POST',
  });
};

export const updateRoom = async (
  roomId: string,
  data: { name?: string; description?: string; isPrivate?: boolean; isArchived?: boolean }
): Promise<Room> => {
  return request<Room>(`/rooms/${roomId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

export const deleteRoom = async (roomId: string): Promise<{ success: boolean }> => {
  return request<{ success: boolean }>(`/rooms/${roomId}`, {
    method: 'DELETE',
  });
};

export const getOrCreateDirectMessage = async (targetUserId: string): Promise<Room> => {
  return request<Room>('/rooms/direct-message', {
    method: 'POST',
    body: JSON.stringify({ targetUserId }),
  });
};
