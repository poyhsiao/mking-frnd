# Multi-stage build for Node.js backend
FROM node:18-alpine AS base

# Install pnpm using corepack (recommended approach)
RUN corepack enable pnpm

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
RUN pnpm build

# Production stage
FROM node:18-alpine AS production

# Install pnpm
RUN npm install -g pnpm@8.15.1

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S backend -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built application
COPY --from=build --chown=backend:nodejs /app/dist ./dist

# Switch to non-root user
USER backend

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/healthcheck.js || exit 1

# Start the application
CMD ["node", "dist/index.js"]