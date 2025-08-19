#!/bin/bash

# Secure Secret Generation Script for mking-friend
# This script generates cryptographically secure secrets for the application

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="mking-friend"
SECRET_NAME="mking-friend-secrets"
TLS_SECRET_NAME="mking-friend-tls"
OUTPUT_DIR="./k8s/generated"
TEMP_DIR="/tmp/mking-secrets-$$"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_dependencies() {
    log_info "Checking dependencies..."
    
    if ! command -v openssl &> /dev/null; then
        log_error "openssl is required but not installed."
        exit 1
    fi
    
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is required but not installed."
        exit 1
    fi
    
    if ! command -v base64 &> /dev/null; then
        log_error "base64 is required but not installed."
        exit 1
    fi
    
    log_success "All dependencies are available."
}

generate_secure_password() {
    local length=${1:-32}
    openssl rand -base64 $length | tr -d "\n"
}

generate_hex_key() {
    local length=${1:-32}
    openssl rand -hex $length | tr -d "\n"
}

base64_encode() {
    echo -n "$1" | base64 | tr -d "\n"
}

create_output_directory() {
    log_info "Creating output directory: $OUTPUT_DIR"
    mkdir -p "$OUTPUT_DIR"
    mkdir -p "$TEMP_DIR"
}

generate_application_secrets() {
    log_info "Generating application secrets..."
    
    # Generate all secrets
    local postgres_password=$(generate_secure_password 24)
    local auth_db_password=$(generate_secure_password 24)
    local user_db_password=$(generate_secure_password 24)
    local chat_db_password=$(generate_secure_password 24)
    local media_db_password=$(generate_secure_password 24)
    local admin_db_password=$(generate_secure_password 24)
    local jwt_secret=$(generate_secure_password 32)
    local jwt_refresh_secret=$(generate_secure_password 32)
    local redis_password=$(generate_secure_password 24)
    local minio_access_key=$(generate_hex_key 16)
    local minio_secret_key=$(generate_secure_password 32)
    local typesense_api_key=$(generate_hex_key 32)
    local encryption_key=$(generate_secure_password 32)
    local session_secret=$(generate_secure_password 32)
    
    # Create database URL
    local database_url="postgresql://postgres:${postgres_password}@postgres:5432/mking_friend"
    
    # Create Kubernetes secret YAML
    cat > "$TEMP_DIR/secrets.yaml" << EOF
apiVersion: v1
kind: Secret
metadata:
  name: $SECRET_NAME
  namespace: $NAMESPACE
  labels:
    app.kubernetes.io/name: $SECRET_NAME
    app.kubernetes.io/component: secrets
    app.kubernetes.io/part-of: mking-friend-platform
  annotations:
    security.kubernetes.io/managed-by: "script-generated"
    security.kubernetes.io/rotation-policy: "30d"
    security.kubernetes.io/classification: "restricted"
    security.kubernetes.io/generated-at: "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
type: Opaque
data:
  # Database Secrets
  POSTGRES_PASSWORD: "$(base64_encode "$postgres_password")"
  AUTH_DB_PASSWORD: "$(base64_encode "$auth_db_password")"
  USER_DB_PASSWORD: "$(base64_encode "$user_db_password")"
  CHAT_DB_PASSWORD: "$(base64_encode "$chat_db_password")"
  MEDIA_DB_PASSWORD: "$(base64_encode "$media_db_password")"
  ADMIN_DB_PASSWORD: "$(base64_encode "$admin_db_password")"
  DATABASE_URL: "$(base64_encode "$database_url")"
  
  # JWT Secrets
  JWT_SECRET: "$(base64_encode "$jwt_secret")"
  JWT_REFRESH_SECRET: "$(base64_encode "$jwt_refresh_secret")"
  
  # Redis Password
  REDIS_PASSWORD: "$(base64_encode "$redis_password")"
  
  # MinIO Credentials
  MINIO_ACCESS_KEY: "$(base64_encode "$minio_access_key")"
  MINIO_SECRET_KEY: "$(base64_encode "$minio_secret_key")"
  
  # Typesense API Key
  TYPESENSE_API_KEY: "$(base64_encode "$typesense_api_key")"
  
  # Encryption Keys
  ENCRYPTION_KEY: "$(base64_encode "$encryption_key")"
  
  # Session Secret
  SESSION_SECRET: "$(base64_encode "$session_secret")"
  
  # Placeholder for external secrets (to be filled manually)
  AWS_ACCESS_KEY_ID: "REPLACE_WITH_BASE64_ENCODED_VALUE"
  AWS_SECRET_ACCESS_KEY: "REPLACE_WITH_BASE64_ENCODED_VALUE"
  GOOGLE_CLIENT_ID: "REPLACE_WITH_BASE64_ENCODED_VALUE"
  GOOGLE_CLIENT_SECRET: "REPLACE_WITH_BASE64_ENCODED_VALUE"
  GITHUB_CLIENT_ID: "REPLACE_WITH_BASE64_ENCODED_VALUE"
  GITHUB_CLIENT_SECRET: "REPLACE_WITH_BASE64_ENCODED_VALUE"
  SMTP_HOST: "REPLACE_WITH_BASE64_ENCODED_VALUE"
  SMTP_PORT: "REPLACE_WITH_BASE64_ENCODED_VALUE"
  SMTP_USER: "REPLACE_WITH_BASE64_ENCODED_VALUE"
  SMTP_PASSWORD: "REPLACE_WITH_BASE64_ENCODED_VALUE"
  SENTRY_DSN: "REPLACE_WITH_BASE64_ENCODED_VALUE"
EOF

    log_success "Application secrets generated successfully."
}

generate_tls_secrets() {
    log_info "Generating self-signed TLS certificate for development..."
    
    # Generate private key
    openssl genrsa -out "$TEMP_DIR/tls.key" 2048
    
    # Generate certificate
    openssl req -new -x509 -key "$TEMP_DIR/tls.key" -out "$TEMP_DIR/tls.crt" -days 365 -subj "/CN=mking-friend.local/O=mking-friend/C=US"
    
    # Create TLS secret YAML
    cat > "$TEMP_DIR/tls-secrets.yaml" << EOF
apiVersion: v1
kind: Secret
metadata:
  name: $TLS_SECRET_NAME
  namespace: $NAMESPACE
  labels:
    app.kubernetes.io/name: $TLS_SECRET_NAME
    app.kubernetes.io/component: tls
    app.kubernetes.io/part-of: mking-friend-platform
  annotations:
    security.kubernetes.io/managed-by: "script-generated"
    security.kubernetes.io/rotation-policy: "90d"
    security.kubernetes.io/classification: "restricted"
    security.kubernetes.io/generated-at: "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
type: kubernetes.io/tls
data:
  tls.crt: "$(base64 < "$TEMP_DIR/tls.crt" | tr -d '\n')"
  tls.key: "$(base64 < "$TEMP_DIR/tls.key" | tr -d '\n')"
EOF

    log_success "TLS secrets generated successfully."
}

generate_sealed_secrets() {
    if command -v kubeseal &> /dev/null; then
        log_info "Generating Sealed Secrets..."
        
        # Generate sealed secret for application secrets
        kubeseal -f "$TEMP_DIR/secrets.yaml" -w "$OUTPUT_DIR/sealed-secrets.yaml" 2>/dev/null || {
            log_warning "Failed to generate sealed secrets. Make sure Sealed Secrets controller is running in your cluster."
            log_info "You can still use the regular secrets or install Sealed Secrets controller."
        }
        
        # Generate sealed secret for TLS
        kubeseal -f "$TEMP_DIR/tls-secrets.yaml" -w "$OUTPUT_DIR/sealed-tls-secrets.yaml" 2>/dev/null || {
            log_warning "Failed to generate sealed TLS secrets."
        }
        
        if [ -f "$OUTPUT_DIR/sealed-secrets.yaml" ]; then
            log_success "Sealed Secrets generated successfully."
        fi
    else
        log_warning "kubeseal not found. Skipping Sealed Secrets generation."
        log_info "Install kubeseal with: brew install kubeseal"
    fi
}

copy_regular_secrets() {
    log_info "Copying regular secrets to output directory..."
    
    cp "$TEMP_DIR/secrets.yaml" "$OUTPUT_DIR/secrets.yaml"
    cp "$TEMP_DIR/tls-secrets.yaml" "$OUTPUT_DIR/tls-secrets.yaml"
    
    log_success "Regular secrets copied to $OUTPUT_DIR"
}

generate_env_file() {
    log_info "Generating .env file for local development..."
    
    cat > "$OUTPUT_DIR/.env.generated" << 'EOF'
# Generated environment file for local development
# WARNING: This file contains sensitive information - do not commit to version control

# Database Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=mking_friend
POSTGRES_USER=postgres

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# MinIO Configuration
MINIO_ENDPOINT=localhost:9000
MINIO_USE_SSL=false

# Typesense Configuration
TYPESENSE_HOST=localhost
TYPESENSE_PORT=8108
TYPESENSE_PROTOCOL=http

# Application Configuration
NODE_ENV=development
PORT=3000
API_VERSION=v1

# External Services (fill these manually)
# AWS_REGION=us-east-1
# GOOGLE_CLIENT_ID=your-google-client-id
# GOOGLE_CLIENT_SECRET=your-google-client-secret
# GITHUB_CLIENT_ID=your-github-client-id
# GITHUB_CLIENT_SECRET=your-github-client-secret
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASSWORD=your-app-password
# SENTRY_DSN=your-sentry-dsn
EOF

    log_success "Environment file generated at $OUTPUT_DIR/.env.generated"
}

generate_readme() {
    log_info "Generating README for generated secrets..."
    
    cat > "$OUTPUT_DIR/README.md" << EOF
# Generated Secrets

This directory contains generated secrets for the mking-friend application.

## Files Generated

- \`secrets.yaml\` - Regular Kubernetes secrets (base64 encoded)
- \`tls-secrets.yaml\` - TLS certificate and key for HTTPS
- \`sealed-secrets.yaml\` - Sealed Secrets (if kubeseal is available)
- \`sealed-tls-secrets.yaml\` - Sealed TLS secrets
- \`.env.generated\` - Environment file for local development

## Security Warnings

⚠️ **IMPORTANT SECURITY NOTICES:**

1. **Never commit these files to version control**
2. **Use only for development environments**
3. **Rotate secrets regularly (every 30 days)**
4. **Use external secret management for production**

## Usage

### For Development

\`\`\`bash
# Apply regular secrets
kubectl apply -f secrets.yaml
kubectl apply -f tls-secrets.yaml
\`\`\`

### For Production (Sealed Secrets)

\`\`\`bash
# Apply sealed secrets (safe to commit)
kubectl apply -f sealed-secrets.yaml
kubectl apply -f sealed-tls-secrets.yaml
\`\`\`

### For Local Development

\`\`\`bash
# Copy environment file
cp .env.generated ../.env

# Fill in external service credentials manually
vim ../.env
\`\`\`

## External Secrets to Configure

The following secrets need to be configured manually:

- AWS credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
- OAuth credentials (Google, GitHub)
- SMTP configuration
- Sentry DSN

## Secret Rotation

To rotate secrets:

1. Run the generation script again
2. Apply the new secrets to your cluster
3. Restart affected pods

\`\`\`bash
# Restart deployments to pick up new secrets
kubectl rollout restart deployment -n mking-friend
\`\`\`

## Generated At

$(date -u +%Y-%m-%dT%H:%M:%SZ)
EOF

    log_success "README generated at $OUTPUT_DIR/README.md"
}

cleanup() {
    log_info "Cleaning up temporary files..."
    rm -rf "$TEMP_DIR"
    log_success "Cleanup completed."
}

print_summary() {
    echo
    log_success "Secret generation completed successfully!"
    echo
    echo -e "${BLUE}Generated files:${NC}"
    echo "  📁 $OUTPUT_DIR/"
    echo "    📄 secrets.yaml (regular Kubernetes secrets)"
    echo "    📄 tls-secrets.yaml (TLS certificate)"
    if [ -f "$OUTPUT_DIR/sealed-secrets.yaml" ]; then
        echo "    🔒 sealed-secrets.yaml (Sealed Secrets)"
        echo "    🔒 sealed-tls-secrets.yaml (Sealed TLS)"
    fi
    echo "    📄 .env.generated (local development)"
    echo "    📖 README.md (usage instructions)"
    echo
    echo -e "${YELLOW}Next steps:${NC}"
    echo "  1. Review the generated files"
    echo "  2. Configure external service credentials"
    echo "  3. Apply secrets to your cluster"
    echo "  4. Test your application"
    echo
    echo -e "${RED}Security reminders:${NC}"
    echo "  ⚠️  Never commit regular secrets to version control"
    echo "  ⚠️  Use Sealed Secrets for GitOps workflows"
    echo "  ⚠️  Rotate secrets every 30 days"
    echo "  ⚠️  Use external secret management for production"
    echo
}

# Main execution
main() {
    echo -e "${BLUE}🔐 Secure Secret Generation Script for mking-friend${NC}"
    echo
    
    check_dependencies
    create_output_directory
    generate_application_secrets
    generate_tls_secrets
    generate_sealed_secrets
    copy_regular_secrets
    generate_env_file
    generate_readme
    cleanup
    print_summary
}

# Handle script interruption
trap cleanup EXIT

# Run main function
main "$@"