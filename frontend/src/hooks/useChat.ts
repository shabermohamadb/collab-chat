import { useState, useEffect, useCallback, useRef } from 'react';
import { Message, Room } from '../types/index.ts';
import * as messageService from '../services/messages.ts';
import * as roomService from '../services/rooms.ts';
import { socketService } from '../services/socket.ts';

export const useChat = (activeRoomId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);

  const activeRoomRef = useRef<string | null>(activeRoomId);
  activeRoomRef.current = activeRoomId;

  // Load Room Details & Messages
  const loadRoom = useCallback(async (roomId: string) => {
    setLoading(true);
    try {
      const [roomData, messagesData] = await Promise.all([
        roomService.getRoomById(roomId),
        messageService.getRoomMessages(roomId),
      ]);

      setRoom(roomData);
      setMessages(messagesData.messages);
      setHasMore(messagesData.hasMore);
      setNextCursor(messagesData.nextCursor);

      // Join socket room
      socketService.joinRoom(roomId);
    } catch (err) {
      console.error('Failed to load room:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!activeRoomId) {
      setRoom(null);
      setMessages([]);
      return;
    }

    loadRoom(activeRoomId);

    return () => {
      if (activeRoomId) {
        socketService.leaveRoom(activeRoomId);
      }
    };
  }, [activeRoomId, loadRoom]);

  // Load older messages (pagination)
  const loadOlderMessages = async () => {
    if (!activeRoomId || !hasMore || loadingMore || !nextCursor) return;

    setLoadingMore(true);
    try {
      const res = await messageService.getRoomMessages(activeRoomId, {
        cursor: nextCursor,
      });

      setMessages((prev) => [...res.messages, ...prev]);
      setHasMore(res.hasMore);
      setNextCursor(res.nextCursor);
    } catch (err) {
      console.error('Failed to load older messages:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Socket event listeners for real-time messages & updates
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    const handleNewMessage = (newMessage: Message) => {
      if (newMessage.roomId === activeRoomRef.current) {
        setMessages((prev) => {
          // Avoid duplicate messages if already inserted optimistically
          if (prev.some((m) => m.id === newMessage.id)) {
            return prev.map((m) => (m.id === newMessage.id ? newMessage : m));
          }
          return [...prev, newMessage];
        });
      }
    };

    const handleMessageEdited = (editedMessage: Message) => {
      if (editedMessage.roomId === activeRoomRef.current) {
        setMessages((prev) =>
          prev.map((m) => (m.id === editedMessage.id ? { ...m, ...editedMessage } : m))
        );
      }
    };

    const handleMessageDeleted = (data: { messageId: string; roomId: string }) => {
      if (data.roomId === activeRoomRef.current) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === data.messageId
              ? { ...m, isDeleted: true, content: 'This message has been deleted.' }
              : m
          )
        );
      }
    };

    const handleReactionUpdated = (data: { messageId: string; roomId: string; reactions: any[] }) => {
      if (data.roomId === activeRoomRef.current) {
        setMessages((prev) =>
          prev.map((m) => (m.id === data.messageId ? { ...m, reactions: data.reactions } : m))
        );
      }
    };

    const handleThreadReply = (data: { roomId: string; parentMessageId: string; message: Message }) => {
      if (data.roomId === activeRoomRef.current) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === data.parentMessageId
              ? { ...m, replyCount: (m.replyCount || 0) + 1 }
              : m
          )
        );
      }
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:edited', handleMessageEdited);
    socket.on('message:deleted', handleMessageDeleted);
    socket.on('reaction:updated', handleReactionUpdated);
    socket.on('thread:reply', handleThreadReply);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:edited', handleMessageEdited);
      socket.off('message:deleted', handleMessageDeleted);
      socket.off('reaction:updated', handleReactionUpdated);
      socket.off('thread:reply', handleThreadReply);
    };
  }, []);

  const sendNewMessage = async (content: string, attachmentIds?: string[]) => {
    if (!activeRoomId) return;
    return messageService.sendMessage({
      roomId: activeRoomId,
      content,
      attachmentIds,
    });
  };

  const editExistingMessage = async (messageId: string, content: string) => {
    return messageService.editMessage(messageId, content);
  };

  const deleteExistingMessage = async (messageId: string) => {
    return messageService.deleteMessage(messageId);
  };

  const reactToMessage = async (messageId: string, emoji: string) => {
    return messageService.toggleReaction(messageId, emoji);
  };

  return {
    room,
    messages,
    loading,
    loadingMore,
    hasMore,
    loadOlderMessages,
    sendMessage: sendNewMessage,
    editMessage: editExistingMessage,
    deleteMessage: deleteExistingMessage,
    reactToMessage,
    reloadRoom: () => activeRoomId && loadRoom(activeRoomId),
  };
};
