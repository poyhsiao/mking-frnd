# Code Style and Conventions

## General Principles
- **Clean Code**: Write readable, maintainable code
- **Type Safety**: Use TypeScript with strict type checking
- **Security First**: Sanitize inputs, prevent vulnerabilities
- **Test-Driven Development**: Write tests for all functions
- **Documentation**: Clear docstrings and comments

## TypeScript/JavaScript Style
- **ESLint**: Configured with TypeScript and Prettier rules
- **Prettier**: Automatic code formatting
- **File Extensions**: `.ts` for TypeScript, `.tsx` for React components
- **Naming Conventions**:
  - Variables/functions: camelCase
  - Classes: PascalCase
  - Constants: UPPER_SNAKE_CASE
  - Files: kebab-case or camelCase

## Code Quality Tools
- **ESLint**: `@typescript-eslint/eslint-plugin`, `eslint-config-prettier`
- **Prettier**: Consistent code formatting
- **Husky**: Git hooks for pre-commit checks
- **lint-staged**: Run linters on staged files
- **commitlint**: Conventional commit messages

## Testing Conventions
- **Unit Tests**: Vitest for all functions
- **Integration Tests**: Test service interactions
- **E2E Tests**: Playwright for end-to-end scenarios
- **BDD Tests**: Cucumber for behavior-driven development
- **Test Files**: `*.test.ts`, `*.spec.ts`
- **Coverage**: Aim for high test coverage

## Security Conventions
- **No Hardcoded Secrets**: Use environment variables
- **Input Validation**: Sanitize all user inputs
- **SQL Injection Prevention**: Use parameterized queries
- **XSS Prevention**: Escape output, use CSP headers
- **Authentication**: JWT tokens, secure session management
- **CORS**: Properly configured for allowed origins

## Documentation Standards
- **README**: Comprehensive setup and usage instructions
- **API Documentation**: OpenAPI/Swagger specs
- **Code Comments**: JSDoc for functions and classes
- **Architecture Docs**: In `docs/` directory
- **Changelog**: Keep CHANGELOG.md updated

## Git Workflow
- **Branching**: GitFlow strategy (main, develop, feature branches)
- **Commits**: Conventional commit format
- **Pull Requests**: Required for code review
- **Pre-commit Hooks**: Lint, format, test before commit

## Environment Configuration
- **Environment Variables**: Use `.env` files
- **Configuration**: Separate configs for dev/test/prod
- **Secrets Management**: Never commit secrets to repo
- **Docker**: Containerized development environment

## Performance Guidelines
- **Bundle Size**: Monitor and optimize
- **Database Queries**: Optimize with proper indexing
- **Caching**: Use Redis for frequently accessed data
- **Monitoring**: Prometheus metrics, Grafana dashboards

## Error Handling
- **Structured Logging**: Use consistent log formats
- **Error Tracking**: Sentry for production error monitoring
- **Graceful Degradation**: Handle failures gracefully
- **Validation**: Comprehensive input validation