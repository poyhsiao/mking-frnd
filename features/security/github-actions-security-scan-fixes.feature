Feature: GitHub Actions Security Scan Fixes
  As a DevOps engineer
  I want to fix all security scanning issues in GitHub Actions
  So that the CI/CD pipeline passes security validation without critical vulnerabilities

  Background:
    Given the GitHub Actions security workflow exists
    And the security scanning tools are properly configured
    And the project follows security best practices

  @security @critical
  Scenario: Secret detection scan passes without false positives
    Given the Gitleaks configuration is properly set up
    And the TruffleHog scanner is configured with verified-only mode
    When the secret detection scan runs
    Then no real secrets should be detected in the codebase
    And the .secrets.baseline file should contain only approved exceptions
    And all environment variable references should use proper templating

  @security @high
  Scenario: Dependency vulnerability scan shows no critical issues
    Given the project dependencies are installed
    And the Snyk token is properly configured
    When the dependency vulnerability scan runs
    Then no critical or high severity vulnerabilities should be found
    And all medium severity issues should be documented or fixed
    And the pnpm audit should pass with acceptable risk levels

  @security @high
  Scenario: Static Application Security Testing (SAST) passes
    Given the CodeQL analysis is configured for JavaScript/TypeScript
    And Semgrep rules are set for security, secrets, and OWASP top 10
    When the SAST scan runs
    Then no critical security vulnerabilities should be detected
    And all security-related code patterns should follow best practices
    And no hardcoded credentials should be found

  @security @medium
  Scenario: Container security scan shows acceptable risk levels
    Given the Docker images are built successfully
    And Trivy scanner is configured for critical, high, and medium severity
    When the container security scan runs
    Then no critical vulnerabilities should be found in base images
    And high severity issues should be documented with mitigation plans
    And the SARIF results should be uploaded to GitHub Security tab

  @security @medium
  Scenario: Infrastructure security scan validates configurations
    Given the Checkov scanner is configured for Docker, Kubernetes, and Docker Compose
    And kube-linter is set up for Kubernetes manifests
    When the infrastructure security scan runs
    Then all Docker configurations should follow security best practices
    And Kubernetes manifests should pass security policy checks
    And Docker Compose files should not expose sensitive information

  @security @integration
  Scenario: Security workflow completes successfully in CI/CD
    Given all security scanning tools are properly configured
    And the GitHub Actions workflow has appropriate permissions
    When the complete security workflow runs
    Then all security scan jobs should complete successfully
    And the security report should show acceptable risk levels
    And SARIF results should be properly uploaded to GitHub Security tab
    And Slack notifications should be sent only for actual security issues

  @security @fix
  Scenario: Fix hardcoded secrets and credentials
    Given the codebase contains potential hardcoded secrets
    When I scan for hardcoded credentials
    Then all database passwords should use environment variables
    And all API keys should be externalized to environment configuration
    And all JWT secrets should be properly configured
    And test credentials should be clearly marked as non-production

  @security @fix
  Scenario: Update vulnerable dependencies
    Given the dependency scan shows vulnerable packages
    When I update the vulnerable dependencies
    Then all critical and high severity vulnerabilities should be resolved
    And the package.json files should reference secure versions
    And the pnpm-lock.yaml should be updated with secure package versions
    And no breaking changes should be introduced

  @security @fix
  Scenario: Fix container security vulnerabilities
    Given the container scan shows vulnerable base images or packages
    When I update the Dockerfile configurations
    Then the base images should be updated to latest secure versions
    And unnecessary packages should be removed from containers
    And the containers should run with non-root users
    And security headers should be properly configured

  @security @fix
  Scenario: Fix infrastructure security misconfigurations
    Given the infrastructure scan shows security misconfigurations
    When I update the configuration files
    Then Docker Compose files should not expose unnecessary ports
    And Kubernetes manifests should include security contexts
    And sensitive environment variables should be properly managed
    And resource limits should be configured appropriately

  @security @validation
  Scenario: Validate security fixes in test environment
    Given all security fixes have been implemented
    And the test environment is properly configured
    When I run the complete test suite
    Then all unit tests should pass
    And all integration tests should pass
    And all e2e tests should pass
    And the security scans should show improved risk levels

  @security @monitoring
  Scenario: Security monitoring and alerting works correctly
    Given the security scanning workflow is configured
    And Slack notifications are set up
    When a security issue is detected
    Then the appropriate team should be notified
    And the GitHub Security tab should show the findings
    And the security report should be generated
    And the workflow should fail if critical issues are found