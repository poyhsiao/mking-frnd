# Kubernetes Manifests

This directory contains Kubernetes manifests for deploying the MKing Friend
application.

## Files Overview

- `namespace.yaml` - Creates the mking-friend namespace
- `configmap.yaml` - Non-sensitive configuration values
- `secrets.yaml` - Secret template (DO NOT put actual secrets here)
- `secrets.template.yaml` - Template for creating actual secrets
- `postgres-deployment.yaml` - PostgreSQL database deployment
- `redis-deployment.yaml` - Redis cache deployment

## Secret Management

⚠️ **IMPORTANT**: The `secrets.yaml` file in this repository contains only
placeholders. **Never commit actual secrets to version control.**

### For Development

1. Copy the template:

   ```bash
   cp secrets.template.yaml secrets.dev.yaml
   ```

2. Edit `secrets.dev.yaml` and replace all `REPLACE_WITH_ACTUAL_*` placeholders
   with real values

3. Apply the secrets:

   ```bash
   kubectl apply -f secrets.dev.yaml
   ```

4. The `secrets.dev.yaml` file is automatically ignored by git

### For Production

Use external secret management systems:

- **AWS Secrets Manager** with External Secrets Operator
- **HashiCorp Vault**
- **Sealed Secrets**
- **CI/CD pipeline injection**

See [Secret Management Guide](../docs/security/SECRET_MANAGEMENT.md) for
detailed instructions.

## Deployment Order

1. Create namespace:

   ```bash
   kubectl apply -f namespace.yaml
   ```

2. Create secrets (using your method of choice):

   ```bash
   kubectl apply -f secrets.dev.yaml  # or your secret management solution
   ```

3. Apply configuration:

   ```bash
   kubectl apply -f configmap.yaml
   ```

4. Deploy services:
   ```bash
   kubectl apply -f postgres-deployment.yaml
   kubectl apply -f redis-deployment.yaml
   ```

## Environment Variables in Database Init

The PostgreSQL initialization script now uses environment variables for database
passwords:

- `${AUTH_DB_PASSWORD}` - Auth service database password
- `${USER_DB_PASSWORD}` - User service database password
- `${CHAT_DB_PASSWORD}` - Chat service database password
- `${MEDIA_DB_PASSWORD}` - Media service database password
- `${ADMIN_DB_PASSWORD}` - Admin service database password

These are automatically injected from the Kubernetes secrets.

## Security Best Practices

1. **Never commit secrets to git**
2. **Use different secrets for each environment**
3. **Rotate secrets regularly**
4. **Use external secret management in production**
5. **Enable secret encryption at rest**
6. **Monitor secret access**

## Troubleshooting

### Check if secrets exist

```bash
kubectl get secrets -n mking-friend
```

### View secret structure (not values)

```bash
kubectl describe secret mking-friend-secrets -n mking-friend
```

### Check pod logs for secret-related issues

```bash
kubectl logs -n mking-friend deployment/postgres
```

### Verify environment variables in pod

```bash
kubectl exec -n mking-friend deployment/postgres -- env | grep -E '(POSTGRES|AUTH_DB|USER_DB)'
```
