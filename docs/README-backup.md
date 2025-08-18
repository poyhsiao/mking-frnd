# MKing Friend - Online Dating Platform Documentation

## 📖 Documentation Overview

This project adopts a microservices architecture, built with modern technology stack for an online dating platform. The documentation covers product planning, technical architecture, development guidelines, and project management.

## 📁 Documentation Structure

### 📋 Product & Planning
- [`requirements/prd.md`](./requirements/prd.md) - Product Requirements Document ⭐ Core Document
- [`mvp-priority-matrix.md`](./mvp-priority-matrix.md) - MVP Feature Priority Matrix
- [`development-tasks.md`](./development-tasks.md) - Development Tasks Todo List
- [`task-dependencies.md`](./task-dependencies.md) - Task Dependencies Diagram

### 🏗️ Technical Architecture
- [`technical-decisions.md`](./technical-decisions.md) - Technical Architecture Decision Records ⭐ Important Reference
- [`architecture/`](./architecture/) - System Architecture Design
  - [Backend Technology Stack Detailed Comparison](./architecture/backend-technology-comparison.md)
  - [Technology Decision Guide](./architecture/technology-decision-guide.md)
- [Technology Stack Specifications](./TECH_STACK.md) - Confirmed Technology Selection

### 🛠️ Development Guidelines
- [`development/`](./development/) - Development Guidelines and Standards
  - [Development Environment Setup](./development/setup.md)
  - [Implementation Plan](./development/implementation-plan.md)
  - [BDD Development Guidelines](./development/bdd-guidelines.md)
  - [Development Standards](./development/DEVELOPMENT_STANDARDS.md) ⭐ Must Read
- [`api/`](./api/) - API Documentation and Specifications
- [`database/`](./database/) - Database Design and Migration

### 🧪 Testing & Deployment
- [`testing/`](./testing/) - Testing Strategy and Standards
- [`deployment/`](./deployment/) - Deployment and Operations Documentation

### 📊 Project Management
- [`project-management/`](./project-management/) - Project Management and Task Planning

## 🚀 Quick Start

1. **Understand the Product**: Read [Product Requirements Document](./requirements/prd.md)
2. **Technical Architecture**: Review [Technical Decision Records](./technical-decisions.md)
3. **Development Planning**: Refer to [Development Tasks Todo List](./development-tasks.md)
4. **Feature Priority**: Understand [MVP Priority Matrix](./mvp-priority-matrix.md)
5. **Environment Setup**: Start with [Development Environment Setup](./development/setup.md)

## 🛠️ Technology Stack Overview

### Microservices Architecture
- **API Gateway**: Nginx/Traefik
- **Service Discovery**: Consul
- **Microservice Communication**: gRPC

### Frontend Technology
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand + React Query
- **UI Components**: Ant Design
- **Map Service**: OpenStreetMap + Leaflet

### Backend Technology
- **Framework**: Node.js + NestJS + TypeScript
- **Database**: PostgreSQL (Shared Database, Independent Schema)
- **ORM**: Prisma
- **Cache**: Redis
- **Search Engine**: Typesense
- **File Storage**: MinIO

### Deployment & Operations
- **Containerization**: Docker + Docker Compose
- **Orchestration**: Kubernetes
- **Monitoring**: Prometheus + Grafana
- **Logging**: Loki + Promtail
- **Error Tracking**: Sentry

## Development Principles

- **Behavior-Driven Development (BDD)**: All features must be tested first
- **Code Quality**: Follow PEP 8 (Python) and ESLint (JavaScript/TypeScript) standards
- **Security First**: All user inputs must be validated and sanitized
- **Complete Documentation**: All modules and functions must have clear documentation
- **Version Control**: Use Git Flow branching strategy
- **Continuous Integration**: Every commit automatically runs tests and checks

## Contact Information

For any questions or suggestions, please contact the development team.