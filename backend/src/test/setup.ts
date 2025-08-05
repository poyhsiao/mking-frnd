import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests

// Global test setup
beforeAll(() => {
  // Setup test database, Redis connections, etc.
  // console.log('🧪 Setting up test environment...');
});

// Global test teardown
afterAll(() => {
  // Cleanup test database, close connections, etc.
  // console.log('🧹 Cleaning up test environment...');
});

// Setup before each test
beforeEach(() => {
  // Reset database state, clear caches, etc.
});

// Cleanup after each test
afterEach(() => {
  // Cleanup any test data
});
