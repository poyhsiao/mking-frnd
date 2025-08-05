import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

/**
 * Test Suite for Development Environment Setup (Task 1.1)
 * 
 * This test suite validates the four main components of development environment setup:
 * 1. Docker containerization environment setup
 * 2. Docker Compose local development configuration
 * 3. Environment variable management (.env configuration)
 * 4. Git version control and branching strategy setup
 */
describe('Development Environment Setup (Task 1.1)', () => {
  const projectRoot = path.resolve(__dirname, '../..');

  describe('Docker Containerization Environment Setup', () => {
    it('should have Docker installed and accessible', () => {
      expect(() => {
        const dockerVersion = execSync('docker --version', { encoding: 'utf8' });
        expect(dockerVersion).toContain('Docker version');
      }).not.toThrow();
    });

    it('should have Dockerfile for backend service', () => {
      const backendDockerfile = path.join(projectRoot, 'backend', 'Dockerfile');
      expect(fs.existsSync(backendDockerfile)).toBe(true);
      
      const dockerfileContent = fs.readFileSync(backendDockerfile, 'utf8');
      expect(dockerfileContent).toContain('FROM node');
      expect(dockerfileContent).toContain('WORKDIR');
      expect(dockerfileContent).toContain('COPY');
      expect(dockerfileContent).toContain('RUN');
      expect(dockerfileContent).toContain('EXPOSE');
      expect(dockerfileContent).toContain('CMD');
    });

    it('should have Dockerfile for frontend service', () => {
      const frontendDockerfile = path.join(projectRoot, 'frontend', 'Dockerfile');
      expect(fs.existsSync(frontendDockerfile)).toBe(true);
      
      const dockerfileContent = fs.readFileSync(frontendDockerfile, 'utf8');
      expect(dockerfileContent).toContain('FROM node');
      expect(dockerfileContent).toContain('WORKDIR');
      expect(dockerfileContent).toContain('COPY');
      expect(dockerfileContent).toContain('RUN');
      expect(dockerfileContent).toContain('EXPOSE');
    });

    it('should have proper .dockerignore files', () => {
      const backendDockerignore = path.join(projectRoot, 'backend', '.dockerignore');
      const frontendDockerignore = path.join(projectRoot, 'frontend', '.dockerignore');
      
      expect(fs.existsSync(backendDockerignore)).toBe(true);
      expect(fs.existsSync(frontendDockerignore)).toBe(true);
      
      const backendIgnoreContent = fs.readFileSync(backendDockerignore, 'utf8');
      expect(backendIgnoreContent).toContain('node_modules');
      expect(backendIgnoreContent).toContain('.git');
      expect(backendIgnoreContent).toContain('*.log');
    });
  });

  describe('Docker Compose Local Development Configuration', () => {
    it('should have docker-compose.yml file', () => {
      const dockerComposePath = path.join(projectRoot, 'docker-compose.yml');
      expect(fs.existsSync(dockerComposePath)).toBe(true);
    });

    it('should have docker-compose.dev.yml for development', () => {
      const dockerComposeDevPath = path.join(projectRoot, 'docker-compose.dev.yml');
      expect(fs.existsSync(dockerComposeDevPath)).toBe(true);
      
      const composeDevContent = fs.readFileSync(dockerComposeDevPath, 'utf8');
      expect(composeDevContent).toContain('backend-dev');
      expect(composeDevContent).toContain('frontend-dev');
      expect(composeDevContent).toContain('target: development');
      expect(composeDevContent).toContain('NODE_ENV=development');
    });

    it('should have docker-compose.override.yml for local overrides', () => {
      const dockerComposeOverridePath = path.join(projectRoot, 'docker-compose.override.yml');
      expect(fs.existsSync(dockerComposeOverridePath)).toBe(true);
      
      const overrideContent = fs.readFileSync(dockerComposeOverridePath, 'utf8');
      expect(overrideContent).toContain('mailhog');
      expect(overrideContent).toContain('pgadmin');
      expect(overrideContent).toContain('redis-commander');
    });

    it('should have development-specific Dockerfiles', () => {
      const backendDockerfileDev = path.join(projectRoot, 'backend', 'Dockerfile.dev');
      const frontendDockerfileDev = path.join(projectRoot, 'frontend', 'Dockerfile.dev');
      
      expect(fs.existsSync(backendDockerfileDev)).toBe(true);
      expect(fs.existsSync(frontendDockerfileDev)).toBe(true);
      
      const backendDevContent = fs.readFileSync(backendDockerfileDev, 'utf8');
      expect(backendDevContent).toContain('nodemon');
      expect(backendDevContent).toContain('EXPOSE 3001 9229');
      
      const frontendDevContent = fs.readFileSync(frontendDockerfileDev, 'utf8');
      expect(frontendDevContent).toContain('--host');
      expect(frontendDevContent).toContain('EXPOSE 3000');
    });

    it('should have proper service definitions in docker-compose.yml', () => {
      const dockerComposePath = path.join(projectRoot, 'docker-compose.yml');
      const composeContent = fs.readFileSync(dockerComposePath, 'utf8');
      
      // Check for essential services
      expect(composeContent).toContain('postgres');
      expect(composeContent).toContain('redis');
      expect(composeContent).toContain('version:');
      expect(composeContent).toContain('services:');
      expect(composeContent).toContain('networks:');
      expect(composeContent).toContain('volumes:');
    });

    it('should have Docker Compose installed', () => {
      expect(() => {
        // Try modern docker compose command first, fallback to legacy docker-compose
        let composeVersion;
        try {
          composeVersion = execSync('docker compose version', { encoding: 'utf8' });
          expect(composeVersion).toContain('Docker Compose version');
        } catch {
          composeVersion = execSync('docker-compose --version', { encoding: 'utf8' });
          expect(composeVersion).toContain('docker-compose version');
        }
      }).not.toThrow();
    });

    it('should validate docker-compose.yml syntax', () => {
      expect(() => {
        execSync('docker-compose config', { encoding: 'utf8' });
      }).not.toThrow();
    });

    it('should have health checks for critical services', () => {
      const dockerComposePath = path.join(projectRoot, 'docker-compose.yml');
      const composeContent = fs.readFileSync(dockerComposePath, 'utf8');
      
      expect(composeContent).toContain('healthcheck');
      expect(composeContent).toContain('test:');
      expect(composeContent).toContain('interval:');
      expect(composeContent).toContain('timeout:');
      expect(composeContent).toContain('retries:');
    });
  });

  describe('Environment Variable Management', () => {
    it('should have .env.example file', () => {
      const envExamplePath = path.join(projectRoot, '.env.example');
      expect(fs.existsSync(envExamplePath)).toBe(true);
    });

    it('should have comprehensive environment variables in .env.example', () => {
      const envExamplePath = path.join(projectRoot, '.env.example');
      const envContent = fs.readFileSync(envExamplePath, 'utf8');
      
      // Check for essential environment variables
      expect(envContent).toContain('NODE_ENV');
      expect(envContent).toContain('PORT');
      expect(envContent).toContain('DATABASE_URL');
      expect(envContent).toContain('POSTGRES_');
      expect(envContent).toContain('REDIS_');
      expect(envContent).toContain('JWT_SECRET');
    });

    it('should not have .env file in repository', () => {
      const envPath = path.join(projectRoot, '.env');
      expect(fs.existsSync(envPath)).toBe(false);
    });

    it('should have .env in .gitignore', () => {
      const gitignorePath = path.join(projectRoot, '.gitignore');
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
      expect(gitignoreContent).toContain('.env');
    });

    it('should have .env.dev file for development environment', () => {
      const envDevPath = path.join(projectRoot, '.env.dev');
      expect(fs.existsSync(envDevPath)).toBe(true);
      
      const envDevContent = fs.readFileSync(envDevPath, 'utf8');
      expect(envDevContent).toContain('NODE_ENV=development');
      expect(envDevContent).toContain('DATABASE_URL=postgresql');
      expect(envDevContent).toContain('REDIS_URL=redis');
      expect(envDevContent).toContain('VITE_API_URL');
      expect(envDevContent).toContain('ENABLE_SWAGGER=true');
      expect(envDevContent).toContain('ENABLE_DEBUG_LOGGING=true');
    });

    it('should be able to load environment variables from .env.example', () => {
      const envExamplePath = path.join(projectRoot, '.env.example');
      
      // Create a temporary .env file for testing
      const tempEnvPath = path.join(projectRoot, '.env.test');
      fs.copyFileSync(envExamplePath, tempEnvPath);
      
      try {
        const result = config({ path: tempEnvPath });
        expect(result.error).toBeUndefined();
        expect(result.parsed).toBeDefined();
        expect(Object.keys(result.parsed!).length).toBeGreaterThan(0);
      } finally {
        // Clean up temporary file
        if (fs.existsSync(tempEnvPath)) {
          fs.unlinkSync(tempEnvPath);
        }
      }
    });
  });

  describe('Git Version Control and Branching Strategy Setup', () => {
    it('should have Git initialized', () => {
      const gitPath = path.join(projectRoot, '.git');
      expect(fs.existsSync(gitPath)).toBe(true);
    });

    it('should have proper .gitignore file', () => {
      const gitignorePath = path.join(projectRoot, '.gitignore');
      expect(fs.existsSync(gitignorePath)).toBe(true);
      
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
      expect(gitignoreContent).toContain('node_modules');
      expect(gitignoreContent).toContain('.env');
      expect(gitignoreContent).toContain('*.log');
      expect(gitignoreContent).toContain('dist');
      expect(gitignoreContent).toContain('build');
    });

    it('should have Husky Git hooks configured', () => {
      const huskyPath = path.join(projectRoot, '.husky');
      expect(fs.existsSync(huskyPath)).toBe(true);
      
      const preCommitPath = path.join(huskyPath, 'pre-commit');
      const commitMsgPath = path.join(huskyPath, 'commit-msg');
      
      expect(fs.existsSync(preCommitPath)).toBe(true);
      expect(fs.existsSync(commitMsgPath)).toBe(true);
    });

    it('should have commit message linting configured', () => {
      const commitlintPath = path.join(projectRoot, '.commitlintrc.js');
      expect(fs.existsSync(commitlintPath)).toBe(true);
      
      const commitlintContent = fs.readFileSync(commitlintPath, 'utf8');
      expect(commitlintContent).toContain('extends');
      expect(commitlintContent).toContain('rules');
    });

    it('should have lint-staged configuration', () => {
      const lintStagedPath = path.join(projectRoot, '.lintstagedrc.js');
      expect(fs.existsSync(lintStagedPath)).toBe(true);
      
      const lintStagedContent = fs.readFileSync(lintStagedPath, 'utf8');
      expect(lintStagedContent).toContain('eslint');
      expect(lintStagedContent).toContain('prettier');
    });

    it('should have EditorConfig for consistent coding style', () => {
      const editorConfigPath = path.join(projectRoot, '.editorconfig');
      expect(fs.existsSync(editorConfigPath)).toBe(true);
      
      const editorConfigContent = fs.readFileSync(editorConfigPath, 'utf8');
      expect(editorConfigContent).toContain('root = true');
      expect(editorConfigContent).toContain('indent_style');
      expect(editorConfigContent).toContain('charset');
    });

    it('should have proper branch protection and workflow', () => {
      const githubPath = path.join(projectRoot, '.github');
      expect(fs.existsSync(githubPath)).toBe(true);
      
      const workflowsPath = path.join(githubPath, 'workflows');
      expect(fs.existsSync(workflowsPath)).toBe(true);
    });
  });

  describe('Development Environment Integration', () => {
    it('should have package manager configuration', () => {
      const pnpmrcPath = path.join(projectRoot, '.pnpmrc');
      const workspacePath = path.join(projectRoot, 'pnpm-workspace.yaml');
      
      expect(fs.existsSync(pnpmrcPath)).toBe(true);
      expect(fs.existsSync(workspacePath)).toBe(true);
    });

    it('should have proper workspace structure', () => {
      const backendPath = path.join(projectRoot, 'backend');
      const frontendPath = path.join(projectRoot, 'frontend');
      const docsPath = path.join(projectRoot, 'docs');
      
      expect(fs.existsSync(backendPath)).toBe(true);
      expect(fs.existsSync(frontendPath)).toBe(true);
      expect(fs.existsSync(docsPath)).toBe(true);
    });

    it('should have development scripts configured', () => {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      expect(packageJson.scripts).toBeDefined();
      expect(packageJson.scripts.dev || packageJson.scripts.start).toBeDefined();
      expect(packageJson.scripts.test).toBeDefined();
      expect(packageJson.scripts.build).toBeDefined();
    });

    it('should have Makefile for development workflow automation', () => {
      const makefilePath = path.join(projectRoot, 'Makefile');
      expect(fs.existsSync(makefilePath)).toBe(true);
      
      const makefileContent = fs.readFileSync(makefilePath, 'utf8');
      expect(makefileContent).toContain('dev:');
      expect(makefileContent).toContain('dev-build:');
      expect(makefileContent).toContain('dev-down:');
      expect(makefileContent).toContain('test:');
      expect(makefileContent).toContain('setup:');
      expect(makefileContent).toContain('health:');
      expect(makefileContent).toContain('dev-tools:');
    });

    it('should have proper development environment commands in Makefile', () => {
      const makefilePath = path.join(projectRoot, 'Makefile');
      const makefileContent = fs.readFileSync(makefilePath, 'utf8');
      
      // Check for essential development commands
      expect(makefileContent).toContain('docker compose -f docker-compose.yml -f docker-compose.dev.yml');
      expect(makefileContent).toContain('dev-logs:');
      expect(makefileContent).toContain('dev-shell-backend:');
      expect(makefileContent).toContain('dev-shell-frontend:');
      expect(makefileContent).toContain('db-migrate:');
      expect(makefileContent).toContain('monitor:');
    });
  });
});