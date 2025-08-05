import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';

describe('PNPM Lockfile Synchronization', () => {
  let backendPackageJson: any;
  let frontendPackageJson: any;
  let rootPackageJson: any;
  let pnpmLockfile: any;
  
  const projectRoot = process.cwd();
  const backendPath = join(projectRoot, 'backend');
  const frontendPath = join(projectRoot, 'frontend');

  beforeAll(() => {
    // Read package.json files
    const backendPackagePath = join(backendPath, 'package.json');
    const frontendPackagePath = join(frontendPath, 'package.json');
    const rootPackagePath = join(projectRoot, 'package.json');
    const lockfilePath = join(projectRoot, 'pnpm-lock.yaml');

    expect(existsSync(backendPackagePath), 'Backend package.json should exist').toBe(true);
    expect(existsSync(frontendPackagePath), 'Frontend package.json should exist').toBe(true);
    expect(existsSync(rootPackagePath), 'Root package.json should exist').toBe(true);
    expect(existsSync(lockfilePath), 'pnpm-lock.yaml should exist').toBe(true);

    backendPackageJson = JSON.parse(readFileSync(backendPackagePath, 'utf-8'));
    frontendPackageJson = JSON.parse(readFileSync(frontendPackagePath, 'utf-8'));
    rootPackageJson = JSON.parse(readFileSync(rootPackagePath, 'utf-8'));
    pnpmLockfile = yaml.load(readFileSync(lockfilePath, 'utf-8')) as any;
  });

  it('should have valid lockfile format', () => {
    expect(pnpmLockfile).toBeDefined();
    expect(pnpmLockfile.lockfileVersion).toBeDefined();
    expect(pnpmLockfile.importers).toBeDefined();
  });

  it('should have backend workspace in lockfile', () => {
    expect(pnpmLockfile.importers).toHaveProperty('backend');
  });

  it('should have frontend workspace in lockfile', () => {
    expect(pnpmLockfile.importers).toHaveProperty('frontend');
  });

  it('should have root workspace in lockfile', () => {
    expect(pnpmLockfile.importers).toHaveProperty('.');
  });

  it('should have backend dependencies synchronized with lockfile', () => {
    const backendLockfile = pnpmLockfile.importers.backend;
    
    // Check dependencies
    if (backendPackageJson.dependencies) {
      Object.keys(backendPackageJson.dependencies).forEach(dep => {
        expect(backendLockfile.dependencies, 
          `Backend dependency ${dep} should be in lockfile`
        ).toHaveProperty(dep);
      });
    }

    // Check devDependencies
    if (backendPackageJson.devDependencies) {
      Object.keys(backendPackageJson.devDependencies).forEach(dep => {
        expect(backendLockfile.devDependencies, 
          `Backend devDependency ${dep} should be in lockfile`
        ).toHaveProperty(dep);
      });
    }
  });

  it('should have frontend dependencies synchronized with lockfile', () => {
    const frontendLockfile = pnpmLockfile.importers.frontend;
    
    // Check dependencies
    if (frontendPackageJson.dependencies) {
      Object.keys(frontendPackageJson.dependencies).forEach(dep => {
        expect(frontendLockfile.dependencies, 
          `Frontend dependency ${dep} should be in lockfile`
        ).toHaveProperty(dep);
      });
    }

    // Check devDependencies
    if (frontendPackageJson.devDependencies) {
      Object.keys(frontendPackageJson.devDependencies).forEach(dep => {
        expect(frontendLockfile.devDependencies, 
          `Frontend devDependency ${dep} should be in lockfile`
        ).toHaveProperty(dep);
      });
    }
  });

  it('should have root dependencies synchronized with lockfile', () => {
    const rootLockfile = pnpmLockfile.importers['.'];
    
    // Check dependencies
    if (rootPackageJson.dependencies) {
      Object.keys(rootPackageJson.dependencies).forEach(dep => {
        expect(rootLockfile.dependencies, 
          `Root dependency ${dep} should be in lockfile`
        ).toHaveProperty(dep);
      });
    }

    // Check devDependencies
    if (rootPackageJson.devDependencies) {
      Object.keys(rootPackageJson.devDependencies).forEach(dep => {
        expect(rootLockfile.devDependencies, 
          `Root devDependency ${dep} should be in lockfile`
        ).toHaveProperty(dep);
      });
    }
  });

  it('should not have extra dependencies in lockfile that are not in package.json', () => {
    const backendLockfile = pnpmLockfile.importers.backend;
    const frontendLockfile = pnpmLockfile.importers.frontend;
    const rootLockfile = pnpmLockfile.importers['.'];

    // Check backend
    if (backendLockfile.dependencies) {
      Object.keys(backendLockfile.dependencies).forEach(dep => {
        expect(backendPackageJson.dependencies || {}, 
          `Backend lockfile dependency ${dep} should exist in package.json`
        ).toHaveProperty(dep);
      });
    }

    if (backendLockfile.devDependencies) {
      Object.keys(backendLockfile.devDependencies).forEach(dep => {
        expect(backendPackageJson.devDependencies || {}, 
          `Backend lockfile devDependency ${dep} should exist in package.json`
        ).toHaveProperty(dep);
      });
    }

    // Check frontend
    if (frontendLockfile.dependencies) {
      Object.keys(frontendLockfile.dependencies).forEach(dep => {
        expect(frontendPackageJson.dependencies || {}, 
          `Frontend lockfile dependency ${dep} should exist in package.json`
        ).toHaveProperty(dep);
      });
    }

    if (frontendLockfile.devDependencies) {
      Object.keys(frontendLockfile.devDependencies).forEach(dep => {
        expect(frontendPackageJson.devDependencies || {}, 
          `Frontend lockfile devDependency ${dep} should exist in package.json`
        ).toHaveProperty(dep);
      });
    }

    // Check root
    if (rootLockfile.dependencies) {
      Object.keys(rootLockfile.dependencies).forEach(dep => {
        expect(rootPackageJson.dependencies || {}, 
          `Root lockfile dependency ${dep} should exist in package.json`
        ).toHaveProperty(dep);
      });
    }

    if (rootLockfile.devDependencies) {
      Object.keys(rootLockfile.devDependencies).forEach(dep => {
        expect(rootPackageJson.devDependencies || {}, 
          `Root lockfile devDependency ${dep} should exist in package.json`
        ).toHaveProperty(dep);
      });
    }
  });

  it('should have consistent dependency versions between package.json and lockfile', () => {
    const backendLockfile = pnpmLockfile.importers.backend;
    
    // Check backend dependencies version consistency
    if (backendPackageJson.dependencies) {
      Object.entries(backendPackageJson.dependencies).forEach(([dep, version]) => {
        if (backendLockfile.dependencies?.[dep]) {
          const lockfileEntry = backendLockfile.dependencies[dep];
          expect(lockfileEntry.specifier, 
            `Backend dependency ${dep} specifier should match package.json spec ${version}`
          ).toBe(version);
        }
      });
    }

    if (backendPackageJson.devDependencies) {
      Object.entries(backendPackageJson.devDependencies).forEach(([dep, version]) => {
        if (backendLockfile.devDependencies?.[dep]) {
          const lockfileEntry = backendLockfile.devDependencies[dep];
          expect(lockfileEntry.specifier, 
            `Backend devDependency ${dep} specifier should match package.json spec ${version}`
          ).toBe(version);
        }
      });
      }
    });

  it('should have CI-compatible lockfile settings', () => {
    // Check if lockfile has settings that are compatible with CI
    expect(pnpmLockfile.settings).toBeDefined();
    
    // Ensure lockfile version is compatible
    expect(pnpmLockfile.lockfileVersion).toMatch(/^[0-9]+\.[0-9]+$/);
  });

  it('should not have any missing specifiers that cause ERR_PNPM_OUTDATED_LOCKFILE', () => {
    const backendLockfile = pnpmLockfile.importers.backend;
    
    // This test specifically checks for the error condition mentioned in the issue
    // All dependencies in package.json should have corresponding entries in lockfile
    const allBackendDeps = {
      ...backendPackageJson.dependencies || {},
      ...backendPackageJson.devDependencies || {}
    };
    
    const allLockfileDeps = {
      ...backendLockfile.dependencies || {},
      ...backendLockfile.devDependencies || {}
    };
    
    Object.keys(allBackendDeps).forEach(dep => {
      expect(allLockfileDeps, 
        `Dependency ${dep} from backend/package.json should exist in lockfile to prevent ERR_PNPM_OUTDATED_LOCKFILE`
      ).toHaveProperty(dep);
    });
  });
});