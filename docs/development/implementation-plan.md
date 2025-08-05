# MKing Friend - Implementation Plan

## Technical Decisions

### Selected Technology Stack (Free Self-Hosted)
- **Backend**: Node.js + NestJS + TypeScript
- **Frontend**: React.js + TypeScript + Ant Design
- **Database**: PostgreSQL + Prisma ORM + Redis
- **File Storage**: MinIO (S3-compatible object storage)
- **Authentication Service**: Keycloak (Open-source OAuth 2.0)
- **Real-time Communication**: Socket.io
- **Analytics & Monitoring**: Plausible + Grafana + Prometheus
- **Log Management**: Grafana Loki + Promtail (Based on recommended solution)
- **Email Service**: Nodemailer + SMTP (MailHog for development, MailerSend for production)
- **Error Tracking**: Sentry (Self-hosted)
- **Testing**: Jest + Supertest
- **Deployment**: Docker + Docker Compose

### Decision Rationale
1. **Team Skill Alignment**: Team is familiar with TypeScript and Node.js ecosystem
2. **Development Efficiency**: NestJS provides complete enterprise-level framework structure
3. **Type Safety**: Full-stack TypeScript ensures type consistency
4. **Ecosystem**: Rich npm package ecosystem
5. **Maintainability**: Modular architecture facilitates long-term maintenance

## Development Phase Planning

### Phase 1: Infrastructure (Week 1-2)

#### 1.1 Project Initialization
```bash
# Backend project initialization
npm i -g @nestjs/cli
nest new mking-friend-backend
cd mking-friend-backend

# Install core dependencies
npm install @nestjs/config @nestjs/jwt @nestjs/passport
npm install @prisma/client prisma
npm install class-validator class-transformer
npm install @nestjs/swagger swagger-ui-express

# Install development dependencies
npm install -D @types/node @types/jest
npm install -D eslint prettier
```

#### 1.2 Project Structure Design
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

#### 1.3 Core Configuration

**Environment Configuration (.env)**
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

# MinIO File Storage
MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_ACCESS_KEY="admin"
MINIO_SECRET_KEY="password123"
MINIO_BUCKET_NAME="mking-frnd-media"
```

**Prisma Schema Basic Structure**
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

### Phase 2: Authentication System (Week 3-4)

#### 2.1 Auth Module Development

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

#### 2.2 API Endpoint Design

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
  @ApiOperation({ summary: 'User Registration' })
  @ApiResponse({ status: 201, description: 'Registration successful' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User Login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
```

### Phase 3: User Management (Week 5-6)

#### 3.1 User Module Development

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
      throw new NotFoundException('User not found');
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

### Phase 4: Real-time Communication (Week 7-8)

#### 4.1 Socket.io Integration

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
    // Handle message sending logic
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

### Phase 5: Testing Strategy (Ongoing)

#### 5.1 Unit Testing

**Service Test Example**
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

#### 5.2 E2E Testing

**Auth E2E Test**
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
        displayName: 'Test User',
      })
      .expect(201);
  });
});
```

## Deployment Strategy

### Docker Configuration

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

## Risk Management

### Technical Risks
1. **Learning Curve**: NestJS may have learning costs for the team
   - **Mitigation**: Provide training resources and documentation
2. **Performance Considerations**: TypeScript compilation time
   - **Mitigation**: Use SWC compiler for acceleration
3. **Dependency Management**: npm package security
   - **Mitigation**: Regular security audits and updates

### Project Risks
1. **Schedule Delays**: Complex feature development time estimation
   - **Mitigation**: Agile development, phased delivery
2. **Resource Shortage**: Development manpower limitations
   - **Mitigation**: Prioritize core feature development

## Next Steps

1. **Immediate Actions**:
   - [ ] Establish NestJS project structure
   - [ ] Configure development environment
   - [ ] Set up CI/CD pipeline

2. **Complete This Week**:
   - [ ] Complete authentication system development
   - [ ] Establish basic testing framework
   - [ ] Configure database migrations

3. **Next Week Goals**:
   - [ ] User management features
   - [ ] API documentation improvement
   - [ ] Frontend integration testing

## Success Metrics

- **Technical Metrics**:
  - Test coverage > 80%
  - API response time < 200ms
  - Zero security vulnerabilities

- **Business Metrics**:
  - MVP feature completeness 100%
  - User registration process success rate > 95%
  - System availability > 99.5%