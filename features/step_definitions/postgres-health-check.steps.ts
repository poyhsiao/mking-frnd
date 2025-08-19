import { Given, When, Then, Before, After } from '@cucumber/cucumber';
import { expect } from 'chai';
import { execSync, spawn } from 'child_process';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';

// Types for Docker Compose configuration
interface HealthCheck {
  test: string | string[];
  interval?: string;
  timeout?: string;
  retries?: number;
  start_period?: string;
}

interface Service {
  image?: string;
  environment?: Record<string, string>;
  healthcheck?: HealthCheck;
  [key: string]: any;
}

interface DockerComposeConfig {
  services: Record<string, Service>;
  [key: string]: any;
}

// Global variables for test context
let dockerComposeConfig: DockerComposeConfig;
let containerStatus: string;
let containerLogs: string;
const projectRoot = process.cwd();
const dockerComposeFile = path.join(projectRoot, 'docker-compose.test.yml');

// Helper functions
function loadDockerComposeConfig(): DockerComposeConfig {
  const fileContent = fs.readFileSync(dockerComposeFile, 'utf8');
  return yaml.load(fileContent) as DockerComposeConfig;
}

function executeCommand(command: string): string {
  try {
    return execSync(command, { encoding: 'utf8', cwd: projectRoot });
  } catch (error: any) {
    throw new Error(`Command failed: ${command}\nError: ${error.message}`);
  }
}

function getContainerStatus(serviceName: string): string {
  try {
    const output = executeCommand(`docker compose -f ${dockerComposeFile} ps --format json`);
    const containers = output.split('\n').filter(line => line.trim()).map(line => JSON.parse(line));
    const container = containers.find(c => c.Service === serviceName);
    return container ? container.Health || container.State : 'not found';
  } catch (error) {
    return 'error';
  }
}

function waitForContainerHealth(serviceName: string, expectedStatus: string, timeoutMs: number = 60000): Promise<boolean> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const checkInterval = 2000; // Check every 2 seconds
    
    const checkHealth = () => {
      const status = getContainerStatus(serviceName);
      
      if (status === expectedStatus) {
        resolve(true);
        return;
      }
      
      if (Date.now() - startTime > timeoutMs) {
        resolve(false);
        return;
      }
      
      setTimeout(checkHealth, checkInterval);
    };
    
    checkHealth();
  });
}

// Before and After hooks
Before(function() {
  // Ensure clean state before each scenario
  try {
    executeCommand(`docker compose -f ${dockerComposeFile} down -v`);
  } catch (error) {
    // Ignore errors if containers are not running
  }
});

After(function() {
  // Clean up after each scenario
  try {
    executeCommand(`docker compose -f ${dockerComposeFile} down -v`);
  } catch (error) {
    // Ignore errors during cleanup
  }
});

// Step definitions
Given('the docker-compose.test.yml file exists', function() {
  expect(fs.existsSync(dockerComposeFile)).to.be.true;
});

Given('the PostgreSQL test environment variables are set', function() {
  const requiredEnvVars = ['POSTGRES_TEST_DB', 'POSTGRES_TEST_USER', 'POSTGRES_TEST_PASSWORD'];
  
  for (const envVar of requiredEnvVars) {
    expect(process.env[envVar], `Environment variable ${envVar} should be set`).to.not.be.undefined;
  }
});

Given('the postgres-test service is defined in docker-compose.test.yml', function() {
  dockerComposeConfig = loadDockerComposeConfig();
  expect(dockerComposeConfig.services).to.have.property('postgres-test');
});

When('I examine the health check configuration', function() {
  dockerComposeConfig = loadDockerComposeConfig();
  const postgresService = dockerComposeConfig.services['postgres-test'];
  expect(postgresService).to.have.property('healthcheck');
});

Then('the health check command should use {string} environment variable', function(envVar: string) {
  const postgresService = dockerComposeConfig.services['postgres-test'];
  const healthCheck = postgresService.healthcheck;
  
  expect(healthCheck).to.not.be.undefined;
  
  const testCommand = Array.isArray(healthCheck!.test) ? healthCheck!.test.join(' ') : healthCheck!.test;
  expect(testCommand).to.include(`\${${envVar}}`);
});

Then('the health check should not contain hardcoded database names', function() {
  const postgresService = dockerComposeConfig.services['postgres-test'];
  const healthCheck = postgresService.healthcheck;
  
  const testCommand = Array.isArray(healthCheck!.test) ? healthCheck!.test.join(' ') : healthCheck!.test;
  
  // Check for common hardcoded database names
  const hardcodedNames = ['mking_test', 'test_db', 'testdb'];
  for (const name of hardcodedNames) {
    expect(testCommand).to.not.include(name, `Health check should not contain hardcoded database name: ${name}`);
  }
});

Given('the postgres-test service configuration is correct', function() {
  dockerComposeConfig = loadDockerComposeConfig();
  const postgresService = dockerComposeConfig.services['postgres-test'];
  
  // Verify the service has proper configuration
  expect(postgresService).to.have.property('image');
  expect(postgresService).to.have.property('healthcheck');
  expect(postgresService.healthcheck).to.have.property('test');
});

When('I start the postgres-test container using docker compose', function() {
  try {
    executeCommand(`docker compose -f ${dockerComposeFile} up -d postgres-test`);
  } catch (error: any) {
    throw new Error(`Failed to start postgres-test container: ${error.message}`);
  }
});

Then('the container should start without errors', function() {
  // Wait a moment for container to initialize
  const status = getContainerStatus('postgres-test');
  expect(status).to.not.equal('error');
  expect(status).to.not.equal('not found');
});

Then('the health check should pass within the timeout period', async function() {
  const healthCheckPassed = await waitForContainerHealth('postgres-test', 'healthy', 60000);
  expect(healthCheckPassed).to.be.true;
});

Then('the container status should be {string}', function(expectedStatus: string) {
  containerStatus = getContainerStatus('postgres-test');
  expect(containerStatus).to.equal(expectedStatus);
});

Given('the postgres-test service has an incorrect database name in health check', function() {
  // This step assumes we're testing the current broken configuration
  dockerComposeConfig = loadDockerComposeConfig();
  const postgresService = dockerComposeConfig.services['postgres-test'];
  const healthCheck = postgresService.healthcheck;
  
  const testCommand = Array.isArray(healthCheck!.test) ? healthCheck!.test.join(' ') : healthCheck!.test;
  
  // Verify it contains hardcoded database name (this should fail after we fix it)
  expect(testCommand).to.include('mking_test');
});

Then('the health check should fail', async function() {
  // Wait for health check to fail
  const healthCheckFailed = await waitForContainerHealth('postgres-test', 'unhealthy', 30000);
  expect(healthCheckFailed).to.be.true;
});

Then('the container logs should show connection errors', function() {
  try {
    containerLogs = executeCommand(`docker compose -f ${dockerComposeFile} logs postgres-test`);
    // Look for PostgreSQL connection or database errors
    expect(containerLogs).to.match(/(FATAL|ERROR|connection|database)/i);
  } catch (error) {
    // If we can't get logs, that's also an indication of problems
    expect.fail('Could not retrieve container logs');
  }
});

Given('the GitHub Actions workflow is running', function() {
  // This step is mainly for documentation - in real CI this would be automatic
  expect(process.env.CI).to.not.be.undefined;
});

Given('the postgres-test container is started', function() {
  executeCommand(`docker compose -f ${dockerComposeFile} up -d postgres-test`);
});

When('the check_container_health function is called', function() {
  // Simulate the GitHub Actions health check function
  containerStatus = getContainerStatus('postgres-test');
});

Then('it should detect the container as {string}', function(expectedStatus: string) {
  expect(containerStatus).to.equal(expectedStatus);
});

Then('the e2e tests should be able to proceed', function() {
  // Verify that the database is actually accessible
  expect(containerStatus).to.equal('healthy');
});

Given('the postgres-test service health check configuration', function() {
  dockerComposeConfig = loadDockerComposeConfig();
  const postgresService = dockerComposeConfig.services['postgres-test'];
  expect(postgresService).to.have.property('healthcheck');
});

When('I examine the timeout settings', function() {
  // Configuration is already loaded in the Given step
});

Then('the interval should be reasonable \({int}s or less\)', function(maxSeconds: number) {
  const postgresService = dockerComposeConfig.services['postgres-test'];
  const healthCheck = postgresService.healthcheck!;
  
  if (healthCheck.interval) {
    const intervalSeconds = parseInt(healthCheck.interval.replace('s', ''));
    expect(intervalSeconds).to.be.at.most(maxSeconds);
  }
});

Then('the timeout should be reasonable \({int}s or less\)', function(maxSeconds: number) {
  const postgresService = dockerComposeConfig.services['postgres-test'];
  const healthCheck = postgresService.healthcheck!;
  
  if (healthCheck.timeout) {
    const timeoutSeconds = parseInt(healthCheck.timeout.replace('s', ''));
    expect(timeoutSeconds).to.be.at.most(maxSeconds);
  }
});

Then('the retries should be sufficient \(at least {int}\)', function(minRetries: number) {
  const postgresService = dockerComposeConfig.services['postgres-test'];
  const healthCheck = postgresService.healthcheck!;
  
  expect(healthCheck.retries).to.be.at.least(minRetries);
});

Then('the start_period should allow for container initialization \(at least {int}s\)', function(minSeconds: number) {
  const postgresService = dockerComposeConfig.services['postgres-test'];
  const healthCheck = postgresService.healthcheck!;
  
  if (healthCheck.start_period) {
    const startPeriodSeconds = parseInt(healthCheck.start_period.replace('s', ''));
    expect(startPeriodSeconds).to.be.at.least(minSeconds);
  }
});

Given('all test environment variables are properly set', function() {
  const requiredEnvVars = [
    'POSTGRES_TEST_DB',
    'POSTGRES_TEST_USER', 
    'POSTGRES_TEST_PASSWORD',
    'POSTGRES_TEST_HOST',
    'POSTGRES_TEST_PORT'
  ];
  
  for (const envVar of requiredEnvVars) {
    expect(process.env[envVar], `Environment variable ${envVar} should be set`).to.not.be.undefined;
  }
});

Given('the docker-compose.test.yml file is configured correctly', function() {
  dockerComposeConfig = loadDockerComposeConfig();
  const postgresService = dockerComposeConfig.services['postgres-test'];
  
  // Verify all required configuration is present
  expect(postgresService).to.have.property('image');
  expect(postgresService).to.have.property('environment');
  expect(postgresService).to.have.property('healthcheck');
  
  // Verify health check uses environment variables
  const healthCheck = postgresService.healthcheck!;
  const testCommand = Array.isArray(healthCheck.test) ? healthCheck.test.join(' ') : healthCheck.test;
  expect(testCommand).to.include('${POSTGRES_TEST_DB}');
});

When('I run the complete e2e test workflow', function() {
  // Start all required services
  executeCommand(`docker compose -f ${dockerComposeFile} up -d`);
});

Then('the postgres-test container should start successfully', function() {
  const status = getContainerStatus('postgres-test');
  expect(status).to.not.equal('error');
  expect(status).to.not.equal('not found');
});

Then('the health check should pass consistently', async function() {
  // Wait for health check to pass and verify it stays healthy
  const healthCheckPassed = await waitForContainerHealth('postgres-test', 'healthy', 60000);
  expect(healthCheckPassed).to.be.true;
  
  // Wait a bit more and check again to ensure consistency
  await new Promise(resolve => setTimeout(resolve, 5000));
  const finalStatus = getContainerStatus('postgres-test');
  expect(finalStatus).to.equal('healthy');
});

Then('the e2e tests should complete without database connection errors', function() {
  // This would typically run actual e2e tests, but for now we'll just verify the container is healthy
  const status = getContainerStatus('postgres-test');
  expect(status).to.equal('healthy');
  
  // Verify we can get logs without errors
  const logs = executeCommand(`docker compose -f ${dockerComposeFile} logs postgres-test`);
  expect(logs).to.not.include('FATAL');
  expect(logs).to.not.include('ERROR');
});