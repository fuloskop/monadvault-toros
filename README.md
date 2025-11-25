# MonadVault 🎰

**"Unlock Your Fortune"**

A high-performance, provably fair crypto casino platform built on the Monad blockchain.

## Features

- 🎁 **Lootbox Opening** - Open cases with stunning animations
- ⚔️ **Case Battles** - Compete against other players in real-time
- 🎡 **Wheel Spins** - Classic wheel of fortune
- 📈 **Crash Game** - Multiplier-based betting game
- 💣 **Mines** - Navigate through a minefield
- ⬆️ **Upgrader** - Risk it all for bigger rewards
- 🎯 **Plinko** - Watch the ball bounce to your fortune

## Tech Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion
- Socket.io-client
- wagmi + RainbowKit

### Backend
- Node.js + Express.js
- Socket.io
- PostgreSQL + Prisma ORM
- Redis

### Blockchain
- Monad (EVM-compatible)
- Solidity Smart Contracts
- ethers.js v6

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- pnpm or npm

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Run database migrations
npm run db:migrate

# Seed the database
npm run db:seed

# Start development servers
npm run dev
```

### Environment Variables

See `.env.example` files in both `frontend` and `backend` directories.

## Project Structure

```
monadvault/
├── frontend/           # Next.js 14 app
│   ├── src/
│   │   ├── app/       # App router pages
│   │   ├── components/ # React components
│   │   ├── hooks/     # Custom hooks
│   │   ├── lib/       # Utilities
│   │   └── stores/    # Zustand stores
│   └── public/        # Static assets
├── backend/           # Express.js server
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── socket/
│   │   ├── routes/
│   │   └── middleware/
│   └── prisma/        # Database schema
└── contracts/         # Solidity smart contracts
```

## Provably Fair

All games use a cryptographically secure provably fair system:

1. Server generates a seed and shows its SHA-256 hash before the game
2. Player provides their own client seed
3. Combined seeds generate verifiable random outcomes
4. After the game, server seed is revealed for verification

## License

MIT License - See [LICENSE](LICENSE) for details.

