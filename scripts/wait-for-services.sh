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
MAX_WAIT_TIME=600  # 10 minutes (increased for CI stability)
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

# Function to check Docker container health status
check_container_health() {
    local container_name=$1
    local max_attempts=$2
    local attempt=1

    log "Checking Docker container health for $container_name"

    while [ $attempt -le $max_attempts ]; do
        local health_status=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null || echo "none")
        
        case $health_status in
            "healthy")
                log "✅ Container $container_name is healthy (attempt $attempt/$max_attempts)"
                return 0
                ;;
            "starting")
                log "🔄 Container $container_name is starting (attempt $attempt/$max_attempts)"
                ;;
            "unhealthy")
                warn "❌ Container $container_name is unhealthy (attempt $attempt/$max_attempts)"
                # Show container logs for debugging
                log "Container logs for debugging:"
                docker logs --tail=10 "$container_name" 2>/dev/null || true
                ;;
            "none")
                warn "❌ Container $container_name has no health check or doesn't exist (attempt $attempt/$max_attempts)"
                ;;
            *)
                warn "❌ Container $container_name has unknown health status: $health_status (attempt $attempt/$max_attempts)"
                ;;
        esac

        if [ $attempt -lt $max_attempts ]; then
            log "Waiting $CHECK_INTERVAL seconds before next attempt..."
            sleep $CHECK_INTERVAL
        fi
        attempt=$((attempt + 1))
    done

    error "Container $container_name failed to become healthy after $max_attempts attempts"
    return 1
}

# Function to check if a service is healthy via HTTP endpoint
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

    # Check if Docker is available
    if ! command -v docker >/dev/null 2>&1; then
        error "Docker is not available. Please ensure Docker is installed and running."
        exit 1
    fi

    # Check all services using Docker health checks first (preferred method)
    log "Checking all required services using Docker health checks..."

    # Check container health status first
    local containers=("mking-postgres-test" "mking-redis-test" "mking-minio-test" "mking-typesense-test")
    local failed_containers=()

    for container in "${containers[@]}"; do
        if ! check_container_health "$container" $max_attempts; then
            failed_containers+=("$container")
        fi
    done

    # If Docker health checks failed, fallback to HTTP endpoint checks
    if [ ${#failed_containers[@]} -gt 0 ]; then
        warn "Some containers failed Docker health checks. Falling back to HTTP endpoint checks..."
        
        # PostgreSQL fallback
        if [[ " ${failed_containers[*]} " =~ " mking-postgres-test " ]]; then
            if ! check_postgres $max_attempts; then
                error "PostgreSQL health check failed"
                exit 1
            fi
        fi

        # Redis fallback
        if [[ " ${failed_containers[*]} " =~ " mking-redis-test " ]]; then
            if ! check_redis $max_attempts; then
                error "Redis health check failed"
                exit 1
            fi
        fi

        # MinIO fallback
        if [[ " ${failed_containers[*]} " =~ " mking-minio-test " ]]; then
            if ! check_service "MinIO" "$MINIO_HOST" "$MINIO_PORT" "/minio/health/live" $max_attempts; then
                error "MinIO health check failed"
                exit 1
            fi
        fi

        # Typesense fallback (most critical for the current issue)
        if [[ " ${failed_containers[*]} " =~ " mking-typesense-test " ]]; then
            if ! check_service "Typesense" "$TYPESENSE_HOST" "$TYPESENSE_PORT" "/health" $max_attempts; then
                error "Typesense health check failed"
                exit 1
            fi
        fi
    fi

    local end_time=$(date +%s)
    local elapsed_time=$((end_time - start_time))

    log "🎉 All services are healthy! Total wait time: ${elapsed_time}s"
    log "Services are ready for testing!"
}

# Run main function
main "$@"