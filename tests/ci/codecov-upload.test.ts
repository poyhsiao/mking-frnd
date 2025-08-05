import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import * as yaml from 'js-yaml';

/**
 * Test suite for Codecov upload configuration in GitHub Actions
 * Following TDD principles to ensure proper codecov integration
 */
describe('Codecov Upload Configuration', () => {
  let ciConfig: any;
  const ciConfigPath = join(process.cwd(), '.github/workflows/ci.yml');

  beforeEach(() => {
    if (existsSync(ciConfigPath)) {
      const ciConfigContent = readFileSync(ciConfigPath, 'utf8');
      ciConfig = yaml.load(ciConfigContent);
    }
  });

  describe('CI Configuration File', () => {
    it('should exist', () => {
      expect(existsSync(ciConfigPath)).toBe(true);
    });

    it('should be valid YAML', () => {
      expect(ciConfig).toBeDefined();
      expect(typeof ciConfig).toBe('object');
    });
  });

  describe('Codecov Action Configuration', () => {
    let codecovStep: any;

    beforeEach(() => {
      const testJob = ciConfig?.jobs?.test;
      codecovStep = testJob?.steps?.find((step: any) => 
        step.name?.includes('Upload coverage') || 
        step.uses?.includes('codecov/codecov-action')
      );
    });

    it('should have codecov upload step', () => {
      expect(codecovStep).toBeDefined();
      expect(codecovStep.uses).toContain('codecov/codecov-action');
    });

    it('should use codecov-action v4 or higher', () => {
      const version = codecovStep.uses.split('@')[1];
      expect(version).toMatch(/^v[4-9]/);
    });

    it('should have proper token configuration', () => {
      expect(codecovStep.with?.token).toBe('${{ secrets.CODECOV_TOKEN }}');
    });

    it('should specify correct coverage files', () => {
      const files = codecovStep.with?.files;
      expect(files).toBeDefined();
      expect(files).toContain('./backend/coverage/lcov.info');
      expect(files).toContain('./frontend/coverage/lcov.info');
    });

    it('should have fail_ci_if_error set to false for better reliability', () => {
      // This test will initially fail, driving us to fix the configuration
      expect(codecovStep.with?.fail_ci_if_error).toBe(false);
    });

    it('should have verbose logging enabled', () => {
      expect(codecovStep.with?.verbose).toBe(true);
    });

    it('should run only after test completion', () => {
      const testJob = ciConfig?.jobs?.test;
      const stepIndex = testJob?.steps?.findIndex((step: any) => 
        step.uses?.includes('codecov/codecov-action')
      );
      const testStepIndex = testJob?.steps?.findIndex((step: any) => 
        step.name?.includes('Run backend tests') || step.name?.includes('Run frontend tests')
      );
      
      expect(stepIndex).toBeGreaterThan(testStepIndex);
    });
  });

  describe('Coverage File Generation', () => {
    it('should ensure backend generates lcov.info', () => {
      // This will be verified by checking vitest config
      const backendConfigPath = join(process.cwd(), 'backend/vitest.ci.config.ts');
      expect(existsSync(backendConfigPath)).toBe(true);
      
      const configContent = readFileSync(backendConfigPath, 'utf8');
      expect(configContent).toContain("'lcov'");
    });

    it('should ensure frontend generates lcov.info', () => {
      // This will be verified by checking vitest config
      const frontendConfigPath = join(process.cwd(), 'frontend/vitest.ci.config.ts');
      expect(existsSync(frontendConfigPath)).toBe(true);
      
      const configContent = readFileSync(frontendConfigPath, 'utf8');
      expect(configContent).toContain("'lcov'");
    });
  });

  describe('Error Handling', () => {
    let codecovStep: any;

    beforeEach(() => {
      const testJob = ciConfig?.jobs?.test;
      codecovStep = testJob?.steps?.find((step: any) => 
        step.name?.includes('Upload coverage') || 
        step.uses?.includes('codecov/codecov-action')
      );
    });

    it('should handle missing coverage files gracefully', () => {
      expect(codecovStep.with?.handle_no_reports_found).toBe(true);
    });

    it('should not fail CI on codecov upload errors', () => {
      // Critical: This prevents CI from failing due to codecov issues
      expect(codecovStep.with?.fail_ci_if_error).toBe(false);
    });
  });
});