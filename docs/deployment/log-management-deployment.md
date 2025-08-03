# MKing Friend - Log Management Deployment Guide

> **Status**: 📋 Deployment Guide | **Last Updated**: 2025-01-02

## 1. Deployment Overview

### 1.1 Selected Solution
- **Primary Solution**: Grafana Loki + Promtail
- **Integration Strategy**: Integrate with existing Grafana + Prometheus monitoring stack
- **Storage Backend**: MinIO (S3-compatible object storage)
- **Deployment Method**: Docker Compose

### 1.2 Architecture Diagram
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Applications  │    │  Docker         │    │   System Logs   │
│   (NestJS)      │    │  Containers     │    │   (Nginx etc)   │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │        Promtail          │
                    │     (Log Collector)      │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │         Loki             │
                    │    (Log Aggregator)      │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │        MinIO             │
                    │    (Object Storage)      │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │       Grafana            │
                    │  (Visualization UI)      │
                    └─────────────────────────────┘
```

## 2. Phased Deployment Plan

### 2.1 Phase 1: Infrastructure Deployment (Week 1)

#### Objectives
- Deploy Loki and Promtail services
- Configure basic log collection
- Integrate with existing Grafana

#### Prerequisites
```bash
# Ensure Docker and Docker Compose are installed
docker --version
docker-compose --version

# Create deployment directory
mkdir -p /opt/mking-friend/logging
cd /opt/mking-friend/logging
```

## 3. Deployment Commands

### 3.1 Initial Setup

```bash
# Create network
docker network create logging

# Start MinIO first
docker-compose -f docker-compose.minio.yml up -d

# Wait for MinIO to be ready, then create bucket
sleep 30
docker exec mking-minio mc alias set local http://localhost:9000 admin minio123456
docker exec mking-minio mc mb local/loki

# Start logging stack
docker-compose -f docker-compose.logging.yml up -d

# Verify services
docker-compose -f docker-compose.logging.yml ps
```

### 3.2 Health Checks

```bash
# Check Loki health
curl http://localhost:3100/ready

# Check Promtail health
curl http://localhost:9080/ready

# Check MinIO health
curl http://localhost:9000/minio/health/live
```

## 4. Maintenance and Troubleshooting

### 4.1 Common Issues

#### Loki Not Starting
```bash
# Check Loki logs
docker logs mking-loki

# Verify MinIO connectivity
docker exec mking-loki wget -qO- http://minio:9000/minio/health/live
```

#### Promtail Not Collecting Logs
```bash
# Check Promtail logs
docker logs mking-promtail

# Verify file permissions
ls -la /var/log/mking-friend/
ls -la /var/lib/docker/containers/
```

---

**Document Version**: v1.0  
**Last Updated**: 2025-01-02  
**Maintainer**: DevOps Team

**Note**: This document should be updated whenever deployment procedures change. Both English and Chinese versions must be maintained simultaneously.