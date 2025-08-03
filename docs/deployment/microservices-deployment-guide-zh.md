# MKing Friend 微服務部署指南

## 1. 概述

本文檔詳細說明 MKing Friend 微服務架構的部署流程，包括本地開發環境、測試環境和生產環境的部署策略。

### 1.1 微服務架構概覽

- **API Gateway**: 統一入口點，處理路由和負載均衡
- **認證服務**: 用戶認證和授權管理
- **用戶服務**: 用戶資料和個人資料管理
- **聊天服務**: 即時訊息和聊天室管理
- **媒體服務**: 檔案上傳和媒體處理
- **搜尋服務**: 用戶搜尋和推薦功能
- **管理服務**: 後台管理功能

### 1.2 技術棧

- **容器化**: Docker + Docker Compose
- **編排**: Kubernetes
- **服務發現**: Consul
- **監控**: Prometheus + Grafana
- **日誌**: 日誌管理系統 (Grafana Loki + Promtail + Grafana)
- **CI/CD**: GitHub Actions

## 2. 本地開發環境部署

### 2.1 前置需求

```bash
# 安裝必要工具
brew install docker
brew install docker-compose
brew install kubectl
brew install helm
brew install consul

# 驗證安裝
docker --version
docker-compose --version
kubectl version --client
helm version
consul version
```

### 2.2 克隆所有倉庫

```bash
# 創建工作目錄
mkdir mking-friend-microservices
cd mking-friend-microservices

# 克隆所有微服務倉庫
git clone https://github.com/your-org/mking-friend-api-gateway.git
git clone https://github.com/your-org/mking-friend-auth-service.git
git clone https://github.com/your-org/mking-friend-user-service.git
git clone https://github.com/your-org/mking-friend-chat-service.git
git clone https://github.com/your-org/mking-friend-media-service.git
git clone https://github.com/your-org/mking-friend-search-service.git
git clone https://github.com/your-org/mking-friend-admin-service.git
git clone https://github.com/your-org/mking-friend-frontend.git
```

### 2.3 環境變量配置

創建 `.env` 文件：

```bash
# .env
# 數據庫配置
POSTGRES_DB=mking_friend
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
DATABASE_URL=postgresql://postgres:password@postgres:5432/mking_friend

# Redis 配置
REDIS_URL=redis://redis:6379

# Typesense 配置
TYPESENSE_URL=http://typesense:8108
TYPESENSE_API_KEY=xyz
TYPESENSE_COLLECTION_PREFIX=mking_friend

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=1h

# AWS 配置
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-west-2
AWS_S3_BUCKET=mking-friend-media

# 服務端口配置
API_GATEWAY_PORT=3000
API_GATEWAY_GRPC_PORT=50000
AUTH_SERVICE_PORT=3001
AUTH_SERVICE_GRPC_PORT=50001
USER_SERVICE_PORT=3002
USER_SERVICE_GRPC_PORT=50002
CHAT_SERVICE_PORT=3003
CHAT_SERVICE_WEBSOCKET_PORT=3004
CHAT_SERVICE_GRPC_PORT=50003
MEDIA_SERVICE_PORT=3005
MEDIA_SERVICE_GRPC_PORT=50005
SEARCH_SERVICE_PORT=3006
SEARCH_SERVICE_GRPC_PORT=50006
ADMIN_SERVICE_PORT=3007
ADMIN_SERVICE_GRPC_PORT=50007

# 服務發現
CONSUL_HOST=consul
CONSUL_PORT=8500

# 監控配置
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001
```

### 2.4 Docker Compose 部署

創建主要的 `docker-compose.yml`：

```yaml
# docker-compose.yml
version: '3.8'

services:
  # 基礎設施服務
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql
    networks:
      - mking-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    networks:
      - mking-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  consul:
    image: consul:1.15
    ports:
      - "8500:8500"
      - "8600:8600/udp"
    command: agent -server -ui -node=server-1 -bootstrap-expect=1 -client=0.0.0.0
    networks:
      - mking-network
    healthcheck:
      test: ["CMD", "consul", "members"]
      interval: 30s
      timeout: 10s
      retries: 3

  # 微服務
  auth-service:
    build:
      context: ./mking-friend-auth-service
      dockerfile: Dockerfile
    ports:
      - "${AUTH_SERVICE_PORT}:${AUTH_SERVICE_PORT}"
      - "${AUTH_SERVICE_GRPC_PORT}:${AUTH_SERVICE_GRPC_PORT}"
    environment:
      - NODE_ENV=development
      - PORT=${AUTH_SERVICE_PORT}
      - GRPC_PORT=${AUTH_SERVICE_GRPC_PORT}
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
      - JWT_EXPIRES_IN=${JWT_EXPIRES_IN}
      - CONSUL_HOST=${CONSUL_HOST}
      - CONSUL_PORT=${CONSUL_PORT}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      consul:
        condition: service_healthy
    networks:
      - mking-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:${AUTH_SERVICE_PORT}/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  user-service:
    build:
      context: ./mking-friend-user-service
      dockerfile: Dockerfile
    ports:
      - "${USER_SERVICE_PORT}:${USER_SERVICE_PORT}"
      - "${USER_SERVICE_GRPC_PORT}:${USER_SERVICE_GRPC_PORT}"
    environment:
      - NODE_ENV=development
      - PORT=${USER_SERVICE_PORT}
      - GRPC_PORT=${USER_SERVICE_GRPC_PORT}
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - GRPC_AUTH_SERVICE_URL=auth-service:${AUTH_SERVICE_GRPC_PORT}
      - CONSUL_HOST=${CONSUL_HOST}
      - CONSUL_PORT=${CONSUL_PORT}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      consul:
        condition: service_healthy
      auth-service:
        condition: service_healthy
    networks:
      - mking-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:${USER_SERVICE_PORT}/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  chat-service:
    build:
      context: ./mking-friend-chat-service
      dockerfile: Dockerfile
    ports:
      - "${CHAT_SERVICE_PORT}:${CHAT_SERVICE_PORT}"
      - "${CHAT_SERVICE_WEBSOCKET_PORT}:${CHAT_SERVICE_WEBSOCKET_PORT}"
      - "${CHAT_SERVICE_GRPC_PORT}:${CHAT_SERVICE_GRPC_PORT}"
    environment:
      - NODE_ENV=development
      - PORT=${CHAT_SERVICE_PORT}
      - WEBSOCKET_PORT=${CHAT_SERVICE_WEBSOCKET_PORT}
      - GRPC_PORT=${CHAT_SERVICE_GRPC_PORT}
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - GRPC_AUTH_SERVICE_URL=auth-service:${AUTH_SERVICE_GRPC_PORT}
      - GRPC_USER_SERVICE_URL=user-service:${USER_SERVICE_GRPC_PORT}
      - CONSUL_HOST=${CONSUL_HOST}
      - CONSUL_PORT=${CONSUL_PORT}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      consul:
        condition: service_healthy
      auth-service:
        condition: service_healthy
      user-service:
        condition: service_healthy
    networks:
      - mking-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:${CHAT_SERVICE_PORT}/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  media-service:
    build:
      context: ./mking-friend-media-service
      dockerfile: Dockerfile
    ports:
      - "${MEDIA_SERVICE_PORT}:${MEDIA_SERVICE_PORT}"
      - "${MEDIA_SERVICE_GRPC_PORT}:${MEDIA_SERVICE_GRPC_PORT}"
    environment:
      - NODE_ENV=development
      - PORT=${MEDIA_SERVICE_PORT}
      - GRPC_PORT=${MEDIA_SERVICE_GRPC_PORT}
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
      - AWS_REGION=${AWS_REGION}
      - AWS_S3_BUCKET=${AWS_S3_BUCKET}
      - CONSUL_HOST=${CONSUL_HOST}
      - CONSUL_PORT=${CONSUL_PORT}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      consul:
        condition: service_healthy
    networks:
      - mking-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:${MEDIA_SERVICE_PORT}/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  admin-service:
    build:
      context: ./mking-friend-admin-service
      dockerfile: Dockerfile
    ports:
      - "${ADMIN_SERVICE_PORT}:${ADMIN_SERVICE_PORT}"
      - "${ADMIN_SERVICE_GRPC_PORT}:${ADMIN_SERVICE_GRPC_PORT}"
    environment:
      - NODE_ENV=development
      - PORT=${ADMIN_SERVICE_PORT}
      - GRPC_PORT=${ADMIN_SERVICE_GRPC_PORT}
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - GRPC_AUTH_SERVICE_URL=auth-service:${AUTH_SERVICE_GRPC_PORT}
      - GRPC_USER_SERVICE_URL=user-service:${USER_SERVICE_GRPC_PORT}
      - CONSUL_HOST=${CONSUL_HOST}
      - CONSUL_PORT=${CONSUL_PORT}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      consul:
        condition: service_healthy
      auth-service:
        condition: service_healthy
      user-service:
        condition: service_healthy
    networks:
      - mking-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:${ADMIN_SERVICE_PORT}/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  api-gateway:
    build:
      context: ./mking-friend-api-gateway
      dockerfile: Dockerfile
    ports:
      - "${API_GATEWAY_PORT}:${API_GATEWAY_PORT}"
      - "${API_GATEWAY_GRPC_PORT}:${API_GATEWAY_GRPC_PORT}"
    environment:
      - NODE_ENV=development
      - PORT=${API_GATEWAY_PORT}
      - GRPC_PORT=${API_GATEWAY_GRPC_PORT}
      - GRPC_AUTH_SERVICE_URL=auth-service:${AUTH_SERVICE_GRPC_PORT}
      - GRPC_USER_SERVICE_URL=user-service:${USER_SERVICE_GRPC_PORT}
      - GRPC_CHAT_SERVICE_URL=chat-service:${CHAT_SERVICE_GRPC_PORT}
      - GRPC_MEDIA_SERVICE_URL=media-service:${MEDIA_SERVICE_GRPC_PORT}
      - GRPC_ADMIN_SERVICE_URL=admin-service:${ADMIN_SERVICE_GRPC_PORT}
      - CONSUL_HOST=${CONSUL_HOST}
      - CONSUL_PORT=${CONSUL_PORT}
    depends_on:
      auth-service:
        condition: service_healthy
      user-service:
        condition: service_healthy
      chat-service:
        condition: service_healthy
      media-service:
        condition: service_healthy
      admin-service:
        condition: service_healthy
    networks:
      - mking-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:${API_GATEWAY_PORT}/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # 前端應用
  frontend:
    build:
      context: ./mking-friend-frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:${API_GATEWAY_PORT}
      - REACT_APP_WS_URL=ws://localhost:${CHAT_SERVICE_WEBSOCKET_PORT}
    depends_on:
      api-gateway:
        condition: service_healthy
    networks:
      - mking-network

volumes:
  postgres_data:
  redis_data:

networks:
  mking-network:
    driver: bridge
```

### 2.5 啟動本地環境

```bash
# 啟動所有服務
docker-compose up -d

# 查看服務狀態
docker-compose ps

# 查看日誌
docker-compose logs -f

# 查看特定服務日誌
docker-compose logs -f auth-service

# 停止所有服務
docker-compose down

# 停止並清除數據
docker-compose down -v
```

### 2.6 服務驗證

```bash
# 檢查服務健康狀態
curl http://localhost:3000/health  # API Gateway
curl http://localhost:3001/health  # Auth Service
curl http://localhost:3002/health  # User Service
curl http://localhost:3003/health  # Chat Service
curl http://localhost:3005/health  # Media Service
curl http://localhost:3006/health  # Admin Service

# 檢查 Consul 服務發現
curl http://localhost:8500/v1/catalog/services

# 檢查 Swagger 文檔
open http://localhost:3000/api/docs  # API Gateway
open http://localhost:3001/api/docs  # Auth Service
open http://localhost:3002/api/docs  # User Service
```

## 3. 監控和日誌

### 3.1 監控配置

創建 `docker-compose.monitoring.yml`：

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
    networks:
      - mking-network

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources
    networks:
      - mking-network

  typesense:
    image: typesense/typesense:0.25.1
    environment:
      - TYPESENSE_DATA_DIR=/data
      - TYPESENSE_API_KEY=xyz
      - TYPESENSE_ENABLE_CORS=true
    ports:
      - "8108:8108"
    volumes:
      - typesense_data:/data
    networks:
      - mking-network

  loki:
    image: grafana/loki:2.9.0
    ports:
      - "3100:3100"
    command: -config.file=/etc/loki/local-config.yaml
    volumes:
      - loki_data:/loki
    networks:
      - mking-network

  promtail:
    image: grafana/promtail:2.9.0
    volumes:
      - /var/log:/var/log:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - ./monitoring/promtail:/etc/promtail
    command: -config.file=/etc/promtail/config.yml
    depends_on:
      - loki
    networks:
      - mking-network

volumes:
  prometheus_data:
  grafana_data:
  typesense_data:
  loki_data:

networks:
  mking-network:
    external: true
```

### 3.2 啟動監控服務

```bash
# 啟動監控服務
docker-compose -f docker-compose.monitoring.yml up -d

# 訪問監控界面
open http://localhost:9090  # Prometheus
open http://localhost:3001  # Grafana (admin/admin)
open http://localhost:5601  # Kibana
```

## 4. Kubernetes 部署

### 4.1 Kubernetes 配置

創建命名空間：

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: mking-friend
  labels:
    name: mking-friend
```

### 4.2 ConfigMap 和 Secret

```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: mking-friend-config
  namespace: mking-friend
data:
  NODE_ENV: "production"
  CONSUL_HOST: "consul"
  CONSUL_PORT: "8500"
  POSTGRES_DB: "mking_friend"
  POSTGRES_USER: "postgres"
  AWS_REGION: "us-west-2"
  AWS_S3_BUCKET: "mking-friend-media"
---
apiVersion: v1
kind: Secret
metadata:
  name: mking-friend-secrets
  namespace: mking-friend
type: Opaque
data:
  POSTGRES_PASSWORD: cGFzc3dvcmQ=  # base64 encoded 'password'
  JWT_SECRET: eW91ci1zdXBlci1zZWNyZXQtand0LWtleQ==  # base64 encoded
  AWS_ACCESS_KEY_ID: eW91ci1hY2Nlc3Mta2V5  # base64 encoded
  AWS_SECRET_ACCESS_KEY: eW91ci1zZWNyZXQta2V5  # base64 encoded
```

### 4.3 部署微服務

```yaml
# k8s/auth-service.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
  namespace: mking-friend
  labels:
    app: auth-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: auth-service
  template:
    metadata:
      labels:
        app: auth-service
    spec:
      containers:
      - name: auth-service
        image: mking-friend/auth-service:latest
        ports:
        - containerPort: 3001
        - containerPort: 50001
        env:
        - name: NODE_ENV
          valueFrom:
            configMapKeyRef:
              name: mking-friend-config
              key: NODE_ENV
        - name: PORT
          value: "3001"
        - name: GRPC_PORT
          value: "50001"
        - name: DATABASE_URL
          value: "postgresql://$(POSTGRES_USER):$(POSTGRES_PASSWORD)@postgres:5432/$(POSTGRES_DB)"
        - name: POSTGRES_USER
          valueFrom:
            configMapKeyRef:
              name: mking-friend-config
              key: POSTGRES_USER
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mking-friend-secrets
              key: POSTGRES_PASSWORD
        - name: POSTGRES_DB
          valueFrom:
            configMapKeyRef:
              name: mking-friend-config
              key: POSTGRES_DB
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: mking-friend-secrets
              key: JWT_SECRET
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: auth-service
  namespace: mking-friend
spec:
  selector:
    app: auth-service
  ports:
  - name: http
    port: 3001
    targetPort: 3001
  - name: grpc
    port: 50001
    targetPort: 50001
  type: ClusterIP
```

### 4.4 部署命令

```bash
# 應用所有 Kubernetes 配置
kubectl apply -f k8s/

# 查看部署狀態
kubectl get pods -n mking-friend
kubectl get services -n mking-friend

# 查看日誌
kubectl logs -f deployment/auth-service -n mking-friend

# 端口轉發進行測試
kubectl port-forward service/api-gateway 3000:3000 -n mking-friend
```

## 5. CI/CD 流程

### 5.1 GitHub Actions 工作流程

```yaml
# .github/workflows/deploy-microservice.yml
name: Deploy Microservice

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'pnpm'

    - name: Install pnpm
      run: npm install -g pnpm

    - name: Install dependencies
      run: pnpm install --frozen-lockfile

    - name: Run linting
      run: pnpm lint

    - name: Run tests
      run: pnpm test

    - name: Run e2e tests
      run: pnpm test:e2e

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    permissions:
      contents: read
      packages: write
    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Log in to Container Registry
      uses: docker/login-action@v2
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}

    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v4
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=sha,prefix={{branch}}-
          type=raw,value=latest,enable={{is_default_branch}}

    - name: Build and push Docker image
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Setup kubectl
      uses: azure/setup-kubectl@v3
      with:
        version: 'latest'

    - name: Configure kubectl
      run: |
        echo "${{ secrets.KUBECONFIG }}" | base64 -d > kubeconfig
        export KUBECONFIG=kubeconfig

    - name: Deploy to Kubernetes
      run: |
        export KUBECONFIG=kubeconfig
        kubectl set image deployment/${{ github.event.repository.name }} \
          ${{ github.event.repository.name }}=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} \
          -n mking-friend
        kubectl rollout status deployment/${{ github.event.repository.name }} -n mking-friend

    - name: Verify deployment
      run: |
        export KUBECONFIG=kubeconfig
        kubectl get pods -n mking-friend
        kubectl get services -n mking-friend
```

## 6. 生產環境部署

### 6.1 生產環境配置

```yaml
# k8s/production/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: mking-friend-ingress
  namespace: mking-friend
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - api.mking-friend.com
    - app.mking-friend.com
    secretName: mking-friend-tls
  rules:
  - host: api.mking-friend.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-gateway
            port:
              number: 3000
  - host: app.mking-friend.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 3000
```

### 6.2 自動擴展配置

```yaml
# k8s/production/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: auth-service-hpa
  namespace: mking-friend
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: auth-service
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

## 7. 故障排除

### 7.1 常見問題

1. **服務無法啟動**：
   ```bash
   # 檢查服務日誌
   docker-compose logs service-name
   kubectl logs deployment/service-name -n mking-friend
   
   # 檢查服務健康狀態
   curl http://localhost:port/health
   ```

2. **gRPC 連接失敗**：
   ```bash
   # 檢查服務發現
   curl http://localhost:8500/v1/catalog/services
   
   # 測試 gRPC 連接
   grpcurl -plaintext localhost:50001 list
   ```

3. **數據庫連接問題**：
   ```bash
   # 檢查數據庫狀態
   docker-compose exec postgres pg_isready
   
   # 檢查連接字符串
   echo $DATABASE_URL
   ```

### 7.2 監控和告警

```yaml
# monitoring/alerts.yml
groups:
- name: mking-friend-alerts
  rules:
  - alert: ServiceDown
    expr: up == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Service {{ $labels.instance }} is down"
      description: "{{ $labels.instance }} has been down for more than 1 minute."

  - alert: HighCPUUsage
    expr: (100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)) > 80
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High CPU usage on {{ $labels.instance }}"
      description: "CPU usage is above 80% for more than 5 minutes."

  - alert: HighMemoryUsage
    expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100 > 90
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High memory usage on {{ $labels.instance }}"
      description: "Memory usage is above 90% for more than 5 minutes."
```

## 8. 安全考量

### 8.1 網絡安全

- 使用 TLS/SSL 加密所有外部通訊
- 內部服務間使用 mTLS
- 實施網絡策略限制服務間通訊
- 定期更新容器映像和依賴

### 8.2 秘密管理

```bash
# 使用 Kubernetes Secrets
kubectl create secret generic mking-friend-secrets \
  --from-literal=jwt-secret=your-secret \
  --from-literal=db-password=your-password \
  -n mking-friend

# 使用外部秘密管理工具 (如 HashiCorp Vault)
# 配置 Vault Agent 或 CSI Secret Store Driver
```

## 9. 備份和恢復

### 9.1 數據庫備份

```bash
# 自動備份腳本
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/mking_friend_$DATE.sql"

# 創建備份
docker-compose exec postgres pg_dump -U postgres mking_friend > $BACKUP_FILE

# 壓縮備份
gzip $BACKUP_FILE

# 上傳到雲端存儲
aws s3 cp $BACKUP_FILE.gz s3://mking-friend-backups/

# 清理舊備份 (保留 30 天)
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete
```

### 9.2 災難恢復

```bash
# 恢復數據庫
#!/bin/bash
BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file>"
  exit 1
fi

# 停止服務
docker-compose stop

# 恢復數據庫
gunzip -c $BACKUP_FILE | docker-compose exec -T postgres psql -U postgres -d mking_friend

# 重啟服務
docker-compose up -d
```

## 10. 總結

本部署指南涵蓋了 MKing Friend 微服務架構的完整部署流程，包括：

- 本地開發環境設置
- Docker Compose 部署
- Kubernetes 生產環境部署
- CI/CD 自動化流程
- 監控和日誌管理
- 安全配置和最佳實踐
- 故障排除和災難恢復

遵循這些指南可以確保微服務的穩定部署和高效運維。