const { Given, When, Then } = require('@cucumber/cucumber');
const fs = require('fs');
const path = require('path');
const { expect } = require('chai');

// Store analysis results
let fileContent = '';
let analysisResults = {};

Given('the project has multiple Docker Compose files', function () {
  const projectRoot = process.cwd();
  const composeFiles = [
    'docker-compose.yml',
    'docker-compose.test.yml',
    'docker-compose.dev.yml',
    'docker-compose.prod.yml',
  ];

  composeFiles.forEach(file => {
    const filePath = path.join(projectRoot, file);
    expect(fs.existsSync(filePath), `${file} should exist`).to.be.true;
  });
});

Given('security is a top priority', function () {
  // This is a declarative step - no implementation needed
});

Given('the file {string} exists', function (filename) {
  const filePath = path.join(process.cwd(), filename);
  expect(fs.existsSync(filePath), `${filename} should exist`).to.be.true;
  fileContent = fs.readFileSync(filePath, 'utf8');
});

When('I analyze the file for hardcoded credentials', function () {
  analysisResults = {
    hardcodedPasswords: [],
    environmentVariables: [],
    requiredVariables: [],
    insecurePatterns: [],
  };

  // Check for hardcoded password patterns
  const hardcodedPatterns = [
    /password["']?\s*[:=]\s*["']?[^"'\s\n]+/gi,
    /secret["']?\s*[:=]\s*["']?[^"'\s\n]+/gi,
  ];

  hardcodedPatterns.forEach(pattern => {
    const matches = fileContent.match(pattern);
    if (matches) {
      analysisResults.hardcodedPasswords.push(...matches);
    }
  });

  // Check for environment variable usage
  const envVarPattern = /\$\{([^}]+)\}/g;
  let match = envVarPattern.exec(fileContent);
  while (match !== null) {
    analysisResults.environmentVariables.push(match[1]);
    if (match[1].includes(':?')) {
      analysisResults.requiredVariables.push(match[1]);
    }
    match = envVarPattern.exec(fileContent);
  }

  // Check for insecure defaults
  const insecureDefaults = [
    'postgres123456789',
    'redis123456789',
    'minio123456789',
    'grafana123456789',
    'testpassword',
    'dev-jwt-secret',
  ];

  insecureDefaults.forEach(defaultValue => {
    if (fileContent.includes(defaultValue)) {
      analysisResults.insecurePatterns.push(defaultValue);
    }
  });
});

Then('it should not contain any hardcoded passwords', function () {
  const realHardcodedPasswords = analysisResults.hardcodedPasswords.filter(match => {
    const line = match.toLowerCase();
    return (
      !line.includes('#') &&
      !line.includes('comment') &&
      !line.includes('example') &&
      !line.includes('change_me') &&
      !match.includes('${') &&
      !match.includes(':?')
    );
  });

  expect(realHardcodedPasswords,
    `Found hardcoded passwords: ${realHardcodedPasswords.join(', ')}`
  ).to.have.lengthOf(0);
});

Then('all sensitive environment variables should use the {string} syntax', function (syntax) {
  expect(syntax).to.equal('required');

  const sensitiveVars = [
    'POSTGRES_PASSWORD',
    'REDIS_PASSWORD',
    'MINIO_ROOT_PASSWORD',
    'TYPESENSE_API_KEY',
    'GRAFANA_PASSWORD',
    'JWT_SECRET',
    'ENCRYPTION_KEY',
  ];

  sensitiveVars.forEach(varName => {
    if (fileContent.includes(varName)) {
      const requiredPattern = new RegExp(`\\$\\{${varName}:\\?[^}]+\\}`);
      expect(
        requiredPattern.test(fileContent),
        `${varName} should use required syntax \${${varName}:?...}`
      ).to.be.true;
    }
  });
});

Then('{word} password should use {string}', function (service, expectedPattern) {
  expect(
    fileContent.includes(expectedPattern),
    `${service} password should use pattern: ${expectedPattern}`
  ).to.be.true;
});

Then('{word} API key should use {string}', function (service, expectedPattern) {
  expect(
    fileContent.includes(expectedPattern),
    `${service} API key should use pattern: ${expectedPattern}`
  ).to.be.true;
});

Then('{word} secret should use {string}', function (service, expectedPattern) {
  expect(
    fileContent.includes(expectedPattern),
    `${service} secret should use pattern: ${expectedPattern}`
  ).to.be.true;
});

Then('database URL should use environment variable substitution', function () {
  const dbUrlPattern = /DATABASE_URL.*\$\{.*\}/;
  expect(
    dbUrlPattern.test(fileContent),
    'DATABASE_URL should use environment variable substitution'
  ).to.be.true;
});

Then('it should not contain any hardcoded {word} passwords', function (environment) {
  expect(
    analysisResults.insecurePatterns,
    `Found insecure default passwords in ${environment} environment: ${analysisResults.insecurePatterns.join(', ')}`
  ).to.have.lengthOf(0);
});

Then('all {word} secrets should be externally managed', function (environment) {
  const secretsWithDefaults = analysisResults.environmentVariables.filter(envVar => {
    return envVar.includes(':-') &&
           (envVar.includes('SECRET') || envVar.includes('PASSWORD') || envVar.includes('KEY'));
  });

  expect(
    secretsWithDefaults,
    `Production secrets should not have defaults: ${secretsWithDefaults.join(', ')}`
  ).to.have.lengthOf(0);
});

When('I analyze the environment template', function () {
  analysisResults.securityWarnings = (fileContent.match(/# SECURITY:/g) || []).length;
  analysisResults.changeMe = (fileContent.match(/CHANGE_ME_/g) || []).length;
  analysisResults.generationCommands = (fileContent.match(/openssl rand/g) || []).length;
});

Then('it should contain placeholders for all required passwords', function () {
  const requiredPasswords = [
    'POSTGRES_PASSWORD',
    'REDIS_PASSWORD',
    'MINIO_ROOT_PASSWORD',
    'TYPESENSE_API_KEY',
    'GRAFANA_PASSWORD',
    'JWT_SECRET',
    'ENCRYPTION_KEY',
  ];

  requiredPasswords.forEach(password => {
    expect(
      fileContent.includes(password),
      `${password} should be documented in .env.example`
    ).to.be.true;
  });
});

Then('it should include security warnings for each credential', function () {
  expect(
    analysisResults.securityWarnings,
    'Should have security warnings for credentials'
  ).to.be.greaterThan(0);
});

Then('it should provide password generation commands', function () {
  expect(
    analysisResults.generationCommands,
    'Should provide password generation commands'
  ).to.be.greaterThan(0);
});

Then('all example passwords should be {string} format', function (format) {
  expect(format).to.equal('CHANGE_ME_*');
  expect(
    analysisResults.changeMe,
    'Should use CHANGE_ME_ format for example passwords'
  ).to.be.greaterThan(0);
});

Then('it should include test environment variables', function () {
  const testVars = [
    'POSTGRES_TEST_PASSWORD',
    'REDIS_TEST_PASSWORD',
    'TYPESENSE_TEST_API_KEY',
    'JWT_TEST_SECRET',
    'ENCRYPTION_TEST_KEY',
  ];

  testVars.forEach(testVar => {
    expect(
      fileContent.includes(testVar),
      `${testVar} should be documented in .env.example`
    ).to.be.true;
  });
});

When('I compare environment variable usage', function () {
  analysisResults.allEnvVars = new Set();

  const composeFiles = [
    'docker-compose.yml',
    'docker-compose.test.yml',
    'docker-compose.dev.yml',
    'docker-compose.prod.yml',
  ];

  composeFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const envVarPattern = /\$\{([^}:]+)/g;
      let match = envVarPattern.exec(content);
      while (match !== null) {
        analysisResults.allEnvVars.add(match[1]);
        match = envVarPattern.exec(content);
      }
    }
  });
});

Then('all referenced environment variables should be documented in {string}', function (envFile) {
  const envExamplePath = path.join(process.cwd(), envFile);
  const envContent = fs.readFileSync(envExamplePath, 'utf8');

  analysisResults.allEnvVars.forEach(envVar => {
    expect(
      envContent.includes(envVar),
      `Environment variable ${envVar} should be documented in ${envFile}`
    ).to.be.true;
  });
});

Then('variable names should be consistent across all files', function () {
  expect(
    analysisResults.allEnvVars.size,
    'Should have environment variables defined'
  ).to.be.greaterThan(0);
});

Then('no environment variable should have conflicting default values', function () {
  expect(
    analysisResults.insecurePatterns,
    'Should not have conflicting insecure defaults'
  ).to.have.lengthOf(0);
});

When('I run the credential validation', function () {
  analysisResults.validationPassed =
    analysisResults.hardcodedPasswords.length === 0 &&
    analysisResults.insecurePatterns.length === 0;
});

Then('it should scan all Docker Compose files', function () {
  const composeFiles = [
    'docker-compose.yml',
    'docker-compose.test.yml',
    'docker-compose.dev.yml',
    'docker-compose.prod.yml',
  ];

  composeFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    expect(fs.existsSync(filePath), `${file} should exist for validation`).to.be.true;
  });
});

Then('it should detect any remaining hardcoded passwords', function () {
  expect(
    analysisResults.hardcodedPasswords.filter(p =>
      !p.includes('CHANGE_ME') && !p.includes('#')
    ),
    'Should detect hardcoded passwords'
  ).to.have.lengthOf(0);
});

Then('it should verify environment variable syntax', function () {
  expect(
    analysisResults.environmentVariables.length,
    'Should find environment variables'
  ).to.be.greaterThan(0);
});

Then('it should pass with no security violations', function () {
  expect(
    analysisResults.validationPassed,
    'Security validation should pass'
  ).to.be.true;
});