# Multi-stage build for React frontend
FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm@8.15.1

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Development stage
FROM base AS development
COPY . .
EXPOSE 3000
CMD ["pnpm", "dev"]

# Build stage
FROM base AS build
COPY . .
RUN pnpm build

# Production stage
FROM nginx:alpine AS production

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application
COPY --from=build /app/dist /usr/share/nginx/html

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