# Multi-stage build for Node.js backend
FROM node:18-alpine AS base

# Enable corepack and prepare specific pnpm version
RUN corepack enable
RUN corepack prepare pnpm@8.15.0 --activate

# Set PNPM environment variables
ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Set working directory
WORKDIR /app

# Copy workspace configuration files from root
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
# Copy backend package.json
COPY backend/package.json ./backend/

# Use pnpm fetch for better Docker layer caching
RUN pnpm fetch --filter=backend

# Copy all source files
COPY . .

# Install dependencies using offline mode (files already fetched)
RUN pnpm install --filter=backend --frozen-lockfile --offline

# Development stage
FROM base AS development
COPY . .
EXPOSE 3001
CMD ["pnpm", "dev"]

# Build stage
FROM base AS build
COPY . .
# Run build with workspace filtering to ensure correct package is built
RUN pnpm --filter=backend build

# Production stage
FROM node:18-alpine AS production

# Enable corepack and prepare specific pnpm version
RUN corepack enable
RUN corepack prepare pnpm@8.15.0 --activate

# Set PNPM environment variables
ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S backend -u 1001

# Set working directory
WORKDIR /app

# Copy workspace configuration files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy backend package.json
COPY backend/package.json ./backend/

# Install production dependencies only (skip prepare scripts to avoid husky)
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Copy built application from backend subdirectory
COPY --from=build --chown=backend:nodejs /app/backend/dist ./dist

# Switch to non-root user
USER backend

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/healthcheck.js || exit 1

# Start the application
CMD ["node", "dist/index.js"]