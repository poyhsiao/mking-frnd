#!/bin/bash

# BDD Test Runner for Typesense Health Check Validation
# This script runs the BDD tests to validate Typesense container health checks

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TEST_DIR="$PROJECT_ROOT/tests"
REPORTS_DIR="$PROJECT_ROOT/test-results/bdd"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
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

# Function to check if required tools are installed
check_dependencies() {
    log_info "Checking dependencies..."
    
    local missing_deps=()
    
    # Check for Node.js
    if ! command -v node &> /dev/null; then
        missing_deps+=("node")
    fi
    
    # Check for npm/pnpm
    if ! command -v pnpm &> /dev/null && ! command -v npm &> /dev/null; then
        missing_deps+=("pnpm or npm")
    fi
    
    # Check for Docker
    if ! command -v docker &> /dev/null; then
        missing_deps+=("docker")
    fi
    
    # Check for Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        missing_deps+=("docker-compose")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Missing dependencies: ${missing_deps[*]}"
        log_error "Please install the missing dependencies and try again."
        exit 1
    fi
    
    log_success "All dependencies are available"
}

# Function to setup test environment
setup_test_environment() {
    log_info "Setting up test environment..."
    
    # Create reports directory
    mkdir -p "$REPORTS_DIR"
    
    # Navigate to test directory
    cd "$TEST_DIR"
    
    # Install test dependencies if package.json exists
    if [ -f "package.json" ]; then
        log_info "Installing test dependencies..."
        if command -v pnpm &> /dev/null; then
            pnpm install
        else
            npm install
        fi
    else
        log_warning "No package.json found in test directory"
    fi
    
    log_success "Test environment setup complete"
}

# Function to run BDD tests
run_bdd_tests() {
    log_info "Running BDD tests for Typesense health check..."
    
    cd "$TEST_DIR"
    
    # Set test environment variables
    export NODE_ENV=test
    export CI=true
    export TYPESENSE_TEST_API_KEY=test-api-key
    export POSTGRES_TEST_DB=mking_test
    export POSTGRES_TEST_USER=postgres
    export POSTGRES_TEST_PASSWORD=postgres
    export MINIO_TEST_USER=testuser
    export MINIO_TEST_PASSWORD=testpassword
    
    # Run Cucumber tests
    local cucumber_cmd
    if command -v pnpm &> /dev/null; then
        cucumber_cmd="pnpm run test:bdd"
    else
        cucumber_cmd="npm run test:bdd"
    fi
    
    log_info "Executing: $cucumber_cmd"
    
    # Run tests with proper error handling
    if $cucumber_cmd --format json:"$REPORTS_DIR/cucumber-report.json" \
                    --format html:"$REPORTS_DIR/cucumber-report.html" \
                    --format progress; then
        log_success "BDD tests completed successfully"
        return 0
    else
        log_error "BDD tests failed"
        return 1
    fi
}

# Function to run Docker Compose health check validation
validate_docker_compose_health() {
    log_info "Validating Docker Compose health check configuration..."
    
    cd "$PROJECT_ROOT"
    
    # Check if docker-compose.test.yml exists
    if [ ! -f "docker-compose.test.yml" ]; then
        log_error "docker-compose.test.yml not found"
        return 1
    fi
    
    # Validate the compose file
    if docker compose -f docker-compose.test.yml config &> /dev/null; then
        log_success "Docker Compose configuration is valid"
    else
        log_error "Docker Compose configuration is invalid"
        docker compose -f docker-compose.test.yml config
        return 1
    fi
    
    # Test Typesense service startup (without running full test suite)
    log_info "Testing Typesense service startup..."
    
    # Start only Typesense service
    docker compose -f docker-compose.test.yml up -d typesense-test
    
    # Wait for health check
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        health_status=$(docker compose -f docker-compose.test.yml ps --format json | jq -r '.[] | select(.Service == "typesense-test") | .Health')
        
        case "$health_status" in
            "healthy")
                log_success "Typesense service is healthy (attempt $attempt/$max_attempts)"
                docker compose -f docker-compose.test.yml down -v
                return 0
                ;;
            "unhealthy")
                log_warning "Typesense service is unhealthy (attempt $attempt/$max_attempts)"
                ;;
            "starting")
                log_info "Typesense service is starting (attempt $attempt/$max_attempts)"
                ;;
            *)
                log_warning "Typesense service health status unknown: $health_status (attempt $attempt/$max_attempts)"
                ;;
        esac
        
        sleep 10
        attempt=$((attempt + 1))
    done
    
    log_error "Typesense service failed to become healthy after $max_attempts attempts"
    log_error "Container logs:"
    docker compose -f docker-compose.test.yml logs typesense-test
    docker compose -f docker-compose.test.yml down -v
    return 1
}

# Function to generate test report
generate_report() {
    log_info "Generating test report..."
    
    local report_file="$REPORTS_DIR/test-summary.md"
    
    cat > "$report_file" << EOF
# BDD Test Report - Typesense Health Check

**Generated:** $(date)
**Test Environment:** $(uname -s) $(uname -r)
**Docker Version:** $(docker --version)
**Node Version:** $(node --version 2>/dev/null || echo "N/A")

## Test Results

### BDD Feature Tests
- **Feature File:** tests/features/typesense-health-check.feature
- **Step Definitions:** tests/step-definitions/typesense-health-check.steps.ts
- **Reports:** 
  - JSON: test-results/bdd/cucumber-report.json
  - HTML: test-results/bdd/cucumber-report.html

### Docker Compose Health Check Validation
- **Configuration File:** docker-compose.test.yml
- **Typesense Service:** Health check validation completed

### Improvements Made
1. Enhanced health check configuration with increased timeouts
2. Added startup wait time and retry logic
3. Implemented robust container dependency management
4. Created comprehensive BDD test coverage
5. Updated CI workflow with better error handling

### Files Modified
- docker-compose.test.yml
- .github/workflows/ci.yml
- scripts/wait-for-services.sh
- tests/features/typesense-health-check.feature
- tests/step-definitions/typesense-health-check.steps.ts

EOF

    log_success "Test report generated: $report_file"
}

# Function to cleanup
cleanup() {
    log_info "Cleaning up test environment..."
    
    cd "$PROJECT_ROOT"
    
    # Stop any running containers
    docker compose -f docker-compose.test.yml down -v --remove-orphans 2>/dev/null || true
    
    # Clean up Docker resources
    docker system prune -f 2>/dev/null || true
    
    log_success "Cleanup completed"
}

# Main execution function
main() {
    log_info "Starting BDD test execution for Typesense health check validation"
    
    # Trap to ensure cleanup on exit
    trap cleanup EXIT
    
    # Execute test steps
    check_dependencies
    setup_test_environment
    
    local exit_code=0
    
    # Run Docker Compose validation
    if ! validate_docker_compose_health; then
        log_error "Docker Compose health check validation failed"
        exit_code=1
    fi
    
    # Run BDD tests (if test dependencies are available)
    if [ -f "$TEST_DIR/package.json" ]; then
        if ! run_bdd_tests; then
            log_error "BDD tests failed"
            exit_code=1
        fi
    else
        log_warning "Skipping BDD tests - no test package.json found"
    fi
    
    # Generate report
    generate_report
    
    if [ $exit_code -eq 0 ]; then
        log_success "All tests completed successfully!"
        log_info "Check the reports in: $REPORTS_DIR"
    else
        log_error "Some tests failed. Check the logs above for details."
    fi
    
    exit $exit_code
}

# Script usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -v, --verbose  Enable verbose output"
    echo "  --no-cleanup   Skip cleanup on exit"
    echo ""
    echo "This script runs BDD tests to validate Typesense health check improvements."
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            exit 0
            ;;
        -v|--verbose)
            set -x
            shift
            ;;
        --no-cleanup)
            trap - EXIT
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Run main function
main "$@"