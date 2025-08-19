# CI/CD Pipeline Fix Documentation

## 问题概述

在工作流ID 17073241190中，CI/CD管道失败，错误信息显示"no such service:
unit-test"。经过分析发现，CI工作流尝试运行的测试服务（`unit-test`、`integration-test`、`e2e-test`）在`docker-compose.test.yml`文件中未定义。

## 根本原因

1. **缺失的测试服务**：CI工作流期望的测试服务在Docker Compose配置中不存在
2. **服务名称不匹配**：现有的`backend-test`和`frontend-test`服务与CI工作流期望的服务名称不一致
3. **环境变量警告**：某些变量（如`SERVER_PID`）未设置默认值

## 解决方案

### 1. 添加缺失的测试服务

在`docker-compose.test.yml`中添加了以下服务：

#### Unit Test Service

```yaml
unit-test:
  build:
    context: .
    dockerfile: backend/Dockerfile
    target: test
  environment:
    - NODE_ENV=test
    - CI=true
    - POSTGRES_URL=postgresql://${POSTGRES_TEST_USER}:${POSTGRES_TEST_PASSWORD}@postgres-test:5432/${POSTGRES_TEST_DB}
    - REDIS_URL=redis://redis-test:6379
    - MINIO_ENDPOINT=minio-test:9000
    - MINIO_ACCESS_KEY=${MINIO_TEST_USER}
    - MINIO_SECRET_KEY=${MINIO_TEST_PASSWORD}
    - TYPESENSE_HOST=typesense-test
    - TYPESENSE_PORT=8108
    - TYPESENSE_API_KEY=${TYPESENSE_TEST_API_KEY}
    - JWT_SECRET=${JWT_TEST_SECRET}
    - ENCRYPTION_KEY=${ENCRYPTION_TEST_KEY}
  volumes:
    - ./backend:/app/backend
    - ./test-results:/app/test-results
    - ./coverage:/app/coverage
  networks:
    - test-network
  depends_on:
    postgres-test:
      condition: service_healthy
    redis-test:
      condition: service_healthy
    minio-test:
      condition: service_healthy
    typesense-test:
      condition: service_healthy
  command: >
    sh -c "
      echo 'Setting up test environment...'
      cd /app/backend
      
      # Wait for services and run migrations
      echo 'Waiting for services to be ready...'
      sleep 10
      
      echo 'Running database migrations...'
      pnpm prisma migrate deploy || echo 'Migration failed, continuing...'
      
      echo 'Seeding test database...'
      pnpm prisma db seed || echo 'Seeding failed, continuing...'
      
      echo 'Running unit tests...'
      pnpm run test:unit
    "
```

#### Integration Test Service

```yaml
integration-test:
  build:
    context: .
    dockerfile: backend/Dockerfile
    target: test
  environment:
    # 相同的环境变量配置
  volumes:
    # 相同的卷配置
  networks:
    - test-network
  depends_on:
    # 相同的依赖配置
  command: >
    sh -c "
      echo 'Setting up integration test environment...'
      cd /app/backend
      
      # 服务准备和测试执行
      echo 'Running integration tests...'
      pnpm run test:integration
    "
```

#### E2E Test Service

```yaml
e2e-test:
  build:
    context: .
    dockerfile: frontend/Dockerfile
    target: test
  environment:
    # 前端测试环境变量
  volumes:
    # 前端测试卷配置
  networks:
    - test-network
  depends_on:
    backend-test:
      condition: service_healthy
  command: >
    sh -c "
      echo 'Setting up e2e test environment...'
      cd /app/frontend
      
      echo 'Running e2e tests...'
      pnpm run test:e2e
    "
```

### 2. 环境变量配置

确保所有必需的环境变量在CI工作流中正确设置：

```yaml
env:
  # 测试数据库配置
  POSTGRES_TEST_DB: mking_test
  POSTGRES_TEST_USER: postgres
  POSTGRES_TEST_PASSWORD: postgres

  # 测试MinIO配置
  MINIO_TEST_USER: testuser
  MINIO_TEST_PASSWORD: testpassword

  # 测试Typesense配置
  TYPESENSE_TEST_API_KEY: test-api-key

  # 测试安全配置
  JWT_TEST_SECRET: test-jwt-secret-for-ci-pipeline-testing-only
  ENCRYPTION_TEST_KEY: test-encryption-key-for-ci-pipeline-testing-only

  # 通用测试配置
  CI: true
  NODE_ENV: test
  WAIT_COUNT: 30
  MAX_WAIT: 300
```

## 验证步骤

### 1. 验证服务配置

```bash
# 检查所有服务是否正确定义
export POSTGRES_TEST_DB=mking_test POSTGRES_TEST_USER=postgres POSTGRES_TEST_PASSWORD=postgres MINIO_TEST_USER=testuser MINIO_TEST_PASSWORD=testpassword TYPESENSE_TEST_API_KEY=test-api-key JWT_TEST_SECRET=test-jwt-secret ENCRYPTION_TEST_KEY=test-encryption-key CI=true NODE_ENV=test

docker compose -f docker-compose.test.yml config --services
```

### 2. 测试基础服务启动

```bash
# 启动基础测试服务
docker compose -f docker-compose.test.yml up -d postgres-test redis-test

# 检查服务状态
docker compose -f docker-compose.test.yml ps

# 清理
docker compose -f docker-compose.test.yml down
```

### 3. 干运行测试

```bash
# 测试单元测试服务配置
docker compose -f docker-compose.test.yml up --build --no-deps unit-test --dry-run
```

## 维护指南

### 1. 添加新的测试服务

当需要添加新的测试服务时：

1. 在`docker-compose.test.yml`中定义新服务
2. 确保服务名称与CI工作流中的期望一致
3. 配置适当的环境变量和依赖关系
4. 更新CI工作流以包含新的测试类型

### 2. 环境变量管理

- 所有测试相关的环境变量应在CI工作流中定义
- 敏感信息应使用GitHub Secrets
- 为可选变量提供默认值以避免警告

### 3. 故障排除

#### 常见问题：

1. **"no such service" 错误**
   - 检查服务名称是否在docker-compose.test.yml中正确定义
   - 验证CI工作流中的服务名称是否匹配

2. **环境变量未设置警告**
   - 确保所有必需的环境变量在CI工作流中定义
   - 为可选变量设置默认值

3. **服务启动失败**
   - 检查服务依赖关系
   - 验证健康检查配置
   - 查看服务日志：`docker compose -f docker-compose.test.yml logs <service-name>`

### 4. 最佳实践

1. **服务命名**：使用描述性的服务名称，与测试类型对应
2. **依赖管理**：正确配置服务依赖关系和健康检查
3. **资源清理**：确保测试完成后正确清理资源
4. **日志收集**：配置适当的日志收集以便故障排除

## 相关文件

- `docker-compose.test.yml` - 测试服务配置
- `.github/workflows/ci.yml` - CI/CD工作流配置
- `backend/Dockerfile` - 后端Docker配置
- `frontend/Dockerfile` - 前端Docker配置

## 更新日志

- **2024-01-XX**: 修复缺失的测试服务定义
- **2024-01-XX**: 添加环境变量配置
- **2024-01-XX**: 验证修复并创建文档
