import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket && typeof window !== 'undefined') {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
    socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('✅ [WebSocket Client] Conectado al servidor socket:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ [WebSocket Client] Desconectado:', reason);
    });

    socket.on('connect_error', (error) => {
      console.warn('⚠️ [WebSocket Client] Error de conexión:', error.message);
    });
  }
  return socket!;
};
