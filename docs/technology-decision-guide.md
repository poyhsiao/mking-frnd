# MKing Friend Technical Architecture Decision Records (ADR)

## Overview

This document records important technical architecture decisions for the MKing Friend project, including decision background, considered options, final decisions, and expected consequences. These decisions will guide the entire development process.

## ADR-001: Microservices Architecture vs Monolithic Architecture

### Status
✅ **Decided** - Adopt Microservices Architecture

### Background
Need to choose the overall application architecture pattern, considering team size, functional complexity, and future scalability requirements.

### Decision
Adopt microservices architecture, splitting the application into the following services:
- API Gateway (unified entry point)
- Auth Service (authentication service)
- User Service (user service)
- Chat Service (chat service)
- Media Service (media service)
- Search Service (search service)
- Admin Service (administration service)

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
- Social app functional modules are naturally separated
- Different modules have different scaling requirements
- Teams can develop in parallel
- Preparation for future growth

### Consequences
- Need to invest more time in infrastructure construction
- Need to establish inter-service communication mechanisms
- Need unified monitoring and logging systems
- Initial development will be slower than monolithic architecture

---

## ADR-002: Database Strategy

### Status
✅ **Decided** - Shared PostgreSQL + Microservice-specific Schema

### Background
Database design strategy selection under microservices architecture.

### Considered Options
1. **Independent database per microservice**
2. **Shared database with independent schemas**
3. **Fully shared database**

### Decision
Adopt shared PostgreSQL database, but each microservice uses an independent schema.

### Rationale
**Selection Reasons:**
- Reduce operational complexity
- Guarantee ACID transactions
- Reduce data synchronization issues
- Cost-effective
- Suitable for team size

**Schema Separation:**
- `auth_schema`: Authentication-related data
- `user_schema`: User data
- `chat_schema`: Chat data
- `media_schema`: Media file data
- `admin_schema`: Administrative data

### Consequences
- Need careful schema boundary design
- Need database migration coordination
- Some cross-service queries require API calls
- Database becomes potential bottleneck

---

## ADR-003: Frontend Technology Stack

### Status
✅ **Decided** - React + TypeScript + Vite

### Background
Choose frontend development technology stack, considering development efficiency, performance, and team skills.

### Considered Options
1. **React + TypeScript + Vite**
2. **Vue.js + TypeScript + Vite**
3. **Next.js (React framework)**
4. **Svelte + SvelteKit**

### Decision
**Main Technology Stack:**
- React 18 (UI framework)
- TypeScript (type safety)
- Vite (build tool)
- Zustand (state management)
- React Query (data fetching)
- Tailwind CSS (styling framework)
- Ant Design (UI component library)

### Rationale
**React Selection Reasons:**
- High team familiarity
- Mature ecosystem
- Strong community support
- Easy recruitment

**TypeScript Selection Reasons:**
- Type safety
- Better development experience
- Refactoring-friendly
- Team collaboration efficiency

**Vite Selection Reasons:**
- Fast development server
- Excellent HMR
- Modern build process
- Native TypeScript support

### Consequences
- Need to learn React 18 new features
- TypeScript increases initial development time
- Vite ecosystem is relatively new
- Overall excellent development experience

---

## ADR-004: Backend Technology Stack

### Status
✅ **Decided** - Node.js + NestJS + Prisma

### Background
Choose backend development technology stack, considering development efficiency, performance, and maintainability.

### Considered Options
1. **Node.js + NestJS + Prisma**
2. **Node.js + Express + TypeORM**
3. **Python + FastAPI + SQLAlchemy**
4. **Go + Gin + GORM**

### Decision
**Main Technology Stack:**
- Node.js 18+ (runtime environment)
- NestJS (backend framework)
- Prisma (ORM)
- TypeScript (development language)
- PostgreSQL (primary database)
- Redis (caching)
- JWT (authentication)

### Rationale
**Node.js Selection Reasons:**
- Unified frontend and backend language
- Rich ecosystem
- Suitable for I/O intensive applications
- Team skill match

**NestJS Selection Reasons:**
- Enterprise-grade framework
- Built-in TypeScript support
- Modular architecture
- Rich decorators
- Microservices support

**Prisma Selection Reasons:**
- Type-safe ORM
- Excellent development experience
- Auto-generated types
- Database migration tools

### Consequences
- Need to learn NestJS architecture patterns
- Prisma is relatively new with smaller community
- Node.js single-thread limitations
- Overall high development efficiency

---

## ADR-005: Search Engine Selection

### Status
✅ **Decided** - Typesense

### Background
Need to choose a search engine to implement user search and recommendation features.

### Considered Options
1. **Elasticsearch**
2. **Typesense**
3. **PostgreSQL Full-text Search**
4. **Algolia (SaaS)**

### Decision
Adopt Typesense as the primary search engine.

### Rationale
**Typesense Advantages:**
- Open source and free
- Simple setup
- Excellent performance
- Real-time search
- Typo-tolerant search
- Geolocation search support
- Low resource consumption

**vs Elasticsearch:**
- More lightweight
- Simpler setup
- Lower memory usage
- Better suited for small to medium applications

**vs PostgreSQL:**
- Better search experience
- Richer search functionality
- Better performance

### Consequences
- Need to maintain additional search service
- Need data synchronization mechanism
- Relatively smaller community
- Excellent search experience

---

## ADR-006: Map Service Selection

### Status
✅ **Decided** - OpenStreetMap + Leaflet

### Background
Need map service to implement geolocation features, considering cost and functional requirements.

### Considered Options
1. **Google Maps API**
2. **OpenStreetMap + Leaflet**
3. **Mapbox**
4. **Apple Maps (iOS only)**

### Decision
Adopt OpenStreetMap + Leaflet combination.

### Rationale
**Selection Reasons:**
- Completely free
- Open source solution
- No API call limits
- Self-controlled
- Community support
- Functionality sufficient for requirements

**vs Google Maps:**
- No cost pressure
- No call count limits
- Better data privacy

**Leaflet Advantages:**
- Lightweight
- Rich plugins
- Easy customization
- Mobile-friendly

### Consequences
- Map data may not be as complete as Google
- Need to handle geocoding ourselves
- Some advanced features require additional development
- Significantly reduced operational costs

---

## ADR-007: State Management Strategy

### Status
✅ **Decided** - Zustand + React Query

### Background
Frontend application needs effective state management solution.

### Considered Options
1. **Redux Toolkit**
2. **Zustand + React Query**
3. **Recoil**
4. **Context API + useReducer**

### Decision
Adopt Zustand for client state management, React Query for server state management.

### Rationale
**Zustand Advantages:**
- Lightweight (2KB)
- Simple and easy to use
- TypeScript friendly
- No boilerplate code
- Flexible architecture

**React Query Advantages:**
- Specialized for server state
- Automatic caching
- Background updates
- Optimistic updates
- Error handling

**Combined Advantages:**
- Clear separation of concerns
- Low learning curve
- Excellent performance
- Great development experience

### Consequences
- Need to learn two state management libraries
- Need clear state classification
- Overall reduced complexity
- Improved development efficiency

---

## ADR-008: Authentication Strategy

### Status
✅ **Decided** - JWT + Keycloak OAuth

### Background
Need to design secure and reliable user authentication and authorization system.

### Considered Options
1. **Session-based authentication**
2. **JWT authentication**
3. **OAuth 2.0 + OpenID Connect**
4. **Hybrid approach**

### Decision
Adopt JWT as primary authentication mechanism, integrate Keycloak to provide OAuth functionality.

### Rationale
**JWT Advantages:**
- Stateless
- Cross-service friendly
- Mobile-friendly
- Contains user information
- Standardized

**Keycloak Advantages:**
- Open source IAM solution
- Supports multiple authentication methods
- Social login integration
- Complete management interface
- Enterprise-grade features

**Architecture Design:**
- Short-term Access Token (15 minutes)
- Long-term Refresh Token (7 days)
- Automatic token refresh
- Secure token storage

### Consequences
- Need to handle token refresh logic
- Need secure token storage
- Keycloak increases deployment complexity
- Provides flexible authentication options

---

## ADR-009: Containerization and Deployment Strategy

### Status
✅ **Decided** - Docker + Kubernetes

### Background
Need to choose application containerization and deployment strategy.

### Considered Options
1. **Docker + Docker Compose**
2. **Docker + Kubernetes**
3. **Docker + Docker Swarm**
4. **Non-containerized deployment**

### Decision
Adopt Docker for containerization, Kubernetes as orchestration platform.

### Rationale
**Docker Advantages:**
- Environment consistency
- Easy deployment
- Resource isolation
- Version management

**Kubernetes Advantages:**
- Auto-scaling
- Service discovery
- Load balancing
- Health checks
- Rolling updates
- Configuration management

**Deployment Strategy:**
- Development environment: Docker Compose
- Testing environment: Kubernetes
- Production environment: Kubernetes

### Consequences
- Increased learning costs
- Need DevOps skills
- Increased deployment complexity
- Significantly improved operational capabilities

---

## ADR-010: Monitoring and Logging Strategy

### Status
✅ **Decided** - Prometheus + Grafana + Loki

### Background
Microservices architecture needs comprehensive monitoring and logging systems.

### Considered Options
1. **ELK Stack (Elasticsearch + Logstash + Kibana)**
2. **Prometheus + Grafana + Loki**
3. **Cloud monitoring services**
4. **Self-built monitoring system**

### Decision
Adopt Prometheus + Grafana + Loki + Promtail combination.

### Rationale
**Prometheus Advantages:**
- Time series database
- Powerful query language
- Service discovery
- Alert rules
- Cloud-native standard

**Grafana Advantages:**
- Rich visualization
- Multi-datasource support
- Alert notifications
- Dashboard sharing

**Loki Advantages:**
- Lightweight logging system
- Prometheus integration
- Cost-effective
- Good query performance

### Consequences
- Need to learn PromQL
- Need to design monitoring metrics
- Increased infrastructure complexity
- Provides comprehensive observability

---

## Technical Debt Management

### Known Technical Debt
1. **Microservices Complexity**: May be over-engineered initially
2. **Database Design**: May need schema refactoring
3. **Performance Optimization**: Initial focus on functionality, optimize later
4. **Test Coverage**: Need to supplement automated testing

### Debt Repayment Plan
- **Phase 1**: Focus on feature implementation
- **Phase 2**: Performance optimization and refactoring
- **Phase 3**: Test completion and documentation
- **Phase 4**: Architecture optimization and scaling

## Decision Review Mechanism

### Review Cycle
- **Monthly Review**: Check decision implementation status
- **Quarterly Assessment**: Evaluate decision effectiveness
- **Annual Review**: Major decision adjustments

### Review Criteria
- Technical goal achievement
- Development efficiency impact
- Maintenance cost changes
- Team satisfaction

---

**Document Version**: v1.0  
**Last Updated**: 2025-01-03  
**Maintainer**: Technical Team  
**Review Status**: Passed technical review