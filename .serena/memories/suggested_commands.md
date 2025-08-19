# Suggested Commands for MKing Friend Development

## Package Management
```bash
# Install dependencies
pnpm install

# Install dependencies with frozen lockfile (CI)
pnpm install --frozen-lockfile

# Update dependencies
pnpm update --recursive

# Check for outdated packages
pnpm outdated

# Audit dependencies for vulnerabilities
pnpm audit
```

## Development
```bash
# Start all services in development mode
pnpm dev

# Start specific service
cd backend && pnpm dev
cd frontend && pnpm dev

# Build all projects
pnpm build

# Type checking
pnpm type-check
```

## Testing
```bash
# Run all tests
pnpm test

# Run unit tests
pnpm test:unit

# Run integration tests
pnpm test:integration

# Run e2e tests
pnpm test:e2e

# Run BDD tests
pnpm test:bdd

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

## Code Quality
```bash
# Lint code
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format

# Check formatting
pnpm format:check

# Run lint-staged (pre-commit)
pnpm lint-staged
```

## Docker Operations
```bash
# Build Docker images
pnpm docker:build

# Start services with Docker Compose
pnpm docker:up

# Stop Docker services
pnpm docker:down

# View Docker logs
pnpm docker:logs

# Start development environment
./scripts/setup-dev.sh

# Run tests in Docker
./scripts/run-tests.sh
```

## Security
```bash
# Run security scans locally
# (Note: Most security tools run in CI/CD)

# Check for secrets
gitleaks detect --source . --verbose

# Run dependency audit
pnpm audit --audit-level=moderate

# Check Docker images for vulnerabilities
trivy image <image-name>
```

## Database
```bash
# Connect to PostgreSQL (in Docker)
docker-compose exec postgres psql -U mking_user -d mking_db

# Run database migrations (backend)
cd backend && npx prisma migrate dev

# Generate Prisma client
cd backend && npx prisma generate

# Reset database
cd backend && npx prisma migrate reset
```

## Utilities
```bash
# Clean all node_modules
pnpm clean

# Setup project from scratch
pnpm setup

# Check dependencies health
pnpm check-deps

# Verify Docker build
./scripts/verify-docker-build.sh

# Wait for services to be ready
./scripts/wait-for-services.sh
```

## Git Operations (macOS)
```bash
# Standard git commands
git status
git add .
git commit -m "message"
git push
git pull

# Find files
find . -name "*.ts" -type f

# Search in files
grep -r "pattern" .

# List directory contents
ls -la

# Change directory
cd path/to/directory
```