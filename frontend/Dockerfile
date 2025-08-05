# Multi-stage build for React frontend
FROM node:18-alpine AS base

# Install pnpm using corepack (recommended approach)
RUN corepack enable
RUN corepack prepare pnpm@8.15.0 --activate

# Set pnpm environment variables
ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Set working directory
WORKDIR /app

# Copy workspace configuration files from root
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
# Copy frontend package.json
COPY frontend/package.json ./frontend/

# Use pnpm fetch for better Docker layer caching
RUN pnpm fetch --filter=frontend

# Copy all source files
COPY . .

# Install dependencies using offline mode (files already fetched)
RUN pnpm install --filter=frontend --frozen-lockfile --offline

# Development stage
FROM base AS development
COPY . .
EXPOSE 3000
CMD ["pnpm", "dev"]

# Build stage
FROM base AS build
COPY . .
# Run build with workspace filtering to ensure correct package is built
RUN pnpm --filter=frontend build

# Production stage
FROM nginx:alpine AS production

# Copy custom nginx config from frontend subdirectory
COPY frontend/nginx.conf /etc/nginx/nginx.conf

# Copy built application from frontend subdirectory
COPY --from=build /app/frontend/dist /usr/share/nginx/html

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S frontend -u 1001

# Set ownership
RUN chown -R frontend:nodejs /usr/share/nginx/html
RUN chown -R frontend:nodejs /var/cache/nginx
RUN chown -R frontend:nodejs /var/log/nginx
RUN chown -R frontend:nodejs /etc/nginx/conf.d
RUN touch /var/run/nginx.pid
RUN chown -R frontend:nodejs /var/run/nginx.pid

# Switch to non-root user
USER frontend

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]