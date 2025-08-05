#!/bin/bash

# Docker Build Verification Script
# 驗證 pnpm monorepo Docker 構建修復

set -e

echo "🔍 驗證 Docker 構建修復..."

# 確保在根目錄
cd "$(dirname "$0")/.."

echo "📁 當前目錄: $(pwd)"
echo "📋 檢查必要文件..."

# 檢查必要文件
if [ ! -f "pnpm-lock.yaml" ]; then
    echo "❌ 錯誤: pnpm-lock.yaml 不存在於根目錄"
    exit 1
fi

if [ ! -f "pnpm-workspace.yaml" ]; then
    echo "❌ 錯誤: pnpm-workspace.yaml 不存在於根目錄"
    exit 1
fi

if [ ! -f "backend/package.json" ]; then
    echo "❌ 錯誤: backend/package.json 不存在"
    exit 1
fi

if [ ! -f "frontend/package.json" ]; then
    echo "❌ 錯誤: frontend/package.json 不存在"
    exit 1
fi

echo "✅ 所有必要文件都存在"

echo "🏗️  測試 backend Docker 構建..."
docker build -f backend/Dockerfile -t verify-backend . --target base
echo "✅ Backend 構建成功"

echo "🏗️  測試 frontend Docker 構建..."
docker build -f frontend/Dockerfile -t verify-frontend . --target base
echo "✅ Frontend 構建成功"

echo "🧹 清理測試映像..."
docker rmi verify-backend verify-frontend test-backend test-frontend 2>/dev/null || true

echo "🎉 所有 Docker 構建測試通過！"
echo "📝 修復摘要:"
echo "   - 修改 Dockerfile 使用 corepack enable pnpm"
echo "   - 使用 pnpm fetch 改善 Docker 層緩存"
echo "   - 修改 CI/CD 使用根目錄作為構建上下文"
echo "   - 使用 --filter 和 --offline 標誌優化安裝過程"