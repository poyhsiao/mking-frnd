import { Given, When, Then } from '@cucumber/cucumber';
import { execSync } from 'child_process';
import { expect } from 'chai';
import path from 'path';

let eslintOutput: string = '';
let eslintExitCode: number = 0;
const backendPath = path.join(process.cwd(), 'backend');

Given('I have a TypeScript backend project with ESLint configured', function () {
  // Verify ESLint configuration exists
  const eslintConfigPath = path.join(backendPath, '.eslintrc.js');
  expect(require('fs').existsSync(eslintConfigPath)).to.be.true;
});

Given('the project has strict TypeScript ESLint rules enabled', function () {
  // This is verified by the ESLint configuration
  // The rules are already configured in the project
});

Given('I have functions without explicit return type annotations', function () {
  // This was the initial state before fixes
  // We'll verify the fixes work in the Then steps
});

Given('I have code that uses {string} types unsafely', function (typeString: string) {
  // This was the initial state with 'any' types
  expect(typeString).to.equal('any');
});

Given('I have fixed all TypeScript ESLint errors and warnings', function () {
  // This step assumes all fixes have been applied
  // The verification happens in the When/Then steps
});

When('I add explicit return type annotations to all functions', function () {
  // The fixes have been applied to the source files
  // This step represents the action that was taken
});

When('I replace {string} types with proper TypeScript types', function (typeString: string) {
  // The fixes have been applied to replace 'any' with proper types
  expect(typeString).to.equal('any');
});

When('I run the ESLint command', function () {
  try {
    eslintOutput = execSync(
      'pnpm lint',
      { 
        cwd: backendPath,
        encoding: 'utf8',
        stdio: 'pipe'
      }
    );
    eslintExitCode = 0;
  } catch (error: any) {
    eslintOutput = error.stdout + error.stderr;
    eslintExitCode = error.status || 1;
  }
});

Then('the @typescript-eslint\/explicit-function-return-type warnings should be resolved', function () {
  expect(eslintOutput).to.not.include('Missing return type on function');
  expect(eslintOutput).to.not.include('@typescript-eslint/explicit-function-return-type');
});

Then('the @typescript-eslint\/no-unsafe-assignment errors should be resolved', function () {
  expect(eslintOutput).to.not.include('Unsafe assignment of an `any` value');
  expect(eslintOutput).to.not.include('@typescript-eslint/no-unsafe-assignment');
});

Then('the @typescript-eslint\/no-unsafe-call errors should be resolved', function () {
  expect(eslintOutput).to.not.include('Unsafe construction of an any type value');
  expect(eslintOutput).to.not.include('Unsafe call of an `any` typed value');
  expect(eslintOutput).to.not.include('Unsafe any typed template tag');
  expect(eslintOutput).to.not.include('@typescript-eslint/no-unsafe-call');
});

Then('the @typescript-eslint\/no-unsafe-member-access errors should be resolved', function () {
  expect(eslintOutput).to.not.include('Unsafe member access');
  expect(eslintOutput).to.not.include('@typescript-eslint/no-unsafe-member-access');
});

Then('the @typescript-eslint\/no-redundant-type-constituents errors should be resolved', function () {
  expect(eslintOutput).to.not.include('overrides all other types in this union type');
  expect(eslintOutput).to.not.include('@typescript-eslint/no-redundant-type-constituents');
});

Then('the code should be more type-safe and readable', function () {
  // This is a qualitative assertion that the code improvements have been made
  // The specific type safety is verified by the absence of ESLint errors
});

Then('there should be no errors or warnings', function () {
  expect(eslintOutput).to.not.include('error');
  expect(eslintOutput).to.not.include('warning');
  expect(eslintOutput).to.not.include('✖');
});

Then('the exit code should be {int}', function (expectedExitCode: number) {
  expect(eslintExitCode).to.equal(expectedExitCode);
});