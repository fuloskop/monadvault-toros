# TOROS Games frontend (Next.js 14 + React 18 + Tailwind v3).
# npm workspaces hoisting nedeniyle node_modules sadece root'ta (/app/...);
# backend Dockerfile ile aynı pattern.

# ── Stage 1: deps ────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY frontend/package.json frontend/
COPY backend/package.json backend/

RUN npm ci --no-audit --no-fund

# ── Stage 2: builder ─────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY frontend/ ./frontend/

# Build-time public env'ler — basePath + web3 flag burada bake ediliyor
ARG NEXT_PUBLIC_BASE_PATH=/games
ARG NEXT_PUBLIC_API_URL=
ARG NEXT_PUBLIC_WS_URL=
ARG NEXT_PUBLIC_WEB3_ENABLED=false
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_WEB3_ENABLED=$NEXT_PUBLIC_WEB3_ENABLED

WORKDIR /app/frontend
# Upstream MonadVault'ta frontend/public klasörü repo'da yok; Next.js
# build için zorunlu değil, ama runtime COPY satırı fail eder. Boş dir
# yarat ki COPY geçsin (favicon vs. eklenirse buraya gider).
RUN mkdir -p public
RUN npm run build

# ── Stage 3: runtime ─────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app/frontend
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Full .next + node_modules — Next.js standalone output config edilmemiş;
# optimize-later iş, ilk turda çalışır image.
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=builder /app/frontend/.next ./.next
COPY --from=builder /app/frontend/public ./public
COPY --from=builder /app/frontend/package.json ./package.json
COPY --from=builder /app/frontend/next.config.js ./next.config.js

EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=30s --retries=3 \
  CMD wget -q --spider http://localhost:3000/games/ || exit 1

CMD ["npx", "next", "start"]
