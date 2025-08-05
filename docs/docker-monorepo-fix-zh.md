# Docker Monorepo 構建修復文檔

## 問題描述

在 GitHub Actions 的 `build` 階段中，出現以下錯誤：

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

## 根本原因分析

1. **錯誤的 Docker 構建上下文**：CI/CD 配置使用 `context: ./backend` 和
   `context: ./frontend`，但 `pnpm-lock.yaml` 文件位於根目錄
2. **不正確的 pnpm 工作區配置**：Dockerfile 試圖從子目錄複製
   `pnpm-lock.yaml`，但在 pnpm monorepo 中，lockfile 只存在於根目錄
3. **未優化的 Docker 層緩存**：沒有使用 `pnpm fetch` 來改善構建性能

## 解決方案

### 1. 修改 Dockerfile 配置

#### Backend Dockerfile 修改

```dockerfile
# 修改前
FROM node:18-alpine AS base
RUN npm install -g pnpm@8.15.1
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# 修改後
FROM node:18-alpine AS base
RUN corepack enable pnpm  # 使用 corepack（推薦方式）
WORKDIR /app
# 從根目錄複製工作區配置文件
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY backend/package.json ./backend/
# 使用 pnpm fetch 改善 Docker 層緩存
RUN pnpm fetch --filter=backend
COPY . .
# 使用離線模式安裝（文件已預取）
RUN pnpm install --filter=backend --frozen-lockfile --offline
```

#### Frontend Dockerfile 修改

```dockerfile
# 修改前
FROM node:18-alpine AS base
RUN npm install -g pnpm@8.15.1
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# 修改後
FROM node:18-alpine AS base
RUN corepack enable pnpm  # 使用 corepack（推薦方式）
WORKDIR /app
# 從根目錄複製工作區配置文件
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY frontend/package.json ./frontend/
# 使用 pnpm fetch 改善 Docker 層緩存
RUN pnpm fetch --filter=frontend
COPY . .
# 使用離線模式安裝（文件已預取）
RUN pnpm install --filter=frontend --frozen-lockfile --offline
```

### 2. 修改 CI/CD 配置

```yaml
# 修改前
- name: Build and push backend image
  uses: docker/build-push-action@v5
  with:
    context: ./backend # ❌ 錯誤：子目錄上下文
    file: ./backend/Dockerfile

# 修改後
- name: Build and push backend image
  uses: docker/build-push-action@v5
  with:
    context: . # ✅ 正確：根目錄上下文
    file: ./backend/Dockerfile
```

## 技術改進

### 1. 使用 corepack

- **優點**：Node.js 內建工具，版本管理更一致
- **替代**：`npm install -g pnpm@8.15.1`

### 2. pnpm fetch 優化

- **功能**：預取包到虛擬存儲，改善 Docker 層緩存
- **效果**：只有 lockfile 變更時才重新下載依賴

### 3. 工作區過濾

- **使用**：`--filter=backend` 和 `--filter=frontend`
- **效果**：只安裝特定包及其依賴

### 4. 離線安裝

- **使用**：`--offline` 標誌
- **效果**：使用已預取的包，避免網絡請求

## 測試驗證

### TDD 方法

1. **創建測試**：編寫 Docker 構建測試
2. **運行測試**：確認問題存在
3. **修復代碼**：實施解決方案
4. **驗證修復**：測試通過

### 驗證腳本

```bash
# 運行驗證腳本
./scripts/verify-docker-build.sh
```

## 最佳實踐參考

- [pnpm Docker 官方文檔](https://pnpm.io/docker)
- [pnpm fetch 命令](https://pnpm.io/cli/fetch)
- [pnpm deploy 命令](https://pnpm.io/cli/deploy)
- [GitHub Issue: pnpm monorepo Docker 最佳實踐](https://github.com/pnpm/pnpm/issues/3114)

## 性能改進

1. **構建時間**：使用 `pnpm fetch` 改善緩存效率
2. **映像大小**：使用 `--filter` 只安裝必要依賴
3. **網絡使用**：`--offline` 模式減少網絡請求
4. **緩存效率**：正確的層順序最大化 Docker 緩存利用

## 故障排除

### 常見問題

1. **找不到 pnpm-lock.yaml**：確保 Docker 上下文是根目錄
2. **工作區依賴問題**：確保 `pnpm-workspace.yaml` 被正確複製
3. **權限問題**：使用 `--chown=node:node` 設置正確權限

### 調試命令

```bash
# 測試 Docker 構建
docker build -f backend/Dockerfile -t test-backend . --target base
docker build -f frontend/Dockerfile -t test-frontend . --target base

# 檢查構建上下文
docker build -f backend/Dockerfile . --no-cache --progress=plain
```
