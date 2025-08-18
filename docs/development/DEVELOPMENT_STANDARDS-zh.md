# MKing Friend - 開發規範

## 📋 概述

本文檔定義了 MKing Friend 專案的開發規範，包括包管理、代碼風格、提交規範等。所有開發者都必須遵循這些規範。

## 📦 包管理規範

### pnpm 統一使用

**重要**: 本專案統一使用 `pnpm` 作為包管理器，禁止使用 `npm` 或 `yarn`。

#### 安裝 pnpm
```bash
# 全局安裝 pnpm
npm install -g pnpm

# 或使用 corepack (Node.js 16.13+)
corepack enable
corepack prepare pnpm@latest --activate
```

#### 基本命令
```bash
# 安裝所有依賴
pnpm install

# 添加生產依賴
pnpm add <package-name>

# 添加開發依賴
pnpm add -D <package-name>

# 添加全局依賴
pnpm add -g <package-name>

# 移除依賴
pnpm remove <package-name>

# 更新依賴
pnpm update

# 更新特定依賴
pnpm update <package-name>

# 列出依賴
pnpm list

# 清理未使用的依賴
pnpm prune

# 清理 store
pnpm store prune
```

#### 工作區管理
```bash
# 在特定工作區執行命令
pnpm --filter frontend dev
pnpm --filter backend start

# 在所有工作區執行命令
pnpm -r dev

# 安裝工作區依賴
pnpm --filter frontend add react
```

### 禁止的操作

❌ **絕對禁止**:
- 使用 `npm install`
- 使用 `yarn add`
- 使用 `yarn install`
- 提交 `package-lock.json`
- 提交 `yarn.lock`
- 混用不同的包管理器

✅ **正確做法**:
- 只使用 `pnpm` 命令
- 只提交 `pnpm-lock.yaml`
- 遵循 `.npmrc` 配置

### 依賴管理最佳實踐

1. **精確版本控制**
   ```json
   {
     "dependencies": {
       "react": "18.2.0",  // 精確版本
       "antd": "^5.12.8"   // 允許小版本更新
     }
   }
   ```

2. **定期更新依賴**
   ```bash
   # 檢查過時的依賴
   pnpm outdated
   
   # 交互式更新
   pnpm update -i
   ```

3. **安全檢查**
   ```bash
   # 檢查安全漏洞
   pnpm audit
   
   # 自動修復
   pnpm audit --fix
   ```

## 🎯 代碼風格規範

### TypeScript 規範

1. **嚴格模式**
   ```json
   {
     "compilerOptions": {
       "strict": true,
       "noImplicitAny": true,
       "strictNullChecks": true
     }
   }
   ```

2. **命名規範**
   ```typescript
   // 介面使用 PascalCase
   interface UserProfile {
     id: string;
     name: string;
   }
   
   // 類型別名使用 PascalCase
   type ApiResponse<T> = {
     data: T;
     message: string;
   };
   
   // 常數使用 UPPER_SNAKE_CASE
   const API_BASE_URL = 'https://api.example.com';
   
   // 函數和變數使用 camelCase
   const getUserProfile = async (userId: string) => {
     // ...
   };
   ```

### React 組件規範

1. **函數組件優先**
   ```typescript
   // ✅ 推薦
   const UserCard: React.FC<UserCardProps> = ({ user }) => {
     return <div>{user.name}</div>;
   };
   
   // ❌ 避免
   class UserCard extends React.Component {
     // ...
   }
   ```

2. **Props 介面定義**
   ```typescript
   interface UserCardProps {
     user: User;
     onEdit?: (user: User) => void;
     className?: string;
   }
   ```

3. **Hooks 使用規範**
   ```typescript
   // 自定義 Hook 以 use 開頭
   const useUserProfile = (userId: string) => {
     const [profile, setProfile] = useState<UserProfile | null>(null);
     const [loading, setLoading] = useState(false);
     
     // ...
     
     return { profile, loading, refetch };
   };
   ```

### ESLint 配置

```json
{
  "extends": [
    "@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "prettier"
  ],
  "rules": {
    "react/react-in-jsx-scope": "off",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn"
  }
}
```

### Prettier 配置

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

## 📝 提交規範

### Conventional Commits

使用 [Conventional Commits](https://www.conventionalcommits.org/) 規範：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### 提交類型

- `feat`: 新功能
- `fix`: 修復 bug
- `docs`: 文檔更新
- `style`: 代碼格式化（不影響功能）
- `refactor`: 重構代碼
- `test`: 添加或修改測試
- `chore`: 構建過程或輔助工具的變動
- `perf`: 性能優化
- `ci`: CI/CD 相關變更

#### 最新 CI/CD 改進

- **Codecov 整合**: 更新為使用 `fail_ci_if_error: false` 提升 CI 可靠性
- **錯誤處理**: 增強覆蓋率報告流水線的錯誤恢復能力
- **場景覆蓋**: 透過 BDD 進行全面驗證，包含 24+ 個場景案例

#### 範例

```bash
# 新功能
git commit -m "feat(auth): add user registration form"

# 修復 bug
git commit -m "fix(chat): resolve message sending issue"

# 文檔更新
git commit -m "docs: update API documentation"

# 重構
git commit -m "refactor(components): extract common button component"
```

### Git 工作流程

1. **分支命名規範**
   ```bash
   feature/user-authentication
   bugfix/chat-message-display
   hotfix/security-vulnerability
   release/v1.0.0
   ```

2. **開發流程**
   ```bash
   # 1. 創建功能分支
   git checkout -b feature/new-feature
   
   # 2. 開發和提交
   git add .
   git commit -m "feat: add new feature"
   
   # 3. 推送分支
   git push origin feature/new-feature
   
   # 4. 創建 Pull Request
   # 5. 代碼審查
   # 6. 合併到主分支
   ```

## 🧪 測試規範

### 測試策略

1. **單元測試**: 每個組件和函數都應有對應測試
2. **集成測試**: 測試組件間的交互
3. **E2E 測試**: 測試完整的用戶流程

### 測試命名規範

```typescript
// 測試文件命名: ComponentName.test.tsx
// UserCard.test.tsx

describe('UserCard', () => {
  it('should render user name correctly', () => {
    // 測試實現
  });
  
  it('should call onEdit when edit button is clicked', () => {
    // 測試實現
  });
});
```

### 測試覆蓋率要求

- **最低覆蓋率**: 80%
- **關鍵功能**: 100% 覆蓋率
- **新功能**: 必須包含測試

## 🔧 開發工具配置

### VS Code 設置

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
```

### 推薦擴展

- ES7+ React/Redux/React-Native snippets
- TypeScript Importer
- Prettier - Code formatter
- ESLint
- Auto Rename Tag
- GitLens
- Thunder Client (API 測試)

## 📊 性能規範

### 性能指標

- **首屏加載時間**: < 3 秒
- **交互響應時間**: < 100ms
- **Lighthouse 分數**: > 90
- **Bundle 大小**: < 1MB (gzipped)

### 優化策略

1. **代碼分割**
   ```typescript
   // 路由級別懶加載
   const HomePage = lazy(() => import('../pages/Home'));
   ```

2. **圖片優化**
   ```typescript
   // 使用 WebP 格式
   <img src="image.webp" alt="description" loading="lazy" />
   ```

3. **依賴優化**
   ```bash
   # 分析 bundle 大小
   pnpm run build
   pnpm dlx vite-bundle-analyzer
   ```

## ⚙️ 配置管理規範

### 配置文件分離原則

**核心原則**: 所有配置項必須從代碼中分離，避免硬編碼 (Hard Code)

#### 1. 環境變數管理

**前端環境變數** (`.env` 文件)
```bash
# API 配置
VITE_API_BASE_URL=http://localhost:8000
VITE_API_TIMEOUT=30000
VITE_API_RETRY_COUNT=3

# WebSocket 配置
VITE_SOCKET_URL=ws://localhost:8000
VITE_SOCKET_RECONNECT_INTERVAL=5000

# 應用配置
VITE_APP_NAME="MKing Friend"
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=development

# 地圖服務配置
VITE_MAP_DEFAULT_ZOOM=13
VITE_MAP_DEFAULT_LAT=25.0330
VITE_MAP_DEFAULT_LNG=121.5654
VITE_NOMINATIM_API_URL=https://nominatim.openstreetmap.org

# 多媒體配置
VITE_MAX_FILE_SIZE=10485760  # 10MB
VITE_ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp
VITE_ALLOWED_VIDEO_TYPES=video/mp4,video/webm

# 分頁配置
VITE_DEFAULT_PAGE_SIZE=20
VITE_MAX_PAGE_SIZE=100

# 快取配置
VITE_CACHE_DURATION=300000  # 5分鐘
VITE_LOCAL_STORAGE_PREFIX=mking_
```

**後端環境變數** (`.env` 文件)
```bash
# 資料庫配置
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=mking_friend
DATABASE_USER=postgres
DATABASE_PASSWORD=password
DATABASE_SSL=false

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT 配置
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# 郵件服務配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# 檔案上傳配置
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,video/mp4
UPLOAD_STORAGE_PATH=./uploads

# 安全配置
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW=900000  # 15分鐘
RATE_LIMIT_MAX_REQUESTS=100
```

#### 2. 配置文件結構

**前端配置文件** (`src/config/`)
```typescript
// src/config/constants.ts
export const APP_CONFIG = {
  NAME: import.meta.env.VITE_APP_NAME || 'MKing Friend',
  VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  ENVIRONMENT: import.meta.env.VITE_APP_ENVIRONMENT || 'development',
} as const;

export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  TIMEOUT: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
  RETRY_COUNT: Number(import.meta.env.VITE_API_RETRY_COUNT) || 3,
} as const;

export const SOCKET_CONFIG = {
  URL: import.meta.env.VITE_SOCKET_URL || 'ws://localhost:8000',
  RECONNECT_INTERVAL: Number(import.meta.env.VITE_SOCKET_RECONNECT_INTERVAL) || 5000,
} as const;

export const MAP_CONFIG = {
  DEFAULT_ZOOM: Number(import.meta.env.VITE_MAP_DEFAULT_ZOOM) || 13,
  DEFAULT_POSITION: {
    lat: Number(import.meta.env.VITE_MAP_DEFAULT_LAT) || 25.0330,
    lng: Number(import.meta.env.VITE_MAP_DEFAULT_LNG) || 121.5654,
  },
  NOMINATIM_API_URL: import.meta.env.VITE_NOMINATIM_API_URL || 'https://nominatim.openstreetmap.org',
} as const;

export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: Number(import.meta.env.VITE_MAX_FILE_SIZE) || 10485760,
  ALLOWED_IMAGE_TYPES: import.meta.env.VITE_ALLOWED_IMAGE_TYPES?.split(',') || ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_VIDEO_TYPES: import.meta.env.VITE_ALLOWED_VIDEO_TYPES?.split(',') || ['video/mp4', 'video/webm'],
} as const;

export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: Number(import.meta.env.VITE_DEFAULT_PAGE_SIZE) || 20,
  MAX_PAGE_SIZE: Number(import.meta.env.VITE_MAX_PAGE_SIZE) || 100,
} as const;

export const CACHE_CONFIG = {
  DURATION: Number(import.meta.env.VITE_CACHE_DURATION) || 300000,
  LOCAL_STORAGE_PREFIX: import.meta.env.VITE_LOCAL_STORAGE_PREFIX || 'mking_',
} as const;
```

**多國語言配置** (`src/config/i18n.ts`)
```typescript
// src/config/i18n.ts
export const I18N_CONFIG = {
  DEFAULT_LANGUAGE: 'zh-TW',
  SUPPORTED_LANGUAGES: ['zh-TW', 'en-US'],
  FALLBACK_LANGUAGE: 'zh-TW',
  DETECTION_OPTIONS: {
    order: ['localStorage', 'navigator', 'htmlTag'],
    caches: ['localStorage'],
  },
} as const;

// 語言資源路徑配置
export const LANGUAGE_RESOURCES = {
  'zh-TW': {
    common: () => import('../i18n/zh-TW/common.json'),
    auth: () => import('../i18n/zh-TW/auth.json'),
    chat: () => import('../i18n/zh-TW/chat.json'),
    profile: () => import('../i18n/zh-TW/profile.json'),
  },
  'en-US': {
    common: () => import('../i18n/en-US/common.json'),
    auth: () => import('../i18n/en-US/auth.json'),
    chat: () => import('../i18n/en-US/chat.json'),
    profile: () => import('../i18n/en-US/profile.json'),
  },
} as const;
```

**固定分類配置** (`src/config/categories.ts`)
```typescript
// src/config/categories.ts
export const USER_CATEGORIES = {
  AGE_RANGES: [
    { value: '18-25', label: '18-25歲', min: 18, max: 25 },
    { value: '26-30', label: '26-30歲', min: 26, max: 30 },
    { value: '31-35', label: '31-35歲', min: 31, max: 35 },
    { value: '36-40', label: '36-40歲', min: 36, max: 40 },
    { value: '41+', label: '41歲以上', min: 41, max: 100 },
  ],
  INTERESTS: [
    { id: 'music', label: '音樂', icon: 'music' },
    { id: 'sports', label: '運動', icon: 'activity' },
    { id: 'travel', label: '旅行', icon: 'map-pin' },
    { id: 'reading', label: '閱讀', icon: 'book' },
    { id: 'cooking', label: '烹飪', icon: 'chef-hat' },
    { id: 'gaming', label: '遊戲', icon: 'gamepad-2' },
    { id: 'photography', label: '攝影', icon: 'camera' },
    { id: 'art', label: '藝術', icon: 'palette' },
  ],
  EDUCATION_LEVELS: [
    { value: 'high_school', label: '高中' },
    { value: 'college', label: '大學' },
    { value: 'bachelor', label: '學士' },
    { value: 'master', label: '碩士' },
    { value: 'phd', label: '博士' },
  ],
  RELATIONSHIP_GOALS: [
    { value: 'casual', label: '輕鬆交友' },
    { value: 'dating', label: '約會交往' },
    { value: 'serious', label: '認真交往' },
    { value: 'marriage', label: '尋找結婚對象' },
  ],
} as const;

export const CHAT_CATEGORIES = {
  MESSAGE_TYPES: [
    { value: 'text', label: '文字訊息' },
    { value: 'image', label: '圖片訊息' },
    { value: 'video', label: '影片訊息' },
    { value: 'audio', label: '語音訊息' },
    { value: 'file', label: '檔案訊息' },
  ],
  EMOJI_CATEGORIES: [
    { id: 'smileys', label: '表情', icon: '😀' },
    { id: 'people', label: '人物', icon: '👋' },
    { id: 'nature', label: '自然', icon: '🌱' },
    { id: 'food', label: '食物', icon: '🍎' },
    { id: 'activities', label: '活動', icon: '⚽' },
    { id: 'travel', label: '旅行', icon: '🚗' },
    { id: 'objects', label: '物品', icon: '💡' },
    { id: 'symbols', label: '符號', icon: '❤️' },
  ],
} as const;
```

#### 3. 路由配置管理

**路由配置文件** (`src/config/routes.ts`)
```typescript
// src/config/routes.ts
export const ROUTES = {
  // 公開路由
  PUBLIC: {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
    PRIVACY: '/privacy',
    TERMS: '/terms',
  },
  // 需要認證的路由
  PROTECTED: {
    DASHBOARD: '/dashboard',
    PROFILE: '/profile',
    EDIT_PROFILE: '/profile/edit',
    DISCOVER: '/discover',
    MATCHES: '/matches',
    CHAT: '/chat',
    CHAT_ROOM: '/chat/:roomId',
    SETTINGS: '/settings',
    NOTIFICATIONS: '/notifications',
  },
  // API 路由
  API: {
    AUTH: {
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register',
      LOGOUT: '/api/auth/logout',
      REFRESH: '/api/auth/refresh',
      VERIFY_EMAIL: '/api/auth/verify-email',
      FORGOT_PASSWORD: '/api/auth/forgot-password',
      RESET_PASSWORD: '/api/auth/reset-password',
    },
    USER: {
      PROFILE: '/api/user/profile',
      UPDATE_PROFILE: '/api/user/profile',
      UPLOAD_AVATAR: '/api/user/avatar',
      GET_USERS: '/api/user/discover',
      LIKE_USER: '/api/user/like',
      PASS_USER: '/api/user/pass',
    },
    CHAT: {
      ROOMS: '/api/chat/rooms',
      MESSAGES: '/api/chat/messages',
      SEND_MESSAGE: '/api/chat/send',
      UPLOAD_FILE: '/api/chat/upload',
    },
    NOTIFICATION: {
      LIST: '/api/notifications',
      MARK_READ: '/api/notifications/read',
      SETTINGS: '/api/notifications/settings',
    },
  },
} as const;

// 路由輔助函數
export const buildRoute = (route: string, params: Record<string, string | number>) => {
  return Object.entries(params).reduce(
    (path, [key, value]) => path.replace(`:${key}`, String(value)),
    route
  );
};

// 使用範例: buildRoute(ROUTES.PROTECTED.CHAT_ROOM, { roomId: '123' })
```

#### 4. 主題與樣式配置

**主題配置文件** (`src/config/theme.ts`)
```typescript
// src/config/theme.ts
import type { ThemeConfig } from 'antd';

export const THEME_CONFIG: ThemeConfig = {
  token: {
    // 主色彩
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1890ff',
    
    // 字體
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
    fontSizeHeading1: 38,
    fontSizeHeading2: 30,
    fontSizeHeading3: 24,
    fontSizeHeading4: 20,
    fontSizeHeading5: 16,
    
    // 間距
    padding: 16,
    margin: 16,
    
    // 圓角
    borderRadius: 6,
    
    // 陰影
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  },
  components: {
    Button: {
      borderRadius: 8,
      controlHeight: 40,
    },
    Input: {
      borderRadius: 8,
      controlHeight: 40,
    },
    Card: {
      borderRadius: 12,
    },
  },
};

export const DARK_THEME_CONFIG: ThemeConfig = {
  ...THEME_CONFIG,
  algorithm: 'dark',
  token: {
    ...THEME_CONFIG.token,
    colorBgBase: '#141414',
    colorTextBase: '#ffffff',
  },
};

// 響應式斷點
export const BREAKPOINTS = {
  xs: 480,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1600,
} as const;

// Z-index 層級
export const Z_INDEX = {
  DROPDOWN: 1000,
  STICKY: 1020,
  FIXED: 1030,
  MODAL_BACKDROP: 1040,
  MODAL: 1050,
  POPOVER: 1060,
  TOOLTIP: 1070,
  NOTIFICATION: 1080,
} as const;
```

#### 5. 未來資料庫配置規劃

**配置資料庫表結構**
```sql
-- 系統配置表
CREATE TABLE system_configs (
  id SERIAL PRIMARY KEY,
  config_key VARCHAR(255) UNIQUE NOT NULL,
  config_value TEXT NOT NULL,
  config_type VARCHAR(50) NOT NULL, -- 'string', 'number', 'boolean', 'json'
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE, -- 是否可以前端訪問
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用戶配置表
CREATE TABLE user_configs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  config_key VARCHAR(255) NOT NULL,
  config_value TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, config_key)
);

-- 多國語言配置表
CREATE TABLE i18n_configs (
  id SERIAL PRIMARY KEY,
  language_code VARCHAR(10) NOT NULL,
  namespace VARCHAR(100) NOT NULL,
  translation_key VARCHAR(255) NOT NULL,
  translation_value TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(language_code, namespace, translation_key)
);
```

**配置管理 API 設計**
```typescript
// 後端配置管理服務
interface ConfigService {
  // 系統配置
  getSystemConfig(key: string): Promise<any>;
  setSystemConfig(key: string, value: any, type: string): Promise<void>;
  getPublicConfigs(): Promise<Record<string, any>>;
  
  // 用戶配置
  getUserConfig(userId: number, key: string): Promise<any>;
  setUserConfig(userId: number, key: string, value: any): Promise<void>;
  getUserConfigs(userId: number): Promise<Record<string, any>>;
  
  // 多國語言配置
  getTranslations(language: string, namespace?: string): Promise<Record<string, string>>;
  setTranslation(language: string, namespace: string, key: string, value: string): Promise<void>;
}
```

### 配置管理最佳實踐

#### 1. 開發階段檢查清單

- [ ] 所有 URL、端口號都使用環境變數
- [ ] 所有固定文字都提取到多國語言文件
- [ ] 所有分類、選項都定義在配置文件中
- [ ] 所有主題相關數值都在主題配置中
- [ ] 所有 API 路徑都在路由配置中
- [ ] 沒有任何硬編碼的魔術數字

#### 2. 配置驗證

```typescript
// src/utils/configValidator.ts
import { z } from 'zod';

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url(),
  VITE_API_TIMEOUT: z.string().transform(Number).pipe(z.number().positive()),
  VITE_MAX_FILE_SIZE: z.string().transform(Number).pipe(z.number().positive()),
});

export const validateEnvConfig = () => {
  try {
    envSchema.parse(import.meta.env);
    console.log('✅ 環境變數配置驗證通過');
  } catch (error) {
    console.error('❌ 環境變數配置驗證失敗:', error);
    throw new Error('環境變數配置不正確');
  }
};
```

#### 3. 配置熱更新機制

```typescript
// 未來實現配置熱更新
class ConfigManager {
  private configs: Map<string, any> = new Map();
  private listeners: Map<string, Function[]> = new Map();
  
  async loadFromDatabase() {
    // 從資料庫載入配置
  }
  
  subscribe(key: string, callback: Function) {
    // 訂閱配置變更
  }
  
  updateConfig(key: string, value: any) {
    // 更新配置並通知訂閱者
  }
}
```

## 📝 變更追蹤與文檔更新規範

### 強制性變更追蹤

**重要**: 每次任務完成或進行相關修改後，開發者必須更新以下文檔：

#### 必須更新的文檔

1. **根目錄 README.md** (`/README.md`)
   - 如有新功能、技術棧變更或項目結構調整
   - 更新相關的技術說明、安裝步驟或使用指南
   - 確保文檔連結的準確性

2. **變更日誌** (`/docs/CHANGELOG.md`)
   - **每次修改都必須記錄**，無例外
   - 按照 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.0.0/) 格式
   - 包含變更類型：新增、變更、棄用、移除、修復、安全
   - 記錄具體的文件變更和功能影響

#### 變更記錄格式

```markdown
## [未發布] - YYYY-MM-DD

### 新增
- 🎯 **功能描述**: 詳細說明新增的功能或特性
- 📁 **文件變更**: 列出新增或修改的文件

### 變更
- 🔧 **修改內容**: 說明變更的具體內容和原因
- 📚 **文檔更新**: 記錄相關文檔的更新

### 修復
- 🐛 **問題修復**: 描述修復的問題和解決方案
```

#### 變更追蹤檢查清單

開發者在完成任務後必須檢查：

- [ ] 已更新 `/docs/CHANGELOG.md` 記錄所有變更
- [ ] 如有項目結構或功能變更，已更新根目錄 `README.md`
- [ ] 所有文檔連結仍然有效
- [ ] 變更記錄包含具體的文件路徑和變更說明
- [ ] 使用適當的變更類型標籤（新增、變更、修復等）
- [ ] 記錄了變更對其他模組或功能的影響

#### 文檔維護責任

- **開發者責任**: 每次提交代碼時必須同時更新相關文檔
- **代碼審查**: 審查者必須檢查文檔更新的完整性
- **項目維護**: 定期檢查文檔的準確性和時效性

#### 違規處理

- 未更新 CHANGELOG.md 的提交將被拒絕
- 重複違規將影響代碼審查通過
- 所有文檔更新都是強制性要求，不可忽略

### 文檔版本控制

- 所有文檔變更都必須通過 Git 版本控制
- 重要文檔變更需要通過 Pull Request 審查
- 保持文檔與代碼的同步更新

## 🌐 雙語文檔維護規範

### 強制性雙語文檔要求

**重要**: 所有 `/docs/` 目錄下的文檔都必須維護中英文兩個版本。

#### 文件命名規範

1. **中文版本**: 文件名加上 `-zh` 後綴
   ```
   README-zh.md
   CHANGELOG-zh.md
   setup-zh.md
   ```

2. **英文版本**: 使用原始文件名（無後綴）
   ```
   README.md
   CHANGELOG.md
   setup.md
   ```

#### 雙語文檔同步更新規範

**每次文檔更新時必須同時更新中英文版本**：

1. **內容同步**
   - 中英文版本必須包含相同的信息
   - 技術術語保持一致性
   - 代碼示例和配置保持完全相同

2. **結構同步**
   - 章節標題結構必須一致
   - 文檔內部連結必須對應
   - 目錄結構必須匹配

3. **更新時機**
   - 創建新文檔時立即創建雙語版本
   - 修改現有文檔時同步更新兩個版本
   - 版本號和更新日期必須同步

#### 雙語文檔檢查清單

開發者在更新文檔後必須檢查：

- [ ] 中文版本（`-zh` 後綴）已更新
- [ ] 英文版本（無後綴）已更新
- [ ] 兩個版本的內容信息一致
- [ ] 技術術語翻譯準確
- [ ] 代碼示例完全相同
- [ ] 文檔內部連結正確對應
- [ ] 版本號和更新日期同步
- [ ] 文檔結構和章節標題一致

#### 翻譯品質要求

1. **技術術語**
   - 保持英文原文的技術準確性
   - 使用業界標準的中文技術術語
   - 必要時提供英文原文對照

2. **代碼和配置**
   - 代碼示例保持完全相同
   - 配置文件內容不翻譯
   - 註釋可以翻譯但保持技術準確性

3. **文檔連結**
   - 內部連結指向對應語言版本
   - 外部連結優先使用英文官方文檔
   - 提供中文資源時註明語言

#### 詳細文檔維護指南

**📖 如需完整的文檔維護程序，請參考：**
- [文檔維護指南](../DOCUMENTATION_MAINTENANCE_GUIDE.md)
- [文檔維護指南（中文）](../DOCUMENTATION_MAINTENANCE_GUIDE-zh.md)

這些指南提供詳細的工作流程、品質保證檢查清單、執行程序和自動化工具，用於維護雙語文檔的一致性。

#### 違規處理

- 只更新單一語言版本的提交將被拒絕
- 中英文版本內容不一致將要求重新提交
- 所有雙語文檔更新都是強制性要求

#### 文檔維護責任

- **創建者責任**: 創建文檔時必須同時提供中英文版本
- **修改者責任**: 修改文檔時必須同步更新兩個版本
- **審查者責任**: 代碼審查時必須檢查雙語文檔的完整性和一致性
- **維護者責任**: 定期檢查雙語文檔的同步狀態

## 🔒 安全規範

### 前端安全檢查清單

- [ ] 所有用戶輸入都經過驗證和清理
- [ ] 使用 HTTPS 進行所有通信
- [ ] 敏感數據不存儲在 localStorage
- [ ] 實施適當的 CSP 策略
- [ ] 定期更新依賴以修復安全漏洞
- [ ] 環境變數中不包含敏感信息
- [ ] 配置文件權限設置正確

### 代碼審查檢查清單

- [ ] 代碼符合風格規範
- [ ] 包含適當的測試
- [ ] 沒有硬編碼的敏感信息
- [ ] 性能影響已評估
- [ ] 文檔已更新

## 📚 學習資源

### 官方文檔

- [pnpm 官方文檔](https://pnpm.io/)
- [React 官方文檔](https://react.dev/)
- [TypeScript 官方文檔](https://www.typescriptlang.org/)
- [Ant Design 官方文檔](https://ant.design/)

### 最佳實踐

- [React 最佳實踐](https://react.dev/learn/thinking-in-react)
- [TypeScript 最佳實踐](https://typescript-eslint.io/rules/)
- [Git 工作流程](https://www.atlassian.com/git/tutorials/comparing-workflows)

---

**文檔版本**: v1.0  
**最後更新**: 2025-01-02  
**維護者**: 開發團隊  
**狀態**: ✅ 強制執行