# MKing Development Environment Makefile
# Provides convenient commands for development workflow

.PHONY: help dev dev-build dev-down dev-logs dev-clean test lint format install setup health status

# Default target
help: ## Show this help message
	@echo "MKing Development Environment Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Development Environment Commands
dev: ## Start development environment
	@echo "🚀 Starting development environment..."
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
	@echo "✅ Development environment started!"
	@echo "📊 Services status:"
	@make status

dev-build: ## Build and start development environment
	@echo "🔨 Building and starting development environment..."
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
	@echo "✅ Development environment built and started!"

dev-down: ## Stop development environment
	@echo "🛑 Stopping development environment..."
	docker compose -f docker-compose.yml -f docker-compose.dev.yml down
	@echo "✅ Development environment stopped!"

dev-restart: ## Restart development environment
	@echo "🔄 Restarting development environment..."
	@make dev-down
	@make dev

dev-logs: ## Show development environment logs
	@echo "📋 Showing development environment logs..."
	docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f

dev-logs-backend: ## Show backend logs
	docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f backend-dev

dev-logs-frontend: ## Show frontend logs
	docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f frontend-dev

dev-shell-backend: ## Open shell in backend container
	docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend-dev sh

dev-shell-frontend: ## Open shell in frontend container
	docker compose -f docker-compose.yml -f docker-compose.dev.yml exec frontend-dev sh

dev-shell-db: ## Open PostgreSQL shell
	docker compose -f docker-compose.yml -f docker-compose.dev.yml exec postgres psql -U postgres -d mking_dev

dev-clean: ## Clean development environment (remove containers, volumes, images)
	@echo "🧹 Cleaning development environment..."
	docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v --remove-orphans
	docker system prune -f
	@echo "✅ Development environment cleaned!"

# Development Tools
dev-tools: ## Start development tools (MailHog, pgAdmin, Redis Commander)
	@echo "🛠️ Starting development tools..."
	docker compose -f docker-compose.yml -f docker-compose.dev.yml --profile dev-tools up -d
	@echo "✅ Development tools started!"
	@echo "📧 MailHog: http://localhost:8025"
	@echo "🐘 pgAdmin: http://localhost:5050 (admin@mking-dev.local / admin)"
	@echo "🔴 Redis Commander: http://localhost:8081 (admin / admin)"

dev-tools-down: ## Stop development tools
	docker compose -f docker-compose.yml -f docker-compose.dev.yml --profile dev-tools down

# Health and Status
health: ## Check health of all services
	@echo "🏥 Checking service health..."
	@docker compose -f docker-compose.yml -f docker-compose.dev.yml ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

status: ## Show status of all services
	@echo "📊 Service Status:"
	@docker compose -f docker-compose.yml -f docker-compose.dev.yml ps

# Testing
test: ## Run all tests
	@echo "🧪 Running tests..."
	pnpm test

test-backend: ## Run backend tests
	@echo "🧪 Running backend tests..."
	cd backend && pnpm test

test-frontend: ## Run frontend tests
	@echo "🧪 Running frontend tests..."
	cd frontend && pnpm test

test-e2e: ## Run end-to-end tests
	@echo "🧪 Running E2E tests..."
	pnpm test:e2e

test-dev-env: ## Run development environment tests
	@echo "🧪 Running development environment tests..."
	pnpm test src/test/development-environment-setup.test.ts

# Code Quality
lint: ## Run linting
	@echo "🔍 Running linting..."
	pnpm lint

lint-fix: ## Fix linting issues
	@echo "🔧 Fixing linting issues..."
	pnpm lint:fix

format: ## Format code
	@echo "💅 Formatting code..."
	pnpm format

type-check: ## Run type checking
	@echo "🔍 Running type checking..."
	pnpm type-check

# Installation and Setup
install: ## Install dependencies
	@echo "📦 Installing dependencies..."
	pnpm install

setup: ## Setup development environment
	@echo "⚙️ Setting up development environment..."
	@if [ ! -f .env ]; then cp .env.dev .env; echo "📋 Created .env from .env.dev"; fi
	@make install
	@make dev-build
	@echo "✅ Development environment setup complete!"
	@echo ""
	@echo "🎉 Welcome to MKing Development Environment!"
	@echo "📖 Available commands: make help"
	@echo "🌐 Frontend: http://localhost:3000"
	@echo "🔧 Backend API: http://localhost:3001"
	@echo "🛠️ Development tools: make dev-tools"

# Database Operations
db-migrate: ## Run database migrations
	@echo "🗃️ Running database migrations..."
	docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend-dev pnpm db:migrate

db-seed: ## Seed database with development data
	@echo "🌱 Seeding database..."
	docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend-dev pnpm db:seed

db-reset: ## Reset database (drop, create, migrate, seed)
	@echo "🔄 Resetting database..."
	docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend-dev pnpm db:reset

db-backup: ## Backup development database
	@echo "💾 Backing up database..."
	mkdir -p ./backups
	docker compose -f docker-compose.yml -f docker-compose.dev.yml exec postgres pg_dump -U postgres mking_dev > ./backups/mking_dev_$(shell date +%Y%m%d_%H%M%S).sql

# Monitoring
monitor: ## Open monitoring dashboard
	@echo "📊 Opening monitoring dashboard..."
	@echo "📈 Grafana: http://localhost:3001 (admin / admin)"
	@echo "🔥 Prometheus: http://localhost:9090"
	@echo "📋 Loki: http://localhost:3100"
	open http://localhost:3001

# Production Commands
prod: ## Start production environment
	@echo "🚀 Starting production environment..."
	docker compose -f docker-compose.yml up -d

prod-build: ## Build and start production environment
	@echo "🔨 Building production environment..."
	docker compose -f docker-compose.yml up -d --build

prod-down: ## Stop production environment
	docker compose -f docker-compose.yml down

# Utility Commands
clean-all: ## Clean everything (containers, volumes, images, node_modules)
	@echo "🧹 Cleaning everything..."
	@make dev-clean
	rm -rf node_modules backend/node_modules frontend/node_modules
	rm -rf backend/dist frontend/dist
	@echo "✅ Everything cleaned!"

update: ## Update dependencies
	@echo "⬆️ Updating dependencies..."
	pnpm update

info: ## Show development environment information
	@echo "ℹ️ MKing Development Environment Information:"
	@echo "📁 Project: $(shell pwd)"
	@echo "🐳 Docker: $(shell docker --version)"
	@echo "📦 Node.js: $(shell node --version)"
	@echo "📦 pnpm: $(shell pnpm --version)"
	@echo "🔧 Make: $(shell make --version | head -n1)"
	@echo ""
	@echo "🌐 Service URLs:"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend API: http://localhost:3001"
	@echo "  Database: localhost:5432"
	@echo "  Redis: localhost:6379"
	@echo "  MinIO: http://localhost:9000"
	@echo "  Typesense: http://localhost:8108"
	@echo "  Prometheus: http://localhost:9090"
	@echo "  Grafana: http://localhost:3001"