# MKing Friend - 微服務開發指南

## 1. 開發環境準備

### 1.1 開發工具要求

#### 1.1.1 必需工具
```bash
# Node.js 18+ (推薦使用 nvm 管理版本)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# pnpm (推薦的包管理器)
npm install -g pnpm

# NestJS CLI
npm install -g @nestjs/cli

# Docker & Docker Compose
# 請從官網下載安裝

# Protocol Buffers 編譯器
# macOS
brew install protobuf
# Ubuntu
sudo apt-get install protobuf-compiler
```

#### 1.1.2 推薦工具
```bash
# gRPC 測試工具
go install github.com/fullstorydev/grpcurl/cmd/grpcurl@latest

# API 測試工具
npm install -g httpie

# 數據庫管理工具
npm install -g prisma

# 代碼品質工具
npm install -g eslint prettier
```

### 1.2 IDE 配置

#### 1.2.1 VS Code 推薦擴展
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "zxh404.vscode-proto3",
    "ms-vscode.vscode-docker",
    "ms-kubernetes-tools.vscode-kubernetes-tools",
    "redhat.vscode-yaml",
    "ms-vscode.vscode-json"
  ]
}
```

#### 1.2.2 工作區配置
```json
{
  "folders": [
    { "name": "API Gateway", "path": "./mking-friend-api-gateway" },
    { "name": "Auth Service", "path": "./mking-friend-auth-service" },
    { "name": "User Service", "path": "./mking-friend-user-service" },
    { "name": "Chat Service", "path": "./mking-friend-chat-service" },
    { "name": "Media Service", "path": "./mking-friend-media-service" },
    { "name": "Search Service", "path": "./mking-friend-search-service" },
    { "name": "Admin Service", "path": "./mking-friend-admin-service" },
    { "name": "Frontend", "path": "./mking-friend-frontend" },
    { "name": "Admin Frontend", "path": "./mking-friend-admin-frontend" },
    { "name": "Shared", "path": "./mking-friend-shared" }
  ],
  "settings": {
    "typescript.preferences.importModuleSpecifier": "relative",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": true
    }
  }
}
```

## 2. 微服務開發標準

### 2.1 項目初始化

#### 2.1.1 創建新微服務
```bash
# 使用 NestJS CLI 創建新項目
nest new mking-friend-{service-name}
cd mking-friend-{service-name}

# 安裝必要依賴
pnpm add @nestjs/microservices @grpc/grpc-js @grpc/proto-loader
pnpm add @nestjs/swagger swagger-ui-express
pnpm add @nestjs/config @nestjs/common @nestjs/core
pnpm add class-validator class-transformer
pnpm add @nestjs/terminus @nestjs/health-check

# 開發依賴
pnpm add -D @types/node typescript ts-node
pnpm add -D @nestjs/testing jest supertest
pnpm add -D eslint prettier @typescript-eslint/parser
```

#### 2.1.2 基礎配置文件

**tsconfig.json**
```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2020",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false,
    "paths": {
      "@/*": ["src/*"],
      "@shared/*": ["../mking-friend-shared/src/*"]
    }
  }
}
```

**nest-cli.json**
```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true,
    "watchAssets": true,
    "assets": ["**/*.proto"]
  }
}
```

### 2.2 代碼結構標準

#### 2.2.1 目錄結構
```
src/
├── main.ts                     # 應用入口
├── app.module.ts               # 根模組
├── config/                     # 配置管理
│   ├── index.ts
│   ├── database.config.ts
│   ├── grpc.config.ts
│   └── swagger.config.ts
├── common/                     # 共用組件
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── pipes/
│   └── utils/
├── modules/                    # 功能模組
│   ├── health/
│   │   ├── health.controller.ts
│   │   ├── health.module.ts
│   │   └── health.service.ts
│   └── {feature}/
│       ├── dto/
│       ├── entities/
│       ├── {feature}.controller.ts
│       ├── {feature}.service.ts
│       ├── {feature}.module.ts
│       └── {feature}.grpc.ts
├── proto/                      # gRPC 定義
│   ├── {service}.proto
│   └── generated/
├── database/                   # 數據庫相關
│   ├── migrations/
│   ├── seeds/
│   └── schema.prisma
└── tests/                      # 測試文件
    ├── unit/
    ├── integration/
    └── e2e/
```

#### 2.2.2 命名規範

**文件命名**
- **控制器**: `{feature}.controller.ts`
- **服務**: `{feature}.service.ts`
- **模組**: `{feature}.module.ts`
- **DTO**: `{action}-{feature}.dto.ts`
- **實體**: `{feature}.entity.ts`
- **gRPC**: `{feature}.grpc.ts`

**類命名**
```typescript
// 控制器
export class UserController {}

// 服務
export class UserService {}

// DTO
export class CreateUserDto {}
export class UpdateUserDto {}
export class UserResponseDto {}

// 實體
export class User {}

// gRPC 服務
export class UserGrpcService {}
```

### 2.3 配置管理

#### 2.3.1 環境配置

**.env.example**
```env
# 服務配置
SERVICE_NAME=auth-service
SERVICE_VERSION=1.0.0
NODE_ENV=development
PORT=3001
GRPC_PORT=50001

# 數據庫配置
DATABASE_URL=postgresql://postgres:password@localhost:5432/mking_friend
REDIS_URL=redis://localhost:6379

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# gRPC 配置
GRPC_AUTH_SERVICE_URL=localhost:50001
GRPC_USER_SERVICE_URL=localhost:50002
GRPC_CHAT_SERVICE_URL=localhost:50003

# 外部服務
CONSUL_HOST=localhost
CONSUL_PORT=8500

# 監控配置
PROMETHEUS_PORT=9090
JAEGER_ENDPOINT=http://localhost:14268/api/traces

# 日誌配置
LOG_LEVEL=info
LOG_FORMAT=json
```

#### 2.3.2 配置模組

**config/index.ts**
```typescript
import { ConfigModule } from '@nestjs/config';
import { databaseConfig } from './database.config';
import { grpcConfig } from './grpc.config';
import { jwtConfig } from './jwt.config';

export const configModule = ConfigModule.forRoot({
  isGlobal: true,
  load: [databaseConfig, grpcConfig, jwtConfig],
  envFilePath: ['.env.local', '.env'],
  validationSchema: Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    PORT: Joi.number().default(3000),
    GRPC_PORT: Joi.number().default(50000),
    DATABASE_URL: Joi.string().required(),
    JWT_SECRET: Joi.string().required(),
  }),
});
```

**config/database.config.ts**
```typescript
import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'mking_friend',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
}));
```

## 3. gRPC 服務開發

### 3.1 Protocol Buffers 定義

#### 3.1.1 服務定義範例

**proto/auth.proto**
```protobuf
syntax = "proto3";

package auth;

import "google/protobuf/timestamp.proto";
import "google/protobuf/empty.proto";

service AuthService {
  // 用戶認證
  rpc Login(LoginRequest) returns (LoginResponse);
  rpc Logout(LogoutRequest) returns (google.protobuf.Empty);
  rpc RefreshToken(RefreshTokenRequest) returns (TokenResponse);
  
  // 用戶註冊
  rpc Register(RegisterRequest) returns (RegisterResponse);
  rpc VerifyEmail(VerifyEmailRequest) returns (google.protobuf.Empty);
  
  // 密碼管理
  rpc ForgotPassword(ForgotPasswordRequest) returns (google.protobuf.Empty);
  rpc ResetPassword(ResetPasswordRequest) returns (google.protobuf.Empty);
  
  // 令牌驗證
  rpc ValidateToken(ValidateTokenRequest) returns (ValidateTokenResponse);
  rpc GetUserFromToken(GetUserFromTokenRequest) returns (UserResponse);
}

// 請求消息
message LoginRequest {
  string email = 1;
  string password = 2;
  string device_id = 3;
  string user_agent = 4;
}

message RegisterRequest {
  string email = 1;
  string password = 2;
  string username = 3;
  string first_name = 4;
  string last_name = 5;
  string phone = 6;
  google.protobuf.Timestamp birth_date = 7;
}

message RefreshTokenRequest {
  string refresh_token = 1;
  string device_id = 2;
}

message ValidateTokenRequest {
  string access_token = 1;
}

// 響應消息
message LoginResponse {
  string access_token = 1;
  string refresh_token = 2;
  UserResponse user = 3;
  google.protobuf.Timestamp expires_at = 4;
}

message TokenResponse {
  string access_token = 1;
  string refresh_token = 2;
  google.protobuf.Timestamp expires_at = 3;
}

message ValidateTokenResponse {
  bool valid = 1;
  string user_id = 2;
  repeated string permissions = 3;
}

message UserResponse {
  string id = 1;
  string email = 2;
  string username = 3;
  string first_name = 4;
  string last_name = 5;
  string avatar_url = 6;
  bool email_verified = 7;
  google.protobuf.Timestamp created_at = 8;
  google.protobuf.Timestamp updated_at = 9;
}
```

#### 3.1.2 生成 TypeScript 代碼

**scripts/generate-proto.sh**
```bash
#!/bin/bash

# 創建輸出目錄
mkdir -p src/proto/generated

# 生成 TypeScript 代碼
protoc \
  --plugin=protoc-gen-ts_proto=./node_modules/.bin/protoc-gen-ts_proto \
  --ts_proto_out=src/proto/generated \
  --ts_proto_opt=nestJs=true \
  --ts_proto_opt=addGrpcMetadata=true \
  --ts_proto_opt=addNestjsRestParameter=true \
  --proto_path=src/proto \
  src/proto/*.proto

echo "Proto files generated successfully!"
```

### 3.2 gRPC 服務實現

#### 3.2.1 gRPC 控制器

**modules/auth/auth.grpc.ts**
```typescript
import { Controller } from '@nestjs/common';
import { GrpcMethod, GrpcService } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ValidateTokenRequest,
  ValidateTokenResponse,
} from '@/proto/generated/auth';

@Controller()
@GrpcService('AuthService')
export class AuthGrpcController {
  constructor(private readonly authService: AuthService) {}

  @GrpcMethod('AuthService', 'Login')
  async login(request: LoginRequest): Promise<LoginResponse> {
    const result = await this.authService.login({
      email: request.email,
      password: request.password,
      deviceId: request.deviceId,
      userAgent: request.userAgent,
    });

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: {
        id: result.user.id,
        email: result.user.email,
        username: result.user.username,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        avatarUrl: result.user.avatarUrl,
        emailVerified: result.user.emailVerified,
        createdAt: { seconds: Math.floor(result.user.createdAt.getTime() / 1000), nanos: 0 },
        updatedAt: { seconds: Math.floor(result.user.updatedAt.getTime() / 1000), nanos: 0 },
      },
      expiresAt: { seconds: Math.floor(result.expiresAt.getTime() / 1000), nanos: 0 },
    };
  }

  @GrpcMethod('AuthService', 'Register')
  async register(request: RegisterRequest): Promise<RegisterResponse> {
    const result = await this.authService.register({
      email: request.email,
      password: request.password,
      username: request.username,
      firstName: request.firstName,
      lastName: request.lastName,
      phone: request.phone,
      birthDate: new Date(request.birthDate.seconds * 1000),
    });

    return {
      user: {
        id: result.id,
        email: result.email,
        username: result.username,
        firstName: result.firstName,
        lastName: result.lastName,
        avatarUrl: result.avatarUrl,
        emailVerified: result.emailVerified,
        createdAt: { seconds: Math.floor(result.createdAt.getTime() / 1000), nanos: 0 },
        updatedAt: { seconds: Math.floor(result.updatedAt.getTime() / 1000), nanos: 0 },
      },
    };
  }

  @GrpcMethod('AuthService', 'ValidateToken')
  async validateToken(request: ValidateTokenRequest): Promise<ValidateTokenResponse> {
    const result = await this.authService.validateToken(request.accessToken);

    return {
      valid: result.valid,
      userId: result.userId,
      permissions: result.permissions,
    };
  }
}
```

#### 3.2.2 gRPC 客戶端

**common/grpc/grpc-client.service.ts**
```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AuthServiceClient, UserServiceClient } from '@/proto/generated';

@Injectable()
export class GrpcClientService implements OnModuleInit {
  private authService: AuthServiceClient;
  private userService: UserServiceClient;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    // 認證服務客戶端
    const authClient: ClientGrpc = ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: 'auth',
        protoPath: join(__dirname, '../proto/auth.proto'),
        url: this.configService.get<string>('GRPC_AUTH_SERVICE_URL'),
      },
    });
    this.authService = authClient.getService<AuthServiceClient>('AuthService');

    // 用戶服務客戶端
    const userClient: ClientGrpc = ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: 'user',
        protoPath: join(__dirname, '../proto/user.proto'),
        url: this.configService.get<string>('GRPC_USER_SERVICE_URL'),
      },
    });
    this.userService = userClient.getService<UserServiceClient>('UserService');
  }

  getAuthService(): AuthServiceClient {
    return this.authService;
  }

  getUserService(): UserServiceClient {
    return this.userService;
  }
}
```

### 3.3 gRPC 配置

#### 3.3.1 微服務配置

**main.ts**
```typescript
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // HTTP 服務器（用於健康檢查和 Swagger）
  const httpPort = configService.get<number>('PORT', 3001);
  
  // gRPC 微服務
  const grpcPort = configService.get<number>('GRPC_PORT', 50001);
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'auth',
      protoPath: join(__dirname, 'proto/auth.proto'),
      url: `0.0.0.0:${grpcPort}`,
      loader: {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(httpPort);
  
  console.log(`🚀 HTTP Server running on port ${httpPort}`);
  console.log(`🔗 gRPC Server running on port ${grpcPort}`);
}

bootstrap();
```

## 4. RESTful API 開發

### 4.1 Swagger/OpenAPI 配置

#### 4.1.1 Swagger 設置

**config/swagger.config.ts**
```typescript
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication, serviceName: string, version: string) {
  const config = new DocumentBuilder()
    .setTitle(`MKing Friend - ${serviceName}`)
    .setDescription(`${serviceName} API documentation`)
    .setVersion(version)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Health', '健康檢查相關 API')
    .addTag('Auth', '認證相關 API')
    .addTag('Users', '用戶相關 API')
    .addServer('http://localhost:3000', 'Development server')
    .addServer('https://api.mking-friend.com', 'Production server')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  });

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      showRequestHeaders: true,
      tryItOutEnabled: true,
    },
    customSiteTitle: `${serviceName} API Documentation`,
    customfavIcon: '/favicon.ico',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js',
    ],
    customCssUrl: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
    ],
  });
}
```

#### 4.1.2 在 main.ts 中啟用 Swagger

```typescript
import { setupSwagger } from './config/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  
  // 設置 Swagger
  if (process.env.NODE_ENV !== 'production') {
    setupSwagger(
      app,
      configService.get<string>('SERVICE_NAME', 'Auth Service'),
      configService.get<string>('SERVICE_VERSION', '1.0.0')
    );
  }
  
  // ... 其他配置
}
```

### 4.2 DTO 和驗證

#### 4.2.1 DTO 定義

**modules/auth/dto/login.dto.ts**
```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: '用戶郵箱',
    example: 'user@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: '請輸入有效的郵箱地址' })
  @IsNotEmpty({ message: '郵箱不能為空' })
  email: string;

  @ApiProperty({
    description: '用戶密碼',
    example: 'password123',
    minLength: 6,
  })
  @IsString({ message: '密碼必須是字符串' })
  @MinLength(6, { message: '密碼長度至少為6位' })
  @IsNotEmpty({ message: '密碼不能為空' })
  password: string;

  @ApiProperty({
    description: '設備ID',
    example: 'device-uuid-123',
    required: false,
  })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiProperty({
    description: '用戶代理',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    required: false,
  })
  @IsOptional()
  @IsString()
  userAgent?: string;
}

export class LoginResponseDto {
  @ApiProperty({
    description: '訪問令牌',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: '刷新令牌',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: '用戶信息',
    type: () => UserResponseDto,
  })
  user: UserResponseDto;

  @ApiProperty({
    description: '令牌過期時間',
    example: '2024-12-31T23:59:59.000Z',
  })
  expiresAt: Date;
}
```

#### 4.2.2 響應 DTO

**modules/auth/dto/user-response.dto.ts**
```typescript
import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

export class UserResponseDto {
  @ApiProperty({
    description: '用戶ID',
    example: 'uuid-123-456-789',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: '用戶郵箱',
    example: 'user@example.com',
  })
  @Expose()
  email: string;

  @ApiProperty({
    description: '用戶名',
    example: 'john_doe',
  })
  @Expose()
  username: string;

  @ApiProperty({
    description: '名字',
    example: 'John',
  })
  @Expose()
  firstName: string;

  @ApiProperty({
    description: '姓氏',
    example: 'Doe',
  })
  @Expose()
  lastName: string;

  @ApiProperty({
    description: '頭像URL',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  @Expose()
  avatarUrl?: string;

  @ApiProperty({
    description: '郵箱是否已驗證',
    example: true,
  })
  @Expose()
  emailVerified: boolean;

  @ApiProperty({
    description: '創建時間',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: '更新時間',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  updatedAt: Date;

  // 排除敏感字段
  @Exclude()
  password: string;

  @Exclude()
  passwordHash: string;

  @Exclude()
  refreshTokens: any[];
}
```

### 4.3 控制器實現

#### 4.3.1 RESTful 控制器

**modules/auth/auth.controller.ts**
```typescript
import {
  Body,
  Controller,
  Post,
  Get,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { RegisterDto, RegisterResponseDto } from './dto/register.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserResponseDto } from './dto/user-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '用戶登錄',
    description: '使用郵箱和密碼進行用戶登錄，返回訪問令牌和用戶信息',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: '登錄成功',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '認證失敗',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: '郵箱或密碼錯誤' },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '請求參數錯誤',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'array', items: { type: 'string' } },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '用戶註冊',
    description: '創建新用戶賬戶',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: '註冊成功',
    type: RegisterResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: '用戶已存在',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: { type: 'string', example: '該郵箱已被註冊' },
        error: { type: 'string', example: 'Conflict' },
      },
    },
  })
  async register(@Body() registerDto: RegisterDto): Promise<RegisterResponseDto> {
    return this.authService.register(registerDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '獲取用戶資料',
    description: '獲取當前登錄用戶的詳細資料',
  })
  @ApiResponse({
    status: 200,
    description: '獲取成功',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '未授權',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: '令牌無效或已過期' },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  async getProfile(@CurrentUser() user: any): Promise<UserResponseDto> {
    return this.authService.getUserProfile(user.id);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '用戶登出',
    description: '登出當前用戶，使令牌失效',
  })
  @ApiResponse({
    status: 200,
    description: '登出成功',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: '登出成功' },
      },
    },
  })
  async logout(@CurrentUser() user: any): Promise<{ message: string }> {
    await this.authService.logout(user.id);
    return { message: '登出成功' };
  }
}
```

## 5. 數據庫集成

### 5.1 Prisma 配置

#### 5.1.1 Prisma Schema

**database/schema.prisma**
```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  username      String   @unique
  firstName     String   @map("first_name")
  lastName      String   @map("last_name")
  passwordHash  String   @map("password_hash")
  phone         String?
  birthDate     DateTime? @map("birth_date")
  avatarUrl     String?  @map("avatar_url")
  emailVerified Boolean  @default(false) @map("email_verified")
  isActive      Boolean  @default(true) @map("is_active")
  lastLoginAt   DateTime? @map("last_login_at")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  // 關聯
  refreshTokens RefreshToken[]
  sessions      UserSession[]
  
  @@map("users")
}

model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String   @map("user_id")
  deviceId  String?  @map("device_id")
  userAgent String?  @map("user_agent")
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("refresh_tokens")
}

model UserSession {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  deviceId  String?  @map("device_id")
  userAgent String?  @map("user_agent")
  ipAddress String?  @map("ip_address")
  isActive  Boolean  @default(true) @map("is_active")
  lastUsed  DateTime @default(now()) @map("last_used")
  createdAt DateTime @default(now()) @map("created_at")
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("user_sessions")
}
```

#### 5.1.2 Prisma 服務

**database/prisma.service.ts**
```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get<string>('DATABASE_URL'),
        },
      },
      log: configService.get<string>('NODE_ENV') === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('✅ Database connected successfully');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('❌ Database disconnected');
  }

  async enableShutdownHooks(app: any) {
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }

  // 健康檢查
  async isHealthy(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
```

### 5.2 Repository 模式

#### 5.2.1 用戶 Repository

**modules/auth/repositories/user.repository.ts**
```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { User, Prisma } from '@prisma/client';

@Injectable()
export class UserRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<User> {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  async findMany(
    params: {
      skip?: number;
      take?: number;
      cursor?: Prisma.UserWhereUniqueInput;
      where?: Prisma.UserWhereInput;
      orderBy?: Prisma.UserOrderByWithRelationInput;
    } = {},
  ): Promise<User[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.user.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async count(where?: Prisma.UserWhereInput): Promise<number> {
    return this.prisma.user.count({ where });
  }

  async updateLastLogin(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        lastLoginAt: new Date(),
      },
    });
  }
}
```

## 6. 測試策略

### 6.1 單元測試

#### 6.1.1 服務測試

**modules/auth/auth.service.spec.ts**
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UserRepository } from './repositories/user.repository';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<UserRepository>;
  let jwtService: jest.Mocked<JwtService>;
  let refreshTokenRepository: jest.Mocked<RefreshTokenRepository>;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    passwordHash: 'hashedPassword',
    emailVerified: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserRepository,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
            updateLastLogin: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: RefreshTokenRepository,
          useValue: {
            create: jest.fn(),
            findByToken: jest.fn(),
            deleteByUserId: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                JWT_SECRET: 'test-secret',
                JWT_EXPIRES_IN: '7d',
                JWT_REFRESH_EXPIRES_IN: '30d',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(UserRepository);
    jwtService = module.get(JwtService);
    refreshTokenRepository = module.get(RefreshTokenRepository);
  });

  describe('login', () => {
    it('should return tokens and user data for valid credentials', async () => {
      // Arrange
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
        deviceId: 'device-1',
        userAgent: 'test-agent',
      };

      userRepository.findByEmail.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      jwtService.sign.mockReturnValue('access-token');
      refreshTokenRepository.create.mockResolvedValue({
        id: 'refresh-1',
        token: 'refresh-token',
        userId: mockUser.id,
        expiresAt: new Date(),
        createdAt: new Date(),
      } as any);
      userRepository.updateLastLogin.mockResolvedValue(mockUser);

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: expect.objectContaining({
          id: mockUser.id,
          email: mockUser.email,
          username: mockUser.username,
        }),
        expiresAt: expect.any(Date),
      });
      expect(userRepository.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(loginDto.password, mockUser.passwordHash);
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      // Arrange
      const loginDto = {
        email: 'invalid@example.com',
        password: 'password123',
      };

      userRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      // Arrange
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      userRepository.findByEmail.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should create new user successfully', async () => {
      // Arrange
      const registerDto = {
        email: 'new@example.com',
        password: 'password123',
        username: 'newuser',
        firstName: 'New',
        lastName: 'User',
      };

      userRepository.findByEmail.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue('hashedPassword' as never);
      userRepository.create.mockResolvedValue({
        ...mockUser,
        email: registerDto.email,
        username: registerDto.username,
      });

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(result).toEqual({
        user: expect.objectContaining({
          email: registerDto.email,
          username: registerDto.username,
        }),
      });
      expect(userRepository.create).toHaveBeenCalledWith({
        email: registerDto.email,
        username: registerDto.username,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        passwordHash: 'hashedPassword',
      });
    });

    it('should throw ConflictException for existing email', async () => {
      // Arrange
      const registerDto = {
        email: 'existing@example.com',
        password: 'password123',
        username: 'newuser',
        firstName: 'New',
        lastName: 'User',
      };

      userRepository.findByEmail.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });
});
```

### 6.2 集成測試

#### 6.2.1 API 集成測試

**test/auth.e2e-spec.ts**
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        ConfigModule.forRoot({
          envFilePath: '.env.test',
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    
    await app.init();
  });

  beforeEach(async () => {
    // 清理測試數據
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user', () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.user).toBeDefined();
          expect(res.body.user.email).toBe(registerDto.email);
          expect(res.body.user.username).toBe(registerDto.username);
          expect(res.body.user.password).toBeUndefined();
        });
    });

    it('should return 409 for duplicate email', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
      };

      // 先註冊一個用戶
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      // 再次註冊相同郵箱
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...registerDto, username: 'testuser2' })
        .expect(409);
    });

    it('should return 400 for invalid email', () => {
      const registerDto = {
        email: 'invalid-email',
        password: 'password123',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    beforeEach(async () => {
      // 創建測試用戶
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
        });
    });

    it('should login with valid credentials', () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      return request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.accessToken).toBeDefined();
          expect(res.body.refreshToken).toBeDefined();
          expect(res.body.user).toBeDefined();
          expect(res.body.expiresAt).toBeDefined();
        });
    });

    it('should return 401 for invalid credentials', () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      return request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });
  });

  describe('/auth/profile (GET)', () => {
    let accessToken: string;

    beforeEach(async () => {
      // 註冊並登錄用戶
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
        });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      accessToken = loginResponse.body.accessToken;
    });

    it('should return user profile with valid token', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.email).toBe('test@example.com');
          expect(res.body.username).toBe('testuser');
          expect(res.body.password).toBeUndefined();
        });
    });

    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);
    });

    it('should return 401 with invalid token', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
```

## 7. 部署配置

### 7.1 Docker 配置

#### 7.1.1 Dockerfile

```dockerfile
# 多階段構建
FROM node:18-alpine AS builder

# 設置工作目錄
WORKDIR /app

# 複製 package 文件
COPY package*.json ./
COPY pnpm-lock.yaml ./

# 安裝 pnpm
RUN npm install -g pnpm

# 安裝依賴
RUN pnpm install --frozen-lockfile

# 複製源代碼
COPY . .

# 生成 Prisma 客戶端
RUN pnpm prisma generate

# 構建應用
RUN pnpm build

# 生產階段
FROM node:18-alpine AS production

# 安裝 dumb-init
RUN apk add --no-cache dumb-init

# 創建應用用戶
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# 設置工作目錄
WORKDIR /app

# 複製 package 文件
COPY package*.json ./
COPY pnpm-lock.yaml ./

# 安裝 pnpm 和生產依賴
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile --prod

# 從構建階段複製文件
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nestjs:nodejs /app/src/proto ./src/proto

# 切換到非 root 用戶
USER nestjs

# 暴露端口
EXPOSE 3000 50000

# 健康檢查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/health-check.js

# 啟動應用
CMD ["dumb-init", "node", "dist/main"]
```

#### 7.1.2 docker-compose.yml

```yaml
version: '3.8'

services:
  # API Gateway
  api-gateway:
    build:
      context: ./mking-friend-api-gateway
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
      - "50000:50000"
    environment:
      - NODE_ENV=development
      - PORT=3000
      - GRPC_PORT=50000
      - GRPC_AUTH_SERVICE_URL=auth-service:50001
      - GRPC_USER_SERVICE_URL=user-service:50002
      - GRPC_CHAT_SERVICE_URL=chat-service:50003
      - GRPC_MEDIA_SERVICE_URL=media-service:50005
      - GRPC_ADMIN_SERVICE_URL=admin-service:50006
    depends_on:
      - auth-service
      - user-service
      - chat-service
      - media-service
      - admin-service
    networks:
      - mking-network

  # 認證服務
  auth-service:
    build:
      context: ./mking-friend-auth-service
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
      - "50001:50001"
    environment:
      - NODE_ENV=development
      - PORT=3001
      - GRPC_PORT=50001
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/mking_friend
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=your-super-secret-jwt-key
    depends_on:
      - postgres
      - redis
    networks:
      - mking-network

  # 用戶服務
  user-service:
    build:
      context: ./mking-friend-user-service
      dockerfile: Dockerfile
    ports:
      - "3002:3002"
      - "50002:50002"
    environment:
      - NODE_ENV=development
      - PORT=3002
      - GRPC_PORT=50002
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/mking_friend
      - REDIS_URL=redis://redis:6379
      - GRPC_AUTH_SERVICE_URL=auth-service:50001
    depends_on:
      - postgres
      - redis
      - auth-service
    networks:
      - mking-network

  # 聊天服務
  chat-service:
    build:
      context: ./mking-friend-chat-service
      dockerfile: Dockerfile
    ports:
      - "3003:3003"
      - "3004:3004"
      - "50003:50003"
    environment:
      - NODE_ENV=development
      - PORT=3003
      - WEBSOCKET_PORT=3004
      - GRPC_PORT=50003
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/mking_friend
      - REDIS_URL=redis://redis:6379
      - GRPC_AUTH_SERVICE_URL=auth-service:50001
      - GRPC_USER_SERVICE_URL=user-service:50002
    depends_on:
      - postgres
      - redis
      - auth-service
      - user-service
    networks:
      - mking-network

  # 媒體服務
  media-service:
    build:
      context: ./mking-friend-media-service
      dockerfile: Dockerfile
    ports:
      - "3005:3005"
      - "50005:50005"
    environment:
      - NODE_ENV=development
      - PORT=3005
      - GRPC_PORT=50005
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/mking_friend
      - REDIS_URL=redis://redis:6379
      - AWS_ACCESS_KEY_ID=your-access-key
      - AWS_SECRET_ACCESS_KEY=your-secret-key
      - AWS_REGION=us-west-2
      - AWS_S3_BUCKET=mking-friend-media
    depends_on:
      - postgres
      - redis
    networks:
      - mking-network

  # 搜尋服務
  search-service:
    build:
      context: ./mking-friend-search-service
      dockerfile: Dockerfile
    ports:
      - "3006:3006"
      - "50006:50006"
    environment:
      - NODE_ENV=development
      - PORT=3006
      - GRPC_PORT=50006
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/mking_friend
      - REDIS_URL=redis://redis:6379
      - TYPESENSE_URL=http://typesense:8108
      - TYPESENSE_API_KEY=xyz
      - GRPC_USER_SERVICE_URL=user-service:50002
    depends_on:
      - postgres
      - redis
      - typesense
      - user-service
    networks:
      - mking-network

  # 管理服務
  admin-service:
    build:
      context: ./mking-friend-admin-service
      dockerfile: Dockerfile
    ports:
      - "3007:3007"
      - "50007:50007"
    environment:
      - NODE_ENV=development
      - PORT=3007
      - GRPC_PORT=50007
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/mking_friend
      - REDIS_URL=redis://redis:6379
      - GRPC_AUTH_SERVICE_URL=auth-service:50001
      - GRPC_USER_SERVICE_URL=user-service:50002
    depends_on:
      - postgres
      - redis
      - auth-service
      - user-service
    networks:
      - mking-network

  # PostgreSQL 數據庫
  postgres:
    image: postgres:14-alpine
    environment:
      - POSTGRES_DB=mking_friend
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql
    networks:
      - mking-network

  # Redis 緩存
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    networks:
      - mking-network

  # Typesense 搜尋引擎
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

  # Consul 服務發現
  consul:
    image: consul:1.15
    ports:
      - "8500:8500"
      - "8600:8600/udp"
    command: agent -server -ui -node=server-1 -bootstrap-expect=1 -client=0.0.0.0
    networks:
      - mking-network

volumes:
  postgres_data:
  redis_data:
  typesense_data:

networks:
  mking-network:
    driver: bridge
```

### 8. 監控與日誌

#### 8.1 健康檢查

每個微服務都應該實現健康檢查端點：

```typescript
// src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prisma: PrismaHealthIndicator,
  ) {}

  @Get()
  @ApiOperation({ summary: '健康檢查' })
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.prisma.pingCheck('database'),
    ]);
  }
}
```

#### 8.2 Prometheus 指標

```typescript
// src/metrics/metrics.service.ts
import { Injectable } from '@nestjs/common';
import { register, Counter, Histogram, Gauge } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
  });

  private readonly httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route'],
    buckets: [0.1, 0.5, 1, 2, 5],
  });

  private readonly grpcRequestsTotal = new Counter({
    name: 'grpc_requests_total',
    help: 'Total number of gRPC requests',
    labelNames: ['method', 'status'],
  });

  private readonly activeConnections = new Gauge({
    name: 'active_connections',
    help: 'Number of active connections',
  });

  constructor() {
    register.registerMetric(this.httpRequestsTotal);
    register.registerMetric(this.httpRequestDuration);
    register.registerMetric(this.grpcRequestsTotal);
    register.registerMetric(this.activeConnections);
  }

  incrementHttpRequests(method: string, route: string, statusCode: number) {
    this.httpRequestsTotal.inc({ method, route, status_code: statusCode });
  }

  observeHttpDuration(method: string, route: string, duration: number) {
    this.httpRequestDuration.observe({ method, route }, duration);
  }

  incrementGrpcRequests(method: string, status: string) {
    this.grpcRequestsTotal.inc({ method, status });
  }

  setActiveConnections(count: number) {
    this.activeConnections.set(count);
  }

  getMetrics() {
    return register.metrics();
  }
}
```

#### 8.3 結構化日誌

```typescript
// src/logger/logger.service.ts
import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';

@Injectable()
export class CustomLoggerService implements LoggerService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      defaultMeta: {
        service: process.env.SERVICE_NAME || 'unknown-service',
        version: process.env.SERVICE_VERSION || '1.0.0',
      },
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
      ],
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }
}
```

### 9. 安全配置

#### 9.1 環境變量管理

```typescript
// src/config/configuration.ts
import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  grpcPort: parseInt(process.env.GRPC_PORT, 10) || 50000,
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    url: process.env.REDIS_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },
  grpc: {
    authService: process.env.GRPC_AUTH_SERVICE_URL,
    userService: process.env.GRPC_USER_SERVICE_URL,
    chatService: process.env.GRPC_CHAT_SERVICE_URL,
    mediaService: process.env.GRPC_MEDIA_SERVICE_URL,
    adminService: process.env.GRPC_ADMIN_SERVICE_URL,
  },
}));
```

#### 9.2 安全中間件

```typescript
// src/middleware/security.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // 設置安全標頭
    helmet()(req, res, () => {
      // 速率限制
      const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 分鐘
        max: 100, // 限制每個 IP 100 個請求
        message: 'Too many requests from this IP',
      });
      
      limiter(req, res, next);
    });
  }
}
```

### 10. 部署配置

#### 10.1 Kubernetes 部署

```yaml
# k8s/api-gateway-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  labels:
    app: api-gateway
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api-gateway
        image: mking-friend/api-gateway:latest
        ports:
        - containerPort: 3000
        - containerPort: 50000
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3000"
        - name: GRPC_PORT
          value: "50000"
        - name: GRPC_AUTH_SERVICE_URL
          value: "auth-service:50001"
        - name: GRPC_USER_SERVICE_URL
          value: "user-service:50002"
        - name: GRPC_CHAT_SERVICE_URL
          value: "chat-service:50003"
        - name: GRPC_MEDIA_SERVICE_URL
          value: "media-service:50005"
        - name: GRPC_ADMIN_SERVICE_URL
          value: "admin-service:50006"
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
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: api-gateway
spec:
  selector:
    app: api-gateway
  ports:
  - name: http
    port: 3000
    targetPort: 3000
  - name: grpc
    port: 50000
    targetPort: 50000
  type: LoadBalancer
```

#### 10.2 CI/CD 流程

```yaml
# .github/workflows/deploy.yml
name: Deploy Microservice

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'pnpm'
    
    - name: Install pnpm
      run: npm install -g pnpm
    
    - name: Install dependencies
      run: pnpm install --frozen-lockfile
    
    - name: Run tests
      run: pnpm test
    
    - name: Run e2e tests
      run: pnpm test:e2e

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Login to Container Registry
      uses: docker/login-action@v2
      with:
        registry: ghcr.io
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Build and push
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: |
          ghcr.io/${{ github.repository }}:latest
          ghcr.io/${{ github.repository }}:${{ github.sha }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to Kubernetes
      run: |
        echo "${{ secrets.KUBECONFIG }}" | base64 -d > kubeconfig
        export KUBECONFIG=kubeconfig
        kubectl set image deployment/${{ github.event.repository.name }} \
          ${{ github.event.repository.name }}=ghcr.io/${{ github.repository }}:${{ github.sha }}
        kubectl rollout status deployment/${{ github.event.repository.name }}
```

### 11. 最佳實踐

#### 11.1 代碼品質

1. **ESLint 配置**：
   ```json
   {
     "extends": [
       "@nestjs",
       "prettier"
     ],
     "rules": {
       "@typescript-eslint/interface-name-prefix": "off",
       "@typescript-eslint/explicit-function-return-type": "off",
       "@typescript-eslint/explicit-module-boundary-types": "off",
       "@typescript-eslint/no-explicit-any": "error"
     }
   }
   ```

2. **Prettier 配置**：
   ```json
   {
     "singleQuote": true,
     "trailingComma": "all",
     "tabWidth": 2,
     "semi": true,
     "printWidth": 100
   }
   ```

#### 11.2 性能優化

1. **連接池配置**：
   ```typescript
   // prisma/schema.prisma
   generator client {
     provider = "prisma-client-js"
   }
   
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. **Redis 緩存策略**：
   ```typescript
   @Injectable()
   export class CacheService {
     constructor(@Inject('REDIS_CLIENT') private redis: Redis) {}
   
     async get<T>(key: string): Promise<T | null> {
       const value = await this.redis.get(key);
       return value ? JSON.parse(value) : null;
     }
   
     async set(key: string, value: any, ttl: number = 3600): Promise<void> {
       await this.redis.setex(key, ttl, JSON.stringify(value));
     }
   
     async del(key: string): Promise<void> {
       await this.redis.del(key);
     }
   }
   ```

#### 11.3 錯誤處理

```typescript
// src/filters/grpc-exception.filter.ts
import { Catch, ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

@Catch(RpcException)
export class GrpcExceptionFilter implements ExceptionFilter {
  catch(exception: RpcException, host: ArgumentsHost) {
    const error = exception.getError();
    
    if (typeof error === 'object' && 'code' in error) {
      return error;
    }
    
    return {
      code: status.INTERNAL,
      message: exception.message,
    };
  }
}
```

### 12. 故障排除

#### 12.1 常見問題

1. **gRPC 連接失敗**：
   - 檢查服務發現配置
   - 驗證網絡連通性
   - 查看服務健康狀態

2. **數據庫連接問題**：
   - 檢查連接字符串
   - 驗證數據庫權限
   - 查看連接池狀態

3. **性能問題**：
   - 監控 CPU 和內存使用
   - 分析慢查詢
   - 檢查緩存命中率

#### 12.2 調試工具

1. **gRPC 調試**：
   ```bash
   # 使用 grpcurl 測試 gRPC 服務
   grpcurl -plaintext localhost:50001 list
   grpcurl -plaintext -d '{"email":"test@example.com"}' \
     localhost:50001 auth.AuthService/ValidateUser
   ```

2. **日誌查看**：
   ```bash
   # Docker 日誌
   docker logs -f mking-friend-auth-service
   
   # Kubernetes 日誌
   kubectl logs -f deployment/auth-service
   ```

### 13. 總結

本開發指南涵蓋了 MKing Friend 微服務架構的完整開發流程，包括：

- 開發環境準備和工具配置
- 微服務項目結構和代碼規範
- gRPC 服務開發和 RESTful API 實現
- 數據庫集成和測試策略
- Docker 容器化和部署配置
- 監控、日誌和安全配置
- 性能優化和故障排除

遵循這些規範和最佳實踐，可以確保微服務的高質量、可維護性和可擴展性。