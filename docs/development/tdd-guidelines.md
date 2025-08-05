# MKing Friend - TDD Development Guidelines

## 1. TDD Overview

### 1.1 What is TDD
Test-Driven Development (TDD) is a software development methodology that follows the "Red-Green-Refactor" cycle:

1. **Red**: Write a failing test
2. **Green**: Write minimal code to make the test pass
3. **Refactor**: Improve code quality while keeping tests passing

### 1.2 Advantages of TDD
- **Code Quality**: Ensures every line of code has test coverage
- **Design Improvement**: Promotes better API design and modularity
- **Regression Protection**: Prevents new features from breaking existing functionality
- **Documentation**: Tests serve as living documentation
- **Refactoring Confidence**: Safely improve code structure

## 2. TDD Workflow

### 2.1 Basic Cycle
```
┌─────────────┐
│ Write Failing│
│    Test     │
└──────┬──────┘
       │
       ▼
┌─────────────┐    ┌─────────────┐
│ Write Code  │◄───┤  Refactor   │
│Implementation│    │    Code     │
└──────┬──────┘    └──────▲──────┘
       │                  │
       ▼                  │
┌─────────────┐           │
│ Test Pass?  ├───────────┘
└─────────────┘
```

### 2.2 Detailed Steps

#### Step 1: Write Failing Test (Red)
```typescript
// Example: User registration feature test
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
      expect(result.password).toBeUndefined(); // Password should not be returned
    });
  });
});
```

#### Step 2: Write Implementation Code (Green)
```typescript
// Minimal implementation to make test pass
export class UserService {
  async register(userData: RegisterUserDto): Promise<User> {
    // Minimal implementation
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

    // Don't return password
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
```

#### Step 3: Refactor
```typescript
// Refactored implementation
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hashService: HashService,
    private readonly validationService: ValidationService
  ) {}

  async register(userData: RegisterUserDto): Promise<User> {
    // Validate input
    await this.validationService.validateUserData(userData);
    
    // Check if user already exists
    await this.checkUserExists(userData.email);
    
    // Create user
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

## 3. Test Layering Strategy

### 3.1 Test Pyramid
```
        ┌─────────────┐
        │   E2E Tests │  ← Few, high value
        └─────────────┘
      ┌─────────────────┐
      │ Integration Tests│  ← Some, critical paths
      └─────────────────┘
    ┌─────────────────────┐
    │    Unit Tests       │  ← Many, fast feedback
    └─────────────────────┘
```

### 3.2 Unit Tests
**Goal**: Test single functions or methods
**Characteristics**: Fast, isolated, repeatable

```typescript
// Example: Password validation function test
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

### 3.3 Integration Tests
**Goal**: Test interactions between multiple modules
**Characteristics**: Use real database, external services

```typescript
// Example: User registration integration test
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
    // Clean test data
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

    // Verify data in database
    const userInDb = await prisma.user.findUnique({
      where: { email: userData.email },
      include: { profile: true }
    });

    expect(userInDb).toBeDefined();
    expect(userInDb.profile.displayName).toBe(userData.displayName);
  });
});
```

### 3.4 End-to-End Tests (E2E)
**Goal**: Test complete user workflows
**Characteristics**: Simulate real user operations

```typescript
// Example: User registration to login flow
describe('User Registration to Login Flow', () => {
  let page: Page;

  beforeAll(async () => {
    page = await browser.newPage();
  });

  afterAll(async () => {
    await page.close();
  });

  it('should allow user to register and login', async () => {
    // Registration flow
    await page.goto('/register');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'SecurePass123!');
    await page.fill('[data-testid="display-name-input"]', 'Test User');
    await page.click('[data-testid="register-button"]');

    // Verify registration success
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    // Login flow
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'SecurePass123!');
    await page.click('[data-testid="login-button"]');

    // Verify login success
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-name"]')).toHaveText('Test User');
  });
});
```

## 4. Testing Best Practices

### 4.1 Test Naming Conventions
```typescript
// Good test naming
describe('UserService', () => {
  describe('register', () => {
    it('should create user when valid data provided', () => {});
    it('should throw error when email already exists', () => {});
    it('should hash password before storing', () => {});
  });
});

// Avoid these naming patterns
describe('UserService', () => {
  it('test1', () => {}); // ❌ Unclear
  it('should work', () => {}); // ❌ Too vague
});
```

### 4.2 AAA Pattern
Every test should follow the Arrange-Act-Assert pattern:

```typescript
it('should calculate total price with tax', () => {
  // Arrange - Prepare test data
  const items = [
    { price: 100, quantity: 2 },
    { price: 50, quantity: 1 }
  ];
  const taxRate = 0.1;
  const calculator = new PriceCalculator();

  // Act - Execute the operation being tested
  const result = calculator.calculateTotal(items, taxRate);

  // Assert - Verify the result
  expect(result.subtotal).toBe(250);
  expect(result.tax).toBe(25);
  expect(result.total).toBe(275);
});
```

### 4.3 Test Isolation
```typescript
// Each test should be independent
describe('UserService', () => {
  let userService: UserService;
  let mockPrisma: jest.Mocked<PrismaService>;

  beforeEach(() => {
    // Recreate instances before each test
    mockPrisma = createMockPrismaService();
    userService = new UserService(mockPrisma);
  });

  it('should create user', async () => {
    // Test logic
  });

  it('should update user', async () => {
    // This test doesn't depend on the previous test
  });
});
```

### 4.4 Mock Usage Principles
```typescript
// Good mock usage
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

## 5. Frontend TDD

### 5.1 React Component Testing
```typescript
// Example: Login form component test
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

### 5.2 Hook Testing
```typescript
// Example: Custom hook test
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

## 6. Database Testing Strategy

### 6.1 Test Database Setup
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
  // Run migrations
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL }
  });
}

export async function cleanupTestDatabase() {
  // Clean all table data
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

### 6.2 Database Test Example
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
      // First create user
      const createdUser = await userRepository.create({
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        profile: { displayName: 'Test User' }
      });

      // Find user
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

## 7. Test Coverage

### 7.1 Coverage Goals
- **Statement Coverage**: ≥ 90%
- **Branch Coverage**: ≥ 85%
- **Function Coverage**: ≥ 95%
- **Line Coverage**: ≥ 90%

### 7.2 Coverage Configuration
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

### 7.3 Coverage Reports
```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/lcov-report/index.html
```

## 8. Testing in CI/CD

### 8.1 GitHub Actions Configuration
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

## 9. Common Issues and Solutions

### 9.1 Slow Test Execution
**Problem**: Tests take too long to execute
**Solutions**:
- Use `--maxWorkers` parameter for parallel execution
- Separate unit tests from integration tests
- Use in-memory database for testing

```bash
# Run tests in parallel
npm test -- --maxWorkers=4

# Run only unit tests
npm run test:unit
```

### 9.2 Test Interference
**Problem**: Unstable test results
**Solutions**:
- Ensure data cleanup before each test
- Use isolated test database
- Avoid global state

### 9.3 Over-mocking
**Problem**: Tests disconnected from actual behavior
**Solutions**:
- Only mock external dependencies
- Use real database for integration tests
- Run end-to-end tests regularly

## 10. TDD Checklist

### 10.1 Pre-development Checklist
- [ ] Understand requirements and acceptance criteria
- [ ] Design test cases
- [ ] Prepare test data
- [ ] Set up test environment

### 10.2 During Development Checklist
- [ ] Write failing test first
- [ ] Write minimal code to make test pass
- [ ] Refactor to improve code quality
- [ ] Ensure all tests pass

### 10.3 Post-completion Checklist
- [ ] Test coverage meets targets
- [ ] Code quality meets standards
- [ ] Documentation updated
- [ ] CI/CD pipeline passes

Following these TDD guidelines ensures code quality and maintainability for the MKing Friend project while providing fast feedback loops to support agile development.