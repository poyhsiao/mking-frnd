Feature: Docker Compose Security - No Hardcoded Credentials
  As a security engineer
  I want to ensure that all Docker Compose files use environment variables for sensitive data
  So that credentials are not hardcoded and can be managed securely

  Background:
    Given the project has multiple Docker Compose files
    And security is a top priority

  Scenario: Main docker-compose.yml should not contain hardcoded passwords
    Given the file "docker-compose.yml" exists
    When I analyze the file for hardcoded credentials
    Then it should not contain any hardcoded passwords
    And all sensitive environment variables should use the "required" syntax
    And PostgreSQL password should use "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}"
    And Redis password should use "${REDIS_PASSWORD:?REDIS_PASSWORD is required}"
    And MinIO password should use "${MINIO_ROOT_PASSWORD:?MINIO_ROOT_PASSWORD is required}"
    And Typesense API key should use "${TYPESENSE_API_KEY:?TYPESENSE_API_KEY is required}"
    And Grafana password should use "${GRAFANA_PASSWORD:?GRAFANA_PASSWORD is required}"

  Scenario: Test docker-compose.test.yml should require environment variables
    Given the file "docker-compose.test.yml" exists
    When I analyze the file for hardcoded credentials
    Then it should not contain any hardcoded test passwords
    And all test environment variables should use the "required" syntax
    And PostgreSQL test password should use "${POSTGRES_TEST_PASSWORD:?POSTGRES_TEST_PASSWORD is required}"
    And MinIO test password should use "${MINIO_TEST_PASSWORD:?MINIO_TEST_PASSWORD is required}"
    And Typesense test API key should use "${TYPESENSE_TEST_API_KEY:?TYPESENSE_TEST_API_KEY is required}"
    And JWT test secret should use "${JWT_TEST_SECRET:?JWT_TEST_SECRET is required}"
    And encryption test key should use "${ENCRYPTION_TEST_KEY:?ENCRYPTION_TEST_KEY is required}"

  Scenario: Development docker-compose.dev.yml should require environment variables
    Given the file "docker-compose.dev.yml" exists
    When I analyze the file for hardcoded credentials
    Then it should not contain any hardcoded development passwords
    And PostgreSQL dev password should use "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}"
    And JWT secret should use "${JWT_SECRET:?JWT_SECRET is required}"
    And database URL should use environment variable substitution

  Scenario: Production docker-compose.prod.yml should use secure environment variables
    Given the file "docker-compose.prod.yml" exists
    When I analyze the file for hardcoded credentials
    Then it should not contain any hardcoded production passwords
    And all production secrets should be externally managed
    And JWT secret should use "${JWT_SECRET}" without defaults
    And encryption key should use "${ENCRYPTION_KEY}" without defaults

  Scenario: Environment example file should provide secure templates
    Given the file ".env.example" exists
    When I analyze the environment template
    Then it should contain placeholders for all required passwords
    And it should include security warnings for each credential
    And it should provide password generation commands
    And all example passwords should be "CHANGE_ME_*" format
    And it should include test environment variables

  Scenario: Validate environment variable consistency across files
    Given all Docker Compose files exist
    When I compare environment variable usage
    Then all referenced environment variables should be documented in ".env.example"
    And variable names should be consistent across all files
    And no environment variable should have conflicting default values

  Scenario: Security validation script should detect hardcoded secrets
    Given the security validation script exists
    When I run the credential validation
    Then it should scan all Docker Compose files
    And it should detect any remaining hardcoded passwords
    And it should verify environment variable syntax
    And it should pass with no security violations