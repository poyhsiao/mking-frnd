# MKing Friend 後台管理系統開發指南

## 1. 概述

### 1.1 目標
本文檔提供 MKing Friend 後台管理系統的完整開發指南，確保管理員能夠有效、安全地管理整個平台。

### 1.2 範圍
- 管理後台前端開發
- Admin Service 後端開發
- 權限控制系統
- 安全機制實施
- 部署與維護

### 1.3 目標用戶
- 開發團隊
- 系統管理員
- 產品經理
- QA 測試人員

## 2. 技術架構

### 2.1 整體架構
```
┌─────────────────────────────────────────────────────────┐
│                 後台管理系統架構                        │
├─────────────────┬─────────────────┬─────────────────────┤
│   管理前端      │   Admin API     │    數據存儲         │
│                 │                 │                     │
│ • React 18+     │ • NestJS        │ • PostgreSQL        │
│ • TypeScript    │ • TypeScript    │ • Redis             │
│ • Ant Design Pro│ • Prisma ORM    │ • MinIO             │
│ • Zustand       │ • GraphQL       │ • Typesense         │
│ • React Query   │ • WebSocket     │                     │
│ • Vite          │ • JWT + 2FA     │                     │
└─────────────────┴─────────────────┴─────────────────────┘
```

### 2.2 技術選型理由

#### 2.2.1 前端技術棧
- **React 18+**: 成熟的前端框架，豐富的生態系統
- **TypeScript**: 類型安全，提高代碼品質
- **Ant Design Pro**: 專業的後台管理解決方案，開箱即用
- **Zustand**: 輕量級狀態管理，簡單易用
- **React Query**: 強大的數據獲取和快取管理
- **Vite**: 快速的構建工具，優秀的開發體驗

#### 2.2.2 後端技術棧
- **NestJS**: 企業級 Node.js 框架，模組化設計
- **TypeScript**: 與前端保持技術一致性
- **Prisma ORM**: 類型安全的 ORM，優秀的開發體驗
- **GraphQL**: 靈活的查詢語言，適合複雜數據查詢
- **JWT + 2FA**: 安全的認證機制

## 3. 開發環境設置

### 3.1 前置要求
```bash
# Node.js 版本要求
node --version  # >= 18.0.0
npm --version   # >= 8.0.0
pnpm --version  # >= 7.0.0

# 資料庫要求
postgresql --version  # >= 14.0
redis-server --version # >= 6.0
```

### 3.2 專案初始化
```bash
# 1. 創建管理後台前端專案
mkdir mking-admin-frontend
cd mking-admin-frontend
pnpm create vite . --template react-ts
pnpm install

# 2. 安裝 Ant Design Pro
pnpm add @ant-design/pro-components @ant-design/pro-layout
pnpm add @ant-design/icons antd

# 3. 安裝狀態管理和數據獲取
pnpm add zustand @tanstack/react-query
pnpm add @tanstack/react-query-devtools

# 4. 安裝路由和工具庫
pnpm add react-router-dom
pnpm add dayjs lodash-es
pnpm add @types/lodash-es

# 5. 創建後端 Admin Service
mkdir mking-admin-service
cd mking-admin-service
nest new . --package-manager pnpm

# 6. 安裝後端依賴
pnpm add @nestjs/config @nestjs/jwt @nestjs/passport
pnpm add @nestjs/graphql @nestjs/apollo graphql apollo-server-express
pnpm add prisma @prisma/client
pnpm add passport passport-jwt passport-local
pnpm add bcryptjs class-validator class-transformer
pnpm add @types/bcryptjs @types/passport-jwt @types/passport-local
```

### 3.3 開發工具配置
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

## 4. 前端開發指南

### 4.1 專案結構
```
mking-admin-frontend/
├── src/
│   ├── components/          # 通用組件
│   │   ├── Charts/         # 圖表組件
│   │   ├── Forms/          # 表單組件
│   │   ├── Tables/         # 表格組件
│   │   └── Layout/         # 佈局組件
│   ├── pages/              # 頁面組件
│   │   ├── Dashboard/      # 儀表板
│   │   ├── Users/          # 用戶管理
│   │   ├── Content/        # 內容審核
│   │   ├── System/         # 系統監控
│   │   ├── Analytics/      # 數據分析
│   │   ├── Support/        # 客服管理
│   │   └── Settings/       # 系統配置
│   ├── hooks/              # 自定義 Hooks
│   ├── services/           # API 服務
│   ├── stores/             # Zustand 狀態管理
│   ├── types/              # TypeScript 類型定義
│   ├── utils/              # 工具函數
│   ├── constants/          # 常數定義
│   └── styles/             # 樣式文件
├── public/                 # 靜態資源
├── docs/                   # 文檔
└── tests/                  # 測試文件
```

### 4.2 核心組件開發

#### 4.2.1 佈局組件
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

#### 4.2.2 數據表格組件
```typescript
// src/components/Tables/DataTable.tsx
import React from 'react';
import { ProTable, ProColumns } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';

interface DataTableProps<T> {
  columns: ProColumns<T>[];
  queryKey: string[];
  queryFn: (params: any) => Promise<{ data: T[]; total: number }>;
  rowKey: string;
  toolBarRender?: () => React.ReactNode[];
}

export function DataTable<T extends Record<string, any>>({
  columns,
  queryKey,
  queryFn,
  rowKey,
  toolBarRender,
}: DataTableProps<T>) {
  return (
    <ProTable<T>
      columns={columns}
      rowKey={rowKey}
      request={async (params) => {
        const result = await queryFn(params);
        return {
          data: result.data,
          total: result.total,
          success: true,
        };
      }}
      pagination={{
        defaultPageSize: 20,
        showSizeChanger: true,
        showQuickJumper: true,
      }}
      search={{
        labelWidth: 'auto',
      }}
      toolBarRender={toolBarRender}
      dateFormatter="string"
      headerTitle="數據列表"
    />
  );
}
```

### 4.3 狀態管理

#### 4.3.1 認證狀態管理
```typescript
// src/stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '@/services/authService';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, totpCode?: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>()(n  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string, totpCode?: string) => {
        try {
          const response = await authService.login({ email, password, totpCode });
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
          });
        } catch (error) {
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
        authService.logout();
      },

      refreshToken: async () => {
        try {
          const response = await authService.refreshToken();
          set({
            token: response.token,
          });
        } catch (error) {
          get().logout();
          throw error;
        }
      },

      hasPermission: (permission: string) => {
        const { user } = get();
        return user?.permissions.includes(permission) || false;
      },
    }),
    {
      name: 'admin-auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
```

### 4.4 API 服務層

#### 4.4.1 HTTP 客戶端配置
```typescript
// src/services/httpClient.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/authStore';
import { message } from 'antd';

class HttpClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4001',
      timeout: 10000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // 請求攔截器
    this.instance.interceptors.request.use(
      (config) => {
        const { token } = useAuthStore.getState();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 響應攔截器
    this.instance.interceptors.response.use(
      (response) => response.data,
      async (error) => {
        const { status } = error.response || {};
        
        if (status === 401) {
          const { refreshToken, logout } = useAuthStore.getState();
          try {
            await refreshToken();
            // 重試原請求
            return this.instance.request(error.config);
          } catch {
            logout();
            window.location.href = '/login';
          }
        }

        if (status >= 500) {
          message.error('服務器錯誤，請稍後重試');
        }

        return Promise.reject(error);
      }
    );
  }

  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.get(url, config);
  }

  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.post(url, data, config);
  }

  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.put(url, data, config);
  }

  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.delete(url, config);
  }
}

export const httpClient = new HttpClient();
```

## 5. 後端開發指南

### 5.1 專案結構
```
mking-admin-service/
├── src/
│   ├── modules/             # 功能模組
│   │   ├── auth/           # 認證模組
│   │   ├── users/          # 用戶管理模組
│   │   ├── content/        # 內容審核模組
│   │   ├── analytics/      # 數據分析模組
│   │   ├── system/         # 系統監控模組
│   │   └── settings/       # 系統配置模組
│   ├── common/             # 通用模組
│   │   ├── decorators/     # 裝飾器
│   │   ├── filters/        # 異常過濾器
│   │   ├── guards/         # 守衛
│   │   ├── interceptors/   # 攔截器
│   │   ├── pipes/          # 管道
│   │   └── middleware/     # 中間件
│   ├── database/           # 資料庫相關
│   │   ├── migrations/     # 資料庫遷移
│   │   ├── seeds/          # 種子數據
│   │   └── schema.prisma   # Prisma Schema
│   ├── config/             # 配置文件
│   ├── types/              # 類型定義
│   └── utils/              # 工具函數
├── test/                   # 測試文件
├── docs/                   # API 文檔
└── scripts/                # 腳本文件
```

### 5.2 認證模組開發

#### 5.2.1 JWT 策略配置
```typescript
// src/modules/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const admin = await this.prisma.admin.findUnique({
      where: { id: payload.sub },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('管理員帳號已被停用');
    }

    return {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role.name,
      permissions: admin.role.permissions.map(p => p.name),
    };
  }
}
```

#### 5.2.2 雙因子認證實現
```typescript
// src/modules/auth/services/totp.service.ts
import { Injectable } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

@Injectable()
export class TotpService {
  generateSecret(email: string): { secret: string; qrCodeUrl: string } {
    const secret = speakeasy.generateSecret({
      name: `MKing Admin (${email})`,
      issuer: 'MKing Friend',
      length: 32,
    });

    return {
      secret: secret.base32,
      qrCodeUrl: secret.otpauth_url,
    };
  }

  async generateQRCode(otpauthUrl: string): Promise<string> {
    return QRCode.toDataURL(otpauthUrl);
  }

  verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // 允許前後2個時間窗口
    });
  }

  generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }
    return codes;
  }
}
```

### 5.3 權限控制系統

#### 5.3.1 權限守衛
```typescript
// src/common/guards/permissions.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '@/common/decorators/permissions.decorator';

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
    
    if (!user) {
      throw new ForbiddenException('用戶未認證');
    }

    const hasPermission = requiredPermissions.some(permission => 
      user.permissions?.includes(permission)
    );

    if (!hasPermission) {
      throw new ForbiddenException('權限不足');
    }

    return true;
  }
}
```

#### 5.3.2 權限裝飾器
```typescript
// src/common/decorators/permissions.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: string[]) => 
  SetMetadata(PERMISSIONS_KEY, permissions);

// 使用示例
// @RequirePermissions('users:read', 'users:write')
// @Get('users')
// async getUsers() { ... }
```

### 5.4 數據統計服務

#### 5.4.1 儀表板統計
```typescript
// src/modules/analytics/services/dashboard.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { RedisService } from '@/common/services/redis.service';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async getDashboardStats() {
    const cacheKey = 'dashboard:stats';
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    const [totalUsers, activeUsers, totalMessages, pendingReports] = await Promise.all([
      this.getTotalUsers(),
      this.getActiveUsers(),
      this.getTotalMessages(),
      this.getPendingReports(),
    ]);

    const stats = {
      totalUsers,
      activeUsers,
      totalMessages,
      pendingReports,
      userGrowth: await this.getUserGrowth(),
      messageStats: await this.getMessageStats(),
      systemHealth: await this.getSystemHealth(),
    };

    // 快取5分鐘
    await this.redis.setex(cacheKey, 300, JSON.stringify(stats));
    
    return stats;
  }

  private async getTotalUsers(): Promise<number> {
    return this.prisma.user.count();
  }

  private async getActiveUsers(): Promise<number> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.prisma.user.count({
      where: {
        lastActiveAt: {
          gte: oneDayAgo,
        },
      },
    });
  }

  private async getUserGrowth(): Promise<{ date: string; count: number }[]> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const result = await this.prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM users 
      WHERE created_at >= ${thirtyDaysAgo}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    return result as { date: string; count: number }[];
  }
}
```

## 6. 安全實施指南

### 6.1 認證安全

#### 6.1.1 密碼策略
```typescript
// src/common/validators/password.validator.ts
import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          
          // 至少8個字符
          if (value.length < 8) return false;
          
          // 包含大寫字母
          if (!/[A-Z]/.test(value)) return false;
          
          // 包含小寫字母
          if (!/[a-z]/.test(value)) return false;
          
          // 包含數字
          if (!/\d/.test(value)) return false;
          
          // 包含特殊字符
          if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) return false;
          
          return true;
        },
        defaultMessage(args: ValidationArguments) {
          return '密碼必須包含至少8個字符，包括大小寫字母、數字和特殊字符';
        },
      },
    });
  };
}
```

#### 6.1.2 IP 白名單中間件
```typescript
// src/common/middleware/ip-whitelist.middleware.ts
import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class IpWhitelistMiddleware implements NestMiddleware {
  private allowedIPs: string[];

  constructor(private configService: ConfigService) {
    this.allowedIPs = this.configService.get<string>('ALLOWED_IPS', '').split(',');
  }

  use(req: Request, res: Response, next: NextFunction) {
    const clientIP = this.getClientIP(req);
    
    if (this.allowedIPs.length > 0 && !this.allowedIPs.includes(clientIP)) {
      throw new ForbiddenException(`IP ${clientIP} 不在允許列表中`);
    }
    
    next();
  }

  private getClientIP(req: Request): string {
    return (
      req.headers['x-forwarded-for'] as string ||
      req.headers['x-real-ip'] as string ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      ''
    ).split(',')[0].trim();
  }
}
```

### 6.2 操作審計

#### 6.2.1 審計日誌攔截器
```typescript
// src/common/interceptors/audit-log.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { user, method, url, body } = request;
    
    const startTime = Date.now();
    
    return next.handle().pipe(
      tap(async (response) => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // 記錄審計日誌
        await this.prisma.auditLog.create({
          data: {
            adminId: user?.id,
            action: `${method} ${url}`,
            resource: this.extractResource(url),
            details: {
              method,
              url,
              body: this.sanitizeBody(body),
              duration,
              timestamp: new Date(),
              userAgent: request.headers['user-agent'],
              ip: this.getClientIP(request),
            },
            status: 'success',
          },
        });
      }),
    );
  }

  private extractResource(url: string): string {
    const parts = url.split('/');
    return parts[3] || 'unknown'; // /api/admin/v1/users -> users
  }

  private sanitizeBody(body: any): any {
    if (!body) return null;
    
    const sanitized = { ...body };
    
    // 移除敏感信息
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.secret;
    
    return sanitized;
  }

  private getClientIP(req: any): string {
    return (
      req.headers['x-forwarded-for'] ||
      req.headers['x-real-ip'] ||
      req.connection.remoteAddress ||
      ''
    ).split(',')[0].trim();
  }
}
```

## 7. 測試策略

### 7.1 前端測試

#### 7.1.1 組件測試
```typescript
// src/components/__tests__/DataTable.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DataTable } from '../Tables/DataTable';

const mockData = {
  data: [
    { id: '1', name: 'Test User', email: 'test@example.com' },
  ],
  total: 1,
};

const mockQueryFn = jest.fn().mockResolvedValue(mockData);

const columns = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Email', dataIndex: 'email', key: 'email' },
];

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('DataTable', () => {
  it('should render table with data', async () => {
    renderWithQueryClient(
      <DataTable
        columns={columns}
        queryKey={['test']}
        queryFn={mockQueryFn}
        rowKey="id"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });
});
```

### 7.2 後端測試

#### 7.2.1 服務測試
```typescript
// src/modules/auth/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '@/database/prisma.service';
import { TotpService } from './services/totp.service';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let totpService: TotpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            admin: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: TotpService,
          useValue: {
            verifyToken: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    totpService = module.get<TotpService>(TotpService);
  });

  describe('login', () => {
    it('should return access token for valid credentials', async () => {
      const mockAdmin = {
        id: '1',
        email: 'admin@example.com',
        password: await bcrypt.hash('password123', 10),
        totpSecret: 'secret',
        isActive: true,
        role: {
          name: 'admin',
          permissions: [{ name: 'users:read' }],
        },
      };

      jest.spyOn(prismaService.admin, 'findUnique').mockResolvedValue(mockAdmin);
      jest.spyOn(totpService, 'verifyToken').mockReturnValue(true);
      jest.spyOn(jwtService, 'sign').mockReturnValue('mock-token');

      const result = await service.login({
        email: 'admin@example.com',
        password: 'password123',
        totpCode: '123456',
      });

      expect(result).toEqual({
        accessToken: 'mock-token',
        user: expect.objectContaining({
          id: '1',
          email: 'admin@example.com',
        }),
      });
    });
  });
});
```

## 8. 部署指南

### 8.1 Docker 配置

#### 8.1.1 前端 Dockerfile
```dockerfile
# mking-admin-frontend/Dockerfile
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

#### 8.1.2 後端 Dockerfile
```dockerfile
# mking-admin-service/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

COPY . .
RUN npm run build
RUN npx prisma generate

FROM node:18-alpine AS production

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

EXPOSE 4001
CMD ["node", "dist/main.js"]
```

### 8.2 Kubernetes 部署

#### 8.2.1 部署配置
```yaml
# k8s/admin-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mking-admin-frontend
  namespace: mking-admin
spec:
  replicas: 2
  selector:
    matchLabels:
      app: mking-admin-frontend
  template:
    metadata:
      labels:
        app: mking-admin-frontend
    spec:
      containers:
      - name: frontend
        image: mking-admin-frontend:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mking-admin-service
  namespace: mking-admin
spec:
  replicas: 3
  selector:
    matchLabels:
      app: mking-admin-service
  template:
    metadata:
      labels:
        app: mking-admin-service
    spec:
      containers:
      - name: service
        image: mking-admin-service:latest
        ports:
        - containerPort: 4001
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: admin-secrets
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: admin-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 4001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 4001
          initialDelaySeconds: 5
          periodSeconds: 5
```

### 8.3 監控配置

#### 8.3.1 Prometheus 配置
```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'mking-admin-service'
    static_configs:
      - targets: ['mking-admin-service:4001']
    metrics_path: '/metrics'
    scrape_interval: 10s

  - job_name: 'mking-admin-frontend'
    static_configs:
      - targets: ['mking-admin-frontend:80']
    metrics_path: '/metrics'
    scrape_interval: 30s
```

## 9. 維護指南

### 9.1 日常維護任務

#### 9.1.1 數據庫維護
```sql
-- 清理過期的審計日誌（保留90天）
DELETE FROM audit_logs 
WHERE created_at < NOW() - INTERVAL '90 days';

-- 清理過期的會話記錄（保留30天）
DELETE FROM admin_sessions 
WHERE expires_at < NOW() - INTERVAL '30 days';

-- 更新統計數據
REFRESH MATERIALIZED VIEW user_statistics;
REFRESH MATERIALIZED VIEW content_statistics;
```

#### 9.1.2 性能監控
```typescript
// scripts/performance-check.ts
import { PrismaClient } from '@prisma/client';
import { performance } from 'perf_hooks';

const prisma = new PrismaClient();

async function checkDatabasePerformance() {
  const queries = [
    { name: 'User Count', query: () => prisma.user.count() },
    { name: 'Active Users', query: () => prisma.user.count({ where: { isActive: true } }) },
    { name: 'Recent Messages', query: () => prisma.message.count({ where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }) },
  ];

  for (const { name, query } of queries) {
    const start = performance.now();
    await query();
    const end = performance.now();
    
    console.log(`${name}: ${(end - start).toFixed(2)}ms`);
  }
}

checkDatabasePerformance().catch(console.error);
```

### 9.2 故障排除

#### 9.2.1 常見問題解決

**問題：管理員無法登入**
```bash
# 檢查管理員帳號狀態
psql -d mking_admin -c "SELECT id, email, is_active, last_login_at FROM admins WHERE email = 'admin@example.com';"

# 重置管理員密碼
node scripts/reset-admin-password.js admin@example.com newPassword123

# 檢查 2FA 設置
psql -d mking_admin -c "SELECT totp_secret IS NOT NULL as has_2fa FROM admins WHERE email = 'admin@example.com';"
```

**問題：系統響應緩慢**
```bash
# 檢查數據庫連接
psql -d mking_admin -c "SELECT count(*) FROM pg_stat_activity;"

# 檢查慢查詢
psql -d mking_admin -c "SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# 檢查 Redis 狀態
redis-cli info memory
redis-cli info stats
```

## 10. 最佳實踐

### 10.1 代碼品質

1. **TypeScript 嚴格模式**：啟用所有 TypeScript 嚴格檢查
2. **ESLint 規則**：使用嚴格的 ESLint 配置
3. **代碼審查**：所有代碼必須經過審查
4. **測試覆蓋率**：維持 80% 以上的測試覆蓋率

### 10.2 安全最佳實踐

1. **最小權限原則**：只授予必要的權限
2. **定期權限審查**：每季度審查管理員權限
3. **強制 2FA**：所有管理員必須啟用雙因子認證
4. **安全培訓**：定期進行安全意識培訓

### 10.3 性能優化

1. **數據庫索引**：為常用查詢添加適當索引
2. **快取策略**：合理使用 Redis 快取
3. **分頁查詢**：大數據集必須分頁
4. **圖片優化**：使用 CDN 和圖片壓縮

### 10.4 監控告警

1. **關鍵指標監控**：監控 CPU、內存、磁盤使用率
2. **業務指標監控**：監控用戶活躍度、錯誤率
3. **告警閾值設置**：設置合理的告警閾值
4. **告警處理流程**：建立完整的告警處理流程

## 11. 總結

本開發指南提供了 MKing Friend 後台管理系統的完整開發方案，涵蓋了從技術選型到部署維護的各個環節。通過遵循本指南，開發團隊可以構建一個安全、高效、易維護的管理後台系統。

### 11.1 關鍵成果

- 完整的技術架構設計
- 詳細的開發實施方案
- 全面的安全控制機制
- 完善的測試和部署策略
- 實用的維護和故障排除指南

### 11.2 後續計劃

1. **Phase 1**：基礎架構和核心功能開發（4-6週）
2. **Phase 2**：進階功能和安全加固（3-4週）
3. **Phase 3**：測試、部署和上線（2-3週）
4. **Phase 4**：監控優化和功能擴展（持續進行）

通過系統化的開發和實施，MKing Friend 後台管理系統將成為平台運營的強有力支撐工具。