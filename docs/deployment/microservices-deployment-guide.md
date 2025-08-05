# MKing Friend Microservices Deployment Guide

## 1. Overview

This document details the deployment process for the MKing Friend microservices architecture, including deployment strategies for local development, testing, and production environments.

### 1.1 Microservices Architecture Overview

- **API Gateway**: Unified entry point, handling routing and load balancing
- **Auth Service**: User authentication and authorization management
- **User Service**: User data and profile management
- **Chat Service**: Real-time messaging and chat room management
- **Media Service**: File upload and media processing
- **Search Service**: User search and recommendation features
- **Admin Service**: Backend administration features

### 1.2 Technology Stack

- **Containerization**: Docker + Docker Compose
- **Orchestration**: Kubernetes
- **Service Discovery**: Consul
- **Monitoring**: Prometheus + Grafana
- **Logging**: Log management system (Grafana Loki + Promtail + Grafana)
- **CI/CD**: GitHub Actions

## 2. Local Development Environment Deployment

### 2.1 Prerequisites

```bash
# Install necessary tools
brew install docker
brew install docker-compose
brew install kubectl
brew install helm
brew install consul

# Verify installation
docker --version
docker-compose --version
kubectl version --client
helm version
consul version
```

### 2.2 Clone All Repositories

```bash
# Create working directory
mkdir mking-friend-microservices
cd mking-friend-microservices

# Clone repositories
git clone https://github.com/your-org/mking-friend-api-gateway.git
git clone https://github.com/your-org/mking-friend-auth-service.git
git clone https://github.com/your-org/mking-friend-user-service.git
git clone https://github.com/your-org/mking-friend-chat-service.git
git clone https://github.com/your-org/mking-friend-media-service.git
git clone https://github.com/your-org/mking-friend-search-service.git
git clone https://github.com/your-org/mking-friend-admin-service.git
git clone https://github.com/your-org/mking-friend-frontend.git
```

---

**Document Version**: v1.0  
**Last Updated**: 2025-01-02  
**Maintainer**: DevOps Team

**Note**: This document should be updated whenever deployment procedures change. Both English and Chinese versions must be maintained simultaneously.