Feature: CI/CD Pipeline Behavior
  As a DevOps engineer
  I want the CI/CD pipeline to run reliably with proper environment configuration
  So that all tests pass and deployments are successful

  Background:
    Given I have a GitHub Actions CI/CD pipeline
    And the pipeline includes unit, integration, and e2e tests
    And Docker containers are used for testing

  Scenario: Environment variables should be properly configured
    Given the CI pipeline is triggered
    When the test environment is set up
    Then all required environment variables should be present
    And WAIT_COUNT should be set to "30"
    And MAX_WAIT should be set to "300"
    And NODE_ENV should be set to "test"
    And CI should be set to "true"

  Scenario: Docker services should start successfully
    Given the CI pipeline starts Docker services
    When the health check function runs
    Then all test services should be healthy
    And postgres-test should be accessible
    And redis-test should be accessible
    And minio-test should be accessible
    And typesense-test should be accessible

  Scenario: Unit tests should run without user permission errors
    Given the backend-test container is built
    And the container uses the testuser with UID 1001
    When unit tests are executed
    Then the tests should run successfully
    And no "unable to find user" errors should occur
    And test results should be generated

  Scenario: Integration tests should pass with proper service dependencies
    Given all test services are healthy
    And the backend-test container is running
    When integration tests are executed
    Then the tests should connect to all required services
    And database migrations should complete successfully
    And test data should be seeded properly
    And all integration tests should pass

  Scenario: E2E tests should run with full system integration
    Given the backend service is running and healthy
    And the frontend-test container is built
    When e2e tests are executed
    Then the frontend should communicate with the backend
    And all user workflows should be tested
    And e2e test results should be generated

  Scenario: Test artifacts should be collected properly
    Given all tests have completed
    When the test results collection step runs
    Then unit test results should be available
    And integration test results should be available
    And e2e test results should be available
    And coverage reports should be generated
    And all artifacts should be uploaded

  Scenario: Pipeline should handle service startup timeouts gracefully
    Given the CI pipeline starts test services
    And some services may take time to become ready
    When the wait-for-services script runs
    Then it should retry up to WAIT_COUNT times
    And it should wait up to MAX_WAIT seconds total
    And it should log service status during waits
    And it should fail gracefully if services don't start

  Scenario: Docker build should use proper user permissions
    Given the backend Dockerfile defines a test stage
    When the Docker image is built
    Then a testuser should be created with UID 1001
    And a testgroup should be created with GID 1001
    And the application files should be owned by testuser
    And the container should run as testuser

  Scenario: Test database should be properly configured
    Given the postgres-test service is running
    When the backend connects to the test database
    Then the connection should use the test database URL
    And migrations should run successfully
    And test data should be seeded
    And the database should be isolated from production

  @error-handling
  Scenario: Pipeline should fail fast on critical errors
    Given the CI pipeline is running
    When a critical error occurs in any test stage
    Then the pipeline should stop execution
    And the error should be clearly reported
    And subsequent stages should not run
    And the build status should be marked as failed

  @performance
  Scenario: Pipeline should complete within reasonable time
    Given the CI pipeline starts
    When all tests are executed
    Then the total pipeline time should be under 15 minutes
    And service startup should complete within 2 minutes
    And test execution should be optimized for speed
    And parallel execution should be used where possible