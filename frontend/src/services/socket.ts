import { io, Socket } from 'socket.io-client';
import { getAuthToken } from './api.ts';

// Connect via same-origin Vite proxy or direct backend URL
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

class SocketService {
  private socket: Socket | null = null;

  public connect(): Socket | null {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    const token = getAuthToken();

    if (this.socket) {
      this.socket.disconnect();
    }

    try {
      this.socket = io(SOCKET_URL, {
        auth: { token: token || undefined },
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      this.socket.on('connect', () => {
        console.log('🔌 Socket connected successfully:', this.socket?.id);
      });

      this.socket.on('connect_error', (err) => {
        console.warn('⚠️ Socket connection notice:', err.message);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 Socket disconnected:', reason);
      });

      return this.socket;
    } catch (err) {
      console.warn('Socket initialization error:', err);
      return null;
    }
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public joinRoom(roomId: string) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('room:join', { roomId });
    }
  }

  public leaveRoom(roomId: string) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('room:leave', { roomId });
    }
  }

  public emitTyping(roomId: string, isTyping: boolean) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(isTyping ? 'typing:start' : 'typing:stop', { roomId });
    }
  }

  public emitPresenceChange(status: 'ONLINE' | 'AWAY' | 'OFFLINE') {
    if (this.socket && this.socket.connected) {
      this.socket.emit('presence:status_change', { status });
    }
  }
}

export const socketService = new SocketService();
