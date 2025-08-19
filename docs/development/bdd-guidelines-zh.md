# MKing Friend - BDD 開發規範

## 1. BDD 概述

### 1.1 什麼是 BDD
行為驅動開發 (Behavior-Driven Development, BDD) 是一種軟體開發方法論，專注於系統的行為和業務價值，使用自然語言描述系統應該如何運作：

1. **Given (給定)**: 設置初始條件和上下文
2. **When (當)**: 描述觸發的動作或事件
3. **Then (那麼)**: 定義預期的結果或行為

### 1.2 BDD 的優勢
- **業務對齊**: 確保開發與業務需求一致
- **活文檔**: 場景即是可執行的規格文檔
- **協作改善**: 促進業務、開發和測試團隊的溝通
- **用戶導向**: 專注於用戶價值和體驗
- **回歸防護**: 防止新功能破壞現有行為

## 2. BDD 工作流程

### 2.1 BDD 循環
```
┌─────────────────┐
│  撰寫 Gherkin   │
│     場景        │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐    ┌─────────────────┐
│  實現步驟定義    │◄───┤   重構和優化     │
└──────┬──────────┘    └──────▲──────────┘
       │                      │
       ▼                      │
┌─────────────────┐           │
│  場景通過？      ├───────────┘
└─────────────────┘
```

### 2.2 詳細步驟

#### 步驟 1: 撰寫 Gherkin 場景
```gherkin
# 範例：用戶註冊功能場景
Feature: 用戶註冊
  作為一個新用戶
  我想要註冊一個帳戶
  以便我可以使用系統功能

  Scenario: 使用有效資料註冊新用戶
    Given 我在註冊頁面
    And 系統中不存在 "test@example.com" 這個電子郵件
    When 我填寫電子郵件 "test@example.com"
    And 我填寫密碼 "SecurePass123!"
    And 我填寫顯示名稱 "Test User"
    And 我點擊註冊按鈕
    Then 我應該看到註冊成功訊息
    And 新用戶應該被創建在系統中
    And 用戶資料應該包含正確的電子郵件和顯示名稱
    But 密碼不應該在回應中顯示
```

#### 步驟 2: 實現步驟定義
```typescript
// 步驟定義實現
import { Given, When, Then, And, But } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { UserService } from '../../../src/services/user.service';

Given('我在註冊頁面', async function () {
  await this.page.goto('/register');
});

Given('系統中不存在 {string} 這個電子郵件', async function (email: string) {
  // 清理測試資料
  await this.testPrisma.user.deleteMany({ where: { email } });
});

When('我填寫電子郵件 {string}', async function (email: string) {
  await this.page.fill('[data-testid="email-input"]', email);
  this.testData.email = email;
});

When('我填寫密碼 {string}', async function (password: string) {
  await this.page.fill('[data-testid="password-input"]', password);
  this.testData.password = password;
});

When('我填寫顯示名稱 {string}', async function (displayName: string) {
  await this.page.fill('[data-testid="display-name-input"]', displayName);
  this.testData.displayName = displayName;
});

When('我點擊註冊按鈕', async function () {
  await this.page.click('[data-testid="register-button"]');
});

Then('我應該看到註冊成功訊息', async function () {
  await expect(this.page.locator('[data-testid="success-message"]')).toBeVisible();
});

Then('新用戶應該被創建在系統中', async function () {
  const user = await this.testPrisma.user.findUnique({
    where: { email: this.testData.email },
    include: { profile: true }
  });
  expect(user).toBeDefined();
  this.testData.createdUser = user;
});

Then('用戶資料應該包含正確的電子郵件和顯示名稱', async function () {
  expect(this.testData.createdUser.email).toBe(this.testData.email);
  expect(this.testData.createdUser.profile.displayName).toBe(this.testData.displayName);
});

But('密碼不應該在回應中顯示', async function () {
  expect(this.testData.createdUser.password).toBeUndefined();
  expect(this.testData.createdUser.passwordHash).toBeDefined();
});
```

#### 步驟 3: 實現服務邏輯
```typescript
// 用戶服務實現
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hashService: HashService,
    private readonly validationService: ValidationService
  ) {}

  async register(userData: RegisterUserDto): Promise<User> {
    // 驗證輸入
    await this.validationService.validateUserData(userData);
    
    // 檢查用戶是否已存在
    await this.checkUserExists(userData.email);
    
    // 創建用戶
    const user = await this.createUser(userData);
    
    return this.sanitizeUser(user);
  }

  private async checkUserExists(email: string): Promise<void> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      throw new ConflictException('User already exists');
    }
  }

  private async createUser(userData: RegisterUserDto): Promise<UserWithProfile> {
    const hashedPassword = await this.hashService.hash(userData.password);
    
    return this.prisma.user.create({
      data: {
        email: userData.email,
        passwordHash: hashedPassword,
        profile: {
          create: {
            displayName: userData.displayName
          }
        }
      },
      include: {
        profile: true
      }
    });
  }

  private sanitizeUser(user: UserWithProfile): User {
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
```

## 3. BDD 分層策略

### 3.1 BDD 測試金字塔
```
        ┌─────────────────┐
        │  E2E 場景測試   │  ← 少量，完整用戶旅程
        └─────────────────┘
      ┌─────────────────────┐
      │  整合場景測試       │  ← 適量，服務間互動
      └─────────────────────┘
    ┌─────────────────────────┐
    │    單元場景測試         │  ← 大量，業務邏輯驗證
    └─────────────────────────┘
```

### 3.2 單元場景測試 (Unit Scenarios)
**目標**: 驗證單一業務邏輯或規則
**特點**: 快速、隔離、業務導向

```gherkin
# 範例：密碼驗證場景
Feature: 密碼驗證
  作為系統
  我需要驗證用戶密碼
  以確保帳戶安全性

  Scenario: 驗證有效密碼
    Given 密碼驗證器已初始化
    When 我驗證密碼 "SecurePass123!"
    Then 驗證結果應該是有效的
    And 不應該有任何錯誤訊息

  Scenario: 密碼缺少大寫字母
    Given 密碼驗證器已初始化
    When 我驗證密碼 "securepass123!"
    Then 驗證結果應該是無效的
    And 錯誤訊息應該包含 "密碼必須包含大寫字母"

  Scenario: 密碼長度不足
    Given 密碼驗證器已初始化
    When 我驗證密碼 "Sec1!"
    Then 驗證結果應該是無效的
    And 錯誤訊息應該包含 "密碼長度至少需要8個字符"
```

```typescript
// 對應的步驟定義
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PasswordValidator } from '../../../src/validators/password.validator';

Given('密碼驗證器已初始化', function () {
  this.validator = new PasswordValidator();
});

When('我驗證密碼 {string}', function (password: string) {
  this.result = this.validator.validate(password);
});

Then('驗證結果應該是有效的', function () {
  expect(this.result.isValid).toBe(true);
});

Then('驗證結果應該是無效的', function () {
  expect(this.result.isValid).toBe(false);
});

Then('不應該有任何錯誤訊息', function () {
  expect(this.result.errors).toHaveLength(0);
});

Then('錯誤訊息應該包含 {string}', function (expectedError: string) {
  expect(this.result.errors).toContain(expectedError);
});
```

### 3.3 整合場景測試 (Integration Scenarios)
**目標**: 驗證多個服務間的協作行為
**特點**: 使用真實資料庫、模擬外部服務

```gherkin
# 範例：用戶註冊整合場景
Feature: 用戶註冊整合
  作為系統
  我需要協調多個服務來完成用戶註冊
  以確保資料一致性和業務流程正確性

  Background:
    Given 應用程式已啟動
    And 測試資料庫已清理

  Scenario: 成功註冊用戶並創建個人檔案
    Given 用戶服務、個人檔案服務和電子郵件服務都可用
    When 我透過 API 註冊用戶：
      | email           | test@example.com |
      | password        | SecurePass123!   |
      | displayName     | Test User        |
    Then API 回應狀態應該是 201
    And 回應應該包含用戶資訊但不包含密碼
    And 用戶應該被保存到資料庫中
    And 個人檔案應該被創建並關聯到用戶
    And 歡迎郵件應該被發送
```

```typescript
// 對應的步驟定義
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import request from 'supertest';

Given('應用程式已啟動', async function () {
  // 應用程式初始化邏輯已在 hooks 中處理
  expect(this.app).toBeDefined();
});

Given('測試資料庫已清理', async function () {
  await this.testPrisma.user.deleteMany();
});

Given('用戶服務、個人檔案服務和電子郵件服務都可用', function () {
  // 服務可用性檢查
  expect(this.app.get('UserService')).toBeDefined();
  expect(this.app.get('ProfileService')).toBeDefined();
  expect(this.app.get('EmailService')).toBeDefined();
});

When('我透過 API 註冊用戶：', async function (dataTable) {
  const userData = dataTable.rowsHash();
  this.testData.userData = userData;
  
  this.response = await request(this.app.getHttpServer())
    .post('/auth/register')
    .send(userData);
});

Then('API 回應狀態應該是 {int}', function (expectedStatus: number) {
  expect(this.response.status).toBe(expectedStatus);
});

Then('回應應該包含用戶資訊但不包含密碼', function () {
  expect(this.response.body.user.email).toBe(this.testData.userData.email);
  expect(this.response.body.user.profile.displayName).toBe(this.testData.userData.displayName);
  expect(this.response.body.user.password).toBeUndefined();
  expect(this.response.body.user.passwordHash).toBeUndefined();
});

Then('用戶應該被保存到資料庫中', async function () {
  const userInDb = await this.testPrisma.user.findUnique({
    where: { email: this.testData.userData.email },
    include: { profile: true }
  });
  expect(userInDb).toBeDefined();
  this.testData.createdUser = userInDb;
});

Then('個人檔案應該被創建並關聯到用戶', function () {
  expect(this.testData.createdUser.profile).toBeDefined();
  expect(this.testData.createdUser.profile.displayName).toBe(this.testData.userData.displayName);
});

Then('歡迎郵件應該被發送', function () {
  // 驗證郵件服務被調用
  expect(this.mockServices.emailService.sendWelcomeEmail).toHaveBeenCalledWith(
    expect.objectContaining({
      email: this.testData.userData.email,
      displayName: this.testData.userData.displayName
    })
  );
});
```

### 3.4 端到端場景測試 (End-to-End Scenarios)
**目標**: 驗證完整的用戶旅程和業務流程
**特點**: 模擬真實用戶行為和系統互動

```gherkin
# 範例：完整用戶入門流程
Feature: 用戶註冊端到端流程
  作為新用戶
  我想要完成註冊並設置我的個人檔案
  以便我可以開始使用應用程式

  Background:
    Given 我在註冊頁面
    And 系統已準備好接受新用戶

  Scenario: 成功完成用戶入門流程
    When 我填寫註冊表單：
      | 欄位     | 值                |
      | 電子郵件 | test@example.com  |
      | 密碼     | SecurePass123!    |
      | 確認密碼 | SecurePass123!    |
      | 顯示名稱 | Test User         |
    And 我提交註冊表單
    Then 我應該被重定向到歡迎頁面
    And 我應該看到個人化的歡迎訊息
    When 我點擊個人檔案連結
    Then 我應該能夠查看我的個人檔案
    And 個人檔案應該顯示正確的用戶資訊
```

```typescript
// 對應的步驟定義
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

Given('我在註冊頁面', async function () {
  await this.page.goto('/register');
  await expect(this.page.locator('[data-testid="register-form"]')).toBeVisible();
});

Given('系統已準備好接受新用戶', async function () {
  // 確保後端服務正常運行
  const response = await this.page.request.get('/api/health');
  expect(response.status()).toBe(200);
});

When('我填寫註冊表單：', async function (dataTable) {
  const formData = dataTable.rowsHash();
  
  await this.page.fill('[data-testid="email-input"]', formData['電子郵件']);
  await this.page.fill('[data-testid="password-input"]', formData['密碼']);
  await this.page.fill('[data-testid="confirm-password-input"]', formData['確認密碼']);
  await this.page.fill('[data-testid="display-name-input"]', formData['顯示名稱']);
  
  this.testData.registrationData = formData;
});

When('我提交註冊表單', async function () {
  await this.page.click('[data-testid="register-button"]');
  // 等待導航完成
  await this.page.waitForLoadState('networkidle');
});

Then('我應該被重定向到歡迎頁面', async function () {
  await expect(this.page).toHaveURL('/welcome');
});

Then('我應該看到個人化的歡迎訊息', async function () {
  const welcomeMessage = this.page.locator('[data-testid="welcome-message"]');
  await expect(welcomeMessage).toBeVisible();
  await expect(welcomeMessage).toContainText(`歡迎, ${this.testData.registrationData['顯示名稱']}!`);
});

When('我點擊個人檔案連結', async function () {
  await this.page.click('[data-testid="profile-link"]');
  await this.page.waitForLoadState('networkidle');
});

Then('我應該能夠查看我的個人檔案', async function () {
  await expect(this.page).toHaveURL('/profile');
  await expect(this.page.locator('[data-testid="profile-container"]')).toBeVisible();
});

Then('個人檔案應該顯示正確的用戶資訊', async function () {
  const profileName = this.page.locator('[data-testid="profile-name"]');
  await expect(profileName).toContainText(this.testData.registrationData['顯示名稱']);
  
  const profileEmail = this.page.locator('[data-testid="profile-email"]');
  await expect(profileEmail).toContainText(this.testData.registrationData['電子郵件']);
});
```

## 4. BDD 最佳實踐

### 4.1 場景撰寫指南
**格式**: 使用清晰的 Given-When-Then 結構
**語言**: 使用業務語言，避免技術術語

```gherkin
# ✅ 好的場景撰寫
Scenario: 用戶使用有效 ID 查詢個人資訊
  Given 系統中存在 ID 為 "123" 的用戶
  When 我查詢 ID 為 "123" 的用戶資訊
  Then 我應該收到該用戶的完整資訊
  And 回應狀態應該是成功

Scenario: 用戶查詢不存在的用戶資訊
  Given 系統中不存在 ID 為 "999" 的用戶
  When 我查詢 ID 為 "999" 的用戶資訊
  Then 我應該收到 "用戶不存在" 的錯誤訊息
  And 回應狀態應該是 404

# ❌ 不好的場景撰寫
Scenario: 測試用戶創建
  Given 一些資料
  When 我做一些事情
  Then 它應該工作

Scenario: 驗證 UserService.create() 方法
  Given mock database 回傳 user object
  When 調用 service.create() with valid DTO
  Then expect result.id toBeDefined()
```

### 4.2 Given-When-Then 結構
**結構**: 給定-當-那麼
**目的**: 清楚描述場景的前置條件、觸發動作和預期結果

```gherkin
Scenario: 計算含稅總價
  Given 購物車中有以下商品：
    | 商品   | 價格 | 數量 |
    | 商品A  | 100  | 2    |
    | 商品B  | 50   | 1    |
  And 稅率為 10%
  When 我計算總價
  Then 總價應該是 275 元
```

```typescript
// 對應的步驟定義
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { calculateTotal } from '../src/utils/calculator';

Given('購物車中有以下商品：', function (dataTable) {
  this.items = dataTable.hashes().map(row => ({
    name: row['商品'],
    price: parseInt(row['價格']),
    quantity: parseInt(row['數量'])
  }));
});

Given('稅率為 {float}%', function (taxRate: number) {
  this.taxRate = taxRate / 100;
});

When('我計算總價', function () {
  this.result = calculateTotal(this.items, this.taxRate);
});

Then('總價應該是 {int} 元', function (expectedTotal: number) {
  expect(this.result).toBe(expectedTotal);
});
```

### 4.3 場景隔離
**原則**: 每個場景都應該獨立執行，不受其他場景影響
**實作**: 使用 Background 和 hooks 管理場景間的狀態

```gherkin
Feature: 用戶管理
  作為系統管理員
  我需要管理用戶帳戶
  以確保系統安全和用戶體驗

  Background:
    Given 用戶服務已初始化
    And 測試資料庫已清理

  Scenario: 根據 ID 查找用戶
    Given 系統中存在以下用戶：
      | id  | name     | email           |
      | 1   | John Doe | john@example.com|
    When 我查詢 ID 為 "1" 的用戶
    Then 我應該收到用戶 "John Doe" 的資訊

  Scenario: 刪除用戶帳戶
    Given 系統中存在 ID 為 "2" 的用戶
    When 我刪除 ID 為 "2" 的用戶
    Then 用戶應該被成功刪除
    And 查詢該用戶時應該回傳 "用戶不存在"
```

```typescript
// hooks.ts - 場景隔離設置
import { Before, After, BeforeAll, AfterAll } from '@cucumber/cucumber';
import { UserService } from '../src/services/UserService';

BeforeAll(async function () {
  // 全域設置
  this.testDatabase = await setupTestDatabase();
});

Before(async function () {
  // 每個場景前的清理
  await this.testDatabase.user.deleteMany();
  
  // 重置 mock 服務
  this.mockRepository = {
    findById: jest.fn(),
    save: jest.fn(),
    delete: jest.fn()
  };
  
  this.userService = new UserService(this.mockRepository);
});

After(async function () {
  // 每個場景後的清理
  jest.clearAllMocks();
});

AfterAll(async function () {
  // 全域清理
  await this.testDatabase.$disconnect();
});
```

### 4.4 Mock 和 Stub 指南
**何時使用**: 外部依賴、慢速操作、不可控因素
**何時避免**: 簡單的值對象、純函數、核心業務邏輯

```gherkin
Feature: 用戶創建通知
  作為系統
  我需要在創建用戶後發送通知
  以確保用戶收到歡迎訊息

  Background:
    Given 電子郵件服務可用
    And 用戶資料庫可用

  Scenario: 成功創建用戶並發送歡迎郵件
    Given 電子郵件服務已準備好發送郵件
    When 我創建新用戶：
      | email           | test@example.com |
      | displayName     | Test User        |
    Then 用戶應該被成功創建
    And 歡迎郵件應該被發送到 "test@example.com"
    And 郵件內容應該包含用戶名稱 "Test User"

  Scenario: 郵件服務失敗時的處理
    Given 電子郵件服務暫時不可用
    When 我創建新用戶：
      | email           | test@example.com |
      | displayName     | Test User        |
    Then 用戶應該被成功創建
    And 系統應該記錄郵件發送失敗
    And 用戶創建不應該因為郵件失敗而回滾
```

```typescript
// 對應的步驟定義
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

Given('電子郵件服務已準備好發送郵件', function () {
  this.mockEmailService = {
    sendWelcomeEmail: jest.fn().mockResolvedValue({
      success: true,
      messageId: 'msg-123'
    })
  };
});

Given('電子郵件服務暫時不可用', function () {
  this.mockEmailService = {
    sendWelcomeEmail: jest.fn().mockRejectedValue(
      new Error('Email service unavailable')
    )
  };
});

When('我創建新用戶：', async function (dataTable) {
  const userData = dataTable.rowsHash();
  this.testData.userData = userData;
  
  const userService = new UserService(
    this.mockEmailService,
    this.mockUserRepository
  );
  
  try {
    this.testData.result = await userService.createUser(userData);
  } catch (error) {
    this.testData.error = error;
  }
});

Then('歡迎郵件應該被發送到 {string}', function (email: string) {
  expect(this.mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith(
    expect.objectContaining({ email })
  );
});

Then('郵件內容應該包含用戶名稱 {string}', function (displayName: string) {
  expect(this.mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith(
    expect.objectContaining({ displayName })
  );
});

Then('系統應該記錄郵件發送失敗', function () {
  // 驗證日誌記錄
  expect(this.mockLogger.error).toHaveBeenCalledWith(
    expect.stringContaining('Email service unavailable')
  );
});
```
```

## 5. 前端 BDD

### 5.1 React 組件行為
**工具**: Cucumber + Playwright + React Testing Library
**重點**: 描述用戶與組件的互動行為

```gherkin
# LoginForm.feature
Feature: 登入表單
  作為用戶
  我想要透過登入表單進入系統
  以便訪問我的帳戶

  Background:
    Given 我在登入頁面
    And 登入表單已顯示

  Scenario: 使用有效憑證登入
    When 我輸入電子郵件 "test@example.com"
    And 我輸入密碼 "password123"
    And 我點擊登入按鈕
    Then 登入請求應該被發送
    And 請求應該包含正確的憑證

  Scenario: 輸入無效的電子郵件格式
    When 我輸入電子郵件 "invalid-email"
    And 我離開電子郵件輸入欄位
    Then 我應該看到 "電子郵件格式無效" 的錯誤訊息
    And 登入按鈕應該被禁用

  Scenario: 嘗試提交空白表單
    When 我點擊登入按鈕而不填寫任何欄位
    Then 我應該看到 "請輸入電子郵件" 的錯誤訊息
    And 我應該看到 "請輸入密碼" 的錯誤訊息
    And 登入請求不應該被發送
```

```typescript
// LoginForm.steps.ts
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from '../components/LoginForm';

Given('我在登入頁面', function () {
  this.mockOnSubmit = jest.fn();
});

Given('登入表單已顯示', function () {
  render(<LoginForm onSubmit={this.mockOnSubmit} />);
  expect(screen.getByRole('form', { name: /登入/i })).toBeInTheDocument();
});

When('我輸入電子郵件 {string}', function (email: string) {
  const emailInput = screen.getByLabelText(/電子郵件/i);
  fireEvent.change(emailInput, { target: { value: email } });
  this.testData.email = email;
});

When('我輸入密碼 {string}', function (password: string) {
  const passwordInput = screen.getByLabelText(/密碼/i);
  fireEvent.change(passwordInput, { target: { value: password } });
  this.testData.password = password;
});

When('我點擊登入按鈕', function () {
  const loginButton = screen.getByRole('button', { name: /登入/i });
  fireEvent.click(loginButton);
});

When('我離開電子郵件輸入欄位', function () {
  const emailInput = screen.getByLabelText(/電子郵件/i);
  fireEvent.blur(emailInput);
});

Then('登入請求應該被發送', async function () {
  await waitFor(() => {
    expect(this.mockOnSubmit).toHaveBeenCalled();
  });
});

Then('請求應該包含正確的憑證', function () {
  expect(this.mockOnSubmit).toHaveBeenCalledWith({
    email: this.testData.email,
    password: this.testData.password
  });
});

Then('我應該看到 {string} 的錯誤訊息', async function (errorMessage: string) {
  await waitFor(() => {
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
});

Then('登入按鈕應該被禁用', function () {
  const loginButton = screen.getByRole('button', { name: /登入/i });
  expect(loginButton).toBeDisabled();
});

Then('登入請求不應該被發送', function () {
  expect(this.mockOnSubmit).not.toHaveBeenCalled();
});
```

### 5.2 React Hook 行為
**工具**: Cucumber + @testing-library/react-hooks
**重點**: 描述 Hook 的狀態變化和用戶互動

```gherkin
# useAuth.feature
Feature: 身份驗證 Hook
  作為開發者
  我需要一個身份驗證 Hook
  以便在組件中管理用戶登入狀態

  Background:
    Given 身份驗證服務可用
    And useAuth Hook 已初始化

  Scenario: Hook 初始狀態
    Then 用戶應該是 null
    And 載入狀態應該是 false
    And 身份驗證狀態應該是 false

  Scenario: 成功登入
    Given 身份驗證服務會回傳有效用戶
    When 我使用有效憑證登入：
      | email    | test@example.com |
      | password | password123      |
    Then 用戶資訊應該被設置
    And 身份驗證狀態應該是 true
    And 載入狀態應該是 false
    And 不應該有錯誤訊息

  Scenario: 登入失敗
    Given 身份驗證服務會回傳錯誤
    When 我使用無效憑證登入：
      | email    | test@example.com |
      | password | wrong-password   |
    Then 用戶應該保持 null
    And 身份驗證狀態應該是 false
    And 應該顯示錯誤訊息 "憑證無效"

  Scenario: 登出
    Given 用戶已登入
    When 我登出
    Then 用戶應該被清除
    And 身份驗證狀態應該是 false
    And 登出服務應該被調用
```

```typescript
// useAuth.steps.ts
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { renderHook, act } from '@testing-library/react-hooks';
import { useAuth } from '../hooks/useAuth';

// Mock 身份驗證服務
const mockAuthService = {
  login: jest.fn(),
  logout: jest.fn(),
  getCurrentUser: jest.fn()
};

jest.mock('../services/authService', () => mockAuthService);

Given('身份驗證服務可用', function () {
  jest.clearAllMocks();
});

Given('useAuth Hook 已初始化', function () {
  const { result } = renderHook(() => useAuth());
  this.hookResult = result;
});

Given('身份驗證服務會回傳有效用戶', function () {
  this.mockUser = { id: 1, email: 'test@example.com', name: 'Test User' };
  mockAuthService.login.mockResolvedValue(this.mockUser);
});

Given('身份驗證服務會回傳錯誤', function () {
  mockAuthService.login.mockRejectedValue(new Error('憑證無效'));
});

Given('用戶已登入', async function () {
  this.mockUser = { id: 1, email: 'test@example.com', name: 'Test User' };
  mockAuthService.login.mockResolvedValue(this.mockUser);
  
  await act(async () => {
    await this.hookResult.current.login('test@example.com', 'password123');
  });
});

When('我使用有效憑證登入：', async function (dataTable) {
  const credentials = dataTable.rowsHash();
  
  await act(async () => {
    await this.hookResult.current.login(credentials.email, credentials.password);
  });
});

When('我使用無效憑證登入：', async function (dataTable) {
  const credentials = dataTable.rowsHash();
  
  await act(async () => {
    try {
      await this.hookResult.current.login(credentials.email, credentials.password);
    } catch (error) {
      // 錯誤由 Hook 內部處理
    }
  });
});

When('我登出', async function () {
  await act(async () => {
    await this.hookResult.current.logout();
  });
});

Then('用戶應該是 null', function () {
  expect(this.hookResult.current.user).toBeNull();
});

Then('載入狀態應該是 {word}', function (expectedState: string) {
  const expected = expectedState === 'true';
  expect(this.hookResult.current.isLoading).toBe(expected);
});

Then('身份驗證狀態應該是 {word}', function (expectedState: string) {
  const expected = expectedState === 'true';
  expect(this.hookResult.current.isAuthenticated).toBe(expected);
});

Then('用戶資訊應該被設置', function () {
  expect(this.hookResult.current.user).toEqual(this.mockUser);
});

Then('不應該有錯誤訊息', function () {
  expect(this.hookResult.current.error).toBeNull();
});

Then('用戶應該保持 null', function () {
  expect(this.hookResult.current.user).toBeNull();
});

Then('應該顯示錯誤訊息 {string}', function (expectedError: string) {
  expect(this.hookResult.current.error).toBe(expectedError);
});

Then('用戶應該被清除', function () {
  expect(this.hookResult.current.user).toBeNull();
});

Then('登出服務應該被調用', function () {
  expect(mockAuthService.logout).toHaveBeenCalled();
});
```

## 6. 資料庫 BDD 策略

### 6.1 資料庫場景設置
```typescript
// tests/support/database.ts
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL
    }
  }
});

export async function setupTestDatabase() {
  // 執行遷移
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL }
  });
}

export async function cleanupTestDatabase() {
  // 清理所有表格資料
  const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>(
    `SELECT tablename FROM pg_tables WHERE schemaname='public'`
  );

  for (const { tablename } of tablenames) {
    if (tablename !== '_prisma_migrations') {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
    }
  }
}

export { prisma };
```

### 6.2 資料庫操作場景
```gherkin
# userRepository.feature
Feature: 用戶資料庫操作
  作為系統
  我需要能夠管理用戶資料
  以便提供用戶相關功能

  Background:
    Given 測試資料庫已初始化
    And 資料庫是空的

  Scenario: 創建新用戶
    When 我創建一個用戶：
      | email           | test@example.com |
      | passwordHash    | hashed-password  |
      | displayName     | Test User        |
    Then 用戶應該被成功創建
    And 用戶應該有唯一的 ID
    And 用戶的 email 應該是 "test@example.com"
    And 用戶的個人檔案應該包含 "Test User"
    And 創建時間應該被設置

  Scenario: 防止重複 email
    Given 已存在用戶：
      | email           | test@example.com |
      | passwordHash    | hashed-password  |
      | displayName     | Existing User    |
    When 我嘗試創建相同 email 的用戶：
      | email           | test@example.com |
      | passwordHash    | another-password |
      | displayName     | New User         |
    Then 應該拋出錯誤 "Email already exists"
    And 資料庫中應該只有一個用戶

  Scenario: 根據 email 查找用戶
    Given 已存在用戶：
      | email           | test@example.com |
      | passwordHash    | hashed-password  |
      | displayName     | Test User        |
    When 我根據 email "test@example.com" 查找用戶
    Then 應該找到該用戶
    And 用戶的個人檔案應該包含 "Test User"

  Scenario: 查找不存在的用戶
    When 我根據 email "nonexistent@example.com" 查找用戶
    Then 應該返回 null
    And 不應該拋出錯誤
```

```typescript
// userRepository.steps.ts
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { UserRepository } from '../../src/repositories/user.repository';
import { prisma, cleanupTestDatabase } from '../support/database';

let userRepository: UserRepository;
let createdUser: any = null;
let foundUser: any = null;
let thrownError: Error | null = null;

Given('測試資料庫已初始化', function () {
  userRepository = new UserRepository(prisma);
});

Given('資料庫是空的', async function () {
  await cleanupTestDatabase();
});

Given('已存在用戶：', async function (dataTable) {
  const userData = dataTable.rowsHash();
  createdUser = await userRepository.create({
    email: userData.email,
    passwordHash: userData.passwordHash,
    profile: {
      create: {
        displayName: userData.displayName
      }
    }
  });
});

When('我創建一個用戶：', async function (dataTable) {
  const userData = dataTable.rowsHash();
  try {
    createdUser = await userRepository.create({
      email: userData.email,
      passwordHash: userData.passwordHash,
      profile: {
        create: {
          displayName: userData.displayName
        }
      }
    });
    thrownError = null;
  } catch (error) {
    thrownError = error as Error;
    createdUser = null;
  }
});

When('我嘗試創建相同 email 的用戶：', async function (dataTable) {
  const userData = dataTable.rowsHash();
  try {
    await userRepository.create({
      email: userData.email,
      passwordHash: userData.passwordHash,
      profile: {
        create: {
          displayName: userData.displayName
        }
      }
    });
    thrownError = null;
  } catch (error) {
    thrownError = error as Error;
  }
});

When('我根據 email {string} 查找用戶', async function (email: string) {
  try {
    foundUser = await userRepository.findByEmail(email);
    thrownError = null;
  } catch (error) {
    thrownError = error as Error;
    foundUser = null;
  }
});

Then('用戶應該被成功創建', function () {
  expect(createdUser).toBeDefined();
  expect(thrownError).toBeNull();
});

Then('用戶應該有唯一的 ID', function () {
  expect(createdUser?.id).toBeDefined();
  expect(typeof createdUser?.id).toBe('string');
});

Then('用戶的 email 應該是 {string}', function (expectedEmail: string) {
  expect(createdUser?.email).toBe(expectedEmail);
});

Then('用戶的個人檔案應該包含 {string}', function (expectedDisplayName: string) {
  if (foundUser) {
    expect(foundUser.profile.displayName).toBe(expectedDisplayName);
  } else {
    expect(createdUser?.profile.displayName).toBe(expectedDisplayName);
  }
});

Then('創建時間應該被設置', function () {
  expect(createdUser?.createdAt).toBeDefined();
  expect(createdUser?.createdAt).toBeInstanceOf(Date);
});

Then('應該拋出錯誤 {string}', function (expectedError: string) {
  expect(thrownError).toBeDefined();
  expect(thrownError?.message).toContain(expectedError);
});

Then('資料庫中應該只有一個用戶', async function () {
  const allUsers = await prisma.user.findMany();
  expect(allUsers).toHaveLength(1);
});

Then('應該找到該用戶', function () {
  expect(foundUser).toBeDefined();
  expect(foundUser).not.toBeNull();
});

Then('應該返回 null', function () {
  expect(foundUser).toBeNull();
});

Then('不應該拋出錯誤', function () {
  expect(thrownError).toBeNull();
});
```
```

## 7. BDD 覆蓋率策略

### 7.1 場景覆蓋率目標
- **單元場景**: 90%+ 業務邏輯覆蓋
- **整合場景**: 80%+ API 端點和服務整合
- **E2E 場景**: 100% 關鍵用戶旅程
- **場景執行**: 所有場景都應該能通過

### 7.2 Cucumber 配置

```javascript
// cucumber.config.js
module.exports = {
  default: {
    require: [
      'src/test/steps/**/*.ts',
      'src/test/support/**/*.ts'
    ],
    requireModule: [
      'ts-node/register'
    ],
    format: [
      'progress-bar',
      'json:reports/cucumber-report.json',
      'html:reports/cucumber-report.html',
      '@cucumber/pretty-formatter'
    ],
    formatOptions: {
      snippetInterface: 'async-await'
    },
    publishQuiet: true,
    dryRun: false,
    failFast: false,
    strict: true,
    worldParameters: {
      appUrl: process.env.APP_URL || 'http://localhost:3000',
      apiUrl: process.env.API_URL || 'http://localhost:3001'
    }
  },
  unit: {
    paths: ['src/test/features/unit/**/*.feature'],
    require: ['src/test/steps/unit/**/*.ts']
  },
  integration: {
    paths: ['src/test/features/integration/**/*.feature'],
    require: ['src/test/steps/integration/**/*.ts']
  },
  e2e: {
    paths: ['src/test/features/e2e/**/*.feature'],
    require: ['src/test/steps/e2e/**/*.ts']
  }
};
```

### 7.3 BDD 報告和覆蓋率

```json
// package.json scripts
{
  "scripts": {
    "bdd:unit": "cucumber-js --config cucumber.config.js --profile unit",
    "bdd:integration": "cucumber-js --config cucumber.config.js --profile integration",
    "bdd:e2e": "cucumber-js --config cucumber.config.js --profile e2e",
    "bdd:all": "cucumber-js --config cucumber.config.js",
    "bdd:watch": "cucumber-js --config cucumber.config.js --watch",
    "bdd:report": "node scripts/generate-bdd-report.js",
    "bdd:coverage": "nyc cucumber-js --config cucumber.config.js"
  }
}
```

```javascript
// nyc.config.js (覆蓋率配置)
module.exports = {
  extends: '@istanbuljs/nyc-config-typescript',
  include: [
    'src/**/*.ts'
  ],
  exclude: [
    'src/**/*.d.ts',
    'src/test/**',
    'src/migrations/**',
    'src/seeds/**'
  ],
  reporter: [
    'text',
    'html',
    'lcov',
    'json'
  ],
  'report-dir': 'coverage',
  'check-coverage': true,
  branches: 80,
  functions: 90,
  lines: 90,
  statements: 90
};
```

```typescript
// scripts/generate-bdd-report.js
const fs = require('fs');
const path = require('path');

function generateBDDReport() {
  const reportPath = path.join(__dirname, '../reports/cucumber-report.json');
  
  if (!fs.existsSync(reportPath)) {
    console.error('Cucumber 報告文件不存在');
    return;
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  
  let totalScenarios = 0;
  let passedScenarios = 0;
  let failedScenarios = 0;
  let skippedScenarios = 0;

  report.forEach(feature => {
    feature.elements.forEach(scenario => {
      totalScenarios++;
      
      const hasFailedSteps = scenario.steps.some(step => 
        step.result.status === 'failed'
      );
      const hasSkippedSteps = scenario.steps.some(step => 
        step.result.status === 'skipped'
      );
      
      if (hasFailedSteps) {
        failedScenarios++;
      } else if (hasSkippedSteps) {
        skippedScenarios++;
      } else {
        passedScenarios++;
      }
    });
  });

  const coverage = {
    total: totalScenarios,
    passed: passedScenarios,
    failed: failedScenarios,
    skipped: skippedScenarios,
    passRate: ((passedScenarios / totalScenarios) * 100).toFixed(2)
  };

  console.log('\n=== BDD 場景覆蓋率報告 ===');
  console.log(`總場景數: ${coverage.total}`);
  console.log(`通過場景: ${coverage.passed}`);
  console.log(`失敗場景: ${coverage.failed}`);
  console.log(`跳過場景: ${coverage.skipped}`);
  console.log(`通過率: ${coverage.passRate}%`);
  
  // 生成 HTML 報告
  const htmlReport = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>BDD 場景覆蓋率報告</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .metric { margin: 10px 0; }
        .passed { color: green; }
        .failed { color: red; }
        .skipped { color: orange; }
      </style>
    </head>
    <body>
      <h1>BDD 場景覆蓋率報告</h1>
      <div class="metric">總場景數: ${coverage.total}</div>
      <div class="metric passed">通過場景: ${coverage.passed}</div>
      <div class="metric failed">失敗場景: ${coverage.failed}</div>
      <div class="metric skipped">跳過場景: ${coverage.skipped}</div>
      <div class="metric">通過率: ${coverage.passRate}%</div>
    </body>
    </html>
  `;
  
  fs.writeFileSync(
    path.join(__dirname, '../reports/bdd-coverage.html'),
    htmlReport
  );
  
  console.log('\nHTML 報告已生成: reports/bdd-coverage.html');
}

generateBDDReport();
```

## 8. CI/CD 中的 BDD

### 8.1 GitHub Actions BDD 配置
```yaml
# .github/workflows/bdd.yml
name: BDD Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  bdd-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:6
        options: >
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    strategy:
      matrix:
        test-suite: [unit, integration, e2e]

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Setup test environment
      run: |
        mkdir -p reports
        npm run db:migrate:test
      env:
        NODE_ENV: test
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
    
    - name: Run linting
      run: npm run lint
    
    - name: Run type checking
      run: npm run type-check
    
    - name: Run BDD Unit Scenarios
      if: matrix.test-suite == 'unit'
      run: npm run bdd:unit
      env:
        NODE_ENV: test
    
    - name: Run BDD Integration Scenarios
      if: matrix.test-suite == 'integration'
      run: npm run bdd:integration
      env:
        NODE_ENV: test
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
        REDIS_URL: redis://localhost:6379
    
    - name: Run BDD E2E Scenarios
      if: matrix.test-suite == 'e2e'
      run: npm run bdd:e2e
      env:
        NODE_ENV: test
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
        APP_URL: http://localhost:3000
    
    - name: Generate BDD Coverage Report
      run: |
        npm run bdd:coverage
        npm run bdd:report
      env:
        NODE_ENV: test
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
    
    - name: Upload BDD Reports
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: bdd-reports-${{ matrix.test-suite }}
        path: |
          reports/
          coverage/
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        flags: bdd-${{ matrix.test-suite }}
        name: bdd-coverage-${{ matrix.test-suite }}
    
    - name: Comment BDD Results on PR
      if: github.event_name == 'pull_request'
      uses: actions/github-script@v6
      with:
        script: |
          const fs = require('fs');
          const path = './reports/cucumber-report.json';
          
          if (fs.existsSync(path)) {
            const report = JSON.parse(fs.readFileSync(path, 'utf8'));
            
            let totalScenarios = 0;
            let passedScenarios = 0;
            
            report.forEach(feature => {
              feature.elements.forEach(scenario => {
                totalScenarios++;
                const hasFailedSteps = scenario.steps.some(step => 
                  step.result.status === 'failed'
                );
                if (!hasFailedSteps) passedScenarios++;
              });
            });
            
            const passRate = ((passedScenarios / totalScenarios) * 100).toFixed(2);
            
            const comment = `
            ## 🥒 BDD 場景測試結果 (${{ matrix.test-suite }})
            
            - **總場景數**: ${totalScenarios}
            - **通過場景**: ${passedScenarios}
            - **通過率**: ${passRate}%
            
            ${passRate >= 90 ? '✅ 場景測試通過!' : '❌ 場景測試需要改進'}
            `;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
          }

  quality-gate:
    needs: bdd-tests
    runs-on: ubuntu-latest
    if: always()
    
    steps:
    - name: Check BDD Test Results
      run: |
        if [[ "${{ needs.bdd-tests.result }}" == "failure" ]]; then
          echo "❌ BDD 場景測試失敗"
          exit 1
        else
          echo "✅ 所有 BDD 場景測試通過"
        fi
```

## 9. 常見 BDD 問題和解決方案

### 9.1 場景執行緩慢
**問題**: BDD 場景執行時間過長
**解決方案**:
- 使用場景並行執行
- 優化資料庫操作和測試數據準備
- 合理使用 Mock 和 Stub

```gherkin
# 慢速場景範例
Feature: 用戶註冊流程
  Background:
    Given 系統已初始化
    And 資料庫連接正常
    And 外部服務可用

  Scenario: 完整用戶註冊
    When 用戶提交註冊表單：
      | email    | test@example.com |
      | password | SecurePass123    |
    Then 用戶應該收到確認郵件
    And 用戶帳戶應該被創建
    And 歡迎郵件應該被發送
```

```typescript
// 優化後的步驟定義
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

// 使用並行執行配置
Given('系統已初始化', { timeout: 5000 }, async function () {
  // 快速初始化，避免重複設置
  if (!this.systemInitialized) {
    await this.setupTestEnvironment();
    this.systemInitialized = true;
  }
});

When('用戶提交註冊表單：', async function (dataTable) {
  const userData = dataTable.rowsHash();
  
  // 使用批量操作優化性能
  this.registrationResult = await this.userService.registerUser(userData);
});

Then('用戶應該收到確認郵件', async function () {
  // 使用 Mock 避免實際發送郵件
  expect(this.mockEmailService.sendConfirmationEmail)
    .toHaveBeenCalledWith(this.registrationResult.email);
});
```

### 9.2 場景間相互影響
**問題**: 場景之間存在數據污染或狀態依賴
**解決方案**:
- 使用 Background 和 Hooks 確保場景隔離
- 每個場景前後清理數據
- 避免場景間的隱式依賴

```gherkin
# 問題場景：依賴前一個場景的數據
Feature: 用戶管理
  Scenario: 創建用戶
    When 我創建用戶 "john@example.com"
    Then 用戶應該被成功創建

  Scenario: 查找用戶 (錯誤：依賴上一個場景)
    When 我查找用戶 "john@example.com"
    Then 應該找到該用戶
```

```gherkin
# 正確的場景隔離
Feature: 用戶管理
  Background:
    Given 資料庫是乾淨的

  Scenario: 創建用戶
    When 我創建用戶 "john@example.com"
    Then 用戶應該被成功創建

  Scenario: 查找已存在的用戶
    Given 已存在用戶 "john@example.com"
    When 我查找用戶 "john@example.com"
    Then 應該找到該用戶
```

```typescript
// hooks.ts - 場景隔離配置
import { Before, After } from '@cucumber/cucumber';

Before(async function () {
  // 每個場景前清理數據
  await this.cleanDatabase();
  await this.resetMocks();
  await this.initializeTestData();
});

After(async function () {
  // 每個場景後清理
  await this.cleanupResources();
});
```

### 9.3 場景過度具體化
**問題**: 場景描述過於技術化，缺乏業務價值
**解決方案**:
- 專注於用戶行為和業務結果
- 避免實現細節
- 使用業務語言而非技術術語

```gherkin
# 錯誤：過度技術化
Scenario: API 調用用戶服務
  Given UserRepository 已初始化
  And EmailService Mock 已設置
  When POST /api/users 被調用，payload 包含：
    | email    | test@example.com |
    | password | hashedPassword   |
  Then HTTP 201 應該被返回
  And 資料庫應該包含新記錄
  And EmailService.sendWelcomeEmail 應該被調用
```

```gherkin
# 正確：業務導向
Scenario: 新用戶註冊
  Given 我是一個新訪客
  When 我使用有效的郵箱和密碼註冊
  Then 我的帳戶應該被創建
  And 我應該收到歡迎郵件
  And 我應該能夠登入系統
```

### 9.4 場景語言不清晰
**問題**: Given-When-Then 語句模糊或不一致
**解決方案**:
- 使用清晰、一致的語言模式
- 建立團隊共同的詞彙表
- 定期審查和重構場景描述

```gherkin
# 錯誤：語言不清晰
Scenario: 用戶操作
  Given 有一些數據
  When 用戶做某些事情
  Then 結果應該正確
```

```gherkin
# 正確：清晰具體
Scenario: 用戶更新個人資料
  Given 我是已登入的用戶 "john@example.com"
  And 我的當前姓名是 "John Doe"
  When 我將姓名更新為 "John Smith"
  Then 我的個人資料應該顯示 "John Smith"
  And 我應該看到成功更新的確認訊息
```

```typescript
// 對應的清晰步驟定義
Given('我是已登入的用戶 {string}', async function (email: string) {
  this.currentUser = await this.loginUser(email);
  expect(this.currentUser).toBeDefined();
});

Given('我的當前姓名是 {string}', async function (currentName: string) {
  expect(this.currentUser.name).toBe(currentName);
});

When('我將姓名更新為 {string}', async function (newName: string) {
  this.updateResult = await this.userService.updateProfile(
    this.currentUser.id,
    { name: newName }
  );
});

Then('我的個人資料應該顯示 {string}', async function (expectedName: string) {
  const updatedUser = await this.userService.getProfile(this.currentUser.id);
  expect(updatedUser.name).toBe(expectedName);
});

Then('我應該看到成功更新的確認訊息', function () {
  expect(this.updateResult.message).toContain('成功更新');
});
```

## 10. BDD 檢查清單

### 10.1 場景設計檢查
- [ ] 場景使用業務語言描述，避免技術術語
- [ ] Given-When-Then 結構清晰且邏輯合理
- [ ] 場景專注於用戶行為和業務價值
- [ ] 避免暴露技術實現細節
- [ ] 場景之間相互獨立，無隱式依賴
- [ ] 使用具體且可測量的驗收條件
- [ ] 場景標題簡潔明瞭，描述核心行為
- [ ] 使用 Background 避免重複的前置條件

### 10.2 步驟定義檢查
- [ ] 步驟定義與 Gherkin 場景語言完全一致
- [ ] 適當使用 Mock 和 Stub，避免過度模擬
- [ ] 測試數據準備充分且具代表性
- [ ] 斷言清晰、具體且有意義
- [ ] 錯誤處理和邊界情況覆蓋完整
- [ ] 性能考量合理，執行時間可接受
- [ ] 步驟定義可重用，避免重複代碼
- [ ] 使用適當的等待和同步機制

### 10.3 測試執行檢查
- [ ] 所有場景都能穩定通過
- [ ] 場景執行時間在合理範圍內
- [ ] 測試環境隔離良好，無數據污染
- [ ] 並行執行穩定，無競態條件
- [ ] 失敗訊息清晰易懂，便於調試
- [ ] 覆蓋率達到預設目標（單元 ≥ 80%，整合 ≥ 70%，E2E ≥ 60%）
- [ ] 測試報告格式清晰，便於閱讀
- [ ] 持續整合流程中測試執行順暢

### 10.4 維護性檢查
- [ ] 場景易於理解和維護，新團隊成員能快速上手
- [ ] 步驟定義模組化良好，便於重用
- [ ] 測試數據管理有序，易於更新
- [ ] 文檔保持最新，與代碼同步
- [ ] 重構不會破壞現有場景
- [ ] 新功能開發時有對應的 BDD 場景
- [ ] 場景描述隨業務需求變化及時更新
- [ ] 廢棄功能的場景及時清理

### 10.5 協作檢查
- [ ] 業務分析師能理解並驗證場景
- [ ] 開發團隊認同場景描述和驗收條件
- [ ] QA 團隊積極參與場景設計和審查
- [ ] 場景作為活文檔，指導開發和測試
- [ ] 定期舉行三方會議審查和更新場景
- [ ] 場景與產品需求文檔保持同步
- [ ] 利益相關者能通過場景了解系統行為
- [ ] 場景成為團隊溝通的共同語言

### 10.6 CI/CD 整合檢查
- [ ] BDD 測試完全整合到持續整合流程
- [ ] 測試報告格式統一，包含場景執行詳情
- [ ] 失敗時提供明確的修復指引和上下文
- [ ] 性能監控到位，及時發現性能退化
- [ ] 測試環境配置正確，與生產環境一致
- [ ] 部署前所有關鍵場景必須通過
- [ ] 測試結果通知機制完善
- [ ] 支援不同環境的場景執行（開發、測試、預生產）

### 10.7 品質保證檢查
- [ ] 場景覆蓋所有主要用戶旅程
- [ ] 邊界條件和異常情況有對應場景
- [ ] 性能相關場景包含在測試套件中
- [ ] 安全性需求通過場景驗證
- [ ] 可訪問性要求在場景中體現
- [ ] 跨瀏覽器和設備兼容性場景完整
- [ ] 數據隱私和合規要求通過場景確保
- [ ] 災難恢復和故障處理場景齊全

遵循這些 BDD 規範和檢查清單，可以確保 MKing Friend 項目的業務需求與技術實現保持一致，提供高品質的用戶體驗，同時支持敏捷開發和持續交付。BDD 方法論將幫助團隊建立共同的理解，減少溝通成本，並確保交付的軟體真正滿足用戶需求。