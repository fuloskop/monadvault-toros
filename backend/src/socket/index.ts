import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verifyToken, AuthUser } from '../middleware/auth.js';
import { crashService } from '../services/crash.service.js';
import { prisma } from '../config/database.js';
import { redis, REDIS_KEYS } from '../config/redis.js';

interface ServerToClientEvents {
  // Crash events
  'crash:new': (data: { gameId: string; gameNumber: number; serverSeedHash: string; bettingEndsAt: number }) => void;
  'crash:started': (data: { gameId: string; gameNumber: number }) => void;
  'crash:tick': (data: { multiplier: number }) => void;
  'crash:crashed': (data: { gameId: string; crashPoint: number; serverSeed: string }) => void;
  'crash:bet': (data: { userId: string; username: string | null; amount: number; autoCashout?: number }) => void;
  'crash:cashout': (data: { userId: string; username: string | null; multiplier: number; winAmount: number }) => void;
  'crash:state': (data: any) => void;
  
  // Battle events
  'battle:update': (data: any) => void;
  'battle:round': (data: any) => void;
  'battle:complete': (data: any) => void;
  
  // Chat events
  'chat:message': (data: any) => void;
  'chat:delete': (data: { messageId: string }) => void;
  
  // Live feed
  'live:win': (data: any) => void;
  
  // Rain
  'rain:start': (data: any) => void;
  'rain:claim': (data: { userId: string; username: string | null }) => void;
  'rain:end': () => void;
  
  // General
  'error': (data: { message: string }) => void;
  'online:count': (count: number) => void;
}

interface ClientToServerEvents {
  // Room management
  'join:chat': (room: string) => void;
  'join:crash': () => void;
  'join:battle': (battleId: string) => void;
  'join:live': () => void;
  'leave:battle': (battleId: string) => void;
  
  // Crash game
  'crash:bet': (data: { amount: number; currency?: string; autoCashout?: number }) => void;
  'crash:cashout': () => void;
  
  // Chat
  'chat:message': (data: { room: string; content: string }) => void;
}

interface SocketData {
  user?: AuthUser;
}

export function initializeSocket(httpServer: HttpServer) {
  const io = new Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingInterval: 25000,
    pingTimeout: 20000
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (token) {
      try {
        const user = await verifyToken(token);
        socket.data.user = user;
      } catch {
        // Continue without auth for public rooms
      }
    }
    next();
  });

  // Track online users
  let onlineCount = 0;

  io.on('connection', async (socket) => {
    onlineCount++;
    io.emit('online:count', onlineCount);

    console.log(`🔌 Client connected: ${socket.id} ${socket.data.user?.username || 'anonymous'}`);

    // Add user to online set if authenticated
    if (socket.data.user) {
      await redis.sadd(REDIS_KEYS.ONLINE_USERS, socket.data.user.id);
    }

    // ============ ROOM MANAGEMENT ============

    socket.on('join:chat', (room) => {
      socket.join(`chat:${room}`);
    });

    socket.on('join:crash', () => {
      socket.join('crash');
      // Send current game state
      const currentGame = crashService.getCurrentGame();
      if (currentGame) {
        socket.emit('crash:state', {
          gameId: currentGame.gameId,
          gameNumber: currentGame.gameNumber,
          status: currentGame.status,
          multiplier: currentGame.currentMultiplier,
          bets: Array.from(currentGame.bets.entries()).map(([userId, bet]) => ({
            userId,
            username: bet.username,
            amount: bet.betAmount,
            autoCashout: bet.autoCashout,
            status: bet.status,
            cashoutAt: bet.cashoutAt
          }))
        });
      }
    });

    socket.on('join:battle', (battleId) => {
      socket.join(`battle:${battleId}`);
    });

    socket.on('leave:battle', (battleId) => {
      socket.leave(`battle:${battleId}`);
    });

    socket.on('join:live', () => {
      socket.join('live');
    });

    // ============ CRASH GAME ============

    socket.on('crash:bet', async (data) => {
      if (!socket.data.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      const result = await crashService.placeBet(
        socket.data.user.id,
        socket.data.user.username,
        data.amount,
        data.currency || 'MON',
        data.autoCashout
      );

      if (!result.success) {
        socket.emit('error', { message: result.error || 'Failed to place bet' });
      }
    });

    socket.on('crash:cashout', async () => {
      if (!socket.data.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      const result = await crashService.cashout(socket.data.user.id);
      if (!result.success) {
        socket.emit('error', { message: 'Failed to cashout' });
      }
    });

    // ============ CHAT ============

    socket.on('chat:message', async (data) => {
      if (!socket.data.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      const { room, content } = data;

      if (!content || content.length > 500) {
        socket.emit('error', { message: 'Invalid message' });
        return;
      }

      // Check VIP access
      if (room === 'vip') {
        const user = await prisma.user.findUnique({
          where: { id: socket.data.user.id },
          select: { isVip: true }
        });
        if (!user?.isVip) {
          socket.emit('error', { message: 'VIP access required' });
          return;
        }
      }

      // Save message
      const message = await prisma.chatMessage.create({
        data: {
          userId: socket.data.user.id,
          room,
          content: content.trim()
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
              level: true,
              isVip: true,
              vipTier: true
            }
          }
        }
      });

      // Broadcast to room
      io.to(`chat:${room}`).emit('chat:message', message);
    });

    // ============ DISCONNECT ============

    socket.on('disconnect', async () => {
      onlineCount--;
      io.emit('online:count', onlineCount);

      if (socket.data.user) {
        await redis.srem(REDIS_KEYS.ONLINE_USERS, socket.data.user.id);
      }

      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  // ============ CRASH GAME EVENTS ============

  crashService.on('newGame', (data) => {
    io.to('crash').emit('crash:new', data);
  });

  crashService.on('gameStarted', (data) => {
    io.to('crash').emit('crash:started', data);
  });

  crashService.on('tick', (data) => {
    io.to('crash').volatile.emit('crash:tick', data);
  });

  crashService.on('crashed', (data) => {
    io.to('crash').emit('crash:crashed', data);
  });

  crashService.on('betPlaced', (data) => {
    io.to('crash').emit('crash:bet', data);
  });

  crashService.on('cashout', (data) => {
    io.to('crash').emit('crash:cashout', data);
  });

  return io;
}

