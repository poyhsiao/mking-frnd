# MKing Friend - Project Overview

## Project Purpose
MKing Friend is a modern social networking platform for meaningful connections, built with microservices architecture. It's a comprehensive dating/social platform with real-time chat, intelligent search, and location-based services.

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + Ant Design
- **Backend**: Node.js + NestJS + TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Search**: Typesense
- **Storage**: MinIO (S3-compatible)
- **Real-time**: Socket.io
- **Containerization**: Docker + Docker Compose
- **Package Manager**: pnpm (monorepo workspace)
- **Testing**: Vitest, Playwright, Cucumber (BDD)
- **Security**: Multiple scanning tools (Gitleaks, TruffleHog, Snyk, CodeQL, Semgrep, Trivy, Checkov)

## Project Structure
- `backend/` - NestJS backend service
- `frontend/` - React frontend application
- `features/` - BDD test features
- `docs/` - Comprehensive documentation
- `k8s/` - Kubernetes deployment configs
- `scripts/` - Development and deployment scripts
- `.github/workflows/` - CI/CD pipelines

## Key Characteristics
- Monorepo structure with pnpm workspaces
- Comprehensive security scanning in CI/CD
- BDD testing methodology
- Docker-based development environment
- Microservices-ready architecture