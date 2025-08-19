# MKing Friend - 測試策略文檔

## 1. 測試策略概述

### 1.1 測試理念
- **行為驅動開發 (BDD)**: 以業務行為為導向的開發方法
- **協作溝通**: 促進業務、開發和測試團隊的協作
- **活文檔**: 可執行的規格說明書
- **品質保證**: 確保代碼品質和功能正確性
- **持續整合**: 自動化測試流程
- **全面覆蓋**: 單元場景、整合場景、端到端場景
- **效能監控**: 效能測試和負載測試

### 1.2 BDD 測試金字塔

```
        /\     E2E Scenarios (10%)
       /  \    - 完整用戶旅程場景
      /    \   - 跨系統整合場景
     /______\  
    /        \ Integration Scenarios (20%)
   /          \ - API 整合場景
  /            \ - 資料庫整合場景
 /              \ - 服務整合場景
/________________\
Unit Scenarios (70%)
- 組件行為場景
- 業務邏輯場景
- 功能行為場景
```

### 1.3 測試目標
- **場景覆蓋率**: 目標 90% 以上的業務場景覆蓋
- **代碼覆蓋率**: 目標 90% 以上
- **分支覆蓋率**: 目標 85% 以上
- **場景執行時間**: 單元場景 < 5分鐘，整合場景 < 15分鐘
- **場景穩定性**: 場景通過率 > 98%
- **缺陷檢出率**: 在開發階段檢出 95% 以上的缺陷
- **活文檔品質**: 場景描述清晰且可理解

## 2. BDD 實施策略

### 2.1 BDD 循環

#### 2.1.1 Discover-Formulate-Automate-Demonstrate 循環
```
1. Discover (探索)
   - 與利害關係人協作了解需求
   - 識別業務價值和用戶目標
   - 探討不同的場景和邊界情況

2. Formulate (制定)
   - 使用 Gherkin 語法編寫場景
   - 採用 Given-When-Then 結構
   - 用業務語言描述行為

3. Automate (自動化)
   - 實現步驟定義使場景可執行
   - 編寫支援代碼和測試基礎設施
   - 確保場景能夠自動執行

4. Demonstrate (展示)
   - 執行場景驗證行為
   - 獲得利害關係人的反饋
   - 持續改進場景和實現
```

#### 2.1.2 BDD 最佳實踐

**場景編寫規範**
```gherkin
# 用戶管理功能
Feature: 用戶管理
  作為系統管理員
  我想要管理用戶帳戶
  以便用戶能夠安全地訪問平台

  Background:
    Given 用戶管理系統可用
    And 資料庫是乾淨的

  Scenario: 使用有效資料創建用戶
    Given 我有有效的用戶資料:
      | email           | test@example.com |
      | password        | securePassword123 |
      | displayName     | 測試用戶 |
    When 我創建新的用戶帳戶
    Then 用戶應該被成功創建
    And 用戶應該有唯一的 ID
    And 用戶電子郵件應該是 "test@example.com"
    And 密碼應該被加密

  Scenario: 拒絕使用無效電子郵件創建用戶
    Given 我有無效電子郵件的用戶資料:
      | email           | invalid-email |
      | password        | securePassword123 |
      | displayName     | 測試用戶 |
    When 我嘗試創建新的用戶帳戶
    Then 用戶創建應該失敗
    And 我應該看到錯誤訊息 "無效的電子郵件格式"
    And 資料庫中不應該創建任何用戶
```

**Given-When-Then 結構**
```typescript
// user-management.steps.ts
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { UserService } from '../services/UserService';
import { TestContext } from '../support/TestContext';

Given('我有有效的用戶資料:', function (dataTable) {
  this.userData = dataTable.rowsHash();
});

Given('我有無效電子郵件的用戶資料:', function (dataTable) {
  this.userData = dataTable.rowsHash();
});

Given('用戶管理系統可用', function () {
  this.userService = new UserService();
});

Given('資料庫是乾淨的', async function () {
  await TestContext.cleanDatabase();
});

When('我創建新的用戶帳戶', async function () {
  try {
    this.result = await this.userService.createUser(this.userData);
    this.error = null;
  } catch (error) {
    this.error = error;
    this.result = null;
  }
});

When('我嘗試創建新的用戶帳戶', async function () {
  try {
    this.result = await this.userService.createUser(this.userData);
    this.error = null;
  } catch (error) {
    this.error = error;
    this.result = null;
  }
});

Then('用戶應該被成功創建', function () {
  expect(this.result).toBeDefined();
  expect(this.error).toBeNull();
});

Then('用戶應該有唯一的 ID', function () {
  expect(this.result.id).toBeDefined();
  expect(typeof this.result.id).toBe('string');
});

Then('用戶電子郵件應該是 {string}', function (expectedEmail) {
  expect(this.result.email).toBe(expectedEmail);
});

Then('密碼應該被加密', function () {
  expect(this.result.password).not.toBe(this.userData.password);
  expect(this.result.password).toMatch(/^\$2[aby]\$/);
});

Then('用戶創建應該失敗', function () {
  expect(this.result).toBeNull();
  expect(this.error).toBeDefined();
});

Then('我應該看到錯誤訊息 {string}', function (expectedMessage) {
  expect(this.error.message).toBe(expectedMessage);
});

Then('資料庫中不應該創建任何用戶', async function () {
  const userCount = await TestContext.getUserCount();
  expect(userCount).toBe(0);
});
```

### 2.2 BDD 工作流程

#### 2.2.1 功能開發流程
```
1. 發現 (Discover)
   - 與利害關係人協作
   - 理解業務價值和目標
   - 識別用戶故事和驗收標準
   - 探索實例和邊界條件

2. 制定 (Formulate)
   - 編寫 Gherkin 場景
   - 定義 Given-When-Then 結構
   - 創建活文檔
   - 確保場景可測試且有意義

3. 自動化 (Automate)
   - 實現步驟定義
   - 編寫支援代碼
   - 運行場景（紅燈）
   - 實現功能代碼（綠燈）
   - 重構和優化（重構）

4. 演示 (Demonstrate)
   - 運行完整場景套件
   - 生成活文檔報告
   - 與利害關係人驗證行為
   - 收集反饋並迭代
```

#### 2.2.2 場景審查檢查清單
- [ ] 所有場景都使用業務語言編寫
- [ ] 場景覆蓋主要用戶旅程
- [ ] Given-When-Then 結構清晰
- [ ] 場景獨立且可重複執行
- [ ] 步驟定義可重用
- [ ] 活文檔保持最新
- [ ] 場景執行時間合理
- [ ] 錯誤訊息清晰易懂
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

## 7. BDD 最佳實踐

### 7.1 BDD 原則

1. **FIRST-BDD 原則**
   - **Fast**: 場景應該快速執行
   - **Independent**: 場景之間應該獨立
   - **Repeatable**: 場景應該可重複執行
   - **Self-Validating**: 場景應該有明確的通過/失敗結果
   - **Timely**: 場景應該及時編寫

2. **BDD 測試金字塔**
   - 70% 單元場景（Unit Scenarios）
   - 20% 整合場景（Integration Scenarios）
   - 10% 端到端場景（E2E Scenarios）

3. **場景編寫原則**
   - 使用業務語言描述行為
   - 遵循 Given-When-Then 結構
   - 場景應該表達業務價值
   - 避免技術實現細節

### 7.2 常見陷阱和解決方案

#### 7.2.1 場景依賴性
```gherkin
# ❌ 錯誤：場景之間有依賴
Feature: 用戶管理
  Scenario: 創建用戶
    When 我創建用戶 "張小美"
    Then 用戶應該被創建
    # 其他場景依賴這個用戶

  Scenario: 更新用戶資料
    When 我更新用戶 "張小美" 的資料
    Then 用戶資料應該被更新
    # 依賴前一個場景創建的用戶

# ✅ 正確：每個場景獨立
Feature: 用戶管理
  Background:
    Given 系統已初始化

  Scenario: 創建用戶
    Given 我有有效的用戶資料
    When 我創建新用戶
    Then 用戶應該被成功創建

  Scenario: 更新用戶資料
    Given 系統中存在用戶 "張小美"
    When 我更新用戶的顯示名稱為 "張小美-更新"
    Then 用戶資料應該被成功更新
```

#### 7.2.2 過度技術化的場景
```gherkin
# ❌ 錯誤：包含技術實現細節
Scenario: 計算總價
  Given 我調用 PriceCalculator.calculateTotal() 方法
  And 我模擬 TaxService.getTaxRate() 返回 0.2
  When 我傳入價格為 100 的商品陣列
  Then 方法應該返回 120

# ✅ 正確：使用業務語言
Scenario: 計算含稅總價
  Given 我的購物車中有一件價格為 100 元的商品
  And 當前稅率為 20%
  When 我查看訂單總額
  Then 我應該看到總價為 120 元
  And 其中包含 20 元的稅費
```

### 7.3 BDD 場景維護

#### 7.3.1 定期審查場景
- 每月審查場景覆蓋率和業務價值
- 識別和移除重複或過時的場景
- 更新場景以反映業務需求變化
- 重構複雜的步驟定義
- 確保活文檔保持最新

#### 7.3.2 BDD 活文檔
```markdown
# BDD 活文檔

## BDD 策略
- 描述整體 BDD 方法和協作流程
- 說明場景類型和業務覆蓋範圍
- 定義場景品質標準

## 場景執行環境
- BDD 測試環境設定
- 測試資料準備和清理
- 環境重置和隔離程序

## 業務場景庫
- 核心用戶旅程場景
- 業務規則驗證場景
- 異常處理和邊界條件場景
- 整合和端到端場景

## 步驟定義庫
- 可重用的步驟定義
- 業務領域特定的步驟
- 技術支援步驟
```

這個 BDD 測試策略文檔提供了完整的行為驅動開發框架，確保 MKing Friend 平台能夠通過協作式的場景驗證保證業務需求的正確實現和代碼品質。