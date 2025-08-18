# MKing Friend 技術架構決策記錄 (ADR)

## 概述

本文檔記錄了 MKing Friend 項目的重要技術架構決策，包括決策背景、考慮的選項、最終決策和預期後果。這些決策將指導整個開發過程。

## ADR-001: 微服務架構 vs 單體架構

### 狀態
✅ **已決定** - 採用微服務架構

### 背景
需要選擇整體應用架構模式，考慮團隊規模、功能複雜度和未來擴展需求。

### 決策
採用微服務架構，將應用拆分為以下服務：
- API Gateway（統一入口）
- Auth Service（認證服務）
- User Service（用戶服務）
- Chat Service（聊天服務）
- Media Service（媒體服務）
- Search Service（搜索服務）
- Admin Service（管理服務）

### 理由
**優勢：**
- 獨立部署和擴展
- 技術棧靈活性
- 團隊獨立開發
- 故障隔離
- 符合業務邊界

**劣勢：**
- 運維複雜度增加
- 網絡延遲
- 數據一致性挑戰
- 調試困難

**決策原因：**
- 社交應用功能模塊天然分離
- 不同模塊有不同的擴展需求
- 團隊可以並行開發
- 為未來增長做準備

### 後果
- 需要投入更多時間在基礎設施建設
- 需要建立服務間通信機制
- 需要統一的監控和日誌系統
- 初期開發會比單體架構慢

---

## ADR-002: 數據庫策略

### 狀態
✅ **已決定** - 混合數據庫策略

### 背景
需要為不同類型的數據選擇合適的存儲解決方案。

### 決策
採用混合數據庫策略：
- **PostgreSQL**：主要關係型數據（用戶、好友關係、群組）
- **Redis**：緩存和會話存儲
- **MongoDB**：聊天消息和媒體元數據
- **MinIO/S3**：文件和媒體存儲

### 理由
**PostgreSQL 優勢：**
- ACID 事務支持
- 複雜查詢能力
- 成熟的生態系統
- 強一致性

**Redis 優勢：**
- 高性能緩存
- 會話管理
- 實時功能支持

**MongoDB 優勢：**
- 靈活的文檔結構
- 適合聊天消息存儲
- 水平擴展能力

**MinIO/S3 優勢：**
- 對象存儲
- 高可用性
- 成本效益

### 後果
- 需要管理多種數據庫技術
- 數據同步和一致性挑戰
- 運維複雜度增加
- 為不同數據類型提供最佳性能

---

## ADR-003: 前端技術棧

### 狀態
✅ **已決定** - React + TypeScript + Vite

### 背景
需要選擇前端開發框架和工具鏈。

### 決策
採用以下前端技術棧：
- **React 18**：UI 框架
- **TypeScript**：類型安全
- **Vite**：構建工具
- **Tailwind CSS**：樣式框架
- **React Router**：路由管理
- **React Hook Form**：表單處理

### 理由
**React 優勢：**
- 大型社區和生態系統
- 組件化開發
- 虛擬 DOM 性能
- 豐富的第三方庫

**TypeScript 優勢：**
- 編譯時類型檢查
- 更好的 IDE 支持
- 代碼可維護性
- 團隊協作效率

**Vite 優勢：**
- 快速開發服務器
- 熱模塊替換
- 現代構建工具
- 優秀的 TypeScript 支持

### 後果
- 學習曲線相對較低
- 開發效率高
- 類型安全保障
- 現代開發體驗

---

## ADR-004: 後端技術棧

### 狀態
✅ **已決定** - Node.js + NestJS + TypeScript

### 背景
需要選擇後端開發框架和運行時環境。

### 決策
採用以下後端技術棧：
- **Node.js**：運行時環境
- **NestJS**：後端框架
- **TypeScript**：開發語言
- **Prisma**：ORM 工具
- **Express**：HTTP 服務器（NestJS 底層）

### 理由
**Node.js 優勢：**
- JavaScript 全棧開發
- 高性能 I/O 處理
- 豐富的 npm 生態
- 實時應用支持

**NestJS 優勢：**
- 企業級框架
- 依賴注入
- 模塊化架構
- 內置 TypeScript 支持
- 豐富的裝飾器

**Prisma 優勢：**
- 類型安全的數據庫訪問
- 自動生成客戶端
- 數據庫遷移管理
- 優秀的開發體驗

### 後果
- 前後端技術棧統一
- 開發效率提升
- 類型安全保障
- 易於維護和擴展

---

## ADR-005: 搜索引擎

### 狀態
✅ **已決定** - Typesense

### 背景
需要為用戶搜索、內容搜索等功能選擇搜索引擎。

### 決策
採用 Typesense 作為主要搜索引擎。

### 理由
**Typesense 優勢：**
- 開箱即用的搜索體驗
- 容錯搜索（typo tolerance）
- 實時索引更新
- 簡單的 API
- 輕量級部署
- 內置分析功能

**與 Elasticsearch 比較：**
- 更簡單的配置和維護
- 更好的開箱即用體驗
- 更低的資源消耗
- 更適合中小型應用

### 後果
- 搜索功能快速實現
- 運維成本較低
- 用戶體驗優秀
- 可能需要自定義高級功能

---

## ADR-006: 地圖服務

### 狀態
✅ **已決定** - OpenStreetMap + Leaflet

### 背景
需要為位置分享、附近的人等功能選擇地圖服務。

### 決策
採用 OpenStreetMap 作為地圖數據源，Leaflet 作為前端地圖庫。

### 理由
**OpenStreetMap 優勢：**
- 開源免費
- 無使用限制
- 社區維護
- 數據豐富

**Leaflet 優勢：**
- 輕量級庫
- 移動端友好
- 插件豐富
- 易於定制

**與 Google Maps 比較：**
- 無 API 費用
- 無使用限制
- 更好的隱私保護
- 可自定義程度更高

### 後果
- 降低運營成本
- 避免供應商鎖定
- 可能需要額外的地理編碼服務
- 地圖樣式需要自定義

---

## ADR-007: 狀態管理

### 狀態
✅ **已決定** - Zustand + React Query

### 背景
需要為前端應用選擇狀態管理解決方案。

### 決策
採用 Zustand 進行客戶端狀態管理，React Query 進行服務器狀態管理。

### 理由
**Zustand 優勢：**
- 簡單易用
- 無樣板代碼
- TypeScript 友好
- 小巧的包大小
- 靈活的架構

**React Query 優勢：**
- 服務器狀態管理
- 自動緩存
- 後台更新
- 樂觀更新
- 錯誤處理

**與 Redux 比較：**
- 更少的樣板代碼
- 更簡單的學習曲線
- 更好的 TypeScript 支持
- 更適合現代 React 開發

### 後果
- 開發效率提升
- 代碼更簡潔
- 更好的用戶體驗
- 團隊學習成本較低

---

## ADR-008: 身份認證

### 狀態
✅ **已決定** - JWT + Keycloak

### 背景
需要為應用選擇身份認證和授權解決方案。

### 決策
採用 JWT 作為令牌格式，Keycloak 作為身份提供者。

### 理由
**JWT 優勢：**
- 無狀態認證
- 跨服務共享
- 標準化格式
- 自包含信息

**Keycloak 優勢：**
- 企業級身份管理
- 多種認證方式
- 社交登錄集成
- 單點登錄 (SSO)
- 用戶管理界面
- RBAC 支持

**安全考慮：**
- Access Token 短期有效
- Refresh Token 長期有效
- 安全的令牌存儲
- HTTPS 強制使用

### 後果
- 安全性保障
- 可擴展的認證系統
- 支持多種登錄方式
- 統一的用戶管理

---

## ADR-009: 容器化和編排

### 狀態
✅ **已決定** - Docker + Kubernetes

### 背景
需要為應用部署選擇容器化和編排解決方案。

### 決策
採用 Docker 進行容器化，Kubernetes 進行容器編排。

### 理由
**Docker 優勢：**
- 環境一致性
- 輕量級虛擬化
- 快速部署
- 版本控制

**Kubernetes 優勢：**
- 自動擴縮容
- 服務發現
- 負載均衡
- 滾動更新
- 自愈能力
- 配置管理

**部署策略：**
- 開發環境：Docker Compose
- 生產環境：Kubernetes
- CI/CD 集成
- 藍綠部署

### 後果
- 部署自動化
- 高可用性
- 易於擴展
- 運維複雜度增加

---

## ADR-010: 監控和日誌

### 狀態
✅ **已決定** - Prometheus + Grafana + Loki

### 背景
需要為應用建立監控和日誌系統。

### 決策
採用以下監控和日誌方案：
- **Prometheus**：指標收集
- **Grafana**：可視化儀表板
- **Loki**：日誌聚合
- **AlertManager**：告警管理

### 理由
**Prometheus 優勢：**
- 時間序列數據庫
- 強大的查詢語言
- 服務發現
- 告警規則

**Grafana 優勢：**
- 豐富的可視化
- 多數據源支持
- 告警通知
- 儀表板共享

**Loki 優勢：**
- 與 Prometheus 集成
- 成本效益
- 標籤索引
- Grafana 原生支持

### 後果
- 全面的可觀測性
- 問題快速定位
- 性能優化依據
- 運維效率提升

---

## 技術債務管理

### 識別和跟踪
- 代碼審查中標記技術債務
- 使用 GitHub Issues 跟踪
- 定期技術債務評估
- 優先級分類（高/中/低）

### 償還策略
- 每個 Sprint 分配 20% 時間
- 重構與新功能並行
- 自動化測試保障
- 文檔同步更新

### 預防措施
- 代碼規範和 Linting
- 架構設計審查
- 定期技術分享
- 持續集成檢查

---

## 決策審查機制

### 審查週期
- **月度審查**：評估當前決策執行情況
- **季度審查**：重新評估技術選型
- **年度審查**：整體架構演進規劃

### 審查標準
- 性能指標達成情況
- 開發效率影響
- 運維成本變化
- 團隊滿意度
- 技術生態發展

### 變更流程
1. 提出變更建議
2. 影響分析評估
3. 團隊討論決策
4. 制定遷移計劃
5. 逐步實施變更
6. 效果評估反饋

### 文檔維護
- 決策變更及時更新
- 保留歷史決策記錄
- 經驗教訓總結
- 最佳實踐分享

---

## ADR-012: TypeScript 配置 rootDir 問題修復

### 狀態
✅ **已決定** - 移除後端 tsconfig.json 對根配置的依賴，使其自包含

### 背景
在 GitHub Actions CI/CD 流程中，後端 TypeScript 編譯失敗，出現以下錯誤：
```
Cannot find module '../tsconfig.json'
Require stack:
- /app/backend/tsconfig.json
```

### 問題分析
- 後端 tsconfig.json 通過 `"extends": "../tsconfig.json"` 繼承根配置
- 在 Docker 容器環境中，根目錄的 tsconfig.json 不可用
- Vitest 和 Vite 在處理 TypeScript 配置時無法解析繼承關係
- 導致測試和構建流程失敗

### 決策
移除後端 tsconfig.json 對根配置的依賴，使其成為自包含的配置：
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "rootDir": "./src",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@backend/*": ["./src/*"],
      "@common/*": ["./src/common/*"]
    },
    // ... 完整的編譯器選項
  }
}
```

### 實施方法
使用 BDD（行為驅動開發）方法論：

1. **編寫 BDD 測試場景**：
   - 創建 `tests/features/typescript-configuration.feature` 定義驗證場景
   - 創建 `tests/step-definitions/typescript-configuration.steps.ts` 實現測試步驟

2. **BDD 測試場景**：
   ```gherkin
   Feature: TypeScript Configuration Management
   
   Scenario: Backend TypeScript configuration should be self-contained
     Given the backend directory exists
     When I check the backend tsconfig.json
     Then it should not extend any parent configuration
     And it should have its own complete compiler options
   
   Scenario: Backend tests should work in Docker environment
     Given the backend has a test configuration
     When I run tests in a Docker container
     Then there should be no "Cannot find module" errors
     And all TypeScript files should compile successfully
   ```

3. **修復實施步驟**：
   - 移除 `backend/tsconfig.json` 中的 `"extends": "../tsconfig.json"`
   - 添加完整的編譯器選項配置
   - 更新 `backend/tsconfig.test.json` 使其也自包含
   - 修復相關的單元測試
   - 在 Docker 環境中驗證修復效果

### 理由
**技術原因：**
- 解決 Docker 容器環境中 TypeScript 配置繼承問題
- 消除對外部配置文件的依賴，提高可移植性
- 確保測試和構建環境的一致性
- 避免 Vitest/Vite 工具鏈的配置解析問題

**BDD 方法論優勢：**
- 測試驅動的問題解決方法，確保修復有效性
- 清晰的行為描述，便於理解和維護
- 建立回歸測試保護，防止未來類似問題
- 提供可執行的文檔，描述期望的系統行為

### 後果
**正面影響：**
- CI/CD 流程恢復正常，測試通過率 100%
- Docker 環境中的 TypeScript 編譯錯誤完全解決
- 後端配置獨立性增強，減少跨項目依賴
- 建立了完整的 BDD 測試框架
- 提高了配置的可維護性和可理解性

**潛在影響：**
- 配置文件內容增加，需要維護更多編譯器選項
- 失去了根配置的統一管理優勢
- 需要手動同步跨項目的 TypeScript 配置變更

### 經驗教訓
1. **容器化環境配置管理**：Docker 環境中的配置繼承可能失效，需要自包含配置
2. **BDD 測試價值**：行為驅動測試提供清晰的問題定義和驗證標準
3. **工具鏈兼容性**：Vitest/Vite 等現代工具對 TypeScript 配置繼承的處理可能有限制
4. **CI/CD 環境一致性**：本地開發環境和 CI/CD 環境的差異需要充分測試
5. **文檔化決策**：記錄完整的問題分析和解決過程，便於後續維護和學習

### 相關文件
- `backend/tsconfig.json` - 後端 TypeScript 配置（已修改為自包含）
- `backend/tsconfig.test.json` - 後端測試 TypeScript 配置（已修改為自包含）
- `backend/src/__tests__/tsconfig-rootdir.test.ts` - 配置驗證測試（已更新）
- `tests/features/typescript-configuration.feature` - BDD 功能測試場景
- `tests/step-definitions/typescript-configuration.steps.ts` - BDD 測試步驟定義
- `docker-compose.test.yml` - Docker 測試環境配置

---

## 總結

本文檔記錄了 MKing Friend 項目的核心技術決策，這些決策基於當前的技術環境、團隊能力和業務需求。隨著項目的發展和技術的演進，我們將持續評估和優化這些決策，確保技術架構能夠支撐業務的長期發展。

每個決策都經過充分的考慮和評估，但我們也認識到沒有完美的技術選擇，只有最適合當前情況的選擇。通過建立完善的審查機制和變更流程，我們能夠在必要時調整技術方向，保持架構的活力和適應性。