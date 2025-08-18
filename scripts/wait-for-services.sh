#!/bin/bash
# Wait for Services Script
# This script waits for all required services to be healthy before proceeding
# Usage: ./scripts/wait-for-services.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
MAX_WAIT_TIME=300  # 5 minutes
CHECK_INTERVAL=5   # 5 seconds
TYPESENSE_HOST=${TYPESENSE_HOST:-typesense-test}
TYPESENSE_PORT=${TYPESENSE_PORT:-8108}
POSTGRES_HOST=${POSTGRES_HOST:-postgres-test}
POSTGRES_PORT=${POSTGRES_PORT:-5432}
REDIS_HOST=${REDIS_HOST:-redis-test}
REDIS_PORT=${REDIS_PORT:-6379}
MINIO_HOST=${MINIO_HOST:-minio-test}
MINIO_PORT=${MINIO_PORT:-9000}

# Function to log messages
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

# Function to check if a service is healthy
check_service() {
    local service_name=$1
    local host=$2
    local port=$3
    local health_endpoint=$4
    local max_attempts=$5
    local attempt=1

    log "Checking $service_name health at $host:$port$health_endpoint"

    while [ $attempt -le $max_attempts ]; do
        if wget --no-verbose --tries=1 --spider --timeout=10 "http://$host:$port$health_endpoint" 2>/dev/null; then
            log "✅ $service_name is healthy (attempt $attempt/$max_attempts)"
            return 0
        else
            warn "❌ $service_name not ready (attempt $attempt/$max_attempts)"
            if [ $attempt -lt $max_attempts ]; then
                log "Waiting $CHECK_INTERVAL seconds before next attempt..."
                sleep $CHECK_INTERVAL
            fi
            attempt=$((attempt + 1))
        fi
    done

    error "$service_name failed to become healthy after $max_attempts attempts"
    return 1
}

# Function to check PostgreSQL
check_postgres() {
    local max_attempts=$1
    local attempt=1

    log "Checking PostgreSQL health at $POSTGRES_HOST:$POSTGRES_PORT"

    while [ $attempt -le $max_attempts ]; do
        if command -v pg_isready >/dev/null 2>&1; then
            if pg_isready -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U postgres >/dev/null 2>&1; then
                log "✅ PostgreSQL is healthy (attempt $attempt/$max_attempts)"
                return 0
            fi
        else
            # Fallback to netcat if pg_isready is not available
            if nc -z "$POSTGRES_HOST" "$POSTGRES_PORT" 2>/dev/null; then
                log "✅ PostgreSQL is healthy (attempt $attempt/$max_attempts)"
                return 0
            fi
        fi

        warn "❌ PostgreSQL not ready (attempt $attempt/$max_attempts)"
        if [ $attempt -lt $max_attempts ]; then
            log "Waiting $CHECK_INTERVAL seconds before next attempt..."
            sleep $CHECK_INTERVAL
        fi
        attempt=$((attempt + 1))
    done

    error "PostgreSQL failed to become healthy after $max_attempts attempts"
    return 1
}

# Function to check Redis
check_redis() {
    local max_attempts=$1
    local attempt=1

    log "Checking Redis health at $REDIS_HOST:$REDIS_PORT"

    while [ $attempt -le $max_attempts ]; do
        if command -v redis-cli >/dev/null 2>&1; then
            if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping >/dev/null 2>&1; then
                log "✅ Redis is healthy (attempt $attempt/$max_attempts)"
                return 0
            fi
        else
            # Fallback to netcat if redis-cli is not available
            if nc -z "$REDIS_HOST" "$REDIS_PORT" 2>/dev/null; then
                log "✅ Redis is healthy (attempt $attempt/$max_attempts)"
                return 0
            fi
        fi

        warn "❌ Redis not ready (attempt $attempt/$max_attempts)"
        if [ $attempt -lt $max_attempts ]; then
            log "Waiting $CHECK_INTERVAL seconds before next attempt..."
            sleep $CHECK_INTERVAL
        fi
        attempt=$((attempt + 1))
    done

    error "Redis failed to become healthy after $max_attempts attempts"
    return 1
}

# Main execution
main() {
    log "Starting service health checks..."
    log "Maximum wait time: ${MAX_WAIT_TIME}s, Check interval: ${CHECK_INTERVAL}s"

    local start_time=$(date +%s)
    local max_attempts=$((MAX_WAIT_TIME / CHECK_INTERVAL))

    # Check all services
    log "Checking all required services..."

    # PostgreSQL
    if ! check_postgres $max_attempts; then
        error "PostgreSQL health check failed"
        exit 1
    fi

    # Redis
    if ! check_redis $max_attempts; then
        error "Redis health check failed"
        exit 1
    fi

    # MinIO
    if ! check_service "MinIO" "$MINIO_HOST" "$MINIO_PORT" "/minio/health/live" $max_attempts; then
        error "MinIO health check failed"
        exit 1
    fi

    # Typesense (most critical for the current issue)
    if ! check_service "Typesense" "$TYPESENSE_HOST" "$TYPESENSE_PORT" "/health" $max_attempts; then
        error "Typesense health check failed"
        exit 1
    fi

    local end_time=$(date +%s)
    local elapsed_time=$((end_time - start_time))

    log "🎉 All services are healthy! Total wait time: ${elapsed_time}s"
    log "Services are ready for testing!"
}

# Run main function
main "$@"