# Docker Monorepo Build Fix Documentation

## Problem Description

The following error occurred during the `build` stage in GitHub Actions:

```
Dockerfile:14
--------------------
  12 |
  13 |     # Install dependencies
  14 | >>> RUN pnpm install --frozen-lockfile
  15 |
  16 |     # Development stage
--------------------
ERROR: failed to build: failed to solve: process "/bin/sh -c pnpm install --frozen-lockfile" did not complete successfully: exit code: 1
```

## Root Cause Analysis

1. **Incorrect Docker Build Context**: CI/CD configuration uses `context: ./backend` and
   `context: ./frontend`, but `pnpm-lock.yaml` file is located in the root directory
2. **Incorrect pnpm Workspace Configuration**: Dockerfile attempts to copy
   `pnpm-lock.yaml` from subdirectory, but in pnpm monorepo, lockfile only exists in root directory
3. **Unoptimized Docker Layer Caching**: Not using `pnpm fetch` to improve build performance

## Solution

### 1. Modify Dockerfile Configuration

#### Backend Dockerfile Changes

```dockerfile
# Before
FROM node:18-alpine AS base
RUN npm install -g pnpm@8.15.1
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# After
FROM node:18-alpine AS base
RUN corepack enable pnpm  # Use corepack (recommended approach)
WORKDIR /app
# Copy workspace configuration files from root directory
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY backend/package.json ./backend/
# Use pnpm fetch to improve Docker layer caching
RUN pnpm fetch --filter=backend
COPY . .
# Use offline mode for installation (files already fetched)
RUN pnpm install --filter=backend --frozen-lockfile --offline
```

#### Frontend Dockerfile Changes

```dockerfile
# Before
FROM node:18-alpine AS base
RUN npm install -g pnpm@8.15.1
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# After
FROM node:18-alpine AS base
RUN corepack enable pnpm  # Use corepack (recommended approach)
WORKDIR /app
# Copy workspace configuration files from root directory
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY frontend/package.json ./frontend/
# Use pnpm fetch to improve Docker layer caching
RUN pnpm fetch --filter=frontend
COPY . .
# Use offline mode for installation (files already fetched)
RUN pnpm install --filter=frontend --frozen-lockfile --offline
```

### 2. Modify CI/CD Configuration

```yaml
# Before
- name: Build and push backend image
  uses: docker/build-push-action@v5
  with:
    context: ./backend # ❌ Wrong: subdirectory context
    file: ./backend/Dockerfile

# After
- name: Build and push backend image
  uses: docker/build-push-action@v5
  with:
    context: . # ✅ Correct: root directory context
    file: ./backend/Dockerfile
```

## Technical Improvements

### 1. Use corepack

- **Advantages**: Built-in Node.js tool, more consistent version management
- **Replaces**: `npm install -g pnpm@8.15.1`

### 2. pnpm fetch Optimization

- **Function**: Pre-fetch packages to virtual store, improve Docker layer caching
- **Effect**: Only re-download dependencies when lockfile changes

### 3. Workspace Filtering

- **Usage**: `--filter=backend` and `--filter=frontend`
- **Effect**: Only install specific packages and their dependencies

### 4. Offline Installation

- **Usage**: `--offline` flag
- **Effect**: Use pre-fetched packages, avoid network requests

## Testing and Verification

### TDD Approach

1. **Create Tests**: Write Docker build tests
2. **Run Tests**: Confirm problem exists
3. **Fix Code**: Implement solution
4. **Verify Fix**: Tests pass

### Verification Script

```bash
# Run verification script
./scripts/verify-docker-build.sh
```

## Best Practices Reference

- [pnpm Docker Official Documentation](https://pnpm.io/docker)
- [pnpm fetch Command](https://pnpm.io/cli/fetch)
- [pnpm deploy Command](https://pnpm.io/cli/deploy)
- [GitHub Issue: pnpm monorepo Docker Best Practices](https://github.com/pnpm/pnpm/issues/3114)

## Performance Improvements

1. **Build Time**: Use `pnpm fetch` to improve cache efficiency
2. **Image Size**: Use `--filter` to install only necessary dependencies
3. **Network Usage**: `--offline` mode reduces network requests
4. **Cache Efficiency**: Correct layer ordering maximizes Docker cache utilization

## Troubleshooting

### Common Issues

1. **pnpm-lock.yaml Not Found**: Ensure Docker context is root directory
2. **Workspace Dependency Issues**: Ensure `pnpm-workspace.yaml` is properly copied
3. **Permission Issues**: Use `--chown=node:node` to set correct permissions

### Debug Commands

```bash
# Test Docker build
docker build -f backend/Dockerfile -t test-backend . --target base
docker build -f frontend/Dockerfile -t test-frontend . --target base

# Check build context
docker build -f backend/Dockerfile . --no-cache --progress=plain
```