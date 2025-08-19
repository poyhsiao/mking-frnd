Feature: Fix ESLint TypeScript Errors and Warnings
  As a developer
  I want to fix all ESLint errors and warnings in the backend code
  So that the CI/CD pipeline passes and code quality is maintained

  Background:
    Given I have a TypeScript backend project with ESLint configured
    And the project has strict TypeScript ESLint rules enabled

  Scenario: Fix missing return type annotations
    Given I have functions without explicit return type annotations
    When I add explicit return type annotations to all functions
    Then the @typescript-eslint/explicit-function-return-type warnings should be resolved
    And the code should be more type-safe and readable

  Scenario: Fix unsafe any type usage in database utilities
    Given I have code that uses 'any' types unsafely
    When I replace 'any' types with proper TypeScript types
    Then the @typescript-eslint/no-unsafe-assignment errors should be resolved
    And the @typescript-eslint/no-unsafe-call errors should be resolved
    And the @typescript-eslint/no-unsafe-member-access errors should be resolved
    And the @typescript-eslint/no-redundant-type-constituents errors should be resolved

  Scenario: Verify all ESLint errors are fixed
    Given I have fixed all TypeScript ESLint errors and warnings
    When I run the ESLint command
    Then there should be no errors or warnings
    And the exit code should be 0