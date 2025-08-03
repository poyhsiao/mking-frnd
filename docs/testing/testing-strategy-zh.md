# MKing Friend - 測試策略文檔

## 1. 測試策略概述

### 1.1 測試理念
- **測試驅動開發 (TDD)**: 先寫測試，再寫實現
- **品質保證**: 確保代碼品質和功能正確性
- **持續整合**: 自動化測試流程
- **全面覆蓋**: 單元測試、整合測試、端到端測試
- **效能監控**: 效能測試和負載測試

### 1.2 測試金字塔

```
        /\     E2E Tests (10%)
       /  \    - 用戶流程測試
      /    \   - 跨系統整合
     /______\  
    /        \ Integration Tests (20%)
   /          \ - API 測試
  /            \ - 資料庫測試
 /              \ - 服務整合
/________________\
Unit Tests (70%)
- 函數測試
- 組件測試
- 邏輯測試
```

### 1.3 測試目標
- **代碼覆蓋率**: 目標 90% 以上
- **分支覆蓋率**: 目標 85% 以上
- **測試執行時間**: 單元測試 < 5分鐘，整合測試 < 15分鐘
- **測試穩定性**: 測試通過率 > 98%
- **缺陷檢出率**: 在開發階段檢出 95% 以上的缺陷

## 2. TDD 實施策略

### 2.1 TDD 循環

#### 2.1.1 Red-Green-Refactor 循環
```
1. Red (紅燈)
   - 寫一個失敗的測試
   - 確保測試會失敗
   - 測試應該簡單且專注

2. Green (綠燈)
   - 寫最少的代碼讓測試通過
   - 不考慮代碼品質
   - 只關注功能實現

3. Refactor (重構)
   - 改善代碼品質
   - 保持測試通過
   - 消除重複代碼
```

#### 2.1.2 TDD 最佳實踐

**測試命名規範**
```typescript
// 格式: should_ExpectedBehavior_When_StateUnderTest
describe('UserService', () => {
  describe('createUser', () => {
    it('should_ReturnUser_When_ValidDataProvided', async () => {
      // 測試實現
    });
    
    it('should_ThrowValidationError_When_EmailIsInvalid', async () => {
      // 測試實現
    });
    
    it('should_ThrowConflictError_When_EmailAlreadyExists', async () => {
      // 測試實現
    });
  });
});
```

**AAA 模式 (Arrange-Act-Assert)**
```typescript
it('should_ReturnUser_When_ValidDataProvided', async () => {
  // Arrange - 準備測試資料
  const userData = {
    email: 'test@example.com',
    password: 'securePassword123',
    displayName: '測試用戶'
  };
  const mockRepository = createMockRepository();
  const userService = new UserService(mockRepository);
  
  // Act - 執行被測試的方法
  const result = await userService.createUser(userData);
  
  // Assert - 驗證結果
  expect(result).toBeDefined();
  expect(result.email).toBe(userData.email);
  expect(result.id).toBeTruthy();
  expect(mockRepository.save).toHaveBeenCalledWith(
    expect.objectContaining(userData)
  );
});
```

### 2.2 TDD 工作流程

#### 2.2.1 功能開發流程
```
1. 分析需求
   - 理解業務需求
   - 定義驗收標準
   - 識別邊界條件

2. 設計測試案例
   - 正常情況測試
   - 異常情況測試
   - 邊界條件測試

3. 實施 TDD 循環
   - 寫失敗測試
   - 實現功能
   - 重構代碼

4. 整合測試
   - API 測試
   - 資料庫測試
   - 服務整合測試

5. 驗收測試
   - 端到端測試
   - 用戶流程測試
```

#### 2.2.2 代碼審查檢查清單
- [ ] 所有新功能都有對應的測試
- [ ] 測試覆蓋率達到標準
- [ ] 測試命名清晰且有意義
- [ ] 測試獨立且可重複執行
- [ ] 沒有重複的測試邏輯
- [ ] 測試資料準備充分
- [ ] 異常情況有適當的測試

## 3. 測試類型和策略

### 3.1 單元測試

#### 3.1.1 前端單元測試

**React 組件測試**
```typescript
// UserProfile.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { UserProfile } from './UserProfile';

describe('UserProfile', () => {
  const mockUser = {
    id: '1',
    displayName: '張小美',
    email: 'test@example.com',
    avatarUrl: 'https://example.com/avatar.jpg'
  };

  it('should_DisplayUserInformation_When_UserDataProvided', () => {
    // Arrange
    render(<UserProfile user={mockUser} />);
    
    // Act & Assert
    expect(screen.getByText('張小美')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', mockUser.avatarUrl);
  });

  it('should_CallOnEdit_When_EditButtonClicked', () => {
    // Arrange
    const mockOnEdit = jest.fn();
    render(<UserProfile user={mockUser} onEdit={mockOnEdit} />);
    
    // Act
    fireEvent.click(screen.getByRole('button', { name: '編輯' }));
    
    // Assert
    expect(mockOnEdit).toHaveBeenCalledWith(mockUser.id);
  });
});
```

**Redux Store 測試**
```typescript
// userSlice.test.ts
import { configureStore } from '@reduxjs/toolkit';
import userReducer, { setUser, clearUser } from './userSlice';

describe('userSlice', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        user: userReducer
      }
    });
  });

  it('should_SetUser_When_SetUserActionDispatched', () => {
    // Arrange
    const userData = { id: '1', displayName: '張小美' };
    
    // Act
    store.dispatch(setUser(userData));
    
    // Assert
    const state = store.getState();
    expect(state.user.currentUser).toEqual(userData);
    expect(state.user.isAuthenticated).toBe(true);
  });
});
```

#### 3.1.2 後端單元測試

**Service 層測試**
```typescript
// UserService.test.ts
import { UserService } from './UserService';
import { UserRepository } from './UserRepository';
import { EmailService } from './EmailService';

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockEmailService: jest.Mocked<EmailService>;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: jest.fn(),
      save: jest.fn(),
      findById: jest.fn()
    } as any;
    
    mockEmailService = {
      sendVerificationEmail: jest.fn()
    } as any;
    
    userService = new UserService(mockUserRepository, mockEmailService);
  });

  describe('createUser', () => {
    it('should_CreateUser_When_ValidDataProvided', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'securePassword123',
        displayName: '張小美'
      };
      
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.save.mockResolvedValue({
        id: '1',
        ...userData,
        createdAt: new Date()
      });
      
      // Act
      const result = await userService.createUser(userData);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.email).toBe(userData.email);
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalledWith(
        userData.email
      );
    });

    it('should_ThrowConflictError_When_EmailAlreadyExists', async () => {
      // Arrange
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        displayName: '測試用戶'
      };
      
      mockUserRepository.findByEmail.mockResolvedValue({
        id: '1',
        email: userData.email
      } as any);
      
      // Act & Assert
      await expect(userService.createUser(userData))
        .rejects
        .toThrow('Email already exists');
    });
  });
});
```

**Repository 層測試**
```typescript
// UserRepository.test.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UserService', () => {
  let userService: UserService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService, PrismaService],
    }).compile();

    userService = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    await prisma.user.deleteMany(); // 清空測試資料
  });

  it('should_CreateUser_When_ValidUserProvided', async () => {
    // Arrange
    const userData = {
      email: 'test@example.com',
      password: 'securePassword123',
      displayName: '張小美'
    };
    
    // Act
    const savedUser = await userService.create(userData);
    
    // Assert
    expect(savedUser.id).toBeDefined();
    expect(savedUser.email).toBe(userData.email);
    expect(savedUser.profile.displayName).toBe(userData.displayName);
    expect(savedUser.createdAt).toBeDefined();
  });
});
```

### 3.2 整合測試

#### 3.2.1 API 整合測試

```typescript
// UserAPI.integration.test.ts
import request from 'supertest';
import { app } from '../app';
import { getConnection } from 'typeorm';

describe('User API Integration Tests', () => {
  let connection: any;
  let authToken: string;

  beforeAll(async () => {
    connection = await getConnection('test');
    await connection.synchronize(true);
  });

  afterAll(async () => {
    await connection.close();
  });

  beforeEach(async () => {
    await connection.synchronize(true);
    
    // 創建測試用戶並獲取 token
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test@example.com',
        password: 'securePassword123',
        displayName: '測試用戶'
      });
    
    authToken = response.body.data.tokens.accessToken;
  });

  describe('GET /api/v1/users/me', () => {
    it('should_ReturnUserProfile_When_AuthenticatedUserRequests', async () => {
      // Act
      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('test@example.com');
      expect(response.body.data.profile.displayName).toBe('測試用戶');
    });

    it('should_Return401_When_NoAuthTokenProvided', async () => {
      // Act
      const response = await request(app)
        .get('/api/v1/users/me');
      
      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/users/{userId}/like', () => {
    let targetUserId: string;

    beforeEach(async () => {
      // 創建目標用戶
      const targetUser = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'target@example.com',
          password: 'password123',
          displayName: '目標用戶'
        });
      
      targetUserId = targetUser.body.data.user.id;
    });

    it('should_CreateLike_When_ValidUserIdProvided', async () => {
      // Act
      const response = await request(app)
        .post(`/api/v1/users/${targetUserId}/like`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ type: 'like' });
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.liked).toBe(true);
    });

    it('should_CreateMatch_When_MutualLikeOccurs', async () => {
      // Arrange - 目標用戶先按讚當前用戶
      const targetUserToken = await getAuthToken('target@example.com');
      const currentUserId = await getCurrentUserId(authToken);
      
      await request(app)
        .post(`/api/v1/users/${currentUserId}/like`)
        .set('Authorization', `Bearer ${targetUserToken}`)
        .send({ type: 'like' });
      
      // Act - 當前用戶按讚目標用戶
      const response = await request(app)
        .post(`/api/v1/users/${targetUserId}/like`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ type: 'like' });
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.isMatch).toBe(true);
      expect(response.body.data.matchId).toBeDefined();
    });
  });
});
```

#### 3.2.2 資料庫整合測試

```typescript
// Database.integration.test.ts
import { getConnection, Connection } from 'typeorm';
import { User } from '../entities/User';
import { Like } from '../entities/Like';
import { Match } from '../entities/Match';

describe('Database Integration Tests', () => {
  let connection: Connection;

  beforeAll(async () => {
    connection = await getConnection('test');
  });

  beforeEach(async () => {
    await connection.synchronize(true);
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('User-Like-Match Relationships', () => {
    it('should_CreateMatch_When_MutualLikesExist', async () => {
      // Arrange
      const user1 = await connection.manager.save(User, {
        email: 'user1@example.com',
        passwordHash: 'hash1',
        displayName: '用戶1'
      });
      
      const user2 = await connection.manager.save(User, {
        email: 'user2@example.com',
        passwordHash: 'hash2',
        displayName: '用戶2'
      });
      
      // Act
      await connection.manager.save(Like, {
        likerId: user1.id,
        likedId: user2.id,
        type: 'like'
      });
      
      await connection.manager.save(Like, {
        likerId: user2.id,
        likedId: user1.id,
        type: 'like'
      });
      
      const match = await connection.manager.save(Match, {
        user1Id: user1.id,
        user2Id: user2.id
      });
      
      // Assert
      expect(match.id).toBeDefined();
      expect(match.user1Id).toBe(user1.id);
      expect(match.user2Id).toBe(user2.id);
      
      // 驗證關聯查詢
      const matchWithUsers = await connection.manager
        .createQueryBuilder(Match, 'match')
        .leftJoinAndSelect('match.user1', 'user1')
        .leftJoinAndSelect('match.user2', 'user2')
        .where('match.id = :id', { id: match.id })
        .getOne();
      
      expect(matchWithUsers?.user1.displayName).toBe('用戶1');
      expect(matchWithUsers?.user2.displayName).toBe('用戶2');
    });
  });
});
```

### 3.3 端到端測試 (E2E)

#### 3.3.1 用戶註冊流程測試

```typescript
// UserRegistration.e2e.test.ts
import { test, expect } from '@playwright/test';

test.describe('User Registration Flow', () => {
  test('should_CompleteRegistration_When_ValidDataProvided', async ({ page }) => {
    // Arrange
    await page.goto('/register');
    
    // Act
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'securePassword123');
    await page.fill('[data-testid="confirm-password-input"]', 'securePassword123');
    await page.fill('[data-testid="display-name-input"]', '張小美');
    await page.selectOption('[data-testid="gender-select"]', 'female');
    await page.fill('[data-testid="birth-date-input"]', '1995-05-15');
    await page.check('[data-testid="terms-checkbox"]');
    
    await page.click('[data-testid="register-button"]');
    
    // Assert
    await expect(page).toHaveURL('/verify-email');
    await expect(page.locator('[data-testid="verification-message"]'))
      .toContainText('驗證郵件已發送到 test@example.com');
  });

  test('should_ShowValidationErrors_When_InvalidDataProvided', async ({ page }) => {
    // Arrange
    await page.goto('/register');
    
    // Act
    await page.fill('[data-testid="email-input"]', 'invalid-email');
    await page.fill('[data-testid="password-input"]', '123');
    await page.click('[data-testid="register-button"]');
    
    // Assert
    await expect(page.locator('[data-testid="email-error"]'))
      .toContainText('請輸入有效的電子郵件地址');
    await expect(page.locator('[data-testid="password-error"]'))
      .toContainText('密碼至少需要8個字符');
  });
});
```

#### 3.3.2 聊天功能測試

```typescript
// Chat.e2e.test.ts
import { test, expect } from '@playwright/test';

test.describe('Chat Functionality', () => {
  test('should_SendAndReceiveMessages_When_UsersAreMatched', async ({ 
    browser 
  }) => {
    // Arrange - 創建兩個瀏覽器上下文模擬兩個用戶
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    // 用戶1登入
    await page1.goto('/login');
    await page1.fill('[data-testid="email-input"]', 'user1@example.com');
    await page1.fill('[data-testid="password-input"]', 'password123');
    await page1.click('[data-testid="login-button"]');
    
    // 用戶2登入
    await page2.goto('/login');
    await page2.fill('[data-testid="email-input"]', 'user2@example.com');
    await page2.fill('[data-testid="password-input"]', 'password123');
    await page2.click('[data-testid="login-button"]');
    
    // Act - 用戶1進入聊天室
    await page1.goto('/matches');
    await page1.click('[data-testid="match-item"]:first-child');
    
    // 用戶2也進入同一個聊天室
    await page2.goto('/matches');
    await page2.click('[data-testid="match-item"]:first-child');
    
    // 用戶1發送訊息
    await page1.fill('[data-testid="message-input"]', '你好！很高興認識你');
    await page1.click('[data-testid="send-button"]');
    
    // Assert - 用戶2應該能看到訊息
    await expect(page2.locator('[data-testid="message-list"]'))
      .toContainText('你好！很高興認識你');
    
    // 用戶2回覆
    await page2.fill('[data-testid="message-input"]', '你好！我也很高興認識你');
    await page2.click('[data-testid="send-button"]');
    
    // 用戶1應該能看到回覆
    await expect(page1.locator('[data-testid="message-list"]'))
      .toContainText('你好！我也很高興認識你');
    
    await context1.close();
    await context2.close();
  });
});
```

### 3.4 效能測試

#### 3.4.1 負載測試

```typescript
// LoadTest.ts
import { check } from 'k6';
import http from 'k6/http';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // 2分鐘內增加到100用戶
    { duration: '5m', target: 100 }, // 維持100用戶5分鐘
    { duration: '2m', target: 200 }, // 2分鐘內增加到200用戶
    { duration: '5m', target: 200 }, // 維持200用戶5分鐘
    { duration: '2m', target: 0 },   // 2分鐘內減少到0用戶
  ],
  thresholds: {
    http_req_duration: ['p(99)<1500'], // 99%的請求在1.5秒內完成
    http_req_failed: ['rate<0.1'],     // 錯誤率小於10%
  },
};

export default function () {
  // 測試用戶登入
  let loginResponse = http.post('https://api.mkingfriend.com/v1/auth/login', {
    email: 'test@example.com',
    password: 'password123'
  });
  
  check(loginResponse, {
    'login status is 200': (r) => r.status === 200,
    'login response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  if (loginResponse.status === 200) {
    let token = JSON.parse(loginResponse.body).data.tokens.accessToken;
    
    // 測試獲取用戶列表
    let usersResponse = http.get('https://api.mkingfriend.com/v1/users/discover', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    check(usersResponse, {
      'users status is 200': (r) => r.status === 200,
      'users response time < 1000ms': (r) => r.timings.duration < 1000,
    });
  }
}
```

#### 3.4.2 壓力測試

```typescript
// StressTest.ts
import { check } from 'k6';
import http from 'k6/http';
import { Rate } from 'k6/metrics';

let errorRate = new Rate('errors');

export let options = {
  stages: [
    { duration: '10m', target: 1000 }, // 10分鐘內增加到1000用戶
    { duration: '30m', target: 1000 }, // 維持1000用戶30分鐘
    { duration: '10m', target: 0 },    // 10分鐘內減少到0用戶
  ],
  thresholds: {
    errors: ['rate<0.05'], // 錯誤率小於5%
    http_req_duration: ['p(95)<2000'], // 95%的請求在2秒內完成
  },
};

export default function () {
  // 模擬真實用戶行為
  let responses = http.batch([
    ['GET', 'https://api.mkingfriend.com/v1/users/discover'],
    ['GET', 'https://api.mkingfriend.com/v1/matches'],
    ['GET', 'https://api.mkingfriend.com/v1/conversations'],
  ]);
  
  responses.forEach((response) => {
    let success = check(response, {
      'status is 200': (r) => r.status === 200,
    });
    
    errorRate.add(!success);
  });
}
```

## 4. 測試工具和框架

### 4.1 前端測試工具

#### 4.1.1 Jest + React Testing Library
```json
// package.json
{
  "devDependencies": {
    "@testing-library/react": "^13.4.0",
    "@testing-library/jest-dom": "^5.16.5",
    "@testing-library/user-event": "^14.4.3",
    "jest": "^29.3.1",
    "jest-environment-jsdom": "^29.3.1"
  }
}
```

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapping: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/reportWebVitals.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    }
  }
};
```

#### 4.1.2 Playwright (E2E)
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 4.2 後端測試工具

#### 4.2.1 Jest + Supertest
```json
// package.json
{
  "devDependencies": {
    "jest": "^29.3.1",
    "supertest": "^6.3.3",
    "@types/jest": "^29.2.4",
    "@types/supertest": "^2.0.12",
    "ts-jest": "^29.0.3"
  }
}
```

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/migrations/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  testTimeout: 30000
};
```

#### 4.2.2 NestJS 測試設定
```typescript
// setupTests.ts
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../src/prisma/prisma.service';
import { AppModule } from '../src/app.module';

let app: INestApplication;
let prisma: PrismaService;

beforeAll(async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();
  prisma = app.get<PrismaService>(PrismaService);
  await app.init();
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  // 清空測試資料
  await prisma.user.deleteMany();
  await prisma.profile.deleteMany();
});
```

### 4.3 測試資料管理

#### 4.3.1 測試資料工廠
```typescript
// TestDataFactory.ts
import { faker } from '@faker-js/faker';
import { User } from '../entities/User';

export class TestDataFactory {
  static createUser(overrides: Partial<User> = {}): Partial<User> {
    return {
      email: faker.internet.email(),
      passwordHash: faker.internet.password(),
      displayName: faker.person.fullName(),
      birthDate: faker.date.birthdate({ min: 18, max: 50, mode: 'age' }),
      gender: faker.helpers.arrayElement(['male', 'female', 'other']),
      bio: faker.lorem.paragraph(),
      location: {
        city: faker.location.city(),
        country: faker.location.country()
      },
      ...overrides
    };
  }

  static createUsers(count: number, overrides: Partial<User> = {}): Partial<User>[] {
    return Array.from({ length: count }, () => this.createUser(overrides));
  }

  static createMessage(overrides: any = {}) {
    return {
      content: faker.lorem.sentence(),
      type: 'text',
      senderId: faker.string.uuid(),
      conversationId: faker.string.uuid(),
      ...overrides
    };
  }
}
```

#### 4.3.2 測試資料清理
```typescript
// TestDataCleaner.ts
import { getConnection } from 'typeorm';

export class TestDataCleaner {
  static async cleanAll(): Promise<void> {
    const connection = getConnection();
    const entities = connection.entityMetadatas;

    for (const entity of entities) {
      const repository = connection.getRepository(entity.name);
      await repository.clear();
    }
  }

  static async cleanEntity(entityName: string): Promise<void> {
    const connection = getConnection();
    const repository = connection.getRepository(entityName);
    await repository.clear();
  }
}
```

## 5. CI/CD 整合

### 5.1 GitHub Actions 設定

```yaml
# .github/workflows/test.yml
name: Test Suite

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
          POSTGRES_DB: mking_friend_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
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
    
    - name: Run type checking
      run: npm run type-check
    
    - name: Run unit tests
      run: npm run test:unit
      env:
        NODE_ENV: test
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/mking_friend_test
        REDIS_URL: redis://localhost:6379
    
    - name: Run integration tests
      run: npm run test:integration
      env:
        NODE_ENV: test
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/mking_friend_test
        REDIS_URL: redis://localhost:6379
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        flags: unittests
        name: codecov-umbrella

  e2e:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Install Playwright
      run: npx playwright install --with-deps
    
    - name: Build application
      run: npm run build
    
    - name: Run E2E tests
      run: npm run test:e2e
    
    - name: Upload Playwright report
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 30
```

### 5.2 測試腳本

```json
// package.json
{
  "scripts": {
    "test": "npm run test:unit && npm run test:integration",
    "test:unit": "jest --config jest.unit.config.js",
    "test:integration": "jest --config jest.integration.config.js",
    "test:e2e": "playwright test",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:load": "k6 run tests/load/load-test.js",
    "test:stress": "k6 run tests/stress/stress-test.js"
  }
}
```

## 6. 測試報告和監控

### 6.1 覆蓋率報告

```typescript
// coverage-reporter.ts
import { CoverageReporter } from 'jest';

class CustomCoverageReporter implements CoverageReporter {
  onCoverageResult(test: any, coverageResult: any) {
    const { coverageMap } = coverageResult;
    
    // 生成詳細的覆蓋率報告
    const summary = coverageMap.getCoverageSummary();
    
    console.log('Coverage Summary:');
    console.log(`Lines: ${summary.lines.pct}%`);
    console.log(`Functions: ${summary.functions.pct}%`);
    console.log(`Branches: ${summary.branches.pct}%`);
    console.log(`Statements: ${summary.statements.pct}%`);
    
    // 檢查是否達到覆蓋率目標
    if (summary.lines.pct < 90) {
      console.warn('Warning: Line coverage below 90%');
    }
  }
}

export default CustomCoverageReporter;
```

### 6.2 測試結果通知

```typescript
// test-notifier.ts
import { SlackWebhook } from '@slack/webhook';

class TestNotifier {
  private webhook: SlackWebhook;
  
  constructor(webhookUrl: string) {
    this.webhook = new SlackWebhook(webhookUrl);
  }
  
  async notifyTestResults(results: TestResults) {
    const message = {
      text: 'Test Results',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Test Results for ${results.branch}*`
          }
        },
        {
          type: 'fields',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Total Tests:* ${results.total}`
            },
            {
              type: 'mrkdwn',
              text: `*Passed:* ${results.passed}`
            },
            {
              type: 'mrkdwn',
              text: `*Failed:* ${results.failed}`
            },
            {
              type: 'mrkdwn',
              text: `*Coverage:* ${results.coverage}%`
            }
          ]
        }
      ]
    };
    
    await this.webhook.send(message);
  }
}
```

## 7. 測試最佳實踐

### 7.1 測試原則

1. **FIRST 原則**
   - **Fast**: 測試應該快速執行
   - **Independent**: 測試之間應該獨立
   - **Repeatable**: 測試應該可重複執行
   - **Self-Validating**: 測試應該有明確的通過/失敗結果
   - **Timely**: 測試應該及時編寫

2. **測試金字塔**
   - 70% 單元測試
   - 20% 整合測試
   - 10% 端到端測試

3. **測試命名**
   - 使用描述性的測試名稱
   - 包含預期行為和條件
   - 使用一致的命名格式

### 7.2 常見陷阱和解決方案

#### 7.2.1 測試依賴性
```typescript
// ❌ 錯誤：測試之間有依賴
describe('UserService', () => {
  let userId: string;
  
  it('should create user', async () => {
    const user = await userService.createUser(userData);
    userId = user.id; // 其他測試依賴這個 ID
  });
  
  it('should update user', async () => {
    await userService.updateUser(userId, updateData); // 依賴前一個測試
  });
});

// ✅ 正確：每個測試獨立
describe('UserService', () => {
  it('should create user', async () => {
    const user = await userService.createUser(userData);
    expect(user.id).toBeDefined();
  });
  
  it('should update user', async () => {
    // 在測試內部創建所需的資料
    const user = await userService.createUser(userData);
    const updatedUser = await userService.updateUser(user.id, updateData);
    expect(updatedUser.displayName).toBe(updateData.displayName);
  });
});
```

#### 7.2.2 過度模擬
```typescript
// ❌ 錯誤：過度模擬
it('should calculate total price', () => {
  const mockMath = {
    add: jest.fn().mockReturnValue(100),
    multiply: jest.fn().mockReturnValue(120)
  };
  
  const calculator = new PriceCalculator(mockMath);
  const result = calculator.calculateTotal(items);
  
  expect(result).toBe(120);
});

// ✅ 正確：只模擬外部依賴
it('should calculate total price with tax', () => {
  const mockTaxService = {
    getTaxRate: jest.fn().mockReturnValue(0.2)
  };
  
  const calculator = new PriceCalculator(mockTaxService);
  const result = calculator.calculateTotal([{ price: 100 }]);
  
  expect(result).toBe(120); // 100 + 20% tax
});
```

### 7.3 測試維護

#### 7.3.1 定期審查測試
- 每月審查測試覆蓋率
- 識別和移除重複測試
- 更新過時的測試
- 重構複雜的測試

#### 7.3.2 測試文檔
```markdown
# 測試文檔

## 測試策略
- 描述整體測試方法
- 說明測試類型和範圍
- 定義品質標準

## 測試環境
- 測試環境設定
- 測試資料準備
- 環境重置程序

## 測試案例
- 關鍵業務流程測試
- 邊界條件測試
- 錯誤處理測試
```

這個測試策略文檔提供了完整的測試框架，確保 MKing Friend 平台能夠通過全面的測試保證代碼品質和功能正確性。