FROM node:24.11.0-alpine AS base
ENV TURBO_TELEMETRY_DISABLED=1

FROM base AS builder
RUN apk update
RUN apk add --no-cache libc6-compat
# Set working directory
WORKDIR /app
RUN yarn global add turbo
COPY . .
RUN turbo prune @dgpt/api --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
RUN apk update
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/full/ .

FROM base AS runner
WORKDIR /app

COPY --from=installer /app .

RUN npm i -g pnpm@9.12.3
RUN pnpm i

ARG APP_VERSION
ENV APP_VERSION=${APP_VERSION}
ENV NODE_ENV=production

CMD pnpm db:migrate && pnpm start:api
