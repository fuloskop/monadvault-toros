# TOROS Games backend (Node 20 + Prisma + Express).
# npm workspaces TÜM bağımlılıkları root /app/node_modules'a hoist ediyor;
# workspace-spesifik node_modules klasörü oluşmuyor (paket conflict yok).
# Önceki Dockerfile `/app/backend/node_modules` kopyalamaya çalışınca
# "not found" ile düşüyordu — bu sürüm sadece root node_modules'u taşıyor.

# ── Stage 1: deps ────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Workspace manifest'lerini kopyala (root + her iki sub-workspace)
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/

# Tüm workspace'leri kur — hoist root'a düşer
RUN npm ci --no-audit --no-fund

# ── Stage 2: builder ─────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY backend/ ./backend/

# Prisma client (DATABASE_URL placeholder — runtime'da gerçek değer env'den)
WORKDIR /app/backend
ENV DATABASE_URL=mysql://x:x@localhost:3306/x
RUN npx prisma generate
RUN npm run build

# ── Stage 3: runtime ─────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app/backend
ENV NODE_ENV=production
ENV PORT=4000

# Tüm node_modules'u taşı (prod-only ayıklama optimize-later iş; ilk turda
# çalışır image ön planda)
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/prisma ./prisma
COPY backend/package.json ./

EXPOSE 4000
# /health endpoint app.ts'te tanımlı (basit ping, DB sorgusu yok)
HEALTHCHECK --interval=10s --timeout=3s --start-period=30s --retries=3 \
  CMD wget -q --spider http://localhost:4000/health || exit 1

# Container start'ta migration deploy + Node start. Prisma migrate deploy
# idempotent — uygulanmış migration'ları skipler.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
