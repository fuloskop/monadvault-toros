import 'dotenv/config';
import { createServer } from 'http';
import { app } from './app.js';
import { initializeSocket } from './socket/index.js';
import { prisma } from './config/database.js';
import { redis } from './config/redis.js';
import { crashService } from './services/crash.service.js';

const PORT = process.env.PORT || 4000;

async function main() {
  // Create HTTP server
  const httpServer = createServer(app);

  // Initialize Socket.io
  const io = initializeSocket(httpServer);

  // Start crash game loop
  await crashService.initialize(io);

  // Start server
  httpServer.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   ███╗   ███╗ ██████╗ ███╗   ██╗ █████╗ ██████╗          ║
║   ████╗ ████║██╔═══██╗████╗  ██║██╔══██╗██╔══██╗         ║
║   ██╔████╔██║██║   ██║██╔██╗ ██║███████║██║  ██║         ║
║   ██║╚██╔╝██║██║   ██║██║╚██╗██║██╔══██║██║  ██║         ║
║   ██║ ╚═╝ ██║╚██████╔╝██║ ╚████║██║  ██║██████╔╝         ║
║   ╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═╝╚═════╝          ║
║                                                          ║
║   ██╗   ██╗ █████╗ ██╗   ██╗██╗  ████████╗               ║
║   ██║   ██║██╔══██╗██║   ██║██║  ╚══██╔══╝               ║
║   ██║   ██║███████║██║   ██║██║     ██║                  ║
║   ╚██╗ ██╔╝██╔══██║██║   ██║██║     ██║                  ║
║    ╚████╔╝ ██║  ██║╚██████╔╝███████╗██║                  ║
║     ╚═══╝  ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝                  ║
║                                                          ║
║   🎰 Server running on port ${PORT}                        ║
║   🔗 http://localhost:${PORT}                              ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
    `);
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
});

main().catch(async (err) => {
  console.error('Failed to start server:', err);
  await prisma.$disconnect();
  process.exit(1);
});

