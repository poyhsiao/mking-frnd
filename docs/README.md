# MKing Friend - Online Dating Platform Documentation

## 📖 Documentation Overview

This project adopts a microservices architecture and uses a modern technology stack to build an online dating platform. The documentation covers all aspects including product planning, technical architecture, development guidelines, and project management.

## 📁 Documentation Structure

### 📋 Product & Planning
- [`requirements/prd.md`](./requirements/prd.md) - Product Requirements Document ⭐ Core Document
- [`mvp-priority-matrix.md`](./mvp-priority-matrix.md) - MVP Feature Priority Matrix
- [`development-tasks.md`](./development-tasks.md) - Development Tasks Todo List
- [`task-dependencies.md`](./task-dependencies.md) - Task Dependency Graph
- [`CHANGELOG.md`](./CHANGELOG.md) - Change Log and Version History

### 🏗️ Technical Architecture
- [`technical-decisions.md`](./technical-decisions.md) - Technical Architecture Decision Records ⭐ Important Reference
- [`architecture/`](./architecture/) - System Architecture Design
  - [Backend Technology Stack Detailed Comparison](./architecture/backend-technology-comparison.md)
  - [Technology Decision Guide](./architecture/technology-decision-guide.md)
  - [Microservices Repository Management](./architecture/microservices-repository-management.md)
  - [System Architecture Overview](./architecture/system-architecture.md)
- [Technology Stack Specifications](./TECH_STACK.md) - Confirmed Technology Selection

### 🛠️ Development Guidelines
- [`development-environment-setup.md`](./development-environment-setup.md) - ✅ Task 1.1 Complete - Development Environment Setup
- [`deployment-guide.md`](./deployment-guide.md) - Complete Deployment Instructions
- [`docker-best-practices.md`](./docker-best-practices.md) - Docker Optimization Guidelines
- [`development/`](./development/) - Development Guidelines and Standards
  - [Development Environment Setup](./development/setup.md)
  - [Implementation Plan](./development/implementation-plan.md)
  - [BDD Development Guidelines](./development/bdd-guidelines.md)
  - [Development Standards](./development/DEVELOPMENT_STANDARDS.md) ⭐ Must Read
  - [Microservices Development Guide](./development/microservices-development-guide.md)
- [`api/`](./api/) - API Documentation and Specifications
- [`database/`](./database/) - Database Design and Migration

### 🧪 Testing & Deployment
- [`testing/`](./testing/) - Testing Strategy and Standards
- [`deployment/`](./deployment/) - Deployment and Operations Documentation
- [`codecov-fix.md`](./codecov-fix.md) - Codecov Integration Fix Documentation ✅ Enhanced with Action v5
- [`codecov-fix-zh.md`](./codecov-fix-zh.md) - Codecov 集成修復文檔 ✅ 升級到 Action v5

### 📊 Project Management
- [`project-management/`](./project-management/) - Project Management and Task Planning

## 🚀 Quick Start

1. **Understand the Product**: Read the [Product Requirements Document](./requirements/prd.md)
2. **Technical Architecture**: Review [Technical Decision Records](./technical-decisions.md)
3. **Development Planning**: Refer to [Development Tasks Todo List](./development-tasks.md)
4. **Feature Priority**: Understand [MVP Priority Matrix](./mvp-priority-matrix.md)
5. **Environment Setup**: ✅ **COMPLETED** - Use automated setup with [`../scripts/setup-dev.sh`](../scripts/setup-dev.sh)
6. **Testing**: Run tests with [`../scripts/run-tests.sh`](../scripts/run-tests.sh)
7. **Deployment**: Follow [Deployment Guide](./deployment-guide.md) for Docker/Docker Compose deployment

### 🎯 Task 1.1 Status: ✅ COMPLETED

The development environment setup is now fully automated and ready for use. All Docker configurations, CI/CD pipelines, and development tools have been implemented according to best practices.

## 🛠️ Technology Stack Overview

### Microservices Architecture
- **API Gateway**: Nginx/Traefik
- **Service Discovery**: Consul
- **Load Balancer**: Nginx
- **Message Queue**: Redis/RabbitMQ

### Backend Services
- **Framework**: NestJS (Node.js/TypeScript)
- **Database**: PostgreSQL (Primary), Redis (Cache)
- **ORM**: Prisma
- **Authentication**: JWT + OAuth 2.0
- **File Storage**: MinIO (S3-compatible)

### Frontend
- **Framework**: React 18 + TypeScript
- **UI Library**: Ant Design
- **State Management**: Zustand
- **Build Tool**: Vite
- **Testing**: Jest + React Testing Library

### DevOps & Infrastructure
- **Containerization**: Docker + Docker Compose
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **CI/CD**: GitHub Actions
- **Package Manager**: pnpm (Workspace)

## 📚 Key Features

- **User Management**: Registration, authentication, profile management
- **Matching System**: AI-powered recommendation engine
- **Real-time Chat**: WebSocket-based messaging
- **Geolocation Services**: Location-based matching
- **Content Moderation**: Automated and manual content review
- **Admin Dashboard**: Comprehensive management interface
- **Multi-language Support**: i18n/l10n implementation

## 🔗 Important Links

- [Change Log](./CHANGELOG.md) - Track all project changes
- [Development Standards](./development/DEVELOPMENT_STANDARDS.md) - Mandatory development guidelines
- [API Specifications](./api/) - Complete API documentation
- [Deployment Guide](./deployment/) - Production deployment instructions

---

**Project Status**: 🚧 In Development  
**Architecture**: Microservices  
**Last Updated**: 2025-01-02  
**Maintainer**: Development Team