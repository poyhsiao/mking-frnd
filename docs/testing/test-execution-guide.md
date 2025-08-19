# Test Execution Guide

This comprehensive guide covers all aspects of running tests in the mking-frnd
project, including setup, execution, troubleshooting, and best practices.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Test Types](#test-types)
- [Local Development Testing](#local-development-testing)
- [CI/CD Pipeline Testing](#cicd-pipeline-testing)
- [Docker-based Testing](#docker-based-testing)
- [Environment Configuration](#environment-configuration)
- [Troubleshooting](#troubleshooting)
- [Performance Considerations](#performance-considerations)
- [Best Practices](#best-practices)

## Overview

The mking-frnd project uses a comprehensive testing strategy that includes:

- **Unit Tests**: Fast, isolated tests for individual components
- **Integration Tests**: Tests for component interactions and API endpoints
- **End-to-End (E2E) Tests**: Full application workflow tests
- **Security Tests**: Vulnerability scanning and security validation
- **Performance Tests**: Load and stress testing

## Prerequisites

### Required Software

- **Node.js**: Version 20.x (specified in `.nvmrc`)
- **pnpm**: Version 9.x (package manager)
- **Docker**: Latest stable version
- **Docker Compose**: V2 (included with Docker Desktop)

### Environment Setup

```bash
# Install Node.js (using nvm)
nvm install 20
nvm use 20

# Install pnpm globally
npm install -g pnpm@9

# Install project dependencies
pnpm install

# Copy environment template
cp .env.example .env
```

## Test Types

### 1. Unit Tests

**Purpose**: Test individual functions, classes, and components in isolation.

**Backend Unit Tests**:

```bash
# Run all backend unit tests
cd backend
pnpm test:unit

# Run with coverage
pnpm test:coverage

# Run in watch mode
pnpm test:watch

# Run specific test file
pnpm test src/services/user.test.ts
```

**Frontend Unit Tests**:

```bash
# Run all frontend unit tests
cd frontend
pnpm test:unit

# Run with coverage
pnpm test:coverage

# Run in watch mode
pnpm test:watch

# Run specific component tests
pnpm test src/components/Button.test.tsx
```

### 2. Integration Tests

**Purpose**: Test API endpoints, database interactions, and service
integrations.

```bash
# Run backend integration tests
cd backend
pnpm test:integration

# Run API tests specifically
pnpm test:api

# Run with database reset
NODE_ENV=test pnpm test:integration
```

### 3. End-to-End Tests

**Purpose**: Test complete user workflows across the entire application.

```bash
# Run E2E tests
cd frontend
pnpm test:e2e

# Run E2E tests in headless mode
pnpm test:e2e:headless

# Run specific E2E test suite
pnpm test:e2e --spec "**/auth.cy.ts"
```

## Local Development Testing

### Quick Test Commands

```bash
# Run all tests (from project root)
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in CI mode (no watch)
pnpm test:ci
```

### Development Workflow

1. **Start development services**:

   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```

2. **Run tests in watch mode**:

   ```bash
   # Backend
   cd backend && pnpm test:watch

   # Frontend
   cd frontend && pnpm test:watch
   ```

3. **Run integration tests**:
   ```bash
   cd backend && pnpm test:integration
   ```

## CI/CD Pipeline Testing

### GitHub Actions Workflow

The CI pipeline runs three types of tests:

1. **Unit Tests**: Fast feedback on code changes
2. **Integration Tests**: Validate API and database interactions
3. **E2E Tests**: Ensure complete application functionality

### Pipeline Configuration

**Environment Variables Required**:

```yaml
POSTGRES_TEST_DB: mking_test
POSTGRES_TEST_USER: postgres
POSTGRES_TEST_PASSWORD: postgres
REDIS_TEST_PASSWORD: testpassword
MINIO_TEST_USER: testuser
MINIO_TEST_PASSWORD: testpassword
MINIO_TEST_BUCKET: test-bucket
TYPESENSE_TEST_API_KEY: test-api-key
JWT_TEST_SECRET: test-jwt-secret-key
JWT_TEST_EXPIRES_IN: 1h
ENCRYPTION_TEST_KEY: test-encryption-key
```

### Manual Pipeline Trigger

```bash
# Trigger CI pipeline manually
gh workflow run ci.yml

# Trigger with specific test type
gh workflow run ci.yml -f test-type=integration
```

## Docker-based Testing

### Full Test Suite with Docker

```bash
# Run all tests using Docker Compose
docker compose -f docker-compose.test.yml up --build --abort-on-container-exit

# Run specific test type
docker compose -f docker-compose.test.yml up --build unit-test
docker compose -f docker-compose.test.yml up --build integration-test
docker compose -f docker-compose.test.yml up --build e2e-test
```

### Test Services

**Available Services**:

- `postgres-test`: Test database
- `redis-test`: Test cache/session store
- `minio-test`: Test object storage
- `typesense-test`: Test search engine
- `backend-test`: Backend application for testing
- `unit-test`: Unit test runner
- `integration-test`: Integration test runner
- `e2e-test`: E2E test runner
- `test-results`: Test result collector

### Service Health Checks

All test services include comprehensive health checks:

```bash
# Check service health
docker compose -f docker-compose.test.yml ps

# View service logs
docker compose -f docker-compose.test.yml logs postgres-test
docker compose -f docker-compose.test.yml logs backend-test
```

## Environment Configuration

### Test Environment Variables

**Database Configuration**:

```bash
POSTGRES_TEST_DB=mking_test
POSTGRES_TEST_USER=postgres
POSTGRES_TEST_PASSWORD=postgres
POSTGRES_TEST_HOST=localhost
POSTGRES_TEST_PORT=5433
```

**Redis Configuration**:

```bash
REDIS_TEST_HOST=localhost
REDIS_TEST_PORT=6380
REDIS_TEST_PASSWORD=testpassword
```

**MinIO Configuration**:

```bash
MINIO_TEST_ENDPOINT=localhost:9001
MINIO_TEST_USER=testuser
MINIO_TEST_PASSWORD=testpassword
MINIO_TEST_BUCKET=test-bucket
```

**Typesense Configuration**:

```bash
TYPESENSE_TEST_HOST=localhost
TYPESENSE_TEST_PORT=8109
TYPESENSE_TEST_API_KEY=test-api-key
```

### Environment Isolation

Tests use isolated environments to prevent conflicts:

- **Unit Tests**: In-memory databases and mocks
- **Integration Tests**: Dedicated test database
- **E2E Tests**: Complete test environment

## Troubleshooting

### Common Issues

#### 1. Port Conflicts

**Problem**: Services fail to start due to port conflicts.

**Solution**:

```bash
# Check for port usage
lsof -i :5433  # PostgreSQL test port
lsof -i :6380  # Redis test port
lsof -i :9001  # MinIO test port

# Stop conflicting services
docker compose down
docker compose -f docker-compose.dev.yml down
```

#### 2. Database Connection Issues

**Problem**: Tests fail with database connection errors.

**Solution**:

```bash
# Reset test database
docker compose -f docker-compose.test.yml down -v
docker compose -f docker-compose.test.yml up -d postgres-test

# Wait for database to be ready
docker compose -f docker-compose.test.yml exec postgres-test pg_isready

# Run database migrations
cd backend && pnpm prisma migrate deploy
```

#### 3. Memory Issues

**Problem**: Tests fail due to insufficient memory.

**Solution**:

```bash
# Increase Docker memory limit (Docker Desktop)
# Settings > Resources > Memory > 8GB+

# Clean up Docker resources
docker system prune -f
docker volume prune -f
```

#### 4. Test Timeouts

**Problem**: Tests timeout in CI environment.

**Solution**:

```bash
# Increase test timeouts in vitest.config.ts
export default defineConfig({
  test: {
    testTimeout: 30000,  // 30 seconds
    hookTimeout: 30000,  // 30 seconds
  }
})
```

#### 5. Flaky Tests

**Problem**: Tests pass locally but fail in CI.

**Solution**:

- Add proper wait conditions
- Use deterministic test data
- Implement retry mechanisms
- Check for race conditions

### Debug Commands

```bash
# View detailed test output
pnpm test --reporter=verbose

# Run tests with debug logging
DEBUG=* pnpm test

# Check Docker container logs
docker compose -f docker-compose.test.yml logs --follow

# Inspect container state
docker compose -f docker-compose.test.yml ps --format json

# Check system resources
docker system df
docker stats
```

## Performance Considerations

### Test Execution Times

**Typical execution times**:

- Unit Tests: 30-60 seconds
- Integration Tests: 2-5 minutes
- E2E Tests: 5-15 minutes
- Full Test Suite: 10-25 minutes

### Optimization Strategies

1. **Parallel Execution**:

   ```bash
   # Run tests in parallel
   pnpm test --run --reporter=verbose --threads
   ```

2. **Test Sharding**:

   ```bash
   # Split tests across multiple runners
   pnpm test --shard=1/3
   pnpm test --shard=2/3
   pnpm test --shard=3/3
   ```

3. **Selective Testing**:

   ```bash
   # Run only changed files
   pnpm test --changed

   # Run specific test patterns
   pnpm test --testNamePattern="user"
   ```

## Best Practices

### Test Organization

1. **File Structure**:

   ```
   src/
   ├── components/
   │   ├── Button.tsx
   │   └── Button.test.tsx
   ├── services/
   │   ├── userService.ts
   │   └── userService.test.ts
   └── __tests__/
       ├── integration/
       └── e2e/
   ```

2. **Naming Conventions**:
   - Unit tests: `*.test.ts` or `*.spec.ts`
   - Integration tests: `*.integration.test.ts`
   - E2E tests: `*.e2e.test.ts` or `*.cy.ts`

### Test Writing Guidelines

1. **AAA Pattern** (Arrange, Act, Assert):

   ```typescript
   test('should create user successfully', async () => {
     // Arrange
     const userData = { name: 'John', email: 'john@example.com' };

     // Act
     const user = await createUser(userData);

     // Assert
     expect(user.id).toBeDefined();
     expect(user.name).toBe('John');
   });
   ```

2. **Test Isolation**:

   ```typescript
   beforeEach(async () => {
     await cleanupDatabase();
     await seedTestData();
   });
   ```

3. **Descriptive Test Names**:
   ```typescript
   describe('UserService', () => {
     describe('createUser', () => {
       test('should create user with valid data', () => {});
       test('should throw error when email is invalid', () => {});
       test('should hash password before saving', () => {});
     });
   });
   ```

### CI/CD Integration

1. **Fail Fast**: Run unit tests first, then integration, then E2E
2. **Parallel Execution**: Run different test types in parallel when possible
3. **Artifact Collection**: Save test results, coverage reports, and screenshots
4. **Notification**: Set up alerts for test failures

### Monitoring and Reporting

1. **Coverage Targets**:
   - Unit Tests: >90%
   - Integration Tests: >80%
   - Overall: >85%

2. **Test Reports**:
   - JUnit XML for CI integration
   - HTML reports for detailed analysis
   - Coverage reports in multiple formats

3. **Metrics Tracking**:
   - Test execution time trends
   - Flaky test identification
   - Coverage evolution over time

## Conclusion

This guide provides comprehensive coverage of testing in the mking-frnd project.
For additional support:

- Check the [troubleshooting section](#troubleshooting) for common issues
- Review test logs for detailed error information
- Consult the project's GitHub Issues for known problems
- Reach out to the development team for assistance

Regular testing ensures code quality, prevents regressions, and maintains system
reliability. Follow these guidelines to maintain an effective testing strategy.
