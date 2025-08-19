Feature: Documentation Security - No Hardcoded Secrets
  As a security engineer
  I want to ensure that documentation files contain no hardcoded secrets
  So that sensitive information is not exposed in version control

  Background:
    Given the project documentation exists
    And security scanning tools are available

  @critical @security
  Scenario: Documentation should not contain hardcoded passwords
    Given I scan the documentation files for hardcoded secrets
    When I check for common password patterns
    Then no hardcoded passwords should be found
    And all password references should use environment variables

  @critical @security
  Scenario: Documentation should not contain Base64-encoded secrets
    Given I scan the documentation files for Base64 patterns
    When I check for encoded secrets like "cGFzc3dvcmQ="
    Then no Base64-encoded secrets should be found
    And all examples should use placeholder values

  @high @security
  Scenario: JWT secrets should use environment variables
    Given I examine JWT configuration examples
    When I check for JWT_SECRET values
    Then JWT_SECRET should reference ${JWT_SECRET}
    And no hardcoded JWT secrets should be present

  @high @security
  Scenario: AWS credentials should use environment variables
    Given I examine AWS configuration examples
    When I check for AWS credential values
    Then AWS_ACCESS_KEY_ID should reference ${AWS_ACCESS_KEY_ID}
    And AWS_SECRET_ACCESS_KEY should reference ${AWS_SECRET_ACCESS_KEY}
    And no hardcoded AWS credentials should be present

  @medium @security
  Scenario: Database credentials should use environment variables
    Given I examine database configuration examples
    When I check for database credential values
    Then POSTGRES_PASSWORD should reference ${POSTGRES_PASSWORD}
    And DATABASE_URL should use environment variable substitution
    And no hardcoded database passwords should be present

  @medium @security
  Scenario: API keys should use environment variables
    Given I examine API configuration examples
    When I check for API key values
    Then TYPESENSE_API_KEY should reference ${TYPESENSE_API_KEY}
    And no hardcoded API keys should be present
    And security comments should guide proper key generation

  @low @security
  Scenario: Security comments should provide guidance
    Given I examine configuration examples with secrets
    When I check for security guidance comments
    Then each secret should have a security comment
    And comments should include generation instructions
    And comments should mention security best practices