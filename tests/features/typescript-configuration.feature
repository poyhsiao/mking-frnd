Feature: TypeScript Configuration Validation
  As a developer
  I want to ensure TypeScript configurations are properly set up
  So that the build and test processes work correctly in all environments

  Background:
    Given I have a monorepo project with backend and frontend
    And the backend has its own TypeScript configuration
    And the project has a root TypeScript configuration

  Scenario: Backend TypeScript configuration should be self-contained
    Given I am in the backend directory
    When I compile TypeScript files
    Then the compilation should succeed without external dependencies
    And the rootDir should be correctly resolved
    And no "Cannot find module '../tsconfig.json'" error should occur

  Scenario: Backend test configuration should work in Docker environment
    Given I am running tests in a Docker container
    When I execute the test suite with coverage
    Then the TypeScript configuration should be resolved correctly
    And the tests should run without configuration errors
    And the coverage report should be generated successfully

  Scenario: TypeScript configuration inheritance should be optional
    Given the backend TypeScript configuration
    When the root tsconfig.json is not available
    Then the backend should still compile successfully
    And all type checking should work correctly
    And the build process should complete without errors

  Scenario: Vitest configuration should use correct TypeScript settings
    Given the vitest configuration for CI
    When running tests with vitest
    Then the TypeScript configuration should be loaded correctly
    And the typecheck should use the appropriate tsconfig file
    And no module resolution errors should occur