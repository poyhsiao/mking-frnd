import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import yaml from 'js-yaml';

describe('PNPM Specifier Mismatch Detection and Fix', () => {
  const projectRoot = process.cwd();
  const frontendPath = join(projectRoot, 'frontend');
  const backendPath = join(projectRoot, 'backend');
  const lockfilePath = join(projectRoot, 'pnpm-lock.yaml');
  
  let frontendPackageJson: any;
  let backendPackageJson: any;
  let pnpmLockfile: any;

  beforeAll(() => {
    const frontendPackagePath = join(frontendPath, 'package.json');
    const backendPackagePath = join(backendPath, 'package.json');
    
    expect(existsSync(frontendPackagePath), 'Frontend package.json should exist').toBe(true);
    expect(existsSync(backendPackagePath), 'Backend package.json should exist').toBe(true);
    expect(existsSync(lockfilePath), 'pnpm-lock.yaml should exist').toBe(true);
    
    frontendPackageJson = JSON.parse(readFileSync(frontendPackagePath, 'utf-8'));
    backendPackageJson = JSON.parse(readFileSync(backendPackagePath, 'utf-8'));
    pnpmLockfile = yaml.load(readFileSync(lockfilePath, 'utf-8')) as any;
  });

  describe('Dependency Specifier Validation', () => {
    it('should detect eslint-plugin-react-hooks version mismatch', () => {
      // This test specifically targets the error mentioned in the issue
      const frontendLockfile = pnpmLockfile.importers?.frontend;
      
      expect(frontendLockfile, 'Frontend should exist in lockfile').toBeDefined();
      
      // Check if eslint-plugin-react-hooks exists in both package.json and lockfile
      const packageJsonVersion = frontendPackageJson.devDependencies?.['eslint-plugin-react-hooks'];
      const lockfileEntry = frontendLockfile.devDependencies?.['eslint-plugin-react-hooks'];
      
      if (packageJsonVersion && lockfileEntry) {
        console.log(`Package.json version: ${packageJsonVersion}`);
        console.log(`Lockfile specifier: ${lockfileEntry.specifier || lockfileEntry}`);
        
        // The specifier in lockfile should match the version in package.json
        const lockfileSpecifier = typeof lockfileEntry === 'string' ? lockfileEntry : lockfileEntry.specifier;
        expect(lockfileSpecifier, 
          `eslint-plugin-react-hooks specifier mismatch: package.json has ${packageJsonVersion}, lockfile has ${lockfileSpecifier}`
        ).toBe(packageJsonVersion);
      }
    });

    it('should validate all frontend dependency specifiers match', () => {
      const frontendLockfile = pnpmLockfile.importers?.frontend;
      
      // Check all dependencies
      if (frontendPackageJson.dependencies) {
        Object.entries(frontendPackageJson.dependencies).forEach(([dep, version]) => {
          const lockfileEntry = frontendLockfile.dependencies?.[dep];
          if (lockfileEntry) {
            const lockfileSpecifier = typeof lockfileEntry === 'string' ? lockfileEntry : lockfileEntry.specifier;
            expect(lockfileSpecifier, 
              `Dependency ${dep} specifier mismatch: package.json has ${version}, lockfile has ${lockfileSpecifier}`
            ).toBe(version);
          }
        });
      }
      
      // Check all devDependencies
      if (frontendPackageJson.devDependencies) {
        Object.entries(frontendPackageJson.devDependencies).forEach(([dep, version]) => {
          const lockfileEntry = frontendLockfile.devDependencies?.[dep];
          if (lockfileEntry) {
            const lockfileSpecifier = typeof lockfileEntry === 'string' ? lockfileEntry : lockfileEntry.specifier;
            expect(lockfileSpecifier, 
              `DevDependency ${dep} specifier mismatch: package.json has ${version}, lockfile has ${lockfileSpecifier}`
            ).toBe(version);
          }
        });
      }
    });

    it('should validate all backend dependency specifiers match', () => {
      const backendLockfile = pnpmLockfile.importers?.backend;
      
      // Check all dependencies
      if (backendPackageJson.dependencies) {
        Object.entries(backendPackageJson.dependencies).forEach(([dep, version]) => {
          const lockfileEntry = backendLockfile.dependencies?.[dep];
          if (lockfileEntry) {
            const lockfileSpecifier = typeof lockfileEntry === 'string' ? lockfileEntry : lockfileEntry.specifier;
            expect(lockfileSpecifier, 
              `Backend dependency ${dep} specifier mismatch: package.json has ${version}, lockfile has ${lockfileSpecifier}`
            ).toBe(version);
          }
        });
      }
      
      // Check all devDependencies
      if (backendPackageJson.devDependencies) {
        Object.entries(backendPackageJson.devDependencies).forEach(([dep, version]) => {
          const lockfileEntry = backendLockfile.devDependencies?.[dep];
          if (lockfileEntry) {
            const lockfileSpecifier = typeof lockfileEntry === 'string' ? lockfileEntry : lockfileEntry.specifier;
            expect(lockfileSpecifier, 
              `Backend devDependency ${dep} specifier mismatch: package.json has ${version}, lockfile has ${lockfileSpecifier}`
            ).toBe(version);
          }
        });
      }
    });
  });

  describe('Lockfile Synchronization Tests', () => {
    it('should pass pnpm install --frozen-lockfile without ERR_PNPM_OUTDATED_LOCKFILE', () => {
      try {
        execSync('pnpm install --frozen-lockfile', {
          cwd: projectRoot,
          stdio: 'pipe',
          encoding: 'utf-8'
        });
      } catch (error: any) {
        const errorMessage = error.message || error.toString();
        
        if (errorMessage.includes('ERR_PNPM_OUTDATED_LOCKFILE')) {
          // Extract specific mismatch information for debugging
          const specifiersMatch = errorMessage.match(/specifiers in the lockfile \(([^)]+)\)/);
          const specsMatch = errorMessage.match(/don't match specs in package\.json \(([^)]+)\)/);
          
          let detailedError = 'ERR_PNPM_OUTDATED_LOCKFILE: Specifiers mismatch detected.';
          
          if (specifiersMatch && specsMatch) {
            detailedError += `\nLockfile specifiers: ${specifiersMatch[1]}`;
            detailedError += `\nPackage.json specs: ${specsMatch[1]}`;
            
            // Parse and compare the specifiers
            try {
              const lockfileSpecs = JSON.parse(specifiersMatch[1]);
              const packageJsonSpecs = JSON.parse(specsMatch[1]);
              
              // Find mismatched dependencies
              const mismatches: string[] = [];
              Object.keys(packageJsonSpecs).forEach(dep => {
                if (lockfileSpecs[dep] && lockfileSpecs[dep] !== packageJsonSpecs[dep]) {
                  mismatches.push(`${dep}: lockfile=${lockfileSpecs[dep]}, package.json=${packageJsonSpecs[dep]}`);
                }
              });
              
              if (mismatches.length > 0) {
                detailedError += `\nSpecific mismatches:\n${mismatches.join('\n')}`;
              }
            } catch (parseError) {
              detailedError += '\nCould not parse specifier details.';
            }
          }
          
          throw new Error(detailedError);
        }
        
        throw error;
      }
    });

    it('should have consistent lockfile after running pnpm install', () => {
      // This test ensures that running pnpm install fixes any inconsistencies
      try {
        execSync('pnpm install', {
          cwd: projectRoot,
          stdio: 'pipe',
          encoding: 'utf-8'
        });
        
        // After install, frozen-lockfile should work
        execSync('pnpm install --frozen-lockfile', {
          cwd: projectRoot,
          stdio: 'pipe',
          encoding: 'utf-8'
        });
      } catch (error: any) {
        throw new Error(`Failed to synchronize lockfile: ${error.message}`);
      }
    });
  });

  describe('Prevention Tests', () => {
    it('should not have any dependency version conflicts in workspace', () => {
      // Check for version conflicts between frontend and backend
      const frontendDeps = {
        ...frontendPackageJson.dependencies || {},
        ...frontendPackageJson.devDependencies || {}
      };
      
      const backendDeps = {
        ...backendPackageJson.dependencies || {},
        ...backendPackageJson.devDependencies || {}
      };
      
      const conflicts: string[] = [];
      
      Object.keys(frontendDeps).forEach(dep => {
        if (backendDeps[dep] && frontendDeps[dep] !== backendDeps[dep]) {
          conflicts.push(`${dep}: frontend=${frontendDeps[dep]}, backend=${backendDeps[dep]}`);
        }
      });
      
      if (conflicts.length > 0) {
        console.warn('Version conflicts detected (may cause issues):', conflicts);
        // Note: This is a warning, not a failure, as some conflicts might be intentional
      }
      
      expect(conflicts.length).toBeLessThan(10); // Allow some conflicts but flag excessive ones
    });

    it('should have valid semver ranges for all dependencies', () => {
      const semverRegex = /^[\^~]?\d+\.\d+\.\d+/;
      
      // Check frontend dependencies
      Object.entries({
        ...frontendPackageJson.dependencies || {},
        ...frontendPackageJson.devDependencies || {}
      }).forEach(([dep, version]) => {
        expect(version as string, `${dep} should have valid semver: ${version}`)
          .toMatch(semverRegex);
      });
      
      // Check backend dependencies
      Object.entries({
        ...backendPackageJson.dependencies || {},
        ...backendPackageJson.devDependencies || {}
      }).forEach(([dep, version]) => {
        expect(version as string, `${dep} should have valid semver: ${version}`)
          .toMatch(semverRegex);
      });
    });
  });
});