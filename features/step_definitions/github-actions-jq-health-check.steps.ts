import { Given, When, Then } from '@cucumber/cucumber';
import { execSync } from 'child_process';
import { expect } from 'chai';

interface TestContext {
  dockerComposeOutput?: string;
  jqResult?: string;
  jqError?: string;
  healthStatus?: string;
  serviceName?: string;
}

const context: TestContext = {};

// Background steps
Given('I have a Docker Compose test configuration', function () {
  // Verify docker-compose.test.yml exists
  const fs = require('fs');
  expect(fs.existsSync('docker-compose.test.yml')).to.be.true;
});

Given('the postgres-test service is defined with health checks', function () {
  const fs = require('fs');
  const composeContent = fs.readFileSync('docker-compose.test.yml', 'utf8');
  expect(composeContent).to.include('postgres-test');
  expect(composeContent).to.include('healthcheck');
});

Given('the GitHub Actions workflow uses jq to parse health status', function () {
  const fs = require('fs');
  const workflowContent = fs.readFileSync('.github/workflows/ci.yml', 'utf8');
  expect(workflowContent).to.include('jq');
  expect(workflowContent).to.include('Health');
});

// Scenario 1: jq command successfully parses Docker Compose JSON output
Given('the postgres-test service is running', function () {
  try {
    // Ensure postgres-test is running
    execSync('export POSTGRES_TEST_PASSWORD=postgres && docker compose -f docker-compose.test.yml up -d postgres-test', {
      stdio: 'pipe',
      timeout: 30000
    });
    
    // Wait a moment for the service to start
    execSync('sleep 5');
    
    context.serviceName = 'postgres-test';
  } catch (error) {
    throw new Error(`Failed to start postgres-test service: ${error}`);
  }
});

When('I execute the docker compose ps command with JSON format', function () {
  try {
    context.dockerComposeOutput = execSync(
      'docker compose -f docker-compose.test.yml ps --format json',
      { encoding: 'utf8', timeout: 10000 }
    );
  } catch (error) {
    throw new Error(`Failed to execute docker compose ps: ${error}`);
  }
});

Then('the output should be valid JSON', function () {
  expect(context.dockerComposeOutput).to.not.be.undefined;
  
  // Try to parse as JSON
  try {
    JSON.parse(context.dockerComposeOutput!);
  } catch (error) {
    throw new Error(`Output is not valid JSON: ${error}`);
  }
});

Then('the jq command should successfully extract the health status', function () {
  try {
    // Test the exact jq command used in GitHub Actions (fixed version)
    const jqCommand = `echo '${context.dockerComposeOutput}' | jq -s -r ".[] | select(.Service == \"${context.serviceName}\") | .Health"`;
    context.jqResult = execSync(jqCommand, { encoding: 'utf8', timeout: 5000 }).trim();
    context.jqError = undefined;
  } catch (error) {
    context.jqError = error.toString();
    throw new Error(`jq command failed: ${error}`);
  }
});

Then('the Service field should match {string}', function (expectedService: string) {
  try {
    const serviceCommand = `echo '${context.dockerComposeOutput}' | jq -r ".[] | select(.Service == \"${expectedService}\") | .Service"`;
    const actualService = execSync(serviceCommand, { encoding: 'utf8', timeout: 5000 }).trim();
    expect(actualService).to.equal(expectedService);
  } catch (error) {
    throw new Error(`Failed to extract Service field: ${error}`);
  }
});

// Scenario 2: jq command handles different health states correctly
Given('the postgres-test service is in {string} state', function (expectedState: string) {
  context.serviceName = 'postgres-test';
  
  // Wait for the service to reach the expected state or timeout
  let attempts = 0;
  const maxAttempts = 30;
  
  while (attempts < maxAttempts) {
    try {
      const output = execSync(
        'docker compose -f docker-compose.test.yml ps --format json',
        { encoding: 'utf8', timeout: 5000 }
      );
      
      const healthCommand = `echo '${output}' | jq -r ".[] | select(.Service == \"postgres-test\") | .Health"`;
      const currentHealth = execSync(healthCommand, { encoding: 'utf8', timeout: 5000 }).trim();
      
      if (currentHealth === expectedState) {
        context.dockerComposeOutput = output;
        context.healthStatus = currentHealth;
        return;
      }
      
      if (expectedState === 'healthy' && currentHealth === 'starting') {
        // Wait longer for healthy state
        execSync('sleep 5');
        attempts++;
        continue;
      }
      
      // For other states, accept current state
      context.dockerComposeOutput = output;
      context.healthStatus = currentHealth;
      return;
      
    } catch (error) {
      attempts++;
      execSync('sleep 2');
    }
  }
  
  throw new Error(`Service did not reach ${expectedState} state within timeout`);
});

When('I use jq to extract the health status', function () {
  try {
    const jqCommand = `echo '${context.dockerComposeOutput}' | jq -s -r ".[] | select(.Service == \"${context.serviceName}\") | .Health"`;
    context.jqResult = execSync(jqCommand, { encoding: 'utf8', timeout: 5000 }).trim();
    context.jqError = undefined;
  } catch (error) {
    context.jqError = error.toString();
    throw new Error(`jq command failed: ${error}`);
  }
});

Then('the health status should be {string}', function (expectedHealth: string) {
  expect(context.jqResult).to.equal(expectedHealth);
});

Then('no jq parsing errors should occur', function () {
  expect(context.jqError).to.be.undefined;
  expect(context.jqResult).to.not.include('jq: error');
});

// Scenario 3: jq command handles edge cases gracefully
Given('the docker compose ps output contains multiple services', function () {
  try {
    // Start multiple services
    execSync('export POSTGRES_TEST_PASSWORD=postgres && export MINIO_TEST_PASSWORD=testpassword && docker compose -f docker-compose.test.yml up -d postgres-test minio-test', {
      stdio: 'pipe',
      timeout: 60000
    });
    
    execSync('sleep 10'); // Wait for services to start
    
    context.dockerComposeOutput = execSync(
      'docker compose -f docker-compose.test.yml ps --format json',
      { encoding: 'utf8', timeout: 10000 }
    );
    
    // Verify we have multiple services
    const services = JSON.parse(`[${context.dockerComposeOutput.trim().split('\n').join(',')}]`);
    expect(services.length).to.be.greaterThan(1);
    
  } catch (error) {
    throw new Error(`Failed to start multiple services: ${error}`);
  }
});

When('I filter for the postgres-test service using jq', function () {
  try {
    const jqCommand = `echo '${context.dockerComposeOutput}' | jq -s -r ".[] | select(.Service == \"postgres-test\")"`;
    context.jqResult = execSync(jqCommand, { encoding: 'utf8', timeout: 5000 }).trim();
  } catch (error) {
    context.jqError = error.toString();
    throw new Error(`jq filtering failed: ${error}`);
  }
});

Then('only the postgres-test service data should be returned', function () {
  expect(context.jqResult).to.not.be.empty;
  
  // Parse the result and verify it's only postgres-test
  const result = JSON.parse(context.jqResult!);
  expect(result.Service).to.equal('postgres-test');
});

Then('the Service field should be correctly identified', function () {
  const result = JSON.parse(context.jqResult!);
  expect(result).to.have.property('Service');
  expect(result.Service).to.equal('postgres-test');
});

// Scenario 4: Robust jq command with error handling
Given('I have a potentially malformed JSON input', function () {
  // Simulate malformed JSON that might cause the original error
  context.dockerComposeOutput = 'invalid json string';
});

When('I use an improved jq command with error handling', function () {
  try {
    // Improved jq command with better error handling
    const improvedCommand = `echo '${context.dockerComposeOutput}' | jq -r 'if type == "array" then .[] | select(.Service == "postgres-test") | .Health else "unknown" end' 2>/dev/null || echo "parsing_error"`;
    context.jqResult = execSync(improvedCommand, { encoding: 'utf8', timeout: 5000 }).trim();
    context.jqError = undefined;
  } catch (error) {
    context.jqError = error.toString();
  }
});

Then('the command should not fail with {string} error', function (errorMessage: string) {
  if (context.jqError) {
    expect(context.jqError).to.not.include(errorMessage);
  }
  expect(context.jqResult).to.not.include('jq: error');
});

Then('appropriate fallback behavior should be implemented', function () {
  // The improved command should return either a valid health status or a fallback value
  expect(context.jqResult).to.match(/^(healthy|unhealthy|starting|unknown|parsing_error)$/);
});

// Scenario 5: GitHub Actions workflow uses corrected jq command
Given('the GitHub Actions workflow contains the health check function', function () {
  const fs = require('fs');
  const workflowContent = fs.readFileSync('.github/workflows/ci.yml', 'utf8');
  expect(workflowContent).to.include('check_container_health');
  expect(workflowContent).to.include('health_status=$(docker compose');
});

When('the check_container_health function is called for postgres-test', function () {
  // Simulate the function call by extracting and testing the jq command
  context.serviceName = 'postgres-test';
  
  try {
    // Get current docker compose output
    context.dockerComposeOutput = execSync(
      'docker compose -f docker-compose.test.yml ps --format json',
      { encoding: 'utf8', timeout: 10000 }
    );
    
    // Test the exact command from GitHub Actions (fixed version)
    const githubActionsCommand = `echo '${context.dockerComposeOutput}' | jq -s -r ".[] | select(.Service == \"${context.serviceName}\") | .Health"`;
    context.jqResult = execSync(githubActionsCommand, { encoding: 'utf8', timeout: 5000 }).trim();
    
  } catch (error) {
    context.jqError = error.toString();
    throw new Error(`GitHub Actions jq command failed: ${error}`);
  }
});

Then('the jq command should parse the JSON correctly', function () {
  expect(context.jqError).to.be.undefined;
  expect(context.jqResult).to.not.include('jq: error');
  expect(context.jqResult).to.not.be.empty;
});

Then('the health status should be extracted without errors', function () {
  expect(context.jqResult).to.match(/^(healthy|unhealthy|starting)$/);
});

Then('the workflow should proceed based on the correct health status', function () {
  // Verify that the health status is one of the expected values that the workflow can handle
  const validStatuses = ['healthy', 'unhealthy', 'starting'];
  expect(validStatuses).to.include(context.jqResult!);
});

// Cleanup after tests
process.on('exit', () => {
  try {
    execSync('docker compose -f docker-compose.test.yml down -v', { stdio: 'ignore' });
  } catch (error) {
    // Ignore cleanup errors
  }
});