# 🦊 Foxie Casino

A provably fair casino on Monad blockchain featuring Coin Flip, Mines, Roulette, and Upgrader games.

## 🎮 Games

- **Coin Flip** - Classic 50/50 with 1.98x multiplier
- **Mines** - Navigate a minefield, cash out anytime for increasing multipliers
- **Roulette** - Bet on colors, numbers, odd/even with up to 35x multipliers
- **Upgrader** - Risk it all for custom multipliers up to 100x

## ✨ Features

- 🔒 **Provably Fair** - On-chain randomness with verifiable results
- 💰 **Automatic Payouts** - Smart contract handles all bets and payouts
- 💬 **Live Chat** - Real-time chat with other players
- 🏆 **Points System** - Earn 10 points per MON wagered
- 👛 **Direct Wallet Connection** - Connect via MetaMask or other wallets

---

## 🚀 Deployment Guide

### Step 1: Deploy Smart Contract

```bash
# Navigate to contracts folder
cd contracts

# Install dependencies
npm install

# Create .env file with your private key
# PRIVATE_KEY=your_private_key_without_0x

# Deploy to Monad Testnet
npm run deploy:testnet
```

After deployment, you'll get a contract address. Copy it!

### Step 2: Configure Frontend

Create `.env.local` in the root `foxie-casino` folder:

```env
# Smart Contract
NEXT_PUBLIC_CASINO_CONTRACT=0xYourContractAddressHere

# Supabase (optional - for chat & leaderboards)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Step 3: Fund the House

After deploying, fund the casino's house bankroll:

```javascript
// Using ethers.js or the contract's depositHouse function
await casino.depositHouse({ value: ethers.parseEther("100") });
```

Or send MON directly to the contract address.

### Step 4: Launch Frontend

```bash
# In the foxie-casino root directory
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📜 Smart Contract

### Contract Functions

| Function | Description |
|----------|-------------|
| `playCoinFlip(choice, clientSeed)` | Play coin flip (0=heads, 1=tails) |
| `playRouletteColor(color, clientSeed)` | Play roulette (0=green, 1=red, 2=black) |
| `playUpgrader(multiplier, clientSeed)` | Play upgrader with custom multiplier |
| `placeBet(gameType, multiplier, winChance, clientSeed)` | Generic bet function |
| `getHouseBalance()` | View house bankroll |
| `depositHouse()` | Add funds to house (owner only) |
| `withdrawHouse(amount)` | Withdraw from house (owner only) |

### House Settings (Owner Only)

| Function | Description |
|----------|-------------|
| `setHouseEdge(basisPoints)` | Set house edge (default: 200 = 2%) |
| `setBetLimits(min, max, maxPayout)` | Set betting limits |
| `pause()` / `unpause()` | Emergency pause |

### Security Features

- ✅ ReentrancyGuard - Prevents reentrancy attacks
- ✅ Pausable - Emergency stop capability
- ✅ Ownable - Protected admin functions
- ✅ Bet limits - Min/max bet protection

---

## 🔧 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Blockchain**: Wagmi, Viem (Monad EVM)
- **Smart Contracts**: Solidity 0.8.19, Hardhat, OpenZeppelin
- **Database**: Supabase (PostgreSQL)

---

## 🌐 Monad Network

### Testnet
- **Chain ID**: 10143
- **RPC**: https://testnet-rpc.monad.xyz
- **Explorer**: https://testnet.monadexplorer.com
- **Currency**: MON

### Add to MetaMask
1. Network Name: Monad Testnet
2. RPC URL: https://testnet-rpc.monad.xyz
3. Chain ID: 10143
4. Currency Symbol: MON

---

## 📁 Project Structure

```
foxie-casino/
├── contracts/              # Solidity smart contracts
│   ├── FoxieCasino.sol    # Main casino contract
│   ├── scripts/deploy.js  # Deployment script
│   └── hardhat.config.js  # Hardhat configuration
├── src/
│   ├── app/               # Next.js pages
│   ├── components/        # React components
│   │   └── games/         # Game components
│   └── lib/
│       ├── contract.ts    # Contract integration
│       ├── supabase.ts    # Database client
│       └── store.ts       # State management
└── ...
```

---

## 🛡️ Security Notes

- Always verify the contract on the block explorer
- Start with small house bankroll for testing
- Monitor contract events for suspicious activity
- Keep owner private key secure

---

## 📜 License

MIT License - Build cool stuff! 🦊

---

**Luck Favors the Bold** 🎲✨
