FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

# ── installer: resolve & install all workspace deps ────────────────────────────
FROM base AS installer
WORKDIR /app

# Copy workspace manifests (pnpm needs all package.json files to resolve workspace)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json     ./apps/api/
COPY apps/web/package.json     ./apps/web/
COPY packages/config/package.json ./packages/config/
COPY packages/core/package.json   ./packages/core/
COPY packages/ui/package.json     ./packages/ui/

RUN pnpm install --frozen-lockfile

# ── deployer: copy source, create self-contained bundle ───────────────────────
FROM installer AS deployer
WORKDIR /app

COPY apps/api     ./apps/api
COPY packages/config ./packages/config
COPY packages/core   ./packages/core

# pnpm deploy --prod resolves workspace deps into node_modules (no symlinks)
RUN pnpm deploy --filter @nudge/api --prod --legacy /app/standalone

# ── runner: minimal production image ──────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deployer /app/standalone ./

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nudge
USER nudge

EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["node_modules/.bin/tsx", "src/index.ts"]
