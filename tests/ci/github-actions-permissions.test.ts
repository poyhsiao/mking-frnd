import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as yaml from 'js-yaml';

/**
 * Test suite for GitHub Actions CI workflow permissions
 * 
 * This test ensures that the CI workflow has proper permissions
 * to push Docker images to GitHub Container Registry (GHCR)
 * 
 * The error "denied: installation not allowed to Create organization package"
 * occurs when the workflow lacks the 'packages: write' permission.
 */
describe('GitHub Actions CI Permissions', () => {
  const ciFilePath = join(process.cwd(), '.github/workflows/ci.yml');
  let ciConfig: any;

  beforeAll(() => {
    const ciContent = readFileSync(ciFilePath, 'utf8');
    ciConfig = yaml.load(ciContent);
  });

  describe('Build job permissions', () => {
    it('should have a build job defined', () => {
      expect(ciConfig.jobs).toBeDefined();
      expect(ciConfig.jobs.build).toBeDefined();
    });

    it('should have permissions section in build job', () => {
      expect(ciConfig.jobs.build.permissions).toBeDefined();
      expect(typeof ciConfig.jobs.build.permissions).toBe('object');
    });

    it('should have packages write permission for GHCR push', () => {
      expect(ciConfig.jobs.build.permissions.packages).toBe('write');
    });

    it('should have contents read permission for checkout', () => {
      expect(ciConfig.jobs.build.permissions.contents).toBe('read');
    });

    it('should have id-token write permission for OIDC', () => {
      expect(ciConfig.jobs.build.permissions['id-token']).toBe('write');
    });
  });

  describe('Docker login configuration', () => {
    it('should use GITHUB_TOKEN for GHCR authentication', () => {
      const buildSteps = ciConfig.jobs.build.steps;
      const loginStep = buildSteps.find((step: any) => 
        step.name?.includes('Log in to Container Registry') ||
        step.uses?.includes('docker/login-action')
      );
      
      expect(loginStep).toBeDefined();
      expect(loginStep.with?.registry).toBe('ghcr.io');
      expect(loginStep.with?.username).toBe('${{ github.actor }}');
      expect(loginStep.with?.password).toBe('${{ secrets.GITHUB_TOKEN }}');
    });
  });

  describe('Image naming convention', () => {
    it('should use correct GHCR image naming format', () => {
      const buildSteps = ciConfig.jobs.build.steps;
      const buildPushSteps = buildSteps.filter((step: any) => 
        step.uses?.includes('docker/build-push-action')
      );
      
      expect(buildPushSteps.length).toBeGreaterThan(0);
      
      buildPushSteps.forEach((step: any) => {
        const tags = step.with?.tags;
        if (typeof tags === 'string') {
          expect(tags).toMatch(/^ghcr\.io\/[^/]+\/[^/]+/);
        } else if (Array.isArray(tags)) {
          tags.forEach((tag: string) => {
            expect(tag).toMatch(/^ghcr\.io\/[^/]+\/[^/]+/);
          });
        }
      });
    });
  });

  describe('Registry configuration', () => {
    it('should have REGISTRY environment variable set to ghcr.io', () => {
      expect(ciConfig.env?.REGISTRY).toBe('ghcr.io');
    });

    it('should have IMAGE_NAME environment variable properly configured', () => {
      expect(ciConfig.env?.IMAGE_NAME).toBeDefined();
      // Should reference the repository name
      expect(ciConfig.env.IMAGE_NAME).toMatch(/github\.repository/);
    });
  });

  describe('Workflow triggers', () => {
    it('should trigger on push to main branch', () => {
      expect(ciConfig.on?.push?.branches).toContain('main');
    });

    it('should trigger on pull requests', () => {
      expect(ciConfig.on?.pull_request).toBeDefined();
    });
  });
});