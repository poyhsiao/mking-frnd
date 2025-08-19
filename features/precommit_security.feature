Feature: Pre-commit Security Hooks
  As a security-conscious developer
  I want pre-commit hooks to detect and prevent security issues
  So that no secrets or vulnerabilities are committed to the repository

  Background:
    Given the pre-commit configuration exists
    And the secrets baseline file exists

  Scenario: Pre-commit configuration should be valid
    Given the file ".pre-commit-config.yaml" exists
    When I parse the pre-commit configuration
    Then it should contain detect-secrets hook
    And it should contain gitleaks hook
    And it should contain basic file validation hooks
    And it should contain security linting hooks

  Scenario: Detect-secrets hook should be properly configured
    Given the pre-commit configuration exists
    When I check the detect-secrets hook configuration
    Then it should use the baseline file ".secrets.baseline"
    And it should exclude package-lock.json files
    And the baseline file should exist

  Scenario: Gitleaks hook should be configured
    Given the pre-commit configuration exists
    When I check the gitleaks hook configuration
    Then it should use the latest stable version
    And it should be enabled for all file types

  Scenario: Security hooks should prevent secret commits
    Given a test file with a potential secret
    When I simulate a pre-commit check
    Then the detect-secrets hook should flag the secret
    And the commit should be blocked

  Scenario: Docker security scanning should be enabled
    Given the pre-commit configuration exists
    When I check the hadolint hook configuration
    Then it should scan Dockerfile for security issues
    And it should ignore specific non-critical rules

  Scenario: Kubernetes security scanning should be enabled
    Given the pre-commit configuration exists
    When I check the kube-linter hook configuration
    Then it should scan YAML files for Kubernetes security issues
    And it should be properly configured

  Scenario: Environment file validation should be active
    Given the pre-commit configuration exists
    When I check the local hooks configuration
    Then it should validate .env files for placeholder values
    And it should validate Docker Compose file syntax

  Scenario: Pre-commit hooks should be installable
    Given the pre-commit configuration exists
    When I attempt to install pre-commit hooks
    Then the installation should succeed
    And all hooks should be properly registered

  Scenario: Pre-commit hooks should run successfully on clean code
    Given the pre-commit configuration exists
    And the codebase contains no security issues
    When I run all pre-commit hooks
    Then all hooks should pass
    And no security violations should be detected

  Scenario: Pre-commit should block commits with security issues
    Given the pre-commit configuration exists
    And a file contains a hardcoded API key
    When I attempt to commit the file
    Then the commit should be blocked
    And a security violation should be reported