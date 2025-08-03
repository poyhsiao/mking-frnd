# Configuration Management Guide

## 📋 Overview

This document defines the configuration management strategy for the MKing Friend project, ensuring all configuration items are separated from code to improve system maintainability and scalability.

## 🎯 Core Principles

### 1. Configuration Separation Principle
- **Zero Hard Coding**: All configuration items must be separated from code
- **Environment Isolation**: Different environments use different configuration files
- **Type Safety**: Use TypeScript to ensure configuration type safety
- **Validation Mechanism**: All configuration items must be validated

### 2. Configuration Hierarchy
```
Environment Variables (.env) → Configuration Files (config/) → Default Values (fallback)
```

## ⚙️ Environment Variable Management

### Frontend Environment Variables

**File Location**: `frontend/.env`

```bash
# ===========================================
# API Service Configuration
# ===========================================
VITE_API_BASE_URL=http://localhost:8000
VITE_API_TIMEOUT=30000
VITE_API_RETRY_COUNT=3
VITE_API_VERSION=v1

# ===========================================
# WebSocket Configuration
# ===========================================
VITE_SOCKET_URL=ws://localhost:8000
VITE_SOCKET_RECONNECT_INTERVAL=5000
VITE_SOCKET_MAX_RECONNECT_ATTEMPTS=5

# ===========================================
# Application Basic Configuration
# ===========================================
VITE_APP_NAME="MKing Friend"
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=development
VITE_APP_DEBUG=true

# ===========================================
# Map Service Configuration
# ===========================================
VITE_MAP_DEFAULT_ZOOM=13
VITE_MAP_DEFAULT_LAT=25.0330
VITE_MAP_DEFAULT_LNG=121.5654
VITE_MAP_MIN_ZOOM=3
VITE_MAP_MAX_ZOOM=18
VITE_NOMINATIM_API_URL=https://nominatim.openstreetmap.org
VITE_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png

# ===========================================
# Media Configuration
# ===========================================
VITE_MAX_FILE_SIZE=10485760  # 10MB
VITE_MAX_IMAGE_SIZE=5242880  # 5MB
VITE_MAX_VIDEO_SIZE=52428800 # 50MB
VITE_ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp,image/gif
VITE_ALLOWED_VIDEO_TYPES=video/mp4,video/webm,video/ogg
VITE_ALLOWED_AUDIO_TYPES=audio/mp3,audio/wav,audio/ogg

# ===========================================
# Pagination and Cache Configuration
# ===========================================
VITE_DEFAULT_PAGE_SIZE=20
VITE_MAX_PAGE_SIZE=100
VITE_CACHE_DURATION=300000  # 5 minutes
VITE_LOCAL_STORAGE_PREFIX=mking_
VITE_SESSION_STORAGE_PREFIX=mking_session_

# ===========================================
# Notification Configuration
# ===========================================
VITE_NOTIFICATION_DURATION=5000
VITE_MAX_NOTIFICATIONS=5

# ===========================================
# Security Configuration
# ===========================================
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_ERROR_REPORTING=true
```

### Backend Environment Variables

**File Location**: `backend/.env`

```bash
# ===========================================
# Application Configuration
# ===========================================
NODE_ENV=development
PORT=8000
APP_NAME="MKing Friend API"
APP_VERSION=1.0.0

# ===========================================
# Database Configuration
# ===========================================
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=mking_friend
DATABASE_USER=postgres
DATABASE_PASSWORD=password
DATABASE_SSL=false
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
DATABASE_TIMEOUT=30000

# ===========================================
# Redis Configuration
# ===========================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TTL=3600

# ===========================================
# JWT Configuration
# ===========================================
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
JWT_ISSUER=mking-friend

# ===========================================
# Email Service Configuration
# ===========================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_NAME="MKing Friend"
SMTP_FROM_EMAIL=noreply@mkingfriend.com

# ===========================================
# File Upload Configuration
# ===========================================
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,video/mp4
UPLOAD_STORAGE_PATH=./uploads
UPLOAD_TEMP_PATH=./temp
UPLOAD_PUBLIC_URL=http://localhost:8000/uploads

# ===========================================
# Security Configuration
# ===========================================
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
BCRYPT_ROUNDS=12

# ===========================================
# Logging Configuration
# ===========================================
LOG_LEVEL=debug
LOG_FILE_PATH=./logs
LOG_MAX_SIZE=10m
LOG_MAX_FILES=5

# ===========================================
# Monitoring Configuration
# ===========================================
SENTRY_DSN=
SENTRY_ENVIRONMENT=development
```

## 📁 Configuration File Structure

### Frontend Configuration File Organization

```
src/config/
├── index.ts          # Configuration entry file
├── constants.ts      # Application constants configuration
├── api.ts           # API related configuration
├── i18n.ts          # Internationalization configuration
├── categories.ts    # Fixed category configuration
├── routes.ts        # Route configuration
├── theme.ts         # Theme configuration
├── upload.ts        # Upload configuration
├── map.ts           # Map configuration
├── validation.ts    # Validation rules
└── validator.ts     # Configuration validator
```

### 1. Configuration Entry File

**File**: `src/config/index.ts`

```typescript
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
```

### 2. Application Constants Configuration

**File**: `src/config/constants.ts`

```typescript
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
  DURATION: Number(import.meta.env.VITE_CACHE_DURATION) || 300000, // 5 minutes
  LOCAL_STORAGE_PREFIX: import.meta.env.VITE_LOCAL_STORAGE_PREFIX || 'mking_',
  SESSION_STORAGE_PREFIX: import.meta.env.VITE_SESSION_STORAGE_PREFIX || 'mking_session_',
} as const;

// Notification configuration
export const NOTIFICATION_CONFIG = {
  DURATION: Number(import.meta.env.VITE_NOTIFICATION_DURATION) || 5000,
  MAX_COUNT: Number(import.meta.env.VITE_MAX_NOTIFICATIONS) || 5,
  POSITION: 'topRight' as const,
} as const;

// Security configuration
export const SECURITY_CONFIG = {
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  ENABLE_ERROR_REPORTING: import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true',
} as const;
```

### 3. API Configuration

**File**: `src/config/api.ts`

```typescript
// API basic configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  VERSION: import.meta.env.VITE_API_VERSION || 'v1',
  TIMEOUT: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
  RETRY_COUNT: Number(import.meta.env.VITE_API_RETRY_COUNT) || 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

// WebSocket configuration
export const SOCKET_CONFIG = {
  URL: import.meta.env.VITE_SOCKET_URL || 'ws://localhost:8000',
  RECONNECT_INTERVAL: Number(import.meta.env.VITE_SOCKET_RECONNECT_INTERVAL) || 5000,
  MAX_RECONNECT_ATTEMPTS: Number(import.meta.env.VITE_SOCKET_MAX_RECONNECT_ATTEMPTS) || 5,
  HEARTBEAT_INTERVAL: 30000, // 30 seconds
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
    REPORT: '/user/report',
  },
  CHAT: {
    ROOMS: '/chat/rooms',
    MESSAGES: '/chat/messages',
    SEND: '/chat/send',
    UPLOAD: '/chat/upload',
    TYPING: '/chat/typing',
  },
  NOTIFICATION: {
    LIST: '/notifications',
    MARK_READ: '/notifications/read',
    SETTINGS: '/notifications/settings',
  },
} as const;
```

### 4. Upload Configuration

**File**: `src/config/upload.ts`

```typescript
// File upload configuration
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: Number(import.meta.env.VITE_MAX_FILE_SIZE) || 10485760, // 10MB
  MAX_IMAGE_SIZE: Number(import.meta.env.VITE_MAX_IMAGE_SIZE) || 5242880, // 5MB
  MAX_VIDEO_SIZE: Number(import.meta.env.VITE_MAX_VIDEO_SIZE) || 52428800, // 50MB
  
  ALLOWED_IMAGE_TYPES: import.meta.env.VITE_ALLOWED_IMAGE_TYPES?.split(',') || [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ],
  
  ALLOWED_VIDEO_TYPES: import.meta.env.VITE_ALLOWED_VIDEO_TYPES?.split(',') || [
    'video/mp4',
    'video/webm',
    'video/ogg'
  ],
  
  ALLOWED_AUDIO_TYPES: import.meta.env.VITE_ALLOWED_AUDIO_TYPES?.split(',') || [
    'audio/mp3',
    'audio/wav',
    'audio/ogg'
  ],
  
  // Image compression configuration
  IMAGE_QUALITY: 0.8,
  IMAGE_MAX_WIDTH: 1920,
  IMAGE_MAX_HEIGHT: 1080,
  
  // Avatar configuration
  AVATAR_SIZE: 200,
  AVATAR_QUALITY: 0.9,
} as const;

// File type validation functions
export const isValidImageType = (type: string): boolean => {
  return UPLOAD_CONFIG.ALLOWED_IMAGE_TYPES.includes(type);
};

export const isValidVideoType = (type: string): boolean => {
  return UPLOAD_CONFIG.ALLOWED_VIDEO_TYPES.includes(type);
};

export const isValidAudioType = (type: string): boolean => {
  return UPLOAD_CONFIG.ALLOWED_AUDIO_TYPES.includes(type);
};

// File size validation function
export const isValidFileSize = (size: number, type: string): boolean => {
  if (isValidImageType(type)) {
    return size <= UPLOAD_CONFIG.MAX_IMAGE_SIZE;
  }
  if (isValidVideoType(type)) {
    return size <= UPLOAD_CONFIG.MAX_VIDEO_SIZE;
  }
  return size <= UPLOAD_CONFIG.MAX_FILE_SIZE;
};
```

### 5. Map Configuration

**File**: `src/config/map.ts`

```typescript
// Map service configuration
export const MAP_CONFIG = {
  DEFAULT_ZOOM: Number(import.meta.env.VITE_MAP_DEFAULT_ZOOM) || 13,
  MIN_ZOOM: Number(import.meta.env.VITE_MAP_MIN_ZOOM) || 3,
  MAX_ZOOM: Number(import.meta.env.VITE_MAP_MAX_ZOOM) || 18,
  
  DEFAULT_POSITION: {
    lat: Number(import.meta.env.VITE_MAP_DEFAULT_LAT) || 25.0330,
    lng: Number(import.meta.env.VITE_MAP_DEFAULT_LNG) || 121.5654,
  },
  
  // Map tile layer configuration
  TILE_LAYER: {
    URL: import.meta.env.VITE_MAP_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    ATTRIBUTION: '© OpenStreetMap contributors',
    MAX_ZOOM: 19,
  },
  
  // Geocoding service
  NOMINATIM: {
    API_URL: import.meta.env.VITE_NOMINATIM_API_URL || 'https://nominatim.openstreetmap.org',
    SEARCH_LIMIT: 5,
    LANGUAGE: 'zh-TW',
  },
  
  // Map controls
  CONTROLS: {
    ZOOM: true,
    ATTRIBUTION: true,
    SCALE: true,
    FULLSCREEN: true,
  },
  
  // Marker configuration
  MARKER: {
    DEFAULT_ICON_SIZE: [25, 41],
    CLUSTER_MAX_ZOOM: 15,
    CLUSTER_RADIUS: 80,
  },
} as const;

// Map style themes
export const MAP_THEMES = {
  DEFAULT: {
    name: 'Default',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  },
  DARK: {
    name: 'Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  },
  LIGHT: {
    name: 'Light',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  },
} as const;
```

### 6. Configuration Validator

**File**: `src/config/validator.ts`

```typescript
import { z } from 'zod';

// Environment variable validation schema
const envSchema = z.object({
  // API configuration validation
  VITE_API_BASE_URL: z.string().url('API Base URL must be a valid URL'),
  VITE_API_TIMEOUT: z.string().transform(Number).pipe(
    z.number().positive('API Timeout must be a positive number')
  ),
  VITE_API_RETRY_COUNT: z.string().transform(Number).pipe(
    z.number().min(0).max(10, 'API retry count cannot exceed 10')
  ),
  
  // WebSocket configuration validation
  VITE_SOCKET_URL: z.string().refine(
    (url) => url.startsWith('ws://') || url.startsWith('wss://'),
    'WebSocket URL must start with ws:// or wss://'
  ),
  
  // File size validation
  VITE_MAX_FILE_SIZE: z.string().transform(Number).pipe(
    z.number().positive('File size limit must be a positive number')
  ),
  
  // Map configuration validation
  VITE_MAP_DEFAULT_LAT: z.string().transform(Number).pipe(
    z.number().min(-90).max(90, 'Latitude must be between -90 and 90')
  ),
  VITE_MAP_DEFAULT_LNG: z.string().transform(Number).pipe(
    z.number().min(-180).max(180, 'Longitude must be between -180 and 180')
  ),
  
  // Optional configurations
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
     throw new Error('Configuration validation failed');
   }
 };
 
 // Runtime configuration check
 export const checkRuntimeConfig = (): boolean => {
   const checks = [
     {
       name: 'API Connection',
       test: () => fetch(`${import.meta.env.VITE_API_BASE_URL}/health`).then(r => r.ok),
     },
     {
       name: 'WebSocket Connection',
       test: () => {
         return new Promise((resolve) => {
           const ws = new WebSocket(import.meta.env.VITE_SOCKET_URL);
           ws.onopen = () => {
             ws.close();
             resolve(true);
           };
           ws.onerror = () => resolve(false);
           setTimeout(() => resolve(false), 5000);
         });
       },
     },
   ];
   
   // Run checks in development environment
   if (import.meta.env.DEV) {
     checks.forEach(async (check) => {
       try {
         const result = await check.test();
         console.log(`${result ? '✅' : '❌'} ${check.name}`);
       } catch (error) {
         console.error(`❌ ${check.name}: ${error}`);
       }
     });
   }
   
   return true;
 };
 ```
 
 ## 🌐 Internationalization Configuration
 
 ### Language Configuration File
 
 **File**: `src/config/i18n.ts`
 
 ```typescript
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
     escapeValue: false, // React already handles XSS
   },
   
   LOAD_PATH: '/locales/{{lng}}/{{ns}}.json',
   
   // Namespace configuration
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
 
 // Dynamic language resource loading configuration
 export const LANGUAGE_RESOURCES = {
   'zh-TW': {
     common: () => import('../i18n/zh-TW/common.json'),
     auth: () => import('../i18n/zh-TW/auth.json'),
     chat: () => import('../i18n/zh-TW/chat.json'),
     profile: () => import('../i18n/zh-TW/profile.json'),
     settings: () => import('../i18n/zh-TW/settings.json'),
     errors: () => import('../i18n/zh-TW/errors.json'),
   },
   'en-US': {
     common: () => import('../i18n/en-US/common.json'),
     auth: () => import('../i18n/en-US/auth.json'),
     chat: () => import('../i18n/en-US/chat.json'),
     profile: () => import('../i18n/en-US/profile.json'),
     settings: () => import('../i18n/en-US/settings.json'),
     errors: () => import('../i18n/en-US/errors.json'),
   },
 } as const;
 
 // Language options
 export const LANGUAGE_OPTIONS = [
   { value: 'zh-TW', label: '繁體中文', flag: '🇹🇼' },
   { value: 'en-US', label: 'English', flag: '🇺🇸' },
 ] as const;
 ```
 
 ### Language Resource File Structure
 
 ```
 src/i18n/
 ├── zh-TW/
 │   ├── common.json       # Common text
 │   ├── auth.json         # Authentication related
 │   ├── chat.json         # Chat functionality
 │   ├── profile.json      # Profile
 │   ├── settings.json     # Settings page
 │   └── errors.json       # Error messages
 └── en-US/
     ├── common.json
     ├── auth.json
     ├── chat.json
     ├── profile.json
     ├── settings.json
     └── errors.json
 ```
 
 ## 🗂️ Fixed Category Configuration
 
 **File**: `src/config/categories.ts`
 
 ```typescript
 // User-related categories
 export const USER_CATEGORIES = {
   // Age ranges
   AGE_RANGES: [
     { value: '18-25', label: '18-25 years', min: 18, max: 25 },
     { value: '26-30', label: '26-30 years', min: 26, max: 30 },
     { value: '31-35', label: '31-35 years', min: 31, max: 35 },
     { value: '36-40', label: '36-40 years', min: 36, max: 40 },
     { value: '41-50', label: '41-50 years', min: 41, max: 50 },
     { value: '51+', label: '51+ years', min: 51, max: 100 },
   ],
   
   // Interests and hobbies
   INTERESTS: [
     { id: 'music', label: 'Music', icon: 'music', category: 'entertainment' },
     { id: 'sports', label: 'Sports', icon: 'activity', category: 'health' },
     { id: 'travel', label: 'Travel', icon: 'map-pin', category: 'lifestyle' },
     { id: 'reading', label: 'Reading', icon: 'book', category: 'education' },
     { id: 'cooking', label: 'Cooking', icon: 'chef-hat', category: 'lifestyle' },
     { id: 'gaming', label: 'Gaming', icon: 'gamepad-2', category: 'entertainment' },
     { id: 'photography', label: 'Photography', icon: 'camera', category: 'art' },
     { id: 'art', label: 'Art', icon: 'palette', category: 'art' },
     { id: 'movies', label: 'Movies', icon: 'film', category: 'entertainment' },
     { id: 'fitness', label: 'Fitness', icon: 'dumbbell', category: 'health' },
   ],
   
   // Education levels
   EDUCATION_LEVELS: [
     { value: 'high_school', label: 'High School', order: 1 },
     { value: 'college', label: 'College', order: 2 },
     { value: 'bachelor', label: 'Bachelor', order: 3 },
     { value: 'master', label: 'Master', order: 4 },
     { value: 'phd', label: 'PhD', order: 5 },
   ],
   
   // Relationship goals
   RELATIONSHIP_GOALS: [
     { value: 'friendship', label: 'Friendship', description: 'Looking for like-minded friends' },
     { value: 'casual', label: 'Casual Dating', description: 'Relaxed and fun dating experience' },
     { value: 'dating', label: 'Dating', description: 'Looking for dating partners' },
     { value: 'serious', label: 'Serious Relationship', description: 'Looking for long-term stable relationship' },
     { value: 'marriage', label: 'Marriage', description: 'Marriage-oriented' },
   ],
   
   // Occupation categories
   OCCUPATIONS: [
     { category: 'tech', label: 'Technology', jobs: ['Software Engineer', 'Product Manager', 'Designer'] },
     { category: 'finance', label: 'Finance', jobs: ['Banker', 'Accountant', 'Investment Advisor'] },
     { category: 'education', label: 'Education', jobs: ['Teacher', 'Professor', 'Researcher'] },
     { category: 'healthcare', label: 'Healthcare', jobs: ['Doctor', 'Nurse', 'Pharmacist'] },
     { category: 'service', label: 'Service Industry', jobs: ['Food & Beverage', 'Retail', 'Tourism'] },
     { category: 'creative', label: 'Creative Industry', jobs: ['Artist', 'Writer', 'Musician'] },
     { category: 'other', label: 'Other', jobs: ['Freelancer', 'Student', 'Other'] },
   ],
 } as const;
 
 // Chat-related categories
  export const CHAT_CATEGORIES = {
    // Message types
    MESSAGE_TYPES: [
      { value: 'text', label: 'Text Message', icon: 'message-circle' },
      { value: 'image', label: 'Image Message', icon: 'image' },
      { value: 'video', label: 'Video Message', icon: 'video' },
      { value: 'audio', label: 'Audio Message', icon: 'mic' },
      { value: 'file', label: 'File Message', icon: 'file' },
      { value: 'location', label: 'Location Message', icon: 'map-pin' },
    ],
    
    // Emoji categories
    EMOJI_CATEGORIES: [
      { id: 'smileys', label: 'Smileys', icon: '😀', keywords: ['smile', 'happy', 'sad'] },
      { id: 'people', label: 'People', icon: '👋', keywords: ['people', 'body', 'hand'] },
      { id: 'nature', label: 'Nature', icon: '🌱', keywords: ['nature', 'plant', 'animal'] },
      { id: 'food', label: 'Food', icon: '🍎', keywords: ['food', 'drink', 'fruit'] },
      { id: 'activities', label: 'Activities', icon: '⚽', keywords: ['sport', 'game', 'activity'] },
      { id: 'travel', label: 'Travel', icon: '🚗', keywords: ['travel', 'place', 'transport'] },
      { id: 'objects', label: 'Objects', icon: '💡', keywords: ['object', 'tool', 'symbol'] },
      { id: 'symbols', label: 'Symbols', icon: '❤️', keywords: ['symbol', 'heart', 'flag'] },
    ],
    
    // Chat room status
    ROOM_STATUS: [
      { value: 'active', label: 'Active', color: 'green' },
      { value: 'inactive', label: 'Inactive', color: 'gray' },
      { value: 'archived', label: 'Archived', color: 'orange' },
      { value: 'blocked', label: 'Blocked', color: 'red' },
    ],
  } as const;
  
  // System settings categories
  export const SYSTEM_CATEGORIES = {
    // Notification types
    NOTIFICATION_TYPES: [
      { type: 'match', label: 'Match Notifications', description: 'Notify when you have new matches', default: true },
      { type: 'message', label: 'Message Notifications', description: 'Notify when you receive new messages', default: true },
      { type: 'like', label: 'Like Notifications', description: 'Notify when someone likes you', default: true },
      { type: 'visit', label: 'Visitor Notifications', description: 'Notify when someone views your profile', default: false },
      { type: 'system', label: 'System Notifications', description: 'Important system messages', default: true },
    ],
    
    // Privacy settings
    PRIVACY_SETTINGS: [
      { key: 'show_online_status', label: 'Show Online Status', default: true },
      { key: 'show_last_seen', label: 'Show Last Seen', default: true },
      { key: 'allow_search', label: 'Allow Search', default: true },
      { key: 'show_distance', label: 'Show Distance', default: true },
      { key: 'auto_location', label: 'Auto Update Location', default: false },
    ],
    
    // Theme options
    THEME_OPTIONS: [
      { value: 'light', label: 'Light Theme', icon: 'sun' },
      { value: 'dark', label: 'Dark Theme', icon: 'moon' },
      { value: 'auto', label: 'Follow System', icon: 'monitor' },
    ],
  } as const;
  
  // Helper functions
  export const getCategoryById = (categories: any[], id: string) => {
    return categories.find(item => item.id === id || item.value === id);
  };
  
  export const getCategoriesByType = (type: string) => {
    switch (type) {
      case 'interests':
        return USER_CATEGORIES.INTERESTS;
      case 'education':
        return USER_CATEGORIES.EDUCATION_LEVELS;
      case 'goals':
        return USER_CATEGORIES.RELATIONSHIP_GOALS;
      default:
        return [];
    }
  };
  ```
  
  ## 🛣️ Route Configuration
  
  **File**: `src/config/routes.ts`
  
  ```typescript
  // Route configuration
  export const ROUTES = {
    // Public routes (no authentication required)
    PUBLIC: {
      HOME: '/',
      LOGIN: '/login',
      REGISTER: '/register',
      FORGOT_PASSWORD: '/forgot-password',
      RESET_PASSWORD: '/reset-password/:token',
      VERIFY_EMAIL: '/verify-email/:token',
      PRIVACY: '/privacy',
      TERMS: '/terms',
      ABOUT: '/about',
      CONTACT: '/contact',
    },
    
    // Protected routes (authentication required)
    PROTECTED: {
      DASHBOARD: '/dashboard',
      PROFILE: '/profile',
      EDIT_PROFILE: '/profile/edit',
      PROFILE_PHOTOS: '/profile/photos',
      DISCOVER: '/discover',
      MATCHES: '/matches',
      LIKES: '/likes',
      CHAT: '/chat',
      CHAT_ROOM: '/chat/:roomId',
      SETTINGS: '/settings',
      SETTINGS_ACCOUNT: '/settings/account',
      SETTINGS_PRIVACY: '/settings/privacy',
      SETTINGS_NOTIFICATIONS: '/settings/notifications',
      NOTIFICATIONS: '/notifications',
      HELP: '/help',
    },
    
    // Admin routes
    ADMIN: {
      DASHBOARD: '/admin',
      USERS: '/admin/users',
      REPORTS: '/admin/reports',
      ANALYTICS: '/admin/analytics',
      SETTINGS: '/admin/settings',
    },
  } as const;
  
  // API route configuration
  export const API_ROUTES = {
    // Authentication related
    AUTH: {
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register',
      LOGOUT: '/api/auth/logout',
      REFRESH: '/api/auth/refresh',
      VERIFY_EMAIL: '/api/auth/verify-email',
      FORGOT_PASSWORD: '/api/auth/forgot-password',
      RESET_PASSWORD: '/api/auth/reset-password',
      CHECK_EMAIL: '/api/auth/check-email',
    },
    
    // User related
    USER: {
      PROFILE: '/api/user/profile',
      UPDATE_PROFILE: '/api/user/profile',
      UPLOAD_AVATAR: '/api/user/avatar',
      UPLOAD_PHOTOS: '/api/user/photos',
      DELETE_PHOTO: '/api/user/photos/:photoId',
      DISCOVER: '/api/user/discover',
      LIKE: '/api/user/like',
      PASS: '/api/user/pass',
      BLOCK: '/api/user/block',
      REPORT: '/api/user/report',
      SEARCH: '/api/user/search',
    },
    
    // Chat related
    CHAT: {
      ROOMS: '/api/chat/rooms',
      ROOM_DETAIL: '/api/chat/rooms/:roomId',
      MESSAGES: '/api/chat/rooms/:roomId/messages',
      SEND_MESSAGE: '/api/chat/rooms/:roomId/messages',
      UPLOAD_FILE: '/api/chat/upload',
      TYPING: '/api/chat/rooms/:roomId/typing',
      READ_MESSAGES: '/api/chat/rooms/:roomId/read',
    },
    
    // Notification related
    NOTIFICATION: {
      LIST: '/api/notifications',
      MARK_READ: '/api/notifications/:id/read',
      MARK_ALL_READ: '/api/notifications/read-all',
      SETTINGS: '/api/notifications/settings',
      DELETE: '/api/notifications/:id',
    },
    
    // System related
    SYSTEM: {
      HEALTH: '/api/health',
      CONFIG: '/api/config',
      UPLOAD: '/api/upload',
      GEOCODE: '/api/geocode',
    },
  } as const;
  
  // Route helper functions
  export const buildRoute = (route: string, params: Record<string, string | number>): string => {
    return Object.entries(params).reduce(
      (path, [key, value]) => path.replace(`:${key}`, String(value)),
      route
    );
  };
  
  // Route permission check
  export const getRoutePermission = (path: string): 'public' | 'protected' | 'admin' => {
    if (Object.values(ROUTES.PUBLIC).includes(path)) {
      return 'public';
    }
    if (Object.values(ROUTES.ADMIN).some(route => path.startsWith(route.split(':')[0]))) {
      return 'admin';
    }
    return 'protected';
  };
  
  // Navigation route configuration
  export const NAVIGATION_ROUTES = [
    { path: ROUTES.PROTECTED.DISCOVER, label: 'Discover', icon: 'compass' },
    { path: ROUTES.PROTECTED.MATCHES, label: 'Matches', icon: 'heart' },
    { path: ROUTES.PROTECTED.CHAT, label: 'Chat', icon: 'message-circle' },
    { path: ROUTES.PROTECTED.PROFILE, label: 'Profile', icon: 'user' },
  ] as const;
  
  // Usage examples:
  // buildRoute(ROUTES.PROTECTED.CHAT_ROOM, { roomId: '123' }) => '/chat/123'
  // buildRoute(API_ROUTES.CHAT.MESSAGES, { roomId: '123' }) => '/api/chat/rooms/123/messages'
  ```
  
  ## 🎨 Theme Configuration
  
  **File**: `src/config/theme.ts`
  
  ```typescript
  import type { ThemeConfig } from 'antd';
  
  // Base theme configuration
  export const BASE_THEME_CONFIG: ThemeConfig = {
    token: {
      // Primary colors
      colorPrimary: '#1890ff',
      colorSuccess: '#52c41a',
      colorWarning: '#faad14',
      colorError: '#ff4d4f',
      colorInfo: '#1890ff',
      
      // Font configuration
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans TC", sans-serif',
      fontSize: 14,
      fontSizeHeading1: 38,
      fontSizeHeading2: 30,
      fontSizeHeading3: 24,
      fontSizeHeading4: 20,
      fontSizeHeading5: 16,
      
      // Spacing configuration
      padding: 16,
      margin: 16,
      paddingXS: 8,
      paddingSM: 12,
      paddingLG: 24,
      paddingXL: 32,
      
      // Border radius configuration
      borderRadius: 6,
      borderRadiusLG: 8,
      borderRadiusSM: 4,
      
      // Shadow configuration
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      boxShadowSecondary: '0 4px 12px rgba(0, 0, 0, 0.15)',
      
      // Animation configuration
      motionDurationFast: '0.1s',
      motionDurationMid: '0.2s',
      motionDurationSlow: '0.3s',
    },
    
    components: {
      Button: {
        borderRadius: 8,
        controlHeight: 40,
        fontWeight: 500,
      },
      Input: {
        borderRadius: 8,
        controlHeight: 40,
      },
      Card: {
        borderRadius: 12,
        paddingLG: 24,
      },
      Modal: {
        borderRadius: 12,
      },
      Drawer: {
        borderRadius: 12,
      },
      Message: {
        borderRadius: 8,
      },
      Notification: {
        borderRadius: 8,
      },
    },
  };
  
  // Light theme configuration
  export const LIGHT_THEME_CONFIG: ThemeConfig = {
    ...BASE_THEME_CONFIG,
    token: {
      ...BASE_THEME_CONFIG.token,
      colorBgBase: '#ffffff',
      colorTextBase: '#000000',
      colorBgContainer: '#ffffff',
      colorBgElevated: '#ffffff',
      colorBorder: '#d9d9d9',
      colorBorderSecondary: '#f0f0f0',
    },
  };
  
  // Dark theme configuration
  export const DARK_THEME_CONFIG: ThemeConfig = {
    ...BASE_THEME_CONFIG,
    algorithm: 'dark',
    token: {
      ...BASE_THEME_CONFIG.token,
      colorBgBase: '#141414',
      colorTextBase: '#ffffff',
      colorBgContainer: '#1f1f1f',
      colorBgElevated: '#262626',
      colorBorder: '#434343',
      colorBorderSecondary: '#303030',
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
  
  // Z-index level management
  export const Z_INDEX = {
    BASE: 1,
    DROPDOWN: 1000,
    STICKY: 1020,
    FIXED: 1030,
    MODAL_BACKDROP: 1040,
    MODAL: 1050,
    POPOVER: 1060,
    TOOLTIP: 1070,
    NOTIFICATION: 1080,
    LOADING: 1090,
  } as const;
  
  // Color palette
  export const COLOR_PALETTE = {
    // Primary colors
    PRIMARY: {
      50: '#e6f7ff',
      100: '#bae7ff',
      200: '#91d5ff',
      300: '#69c0ff',
      400: '#40a9ff',
      500: '#1890ff', // Main color
      600: '#096dd9',
      700: '#0050b3',
      800: '#003a8c',
      900: '#002766',
    },
    
    // Success colors
    SUCCESS: {
      50: '#f6ffed',
      100: '#d9f7be',
      200: '#b7eb8f',
      300: '#95de64',
      400: '#73d13d',
      500: '#52c41a', // Main color
      600: '#389e0d',
      700: '#237804',
      800: '#135200',
      900: '#092b00',
    },
    
    // Warning colors
    WARNING: {
      50: '#fffbe6',
      100: '#fff1b8',
      200: '#ffe58f',
      300: '#ffd666',
      400: '#ffc53d',
      500: '#faad14', // Main color
      600: '#d48806',
      700: '#ad6800',
      800: '#874d00',
      900: '#613400',
    },
    
    // Error colors
    ERROR: {
      50: '#fff2f0',
      100: '#ffccc7',
      200: '#ffa39e',
      300: '#ff7875',
      400: '#ff4d4f', // Main color
      500: '#f5222d',
      600: '#cf1322',
      700: '#a8071a',
      800: '#820014',
      900: '#5c0011',
    },
    
    // Neutral colors
    NEUTRAL: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#f0f0f0',
      300: '#d9d9d9',
      400: '#bfbfbf',
      500: '#8c8c8c',
      600: '#595959',
      700: '#434343',
      800: '#262626',
      900: '#1f1f1f',
    },
  } as const;
  
  // Animation configuration
  export const ANIMATION_CONFIG = {
    // Easing functions
    EASING: {
      EASE_IN: 'cubic-bezier(0.4, 0, 1, 1)',
      EASE_OUT: 'cubic-bezier(0, 0, 0.2, 1)',
      EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)',
      BOUNCE: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
    
    // Duration
    DURATION: {
      FAST: 150,
      NORMAL: 300,
      SLOW: 500,
    },
    
    // Common animations
    TRANSITIONS: {
      FADE: 'opacity 0.3s ease-in-out',
      SLIDE: 'transform 0.3s ease-in-out',
      SCALE: 'transform 0.2s ease-in-out',
    },
  } as const;
  
  // Theme utility functions
  export const getThemeConfig = (theme: 'light' | 'dark' | 'auto'): ThemeConfig => {
    if (theme === 'auto') {
      // Detect system theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? DARK_THEME_CONFIG : LIGHT_THEME_CONFIG;
    }
    
    return theme === 'dark' ? DARK_THEME_CONFIG : LIGHT_THEME_CONFIG;
  };
  
  // Responsive utility functions
  export const getBreakpoint = (): keyof typeof BREAKPOINTS => {
    const width = window.innerWidth;
    
    if (width >= BREAKPOINTS.xxl) return 'xxl';
    if (width >= BREAKPOINTS.xl) return 'xl';
    if (width >= BREAKPOINTS.lg) return 'lg';
    if (width >= BREAKPOINTS.md) return 'md';
    if (width >= BREAKPOINTS.sm) return 'sm';
    return 'xs';
  };
  
  // CSS variables generation
  export const generateCSSVariables = (theme: 'light' | 'dark') => {
    const config = theme === 'dark' ? DARK_THEME_CONFIG : LIGHT_THEME_CONFIG;
    const { token } = config;
    
    return {
      '--color-primary': token?.colorPrimary,
      '--color-success': token?.colorSuccess,
      '--color-warning': token?.colorWarning,
      '--color-error': token?.colorError,
      '--color-bg-base': token?.colorBgBase,
      '--color-text-base': token?.colorTextBase,
      '--border-radius': `${token?.borderRadius}px`,
      '--font-family': token?.fontFamily,
      '--font-size': `${token?.fontSize}px`,
    };
  };
  ```
  
  ## 🔧 Configuration Management Best Practices
  
  ### 1. Development Phase Checklist
  
  - [ ] **Environment Variables Check**
    - [ ] All URLs and port numbers use environment variables
    - [ ] Sensitive information does not appear in frontend environment variables
    - [ ] All environment variables have reasonable default values
    - [ ] Use Zod to validate all environment variables
  
  - [ ] **Configuration Files Check**
    - [ ] All fixed text is extracted to internationalization files
    - [ ] All categories and options are defined in configuration files
    - [ ] All theme-related values are in theme configuration
    - [ ] All API paths are in route configuration
  
  - [ ] **Code Quality Check**
    - [ ] No hardcoded magic numbers
    - [ ] All configurations have TypeScript type definitions
    - [ ] Configuration files have appropriate comments
    - [ ] Use `as const` to ensure type inference
  
  ### 2. Configuration Update Process
  
  ```mermaid
  flowchart TD
      A[Requirement Change] --> B[Update Environment Variables]
      B --> C[Update Configuration Files]
      C --> D[Update Type Definitions]
      D --> E[Run Configuration Validation]
      E --> F{Validation Passed?}
      F -->|Yes| G[Commit Changes]
      F -->|No| H[Fix Errors]
      H --> E
      G --> I[Deploy to Test Environment]
      I --> J[Verify Functionality]
      J --> K[Deploy to Production Environment]
  ```
  
  ### 3. Environment Management Strategy
  
  ```bash
  # Development environment
  .env.development
  
  # Test environment
  .env.staging
  
  # Production environment
  .env.production
  
  # Local override (not committed to version control)
  .env.local
  ```
  
  ### 4. Configuration Security Standards
  
  - **Frontend Environment Variables Security**
    - Only place public information in frontend environment variables
    - Use `VITE_` prefix to ensure variables are properly handled
    - Avoid exposing API keys or sensitive configurations in frontend
  
  - **Backend Environment Variables Security**
    - Use strong passwords and random keys
    - Regularly rotate sensitive keys
    - Use environment variable management tools (e.g., AWS Secrets Manager)
  
  ### 5. Configuration Monitoring and Alerting
  
  ```typescript
  // Configuration health check
  export const configHealthCheck = async (): Promise<boolean> => {
    const checks = [
      // API connection check
      () => fetch(`${API_CONFIG.BASE_URL}/health`).then(r => r.ok),
      
      // WebSocket connection check
      () => new Promise((resolve) => {
        const ws = new WebSocket(SOCKET_CONFIG.URL);
        ws.onopen = () => { ws.close(); resolve(true); };
        ws.onerror = () => resolve(false);
        setTimeout(() => resolve(false), 5000);
      }),
      
      // Map service check
      () => fetch(MAP_CONFIG.NOMINATIM.API_URL).then(r => r.ok),
    ];
    
    const results = await Promise.allSettled(checks.map(check => check()));
    return results.every(result => result.status === 'fulfilled' && result.value);
  };
  ```
  
  ## 🚀 Future Expansion Planning
  
  ### 1. Database Configuration Management
  
  When the project scales up, migrate configuration to database:
  
  ```sql
  -- System configuration table
  CREATE TABLE system_configs (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(255) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    config_type VARCHAR(50) NOT NULL, -- 'string', 'number', 'boolean', 'json'
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE, -- Whether accessible from frontend
    is_encrypted BOOLEAN DEFAULT FALSE, -- Whether stored encrypted
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  
  -- User personal configuration table
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
  
  ### 2. Configuration Management API
  
  ```typescript
  // Configuration management service interface
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
    
    // Configuration hot reload
    subscribeToConfigChanges(callback: (key: string, value: any) => void): void;
    unsubscribeFromConfigChanges(callback: (key: string, value: any) => void): void;
    
    // Configuration cache
    clearConfigCache(): Promise<void>;
    refreshConfigCache(): Promise<void>;
  }
  ```
  
  ### 3. Configuration Hot Reload Mechanism
  
  ```typescript
  // Configuration hot reload implementation
  class ConfigManager {
    private configs: Map<string, any> = new Map();
    private listeners: Map<string, Set<Function>> = new Map();
    private wsConnection: WebSocket | null = null;
    
    constructor() {
      this.initWebSocketConnection();
    }
    
    private initWebSocketConnection() {
      this.wsConnection = new WebSocket(`${SOCKET_CONFIG.URL}/config`);
      
      this.wsConnection.onmessage = (event) => {
        const { type, key, value } = JSON.parse(event.data);
        
        if (type === 'config_update') {
          this.updateConfig(key, value);
          this.notifyListeners(key, value);
        }
      };
    }
    
    public subscribe(key: string, callback: Function) {
      if (!this.listeners.has(key)) {
        this.listeners.set(key, new Set());
      }
      this.listeners.get(key)!.add(callback);
    }
    
    public unsubscribe(key: string, callback: Function) {
      this.listeners.get(key)?.delete(callback);
    }
    
    private notifyListeners(key: string, value: any) {
      this.listeners.get(key)?.forEach(callback => callback(value));
      this.listeners.get('*')?.forEach(callback => callback(key, value));
    }
  }
  ```
  
  ### 4. Configuration Version Control
  
  ```typescript
  // Configuration version management
  interface ConfigVersion {
    version: string;
    timestamp: Date;
    changes: ConfigChange[];
    author: string;
  }
  
  interface ConfigChange {
    key: string;
    oldValue: any;
    newValue: any;
    operation: 'create' | 'update' | 'delete';
  }
  
  // Configuration rollback functionality
  class ConfigVersionManager {
    async rollbackToVersion(version: string): Promise<void> {
      const versionData = await this.getVersion(version);
      await this.applyConfigChanges(versionData.changes.reverse());
    }
    
    async createConfigSnapshot(description: string): Promise<string> {
      const currentConfigs = await this.getAllConfigs();
      const version = this.generateVersionId();
      
      await this.saveVersion({
        version,
        timestamp: new Date(),
        changes: [],
        author: 'system',
        description,
        snapshot: currentConfigs,
      });
      
      return version;
    }
  }
  ```
  
  ## 📊 Configuration Monitoring and Analytics
  
  ### 1. Configuration Usage Statistics
  
  ```typescript
  // Configuration usage tracking
  class ConfigAnalytics {
    private usageStats: Map<string, number> = new Map();
    
    trackConfigAccess(key: string) {
      const count = this.usageStats.get(key) || 0;
      this.usageStats.set(key, count + 1);
    }
    
    getPopularConfigs(limit: number = 10) {
      return Array.from(this.usageStats.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, limit);
    }
    
    getUnusedConfigs() {
      // Return configurations that have never been accessed
      return Array.from(this.usageStats.entries())
        .filter(([,count]) => count === 0)
        .map(([key]) => key);
    }
  }
  ```
  
  ### 2. Configuration Performance Monitoring
  
  ```typescript
  // Configuration load performance monitoring
  class ConfigPerformanceMonitor {
    private loadTimes: Map<string, number[]> = new Map();
    
    async measureConfigLoad<T>(key: string, loader: () => Promise<T>): Promise<T> {
      const startTime = performance.now();
      
      try {
        const result = await loader();
        const loadTime = performance.now() - startTime;
        
        this.recordLoadTime(key, loadTime);
        return result;
      } catch (error) {
        this.recordLoadError(key, error);
        throw error;
      }
    }
    
    private recordLoadTime(key: string, time: number) {
      if (!this.loadTimes.has(key)) {
        this.loadTimes.set(key, []);
      }
      this.loadTimes.get(key)!.push(time);
    }
    
    getAverageLoadTime(key: string): number {
      const times = this.loadTimes.get(key) || [];
      return times.reduce((sum, time) => sum + time, 0) / times.length;
    }
  }
  ```
  
  ## 🔒 Configuration Security Best Practices
  
  ### 1. Sensitive Configuration Encryption
  
  ```typescript
  // Configuration encryption service
  class ConfigEncryption {
    private encryptionKey: string;
    
    constructor(key: string) {
      this.encryptionKey = key;
    }
    
    encrypt(value: string): string {
      // Use AES-256-GCM encryption
      const cipher = crypto.createCipher('aes-256-gcm', this.encryptionKey);
      let encrypted = cipher.update(value, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return encrypted;
    }
    
    decrypt(encryptedValue: string): string {
      const decipher = crypto.createDecipher('aes-256-gcm', this.encryptionKey);
      let decrypted = decipher.update(encryptedValue, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    }
  }
  ```
  
  ### 2. Configuration Access Control
  
  ```typescript
  // Configuration permission management
  interface ConfigPermission {
    key: string;
    roles: string[];
    operations: ('read' | 'write' | 'delete')[];
  }
  
  class ConfigAccessControl {
    private permissions: Map<string, ConfigPermission> = new Map();
    
    checkPermission(userRole: string, configKey: string, operation: string): boolean {
      const permission = this.permissions.get(configKey);
      
      if (!permission) {
        return false; // Default deny access
      }
      
      return permission.roles.includes(userRole) && 
             permission.operations.includes(operation as any);
    }
    
    setPermission(configKey: string, permission: ConfigPermission) {
      this.permissions.set(configKey, permission);
    }
  }
  ```
  
  ## 📝 Automatic Configuration Documentation
  
  ### 1. Configuration Documentation Generator
  
  ```typescript
  // Automatic configuration documentation generation
  class ConfigDocGenerator {
    generateMarkdown(configs: Record<string, any>): string {
      let markdown = '# Configuration Documentation\n\n';
      
      Object.entries(configs).forEach(([key, config]) => {
        markdown += `## ${key}\n\n`;
        markdown += `**Type**: ${typeof config.value}\n`;
        markdown += `**Default Value**: \`${config.defaultValue}\`\n`;
        markdown += `**Description**: ${config.description}\n`;
        
        if (config.validation) {
          markdown += `**Validation Rules**: ${config.validation}\n`;
        }
        
        markdown += '\n';
      });
      
      return markdown;
    }
    
    generateTypeScript(configs: Record<string, any>): string {
      let typescript = '// Auto-generated configuration type definitions\n\n';
      
      typescript += 'export interface AppConfig {\n';
      
      Object.entries(configs).forEach(([key, config]) => {
        typescript += `  /** ${config.description} */\n`;
        typescript += `  ${key}: ${this.getTypeScriptType(config.value)};\n`;
      });
      
      typescript += '}\n';
      
      return typescript;
    }
    
    private getTypeScriptType(value: any): string {
      if (Array.isArray(value)) {
        return `${this.getTypeScriptType(value[0])}[]`;
      }
      
      switch (typeof value) {
        case 'string': return 'string';
        case 'number': return 'number';
        case 'boolean': return 'boolean';
        case 'object': return 'Record<string, any>';
        default: return 'any';
      }
    }
  }
  ```
  
  ## 🧪 Configuration Testing Strategy
  
  ### 1. Configuration Unit Testing
  
  ```typescript
  // Configuration testing tools
  class ConfigTester {
    testConfigValidation(config: any, schema: any): boolean {
      try {
        schema.parse(config);
        return true;
      } catch (error) {
        console.error('Configuration validation failed:', error);
        return false;
      }
    }
    
    testConfigDefaults(): boolean {
      const requiredConfigs = [
        'API_CONFIG.BASE_URL',
        'SOCKET_CONFIG.URL',
        'MAP_CONFIG.DEFAULT_POSITION',
      ];
      
      return requiredConfigs.every(configPath => {
        const value = this.getConfigByPath(configPath);
        return value !== undefined && value !== null;
      });
    }
    
    private getConfigByPath(path: string): any {
      return path.split('.').reduce((obj, key) => obj?.[key], window);
    }
  }
  ```
  
  ### 2. Configuration Integration Testing
  
  ```typescript
  // Configuration integration testing
  class ConfigIntegrationTest {
    async testAPIConnectivity(): Promise<boolean> {
      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/health`);
        return response.ok;
      } catch (error) {
        return false;
      }
    }
    
    async testWebSocketConnection(): Promise<boolean> {
      return new Promise((resolve) => {
        const ws = new WebSocket(SOCKET_CONFIG.URL);
        
        ws.onopen = () => {
          ws.close();
          resolve(true);
        };
        
        ws.onerror = () => resolve(false);
        
        setTimeout(() => resolve(false), 5000);
      });
    }
    
    async testMapServices(): Promise<boolean> {
      try {
        const response = await fetch(
          `${MAP_CONFIG.NOMINATIM.API_URL}/search?q=test&format=json&limit=1`
        );
        return response.ok;
      } catch (error) {
        return false;
      }
    }
  }
  ```
  
  ## 📋 Summary
  
  This configuration management guide provides a complete configuration management solution, including:
  
  1. **Environment Variable Management**: Complete frontend and backend environment variable configuration
  2. **Configuration File Structure**: Modular configuration file organization
  3. **Type Safety**: TypeScript type definitions and validation
  4. **Security**: Configuration encryption and access control
  5. **Maintainability**: Configuration version control and hot reload
  6. **Monitoring**: Configuration usage statistics and performance monitoring
  7. **Testing**: Complete configuration testing strategy
  8. **Future Expansion**: Database configuration management planning
  
  Following these standards ensures that the project's configuration management meets enterprise-level standards, improving system maintainability, scalability, and security.
```