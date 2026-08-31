import { useState, useEffect, useRef } from 'react';
import { socketService } from '../services/socket.ts';
import { Typer } from '../types/index.ts';

export const useTyping = (roomId: string | null) => {
  const [typers, setTypers] = useState<Typer[]>([]);
  const typingTimeoutRef = useRef<any>(null);

  useEffect(() => {
    setTypers([]);
    if (!roomId) return;

    const socket = socketService.getSocket();
    if (!socket) return;

    const handleTypingList = (data: { roomId: string; typers: Typer[] }) => {
      if (data.roomId === roomId) {
        setTypers(data.typers);
      }
    };

    const handleTypingUpdate = (data: { roomId: string; userId: string; username: string; displayName: string; isTyping: boolean }) => {
      if (data.roomId === roomId) {
        setTypers((prev) => {
          if (data.isTyping) {
            if (prev.some((t) => t.userId === data.userId)) return prev;
            return [...prev, { userId: data.userId, username: data.username, displayName: data.displayName }];
          } else {
            return prev.filter((t) => t.userId !== data.userId);
          }
        });
      }
    };

    socket.on('typing:list', handleTypingList);
    socket.on('typing:update', handleTypingUpdate);

    return () => {
      socket.off('typing:list', handleTypingList);
      socket.off('typing:update', handleTypingUpdate);
    };
  }, [roomId]);

  const sendTyping = () => {
    if (!roomId) return;

    socketService.emitTyping(roomId, true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (roomId) {
        socketService.emitTyping(roomId, false);
      }
    }, 2000);
  };

  const stopTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (roomId) {
      socketService.emitTyping(roomId, false);
    }
  };

  return {
    typers,
    sendTyping,
    stopTyping,
  };
};
