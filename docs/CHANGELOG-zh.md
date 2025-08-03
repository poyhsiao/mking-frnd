# 變更日誌 (Changelog)

本文件記錄 MKing Friend 項目的所有重要變更和更新。

格式基於 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.0.0/)，
並且本項目遵循 [語義化版本](https://semver.org/lang/zh-TW/)。

## [未發布] - 2025-01-02

### 新增
- 🏗️ **微服務架構設計**
  - 新增 API Gateway 統一入口設計
  - 新增 Consul 服務發現與註冊
  - 新增 gRPC 微服務間通訊協議
  - 新增六大核心微服務架構：Auth、User、Chat、Media、Search、Admin

- 🎨 **前端技術棧升級**
  - 升級至 React 18 + TypeScript
  - 新增 Vite 極速構建工具
  - 新增 Zustand + React Query 狀態管理
  - 新增 Ant Design 企業級 UI 組件庫
  - 新增 OpenStreetMap + Leaflet 開源地圖服務

- ⚙️ **後端技術棧現代化**
  - 新增 NestJS 企業級後端框架
  - 新增 Typesense 快速全文搜尋引擎
  - 新增 PostgreSQL 共享資料庫獨立 Schema 設計
  - 新增 Prisma ORM 現代化資料庫工具
  - 新增 MinIO S3 相容物件存儲

- 🚀 **部署與運維**
  - 新增 Kubernetes 容器編排支援
  - 新增 Prometheus + Grafana 完整監控體系
  - 新增 Loki + Promtail 統一日誌管理
  - 新增 Sentry 錯誤追蹤與效能監控
  - 新增 Keycloak 企業級身份認證

- 📋 **產品規劃與文檔**
  - 新增後台管理系統詳細需求規劃
  - 新增 MVP 功能優先級分類 (P0-P3)
  - 新增微服務架構詳細設計文檔
  - 新增開發任務 Todo List 格式轉換
  - 新增技術決策與架構選型說明

### 變更
- 📁 **項目結構重組**
  - 調整為微服務目錄結構
  - 分離前端應用：user-app 和 admin-app
  - 新增 services/ 目錄存放各微服務
  - 新增 shared/ 目錄存放共用程式庫
  - 新增 k8s/ 目錄存放 Kubernetes 配置

- 📚 **文檔結構優化**
  - 重新組織文檔分類：產品與規劃、技術架構、開發指南、部署與運維
  - 更新 README.md 為微服務架構描述
  - 更新開發指南為微服務開發流程
  - 轉換所有開發任務為可追蹤的 Todo List 格式

- 🔧 **開發環境調整**
  - 更新快速開始指南適配微服務架構
  - 調整服務訪問地址和端口配置
  - 更新本地開發環境設置流程
  - 新增微服務獨立開發指南

### 技術債務
- 需要實際實現微服務代碼結構
- 需要配置 Kubernetes 部署文件
- 需要設置 CI/CD 流水線
- 需要完善監控和日誌配置

### 開發規範強化
- ✅ **變更追蹤規範** - 新增強制性文檔更新規範
  - 建立 CHANGELOG.md 和 README.md 的強制更新機制
  - 定義變更記錄格式和檢查清單
  - 設立文檔維護責任和違規處理機制
  - 確保所有開發者遵循統一的文檔更新標準

### 文檔更新
- ✅ `README.md` - 完全重寫為微服務架構描述，新增完整的快速開始指南、故障排除和貢獻指南
- ✅ `docs/README.md` - 更新文檔結構和技術棧概覽
- ✅ `docs/requirements/prd.md` - 新增微服務架構和後台管理系統需求
- ✅ `docs/development-tasks.md` - 轉換為 Todo List 格式
- ✅ `docs/CHANGELOG.md` - 新增變更日誌文件，建立完整的變更追蹤機制
- ✅ `docs/development/DEVELOPMENT_STANDARDS.md` - 新增變更追蹤與文檔更新規範章節
- ✅ `docs/development/setup.md` - 新增開發規範引用，確保開發者了解強制性文檔更新要求
- ✅ `.gitignore` - 更新忽略規則，適配微服務架構和開發環境
- ✅ `docs/` - 新增完整的文檔目錄結構，包含部署指南、開發規範、架構設計等

---

## 版本說明

- **[未發布]** - 正在開發中的功能
- **新增** - 新功能
- **變更** - 現有功能的變更
- **棄用** - 即將移除的功能
- **移除** - 已移除的功能
- **修復** - 錯誤修復
- **安全** - 安全性相關的變更

---

**MKing Friend** - 現代化微服務架構的線上交友平台 💝