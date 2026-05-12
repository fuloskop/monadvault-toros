# TOROS Games backend (Node 20 + Prisma + Express).
# npm workspaces TÜM bağımlılıkları root /app/node_modules'a hoist ediyor;
# workspace-spesifik node_modules klasörü oluşmuyor (paket conflict yok).
# Önceki Dockerfile `/app/backend/node_modules` kopyalamaya çalışınca
# "not found" ile düşüyordu — bu sürüm sadece root node_modules'u taşıyor.

# ── Stage 1: deps ────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Native bindings (socket.io'nun utf-8-validate, ws bufferutil vs.) için
# node-gyp Python + C++ toolchain ister. Alpine bunlarla gelmiyor.
RUN apk add --no-cache python3 make g++

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

# Prisma binary OpenSSL bekliyor (alpine base'inde libssl yok by default).
# Eksikse query engine schema parse fail eder: "Could not parse schema engine
# response: SyntaxError". `libc6-compat` Prisma'nın glibc-linked native
# binary'sini Alpine musl üzerinde çalıştırmak için.
RUN apk add --no-cache openssl libc6-compat

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

# Container start'ta schema sync + Node start.
# `prisma db push` migration directory'sini bypass eder, schema.prisma'yı
# direkt DB'ye uygular. Postgres migrations'ı arşivlediğimiz için (Task 32)
# migrate deploy boş çalışıyordu → schema oluşmuyor → server crash.
# db push idempotent (no changes → no-op), prod data yokken safe.
# --accept-data-loss soft-launch'ta tehlikesiz; sonradan migrate deploy
# pattern'ine geçilebilir.
CMD ["sh", "-c", "npx prisma db push --skip-generate --accept-data-loss && node dist/index.js"]
