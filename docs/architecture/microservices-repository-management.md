# Microservices Repository Management

## 1. Repository Separation Strategy

### 1.1 Separation Principles

#### 1.1.1 Independent Development
- **Team Autonomy**: Each team can independently develop and maintain their microservices
- **Technology Stack Flexibility**: Different services can use different technology stacks
- **Development Pace**: Each service can have its own development and release cycle
- **Code Isolation**: Avoid code coupling between different services

#### 1.1.2 Independent Deployment
- **Deployment Isolation**: Each service can be deployed independently without affecting others
- **Version Control**: Each service has independent version management
- **Rollback Strategy**: Can rollback individual services without affecting the entire system
- **Resource Allocation**: Flexible resource allocation based on service requirements

#### 1.1.3 Independent Version Control
- **Git History**: Each service has clean Git history
- **Branch Management**: Independent branch management strategies
- **Tag Management**: Independent version tagging
- **Permission Control**: Fine-grained access control

#### 1.1.4 Team Collaboration
- **Responsibility Boundaries**: Clear service ownership
- **Code Review**: Independent code review processes
- **Issue Tracking**: Independent issue and bug tracking
- **Documentation**: Service-specific documentation

#### 1.1.5 Technology Stack Flexibility
- **Language Choice**: Different services can use different programming languages
- **Framework Selection**: Choose the most suitable framework for each service
- **Database Technology**: Use appropriate database technology for each service
- **Third-party Dependencies**: Independent dependency management

### 1.2 Microservices Repository List

#### 1.2.1 Backend Microservices

| Repository Name | Technology Stack | Responsibilities |
|---|---|---|
| `mking-friend-api-gateway` | Node.js + Express + TypeScript | API routing, authentication, rate limiting, request/response transformation |
| `mking-friend-auth-service` | Node.js + NestJS + TypeScript | User authentication, authorization, JWT token management |
| `mking-friend-user-service` | Node.js + NestJS + TypeScript | User profile management, friend relationships, user preferences |
| `mking-friend-chat-service` | Node.js + NestJS + TypeScript + Socket.io | Real-time messaging, chat rooms, message history |
| `mking-friend-media-service` | Node.js + NestJS + TypeScript | File upload, image processing, media storage |
| `mking-friend-admin-service` | Node.js + NestJS + TypeScript | Admin panel backend, user management, system monitoring |

#### 1.2.2 Frontend Applications

| Repository Name | Technology Stack | Responsibilities |
|---|---|---|
| `mking-friend-frontend` | React + TypeScript + Vite | Main user interface, responsive design, PWA features |
| `mking-friend-admin-frontend` | React + TypeScript + Vite | Admin panel interface, data visualization, system management |

#### 1.2.3 Infrastructure and Shared

| Repository Name | Technology Stack | Responsibilities |
|---|---|---|
| `mking-friend-infrastructure` | Docker + Kubernetes + Terraform | Infrastructure as Code, deployment configurations, monitoring setup |
| `mking-friend-shared` | TypeScript | Shared types, utilities, gRPC definitions, common libraries |

## 2. Standard Repository Structure

### 2.1 Microservice Repository Structure

```
mking-friend-{service-name}/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── cd.yml
│   │   └── security.yml
│   └── PULL_REQUEST_TEMPLATE.md
├── src/
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── entities/
│   ├── dto/
│   ├── guards/
│   ├── interceptors/
│   ├── filters/
│   ├── decorators/
│   ├── utils/
│   ├── config/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeds/
│   ├── grpc/
│   │   ├── proto/
│   │   └── generated/
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   ├── app.module.ts
│   └── main.ts
├── docker/
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   └── docker-compose.yml
├── k8s/
│   ├── deployment.yml
│   ├── service.yml
│   ├── configmap.yml
│   ├── secret.yml
│   └── ingress.yml
├── docs/
│   ├── api/
│   ├── architecture/
│   └── deployment/
├── scripts/
│   ├── build.sh
│   ├── test.sh
│   ├── deploy.sh
│   └── migrate.sh
├── .env.example
├── .gitignore
├── .eslintrc.js
├── .prettierrc
├── jest.config.js
├── package.json
├── tsconfig.json
├── README.md
└── CHANGELOG.md
```

### 2.2 Frontend Repository Structure

```
mking-friend-frontend/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── cd.yml
│   │   └── lighthouse.yml
│   └── PULL_REQUEST_TEMPLATE.md
├── public/
│   ├── icons/
│   ├── images/
│   ├── manifest.json
│   └── sw.js
├── src/
│   ├── components/
│   │   ├── common/
│   │   ├── layout/
│   │   └── pages/
│   ├── hooks/
│   ├── services/
│   ├── stores/
│   ├── utils/
│   ├── types/
│   ├── styles/
│   ├── assets/
│   ├── tests/
│   │   ├── __mocks__/
│   │   ├── components/
│   │   └── utils/
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── docker/
│   ├── Dockerfile
│   └── nginx.conf
├── k8s/
│   ├── deployment.yml
│   ├── service.yml
│   └── ingress.yml
├── docs/
│   ├── components/
│   ├── deployment/
│   └── user-guide/
├── .env.example
├── .gitignore
├── .eslintrc.js
├── .prettierrc
├── jest.config.js
├── package.json
├── tsconfig.json
├── vite.config.ts
├── README.md
└── CHANGELOG.md
```

## 3. Development Workflow

### 3.1 Git Flow Branch Model

#### 3.1.1 Main Branches
- **main**: Production-ready code
- **develop**: Integration branch for features

#### 3.1.2 Supporting Branches
- **feature/***: New feature development
- **release/***: Release preparation
- **hotfix/***: Critical bug fixes
- **bugfix/***: Non-critical bug fixes

#### 3.1.3 Branch Naming Conventions
```
feature/user-authentication
feature/chat-real-time-messaging
bugfix/login-validation-error
hotfix/security-vulnerability-fix
release/v1.2.0
```

### 3.2 Commit Message Standards

#### 3.2.1 Conventional Commits Format
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### 3.2.2 Commit Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or modifying tests
- **chore**: Build process or auxiliary tool changes
- **perf**: Performance improvements
- **ci**: CI/CD configuration changes

#### 3.2.3 Commit Examples
```bash
feat(auth): add JWT token refresh mechanism
fix(chat): resolve message ordering issue
docs(api): update authentication endpoint documentation
refactor(user): extract user validation logic
test(chat): add unit tests for message service
chore(deps): update dependencies to latest versions
```

### 3.3 Code Review Process

#### 3.3.1 Pull Request Template
```markdown
## Description
Brief description of changes made

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Code is commented where necessary
- [ ] Documentation updated
- [ ] No new warnings introduced
```

#### 3.3.2 Review Criteria
- **Code Quality**: Clean, readable, maintainable code
- **Testing**: Adequate test coverage
- **Performance**: No performance regressions
- **Security**: No security vulnerabilities
- **Documentation**: Updated documentation
- **Standards**: Follows coding standards

## 4. CI/CD Pipeline

### 4.1 Continuous Integration (CI)

#### 4.1.1 GitHub Actions CI Configuration
```yaml
# .github/workflows/ci.yml
name: Continuous Integration

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run type checking
      run: npm run type-check
    
    - name: Run unit tests
      run: npm run test:unit
    
    - name: Run integration tests
      run: npm run test:integration
    
    - name: Run E2E tests
      run: npm run test:e2e
    
    - name: Generate test coverage
      run: npm run test:coverage
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
    
    - name: Build application
      run: npm run build
    
    - name: Run security audit
      run: npm audit --audit-level high
```

### 4.2 Continuous Deployment (CD)

#### 4.2.1 GitHub Actions CD Configuration
```yaml
# .github/workflows/cd.yml
name: Continuous Deployment

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

## 5. Version Management

### 5.1 Semantic Versioning

#### 5.1.1 Version Number Format
```
MAJOR.MINOR.PATCH

MAJOR: Incompatible API changes
MINOR: Backward-compatible functionality additions
PATCH: Backward-compatible bug fixes
```

#### 5.1.2 Release Process
1. **Create release branch**: `git checkout -b release/v1.2.0`
2. **Update version number**: Modify version in `package.json`
3. **Update changelog**: Record changes in `CHANGELOG.md`
4. **Create Pull Request**: Merge to main branch
5. **Create Git Tag**: `git tag v1.2.0`
6. **Push tag**: `git push origin v1.2.0`
7. **Automatic deployment**: CI/CD automatically triggers deployment

### 5.2 Dependency Management

#### 5.2.1 Shared Dependencies Strategy
- **Shared library repository**: `mking-friend-shared`
- **gRPC definitions**: Unified proto files
- **TypeScript types**: Shared type definitions
- **Utility functions**: Common utility functions

#### 5.2.2 Dependency Update Strategy
- **Regular updates**: Monthly dependency checks and updates
- **Security updates**: Immediate security vulnerability fixes
- **Major versions**: Careful major version upgrades
- **Test validation**: Complete testing after updates

## 6. Local Development Environment

### 6.1 Development Environment Setup

#### 6.1.1 Prerequisites
```bash
# Node.js 18+
node --version

# Docker & Docker Compose
docker --version
docker-compose --version

# Git
git --version

# Optional: Kubernetes CLI
kubectl version --client
```

#### 6.1.2 Clone All Repositories
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

### 6.2 Local Development Workflow

#### 6.2.1 Start Development Environment
```bash
# 1. Start infrastructure services
cd mking-friend-infrastructure
docker-compose -f docker-compose.dev.yml up -d

# 2. Start each microservice
cd ../mking-friend-auth-service
npm install
npm run start:dev

# 3. Start other services in new terminals
cd ../mking-friend-user-service
npm install
npm run start:dev

# ... repeat for other services

# 4. Start frontend
cd ../mking-friend-frontend
npm install
npm run dev
```

#### 6.2.2 Development Scripts
```bash
#!/bin/bash
# start-dev.sh - One-click development environment startup

echo "Starting MKing Friend development environment..."

# Start infrastructure
echo "Starting infrastructure services..."
cd infrastructure && docker-compose -f docker-compose.dev.yml up -d

# Wait for services to start
sleep 10

# Start microservices
services=("auth-service" "user-service" "chat-service" "media-service" "admin-service")

for service in "${services[@]}"; do
  echo "Starting $service..."
  cd "../mking-friend-$service"
  npm run start:dev &
done

# Start API Gateway
echo "Starting API Gateway..."
cd ../mking-friend-api-gateway
npm run start:dev &

# Start frontend
echo "Starting frontend..."
cd ../mking-friend-frontend
npm run dev &

echo "All services started! Check http://localhost:3100"
```

## 7. Monitoring and Logging

### 7.1 Service Monitoring

#### 7.1.1 Health Check Endpoints
Each microservice should provide health check endpoints:
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

#### 7.1.2 Prometheus Metrics
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

### 7.2 Log Management

#### 7.2.1 Structured Logging
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

## 8. Security Considerations

### 8.1 Code Security

#### 8.1.1 Dependency Scanning
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

#### 8.1.2 Secret Management
- **Environment variables**: Pass sensitive information through environment variables
- **Kubernetes Secrets**: Use K8s Secrets in production
- **Key rotation**: Regular rotation of API keys and certificates
- **Least privilege**: Each service gets only necessary permissions

### 8.2 Network Security

#### 8.2.1 Inter-service Communication
- **mTLS**: Use mutual TLS authentication between microservices
- **Network isolation**: Use Kubernetes NetworkPolicy
- **API rate limiting**: Prevent DDoS attacks
- **Input validation**: Strict validation of all input data

## 9. Troubleshooting

### 9.1 Common Issues

#### 9.1.1 Service Startup Failures
```bash
# Check port usage
lsof -i :3001

# Check environment variables
env | grep DATABASE_URL

# Check Docker services
docker-compose ps

# View service logs
docker-compose logs postgres
```

#### 9.1.2 gRPC Connection Issues
```bash
# Test gRPC connection
grpcurl -plaintext localhost:50001 grpc.health.v1.Health/Check

# Check service registration
consul catalog services

# View network connections
netstat -tlnp | grep 50001
```

### 9.2 Debugging Tools

#### 9.2.1 gRPC Debugging
```bash
# Install grpcurl
go install github.com/fullstorydev/grpcurl/cmd/grpcurl@latest

# List services
grpcurl -plaintext localhost:50001 list

# Call service method
grpcurl -plaintext -d '{"email":"test@example.com"}' \
  localhost:50001 auth.AuthService/GetUser
```

#### 9.2.2 API Testing
```bash
# Test API with curl
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Use httpie
http POST localhost:3000/api/v1/auth/login \
  email=test@example.com password=password
```

## 10. Best Practices

### 10.1 Code Quality
- **Code review**: All code changes must be reviewed
- **Automated testing**: Maintain high test coverage
- **Code standards**: Use ESLint and Prettier
- **Documentation updates**: Keep API documentation current

### 10.2 Performance Optimization
- **Caching strategy**: Proper use of Redis caching
- **Database optimization**: Appropriate indexing and query optimization
- **Connection pooling**: Use connection pools for database management
- **Load testing**: Regular performance testing

### 10.3 Operations Management
- **Monitoring and alerting**: Comprehensive monitoring and alerting setup
- **Log aggregation**: Unified log collection and analysis
- **Backup strategy**: Regular backup of important data
- **Disaster recovery**: Disaster recovery planning

---

## Summary

This document provides a comprehensive overview of the MKing Friend microservices architecture repository management strategy, including:

1. **Repository separation**: Each microservice uses an independent Git repository
2. **Standardized structure**: Unified project structure and configuration
3. **Development workflow**: Complete development, testing, and deployment processes
4. **CI/CD automation**: Automated continuous integration and deployment
5. **Version management**: Semantic versioning and release processes
6. **Monitoring and security**: Comprehensive monitoring, logging, and security measures

By following these best practices, we can ensure efficient development and stable operation of the microservices architecture.