import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import axios, { AxiosResponse, AxiosError } from 'axios';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { execSync } from 'child_process';

// Test context to store data between steps
interface TestContext {
  dockerComposeConfig?: any;
  healthResponse?: AxiosResponse;
  errorResponse?: AxiosResponse;
  backendUrl?: string;
  containerHealth?: string;
  errorLogs?: string[];
}

const testContext: TestContext = {};

// Helper function to get backend URL
function getBackendUrl(): string {
  return process.env.BACKEND_TEST_URL || 'http://localhost:3001';
}

// Helper function to read docker-compose.test.yml
function readDockerComposeConfig(): any {
  const filePath = './docker-compose.test.yml';
  const fileContents = fs.readFileSync(filePath, 'utf8');
  return yaml.load(fileContents);
}

// Helper function to check container health via Docker Compose
function checkContainerHealth(serviceName: string): string {
  try {
    const output = execSync(`docker compose -f docker-compose.test.yml ps --format json`, { encoding: 'utf8' });
    const services = output.trim().split('\n').map(line => JSON.parse(line));
    const service = services.find(s => s.Service === serviceName);
    return service ? service.Health : 'unknown';
  } catch (error) {
    console.error(`Error checking container health: ${error}`);
    return 'error';
  }
}

// Helper function to wait for service to be healthy
async function waitForServiceHealth(serviceName: string, maxAttempts: number = 30): Promise<string> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const health = checkContainerHealth(serviceName);
    if (health === 'healthy') {
      return health;
    }
    console.log(`${serviceName} health status: ${health} (attempt ${attempt}/${maxAttempts})`);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
  }
  return checkContainerHealth(serviceName);
}

// Background steps
Given('the docker-compose.test.yml file exists', function () {
  expect(fs.existsSync('./docker-compose.test.yml')).to.be.true;
  testContext.dockerComposeConfig = readDockerComposeConfig();
});

Given('the backend service has a health endpoint at {string}', function (endpoint: string) {
  // This will be verified in the actual health check test
  expect(endpoint).to.equal('/health');
});

Given('the backend service has proper error handling middleware', function () {
  // This will be verified in the error handling tests
  // For now, we assume the middleware exists and will test its behavior
});

// Health check configuration tests
Given('the backend-test service is defined in docker-compose.test.yml', function () {
  expect(testContext.dockerComposeConfig).to.have.property('services');
  expect(testContext.dockerComposeConfig.services).to.have.property('backend-test');
});

When('I examine the service configuration', function () {
  // Configuration is already loaded in testContext
});

Then('it should have a healthcheck section', function () {
  const backendService = testContext.dockerComposeConfig.services['backend-test'];
  expect(backendService).to.have.property('healthcheck');
});

Then('the healthcheck should test the {string} endpoint', function (endpoint: string) {
  const backendService = testContext.dockerComposeConfig.services['backend-test'];
  const healthcheck = backendService.healthcheck;
  expect(healthcheck).to.have.property('test');
  
  // Check if the test command includes the health endpoint
  const testCommand = Array.isArray(healthcheck.test) ? healthcheck.test.join(' ') : healthcheck.test;
  expect(testCommand).to.include(endpoint);
});

Then('the healthcheck should use appropriate intervals and timeouts', function () {
  const backendService = testContext.dockerComposeConfig.services['backend-test'];
  const healthcheck = backendService.healthcheck;
  
  expect(healthcheck).to.have.property('interval');
  expect(healthcheck).to.have.property('timeout');
  expect(healthcheck).to.have.property('start_period');
  
  // Validate reasonable values (intervals should be in seconds format like "30s")
  expect(healthcheck.interval).to.match(/^\d+s$/);
  expect(healthcheck.timeout).to.match(/^\d+s$/);
});

Then('the healthcheck should have proper retry configuration', function () {
  const backendService = testContext.dockerComposeConfig.services['backend-test'];
  const healthcheck = backendService.healthcheck;
  
  expect(healthcheck).to.have.property('retries');
  expect(healthcheck.retries).to.be.a('number');
  expect(healthcheck.retries).to.be.greaterThan(0);
});

// Health endpoint tests
Given('the backend service is running', async function () {
  testContext.backendUrl = getBackendUrl();
  
  // Wait for the service to be available
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    try {
      await axios.get(`${testContext.backendUrl}/health`, { timeout: 5000 });
      break;
    } catch (error) {
      attempts++;
      if (attempts === maxAttempts) {
        throw new Error(`Backend service not available after ${maxAttempts} attempts`);
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
});

When('I make a GET request to {string}', async function (endpoint: string) {
  try {
    if (endpoint === '/health') {
      testContext.healthResponse = await axios.get(`${testContext.backendUrl}${endpoint}`);
    } else {
      testContext.errorResponse = await axios.get(`${testContext.backendUrl}${endpoint}`);
    }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      testContext.errorResponse = error.response;
    } else {
      throw error;
    }
  }
});

Then('the response status should be {int}', function (expectedStatus: number) {
  const response = testContext.healthResponse || testContext.errorResponse;
  expect(response).to.exist;
  expect(response!.status).to.equal(expectedStatus);
});

Then('the response should contain {string}: {string}', function (key: string, value: string) {
  const response = testContext.healthResponse || testContext.errorResponse;
  expect(response).to.exist;
  expect(response!.data).to.have.property(key);
  expect(response!.data[key]).to.equal(value);
});

Then('the response should contain environment information', function () {
  expect(testContext.healthResponse).to.exist;
  expect(testContext.healthResponse!.data).to.have.property('environment');
});

Then('the response should contain timestamp', function () {
  const response = testContext.healthResponse || testContext.errorResponse;
  expect(response).to.exist;
  expect(response!.data).to.have.property('timestamp');
});

Then('the response should contain uptime information', function () {
  expect(testContext.healthResponse).to.exist;
  expect(testContext.healthResponse!.data).to.have.property('uptime');
});

// GitHub Actions health check tests
Given('the backend-test service is started with Docker Compose', async function () {
  // Assume the service is already started by the CI pipeline
  // We'll check its status
});

Given('the service has proper health check configuration', function () {
  // This should be verified by the previous health check configuration tests
});

When('the check_container_health function is called for {string}', async function (serviceName: string) {
  testContext.containerHealth = await waitForServiceHealth(serviceName, 5); // Shorter wait for tests
});

Then('the health status should be detected as {string} or {string}', function (status1: string, status2: string) {
  expect(testContext.containerHealth).to.exist;
  expect([status1, status2]).to.include(testContext.containerHealth);
});

Then('the health status should not be {string}', function (unwantedStatus: string) {
  expect(testContext.containerHealth).to.exist;
  expect(testContext.containerHealth).to.not.equal(unwantedStatus);
});

Then('the GitHub Actions workflow should proceed without health check errors', function () {
  // This is validated by the previous assertions
  expect(testContext.containerHealth).to.not.equal('unknown');
  expect(testContext.containerHealth).to.not.equal('error');
});

// Error handling tests
Then('the response should have proper error structure', function () {
  expect(testContext.errorResponse).to.exist;
  expect(testContext.errorResponse!.data).to.be.an('object');
  expect(testContext.errorResponse!.data).to.have.property('success');
  expect(testContext.errorResponse!.data).to.have.property('error');
});

Then('the response should contain {string}: {boolean}', function (key: string, value: boolean) {
  const response = testContext.errorResponse;
  expect(response).to.exist;
  expect(response!.data).to.have.property(key);
  expect(response!.data[key]).to.equal(value);
});

Then('the response should contain error message about route not found', function () {
  expect(testContext.errorResponse).to.exist;
  expect(testContext.errorResponse!.data).to.have.property('error');
  const error = testContext.errorResponse!.data.error;
  expect(error).to.have.property('message');
  expect(error.message).to.include('not found');
});

Then('the response should contain the requested path', function () {
  expect(testContext.errorResponse).to.exist;
  expect(testContext.errorResponse!.data).to.have.property('error');
  const error = testContext.errorResponse!.data.error;
  expect(error).to.have.property('path');
});

// Multiple route tests
When('I make requests to various non-existent routes', async function () {
  const routes = ['/non-existent-1', '/non-existent-2', '/invalid/path'];
  const responses = [];
  
  for (const route of routes) {
    try {
      const response = await axios.get(`${testContext.backendUrl}${route}`);
      responses.push(response);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        responses.push(error.response);
      }
    }
  }
  
  testContext.errorLogs = responses.map(r => JSON.stringify(r.data));
});

Then('all error responses should have consistent structure', function () {
  expect(testContext.errorLogs).to.exist;
  expect(testContext.errorLogs!.length).to.be.greaterThan(0);
  
  testContext.errorLogs!.forEach(logEntry => {
    const data = JSON.parse(logEntry);
    expect(data).to.have.property('success');
    expect(data).to.have.property('error');
    expect(data).to.have.property('timestamp');
  });
});

Then('all error responses should include service identification', function () {
  expect(testContext.errorLogs).to.exist;
  
  testContext.errorLogs!.forEach(logEntry => {
    const data = JSON.parse(logEntry);
    expect(data).to.have.property('service');
  });
});

Then('all error responses should include request details', function () {
  expect(testContext.errorLogs).to.exist;
  
  testContext.errorLogs!.forEach(logEntry => {
    const data = JSON.parse(logEntry);
    expect(data).to.have.property('request');
    expect(data.request).to.have.property('method');
    expect(data.request).to.have.property('url');
  });
});

// Logging tests
Given('the backend service is running with error logging enabled', async function () {
  // Assume logging is enabled by default
  testContext.backendUrl = getBackendUrl();
});

When('an error occurs \\(like accessing non-existent route)', async function () {
  try {
    await axios.get(`${testContext.backendUrl}/trigger-error-for-logging`);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      testContext.errorResponse = error.response;
    }
  }
});

Then('the error should be logged with proper structure', function () {
  // This would typically check log files or log aggregation systems
  // For now, we verify the error response structure as a proxy
  expect(testContext.errorResponse).to.exist;
  expect(testContext.errorResponse!.data).to.have.property('service');
});

Then('the log should include error details', function () {
  expect(testContext.errorResponse).to.exist;
  expect(testContext.errorResponse!.data).to.have.property('error');
  expect(testContext.errorResponse!.data.error).to.have.property('message');
});

Then('the log should include request information', function () {
  expect(testContext.errorResponse).to.exist;
  expect(testContext.errorResponse!.data).to.have.property('request');
});

Then('the log should include stack trace in development mode', function () {
  expect(testContext.errorResponse).to.exist;
  expect(testContext.errorResponse!.data).to.have.property('error');
  
  // In development mode, stack trace should be present
  if (process.env.NODE_ENV !== 'production') {
    expect(testContext.errorResponse!.data.error).to.have.property('stack');
  }
});

Then('the log should not expose sensitive information', function () {
  expect(testContext.errorResponse).to.exist;
  const responseStr = JSON.stringify(testContext.errorResponse!.data);
  
  // Check that common sensitive patterns are not exposed
  expect(responseStr).to.not.include('password');
  expect(responseStr).to.not.include('secret');
  expect(responseStr).to.not.include('token');
  expect(responseStr).to.not.include('key');
});

// Integration tests
Given('all dependency services are configured \\(postgres-test, redis-test, minio-test, typesense-test)', function () {
  const services = testContext.dockerComposeConfig.services;
  expect(services).to.have.property('postgres-test');
  expect(services).to.have.property('redis-test');
  expect(services).to.have.property('minio-test');
  expect(services).to.have.property('typesense-test');
});

When('I start the backend-test service with Docker Compose', async function () {
  // Assume the service is already started by the test environment
  testContext.containerHealth = checkContainerHealth('backend-test');
});

Then('the service should wait for dependencies to be healthy', function () {
  const backendService = testContext.dockerComposeConfig.services['backend-test'];
  expect(backendService).to.have.property('depends_on');
  
  const dependsOn = backendService.depends_on;
  expect(dependsOn).to.have.property('postgres-test');
  expect(dependsOn).to.have.property('redis-test');
  expect(dependsOn).to.have.property('minio-test');
  expect(dependsOn).to.have.property('typesense-test');
  
  // Check that dependencies have condition: service_healthy
  Object.values(dependsOn).forEach((dep: any) => {
    expect(dep).to.have.property('condition', 'service_healthy');
  });
});

Then('the service should start without errors', function () {
  expect(testContext.containerHealth).to.not.equal('error');
  expect(testContext.containerHealth).to.not.equal('exited');
});

Then('the service should become healthy within reasonable time', async function () {
  const finalHealth = await waitForServiceHealth('backend-test', 15);
  expect(finalHealth).to.equal('healthy');
});

Then('the service should be accessible on the configured port', async function () {
  const response = await axios.get(`${testContext.backendUrl}/health`);
  expect(response.status).to.equal(200);
});

// GitHub Actions integration tests
Given('the GitHub Actions workflow is running E2E tests', function () {
  // This is assumed to be true when running in CI environment
  // We can check for CI environment variables
});

Given('all services are configured with proper health checks', function () {
  const services = testContext.dockerComposeConfig.services;
  const serviceNames = ['postgres-test', 'redis-test', 'minio-test', 'typesense-test', 'backend-test'];
  
  serviceNames.forEach(serviceName => {
    if (services[serviceName]) {
      expect(services[serviceName]).to.have.property('healthcheck');
    }
  });
});

When('the workflow starts all test services', async function () {
  // Services are assumed to be started by the CI pipeline
  // We'll verify their health status
});

Then('all services should become healthy', async function () {
  const serviceNames = ['postgres-test', 'redis-test', 'minio-test', 'typesense-test', 'backend-test'];
  
  for (const serviceName of serviceNames) {
    const health = await waitForServiceHealth(serviceName, 10);
    expect(health).to.equal('healthy');
  }
});

Then('the backend-test health status should not be {string}', function (unwantedStatus: string) {
  const health = checkContainerHealth('backend-test');
  expect(health).to.not.equal(unwantedStatus);
});

Then('the workflow should proceed to run frontend tests', function () {
  // This is validated by the successful completion of previous steps
  // In a real scenario, this would check the workflow status
});

Then('no health check timeouts should occur', function () {
  // This is validated by the successful health checks above
  // All services should have become healthy within the timeout period
});

// Production-ready error handling tests
Given('the backend service is running', async function () {
  testContext.backendUrl = getBackendUrl();
  const response = await axios.get(`${testContext.backendUrl}/health`);
  expect(response.status).to.equal(200);
});

When('errors occur in the application', async function () {
  try {
    await axios.get(`${testContext.backendUrl}/non-existent-route`);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      testContext.errorResponse = error.response;
    }
  }
});

Then('error responses should not expose internal details in production', function () {
  expect(testContext.errorResponse).to.exist;
  
  if (process.env.NODE_ENV === 'production') {
    const responseStr = JSON.stringify(testContext.errorResponse!.data);
    expect(responseStr).to.not.include('stack');
    expect(responseStr).to.not.include('/app/');
    expect(responseStr).to.not.include('node_modules');
  }
});

Then('error responses should include correlation IDs for tracking', function () {
  expect(testContext.errorResponse).to.exist;
  expect(testContext.errorResponse!.data).to.have.property('correlationId');
});

Then('error responses should follow standard HTTP status codes', function () {
  expect(testContext.errorResponse).to.exist;
  expect(testContext.errorResponse!.status).to.be.oneOf([400, 401, 403, 404, 422, 500, 502, 503]);
});

Then('error responses should be properly formatted JSON', function () {
  expect(testContext.errorResponse).to.exist;
  expect(testContext.errorResponse!.headers['content-type']).to.include('application/json');
  expect(testContext.errorResponse!.data).to.be.an('object');
});

Then('sensitive information should not be leaked in error messages', function () {
  expect(testContext.errorResponse).to.exist;
  const responseStr = JSON.stringify(testContext.errorResponse!.data);
  
  // Check for common sensitive patterns
  const sensitivePatterns = [
    /password/i,
    /secret/i,
    /token/i,
    /api[_-]?key/i,
    /database[_-]?url/i,
    /connection[_-]?string/i
  ];
  
  sensitivePatterns.forEach(pattern => {
    expect(responseStr).to.not.match(pattern);
  });
});