# syntax=docker/dockerfile:1.7

# ── Stage 1: Dependencies ───────────────────────────────────────────────────
FROM node:22-alpine AS deps
RUN corepack enable pnpm
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/stellar/package.json ./packages/stellar/
COPY packages/storage/package.json ./packages/storage/
RUN pnpm install --frozen-lockfile

# ── Stage 2: Dev (tsx hot reload) ────────────────────────────────────────────
FROM node:22-alpine AS dev
RUN corepack enable pnpm
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .
WORKDIR /app/apps/api
EXPOSE 3000
CMD ["pnpm", "dev"]

# ── Stage 3: Builder (TypeScript → JavaScript) ──────────────────────────────
FROM node:22-alpine AS builder
RUN corepack enable pnpm
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
WORKDIR /app/apps/api
RUN pnpm build

# ── Stage 4: Production dependencies (pruned) ────────────────────────────────
FROM node:22-alpine AS prod-deps
RUN corepack enable pnpm
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/stellar/package.json ./packages/stellar/
COPY packages/storage/package.json ./packages/storage/
RUN pnpm install --frozen-lockfile --prod

# ── Stage 5: Runner (Production) ─────────────────────────────────────────────
FROM node:22-alpine AS runner
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app

COPY --from=prod-deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder  --chown=nodejs:nodejs /app/apps/api/dist ./dist
COPY --from=builder  --chown=nodejs:nodejs /app/packages ./packages

ENV NODE_ENV=production

USER nodejs
EXPOSE 3000
STOPSIGNAL SIGTERM

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js"]
