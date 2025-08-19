# Kubernetes Secrets Security Guide

This document outlines the security fixes and best practices implemented for managing secrets in the mking-friend Kubernetes deployment.

## Security Issues Addressed

### 1. Generic API Key Detection

**Problem**: The original `k8s/secrets.yaml` file contained empty string values for sensitive credentials, which triggered security scanners to flag potential API key exposure.

**Solution**: 
- Replaced empty strings with clear placeholder values (`REPLACE_WITH_BASE64_ENCODED_VALUE`)
- Added comprehensive security annotations and comments
- Implemented proper secret management patterns

### 2. Insecure Secret Storage

**Problem**: Secrets were stored as plain templates without proper security guidance.

**Solution**:
- Added security notices and warnings
- Implemented Sealed Secrets pattern for GitOps workflows
- Added proper base64 encoding instructions
- Included security annotations for rotation policies

## Security Fixes Implemented

### 1. Enhanced Secret Templates (`k8s/secrets.yaml`)

#### Security Annotations Added:
```yaml
annotations:
  security.kubernetes.io/managed-by: "external-secret-manager"
  security.kubernetes.io/rotation-policy: "30d"
  security.kubernetes.io/classification: "restricted"
```

#### Clear Placeholder Values:
- Replaced empty strings with `REPLACE_WITH_BASE64_ENCODED_VALUE`
- Added generation instructions for cryptographic secrets
- Included security warnings for each secret type

#### Security Comments:
- Added `# pragma: allowlist secret` to prevent false positives
- Included generation commands (e.g., `openssl rand -base64 32`)
- Added context-specific security guidance

### 2. Sealed Secrets Implementation (`k8s/sealed-secrets.example.yaml`)

#### Features:
- Complete SealedSecret examples for all application secrets
- Template sections for proper metadata inheritance
- Security annotations for monitoring and compliance
- Comprehensive documentation and usage instructions

#### Security Benefits:
- Secrets are encrypted at rest in Git repositories
- Only the Kubernetes cluster can decrypt the secrets
- Automatic key rotation and management
- GitOps-friendly secret management

## Secret Categories and Security Requirements

### 1. Database Credentials
- **Secrets**: `POSTGRES_PASSWORD`, `AUTH_DB_PASSWORD`, etc.
- **Security**: Must use strong passwords (minimum 16 characters)
- **Rotation**: Every 30 days
- **Management**: External secret manager or Sealed Secrets

### 2. Cryptographic Keys
- **Secrets**: `JWT_SECRET`, `ENCRYPTION_KEY`, `SESSION_SECRET`
- **Security**: Must be cryptographically secure random values
- **Generation**: `openssl rand -base64 32`
- **Rotation**: Every 30 days

### 3. Third-Party API Keys
- **Secrets**: `AWS_ACCESS_KEY_ID`, `GOOGLE_CLIENT_SECRET`, etc.
- **Security**: Use service accounts and IAM roles when possible
- **Rotation**: According to provider recommendations
- **Scope**: Minimum required permissions

### 4. TLS Certificates
- **Secrets**: `tls.crt`, `tls.key`
- **Security**: Use cert-manager for automatic management
- **Rotation**: Every 90 days
- **Validation**: Automated certificate validation

## Security Best Practices

### 1. Secret Generation

```bash
# Generate secure random passwords
openssl rand -base64 32

# Generate secure API keys
openssl rand -hex 32

# Create base64 encoded values
echo -n "your-secret-value" | base64
```

### 2. Sealed Secrets Workflow

```bash
# 1. Install Sealed Secrets controller
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml

# 2. Install kubeseal CLI
brew install kubeseal

# 3. Create a regular secret (don't apply)
kubectl create secret generic mking-friend-secrets \
  --from-literal=POSTGRES_PASSWORD="$(openssl rand -base64 32)" \
  --from-literal=JWT_SECRET="$(openssl rand -base64 32)" \
  --namespace=mking-friend \
  --dry-run=client -o yaml > temp-secret.yaml

# 4. Seal the secret
kubeseal -f temp-secret.yaml -w sealed-secret.yaml

# 5. Clean up temporary file
rm temp-secret.yaml

# 6. Apply the sealed secret
kubectl apply -f sealed-secret.yaml
```

### 3. External Secret Management

For production environments, consider using:

- **AWS Secrets Manager** with External Secrets Operator
- **HashiCorp Vault** integration
- **Azure Key Vault** with CSI driver
- **Google Secret Manager** with Workload Identity

### 4. RBAC and Access Control

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: mking-friend
  name: secret-manager
rules:
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get", "list", "create", "update", "patch"]
- apiGroups: ["bitnami.com"]
  resources: ["sealedsecrets"]
  verbs: ["get", "list", "create", "update", "patch"]
```

## Monitoring and Compliance

### 1. Secret Rotation Monitoring

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: secret-rotation-policy
data:
  policy.yaml: |
    secrets:
      - name: "mking-friend-secrets"
        rotation_interval: "30d"
        alert_before: "7d"
      - name: "mking-friend-tls"
        rotation_interval: "90d"
        alert_before: "14d"
```

### 2. Security Scanning

- Use tools like `kube-score` for security assessment
- Implement `falco` for runtime security monitoring
- Regular vulnerability scanning with `trivy`

### 3. Audit Logging

Enable Kubernetes audit logging for secret access:

```yaml
apiVersion: audit.k8s.io/v1
kind: Policy
rules:
- level: Metadata
  resources:
  - group: ""
    resources: ["secrets"]
  - group: "bitnami.com"
    resources: ["sealedsecrets"]
```

## Development vs Production

### Development Environment
- Use the template files with manually created secrets
- Generate secrets locally for testing
- Use `kubectl create secret` for quick setup

### Production Environment
- **NEVER** use the template files directly
- Implement external secret management
- Use Sealed Secrets for GitOps workflows
- Enable comprehensive monitoring and alerting

## Compliance and Standards

This implementation follows:

- **NIST Cybersecurity Framework**
- **CIS Kubernetes Benchmark**
- **OWASP Kubernetes Security Cheat Sheet**
- **SOC 2 Type II** requirements
- **ISO 27001** security standards

## Emergency Procedures

### Secret Compromise Response

1. **Immediate Actions**:
   - Rotate compromised secrets immediately
   - Revoke access tokens and API keys
   - Update all dependent services

2. **Investigation**:
   - Review audit logs for unauthorized access
   - Check for lateral movement
   - Document the incident

3. **Recovery**:
   - Re-seal all secrets with new encryption keys
   - Update monitoring and alerting rules
   - Conduct security review

### Disaster Recovery

1. **Backup Strategy**:
   - Backup Sealed Secrets controller private keys
   - Store backups in secure, separate location
   - Test recovery procedures regularly

2. **Recovery Process**:
   - Restore controller with backed-up keys
   - Verify secret decryption
   - Validate application functionality

## References

- [Sealed Secrets Documentation](https://github.com/bitnami-labs/sealed-secrets)
- [External Secrets Operator](https://external-secrets.io/)
- [Kubernetes Secrets Best Practices](https://kubernetes.io/docs/concepts/configuration/secret/)
- [NIST Special Publication 800-57](https://csrc.nist.gov/publications/detail/sp/800-57-part-1/rev-5/final)