import { io, type Socket } from 'socket.io-client';
import { getAccessToken, getApiBaseUrl } from '@/lib/api';

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(): Socket {
  if (socket?.connected) return socket;

  const token = getAccessToken();
  socket = io(getApiBaseUrl(), {
    autoConnect: true,
    withCredentials: true,
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function updateSocketAuth(token: string | null): void {
  if (!socket) return;
  socket.auth = { token };
  if (token && !socket.connected) {
    socket.connect();
  } else if (token) {
    socket.disconnect().connect();
  } else {
    socket.disconnect();
  }
}

export function joinRoom(
  event: 'join:board' | 'join:workspace' | 'join:channel' | 'join:project',
  id: string,
): void {
  const s = getSocket();
  if (!s) return;
  s.emit(event, id);
}
