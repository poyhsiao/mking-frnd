# MKing Friend - 技術棧規格

## 📋 概述

本文檔定義了 MKing Friend 線上交友平台的確定技術棧和開發規範。所有開發工作都必須遵循此規格。

## 🎯 已確定的技術選型

### 前端框架
- **主框架**: React 18+ with TypeScript
- **UI 組件庫**: **Ant Design** (企業級UI組件，完全免費)
- **狀態管理**: Zustand (輕量級狀態管理)
- **路由**: React Router v6
- **構建工具**: **Vite** (快速開發體驗)

### 圖示與視覺資源
- **圖示庫**: 
  - **React Icons** - 整合多個圖示庫 (Feather, Heroicons, etc.)
  - **Lucide React** - 美觀的開源圖示庫
  - **Tabler Icons** - 超過4000個免費SVG圖示

### 免費商用插圖來源
- **unDraw** - 可自定義顏色的插圖
- **Storyset** - Freepik的免費插圖集
- **Pixabay/Unsplash** - 高品質免費照片

### 包管理器
- **統一使用**: **pnpm**
- **禁止使用**: npm, yarn
- **原因**: 更快的安裝速度、更少的磁碟空間佔用、更嚴格的依賴管理

## 🛠️ 開發工具與規範

### 代碼品質
- **ESLint**: TypeScript 代碼檢查
- **Prettier**: 代碼格式化
- **Husky**: Git hooks 管理
- **lint-staged**: 提交前檢查

### 測試策略
- **單元測試**: Jest + React Testing Library
- **E2E測試**: Cypress
- **測試覆蓋率**: 最低 80%

### 國際化
- **react-i18next**: React 國際化庫
- **支援語言**: 繁體中文 (zh-TW), 英文 (en-US)
- **語言檢測**: 瀏覽器語言自動檢測

### 多媒體處理
- **圖片上傳**: react-dropzone
- **圖片裁切**: react-image-crop
- **影片播放**: Video.js
- **音頻處理**: WaveSurfer.js

### 即時通訊
- **WebSocket**: Socket.io-client
- **WebRTC**: Simple-peer (語音視頻通話)

### PWA 功能
- **Service Worker**: Workbox
- **離線存儲**: IndexedDB (Dexie.js)

### 動畫與互動
- **動畫庫**: Framer Motion
- **交集觀察**: react-intersection-observer

### 日期處理
- **主要**: date-fns
- **輔助**: dayjs

### 地圖與地理位置服務
- **地圖庫**: Leaflet (輕量級、開源地圖庫)
- **地圖數據**: OpenStreetMap (免費、開源地圖數據)
- **React 整合**: React-Leaflet
- **地理編碼**: Nominatim API (OpenStreetMap 官方地理編碼服務)
- **位置服務**: HTML5 Geolocation API
- **地圖圖層**: 
  - 基礎圖層: OpenStreetMap 標準圖層
  - 衛星圖層: Esri World Imagery (免費額度)
- **地圖插件**: 
  - leaflet-control-geocoder (搜尋地址)
  - leaflet-routing-machine (路線規劃)
  - leaflet-markercluster (標記聚合)

**注意**: 避免使用中國大陸地區的地圖服務 (如高德地圖、百度地圖等)

## 📦 依賴管理規範

### pnpm 使用規範
```bash
# 安裝依賴
pnpm install

# 添加生產依賴
pnpm add <package-name>

# 添加開發依賴
pnpm add -D <package-name>

# 移除依賴
pnpm remove <package-name>

# 更新依賴
pnpm update

# 清理 node_modules
pnpm store prune
```

### 禁止的操作
- ❌ 使用 `npm install`
- ❌ 使用 `yarn add`
- ❌ 混用不同的包管理器
- ❌ 提交 `package-lock.json` 或 `yarn.lock`
- ✅ 只提交 `pnpm-lock.yaml`

## 🎨 UI/UX 設計規範

### Ant Design 使用規範
- **主題定制**: 使用 Ant Design 的主題定制功能
- **組件優先**: 優先使用 Ant Design 組件
- **自定義組件**: 基於 Ant Design 組件進行擴展
- **響應式**: 使用 Ant Design 的響應式斷點

### 圖示使用規範
- **優先順序**: Lucide React > Tabler Icons > React Icons
- **一致性**: 同一功能區域使用同一圖示庫
- **大小**: 遵循 Ant Design 的圖示大小規範
- **顏色**: 使用主題色彩系統

### 插圖使用規範
- **風格一致**: 選擇風格一致的插圖
- **色彩搭配**: 與品牌色彩保持一致
- **授權確認**: 確保所有插圖都可商業使用
- **優化**: 使用 SVG 格式，確保可縮放性

## 🔧 開發環境配置

### 必要工具
- Node.js 18+
- pnpm (最新版本)
- VS Code (推薦)
- Git

### VS Code 擴展推薦
- ES7+ React/Redux/React-Native snippets
- TypeScript Importer
- Prettier - Code formatter
- ESLint
- Auto Rename Tag
- Bracket Pair Colorizer
- GitLens

### 配置管理

**配置管理工具**
- **Zod**: 環境變數驗證和類型安全
- **dotenv**: 環境變數載入
- **cross-env**: 跨平台環境變數設置

**環境變數分類**
```bash
# API 服務配置
VITE_API_BASE_URL=http://localhost:8000
VITE_API_TIMEOUT=30000
VITE_API_RETRY_COUNT=3

# WebSocket 配置
VITE_SOCKET_URL=ws://localhost:8000
VITE_SOCKET_RECONNECT_INTERVAL=5000

# 應用基本配置
VITE_APP_NAME="MKing Friend"
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=development

# 地圖服務配置
VITE_MAP_DEFAULT_ZOOM=13
VITE_MAP_DEFAULT_LAT=25.0330
VITE_MAP_DEFAULT_LNG=121.5654
VITE_NOMINATIM_API_URL=https://nominatim.openstreetmap.org

# 多媒體配置
VITE_MAX_FILE_SIZE=10485760
VITE_ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp
VITE_ALLOWED_VIDEO_TYPES=video/mp4,video/webm

# 分頁與快取配置
VITE_DEFAULT_PAGE_SIZE=20
VITE_MAX_PAGE_SIZE=100
VITE_CACHE_DURATION=300000
VITE_LOCAL_STORAGE_PREFIX=mking_
```

**配置文件結構**
```
src/config/
├── constants.ts      # 應用常數配置
├── i18n.ts          # 多國語言配置
├── categories.ts    # 固定分類配置
├── routes.ts        # 路由配置
├── theme.ts         # 主題配置
└── validator.ts     # 配置驗證
```

## 📁 專案結構規範

```
frontend/
├── public/
│   ├── icons/          # 應用圖示
│   └── images/         # 靜態圖片
├── src/
│   ├── components/     # 可重用組件
│   │   ├── common/     # 通用組件
│   │   ├── layout/     # 佈局組件
│   │   └── auth/       # 認證相關組件
│   ├── pages/          # 頁面組件
│   ├── hooks/          # 自定義 Hooks
│   ├── services/       # API 服務
│   ├── stores/         # Zustand 狀態管理
│   ├── utils/          # 工具函數
│   ├── types/          # TypeScript 類型定義
│   ├── config/         # 配置文件 (NEW)
│   │   ├── constants.ts    # 應用常數
│   │   ├── i18n.ts         # 多國語言配置
│   │   ├── categories.ts   # 固定分類
│   │   ├── routes.ts       # 路由配置
│   │   ├── theme.ts        # 主題配置
│   │   └── validator.ts    # 配置驗證
│   ├── constants/      # 常數定義 (DEPRECATED)
│   ├── i18n/           # 國際化資源文件
│   │   ├── zh-TW/      # 繁體中文
│   │   └── en-US/      # 英文
│   └── styles/         # 全局樣式
├── tests/              # 測試文件
└── docs/               # 組件文檔
```

## 🚀 部署規範

### 構建優化
- **Tree shaking**: 自動移除未使用代碼
- **代碼分割**: 路由級別的懶加載
- **資源壓縮**: Gzip/Brotli 壓縮
- **圖片優化**: WebP 格式優先

### 性能指標
- **首屏加載時間**: < 3 秒
- **交互響應時間**: < 100ms
- **Lighthouse 分數**: > 90

## 📊 監控與分析

### 錯誤監控
- **Sentry**: 前端錯誤追蹤
- **Console 清理**: 生產環境移除所有 console.log

### 性能監控
- **Web Vitals**: 核心網頁指標監控
- **Bundle 分析**: 定期分析打包大小

## 🔒 安全規範

### 前端安全
- **XSS 防護**: 使用 DOMPurify 清理用戶輸入
- **CSP**: 內容安全策略配置
- **HTTPS**: 強制使用 HTTPS

### 隱私保護
- **數據最小化**: 只收集必要數據
- **本地加密**: 敏感數據本地加密存儲
- **GDPR 合規**: Cookie 同意機制

## 📝 文檔規範

### 代碼註釋
- **組件**: 使用 JSDoc 格式
- **函數**: 描述參數和返回值
- **複雜邏輯**: 添加行內註釋

### README 更新
- **功能變更**: 及時更新 README
- **依賴變更**: 更新安裝說明
- **API 變更**: 更新使用範例

---

**文檔版本**: v1.0  
**最後更新**: 2025-01-02  
**維護者**: 開發團隊  
**狀態**: ✅ 已確定並生效