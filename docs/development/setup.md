# MKing Friend - Development Environment Setup

## 1. System Requirements

### 1.1 Basic Environment
- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher
- **Git**: v2.30.0 or higher
- **Docker**: v20.10.0 or higher
- **Docker Compose**: v2.0.0 or higher

### 1.2 Development Tools
- **IDE**: VS Code (recommended) or WebStorm
- **Database Tools**: pgAdmin or DBeaver
- **API Testing**: Postman or Insomnia
- **Version Control**: Git + GitHub

### 1.3 Development Standards

**Important**: Before starting development, please read and follow these standards:

- 📋 [Development Standards](./DEVELOPMENT_STANDARDS.md) - Includes code style, package management standards
- 📝 [Change Tracking Standards](./DEVELOPMENT_STANDARDS.md#change-tracking-and-documentation-update-standards) - **Mandatory** documentation update requirements
- 🔄 Must update `CHANGELOG.md` and related documentation after each task completion
- ✅ All commits require code review and documentation checks

## 2. Project Structure

```
mking-frnd/
├── frontend/                 # React frontend application
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── Dockerfile
├── backend/                  # NestJS backend service
│   ├── src/
│   │   ├── auth/            # Authentication module
│   │   ├── users/           # User module
│   │   ├── chat/            # Chat module
│   │   ├── media/           # Media module
│   │   ├── common/          # Common module
│   │   ├── config/          # Configuration module
│   │   ├── database/        # Database module
│   │   ├── app.module.ts    # Root module
│   │   └── main.ts          # Application entry point
│   ├── test/                # Test files
│   ├── package.json
│   ├── nest-cli.json        # NestJS CLI configuration
│   ├── tsconfig.json        # TypeScript configuration
│   └── Dockerfile
├── database/                 # Database related
│   ├── migrations/          # Prisma migration files
│   ├── seeds/               # Test data
│   └── schema.prisma        # Database schema
├── docs/                     # Project documentation
├── docker-compose.yml        # Local development environment
├── .env.example             # Environment variables example
└── README.md
```

## 3. Environment Setup Steps

### 3.1 Clone Project
```bash
git clone https://github.com/kimhsiao/mking-frnd.git
cd mking-frnd
```

### 3.2 Environment Variables Setup
```bash
# Copy environment variables example file
cp .env.example .env

# Edit environment variables
vim .env
```

### 3.3 Environment Variables Configuration
```bash
# .env file content

# Database settings
DATABASE_URL="postgresql://postgres:password@localhost:5432/mking_frnd"
REDIS_URL="redis://localhost:6379"

# JWT settings
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
REFRESH_TOKEN_SECRET="your-refresh-token-secret"

# Keycloak OAuth settings
KEYCLOAK_URL="http://localhost:8080"
KEYCLOAK_REALM="mking-frnd"
KEYCLOAK_CLIENT_ID="mking-frnd-client"
KEYCLOAK_CLIENT_SECRET="your-keycloak-client-secret"

# MinIO file storage settings
MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_ACCESS_KEY="admin"
MINIO_SECRET_KEY="password123"
MINIO_BUCKET_NAME="mking-frnd-media"
MINIO_USE_SSL="false"

# SMTP email settings (development environment uses MailHog)
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

# Application settings
NODE_ENV="development"
PORT="3000"
FRONTEND_URL="http://localhost:3001"

# Analytics service settings
PLAUSIBLE_URL="http://localhost:8000"
PLAUSIBLE_DOMAIN="localhost:3001"

# Monitoring service settings
GRAFANA_URL="http://localhost:3000"
PROMETHEUS_URL="http://localhost:9090"

# Sentry error tracking (Self-hosted)
SENTRY_DSN="http://localhost:9001/your-project-id"
```

### 3.4 Quick Start with Docker
```bash
# Start all services (database, Redis, backend, frontend)
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### 3.5 Manual Setup (without Docker)

#### 3.5.1 Install Dependencies
```bash
# Install NestJS CLI (global)
npm install -g @nestjs/cli

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

#### 3.5.2 Database Setup
```bash
# Install PostgreSQL (macOS)
brew install postgresql
brew services start postgresql

# Create database
psql postgres
CREATE DATABASE mking_frnd;
CREATE USER mking_user WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE mking_frnd TO mking_user;
\q

# Install Redis
brew install redis
brew services start redis
```

#### 3.5.3 Database Migration
```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run database migration
npx prisma migrate dev

# Seed test data
npx prisma db seed
```

#### 3.5.4 Start Services
```bash
# Start backend service (development mode)
cd backend
npm run start:dev

# Open new terminal, start frontend service
cd frontend
npm start
```

## 4. Development Tools Configuration

### 4.1 VS Code Extensions
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

### 4.2 VS Code Settings
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

### 4.3 Prettier Configuration
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

### 4.4 ESLint Configuration
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

## 5. Test Environment Setup

### 5.1 Test Database
```bash
# Create test database
psql postgres
CREATE DATABASE mking_frnd_test;
GRANT ALL PRIVILEGES ON DATABASE mking_frnd_test TO mking_user;
\q

# Set test environment variables
echo 'DATABASE_URL="postgresql://mking_user:password@localhost:5432/mking_frnd_test"' > .env.test
```

### 5.2 Jest Configuration
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

### 5.3 Test Setup File
```typescript
// tests/setup.ts
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Run test database migration
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL },
  });
});

beforeEach(async () => {
  // Clean test data
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

## 6. Development Workflow

### 6.1 Git Workflow
```bash
# Create feature branch
git checkout -b feature/user-authentication

# Commit changes
git add .
git commit -m "feat: implement user authentication"

# Push to remote
git push origin feature/user-authentication

# Create Pull Request
# Create PR on GitHub and wait for code review
```

### 6.2 Commit Message Convention
```
type(scope): description

[optional body]

[optional footer]
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation update
- `style`: Code formatting
- `refactor`: Code refactoring
- `test`: Test related
- `chore`: Build process or auxiliary tool changes

### 6.3 Code Review Checklist
- [ ] Code follows project style guide
- [ ] All tests pass
- [ ] Test coverage above 80%
- [ ] No security vulnerabilities
- [ ] Performance impact assessment
- [ ] Documentation updated

## 7. Common Issue Solutions

### 7.1 Database Connection Issues
```bash
# Check PostgreSQL service status
brew services list | grep postgresql

# Restart PostgreSQL
brew services restart postgresql

# Test connection
psql -h localhost -U mking_user -d mking_frnd
```

### 7.2 Port Conflicts
```bash
# Check port usage
lsof -i :3000

# Kill process using port
kill -9 <PID>
```

### 7.3 Dependency Installation Issues
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### 7.4 Docker Issues
```bash
# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# View container logs
docker-compose logs <service-name>
```

## 8. Performance Monitoring

### 8.1 Local Monitoring Tools
```bash
# Install monitoring tools
npm install -g clinic

# Performance analysis
clinic doctor -- node src/index.js
clinic flame -- node src/index.js
```

### 8.2 Grafana Loki Log Monitoring
Based on the recommended Grafana Loki + Promtail solution for log management:

```bash
# Start complete monitoring stack (including Loki)
docker-compose up -d

# Access monitoring services
# Grafana: http://localhost:3000 (admin/admin123)
# Prometheus: http://localhost:9090
# Loki: http://localhost:3100
# Promtail: http://localhost:9080
```

**Log Query Examples (LogQL)**:
```logql
# View backend service error logs
{service="mking-backend", level="error"}

# View logs for specific time range
{service="mking-backend"} |= "login" [5m]

# Calculate error rate
sum(rate({service="mking-backend", level="error"}[5m])) / sum(rate({service="mking-backend"}[5m]))
```

### 8.3 Database Performance
```sql
-- View slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- View index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

## 9. Deployment Preparation

### 9.1 Production Environment Checklist
- [ ] Environment variables configured
- [ ] Database migrations executed
- [ ] SSL certificates configured
- [ ] Monitoring and logging setup
- [ ] Backup strategy implemented

### 9.2 Deployment Script
```bash
#!/bin/bash
# deploy.sh

set -e

echo "Starting deployment..."

# Build Docker images
docker build -t mking-frnd/backend:latest ./backend
docker build -t mking-frnd/frontend:latest ./frontend

# Push to container registry
docker push mking-frnd/backend:latest
docker push mking-frnd/frontend:latest

# Deploy to Kubernetes
kubectl apply -f k8s/

echo "Deployment completed!"
```

This development environment setup guide provides complete local development environment configuration, ensuring all developers can quickly get started and follow unified development standards.