# MKing Friend - Product Requirements Document (PRD)

## 1. Product Overview

### 1.1 Product Vision
MKing Friend is an online dating platform primarily serving women, aiming to provide a safe and friendly environment for men and women to meet based on common interests.

### 1.2 Target Users
- **Primary Users**: Women aged 18-35 seeking high-quality dating experiences
- **Secondary Users**: Men aged 20-40 who respect platform guidelines

### 1.3 Core Values
- Female user experience-centered design
- Providing a safe and reliable dating environment
- Supporting diverse interaction methods
- Seamless cross-platform user experience

## 2. Functional Requirements

### 2.1 User System
#### 2.1.1 Registration and Login
- **Multi-platform Registration**: Keycloak OAuth, Email, Line
- **Identity Verification**: Email verification, phone number verification (optional)
- **Security Mechanisms**: Two-factor authentication, password strength checking

#### 2.1.2 Personal Profile Management
- **Basic Information**: Name, age, gender, location, occupation
- **Interest Tags**: Selectable and customizable interest tags
- **Privacy Settings**: Data visibility control

### 2.2 Multimedia Features
#### 2.2.1 Content Upload
- **Photos**: Support for multiple photo uploads, main photo setting
- **Videos**: Short video uploads (limited duration and size)
- **Audio**: Voice self-introduction

#### 2.2.2 Content Management
- **Editing Features**: Photo cropping, filter effects
- **Privacy Control**: Content visibility settings
- **Moderation Mechanism**: Keyword filtering and manual content review (AI features for future extension)

### 2.3 Social Interaction
#### 2.3.1 Basic Interaction
- **Like System**: Like users or content
- **Follow Feature**: Follow users of interest
- **Comment Feature**: Comment on user content

#### 2.3.2 Matching Mechanism
- **Smart Recommendations**: User recommendations based on interests and behavior
- **Filter Features**: Filter by age, location, interests, etc.
- **Match Notifications**: Notifications when mutual likes occur

### 2.4 Real-time Communication
#### 2.4.1 Chat Features
- **One-on-one Chat**: Private chat rooms
- **Multimedia Messages**: Text, images, voice, emoji
- **Message Status**: Delivered and read status display

#### 2.4.2 Voice and Video Calls
- **Voice Calls**: Real-time voice calls between friends
- **Video Calls**: Video calls between friends
- **Call Quality**: Automatic call quality adjustment

### 2.5 Security and Privacy
#### 2.5.1 Security Mechanisms
- **User Reporting**: Inappropriate behavior reporting system
- **Block Feature**: Block specific users
- **Content Moderation**: Keyword filtering + manual review mechanism (AI features for future extension)

#### 2.5.2 Privacy Protection
- **Data Encryption**: All sensitive data encrypted storage
- **Location Privacy**: Fuzzy location display
- **Chat History**: User-controlled chat history preservation

### 2.6 Admin Management System
#### 2.6.1 Core Management Features
- **Dashboard**: System overview, key metrics, real-time monitoring
- **User Management**: User list, detailed information, status management, behavior analysis
- **Content Moderation**: User profile review, photo review, chat content monitoring
- **Report Handling**: Report list, processing workflow, decision records
- **Data Analytics**: User statistics, matching analysis, activity reports
- **System Monitoring**: Service status, performance metrics, error logs
- **Permission Management**: Admin roles, permission allocation, operation auditing
- **Customer Service Management**: Customer service tickets, FAQ management, user feedback
- **System Configuration**: Platform settings, feature toggles, parameter adjustments

#### 2.6.2 Technical Architecture
- **Frontend**: React + TypeScript + Ant Design Pro
- **Backend**: NestJS Admin Service + GraphQL
- **State Management**: Zustand + React Query
- **Access Control**: RBAC Model + JWT Authentication
- **Data Visualization**: ECharts + Custom Chart Components

#### 2.6.3 Security Requirements
- **Operation Auditing**: All management operations recorded
- **IP Whitelist**: Restrict admin backend access sources
- **Session Management**: Auto logout, session timeout
- **Data Masking**: Sensitive data display masking
- **Least Privilege**: On-demand admin permission allocation

## 3. Non-functional Requirements

### 3.1 Performance Requirements
- **Load Time**: Page load time < 3 seconds
- **API Response**: API response time < 500ms
- **Real-time**: Real-time message delay < 100ms
- **Concurrency**: Support 1000+ concurrent users

### 3.2 Usability Requirements
- **Cross-platform**: Support mobile, tablet, desktop
- **Browser**: Support latest versions of mainstream browsers
- **Offline Features**: Basic features available offline
- **Accessibility**: Comply with WCAG 2.1 AA standards

### 3.3 Security Requirements
- **Data Protection**: Comply with GDPR and personal data protection law requirements
- **Transmission Security**: Site-wide HTTPS encryption
- **Authentication Security**: OAuth 2.0 standard
- **Protection Mechanisms**: DDoS protection, SQL injection protection

## 4. Technical Constraints

### 4.1 Technology Stack Selection

#### 4.1.1 Microservices Architecture
- **Architecture Pattern**: Microservices architecture
- **API Gateway**: Nginx/Traefik (unified entry point)
- **Service Discovery**: Consul
- **Inter-service Communication**: gRPC + RESTful API
- **Load Balancing**: Nginx

#### 4.1.2 Frontend Technology Stack
- **Framework**: React.js + TypeScript + Vite
- **State Management**: Zustand + React Query
- **UI Framework**: Ant Design + Custom Component Library
- **Map Service**: OpenStreetMap + Leaflet
- **Testing**: Jest + React Testing Library

#### 4.1.3 Backend Technology Stack
- **Runtime Environment**: Node.js + NestJS + TypeScript
- **Database**: PostgreSQL (shared database, microservice-specific schemas)
- **Cache**: Redis
- **ORM**: Prisma
- **Search Engine**: Typesense
- **Real-time Communication**: Socket.io
- **Testing**: Jest + Supertest

#### 4.1.4 Deployment and Operations
- **Containerization**: Docker + Docker Compose
- **Orchestration**: Kubernetes (production environment)
- **Monitoring**: Prometheus + Grafana
- **Logging**: Loki + Promtail
- **Error Tracking**: Sentry (Self-hosted)

### 4.2 Microservices Architecture Design

#### 4.2.1 Core Microservices
- **API Gateway**: Unified entry point, routing distribution, authentication and authorization
- **Auth Service**: User authentication, JWT management, OAuth integration
- **User Service**: User data management, personal profiles, preference settings
- **Chat Service**: Real-time chat, message history, WebSocket management
- **Media Service**: File upload, image processing, CDN management
- **Search Service**: Typesense integration, user search, recommendation algorithms
- **Admin Service**: Backend management, content moderation, data statistics

#### 4.2.2 Infrastructure Services
- **Service Discovery**: Consul (service registration and discovery)
- **Load Balancing**: Nginx (reverse proxy and load balancing)
- **Configuration Management**: Environment variables + configuration center
- **Health Checks**: Service health status monitoring

### 4.3 Third-party Integration (Free Self-Hosted Solutions)
- **Authentication Service**: Keycloak (open-source identity authentication service)
- **File Storage**: MinIO (S3-compatible object storage)
- **Push Notifications**: Web Push API + Service Worker (browser native)
- **Analytics Service**: Plausible Analytics (Self-hosted)
- **Email Service**: Nodemailer + SMTP (development environment uses MailHog, production environment recommends MailerSend)
- **Monitoring Service**: Grafana + Prometheus (metrics monitoring) + Loki + Promtail (log management)
- **Error Tracking**: Sentry (Self-hosted)

## 5. Business Requirements

### 5.1 Business Model
- **Freemium**: Basic features free, advanced features paid
- **Membership**: Monthly or annual membership fees
- **Advertising Revenue**: Non-intrusive advertising

### 5.2 Success Metrics
- **User Growth**: Monthly active users
- **User Engagement**: Daily average usage time
- **Matching Success**: Number of successful matches
- **User Satisfaction**: User ratings and feedback

## 6. Risk Assessment

### 6.1 Technical Risks
- **WebRTC Complexity**: High technical difficulty for voice and video features
- **Scalability**: System scaling when user growth occurs
- **Security Vulnerabilities**: Potential security threats

### 6.2 Business Risks
- **Intense Competition**: Highly competitive dating market
- **User Acquisition**: High initial user acquisition costs
- **Regulatory Changes**: Potential changes in relevant regulations

### 6.3 Mitigation Strategies
- **Technical**: Use mature open-source solutions
- **Business**: Focus on differentiated features and user experience
- **Regulatory**: Continuously monitor regulatory changes and adjust accordingly

## 7. Appendix

### 7.1 Reference Materials
- Competitive analysis report
- User research results
- Technical feasibility analysis

## 8. MVP Feature Priority

### 8.1 P0 - MVP Core Features (Must Have)
- User registration/login (multi-platform support)
- Personal profile creation and management
- Photo upload and display
- User browsing and discovery
- Like/dislike interactions
- Match notification mechanism
- Basic real-time chat
- Responsive UI design

### 8.2 P1 - MVP Enhanced Features (Strongly Recommended)
- Basic search and filtering
- Personal privacy settings
- User reporting system
- Basic recommendation algorithm
- Message status display
- Basic data analytics

### 8.3 P2 - Enhanced Features (Can Be Delayed)
- Multiple photo uploads
- Geographic location search
- Advanced filtering options
- Backend management system
- Multi-language support

### 8.4 P3 - Advanced Features (Future Versions)
- Voice and video calls
- AI smart recommendations
- Third-party platform integration
- Paid features
- Mobile applications

### 7.2 Version History
- v1.3 - Added MVP feature priority and backend management system requirements (2025-01-03)
- v1.2 - Updated microservices architecture and technology stack (2025-01-03)
- v1.1 - Added Typesense search engine and OpenStreetMap map service (2025-01-03)
- v1.0 - Initial version (2025-01-02)