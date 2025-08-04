import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    // Test environment
    environment: 'node',
    
    // Global test setup
    globals: true,

    // Include/exclude patterns
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: [
      '**/node_modules/**',
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '.git/**'
    ],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'dist/**',
        'build/**',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/test/**',
        '**/__tests__/**',
        '**/*.test.{js,ts}',
        '**/*.spec.{js,ts}',
        'coverage/**'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    
    // Test file patterns
    include: [
      '**/*.{test,spec}.{js,ts}',
      '**/test/**/*.{js,ts}',
      '**/tests/**/*.{js,ts}',
    ],
    
    // Exclude patterns
    exclude: [
      'node_modules/',
      'dist/',
      'build/',
      'coverage/',
      'docker-volumes/',
      'tmp/',
      'test-results/',
    ],
    
    // Test timeout
    testTimeout: 10000,
    
    // Hook timeout
    hookTimeout: 10000,
    
    // Teardown timeout
    teardownTimeout: 10000,
    
    // Watch mode
    watch: false,
    
    // Reporter
    reporter: ['verbose'],
    
    // Setup files
    setupFiles: [
      './src/test/setup.ts',
    ],
    
    // Pool options
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 1,
      },
    },
    
    // Retry failed tests
    retry: 2,
    
    // Bail on first failure in CI
    bail: process.env.CI ? 1 : 0,
    
    // Silent mode
    silent: false,
    

  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@backend': resolve(__dirname, './backend/src'),
      '@frontend': resolve(__dirname, './frontend/src'),
      '@shared': resolve(__dirname, './packages/shared'),
      '@common': resolve(__dirname, './src/common'),
      '@test': resolve(__dirname, './src/test'),
    },
  },
  
  // Define configuration
  define: {
    __TEST__: true,
  },
  
  // Esbuild options
  esbuild: {
    target: 'node18',
  },
});