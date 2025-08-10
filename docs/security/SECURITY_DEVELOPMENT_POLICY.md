# Security Development Policy

## Overview

This document establishes mandatory security practices for all development
activities in the mking-frnd project. All developers, DevOps engineers, and
contributors must adhere to these policies to ensure the security and integrity
of our systems.

## 1. Secret Management Policy

### 1.1 Prohibited Practices

**NEVER commit the following to version control:**

- Passwords, API keys, or authentication tokens
- Private keys, certificates, or cryptographic secrets
- Database connection strings with embedded credentials
- Base64-encoded secrets (they are NOT encrypted)
- Environment files (`.env`) containing real secrets
- Configuration files with hardcoded credentials

### 1.2 Required Practices

**Environment Variables:**

```bash
# ✅ CORRECT: Use environment variables
JWT_SECRET=${JWT_SECRET}
DATABASE_URL=${DATABASE_URL}
API_KEY=${API_KEY}

# ❌ WRONG: Hardcoded secrets
JWT_SECRET="your-super-secret-key"
DATABASE_URL="postgresql://user:password@localhost/db"
API_KEY="sk-1234567890abcdef"
```

**Docker Compose:**

```yaml
# ✅ CORRECT: Environment variable injection
environment:
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
  JWT_SECRET: ${JWT_SECRET}

# ❌ WRONG: Hardcoded credentials
environment:
  POSTGRES_PASSWORD: postgres
  JWT_SECRET: hardcoded-secret
```

**Kubernetes Secrets:**

```yaml
# ✅ CORRECT: External secret management
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: app-secrets
spec:
  secretStoreRef:
    name: vault-backend
    kind: SecretStore
  target:
    name: app-secrets
  data:
  - secretKey: jwt-secret
    remoteRef:
      key: app/jwt
      property: secret

# ❌ WRONG: Base64 secrets in manifests
apiVersion: v1
kind: Secret
data:
  jwt-secret: eW91ci1zZWNyZXQ=  # This is visible!
```

### 1.3 Secret Generation

**Use cryptographically secure random generation:**

```bash
# Generate secure JWT secret (256-bit)
openssl rand -base64 32

# Generate secure password (32 characters)
openssl rand -base64 24

# Generate API key
uuidgen | tr -d '-' | tr '[:upper:]' '[:lower:]'
```

## 2. Code Security Standards

### 2.1 Input Validation

**Always validate and sanitize user input:**

```typescript
// ✅ CORRECT: Proper validation
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}

// ❌ WRONG: No validation
export class CreateUserDto {
  email: string;
  password: string;
}
```

### 2.2 SQL Injection Prevention

**Use parameterized queries:**

```typescript
// ✅ CORRECT: Parameterized query
const user = await prisma.user.findFirst({
  where: { email: userEmail },
});

// ❌ WRONG: String concatenation
const query = `SELECT * FROM users WHERE email = '${userEmail}'`;
```

### 2.3 Authentication & Authorization

**Implement proper JWT handling:**

```typescript
// ✅ CORRECT: Secure JWT configuration
const jwtConfig = {
  secret: process.env.JWT_SECRET,
  signOptions: {
    expiresIn: '15m',
    algorithm: 'HS256',
  },
};

// ❌ WRONG: Weak or missing configuration
const jwtConfig = {
  secret: 'weak-secret',
  signOptions: { expiresIn: '30d' }, // Too long
};
```

## 3. Development Workflow Security

### 3.1 Pre-commit Hooks

**Mandatory security checks before commit:**

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']

  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.0
    hooks:
      - id: gitleaks
```

### 3.2 Code Review Requirements

**Security-focused code reviews must verify:**

- No hardcoded secrets or credentials
- Proper input validation and sanitization
- Secure authentication and authorization
- Appropriate error handling (no information leakage)
- Secure communication (HTTPS, TLS)

### 3.3 Branch Protection

**Main branch must require:**

- At least 2 security-aware reviewers
- Passing security scans
- Up-to-date branches
- No force pushes

## 4. CI/CD Security

### 4.1 Pipeline Security Scanning

**Required security checks in CI/CD:**

```yaml
# .github/workflows/security.yml
name: Security Scan

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Secret scanning
      - name: Run Gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      # Dependency scanning
      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

      # SAST scanning
      - name: Run CodeQL
        uses: github/codeql-action/analyze@v2
```

### 4.2 Secret Management in CI/CD

**Use GitHub Secrets or equivalent:**

```yaml
# ✅ CORRECT: Using GitHub Secrets
env:
  JWT_SECRET: ${{ secrets.JWT_SECRET }}
  DATABASE_URL: ${{ secrets.DATABASE_URL }}

# ❌ WRONG: Hardcoded in workflow
env:
  JWT_SECRET: "hardcoded-secret"
  DATABASE_URL: "postgresql://user:pass@host/db"
```

## 5. Infrastructure Security

### 5.1 Container Security

**Dockerfile security best practices:**

```dockerfile
# ✅ CORRECT: Security-focused Dockerfile
FROM node:18-alpine AS base

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Don't run as root
USER nextjs

# Use specific versions
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

# ❌ WRONG: Security issues
FROM node:latest  # Unspecified version
RUN apt-get update  # Running as root
COPY . .  # Copying everything
```

### 5.2 Network Security

**Secure service communication:**

```yaml
# ✅ CORRECT: Internal network isolation
networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true # No external access

services:
  database:
    networks:
      - backend # Only backend access

  api:
    networks:
      - frontend
      - backend
```

## 6. Monitoring and Incident Response

### 6.1 Security Monitoring

**Required monitoring:**

- Failed authentication attempts
- Unusual API access patterns
- Database query anomalies
- File system access violations

### 6.2 Incident Response

**In case of security incident:**

1. **Immediate**: Isolate affected systems
2. **Within 1 hour**: Assess impact and notify team
3. **Within 4 hours**: Implement containment measures
4. **Within 24 hours**: Root cause analysis
5. **Within 1 week**: Post-incident review and improvements

## 7. Training and Awareness

### 7.1 Required Training

**All developers must complete:**

- OWASP Top 10 awareness training
- Secure coding practices
- Secret management best practices
- Incident response procedures

### 7.2 Regular Security Reviews

**Monthly security activities:**

- Dependency vulnerability scanning
- Access review and cleanup
- Security policy updates
- Threat modeling sessions

## 8. Compliance and Auditing

### 8.1 Security Audits

**Quarterly security audits must include:**

- Code security review
- Infrastructure security assessment
- Access control verification
- Compliance gap analysis

### 8.2 Documentation Requirements

**Maintain security documentation:**

- Security architecture diagrams
- Threat models and risk assessments
- Incident response playbooks
- Security training records

## 9. Enforcement

### 9.1 Policy Violations

**Consequences for policy violations:**

- **First violation**: Mandatory security training
- **Second violation**: Code review privileges suspended
- **Third violation**: Escalation to management

### 9.2 Automated Enforcement

**Automated tools will:**

- Block commits containing secrets
- Fail CI/CD pipelines with security issues
- Generate security alerts for violations
- Require security approval for sensitive changes

## 10. Policy Updates

This policy will be reviewed and updated:

- Quarterly by the security team
- After any security incident
- When new threats or technologies emerge
- Based on industry best practices evolution

---

**Policy Version**: 1.0 **Effective Date**: $(date) **Next Review**: $(date -d
'+3 months') **Owner**: Security Team **Approved By**: CTO
