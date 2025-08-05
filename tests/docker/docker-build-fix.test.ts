import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

/**
 * TDD Test Suite for Docker Build Fix
 * 
 * This test suite follows TDD methodology to fix the `/app/dist: not found` error
 * in GitHub Actions Docker builds.
 * 
 * Issue: Docker build fails because:
 * 1. pnpm build command runs from workspace root but doesn't filter to specific packages
 * 2. COPY commands expect /app/dist but actual output is in /app/backend/dist and /app/frontend/dist
 * 3. Build context and workspace configuration mismatch
 */
describe('Docker Build Fix - TDD Approach', () => {
  const projectRoot = path.resolve(__dirname, '../..');
  const backendTestImage = 'mking-frnd-backend-build-test';
  const frontendTestImage = 'mking-frnd-frontend-build-test';

  beforeAll(() => {
    // Test setup - no need to change directory in workers
  });

  afterAll(() => {
    // Clean up test images
    try {
      execSync(`docker rmi ${backendTestImage} ${frontendTestImage}`, { stdio: 'ignore' });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Verify the fix (Passing tests)', () => {
    it('should successfully build backend Docker image', () => {
      // This test should pass after the fix
      expect(() => {
        execSync(
          `docker build -f backend/Dockerfile --target build -t ${backendTestImage}-build .`,
          {
            cwd: projectRoot,
            stdio: 'pipe',
            timeout: 300000,
          }
        );
      }).not.toThrow(); // This should pass after fix
    });

    it('should successfully build frontend Docker image', () => {
      // This test should pass after the fix
      expect(() => {
        execSync(
          `docker build -f frontend/Dockerfile --target build -t ${frontendTestImage}-build .`,
          {
            cwd: projectRoot,
            stdio: 'pipe',
            timeout: 300000,
          }
        );
      }).not.toThrow(); // This should pass after fix
    });
  });

  describe('Verify workspace structure', () => {
    it('should have correct pnpm workspace configuration', () => {
      const workspaceFile = path.join(projectRoot, 'pnpm-workspace.yaml');
      expect(existsSync(workspaceFile)).toBe(true);
    });

    it('should have backend package.json with correct build script', () => {
      const backendPackageJson = path.join(projectRoot, 'backend/package.json');
      expect(existsSync(backendPackageJson)).toBe(true);
      
      const packageContent = require(backendPackageJson);
      expect(packageContent.scripts.build).toBe('tsc');
    });

    it('should have frontend package.json with correct build script', () => {
      const frontendPackageJson = path.join(projectRoot, 'frontend/package.json');
      expect(existsSync(frontendPackageJson)).toBe(true);
      
      const packageContent = require(frontendPackageJson);
      expect(packageContent.scripts.build).toBe('tsc && vite build');
    });
  });

  describe('After fix - these tests should pass', () => {
    it('should successfully build backend Docker image with correct dist location', () => {
      // This test will pass after we fix the Dockerfile
      expect(() => {
        execSync(
          `docker build -f backend/Dockerfile --target production -t ${backendTestImage} .`,
          {
            cwd: projectRoot,
            stdio: 'pipe',
            timeout: 300000,
          }
        );
      }).not.toThrow();
    });

    it('should successfully build frontend Docker image with correct dist location', () => {
      // This test will pass after we fix the Dockerfile
      expect(() => {
        execSync(
          `docker build -f frontend/Dockerfile --target production -t ${frontendTestImage} .`,
          {
            cwd: projectRoot,
            stdio: 'pipe',
            timeout: 300000,
          }
        );
      }).not.toThrow();
    });

    it('should have correct dist directory structure in backend image', () => {
      // Verify the built backend image has the correct structure
      const output = execSync(
        `docker run --rm ${backendTestImage} ls -la /app/dist`,
        { encoding: 'utf8' }
      );
      expect(output).toContain('index.js');
    });

    it('should have correct dist directory structure in frontend image', () => {
      // Verify the built frontend image has the correct structure
      const output = execSync(
        `docker run --rm ${frontendTestImage} ls -la /usr/share/nginx/html`,
        { encoding: 'utf8' }
      );
      expect(output).toContain('index.html');
    });
  });
});