Feature: Backend Health Check and Error Handling
  As a DevOps engineer
  I want the backend service to have proper health checks and error handling
  So that GitHub Actions E2E tests can reliably detect service status and handle errors gracefully

  Background:
    Given the docker-compose.test.yml file exists
    And the backend service has a health endpoint at "/health"
    And the backend service has proper error handling middleware

  @health-check @docker-compose
  Scenario: Backend service should have health check configuration in Docker Compose
    Given the backend-test service is defined in docker-compose.test.yml
    When I examine the service configuration
    Then it should have a healthcheck section
    And the healthcheck should test the "/health" endpoint
    And the healthcheck should use appropriate intervals and timeouts
    And the healthcheck should have proper retry configuration

  @health-check @endpoint
  Scenario: Backend health endpoint should return proper status
    Given the backend service is running
    When I make a GET request to "/health"
    Then the response status should be 200
    And the response should contain "status": "ok"
    And the response should contain environment information
    And the response should contain timestamp
    And the response should contain uptime information

  @health-check @github-actions
  Scenario: GitHub Actions should detect backend health status correctly
    Given the backend-test service is started with Docker Compose
    And the service has proper health check configuration
    When the check_container_health function is called for "backend-test"
    Then the health status should be detected as "healthy" or "starting"
    And the health status should not be "unknown"
    And the GitHub Actions workflow should proceed without health check errors

  @error-handling @404
  Scenario: Backend should handle non-existent routes gracefully
    Given the backend service is running
    When I make a GET request to "/non-existent-route"
    Then the response status should be 404
    And the response should have proper error structure
    And the response should contain "success": false
    And the response should contain error message about route not found
    And the response should contain timestamp
    And the response should contain the requested path

  @error-handling @middleware
  Scenario: Error handler middleware should provide consistent error format
    Given the backend service is running
    When I make requests to various non-existent routes
    Then all error responses should have consistent structure
    And all error responses should include service identification
    And all error responses should include request details
    And error logs should be properly formatted for debugging

  @error-handling @logging
  Scenario: Error handler should log errors appropriately
    Given the backend service is running with error logging enabled
    When an error occurs (like accessing non-existent route)
    Then the error should be logged with proper structure
    And the log should include error details
    And the log should include request information
    And the log should include stack trace in development mode
    And the log should not expose sensitive information

  @integration @docker-compose
  Scenario: Backend service should start successfully with all dependencies
    Given all dependency services are configured (postgres-test, redis-test, minio-test, typesense-test)
    When I start the backend-test service with Docker Compose
    Then the service should wait for dependencies to be healthy
    And the service should start without errors
    And the service should become healthy within reasonable time
    And the service should be accessible on the configured port

  @integration @github-actions
  Scenario: GitHub Actions E2E test should complete without backend health errors
    Given the GitHub Actions workflow is running E2E tests
    And all services are configured with proper health checks
    When the workflow starts all test services
    Then all services should become healthy
    And the backend-test health status should not be "unknown"
    And the workflow should proceed to run frontend tests
    And no health check timeouts should occur

  @error-handling @production-ready
  Scenario: Error responses should be production-ready
    Given the backend service is running
    When errors occur in the application
    Then error responses should not expose internal details in production
    And error responses should include correlation IDs for tracking
    And error responses should follow standard HTTP status codes
    And error responses should be properly formatted JSON
    And sensitive information should not be leaked in error messages