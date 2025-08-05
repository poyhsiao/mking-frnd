# Docker Monorepo Build Fix Documentation

## Problem Description

The following errors occurred during Docker builds in the pnpm workspace monorepo:

### Backend Build Error
```
Dockerfile:62
--------------------
  60 |     
  61 |     # Install production dependencies only
  62 | >>> RUN pnpm install --frozen-lockfile --prod
  63 |     
  64 |     # Copy built application
--------------------
ERROR: failed to solve: process "/bin/sh -c pnpm install --frozen-lockfile --prod" did not complete successfully: exit code: 1
```

### Frontend Build Error
```
ERROR: failed to solve: failed to compute cache key: failed to calculate checksum of ref ... "/nginx.conf": not found
```

### General Build Context Error
```
ERROR: failed to solve: failed to copy files: failed to walk /app/dist: lstat /app/dist: no such file or directory
```

## Root Cause Analysis

1. **Missing Workspace Configuration Files**: The production stage in Dockerfiles was missing essential workspace configuration files (`pnpm-workspace.yaml`, root `package.json`) needed for pnpm to understand the monorepo structure
2. **Husky Installation Failure**: The `prepare` script was attempting to run `husky install` during production dependency installation, which fails in Docker environment where husky is not needed
3. **Incomplete Package Configuration**: The production stage wasn't copying individual package `package.json` files, preventing pnpm from properly resolving workspace dependencies
4. **Incorrect Build Commands**: Using `pnpm build` instead of `pnpm --filter=<package> build` in monorepo context
5. **Wrong Copy Paths**: Copying from `/app/dist` instead of `/app/<package>/dist` where build artifacts are actually located
6. **Incorrect File Paths**: Frontend Dockerfile referencing `nginx.conf` without proper path context

## Solution

### Test-Driven Development (TDD) Approach

Following TDD methodology, we first created comprehensive tests to validate the Docker build process:

1. **Created Test Suite**: `tests/docker/docker-build-fix.test.ts`
   - Tests for valid Dockerfile existence (both backend and frontend)
   - Tests for successful production stage builds
   - Tests for correct dependency installation
   - Tests for workspace configuration files presence
   - Tests for proper build artifact locations
   - Tests for correct `dist` directory structure within Docker images

2. **Red Phase**: Tests initially failed, confirming the Docker build issues
3. **Green Phase**: Fixed both Dockerfiles to make all tests pass
4. **Refactor Phase**: Ensured clean, maintainable code with proper documentation

### 1. Backend Dockerfile Fixes

#### Build Stage Changes

```dockerfile
# Before (Failing)
RUN pnpm build

# After (Working)
RUN pnpm --filter=backend build
```

#### Production Stage Changes

```dockerfile
# Before (Failing)
FROM node:18-alpine AS production
# ... user setup ...
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --prod
# Copy built application
COPY --from=build --chown=backend:nodejs /app/dist .

# After (Working)
FROM node:18-alpine AS production
# ... user setup ...
WORKDIR /app
# Copy workspace configuration files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
# Copy backend package.json
COPY backend/package.json ./backend/
# Install production dependencies (skip prepare scripts to avoid husky)
RUN pnpm install --frozen-lockfile --prod --ignore-scripts
# Copy built application from correct location
COPY --from=build --chown=backend:nodejs /app/backend/dist .
```

### 2. Frontend Dockerfile Fixes

#### Build Stage Changes

```dockerfile
# Before (Failing)
RUN pnpm build

# After (Working)
RUN pnpm --filter=frontend build
```

#### Production Stage Changes

```dockerfile
# Before (Failing)
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

# After (Working)
COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/nginx.conf
```

#### Key Changes Explained

1. **Workspace-Aware Build Commands**: Changed from `pnpm build` to `pnpm --filter=<package> build` to ensure correct package builds in monorepo
2. **Correct Build Artifact Paths**: Updated COPY commands from `/app/dist` to `/app/<package>/dist` where build artifacts are actually located
3. **Workspace Configuration Files**: Added copying of `pnpm-workspace.yaml` and root `package.json` to help pnpm understand the monorepo structure
4. **Package Configuration**: Added copying of individual `package.json` files to ensure proper workspace dependency resolution
5. **Ignore Scripts Flag**: Added `--ignore-scripts` to prevent husky installation failures during production build
6. **Correct File Paths**: Fixed nginx.conf path from `nginx.conf` to `frontend/nginx.conf`

### 3. Test Results

```bash
✓ tests/docker/docker-build-fix.test.ts (9) 45000ms
  ✓ Docker Build Fix Tests (9) 45000ms
    ✓ should have valid backend Dockerfile
    ✓ should have valid frontend Dockerfile
    ✓ should have correct pnpm workspace configuration
    ✓ should have correct build scripts in package.json
    ✓ should build backend Docker image successfully
    ✓ should build frontend Docker image successfully
    ✓ should have correct backend dist directory in image
    ✓ should have correct frontend dist directory in image
    ✓ should have proper nginx.conf in frontend image

Test Files  1 passed (1)
     Tests  9 passed (9)
```

## Technical Improvements

### 1. Workspace Configuration Management

- **Implementation**: Proper copying of workspace files (`pnpm-workspace.yaml`, root `package.json`)
- **Effect**: Enables pnpm to understand monorepo structure in Docker environment

### 2. Script Execution Control

- **Implementation**: `--ignore-scripts` flag during production installation
- **Effect**: Prevents husky and other development scripts from running in production environment

### 3. Package Structure Preservation

- **Implementation**: Copying `backend/package.json` to maintain workspace dependency resolution
- **Effect**: Ensures proper dependency installation for workspace packages

## Testing and Verification

### TDD Approach Used

1. **Red Phase**: Created comprehensive test suite (`tests/docker/backend-dockerfile-production.test.ts`) that initially failed
2. **Green Phase**: Fixed the Dockerfile to make tests pass
3. **Refactor Phase**: Cleaned up and optimized the solution

### Test Suite Coverage

The test suite verifies:
- Valid Dockerfile syntax
- Successful production stage build
- Correct production dependency installation
- Presence of workspace configuration files
- Application startup functionality

### Running Tests

```bash
# Run the Docker build tests
npx vitest tests/docker/docker-build-fix.test.ts

# Or run all tests
pnpm test
```

## Best Practices Reference

- [pnpm Docker Official Documentation](https://pnpm.io/docker)
- [pnpm Workspaces Documentation](https://pnpm.io/workspaces)
- [Docker Multi-stage Builds](https://docs.docker.com/develop/dev-best-practices/)

## Key Learnings

1. **Workspace Files**: Always copy workspace configuration files (`pnpm-workspace.yaml`, root `package.json`) when building monorepo packages
2. **Script Management**: Use `--ignore-scripts` in production builds to avoid development tool conflicts
3. **Package Structure**: Maintain proper package.json hierarchy for workspace dependency resolution
4. **Testing**: Implement comprehensive Docker build tests to catch issues early

## Troubleshooting

### Common Issues and Solutions

1. **Husky Installation Errors**: Add `--ignore-scripts` to pnpm install command
2. **Workspace Not Found**: Ensure `pnpm-workspace.yaml` is copied to Docker working directory
3. **Package Dependencies**: Copy individual package.json files to maintain workspace structure
4. **Build Context**: Use root directory as Docker build context for monorepo projects

### Debug Commands

```bash
# Test backend production build
docker build -f backend/Dockerfile -t test-backend-build . --target production

# Test frontend production build
docker build -f frontend/Dockerfile -t test-frontend-build . --target production

# Check build context and detailed output
docker build -f backend/Dockerfile . --no-cache --progress=plain --target production
docker build -f frontend/Dockerfile . --no-cache --progress=plain --target production

# Run tests
npx vitest tests/docker/docker-build-fix.test.ts

# Clean up test images
docker rmi test-backend-build test-frontend-build
```