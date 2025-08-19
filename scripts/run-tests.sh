#!/bin/bash

# MKing Friend - Test Runner Script
# This script provides a convenient way to run different types of tests locally

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
TEST_TYPE="all"
CLEANUP=true
VERBOSE=false
PARALLEL=false
COVERAGE=false

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    cat << EOF
Usage: $0 [OPTIONS] [TEST_TYPE]

Test Types:
  unit          Run unit tests only
  integration   Run integration tests only
  e2e           Run end-to-end tests only
  all           Run all tests (default)
  services      Run all service tests
  frontend      Run frontend tests only
  backend       Run backend tests only

Options:
  -h, --help        Show this help message
  -v, --verbose     Enable verbose output
  -p, --parallel    Run tests in parallel (where supported)
  -c, --coverage    Generate coverage reports
  --no-cleanup      Don't cleanup containers after tests
  --build           Force rebuild of Docker images
  --watch           Run tests in watch mode (for development)

Examples:
  $0 unit                    # Run unit tests
  $0 --coverage integration  # Run integration tests with coverage
  $0 --parallel all          # Run all tests in parallel
  $0 --verbose --no-cleanup e2e  # Run e2e tests with verbose output, no cleanup

EOF
}

# Function to check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is available
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not available. Please install Docker Compose."
        exit 1
    fi
    
    # Check if test configuration exists
    if [ ! -f "docker-compose.test.yml" ]; then
        print_error "docker-compose.test.yml not found. Please ensure you're in the project root."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Function to setup test environment
setup_test_environment() {
    print_info "Setting up test environment..."
    
    # Create test results and coverage directories
    mkdir -p test-results coverage
    chmod 777 test-results coverage
    
    # Set environment variables
    export CI=true
    export NODE_ENV=test
    
    if [ "$COVERAGE" = true ]; then
        export COVERAGE=true
    fi
    
    print_success "Test environment setup completed"
}

# Function to cleanup test environment
cleanup_test_environment() {
    if [ "$CLEANUP" = true ]; then
        print_info "Cleaning up test environment..."
        
        # Stop and remove containers
        docker compose -f docker-compose.test.yml down -v --remove-orphans 2>/dev/null || true
        
        # Clean up Docker system
        docker system prune -f 2>/dev/null || true
        
        print_success "Cleanup completed"
    else
        print_warning "Skipping cleanup (containers are still running)"
    fi
}

# Function to run specific test type
run_tests() {
    local test_type=$1
    local compose_cmd="docker compose -f docker-compose.test.yml"
    
    if [ "$VERBOSE" = true ]; then
        compose_cmd="$compose_cmd --verbose"
    fi
    
    print_info "Running $test_type tests..."
    
    case "$test_type" in
        "unit")
            print_info "Starting unit tests for all services..."
            $compose_cmd up --build --abort-on-container-exit \
                backend-test auth-service-test user-service-test chat-service-test media-service-test admin-service-test
            ;;
        "integration")
            print_info "Starting integration tests..."
            $compose_cmd up --build --abort-on-container-exit \
                postgres-test redis-test minio-test typesense-test integration-test
            ;;
        "e2e")
            print_info "Starting end-to-end tests..."
            $compose_cmd up --build --abort-on-container-exit \
                postgres-test redis-test minio-test typesense-test frontend-test backend-test integration-test
            ;;
        "services")
            print_info "Starting all service tests..."
            $compose_cmd up --build --abort-on-container-exit \
                postgres-test redis-test minio-test typesense-test \
                backend-test auth-service-test user-service-test chat-service-test media-service-test admin-service-test
            ;;
        "frontend")
            print_info "Starting frontend tests..."
            $compose_cmd up --build --abort-on-container-exit \
                postgres-test redis-test minio-test typesense-test frontend-test
            ;;
        "backend")
            print_info "Starting backend tests..."
            $compose_cmd up --build --abort-on-container-exit \
                postgres-test redis-test minio-test typesense-test backend-test
            ;;
        "all")
            print_info "Starting all tests..."
            if [ "$PARALLEL" = true ]; then
                # Run different test types in parallel
                print_info "Running tests in parallel mode..."
                (
                    print_info "Starting unit tests..."
                    $compose_cmd up --build --abort-on-container-exit \
                        backend-test auth-service-test user-service-test chat-service-test media-service-test admin-service-test
                ) &
                UNIT_PID=$!
                
                (
                    print_info "Starting integration tests..."
                    $compose_cmd up --build --abort-on-container-exit \
                        postgres-test redis-test minio-test typesense-test integration-test
                ) &
                INTEGRATION_PID=$!
                
                # Wait for both to complete
                wait $UNIT_PID
                UNIT_EXIT_CODE=$?
                
                wait $INTEGRATION_PID
                INTEGRATION_EXIT_CODE=$?
                
                if [ $UNIT_EXIT_CODE -ne 0 ] || [ $INTEGRATION_EXIT_CODE -ne 0 ]; then
                    print_error "Some tests failed"
                    return 1
                fi
                
                # Run E2E tests after unit and integration tests pass
                print_info "Starting end-to-end tests..."
                $compose_cmd up --build --abort-on-container-exit \
                    postgres-test redis-test minio-test typesense-test frontend-test backend-test integration-test
            else
                # Run tests sequentially
                print_info "Running tests sequentially..."
                
                # Unit tests first
                print_info "Step 1/3: Running unit tests..."
                $compose_cmd up --build --abort-on-container-exit \
                    backend-test auth-service-test user-service-test chat-service-test media-service-test admin-service-test
                
                # Integration tests
                print_info "Step 2/3: Running integration tests..."
                $compose_cmd up --build --abort-on-container-exit \
                    postgres-test redis-test minio-test typesense-test integration-test
                
                # E2E tests
                print_info "Step 3/3: Running end-to-end tests..."
                $compose_cmd up --build --abort-on-container-exit \
                    postgres-test redis-test minio-test typesense-test frontend-test backend-test integration-test
            fi
            ;;
        *)
            print_error "Unknown test type: $test_type"
            show_usage
            exit 1
            ;;
    esac
}

# Function to collect test results
collect_test_results() {
    print_info "Collecting test results..."
    
    # Run test results collector
    docker compose -f docker-compose.test.yml up --no-deps test-results 2>/dev/null || true
    
    # Copy logs from containers
    docker compose -f docker-compose.test.yml logs backend-test > test-results/backend.log 2>&1 || true
    docker compose -f docker-compose.test.yml logs frontend-test > test-results/frontend.log 2>&1 || true
    docker compose -f docker-compose.test.yml logs integration-test > test-results/integration.log 2>&1 || true
    
    # Show summary
    if [ -d "test-results" ] && [ "$(ls -A test-results)" ]; then
        print_success "Test results collected in ./test-results/"
        
        # Count test files
        local test_files=$(find test-results -name "*.xml" -o -name "*.json" | wc -l)
        local log_files=$(find test-results -name "*.log" | wc -l)
        
        print_info "Found $test_files test result files and $log_files log files"
    else
        print_warning "No test results found"
    fi
    
    if [ "$COVERAGE" = true ] && [ -d "coverage" ] && [ "$(ls -A coverage)" ]; then
        print_success "Coverage reports generated in ./coverage/"
        
        # Show coverage summary if available
        if [ -f "coverage/lcov.info" ]; then
            print_info "Coverage report: coverage/lcov.info"
        fi
    fi
}

# Function to show test results summary
show_test_summary() {
    print_info "Test execution summary:"
    echo "========================"
    echo "Test Type: $TEST_TYPE"
    echo "Parallel: $PARALLEL"
    echo "Coverage: $COVERAGE"
    echo "Cleanup: $CLEANUP"
    echo "========================"
    
    if [ -d "test-results" ]; then
        local total_files=$(find test-results -type f | wc -l)
        echo "Total result files: $total_files"
    fi
    
    if [ -d "coverage" ] && [ "$COVERAGE" = true ]; then
        local coverage_files=$(find coverage -name "*.lcov" -o -name "*.json" | wc -l)
        echo "Coverage files: $coverage_files"
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_usage
            exit 0
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -p|--parallel)
            PARALLEL=true
            shift
            ;;
        -c|--coverage)
            COVERAGE=true
            shift
            ;;
        --no-cleanup)
            CLEANUP=false
            shift
            ;;
        --build)
            BUILD=true
            shift
            ;;
        --watch)
            WATCH=true
            shift
            ;;
        unit|integration|e2e|all|services|frontend|backend)
            TEST_TYPE=$1
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Main execution
main() {
    print_info "MKing Friend Test Runner"
    print_info "========================"
    
    # Setup trap for cleanup on exit
    trap cleanup_test_environment EXIT
    
    # Check prerequisites
    check_prerequisites
    
    # Setup test environment
    setup_test_environment
    
    # Run tests
    if run_tests "$TEST_TYPE"; then
        print_success "Tests completed successfully!"
        
        # Collect results
        collect_test_results
        
        # Show summary
        show_test_summary
        
        exit 0
    else
        print_error "Tests failed!"
        
        # Still collect results for debugging
        collect_test_results
        
        # Show summary
        show_test_summary
        
        exit 1
    fi
}

# Run main function
main "$@"