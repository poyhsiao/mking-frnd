'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const cucumber_1 = require('@cucumber/cucumber');
const chai_1 = require('chai');
const child_process_1 = require('child_process');
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

// Helper function to get Docker Compose configuration
function getDockerComposeConfig() {
  const composePath = path.join(process.cwd(), '..', 'docker-compose.test.yml');
  if (fs.existsSync(composePath)) {
    const composeContent = fs.readFileSync(composePath, 'utf8');
    return yaml.load(composeContent);
  }
  return null;
}

// Helper function to execute shell commands
function executeCommand(command) {
  try {
    const result = (0, child_process_1.execSync)(command, { encoding: 'utf8', timeout: 30000 });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, output: error.message };
  }
}

// Given steps
(0, cucumber_1.Given)('I have a Docker Compose configuration with PostgreSQL', function () {
  const config = getDockerComposeConfig();
  (0, chai_1.expect)(config).to.not.be.null;
  (0, chai_1.expect)(config.services).to.have.property('postgres-test');
  this.dockerConfig = config;
});

(0, cucumber_1.Given)('the PostgreSQL service has health check configuration', function () {
  const postgresService = this.dockerConfig.services['postgres-test'];
  (0, chai_1.expect)(postgresService).to.have.property('healthcheck');
  (0, chai_1.expect)(postgresService.healthcheck).to.have.property('test');
});

(0, cucumber_1.Given)(
  'the PostgreSQL container is configured with proper environment variables',
  function () {
    const postgresService = this.dockerConfig.services['postgres-test'];
    (0, chai_1.expect)(postgresService).to.have.property('environment');
    const env = postgresService.environment;
    (0, chai_1.expect)(env).to.have.property('POSTGRES_DB');
    (0, chai_1.expect)(env).to.have.property('POSTGRES_USER');
    (0, chai_1.expect)(env).to.have.property('POSTGRES_PASSWORD');
  },
);

(0, cucumber_1.Given)(
  'the PostgreSQL container is configured with environment variables',
  function () {
    const config = getDockerComposeConfig();
    const postgresService = config.services['postgres-test'];
    (0, chai_1.expect)(postgresService.environment).to.have.property('POSTGRES_DB');
    (0, chai_1.expect)(postgresService.environment).to.have.property('POSTGRES_USER');
    (0, chai_1.expect)(postgresService.environment).to.have.property('POSTGRES_PASSWORD');
  },
);

(0, cucumber_1.Given)(
  'the PostgreSQL container has health check timeout of {int} seconds',
  function (timeout) {
    const config = getDockerComposeConfig();
    (0, chai_1.expect)(config.services['postgres-test'].healthcheck.timeout).to.equal(
      `${timeout}s`,
    );
  },
);

(0, cucumber_1.Given)(
  'the health check has retry configuration of {int} attempts',
  function (retries) {
    const config = getDockerComposeConfig();
    (0, chai_1.expect)(config.services['postgres-test'].healthcheck.retries).to.equal(retries);
  },
);

(0, cucumber_1.Given)('I am running in a GitHub Actions environment', function () {
  // Check for GitHub Actions environment variables
  this.isCI = process.env.GITHUB_ACTIONS === 'true' || process.env.CI === 'true';
});

(0, cucumber_1.Given)('the PostgreSQL container is configured for CI', function () {
  // Verify CI-specific configuration
  const postgresService = this.dockerConfig.services['postgres-test'];
  (0, chai_1.expect)(postgresService).to.exist;
  this.ciConfigured = true;
});

// When steps
(0, cucumber_1.When)('I start the PostgreSQL container using Docker Compose', function () {
  const command = 'cd .. && docker-compose -f docker-compose.test.yml up -d postgres-test';
  this.startResult = executeCommand(command);
});

// Then steps
(0, cucumber_1.Then)('the PostgreSQL container should start successfully', function () {
  (0, chai_1.expect)(this.startResult.success).to.be.true;
});

(0, cucumber_1.Then)('the PostgreSQL container should start', function () {
  (0, chai_1.expect)(this.startResult.success).to.be.true;
});

(0, cucumber_1.Then)('the health check should pass within the timeout period', function () {
  // Wait for health check to pass
  const command = 'cd .. && docker-compose -f docker-compose.test.yml ps postgres-test';
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const result = executeCommand(command);
    if (result.success && result.output.includes('healthy')) {
      this.healthCheckPassed = true;
      return;
    }
    attempts++;
    // Wait 3 seconds between attempts
    (0, child_process_1.execSync)('sleep 3');
  }

  this.healthCheckPassed = false;
});

(0, cucumber_1.Then)('the container status should be {string}', function (expectedStatus) {
  const command =
    'cd .. && docker-compose -f docker-compose.test.yml ps --format table postgres-test';
  const result = executeCommand(command);
  (0, chai_1.expect)(result.success).to.be.true;
  // Check if the status contains the expected health status
  const output = result.output.toLowerCase();
  const status = expectedStatus.toLowerCase();
  (0, chai_1.expect)(output).to.include(status);
});

(0, cucumber_1.Then)('the health check should pass', function () {
  const command =
    'cd .. && docker-compose -f docker-compose.test.yml exec -T postgres-test pg_isready -U ${POSTGRES_TEST_USER} -d ${POSTGRES_TEST_DB}';
  const result = executeCommand(command);
  (0, chai_1.expect)(result.success).to.be.true;
});

(0, cucumber_1.Then)('the health check should respect the timeout configuration', function () {
  const config = getDockerComposeConfig();
  (0, chai_1.expect)(config.services['postgres-test'].healthcheck).to.have.property('timeout');
});

(0, cucumber_1.Then)(
  'the health check should retry on failure up to {int} times',
  function (retries) {
    const config = getDockerComposeConfig();
    (0, chai_1.expect)(config.services['postgres-test'].healthcheck.retries).to.equal(retries);
  },
);

(0, cucumber_1.Then)('the PostgreSQL container should start within CI timeout limits', function () {
  if (this.isCI) {
    (0, chai_1.expect)(this.startResult.success).to.be.true;
  }
});

(0, cucumber_1.Then)('the health check should pass in the CI environment', function () {
  if (this.isCI) {
    (0, chai_1.expect)(this.healthCheckPassed).to.be.true;
  }
});

(0, cucumber_1.Then)('logs should be available for debugging', function () {
  const command = 'cd .. && docker-compose -f docker-compose.test.yml logs postgres-test';
  const result = executeCommand(command);
  (0, chai_1.expect)(result.success).to.be.true;
  (0, chai_1.expect)(result.output).to.not.be.empty;
});
