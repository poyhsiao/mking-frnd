"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const cucumber_1 = require("@cucumber/cucumber");
const chai_1 = require("chai");
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const yaml = __importStar(require("js-yaml"));
const path = __importStar(require("path"));
// Global variables for test context
let dockerComposeConfig;
let containerStatus;
let containerLogs;
const projectRoot = process.cwd();
const dockerComposeFile = path.join(projectRoot, 'docker-compose.test.yml');
// Helper functions
function loadDockerComposeConfig() {
    const fileContent = fs.readFileSync(dockerComposeFile, 'utf8');
    return yaml.load(fileContent);
}
function executeCommand(command) {
    try {
        return (0, child_process_1.execSync)(command, { encoding: 'utf8', cwd: projectRoot });
    }
    catch (error) {
        throw new Error(`Command failed: ${command}\nError: ${error.message}`);
    }
}
function getContainerStatus(serviceName) {
    try {
        const output = executeCommand(`docker compose -f ${dockerComposeFile} ps --format json`);
        const containers = output.split('\n').filter(line => line.trim()).map(line => JSON.parse(line));
        const container = containers.find(c => c.Service === serviceName);
        return container ? container.Health || container.State : 'not found';
    }
    catch (error) {
        return 'error';
    }
}
function waitForContainerHealth(serviceName, expectedStatus, timeoutMs = 60000) {
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
(0, cucumber_1.Before)(function () {
    // Ensure clean state before each scenario
    try {
        executeCommand(`docker compose -f ${dockerComposeFile} down -v`);
    }
    catch (error) {
        // Ignore errors if containers are not running
    }
});
(0, cucumber_1.After)(function () {
    // Clean up after each scenario
    try {
        executeCommand(`docker compose -f ${dockerComposeFile} down -v`);
    }
    catch (error) {
        // Ignore errors during cleanup
    }
});
// Step definitions
(0, cucumber_1.Given)('the docker-compose.test.yml file exists', function () {
    (0, chai_1.expect)(fs.existsSync(dockerComposeFile)).to.be.true;
});
(0, cucumber_1.Given)('the PostgreSQL test environment variables are set', function () {
    const requiredEnvVars = ['POSTGRES_TEST_DB', 'POSTGRES_TEST_USER', 'POSTGRES_TEST_PASSWORD'];
    for (const envVar of requiredEnvVars) {
        (0, chai_1.expect)(process.env[envVar], `Environment variable ${envVar} should be set`).to.not.be.undefined;
    }
});
(0, cucumber_1.Given)('the postgres-test service is defined in docker-compose.test.yml', function () {
    dockerComposeConfig = loadDockerComposeConfig();
    (0, chai_1.expect)(dockerComposeConfig.services).to.have.property('postgres-test');
});
(0, cucumber_1.When)('I examine the health check configuration', function () {
    dockerComposeConfig = loadDockerComposeConfig();
    const postgresService = dockerComposeConfig.services['postgres-test'];
    (0, chai_1.expect)(postgresService).to.have.property('healthcheck');
});
(0, cucumber_1.Then)('the health check command should use {string} environment variable', function (envVar) {
    const postgresService = dockerComposeConfig.services['postgres-test'];
    const healthCheck = postgresService.healthcheck;
    (0, chai_1.expect)(healthCheck).to.not.be.undefined;
    const testCommand = Array.isArray(healthCheck.test) ? healthCheck.test.join(' ') : healthCheck.test;
    (0, chai_1.expect)(testCommand).to.include(`\${${envVar}}`);
});
(0, cucumber_1.Then)('the health check should not contain hardcoded database names', function () {
    const postgresService = dockerComposeConfig.services['postgres-test'];
    const healthCheck = postgresService.healthcheck;
    const testCommand = Array.isArray(healthCheck.test) ? healthCheck.test.join(' ') : healthCheck.test;
    // Check for common hardcoded database names
    const hardcodedNames = ['mking_test', 'test_db', 'testdb'];
    for (const name of hardcodedNames) {
        (0, chai_1.expect)(testCommand).to.not.include(name, `Health check should not contain hardcoded database name: ${name}`);
    }
});
(0, cucumber_1.Given)('the postgres-test service configuration is correct', function () {
    dockerComposeConfig = loadDockerComposeConfig();
    const postgresService = dockerComposeConfig.services['postgres-test'];
    // Verify the service has proper configuration
    (0, chai_1.expect)(postgresService).to.have.property('image');
    (0, chai_1.expect)(postgresService).to.have.property('healthcheck');
    (0, chai_1.expect)(postgresService.healthcheck).to.have.property('test');
});
(0, cucumber_1.When)('I start the postgres-test container using docker compose', function () {
    try {
        executeCommand(`docker compose -f ${dockerComposeFile} up -d postgres-test`);
    }
    catch (error) {
        throw new Error(`Failed to start postgres-test container: ${error.message}`);
    }
});
(0, cucumber_1.Then)('the container should start without errors', function () {
    // Wait a moment for container to initialize
    const status = getContainerStatus('postgres-test');
    (0, chai_1.expect)(status).to.not.equal('error');
    (0, chai_1.expect)(status).to.not.equal('not found');
});
(0, cucumber_1.Then)('the health check should pass within the timeout period', async function () {
    const healthCheckPassed = await waitForContainerHealth('postgres-test', 'healthy', 60000);
    (0, chai_1.expect)(healthCheckPassed).to.be.true;
});
(0, cucumber_1.Then)('the container status should be {string}', function (expectedStatus) {
    containerStatus = getContainerStatus('postgres-test');
    (0, chai_1.expect)(containerStatus).to.equal(expectedStatus);
});
(0, cucumber_1.Given)('the postgres-test service has an incorrect database name in health check', function () {
    // This step assumes we're testing the current broken configuration
    dockerComposeConfig = loadDockerComposeConfig();
    const postgresService = dockerComposeConfig.services['postgres-test'];
    const healthCheck = postgresService.healthcheck;
    const testCommand = Array.isArray(healthCheck.test) ? healthCheck.test.join(' ') : healthCheck.test;
    // Verify it contains hardcoded database name (this should fail after we fix it)
    (0, chai_1.expect)(testCommand).to.include('mking_test');
});
(0, cucumber_1.Then)('the health check should fail', async function () {
    // Wait for health check to fail
    const healthCheckFailed = await waitForContainerHealth('postgres-test', 'unhealthy', 30000);
    (0, chai_1.expect)(healthCheckFailed).to.be.true;
});
(0, cucumber_1.Then)('the container logs should show connection errors', function () {
    try {
        containerLogs = executeCommand(`docker compose -f ${dockerComposeFile} logs postgres-test`);
        // Look for PostgreSQL connection or database errors
        (0, chai_1.expect)(containerLogs).to.match(/(FATAL|ERROR|connection|database)/i);
    }
    catch (error) {
        // If we can't get logs, that's also an indication of problems
        chai_1.expect.fail('Could not retrieve container logs');
    }
});
(0, cucumber_1.Given)('the GitHub Actions workflow is running', function () {
    // This step is mainly for documentation - in real CI this would be automatic
    (0, chai_1.expect)(process.env.CI).to.not.be.undefined;
});
(0, cucumber_1.Given)('the postgres-test container is started', function () {
    executeCommand(`docker compose -f ${dockerComposeFile} up -d postgres-test`);
});
(0, cucumber_1.When)('the check_container_health function is called', function () {
    // Simulate the GitHub Actions health check function
    containerStatus = getContainerStatus('postgres-test');
});
(0, cucumber_1.Then)('it should detect the container as {string}', function (expectedStatus) {
    (0, chai_1.expect)(containerStatus).to.equal(expectedStatus);
});
(0, cucumber_1.Then)('the e2e tests should be able to proceed', function () {
    // Verify that the database is actually accessible
    (0, chai_1.expect)(containerStatus).to.equal('healthy');
});
(0, cucumber_1.Given)('the postgres-test service health check configuration', function () {
    dockerComposeConfig = loadDockerComposeConfig();
    const postgresService = dockerComposeConfig.services['postgres-test'];
    (0, chai_1.expect)(postgresService).to.have.property('healthcheck');
});
(0, cucumber_1.When)('I examine the timeout settings', function () {
    // Configuration is already loaded in the Given step
});
(0, cucumber_1.Then)('the interval should be reasonable \({int}s or less\)', function (maxSeconds) {
    const postgresService = dockerComposeConfig.services['postgres-test'];
    const healthCheck = postgresService.healthcheck;
    if (healthCheck.interval) {
        const intervalSeconds = parseInt(healthCheck.interval.replace('s', ''));
        (0, chai_1.expect)(intervalSeconds).to.be.at.most(maxSeconds);
    }
});
(0, cucumber_1.Then)('the timeout should be reasonable \({int}s or less\)', function (maxSeconds) {
    const postgresService = dockerComposeConfig.services['postgres-test'];
    const healthCheck = postgresService.healthcheck;
    if (healthCheck.timeout) {
        const timeoutSeconds = parseInt(healthCheck.timeout.replace('s', ''));
        (0, chai_1.expect)(timeoutSeconds).to.be.at.most(maxSeconds);
    }
});
(0, cucumber_1.Then)('the retries should be sufficient \(at least {int}\)', function (minRetries) {
    const postgresService = dockerComposeConfig.services['postgres-test'];
    const healthCheck = postgresService.healthcheck;
    (0, chai_1.expect)(healthCheck.retries).to.be.at.least(minRetries);
});
(0, cucumber_1.Then)('the start_period should allow for container initialization \(at least {int}s\)', function (minSeconds) {
    const postgresService = dockerComposeConfig.services['postgres-test'];
    const healthCheck = postgresService.healthcheck;
    if (healthCheck.start_period) {
        const startPeriodSeconds = parseInt(healthCheck.start_period.replace('s', ''));
        (0, chai_1.expect)(startPeriodSeconds).to.be.at.least(minSeconds);
    }
});
(0, cucumber_1.Given)('all test environment variables are properly set', function () {
    const requiredEnvVars = [
        'POSTGRES_TEST_DB',
        'POSTGRES_TEST_USER',
        'POSTGRES_TEST_PASSWORD',
        'POSTGRES_TEST_HOST',
        'POSTGRES_TEST_PORT'
    ];
    for (const envVar of requiredEnvVars) {
        (0, chai_1.expect)(process.env[envVar], `Environment variable ${envVar} should be set`).to.not.be.undefined;
    }
});
(0, cucumber_1.Given)('the docker-compose.test.yml file is configured correctly', function () {
    dockerComposeConfig = loadDockerComposeConfig();
    const postgresService = dockerComposeConfig.services['postgres-test'];
    // Verify all required configuration is present
    (0, chai_1.expect)(postgresService).to.have.property('image');
    (0, chai_1.expect)(postgresService).to.have.property('environment');
    (0, chai_1.expect)(postgresService).to.have.property('healthcheck');
    // Verify health check uses environment variables
    const healthCheck = postgresService.healthcheck;
    const testCommand = Array.isArray(healthCheck.test) ? healthCheck.test.join(' ') : healthCheck.test;
    (0, chai_1.expect)(testCommand).to.include('${POSTGRES_TEST_DB}');
});
(0, cucumber_1.When)('I run the complete e2e test workflow', function () {
    // Start all required services
    executeCommand(`docker compose -f ${dockerComposeFile} up -d`);
});
(0, cucumber_1.Then)('the postgres-test container should start successfully', function () {
    const status = getContainerStatus('postgres-test');
    (0, chai_1.expect)(status).to.not.equal('error');
    (0, chai_1.expect)(status).to.not.equal('not found');
});
(0, cucumber_1.Then)('the health check should pass consistently', async function () {
    // Wait for health check to pass and verify it stays healthy
    const healthCheckPassed = await waitForContainerHealth('postgres-test', 'healthy', 60000);
    (0, chai_1.expect)(healthCheckPassed).to.be.true;
    // Wait a bit more and check again to ensure consistency
    await new Promise(resolve => setTimeout(resolve, 5000));
    const finalStatus = getContainerStatus('postgres-test');
    (0, chai_1.expect)(finalStatus).to.equal('healthy');
});
(0, cucumber_1.Then)('the e2e tests should complete without database connection errors', function () {
    // This would typically run actual e2e tests, but for now we'll just verify the container is healthy
    const status = getContainerStatus('postgres-test');
    (0, chai_1.expect)(status).to.equal('healthy');
    // Verify we can get logs without errors
    const logs = executeCommand(`docker compose -f ${dockerComposeFile} logs postgres-test`);
    (0, chai_1.expect)(logs).to.not.include('FATAL');
    (0, chai_1.expect)(logs).to.not.include('ERROR');
});
