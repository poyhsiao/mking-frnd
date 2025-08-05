# Changelog

This file documents all important changes and updates to the MKing Friend project.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased] - 2025-01-02

### Added
- 🏗️ **Microservices Architecture Design**
  - Added API Gateway unified entry point design
  - Added Consul service discovery and registration
  - Added gRPC inter-service communication protocol
  - Added six core microservices architecture: Auth, User, Chat, Media, Search, Admin

- 🎨 **Frontend Technology Stack Upgrade**
  - Upgraded to React 18 + TypeScript
  - Added Vite ultra-fast build tool
  - Added Zustand + React Query state management
  - Added Ant Design enterprise-grade UI component library
  - Added OpenStreetMap + Leaflet open-source map service

- ⚙️ **Backend Technology Stack Modernization**
  - Added NestJS enterprise-grade backend framework
  - Added Typesense fast full-text search engine
  - Added PostgreSQL shared database with independent schema design
  - Added Prisma ORM modern database toolkit
  - Added MinIO S3-compatible object storage

- 🚀 **Deployment and Operations**
  - Added Kubernetes container orchestration support
  - Added Prometheus + Grafana complete monitoring system
  - Added Loki + Promtail unified log management
  - Added Sentry error tracking and performance monitoring
  - Added Keycloak enterprise-grade identity authentication

### Fixed
- 🐛 **Docker Build Issues for pnpm Workspace Monorepo**
  - Fixed `/app/dist: not found` errors in multi-stage Docker builds
  - Updated backend Dockerfile to use `pnpm --filter=backend build` and copy from `/app/backend/dist`
  - Updated frontend Dockerfile to use `pnpm --filter=frontend build` and copy from `/app/frontend/dist`
  - Fixed nginx.conf path reference in frontend Dockerfile
  - Added comprehensive test suite `tests/docker/docker-build-fix.test.ts` with TDD approach
  - Resolved workspace configuration issues in Docker production stages

- 🔐 **GitHub Actions Permissions for Container Registry**
  - Fixed "denied: installation not allowed to Create organization package" error in CI/CD pipeline
  - Added required `packages: write` permission to build job for GHCR push access
  - Added `contents: read` permission for repository checkout
  - Added `id-token: write` permission for OIDC authentication
  - Added comprehensive test suite `tests/ci/github-actions-permissions.test.ts` with TDD approach
  - Resolved Docker image push failures to GitHub Container Registry

- 📋 **Product Planning and Documentation**
  - Added detailed admin system requirements planning
  - Added MVP feature priority classification (P0-P3)
  - Added detailed microservices architecture design documentation
  - Added development task Todo List format conversion
  - Added technical decision and architecture selection documentation

### Changed
- 📁 **Project Structure Reorganization**
  - Adjusted to microservices directory structure
  - Separated frontend applications: user-app and admin-app
  - Added services/ directory for microservices
  - Added shared/ directory for common libraries
  - Added k8s/ directory for Kubernetes configurations

- 📚 **Documentation Structure Optimization**
  - Reorganized documentation categories: Product & Planning, Technical Architecture, Development Guide, Deployment & Operations
  - Updated README.md to microservices architecture description
  - Updated development guide to microservices development process
  - Converted all development tasks to trackable Todo List format

- 🔧 **Development Environment Adjustments**
  - Updated quick start guide for microservices architecture
  - Adjusted service access addresses and port configurations
  - Updated local development environment setup process
  - Added independent microservices development guide

### Technical Debt
- Need to implement actual microservices code structure
- Need to configure Kubernetes deployment files
- Need to set up CI/CD pipelines
- Need to improve monitoring and logging configurations

### Development Standards Enhancement
- ✅ **Change Tracking Standards** - Added mandatory documentation update standards
  - Established mandatory update mechanism for CHANGELOG.md and README.md
  - Defined change record format and checklist
  - Established documentation maintenance responsibility and violation handling mechanism
  - Ensured all developers follow unified documentation update standards

### Documentation Updates
- ✅ `README.md` - Completely rewritten for microservices architecture description, added comprehensive quick start guide, troubleshooting and contribution guidelines
- ✅ `docs/README.md` - Updated documentation structure and technology stack overview
- ✅ `docs/requirements/prd.md` - Added microservices architecture and admin system requirements
- ✅ `docs/development-tasks.md` - Converted to Todo List format
- ✅ `docs/CHANGELOG.md` - Added changelog file, established complete change tracking mechanism
- ✅ `docs/development/DEVELOPMENT_STANDARDS.md` - Added change tracking and documentation update standards section
- ✅ `docs/development/setup.md` - Added development standards reference, ensuring developers understand mandatory documentation update requirements
- ✅ `.gitignore` - Updated ignore rules to adapt to microservices architecture and development environment
- ✅ `docs/` - Added complete documentation directory structure including deployment guides, development standards, architecture design, etc.

---

## Version Notes

- **[Unreleased]** - Features currently in development
- **Added** - New features
- **Changed** - Changes to existing functionality
- **Deprecated** - Features that will be removed soon
- **Removed** - Features that have been removed
- **Fixed** - Bug fixes
- **Security** - Security-related changes

---

**MKing Friend** - Modern microservices architecture online dating platform 💝