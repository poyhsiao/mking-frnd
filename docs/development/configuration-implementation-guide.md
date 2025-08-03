# Configuration Management Implementation Guide

## 📋 Overview

This document provides specific implementation steps for configuration management in the MKing Friend project, ensuring the development team can correctly implement configuration separation strategies.

## 🚀 Implementation Steps

### Phase 1: Environment Variable Setup

#### 1.1 Frontend Environment Variable Setup

**Step 1**: Create frontend environment variable files

```bash
# Create environment variable files in frontend/ directory
touch frontend/.env
touch frontend/.env.development
touch frontend/.env.staging
touch frontend/.env.production
touch frontend/.env.local.example
```

**Step 2**: Configure `.env.development`

```bash
# Development environment configuration
VITE_APP_NAME="MKing Friend (Dev)"
VITE_APP_VERSION=1.0.0-dev
VITE_APP_ENVIRONMENT=development
VITE_APP_DEBUG=true

# API configuration
VITE_API_BASE_URL=http://localhost:8000
VITE_API_TIMEOUT=30000
VITE_API_RETRY_COUNT=3
VITE_API_VERSION=v1

# WebSocket configuration
VITE_SOCKET_URL=ws://localhost:8000
VITE_SOCKET_RECONNECT_INTERVAL=5000
VITE_SOCKET_MAX_RECONNECT_ATTEMPTS=5

# Map configuration
VITE_MAP_DEFAULT_ZOOM=13
VITE_MAP_DEFAULT_LAT=25.0330
VITE_MAP_DEFAULT_LNG=121.5654
VITE_MAP_MIN_ZOOM=3
VITE_MAP_MAX_ZOOM=18
VITE_NOMINATIM_API_URL=https://nominatim.openstreetmap.org
VITE_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png

# File upload configuration
VITE_MAX_FILE_SIZE=10485760
VITE_MAX_IMAGE_SIZE=5242880
VITE_MAX_VIDEO_SIZE=52428800
VITE_ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp,image/gif
VITE_ALLOWED_VIDEO_TYPES=video/mp4,video/webm,video/ogg
VITE_ALLOWED_AUDIO_TYPES=audio/mp3,audio/wav,audio/ogg

# Pagination and cache configuration
VITE_DEFAULT_PAGE_SIZE=20
VITE_MAX_PAGE_SIZE=100
VITE_CACHE_DURATION=300000
VITE_LOCAL_STORAGE_PREFIX=mking_dev_
VITE_SESSION_STORAGE_PREFIX=mking_dev_session_

# Notification configuration
VITE_NOTIFICATION_DURATION=5000
VITE_MAX_NOTIFICATIONS=5

# Security configuration
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_ERROR_REPORTING=true
```

**Step 3**: Configure `.env.production`

```bash
# Production environment configuration
VITE_APP_NAME="MKing Friend"
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=production
VITE_APP_DEBUG=false

# API configuration (use production URLs)
VITE_API_BASE_URL=https://api.mkingfriend.com
VITE_API_TIMEOUT=30000
VITE_API_RETRY_COUNT=3
VITE_API_VERSION=v1

# WebSocket configuration
VITE_SOCKET_URL=wss://api.mkingfriend.com
VITE_SOCKET_RECONNECT_INTERVAL=5000
VITE_SOCKET_MAX_RECONNECT_ATTEMPTS=5

# Map configuration
VITE_MAP_DEFAULT_ZOOM=13
VITE_MAP_DEFAULT_LAT=25.0330
VITE_MAP_DEFAULT_LNG=121.5654
VITE_MAP_MIN_ZOOM=3
VITE_MAP_MAX_ZOOM=18
VITE_NOMINATIM_API_URL=https://nominatim.openstreetmap.org
VITE_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png

# File upload configuration
VITE_MAX_FILE_SIZE=10485760
VITE_MAX_IMAGE_SIZE=5242880
VITE_MAX_VIDEO_SIZE=52428800
VITE_ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp,image/gif
VITE_ALLOWED_VIDEO_TYPES=video/mp4,video/webm,video/ogg
VITE_ALLOWED_AUDIO_TYPES=audio/mp3,audio/wav,audio/ogg

# Pagination and cache configuration
VITE_DEFAULT_PAGE_SIZE=20
VITE_MAX_PAGE_SIZE=100
VITE_CACHE_DURATION=300000
VITE_LOCAL_STORAGE_PREFIX=mking_
VITE_SESSION_STORAGE_PREFIX=mking_session_

# Notification configuration
VITE_NOTIFICATION_DURATION=5000
VITE_MAX_NOTIFICATIONS=5

# Security configuration
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true
```

#### 1.2 Backend Environment Variable Setup

**Step 1**: Create backend environment variable files

```bash
# Create environment variable files in backend/ directory
touch backend/.env
touch backend/.env.development
touch backend/.env.staging
touch backend/.env.production
touch backend/.env.local.example
```

**Step 2**: Configure `.env.development`

```bash
# Development environment configuration
NODE_ENV=development
PORT=8000
APP_NAME="MKing Friend API (Dev)"
APP_VERSION=1.0.0-dev

# Database configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=mking_friend_dev
DATABASE_USER=postgres
DATABASE_PASSWORD=dev_password
DATABASE_SSL=false
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
DATABASE_TIMEOUT=30000

# Redis configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TTL=3600

# JWT configuration
JWT_SECRET=dev-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
JWT_ISSUER=mking-friend-dev

# Email service configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=dev@example.com
SMTP_PASS=dev_app_password
SMTP_FROM_NAME="MKing Friend Dev"
SMTP_FROM_EMAIL=noreply-dev@mkingfriend.com

# File upload configuration
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,video/mp4
UPLOAD_STORAGE_PATH=./uploads
UPLOAD_TEMP_PATH=./temp
UPLOAD_PUBLIC_URL=http://localhost:8000/uploads

# Security configuration
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100
BCRYPT_ROUNDS=12

# Logging configuration
LOG_LEVEL=debug
LOG_FILE_PATH=./logs
LOG_MAX_SIZE=10m
LOG_MAX_FILES=5

# Monitoring configuration
SENTRY_DSN=
SENTRY_ENVIRONMENT=development
```

### Phase 2: Configuration File Structure Setup

#### 2.1 Create Configuration Directory Structure

```bash
# Create frontend configuration directories
mkdir -p frontend/src/config
mkdir -p frontend/src/i18n/zh-TW
mkdir -p frontend/src/i18n/en-US

# Create backend configuration directories
mkdir -p backend/src/config
mkdir -p backend/src/i18n
```

#### 2.2 Implement Frontend Configuration Files

**Step 1**: Create configuration entry file

```bash
# Create frontend/src/config/index.ts
cat > frontend/src/config/index.ts << 'EOF'
// Unified export of all configurations
export * from './constants';
export * from './api';
export * from './i18n';
export * from './categories';
export * from './routes';
export * from './theme';
export * from './upload';
export * from './map';
export * from './validation';

// Configuration validation
import { validateConfig } from './validator';

// Validate configuration on application startup
validateConfig();
EOF
```

**Step 2**: Create constants configuration file

```bash
# Create frontend/src/config/constants.ts
cat > frontend/src/config/constants.ts << 'EOF'
// Application basic configuration
export const APP_CONFIG = {
  NAME: import.meta.env.VITE_APP_NAME || 'MKing Friend',
  VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  ENVIRONMENT: import.meta.env.VITE_APP_ENVIRONMENT || 'development',
  DEBUG: import.meta.env.VITE_APP_DEBUG === 'true',
} as const;

// Pagination configuration
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: Number(import.meta.env.VITE_DEFAULT_PAGE_SIZE) || 20,
  MAX_PAGE_SIZE: Number(import.meta.env.VITE_MAX_PAGE_SIZE) || 100,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;

// Cache configuration
export const CACHE_CONFIG = {
  DURATION: Number(import.meta.env.VITE_CACHE_DURATION) || 300000,
  LOCAL_STORAGE_PREFIX: import.meta.env.VITE_LOCAL_STORAGE_PREFIX || 'mking_',
  SESSION_STORAGE_PREFIX: import.meta.env.VITE_SESSION_STORAGE_PREFIX || 'mking_session_',
} as const;

// Notification configuration
export const NOTIFICATION_CONFIG = {
  DURATION: Number(import.meta.env.VITE_NOTIFICATION_DURATION) || 5000,
  MAX_COUNT: Number(import.meta.env.VITE_MAX_NOTIFICATIONS) || 5,
  POSITION: 'topRight' as const,
} as const;
EOF
```

**Step 3**: Create API configuration file

```bash
# Create frontend/src/config/api.ts
cat > frontend/src/config/api.ts << 'EOF'
// API basic configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  VERSION: import.meta.env.VITE_API_VERSION || 'v1',
  TIMEOUT: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
  RETRY_COUNT: Number(import.meta.env.VITE_API_RETRY_COUNT) || 3,
  RETRY_DELAY: 1000,
} as const;

// WebSocket configuration
export const SOCKET_CONFIG = {
  URL: import.meta.env.VITE_SOCKET_URL || 'ws://localhost:8000',
  RECONNECT_INTERVAL: Number(import.meta.env.VITE_SOCKET_RECONNECT_INTERVAL) || 5000,
  MAX_RECONNECT_ATTEMPTS: Number(import.meta.env.VITE_SOCKET_MAX_RECONNECT_ATTEMPTS) || 5,
  HEARTBEAT_INTERVAL: 30000,
} as const;

// API endpoint configuration
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

### Phase 3: Internationalization Configuration Implementation

#### 3.1 Create Language Configuration File

```bash
# Create frontend/src/config/i18n.ts
cat > frontend/src/config/i18n.ts << 'EOF'
// Internationalization configuration
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

// Language options
export const LANGUAGE_OPTIONS = [
  { value: 'zh-TW', label: '繁體中文', flag: '🇹🇼' },
  { value: 'en-US', label: 'English', flag: '🇺🇸' },
] as const;
EOF
```

#### 3.2 Create Language Resource Files

**Step 1**: Create Traditional Chinese language files

```bash
# Create frontend/src/i18n/zh-TW/common.json
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
# Create frontend/src/i18n/zh-TW/auth.json
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

**Step 2**: Create English language files

```bash
# Create frontend/src/i18n/en-US/common.json
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

### Phase 4: Configuration Validation Implementation

#### 4.1 Install Required Dependencies

```bash
# Install Zod for configuration validation
cd frontend
pnpm add zod

# Install dotenv for environment variable management
cd ../backend
npm install dotenv
npm install --save-dev @types/node
```

#### 4.2 Create Configuration Validator

```bash
# Create frontend/src/config/validator.ts
cat > frontend/src/config/validator.ts << 'EOF'
import { z } from 'zod';

// Environment variable validation schema
const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url('API Base URL must be a valid URL'),
  VITE_API_TIMEOUT: z.string().transform(Number).pipe(
    z.number().positive('API Timeout must be a positive number')
  ),
  VITE_SOCKET_URL: z.string().refine(
    (url) => url.startsWith('ws://') || url.startsWith('wss://'),
    'WebSocket URL must start with ws:// or wss://'
  ),
  VITE_MAP_DEFAULT_LAT: z.string().transform(Number).pipe(
    z.number().min(-90).max(90, 'Latitude must be between -90 and 90')
  ),
  VITE_MAP_DEFAULT_LNG: z.string().transform(Number).pipe(
    z.number().min(-180).max(180, 'Longitude must be between -180 and 180')
  ),
  VITE_APP_NAME: z.string().optional(),
  VITE_APP_VERSION: z.string().optional(),
  VITE_APP_ENVIRONMENT: z.enum(['development', 'staging', 'production']).optional(),
});

// Configuration validation function
export const validateConfig = (): void => {
  try {
    envSchema.parse(import.meta.env);
    console.log('✅ Environment variable configuration validation passed');
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment variable configuration validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    }
    throw new Error('Environment variable configuration is incorrect, please check .env file');
  }
};
EOF
```

### Phase 5: Git Configuration Management

#### 5.1 Update .gitignore

```bash
# Update root .gitignore
cat >> .gitignore << 'EOF'

# Environment variable files
.env
.env.local
.env.*.local

# Frontend environment variables
frontend/.env
frontend/.env.local
frontend/.env.*.local

# Backend environment variables
backend/.env
backend/.env.local
backend/.env.*.local

# Configuration cache
config-cache/
*.config.cache

# Upload files
uploads/
temp/

# Log files
logs/
*.log

# Database files
*.db
*.sqlite
*.sqlite3
EOF
```

#### 5.2 Create Environment Variable Example Files

```bash
# Create frontend environment variable example
cp frontend/.env.development frontend/.env.local.example
sed -i '' 's/=.*/=YOUR_VALUE_HERE/g' frontend/.env.local.example

# Create backend environment variable example
cp backend/.env.development backend/.env.local.example
sed -i '' 's/=.*/=YOUR_VALUE_HERE/g' backend/.env.local.example
```

## ✅ Implementation Checklist

### Environment Variable Checklist

- [ ] **Frontend Environment Variables**
  - [ ] Created `.env.development`
  - [ ] Created `.env.staging`
  - [ ] Created `.env.production`
  - [ ] Created `.env.local.example`
  - [ ] All URLs and ports use environment variables
  - [ ] No sensitive information in frontend environment variables

- [ ] **Backend Environment Variables**
  - [ ] Created `.env.development`
  - [ ] Created `.env.staging`
  - [ ] Created `.env.production`
  - [ ] Created `.env.local.example`
  - [ ] Database configuration uses environment variables
  - [ ] JWT secret uses environment variables
  - [ ] Third-party service keys use environment variables

### Configuration File Checklist

- [ ] **Frontend Configuration Files**
  - [ ] Created `src/config/` directory
  - [ ] Implemented `constants.ts`
  - [ ] Implemented `api.ts`
  - [ ] Implemented `i18n.ts`
  - [ ] Implemented `categories.ts`
  - [ ] Implemented `routes.ts`
  - [ ] Implemented `theme.ts`
  - [ ] Implemented `upload.ts`
  - [ ] Implemented `map.ts`
  - [ ] Implemented `validator.ts`

- [ ] **Internationalization Files**
  - [ ] Created `src/i18n/` directory structure
  - [ ] Implemented Traditional Chinese language files
  - [ ] Implemented English language files
  - [ ] All static text extracted to language files

### Code Quality Checklist

- [ ] **Type Safety**
  - [ ] All configurations have TypeScript type definitions
  - [ ] Use `as const` to ensure type inference
  - [ ] Configuration validation uses Zod

- [ ] **Code Cleanliness**
  - [ ] Removed all hardcoded URLs
  - [ ] Removed all hardcoded port numbers
  - [ ] Removed all hardcoded text
  - [ ] Removed all magic numbers

### Git Management Checklist

- [ ] **Version Control**
  - [ ] Updated `.gitignore`
  - [ ] Environment variable files not tracked
  - [ ] Created environment variable example files
  - [ ] Sensitive information not in version control

## 🔧 Common Issue Resolution

### Issue 1: Environment Variables Not Loading

**Symptoms**: Configuration values showing as `undefined`

**Solutions**:
1. Check if environment variable names start with `VITE_` (frontend)
2. Confirm `.env` file is in correct location
3. Restart development server
4. Check environment variable syntax (no spaces, no quotes)

### Issue 2: Configuration Validation Failure

**Symptoms**: Configuration validation errors on application startup

**Solutions**:
1. Check value format in `.env` file
2. Confirm all required environment variables are set
3. Check URL format correctness
4. Confirm numeric environment variable format

### Issue 3: Internationalization Files Not Loading

**Symptoms**: Page displays language keys instead of translated text

**Solutions**:
1. Check language file paths are correct
2. Confirm JSON format is valid
3. Check i18n configuration is correct
4. Confirm language files are properly imported

### Issue 4: Production Environment Configuration Errors

**Symptoms**: Functionality abnormal in production environment

**Solutions**:
1. Check production environment `.env.production` file
2. Confirm all URLs point to correct production services
3. Check API endpoints are accessible
4. Confirm security configuration is correct

## 📊 Configuration Monitoring Setup

### Development Environment Monitoring

```bash
# Create configuration monitoring script
cat > scripts/check-config.js << 'EOF'
const fs = require('fs');
const path = require('path');

// Check environment variable files
function checkEnvFiles() {
  const requiredFiles = [
    'frontend/.env.development',
    'frontend/.env.production',
    'backend/.env.development',
    'backend/.env.production'
  ];
  
  requiredFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      console.error(`❌ Missing environment variable file: ${file}`);
    } else {
      console.log(`✅ Environment variable file exists: ${file}`);
    }
  });
}

// Check configuration files
function checkConfigFiles() {
  const requiredFiles = [
    'frontend/src/config/index.ts',
    'frontend/src/config/constants.ts',
    'frontend/src/config/api.ts',
    'frontend/src/config/validator.ts'
  ];
  
  requiredFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      console.error(`❌ Missing configuration file: ${file}`);
    } else {
      console.log(`✅ Configuration file exists: ${file}`);
    }
  });
}

checkEnvFiles();
checkConfigFiles();
EOF

# Add to package.json scripts
echo '"check-config": "node scripts/check-config.js",' >> package.json
```

## 🚀 Deployment Configuration

### Docker Environment Variable Configuration

```dockerfile
# Frontend Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV VITE_API_BASE_URL=${API_BASE_URL}
ENV VITE_SOCKET_URL=${SOCKET_URL}

# Build application
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

### CI/CD Environment Variable Configuration

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
        # Deployment script
        ./scripts/deploy.sh
```

## 📝 Summary

After completing the above implementation steps, your project will have:

1. **Complete environment variable management**: Support for multi-environment configuration
2. **Modular configuration files**: Easy to maintain and extend
3. **Type-safe configuration**: TypeScript type checking
4. **Internationalization support**: Complete i18n configuration
5. **Configuration validation mechanism**: Prevent configuration errors
6. **Secure sensitive information management**: Environment variable isolation
7. **Automated configuration checking**: CI/CD integration

Following this implementation guide ensures your configuration management meets enterprise-level standards, laying a solid foundation for long-term project maintenance and expansion.