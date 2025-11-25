import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';

class SocketClient {
  private socket: Socket | null = null;
  private token: string | null = null;

  connect(token?: string): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.token = token || null;

    this.socket = io(SOCKET_URL, {
      auth: token ? { token } : undefined,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
    });

    this.socket.on('connect', () => {
      console.log('🔌 Socket connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 Socket connection error:', error.message);
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  updateToken(token: string): void {
    this.token = token;
    if (this.socket) {
      this.socket.auth = { token };
      this.socket.disconnect().connect();
    }
  }

  // Room management
  joinCrash(): void {
    this.socket?.emit('join:crash');
  }

  joinChat(room: string): void {
    this.socket?.emit('join:chat', room);
  }

  joinBattle(battleId: string): void {
    this.socket?.emit('join:battle', battleId);
  }

  leaveBattle(battleId: string): void {
    this.socket?.emit('leave:battle', battleId);
  }

  joinLive(): void {
    this.socket?.emit('join:live');
  }

  // Crash game actions
  placeCrashBet(amount: number, currency: string = 'MON', autoCashout?: number): void {
    this.socket?.emit('crash:bet', { amount, currency, autoCashout });
  }

  cashoutCrash(): void {
    this.socket?.emit('crash:cashout');
  }

  // Chat actions
  sendChatMessage(room: string, content: string): void {
    this.socket?.emit('chat:message', { room, content });
  }

  // Event listeners
  on(event: string, callback: (...args: any[]) => void): void {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void): void {
    this.socket?.off(event, callback);
  }

  once(event: string, callback: (...args: any[]) => void): void {
    this.socket?.once(event, callback);
  }
}

export const socketClient = new SocketClient();

