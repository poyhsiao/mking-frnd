# Docker 最佳實踐指南

## 概述

本文檔基於 Docker 官方文檔和業界最佳實踐，為 MKing Friend 專案提供 Docker 容器化的指導原則。

## Dockerfile 最佳實踐

### 1. 基礎映像選擇

#### 使用官方映像
```dockerfile
# ✅ 推薦：使用官方 Node.js Alpine 映像
FROM node:18-alpine

# ❌ 避免：使用非官方或過時的映像
FROM some-random-user/node
```

#### 指定具體版本
```dockerfile
# ✅ 推薦：指定具體版本
FROM node:18.17.0-alpine3.18

# ❌ 避免：使用 latest 標籤
FROM node:latest
```

### 2. 多階段建置

```dockerfile
# 建置階段
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# 生產階段
FROM node:18-alpine AS production
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### 3. 層級優化

#### 合併 RUN 指令
```dockerfile
# ✅ 推薦：合併相關指令
RUN apk add --no-cache \
    git \
    curl \
    && rm -rf /var/cache/apk/*

# ❌ 避免：分離的 RUN 指令
RUN apk add --no-cache git
RUN apk add --no-cache curl
RUN rm -rf /var/cache/apk/*
```

#### 利用快取機制
```dockerfile
# ✅ 推薦：先複製依賴檔案
COPY package*.json ./
RUN npm ci --only=production

# 然後複製應用程式碼
COPY . .

# ❌ 避免：一次複製所有檔案
COPY . .
RUN npm ci --only=production
```

### 4. 安全性考量

#### 使用非 root 使用者
```dockerfile
# 建立非特權使用者
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# 切換到非 root 使用者
USER nextjs

# 或使用數字 UID
USER 1001:1001
```

#### 最小化攻擊面
```dockerfile
# 移除不必要的套件
RUN apk add --no-cache --virtual .build-deps \
    python3 \
    make \
    g++ \
    && npm ci --only=production \
    && apk del .build-deps
```

### 5. .dockerignore 配置

```dockerignore
# 版本控制
.git
.gitignore

# 依賴目錄
node_modules
npm-debug.log*

# 建置輸出
dist
build

# 環境檔案
.env
.env.local
.env.*.local

# 測試檔案
**/*.test.js
**/*.spec.js
coverage

# 文檔
*.md
docs/

# IDE 檔案
.vscode
.idea

# 作業系統檔案
.DS_Store
Thumbs.db
```

## Docker Compose 最佳實踐

### 1. 服務配置

#### 使用環境變數
```yaml
services:
  backend:
    build: .
    environment:
      - NODE_ENV=${NODE_ENV:-development}
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    env_file:
      - .env
```

#### 健康檢查配置
```yaml
services:
  postgres:
    image: postgres:15-alpine
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
```

#### 依賴關係管理
```yaml
services:
  backend:
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
```

### 2. 網路配置

```yaml
networks:
  app-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16

services:
  backend:
    networks:
      - app-network
```

### 3. 儲存管理

#### 命名卷
```yaml
volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local

services:
  postgres:
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

#### 綁定掛載（開發環境）
```yaml
services:
  backend:
    volumes:
      - ./src:/app/src:ro  # 唯讀掛載
      - ./logs:/app/logs   # 讀寫掛載
```

### 4. 環境分離

#### 基礎配置 (docker-compose.yml)
```yaml
version: '3.8'
services:
  backend:
    build: .
    ports:
      - "8000:8000"
```

#### 開發環境覆蓋 (docker-compose.override.yml)
```yaml
version: '3.8'
services:
  backend:
    build:
      target: development
    volumes:
      - ./src:/app/src
    environment:
      - NODE_ENV=development
      - DEBUG=true
```

#### 生產環境配置 (docker-compose.prod.yml)
```yaml
version: '3.8'
services:
  backend:
    build:
      target: production
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

## 開發工作流程

### 1. 本地開發

```bash
# 啟動開發環境
docker compose up -d

# 監控檔案變更（如果支援）
docker compose watch

# 查看日誌
docker compose logs -f backend

# 進入容器除錯
docker compose exec backend sh
```

### 2. 測試環境

```bash
# 執行測試
docker compose run --rm backend npm test

# 執行整合測試
docker compose -f docker-compose.test.yml up --abort-on-container-exit
```

### 3. 生產部署

```bash
# 建置生產映像
docker compose -f docker-compose.yml -f docker-compose.prod.yml build

# 啟動生產環境
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 效能優化

### 1. 映像大小優化

#### 使用 Alpine 基礎映像
```dockerfile
FROM node:18-alpine
# Alpine 映像通常比標準映像小 5-10 倍
```

#### 多階段建置清理
```dockerfile
FROM node:18-alpine AS builder
# 建置階段

FROM node:18-alpine AS production
# 只複製必要的檔案到生產階段
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
```

### 2. 建置快取優化

#### 利用 BuildKit
```bash
# 啟用 BuildKit
export DOCKER_BUILDKIT=1

# 使用快取掛載
RUN --mount=type=cache,target=/root/.npm \
    npm ci --only=production
```

#### 快取友好的層級順序
```dockerfile
# 1. 系統依賴（變更頻率最低）
RUN apk add --no-cache git

# 2. 應用程式依賴
COPY package*.json ./
RUN npm ci --only=production

# 3. 應用程式碼（變更頻率最高）
COPY . .
```

### 3. 執行時優化

#### 資源限制
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

#### 重啟策略
```yaml
services:
  backend:
    restart: unless-stopped
    # 或使用更細緻的控制
    deploy:
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
```

## 安全性最佳實踐

### 1. 映像安全

#### 定期更新基礎映像
```bash
# 定期拉取最新的基礎映像
docker pull node:18-alpine

# 重新建置應用程式映像
docker compose build --no-cache
```

#### 掃描漏洞
```bash
# 使用 Docker Scout 掃描
docker scout cves <image-name>

# 或使用 Trivy
trivy image <image-name>
```

### 2. 執行時安全

#### 唯讀檔案系統
```yaml
services:
  backend:
    read_only: true
    tmpfs:
      - /tmp
      - /var/run
```

#### 移除不必要的能力
```yaml
services:
  backend:
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE  # 只添加必要的能力
```

### 3. 機密資料管理

#### 使用 Docker Secrets
```yaml
secrets:
  db_password:
    file: ./secrets/db_password.txt

services:
  backend:
    secrets:
      - db_password
    environment:
      - DB_PASSWORD_FILE=/run/secrets/db_password
```

#### 避免在映像中包含機密資料
```dockerfile
# ❌ 避免：在映像中硬編碼機密資料
ENV API_KEY=secret123

# ✅ 推薦：使用執行時環境變數
ENV API_KEY=${API_KEY}
```

## 監控和日誌

### 1. 日誌配置

```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 2. 健康檢查

```dockerfile
# 在 Dockerfile 中定義健康檢查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1
```

### 3. 監控指標

```bash
# 監控容器資源使用
docker stats

# 檢查容器健康狀態
docker compose ps
```

## 故障排除

### 1. 常見問題診斷

```bash
# 檢查容器日誌
docker compose logs <service-name>

# 檢查容器內部
docker compose exec <service-name> sh

# 檢查網路連線
docker compose exec <service-name> ping <target-service>
```

### 2. 除錯技巧

```yaml
# 開發環境除錯配置
services:
  backend:
    command: ["npm", "run", "dev"]
    environment:
      - DEBUG=*
    ports:
      - "9229:9229"  # Node.js 除錯埠
```

## 持續整合/持續部署 (CI/CD)

### 1. GitHub Actions 範例

```yaml
name: Docker Build and Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build and test
        run: |
          docker compose -f docker-compose.test.yml up --abort-on-container-exit
          
      - name: Build production image
        run: |
          docker compose -f docker-compose.yml -f docker-compose.prod.yml build
```

### 2. 映像標籤策略

```bash
# 使用語義化版本
docker tag myapp:latest myapp:1.2.3
docker tag myapp:latest myapp:1.2
docker tag myapp:latest myapp:1

# 使用 Git 提交雜湊
docker tag myapp:latest myapp:$(git rev-parse --short HEAD)
```

## 總結

遵循這些最佳實踐將幫助您：

1. **提高安全性** - 使用非 root 使用者、定期更新映像
2. **優化效能** - 減少映像大小、利用快取機制
3. **增強可維護性** - 清晰的層級結構、適當的文檔
4. **簡化部署** - 一致的環境配置、自動化流程
5. **改善除錯體驗** - 完善的日誌和監控

記住，最佳實踐會隨著技術發展而演進，建議定期檢視和更新您的 Docker 配置。