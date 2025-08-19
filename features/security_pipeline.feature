Feature: Security Pipeline Validation
  As a security engineer
  I want to ensure the CI/CD security pipeline is properly configured
  So that vulnerabilities are detected and reported correctly

  Background:
    Given the security workflow file exists
    And the workflow has proper permissions configured

  Scenario: Secret detection workflow validation
    When I check the secret-scan job configuration
    Then it should include Gitleaks scanner
    And it should include TruffleHog scanner
    And it should upload SARIF results to GitHub Security tab
    And it should have proper security-events write permissions

  Scenario: Dependency vulnerability scanning validation
    When I check the dependency-scan job configuration
    Then it should scan both backend and frontend directories
    And it should use pnpm audit with moderate severity threshold
    And it should use Snyk security scanner
    And it should upload audit results as artifacts
    And it should upload SARIF results to GitHub Security tab

  Scenario: Static Application Security Testing validation
    When I check the sast-scan job configuration
    Then it should include CodeQL analysis
    And it should include Semgrep security rules
    And it should scan JavaScript and TypeScript languages
    And it should use security-extended queries
    And it should upload SARIF results to GitHub Security tab

  Scenario: Container security scanning validation
    When I check the container-scan job configuration
    Then it should build Docker images for backend and frontend
    And it should use Trivy vulnerability scanner
    And it should scan for CRITICAL, HIGH, and MEDIUM severity issues
    And it should upload SARIF results to GitHub Security tab
    And it should only run on push or schedule events

  Scenario: Infrastructure security scanning validation
    When I check the infrastructure-scan job configuration
    Then it should include Checkov scanner
    And it should include kube-linter scanner
    And it should include Hadolint for Dockerfile security
    And it should scan Dockerfile, Kubernetes, and Docker Compose files
    And it should upload SARIF results to GitHub Security tab

  Scenario: Security reporting validation
    When I check the security-report job configuration
    Then it should depend on all security scan jobs
    And it should generate a security scan summary
    And it should notify on security issues via Slack
    And it should run even if other jobs fail

  Scenario: Workflow triggers validation
    When I check the workflow triggers
    Then it should trigger on push to main and develop branches
    And it should trigger on pull requests to main and develop branches
    And it should trigger on daily schedule at 2 AM UTC

  Scenario: SARIF upload validation
    When I check all security scan jobs
    Then each job should upload SARIF results
    And SARIF uploads should use the latest CodeQL action
    And SARIF uploads should run even if scans fail

  Scenario: Security permissions validation
    When I check workflow permissions
    Then the top-level permissions should be read-only for contents
    And each job should have minimal required permissions
    And security-events write permission should be granted where needed
    And actions read permission should be granted for security-report job