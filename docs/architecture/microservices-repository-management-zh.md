# MKing Friend - 微服務倉庫管理策略

## 1. 倉庫架構概述

### 1.1 倉庫分離原則
- **獨立開發**: 每個微服務使用獨立的 Git 倉庫
- **獨立部署**: 每個服務可以獨立進行 CI/CD
- **版本控制**: 各服務獨立的版本號管理
- **團隊協作**: 不同團隊可以專注於特定服務
- **技術棧靈活性**: 每個服務可以選擇最適合的技術棧

### 1.2 倉庫列表

| 服務名稱 | Git 倉庫 | 主要職責 | 技術棧 | 端口 |
|---------|----------|----------|--------|------|
| API Gateway | `mking-friend-api-gateway` | 統一 API 入口 | NestJS + gRPC | 3000, 50000 |
| 認證服務 | `mking-friend-auth-service` | 用戶認證授權 | NestJS + Passport | 3001, 50001 |
| 用戶服務 | `mking-friend-user-service` | 用戶資料管理 | NestJS + Prisma | 3002, 50002 |
| 聊天服務 | `mking-friend-chat-service` | 即時通訊 | NestJS + Socket.io | 3003, 3004, 50003 |
| 媒體服務 | `mking-friend-media-service` | 檔案處理 | NestJS + Sharp | 3005, 50005 |
| 管理服務 | `mking-friend-admin-service` | 後台管理 | NestJS + Prisma | 3006, 50006 |
| 前端應用 | `mking-friend-frontend` | Web 前端 | React + TypeScript | 3100 |
| 管理前端 | `mking-friend-admin-frontend` | 管理後台前端 | React + Ant Design Pro | 3101 |
| 基礎設施 | `mking-friend-infrastructure` | Docker/K8s 配置 | YAML/Terraform | - |
| 共享庫 | `mking-friend-shared` | 共享代碼和類型 | TypeScript | - |

## 2. 倉庫結構標準

### 2.1 微服務倉庫標準結構
```
mking-friend-{service-name}/
├── .github/
│   └── workflows/
│       ├── ci.yml              # 持續集成
│       ├── cd.yml              # 持續部署
│       └── release.yml         # 版本發布
├── src/
│   ├── main.ts                 # 應用入口
│   ├── app.module.ts           # 主模組
│   ├── config/                 # 配置文件
│   ├── modules/                # 功能模組
│   ├── shared/                 # 共享代碼
│   ├── proto/                  # gRPC 定義
│   └── tests/                  # 測試文件
├── docker/
│   ├── Dockerfile              # 容器構建
│   ├── docker-compose.yml      # 本地開發
│   └── .dockerignore           # Docker 忽略文件
├── k8s/
│   ├── deployment.yaml         # K8s 部署配置
│   ├── service.yaml            # K8s 服務配置
│   ├── configmap.yaml          # 配置映射
│   └── secret.yaml             # 密鑰配置
├── docs/
│   ├── README.md               # 服務文檔
│   ├── API.md                  # API 文檔
│   ├── DEVELOPMENT.md          # 開發指南
│   └── DEPLOYMENT.md           # 部署指南
├── scripts/
│   ├── build.sh                # 構建腳本
│   ├── test.sh                 # 測試腳本
│   └── deploy.sh               # 部署腳本
├── .env.example                # 環境變量範例
├── .gitignore                  # Git 忽略文件
├── package.json                # 依賴管理
├── tsconfig.json               # TypeScript 配置
├── jest.config.js              # 測試配置
├── nest-cli.json               # NestJS 配置
└── CHANGELOG.md                # 變更日誌
```

### 2.2 前端倉庫標準結構
```
mking-friend-frontend/
├── .github/
│   └── workflows/
│       ├── ci.yml              # 持續集成
│       └── cd.yml              # 持續部署
├── public/
│   ├── index.html              # HTML 模板
│   └── assets/                 # 靜態資源
├── src/
│   ├── components/             # React 組件
│   ├── pages/                  # 頁面組件
│   ├── hooks/                  # 自定義 Hooks
│   ├── store/                  # 狀態管理
│   ├── services/               # API 服務
│   ├── utils/                  # 工具函數
│   ├── types/                  # TypeScript 類型
│   └── assets/                 # 資源文件
├── docker/
│   ├── Dockerfile              # 容器構建
│   └── nginx.conf              # Nginx 配置
├── k8s/
│   ├── deployment.yaml         # K8s 部署配置
│   └── service.yaml            # K8s 服務配置
├── docs/
│   ├── README.md               # 項目文檔
│   └── DEVELOPMENT.md          # 開發指南
├── .env.example                # 環境變量範例
├── .gitignore                  # Git 忽略文件
├── package.json                # 依賴管理
├── tsconfig.json               # TypeScript 配置
├── vite.config.ts              # Vite 配置
└── CHANGELOG.md                # 變更日誌
```

## 3. 開發工作流程

### 3.1 分支策略

#### 3.1.1 Git Flow 分支模型
```
master/main     # 生產環境分支
├── develop     # 開發環境分支
├── feature/*   # 功能開發分支
├── release/*   # 版本發布分支
└── hotfix/*    # 緊急修復分支
```

#### 3.1.2 分支命名規範
- **功能分支**: `feature/JIRA-123-add-user-authentication`
- **修復分支**: `bugfix/JIRA-456-fix-login-error`
- **發布分支**: `release/v1.2.0`
- **熱修復分支**: `hotfix/v1.1.1-critical-security-fix`

### 3.2 提交規範

#### 3.2.1 Conventional Commits
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### 3.2.2 提交類型
- **feat**: 新功能
- **fix**: 修復 bug
- **docs**: 文檔更新
- **style**: 代碼格式調整
- **refactor**: 代碼重構
- **test**: 測試相關
- **chore**: 構建過程或輔助工具的變動

#### 3.2.3 提交範例
```
feat(auth): add two-factor authentication

Implement TOTP-based 2FA for enhanced security:
- Add TOTP generation and validation
- Update login flow to support 2FA
- Add 2FA setup and management endpoints

Closes #123
```

### 3.3 代碼審查流程

#### 3.3.1 Pull Request 模板
```markdown
## 變更描述
簡要描述此 PR 的變更內容

## 變更類型
- [ ] 新功能
- [ ] Bug 修復
- [ ] 文檔更新
- [ ] 代碼重構
- [ ] 性能優化

## 測試
- [ ] 單元測試通過
- [ ] 集成測試通過
- [ ] 手動測試完成

## 檢查清單
- [ ] 代碼符合項目規範
- [ ] 已添加必要的測試
- [ ] 文檔已更新
- [ ] 無安全漏洞

## 相關 Issue
Closes #123
```

#### 3.3.2 審查標準
- **代碼品質**: 符合 ESLint 和 Prettier 規範
- **測試覆蓋率**: 新代碼測試覆蓋率 > 80%
- **安全性**: 無明顯安全漏洞
- **性能**: 無明顯性能問題
- **文檔**: API 變更需更新文檔

## 4. CI/CD 流程

### 4.1 持續集成 (CI)

#### 4.1.1 GitHub Actions CI 配置
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run tests
      run: npm run test:cov
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
        REDIS_URL: redis://localhost:6379
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
    
    - name: Build application
      run: npm run build
    
    - name: Run e2e tests
      run: npm run test:e2e
```

### 4.2 持續部署 (CD)

#### 4.2.1 GitHub Actions CD 配置
```yaml
# .github/workflows/cd.yml
name: CD

on:
  push:
    branches: [ main ]
    tags: [ 'v*' ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' || startsWith(github.ref, 'refs/tags/v')
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Login to Container Registry
      uses: docker/login-action@v2
      with:
        registry: ghcr.io
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v4
      with:
        images: ghcr.io/${{ github.repository }}
        tags: |
          type=ref,event=branch
          type=ref,event=tag
          type=sha,prefix={{branch}}-
    
    - name: Build and push Docker image
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max
    
    - name: Deploy to Kubernetes
      run: |
        echo "${{ secrets.KUBECONFIG }}" | base64 -d > kubeconfig
        export KUBECONFIG=kubeconfig
        kubectl set image deployment/${{ github.event.repository.name }} \
          ${{ github.event.repository.name }}=${{ steps.meta.outputs.tags }}
        kubectl rollout status deployment/${{ github.event.repository.name }}
```

## 5. 版本管理

### 5.1 語義化版本控制

#### 5.1.1 版本號格式
```
MAJOR.MINOR.PATCH

MAJOR: 不兼容的 API 變更
MINOR: 向後兼容的功能新增
PATCH: 向後兼容的問題修正
```

#### 5.1.2 版本發布流程
1. **創建發布分支**: `git checkout -b release/v1.2.0`
2. **更新版本號**: 修改 `package.json` 中的版本號
3. **更新變更日誌**: 在 `CHANGELOG.md` 中記錄變更
4. **創建 Pull Request**: 合併到 main 分支
5. **創建 Git Tag**: `git tag v1.2.0`
6. **推送標籤**: `git push origin v1.2.0`
7. **自動部署**: CI/CD 自動觸發部署

### 5.2 依賴管理

#### 5.2.1 共享依賴策略
- **共享庫倉庫**: `mking-friend-shared`
- **gRPC 定義**: 統一的 proto 文件
- **TypeScript 類型**: 共享的類型定義
- **工具函數**: 通用的工具函數

#### 5.2.2 依賴更新策略
- **定期更新**: 每月檢查並更新依賴
- **安全更新**: 立即修復安全漏洞
- **主要版本**: 謹慎升級主要版本
- **測試驗證**: 更新後進行完整測試

## 6. 本地開發環境

### 6.1 開發環境設置

#### 6.1.1 前置要求
```bash
# Node.js 18+
node --version

# Docker & Docker Compose
docker --version
docker-compose --version

# Git
git --version

# 可選：Kubernetes CLI
kubectl version --client
```

#### 6.1.2 克隆所有倉庫
```bash
#!/bin/bash
# clone-all-repos.sh

ORG="your-org"
REPOS=(
  "mking-friend-api-gateway"
  "mking-friend-auth-service"
  "mking-friend-user-service"
  "mking-friend-chat-service"
  "mking-friend-media-service"
  "mking-friend-admin-service"
  "mking-friend-frontend"
  "mking-friend-admin-frontend"
  "mking-friend-infrastructure"
  "mking-friend-shared"
)

mkdir -p mking-friend
cd mking-friend

for repo in "${REPOS[@]}"; do
  echo "Cloning $repo..."
  git clone "https://github.com/$ORG/$repo.git"
done

echo "All repositories cloned successfully!"
```

### 6.2 本地開發工作流

#### 6.2.1 啟動開發環境
```bash
# 1. 啟動基礎設施服務
cd mking-friend-infrastructure
docker-compose -f docker-compose.dev.yml up -d

# 2. 啟動各個微服務
cd ../mking-friend-auth-service
npm install
npm run start:dev

# 3. 在新終端啟動其他服務
cd ../mking-friend-user-service
npm install
npm run start:dev

# ... 重複其他服務

# 4. 啟動前端
cd ../mking-friend-frontend
npm install
npm run dev
```

#### 6.2.2 開發腳本
```bash
#!/bin/bash
# start-dev.sh - 一鍵啟動開發環境

echo "Starting MKing Friend development environment..."

# 啟動基礎設施
echo "Starting infrastructure services..."
cd infrastructure && docker-compose -f docker-compose.dev.yml up -d

# 等待服務啟動
sleep 10

# 啟動微服務
services=("auth-service" "user-service" "chat-service" "media-service" "admin-service")

for service in "${services[@]}"; do
  echo "Starting $service..."
  cd "../mking-friend-$service"
  npm run start:dev &
done

# 啟動 API Gateway
echo "Starting API Gateway..."
cd ../mking-friend-api-gateway
npm run start:dev &

# 啟動前端
echo "Starting frontend..."
cd ../mking-friend-frontend
npm run dev &

echo "All services started! Check http://localhost:3100"
```

## 7. 監控和日誌

### 7.1 服務監控

#### 7.1.1 健康檢查端點
每個微服務都應該提供健康檢查端點：
```typescript
// health.controller.ts
@Controller('health')
export class HealthController {
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.redis.pingCheck('redis'),
      () => this.grpc.pingCheck('grpc'),
    ]);
  }
}
```

#### 7.1.2 Prometheus 指標
```typescript
// metrics.service.ts
@Injectable()
export class MetricsService {
  private readonly httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status'],
  });

  private readonly grpcRequestsTotal = new Counter({
    name: 'grpc_requests_total',
    help: 'Total number of gRPC requests',
    labelNames: ['method', 'status'],
  });

  incrementHttpRequests(method: string, route: string, status: number) {
    this.httpRequestsTotal.inc({ method, route, status: status.toString() });
  }
}
```

### 7.2 日誌管理

#### 7.2.1 結構化日誌
```typescript
// logger.service.ts
@Injectable()
export class LoggerService {
  private logger = winston.createLogger({
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: 'app.log' })
    ]
  });

  log(level: string, message: string, meta?: any) {
    this.logger.log(level, message, {
      service: process.env.SERVICE_NAME,
      version: process.env.SERVICE_VERSION,
      ...meta
    });
  }
}
```

## 8. 安全考量

### 8.1 代碼安全

#### 8.1.1 依賴掃描
```yaml
# .github/workflows/security.yml
name: Security Scan

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Run npm audit
      run: npm audit --audit-level high
    
    - name: Run Snyk security scan
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
    
    - name: Run CodeQL analysis
      uses: github/codeql-action/analyze@v2
```

#### 8.1.2 密鑰管理
- **環境變量**: 敏感信息通過環境變量傳遞
- **Kubernetes Secrets**: 生產環境使用 K8s Secrets
- **密鑰輪換**: 定期輪換 API 密鑰和證書
- **最小權限**: 每個服務只獲得必要的權限

### 8.2 網絡安全

#### 8.2.1 服務間通訊
- **mTLS**: 微服務間使用雙向 TLS 認證
- **網絡隔離**: 使用 Kubernetes NetworkPolicy
- **API 限流**: 防止 DDoS 攻擊
- **輸入驗證**: 嚴格驗證所有輸入數據

## 9. 故障排除

### 9.1 常見問題

#### 9.1.1 服務啟動失敗
```bash
# 檢查端口占用
lsof -i :3001

# 檢查環境變量
env | grep DATABASE_URL

# 檢查 Docker 服務
docker-compose ps

# 查看服務日誌
docker-compose logs postgres
```

#### 9.1.2 gRPC 連接問題
```bash
# 測試 gRPC 連接
grpcurl -plaintext localhost:50001 grpc.health.v1.Health/Check

# 檢查服務註冊
consul catalog services

# 查看網絡連接
netstat -tlnp | grep 50001
```

### 9.2 調試工具

#### 9.2.1 gRPC 調試
```bash
# 安裝 grpcurl
go install github.com/fullstorydev/grpcurl/cmd/grpcurl@latest

# 列出服務
grpcurl -plaintext localhost:50001 list

# 調用服務方法
grpcurl -plaintext -d '{"email":"test@example.com"}' \
  localhost:50001 auth.AuthService/GetUser
```

#### 9.2.2 API 測試
```bash
# 使用 curl 測試 API
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# 使用 httpie
http POST localhost:3000/api/v1/auth/login \
  email=test@example.com password=password
```

## 10. 最佳實踐

### 10.1 代碼品質
- **代碼審查**: 所有代碼變更必須經過審查
- **自動化測試**: 維持高測試覆蓋率
- **代碼規範**: 使用 ESLint 和 Prettier
- **文檔更新**: 及時更新 API 文檔

### 10.2 性能優化
- **緩存策略**: 合理使用 Redis 緩存
- **數據庫優化**: 適當的索引和查詢優化
- **連接池**: 使用連接池管理數據庫連接
- **負載測試**: 定期進行性能測試

### 10.3 運維管理
- **監控告警**: 設置完善的監控和告警
- **日誌聚合**: 統一收集和分析日誌
- **備份策略**: 定期備份重要數據
- **災難恢復**: 制定災難恢復計劃

---

## 總結

本文檔詳細說明了 MKing Friend 微服務架構的倉庫管理策略，包括：

1. **倉庫分離**: 每個微服務使用獨立的 Git 倉庫
2. **標準化結構**: 統一的項目結構和配置
3. **開發工作流**: 完整的開發、測試、部署流程
4. **CI/CD 自動化**: 自動化的持續集成和部署
5. **版本管理**: 語義化版本控制和發布流程
6. **監控和安全**: 完善的監控、日誌和安全措施

通過遵循這些最佳實踐，可以確保微服務架構的高效開發和穩定運行。