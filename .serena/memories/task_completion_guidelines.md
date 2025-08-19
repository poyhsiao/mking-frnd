# Task Completion Guidelines

## When a Task is Completed

### 1. Code Quality Checks
```bash
# Run linting and fix issues
pnpm lint:fix

# Check code formatting
pnpm format:check

# Run type checking
pnpm type-check
```

### 2. Testing Requirements
```bash
# Run unit tests
pnpm test:unit

# Run integration tests
pnpm test:integration

# Run BDD tests
pnpm test:bdd

# Check test coverage
pnpm test:coverage
```

### 3. Security Validation
```bash
# Check for secrets (if gitleaks is available locally)
gitleaks detect --source . --verbose

# Audit dependencies
pnpm audit --audit-level=moderate

# Verify no hardcoded credentials
grep -r "password\|secret\|key" . --exclude-dir=node_modules --exclude-dir=.git
```

### 4. Build Verification
```bash
# Build all projects
pnpm build

# Verify Docker builds
./scripts/verify-docker-build.sh
```

### 5. Documentation Updates
- Update README.md if functionality changes
- Add/update API documentation
- Update CHANGELOG.md with changes
- Add inline code comments for complex logic

### 6. Git Workflow
```bash
# Stage changes
git add .

# Commit with conventional format
git commit -m "feat: add new feature" # or fix:, docs:, test:, etc.

# Push to feature branch
git push origin feature/branch-name

# Create pull request for code review
```

### 7. CI/CD Validation
- Ensure all GitHub Actions workflows pass
- Check security scan results
- Verify deployment readiness
- Review test results and coverage reports

### 8. Environment-Specific Checks

#### Development
- Local development server starts without errors
- All services are healthy in Docker Compose
- Hot reload works correctly

#### Testing
- All test environments pass
- Database migrations work
- Test data setup is correct

#### Production
- Security configurations are production-ready
- Environment variables are properly set
- Performance benchmarks are met

### 9. Security-Specific Completion Criteria
- No secrets in code or configuration files
- All dependencies are up-to-date and secure
- Security headers are properly configured
- Input validation is implemented
- Authentication and authorization work correctly

### 10. Monitoring and Observability
- Logs are structured and informative
- Metrics are properly exposed
- Error tracking is configured
- Health checks are implemented

## Pre-Commit Checklist
- [ ] Code is linted and formatted
- [ ] All tests pass
- [ ] Type checking passes
- [ ] No security vulnerabilities
- [ ] Documentation is updated
- [ ] Commit message follows conventions
- [ ] No debugging code left in
- [ ] Environment variables are documented

## Definition of Done
A task is considered complete when:
1. All acceptance criteria are met
2. Code quality checks pass
3. All tests pass with adequate coverage
4. Security scans show no critical issues
5. Documentation is updated
6. Code review is approved
7. CI/CD pipeline passes
8. Feature works in target environment