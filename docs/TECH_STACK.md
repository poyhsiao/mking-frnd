# MKing Friend - Technology Stack Specification

## 📋 Overview

This document defines the confirmed technology stack and development standards for the MKing Friend online dating platform. All development work must follow this specification.

## 🎯 Confirmed Technology Choices

### Frontend Framework
- **Main Framework**: React 18+ with TypeScript
- **UI Component Library**: **Ant Design** (Enterprise-grade UI components, completely free)
- **State Management**: Zustand (Lightweight state management)
- **Routing**: React Router v6
- **Build Tool**: **Vite** (Fast development experience)

### Icons and Visual Resources
- **Icon Libraries**: 
  - **React Icons** - Integrates multiple icon libraries (Feather, Heroicons, etc.)
  - **Lucide React** - Beautiful open-source icon library
  - **Tabler Icons** - Over 4000 free SVG icons

### Free Commercial Illustration Sources
- **unDraw** - Customizable color illustrations
- **Storyset** - Freepik's free illustration collection
- **Pixabay/Unsplash** - High-quality free photos

### Package Manager
- **Unified Use**: **pnpm**
- **Prohibited**: npm, yarn
- **Reason**: Faster installation speed, less disk space usage, stricter dependency management

## 🛠️ Development Tools and Standards

### Code Quality
- **ESLint**: TypeScript code linting
- **Prettier**: Code formatting
- **Husky**: Git hooks management
- **lint-staged**: Pre-commit checks

### Testing Strategy
- **Unit Testing**: Jest + React Testing Library
- **E2E Testing**: Cypress
- **Test Coverage**: Minimum 80%
- **Coverage Reporting**: Codecov Action v5 integration with enhanced reliability and error handling
- **CI/CD Testing**: Automated test execution with fail_ci_if_error enabled and environment variable tracking

### Internationalization
- **react-i18next**: React internationalization library
- **Supported Languages**: Traditional Chinese (zh-TW), English (en-US)
- **Language Detection**: Automatic browser language detection

### Multimedia Processing
- **Image Upload**: react-dropzone
- **Image Cropping**: react-image-crop
- **Video Playback**: Video.js
- **Audio Processing**: WaveSurfer.js

### Real-time Communication
- **WebSocket**: Socket.io-client
- **WebRTC**: Simple-peer (voice and video calls)

### PWA Features
- **Service Worker**: Workbox
- **Offline Storage**: IndexedDB (Dexie.js)

### Animation and Interaction
- **Animation Library**: Framer Motion
- **Intersection Observer**: react-intersection-observer

### Date Processing
- **Primary**: date-fns
- **Secondary**: dayjs

### Maps and Geolocation Services
- **Map Library**: Leaflet (lightweight, open-source map library)
- **Map Data**: OpenStreetMap (free, open-source map data)
- **React Integration**: React-Leaflet
- **Geocoding**: Nominatim API (OpenStreetMap official geocoding service)
- **Location Services**: HTML5 Geolocation API
- **Map Layers**: 
  - Base Layer: OpenStreetMap standard layer
  - Satellite Layer: Esri World Imagery (free quota)
- **Map Plugins**: 
  - leaflet-control-geocoder (address search)
  - leaflet-routing-machine (route planning)
  - leaflet-markercluster (marker clustering)

**Note**: Avoid using map services from mainland China (such as Amap, Baidu Maps, etc.)

## 📦 Dependency Management Standards

### pnpm Usage Standards
```bash
# Install dependencies
pnpm install

# Add production dependency
pnpm add <package-name>

# Add development dependency
pnpm add -D <package-name>

# Remove dependency
pnpm remove <package-name>

# Update dependencies
pnpm update

# Clean node_modules
pnpm store prune
```

### Prohibited Operations
- ❌ Using `npm install`
- ❌ Using `yarn add`
- ❌ Mixing different package managers
- ❌ Committing `package-lock.json` or `yarn.lock`
- ✅ Only commit `pnpm-lock.yaml`

## 🎨 UI/UX Design Standards

### Ant Design Usage Standards
- **Theme Customization**: Use Ant Design's theme customization features
- **Component Priority**: Prioritize using Ant Design components
- **Custom Components**: Extend based on Ant Design components
- **Responsive**: Use Ant Design's responsive breakpoints

### Icon Usage Standards
- **Priority**: Lucide React > Tabler Icons > React Icons
- **Consistency**: Use the same icon library within the same functional area
- **Size**: Follow Ant Design's icon size standards
- **Color**: Use theme color system

### Illustration Usage Standards
- **Style Consistency**: Choose illustrations with consistent style
- **Color Coordination**: Maintain consistency with brand colors
- **License Confirmation**: Ensure all illustrations are commercially usable
- **Optimization**: Use SVG format to ensure scalability

## 🔧 Development Environment Configuration

### Required Tools
- Node.js 18+
- pnpm (latest version)
- VS Code (recommended)
- Git

### VS Code Extension Recommendations
- ES7+ React/Redux/React-Native snippets
- TypeScript Importer
- Prettier - Code formatter
- ESLint
- Auto Rename Tag
- Bracket Pair Colorizer
- GitLens

### Configuration Management

**Configuration Management Tools**
- **Zod**: Environment variable validation and type safety
- **dotenv**: Environment variable loading
- **cross-env**: Cross-platform environment variable setting

**Environment Variable Categories**
```bash
# API Service Configuration
VITE_API_BASE_URL=http://localhost:8000
VITE_API_TIMEOUT=30000
VITE_API_RETRY_COUNT=3

# WebSocket Configuration
VITE_SOCKET_URL=ws://localhost:8000
VITE_SOCKET_RECONNECT_INTERVAL=5000

# Application Basic Configuration
VITE_APP_NAME="MKing Friend"
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=development

# Map Service Configuration
VITE_MAP_DEFAULT_ZOOM=13
VITE_MAP_DEFAULT_LAT=25.0330
VITE_MAP_DEFAULT_LNG=121.5654
VITE_NOMINATIM_API_URL=https://nominatim.openstreetmap.org

# Multimedia Configuration
VITE_MAX_FILE_SIZE=10485760
VITE_ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp
VITE_ALLOWED_VIDEO_TYPES=video/mp4,video/webm

# Pagination and Cache Configuration
VITE_DEFAULT_PAGE_SIZE=20
VITE_MAX_PAGE_SIZE=100
VITE_CACHE_DURATION=300000
VITE_LOCAL_STORAGE_PREFIX=mking_
```

**Configuration File Structure**
```
src/config/
├── constants.ts      # Application constants configuration
├── i18n.ts          # Internationalization configuration
├── categories.ts    # Fixed category configuration
├── routes.ts        # Route configuration
├── theme.ts         # Theme configuration
└── validator.ts     # Configuration validation
```

## 📁 Project Structure Standards

```
frontend/
├── public/
│   ├── icons/          # Application icons
│   └── images/         # Static images
├── src/
│   ├── components/     # Reusable components
│   │   ├── common/     # Common components
│   │   ├── layout/     # Layout components
│   │   └── auth/       # Authentication-related components
│   ├── pages/          # Page components
│   ├── hooks/          # Custom Hooks
│   ├── services/       # API services
│   ├── stores/         # Zustand state management
│   ├── utils/          # Utility functions
│   ├── types/          # TypeScript type definitions
│   ├── config/         # Configuration files (NEW)
│   │   ├── constants.ts    # Application constants
│   │   ├── i18n.ts         # Internationalization configuration
│   │   ├── categories.ts   # Fixed categories
│   │   ├── routes.ts       # Route configuration
│   │   ├── theme.ts        # Theme configuration
│   │   └── validator.ts    # Configuration validation
│   ├── constants/      # Constants definition (DEPRECATED)
│   ├── i18n/           # Internationalization resource files
│   │   ├── zh-TW/      # Traditional Chinese
│   │   └── en-US/      # English
│   └── styles/         # Global styles
├── tests/              # Test files
└── docs/               # Component documentation
```

## 🚀 Deployment Standards

### Build Optimization
- **Tree shaking**: Automatically remove unused code
- **Code splitting**: Route-level lazy loading
- **Asset compression**: Gzip/Brotli compression
- **Image optimization**: WebP format priority

### Performance Metrics
- **First screen load time**: < 3 seconds
- **Interaction response time**: < 100ms
- **Lighthouse score**: > 90

## 📊 Monitoring and Analytics

### Error Monitoring
- **Sentry**: Frontend error tracking
- **Console cleanup**: Remove all console.log in production

### Performance Monitoring
- **Web Vitals**: Core web vitals monitoring
- **Bundle analysis**: Regular bundle size analysis

## 🔒 Security Standards

### Frontend Security
- **XSS Protection**: Use DOMPurify to sanitize user input
- **CSP**: Content Security Policy configuration
- **HTTPS**: Force HTTPS usage

### Privacy Protection
- **Data minimization**: Only collect necessary data
- **Local encryption**: Encrypt sensitive data stored locally
- **GDPR compliance**: Cookie consent mechanism

## 📝 Documentation Standards

### Code Comments
- **Components**: Use JSDoc format
- **Functions**: Describe parameters and return values
- **Complex logic**: Add inline comments

### README Updates
- **Feature changes**: Update README promptly
- **Dependency changes**: Update installation instructions
- **API changes**: Update usage examples

---

**Document Version**: v1.0  
**Last Updated**: 2025-01-02  
**Maintainer**: Development Team  
**Status**: ✅ Confirmed and Effective