import { useState, useEffect } from 'react';
import { socketService } from '../services/socket.ts';
import { useAuth } from './useAuth.tsx';

export const useSocket = () => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');

  useEffect(() => {
    if (!user) {
      setIsConnected(false);
      setConnectionStatus('disconnected');
      return;
    }

    const socket = socketService.connect();
    if (!socket) {
      setConnectionStatus('disconnected');
      return;
    }

    const handleConnect = () => {
      setIsConnected(true);
      setConnectionStatus('connected');
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setConnectionStatus('disconnected');
    };

    const handleConnectError = () => {
      setIsConnected(false);
      setConnectionStatus('connecting');
    };

    if (socket.connected) {
      setIsConnected(true);
      setConnectionStatus('connected');
    } else {
      setConnectionStatus('connecting');
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
    };
  }, [user]);

  return {
    socket: socketService.getSocket(),
    isConnected,
    connectionStatus,
    socketService,
  };
};
