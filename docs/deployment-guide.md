# MKing Friend 部署指南

## 概述

本指南說明如何使用 Docker 和 Docker Compose 部署 MKing Friend 應用程式。我們採用容器化部署策略，確保環境一致性和可移植性。

## 系統需求

### 最低硬體需求
- CPU: 2 核心
- RAM: 4GB
- 儲存空間: 20GB 可用空間
- 網路: 穩定的網際網路連線

### 軟體需求
- Docker Engine 20.10+
- Docker Compose 2.0+
- Git

## 部署架構

### 服務組件

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (PostgreSQL)  │
│   Port: 3000    │    │   Port: 8000    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │     Redis       │    │     MinIO       │
                       │   (Cache)       │    │ (Object Store)  │
                       │   Port: 6379    │    │   Port: 9000    │
                       └─────────────────┘    └─────────────────┘
```

## 快速開始

### 1. 克隆專案

```bash
git clone <repository-url>
cd mking-frnd
```

### 2. 環境配置

複製環境變數範本並進行配置：

```bash
cp .env.example .env
```

編輯 `.env` 檔案，設定必要的環境變數：

```bash
# 應用程式配置
APP_NAME=MKing Friend
APP_ENV=production
APP_DEBUG=false
APP_PORT=8000

# 資料庫配置
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=mking_friend
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password

# Redis 配置
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# MinIO 配置
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=your_access_key
MINIO_SECRET_KEY=your_secret_key
MINIO_BUCKET=mking-friend
```

### 3. 啟動服務

#### 開發環境

```bash
# 啟動所有服務
docker compose up -d

# 查看服務狀態
docker compose ps

# 查看日誌
docker compose logs -f
```

#### 生產環境

```bash
# 使用生產配置啟動
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 4. 驗證部署

檢查各服務是否正常運行：

```bash
# 檢查服務健康狀態
docker compose ps

# 測試前端服務
curl http://localhost:3000

# 測試後端 API
curl http://localhost:8000/api/health

# 檢查資料庫連線
docker compose exec postgres pg_isready -U postgres
```

## 詳細配置

### Docker Compose 配置說明

#### 主要服務配置

**Frontend (React)**
- 基於 Node.js 18 Alpine
- 使用 pnpm 作為套件管理器
- 支援熱重載開發模式
- 生產環境使用 Nginx 提供靜態檔案

**Backend (Node.js)**
- 基於 Node.js 18 Alpine
- 支援 TypeScript
- 整合 ESLint 和 Prettier
- 包含健康檢查端點

**Database (PostgreSQL)**
- 使用 PostgreSQL 15
- 配置持久化儲存
- 包含初始化腳本
- 支援備份和恢復

**Cache (Redis)**
- 使用 Redis 7 Alpine
- 配置持久化
- 支援密碼認證

**Object Storage (MinIO)**
- S3 相容的物件儲存
- 支援檔案上傳和管理
- 包含管理介面

### 網路配置

所有服務都在同一個 Docker 網路中運行，確保服務間的通訊安全和高效。

### 儲存配置

#### 持久化儲存卷

- `postgres_data`: PostgreSQL 資料儲存
- `redis_data`: Redis 資料儲存
- `minio_data`: MinIO 物件儲存

#### 備份策略

```bash
# 資料庫備份
docker compose exec postgres pg_dump -U postgres mking_friend > backup.sql

# 恢復資料庫
docker compose exec -T postgres psql -U postgres mking_friend < backup.sql
```

## 監控和日誌

### 日誌管理

```bash
# 查看所有服務日誌
docker compose logs

# 查看特定服務日誌
docker compose logs backend

# 即時跟蹤日誌
docker compose logs -f --tail=100
```

### 健康檢查

所有服務都配置了健康檢查，可以通過以下方式監控：

```bash
# 檢查服務健康狀態
docker compose ps

# 詳細健康檢查資訊
docker inspect <container_name> | grep -A 10 Health
```

## 擴展和優化

### 水平擴展

```bash
# 擴展後端服務實例
docker compose up -d --scale backend=3

# 使用負載均衡器
# 需要額外配置 Nginx 或 HAProxy
```

### 效能優化

1. **資料庫優化**
   - 調整 PostgreSQL 配置參數
   - 建立適當的索引
   - 定期執行 VACUUM 和 ANALYZE

2. **快取策略**
   - 使用 Redis 快取頻繁查詢的資料
   - 實施應用層快取

3. **靜態資源優化**
   - 使用 CDN 分發靜態資源
   - 啟用 Gzip 壓縮

## 安全性考量

### 環境變數安全

- 使用強密碼
- 定期輪換密鑰
- 避免在日誌中暴露敏感資訊

### 網路安全

- 使用防火牆限制外部存取
- 啟用 HTTPS
- 實施 API 速率限制

### 容器安全

- 定期更新基礎映像
- 使用非 root 使用者運行容器
- 掃描映像漏洞

## 故障排除

### 常見問題

#### 服務無法啟動

```bash
# 檢查容器狀態
docker compose ps

# 查看錯誤日誌
docker compose logs <service_name>

# 重新建置映像
docker compose build --no-cache
```

#### 資料庫連線問題

```bash
# 檢查資料庫是否運行
docker compose exec postgres pg_isready

# 檢查網路連線
docker compose exec backend ping postgres
```

#### 記憶體不足

```bash
# 檢查資源使用情況
docker stats

# 清理未使用的資源
docker system prune -a
```

### 除錯模式

```bash
# 進入容器進行除錯
docker compose exec backend sh

# 使用除錯配置啟動
docker compose -f docker-compose.yml -f docker-compose.debug.yml up
```

## 維護和更新

### 定期維護

1. **系統更新**
   ```bash
   # 更新映像
   docker compose pull
   
   # 重新啟動服務
   docker compose up -d
   ```

2. **資料備份**
   ```bash
   # 自動備份腳本
   ./scripts/backup.sh
   ```

3. **日誌輪轉**
   ```bash
   # 清理舊日誌
   docker system prune --volumes
   ```

### 版本升級

1. 備份當前資料
2. 更新應用程式碼
3. 重新建置映像
4. 執行資料庫遷移
5. 重新啟動服務
6. 驗證功能正常

## 支援和聯絡

如果遇到問題，請：

1. 檢查本文檔的故障排除章節
2. 查看專案的 GitHub Issues
3. 聯絡開發團隊

---

**注意**: 本指南假設您對 Docker 和 Docker Compose 有基本了解。如需更多資訊，請參考 [Docker 官方文檔](https://docs.docker.com/)。