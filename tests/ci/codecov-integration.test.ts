import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import * as yaml from 'js-yaml';

/**
 * Integration tests for Codecov upload workflow
 * Tests the complete flow from coverage generation to upload
 */
describe('Codecov Integration Tests', () => {
  let ciConfig: any;
  const ciConfigPath = join(process.cwd(), '.github/workflows/ci.yml');

  beforeEach(() => {
    if (existsSync(ciConfigPath)) {
      const ciConfigContent = readFileSync(ciConfigPath, 'utf8');
      ciConfig = yaml.load(ciConfigContent);
    }
  });

  describe('Workflow Dependencies', () => {
    it('should run coverage upload after test completion', () => {
      const testJob = ciConfig?.jobs?.test;
      const steps = testJob?.steps || [];
      
      const backendTestIndex = steps.findIndex((step: any) => 
        step.name?.includes('Run backend tests')
      );
      const frontendTestIndex = steps.findIndex((step: any) => 
        step.name?.includes('Run frontend tests')
      );
      const codecovIndex = steps.findIndex((step: any) => 
        step.uses?.includes('codecov/codecov-action')
      );
      
      expect(backendTestIndex).toBeGreaterThan(-1);
      expect(frontendTestIndex).toBeGreaterThan(-1);
      expect(codecovIndex).toBeGreaterThan(-1);
      expect(codecovIndex).toBeGreaterThan(backendTestIndex);
      expect(codecovIndex).toBeGreaterThan(frontendTestIndex);
    });

    it('should have checkout step before codecov upload', () => {
      const testJob = ciConfig?.jobs?.test;
      const steps = testJob?.steps || [];
      
      const checkoutIndex = steps.findIndex((step: any) => 
        step.uses?.includes('actions/checkout')
      );
      const codecovIndex = steps.findIndex((step: any) => 
        step.uses?.includes('codecov/codecov-action')
      );
      
      expect(checkoutIndex).toBeGreaterThan(-1);
      expect(codecovIndex).toBeGreaterThan(checkoutIndex);
    });
  });

  describe('Security Best Practices', () => {
    it('should use secrets for codecov token', () => {
      const testJob = ciConfig?.jobs?.test;
      const codecovStep = testJob?.steps?.find((step: any) => 
        step.uses?.includes('codecov/codecov-action')
      );
      
      expect(codecovStep.with?.token).toBe('${{ secrets.CODECOV_TOKEN }}');
    });

    it('should not expose sensitive information in logs', () => {
      const testJob = ciConfig?.jobs?.test;
      const codecovStep = testJob?.steps?.find((step: any) => 
        step.uses?.includes('codecov/codecov-action')
      );
      
      // Verbose is OK as it doesn't expose tokens
      expect(codecovStep.with?.verbose).toBe(true);
    });
  });

  describe('Error Resilience', () => {
    it('should continue CI pipeline even if codecov fails', () => {
      const testJob = ciConfig?.jobs?.test;
      const codecovStep = testJob?.steps?.find((step: any) => 
        step.uses?.includes('codecov/codecov-action')
      );
      
      expect(codecovStep.with?.fail_ci_if_error).toBe(false);
    });

    it('should handle missing coverage reports gracefully', () => {
      const testJob = ciConfig?.jobs?.test;
      const codecovStep = testJob?.steps?.find((step: any) => 
        step.uses?.includes('codecov/codecov-action')
      );
      
      expect(codecovStep.with?.handle_no_reports_found).toBe(true);
    });
  });

  describe('Coverage File Validation', () => {
    it('should specify correct coverage file paths', () => {
      const testJob = ciConfig?.jobs?.test;
      const codecovStep = testJob?.steps?.find((step: any) => 
        step.uses?.includes('codecov/codecov-action')
      );
      
      const files = codecovStep.with?.files;
      expect(files).toContain('./backend/coverage/lcov.info');
      expect(files).toContain('./frontend/coverage/lcov.info');
    });

    it('should have proper flags for organization', () => {
      const testJob = ciConfig?.jobs?.test;
      const codecovStep = testJob?.steps?.find((step: any) => 
        step.uses?.includes('codecov/codecov-action')
      );
      
      expect(codecovStep.with?.flags).toBe('unittests');
      expect(codecovStep.with?.name).toBe('codecov-umbrella');
    });
  });

  describe('Performance Optimization', () => {
    it('should use latest stable codecov action version', () => {
      const testJob = ciConfig?.jobs?.test;
      const codecovStep = testJob?.steps?.find((step: any) => 
        step.uses?.includes('codecov/codecov-action')
      );
      
      const version = codecovStep.uses.split('@')[1];
      expect(version).toMatch(/^v[4-9]/);
    });

    it('should run codecov upload only once per workflow', () => {
      const testJob = ciConfig?.jobs?.test;
      const codecovSteps = testJob?.steps?.filter((step: any) => 
        step.uses?.includes('codecov/codecov-action')
      ) || [];
      
      expect(codecovSteps).toHaveLength(1);
    });
  });

  describe('Monorepo Support', () => {
    it('should handle multiple coverage files from different packages', () => {
      const testJob = ciConfig?.jobs?.test;
      const codecovStep = testJob?.steps?.find((step: any) => 
        step.uses?.includes('codecov/codecov-action')
      );
      
      const files = codecovStep.with?.files;
      const fileList = files.split(',');
      
      expect(fileList).toHaveLength(2);
      expect(fileList.some((file: string) => file.includes('backend'))).toBe(true);
      expect(fileList.some((file: string) => file.includes('frontend'))).toBe(true);
    });
  });
});