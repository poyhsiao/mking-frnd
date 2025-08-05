# MKing Friend Admin System Development Guide

## 1. Overview

### 1.1 Objectives
This document provides a comprehensive development guide for the MKing Friend admin system, ensuring administrators can effectively and securely manage the entire platform.

### 1.2 Scope
- Admin frontend development
- Admin Service backend development
- Permission control system
- Security mechanism implementation
- Deployment and maintenance

### 1.3 Target Users
- Development team
- System administrators
- Product managers
- QA testers

## 2. Technical Architecture

### 2.1 Overall Architecture
```
┌─────────────────────────────────────────────────────────┐
│                Admin System Architecture                │
├─────────────────┬─────────────────┬─────────────────────┤
│   Admin Frontend│   Admin API     │    Data Storage     │
│                 │                 │                     │
│ • React 18+     │ • NestJS        │ • PostgreSQL        │
│ • TypeScript    │ • TypeScript    │ • Redis             │
│ • Ant Design Pro│ • Prisma ORM    │ • MinIO             │
│ • Zustand       │ • GraphQL       │ • Typesense         │
│ • React Query   │ • WebSocket     │                     │
│ • Vite          │ • JWT + 2FA     │                     │
└─────────────────┴─────────────────┴─────────────────────┘
```

### 2.2 Technology Selection Rationale

#### 2.2.1 Frontend Technology Stack
- **React 18+**: Mature frontend framework with rich ecosystem
- **TypeScript**: Type safety, improved code quality
- **Ant Design Pro**: Professional admin solution, ready to use
- **Zustand**: Lightweight state management, simple and easy to use
- **React Query**: Powerful data fetching and caching management
- **Vite**: Fast build tool, excellent development experience

#### 2.2.2 Backend Technology Stack
- **NestJS**: Enterprise-grade Node.js framework, modular design
- **TypeScript**: Maintains technical consistency with frontend
- **Prisma ORM**: Type-safe ORM, excellent development experience
- **GraphQL**: Flexible query language, suitable for complex data queries
- **JWT + 2FA**: Secure authentication mechanism

## 3. Development Environment Setup

### 3.1 Prerequisites
```bash
# Node.js version requirements
node --version  # >= 18.0.0
npm --version   # >= 8.0.0
pnpm --version  # >= 7.0.0

# Database requirements
postgresql --version  # >= 14.0
redis-server --version # >= 6.0
```

### 3.2 Project Initialization
```bash
# 1. Create admin frontend project
mkdir mking-admin-frontend
cd mking-admin-frontend
pnpm create vite . --template react-ts
pnpm install

# 2. Install Ant Design Pro
pnpm add @ant-design/pro-components @ant-design/pro-layout
pnpm add @ant-design/icons antd

# 3. Install state management and data fetching
pnpm add zustand @tanstack/react-query
pnpm add @tanstack/react-query-devtools

# 4. Install routing and utility libraries
pnpm add react-router-dom
pnpm add dayjs lodash-es
pnpm add @types/lodash-es

# 5. Create backend Admin Service
mkdir mking-admin-service
cd mking-admin-service
nest new . --package-manager pnpm

# 6. Install backend dependencies
pnpm add @nestjs/config @nestjs/jwt @nestjs/passport
pnpm add @nestjs/graphql @nestjs/apollo graphql apollo-server-express
pnpm add prisma @prisma/client
pnpm add passport passport-jwt passport-local
pnpm add bcryptjs class-validator class-transformer
pnpm add @types/bcryptjs @types/passport-jwt @types/passport-local
```

### 3.3 Development Tools Configuration
```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

## 4. Frontend Development Guide

### 4.1 Project Structure
```
mking-admin-frontend/
├── src/
│   ├── components/          # Common components
│   │   ├── Charts/         # Chart components
│   │   ├── Forms/          # Form components
│   │   ├── Tables/         # Table components
│   │   └── Layout/         # Layout components
│   ├── pages/              # Page components
│   │   ├── Dashboard/      # Dashboard
│   │   ├── Users/          # User management
│   │   ├── Content/        # Content moderation
│   │   ├── System/         # System monitoring
│   │   ├── Analytics/      # Data analytics
│   │   ├── Support/        # Customer support
│   │   └── Settings/       # System settings
│   ├── hooks/              # Custom Hooks
│   ├── services/           # API services
│   ├── stores/             # Zustand state management
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   ├── constants/          # Constants
│   └── styles/             # Style files
├── public/                 # Static assets
├── docs/                   # Documentation
└── tests/                  # Test files
```

### 4.2 Core Component Development

#### 4.2.1 Layout Component
```typescript
// src/components/Layout/AdminLayout.tsx
import React from 'react';
import { ProLayout } from '@ant-design/pro-components';
import { useAuthStore } from '@/stores/authStore';
import { menuConfig } from '@/constants/menu';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, logout } = useAuthStore();

  return (
    <ProLayout
      title="MKing Admin"
      logo="/logo.svg"
      layout="mix"
      navTheme="light"
      headerTheme="light"
      route={menuConfig}
      avatarProps={{
        src: user?.avatar,
        title: user?.name,
        size: 'small',
      }}
      actionsRender={() => [
        <LogoutButton key="logout" onLogout={logout} />,
      ]}
    >
      {children}
    </ProLayout>
  );
};
```

#### 4.2.2 Data Table Component
```typescript
// src/components/Tables/DataTable.tsx
import React from 'react';
import { ProTable, ProColumns } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';

interface DataTableProps<T> {
  columns: ProColumns<T>[];
  queryKey: string[];
  queryFn: () => Promise<{ data: T[]; total: number }>;
  title?: string;
  toolBarRender?: () => React.ReactNode[];
}

export function DataTable<T extends Record<string, any>>({
  columns,
  queryKey,
  queryFn,
  title,
  toolBarRender,
}: DataTableProps<T>) {
  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn,
  });

  return (
    <ProTable<T>
      columns={columns}
      dataSource={data?.data}
      loading={isLoading}
      pagination={{
        total: data?.total,
        showSizeChanger: true,
        showQuickJumper: true,
      }}
      search={{
        labelWidth: 'auto',
      }}
      options={{
        setting: {
          listsHeight: 400,
        },
      }}
      headerTitle={title}
      toolBarRender={toolBarRender}
      rowKey="id"
    />
  );
}
```

## 5. Backend Development Guide

### 5.1 Project Structure
```
mking-admin-service/
├── src/
│   ├── modules/
│   │   ├── auth/           # Authentication module
│   │   ├── users/          # User management
│   │   ├── content/        # Content management
│   │   ├── analytics/      # Analytics module
│   │   ├── system/         # System monitoring
│   │   └── notifications/  # Notification system
│   ├── common/
│   │   ├── decorators/     # Custom decorators
│   │   ├── filters/        # Exception filters
│   │   ├── guards/         # Auth guards
│   │   ├── interceptors/   # Interceptors
│   │   └── pipes/          # Validation pipes
│   ├── config/             # Configuration
│   ├── database/           # Database configuration
│   ├── graphql/            # GraphQL schema
│   └── utils/              # Utility functions
├── prisma/                 # Prisma schema and migrations
├── test/                   # Test files
└── docs/                   # API documentation
```

### 5.2 Authentication Module

#### 5.2.1 JWT Strategy
```typescript
// src/modules/auth/strategies/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }
    return user;
  }
}
```

#### 5.2.2 Two-Factor Authentication
```typescript
// src/modules/auth/services/two-factor.service.ts
import { Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';

@Injectable()
export class TwoFactorService {
  generateSecret(email: string): string {
    return authenticator.generateSecret();
  }

  async generateQRCode(email: string, secret: string): Promise<string> {
    const otpAuthUrl = authenticator.keyuri(
      email,
      'MKing Friend Admin',
      secret,
    );
    return toDataURL(otpAuthUrl);
  }

  verifyToken(token: string, secret: string): boolean {
    return authenticator.verify({ token, secret });
  }
}
```

## 6. Permission System

### 6.1 Role-Based Access Control (RBAC)

#### 6.1.1 Permission Decorator
```typescript
// src/common/decorators/permissions.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
```

#### 6.1.2 Permission Guard
```typescript
// src/common/guards/permissions.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredPermissions.some((permission) =>
      user.permissions?.includes(permission),
    );
  }
}
```

### 6.2 Permission Definitions
```typescript
// src/common/constants/permissions.ts
export const PERMISSIONS = {
  // User Management
  USER_READ: 'user:read',
  USER_WRITE: 'user:write',
  USER_DELETE: 'user:delete',
  
  // Content Management
  CONTENT_READ: 'content:read',
  CONTENT_MODERATE: 'content:moderate',
  CONTENT_DELETE: 'content:delete',
  
  // System Management
  SYSTEM_READ: 'system:read',
  SYSTEM_WRITE: 'system:write',
  SYSTEM_ADMIN: 'system:admin',
  
  // Analytics
  ANALYTICS_READ: 'analytics:read',
  ANALYTICS_EXPORT: 'analytics:export',
} as const;
```

## 7. Security Implementation

### 7.1 Input Validation
```typescript
// src/common/pipes/validation.pipe.ts
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }
    
    const object = plainToClass(metatype, value);
    const errors = await validate(object);
    
    if (errors.length > 0) {
      throw new BadRequestException('Validation failed');
    }
    
    return value;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
```

### 7.2 Rate Limiting
```typescript
// src/common/guards/rate-limit.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RedisService } from '../services/redis.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const key = `rate_limit:${request.ip}:${request.route.path}`;
    
    const current = await this.redisService.incr(key);
    
    if (current === 1) {
      await this.redisService.expire(key, 60); // 1 minute window
    }
    
    return current <= 100; // 100 requests per minute
  }
}
```

## 8. Monitoring and Logging

### 8.1 Application Logging
```typescript
// src/common/interceptors/logging.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        this.logger.log(
          `${method} ${url} - User: ${user?.id || 'Anonymous'} - ${duration}ms`,
        );
      }),
    );
  }
}
```

### 8.2 Performance Monitoring
```typescript
// src/common/interceptors/performance.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from '../services/metrics.service';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  constructor(private metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = process.hrtime.bigint();
    const request = context.switchToHttp().getRequest();
    
    return next.handle().pipe(
      tap(() => {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
        
        this.metricsService.recordRequestDuration(
          request.method,
          request.route.path,
          duration,
        );
      }),
    );
  }
}
```

## 9. Testing Strategy

### 9.1 Unit Testing
```typescript
// src/modules/users/users.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../database/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const mockUsers = [{ id: '1', email: 'test@example.com' }];
      jest.spyOn(prismaService.user, 'findMany').mockResolvedValue(mockUsers);

      const result = await service.findAll();
      expect(result).toEqual(mockUsers);
    });
  });
});
```

### 9.2 Integration Testing
```typescript
// test/users.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@example.com', password: 'password' })
      .expect(200);
    
    authToken = loginResponse.body.accessToken;
  });

  it('/users (GET)', () => {
    return request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body.data)).toBe(true);
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
```

## 10. Deployment Guide

### 10.1 Docker Configuration
```dockerfile
# Dockerfile.admin-frontend
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```dockerfile
# Dockerfile.admin-service
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001
CMD ["node", "dist/main"]
```

### 10.2 Docker Compose
```yaml
# docker-compose.admin.yml
version: '3.8'

services:
  admin-frontend:
    build:
      context: ./mking-admin-frontend
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    environment:
      - REACT_APP_API_URL=http://localhost:3001
    depends_on:
      - admin-service

  admin-service:
    build:
      context: ./mking-admin-service
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://user:password@postgres:5432/mking_admin
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=your-jwt-secret
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:14
    environment:
      - POSTGRES_DB=mking_admin
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

## 11. Maintenance and Operations

### 11.1 Database Migrations
```bash
# Generate migration
npx prisma migrate dev --name add_admin_permissions

# Apply migrations in production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### 11.2 Backup Strategy
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="mking_admin"

# Create database backup
pg_dump -h localhost -U user -d $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/db_backup_$DATE.sql

# Remove backups older than 30 days
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: db_backup_$DATE.sql.gz"
```

### 11.3 Health Checks
```typescript
// src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import { PrismaService } from '../database/prisma.service';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: PrismaHealthIndicator,
    private prisma: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database', this.prisma),
    ]);
  }
}
```

## 12. Performance Optimization

### 12.1 Database Query Optimization
```typescript
// Efficient pagination
async findUsersWithPagination(page: number, limit: number) {
  const skip = (page - 1) * limit;
  
  const [users, total] = await Promise.all([
    this.prisma.user.findMany({
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
    this.prisma.user.count(),
  ]);
  
  return {
    data: users,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
```

### 12.2 Caching Strategy
```typescript
// src/common/decorators/cache.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY = 'cache';
export const Cache = (ttl: number = 300) => SetMetadata(CACHE_KEY, ttl);

// src/common/interceptors/cache.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { RedisService } from '../services/redis.service';
import { CACHE_KEY } from '../decorators/cache.decorator';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private redisService: RedisService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const ttl = this.reflector.get<number>(CACHE_KEY, context.getHandler());
    
    if (!ttl) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const cacheKey = `cache:${request.method}:${request.url}`;
    
    const cachedResult = await this.redisService.get(cacheKey);
    
    if (cachedResult) {
      return of(JSON.parse(cachedResult));
    }

    return next.handle().pipe(
      tap(async (result) => {
        await this.redisService.setex(cacheKey, ttl, JSON.stringify(result));
      }),
    );
  }
}
```

## 13. Security Best Practices

### 13.1 Environment Configuration
```typescript
// src/config/configuration.ts
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3001,
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },
  redis: {
    url: process.env.REDIS_URL,
  },
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 60000,
  },
});
```

### 13.2 Security Headers
```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }));
  
  // CORS configuration
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });
  
  await app.listen(3001);
}
bootstrap();
```

## 14. Conclusion

This comprehensive guide provides the foundation for developing a secure, scalable, and maintainable admin system for MKing Friend. Key points to remember:

1. **Security First**: Implement proper authentication, authorization, and input validation
2. **Performance**: Use caching, efficient queries, and monitoring
3. **Maintainability**: Follow clean code principles and comprehensive testing
4. **Scalability**: Design with growth in mind using microservices architecture
5. **Documentation**: Keep documentation updated and comprehensive

For additional support and updates, refer to the project's documentation repository and development team resources.