FROM node:lts-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.12.1 --activate

FROM base AS builder

WORKDIR /app
RUN pnpm add -g turbo@^2
COPY . .
RUN turbo prune socket-service --docker

FROM base AS installer
WORKDIR /app

COPY --from=builder /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=builder /app/out/full/ .
RUN pnpm run build && \
    pnpm store prune && \
    pnpm prune --prod

# Runner stage - minimal final image
FROM base AS runner
WORKDIR /app

# Create a non-root user
RUN groupadd -r expressjs && useradd -r -g expressjs expressjs
USER expressjs

# Copy only built output and node_modules
COPY --from=installer /app ./

CMD node apps/socket-service/dist/index.js