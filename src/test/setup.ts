/**
 * Test setup file for Vitest
 * This file is executed before all test files
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

// Global test configuration
beforeAll(async () => {
  // Setup global test environment
  console.log('🧪 Setting up test environment...');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error';
  
  // Mock console methods in test environment
  if (process.env.VITEST_SILENT === 'true') {
    console.log = vi.fn();
    console.info = vi.fn();
    console.warn = vi.fn();
  }
});

afterAll(async () => {
  // Cleanup global test environment
  console.log('🧹 Cleaning up test environment...');
});

beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
  
  // Reset timers
  vi.useRealTimers();
});

afterEach(() => {
  // Cleanup after each test
  vi.restoreAllMocks();
});

// Global test utilities
global.testUtils = {
  /**
   * Create a mock function with TypeScript support
   */
  createMock: <T extends (...args: any[]) => any>(implementation?: T) => {
    return vi.fn(implementation);
  },
  
  /**
   * Wait for a specified amount of time
   */
  wait: (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  
  /**
   * Create a promise that resolves after a delay
   */
  delay: (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  
  /**
   * Generate a random string for testing
   */
  randomString: (length: number = 10): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },
  
  /**
   * Generate a random email for testing
   */
  randomEmail: (): string => {
    const username = global.testUtils.randomString(8).toLowerCase();
    const domain = global.testUtils.randomString(6).toLowerCase();
    return `${username}@${domain}.com`;
  },
  
  /**
   * Generate a random UUID v4 for testing
   */
  randomUUID: (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },
};

// Extend global types for test utilities
declare global {
  var testUtils: {
    createMock: <T extends (...args: any[]) => any>(implementation?: T) => ReturnType<typeof vi.fn>;
    wait: (ms: number) => Promise<void>;
    delay: (ms: number) => Promise<void>;
    randomString: (length?: number) => string;
    randomEmail: () => string;
    randomUUID: () => string;
  };
}

// Export for explicit imports
export { };