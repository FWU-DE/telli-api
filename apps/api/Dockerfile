FROM node:24.11.0-alpine AS base
ENV TURBO_TELEMETRY_DISABLED=1

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

COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/full/ .

RUN corepack enable && corepack prepare
RUN pnpm install --frozen-lockfile
RUN pnpm build

# Remove dev dependencies from node_modules
RUN CI=true pnpm prune --prod && pnpm install --prod

FROM base AS runner

#RUN addgroup --system --gid 1001 nodejs
#RUN adduser --system --uid 1001 nodejs
#USER nodejs

WORKDIR /app

COPY --from=builder /app/apps/api/dist apps/api
COPY --from=builder /app/packages/database/migrations packages/database/migrations
COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/apps/api/node_modules apps/api/node_modules

ARG APP_VERSION
ENV APP_VERSION=${APP_VERSION}
ENV NODE_ENV=production

WORKDIR /app/apps/api
CMD ["node", "index.js"]
