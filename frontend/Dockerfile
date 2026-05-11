# TOROS Games frontend (Next.js 14 + React 18 + Tailwind v3).
# Standalone output ile minimal runtime image.

# ── Stage 1: deps ────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY frontend/package.json frontend/
COPY backend/package.json backend/

RUN npm ci --workspace=frontend --include-workspace-root --no-audit --no-fund

# ── Stage 2: builder ─────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules
COPY frontend/ ./frontend/
COPY package.json package-lock.json ./

# Build-time env'ler — basePath + web3 flag burada bake ediliyor
ARG NEXT_PUBLIC_BASE_PATH=/games
ARG NEXT_PUBLIC_API_URL=
ARG NEXT_PUBLIC_WS_URL=
ARG NEXT_PUBLIC_WEB3_ENABLED=false
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_WEB3_ENABLED=$NEXT_PUBLIC_WEB3_ENABLED

WORKDIR /app/frontend
RUN npm run build

# ── Stage 3: runtime ─────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Next.js standalone output yapılandırılmamışsa tüm dist + node_modules taşı
COPY --from=builder /app/frontend/.next /app/.next
COPY --from=builder /app/frontend/public /app/public
COPY --from=builder /app/frontend/package.json /app/package.json
COPY --from=builder /app/frontend/next.config.js /app/next.config.js
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/frontend/node_modules /app/frontend/node_modules

EXPOSE 3000
CMD ["npx", "next", "start"]
