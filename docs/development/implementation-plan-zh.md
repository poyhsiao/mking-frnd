# MKing Friend - 實施計劃

## 技術決策

### 選定技術棧 (免費 Self-Hosted)
- **後端**: Node.js + NestJS + TypeScript
- **前端**: React.js + TypeScript + Ant Design
- **資料庫**: PostgreSQL + Prisma ORM + Redis
- **檔案存儲**: MinIO (S3 兼容對象存儲)
- **認證服務**: Keycloak (開源 OAuth 2.0)
- **即時通訊**: Socket.io
- **分析監控**: Plausible + Grafana + Prometheus
- **日誌管理**: Grafana Loki + Promtail (基於推薦方案)
- **郵件服務**: Nodemailer + SMTP (開發環境使用 MailHog，生產環境使用 MailerSend)
- **錯誤追蹤**: Sentry (Self-hosted)
- **測試**: Jest + Supertest
- **部署**: Docker + Docker Compose

### 決策理由
1. **團隊技能匹配**: 團隊熟悉 TypeScript 和 Node.js 生態系統
2. **開發效率**: NestJS 提供完整的企業級框架結構
3. **類型安全**: 全棧 TypeScript 確保類型一致性
4. **生態系統**: 豐富的 npm 套件生態系統
5. **可維護性**: 模組化架構便於長期維護

## 開發階段規劃

### Phase 1: 基礎設施 (Week 1-2)

#### 1.1 專案初始化
```bash
# 後端專案初始化
npm i -g @nestjs/cli
nest new mking-friend-backend
cd mking-friend-backend

# 安裝核心依賴
npm install @nestjs/config @nestjs/jwt @nestjs/passport
npm install @prisma/client prisma
npm install class-validator class-transformer
npm install @nestjs/swagger swagger-ui-express

# 安裝開發依賴
npm install -D @types/node @types/jest
npm install -D eslint prettier
```

#### 1.2 專案結構設計
```
src/
├── app.module.ts
├── main.ts
├── common/
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   └── pipes/
├── config/
│   ├── database.config.ts
│   └── jwt.config.ts
├── modules/
│   ├── auth/
│   ├── users/
│   ├── chat/
│   └── media/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
└── shared/
    ├── dto/
    ├── entities/
    └── interfaces/
```

#### 1.3 核心配置

**環境配置 (.env)**
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/mking_friend"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379

# Keycloak OAuth
KEYCLOAK_URL="http://localhost:8080"
KEYCLOAK_REALM="mking-frnd"
KEYCLOAK_CLIENT_ID="mking-frnd-client"
KEYCLOAK_CLIENT_SECRET="your-keycloak-client-secret"

# MinIO 檔案存儲
MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_ACCESS_KEY="admin"
MINIO_SECRET_KEY="password123"
MINIO_BUCKET_NAME="mking-frnd-media"
```

**Prisma Schema 基礎結構**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String?
  provider  String   @default("local")
  providerId String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  profile   Profile?
  
  @@map("users")
}

model Profile {
  id          String   @id @default(cuid())
  userId      String   @unique
  displayName String
  avatar      String?
  bio         String?
  birthDate   DateTime?
  gender      String?
  location    String?
  interests   String[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("profiles")
}
```

### Phase 2: 認證系統 (Week 3-4)

#### 2.1 Auth Module 開發

**JWT Strategy**
```typescript
// src/modules/auth/strategies/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, email: payload.email };
  }
}
```

**Auth Service**
```typescript
// src/modules/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    
    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        password: hashedPassword,
        profile: {
          create: {
            displayName: registerDto.displayName,
          },
        },
      },
      include: { profile: true },
    });

    const tokens = await this.generateTokens(user.id, user.email);
    return { user, tokens };
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    const tokens = await this.generateTokens(user.id, user.email);
    return { user, tokens };
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    return {
      accessToken: await this.jwtService.signAsync(payload),
    };
  }
}
```

#### 2.2 API 端點設計

**Auth Controller**
```typescript
// src/modules/auth/auth.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: '用戶註冊' })
  @ApiResponse({ status: 201, description: '註冊成功' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '用戶登入' })
  @ApiResponse({ status: 200, description: '登入成功' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
```

### Phase 3: 用戶管理 (Week 5-6)

#### 3.1 User Module 開發

**User Service**
```typescript
// src/modules/users/users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundException('用戶不存在');
    }

    return user;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    return this.prisma.profile.update({
      where: { userId },
      data: updateProfileDto,
    });
  }
}
```

### Phase 4: 即時通訊 (Week 7-8)

#### 4.1 Socket.io 整合

**Chat Gateway**
```typescript
// src/modules/chat/chat.gateway.ts
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('sendMessage')
  handleMessage(
    @MessageBody() data: { content: string; receiverId: string },
    @ConnectedSocket() client: Socket,
  ) {
    // 處理訊息發送邏輯
    return { event: 'messageReceived', data };
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }
}
```

### Phase 5: 測試策略 (持續進行)

#### 5.1 單元測試

**Service 測試範例**
```typescript
// src/modules/auth/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

#### 5.2 E2E 測試

**Auth E2E 測試**
```typescript
// test/auth.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/auth/register (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        displayName: '測試用戶',
      })
      .expect(201);
  });
});
```

## 部署策略

### Docker 配置

**Dockerfile**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```

**docker-compose.yml**
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/mking_friend
      - REDIS_HOST=redis
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: mking_friend
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

## 風險管理

### 技術風險
1. **學習曲線**: NestJS 對團隊可能有學習成本
   - **緩解**: 提供培訓資源和文檔
2. **性能考量**: TypeScript 編譯時間
   - **緩解**: 使用 SWC 編譯器加速
3. **依賴管理**: npm 套件安全性
   - **緩解**: 定期安全審計和更新

### 項目風險
1. **時程延遲**: 複雜功能開發時間估算
   - **緩解**: 敏捷開發，分階段交付
2. **資源不足**: 開發人力限制
   - **緩解**: 優先開發核心功能

## 下一步行動

1. **立即執行**:
   - [ ] 建立 NestJS 專案結構
   - [ ] 配置開發環境
   - [ ] 設置 CI/CD 流程

2. **本週內完成**:
   - [ ] 完成認證系統開發
   - [ ] 建立基礎測試框架
   - [ ] 配置資料庫遷移

3. **下週目標**:
   - [ ] 用戶管理功能
   - [ ] API 文檔完善
   - [ ] 前端整合測試

## 成功指標

- **技術指標**:
  - 測試覆蓋率 > 80%
  - API 響應時間 < 200ms
  - 零安全漏洞

- **業務指標**:
  - MVP 功能完整性 100%
  - 用戶註冊流程成功率 > 95%
  - 系統可用性 > 99.5%