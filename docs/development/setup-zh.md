# MKing Friend - 開發環境設置

## 1. 系統需求

### 1.1 基礎環境
- **Node.js**: v18.0.0 或更高版本
- **npm**: v8.0.0 或更高版本
- **Git**: v2.30.0 或更高版本
- **Docker**: v20.10.0 或更高版本
- **Docker Compose**: v2.0.0 或更高版本

### 1.2 開發工具
- **IDE**: VS Code (推薦) 或 WebStorm
- **資料庫工具**: pgAdmin 或 DBeaver
- **API測試**: Postman 或 Insomnia
- **版本控制**: Git + GitHub

### 1.3 開發規範

**重要**: 開始開發前，請務必閱讀並遵循以下規範：

- 📋 [開發規範](./DEVELOPMENT_STANDARDS.md) - 包含代碼風格、包管理等規範
- 📝 [變更追蹤規範](./DEVELOPMENT_STANDARDS.md#變更追蹤與文檔更新規範) - **強制性**文檔更新要求
- 🔄 每次任務完成後必須更新 `CHANGELOG.md` 和相關文檔
- ✅ 所有提交都需要通過代碼審查和文檔檢查

## 2. 專案結構

```
mking-frnd/
├── frontend/                 # React前端應用
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── Dockerfile
├── backend/                  # NestJS後端服務
│   ├── src/
│   │   ├── auth/            # 認證模組
│   │   ├── users/           # 用戶模組
│   │   ├── chat/            # 聊天模組
│   │   ├── media/           # 媒體模組
│   │   ├── common/          # 共用模組
│   │   ├── config/          # 配置模組
│   │   ├── database/        # 資料庫模組
│   │   ├── app.module.ts    # 根模組
│   │   └── main.ts          # 應用入口
│   ├── test/                # 測試檔案
│   ├── package.json
│   ├── nest-cli.json        # NestJS CLI配置
│   ├── tsconfig.json        # TypeScript配置
│   └── Dockerfile
├── database/                 # 資料庫相關
│   ├── migrations/          # Prisma遷移檔案
│   ├── seeds/               # 測試資料
│   └── schema.prisma        # 資料庫Schema
├── docs/                     # 專案文檔
├── docker-compose.yml        # 本地開發環境
├── .env.example             # 環境變數範例
└── README.md
```

## 3. 環境設置步驟

### 3.1 克隆專案
```bash
git clone https://github.com/kimhsiao/mking-frnd.git
cd mking-frnd
```

### 3.2 環境變數設置
```bash
# 複製環境變數範例檔案
cp .env.example .env

# 編輯環境變數
vim .env
```

### 3.3 環境變數配置
```bash
# .env 檔案內容

# 資料庫設定
DATABASE_URL="postgresql://postgres:password@localhost:5432/mking_frnd"
REDIS_URL="redis://localhost:6379"

# JWT設定
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
REFRESH_TOKEN_SECRET="your-refresh-token-secret"

# Keycloak OAuth 設定
KEYCLOAK_URL="http://localhost:8080"
KEYCLOAK_REALM="mking-frnd"
KEYCLOAK_CLIENT_ID="mking-frnd-client"
KEYCLOAK_CLIENT_SECRET="your-keycloak-client-secret"

# MinIO 檔案存儲設定
MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_ACCESS_KEY="admin"
MINIO_SECRET_KEY="password123"
MINIO_BUCKET_NAME="mking-frnd-media"
MINIO_USE_SSL="false"

# SMTP 郵件設定 (開發環境使用 MailHog)
SMTP_HOST="localhost"
SMTP_PORT="1025"
SMTP_SECURE="false"
SMTP_USER=""
SMTP_PASSWORD=""
SMTP_FROM_EMAIL="noreply@mking.local"
SMTP_FROM_NAME="MKing Friend"
EMAIL_ENABLED="true"
EMAIL_QUEUE_ENABLED="true"
EMAIL_RATE_LIMIT="100"

# 應用設定
NODE_ENV="development"
PORT="3000"
FRONTEND_URL="http://localhost:3001"

# 分析服務設定
PLAUSIBLE_URL="http://localhost:8000"
PLAUSIBLE_DOMAIN="localhost:3001"

# 監控服務設定
GRAFANA_URL="http://localhost:3000"
PROMETHEUS_URL="http://localhost:9090"

# Sentry 錯誤追蹤 (Self-hosted)
SENTRY_DSN="http://localhost:9001/your-project-id"
```

### 3.4 使用Docker快速啟動
```bash
# 啟動所有服務（資料庫、Redis、後端、前端）
docker-compose up -d

# 查看服務狀態
docker-compose ps

# 查看日誌
docker-compose logs -f
```

### 3.5 手動設置（不使用Docker）

#### 3.5.1 安裝依賴
```bash
# 安裝NestJS CLI（全域）
npm install -g @nestjs/cli

# 安裝後端依賴
cd backend
npm install

# 安裝前端依賴
cd ../frontend
npm install
```

#### 3.5.2 資料庫設置
```bash
# 安裝PostgreSQL（macOS）
brew install postgresql
brew services start postgresql

# 創建資料庫
psql postgres
CREATE DATABASE mking_frnd;
CREATE USER mking_user WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE mking_frnd TO mking_user;
\q

# 安裝Redis
brew install redis
brew services start redis
```

#### 3.5.3 資料庫遷移
```bash
cd backend

# 生成Prisma客戶端
npx prisma generate

# 執行資料庫遷移
npx prisma migrate dev

# 填充測試資料
npx prisma db seed
```

#### 3.5.4 啟動服務
```bash
# 啟動後端服務（開發模式）
cd backend
npm run start:dev

# 新開終端，啟動前端服務
cd frontend
npm start
```

## 4. 開發工具配置

### 4.1 VS Code擴展
```json
// .vscode/extensions.json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml",
    "ms-vscode-remote.remote-containers"
  ]
}
```

### 4.2 VS Code設定
```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "emmet.includeLanguages": {
    "javascript": "javascriptreact"
  }
}
```

### 4.3 Prettier配置
```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### 4.4 ESLint配置
```json
// .eslintrc.json
{
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "no-console": "warn",
    "no-unused-vars": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn"
  }
}
```

## 5. 測試環境設置

### 5.1 測試資料庫
```bash
# 創建測試資料庫
psql postgres
CREATE DATABASE mking_frnd_test;
GRANT ALL PRIVILEGES ON DATABASE mking_frnd_test TO mking_user;
\q

# 設置測試環境變數
echo 'DATABASE_URL="postgresql://mking_user:password@localhost:5432/mking_frnd_test"' > .env.test
```

### 5.2 Jest配置
```json
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
};
```

### 5.3 測試設置檔案
```typescript
// tests/setup.ts
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

beforeAll(async () => {
  // 執行測試資料庫遷移
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL },
  });
});

beforeEach(async () => {
  // 清理測試資料
  await prisma.message.deleteMany();
  await prisma.chatParticipant.deleteMany();
  await prisma.chatRoom.deleteMany();
  await prisma.match.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.like.deleteMany();
  await prisma.mediaFile.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

## 6. 開發流程

### 6.1 Git工作流程
```bash
# 創建功能分支
git checkout -b feature/user-authentication

# 提交變更
git add .
git commit -m "feat: implement user authentication"

# 推送到遠端
git push origin feature/user-authentication

# 創建Pull Request
# 在GitHub上創建PR並等待代碼審查
```

### 6.2 提交訊息規範
```
type(scope): description

[optional body]

[optional footer]
```

**類型 (type)**:
- `feat`: 新功能
- `fix`: 錯誤修復
- `docs`: 文檔更新
- `style`: 代碼格式調整
- `refactor`: 代碼重構
- `test`: 測試相關
- `chore`: 建構過程或輔助工具變動

### 6.3 代碼審查檢查清單
- [ ] 代碼符合專案風格指南
- [ ] 所有測試通過
- [ ] 測試覆蓋率達到80%以上
- [ ] 沒有安全漏洞
- [ ] 效能影響評估
- [ ] 文檔已更新

## 7. 常見問題解決

### 7.1 資料庫連接問題
```bash
# 檢查PostgreSQL服務狀態
brew services list | grep postgresql

# 重啟PostgreSQL
brew services restart postgresql

# 檢查連接
psql -h localhost -U mking_user -d mking_frnd
```

### 7.2 端口衝突
```bash
# 查看端口使用情況
lsof -i :3000

# 終止佔用端口的進程
kill -9 <PID>
```

### 7.3 依賴安裝問題
```bash
# 清理npm快取
npm cache clean --force

# 刪除node_modules重新安裝
rm -rf node_modules package-lock.json
npm install
```

### 7.4 Docker問題
```bash
# 重建容器
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# 查看容器日誌
docker-compose logs <service-name>
```

## 8. 效能監控

### 8.1 本地監控工具
```bash
# 安裝監控工具
npm install -g clinic

# 效能分析
clinic doctor -- node src/index.js
clinic flame -- node src/index.js
```

### 8.2 Grafana Loki 日誌監控
基於推薦的 Grafana Loki + Promtail 方案進行日誌管理：

```bash
# 啟動完整監控棧 (包含 Loki)
docker-compose up -d

# 訪問監控服務
# Grafana: http://localhost:3000 (admin/admin123)
# Prometheus: http://localhost:9090
# Loki: http://localhost:3100
# Promtail: http://localhost:9080
```

**日誌查詢範例 (LogQL)**:
```logql
# 查看後端服務錯誤日誌
{service="mking-backend", level="error"}

# 查看特定時間範圍的日誌
{service="mking-backend"} |= "login" [5m]

# 統計錯誤率
sum(rate({service="mking-backend", level="error"}[5m])) / sum(rate({service="mking-backend"}[5m]))
```

### 8.3 資料庫效能
```sql
-- 查看慢查詢
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- 查看索引使用情況
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

## 9. 部署準備

### 9.1 生產環境檢查
- [ ] 環境變數已設置
- [ ] 資料庫遷移已執行
- [ ] SSL憑證已配置
- [ ] 監控和日誌已設置
- [ ] 備份策略已實施

### 9.2 部署腳本
```bash
#!/bin/bash
# deploy.sh

set -e

echo "開始部署..."

# 建構Docker映像
docker build -t mking-frnd/backend:latest ./backend
docker build -t mking-frnd/frontend:latest ./frontend

# 推送到容器註冊表
docker push mking-frnd/backend:latest
docker push mking-frnd/frontend:latest

# 部署到Kubernetes
kubectl apply -f k8s/

echo "部署完成！"
```

這個開發環境設置指南提供了完整的本地開發環境配置，確保所有開發者都能快速上手並遵循統一的開發標準。