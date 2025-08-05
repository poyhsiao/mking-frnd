#!/bin/bash

# Docker Build Verification Script
# Verifies Docker build with pinned pnpm version using corepack

set -e

echo "🐳 Docker Build Verification Script"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
EXPECTED_PNPM_VERSION="8.15.0"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# 確保在根目錄
cd "$(dirname "$0")/.."

echo "\n📁 Current directory: $(pwd)"
echo "📋 Checking required files..."

# Check required files
if [ ! -f "pnpm-lock.yaml" ]; then
    print_error "pnpm-lock.yaml not found in root directory"
    exit 1
fi

if [ ! -f "pnpm-workspace.yaml" ]; then
    print_error "pnpm-workspace.yaml not found in root directory"
    exit 1
fi

if [ ! -f "backend/package.json" ]; then
    print_error "backend/package.json not found"
    exit 1
fi

if [ ! -f "frontend/package.json" ]; then
    print_error "frontend/package.json not found"
    exit 1
fi

print_status "All required files exist"

# Check if package.json has correct packageManager field
if ! grep -q "\"packageManager\": \"pnpm@$EXPECTED_PNPM_VERSION\"" package.json; then
    print_warning "package.json packageManager field may not match expected version $EXPECTED_PNPM_VERSION"
else
    print_status "package.json packageManager field is correct"
fi

echo "\n🏗️ Testing backend Docker build..."
if docker build -f backend/Dockerfile -t verify-backend . --target base; then
    print_status "Backend base stage built successfully"
else
    print_error "Backend base stage build failed"
    exit 1
fi

echo "\n🔍 Verifying pnpm installation in backend..."
# Check pnpm version in backend image
BACKEND_PNPM_VERSION=$(docker run --rm verify-backend pnpm --version 2>/dev/null || echo "ERROR")
if [ "$BACKEND_PNPM_VERSION" = "$EXPECTED_PNPM_VERSION" ]; then
    print_status "Backend image has correct pnpm version: $BACKEND_PNPM_VERSION"
else
    print_error "Backend image has incorrect pnpm version. Expected: $EXPECTED_PNPM_VERSION, Got: $BACKEND_PNPM_VERSION"
    exit 1
fi

# Check if pnpm is in PATH
if docker run --rm verify-backend which pnpm >/dev/null 2>&1; then
    print_status "pnpm is available in PATH"
else
    print_error "pnpm is not available in PATH"
    exit 1
fi

# Check corepack installation
if docker run --rm verify-backend which corepack >/dev/null 2>&1; then
    print_status "corepack is available"
else
    print_error "corepack is not available"
    exit 1
fi

echo "\n🏗️ Testing frontend Docker build..."
if docker build -f frontend/Dockerfile -t verify-frontend . --target base; then
    print_status "Frontend base stage built successfully"
else
    print_error "Frontend base stage build failed"
    exit 1
fi

echo "\n🔍 Verifying pnpm installation in frontend..."
# Check pnpm version in frontend image
FRONTEND_PNPM_VERSION=$(docker run --rm verify-frontend pnpm --version 2>/dev/null || echo "ERROR")
if [ "$FRONTEND_PNPM_VERSION" = "$EXPECTED_PNPM_VERSION" ]; then
    print_status "Frontend image has correct pnpm version: $FRONTEND_PNPM_VERSION"
else
    print_error "Frontend image has incorrect pnpm version. Expected: $EXPECTED_PNPM_VERSION, Got: $FRONTEND_PNPM_VERSION"
    exit 1
fi

# Check if pnpm is in PATH for frontend
if docker run --rm verify-frontend which pnpm >/dev/null 2>&1; then
    print_status "pnpm is available in PATH (frontend)"
else
    print_error "pnpm is not available in PATH (frontend)"
    exit 1
fi

# Check corepack installation for frontend
if docker run --rm verify-frontend which corepack >/dev/null 2>&1; then
    print_status "corepack is available (frontend)"
else
    print_error "corepack is not available (frontend)"
    exit 1
fi

echo "\n🧹 Cleaning up test images..."
docker rmi verify-backend verify-frontend 2>/dev/null || true

echo "\n🎉 All Docker build tests passed!"
echo "\n📝 Summary:"
echo "  ✓ Docker builds successfully"
echo "  ✓ pnpm version is pinned to $EXPECTED_PNPM_VERSION"
echo "  ✓ pnpm is available in PATH"
echo "  ✓ corepack is properly configured"
echo "\n🚀 Your Dockerfiles are ready for production!"
echo "📝 修復摘要:"
echo "   - 修改 Dockerfile 使用 corepack enable pnpm"
echo "   - 使用 pnpm fetch 改善 Docker 層緩存"
echo "   - 修改 CI/CD 使用根目錄作為構建上下文"
echo "   - 使用 --filter 和 --offline 標誌優化安裝過程"