-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "username" TEXT,
    "avatar" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "totalWagered" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "totalWon" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "totalDeposited" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "totalWithdrawn" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "isVip" BOOLEAN NOT NULL DEFAULT false,
    "vipTier" INTEGER NOT NULL DEFAULT 0,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "banReason" TEXT,
    "referralCode" TEXT NOT NULL,
    "referredBy" TEXT,
    "clientSeed" TEXT NOT NULL,
    "nonce" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Balance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "amount" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "locked" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Balance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deposit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "amount" DECIMAL(32,18) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "confirmations" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "Deposit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Withdrawal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "txHash" TEXT,
    "toAddress" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "amount" DECIMAL(32,18) NOT NULL,
    "fee" DECIMAL(32,18) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "Withdrawal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "amount" DECIMAL(32,18) NOT NULL,
    "balanceBefore" DECIMAL(32,18) NOT NULL,
    "balanceAfter" DECIMAL(32,18) NOT NULL,
    "reference" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "price" DECIMAL(32,18) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MON',
    "houseEdge" DECIMAL(5,4) NOT NULL DEFAULT 0.05,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "totalOpens" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseItem" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "value" DECIMAL(32,18) NOT NULL,
    "rarity" TEXT NOT NULL,
    "probability" DECIMAL(10,8) NOT NULL,
    "color" TEXT NOT NULL,

    CONSTRAINT "CaseItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseOpen" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "betAmount" DECIMAL(32,18) NOT NULL,
    "winAmount" DECIMAL(32,18) NOT NULL,
    "currency" TEXT NOT NULL,
    "serverSeed" TEXT NOT NULL,
    "clientSeed" TEXT NOT NULL,
    "nonce" INTEGER NOT NULL,
    "roll" DECIMAL(20,18) NOT NULL,
    "isWin" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseOpen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Battle" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "totalCost" DECIMAL(32,18) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MON',
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "privateCode" TEXT,
    "cursedMode" BOOLEAN NOT NULL DEFAULT false,
    "serverSeed" TEXT NOT NULL,
    "serverSeedHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "winnerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Battle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BattleCase" (
    "id" TEXT NOT NULL,
    "battleId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL,

    CONSTRAINT "BattleCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BattleParticipant" (
    "id" TEXT NOT NULL,
    "battleId" TEXT NOT NULL,
    "odataId" TEXT,
    "slot" INTEGER NOT NULL,
    "isBot" BOOLEAN NOT NULL DEFAULT false,
    "totalValue" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "isWinner" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BattleParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BattleRound" (
    "id" TEXT NOT NULL,
    "battleId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "caseId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "itemValue" DECIMAL(32,18) NOT NULL,
    "itemRarity" TEXT NOT NULL,
    "itemImageUrl" TEXT NOT NULL,
    "roll" DECIMAL(20,18) NOT NULL,
    "clientSeed" TEXT NOT NULL,
    "nonce" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BattleRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WheelSpin" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "betAmount" DECIMAL(32,18) NOT NULL,
    "currency" TEXT NOT NULL,
    "multiplier" DECIMAL(10,4) NOT NULL,
    "winAmount" DECIMAL(32,18) NOT NULL,
    "segment" INTEGER NOT NULL,
    "serverSeed" TEXT NOT NULL,
    "clientSeed" TEXT NOT NULL,
    "nonce" INTEGER NOT NULL,
    "roll" DECIMAL(20,18) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WheelSpin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrashGame" (
    "id" TEXT NOT NULL,
    "gameNumber" SERIAL NOT NULL,
    "crashPoint" DECIMAL(10,4) NOT NULL,
    "serverSeed" TEXT NOT NULL,
    "serverSeedHash" TEXT NOT NULL,
    "publicSeed" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'betting',
    "startedAt" TIMESTAMP(3),
    "crashedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrashGame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrashBet" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "odataId" TEXT NOT NULL,
    "betAmount" DECIMAL(32,18) NOT NULL,
    "currency" TEXT NOT NULL,
    "autoCashout" DECIMAL(10,4),
    "cashoutAt" DECIMAL(10,4),
    "winAmount" DECIMAL(32,18),
    "status" TEXT NOT NULL DEFAULT 'active',
    "clientSeed" TEXT NOT NULL,
    "nonce" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrashBet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MineGame" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "betAmount" DECIMAL(32,18) NOT NULL,
    "currency" TEXT NOT NULL,
    "mineCount" INTEGER NOT NULL,
    "minePositions" INTEGER[],
    "revealed" INTEGER[],
    "status" TEXT NOT NULL DEFAULT 'active',
    "currentMultiplier" DECIMAL(10,4) NOT NULL DEFAULT 1,
    "winAmount" DECIMAL(32,18),
    "serverSeed" TEXT NOT NULL,
    "clientSeed" TEXT NOT NULL,
    "nonce" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "MineGame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UpgraderGame" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "betAmount" DECIMAL(32,18) NOT NULL,
    "currency" TEXT NOT NULL,
    "targetMultiplier" DECIMAL(10,4) NOT NULL,
    "winChance" DECIMAL(10,8) NOT NULL,
    "roll" DECIMAL(20,18) NOT NULL,
    "isWin" BOOLEAN NOT NULL,
    "winAmount" DECIMAL(32,18),
    "serverSeed" TEXT NOT NULL,
    "clientSeed" TEXT NOT NULL,
    "nonce" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UpgraderGame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlinkoGame" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "betAmount" DECIMAL(32,18) NOT NULL,
    "currency" TEXT NOT NULL,
    "risk" TEXT NOT NULL,
    "rows" INTEGER NOT NULL,
    "path" INTEGER[],
    "multiplier" DECIMAL(10,4) NOT NULL,
    "winAmount" DECIMAL(32,18) NOT NULL,
    "serverSeed" TEXT NOT NULL,
    "clientSeed" TEXT NOT NULL,
    "nonce" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlinkoGame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "room" TEXT NOT NULL DEFAULT 'general',
    "content" VARCHAR(500) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rain" (
    "id" TEXT NOT NULL,
    "createdById" TEXT,
    "amount" DECIMAL(32,18) NOT NULL,
    "currency" TEXT NOT NULL,
    "claimCount" INTEGER NOT NULL DEFAULT 0,
    "maxClaims" INTEGER NOT NULL,
    "amountPerClaim" DECIMAL(32,18) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RainClaim" (
    "id" TEXT NOT NULL,
    "rainId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(32,18) NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RainClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Promocode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" DECIMAL(32,18) NOT NULL,
    "currency" TEXT,
    "caseId" TEXT,
    "maxUses" INTEGER,
    "currentUses" INTEGER NOT NULL DEFAULT 0,
    "minLevel" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Promocode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromocodeClaim" (
    "id" TEXT NOT NULL,
    "promocodeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "value" DECIMAL(32,18) NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromocodeClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServerSeed" (
    "id" TEXT NOT NULL,
    "odataId" TEXT,
    "seed" TEXT NOT NULL,
    "seedHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usedAt" TIMESTAMP(3),
    "revealedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServerSeed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteStats" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "totalWagered" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "totalPaidOut" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "totalDeposits" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "totalWithdrawals" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "uniquePlayers" INTEGER NOT NULL DEFAULT 0,
    "newUsers" INTEGER NOT NULL DEFAULT 0,
    "gamesPlayed" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SiteStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE INDEX "Balance_userId_idx" ON "Balance"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Balance_userId_currency_key" ON "Balance"("userId", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "Deposit_txHash_key" ON "Deposit"("txHash");

-- CreateIndex
CREATE INDEX "Deposit_userId_idx" ON "Deposit"("userId");

-- CreateIndex
CREATE INDEX "Deposit_status_idx" ON "Deposit"("status");

-- CreateIndex
CREATE INDEX "Withdrawal_userId_idx" ON "Withdrawal"("userId");

-- CreateIndex
CREATE INDEX "Withdrawal_status_idx" ON "Withdrawal"("status");

-- CreateIndex
CREATE INDEX "Transaction_userId_createdAt_idx" ON "Transaction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Transaction_type_idx" ON "Transaction"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Case_slug_key" ON "Case"("slug");

-- CreateIndex
CREATE INDEX "Case_category_idx" ON "Case"("category");

-- CreateIndex
CREATE INDEX "Case_isActive_idx" ON "Case"("isActive");

-- CreateIndex
CREATE INDEX "CaseItem_caseId_idx" ON "CaseItem"("caseId");

-- CreateIndex
CREATE INDEX "CaseOpen_userId_createdAt_idx" ON "CaseOpen"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CaseOpen_caseId_idx" ON "CaseOpen"("caseId");

-- CreateIndex
CREATE INDEX "Battle_status_createdAt_idx" ON "Battle"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Battle_creatorId_idx" ON "Battle"("creatorId");

-- CreateIndex
CREATE INDEX "BattleCase_battleId_idx" ON "BattleCase"("battleId");

-- CreateIndex
CREATE INDEX "BattleParticipant_battleId_idx" ON "BattleParticipant"("battleId");

-- CreateIndex
CREATE UNIQUE INDEX "BattleParticipant_battleId_slot_key" ON "BattleParticipant"("battleId", "slot");

-- CreateIndex
CREATE INDEX "BattleRound_battleId_roundNumber_idx" ON "BattleRound"("battleId", "roundNumber");

-- CreateIndex
CREATE INDEX "WheelSpin_userId_createdAt_idx" ON "WheelSpin"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CrashGame_gameNumber_key" ON "CrashGame"("gameNumber");

-- CreateIndex
CREATE INDEX "CrashGame_status_idx" ON "CrashGame"("status");

-- CreateIndex
CREATE INDEX "CrashGame_gameNumber_idx" ON "CrashGame"("gameNumber");

-- CreateIndex
CREATE INDEX "CrashBet_gameId_idx" ON "CrashBet"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "CrashBet_gameId_odataId_key" ON "CrashBet"("gameId", "odataId");

-- CreateIndex
CREATE INDEX "MineGame_userId_createdAt_idx" ON "MineGame"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "MineGame_status_idx" ON "MineGame"("status");

-- CreateIndex
CREATE INDEX "UpgraderGame_userId_createdAt_idx" ON "UpgraderGame"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PlinkoGame_userId_createdAt_idx" ON "PlinkoGame"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ChatMessage_room_createdAt_idx" ON "ChatMessage"("room", "createdAt");

-- CreateIndex
CREATE INDEX "Rain_status_idx" ON "Rain"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RainClaim_rainId_userId_key" ON "RainClaim"("rainId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Promocode_code_key" ON "Promocode"("code");

-- CreateIndex
CREATE INDEX "Promocode_isActive_idx" ON "Promocode"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PromocodeClaim_promocodeId_userId_key" ON "PromocodeClaim"("promocodeId", "userId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE UNIQUE INDEX "ServerSeed_seed_key" ON "ServerSeed"("seed");

-- CreateIndex
CREATE UNIQUE INDEX "ServerSeed_seedHash_key" ON "ServerSeed"("seedHash");

-- CreateIndex
CREATE INDEX "ServerSeed_odataId_isActive_idx" ON "ServerSeed"("odataId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "SiteStats_date_key" ON "SiteStats"("date");

-- CreateIndex
CREATE INDEX "AdminLog_adminId_idx" ON "AdminLog"("adminId");

-- CreateIndex
CREATE INDEX "AdminLog_createdAt_idx" ON "AdminLog"("createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_referredBy_fkey" FOREIGN KEY ("referredBy") REFERENCES "User"("referralCode") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Balance" ADD CONSTRAINT "Balance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deposit" ADD CONSTRAINT "Deposit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Withdrawal" ADD CONSTRAINT "Withdrawal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseItem" ADD CONSTRAINT "CaseItem_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseOpen" ADD CONSTRAINT "CaseOpen_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseOpen" ADD CONSTRAINT "CaseOpen_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseOpen" ADD CONSTRAINT "CaseOpen_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "CaseItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BattleCase" ADD CONSTRAINT "BattleCase_battleId_fkey" FOREIGN KEY ("battleId") REFERENCES "Battle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BattleCase" ADD CONSTRAINT "BattleCase_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BattleParticipant" ADD CONSTRAINT "BattleParticipant_battleId_fkey" FOREIGN KEY ("battleId") REFERENCES "Battle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BattleParticipant" ADD CONSTRAINT "BattleParticipant_odataId_fkey" FOREIGN KEY ("odataId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BattleRound" ADD CONSTRAINT "BattleRound_battleId_fkey" FOREIGN KEY ("battleId") REFERENCES "Battle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BattleRound" ADD CONSTRAINT "BattleRound_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "BattleParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WheelSpin" ADD CONSTRAINT "WheelSpin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrashBet" ADD CONSTRAINT "CrashBet_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "CrashGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrashBet" ADD CONSTRAINT "CrashBet_odataId_fkey" FOREIGN KEY ("odataId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MineGame" ADD CONSTRAINT "MineGame_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpgraderGame" ADD CONSTRAINT "UpgraderGame_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlinkoGame" ADD CONSTRAINT "PlinkoGame_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RainClaim" ADD CONSTRAINT "RainClaim_rainId_fkey" FOREIGN KEY ("rainId") REFERENCES "Rain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RainClaim" ADD CONSTRAINT "RainClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromocodeClaim" ADD CONSTRAINT "PromocodeClaim_promocodeId_fkey" FOREIGN KEY ("promocodeId") REFERENCES "Promocode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromocodeClaim" ADD CONSTRAINT "PromocodeClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
