FROM node:24.11.0-alpine AS base
ENV TURBO_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

FROM base AS pruner

# Set working directory
WORKDIR /app
COPY . .
# setup pnpm and pnpm install in order to install turbo in the correct version
RUN corepack enable && corepack prepare
RUN pnpm install --frozen-lockfile --dev
RUN pnpm turbo prune @dgpt/api --docker

FROM base AS builder
WORKDIR /app

# Git is required for sentry
RUN apk add --no-cache git

# Copy lockfile and package.json's of isolated subworkspace
COPY --from=pruner /app/out/pnpm-lock.yaml .
COPY --from=pruner /app/out/pnpm-workspace.yaml .
COPY --from=pruner /app/out/json/ .

# First install the dependencies (as they change less often)
RUN corepack enable && corepack prepare
RUN pnpm install --frozen-lockfile

# Copy source code of isolated subworkspace
COPY --from=pruner /app/out/full/ .

# Copy git history, required for sentry to determine release name
COPY .git ./.git

ARG CI

RUN --mount=type=secret,id=SENTRY_AUTH_TOKEN,env=SENTRY_AUTH_TOKEN \
    --mount=type=secret,id=SENTRY_ORG,env=SENTRY_ORG \
    --mount=type=secret,id=SENTRY_PROJECT,env=SENTRY_PROJECT \
    pnpm build

# Remove dev dependencies from node_modules
RUN CI=true pnpm prune --prod && pnpm install --prod

FROM base AS runner

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs
USER nodejs

WORKDIR /app

COPY --from=builder --chown=nodejs:nodejs /app/apps/api/dist apps/api
COPY --from=builder --chown=nodejs:nodejs /app/packages/database/migrations packages/database/migrations
COPY --from=builder --chown=nodejs:nodejs /app/node_modules node_modules
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/node_modules apps/api/node_modules

ARG APP_VERSION
ENV APP_VERSION=${APP_VERSION}

WORKDIR /app/apps/api
HEALTHCHECK --timeout=10s --start-period=5s \
  CMD wget http://127.0.0.1:3000/health -qO-
CMD ["node", "index.js"]
