# 配置管理實施指南

## 📋 概述

本文檔提供 MKing Friend 項目配置管理的具體實施步驟，確保開發團隊能夠正確實施配置分離策略。

## 🚀 實施步驟

### 階段一：環境變數設置

#### 1.1 前端環境變數設置

**步驟 1**: 創建前端環境變數文件

```bash
# 在 frontend/ 目錄下創建環境變數文件
touch frontend/.env
touch frontend/.env.development
touch frontend/.env.staging
touch frontend/.env.production
touch frontend/.env.local.example
```

**步驟 2**: 配置 `.env.development`

```bash
# 開發環境配置
VITE_APP_NAME="MKing Friend (Dev)"
VITE_APP_VERSION=1.0.0-dev
VITE_APP_ENVIRONMENT=development
VITE_APP_DEBUG=true

# API 配置
VITE_API_BASE_URL=http://localhost:8000
VITE_API_TIMEOUT=30000
VITE_API_RETRY_COUNT=3
VITE_API_VERSION=v1

# WebSocket 配置
VITE_SOCKET_URL=ws://localhost:8000
VITE_SOCKET_RECONNECT_INTERVAL=5000
VITE_SOCKET_MAX_RECONNECT_ATTEMPTS=5

# 地圖配置
VITE_MAP_DEFAULT_ZOOM=13
VITE_MAP_DEFAULT_LAT=25.0330
VITE_MAP_DEFAULT_LNG=121.5654
VITE_MAP_MIN_ZOOM=3
VITE_MAP_MAX_ZOOM=18
VITE_NOMINATIM_API_URL=https://nominatim.openstreetmap.org
VITE_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png

# 檔案上傳配置
VITE_MAX_FILE_SIZE=10485760
VITE_MAX_IMAGE_SIZE=5242880
VITE_MAX_VIDEO_SIZE=52428800
VITE_ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp,image/gif
VITE_ALLOWED_VIDEO_TYPES=video/mp4,video/webm,video/ogg
VITE_ALLOWED_AUDIO_TYPES=audio/mp3,audio/wav,audio/ogg

# 分頁與快取配置
VITE_DEFAULT_PAGE_SIZE=20
VITE_MAX_PAGE_SIZE=100
VITE_CACHE_DURATION=300000
VITE_LOCAL_STORAGE_PREFIX=mking_dev_
VITE_SESSION_STORAGE_PREFIX=mking_dev_session_

# 通知配置
VITE_NOTIFICATION_DURATION=5000
VITE_MAX_NOTIFICATIONS=5

# 安全配置
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_ERROR_REPORTING=true
```

**步驟 3**: 配置 `.env.production`

```bash
# 生產環境配置
VITE_APP_NAME="MKing Friend"
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=production
VITE_APP_DEBUG=false

# API 配置 (使用生產環境 URL)
VITE_API_BASE_URL=https://api.mkingfriend.com
VITE_API_TIMEOUT=30000
VITE_API_RETRY_COUNT=3
VITE_API_VERSION=v1

# WebSocket 配置
VITE_SOCKET_URL=wss://api.mkingfriend.com
VITE_SOCKET_RECONNECT_INTERVAL=5000
VITE_SOCKET_MAX_RECONNECT_ATTEMPTS=5

# 地圖配置
VITE_MAP_DEFAULT_ZOOM=13
VITE_MAP_DEFAULT_LAT=25.0330
VITE_MAP_DEFAULT_LNG=121.5654
VITE_MAP_MIN_ZOOM=3
VITE_MAP_MAX_ZOOM=18
VITE_NOMINATIM_API_URL=https://nominatim.openstreetmap.org
VITE_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png

# 檔案上傳配置
VITE_MAX_FILE_SIZE=10485760
VITE_MAX_IMAGE_SIZE=5242880
VITE_MAX_VIDEO_SIZE=52428800
VITE_ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp,image/gif
VITE_ALLOWED_VIDEO_TYPES=video/mp4,video/webm,video/ogg
VITE_ALLOWED_AUDIO_TYPES=audio/mp3,audio/wav,audio/ogg

# 分頁與快取配置
VITE_DEFAULT_PAGE_SIZE=20
VITE_MAX_PAGE_SIZE=100
VITE_CACHE_DURATION=300000
VITE_LOCAL_STORAGE_PREFIX=mking_
VITE_SESSION_STORAGE_PREFIX=mking_session_

# 通知配置
VITE_NOTIFICATION_DURATION=5000
VITE_MAX_NOTIFICATIONS=5

# 安全配置
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true
```

#### 1.2 後端環境變數設置

**步驟 1**: 創建後端環境變數文件

```bash
# 在 backend/ 目錄下創建環境變數文件
touch backend/.env
touch backend/.env.development
touch backend/.env.staging
touch backend/.env.production
touch backend/.env.local.example
```

**步驟 2**: 配置 `.env.development`

```bash
# 開發環境配置
NODE_ENV=development
PORT=8000
APP_NAME="MKing Friend API (Dev)"
APP_VERSION=1.0.0-dev

# 資料庫配置
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=mking_friend_dev
DATABASE_USER=postgres
DATABASE_PASSWORD=dev_password
DATABASE_SSL=false
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
DATABASE_TIMEOUT=30000

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TTL=3600

# JWT 配置
JWT_SECRET=dev-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
JWT_ISSUER=mking-friend-dev

# 郵件服務配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=dev@example.com
SMTP_PASS=dev_app_password
SMTP_FROM_NAME="MKing Friend Dev"
SMTP_FROM_EMAIL=noreply-dev@mkingfriend.com

# 檔案上傳配置
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,video/mp4
UPLOAD_STORAGE_PATH=./uploads
UPLOAD_TEMP_PATH=./temp
UPLOAD_PUBLIC_URL=http://localhost:8000/uploads

# 安全配置
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100
BCRYPT_ROUNDS=12

# 日誌配置
LOG_LEVEL=debug
LOG_FILE_PATH=./logs
LOG_MAX_SIZE=10m
LOG_MAX_FILES=5

# 監控配置
SENTRY_DSN=
SENTRY_ENVIRONMENT=development
```

### 階段二：配置文件結構建立

#### 2.1 創建配置目錄結構

```bash
# 創建前端配置目錄
mkdir -p frontend/src/config
mkdir -p frontend/src/i18n/zh-TW
mkdir -p frontend/src/i18n/en-US

# 創建後端配置目錄
mkdir -p backend/src/config
mkdir -p backend/src/i18n
```

#### 2.2 實施前端配置文件

**步驟 1**: 創建配置入口文件

```bash
# 創建 frontend/src/config/index.ts
cat > frontend/src/config/index.ts << 'EOF'
// 統一導出所有配置
export * from './constants';
export * from './api';
export * from './i18n';
export * from './categories';
export * from './routes';
export * from './theme';
export * from './upload';
export * from './map';
export * from './validation';

// 配置驗證
import { validateConfig } from './validator';

// 在應用啟動時驗證配置
validateConfig();
EOF
```

**步驟 2**: 創建常數配置文件

```bash
# 創建 frontend/src/config/constants.ts
cat > frontend/src/config/constants.ts << 'EOF'
// 應用基本配置
export const APP_CONFIG = {
  NAME: import.meta.env.VITE_APP_NAME || 'MKing Friend',
  VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  ENVIRONMENT: import.meta.env.VITE_APP_ENVIRONMENT || 'development',
  DEBUG: import.meta.env.VITE_APP_DEBUG === 'true',
} as const;

// 分頁配置
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: Number(import.meta.env.VITE_DEFAULT_PAGE_SIZE) || 20,
  MAX_PAGE_SIZE: Number(import.meta.env.VITE_MAX_PAGE_SIZE) || 100,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;

// 快取配置
export const CACHE_CONFIG = {
  DURATION: Number(import.meta.env.VITE_CACHE_DURATION) || 300000,
  LOCAL_STORAGE_PREFIX: import.meta.env.VITE_LOCAL_STORAGE_PREFIX || 'mking_',
  SESSION_STORAGE_PREFIX: import.meta.env.VITE_SESSION_STORAGE_PREFIX || 'mking_session_',
} as const;

// 通知配置
export const NOTIFICATION_CONFIG = {
  DURATION: Number(import.meta.env.VITE_NOTIFICATION_DURATION) || 5000,
  MAX_COUNT: Number(import.meta.env.VITE_MAX_NOTIFICATIONS) || 5,
  POSITION: 'topRight' as const,
} as const;
EOF
```

**步驟 3**: 創建 API 配置文件

```bash
# 創建 frontend/src/config/api.ts
cat > frontend/src/config/api.ts << 'EOF'
// API 基本配置
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  VERSION: import.meta.env.VITE_API_VERSION || 'v1',
  TIMEOUT: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
  RETRY_COUNT: Number(import.meta.env.VITE_API_RETRY_COUNT) || 3,
  RETRY_DELAY: 1000,
} as const;

// WebSocket 配置
export const SOCKET_CONFIG = {
  URL: import.meta.env.VITE_SOCKET_URL || 'ws://localhost:8000',
  RECONNECT_INTERVAL: Number(import.meta.env.VITE_SOCKET_RECONNECT_INTERVAL) || 5000,
  MAX_RECONNECT_ATTEMPTS: Number(import.meta.env.VITE_SOCKET_MAX_RECONNECT_ATTEMPTS) || 5,
  HEARTBEAT_INTERVAL: 30000,
} as const;

// API 端點配置
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    VERIFY_EMAIL: '/auth/verify-email',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  USER: {
    PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/profile',
    UPLOAD_AVATAR: '/user/avatar',
    DISCOVER: '/user/discover',
    LIKE: '/user/like',
    PASS: '/user/pass',
    BLOCK: '/user/block',
  },
  CHAT: {
    ROOMS: '/chat/rooms',
    MESSAGES: '/chat/messages',
    SEND: '/chat/send',
    UPLOAD: '/chat/upload',
    TYPING: '/chat/typing',
  },
} as const;
EOF
```

### 階段三：多國語言配置實施

#### 3.1 創建語言配置文件

```bash
# 創建 frontend/src/config/i18n.ts
cat > frontend/src/config/i18n.ts << 'EOF'
// 多國語言配置
export const I18N_CONFIG = {
  DEFAULT_LANGUAGE: 'zh-TW',
  SUPPORTED_LANGUAGES: ['zh-TW', 'en-US'],
  FALLBACK_LANGUAGE: 'zh-TW',
  
  DETECTION_OPTIONS: {
    order: ['localStorage', 'navigator', 'htmlTag'],
    caches: ['localStorage'],
    lookupLocalStorage: 'i18nextLng',
  },
  
  INTERPOLATION: {
    escapeValue: false,
  },
  
  LOAD_PATH: '/locales/{{lng}}/{{ns}}.json',
  
  NAMESPACES: {
    COMMON: 'common',
    AUTH: 'auth',
    CHAT: 'chat',
    PROFILE: 'profile',
    SETTINGS: 'settings',
    ERRORS: 'errors',
  },
  
  DEFAULT_NAMESPACE: 'common',
} as const;

// 語言選項
export const LANGUAGE_OPTIONS = [
  { value: 'zh-TW', label: '繁體中文', flag: '🇹🇼' },
  { value: 'en-US', label: 'English', flag: '🇺🇸' },
] as const;
EOF
```

#### 3.2 創建語言資源文件

**步驟 1**: 創建繁體中文語言文件

```bash
# 創建 frontend/src/i18n/zh-TW/common.json
cat > frontend/src/i18n/zh-TW/common.json << 'EOF'
{
  "app": {
    "name": "MKing Friend",
    "slogan": "遇見更好的自己，遇見對的人"
  },
  "navigation": {
    "discover": "探索",
    "matches": "配對",
    "chat": "聊天",
    "profile": "個人",
    "settings": "設定"
  },
  "actions": {
    "save": "儲存",
    "cancel": "取消",
    "delete": "刪除",
    "edit": "編輯",
    "submit": "提交",
    "confirm": "確認",
    "back": "返回",
    "next": "下一步",
    "previous": "上一步",
    "close": "關閉",
    "open": "開啟",
    "search": "搜尋",
    "filter": "篩選",
    "sort": "排序",
    "refresh": "重新整理",
    "loading": "載入中...",
    "retry": "重試"
  },
  "status": {
    "success": "成功",
    "error": "錯誤",
    "warning": "警告",
    "info": "資訊",
    "pending": "處理中",
    "completed": "已完成",
    "failed": "失敗"
  }
}
EOF
```

```bash
# 創建 frontend/src/i18n/zh-TW/auth.json
cat > frontend/src/i18n/zh-TW/auth.json << 'EOF'
{
  "login": {
    "title": "登入",
    "email": "電子郵件",
    "password": "密碼",
    "remember": "記住我",
    "forgot_password": "忘記密碼？",
    "no_account": "還沒有帳號？",
    "sign_up": "註冊",
    "submit": "登入"
  },
  "register": {
    "title": "註冊",
    "name": "姓名",
    "email": "電子郵件",
    "password": "密碼",
    "confirm_password": "確認密碼",
    "agree_terms": "我同意服務條款和隱私政策",
    "have_account": "已有帳號？",
    "sign_in": "登入",
    "submit": "註冊"
  },
  "validation": {
    "email_required": "請輸入電子郵件",
    "email_invalid": "請輸入有效的電子郵件",
    "password_required": "請輸入密碼",
    "password_min_length": "密碼至少需要 8 個字元",
    "password_mismatch": "密碼不一致",
    "name_required": "請輸入姓名",
    "terms_required": "請同意服務條款"
  }
}
EOF
```

**步驟 2**: 創建英文語言文件

```bash
# 創建 frontend/src/i18n/en-US/common.json
cat > frontend/src/i18n/en-US/common.json << 'EOF'
{
  "app": {
    "name": "MKing Friend",
    "slogan": "Meet a better you, meet the right person"
  },
  "navigation": {
    "discover": "Discover",
    "matches": "Matches",
    "chat": "Chat",
    "profile": "Profile",
    "settings": "Settings"
  },
  "actions": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "submit": "Submit",
    "confirm": "Confirm",
    "back": "Back",
    "next": "Next",
    "previous": "Previous",
    "close": "Close",
    "open": "Open",
    "search": "Search",
    "filter": "Filter",
    "sort": "Sort",
    "refresh": "Refresh",
    "loading": "Loading...",
    "retry": "Retry"
  },
  "status": {
    "success": "Success",
    "error": "Error",
    "warning": "Warning",
    "info": "Info",
    "pending": "Pending",
    "completed": "Completed",
    "failed": "Failed"
  }
}
EOF
```

### 階段四：配置驗證實施

#### 4.1 安裝必要依賴

```bash
# 安裝 Zod 用於配置驗證
cd frontend
pnpm add zod

# 安裝 dotenv 用於環境變數管理
cd ../backend
npm install dotenv
npm install --save-dev @types/node
```

#### 4.2 創建配置驗證器

```bash
# 創建 frontend/src/config/validator.ts
cat > frontend/src/config/validator.ts << 'EOF'
import { z } from 'zod';

// 環境變數驗證 Schema
const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url('API Base URL 必須是有效的 URL'),
  VITE_API_TIMEOUT: z.string().transform(Number).pipe(
    z.number().positive('API Timeout 必須是正數')
  ),
  VITE_SOCKET_URL: z.string().refine(
    (url) => url.startsWith('ws://') || url.startsWith('wss://'),
    'WebSocket URL 必須以 ws:// 或 wss:// 開頭'
  ),
  VITE_MAP_DEFAULT_LAT: z.string().transform(Number).pipe(
    z.number().min(-90).max(90, '緯度必須在 -90 到 90 之間')
  ),
  VITE_MAP_DEFAULT_LNG: z.string().transform(Number).pipe(
    z.number().min(-180).max(180, '經度必須在 -180 到 180 之間')
  ),
  VITE_APP_NAME: z.string().optional(),
  VITE_APP_VERSION: z.string().optional(),
  VITE_APP_ENVIRONMENT: z.enum(['development', 'staging', 'production']).optional(),
});

// 配置驗證函數
export const validateConfig = (): void => {
  try {
    envSchema.parse(import.meta.env);
    console.log('✅ 環境變數配置驗證通過');
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ 環境變數配置驗證失敗:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    }
    throw new Error('環境變數配置不正確，請檢查 .env 文件');
  }
};
EOF
```

### 階段五：Git 配置管理

#### 5.1 更新 .gitignore

```bash
# 更新根目錄 .gitignore
cat >> .gitignore << 'EOF'

# 環境變數文件
.env
.env.local
.env.*.local

# 前端環境變數
frontend/.env
frontend/.env.local
frontend/.env.*.local

# 後端環境變數
backend/.env
backend/.env.local
backend/.env.*.local

# 配置快取
config-cache/
*.config.cache

# 上傳文件
uploads/
temp/

# 日誌文件
logs/
*.log

# 資料庫文件
*.db
*.sqlite
*.sqlite3
EOF
```

#### 5.2 創建環境變數範例文件

```bash
# 創建前端環境變數範例
cp frontend/.env.development frontend/.env.local.example
sed -i '' 's/=.*/=YOUR_VALUE_HERE/g' frontend/.env.local.example

# 創建後端環境變數範例
cp backend/.env.development backend/.env.local.example
sed -i '' 's/=.*/=YOUR_VALUE_HERE/g' backend/.env.local.example
```

## ✅ 實施檢查清單

### 環境變數檢查

- [ ] **前端環境變數**
  - [ ] 創建了 `.env.development`
  - [ ] 創建了 `.env.staging`
  - [ ] 創建了 `.env.production`
  - [ ] 創建了 `.env.local.example`
  - [ ] 所有 URL 和端口使用環境變數
  - [ ] 敏感信息不在前端環境變數中

- [ ] **後端環境變數**
  - [ ] 創建了 `.env.development`
  - [ ] 創建了 `.env.staging`
  - [ ] 創建了 `.env.production`
  - [ ] 創建了 `.env.local.example`
  - [ ] 資料庫配置使用環境變數
  - [ ] JWT 密鑰使用環境變數
  - [ ] 第三方服務密鑰使用環境變數

### 配置文件檢查

- [ ] **前端配置文件**
  - [ ] 創建了 `src/config/` 目錄
  - [ ] 實施了 `constants.ts`
  - [ ] 實施了 `api.ts`
  - [ ] 實施了 `i18n.ts`
  - [ ] 實施了 `categories.ts`
  - [ ] 實施了 `routes.ts`
  - [ ] 實施了 `theme.ts`
  - [ ] 實施了 `upload.ts`
  - [ ] 實施了 `map.ts`
  - [ ] 實施了 `validator.ts`

- [ ] **多國語言文件**
  - [ ] 創建了 `src/i18n/` 目錄結構
  - [ ] 實施了繁體中文語言文件
  - [ ] 實施了英文語言文件
  - [ ] 所有固定文字都提取到語言文件

### 代碼品質檢查

- [ ] **類型安全**
  - [ ] 所有配置都有 TypeScript 類型定義
  - [ ] 使用 `as const` 確保類型推斷
  - [ ] 配置驗證使用 Zod

- [ ] **代碼清潔**
  - [ ] 移除所有硬編碼的 URL
  - [ ] 移除所有硬編碼的端口號
  - [ ] 移除所有硬編碼的文字
  - [ ] 移除所有魔術數字

### Git 管理檢查

- [ ] **版本控制**
  - [ ] 更新了 `.gitignore`
  - [ ] 環境變數文件不被追蹤
  - [ ] 創建了環境變數範例文件
  - [ ] 敏感信息不在版本控制中

## 🔧 常見問題解決

### 問題 1: 環境變數未載入

**症狀**: 配置值顯示為 `undefined`

**解決方案**:
1. 檢查環境變數名稱是否以 `VITE_` 開頭（前端）
2. 確認 `.env` 文件位於正確位置
3. 重啟開發服務器
4. 檢查環境變數語法（無空格、無引號）

### 問題 2: 配置驗證失敗

**症狀**: 應用啟動時出現配置驗證錯誤

**解決方案**:
1. 檢查 `.env` 文件中的值格式
2. 確認必要的環境變數都已設置
3. 檢查 URL 格式是否正確
4. 確認數值類型的環境變數格式

### 問題 3: 多國語言文件未載入

**症狀**: 頁面顯示語言鍵值而非翻譯文字

**解決方案**:
1. 檢查語言文件路徑是否正確
2. 確認 JSON 格式是否有效
3. 檢查 i18n 配置是否正確
4. 確認語言文件已正確導入

### 問題 4: 生產環境配置錯誤

**症狀**: 生產環境中功能異常

**解決方案**:
1. 檢查生產環境的 `.env.production` 文件
2. 確認所有 URL 指向正確的生產服務
3. 檢查 API 端點是否可訪問
4. 確認安全配置是否正確

## 📊 配置監控設置

### 開發環境監控

```bash
# 創建配置監控腳本
cat > scripts/check-config.js << 'EOF'
const fs = require('fs');
const path = require('path');

// 檢查環境變數文件
function checkEnvFiles() {
  const requiredFiles = [
    'frontend/.env.development',
    'frontend/.env.production',
    'backend/.env.development',
    'backend/.env.production'
  ];
  
  requiredFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      console.error(`❌ 缺少環境變數文件: ${file}`);
    } else {
      console.log(`✅ 環境變數文件存在: ${file}`);
    }
  });
}

// 檢查配置文件
function checkConfigFiles() {
  const requiredFiles = [
    'frontend/src/config/index.ts',
    'frontend/src/config/constants.ts',
    'frontend/src/config/api.ts',
    'frontend/src/config/validator.ts'
  ];
  
  requiredFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      console.error(`❌ 缺少配置文件: ${file}`);
    } else {
      console.log(`✅ 配置文件存在: ${file}`);
    }
  });
}

checkEnvFiles();
checkConfigFiles();
EOF

# 添加到 package.json scripts
echo '"check-config": "node scripts/check-config.js",' >> package.json
```

## 🚀 部署配置

### Docker 環境變數配置

```dockerfile
# 前端 Dockerfile
FROM node:18-alpine

# 設置工作目錄
WORKDIR /app

# 複製 package 文件
COPY package*.json ./
RUN npm install

# 複製源代碼
COPY . .

# 設置環境變數
ENV NODE_ENV=production
ENV VITE_API_BASE_URL=${API_BASE_URL}
ENV VITE_SOCKET_URL=${SOCKET_URL}

# 構建應用
RUN npm run build

# 暴露端口
EXPOSE 3000

# 啟動應用
CMD ["npm", "start"]
```

### CI/CD 環境變數配置

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: |
        cd frontend && npm install
        cd ../backend && npm install
        
    - name: Build frontend
      env:
        VITE_API_BASE_URL: ${{ secrets.API_BASE_URL }}
        VITE_SOCKET_URL: ${{ secrets.SOCKET_URL }}
        VITE_APP_ENVIRONMENT: production
      run: cd frontend && npm run build
      
    - name: Deploy
      env:
        DATABASE_URL: ${{ secrets.DATABASE_URL }}
        JWT_SECRET: ${{ secrets.JWT_SECRET }}
        SMTP_PASSWORD: ${{ secrets.SMTP_PASSWORD }}
      run: |
        # 部署腳本
        ./scripts/deploy.sh
```

## 📝 總結

完成以上實施步驟後，你的項目將具備：

1. **完整的環境變數管理**: 支援多環境配置
2. **模組化的配置文件**: 易於維護和擴展
3. **類型安全的配置**: TypeScript 類型檢查
4. **多國語言支援**: 完整的 i18n 配置
5. **配置驗證機制**: 防止配置錯誤
6. **安全的敏感信息管理**: 環境變數隔離
7. **自動化的配置檢查**: CI/CD 整合

遵循這個實施指南可以確保你的配置管理達到企業級標準，為項目的長期維護和擴展奠定堅實基礎。