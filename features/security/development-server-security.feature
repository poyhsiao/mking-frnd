Feature: Development Server Security
  As a developer
  I want to ensure the development server is secure
  So that the application is protected from common vulnerabilities

  Background:
    Given I have a development server running

  Scenario: CORS blocking
    Given I have configured CORS settings
    When I make a request from an unauthorized origin
    Then the request should be rejected with appropriate CORS headers

  Scenario: Authorized origins
    Given I have configured CORS settings
    When I make a request from an authorized origin
    Then the request should be allowed

  Scenario: ESBuild vulnerability check
    Given I have the project dependencies installed
    When I check for ESBuild vulnerabilities
    Then no critical vulnerabilities should be found
    And ESBuild version should be 0.25.8 or higher

  Scenario: Default configuration security
    Given I have the default development server configuration
    When I analyze the security settings
    Then security headers should be properly configured
    And debug information should not be exposed in production mode

  Scenario: Security tests pass in CI/CD pipeline
    Given the CI/CD pipeline is running
    When security tests are executed
    Then all security checks should pass
    And no vulnerabilities should be detected