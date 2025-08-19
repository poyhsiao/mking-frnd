import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import * as yaml from 'js-yaml';

/**
 * BDD Test Suite: Docker Compose Integration Tests Configuration
 *
 * This test suite validates the Docker Compose test configuration
 * to prevent mounting errors and ensure proper test environment setup.
 *
 * Background:
 * - GitHub Actions was failing with "failed to create mountpoint" error
 * - The error occurred because database directories didn't exist
 * - Volume mounting requires proper directory structure and permissions
 */
describe('Docker Compose Integration Tests Configuration', () => {
  const projectRoot = process.cwd();
  const dockerComposeTestFile = path.join(projectRoot, 'docker-compose.test.yml');
  let dockerComposeConfig: any;

  beforeAll(() => {
    // Load and parse docker-compose.test.yml
    const dockerComposeContent = fs.readFileSync(dockerComposeTestFile, 'utf8');
    dockerComposeConfig = yaml.load(dockerComposeContent);
  });

  describe('Feature: Database Volume Mounting', () => {
    describe('Scenario: PostgreSQL test container configuration', () => {
      it('should have postgres-test service defined', () => {
        expect(dockerComposeConfig.services).toBeDefined();
        expect(dockerComposeConfig.services['postgres-test']).toBeDefined();
      });

      it('should use PostgreSQL 15 Alpine image', () => {
        const postgresService = dockerComposeConfig.services['postgres-test'];
        expect(postgresService.image).toBe('postgres:15-alpine');
      });

      it('should have proper environment variables configured', () => {
        const postgresService = dockerComposeConfig.services['postgres-test'];
        expect(postgresService.environment).toBeDefined();
        expect(postgresService.environment.POSTGRES_DB).toBeDefined();
        expect(postgresService.environment.POSTGRES_USER).toBeDefined();
        expect(postgresService.environment.POSTGRES_PASSWORD).toBeDefined();
      });

      it('should have volume mounts configured', () => {
        const postgresService = dockerComposeConfig.services['postgres-test'];
        expect(postgresService.volumes).toBeDefined();
        expect(Array.isArray(postgresService.volumes)).toBe(true);
        expect(postgresService.volumes.length).toBeGreaterThan(0);
      });

      it('should mount database initialization directory', () => {
        const postgresService = dockerComposeConfig.services['postgres-test'];
        const initMount = postgresService.volumes.find(
          (volume: string) =>
            volume.includes('/docker-entrypoint-initdb.d') && !volume.includes('seeds'),
        );
        expect(initMount).toBeDefined();
        expect(initMount).toContain('./database/init:/docker-entrypoint-initdb.d:ro');
      });

      it('should not mount separate test seeds directory (consolidated into init)', () => {
        const postgresService = dockerComposeConfig.services['postgres-test'];
        const seedsMount = postgresService.volumes.find((volume: string) =>
          volume.includes('test-seeds'),
        );
        expect(seedsMount).toBeUndefined();
      });
    });

    describe('Scenario: Required directories exist', () => {
      it('should have database directory', () => {
        const databaseDir = path.join(projectRoot, 'database');
        expect(fs.existsSync(databaseDir)).toBe(true);
        expect(fs.statSync(databaseDir).isDirectory()).toBe(true);
      });

      it('should have database/init directory', () => {
        const initDir = path.join(projectRoot, 'database', 'init');
        expect(fs.existsSync(initDir)).toBe(true);
        expect(fs.statSync(initDir).isDirectory()).toBe(true);
      });

      it('should not have separate test-seeds directory (consolidated into init)', () => {
        const seedsDir = path.join(projectRoot, 'database', 'test-seeds');
        expect(fs.existsSync(seedsDir)).toBe(false);
      });

      it('should have initialization SQL files', () => {
        const initDir = path.join(projectRoot, 'database', 'init');
        const files = fs.readdirSync(initDir);
        const sqlFiles = files.filter(file => file.endsWith('.sql'));
        expect(sqlFiles.length).toBeGreaterThan(0);
      });

      it('should have test seed SQL files in init directory', () => {
        const initDir = path.join(projectRoot, 'database', 'init');
        const files = fs.readdirSync(initDir);
        const sqlFiles = files.filter(file => file.endsWith('.sql'));
        expect(sqlFiles.length).toBeGreaterThanOrEqual(2);
        expect(sqlFiles.some(file => file.includes('test') || file.includes('seed'))).toBe(true);
      });
    });

    describe('Scenario: SQL files are valid', () => {
      it('should have valid SQL syntax in init files', () => {
        const initDir = path.join(projectRoot, 'database', 'init');
        const files = fs.readdirSync(initDir).filter(file => file.endsWith('.sql'));

        files.forEach(file => {
          const filePath = path.join(initDir, file);
          const content = fs.readFileSync(filePath, 'utf8');

          // Basic SQL validation
          expect(content.trim()).not.toBe('');
          expect(content).not.toContain('syntax error');

          // Should contain PostgreSQL-specific commands
          expect(
            content.includes('CREATE') || content.includes('INSERT') || content.includes('SELECT'),
          ).toBe(true);
        });
      });

      it('should have valid SQL syntax in all init files including test data', () => {
        const initDir = path.join(projectRoot, 'database', 'init');
        const files = fs.readdirSync(initDir).filter(file => file.endsWith('.sql'));

        files.forEach(file => {
          const filePath = path.join(initDir, file);
          const content = fs.readFileSync(filePath, 'utf8');

          // Basic SQL validation
          expect(content.trim()).not.toBe('');
          expect(content).not.toContain('syntax error');

          // Should contain SQL operations
          expect(
            content.includes('INSERT') ||
              content.includes('CREATE') ||
              content.includes('UPDATE') ||
              content.includes('SELECT'),
          ).toBe(true);
        });
      });
    });
  });

  describe('Feature: Docker Compose Test Environment', () => {
    describe('Scenario: Service dependencies', () => {
      it('should have test network defined', () => {
        expect(dockerComposeConfig.networks).toBeDefined();
        expect(dockerComposeConfig.networks['test-network']).toBeDefined();
      });

      it('should have health checks configured', () => {
        const postgresService = dockerComposeConfig.services['postgres-test'];
        expect(postgresService.healthcheck).toBeDefined();
        expect(postgresService.healthcheck.test).toBeDefined();
        expect(postgresService.healthcheck.interval).toBeDefined();
        expect(postgresService.healthcheck.timeout).toBeDefined();
        expect(postgresService.healthcheck.retries).toBeDefined();
      });

      it('should use tmpfs for faster testing', () => {
        const postgresService = dockerComposeConfig.services['postgres-test'];
        expect(postgresService.tmpfs).toBeDefined();
        expect(Array.isArray(postgresService.tmpfs)).toBe(true);
      });

      it('should use non-conflicting ports', () => {
        const postgresService = dockerComposeConfig.services['postgres-test'];
        expect(postgresService.ports).toBeDefined();
        expect(postgresService.ports[0]).toBe('5433:5432');
      });
    });

    describe('Scenario: Backend test service configuration', () => {
      it('should have backend-test service defined', () => {
        expect(dockerComposeConfig.services['backend-test']).toBeDefined();
      });

      it('should depend on postgres-test service', () => {
        const backendService = dockerComposeConfig.services['backend-test'];
        if (backendService && backendService.depends_on) {
          expect(
            Array.isArray(backendService.depends_on)
              ? backendService.depends_on.includes('postgres-test')
              : backendService.depends_on['postgres-test'] !== undefined,
          ).toBe(true);
        }
      });
    });
  });

  describe('Feature: Docker Compose Validation', () => {
    describe('Scenario: Configuration file validation', () => {
      it('should be valid YAML', () => {
        expect(() => {
          const content = fs.readFileSync(dockerComposeTestFile, 'utf8');
          yaml.load(content);
        }).not.toThrow();
      });

      it('should have valid Docker Compose version', () => {
        expect(dockerComposeConfig.version).toBeDefined();
        expect(dockerComposeConfig.version).toMatch(/^3\.[0-9]+$/);
      });

      it('should validate with docker-compose config command', () => {
        expect(() => {
          // Set required environment variables for validation
          const env = {
            ...process.env,
            POSTGRES_TEST_PASSWORD: 'test_password',
            MINIO_TEST_USER: 'test_user',
            MINIO_TEST_PASSWORD: 'test_password',
            TYPESENSE_TEST_API_KEY: 'test_api_key',
          };

          execSync('docker-compose -f docker-compose.test.yml config', {
            cwd: projectRoot,
            env,
            stdio: 'pipe',
          });
        }).not.toThrow();
      });
    });
  });
});
