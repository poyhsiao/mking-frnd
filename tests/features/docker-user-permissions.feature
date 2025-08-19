Feature: Docker Container User Permissions
  As a DevOps engineer
  I want Docker containers to run with proper non-root user permissions
  So that the application is secure and follows best practices

  Background:
    Given I have a Docker container for the backend service
    And the container needs to run with non-root privileges

  Scenario: Docker container should create and use a proper non-root user
    Given the Dockerfile defines a test stage
    When the container is built and started
    Then a non-root user should be created successfully
    And the container should run under that non-root user
    And the user should have appropriate permissions for the application

  Scenario: Docker container should not reference non-existent users
    Given the Dockerfile contains a USER directive
    When the container is built
    Then the USER directive should reference an existing user
    And the build should not fail with "unable to find user" error

  Scenario: Test stage should have proper user configuration
    Given the Dockerfile has a test stage
    When the test stage is executed
    Then the container should run tests successfully
    And file permissions should allow test execution
    And test results should be accessible

  Scenario Outline: Environment variables should be properly set
    Given the CI pipeline is running
    When the Docker container starts
    Then the environment variable "<variable>" should be set
    And the variable should have a valid value

    Examples:
      | variable   |
      | WAIT_COUNT |
      | MAX_WAIT   |
      | NODE_ENV   |
      | CI         |

  @current-issue
  Scenario: Current Docker user permission error
    Given the current Dockerfile uses "USER non-root"
    When the container is built in CI
    Then the build fails with "unable to find user non-root: no matching entries in passwd file"
    And the unit tests cannot execute
    And the CI pipeline fails

  @fix-required
  Scenario: Fixed Docker user permissions
    Given the Dockerfile creates a proper non-root user
    And the user is added to the system
    When the container is built and started
    Then the container runs successfully
    And tests execute without permission errors
    And the CI pipeline passes