Feature: External Secrets Operator Security
  As a DevOps engineer
  I want to ensure that External Secrets Operator is properly configured
  So that secrets are managed securely without hardcoding

  Background:
    Given the External Secrets Operator configuration exists
    And the Kubernetes cluster is accessible

  Scenario: External Secrets Operator configuration should be valid
    Given the file "k8s/external-secrets-operator.yaml" exists
    When I parse the YAML configuration
    Then it should contain valid Kubernetes manifests
    And it should define SecretStore resources
    And it should define ExternalSecret resources
    And it should define proper RBAC configurations

  Scenario: SecretStore should be properly configured
    Given the External Secrets Operator configuration file
    When I examine the SecretStore definitions
    Then each SecretStore should have a valid provider configuration
    And each SecretStore should have proper metadata labels
    And each SecretStore should have security annotations
    And the Vault SecretStore should specify authentication method
    And the AWS SecretStore should reference credentials properly

  Scenario: ExternalSecret should reference valid SecretStores
    Given the External Secrets Operator configuration file
    When I examine the ExternalSecret definitions
    Then each ExternalSecret should reference an existing SecretStore
    And each ExternalSecret should have a valid refresh interval
    And each ExternalSecret should define proper target secret metadata
    And each ExternalSecret should map remote secrets to local keys

  Scenario: External secrets should cover all required application secrets
    Given the External Secrets Operator configuration file
    When I examine the secret mappings in ExternalSecret
    Then it should include database passwords
    And it should include JWT secrets
    And it should include Redis password
    And it should include AWS credentials
    And it should include MinIO credentials
    And it should include Typesense API key
    And it should include OAuth client secrets
    And it should include SMTP credentials
    And it should include Sentry DSN
    And it should include encryption keys
    And it should include session secrets

  Scenario: RBAC configuration should follow least privilege principle
    Given the External Secrets Operator configuration file
    When I examine the RBAC configurations
    Then the ServiceAccount should be properly defined
    And the ClusterRole should have minimal required permissions
    And the ClusterRoleBinding should link ServiceAccount to ClusterRole
    And permissions should be limited to secrets and external-secrets resources

  Scenario: Security annotations should be present
    Given the External Secrets Operator configuration file
    When I examine all resource definitions
    Then each resource should have security classification annotations
    And each resource should have managed-by annotations
    And ExternalSecret should have rotation policy annotations
    And all resources should have proper labels for identification

  Scenario: No hardcoded secrets should exist in configuration
    Given the External Secrets Operator configuration file
    When I scan the file content for potential secrets
    Then it should not contain any base64 encoded values
    And it should not contain any password literals
    And it should not contain any API key literals
    And it should not contain any token literals
    And all sensitive data should be referenced from external sources

  Scenario: Configuration should support multiple secret backends
    Given the External Secrets Operator configuration file
    When I examine the SecretStore definitions
    Then it should define a Vault SecretStore
    And it should define an AWS Secrets Manager SecretStore
    And each SecretStore should have distinct names
    And each SecretStore should be properly configured for its provider

  Scenario: Secret refresh and rotation should be configured
    Given the External Secrets Operator configuration file
    When I examine the ExternalSecret refresh settings
    Then the refresh interval should be set to a reasonable value
    And the rotation policy annotation should be present
    And the refresh interval should not be too frequent to avoid rate limiting
    And the refresh interval should not be too infrequent for security

  Scenario: Target secret template should be properly configured
    Given the External Secrets Operator configuration file
    When I examine the ExternalSecret target configuration
    Then the target secret should have proper metadata
    And the target secret should have security labels
    And the target secret should have security annotations
    And the creation policy should be set to Owner
    And the secret type should be Opaque