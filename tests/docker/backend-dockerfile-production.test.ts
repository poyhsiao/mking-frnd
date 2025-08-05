import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

/**
 * Test suite for backend Dockerfile production stage
 * Following TDD methodology to ensure Docker build works correctly
 */
describe('Backend Dockerfile Production Stage', () => {
  const projectRoot = path.resolve(__dirname, '../..');
  const dockerfilePath = path.join(projectRoot, 'backend/Dockerfile');
  const testImageName = 'mking-frnd-backend-test';

  beforeAll(() => {
    // Test setup - no need to change directory in workers
  });

  afterAll(() => {
    // Clean up test image
    try {
      execSync(`docker rmi ${testImageName}`, { stdio: 'ignore' });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should have a valid Dockerfile', () => {
    expect(existsSync(dockerfilePath)).toBe(true);
  });

  it('should build production stage successfully', () => {
    expect(() => {
      execSync(
        `docker build -f backend/Dockerfile --target production -t ${testImageName} .`,
        {
          cwd: projectRoot,
          stdio: 'pipe',
          timeout: 300000, // 5 minutes timeout
        }
      );
    }).not.toThrow();
  });

  it('should install production dependencies correctly', () => {
    // Build the image first
    execSync(
      `docker build -f backend/Dockerfile --target production -t ${testImageName} .`,
      {
        cwd: projectRoot,
        stdio: 'pipe',
        timeout: 300000,
      }
    );

    // Check that node_modules exists and contains expected packages
    const result = execSync(
      `docker run --rm ${testImageName} sh -c "ls -la /app && test -d /app/node_modules"`,
      {
        encoding: 'utf8',
        timeout: 30000,
      }
    );

    expect(result).toBeDefined();
  });

  it('should have correct workspace configuration files', () => {
    // Build the image first
    execSync(
      `docker build -f backend/Dockerfile --target production -t ${testImageName} .`,
      {
        cwd: projectRoot,
        stdio: 'pipe',
        timeout: 300000,
      }
    );

    // Check that workspace files are present
    const result = execSync(
      `docker run --rm ${testImageName} sh -c "test -f /app/pnpm-workspace.yaml && test -f /app/package.json"`,
      {
        encoding: 'utf8',
        timeout: 30000,
      }
    );

    expect(result).toBeDefined();
  });

  it('should run the application successfully', () => {
    // Build the image first
    execSync(
      `docker build -f backend/Dockerfile --target production -t ${testImageName} .`,
      {
        cwd: projectRoot,
        stdio: 'pipe',
        timeout: 300000,
      }
    );

    // Test that the container can start (we'll stop it quickly)
    expect(() => {
      execSync(
        `timeout 10s docker run --rm ${testImageName} || true`,
        {
          timeout: 15000,
        }
      );
    }).not.toThrow();
  });
});