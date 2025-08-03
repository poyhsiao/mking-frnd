# MKing Friend - 線上交友平台文檔

## 📖 文檔概述

本項目採用微服務架構，使用現代化技術棧構建的線上交友平台。文檔涵蓋產品規劃、技術架構、開發指南和項目管理等各個方面。

## 📁 文檔結構

### 📋 產品與規劃
- [`requirements/prd.md`](./requirements/prd.md) - 產品需求文檔 ⭐ 核心文檔
- [`mvp-priority-matrix.md`](./mvp-priority-matrix.md) - MVP 功能優先級矩陣
- [`development-tasks.md`](./development-tasks.md) - 開發任務 Todo List
- [`task-dependencies.md`](./task-dependencies.md) - 任務依賴關係圖

### 🏗️ 技術架構
- [`technical-decisions.md`](./technical-decisions.md) - 技術架構決策記錄 ⭐ 重要參考
- [`architecture/`](./architecture/) - 系統架構設計
  - [後端技術棧詳細比較](./architecture/backend-technology-comparison.md)
  - [技術決策指南](./architecture/technology-decision-guide.md)
- [技術棧規格](./TECH_STACK.md) - 已確定技術選型

### 🛠️ 開發指南
- [`development/`](./development/) - 開發指南和規範
  - [開發環境設置](./development/setup.md)
  - [實施計劃](./development/implementation-plan.md)
  - [TDD 開發指南](./development/tdd-guidelines.md)
  - [開發規範](./development/DEVELOPMENT_STANDARDS.md) ⭐ 必讀
- [`api/`](./api/) - API文檔和規範
- [`database/`](./database/) - 資料庫設計和遷移

### 🧪 測試與部署
- [`testing/`](./testing/) - 測試策略和規範
- [`deployment/`](./deployment/) - 部署和運維文檔

### 📊 項目管理
- [`project-management/`](./project-management/) - 項目管理和任務規劃

## 🚀 快速開始

1. **了解產品**: 閱讀 [產品需求文檔](./requirements/prd.md)
2. **技術架構**: 查看 [技術決策記錄](./technical-decisions.md)
3. **開發規劃**: 參考 [開發任務 Todo List](./development-tasks.md)
4. **功能優先級**: 了解 [MVP 優先級矩陣](./mvp-priority-matrix.md)
5. **環境設置**: 開始 [開發環境設置](./development/setup.md)

## 🛠️ 技術棧概覽

### 微服務架構
- **API Gateway**: Nginx/Traefik
- **服務發現**: Consul
- **微服務通訊**: gRPC

### 前端技術
- **框架**: React 18 + TypeScript
- **構建工具**: Vite
- **狀態管理**: Zustand + React Query
- **UI 組件**: Ant Design
- **地圖服務**: OpenStreetMap + Leaflet

### 後端技術
- **框架**: Node.js + NestJS + TypeScript
- **資料庫**: PostgreSQL (共享資料庫，獨立 Schema)
- **ORM**: Prisma
- **快取**: Redis
- **搜尋引擎**: Typesense
- **檔案存儲**: MinIO

### 部署與運維
- **容器化**: Docker + Docker Compose
- **編排**: Kubernetes
- **監控**: Prometheus + Grafana
- **日誌**: Loki + Promtail
- **錯誤追蹤**: Sentry

## 開發原則

- **測試驅動開發 (TDD)**: 所有功能都必須先寫測試
- **代碼品質**: 遵循 PEP 8 (Python) 和 ESLint (JavaScript/TypeScript) 規範
- **安全第一**: 所有用戶輸入都必須驗證和清理
- **文檔完整**: 所有模組和函數都必須有清晰的文檔
- **版本控制**: 使用 Git Flow 分支策略
- **持續整合**: 每次提交都會自動運行測試和檢查

## 聯絡資訊

如有任何問題或建議，請聯絡開發團隊。