import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// Test context to store state between steps
interface TestContext {
  projectRoot: string;
  backendPath: string;
  compilationResult?: { success: boolean; output: string; error?: string };
  testResult?: { success: boolean; output: string; error?: string };
}

let testContext: TestContext;

Given('I have a monorepo project with backend and frontend', function () {
  testContext = {
    projectRoot: path.resolve(__dirname, '../..'),
    backendPath: path.resolve(__dirname, '../../backend')
  };
  
  // Verify project structure exists
  expect(fs.existsSync(testContext.projectRoot)).to.be.true;
  expect(fs.existsSync(testContext.backendPath)).to.be.true;
  expect(fs.existsSync(path.join(testContext.backendPath, 'package.json'))).to.be.true;
});

Given('the backend has its own TypeScript configuration', function () {
  const backendTsConfig = path.join(testContext.backendPath, 'tsconfig.json');
  expect(fs.existsSync(backendTsConfig)).to.be.true;
  
  // Verify the configuration is valid JSON
  const config = JSON.parse(fs.readFileSync(backendTsConfig, 'utf8'));
  expect(config).to.have.property('compilerOptions');
});

Given('the project has a root TypeScript configuration', function () {
  const rootTsConfig = path.join(testContext.projectRoot, 'tsconfig.json');
  expect(fs.existsSync(rootTsConfig)).to.be.true;
});

Given('I am in the backend directory', function () {
  process.chdir(testContext.backendPath);
  expect(process.cwd()).to.equal(testContext.backendPath);
});

Given('I am running tests in a Docker container', function () {
  // Simulate Docker environment by setting environment variables
  process.env.CI = 'true';
  process.env.DOCKER_ENV = 'true';
});

Given('the backend TypeScript configuration', function () {
  const backendTsConfig = path.join(testContext.backendPath, 'tsconfig.json');
  const config = JSON.parse(fs.readFileSync(backendTsConfig, 'utf8'));
  expect(config).to.be.an('object');
});

Given('the vitest configuration for CI', function () {
  const vitestConfig = path.join(testContext.backendPath, 'vitest.ci.config.ts');
  expect(fs.existsSync(vitestConfig)).to.be.true;
});

When('I compile TypeScript files', function () {
  try {
    const output = execSync('npx tsc --noEmit', {
      cwd: testContext.backendPath,
      encoding: 'utf8',
      timeout: 30000
    });
    testContext.compilationResult = { success: true, output };
  } catch (error: any) {
    testContext.compilationResult = {
      success: false,
      output: error.stdout || '',
      error: error.stderr || error.message
    };
  }
});

When('I execute the test suite with coverage', function () {
  try {
    const output = execSync('npm run test:coverage', {
      cwd: testContext.backendPath,
      encoding: 'utf8',
      timeout: 60000
    });
    testContext.testResult = { success: true, output };
  } catch (error: any) {
    testContext.testResult = {
      success: false,
      output: error.stdout || '',
      error: error.stderr || error.message
    };
  }
});

When('the root tsconfig.json is not available', function () {
  // Temporarily rename root tsconfig.json to simulate unavailability
  const rootTsConfig = path.join(testContext.projectRoot, 'tsconfig.json');
  const backupPath = path.join(testContext.projectRoot, 'tsconfig.json.backup');
  
  if (fs.existsSync(rootTsConfig)) {
    fs.renameSync(rootTsConfig, backupPath);
  }
  
  // Cleanup function to restore the file after test
  this.addCleanup(() => {
    if (fs.existsSync(backupPath)) {
      fs.renameSync(backupPath, rootTsConfig);
    }
  });
});

When('running tests with vitest', function () {
  try {
    const output = execSync('npx vitest --config=vitest.ci.config.ts --run', {
      cwd: testContext.backendPath,
      encoding: 'utf8',
      timeout: 60000
    });
    testContext.testResult = { success: true, output };
  } catch (error: any) {
    testContext.testResult = {
      success: false,
      output: error.stdout || '',
      error: error.stderr || error.message
    };
  }
});

Then('the compilation should succeed without external dependencies', function () {
  expect(testContext.compilationResult).to.exist;
  if (!testContext.compilationResult!.success) {
    console.log('Compilation error:', testContext.compilationResult!.error);
  }
  expect(testContext.compilationResult!.success).to.be.true;
});

Then('the rootDir should be correctly resolved', function () {
  expect(testContext.compilationResult).to.exist;
  expect(testContext.compilationResult!.success).to.be.true;
  
  // Check that no rootDir related errors occurred
  const output = testContext.compilationResult!.output + (testContext.compilationResult!.error || '');
  expect(output).to.not.include('rootDir');
});

Then('no "Cannot find module \'../tsconfig.json\'" error should occur', function () {
  expect(testContext.compilationResult).to.exist;
  const output = testContext.compilationResult!.output + (testContext.compilationResult!.error || '');
  expect(output).to.not.include("Cannot find module '../tsconfig.json'");
});

Then('the TypeScript configuration should be resolved correctly', function () {
  expect(testContext.testResult).to.exist;
  const output = testContext.testResult!.output + (testContext.testResult!.error || '');
  expect(output).to.not.include("Cannot find module '../tsconfig.json'");
});

Then('the tests should run without configuration errors', function () {
  expect(testContext.testResult).to.exist;
  if (!testContext.testResult!.success) {
    console.log('Test error:', testContext.testResult!.error);
    console.log('Test output:', testContext.testResult!.output);
  }
  
  // Allow tests to fail but configuration should not cause errors
  const output = testContext.testResult!.output + (testContext.testResult!.error || '');
  expect(output).to.not.include('Error: Cannot find module');
  expect(output).to.not.include('resolveExtends');
});

Then('the coverage report should be generated successfully', function () {
  const coverageDir = path.join(testContext.backendPath, 'coverage');
  // Coverage directory should exist if tests ran
  if (testContext.testResult!.success) {
    expect(fs.existsSync(coverageDir)).to.be.true;
  }
});

Then('the backend should still compile successfully', function () {
  expect(testContext.compilationResult).to.exist;
  expect(testContext.compilationResult!.success).to.be.true;
});

Then('all type checking should work correctly', function () {
  expect(testContext.compilationResult).to.exist;
  expect(testContext.compilationResult!.success).to.be.true;
  
  const output = testContext.compilationResult!.output + (testContext.compilationResult!.error || '');
  expect(output).to.not.include('error TS');
});

Then('the build process should complete without errors', function () {
  expect(testContext.compilationResult).to.exist;
  expect(testContext.compilationResult!.success).to.be.true;
});

Then('the TypeScript configuration should be loaded correctly', function () {
  expect(testContext.testResult).to.exist;
  const output = testContext.testResult!.output + (testContext.testResult!.error || '');
  expect(output).to.not.include('Cannot find module');
});

Then('the typecheck should use the appropriate tsconfig file', function () {
  expect(testContext.testResult).to.exist;
  const output = testContext.testResult!.output + (testContext.testResult!.error || '');
  expect(output).to.not.include('tsconfig.json');
});

Then('no module resolution errors should occur', function () {
  expect(testContext.testResult).to.exist;
  const output = testContext.testResult!.output + (testContext.testResult!.error || '');
  expect(output).to.not.include('Cannot find module');
  expect(output).to.not.include('Module not found');
});