Feature: Typesense Container Health Check in CI Environment
  As a developer
  I want the Typesense container to be healthy in CI environment
  So that integration tests can run successfully

  Background:
    Given the CI environment is set up
    And Docker Compose test configuration is loaded

  Scenario: Typesense container starts successfully
    Given the Typesense container is configured with proper health check
    When Docker Compose brings up the test services
    Then the Typesense container should start within 60 seconds
    And the Typesense container should be marked as healthy
    And the health check endpoint should respond with status 200

  Scenario: Typesense container health check endpoint is accessible
    Given the Typesense container is running
    When I make a GET request to the health check endpoint
    Then the response status should be 200
    And the response should indicate the service is ready
    And the response time should be less than 5 seconds

  Scenario: Dependent services wait for Typesense to be healthy
    Given the Typesense container is starting up
    And the backend-test service depends on Typesense
    When Docker Compose starts all services
    Then the backend-test service should wait for Typesense to be healthy
    And the backend-test service should not start until Typesense is ready
    And all dependent services should start successfully after Typesense is healthy

  Scenario: Typesense container handles initialization delays
    Given the Typesense container is starting for the first time
    When the container is initializing its data structures
    Then the health check should retry with appropriate intervals
    And the health check should wait for the service to be fully ready
    And the container should not be marked as failed during normal startup time

  Scenario Outline: Health check configuration is robust
    Given the Typesense container health check is configured with <interval> interval
    And the health check timeout is set to <timeout>
    And the health check retries are set to <retries>
    When the container is starting up
    Then the health check should allow sufficient time for startup
    And the configuration should handle temporary network issues

    Examples:
      | interval | timeout | retries |
      | 10s      | 8s      | 8       |
      | 15s      | 10s     | 3       |
      | 30s      | 15s     | 2       |