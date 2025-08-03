# MKing Friend - Microservices Development Guide

## 1. Development Environment Setup

### 1.1 Development Tool Requirements

#### 1.1.1 Required Tools
```bash
# Node.js 18+ (recommended to use nvm for version management)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# pnpm (recommended package manager)
npm install -g pnpm

# NestJS CLI
npm install -g @nestjs/cli

# Docker & Docker Compose
# Please download and install from official website

# Protocol Buffers compiler
# macOS
brew install protobuf
# Ubuntu
sudo apt-get install protobuf-compiler
```

#### 1.1.2 Recommended Tools
```bash
# gRPC testing tool
go install github.com/fullstorydev/grpcurl/cmd/grpcurl@latest

# API testing tool
npm install -g httpie

# Database management tool
npm install -g prisma

# Code quality tools
npm install -g eslint prettier
```

### 1.2 IDE Configuration

#### 1.2.1 VS Code Recommended Extensions
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

#### 1.2.2 Workspace Configuration
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

## 2. Microservices Development Standards

### 2.1 Project Initialization

#### 2.1.1 Creating a New Microservice
```bash
# Use NestJS CLI to create new project
nest new mking-friend-{service-name}
cd mking-friend-{service-name}

# Install necessary dependencies
pnpm add @nestjs/microservices @grpc/grpc-js @grpc/proto-loader
pnpm add @nestjs/swagger swagger-ui-express
pnpm add @nestjs/config @nestjs/common @nestjs/core
pnpm add class-validator class-transformer
pnpm add @nestjs/terminus @nestjs/health-check

# Development dependencies
pnpm add -D @types/node typescript ts-node
pnpm add -D @nestjs/testing jest supertest
pnpm add -D eslint prettier @typescript-eslint/parser
```

#### 2.1.2 Basic Configuration Files

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

### 2.2 Code Structure Standards

#### 2.2.1 Directory Structure
```
src/
├── main.ts                     # Application entry point
├── app.module.ts               # Root module
├── config/                     # Configuration management
│   ├── index.ts
│   ├── database.config.ts
│   ├── grpc.config.ts
│   └── swagger.config.ts
├── common/                     # Shared components
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── pipes/
│   └── utils/
├── modules/                    # Feature modules
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
├── proto/                      # gRPC definitions
│   ├── {service}.proto
│   └── generated/
├── database/                   # Database related
│   ├── migrations/
│   ├── seeds/
│   └── schema.prisma
└── tests/                      # Test files
    ├── unit/
    ├── integration/
    └── e2e/
```

#### 2.2.2 Naming Conventions

**File Naming**
- **Controllers**: `{feature}.controller.ts`
- **Services**: `{feature}.service.ts`
- **Modules**: `{feature}.module.ts`
- **DTOs**: `{action}-{feature}.dto.ts`
- **Entities**: `{feature}.entity.ts`
- **gRPC**: `{feature}.grpc.ts`

**Class Naming**
```typescript
// Controllers
export class UserController {}

// Services
export class UserService {}

// DTOs
export class CreateUserDto {}
export class UpdateUserDto {}
export class UserResponseDto {}

// Entities
export class User {}

// gRPC Services
export class UserGrpcService {}
```

### 2.3 Configuration Management

#### 2.3.1 Environment Configuration

**.env.example**
```env
# Service configuration
SERVICE_NAME=auth-service
SERVICE_VERSION=1.0.0
NODE_ENV=development
PORT=3001
GRPC_PORT=50001

# Database configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/mking_friend
REDIS_URL=redis://localhost:6379

# JWT configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# gRPC configuration
GRPC_AUTH_SERVICE_URL=localhost:50001
GRPC_USER_SERVICE_URL=localhost:50002
GRPC_CHAT_SERVICE_URL=localhost:50003

# External services
CONSUL_HOST=localhost
CONSUL_PORT=8500

# Monitoring configuration
PROMETHEUS_PORT=9090
JAEGER_ENDPOINT=http://localhost:14268/api/traces

# Logging configuration
LOG_LEVEL=info
LOG_FORMAT=json
```

#### 2.3.2 Configuration Module

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

## 3. gRPC Service Development

### 3.1 Protocol Buffers Definition

#### 3.1.1 Service Definition Example

**proto/auth.proto**
```protobuf
syntax = "proto3";

package auth;

import "google/protobuf/timestamp.proto";
import "google/protobuf/empty.proto";

service AuthService {
  // User authentication
  rpc Login(LoginRequest) returns (LoginResponse);
  rpc Logout(LogoutRequest) returns (google.protobuf.Empty);
  rpc RefreshToken(RefreshTokenRequest) returns (TokenResponse);
  
  // User registration
  rpc Register(RegisterRequest) returns (RegisterResponse);
  rpc VerifyEmail(VerifyEmailRequest) returns (google.protobuf.Empty);
  
  // Password management
  rpc ForgotPassword(ForgotPasswordRequest) returns (google.protobuf.Empty);
  rpc ResetPassword(ResetPasswordRequest) returns (google.protobuf.Empty);
  
  // Token validation
  rpc ValidateToken(ValidateTokenRequest) returns (ValidateTokenResponse);
  rpc GetUserFromToken(GetUserFromTokenRequest) returns (UserResponse);
}

// Request messages
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

// Response messages
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
}
```

#### 3.1.2 Code Generation

```bash
# Generate TypeScript definitions from proto files
npx proto-loader-gen-types --grpcLib=@grpc/grpc-js --outDir=src/proto/generated proto/*.proto

# Or use protoc directly
protoc --plugin=protoc-gen-ts_proto=./node_modules/.bin/protoc-gen-ts_proto \
  --ts_proto_out=src/proto/generated \
  --ts_proto_opt=nestJs=true \
  --ts_proto_opt=addGrpcMetadata=true \
  proto/*.proto
```

#### 3.1.3 TypeScript Code Generation

**scripts/generate-proto.sh**
```bash
#!/bin/bash

# Create output directory
mkdir -p src/proto/generated

# Generate TypeScript code
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

### 3.2 gRPC Service Implementation

#### 3.2.1 gRPC Controller

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

#### 3.2.2 gRPC Client

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
    // Auth service client
    const authClient: ClientGrpc = ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: 'auth',
        protoPath: join(__dirname, '../proto/auth.proto'),
        url: this.configService.get<string>('GRPC_AUTH_SERVICE_URL'),
      },
    });
    this.authService = authClient.getService<AuthServiceClient>('AuthService');

    // User service client
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

### 3.3 gRPC Configuration

#### 3.3.1 Microservice Configuration

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

  // HTTP server (for health checks and Swagger)
  const httpPort = configService.get<number>('PORT', 3001);
  
  // gRPC microservice
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

  ## 4. RESTful API Development

  ### 4.1 Swagger/OpenAPI Configuration

  #### 4.1.1 Swagger Setup

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
      .addTag('Health', 'Health check related APIs')
      .addTag('Auth', 'Authentication related APIs')
      .addTag('Users', 'User related APIs')
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

  #### 4.1.2 Enable Swagger in main.ts

  ```typescript
  import { setupSwagger } from './config/swagger.config';

  async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);
    
    // Setup Swagger
    if (process.env.NODE_ENV !== 'production') {
      setupSwagger(
        app,
        configService.get<string>('SERVICE_NAME', 'Auth Service'),
        configService.get<string>('SERVICE_VERSION', '1.0.0')
      );
    }
    
    // ... other configurations
  }
  ```

  ### 4.2 DTOs and Validation

  #### 4.2.1 DTO Definition

  **modules/auth/dto/login.dto.ts**
  ```typescript
  import { ApiProperty } from '@nestjs/swagger';
  import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

  export class LoginDto {
    @ApiProperty({
      description: 'User email',
      example: 'user@example.com',
      format: 'email',
    })
    @IsEmail({}, { message: 'Please enter a valid email address' })
    @IsNotEmpty({ message: 'Email cannot be empty' })
    email: string;

    @ApiProperty({
      description: 'User password',
      example: 'password123',
      minLength: 6,
    })
    @IsString({ message: 'Password must be a string' })
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    @IsNotEmpty({ message: 'Password cannot be empty' })
    password: string;

    @ApiProperty({
      description: 'Device ID',
      example: 'device-uuid-123',
      required: false,
    })
    @IsOptional()
    @IsString()
    deviceId?: string;

    @ApiProperty({
      description: 'User agent',
      example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      required: false,
    })
    @IsOptional()
    @IsString()
    userAgent?: string;
  }

  export class LoginResponseDto {
    @ApiProperty({
      description: 'Access token',
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    })
    accessToken: string;

    @ApiProperty({
      description: 'Refresh token',
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    })
    refreshToken: string;

    @ApiProperty({
      description: 'User information',
      type: () => UserResponseDto,
    })
    user: UserResponseDto;

    @ApiProperty({
      description: 'Token expiration time',
      example: '2024-12-31T23:59:59.000Z',
    })
    expiresAt: Date;
  }
  ```

  #### 4.2.2 Response DTO

  **modules/auth/dto/user-response.dto.ts**
  ```typescript
  import { ApiProperty } from '@nestjs/swagger';
  import { Exclude, Expose } from 'class-transformer';

  export class UserResponseDto {
    @ApiProperty({
      description: 'User ID',
      example: 'uuid-123-456-789',
    })
    @Expose()
    id: string;

    @ApiProperty({
      description: 'User email',
      example: 'user@example.com',
    })
    @Expose()
    email: string;

    @ApiProperty({
      description: 'Username',
      example: 'john_doe',
    })
    @Expose()
    username: string;

    @ApiProperty({
      description: 'First name',
      example: 'John',
    })
    @Expose()
    firstName: string;

    @ApiProperty({
      description: 'Last name',
      example: 'Doe',
    })
    @Expose()
    lastName: string;

    @ApiProperty({
      description: 'Avatar URL',
      example: 'https://example.com/avatar.jpg',
      required: false,
    })
    @Expose()
    avatarUrl?: string;

    @ApiProperty({
      description: 'Email verification status',
      example: true,
    })
    @Expose()
    emailVerified: boolean;

    @ApiProperty({
      description: 'Creation time',
      example: '2024-01-01T00:00:00.000Z',
    })
    @Expose()
    createdAt: Date;

    @ApiProperty({
      description: 'Update time',
      example: '2024-01-01T00:00:00.000Z',
    })
    @Expose()
    updatedAt: Date;

    // Exclude sensitive fields
    @Exclude()
    password: string;

    @Exclude()
    passwordHash: string;

    @Exclude()
    refreshTokens: any[];
  }
  ```

  ### 4.3 Controller Implementation

  #### 4.3.1 RESTful Controller

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
      summary: 'User login',
      description: 'Login with email and password, returns access token and user information',
    })
    @ApiBody({ type: LoginDto })
    @ApiResponse({
      status: 200,
      description: 'Login successful',
      type: LoginResponseDto,
    })
    @ApiResponse({
      status: 401,
      description: 'Authentication failed',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 401 },
          message: { type: 'string', example: 'Invalid email or password' },
          error: { type: 'string', example: 'Unauthorized' },
        },
      },
    })
    @ApiResponse({
      status: 400,
      description: 'Invalid request parameters',
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
      summary: 'User registration',
      description: 'Create a new user account',
    })
    @ApiBody({ type: RegisterDto })
    @ApiResponse({
      status: 201,
      description: 'Registration successful',
      type: RegisterResponseDto,
    })
    @ApiResponse({
      status: 409,
      description: 'User already exists',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 409 },
          message: { type: 'string', example: 'Email already registered' },
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
      summary: 'Get user profile',
      description: 'Get detailed profile of the currently logged-in user',
    })
    @ApiResponse({
      status: 200,
      description: 'Profile retrieved successfully',
      type: UserResponseDto,
    })
    @ApiResponse({
      status: 401,
      description: 'Unauthorized',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 401 },
          message: { type: 'string', example: 'Invalid or expired token' },
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
      summary: 'User logout',
      description: 'Logout current user and invalidate token',
    })
    @ApiResponse({
      status: 200,
      description: 'Logout successful',
      schema: {
        type: 'object',
        properties: {