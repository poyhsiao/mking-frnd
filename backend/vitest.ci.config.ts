/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Vitest configuration for CI/CD environments
 * Optimized for GitHub Actions and other CI systems
 */
export default defineConfig({
  test: {
    // Global test settings
    globals: true,
    environment: 'node',
    
    // Setup files
    setupFiles: ['./src/test/setup.ts'],
    
    // Coverage configuration for CI
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**',
        '**/build/**'
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
    
    // Timeouts for CI environment
    testTimeout: 30000,
    hookTimeout: 30000,
    
    // Reporter configuration
    reporter: process.env.CI ? ['verbose', 'junit'] : ['verbose'],
    outputFile: {
      junit: './test-results/junit.xml'
    },
    
    // Path aliases
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@test': path.resolve(__dirname, './src/test')
    },
    
    // Pool options for CI
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: process.env.CI === 'true'
      }
    },
    
    // Retry configuration for flaky tests
    retry: process.env.CI ? 2 : 0,
    
    // Watch mode disabled in CI
    watch: false,
    
    // Include/exclude patterns
    include: [
      'src/**/*.{test,spec}.{js,ts}',
      'src/__tests__/**/*.{js,ts}'
    ],
    exclude: [
      'node_modules/',
      'dist/',
      'build/',
      '**/*.d.ts'
    ]
  }
});