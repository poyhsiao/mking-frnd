# MKing Friend - TDD 開發規範

## 1. TDD 概述

### 1.1 什麼是 TDD
測試驅動開發 (Test-Driven Development, TDD) 是一種軟體開發方法論，遵循「紅-綠-重構」的循環：

1. **紅 (Red)**: 寫一個失敗的測試
2. **綠 (Green)**: 寫最少的代碼讓測試通過
3. **重構 (Refactor)**: 改善代碼品質，保持測試通過

### 1.2 TDD 的優勢
- **代碼品質**: 確保每行代碼都有測試覆蓋
- **設計改善**: 促進更好的API設計和模組化
- **回歸防護**: 防止新功能破壞現有功能
- **文檔作用**: 測試即是活文檔
- **重構信心**: 安全地改善代碼結構

## 2. TDD 工作流程

### 2.1 基本循環
```
┌─────────────┐
│  寫失敗測試  │
└──────┬──────┘
       │
       ▼
┌─────────────┐    ┌─────────────┐
│  寫實現代碼  │◄───┤   重構代碼   │
└──────┬──────┘    └──────▲──────┘
       │                  │
       ▼                  │
┌─────────────┐           │
│  測試通過？  ├───────────┘
└─────────────┘
```

### 2.2 詳細步驟

#### 步驟 1: 寫失敗測試 (Red)
```typescript
// 範例：用戶註冊功能測試
describe('UserService', () => {
  describe('register', () => {
    it('should create a new user with valid data', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        displayName: 'Test User'
      };

      // Act
      const result = await userService.register(userData);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.email).toBe(userData.email);
      expect(result.displayName).toBe(userData.displayName);
      expect(result.password).toBeUndefined(); // 密碼不應該返回
    });
  });
});
```

#### 步驟 2: 寫實現代碼 (Green)
```typescript
// 最簡實現，讓測試通過
export class UserService {
  async register(userData: RegisterUserDto): Promise<User> {
    // 最簡實現
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const user = await this.prisma.user.create({
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

    // 不返回密碼
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
```

#### 步驟 3: 重構 (Refactor)
```typescript
// 重構後的實現
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

## 3. 測試分層策略

### 3.1 測試金字塔
```
        ┌─────────────┐
        │   E2E Tests │  ← 少量，高價值
        └─────────────┘
      ┌─────────────────┐
      │ Integration Tests│  ← 適量，關鍵路徑
      └─────────────────┘
    ┌─────────────────────┐
    │    Unit Tests       │  ← 大量，快速反饋
    └─────────────────────┘
```

### 3.2 單元測試 (Unit Tests)
**目標**: 測試單一函數或方法
**特點**: 快速、隔離、可重複

```typescript
// 範例：密碼驗證函數測試
describe('PasswordValidator', () => {
  let validator: PasswordValidator;

  beforeEach(() => {
    validator = new PasswordValidator();
  });

  describe('validate', () => {
    it('should return true for valid password', () => {
      const validPassword = 'SecurePass123!';
      const result = validator.validate(validPassword);
      expect(result.isValid).toBe(true);
    });

    it('should return false for password without uppercase', () => {
      const invalidPassword = 'securepass123!';
      const result = validator.validate(invalidPassword);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain uppercase letter');
    });

    it('should return false for short password', () => {
      const shortPassword = 'Sec1!';
      const result = validator.validate(shortPassword);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters');
    });
  });
});
```

### 3.3 整合測試 (Integration Tests)
**目標**: 測試多個模組間的互動
**特點**: 使用真實資料庫、外部服務

```typescript
// 範例：用戶註冊整合測試
describe('User Registration Integration', () => {
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

  beforeEach(async () => {
    // 清理測試資料
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should register user and create profile', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'SecurePass123!',
      displayName: 'Test User'
    };

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(userData)
      .expect(201);

    expect(response.body.user.email).toBe(userData.email);
    expect(response.body.user.profile.displayName).toBe(userData.displayName);

    // 驗證資料庫中的資料
    const userInDb = await prisma.user.findUnique({
      where: { email: userData.email },
      include: { profile: true }
    });

    expect(userInDb).toBeDefined();
    expect(userInDb.profile.displayName).toBe(userData.displayName);
  });
});
```

### 3.4 端到端測試 (E2E Tests)
**目標**: 測試完整的用戶流程
**特點**: 模擬真實用戶操作

```typescript
// 範例：用戶註冊到登入流程
describe('User Registration to Login Flow', () => {
  let page: Page;

  beforeAll(async () => {
    page = await browser.newPage();
  });

  afterAll(async () => {
    await page.close();
  });

  it('should allow user to register and login', async () => {
    // 註冊流程
    await page.goto('/register');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'SecurePass123!');
    await page.fill('[data-testid="display-name-input"]', 'Test User');
    await page.click('[data-testid="register-button"]');

    // 驗證註冊成功
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    // 登入流程
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'SecurePass123!');
    await page.click('[data-testid="login-button"]');

    // 驗證登入成功
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-name"]')).toHaveText('Test User');
  });
});
```

## 4. 測試最佳實踐

### 4.1 測試命名規範
```typescript
// 好的測試命名
describe('UserService', () => {
  describe('register', () => {
    it('should create user when valid data provided', () => {});
    it('should throw error when email already exists', () => {});
    it('should hash password before storing', () => {});
  });
});

// 避免的命名
describe('UserService', () => {
  it('test1', () => {}); // ❌ 不清楚
  it('should work', () => {}); // ❌ 太模糊
});
```

### 4.2 AAA 模式
每個測試都應該遵循 Arrange-Act-Assert 模式：

```typescript
it('should calculate total price with tax', () => {
  // Arrange - 準備測試資料
  const items = [
    { price: 100, quantity: 2 },
    { price: 50, quantity: 1 }
  ];
  const taxRate = 0.1;
  const calculator = new PriceCalculator();

  // Act - 執行被測試的操作
  const result = calculator.calculateTotal(items, taxRate);

  // Assert - 驗證結果
  expect(result.subtotal).toBe(250);
  expect(result.tax).toBe(25);
  expect(result.total).toBe(275);
});
```

### 4.3 測試隔離
```typescript
// 每個測試都應該獨立
describe('UserService', () => {
  let userService: UserService;
  let mockPrisma: jest.Mocked<PrismaService>;

  beforeEach(() => {
    // 每個測試前重新創建實例
    mockPrisma = createMockPrismaService();
    userService = new UserService(mockPrisma);
  });

  it('should create user', async () => {
    // 測試邏輯
  });

  it('should update user', async () => {
    // 這個測試不依賴前一個測試
  });
});
```

### 4.4 Mock 使用原則
```typescript
// 好的 Mock 使用
describe('EmailService', () => {
  let emailService: EmailService;
  let mockMailer: jest.Mocked<Mailer>;

  beforeEach(() => {
    mockMailer = {
      send: jest.fn().mockResolvedValue({ messageId: 'test-id' })
    };
    emailService = new EmailService(mockMailer);
  });

  it('should send welcome email', async () => {
    const user = { email: 'test@example.com', name: 'Test User' };
    
    await emailService.sendWelcomeEmail(user);
    
    expect(mockMailer.send).toHaveBeenCalledWith({
      to: user.email,
      subject: 'Welcome to MKing Friend',
      template: 'welcome',
      data: { name: user.name }
    });
  });
});
```

## 5. 前端 TDD

### 5.1 React 組件測試
```typescript
// 範例：登入表單組件測試
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('should render email and password inputs', () => {
    render(<LoginForm onSubmit={mockOnSubmit} />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('should show validation errors for empty fields', async () => {
    render(<LoginForm onSubmit={mockOnSubmit} />);
    
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should call onSubmit with form data when valid', async () => {
    render(<LoginForm onSubmit={mockOnSubmit} />);
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });
});
```

### 5.2 Hook 測試
```typescript
// 範例：自定義 Hook 測試
import { renderHook, act } from '@testing-library/react';
import { useAuth } from './useAuth';

describe('useAuth', () => {
  it('should initialize with no user', () => {
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should login user successfully', async () => {
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });
    
    expect(result.current.user).toBeDefined();
    expect(result.current.isAuthenticated).toBe(true);
  });
});
```

## 6. 資料庫測試策略

### 6.1 測試資料庫設置
```typescript
// tests/database.setup.ts
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

### 6.2 資料庫測試範例
```typescript
// tests/repositories/user.repository.test.ts
import { UserRepository } from '../../src/repositories/user.repository';
import { prisma, cleanupTestDatabase } from '../database.setup';

describe('UserRepository', () => {
  let userRepository: UserRepository;

  beforeAll(() => {
    userRepository = new UserRepository(prisma);
  });

  beforeEach(async () => {
    await cleanupTestDatabase();
  });

  describe('create', () => {
    it('should create user with profile', async () => {
      const userData = {
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        profile: {
          displayName: 'Test User',
          bio: 'Test bio'
        }
      };

      const user = await userRepository.create(userData);

      expect(user.id).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.profile.displayName).toBe(userData.profile.displayName);
    });
  });

  describe('findByEmail', () => {
    it('should return user when email exists', async () => {
      // 先創建用戶
      const createdUser = await userRepository.create({
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        profile: { displayName: 'Test User' }
      });

      // 查找用戶
      const foundUser = await userRepository.findByEmail('test@example.com');

      expect(foundUser).toBeDefined();
      expect(foundUser.id).toBe(createdUser.id);
    });

    it('should return null when email does not exist', async () => {
      const user = await userRepository.findByEmail('nonexistent@example.com');
      expect(user).toBeNull();
    });
  });
});
```

## 7. 測試覆蓋率

### 7.1 覆蓋率目標
- **語句覆蓋率**: ≥ 90%
- **分支覆蓋率**: ≥ 85%
- **函數覆蓋率**: ≥ 95%
- **行覆蓋率**: ≥ 90%

### 7.2 覆蓋率配置
```json
// jest.config.js
module.exports = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 95,
      lines: 90,
      statements: 90
    }
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/**/*.interface.ts'
  ]
};
```

### 7.3 覆蓋率報告
```bash
# 生成覆蓋率報告
npm run test:coverage

# 查看HTML報告
open coverage/lcov-report/index.html
```

## 8. CI/CD 中的測試

### 8.1 GitHub Actions 配置
```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: mking_frnd_test
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
    
    - name: Run database migrations
      run: npx prisma migrate deploy
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/mking_frnd_test
    
    - name: Run unit tests
      run: npm run test:unit
    
    - name: Run integration tests
      run: npm run test:integration
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/mking_frnd_test
        REDIS_URL: redis://localhost:6379
    
    - name: Run E2E tests
      run: npm run test:e2e
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
```

## 9. 常見問題與解決方案

### 9.1 測試執行緩慢
**問題**: 測試執行時間過長
**解決方案**:
- 使用 `--maxWorkers` 參數並行執行
- 分離單元測試和整合測試
- 使用內存資料庫進行測試

```bash
# 並行執行測試
npm test -- --maxWorkers=4

# 只執行單元測試
npm run test:unit
```

### 9.2 測試間相互影響
**問題**: 測試結果不穩定
**解決方案**:
- 確保每個測試前清理資料
- 使用獨立的測試資料庫
- 避免全局狀態

### 9.3 Mock 過度使用
**問題**: 測試與實際行為脫節
**解決方案**:
- 只 Mock 外部依賴
- 使用真實的資料庫進行整合測試
- 定期執行端到端測試

## 10. TDD 檢查清單

### 10.1 開發前檢查
- [ ] 理解需求和驗收條件
- [ ] 設計測試案例
- [ ] 準備測試資料
- [ ] 設置測試環境

### 10.2 開發中檢查
- [ ] 先寫失敗測試
- [ ] 寫最少代碼讓測試通過
- [ ] 重構改善代碼品質
- [ ] 確保所有測試通過

### 10.3 完成後檢查
- [ ] 測試覆蓋率達標
- [ ] 代碼品質符合標準
- [ ] 文檔已更新
- [ ] CI/CD 流程通過

遵循這些 TDD 規範，可以確保 MKing Friend 項目的代碼品質和可維護性，同時提供快速的反饋循環來支持敏捷開發。