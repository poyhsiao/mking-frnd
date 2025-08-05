# MKing Friend Technical Architecture Decision Records (ADR)

## Overview

This document records important technical architecture decisions for the MKing Friend project, including decision background, considered options, final decisions, and expected consequences. These decisions will guide the entire development process.

## ADR-001: Microservices Architecture vs Monolithic Architecture

### Status
✅ **Decided** - Adopt Microservices Architecture

### Background
Need to choose the overall application architecture pattern, considering team size, functional complexity, and future expansion requirements.

### Decision
Adopt microservices architecture, splitting the application into the following services:
- API Gateway (unified entry point)
- Auth Service (authentication service)
- User Service (user service)
- Chat Service (chat service)
- Media Service (media service)
- Search Service (search service)
- Admin Service (admin service)

### Rationale
**Advantages:**
- Independent deployment and scaling
- Technology stack flexibility
- Independent team development
- Fault isolation
- Aligns with business boundaries

**Disadvantages:**
- Increased operational complexity
- Network latency
- Data consistency challenges
- Debugging difficulties

**Decision Reasons:**
- Social app features are naturally separated
- Different modules have different scaling requirements
- Teams can develop in parallel
- Preparation for future growth

### Consequences
- Need to invest more time in infrastructure construction
- Need to establish inter-service communication mechanisms
- Need unified monitoring and logging systems
- Development will be slower than monolithic architecture initially

## ADR-002: Database Selection - PostgreSQL vs MySQL vs MongoDB

### Status
✅ **Decided** - PostgreSQL as Primary Database

### Background
Need to select a primary database that can handle complex relationships, ensure data consistency, and support future scaling requirements.

### Decision
Use PostgreSQL as the primary database with Redis for caching and session management.

### Rationale
**PostgreSQL Advantages:**
- ACID compliance and strong consistency
- Advanced JSON support (JSONB)
- Full-text search capabilities
- Excellent performance for complex queries
- Strong community and ecosystem
- Advanced indexing options

**Compared to MySQL:**
- Better JSON handling
- More advanced features (arrays, custom types)
- Better performance for complex queries

**Compared to MongoDB:**
- ACID transactions across multiple documents
- Mature ecosystem and tooling
- Better for relational data (users, friendships)

### Consequences
- Team needs PostgreSQL expertise
- Need to design proper indexing strategy
- Consider read replicas for scaling
- Use connection pooling for performance

## ADR-003: Frontend Framework - React vs Vue.js vs Angular

### Status
✅ **Decided** - React with TypeScript

### Background
Need to choose a frontend framework that provides good developer experience, performance, and maintainability for a social media application.

### Decision
Use React with TypeScript, Vite for build tooling, and Tailwind CSS for styling.

### Rationale
**React Advantages:**
- Large ecosystem and community
- Excellent TypeScript support
- Component reusability
- Strong testing ecosystem
- Good performance with proper optimization

**TypeScript Benefits:**
- Type safety and better IDE support
- Easier refactoring and maintenance
- Better team collaboration
- Reduced runtime errors

**Supporting Tools:**
- Vite: Fast development and build times
- Tailwind CSS: Utility-first styling approach
- React Query: Server state management
- Zustand: Client state management

### Consequences
- Team needs React and TypeScript expertise
- Need to establish component design system
- Implement proper state management patterns
- Set up comprehensive testing strategy

## ADR-004: Authentication Strategy - JWT vs Session-based

### Status
✅ **Decided** - JWT with Refresh Token Strategy

### Background
Need to implement secure authentication that works well with microservices architecture and provides good user experience.

### Decision
Implement JWT-based authentication with refresh tokens, stored securely in HTTP-only cookies.

### Rationale
**JWT Advantages:**
- Stateless authentication (good for microservices)
- Can include user claims and permissions
- No server-side session storage required
- Works well with API Gateway

**Refresh Token Strategy:**
- Short-lived access tokens (15 minutes)
- Long-lived refresh tokens (7 days)
- Automatic token refresh
- Secure token revocation

**Security Measures:**
- HTTP-only cookies for refresh tokens
- Secure and SameSite cookie attributes
- Token rotation on refresh
- Blacklist for revoked tokens

### Consequences
- Need to implement token refresh logic
- Require secure token storage strategy
- Need token blacklist management
- Implement proper logout functionality

## ADR-005: Real-time Communication - WebSockets vs Server-Sent Events

### Status
✅ **Decided** - WebSockets with Socket.IO

### Background
Need real-time communication for chat, notifications, and live updates in the social media application.

### Decision
Use WebSockets with Socket.IO for real-time communication, with fallback to polling.

### Rationale
**WebSockets Advantages:**
- Bidirectional communication
- Low latency for real-time features
- Efficient for frequent updates
- Good browser support

**Socket.IO Benefits:**
- Automatic fallback mechanisms
- Room and namespace support
- Built-in reconnection logic
- Cross-browser compatibility
- Easy integration with authentication

**Use Cases:**
- Real-time chat messaging
- Live notifications
- Online status updates
- Typing indicators
- Live reactions and comments

### Consequences
- Need to handle connection management
- Implement proper error handling and reconnection
- Consider scaling with Redis adapter
- Monitor connection performance and limits

## ADR-006: File Storage - Local vs Cloud Storage

### Status
✅ **Decided** - Hybrid Approach (Local + Cloud)

### Background
Need to store user-uploaded media files (images, videos, documents) with considerations for cost, performance, and scalability.

### Decision
Implement a hybrid storage approach:
- Local storage for development and small files
- Cloud storage (AWS S3/DigitalOcean Spaces) for production
- CDN for global content delivery

### Rationale
**Hybrid Approach Benefits:**
- Cost-effective for development
- Scalable for production
- Flexible migration path
- Performance optimization with CDN

**Cloud Storage Advantages:**
- Unlimited scalability
- Built-in redundancy and backup
- Global availability
- Integration with CDN services

**Implementation Strategy:**
- Abstract storage interface
- Environment-based configuration
- Automatic image optimization
- Progressive loading for large files

### Consequences
- Need to implement storage abstraction layer
- Configure CDN for optimal performance
- Implement file upload validation and security
- Monitor storage costs and usage

## ADR-007: API Design - REST vs GraphQL

### Status
✅ **Decided** - RESTful APIs with OpenAPI Specification

### Background
Need to design APIs that are easy to understand, maintain, and consume by frontend applications and potential third-party integrations.

### Decision
Use RESTful API design principles with comprehensive OpenAPI (Swagger) documentation.

### Rationale
**REST Advantages:**
- Simple and well-understood
- Good caching support
- Stateless and scalable
- Wide tooling support
- Easy to test and debug

**OpenAPI Benefits:**
- Automatic documentation generation
- Client SDK generation
- API testing and validation
- Team collaboration and communication

**Design Principles:**
- Resource-based URLs
- Proper HTTP methods and status codes
- Consistent response formats
- Pagination for large datasets
- Versioning strategy

### Consequences
- Need to maintain API documentation
- Implement consistent error handling
- Design proper pagination and filtering
- Consider API rate limiting and security

## ADR-008: Testing Strategy - Unit, Integration, E2E

### Status
✅ **Decided** - Comprehensive Testing Pyramid

### Background
Need to establish a testing strategy that ensures code quality, prevents regressions, and supports continuous deployment.

### Decision
Implement a comprehensive testing strategy following the testing pyramid:
- Unit Tests (70%): Jest for backend, React Testing Library for frontend
- Integration Tests (20%): API testing with Supertest
- E2E Tests (10%): Cypress for critical user journeys

### Rationale
**Testing Pyramid Benefits:**
- Fast feedback loop with unit tests
- Confidence in component integration
- End-to-end user experience validation
- Cost-effective testing approach

**Tool Selection:**
- Jest: Excellent TypeScript support and mocking capabilities
- React Testing Library: Component testing best practices
- Supertest: API endpoint testing
- Cypress: Reliable E2E testing with great debugging

**Testing Practices:**
- Test-Driven Development (TDD) for critical features
- Code coverage targets (80% minimum)
- Automated testing in CI/CD pipeline
- Regular test maintenance and updates

### Consequences
- Need to establish testing culture and practices
- Invest time in test setup and maintenance
- Monitor test performance and reliability
- Regular review and update of test strategies

## ADR-009: Deployment Strategy - Docker + Kubernetes vs Traditional

### Status
✅ **Decided** - Docker Containers with Docker Compose (Development) and Kubernetes (Production)

### Background
Need a deployment strategy that supports microservices architecture, enables easy scaling, and provides consistent environments.

### Decision
Use containerization with Docker:
- Docker Compose for local development
- Kubernetes for production deployment
- CI/CD pipeline with automated deployments

### Rationale
**Containerization Benefits:**
- Consistent environments across development and production
- Easy service isolation and scaling
- Simplified dependency management
- Portable deployments

**Kubernetes Advantages:**
- Automatic scaling and load balancing
- Service discovery and networking
- Rolling updates and rollbacks
- Health monitoring and self-healing

**Development Workflow:**
- Local development with Docker Compose
- Feature branch deployments for testing
- Staging environment for integration testing
- Production deployment with blue-green strategy

### Consequences
- Team needs Docker and Kubernetes expertise
- Setup and maintain CI/CD pipelines
- Monitor resource usage and costs
- Implement proper logging and monitoring

## ADR-010: Monitoring and Observability

### Status
✅ **Decided** - Comprehensive Observability Stack

### Background
Need to monitor application performance, track errors, and gain insights into user behavior for a microservices architecture.

### Decision
Implement comprehensive observability with:
- Logging: Structured logging with Winston/Pino
- Metrics: Prometheus with Grafana dashboards
- Tracing: Distributed tracing with Jaeger
- Error Tracking: Sentry for error monitoring
- Uptime Monitoring: Health checks and alerts

### Rationale
**Observability Requirements:**
- Monitor microservices health and performance
- Track user interactions and business metrics
- Debug issues across distributed systems
- Proactive alerting for critical issues

**Tool Selection:**
- Prometheus: Industry-standard metrics collection
- Grafana: Powerful visualization and alerting
- Jaeger: Distributed tracing for microservices
- Sentry: Comprehensive error tracking and performance monitoring

**Implementation Strategy:**
- Structured logging with correlation IDs
- Custom metrics for business KPIs
- Distributed tracing across all services
- Automated alerting for critical thresholds

### Consequences
- Setup and maintain monitoring infrastructure
- Train team on observability best practices
- Regular review and optimization of dashboards
- Monitor infrastructure costs and performance

## Decision Review Process

### Regular Reviews
- Monthly architecture review meetings
- Quarterly technology assessment
- Annual strategic technology planning

### Decision Updates
- Document any changes to existing decisions
- Maintain decision history and rationale
- Communicate changes to all team members

### Success Metrics
- Development velocity and team productivity
- Application performance and reliability
- Code quality and maintainability
- Team satisfaction and learning

## ADR-012: PNPM Lockfile CI/CD Error Resolution Using TDD

### Status
✅ **Decided** - Implement TDD-based approach for CI/CD lockfile issues

### Background
CI pipeline was failing with `ERR_PNPM_OUTDATED_LOCKFILE` error, causing deployment blockages and developer productivity issues.

### Decision
Adopt Test-Driven Development (TDD) methodology to:
1. Create comprehensive test suites for lockfile validation
2. Implement targeted fixes based on test requirements
3. Ensure robust prevention of future lockfile issues

### Implementation
**Test Suites Created:**
- `tests/ci/pnpm-lockfile-sync.test.ts` - Lockfile synchronization validation
- `tests/ci/pnpm-frozen-lockfile.test.ts` - CI compatibility testing

**CI Configuration Updates:**
- Fixed pnpm version mismatch (CI: '8' → '8.15.1')
- Added lockfile validation step with helpful error messages
- Enhanced error handling and developer guidance

### Rationale
**Advantages:**
- Proactive issue detection before CI deployment
- Comprehensive validation coverage
- Clear error resolution guidance
- Automated prevention of regression
- Improved developer experience

**TDD Benefits:**
- Tests define exact requirements
- Targeted fixes based on failing tests
- Confidence in solution completeness
- Documentation through test cases

### Consequences
**Positive:**
- Eliminated CI lockfile failures
- Robust prevention measures
- Enhanced developer productivity
- Improved CI pipeline reliability

**Considerations:**
- Additional test maintenance overhead
- Initial time investment in comprehensive testing
- Need for regular test suite updates

### Success Metrics
- ✅ All 52 tests passing across 5 test files
- ✅ Zero CI failures due to lockfile issues
- ✅ Improved error resolution time
- ✅ Enhanced developer confidence in CI pipeline

### Related Documentation
- [PNPM Lockfile TDD Fix](./pnpm-lockfile-tdd-fix.md)
- [Development Tasks](./development-tasks.md)
- [TDD Guidelines](./development/tdd-guidelines.md)

---

**Note**: These ADRs are living documents that should be updated as the project evolves and new requirements emerge. Regular reviews ensure that our technical decisions continue to align with business goals and industry best practices.