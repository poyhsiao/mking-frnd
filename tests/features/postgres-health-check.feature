Feature: PostgreSQL Health Check in Docker Compose
  As a developer
  I want to ensure PostgreSQL container health checks work correctly
  So that dependent services can wait for PostgreSQL to be ready

  Background:
    Given I have a Docker Compose configuration with PostgreSQL
    And the PostgreSQL service has health check configuration

  Scenario: PostgreSQL container starts successfully with health check
    Given the PostgreSQL container is configured with proper environment variables
    When I start the PostgreSQL container using Docker Compose
    Then the PostgreSQL container should start successfully
    And the health check should pass within the timeout period
    And the container status should be "healthy"

  Scenario: Health check validates PostgreSQL service availability
    Given the PostgreSQL container is configured with environment variables
    When I start the PostgreSQL container using Docker Compose
    Then the PostgreSQL container should start
    And the health check should pass
    And the container status should be "healthy"
    And logs should be available for debugging

  Scenario: Health check timeout and retry configuration
    Given the PostgreSQL container has health check timeout of 3 seconds
    And the health check has retry configuration of 5 attempts
    When I start the PostgreSQL container using Docker Compose
    Then the health check should respect the timeout configuration
    And the health check should retry on failure up to 5 times

  Scenario: Integration with GitHub Actions CI
    Given I am running in a GitHub Actions environment
    And the PostgreSQL container is configured for CI
    When I start the PostgreSQL container using Docker Compose
    Then the PostgreSQL container should start within CI timeout limits
    And the health check should pass in the CI environment
    And logs should be available for debugging