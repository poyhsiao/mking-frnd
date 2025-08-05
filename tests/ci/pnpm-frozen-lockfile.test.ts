import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('PNPM Frozen Lockfile CI Compatibility', () => {
  const projectRoot = process.cwd();

  it('should pass pnpm install --frozen-lockfile check', () => {
    // This test simulates the exact CI condition that's failing
    try {
      // Run the same command that CI uses
      const result = execSync('pnpm install --frozen-lockfile', {
        cwd: projectRoot,
        encoding: 'utf-8',
        stdio: 'pipe'
      });
      
      // If we get here, the command succeeded
      expect(result).toBeDefined();
      expect(result).toMatch(/Done|Already up to date/);
    } catch (error: any) {
      // If the command fails, we want to see the exact error
      const errorMessage = error.stderr || error.stdout || error.message || error.toString();
      
      // Check if it's the specific error we're trying to fix
      if (errorMessage.includes('ERR_PNPM_OUTDATED_LOCKFILE')) {
        // Extract the specific mismatch information
        const specifiersMatch = errorMessage.match(/specifiers in the lockfile \(([^)]+)\)/);
        const specsMatch = errorMessage.match(/don't match specs in package\.json \(([^)]+)\)/);
        
        if (specifiersMatch && specsMatch) {
          const lockfileSpecs = specifiersMatch[1];
          const packageJsonSpecs = specsMatch[1];
          
          console.log('Lockfile specifiers:', lockfileSpecs);
          console.log('Package.json specs:', packageJsonSpecs);
        }
        
        // Fail the test with detailed information
        throw new Error(`ERR_PNPM_OUTDATED_LOCKFILE detected: ${errorMessage}`);
      } else {
        // Some other error occurred
        throw new Error(`Unexpected error during frozen lockfile check: ${errorMessage}`);
      }
    }
  });

  it('should have all backend dependencies properly locked', () => {
    const backendPackageJsonPath = join(projectRoot, 'backend', 'package.json');
    const backendPackageJson = JSON.parse(readFileSync(backendPackageJsonPath, 'utf-8'));
    
    // Check that all dependencies are present
    const expectedDeps = {
      ...backendPackageJson.dependencies || {},
      ...backendPackageJson.devDependencies || {}
    };
    
    // Verify each dependency exists in the expected format
    Object.keys(expectedDeps).forEach(dep => {
      expect(expectedDeps[dep], `Dependency ${dep} should have a valid version specifier`)
        .toMatch(/^[\^~]?\d+\.\d+\.\d+/);
    });
  });

  it('should not have dependency version mismatches', () => {
    // This test checks for the specific issue mentioned in the error:
    // "specifiers in the lockfile don't match specs in package.json"
    
    try {
      // Use pnpm's built-in validation with a simple check
      const result = execSync('pnpm install --frozen-lockfile', {
        cwd: projectRoot,
        stdio: 'pipe',
        encoding: 'utf-8'
      });
      
      // If we reach here, validation passed
      expect(result).toMatch(/Done|Already up to date|Lockfile is up to date/);
    } catch (error: any) {
      const errorOutput = error.stderr?.toString() || error.stdout?.toString() || error.message;
      
      if (errorOutput.includes('ERR_PNPM_OUTDATED_LOCKFILE')) {
        // Parse the error to understand what's mismatched
        const lines = errorOutput.split('\n');
        const mismatchInfo = lines.find(line => line.includes('specifiers in the lockfile'));
        
        if (mismatchInfo) {
          console.error('Lockfile mismatch detected:', mismatchInfo);
        }
        
        throw new Error('Lockfile is outdated and needs to be regenerated');
      }
      
      throw error;
    }
  });

  it('should have consistent workspace configuration', () => {
    const rootPackageJsonPath = join(projectRoot, 'package.json');
    const rootPackageJson = JSON.parse(readFileSync(rootPackageJsonPath, 'utf-8'));
    
    // Check that workspace configuration is present
    expect(rootPackageJson.workspaces, 'Root package.json should define workspaces').toBeDefined();
    
    // Verify workspace paths
    const workspaces = rootPackageJson.workspaces;
    expect(workspaces, 'Workspaces should include backend and frontend').toEqual(
      expect.arrayContaining(['backend', 'frontend'])
    );
  });

  it('should have compatible pnpm version in CI', () => {
    const ciConfigPath = join(projectRoot, '.github', 'workflows', 'ci.yml');
    const ciConfig = readFileSync(ciConfigPath, 'utf-8');
    
    // Check that PNPM_VERSION is defined with proper format
    expect(ciConfig, 'CI should define PNPM_VERSION').toMatch(/PNPM_VERSION:\s*['"]?[0-9.]+['"]?/);
    
    // Extract the version
    const versionMatch = ciConfig.match(/PNPM_VERSION:\s*['"]?([0-9.]+)['"]?/);
    if (versionMatch) {
      const ciPnpmVersion = versionMatch[1];
      
      // Check backend package.json for packageManager field
      const backendPackageJsonPath = join(projectRoot, 'backend', 'package.json');
      const backendPackageJson = JSON.parse(readFileSync(backendPackageJsonPath, 'utf-8'));
      
      if (backendPackageJson.packageManager) {
        const packageManagerMatch = backendPackageJson.packageManager.match(/pnpm@([0-9.]+)/);
        if (packageManagerMatch) {
          const packageManagerVersion = packageManagerMatch[1];
          expect(ciPnpmVersion, 'CI pnpm version should match packageManager version')
            .toBe(packageManagerVersion);
        }
      }
    }
  });

  it('should have lockfile validation step in CI', () => {
    const ciConfigPath = join(projectRoot, '.github', 'workflows', 'ci.yml');
    const ciConfig = readFileSync(ciConfigPath, 'utf-8');
    
    // Check that CI has a lockfile validation step
    expect(ciConfig, 'CI should have lockfile validation step')
      .toMatch(/name:\s*Validate lockfile/);
    
    // Check that it provides helpful error messages
    expect(ciConfig, 'CI should provide helpful lockfile error messages')
      .toMatch(/Lockfile is out of sync/);
  });
});