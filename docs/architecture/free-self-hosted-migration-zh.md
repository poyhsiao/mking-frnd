# 免費 Self-Hosted 技術棧遷移計劃

## 概述

本文檔詳細說明將 MKing Friend 平台從依賴付費第三方服務遷移到完全免費的 self-hosted 解決方案的計劃。

## 🎯 遷移目標

- **100% 免費**: 所有技術組件都使用開源免費方案
- **Self-Hosted**: 所有服務都可以自主部署和管理
- **Docker 化**: 使用 Docker/Docker Compose 統一管理部署
- **可擴展**: 保持系統的可擴展性和性能

## 📋 服務替換對照表

### 檔案存儲服務

| 原服務 | 替代方案 | 說明 |
|--------|----------|------|
| AWS S3 | **MinIO** | 開源 S3 兼容對象存儲 |
| Cloudinary | **MinIO + ImageMagick** | 本地圖片處理和存儲 |
| CloudFront CDN | **Nginx + 本地緩存** | 靜態文件服務和緩存 |

### 認證服務

| 原服務 | 替代方案 | 說明 |
|--------|----------|------|
| Google OAuth | **Keycloak** | 開源身份認證和授權服務 |
| Discord OAuth | **本地 OAuth 實現** | 自建 OAuth 2.0 服務 |

### 通知服務

| 原服務 | 替代方案 | 說明 |
|--------|----------|------|
| Firebase Cloud Messaging | **Web Push API + Service Worker** | 瀏覽器原生推送通知 |
| SendGrid | **Nodemailer + SMTP** | 開發環境使用 MailHog 測試，生產環境使用 MailerSend 等免費 SMTP 服務 |

### 分析服務

| 原服務 | 替代方案 | 說明 |
|--------|----------|------|
| Google Analytics | **Plausible Analytics (Self-hosted)** | 隱私友好的開源分析工具 |

### 監控服務

| 原服務 | 替代方案 | 說明 |
|--------|----------|------|
| 付費監控服務 | **Grafana + Prometheus** | 開源監控和可視化 |
| 錯誤追蹤 | **Sentry (Self-hosted)** | 開源錯誤追蹤 |

## 🔧 技術實施方案

### 1. MinIO 對象存儲

```yaml
# docker-compose.yml 中的 MinIO 配置
minio:
  image: minio/minio:latest
  container_name: mking-minio
  ports:
    - "9000:9000"
    - "9001:9001"
  environment:
    MINIO_ROOT_USER: admin
    MINIO_ROOT_PASSWORD: password123
  volumes:
    - minio_data:/data
  command: server /data --console-address ":9001"
```

**特點:**
- S3 API 兼容
- 支持多租戶
- 內建 Web 管理界面
- 支持分佈式部署

### 2. Keycloak 身份認證

```yaml
# Keycloak 配置
keycloak:
  image: quay.io/keycloak/keycloak:latest
  container_name: mking-keycloak
  ports:
    - "8080:8080"
  environment:
    KEYCLOAK_ADMIN: admin
    KEYCLOAK_ADMIN_PASSWORD: admin123
    KC_DB: postgres
    KC_DB_URL: jdbc:postgresql://postgres:5432/keycloak
    KC_DB_USERNAME: keycloak
    KC_DB_PASSWORD: password
  depends_on:
    - postgres
  command: start-dev
```

**特點:**
- 支持多種認證協議 (OAuth 2.0, SAML, OpenID Connect)
- 內建用戶管理界面
- 支持社交登入整合
- 多租戶支持

### 3. Plausible Analytics

```yaml
# Plausible Analytics 配置
plausible:
  image: plausible/analytics:latest
  container_name: mking-analytics
  ports:
    - "8000:8000"
  environment:
    BASE_URL: http://localhost:8000
    SECRET_KEY_BASE: your-secret-key
    DATABASE_URL: postgres://plausible:password@postgres:5432/plausible
  depends_on:
    - postgres
    - clickhouse
```

**特點:**
- 隱私友好 (不使用 cookies)
- 輕量級和快速
- 簡潔的分析報告
- GDPR 合規

### 4. Grafana + Prometheus 監控

```yaml
# 監控服務配置
prometheus:
  image: prom/prometheus:latest
  container_name: mking-prometheus
  ports:
    - "9090:9090"
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml

grafana:
  image: grafana/grafana:latest
  container_name: mking-grafana
  ports:
    - "3000:3000"
  environment:
    GF_SECURITY_ADMIN_PASSWORD: admin123
  volumes:
    - grafana_data:/var/lib/grafana
```

## 🗂️ 完整 Docker Compose 配置

```yaml
version: '3.8'

services:
  # 資料庫服務
  postgres:
    image: postgres:15
    container_name: mking-postgres
    environment:
      POSTGRES_DB: mking_frnd
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password123
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-db.sql:/docker-entrypoint-initdb.d/init-db.sql
    ports:
      - "5432:5432"

  # Redis 緩存
  redis:
    image: redis:7-alpine
    container_name: mking-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # MinIO 對象存儲
  minio:
    image: minio/minio:latest
    container_name: mking-minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: admin
      MINIO_ROOT_PASSWORD: password123
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"

  # Keycloak 身份認證
  keycloak:
    image: quay.io/keycloak/keycloak:latest
    container_name: mking-keycloak
    ports:
      - "8080:8080"
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin123
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://postgres:5432/keycloak
      KC_DB_USERNAME: keycloak
      KC_DB_PASSWORD: password123
    depends_on:
      - postgres
    command: start-dev

  # ClickHouse (Plausible 依賴)
  clickhouse:
    image: clickhouse/clickhouse-server:latest
    container_name: mking-clickhouse
    environment:
      CLICKHOUSE_DB: plausible
      CLICKHOUSE_USER: plausible
      CLICKHOUSE_PASSWORD: password123
    volumes:
      - clickhouse_data:/var/lib/clickhouse

  # Plausible Analytics
  plausible:
    image: plausible/analytics:latest
    container_name: mking-analytics
    ports:
      - "8000:8000"
    environment:
      BASE_URL: http://localhost:8000
      SECRET_KEY_BASE: your-secret-key-base-64-chars-long
      DATABASE_URL: postgres://plausible:password123@postgres:5432/plausible
      CLICKHOUSE_DATABASE_URL: http://plausible:password123@clickhouse:8123/plausible
    depends_on:
      - postgres
      - clickhouse

  # Prometheus 監控
  prometheus:
    image: prom/prometheus:latest
    container_name: mking-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus

  # Grafana 可視化
  grafana:
    image: grafana/grafana:latest
    container_name: mking-grafana
    ports:
      - "3000:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin123
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources

  # Sentry 錯誤追蹤
  sentry:
    image: sentry:latest
    container_name: mking-sentry
    ports:
      - "9001:9000"
    environment:
      SENTRY_SECRET_KEY: your-sentry-secret-key
      SENTRY_POSTGRES_HOST: postgres
      SENTRY_POSTGRES_PORT: 5432
      SENTRY_DB_NAME: sentry
      SENTRY_DB_USER: sentry
      SENTRY_DB_PASSWORD: password123
    depends_on:
      - postgres
      - redis

  # Nginx 反向代理
  nginx:
    image: nginx:alpine
    container_name: mking-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - static_files:/var/www/static
    depends_on:
      - backend
      - frontend

volumes:
  postgres_data:
  redis_data:
  minio_data:
  clickhouse_data:
  prometheus_data:
  grafana_data:
  static_files:
```

## 🔄 遷移步驟

### Phase 1: 基礎設施準備 (Week 1)

1. **設置 MinIO 對象存儲**
   - 部署 MinIO 服務
   - 創建存儲桶
   - 配置訪問策略
   - 測試 S3 API 兼容性

2. **設置 Keycloak 認證服務**
   - 部署 Keycloak
   - 配置 Realm 和 Client
   - 設置用戶管理
   - 測試 OAuth 2.0 流程

### Phase 2: 應用程式整合 (Week 2)

1. **更新後端配置**
   - 修改檔案上傳邏輯使用 MinIO
   - 整合 Keycloak 認證
   - 更新環境變數配置

2. **更新前端配置**
   - 修改認證流程
   - 更新檔案上傳組件
   - 整合 Plausible Analytics

### Phase 3: 監控和分析 (Week 3)

1. **部署監控服務**
   - 設置 Prometheus + Grafana
   - 配置監控指標
   - 創建監控儀表板

2. **部署分析服務**
   - 設置 Plausible Analytics
   - 配置追蹤代碼
   - 測試分析數據收集

### Phase 4: 測試和優化 (Week 4)

1. **全面測試**
   - 功能測試
   - 性能測試
   - 安全測試

2. **文檔更新**
   - 更新部署文檔
   - 更新開發指南
   - 更新運維手冊

## 📊 成本效益分析

### 原付費服務成本 (月費)
- AWS S3: $50-200
- Cloudinary: $89-249
- SendGrid: $19.95-89.95
- Firebase: $25-100
- Google Analytics 360: $150,000/年
- **總計**: ~$200-650/月

### Self-Hosted 成本
- 伺服器成本: $50-200/月 (依規模)
- 維護時間: 10-20 小時/月
- **總計**: 大幅降低成本

## 🔒 安全考量

### 1. 數據安全
- 所有服務使用內部網路通信
- 敏感數據加密存儲
- 定期備份策略

### 2. 訪問控制
- 統一身份認證 (Keycloak)
- 角色基礎訪問控制 (RBAC)
- API 訪問限制

### 3. 網路安全
- Nginx 反向代理
- SSL/TLS 加密
- 防火牆配置

## 📈 性能優化

### 1. 緩存策略
- Redis 應用緩存
- Nginx 靜態文件緩存
- MinIO 對象緩存

### 2. 負載均衡
- Nginx 負載均衡
- 水平擴展支持
- 健康檢查機制

### 3. 監控指標
- 應用性能監控
- 資源使用監控
- 用戶行為分析

## 🚀 部署指南

### 快速啟動

```bash
# 克隆項目
git clone <repository>
cd mking-frnd

# 啟動所有服務
docker-compose up -d

# 檢查服務狀態
docker-compose ps

# 查看日誌
docker-compose logs -f
```

### 服務訪問地址

- **應用主頁**: http://localhost
- **MinIO 管理**: http://localhost:9001
- **Keycloak 管理**: http://localhost:8080
- **Grafana 監控**: http://localhost:3000
- **Plausible 分析**: http://localhost:8000
- **Prometheus**: http://localhost:9090

## 📝 維護指南

### 日常維護
- 定期備份數據
- 監控系統資源
- 更新安全補丁
- 檢查日誌異常

### 故障排除
- 服務健康檢查
- 日誌分析
- 性能調優
- 容量規劃

## 🎯 結論

通過採用完全免費的 self-hosted 解決方案，MKing Friend 平台可以：

1. **大幅降低運營成本**
2. **完全控制數據和隱私**
3. **提高系統可靠性和安全性**
4. **支持靈活的定制和擴展**
5. **符合數據主權要求**

這個技術棧不僅滿足當前需求，還為未來的發展提供了堅實的基礎。