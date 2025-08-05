# MKing Friend 技術架構決策記錄 (ADR)

## 概述

本文檔記錄了 MKing Friend 專案中重要的技術架構決策，包括決策背景、考慮的選項、最終決策和預期後果。這些決策將指導整個開發過程。

## ADR-001: 微服務架構 vs 單體架構

### 狀態
✅ **已決定** - 採用微服務架構

### 背景
需要選擇應用程式的整體架構模式，考慮到團隊規模、功能複雜度和未來擴展需求。

### 決策
採用微服務架構，將應用程式拆分為以下服務：
- API Gateway (統一入口)
- Auth Service (認證服務)
- User Service (用戶服務)
- Chat Service (聊天服務)
- Media Service (媒體服務)
- Search Service (搜尋服務)
- Admin Service (管理服務)

### 理由
**優點:**
- 獨立部署和擴展
- 技術棧靈活性
- 團隊獨立開發
- 故障隔離
- 符合業務邊界

**缺點:**
- 增加運維複雜度
- 網路延遲
- 數據一致性挑戰
- 調試困難

**決策原因:**
- 交友應用的功能模組天然分離
- 不同模組有不同的擴展需求
- 團隊可以並行開發
- 為未來增長做準備

### 後果
- 需要投入更多時間在基礎設施建設
- 需要建立服務間通訊機制
- 需要統一的監控和日誌系統
- 開發初期會比單體架構慢

---

## ADR-002: 資料庫策略

### 狀態
✅ **已決定** - 共享 PostgreSQL + 微服務專用 Schema

### 背景
微服務架構下的資料庫設計策略選擇。

### 考慮的選項
1. **每個微服務獨立資料庫**
2. **共享資料庫，獨立 Schema**
3. **完全共享資料庫**

### 決策
採用共享 PostgreSQL 資料庫，但每個微服務使用獨立的 Schema。

### 理由
**選擇原因:**
- 降低運維複雜度
- 保證 ACID 事務
- 減少資料同步問題
- 成本效益高
- 適合團隊規模

**Schema 分離:**
- `auth_schema`: 認證相關資料
- `user_schema`: 用戶資料
- `chat_schema`: 聊天資料
- `media_schema`: 媒體檔案資料
- `admin_schema`: 管理資料

### 後果
- 需要仔細設計 Schema 邊界
- 需要資料庫遷移協調
- 某些跨服務查詢需要 API 調用
- 資料庫成為潛在瓶頸

---

## ADR-003: 前端技術棧

### 狀態
✅ **已決定** - React + TypeScript + Vite

### 背景
選擇前端開發技術棧，考慮開發效率、效能和團隊技能。

### 考慮的選項
1. **React + TypeScript + Vite**
2. **Vue.js + TypeScript + Vite**
3. **Next.js (React 框架)**
4. **Svelte + SvelteKit**

### 決策
**主要技術棧:**
- React 18 (UI 框架)
- TypeScript (類型安全)
- Vite (建構工具)
- Zustand (狀態管理)
- React Query (數據獲取)
- Tailwind CSS (樣式框架)
- Ant Design (UI 組件庫)

### 理由
**React 選擇原因:**
- 團隊熟悉度高
- 生態系統成熟
- 社群支援強
- 招聘容易

**TypeScript 選擇原因:**
- 類型安全
- 更好的開發體驗
- 重構友好
- 團隊協作效率

**Vite 選擇原因:**
- 快速的開發伺服器
- 優秀的 HMR
- 現代化建構
- TypeScript 原生支援

### 後果
- 需要學習 React 18 新特性
- TypeScript 增加初期開發時間
- Vite 生態相對較新
- 整體開發體驗優秀

---

## ADR-004: 後端技術棧

### 狀態
✅ **已決定** - Node.js + NestJS + Prisma

### 背景
選擇後端開發技術棧，考慮開發效率、效能和維護性。

### 考慮的選項
1. **Node.js + NestJS + Prisma**
2. **Node.js + Express + TypeORM**
3. **Python + FastAPI + SQLAlchemy**
4. **Go + Gin + GORM**

### 決策
**主要技術棧:**
- Node.js 18+ (運行環境)
- NestJS (後端框架)
- Prisma (ORM)
- TypeScript (開發語言)
- PostgreSQL (主資料庫)
- Redis (快取)
- JWT (認證)

### 理由
**Node.js 選擇原因:**
- 前後端統一語言
- 豐富的生態系統
- 適合 I/O 密集應用
- 團隊技能匹配

**NestJS 選擇原因:**
- 企業級框架
- 內建 TypeScript 支援
- 模組化架構
- 豐富的裝飾器
- 微服務支援

**Prisma 選擇原因:**
- 類型安全的 ORM
- 優秀的開發體驗
- 自動生成類型
- 資料庫遷移工具

### 後果
- 需要學習 NestJS 架構模式
- Prisma 相對較新，社群較小
- Node.js 單線程限制
- 整體開發效率高

---

## ADR-005: 搜尋引擎選擇

### 狀態
✅ **已決定** - Typesense

### 背景
需要選擇搜尋引擎來實現用戶搜尋和推薦功能。

### 考慮的選項
1. **Elasticsearch**
2. **Typesense**
3. **PostgreSQL 全文搜尋**
4. **Algolia (SaaS)**

### 決策
採用 Typesense 作為主要搜尋引擎。

### 理由
**Typesense 優點:**
- 開源且免費
- 設置簡單
- 效能優秀
- 即時搜尋
- 容錯搜尋
- 地理位置搜尋支援
- 資源消耗低

**vs Elasticsearch:**
- 更輕量級
- 設置更簡單
- 記憶體使用更少
- 更適合中小型應用

**vs PostgreSQL:**
- 更好的搜尋體驗
- 更豐富的搜尋功能
- 更好的效能

### 後果
- 需要維護額外的搜尋服務
- 需要數據同步機制
- 社群相對較小
- 搜尋體驗優秀

---

## ADR-006: 地圖服務選擇

### 狀態
✅ **已決定** - OpenStreetMap + Leaflet

### 背景
需要地圖服務來實現地理位置功能，考慮成本和功能需求。

### 考慮的選項
1. **Google Maps API**
2. **OpenStreetMap + Leaflet**
3. **Mapbox**
4. **Apple Maps (iOS only)**

### 決策
採用 OpenStreetMap + Leaflet 組合。

### 理由
**選擇原因:**
- 完全免費
- 開源解決方案
- 無 API 調用限制
- 自主控制
- 社群支援
- 功能足夠滿足需求

**vs Google Maps:**
- 無成本壓力
- 無調用次數限制
- 數據隱私更好

**Leaflet 優點:**
- 輕量級
- 插件豐富
- 易於客製化
- 行動端友好

### 後果
- 地圖數據可能不如 Google 完整
- 需要自行處理地理編碼
- 某些高級功能需要額外開發
- 大幅降低運營成本

---

## ADR-007: 狀態管理策略

### 狀態
✅ **已決定** - Zustand + React Query

### 背景
前端應用需要有效的狀態管理解決方案。

### 考慮的選項
1. **Redux Toolkit**
2. **Zustand + React Query**
3. **Recoil**
4. **Context API + useReducer**

### 決策
採用 Zustand 處理客戶端狀態，React Query 處理伺服器狀態。

### 理由
**Zustand 優點:**
- 輕量級 (2KB)
- 簡單易用
- TypeScript 友好
- 無樣板代碼
- 靈活的架構

**React Query 優點:**
- 專門處理伺服器狀態
- 自動快取
- 背景更新
- 樂觀更新
- 錯誤處理

**組合優勢:**
- 職責分離清晰
- 學習成本低
- 效能優秀
- 開發體驗好

### 後果
- 需要學習兩個狀態管理庫
- 需要明確狀態分類
- 整體複雜度降低
- 開發效率提升

---

## ADR-008: 認證策略

### 狀態
✅ **已決定** - JWT + Keycloak OAuth

### 背景
需要設計安全可靠的用戶認證和授權系統。

### 考慮的選項
1. **Session-based 認證**
2. **JWT 認證**
3. **OAuth 2.0 + OpenID Connect**
4. **混合方案**

### 決策
採用 JWT 作為主要認證機制，整合 Keycloak 提供 OAuth 功能。

### 理由
**JWT 優點:**
- 無狀態
- 跨服務友好
- 移動端友好
- 包含用戶資訊
- 標準化

**Keycloak 優點:**
- 開源 IAM 解決方案
- 支援多種認證方式
- 社交登入整合
- 管理界面完整
- 企業級功能

**架構設計:**
- 短期 Access Token (15分鐘)
- 長期 Refresh Token (7天)
- 自動 Token 刷新
- 安全的 Token 存儲

### 後果
- 需要處理 Token 刷新邏輯
- 需要安全存儲 Token
- Keycloak 增加部署複雜度
- 提供靈活的認證選項

---

## ADR-009: 容器化和部署策略

### 狀態
✅ **已決定** - Docker + Kubernetes

### 背景
需要選擇應用程式的容器化和部署策略。

### 考慮的選項
1. **Docker + Docker Compose**
2. **Docker + Kubernetes**
3. **Docker + Docker Swarm**
4. **無容器部署**

### 決策
採用 Docker 容器化，Kubernetes 作為編排平台。

### 理由
**Docker 優點:**
- 環境一致性
- 易於部署
- 資源隔離
- 版本管理

**Kubernetes 優點:**
- 自動擴展
- 服務發現
- 負載均衡
- 健康檢查
- 滾動更新
- 配置管理

**部署策略:**
- 開發環境: Docker Compose
- 測試環境: Kubernetes
- 生產環境: Kubernetes

### 後果
- 增加學習成本
- 需要 DevOps 技能
- 部署複雜度增加
- 運維能力大幅提升

---

## ADR-010: 監控和日誌策略

### 狀態
✅ **已決定** - Prometheus + Grafana + Loki

### 背景
微服務架構需要完善的監控和日誌系統。

### 考慮的選項
1. **ELK Stack (Elasticsearch + Logstash + Kibana)**
2. **Prometheus + Grafana + Loki**
3. **雲端監控服務**
4. **自建監控系統**

### 決策
採用 Prometheus + Grafana + Loki + Promtail 組合。

### 理由
**Prometheus 優點:**
- 時間序列資料庫
- 強大的查詢語言
- 服務發現
- 告警規則
- 雲原生標準

**Grafana 優點:**
- 豐富的視覺化
- 多數據源支援
- 告警通知
- 儀表板分享

**Loki 優點:**
- 輕量級日誌系統
- 與 Prometheus 整合
- 成本效益高
- 查詢效能好

### 後果
- 需要學習 PromQL
- 需要設計監控指標
- 增加基礎設施複雜度
- 提供全面的可觀測性

---

## 技術債務管理

### 已知技術債務
1. **微服務複雜度**: 初期可能過度設計
2. **資料庫設計**: 可能需要重構 Schema
3. **效能優化**: 初期專注功能，後續優化
4. **測試覆蓋**: 需要補充自動化測試

### 債務償還計劃
- **Phase 1**: 專注功能實現
- **Phase 2**: 效能優化和重構
- **Phase 3**: 測試完善和文檔
- **Phase 4**: 架構優化和擴展

## 決策回顧機制

### 回顧週期
- **每月回顧**: 檢視決策執行情況
- **季度評估**: 評估決策效果
- **年度審查**: 重大決策調整

### 回顧標準
- 技術目標達成度
- 開發效率影響
- 維護成本變化
- 團隊滿意度

---

**文檔版本**: v1.0  
**最後更新**: 2025-01-03  
**維護者**: 技術團隊  
**審核狀態**: 已通過技術評審