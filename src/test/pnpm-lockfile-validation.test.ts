import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import * as yaml from 'js-yaml';

describe('PNPM Lockfile Validation - TDD Fix for dry-run Error', () => {
  const projectRoot = process.cwd();
  const ciWorkflowPath = join(projectRoot, '.github', 'workflows', 'ci.yml');
  
  beforeAll(() => {
    // Ensure we're in the correct project directory
    expect(existsSync(join(projectRoot, 'pnpm-lock.yaml')), 'pnpm-lock.yaml should exist').toBe(true);
    expect(existsSync(ciWorkflowPath), 'CI workflow should exist').toBe(true);
  });

  describe('CI Workflow Validation', () => {
    it('should not contain any invalid pnpm options like dry-run', () => {
      const ciContent = readFileSync(ciWorkflowPath, 'utf-8');
      
      // Check that CI doesn't use invalid options
      expect(ciContent).not.toMatch(/dry-run/);
      expect(ciContent).not.toMatch(/--dry-run/);
      
      // Ensure it uses correct pnpm commands
      expect(ciContent).toMatch(/--frozen-lockfile/);
    });

    it('should have proper lockfile validation step', () => {
      const ciContent = readFileSync(ciWorkflowPath, 'utf-8');
      
      // Check for lockfile validation step
      expect(ciContent).toMatch(/name:\s*Validate lockfile/);
      
      // Check for proper error handling
      expect(ciContent).toMatch(/Lockfile is out of sync/);
      expect(ciContent).toMatch(/pnpm install/);
    });

    it('should use correct pnpm version', () => {
      const ciContent = readFileSync(ciWorkflowPath, 'utf-8');
      
      // Extract pnpm version from CI
      const versionMatch = ciContent.match(/PNPM_VERSION:\s*['"]?([0-9.]+)['"]?/);
      expect(versionMatch, 'PNPM_VERSION should be defined in CI').toBeTruthy();
      
      if (versionMatch) {
        const ciPnpmVersion = versionMatch[1];
        expect(ciPnpmVersion).toMatch(/^[0-9]+\.[0-9]+\.[0-9]+$/);
        
        // Check that it's a reasonable version (8.x or higher)
        const majorVersion = parseInt(ciPnpmVersion.split('.')[0]);
        expect(majorVersion).toBeGreaterThanOrEqual(8);
      }
    });
  });

  describe('Lockfile Synchronization Tests', () => {
    it('should pass pnpm install --frozen-lockfile without errors', () => {
      try {
        const result = execSync('pnpm install --frozen-lockfile', {
          cwd: projectRoot,
          encoding: 'utf-8',
          stdio: 'pipe'
        });
        
        expect(result).toBeDefined();
        expect(result).toMatch(/Done|Already up to date|Lockfile is up to date/);
      } catch (error: any) {
        const errorMessage = error.stderr || error.stdout || error.message;
        
        // If there's an ERR_PNPM_OUTDATED_LOCKFILE error, provide helpful info
        if (errorMessage.includes('ERR_PNPM_OUTDATED_LOCKFILE')) {
          console.error('Lockfile synchronization error detected:');
          console.error(errorMessage);
          
          // Try to extract specific mismatch information
          const specifiersMatch = errorMessage.match(/specifiers in the lockfile \(([^)]+)\)/);
          const specsMatch = errorMessage.match(/don't match specs in package\.json \(([^)]+)\)/);
          
          if (specifiersMatch && specsMatch) {
            console.error('Lockfile specifiers:', specifiersMatch[1]);
            console.error('Package.json specs:', specsMatch[1]);
          }
          
          throw new Error(`Lockfile is out of sync. Run 'pnpm install' to fix: ${errorMessage}`);
        }
        
        // Check if the error mentions 'dry-run' which shouldn't exist
        if (errorMessage.includes('dry-run')) {
          throw new Error(`Invalid 'dry-run' option detected. This option doesn't exist in pnpm: ${errorMessage}`);
        }
        
        throw new Error(`Unexpected error during lockfile validation: ${errorMessage}`);
      }
    });

    it('should have consistent workspace dependencies', () => {
      const rootPackageJsonPath = join(projectRoot, 'package.json');
      const backendPackageJsonPath = join(projectRoot, 'backend', 'package.json');
      const frontendPackageJsonPath = join(projectRoot, 'frontend', 'package.json');
      
      expect(existsSync(rootPackageJsonPath)).toBe(true);
      expect(existsSync(backendPackageJsonPath)).toBe(true);
      expect(existsSync(frontendPackageJsonPath)).toBe(true);
      
      const rootPackageJson = JSON.parse(readFileSync(rootPackageJsonPath, 'utf-8'));
      const backendPackageJson = JSON.parse(readFileSync(backendPackageJsonPath, 'utf-8'));
      const frontendPackageJson = JSON.parse(readFileSync(frontendPackageJsonPath, 'utf-8'));
      
      // Check workspace configuration
      expect(rootPackageJson.workspaces).toBeDefined();
      expect(rootPackageJson.workspaces).toEqual(
        expect.arrayContaining(['backend', 'frontend'])
      );
      
      // Validate package names
      expect(backendPackageJson.name).toBe('@mking-frnd/backend');
      expect(frontendPackageJson.name).toBe('@mking-frnd/frontend');
    });

    it('should have valid lockfile structure', () => {
      const lockfilePath = join(projectRoot, 'pnpm-lock.yaml');
      const lockfileContent = readFileSync(lockfilePath, 'utf-8');
      const lockfile = yaml.load(lockfileContent) as any;
      
      expect(lockfile).toBeDefined();
      expect(lockfile.lockfileVersion).toBeDefined();
      expect(lockfile.importers).toBeDefined();
      
      // Check that all workspace projects are in the lockfile
      expect(lockfile.importers).toHaveProperty('.');
      expect(lockfile.importers).toHaveProperty('backend');
      expect(lockfile.importers).toHaveProperty('frontend');
    });
  });

  describe('Error Prevention Tests', () => {
    it('should not have any scripts using invalid pnpm options', () => {
      const packageJsonFiles = [
        join(projectRoot, 'package.json'),
        join(projectRoot, 'backend', 'package.json'),
        join(projectRoot, 'frontend', 'package.json')
      ];
      
      packageJsonFiles.forEach(filePath => {
        if (existsSync(filePath)) {
          const packageJson = JSON.parse(readFileSync(filePath, 'utf-8'));
          
          if (packageJson.scripts) {
            Object.entries(packageJson.scripts).forEach(([scriptName, scriptCommand]) => {
              expect(scriptCommand as string).not.toMatch(/dry-run/);
              expect(scriptCommand as string).not.toMatch(/--dry-run/);
            });
          }
        }
      });
    });

    it('should validate CI environment matches local environment', () => {
      // Get local pnpm version
      const localPnpmVersion = execSync('pnpm --version', { encoding: 'utf-8' }).trim();
      
      // Get CI pnpm version
      const ciContent = readFileSync(ciWorkflowPath, 'utf-8');
      const ciVersionMatch = ciContent.match(/PNPM_VERSION:\s*['"]?([0-9.]+)['"]?/);
      
      expect(ciVersionMatch, 'CI should define PNPM_VERSION').toBeTruthy();
      
      if (ciVersionMatch) {
        const ciPnpmVersion = ciVersionMatch[1];
        
        // Versions should be compatible (same major.minor)
        const localMajorMinor = localPnpmVersion.split('.').slice(0, 2).join('.');
        const ciMajorMinor = ciPnpmVersion.split('.').slice(0, 2).join('.');
        
        expect(localMajorMinor).toBe(ciMajorMinor);
      }
    });
  });
});