import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const PROJECT_ROOT = join(__dirname, '../..');
const FRONTEND_DIR = join(PROJECT_ROOT, 'frontend');
const DOCKERFILE_PATH = join(FRONTEND_DIR, 'Dockerfile');
const ROOT_PACKAGE_JSON_PATH = join(PROJECT_ROOT, 'package.json');
const FRONTEND_PACKAGE_JSON_PATH = join(FRONTEND_DIR, 'package.json');

describe('Frontend Dockerfile TDD Tests', () => {
  let dockerfileContent: string;
  let rootPackageJson: any;
  let frontendPackageJson: any;

  beforeAll(() => {
    // Read Dockerfile content
    if (existsSync(DOCKERFILE_PATH)) {
      dockerfileContent = readFileSync(DOCKERFILE_PATH, 'utf-8');
    } else {
      throw new Error(`Dockerfile not found at ${DOCKERFILE_PATH}`);
    }

    // Read package.json files
    if (existsSync(ROOT_PACKAGE_JSON_PATH)) {
      rootPackageJson = JSON.parse(readFileSync(ROOT_PACKAGE_JSON_PATH, 'utf-8'));
    }
    
    if (existsSync(FRONTEND_PACKAGE_JSON_PATH)) {
      frontendPackageJson = JSON.parse(readFileSync(FRONTEND_PACKAGE_JSON_PATH, 'utf-8'));
    }
  });

  describe('Package.json Configuration', () => {
    it('should have packageManager field in root package.json', () => {
      expect(rootPackageJson).toHaveProperty('packageManager');
      expect(rootPackageJson.packageManager).toMatch(/^pnpm@\d+\.\d+\.\d+$/);
    });

    it('should have engines.pnpm field in root package.json', () => {
      expect(rootPackageJson).toHaveProperty('engines');
      expect(rootPackageJson.engines).toHaveProperty('pnpm');
      expect(rootPackageJson.engines.pnpm).toMatch(/>=\d+\.\d+\.\d+/);
    });

    it('should extract consistent pnpm version from packageManager', () => {
      const packageManagerVersion = rootPackageJson.packageManager.match(/pnpm@(\d+\.\d+\.\d+)/)?.[1];
      expect(packageManagerVersion).toBeDefined();
      expect(packageManagerVersion).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });

  describe('Dockerfile Pnpm Version Consistency', () => {
    it('should use corepack prepare with specific pnpm version', () => {
      const packageManagerVersion = rootPackageJson.packageManager.match(/pnpm@(\d+\.\d+\.\d+)/)?.[1];
      expect(dockerfileContent).toContain(`corepack prepare pnpm@${packageManagerVersion} --activate`);
    });

    it('should not use npm install -g pnpm in base stages', () => {
      const baseStageMatch = dockerfileContent.match(/FROM node:.*AS base([\s\S]*?)(?=FROM|$)/i);
      if (baseStageMatch) {
        const baseStageContent = baseStageMatch[1];
        expect(baseStageContent).not.toContain('npm install -g pnpm');
      }
    });

    it('should have consistent pnpm version across all stages', () => {
      const packageManagerVersion = rootPackageJson.packageManager.match(/pnpm@(\d+\.\d+\.\d+)/)?.[1];
      const corepackPrepareMatches = dockerfileContent.match(/corepack prepare pnpm@([\d\.]+)/g);
      
      if (corepackPrepareMatches) {
        corepackPrepareMatches.forEach(match => {
          const version = match.match(/pnpm@([\d\.]+)/)?.[1];
          expect(version).toBe(packageManagerVersion);
        });
      }
    });

    it('should set PNPM_HOME environment variable', () => {
      expect(dockerfileContent).toContain('ENV PNPM_HOME="/root/.local/share/pnpm"');
    });

    it('should update PATH to include PNPM_HOME', () => {
      expect(dockerfileContent).toContain('ENV PATH="$PNPM_HOME:$PATH"');
    });
  });

  describe('Docker Build Verification', () => {
    it('should have proper multi-stage build structure', () => {
      expect(dockerfileContent).toContain('FROM node:18-alpine AS base');
      expect(dockerfileContent).toContain('FROM base AS development');
      expect(dockerfileContent).toContain('FROM base AS build');
      expect(dockerfileContent).toContain('FROM nginx:alpine AS production');
    });

    it('should use corepack enable before prepare', () => {
      const corepackEnableIndex = dockerfileContent.indexOf('corepack enable');
      const corepackPrepareIndex = dockerfileContent.indexOf('corepack prepare');
      
      if (corepackEnableIndex !== -1 && corepackPrepareIndex !== -1) {
        expect(corepackEnableIndex).toBeLessThan(corepackPrepareIndex);
      }
    });

    it('should use frozen-lockfile for reproducible builds', () => {
      expect(dockerfileContent).toContain('--frozen-lockfile');
    });
  });

  describe('Security Best Practices', () => {
    it('should not run as root in production stage', () => {
      const productionStageMatch = dockerfileContent.match(/FROM nginx:alpine AS production([\s\S]*?)$/i);
      if (productionStageMatch) {
        const productionStageContent = productionStageMatch[1];
        expect(productionStageContent).toContain('USER frontend');
      }
    });

    it('should use alpine base images for smaller attack surface', () => {
      expect(dockerfileContent).toContain('node:18-alpine');
      expect(dockerfileContent).toContain('nginx:alpine');
    });

    it('should include health check', () => {
      expect(dockerfileContent).toContain('HEALTHCHECK');
    });

    it('should create non-root user', () => {
      expect(dockerfileContent).toContain('adduser -S frontend');
      expect(dockerfileContent).toContain('addgroup -g 1001 -S nodejs');
    });
  });
});