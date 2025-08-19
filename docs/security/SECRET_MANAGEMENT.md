# Secret Management Guide

## Overview

This document outlines the secure management of secrets in the MKing Friend
project. **Secrets should never be committed to version control**, even if
base64-encoded.

## Security Principles

1. **Never commit secrets to version control**
2. **Use external secret management systems**
3. **Inject secrets via CI/CD pipelines**
4. **Use different secrets for different environments**
5. **Rotate secrets regularly**

## Secret Categories

The following secrets are required for the application:

### Database Secrets

- `POSTGRES_PASSWORD` - Main PostgreSQL password
- `AUTH_DB_PASSWORD` - Auth service database password
- `USER_DB_PASSWORD` - User service database password
- `CHAT_DB_PASSWORD` - Chat service database password
- `MEDIA_DB_PASSWORD` - Media service database password
- `ADMIN_DB_PASSWORD` - Admin service database password
- `DATABASE_URL` - Complete database connection string

### Application Secrets

- `JWT_SECRET` - JWT signing secret
- `JWT_REFRESH_SECRET` - JWT refresh token secret
- `SESSION_SECRET` - Session encryption secret
- `ENCRYPTION_KEY` - Data encryption key

### External Service Secrets

- `REDIS_PASSWORD` - Redis authentication
- `AWS_ACCESS_KEY_ID` & `AWS_SECRET_ACCESS_KEY` - AWS credentials
- `MINIO_ACCESS_KEY` & `MINIO_SECRET_KEY` - MinIO credentials
- `TYPESENSE_API_KEY` - Typesense search API key
- `SENTRY_DSN` - Error tracking service

### OAuth Secrets

- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` - Google OAuth
- `GITHUB_CLIENT_ID` & `GITHUB_CLIENT_SECRET` - GitHub OAuth

### Email Service

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` - Email configuration

## Development Environment

### Option 1: Manual Secret Creation

```bash
# Create the namespace first
kubectl create namespace mking-friend

# Create secrets manually
kubectl create secret generic mking-friend-secrets \
  --from-literal=POSTGRES_PASSWORD="your-dev-password" \
  --from-literal=AUTH_DB_PASSWORD="auth-dev-password" \
  --from-literal=USER_DB_PASSWORD="user-dev-password" \
  --from-literal=CHAT_DB_PASSWORD="chat-dev-password" \
  --from-literal=MEDIA_DB_PASSWORD="media-dev-password" \
  --from-literal=ADMIN_DB_PASSWORD="admin-dev-password" \
  --from-literal=JWT_SECRET="your-jwt-secret" \
  --from-literal=JWT_REFRESH_SECRET="your-refresh-secret" \
  --from-literal=REDIS_PASSWORD="redis-dev-password" \
  --namespace=mking-friend
```

### Option 2: Environment File (Development Only)

Create a `.env.secrets` file (add to .gitignore):

```bash
# .env.secrets (DO NOT COMMIT)
POSTGRES_PASSWORD=dev-password-123
AUTH_DB_PASSWORD=auth-dev-password
USER_DB_PASSWORD=user-dev-password
CHAT_DB_PASSWORD=chat-dev-password
MEDIA_DB_PASSWORD=media-dev-password
ADMIN_DB_PASSWORD=admin-dev-password
JWT_SECRET=dev-jwt-secret-key
JWT_REFRESH_SECRET=dev-refresh-secret-key
# ... add other secrets
```

Then create secrets from file:

```bash
kubectl create secret generic mking-friend-secrets \
  --from-env-file=.env.secrets \
  --namespace=mking-friend
```

## Production Environment

### Recommended Solutions

1. **AWS Secrets Manager** (if using AWS)
2. **HashiCorp Vault**
3. **Kubernetes External Secrets Operator**
4. **Sealed Secrets**
5. **Helm with external values**

### Example: External Secrets Operator

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: mking-friend-secrets
  namespace: mking-friend
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: vault-backend
    kind: SecretStore
  target:
    name: mking-friend-secrets
    creationPolicy: Owner
  data:
    - secretKey: POSTGRES_PASSWORD
      remoteRef:
        key: database
        property: postgres_password
    - secretKey: JWT_SECRET
      remoteRef:
        key: auth
        property: jwt_secret
  # ... other secrets
```

### Example: CI/CD Pipeline Secret Injection

```yaml
# GitHub Actions example
- name: Deploy to Kubernetes
  env:
    POSTGRES_PASSWORD: ${{ secrets.POSTGRES_PASSWORD }}
    JWT_SECRET: ${{ secrets.JWT_SECRET }}
  run: |
    # Create secrets from environment variables
    kubectl create secret generic mking-friend-secrets \
      --from-literal=POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
      --from-literal=JWT_SECRET="$JWT_SECRET" \
      --namespace=mking-friend \
      --dry-run=client -o yaml | kubectl apply -f -
```

## Secret Rotation

1. **Database passwords**: Rotate quarterly
2. **JWT secrets**: Rotate monthly
3. **API keys**: Rotate based on provider recommendations
4. **Certificates**: Auto-renewal with cert-manager

## Security Checklist

- [ ] No secrets in version control
- [ ] Different secrets per environment
- [ ] Secrets encrypted at rest
- [ ] Access logging enabled
- [ ] Regular secret rotation
- [ ] Principle of least privilege
- [ ] Secret scanning in CI/CD
- [ ] `.gitleaksignore` file is configured to prevent false positives
- [ ] Template files use safe placeholder patterns with
      `pragma: allowlist secret`

## Handling Security Scanner False Positives

Our Kubernetes secret templates use safe placeholder patterns to avoid
triggering security scanners while maintaining clear documentation of required
secrets.

### Approach Used

1. **Empty String Placeholders**: Use `""` instead of descriptive placeholders
   that might trigger scanners
2. **Pragma Comments**: Add `# pragma: allowlist secret` to explicitly mark safe
   lines
3. **TODO Comments**: Use `# TODO: inject-via-external-secret-manager` for clear
   documentation
4. **GitLeaks Ignore**: Configure `.gitleaksignore` to exclude template files

### Example Safe Pattern

```yaml
# Database passwords - inject via secret manager  # pragma: allowlist secret
AUTH_DB_PASSWORD: '' # TODO: inject-via-external-secret-manager
```

### Security Scanner Configuration

If using detect-secrets, you can also exclude specific patterns:

```bash
# Exclude template files
detect-secrets scan --exclude-files 'k8s/secrets\.yaml$'

# Exclude specific patterns
detect-secrets scan --exclude-secrets 'TODO: inject-via-external-secret-manager'
```

## Troubleshooting

### Check if secrets exist

```bash
kubectl get secrets -n mking-friend
kubectl describe secret mking-friend-secrets -n mking-friend
```

### View secret keys (not values)

```bash
kubectl get secret mking-friend-secrets -n mking-friend -o jsonpath='{.data}' | jq 'keys'
```

### Update a specific secret

```bash
kubectl patch secret mking-friend-secrets -n mking-friend \
  -p '{"data":{"POSTGRES_PASSWORD":"'$(echo -n "new-password" | base64)'"}}'
```

### Security Scanner False Positives

- Verify `.gitleaksignore` is properly configured
- Check that pragma comments are correctly formatted:
  `# pragma: allowlist secret`
- Consider using inline allowlisting for specific lines
- Update scanner configuration to exclude template patterns
- Use empty string placeholders instead of descriptive text

## References

- [Kubernetes Secrets Best Practices](https://kubernetes.io/docs/concepts/security/secrets-good-practices/)
- [External Secrets Operator](https://external-secrets.io/)
- [Sealed Secrets](https://sealed-secrets.netlify.app/)
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
