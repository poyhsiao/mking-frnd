# MKing Friend - BDD Development Guidelines

## 1. BDD Overview

### 1.1 What is BDD

Behavior-Driven Development (BDD) is a software development methodology that
focuses on the behavior of the application from the user's perspective. BDD uses
natural language constructs to express the behavior and expected outcomes of
software.

**Core Principles:**

1. **Given-When-Then**: Structure scenarios using natural language
2. **Collaboration**: Bridge communication between stakeholders, developers, and
   testers
3. **Living Documentation**: Scenarios serve as executable specifications
4. **Outside-In**: Start with user behavior and work inward

### 1.2 Advantages of BDD

- **Clear Communication**: Uses ubiquitous language understood by all
  stakeholders
- **Better Requirements**: Forces clarification of acceptance criteria
- **Living Documentation**: Scenarios document expected behavior
- **Reduced Ambiguity**: Gherkin syntax eliminates misunderstandings
- **User-Focused**: Ensures features deliver real user value

## 2. BDD Workflow

### 2.1 BDD Process Cycle

```
┌─────────────┐
│  Discovery  │
│ (Collaborate)│
└──────┬──────┘
       │
       ▼
┌─────────────┐    ┌─────────────┐
│ Automation  │◄───┤ Formulation │
│(Implement)  │    │(Write Steps)│
└──────┬──────┘    └──────▲──────┘
       │                  │
       ▼                  │
┌─────────────┐           │
│Scenarios Pass├───────────┘
└─────────────┘
```

### 2.2 Detailed Steps

#### Step 1: Discovery - Understand the Behavior

```gherkin
# Example: User registration feature
Feature: User Registration
  As a new user
  I want to register for an account
  So that I can access the MKing Friend platform

  Background:
    Given the registration system is available
    And the database is accessible

  Scenario: Successful user registration with valid data
    Given I am on the registration page
    When I enter valid registration details:
      | field        | value              |
      | email        | test@example.com   |
      | password     | SecurePass123!     |
      | displayName  | Test User          |
    And I submit the registration form
    Then I should see a success message
    And my account should be created
    And I should receive a welcome email

  Scenario: Registration fails with invalid email
    Given I am on the registration page
    When I enter an invalid email "invalid-email"
    And I submit the registration form
    Then I should see an error message "Please enter a valid email address"
    And my account should not be created
```

#### Step 2: Formulation - Write Step Definitions

```typescript
// tests/step-definitions/user-registration.steps.ts
import { Given, When, Then, Before } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { UserService } from '../../src/services/user.service';
import { PrismaService } from '../../src/services/prisma.service';

let userService: UserService;
let prismaService: PrismaService;
let registrationData: any;
let registrationResult: any;
let currentPage: any;

Before(async function () {
  prismaService = new PrismaService();
  userService = new UserService(prismaService);
});

Given('the registration system is available', async function () {
  // Ensure services are initialized and database is connected
  await prismaService.$connect();
});

Given('I am on the registration page', async function () {
  currentPage = 'registration';
});

When('I enter valid registration details:', async function (dataTable) {
  const data = dataTable.rowsHash();
  registrationData = {
    email: data.email,
    password: data.password,
    displayName: data.displayName,
  };
});

When('I submit the registration form', async function () {
  registrationResult = await userService.register(registrationData);
});

Then('I should see a success message', async function () {
  expect(registrationResult.success).toBe(true);
});

Then('my account should be created', async function () {
  expect(registrationResult.user).toBeDefined();
  expect(registrationResult.user.email).toBe(registrationData.email);
});
```

#### Step 3: Automation - Implement the Behavior

```typescript
// src/services/user.service.ts - Implementing the behavior
import { PrismaService } from './prisma.service';
import { EmailService } from './email.service';
import { hash } from 'bcrypt';

export interface UserRegistrationData {
  email: string;
  password: string;
  displayName: string;
}

export interface RegistrationResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    displayName: string;
  };
  error?: string;
}

export class UserService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async register(userData: UserRegistrationData): Promise<RegistrationResult> {
    // Validate input according to business rules
    const validation = this.validateRegistrationData(userData);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    try {
      // Check if user already exists (business rule)
      const existingUser = await this.prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existingUser) {
        return {
          success: false,
          error: 'User with this email already exists',
        };
      }

      // Create user following the expected behavior
      const passwordHash = await hash(userData.password, 10);

      const user = await this.prisma.$transaction(async tx => {
        const newUser = await tx.user.create({
          data: {
            email: userData.email,
            passwordHash,
            profile: {
              create: {
                displayName: userData.displayName,
              },
            },
          },
          include: {
            profile: true,
          },
        });

        // Send welcome email as part of registration behavior
        await this.emailService.sendWelcomeEmail({
          email: newUser.email,
          displayName: newUser.profile.displayName,
        });

        return newUser;
      });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.profile.displayName,
        },
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'Registration failed due to server error',
      };
    }
  }

  private validateRegistrationData(userData: UserRegistrationData): {
    isValid: boolean;
    error?: string;
  } {
    if (!userData.email || !this.isValidEmail(userData.email)) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }

    if (!userData.password || userData.password.length < 8) {
      return {
        isValid: false,
        error: 'Password must be at least 8 characters',
      };
    }

    if (!userData.displayName || userData.displayName.trim().length === 0) {
      return { isValid: false, error: 'Display name is required' };
    }

    return { isValid: true };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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

### 3.2 Unit Scenarios

**Goal**: Describe component behavior in isolation **Characteristics**: Fast,
focused, clear business intent

```gherkin
# Example: Password validation scenarios
Feature: Password Validation
  As a security-conscious system
  I want to validate user passwords
  So that user accounts remain secure

  Scenario: Strong password is accepted
    Given I have a password validator
    When I validate the password "SecurePass123!"
    Then the validation should succeed
    And no error messages should be returned

  Scenario: Password without uppercase is rejected
    Given I have a password validator
    When I validate the password "securepass123!"
    Then the validation should fail
    And I should see the error "Password must contain uppercase letter"

  Scenario: Short password is rejected
    Given I have a password validator
    When I validate the password "Sec1!"
    Then the validation should fail
    And I should see the error "Password must be at least 8 characters"
```

```typescript
// Step definitions for password validation
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PasswordValidator } from '../../src/utils/password-validator';

let validator: PasswordValidator;
let validationResult: any;

Given('I have a password validator', function () {
  validator = new PasswordValidator();
});

When('I validate the password {string}', function (password: string) {
  validationResult = validator.validate(password);
});

Then('the validation should succeed', function () {
  expect(validationResult.isValid).toBe(true);
});

Then('the validation should fail', function () {
  expect(validationResult.isValid).toBe(false);
});

Then('I should see the error {string}', function (expectedError: string) {
  expect(validationResult.errors).toContain(expectedError);
});
```

### 3.3 Integration Scenarios

**Goal**: Describe service interactions and data flow **Characteristics**: Use
real database, focus on collaboration

```gherkin
# Example: User registration integration scenarios
Feature: User Registration Integration
  As a new user
  I want my registration to be processed completely
  So that I can start using the platform immediately

  Background:
    Given the user service is available
    And the database is connected
    And the email service is configured

  Scenario: Complete user registration process
    Given no user exists with email "test@example.com"
    When I register with the following details:
      | email       | test@example.com |
      | password    | SecurePass123!   |
      | displayName | Test User        |
    Then my user account should be created in the database
    And my profile should be set up with display name "Test User"
    And a welcome email should be sent to "test@example.com"
    And the registration should return my user details
```

```typescript
// Step definitions for integration scenarios
import { Given, When, Then, Before } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../../src/services/user.service';
import { PrismaService } from '../../src/services/prisma.service';

let app: INestApplication;
let userService: UserService;
let prisma: PrismaService;
let registrationResult: any;
let registrationData: any;

Before(async function () {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();
  userService = app.get<UserService>(UserService);
  prisma = app.get<PrismaService>(PrismaService);
  await app.init();

  // Clean test data
  await prisma.user.deleteMany();
});

Given('no user exists with email {string}', async function (email: string) {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  expect(existingUser).toBeNull();
});

When('I register with the following details:', async function (dataTable) {
  const data = dataTable.rowsHash();
  registrationData = {
    email: data.email,
    password: data.password,
    displayName: data.displayName,
  };
  registrationResult = await userService.register(registrationData);
});

Then('my user account should be created in the database', async function () {
  const userInDb = await prisma.user.findUnique({
    where: { email: registrationData.email },
    include: { profile: true },
  });
  expect(userInDb).toBeDefined();
  expect(userInDb.profile.displayName).toBe(registrationData.displayName);
});
```

### 3.4 End-to-End Scenarios

**Goal**: Describe complete user journeys **Characteristics**: Simulate real
user behavior and expectations

```gherkin
# Example: Complete user onboarding journey
Feature: User Onboarding Journey
  As a new visitor
  I want to register and access the platform
  So that I can start using MKing Friend features

  Scenario: Successful user registration and first login
    Given I am a new visitor to the MKing Friend website
    When I navigate to the registration page
    And I fill in the registration form with:
      | Email        | test@example.com |
      | Password     | SecurePass123!   |
      | Display Name | Test User        |
    And I submit the registration form
    Then I should see a success message "Registration successful!"

    When I navigate to the login page
    And I enter my credentials:
      | Email    | test@example.com |
      | Password | SecurePass123!   |
    And I click the login button
    Then I should be redirected to the dashboard
    And I should see my display name "Test User" in the header
    And I should have access to all platform features
```

```typescript
// Step definitions for E2E scenarios
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { Page } from '@playwright/test';

let page: Page;

Given('I am a new visitor to the MKing Friend website', async function () {
  // Page setup is handled by test framework
});

When('I navigate to the registration page', async function () {
  await page.goto('/register');
});

When('I fill in the registration form with:', async function (dataTable) {
  const data = dataTable.rowsHash();
  await page.fill('[data-testid="email-input"]', data.Email);
  await page.fill('[data-testid="password-input"]', data.Password);
  await page.fill('[data-testid="display-name-input"]', data['Display Name']);
});

When('I submit the registration form', async function () {
  await page.click('[data-testid="register-button"]');
});

Then(
  'I should see a success message {string}',
  async function (message: string) {
    await expect(page.locator('[data-testid="success-message"]')).toContainText(
      message,
    );
  },
);

When('I navigate to the login page', async function () {
  await page.goto('/login');
});

Then('I should be redirected to the dashboard', async function () {
  await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
});

Then(
  'I should see my display name {string} in the header',
  async function (displayName: string) {
    await expect(page.locator('[data-testid="user-name"]')).toHaveText(
      displayName,
    );
  },
);
```

## 4. BDD Best Practices

### 4.1 Scenario Writing Guidelines

```gherkin
# Good scenario structure
Feature: User Registration
  Scenario: User registers with valid information
    Given I am on the registration page
    When I enter valid user details
    And I submit the registration form
    Then I should see a success message
    And my account should be created

  Scenario: Registration fails with duplicate email
    Given a user already exists with email "test@example.com"
    When I try to register with the same email
    Then I should see an error "Email already exists"
    And no new account should be created

# Avoid these patterns
Scenario: Test registration # ❌ Unclear intent
Scenario: It should work   # ❌ Too vague
```

### 4.2 Given-When-Then Structure

Every scenario should follow the Given-When-Then pattern:

```gherkin
Scenario: Calculate total price with tax
  Given I have the following items in my cart:
    | item     | price | quantity |
    | Widget A | 100   | 2        |
    | Widget B | 50    | 1        |
  And the tax rate is 10%
  When I calculate the total price
  Then the subtotal should be 250
  And the tax should be 25
  And the total should be 275
```

```typescript
// Step definitions following GWT pattern
Given('I have the following items in my cart:', function (dataTable) {
  this.items = dataTable.hashes().map(row => ({
    name: row.item,
    price: parseInt(row.price),
    quantity: parseInt(row.quantity),
  }));
});

Given('the tax rate is {int}%', function (taxRate: number) {
  this.taxRate = taxRate / 100;
});

When('I calculate the total price', function () {
  const calculator = new PriceCalculator();
  this.result = calculator.calculateTotal(this.items, this.taxRate);
});

Then('the subtotal should be {int}', function (expectedSubtotal: number) {
  expect(this.result.subtotal).toBe(expectedSubtotal);
});

Then('the tax should be {int}', function (expectedTax: number) {
  expect(this.result.tax).toBe(expectedTax);
});

Then('the total should be {int}', function (expectedTotal: number) {
  expect(this.result.total).toBe(expectedTotal);
});
```

### 4.3 Scenario Isolation

```gherkin
# Each scenario should be independent
Feature: User Management
  Background:
    Given the system is initialized
    And the database is clean

  Scenario: Create new user
    Given no users exist in the system
    When I create a user with email "test@example.com"
    Then the user should be created successfully

  Scenario: Update existing user
    Given a user exists with email "existing@example.com"
    When I update the user's display name to "Updated Name"
    Then the user's display name should be "Updated Name"
    # This scenario doesn't depend on the previous one
```

```typescript
// Step definitions with proper isolation
import { Before, Given, When, Then } from '@cucumber/cucumber';

Before(async function () {
  // Reset state before each scenario
  this.mockPrisma = createMockPrismaService();
  this.userService = new UserService(this.mockPrisma);
});

Given('the system is initialized', function () {
  // Ensure clean state
  expect(this.userService).toBeDefined();
});
```

### 4.4 Mock and Stub Guidelines

```gherkin
# Focus on behavior, not implementation
Feature: Email Notifications
  Scenario: Welcome email is sent after registration
    Given the email service is available
    When a user registers with email "test@example.com"
    Then a welcome email should be sent to "test@example.com"
    And the email should contain "Welcome to MKing Friend"
```

```typescript
// Step definitions with appropriate mocking
Given('the email service is available', function () {
  this.mockMailer = {
    send: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
  };
  this.emailService = new EmailService(this.mockMailer);
});

When('a user registers with email {string}', async function (email: string) {
  const userData = { email, password: 'test123', displayName: 'Test User' };
  await this.userService.register(userData);
});

Then('a welcome email should be sent to {string}', function (email: string) {
  expect(this.mockMailer.send).toHaveBeenCalledWith(
    expect.objectContaining({
      to: email,
      subject: expect.stringContaining('Welcome'),
    }),
  );
});

Then('the email should contain {string}', function (expectedContent: string) {
  const emailCall = this.mockMailer.send.mock.calls[0][0];
  expect(emailCall.template).toBe('welcome');
  expect(emailCall.data).toEqual(
    expect.objectContaining({ name: 'Test User' }),
  );
});
```

## 5. Frontend BDD

### 5.1 React Component Behavior

```gherkin
# Example: Login form behavior scenarios
Feature: Login Form
  As a user
  I want to log into my account
  So that I can access my personal dashboard

  Scenario: Login form displays required fields
    Given I am on the login page
    Then I should see an email input field
    And I should see a password input field
    And I should see a login button

  Scenario: Form validation prevents empty submission
    Given I am on the login page
    When I click the login button without entering any data
    Then I should see the error "Email is required"
    And I should see the error "Password is required"
    And the form should not be submitted

  Scenario: Successful login with valid credentials
    Given I am on the login page
    When I enter email "test@example.com"
    And I enter password "password123"
    And I click the login button
    Then the login form should be submitted
    And the form data should include email "test@example.com"
    And the form data should include password "password123"
```

```typescript
// Step definitions for React component behavior
import { Given, When, Then, Before } from '@cucumber/cucumber';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { expect } from '@playwright/test';
import { LoginForm } from './LoginForm';

let mockOnSubmit: jest.Mock;
let formData: any;

Before(function() {
  mockOnSubmit = jest.fn();
  formData = null;
});

Given('I am on the login page', function() {
  render(<LoginForm onSubmit={mockOnSubmit} />);
});

Then('I should see an email input field', function() {
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
});

Then('I should see a password input field', function() {
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
});

Then('I should see a login button', function() {
  expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
});

When('I click the login button without entering any data', async function() {
  fireEvent.click(screen.getByRole('button', { name: /login/i }));
});

Then('I should see the error {string}', async function(errorMessage: string) {
  await waitFor(() => {
    expect(screen.getByText(new RegExp(errorMessage, 'i'))).toBeInTheDocument();
  });
});

When('I enter email {string}', function(email: string) {
  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: email }
  });
});

When('I enter password {string}', function(password: string) {
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: password }
  });
});

Then('the login form should be submitted', async function() {
  await waitFor(() => {
    expect(mockOnSubmit).toHaveBeenCalled();
  });
  formData = mockOnSubmit.mock.calls[0][0];
});

Then('the form data should include email {string}', function(expectedEmail: string) {
  expect(formData.email).toBe(expectedEmail);
});

Then('the form data should include password {string}', function(expectedPassword: string) {
  expect(formData.password).toBe(expectedPassword);
});
```

### 5.2 React Hook Behavior

```gherkin
# Example: Authentication hook behavior
Feature: Authentication Hook
  As a developer
  I want to manage user authentication state
  So that components can react to login/logout events

  Scenario: Hook initializes with no authenticated user
    Given I use the authentication hook
    Then the current user should be null
    And the loading state should be false
    And the authenticated state should be false

  Scenario: User logs in successfully
    Given I use the authentication hook
    And the authentication service is available
    When I call login with email "test@example.com" and password "password123"
    Then the user should be authenticated
    And the current user should be defined
    And the authenticated state should be true

  Scenario: User logs out successfully
    Given I use the authentication hook
    And I am logged in as "test@example.com"
    When I call logout
    Then the current user should be null
    And the authenticated state should be false
```

```typescript
// Step definitions for React hook behavior
import { Given, When, Then, Before } from '@cucumber/cucumber';
import { renderHook, act } from '@testing-library/react';
import { expect } from '@playwright/test';
import { useAuth } from './useAuth';

let hookResult: any;
let authHook: any;

Before(function () {
  hookResult = null;
  authHook = null;
});

Given('I use the authentication hook', function () {
  const { result } = renderHook(() => useAuth());
  hookResult = result;
  authHook = result.current;
});

Then('the current user should be null', function () {
  expect(hookResult.current.user).toBeNull();
});

Then('the loading state should be false', function () {
  expect(hookResult.current.isLoading).toBe(false);
});

Then('the authenticated state should be false', function () {
  expect(hookResult.current.isAuthenticated).toBe(false);
});

When(
  'I call login with email {string} and password {string}',
  async function (email: string, password: string) {
    await act(async () => {
      await hookResult.current.login(email, password);
    });
  },
);

Then('the user should be authenticated', function () {
  expect(hookResult.current.isAuthenticated).toBe(true);
});

Then('the current user should be defined', function () {
  expect(hookResult.current.user).toBeDefined();
});

Given('I am logged in as {string}', async function (email: string) {
  await act(async () => {
    await hookResult.current.login(email, 'password123');
  });
});

When('I call logout', async function () {
  await act(async () => {
    await hookResult.current.logout();
  });
});
```

## 6. Database BDD Strategy

### 6.1 Database Scenario Setup

```gherkin
# Database behavior scenarios
Feature: Database Operations
  As a system
  I want to persist and retrieve user data
  So that user information is maintained across sessions

  Background:
    Given the test database is initialized
    And all tables are clean

  Scenario: Create user with encrypted password
    Given I have user data with email "test@example.com"
    And the password is "plaintext123"
    When I create the user in the database
    Then the user should be saved with a unique ID
    And the password should be encrypted
    And the email should be "test@example.com"

  Scenario: Find existing user by email
    Given a user exists with email "findme@example.com"
    When I search for the user by email "findme@example.com"
    Then the user should be found
    And the user details should match the stored data

  Scenario: User not found for non-existent email
    Given no user exists with email "notfound@example.com"
    When I search for the user by email "notfound@example.com"
    Then no user should be found
```

```typescript
// Database step definitions
import { Given, When, Then, Before, After } from '@cucumber/cucumber';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { UserRepository } from './UserRepository';
import { expect } from '@playwright/test';

const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_TEST_URL,
    },
  },
});

let userRepository: UserRepository;
let userData: any;
let createdUser: any;
let foundUser: any;

Before(async function () {
  // Setup test database
  execSync('npx prisma migrate reset --force --skip-seed', {
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_TEST_URL },
  });

  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_TEST_URL },
  });

  userRepository = new UserRepository(testPrisma);
});

After(async function () {
  await testPrisma.$disconnect();
});

Given('the test database is initialized', function () {
  expect(userRepository).toBeDefined();
});

Given('all tables are clean', async function () {
  await testPrisma.user.deleteMany();
});

Given('I have user data with email {string}', function (email: string) {
  userData = {
    email,
    displayName: 'Test User',
  };
});

Given('the password is {string}', function (password: string) {
  userData.password = password;
});

When('I create the user in the database', async function () {
  createdUser = await userRepository.create(userData);
});

Then('the user should be saved with a unique ID', function () {
  expect(createdUser.id).toBeDefined();
  expect(typeof createdUser.id).toBe('string');
});

Then('the password should be encrypted', function () {
  expect(createdUser.password).not.toBe(userData.password);
  expect(createdUser.password.length).toBeGreaterThan(20); // Hashed passwords are longer
});

Then('the email should be {string}', function (expectedEmail: string) {
  expect(createdUser.email).toBe(expectedEmail);
});

Given('a user exists with email {string}', async function (email: string) {
  const existingUserData = {
    email,
    password: 'hashed123',
    displayName: 'Existing User',
  };
  await testPrisma.user.create({ data: existingUserData });
});

When('I search for the user by email {string}', async function (email: string) {
  foundUser = await userRepository.findByEmail(email);
});

Then('the user should be found', function () {
  expect(foundUser).toBeDefined();
  expect(foundUser).not.toBeNull();
});

Then('the user details should match the stored data', function () {
  expect(foundUser.email).toBeDefined();
  expect(foundUser.displayName).toBeDefined();
});

Given('no user exists with email {string}', async function (email: string) {
  // Ensure user doesn't exist
  await testPrisma.user.deleteMany({ where: { email } });
});

Then('no user should be found', function () {
  expect(foundUser).toBeNull();
});
```

````

## 7. BDD Coverage Strategy

### 7.1 Scenario Coverage Goals
- **Unit Scenarios**: 90%+ behavior coverage for individual components
- **Integration Scenarios**: Cover all API endpoint behaviors
- **E2E Scenarios**: Cover critical user journey behaviors
- **Feature Coverage**: Every feature should have corresponding Gherkin scenarios

### 7.2 Cucumber Configuration
```javascript
// cucumber.config.js
module.exports = {
  default: {
    require: [
      'src/test/steps/**/*.ts',
      'src/test/support/**/*.ts'
    ],
    requireModule: ['ts-node/register'],
    format: [
      'progress-bar',
      'html:reports/cucumber-report.html',
      'json:reports/cucumber-report.json'
    ],
    formatOptions: {
      snippetInterface: 'async-await'
    },
    publishQuiet: true
  }
};
````

```json
// package.json scripts
{
  "scripts": {
    "test:bdd": "cucumber-js",
    "test:bdd:unit": "cucumber-js --tags '@unit'",
    "test:bdd:integration": "cucumber-js --tags '@integration'",
    "test:bdd:e2e": "cucumber-js --tags '@e2e'",
    "test:coverage": "nyc cucumber-js",
    "test:report": "cucumber-js --format html:reports/cucumber-report.html"
  }
}
```

### 7.3 BDD Coverage Reports

```bash
# Run all BDD scenarios with coverage
npm run test:coverage

# Generate BDD scenario report
npm run test:report

# View scenario coverage
open reports/cucumber-report.html

# Run specific scenario types
npm run test:bdd:unit     # Unit behavior scenarios
npm run test:bdd:integration  # Integration scenarios
npm run test:bdd:e2e      # End-to-end scenarios
```

### 7.4 Feature Coverage Tracking

```gherkin
# Tag scenarios for coverage tracking
@unit @user-service
Feature: User Service Behaviors

@integration @api
Feature: User API Endpoints

@e2e @user-journey
Feature: Complete User Registration Flow
```

## 8. BDD in CI/CD Pipeline

### 8.1 Recent BDD CI/CD Improvements

**Cucumber Integration Enhancement**:

- Updated to use scenario-based reporting for improved CI reliability
- Enhanced error resilience in BDD scenario execution pipeline
- Comprehensive BDD validation with 24+ scenarios for CI configuration
- Improved error handling and pipeline stability

### 8.2 GitHub Actions BDD Configuration

```yaml
# .github/workflows/bdd-test.yml
name: BDD Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  bdd-test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: mking_frnd_test
        options: >-
          --health-cmd pg_isready --health-interval 10s --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping" --health-interval 10s --health-timeout
          5s --health-retries 5
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

      - name: Run Unit BDD Scenarios
        run: npm run test:bdd:unit
        env:
          NODE_ENV: test

      - name: Run Integration BDD Scenarios
        run: npm run test:bdd:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/mking_frnd_test
          REDIS_URL: redis://localhost:6379
          NODE_ENV: test

      - name: Run E2E BDD Scenarios
        run: npm run test:bdd:e2e
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/mking_frnd_test
          NODE_ENV: test

      - name: Generate BDD Coverage Report
        run: npm run test:coverage
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/mking_frnd_test

      - name: Upload BDD Reports
        uses: actions/upload-artifact@v3
        with:
          name: bdd-reports
          path: |
            reports/cucumber-report.html
            reports/cucumber-report.json
            coverage/

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          flags: bdd-scenarios
          fail_ci_if_error: false
```

## 9. Common BDD Issues and Solutions

### 9.1 Slow Scenario Execution

```gherkin
# Problem: Scenarios running slowly due to real external dependencies
# Solution: Use appropriate test doubles and parallel execution

# Before (slow scenario)
Scenario: Send welcome email
  Given the real email service is configured
  When a user registers with email "test@example.com"
  Then a welcome email should be sent via the real email provider
  # This makes actual API calls - slow and unreliable

# After (fast scenario)
Scenario: Send welcome email
  Given the email service is available
  When a user registers with email "test@example.com"
  Then a welcome email should be sent to "test@example.com"
  And the email should contain welcome content
  # Uses mocked email service - fast and reliable
```

```typescript
// Step definition with proper mocking
Given('the email service is available', function () {
  this.mockMailer = createMockMailer(); // Fast mock instead of real service
  this.emailService = new EmailService(this.mockMailer);
});
```

### 9.2 Scenario Interference

```gherkin
# Problem: Scenarios affecting each other's state
# Solution: Proper cleanup and isolation using Background

Feature: User Management
  Background:
    Given the system is in a clean state
    And all previous test data is cleared

  Scenario: Create first user
    When I create a user with email "first@example.com"
    Then the user should be created successfully

  Scenario: Create second user
    When I create a user with email "second@example.com"
    Then the user should be created successfully
    # This scenario is isolated from the first one
```

```typescript
// Step definitions with proper cleanup
import { Before } from '@cucumber/cucumber';

Before(async function () {
  // Clean state before each scenario
  await testPrisma.user.deleteMany();
  jest.clearAllMocks();
  this.testData = {}; // Reset scenario context
});

Given('the system is in a clean state', function () {
  expect(this.testData).toEqual({});
});
```

### 9.3 Over-specification in Scenarios

```gherkin
# Problem: Too much implementation detail in scenarios
# Solution: Focus on behavior, not implementation

# Over-specified (bad)
Scenario: User registration with password hashing
  Given I have a bcrypt service with salt rounds 12
  When I register with password "plaintext123"
  Then the password should be hashed using bcrypt
  And the salt rounds should be 12
  And the hash should start with "$2b$12$"

# Better (focuses on behavior)
Scenario: User registration with secure password
  Given I want to register a new account
  When I provide a valid password
  Then my password should be stored securely
  And I should be able to login with the same password
```

### 9.4 Unclear Scenario Language

```gherkin
# Problem: Technical jargon in scenarios
# Solution: Use business language that stakeholders understand

# Technical (bad)
Scenario: JWT token validation
  Given a JWT token with expired timestamp
  When the authentication middleware processes the request
  Then a 401 status code should be returned

# Business-focused (better)
Scenario: Access denied for expired session
  Given my login session has expired
  When I try to access my account dashboard
  Then I should be asked to log in again
  And I should see a message about session expiry
```

## 10. BDD Checklist

### 10.1 Pre-development Checklist

- [ ] Understand user stories and acceptance criteria
- [ ] Write Gherkin scenarios in business language
- [ ] Review scenarios with stakeholders
- [ ] Set up BDD test environment
- [ ] Prepare test data and fixtures

### 10.2 During Development Checklist

- [ ] Write failing scenario first
- [ ] Implement step definitions
- [ ] Write minimal code to make scenario pass
- [ ] Refactor to improve code quality
- [ ] Ensure all scenarios pass
- [ ] Verify scenarios read like documentation

### 10.3 Post-completion Checklist

- [ ] Scenario coverage meets targets
- [ ] All features have corresponding scenarios
- [ ] Code quality meets standards
- [ ] Living documentation updated
- [ ] BDD CI/CD pipeline passes
- [ ] Stakeholders can read and understand scenarios

### 10.4 BDD Review Checklist

- [ ] Scenarios use ubiquitous language
- [ ] Given-When-Then structure is clear
- [ ] Scenarios are independent and isolated
- [ ] Business value is clearly expressed
- [ ] Technical implementation details are hidden

## 11. BDD Tools and Dependencies

### 11.1 Required Dependencies

```json
{
  "devDependencies": {
    "@cucumber/cucumber": "^10.0.0",
    "@cucumber/pretty-formatter": "^1.0.0",
    "@playwright/test": "^1.40.0",
    "@testing-library/react": "^13.4.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.5.0",
    "ts-node": "^10.9.0",
    "nyc": "^15.1.0",
    "jest": "^29.7.0"
  }
}
```

### 11.2 Project Structure

```
src/
├── features/           # Gherkin feature files
│   ├── user-management.feature
│   ├── authentication.feature
│   └── email-notifications.feature
├── test/
│   ├── steps/          # Step definitions
│   │   ├── user-steps.ts
│   │   ├── auth-steps.ts
│   │   └── email-steps.ts
│   ├── support/        # Test utilities
│   │   ├── world.ts
│   │   ├── hooks.ts
│   │   └── test-data.ts
│   └── fixtures/       # Test data
└── components/         # Application code
```

### 11.3 Configuration Files

```typescript
// cucumber.config.js
module.exports = {
  default: {
    require: ['src/test/steps/**/*.ts', 'src/test/support/**/*.ts'],
    requireModule: ['ts-node/register'],
    format: ['progress-bar', 'html:reports/cucumber-report.html'],
    formatOptions: { snippetInterface: 'async-await' },
    publishQuiet: true,
  },
};
```

```typescript
// src/test/support/world.ts
import { setWorldConstructor, World } from '@cucumber/cucumber';
import { PrismaClient } from '@prisma/client';

export class CustomWorld extends World {
  public testPrisma: PrismaClient;
  public testData: any = {};
  public mockServices: any = {};

  constructor(options: any) {
    super(options);
    this.testPrisma = new PrismaClient({
      datasources: {
        db: { url: process.env.DATABASE_TEST_URL },
      },
    });
  }
}

setWorldConstructor(CustomWorld);
```

Following these BDD guidelines ensures code quality and maintainability for the
MKing Friend project while providing clear communication between stakeholders,
developers, and testers through living documentation that serves as both
specification and automated tests.
