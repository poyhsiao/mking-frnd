Feature: GitHub Actions jq Health Check Fix
  As a DevOps engineer
  I want to ensure that the jq command in GitHub Actions correctly parses Docker Compose health status
  So that the CI/CD pipeline can reliably detect service health

  Background:
    Given I have a Docker Compose test configuration
    And the postgres-test service is defined with health checks
    And the GitHub Actions workflow uses jq to parse health status

  Scenario: jq command successfully parses Docker Compose JSON output
    Given the postgres-test service is running
    When I execute the docker compose ps command with JSON format
    Then the output should be valid JSON
    And the jq command should successfully extract the health status
    And the Service field should match "postgres-test"

  Scenario: jq command handles different health states correctly
    Given the postgres-test service is in "starting" state
    When I use jq to extract the health status
    Then the health status should be "starting"
    And no jq parsing errors should occur

    Given the postgres-test service is in "healthy" state
    When I use jq to extract the health status
    Then the health status should be "healthy"
    And no jq parsing errors should occur

  Scenario: jq command handles edge cases gracefully
    Given the docker compose ps output contains multiple services
    When I filter for the postgres-test service using jq
    Then only the postgres-test service data should be returned
    And the Service field should be correctly identified

  Scenario: Robust jq command with error handling
    Given I have a potentially malformed JSON input
    When I use an improved jq command with error handling
    Then the command should not fail with "Cannot index string with string" error
    And appropriate fallback behavior should be implemented

  @github-actions @health-check @jq
  Scenario: GitHub Actions workflow uses corrected jq command
    Given the GitHub Actions workflow contains the health check function
    When the check_container_health function is called for postgres-test
    Then the jq command should parse the JSON correctly
    And the health status should be extracted without errors
    And the workflow should proceed based on the correct health status