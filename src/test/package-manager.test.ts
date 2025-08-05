/**
 * Package Manager Setup Tests
 * Tests for pnpm package manager configuration and setup
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

describe('Package Manager Setup', () => {
  const projectRoot = resolve(__dirname, '../..');
  
  describe('pnpm configuration', () => {
    it('should have pnpm-workspace.yaml file', () => {
      const workspaceFile = resolve(projectRoot, 'pnpm-workspace.yaml');
      expect(existsSync(workspaceFile)).toBe(true);
    });
    
    it('should have .pnpmrc configuration file', () => {
      const pnpmrcFile = resolve(projectRoot, '.pnpmrc');
      expect(existsSync(pnpmrcFile)).toBe(true);
    });
    
    it('should have valid pnpm-workspace.yaml structure', () => {
      const workspaceFile = resolve(projectRoot, 'pnpm-workspace.yaml');
      const content = readFileSync(workspaceFile, 'utf-8');
      
      // Check for required workspace packages
      expect(content).toContain('backend');
      expect(content).toContain('frontend');
      expect(content).toContain('packages/*');
      expect(content).toContain('tools/*');
    });
    
    it('should have proper .pnpmrc configuration', () => {
      const pnpmrcFile = resolve(projectRoot, '.pnpmrc');
      const content = readFileSync(pnpmrcFile, 'utf-8');
      
      // Check for important pnpm settings
      expect(content).toContain('strict-peer-dependencies=false');
      expect(content).toContain('auto-install-peers=true');
      expect(content).toContain('link-workspace-packages=true');
      expect(content).toContain('save-exact=true');
    });
  });
  
  describe('package.json configuration', () => {
    it('should have package.json file', () => {
      const packageFile = resolve(projectRoot, 'package.json');
      expect(existsSync(packageFile)).toBe(true);
    });
    
    it('should have correct package manager specified', () => {
      const packageFile = resolve(projectRoot, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageFile, 'utf-8'));
      
      expect(packageJson.packageManager).toMatch(/^pnpm@/);
    });
    
    it('should have workspace scripts', () => {
      const packageFile = resolve(projectRoot, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageFile, 'utf-8'));
      
      expect(packageJson.scripts).toBeDefined();
      expect(packageJson.scripts.dev).toContain('pnpm --parallel --recursive');
      expect(packageJson.scripts.build).toContain('pnpm --recursive');
      expect(packageJson.scripts.test).toContain('pnpm --recursive');
    });
    
    it('should have required development dependencies', () => {
      const packageFile = resolve(projectRoot, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageFile, 'utf-8'));
      
      const requiredDevDeps = [
        'typescript',
        'eslint',
        'prettier',
        'vitest',
        'husky',
        '@typescript-eslint/eslint-plugin',
        '@typescript-eslint/parser',
      ];
      
      requiredDevDeps.forEach(dep => {
        expect(packageJson.devDependencies).toHaveProperty(dep);
      });
    });
    
    it('should have proper engine requirements', () => {
      const packageFile = resolve(projectRoot, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageFile, 'utf-8'));
      
      expect(packageJson.engines).toBeDefined();
      expect(packageJson.engines.node).toMatch(/>=18/);
      expect(packageJson.engines.pnpm).toMatch(/>=8/);
    });
  });
  
  describe('TypeScript configuration', () => {
    it('should have tsconfig.json file', () => {
      const tsconfigFile = resolve(projectRoot, 'tsconfig.json');
      expect(existsSync(tsconfigFile)).toBe(true);
    });
    
    it('should have valid TypeScript configuration', () => {
      const tsconfigFile = resolve(projectRoot, 'tsconfig.json');
      const content = readFileSync(tsconfigFile, 'utf-8');
      const tsconfig = JSON.parse(content);
      
      expect(tsconfig.compilerOptions).toBeDefined();
      expect(tsconfig.compilerOptions.target).toBe('ES2022');
      expect(tsconfig.compilerOptions.module).toBe('ESNext');
      expect(tsconfig.compilerOptions.strict).toBe(true);
    });
    
    it('should have path mapping configured', () => {
      const tsconfigFile = resolve(projectRoot, 'tsconfig.json');
      const content = readFileSync(tsconfigFile, 'utf-8');
      const tsconfig = JSON.parse(content);
      
      expect(tsconfig.compilerOptions.paths).toBeDefined();
      expect(tsconfig.compilerOptions.paths['@/*']).toEqual(['./src/*']);
      expect(tsconfig.compilerOptions.paths['@backend/*']).toEqual(['./backend/src/*']);
      expect(tsconfig.compilerOptions.paths['@frontend/*']).toEqual(['./frontend/src/*']);
    });
  });
  
  describe('ESLint configuration', () => {
    it('should have .eslintrc.js file', () => {
      const eslintFile = resolve(projectRoot, '.eslintrc.js');
      expect(existsSync(eslintFile)).toBe(true);
    });
    
    it('should have TypeScript ESLint configuration', () => {
      const eslintFile = resolve(projectRoot, '.eslintrc.js');
      const content = readFileSync(eslintFile, 'utf-8');
      
      expect(content).toContain('@typescript-eslint/recommended');
      expect(content).toContain('@typescript-eslint/parser');
      expect(content).toContain('prettier');
    });
  });
  
  describe('Prettier configuration', () => {
    it('should have .prettierrc file', () => {
      const prettierFile = resolve(projectRoot, '.prettierrc');
      expect(existsSync(prettierFile)).toBe(true);
    });
    
    it('should have .prettierignore file', () => {
      const prettierIgnoreFile = resolve(projectRoot, '.prettierignore');
      expect(existsSync(prettierIgnoreFile)).toBe(true);
    });
    
    it('should have valid Prettier configuration', () => {
      const prettierFile = resolve(projectRoot, '.prettierrc');
      const content = readFileSync(prettierFile, 'utf-8');
      const config = JSON.parse(content);
      
      expect(config.semi).toBe(true);
      expect(config.singleQuote).toBe(true);
      expect(config.trailingComma).toBe('all');
      expect(config.printWidth).toBe(100);
    });
  });
  
  describe('EditorConfig', () => {
    it('should have .editorconfig file', () => {
      const editorconfigFile = resolve(projectRoot, '.editorconfig');
      expect(existsSync(editorconfigFile)).toBe(true);
    });
    
    it('should have proper EditorConfig settings', () => {
      const editorconfigFile = resolve(projectRoot, '.editorconfig');
      const content = readFileSync(editorconfigFile, 'utf-8');
      
      expect(content).toContain('root = true');
      expect(content).toContain('charset = utf-8');
      expect(content).toContain('end_of_line = lf');
      expect(content).toContain('indent_style = space');
      expect(content).toContain('indent_size = 2');
    });
  });
  
  describe('Vitest configuration', () => {
    it('should have vitest.config.ts file', () => {
      const vitestFile = resolve(projectRoot, 'vitest.config.ts');
      expect(existsSync(vitestFile)).toBe(true);
    });
    
    it('should have test setup file', () => {
      const setupFile = resolve(projectRoot, 'src/test/setup.ts');
      expect(existsSync(setupFile)).toBe(true);
    });
  });
  
  describe('Docker configuration', () => {
    it('should have docker-compose.yml file', () => {
      const dockerFile = resolve(projectRoot, 'docker-compose.yml');
      expect(existsSync(dockerFile)).toBe(true);
    });
    
    it('should have environment example file', () => {
      const envFile = resolve(projectRoot, '.env.example');
      expect(existsSync(envFile)).toBe(true);
    });
  });
});

describe('Package Manager Commands', () => {
  const projectRoot = resolve(__dirname, '../..');
  
  it('should have pnpm installed', () => {
    expect(() => {
      execSync('pnpm --version', { stdio: 'pipe', cwd: projectRoot });
    }).not.toThrow();
  });
  
  it('should validate pnpm workspace configuration', () => {
    expect(() => {
      const output = execSync('pnpm list --depth=0', { 
        stdio: 'pipe', 
        encoding: 'utf-8',
        cwd: projectRoot 
      });
      expect(output).toContain('mking-friend');
    }).not.toThrow();
  });
  
  it('should be able to run workspace commands', () => {
    expect(() => {
      // Test if pnpm can parse workspace configuration
      execSync('pnpm -r list --depth=0', { 
        stdio: 'pipe',
        cwd: projectRoot 
      });
    }).not.toThrow();
  });
});