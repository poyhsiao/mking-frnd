/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Vitest configuration for CI/CD environments
 * Optimized for GitHub Actions and other CI systems
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    // Global test settings
    globals: true,
    environment: 'jsdom',
    
    // Setup files
    setupFiles: ['./src/test/setup.ts'],
    
    // CSS handling
    css: true,
    
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
        '**/build/**',
        'src/main.tsx',
        'src/vite-env.d.ts'
      ],
      thresholds: {
        global: {
          branches: 75,
          functions: 75,
          lines: 75,
          statements: 75
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
      'src/**/*.{test,spec}.{js,ts,jsx,tsx}'
    ],
    exclude: [
      'node_modules/',
      'dist/',
      'build/',
      '**/*.d.ts'
    ],
    
    // Mock configuration for CI stability
    deps: {
      inline: [
        '@testing-library/react',
        '@testing-library/jest-dom'
      ]
    }
  }
});