# TOROS Games backend (Node 20 + TypeScript + Prisma + Express).
# Multi-stage: build aşaması tsc + prisma generate yapar, runtime aşaması
# sadece dist/ + node_modules production install + prisma client'ı taşır.

# ── Stage 1: deps ────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Workspace root manifest'i kopyala (npm workspaces için)
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/

# Sadece backend workspace'inin bağımlılıklarını yükle
RUN npm ci --workspace=backend --include-workspace-root --no-audit --no-fund

# ── Stage 2: builder ─────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY backend/ ./backend/
COPY package.json package-lock.json ./

# Prisma client + TS compile
WORKDIR /app/backend
RUN npx prisma generate
RUN npm run build

# ── Stage 3: runtime ─────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app

# Sadece production deps + compiled dist + prisma client
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/backend/node_modules /app/backend/node_modules
COPY --from=builder /app/backend/dist /app/backend/dist
COPY --from=builder /app/backend/node_modules/.prisma /app/backend/node_modules/.prisma
COPY --from=builder /app/backend/prisma /app/backend/prisma
COPY backend/package.json /app/backend/

WORKDIR /app/backend
EXPOSE 4000

# Migration'ı container start'ta otomatik uygulamak istersek:
#   prisma migrate deploy && node dist/index.js
# Şimdilik dev modda `prisma db push` ile schema'yı manuel sync ediyoruz;
# production'a geçince migrate deploy yapılır.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
