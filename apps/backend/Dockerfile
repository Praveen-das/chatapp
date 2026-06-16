# ── Stage 1: Base with pnpm (build-only tooling) ──────────────
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.12.1 --activate

# ── Stage 2: Turbo prune (extract minimal monorepo subset) ───
FROM base AS builder
WORKDIR /app
RUN pnpm add -g turbo@2.9.15
COPY . .
RUN turbo prune backend --docker

# ── Stage 3: Install + Build (then strip to prod-only) ───────
FROM base AS installer
WORKDIR /app

# 3a. Install ALL deps (need devDeps for build)
COPY --from=builder /app/out/json/ .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  pnpm install --frozen-lockfile

# 3b. Copy source & build
COPY --from=builder /app/out/full/ .
RUN pnpm run build

# 3c. Fresh prod-only install
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  pnpm install --frozen-lockfile --prod && \
  pnpm store prune

# 3d. Nuke devDeps that pnpm --prod fails to strip in monorepos
#     Verified via: du -sm node_modules/.pnpm/*/ | sort -rn
RUN set -e; \
  cd /app/node_modules/.pnpm; \
  rm -rf @swc+core-linux-x64-musl@* \
  @swc+core-linux-x64-gnu@* \
  @swc+core@* \
  @swc+cli@* \
  @turbo+linux-64@* \
  turbo@* \
  typescript@* \
  prettier@* \
  eslint@* \
  @typescript-eslint* \
  @unrs+resolver-binding-linux-x64-musl@* \
  @unrs+resolver-binding-linux-x64-gnu@* \
  tsc-watch@* \
  ts-node@* \
  dotenv-cli@* \
  axe-core@* \
  caniuse-lite@* \
  es-abstract@* \
  2>/dev/null; true

# 3e. Strip docs, tests, typedefs, sourcemaps from remaining packages
RUN find /app/node_modules -type f \( \
  -name "*.md" -o -name "*.map" \
  -o -name "LICENSE*" -o -name "CHANGELOG*" \
  -o -name ".npmignore" -o -name ".eslintrc*" \
  \) -delete 2>/dev/null; \
  find /app/node_modules -type d \( \
  -name "__tests__" -o -name "test" \
  -o -name "tests" -o -name "docs" \
  \) -exec rm -rf {} + 2>/dev/null; \
  find /app/node_modules -type d -empty -delete 2>/dev/null; \
  true

# ── Stage 4: Runner (minimal — no pnpm, no build tools) ──────
FROM node:22-alpine AS runner
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S expressjs && \
  adduser -S -u 1001 -G expressjs expressjs

# Copy only production artifacts — no source, no devDeps
COPY --from=installer --chown=expressjs:expressjs /app/package.json ./package.json
COPY --from=installer --chown=expressjs:expressjs /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=installer --chown=expressjs:expressjs /app/node_modules ./node_modules
COPY --from=installer --chown=expressjs:expressjs /app/apps/backend/dist ./apps/backend/dist
COPY --from=installer --chown=expressjs:expressjs /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=installer --chown=expressjs:expressjs /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=installer --chown=expressjs:expressjs /app/packages/interfaces ./packages/interfaces
COPY --from=installer --chown=expressjs:expressjs /app/packages/kafka ./packages/kafka
COPY --from=installer --chown=expressjs:expressjs /app/packages/utils ./packages/utils

USER expressjs

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/health || exit 1

CMD ["node", "apps/backend/dist/index.js"]