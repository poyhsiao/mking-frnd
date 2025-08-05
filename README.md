# MKing Friend - 現代化線上交友平台

基於微服務架構的現代化線上交友平台，採用最新技術棧構建，提供完整的社交互動體驗。

## 🎯 項目特色

- **微服務架構**: 模塊化設計，易於擴展和維護
- **現代技術棧**: React 18 + NestJS + TypeScript + PostgreSQL
- **智能搜尋**: Typesense 全文搜尋引擎
- **地圖整合**: OpenStreetMap + Leaflet 地理位置服務
- **即時通訊**: Socket.io 實時聊天系統
- **完整監控**: Prometheus + Grafana + Loki 監控體系
- **容器化部署**: Docker + Kubernetes 雲原生部署

## 🛠 技術棧

### 🏗️ 微服務架構
- **API Gateway**: Nginx/Traefik 統一入口
- **服務發現**: Consul 服務註冊與發現
- **微服務通訊**: gRPC 高效通訊協議
- **負載均衡**: 自動負載分散

#### 核心微服務
- **Auth Service**: 認證授權服務
- **User Service**: 用戶管理服務
- **Chat Service**: 即時聊天服務
- **Media Service**: 媒體檔案服務
- **Search Service**: 搜尋推薦服務
- **Admin Service**: 後台管理服務

### 🎨 前端技術
- **React 18** + TypeScript - 現代化前端框架
- **Vite** - 極速構建工具
- **Zustand** + React Query - 狀態管理
- **Ant Design** - 企業級 UI 組件庫
- **OpenStreetMap** + Leaflet - 開源地圖服務

### ⚙️ 後端技術
- **Node.js** + **NestJS** + TypeScript - 企業級後端框架
- **PostgreSQL** - 關聯式資料庫 (共享資料庫，獨立 Schema)
- **Prisma ORM** - 現代化資料庫工具
- **Redis** - 高效能快取系統
- **Typesense** - 快速全文搜尋引擎
- **MinIO** - S3 相容物件存儲
- **Socket.io** - 即時通訊引擎

### 🚀 部署與運維
- **Docker** + Docker Compose - 容器化部署
- **Kubernetes** - 容器編排平台
- **Prometheus** + Grafana - 監控與可視化
- **Loki** + Promtail - 日誌管理系統
- **Sentry** - 錯誤追蹤與效能監控
- **Keycloak** - 企業級身份認證

## 🚀 快速開始

### 前置要求

- **Docker** 20.10+ 和 **Docker Compose** 2.0+
- **Node.js** 18+ (本地開發)
- 至少 **8GB** 可用內存
- 至少 **20GB** 可用磁盤空間

### 安裝步驟

1. **克隆項目**
   ```bash
   git clone https://github.com/your-username/mking-frnd.git
   cd mking-frnd
   ```

2. **配置環境變量**
   ```bash
   cp .env.example .env
   # 編輯 .env 文件，設置資料庫、Redis、JWT 等配置
   ```

3. **啟動基礎設施服務**
   ```bash
   # 啟動資料庫、快取、監控等基礎服務
   docker-compose up -d postgres redis typesense minio keycloak
   ```

4. **啟動微服務**
   ```bash
   # 啟動所有微服務
   docker-compose up -d
   ```

5. **初始化資料庫**
   ```bash
   # 執行資料庫遷移
   docker-compose exec auth-service npm run prisma:migrate
   docker-compose exec user-service npm run prisma:migrate
   ```

### 服務訪問地址

#### 🎯 核心應用
- **前端應用**: http://localhost:3000
- **後台管理**: http://localhost:3001
- **API Gateway**: http://localhost:8080

#### 🔧 管理界面
- **Keycloak 認證**: http://localhost:8081 (admin/admin123)
- **MinIO 存儲**: http://localhost:9001 (minioadmin/minioadmin123)
- **Grafana 監控**: http://localhost:3002 (admin/admin123)
- **Typesense 搜尋**: http://localhost:8108

#### 📊 開發工具
- **Prometheus**: http://localhost:9090
- **MailHog 郵件**: http://localhost:8025

## 📁 項目結構

```
mking-frnd/
├── docs/                      # 項目文檔
│   ├── requirements/         # 需求文檔
│   ├── architecture/         # 架構設計
│   ├── development/          # 開發指南
│   └── deployment/           # 部署文檔
├── config/                    # 配置文件
│   ├── nginx/                # API Gateway 配置
│   ├── grafana/              # 監控儀表板配置
│   ├── prometheus/           # 指標收集配置
│   ├── loki/                 # 日誌管理配置
│   ├── promtail/             # Promtail 配置
│   ├── clickhouse/           # ClickHouse 配置
│   └── consul/               # 服務發現配置
├── scripts/                   # 腳本文件
│   └── init-multiple-databases.sh
├── services/                  # 微服務源代碼
│   ├── api-gateway/          # API 閘道服務
│   ├── auth-service/         # 認證授權服務
│   ├── user-service/         # 用戶管理服務
│   ├── chat-service/         # 即時聊天服務
│   ├── media-service/        # 媒體檔案服務
│   ├── search-service/       # 搜尋推薦服務
│   └── admin-service/        # 後台管理服務
├── frontend/                  # 前端應用
│   ├── user-app/             # 用戶端應用
│   └── admin-app/            # 後台管理應用
├── shared/                    # 共用程式庫
│   ├── types/                # TypeScript 類型定義
│   ├── utils/                # 工具函數
│   └── constants/            # 常數定義
├── k8s/                       # Kubernetes 部署配置
├── docker-compose.yml         # 本地開發環境
├── docker-compose.prod.yml    # 生產環境配置
├── .env.example              # 環境變量模板
└── README.md                 # 項目說明
```

## 🔧 開發指南

### 本地開發環境

1. **啟動基礎設施服務**
   ```bash
   # 啟動資料庫、快取、搜尋引擎等基礎服務
   docker-compose up -d postgres redis typesense minio keycloak consul
   ```

2. **開發微服務**
   ```bash
   # 開發認證服務
   cd services/auth-service
   npm install
   npm run dev
   
   # 開發用戶服務
   cd services/user-service
   npm install
   npm run dev
   ```

3. **開發前端應用**
   ```bash
   # 開發用戶端應用
   cd frontend/user-app
   npm install
   npm run dev
   
   # 開發後台管理應用
   cd frontend/admin-app
   npm install
   npm run dev
   ```

4. **API Gateway 開發**
   ```bash
   cd services/api-gateway
   npm install
   npm run dev
   ```

### 數據庫管理

```bash
# 連接到 PostgreSQL
docker-compose exec postgres psql -U mking_user -d mking_db

# 備份數據庫
docker-compose exec postgres pg_dump -U mking_user mking_db > backup.sql

# 恢復數據庫
docker-compose exec -T postgres psql -U mking_user -d mking_db < backup.sql
```

### 日誌查看

```bash
# 查看所有服務日誌
docker-compose logs -f

# 查看特定服務日誌
docker-compose logs -f backend
docker-compose logs -f postgres
```

## 🔐 安全配置

### 生產環境部署

1. **更改默認密碼**
   - 修改 `.env` 文件中的所有默認密碼
   - 特別注意數據庫、Keycloak、Grafana 等服務的密碼

2. **配置 HTTPS**
   - 使用 Let's Encrypt 或其他 SSL 證書
   - 更新 Nginx 配置以支持 HTTPS

3. **網絡安全**
   - 配置防火牆規則
   - 限制對管理界面的訪問
   - 使用 VPN 或跳板機訪問內部服務

## 📊 監控和維護

### 系統監控

- **Grafana**: http://localhost:3000 (admin/admin123)
  - 系統資源監控
  - 應用性能指標
  - 日誌查詢和分析
  - 自定義儀表板

- **Prometheus**: http://localhost:9090
  - 指標收集和存儲
  - 告警規則配置

- **Loki**: http://localhost:3100
  - 日誌聚合和存儲
  - LogQL 查詢語言

- **Promtail**: http://localhost:9080
  - 日誌收集代理
  - 容器日誌自動採集

### 日誌分析

- **統一日誌管理**: Grafana Loki + Promtail 提供完整的日誌解決方案
- **日誌查詢**: 在 Grafana 中使用 LogQL 進行日誌查詢和分析
- **錯誤追蹤**: Sentry 自動收集和分析錯誤
- **實時監控**: 容器日誌實時收集和展示

### 備份策略

```bash
# 創建備份腳本
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)

# 備份數據庫
docker-compose exec postgres pg_dump -U mking_user mking_db > backup_${DATE}.sql

# 備份 MinIO 數據
docker-compose exec minio mc mirror /data/mking-files /backup/minio_${DATE}

# 備份配置文件
tar -czf config_backup_${DATE}.tar.gz config/
```

## 📚 文檔

詳細的技術文檔和開發指南請參考 [`docs/`](./docs/) 目錄：

### 📋 產品與規劃
- [產品需求文檔 (PRD)](./docs/requirements/prd.md)
- [開發任務規劃](./docs/development-tasks.md)
- [MVP 功能優先級](./docs/requirements/prd.md#mvp-功能優先級)
- [變更日誌 (CHANGELOG)](./docs/CHANGELOG.md)

### 🏗️ 技術架構
- [微服務架構設計](./docs/architecture/)
- [系統架構概覽](./docs/README.md)
- [資料庫設計](./docs/architecture/database-design.md)
- [API 設計規範](./docs/development/api-guidelines.md)

### 🛠️ 開發指南
- [開發環境設置](./docs/development/)
- [微服務開發指南](./docs/development/microservices-guide.md)
- [前端開發規範](./docs/development/frontend-guidelines.md)
- [後台管理系統開發](./docs/development/admin-system-tasks.md)

### 🚀 部署與運維
- [Docker 部署指南](./docs/deployment/)
- [Kubernetes 部署](./docs/deployment/kubernetes-deployment.md)
- [監控與日誌管理](./docs/deployment/monitoring-setup.md)
- [生產環境配置](./docs/deployment/production-setup.md)

## 🤝 貢獻指南

1. Fork 項目
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 🆘 故障排除

### 常見問題

1. **服務啟動失敗**
   ```bash
   # 檢查端口占用
   netstat -tulpn | grep :8080
   
   # 重新構建容器
   docker-compose down
   docker-compose up --build -d
   ```

2. **數據庫連接問題**
   ```bash
   # 檢查數據庫狀態
   docker-compose exec postgres pg_isready -U mking_user
   
   # 重置數據庫
   docker-compose down postgres
   docker volume rm mking-frnd_postgres_data
   docker-compose up -d postgres
   ```

3. **內存不足**
   ```bash
   # 檢查資源使用
   docker stats
   
   # 清理未使用的容器和鏡像
   docker system prune -a
   ```

### 獲取幫助

- 查看項目文檔: `docs/` 目錄
- 提交 Issue: GitHub Issues
- 社區討論: GitHub Discussions

## 📄 授權

本專案採用 MIT 授權條款 - 查看 [LICENSE](LICENSE) 文件了解詳情。

---

**MKing Friend** - 現代化微服務架構的線上交友平台 💝

採用最新技術棧，提供完整的社交互動體驗，支援智能搜尋、即時聊天、地理位置服務等功能。
