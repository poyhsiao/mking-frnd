Feature: PostgreSQL Health Check in Docker Compose
  As a developer running e2e tests
  I want the PostgreSQL container health check to work correctly
  So that the CI/CD pipeline can reliably detect when the database is ready

  Background:
    Given the docker-compose.test.yml file exists
    And the PostgreSQL test environment variables are set

  Scenario: PostgreSQL health check uses environment variables
    Given the postgres-test service is defined in docker-compose.test.yml
    When I examine the health check configuration
    Then the health check command should use ${POSTGRES_TEST_DB} environment variable
    And the health check command should use ${POSTGRES_TEST_USER} environment variable
    And the health check should not contain hardcoded database names

  Scenario: PostgreSQL container starts successfully with correct health check
    Given the postgres-test service configuration is correct
    When I start the postgres-test container using docker compose
    Then the container should start without errors
    And the health check should pass within the timeout period
    And the container status should be "healthy"

  Scenario: Health check fails with incorrect database configuration
    Given the postgres-test service has an incorrect database name in health check
    When I start the postgres-test container using docker compose
    Then the health check should fail
    And the container status should be "unhealthy"
    And the container logs should show connection errors

  Scenario: GitHub Actions CI can detect healthy PostgreSQL container
    Given the GitHub Actions workflow is running
    And the postgres-test container is started
    When the check_container_health function is called
    Then it should detect the container as "healthy"
    And the e2e tests should be able to proceed

  Scenario: Health check timeout is properly configured
    Given the postgres-test service health check configuration
    When I examine the timeout settings
    Then the interval should be reasonable (5s or less)
    And the timeout should be reasonable (3s or less)
    And the retries should be sufficient (at least 5)
    And the start_period should allow for container initialization (at least 10s)

  @integration
  Scenario: End-to-end health check validation
    Given all test environment variables are properly set
    And the docker-compose.test.yml file is configured correctly
    When I run the complete e2e test workflow
    Then the postgres-test container should start successfully
    And the health check should pass consistently
    And the e2e tests should complete without database connection errors