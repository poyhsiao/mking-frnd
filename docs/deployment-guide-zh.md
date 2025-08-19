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

# 驗證服務健康狀態
docker compose ps
docker compose logs
```

## 詳細部署步驟

### 1. 準備工作

#### 檢查系統需求
```bash
# 檢查 Docker 版本
docker --version
docker compose version

# 檢查可用空間
df -h

# 檢查記憶體
free -h
```

#### 設定防火牆規則
```bash
# 開放必要端口（根據需要調整）
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
```

### 2. 環境變數配置

#### 安全性配置
```bash
# 生成安全的密碼
JWT_SECRET=$(openssl rand -base64 32)
POSTGRES_PASSWORD=$(openssl rand -base64 16)
REDIS_PASSWORD=$(openssl rand -base64 16)
```

#### SSL/TLS 配置
```bash
# SSL 憑證配置
SSL_CERT_PATH=/path/to/cert.pem
SSL_KEY_PATH=/path/to/key.pem
```

### 3. 資料庫初始化

```bash
# 啟動資料庫服務
docker compose up -d postgres

# 等待資料庫就緒
docker compose exec postgres pg_isready -U postgres

# 執行資料庫遷移
docker compose exec backend npm run migrate

# 載入初始資料
docker compose exec backend npm run seed
```

### 4. 服務驗證

#### 健康檢查
```bash
# 檢查所有服務狀態
docker compose ps

# 檢查服務日誌
docker compose logs backend
docker compose logs frontend
docker compose logs postgres

# 測試服務連接
curl http://localhost:8000/health
curl http://localhost:3000
```

#### 效能測試
```bash
# 資料庫連接測試
docker compose exec postgres psql -U postgres -d mking_friend -c "SELECT 1;"

# Redis 連接測試
docker compose exec redis redis-cli ping

# API 回應時間測試
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8000/api/status
```

## 監控和維護

### 1. 日誌管理

```bash
# 查看即時日誌
docker compose logs -f

# 查看特定服務日誌
docker compose logs -f backend

# 限制日誌輸出行數
docker compose logs --tail=100 backend

# 查看日誌時間戳
docker compose logs -t backend
```

### 2. 備份策略

#### 資料庫備份
```bash
# 建立備份腳本
#!/bin/bash
BACKUP_DIR="/backup/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# 備份 PostgreSQL
docker compose exec postgres pg_dump -U postgres mking_friend > $BACKUP_DIR/postgres_backup.sql

# 備份 Redis
docker compose exec redis redis-cli BGSAVE
docker compose cp redis:/data/dump.rdb $BACKUP_DIR/
```

#### 應用程式備份
```bash
# 備份配置檔案
tar -czf config_backup_$(date +%Y%m%d).tar.gz .env docker-compose*.yml

# 備份上傳檔案
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz ./uploads
```

### 3. 更新和升級

#### 應用程式更新
```bash
# 拉取最新代碼
git pull origin main

# 重建映像
docker compose build --no-cache

# 滾動更新
docker compose up -d --force-recreate

# 驗證更新
docker compose ps
docker compose logs
```

#### 系統維護
```bash
# 清理未使用的映像
docker image prune -f

# 清理未使用的容器
docker container prune -f

# 清理未使用的網路
docker network prune -f

# 清理未使用的卷
docker volume prune -f
```

## 故障排除

### 常見問題

#### 1. 服務無法啟動
```bash
# 檢查端口衝突
netstat -tulpn | grep :8000

# 檢查磁碟空間
df -h

# 檢查記憶體使用
free -h

# 重新啟動服務
docker compose restart
```

#### 2. 資料庫連接問題
```bash
# 檢查資料庫狀態
docker compose exec postgres pg_isready

# 檢查連接配置
docker compose exec backend env | grep POSTGRES

# 測試資料庫連接
docker compose exec postgres psql -U postgres -d mking_friend
```

#### 3. 效能問題
```bash
# 檢查資源使用
docker stats

# 檢查服務日誌中的錯誤
docker compose logs | grep ERROR

# 調整資源限制
# 在 docker-compose.yml 中添加：
# deploy:
#   resources:
#     limits:
#       memory: 512M
#       cpus: '0.5'
```

### 緊急恢復

#### 快速恢復
```bash
# 停止所有服務
docker compose down

# 清理並重新啟動
docker compose down -v
docker compose up -d

# 從備份恢復資料庫
docker compose exec -T postgres psql -U postgres mking_friend < backup.sql
```

## 安全性考量

### 1. 網路安全
- 使用防火牆限制不必要的端口訪問
- 配置 SSL/TLS 加密
- 定期更新安全補丁

### 2. 資料安全
- 定期備份重要資料
- 加密敏感資料
- 實施訪問控制

### 3. 容器安全
- 使用非 root 使用者運行容器
- 定期更新基礎映像
- 掃描映像漏洞

## 效能優化

### 1. 資料庫優化
```sql
-- 建立索引
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_created_at ON posts(created_at);

-- 分析查詢效能
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'user@example.com';
```

### 2. 快取策略
```bash
# Redis 快取配置
REDIS_MAXMEMORY=256mb
REDIS_MAXMEMORY_POLICY=allkeys-lru
```

### 3. 負載平衡
```yaml
# nginx.conf 範例
upstream backend {
    server backend1:8000;
    server backend2:8000;
}

server {
    listen 80;
    location / {
        proxy_pass http://backend;
    }
}
```

## 結論

本部署指南提供了完整的 MKing Friend 應用程式部署流程，包括：

- 環境準備和配置
- 服務部署和驗證
- 監控和維護策略
- 故障排除和恢復
- 安全性和效能優化

遵循本指南可以確保應用程式的穩定運行和高可用性。如有問題，請參考故障排除章節或聯繫技術支援團隊。