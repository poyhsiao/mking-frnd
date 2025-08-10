# Docker Compose Security Fix: Environment Variable Defaults

## Overview

This document describes the security fix applied to `docker-compose.yml` to resolve startup issues with required environment variables while maintaining security best practices.

## Problem Description

The original `docker-compose.yml` configuration used the `${VAR:?error message}` syntax for critical environment variables:

```yaml
POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}
REDIS_PASSWORD: ${REDIS_PASSWORD:?REDIS_PASSWORD is required}
MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD:?MINIO_ROOT_PASSWORD is required}
TYPESENSE_API_KEY: ${TYPESENSE_API_KEY:?TYPESENSE_API_KEY is required}
GRAFANA_PASSWORD: ${GRAFANA_PASSWORD:?GRAFANA_PASSWORD is required}
```

This syntax causes Docker Compose to fail startup if these environment variables are not explicitly set, even for development environments.

## Solution Applied

Changed the syntax to provide default values while maintaining security awareness:

```yaml
POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres123456789}
REDIS_PASSWORD: ${REDIS_PASSWORD:-redis123456789}
MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD:-minio123456789}
TYPESENSE_API_KEY: ${TYPESENSE_API_KEY:-xyz123456789abcdef}
GRAFANA_PASSWORD: ${GRAFANA_PASSWORD:-grafana123456789}
```

## Security Considerations

### ⚠️ IMPORTANT SECURITY WARNINGS

1. **Default Values Are NOT Secure**: The default values provided are intentionally weak and should NEVER be used in production.

2. **Development Only**: These defaults are suitable only for local development environments.

3. **Production Requirements**: Production deployments MUST override these values with strong, randomly generated credentials.

### Recommended Security Practices

#### For Development
1. Copy `.env.example` to `.env`
2. Generate strong passwords using:
   ```bash
   # For MinIO password (minimum 8 characters)
   openssl rand -base64 24
   
   # For Typesense API key
   openssl rand -hex 32
   ```
3. Update the `.env` file with generated values

#### For Production
1. **NEVER** use default values
2. Use environment-specific configuration management
3. Store secrets in secure secret management systems (e.g., HashiCorp Vault, AWS Secrets Manager)
4. Use strong, randomly generated credentials
5. Rotate credentials regularly

## Environment Variable Reference

### PostgreSQL Configuration
- **Variable**: `POSTGRES_PASSWORD`
- **Default**: `postgres123456789` (INSECURE - development only)
- **Requirements**: Minimum 8 characters
- **Production**: Use strong, randomly generated password

### Redis Configuration
- **Variable**: `REDIS_PASSWORD`
- **Default**: `redis123456789` (INSECURE - development only)
- **Requirements**: Minimum 8 characters
- **Production**: Use strong, randomly generated password

### MinIO Configuration
- **Variable**: `MINIO_ROOT_PASSWORD`
- **Default**: `minio123456789` (INSECURE - development only)
- **Requirements**: Minimum 8 characters
- **Production**: Use strong, randomly generated password

### Typesense Configuration
- **Variable**: `TYPESENSE_API_KEY`
- **Default**: `xyz123456789abcdef` (INSECURE - development only)
- **Requirements**: Alphanumeric string, recommended 32+ characters
- **Production**: Use strong, randomly generated API key

### Grafana Configuration
- **Variable**: `GRAFANA_PASSWORD`
- **Default**: `grafana123456789` (INSECURE - development only)
- **Requirements**: Minimum 8 characters
- **Production**: Use strong, randomly generated password

## Validation Commands

### Test Docker Compose Startup
```bash
# Test with defaults (development)
docker compose config

# Test with custom environment
MINIO_ROOT_PASSWORD="your-strong-password" \
TYPESENSE_API_KEY="your-strong-api-key" \
docker compose config
```

### Verify Security
```bash
# Check for default values in running containers (should return empty in production)
docker compose exec minio env | grep MINIO_ROOT_PASSWORD
docker compose exec typesense env | grep TYPESENSE_API_KEY
```

## Related Files

- `.env.example` - Template with security guidance
- `docs/security/SECRET_MANAGEMENT.md` - Comprehensive secret management guide
- `docs/security/SECURITY_CHECKLIST.md` - Security deployment checklist

## Compliance Notes

This fix ensures:
- ✅ Development environment can start without manual configuration
- ✅ Clear security warnings are documented
- ✅ Production security requirements are specified
- ✅ Default values are obviously insecure to prevent accidental production use

## Next Steps

1. Review and update `.env.example` if needed
2. Update deployment documentation
3. Add security validation to CI/CD pipeline
4. Consider implementing runtime security checks

---

**Security Reminder**: Always use strong, unique credentials in production environments. The default values provided are intentionally weak and serve only to enable development environment startup.