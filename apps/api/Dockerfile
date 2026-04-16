FROM node:20-alpine AS base
RUN npm install -g pnpm@10

# Dependencies stage
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/config/package.json ./packages/config/
COPY packages/core/package.json ./packages/core/
RUN pnpm install --frozen-lockfile --prod=false

# Source stage
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy installed node_modules
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

# Copy source
COPY apps/api ./apps/api
COPY packages/config ./packages/config
COPY packages/core ./packages/core

WORKDIR /app/apps/api

# Non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nudge
USER nudge

EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["node_modules/.bin/tsx", "src/index.ts"]
