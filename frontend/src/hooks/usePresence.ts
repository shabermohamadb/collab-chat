import { useState, useEffect } from 'react';
import { socketService } from '../services/socket.ts';
import { UserStatus } from '../types/index.ts';

export const usePresence = () => {
  const [presenceMap, setPresenceMap] = useState<Record<string, UserStatus>>({});

  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    const handlePresenceUpdate = (data: { userId: string; username: string; status: UserStatus }) => {
      setPresenceMap((prev) => ({
        ...prev,
        [data.userId]: data.status,
      }));
    };

    socket.on('presence:update', handlePresenceUpdate);

    return () => {
      socket.off('presence:update', handlePresenceUpdate);
    };
  }, []);

  const getUserStatus = (userId: string, defaultStatus: UserStatus = 'OFFLINE'): UserStatus => {
    return presenceMap[userId] || defaultStatus;
  };

  return {
    presenceMap,
    getUserStatus,
  };
};
