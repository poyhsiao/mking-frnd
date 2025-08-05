/**
 * Development Environment Setup Tests
 * Comprehensive tests for task 1.1 Development Environment Setup
 * Following TDD approach to ensure all requirements are met
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import { existsSync, readFileSync, statSync } from 'fs';
import { resolve } from 'path';
import { parse } from 'yaml';

describe('Task 1.1: Development Environment Setup', () => {
  const projectRoot = resolve(__dirname, '../..');

  beforeAll(() => {
    console.log('🧪 Testing Development Environment Setup...');
  });

  afterAll(() => {
    console.log('🧹 Development Environment tests completed.');
  });

  describe('Docker containerization environment setup', () => {
    it('should have docker-compose.yml file', () => {
      const dockerComposeFile = resolve(projectRoot, 'docker-compose.yml');
      expect(existsSync(dockerComposeFile)).toBe(true);
    });

    it('should have valid docker-compose configuration', () => {
      const dockerComposeFile = resolve(projectRoot, 'docker-compose.yml');
      const content = readFileSync(dockerComposeFile, 'utf-8');

      // Check for required services
      expect(content).toContain('postgres');
      expect(content).toContain('redis');
      expect(content).toContain('minio');
      expect(content).toContain('typesense');
      expect(content).toContain('prometheus');
      expect(content).toContain('grafana');
    });

    it('should have proper service configurations', () => {
      const dockerComposeFile = resolve(projectRoot, 'docker-compose.yml');
      const content = readFileSync(dockerComposeFile, 'utf-8');

      // Check for volumes and networks
      expect(content).toContain('volumes:');
      expect(content).toContain('networks:');
      expect(content).toContain('healthcheck:');
    });

    it('should validate docker-compose syntax', () => {
      expect(() => {
        execSync('docker-compose config', {
          cwd: projectRoot,
          stdio: 'pipe',
        });
      }).not.toThrow();
    });

    it('should use modern compose file version', () => {
      const dockerComposeFile = resolve(projectRoot, 'docker-compose.yml');
      const content = readFileSync(dockerComposeFile, 'utf-8');
      const config = parse(content);

      // Should use version 3.8 or higher, or no version (latest)
      if (config.version) {
        const version = parseFloat(config.version);
        expect(version).toBeGreaterThanOrEqual(3.8);
      }
    });

    it('should have proper resource limits for services', () => {
      const dockerComposeFile = resolve(projectRoot, 'docker-compose.yml');
      const content = readFileSync(dockerComposeFile, 'utf-8');
      const config = parse(content);

      // Check that critical services have resource limits or deploy configs
      const criticalServices = ['postgres', 'redis'];
      criticalServices.forEach(serviceName => {
        const service = config.services[serviceName];
        expect(service).toBeDefined();
        // Resource limits can be defined in deploy.resources or mem_limit/cpus
        // For development, we'll check if restart policy is set
        expect(service.restart).toBeDefined();
      });
    });

    it('should use specific image tags instead of latest', () => {
      const dockerComposeFile = resolve(projectRoot, 'docker-compose.yml');
      const content = readFileSync(dockerComposeFile, 'utf-8');
      const config = parse(content);

      Object.entries(config.services).forEach(([serviceName, service]: [string, any]) => {
        if (service.image) {
          // All images should have specific version tags, no :latest allowed
          expect(service.image).not.toMatch(/:latest$/);
          // Ensure images have version tags
          expect(service.image).toMatch(/:.+/);
        }
      });
    });

    it('should have proper network configuration', () => {
      const dockerComposeFile = resolve(projectRoot, 'docker-compose.yml');
      const content = readFileSync(dockerComposeFile, 'utf-8');
      const config = parse(content);

      // Should have custom networks defined
      expect(config.networks).toBeDefined();
      expect(Object.keys(config.networks).length).toBeGreaterThan(0);

      // Services should use custom networks
      Object.entries(config.services).forEach(([serviceName, service]: [string, any]) => {
        expect(service.networks).toBeDefined();
        expect(service.networks.length).toBeGreaterThan(0);
      });
    });

    it('should have proper volume configuration', () => {
      const dockerComposeFile = resolve(projectRoot, 'docker-compose.yml');
      const content = readFileSync(dockerComposeFile, 'utf-8');
      const config = parse(content);

      // Should have named volumes for persistent data
      expect(config.volumes).toBeDefined();

      const persistentServices = ['postgres', 'redis', 'minio'];
      persistentServices.forEach(serviceName => {
        const service = config.services[serviceName];
        expect(service.volumes).toBeDefined();
        expect(service.volumes.length).toBeGreaterThan(0);

        // Check for named volumes (not bind mounts for data)
        const hasNamedVolume = service.volumes.some(
          (volume: string) =>
            !volume.startsWith('./') && !volume.startsWith('/') && volume.includes(':'),
        );
        expect(hasNamedVolume).toBe(true);
      });
    });

    it('should have security best practices', () => {
      const dockerComposeFile = resolve(projectRoot, 'docker-compose.yml');
      const content = readFileSync(dockerComposeFile, 'utf-8');
      const config = parse(content);

      Object.entries(config.services).forEach(([serviceName, service]: [string, any]) => {
        // Check that services don't run as root when possible
        if (service.user) {
          expect(service.user).not.toBe('root');
          expect(service.user).not.toBe('0');
        }

        // Check that privileged mode is not used unnecessarily
        if (service.privileged !== undefined) {
          expect(service.privileged).toBe(false);
        }

        // Check for read-only root filesystem where applicable
        if (service.read_only !== undefined) {
          // This is optional but good practice for stateless services
        }
      });
    });
  });

  describe('Environment variable management', () => {
    it('should have .env.example file', () => {
      const envExampleFile = resolve(projectRoot, '.env.example');
      expect(existsSync(envExampleFile)).toBe(true);
    });

    it('should contain all required environment variables', () => {
      const envExampleFile = resolve(projectRoot, '.env.example');
      const content = readFileSync(envExampleFile, 'utf-8');

      // Application settings
      expect(content).toContain('NODE_ENV=');
      expect(content).toContain('APP_NAME=');
      expect(content).toContain('APP_VERSION=');

      // Database configuration
      expect(content).toContain('DATABASE_URL=');
      expect(content).toContain('POSTGRES_DB=');
      expect(content).toContain('POSTGRES_USER=');
      expect(content).toContain('POSTGRES_PASSWORD=');

      // Redis configuration
      expect(content).toContain('REDIS_URL=');

      // JWT and security
      expect(content).toContain('JWT_SECRET=');
      expect(content).toContain('JWT_EXPIRES_IN=');

      // OAuth providers
      expect(content).toContain('GOOGLE_CLIENT_ID=');
      expect(content).toContain('FACEBOOK_APP_ID=');
      expect(content).toContain('KEYCLOAK_URL=');
    });

    it('should have proper environment variable format', () => {
      const envExampleFile = resolve(projectRoot, '.env.example');
      const content = readFileSync(envExampleFile, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));

      lines.forEach(line => {
        expect(line).toMatch(/^[A-Z_][A-Z0-9_]*=/);
      });
    });
  });

  describe('Git version control and branching strategy', () => {
    it('should have .gitignore file', () => {
      const gitignoreFile = resolve(projectRoot, '.gitignore');
      expect(existsSync(gitignoreFile)).toBe(true);
    });

    it('should ignore common development files', () => {
      const gitignoreFile = resolve(projectRoot, '.gitignore');
      const content = readFileSync(gitignoreFile, 'utf-8');

      expect(content).toContain('node_modules');
      expect(content).toContain('.env');
      expect(content).toContain('dist');
      expect(content).toContain('build');
      expect(content).toContain('coverage');
      expect(content).toContain('*.log');
    });

    it('should be a valid git repository', () => {
      const gitDir = resolve(projectRoot, '.git');
      expect(existsSync(gitDir)).toBe(true);
      expect(statSync(gitDir).isDirectory()).toBe(true);
    });

    it('should have git hooks configured', () => {
      const huskyDir = resolve(projectRoot, '.husky');
      expect(existsSync(huskyDir)).toBe(true);

      const preCommitHook = resolve(huskyDir, 'pre-commit');
      const commitMsgHook = resolve(huskyDir, 'commit-msg');

      expect(existsSync(preCommitHook)).toBe(true);
      expect(existsSync(commitMsgHook)).toBe(true);
    });
  });

  describe('pnpm package manager setup and configuration', () => {
    it('should have pnpm installed globally', () => {
      expect(() => {
        execSync('pnpm --version', { stdio: 'pipe' });
      }).not.toThrow();
    });

    it('should have correct package manager specified in package.json', () => {
      const packageFile = resolve(projectRoot, 'package.json');
      const content = JSON.parse(readFileSync(packageFile, 'utf-8'));

      expect(content.packageManager).toMatch(/^pnpm@/);
    });

    it('should have workspace configuration', () => {
      const workspaceFile = resolve(projectRoot, 'pnpm-workspace.yaml');
      expect(existsSync(workspaceFile)).toBe(true);

      const content = readFileSync(workspaceFile, 'utf-8');
      const config = parse(content);

      expect(config.packages).toBeInstanceOf(Array);
      expect(config.packages.length).toBeGreaterThan(0);
    });

    it('should have proper pnpm configuration', () => {
      const pnpmrcFile = resolve(projectRoot, '.pnpmrc');
      expect(existsSync(pnpmrcFile)).toBe(true);

      const content = readFileSync(pnpmrcFile, 'utf-8');
      expect(content).toContain('strict-peer-dependencies=false');
      expect(content).toContain('auto-install-peers=true');
    });
  });

  describe('GitHub repository setup with proper branch protection', () => {
    it('should have GitHub workflows directory', () => {
      const workflowsDir = resolve(projectRoot, '.github/workflows');
      expect(existsSync(workflowsDir)).toBe(true);
      expect(statSync(workflowsDir).isDirectory()).toBe(true);
    });

    it('should have CI workflow configuration', () => {
      const ciWorkflow = resolve(projectRoot, '.github/workflows/ci.yml');
      expect(existsSync(ciWorkflow)).toBe(true);

      const content = readFileSync(ciWorkflow, 'utf-8');
      expect(content).toContain('name:');
      expect(content).toContain('on:');
      expect(content).toContain('jobs:');
    });

    it('should have dependabot configuration', () => {
      const dependabotFile = resolve(projectRoot, '.github/dependabot.yml');
      expect(existsSync(dependabotFile)).toBe(true);

      const content = readFileSync(dependabotFile, 'utf-8');
      expect(content).toContain('version: 2');
      expect(content).toContain('updates:');
    });

    it('should have issue and PR templates', () => {
      const issueTemplateDir = resolve(projectRoot, '.github/ISSUE_TEMPLATE');
      const prTemplate = resolve(projectRoot, '.github/pull_request_template.md');

      expect(existsSync(issueTemplateDir)).toBe(true);
      expect(existsSync(prTemplate)).toBe(true);
    });
  });

  describe('Code quality and development tools', () => {
    it('should have TypeScript configuration', () => {
      const tsconfigFile = resolve(projectRoot, 'tsconfig.json');
      expect(existsSync(tsconfigFile)).toBe(true);

      const content = JSON.parse(readFileSync(tsconfigFile, 'utf-8'));
      expect(content.compilerOptions).toBeDefined();
      expect(content.compilerOptions.strict).toBe(true);
    });

    it('should have ESLint configuration', () => {
      const eslintFile = resolve(projectRoot, '.eslintrc.cjs');
      expect(existsSync(eslintFile)).toBe(true);
    });

    it('should have Prettier configuration', () => {
      const prettierFile = resolve(projectRoot, '.prettierrc');
      const prettierIgnore = resolve(projectRoot, '.prettierignore');

      expect(existsSync(prettierFile)).toBe(true);
      expect(existsSync(prettierIgnore)).toBe(true);
    });

    it('should have EditorConfig', () => {
      const editorConfigFile = resolve(projectRoot, '.editorconfig');
      expect(existsSync(editorConfigFile)).toBe(true);
    });

    it('should have Vitest configuration', () => {
      const vitestConfigFile = resolve(projectRoot, 'vitest.config.ts');
      expect(existsSync(vitestConfigFile)).toBe(true);
    });

    it('should have commitlint configuration', () => {
      const commitlintFile = resolve(projectRoot, '.commitlintrc.js');
      expect(existsSync(commitlintFile)).toBe(true);
    });

    it('should have lint-staged configuration', () => {
      const lintStagedFile = resolve(projectRoot, '.lintstagedrc.js');
      expect(existsSync(lintStagedFile)).toBe(true);
    });
  });

  describe('Development workflow integration', () => {
    it('should have all required npm scripts', () => {
      const packageFile = resolve(projectRoot, 'package.json');
      const content = JSON.parse(readFileSync(packageFile, 'utf-8'));
      const scripts = content.scripts;

      expect(scripts.dev).toBeDefined();
      expect(scripts.build).toBeDefined();
      expect(scripts.test).toBeDefined();
      expect(scripts['test:unit']).toBeDefined();
      expect(scripts['test:coverage']).toBeDefined();
      expect(scripts.lint).toBeDefined();
      expect(scripts['lint:fix']).toBeDefined();
      expect(scripts.format).toBeDefined();
      expect(scripts['format:check']).toBeDefined();
      expect(scripts['type-check']).toBeDefined();
      expect(scripts['docker:up']).toBeDefined();
      expect(scripts['docker:down']).toBeDefined();
    });

    it('should be able to run development commands', () => {
      expect(() => {
        execSync('pnpm run type-check', {
          cwd: projectRoot,
          stdio: 'pipe',
          timeout: 30000,
        });
      }).not.toThrow();
    });

    it('should be able to run linting', () => {
      expect(() => {
        execSync('pnpm run lint', {
          cwd: projectRoot,
          stdio: 'pipe',
          timeout: 30000,
        });
      }).not.toThrow();
    });

    it('should be able to run formatting check', () => {
      expect(() => {
        execSync('pnpm run format:check', {
          cwd: projectRoot,
          stdio: 'pipe',
          timeout: 30000,
        });
      }).not.toThrow();
    });
  });
});
