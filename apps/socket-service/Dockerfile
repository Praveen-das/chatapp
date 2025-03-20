FROM node:lts-alpine AS base

FROM base AS builder
RUN apk update
RUN apk add --no-cache libc6-compat

WORKDIR /app
RUN npm install turbo@^1.12.2 -g
COPY . .
RUN turbo prune socket-service --docker

FROM base AS installer
RUN apk update
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY --from=builder /app/out/json/ .
RUN npm install
COPY --from=builder /app/out/full/ .
RUN npm run build && \
    npm cache clean --force && \
    rm -rf /root/.npm && \
    npm prune --production
    
# Runner stage - minimal final image
FROM base AS runner
WORKDIR /app

# Create a non-root user
RUN addgroup -S expressjs && adduser -S expressjs -G expressjs
USER expressjs

# Copy only built output and node_modules
COPY --from=installer /app ./

CMD node apps/socket-service/dist/index.js