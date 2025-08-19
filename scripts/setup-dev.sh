#!/bin/bash

# MKing Friend - Development Environment Setup Script
# This script sets up the complete development environment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
FORCE_REBUILD=false
SKIP_DEPS=false
SKIP_DB=false
VERBOSE=false
DEV_MODE="full"

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
Usage: $0 [OPTIONS]

Options:
  -h, --help          Show this help message
  -f, --force         Force rebuild of all containers
  -v, --verbose       Enable verbose output
  --skip-deps         Skip dependency installation
  --skip-db           Skip database setup
  --mode MODE         Development mode (full, minimal, services-only)
                      full: All services + dev tools (default)
                      minimal: Core services only
                      services-only: Backend services without frontend

Development Modes:
  full              Start all services including dev tools (pgAdmin, Redis Commander, MailHog)
  minimal           Start only core services (DB, Redis, MinIO, Typesense)
  services-only     Start backend services without frontend development server

Examples:
  $0                    # Setup full development environment
  $0 --force            # Force rebuild and setup
  $0 --mode minimal     # Setup minimal environment
  $0 --skip-db          # Setup without database initialization

EOF
}

# Function to check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        print_info "Visit: https://docs.docker.com/get-docker/"
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
    
    # Check if Node.js is installed (for local development)
    if ! command -v node &> /dev/null; then
        print_warning "Node.js is not installed. Some development features may not work."
        print_info "Visit: https://nodejs.org/"
    else
        local node_version=$(node --version)
        print_info "Node.js version: $node_version"
    fi
    
    # Check if pnpm is installed
    if ! command -v pnpm &> /dev/null; then
        print_warning "pnpm is not installed. Installing pnpm..."
        npm install -g pnpm || {
            print_error "Failed to install pnpm. Please install it manually."
            print_info "Run: npm install -g pnpm"
        }
    else
        local pnpm_version=$(pnpm --version)
        print_info "pnpm version: $pnpm_version"
    fi
    
    # Check if required files exist
    local required_files=("docker-compose.yml" ".env.example")
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            print_error "Required file $file not found. Please ensure you're in the project root."
            exit 1
        fi
    done

    # Warn if optional docker-compose.override.yml is missing
    if [ ! -f "docker-compose.override.yml" ]; then
        print_info "Optional file docker-compose.override.yml not found. Continuing without it."
    fi
    
    print_success "Prerequisites check passed"
}

# Function to setup environment variables
setup_environment() {
    print_info "Setting up environment variables..."
    
    if [ ! -f ".env" ]; then
        print_info "Creating .env file from .env.example..."
        cp .env.example .env
        
        # Generate random secrets for development
        if command -v openssl &> /dev/null; then
            print_info "Generating random secrets..."
            
            # Generate JWT secrets
            local jwt_secret=$(openssl rand -hex 32)
            local jwt_refresh_secret=$(openssl rand -hex 32)
            local encryption_key=$(openssl rand -hex 32)
            
            # Update .env file with generated secrets
            sed -i.bak "s/your-super-secret-jwt-key/$jwt_secret/g" .env
            sed -i.bak "s/your-super-secret-refresh-key/$jwt_refresh_secret/g" .env
            sed -i.bak "s/your-encryption-key/$encryption_key/g" .env
            
            # Remove backup file
            rm -f .env.bak
            
            print_success "Random secrets generated and configured"
        else
            print_warning "OpenSSL not found. Using default secrets (not recommended for production)"
        fi
    else
        print_info ".env file already exists, skipping creation"
    fi
    
    # Set development-specific environment variables
    export NODE_ENV=development
    export COMPOSE_PROJECT_NAME=mking-frnd-dev
    
    print_success "Environment variables configured"
}

# Function to install dependencies
install_dependencies() {
    if [ "$SKIP_DEPS" = true ]; then
        print_info "Skipping dependency installation"
        return
    fi
    
    print_info "Installing project dependencies..."
    
    # Install root dependencies
    if [ -f "package.json" ]; then
        print_info "Installing root dependencies..."
        pnpm install
    fi
    
    # Install backend dependencies
    if [ -d "backend" ] && [ -f "backend/package.json" ]; then
        print_info "Installing backend dependencies..."
        cd backend
        pnpm install
        cd ..
    fi
    
    # Install frontend dependencies
    if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
        print_info "Installing frontend dependencies..."
        cd frontend
        pnpm install
        cd ..
    fi
    
    # Install service dependencies
    for service_dir in services/*/; do
        if [ -d "$service_dir" ] && [ -f "${service_dir}package.json" ]; then
            local service_name=$(basename "$service_dir")
            print_info "Installing $service_name service dependencies..."
            cd "$service_dir"
            pnpm install
            cd ../..
        fi
    done
    
    print_success "Dependencies installed successfully"
}

# Function to start development services
start_services() {
    print_info "Starting development services..."
    
    local compose_cmd="docker compose"
    if [ "$VERBOSE" = true ]; then
        compose_cmd="$compose_cmd --verbose"
    fi
    
    local services_to_start=()
    
    case "$DEV_MODE" in
        "full")
            print_info "Starting full development environment..."
            # Start all services including dev tools
            if [ "$FORCE_REBUILD" = true ]; then
                $compose_cmd up -d --build
            else
                $compose_cmd up -d
            fi
            ;;
        "minimal")
            print_info "Starting minimal development environment..."
            services_to_start=("postgres" "redis" "minio" "typesense")
            if [ "$FORCE_REBUILD" = true ]; then
                $compose_cmd up -d --build "${services_to_start[@]}"
            else
                $compose_cmd up -d "${services_to_start[@]}"
            fi
            ;;
        "services-only")
            print_info "Starting backend services only..."
            services_to_start=("postgres" "redis" "minio" "typesense" "prometheus" "grafana")
            if [ "$FORCE_REBUILD" = true ]; then
                $compose_cmd up -d --build "${services_to_start[@]}"
            else
                $compose_cmd up -d "${services_to_start[@]}"
            fi
            ;;
        *)
            print_error "Unknown development mode: $DEV_MODE"
            exit 1
            ;;
    esac
    
    print_success "Services started successfully"
}

# Function to wait for services to be ready
wait_for_services() {
    print_info "Waiting for services to be ready..."
    
    local max_attempts=30
    local attempt=1
    
    # Wait for PostgreSQL
    print_info "Waiting for PostgreSQL..."
    while [ $attempt -le $max_attempts ]; do
        if docker compose exec -T postgres pg_isready -U postgres &> /dev/null; then
            print_success "PostgreSQL is ready"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            print_error "PostgreSQL failed to start within expected time"
            return 1
        fi
        
        print_info "Attempt $attempt/$max_attempts - PostgreSQL not ready yet..."
        sleep 2
        ((attempt++))
    done
    
    # Wait for Redis
    print_info "Waiting for Redis..."
    attempt=1
    while [ $attempt -le $max_attempts ]; do
        if docker compose exec -T redis redis-cli ping &> /dev/null; then
            print_success "Redis is ready"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            print_error "Redis failed to start within expected time"
            return 1
        fi
        
        print_info "Attempt $attempt/$max_attempts - Redis not ready yet..."
        sleep 2
        ((attempt++))
    done
    
    # Wait for MinIO
    print_info "Waiting for MinIO..."
    attempt=1
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:9000/minio/health/live &> /dev/null; then
            print_success "MinIO is ready"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            print_error "MinIO failed to start within expected time"
            return 1
        fi
        
        print_info "Attempt $attempt/$max_attempts - MinIO not ready yet..."
        sleep 2
        ((attempt++))
    done
    
    print_success "All services are ready"
}

# Function to setup database
setup_database() {
    if [ "$SKIP_DB" = true ]; then
        print_info "Skipping database setup"
        return
    fi
    
    print_info "Setting up database..."
    
    # Run database migrations
    if [ -d "backend" ] && [ -f "backend/prisma/schema.prisma" ]; then
        print_info "Running database migrations..."
        cd backend
        
        # Generate Prisma client
        pnpm exec prisma generate
        
        # Run migrations
        pnpm exec prisma migrate deploy
        
        # Seed database with development data
        if [ -f "prisma/seed.ts" ] || [ -f "prisma/seed.js" ]; then
            print_info "Seeding database with development data..."
            pnpm exec prisma db seed
        fi
        
        cd ..
        print_success "Database setup completed"
    else
        print_warning "No Prisma schema found, skipping database migrations"
    fi
}

# Function to show service status
show_service_status() {
    print_info "Service Status:"
    echo "==============="
    
    # Show Docker Compose services status
    docker compose ps
    
    echo ""
    print_info "Service URLs:"
    echo "=============="
    
    case "$DEV_MODE" in
        "full")
            echo "🌐 Frontend:          http://localhost:3000"
            echo "🔧 Backend API:       http://localhost:8000"
            echo "🗄️  PostgreSQL:       localhost:5432"
            echo "🔴 Redis:             localhost:6379"
            echo "📦 MinIO:             http://localhost:9000"
            echo "🔍 Typesense:         http://localhost:8108"
            echo "📊 Prometheus:        http://localhost:9090"
            echo "📈 Grafana:           http://localhost:3001"
            echo "📧 MailHog:           http://localhost:8025"
            echo "🐘 pgAdmin:           http://localhost:5050"
            echo "🔴 Redis Commander:   http://localhost:8081"
            ;;
        "minimal")
            echo "🗄️  PostgreSQL:       localhost:5432"
            echo "🔴 Redis:             localhost:6379"
            echo "📦 MinIO:             http://localhost:9000"
            echo "🔍 Typesense:         http://localhost:8108"
            ;;
        "services-only")
            echo "🗄️  PostgreSQL:       localhost:5432"
            echo "🔴 Redis:             localhost:6379"
            echo "📦 MinIO:             http://localhost:9000"
            echo "🔍 Typesense:         http://localhost:8108"
            echo "📊 Prometheus:        http://localhost:9090"
            echo "📈 Grafana:           http://localhost:3001"
            ;;
    esac
    
    echo ""
    print_info "Development Commands:"
    echo "====================="
    echo "📋 View logs:         docker compose logs -f [service]"
    echo "🔄 Restart service:   docker compose restart [service]"
    echo "🛑 Stop all:          docker compose down"
    echo "🧪 Run tests:         ./scripts/run-tests.sh"
    echo "📊 Check status:      docker compose ps"
}

# Function to create helpful development scripts
create_dev_scripts() {
    print_info "Creating development helper scripts..."
    
    # Create logs script
    cat > scripts/logs.sh << 'EOF'
#!/bin/bash
# Quick script to view service logs
if [ -z "$1" ]; then
    echo "Usage: $0 <service-name>"
    echo "Available services:"
    docker compose ps --services
    exit 1
fi

docker compose logs -f "$1"
EOF
    
    # Create restart script
    cat > scripts/restart.sh << 'EOF'
#!/bin/bash
# Quick script to restart services
if [ -z "$1" ]; then
    echo "Usage: $0 <service-name>"
    echo "Available services:"
    docker compose ps --services
    exit 1
fi

echo "Restarting $1..."
docker compose restart "$1"
echo "$1 restarted successfully"
EOF
    
    # Make scripts executable
    chmod +x scripts/logs.sh scripts/restart.sh
    
    print_success "Development helper scripts created"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_usage
            exit 0
            ;;
        -f|--force)
            FORCE_REBUILD=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        --skip-deps)
            SKIP_DEPS=true
            shift
            ;;
        --skip-db)
            SKIP_DB=true
            shift
            ;;
        --mode)
            DEV_MODE="$2"
            shift 2
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate development mode
case "$DEV_MODE" in
    "full"|"minimal"|"services-only")
        # Valid modes
        ;;
    *)
        print_error "Invalid development mode: $DEV_MODE"
        print_error "Valid modes: full, minimal, services-only"
        exit 1
        ;;
esac

# Main execution
main() {
    print_info "MKing Friend Development Environment Setup"
    print_info "==========================================="
    print_info "Mode: $DEV_MODE"
    
    # Check prerequisites
    check_prerequisites
    
    # Setup environment
    setup_environment
    
    # Install dependencies
    install_dependencies
    
    # Start services
    start_services
    
    # Wait for services to be ready
    wait_for_services
    
    # Setup database
    setup_database
    
    # Create development helper scripts
    create_dev_scripts
    
    # Show service status
    show_service_status
    
    print_success "Development environment setup completed!"
    print_info "You can now start developing. Happy coding! 🚀"
}

# Run main function
main "$@"