# MKing Friend - Development Standards

## 📋 Overview

This document defines the development standards for the MKing Friend project, including package management, code style, commit conventions, etc. All developers must follow these standards.

## 📦 Package Management Standards

### Unified Use of pnpm

**Important**: This project uses `pnpm` as the unified package manager. The use of `npm` or `yarn` is prohibited.

#### Installing pnpm
```bash
# Install pnpm globally
npm install -g pnpm

# Or use corepack (Node.js 16.13+)
corepack enable
corepack prepare pnpm@latest --activate
```

#### Basic Commands
```bash
# Install all dependencies
pnpm install

# Add production dependency
pnpm add <package-name>

# Add development dependency
pnpm add -D <package-name>

# Add global dependency
pnpm add -g <package-name>

# Remove dependency
pnpm remove <package-name>

# Update dependencies
pnpm update

# Update specific dependency
pnpm update <package-name>

# List dependencies
pnpm list

# Clean unused dependencies
pnpm prune

# Clean store
pnpm store prune
```

#### Workspace Management
```bash
# Execute command in specific workspace
pnpm --filter frontend dev
pnpm --filter backend start

# Execute command in all workspaces
pnpm -r dev

# Install workspace dependencies
pnpm --filter frontend add react
```

### Prohibited Operations

❌ **Absolutely Prohibited**:
- Using `npm install`
- Using `yarn add`
- Using `yarn install`
- Committing `package-lock.json`
- Committing `yarn.lock`
- Mixing different package managers

✅ **Correct Approach**:
- Only use `pnpm` commands
- Only commit `pnpm-lock.yaml`
- Follow `.npmrc` configuration

### Dependency Management Best Practices

1. **Exact Version Control**
   ```json
   {
     "dependencies": {
       "react": "18.2.0",  // Exact version
       "antd": "^5.12.8"   // Allow minor version updates
     }
   }
   ```

2. **Regular Dependency Updates**
   ```bash
   # Check outdated dependencies
   pnpm outdated
   
   # Interactive update
   pnpm update -i
   ```

3. **Security Checks**
   ```bash
   # Check security vulnerabilities
   pnpm audit
   
   # Auto fix
   pnpm audit --fix
   ```

## 🎯 Code Style Standards

### TypeScript Standards

1. **Strict Mode**
   ```json
   {
     "compilerOptions": {
       "strict": true,
       "noImplicitAny": true,
       "strictNullChecks": true
     }
   }
   ```

2. **Naming Conventions**
   ```typescript
   // Interfaces use PascalCase
   interface UserProfile {
     id: string;
     name: string;
   }
   
   // Type aliases use PascalCase
   type ApiResponse<T> = {
     data: T;
     message: string;
   };
   
   // Constants use UPPER_SNAKE_CASE
   const API_BASE_URL = 'https://api.example.com';
   
   // Functions and variables use camelCase
   const getUserProfile = async (userId: string) => {
     // ...
   };
   ```

### React Component Standards

1. **Function Components First**
   ```typescript
   // ✅ Recommended
   const UserCard: React.FC<UserCardProps> = ({ user }) => {
     return <div>{user.name}</div>;
   };
   
   // ❌ Avoid
   class UserCard extends React.Component {
     // ...
   }
   ```

2. **Props Interface Definition**
   ```typescript
   interface UserCardProps {
     user: User;
     onEdit?: (user: User) => void;
     className?: string;
   }
   ```

3. **Hooks Usage Standards**
   ```typescript
   // Custom Hooks start with use
   const useUserProfile = (userId: string) => {
     const [profile, setProfile] = useState<UserProfile | null>(null);
     const [loading, setLoading] = useState(false);
     
     // ...
     
     return { profile, loading, refetch };
   };
   ```

### ESLint Configuration

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

### Prettier Configuration

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

## 📝 Commit Standards

### Conventional Commits

Use [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Commit Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation update
- `style`: Code formatting (no functional impact)
- `refactor`: Code refactoring
- `test`: Add or modify tests
- `chore`: Build process or auxiliary tool changes
- `perf`: Performance optimization
- `ci`: CI/CD related changes

#### Recent CI/CD Improvements

- **Codecov Integration**: Updated to use `fail_ci_if_error: false` for improved CI reliability
- **Error Handling**: Enhanced error resilience in coverage reporting pipeline
- **Test Coverage**: Comprehensive TDD validation with 24+ test cases

#### Examples

```bash
# New feature
git commit -m "feat(auth): add user registration form"

# Bug fix
git commit -m "fix(chat): resolve message sending issue"

# Documentation update
git commit -m "docs: update API documentation"

# Refactoring
git commit -m "refactor(components): extract common button component"
```

### Git Workflow

1. **Branch Naming Convention**
   ```bash
   feature/user-authentication
   bugfix/chat-message-display
   hotfix/security-vulnerability
   release/v1.0.0
   ```

2. **Development Process**
   ```bash
   # 1. Create feature branch
   git checkout -b feature/new-feature
   
   # 2. Develop and commit
   git add .
   git commit -m "feat: add new feature"
   
   # 3. Push branch
   git push origin feature/new-feature
   
   # 4. Create Pull Request
   # 5. Code review
   # 6. Merge to main branch
   ```

## 🧪 Testing Standards

### Testing Strategy

1. **Unit Tests**: Each component and function should have corresponding tests
2. **Integration Tests**: Test interactions between components
3. **E2E Tests**: Test complete user flows

### Test Naming Convention

```typescript
// Test file naming: ComponentName.test.tsx
// UserCard.test.tsx

describe('UserCard', () => {
  it('should render user name correctly', () => {
    // Test implementation
  });
  
  it('should call onEdit when edit button is clicked', () => {
    // Test implementation
  });
});
```

### Test Coverage Requirements

- **Minimum Coverage**: 80%
- **Critical Features**: 100% coverage
- **New Features**: Must include tests

## 🔧 Development Tool Configuration

### VS Code Settings

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

### Recommended Extensions

- ES7+ React/Redux/React-Native snippets
- TypeScript Importer
- Prettier - Code formatter
- ESLint
- Auto Rename Tag
- GitLens
- Thunder Client (API testing)

## 📊 Performance Standards

### Performance Metrics

- **First Screen Load Time**: < 3 seconds
- **Interaction Response Time**: < 100ms
- **Lighthouse Score**: > 90
- **Bundle Size**: < 1MB (gzipped)

### Optimization Strategies

1. **Code Splitting**
   ```typescript
   // Route-level lazy loading
   const HomePage = lazy(() => import('../pages/Home'));
   ```

2. **Image Optimization**
   ```typescript
   // Use WebP format
   <img src="image.webp" alt="description" loading="lazy" />
   ```

3. **Dependency Optimization**
   ```bash
   # Analyze bundle size
   pnpm run build
   pnpm dlx vite-bundle-analyzer
   ```

## ⚙️ Configuration Management Standards

### Configuration Separation Principle

**Core Principle**: All configuration items must be separated from code to avoid hard coding.

#### 1. Environment Variable Management

**Frontend Environment Variables** (`.env` file)
```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:8000
VITE_API_TIMEOUT=30000
VITE_API_RETRY_COUNT=3

# WebSocket Configuration
VITE_SOCKET_URL=ws://localhost:8000
VITE_SOCKET_RECONNECT_INTERVAL=5000

# Application Configuration
VITE_APP_NAME="MKing Friend"
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=development

# Map Service Configuration
VITE_MAP_DEFAULT_ZOOM=13
VITE_MAP_DEFAULT_LAT=25.0330
VITE_MAP_DEFAULT_LNG=121.5654
VITE_NOMINATIM_API_URL=https://nominatim.openstreetmap.org

# Multimedia Configuration
VITE_MAX_FILE_SIZE=10485760  # 10MB
VITE_ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp
VITE_ALLOWED_VIDEO_TYPES=video/mp4,video/webm

# Pagination Configuration
VITE_DEFAULT_PAGE_SIZE=20
VITE_MAX_PAGE_SIZE=100

# Cache Configuration
VITE_CACHE_DURATION=300000  # 5 minutes
VITE_LOCAL_STORAGE_PREFIX=mking_
```

**Backend Environment Variables** (`.env` file)
```bash
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=mking_friend
DATABASE_USER=postgres
DATABASE_PASSWORD=password
DATABASE_SSL=false

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT Configuration
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Email Service Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Upload Configuration
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,video/mp4
UPLOAD_STORAGE_PATH=./uploads

# Security Configuration
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

#### 2. Configuration File Structure

**Frontend Configuration Files** (`src/config/`)
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

**Internationalization Configuration** (`src/config/i18n.ts`)
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

// Language resource path configuration
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

**Fixed Category Configuration** (`src/config/categories.ts`)
```typescript
// src/config/categories.ts
export const USER_CATEGORIES = {
  AGE_RANGES: [
    { value: '18-25', label: '18-25 years old', min: 18, max: 25 },
    { value: '26-30', label: '26-30 years old', min: 26, max: 30 },
    { value: '31-35', label: '31-35 years old', min: 31, max: 35 },
    { value: '36-40', label: '36-40 years old', min: 36, max: 40 },
    { value: '41+', label: '41+ years old', min: 41, max: 100 },
  ],
  INTERESTS: [
    { id: 'music', label: 'Music', icon: 'music' },
    { id: 'sports', label: 'Sports', icon: 'activity' },
    { id: 'travel', label: 'Travel', icon: 'map-pin' },
    { id: 'reading', label: 'Reading', icon: 'book' },
    { id: 'cooking', label: 'Cooking', icon: 'chef-hat' },
    { id: 'gaming', label: 'Gaming', icon: 'gamepad-2' },
    { id: 'photography', label: 'Photography', icon: 'camera' },
    { id: 'art', label: 'Art', icon: 'palette' },
  ],
  EDUCATION_LEVELS: [
    { value: 'high_school', label: 'High School' },
    { value: 'college', label: 'College' },
    { value: 'bachelor', label: 'Bachelor' },
    { value: 'master', label: 'Master' },
    { value: 'phd', label: 'PhD' },
  ],
  RELATIONSHIP_GOALS: [
    { value: 'casual', label: 'Casual Dating' },
    { value: 'dating', label: 'Dating' },
    { value: 'serious', label: 'Serious Relationship' },
    { value: 'marriage', label: 'Looking for Marriage' },
  ],
} as const;

export const CHAT_CATEGORIES = {
  MESSAGE_TYPES: [
    { value: 'text', label: 'Text Message' },
    { value: 'image', label: 'Image Message' },
    { value: 'video', label: 'Video Message' },
    { value: 'audio', label: 'Audio Message' },
    { value: 'file', label: 'File Message' },
  ],
  EMOJI_CATEGORIES: [
    { id: 'smileys', label: 'Smileys', icon: '😀' },
    { id: 'people', label: 'People', icon: '👋' },
    { id: 'nature', label: 'Nature', icon: '🌱' },
    { id: 'food', label: 'Food', icon: '🍎' },
    { id: 'activities', label: 'Activities', icon: '⚽' },
    { id: 'travel', label: 'Travel', icon: '🚗' },
    { id: 'objects', label: 'Objects', icon: '💡' },
    { id: 'symbols', label: 'Symbols', icon: '❤️' },
  ],
} as const;
```

#### 3. Route Configuration Management

**Route Configuration File** (`src/config/routes.ts`)
```typescript
// src/config/routes.ts
export const ROUTES = {
  // Public routes
  PUBLIC: {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
    PRIVACY: '/privacy',
    TERMS: '/terms',
  },
  // Protected routes
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
  // API routes
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

// Route helper function
export const buildRoute = (route: string, params: Record<string, string | number>) => {
  return Object.entries(params).reduce(
    (path, [key, value]) => path.replace(`:${key}`, String(value)),
    route
  );
};

// Usage example: buildRoute(ROUTES.PROTECTED.CHAT_ROOM, { roomId: '123' })
```

#### 4. Theme and Style Configuration

**Theme Configuration File** (`src/config/theme.ts`)
```typescript
// src/config/theme.ts
import type { ThemeConfig } from 'antd';

export const THEME_CONFIG: ThemeConfig = {
  token: {
    // Primary colors
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1890ff',
    
    // Fonts
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
    fontSizeHeading1: 38,
    fontSizeHeading2: 30,
    fontSizeHeading3: 24,
    fontSizeHeading4: 20,
    fontSizeHeading5: 16,
    
    // Spacing
    padding: 16,
    margin: 16,
    
    // Border radius
    borderRadius: 6,
    
    // Shadow
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

// Responsive breakpoints
export const BREAKPOINTS = {
  xs: 480,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1600,
} as const;

// Z-index levels
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

#### 5. Future Database Configuration Planning

**Configuration Database Table Structure**
```sql
-- System configuration table
CREATE TABLE system_configs (
  id SERIAL PRIMARY KEY,
  config_key VARCHAR(255) UNIQUE NOT NULL,
  config_value TEXT NOT NULL,
  config_type VARCHAR(50) NOT NULL, -- 'string', 'number', 'boolean', 'json'
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE, -- Whether accessible from frontend
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User configuration table
CREATE TABLE user_configs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  config_key VARCHAR(255) NOT NULL,
  config_value TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, config_key)
);

-- Internationalization configuration table
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

**Configuration Management API Design**
```typescript
// Backend configuration management service
interface ConfigService {
  // System configuration
  getSystemConfig(key: string): Promise<any>;
  setSystemConfig(key: string, value: any, type: string): Promise<void>;
  getPublicConfigs(): Promise<Record<string, any>>;
  
  // User configuration
  getUserConfig(userId: number, key: string): Promise<any>;
  setUserConfig(userId: number, key: string, value: any): Promise<void>;
  getUserConfigs(userId: number): Promise<Record<string, any>>;
  
  // Internationalization configuration
  getTranslations(language: string, namespace?: string): Promise<Record<string, string>>;
  setTranslation(language: string, namespace: string, key: string, value: string): Promise<void>;
}
```

### Configuration Management Best Practices

#### 1. Development Phase Checklist

- [ ] All URLs and port numbers use environment variables
- [ ] All fixed text is extracted to internationalization files
- [ ] All categories and options are defined in configuration files
- [ ] All theme-related values are in theme configuration
- [ ] All API paths are in route configuration
- [ ] No hard-coded magic numbers

#### 2. Configuration Validation

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
    console.log('✅ Environment variable configuration validation passed');
  } catch (error) {
    console.error('❌ Environment variable configuration validation failed:', error);
    throw new Error('Environment variable configuration is incorrect');
  }
};
```

#### 3. Configuration Hot Update Mechanism

```typescript
// Future implementation of configuration hot updates
class ConfigManager {
  private configs: Map<string, any> = new Map();
  private listeners: Map<string, Function[]> = new Map();
  
  async loadFromDatabase() {
    // Load configuration from database
  }
  
  subscribe(key: string, callback: Function) {
    // Subscribe to configuration changes
  }
  
  updateConfig(key: string, value: any) {
    // Update configuration and notify subscribers
  }
}
```

## 📝 Change Tracking and Documentation Update Standards

### Mandatory Change Tracking

**Important**: After completing any task or making related modifications, developers must update the following documentation:

#### Required Documentation Updates

1. **Root README.md** (`/README.md`)
   - For new features, technology stack changes, or project structure adjustments
   - Update related technical descriptions, installation steps, or usage guides
   - Ensure accuracy of documentation links

2. **Changelog** (`/docs/CHANGELOG.md`)
   - **Every modification must be recorded**, no exceptions
   - Follow [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format
   - Include change types: Added, Changed, Deprecated, Removed, Fixed, Security
   - Record specific file changes and feature impacts

#### Change Record Format

```markdown
## [Unreleased] - YYYY-MM-DD

### Added
- 🎯 **Feature Description**: Detailed description of new features or capabilities
- 📁 **File Changes**: List new or modified files

### Changed
- 🔧 **Modification Content**: Explain specific changes and reasons
- 📚 **Documentation Updates**: Record related documentation updates

### Fixed
- 🐛 **Issue Fix**: Describe the problem fixed and solution
```

#### Change Tracking Checklist

Developers must check after completing tasks:

- [ ] Updated `/docs/CHANGELOG.md` recording all changes
- [ ] If project structure or features changed, updated root `README.md`
- [ ] All documentation links are still valid
- [ ] Change records include specific file paths and change descriptions
- [ ] Used appropriate change type labels (Added, Changed, Fixed, etc.)
- [ ] Recorded impact of changes on other modules or features

#### Documentation Maintenance Responsibility

- **Developer Responsibility**: Must update related documentation when committing code
- **Code Review**: Reviewers must check completeness of documentation updates
- **Project Maintenance**: Regularly check accuracy and timeliness of documentation

#### Violation Handling

- Commits without updating CHANGELOG.md will be rejected
- Repeated violations will affect code review approval
- All documentation updates are mandatory requirements and cannot be ignored

### Documentation Version Control

- All documentation changes must go through Git version control
- Important documentation changes require Pull Request review
- Maintain synchronized updates between documentation and code

## 🌐 Bilingual Documentation Maintenance Standards

### Mandatory Bilingual Documentation Requirements

**Important**: All documents in the `/docs/` directory must maintain both Chinese and English versions.

#### File Naming Convention

1. **Chinese Version**: Add `-zh` suffix to filename
   ```
   README-zh.md
   CHANGELOG-zh.md
   setup-zh.md
   ```

2. **English Version**: Use original filename (no suffix)
   ```
   README.md
   CHANGELOG.md
   setup.md
   ```

#### Bilingual Documentation Synchronization Standards

**Both Chinese and English versions must be updated simultaneously for every documentation update**:

1. **Content Synchronization**
   - Chinese and English versions must contain the same information
   - Technical terminology must be consistent
   - Code examples and configurations must be identical

2. **Structure Synchronization**
   - Section title structure must be consistent
   - Internal document links must correspond
   - Directory structure must match

3. **Update Timing**
   - Create bilingual versions immediately when creating new documents
   - Synchronously update both versions when modifying existing documents
   - Version numbers and update dates must be synchronized

#### Bilingual Documentation Checklist

Developers must check after updating documentation:

- [ ] Chinese version (`-zh` suffix) updated
- [ ] English version (no suffix) updated
- [ ] Content information consistent between both versions
- [ ] Technical terminology translation accurate
- [ ] Code examples identical
- [ ] Internal document links correctly correspond
- [ ] Version numbers and update dates synchronized
- [ ] Document structure and section titles consistent

#### Translation Quality Requirements

1. **Technical Terminology**
   - Maintain technical accuracy of English originals
   - Use industry-standard Chinese technical terminology
   - Provide English original text when necessary

2. **Code and Configuration**
   - Keep code examples identical
   - Don't translate configuration file content
   - Comments can be translated but maintain technical accuracy

3. **Document Links**
   - Internal links point to corresponding language versions
   - External links prioritize English official documentation
   - Note language when providing Chinese resources

#### Detailed Documentation Maintenance Guide

**📖 For complete documentation maintenance procedures, please refer to:**
- [Documentation Maintenance Guide](../DOCUMENTATION_MAINTENANCE_GUIDE.md)
- [Documentation Maintenance Guide (Chinese)](../DOCUMENTATION_MAINTENANCE_GUIDE-zh.md)

These guides provide detailed workflows, quality assurance checklists, execution procedures, and automation tools for maintaining bilingual documentation consistency.

#### Violation Handling

- Commits updating only single language version will be rejected
- Inconsistent content between Chinese and English versions will require resubmission
- All bilingual documentation updates are mandatory requirements

#### Documentation Maintenance Responsibility

- **Creator Responsibility**: Must provide both Chinese and English versions when creating documents
- **Modifier Responsibility**: Must synchronously update both versions when modifying documents
- **Reviewer Responsibility**: Must check completeness and consistency of bilingual documentation during code review
- **Maintainer Responsibility**: Regularly check synchronization status of bilingual documentation

## 🔒 Security Standards

### Frontend Security Checklist

- [ ] All user inputs are validated and sanitized
- [ ] Use HTTPS for all communications
- [ ] Sensitive data not stored in localStorage
- [ ] Implement appropriate CSP policies
- [ ] Regularly update dependencies to fix security vulnerabilities
- [ ] Environment variables don't contain sensitive information
- [ ] Configuration file permissions set correctly

### Code Review Checklist

- [ ] Code follows style standards
- [ ] Contains appropriate tests
- [ ] No hard-coded sensitive information
- [ ] Performance impact assessed
- [ ] Documentation updated

## 📚 Learning Resources

### Official Documentation

- [pnpm Official Documentation](https://pnpm.io/)
- [React Official Documentation](https://react.dev/)
- [TypeScript Official Documentation](https://www.typescriptlang.org/)
- [Ant Design Official Documentation](https://ant.design/)

### Best Practices

- [React Best Practices](https://react.dev/learn/thinking-in-react)
- [TypeScript Best Practices](https://typescript-eslint.io/rules/)
- [Git Workflow](https://www.atlassian.com/git/tutorials/comparing-workflows)

---

**Document Version**: v1.0  
**Last Updated**: 2025-01-02  
**Maintainer**: Development Team  
**Status**: ✅ Mandatory Enforcement