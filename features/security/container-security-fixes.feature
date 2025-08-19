Feature: Container Security Fixes Validation
  As a security engineer
  I want to validate that all container security vulnerabilities have been fixed
  So that our Docker containers follow security best practices

  Background:
    Given the Docker containers are built with security configurations
    And the Kubernetes deployments use secure contexts
    And the Trivy security scanner is available

  @security @critical
  Scenario: Frontend Dockerfile uses non-root user
    Given the frontend Dockerfile exists
    When I analyze the Dockerfile security configuration
    Then the container should run as a non-root user
    And the user "testuser" should be created with proper permissions
    And the working directory should have correct ownership
    And no privileged operations should be performed

  @security @critical
  Scenario: Backend Dockerfile follows security best practices
    Given the backend Dockerfile exists
    When I analyze the Dockerfile security configuration
    Then the container should run as a non-root user
    And the "backend" user should be created with minimal privileges
    And sensitive files should not be copied to the container
    And the container should use multi-stage builds for security

  @security @high
  Scenario: Kubernetes PostgreSQL deployment uses secure context
    Given the PostgreSQL deployment manifest exists
    When I validate the security context configuration
    Then the pod should run as non-root user (999)
    And readOnlyRootFilesystem should be set to true
    And privilege escalation should be disabled
    And all capabilities should be dropped
    And temporary volumes should be mounted for writable directories

  @security @high
  Scenario: Kubernetes Redis deployment uses secure context
    Given the Redis deployment manifest exists
    When I validate the security context configuration
    Then the pod should run as non-root user (999)
    And readOnlyRootFilesystem should be set to true
    And privilege escalation should be disabled
    And all capabilities should be dropped
    And temporary volumes should be mounted for writable directories

  @security @critical
  Scenario: External Secrets Operator uses minimal RBAC permissions
    Given the external-secrets-operator manifest exists
    When I validate the RBAC configuration
    Then it should use Role instead of ClusterRole
    And permissions should be scoped to the mking-friend namespace
    And secret access should be limited to specific resource names
    And no cluster-wide permissions should be granted

  @security @medium
  Scenario: Docker images pass vulnerability scanning
    Given the Docker images are built
    When I run Trivy security scan on all images
    Then no critical vulnerabilities should be found
    And high severity vulnerabilities should be documented
    And base images should be from trusted sources
    And images should use minimal attack surface

  @security @medium
  Scenario: Kubernetes manifests pass security policy validation
    Given all Kubernetes manifests exist
    When I run security policy validation
    Then all deployments should use security contexts
    And no containers should run with root privileges
    And resource limits should be defined
    And network policies should be configured appropriately

  @security @low
  Scenario: Docker Compose configurations are secure
    Given the Docker Compose files exist
    When I validate the service configurations
    Then sensitive data should be passed via secrets or environment variables
    And no hardcoded passwords should be present
    And services should use appropriate network isolation
    And volumes should have proper access controls