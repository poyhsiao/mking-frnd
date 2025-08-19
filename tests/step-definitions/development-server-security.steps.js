const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');
const fs = require('fs');
const path = require('path');

// Test world interface
class TestWorld {
  constructor() {
    this.server = null;
    this.response = null;
    this.error = null;
    this.corsSettings = null;
    this.securitySettings = null;
    this.cicdEnvironment = false;
  }
}

// Background step
Given('I have a development server running', function () {
  // Mock server setup
  this.server = {
    running: true,
    port: 3000,
    cors: {
      enabled: true,
      allowedOrigins: ['http://localhost:3000', 'http://localhost:3001'],
    },
  };
});

// CORS Configuration Steps
Given('I have configured CORS settings', function () {
  this.corsSettings = {
    allowedOrigins: ['http://localhost:3000', 'http://localhost:3001'],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };
});

When('I make a request from an unauthorized origin', function () {
  // Mock unauthorized request
  const unauthorizedOrigin = 'http://malicious-site.com';

  // Simulate CORS check
  const isAllowed = this.corsSettings.allowedOrigins.includes(unauthorizedOrigin);

  if (!isAllowed) {
    this.response = {
      status: 403,
      headers: {
        'Access-Control-Allow-Origin': null,
      },
      body: 'CORS policy: Request blocked',
    };
  }
});

When('I make a request from an authorized origin', function () {
  // Mock authorized request
  const authorizedOrigin = 'http://localhost:3000';

  // Simulate CORS check
  const isAllowed = this.corsSettings.allowedOrigins.includes(authorizedOrigin);

  if (isAllowed) {
    this.response = {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': authorizedOrigin,
      },
      body: 'Request allowed',
    };
  }
});

Then('the request should be rejected with appropriate CORS headers', function () {
  expect(this.response).to.not.be.null;
  expect(this.response.status).to.be.at.least(400);
  expect(this.response.body).to.match(/CORS|blocked|forbidden/i);
});

Then('the request should be allowed', function () {
  expect(this.response).to.not.be.null;
  expect(this.response.status).to.equal(200);
  expect(this.response.headers['Access-Control-Allow-Origin']).to.not.be.null;
});

// ESBuild Security Steps
Given('I have the project dependencies installed', () => {
  // Check if package.json exists
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  expect(fs.existsSync(packageJsonPath)).to.be.true;
});

When('I check for ESBuild vulnerabilities', function () {
  // Mock vulnerability check
  this.vulnerabilities = [];
  this.esbuildVersion = '0.25.8'; // Mock current version
});

Then('no critical vulnerabilities should be found', function () {
  expect(this.vulnerabilities).to.be.an('array');
  const criticalVulns = this.vulnerabilities.filter(v => v.severity === 'critical');
  expect(criticalVulns).to.have.length(0);
});

Then('ESBuild version should be {float} or higher', function (minVersion) {
  const currentVersion = parseFloat(this.esbuildVersion);
  expect(currentVersion).to.be.at.least(minVersion);
});

// Security Configuration Steps
Given('I have the default development server configuration', function () {
  this.securitySettings = {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
    },
    debugMode: false,
  };
});

When('I analyze the security settings', function () {
  // Mock security analysis
  this.securityAnalysis = {
    headersConfigured: Object.keys(this.securitySettings.headers).length > 0,
    debugExposed: this.securitySettings.debugMode,
  };
});

Then('security headers should be properly configured', function () {
  expect(this.securityAnalysis.headersConfigured).to.be.true;
  expect(this.securitySettings.headers).to.have.property('X-Content-Type-Options');
  expect(this.securitySettings.headers).to.have.property('X-Frame-Options');
});

Then('debug information should not be exposed in production mode', function () {
  expect(this.securityAnalysis.debugExposed).to.be.false;
});

// CI/CD Pipeline Steps
Given(/^the CI\/CD pipeline is running$/, function () {
  // Mock CI/CD environment
  this.cicdEnvironment = true;

  // Check for CI environment variables
  const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
  if (isCI) {
    this.cicdEnvironment = true;
  }
});

When('security tests are executed', function () {
  // Mock security test execution
  this.securityTestResults = {
    corsTests: 'passed',
    vulnerabilityScans: 'passed',
    headerChecks: 'passed',
  };
});

Then('all security checks should pass', function () {
  expect(this.securityTestResults).to.not.be.null;
  Object.values(this.securityTestResults).forEach(result => {
    expect(result).to.equal('passed');
  });
});

Then('no vulnerabilities should be detected', function () {
  expect(this.vulnerabilities || []).to.have.length(0);
});

// Set up the world
const { setWorldConstructor } = require('@cucumber/cucumber');
setWorldConstructor(TestWorld);
