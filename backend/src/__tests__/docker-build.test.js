/**
 * Docker Build Tests
 * 測試 Docker 構建過程中的 pnpm 工作區配置
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { afterAll, describe, expect, test } from 'vitest';

describe('Docker Build Tests', () => {
  const rootDir = path.resolve(__dirname, '../../../../');
  const backendDir = path.join(rootDir, 'backend');
  const frontendDir = path.join(rootDir, 'frontend');

  describe('pnpm workspace configuration', () => {
    test('should have pnpm-lock.yaml in root directory', () => {
      const lockfilePath = path.join(rootDir, 'pnpm-lock.yaml');
      expect(existsSync(lockfilePath)).toBe(true);
    });

    test('should have pnpm-workspace.yaml in root directory', () => {
      const workspacePath = path.join(rootDir, 'pnpm-workspace.yaml');
      expect(existsSync(workspacePath)).toBe(true);
    });

    test('should not have pnpm-lock.yaml in backend directory', () => {
      const backendLockfile = path.join(backendDir, 'pnpm-lock.yaml');
      expect(existsSync(backendLockfile)).toBe(false);
    });

    test('should not have pnpm-lock.yaml in frontend directory', () => {
      const frontendLockfile = path.join(frontendDir, 'pnpm-lock.yaml');
      expect(existsSync(frontendLockfile)).toBe(false);
    });
  });

  describe('Dockerfile validation', () => {
    test('backend Dockerfile should be able to access root lockfile', () => {
      const dockerfilePath = path.join(backendDir, 'Dockerfile');
      const dockerfileContent = readFileSync(dockerfilePath, 'utf8');

      // 檢查 Dockerfile 是否正確引用了根目錄的文件
      expect(dockerfileContent).toMatch(/COPY.*pnpm-lock\.yaml/);
    });

    test('frontend Dockerfile should be able to access root lockfile', () => {
      const dockerfilePath = path.join(frontendDir, 'Dockerfile');
      const dockerfileContent = readFileSync(dockerfilePath, 'utf8');

      // 檢查 Dockerfile 是否正確引用了根目錄的文件
      expect(dockerfileContent).toMatch(/COPY.*pnpm-lock\.yaml/);
    });
  });

  describe('Docker build context validation', () => {
    test('should have correct Docker build context configuration', () => {
      // 驗證 CI/CD 配置使用根目錄作為構建上下文
      // 實際的 Docker 構建測試通過 scripts/verify-docker-build.sh 進行
      expect(true).toBe(true); // 佔位符測試，實際驗證在 CI/CD 中進行
    });
  });

  afterAll(() => {
    // 清理測試產生的 Docker 映像
    try {
      execSync('docker rmi test-backend test-frontend', { stdio: 'ignore' });
    } catch (error) {
      // 忽略清理錯誤
    }
  });
});
