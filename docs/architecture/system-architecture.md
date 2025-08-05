# MKing Friend - System Architecture Design

## 1. Overall Architecture Overview

### 1.1 Architecture Principles
- **Microservices Architecture**: Modular design for easy scaling and maintenance
- **Cloud Native**: Containerized deployment supporting horizontal scaling
- **Security First**: Multi-layer security protection mechanisms
- **High Availability**: 99.9%+ service availability

### 1.2 System Architecture Diagram
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Client    │    │  Mobile Client  │    │   Admin Panel   │
│   (React PWA)   │    │ (React Native)  │    │ (Ant Design Pro)│
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │      Load Balancer      │
                    │        (Nginx)          │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │      API Gateway        │
                    │     (Express.js)        │
                    └────────────┬────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                       │                       │
┌───────▼───────┐    ┌─────────▼─────────┐    ┌───────▼───────┐
│  Auth Service  │    │  User Service     │    │  Chat Service │
│   (Node.js)    │    │   (Node.js)       │    │   (Node.js)   │
└───────┬───────┘    └─────────┬─────────┘    └───────┬───────┘
        │                      │                      │
        │              ┌───────▼───────┐              │
        │              │ Media Service │              │
        │              │   (Node.js)   │              │
        │              └───────┬───────┘              │
        │                      │                      │
        │              ┌───────▼───────┐              │
        │              │ Admin Service │              │
        │              │   (Node.js)   │              │
        │              └───────┬───────┘              │
        │                      │                      │
        └──────────────────────┼──────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │    Message Queue    │
                    │      (Redis)        │
                    └──────────┬──────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                     │                     │
┌───────▼───────┐    ┌────────▼────────┐    ┌──────▼──────┐
│  PostgreSQL    │    │     Redis       │    │   File      │
│   (Primary)    │    │    (Cache)      │    │  Storage    │
└────────────────┘    └─────────────────┘    └─────────────┘
```

## 2. Frontend Architecture

### 2.1 Technology Stack
- **Framework**: React 18 + TypeScript
- **State Management**: Redux Toolkit + RTK Query
- **Routing**: React Router v6
- **UI Framework**: Tailwind CSS + Headless UI
- **PWA**: Workbox for service worker

### 2.2 Directory Structure
```
src/
├── components/          # Reusable components
│   ├── ui/             # Basic UI components
│   ├── forms/          # Form components
│   └── layout/         # Layout components
├── pages/              # Page components
├── hooks/              # Custom Hooks
├── store/              # Redux store
├── services/           # API services
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
└── assets/             # Static resources
```

### 2.3 Responsive Design
- **Breakpoints**: Mobile (320px), Tablet (768px), Desktop (1024px)
- **Design System**: Unified color, font, and spacing specifications
- **Dark Mode**: CSS variables for theme switching

## 3. Backend Microservices Architecture

### 3.1 Microservices Architecture Overview

#### 3.1.1 Architecture Principles
- **Service Independence**: Each microservice can be developed, deployed, and scaled independently
- **gRPC Communication**: Services use gRPC for efficient inter-service communication
- **API Gateway**: Unified external API entry point
- **Independent Repositories**: Each service uses independent Git repository management
- **Containerized Deployment**: All services support Docker containerization

#### 3.1.2 Microservices Architecture Diagram
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Client    │    │  Mobile Client  │    │   Admin Panel   │
│   (React PWA)   │    │ (React Native)  │    │ (Ant Design Pro)│
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │      Load Balancer      │
                    │        (Nginx)          │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │      API Gateway        │
                    │     (NestJS + gRPC)     │
                    │    + Swagger/OpenAPI    │
                    └────────────┬────────────┘
                                 │ gRPC
        ┌────────────────────────┼────────────────────────┐
        │                       │                       │
┌───────▼───────┐    ┌─────────▼─────────┐    ┌───────▼───────┐
│  Auth Service  │    │  User Service     │    │  Chat Service │
│   (NestJS)     │◄──►│   (NestJS)        │◄──►│   (NestJS)    │
│ + Swagger/API  │    │ + Swagger/API     │    │ + Swagger/API │
└───────┬───────┘    └─────────┬─────────┘    └───────┬───────┘
        │ gRPC                 │ gRPC                 │ gRPC
        │              ┌───────▼───────┐              │
        │              │ Media Service │              │
        │              │   (NestJS)    │              │
        │              │ + Swagger/API │              │
        │              └───────┬───────┘              │
        │                      │ gRPC                 │
        │              ┌───────▼───────┐              │
        │              │Search Service │              │
        │              │   (NestJS)    │              │
        │              │ + Swagger/API │              │
        │              └───────┬───────┘              │
        │                      │ gRPC                 │
        │              ┌───────▼───────┐              │
        │              │ Admin Service │              │
        │              │   (NestJS)    │              │
        │              │ + Swagger/API │              │
        │              └───────┬───────┘              │
        │                      │                      │
        └──────────────────────┼──────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │    Message Queue    │
                    │      (Redis)        │
                    └──────────┬──────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                     │                     │
┌───────▼───────┐    ┌────────▼────────┐    ┌──────▼──────┐
│  PostgreSQL    │    │     Redis       │    │   MinIO     │
│   (Primary)    │    │    (Cache)      │    │ (S3 Storage)│
└────────────────┘    └─────────────────┘    └─────────────┘
```

### 3.2 Detailed Microservices Design

#### 3.2.1 API Gateway Service
- **Git Repository**: `mking-friend-api-gateway`
- **Responsibilities**: 
  - Unified API entry point
  - Route forwarding to corresponding microservices
  - Authentication and authorization checks
  - Request/response transformation (REST ↔ gRPC)
  - API rate limiting and monitoring
- **Technology Stack**: Node.js + NestJS + TypeScript + gRPC Client
- **External API**: RESTful API + GraphQL
- **Internal Communication**: gRPC
- **API Documentation**: Swagger/OpenAPI 3.0
- **Ports**: 3000 (HTTP), 50000 (gRPC Health Check)

#### 3.2.2 Authentication Service (Auth Service)
- **Git Repository**: `mking-friend-auth-service`
- **Responsibilities**: 
  - User registration, login, logout
  - JWT Token management
  - OAuth 2.0 third-party login
  - Password reset and verification
  - Two-factor authentication (2FA)
- **Technology Stack**: Node.js + NestJS + TypeScript + Passport.js + gRPC
- **Database**: PostgreSQL (user authentication data)
- **gRPC Service**: AuthService
- **API Documentation**: Swagger/OpenAPI 3.0
- **Ports**: 3001 (HTTP), 50001 (gRPC)

#### 3.2.3 User Service
- **Git Repository**: `mking-friend-user-service`
- **Responsibilities**: 
  - User data management
  - Personal profile CRUD
  - User preference settings
  - Matching algorithms and recommendations
  - User relationship management (follow, block)
- **Technology Stack**: Node.js + NestJS + TypeScript + Prisma ORM + gRPC
- **Database**: PostgreSQL (user data)
- **gRPC Service**: UserService
- **API Documentation**: Swagger/OpenAPI 3.0
- **Ports**: 3002 (HTTP), 50002 (gRPC)

#### 3.2.4 Chat Service
- **Git Repository**: `mking-friend-chat-service`
- **Responsibilities**: 
  - Real-time message processing
  - Chat room management
  - WebSocket connection management
  - Message history records
  - Group chat functionality
- **Technology Stack**: Node.js + NestJS + TypeScript + Socket.io + WebRTC + gRPC
- **Database**: Redis (real-time data) + PostgreSQL (history records)
- **gRPC Service**: ChatService
- **API Documentation**: Swagger/OpenAPI 3.0
- **Ports**: 3003 (HTTP), 3004 (WebSocket), 50003 (gRPC)

#### 3.2.5 Media Service
- **Git Repository**: `mking-friend-media-service`
- **Responsibilities**: 
  - File upload and download
  - Image/video processing and compression
  - CDN management
  - Media file metadata management
  - Content moderation (AI-assisted)
- **Technology Stack**: Node.js + NestJS + TypeScript + Multer + Sharp + gRPC
- **Storage**: MinIO (S3-compatible) + Redis (cache)
- **gRPC Service**: MediaService
- **API Documentation**: Swagger/OpenAPI 3.0
- **Ports**: 3005 (HTTP), 50005 (gRPC)

#### 3.2.6 Search Service
- **Git Repository**: `mking-friend-search-service`
- **Responsibilities**: 
  - User search and filtering
  - Geographic location search
  - Interest tag search
  - Full-text search functionality
  - Search result sorting and recommendations
  - Search history records
  - Search analytics and statistics
- **Technology Stack**: Node.js + NestJS + TypeScript + Typesense + gRPC
- **Database**: Typesense (search index) + Redis (cache) + PostgreSQL (search history)
- **gRPC Service**: SearchService
- **API Documentation**: Swagger/OpenAPI 3.0
- **Ports**: 3007 (HTTP), 50007 (gRPC)
- **Horizontal Scaling**: Supports multi-instance deployment, Typesense cluster

#### 3.2.7 Admin Service
- **Git Repository**: `mking-friend-admin-service`
- **Responsibilities**: 
  - Admin authentication and authorization
  - User management and moderation
  - Content moderation and management
  - System statistics and reports
  - System configuration management
- **Technology Stack**: Node.js + NestJS + TypeScript + Prisma ORM + gRPC
- **Database**: PostgreSQL (admin data) + Redis (cache)
- **gRPC Service**: AdminService
- **API Documentation**: Swagger/OpenAPI 3.0
- **Ports**: 3006 (HTTP), 50006 (gRPC)

### 3.3 gRPC Service Definitions

#### 3.3.1 Authentication Service gRPC API
```protobuf
// auth.proto
syntax = "proto3";

package auth;

service AuthService {
  rpc Register(RegisterRequest) returns (AuthResponse);
  rpc Login(LoginRequest) returns (AuthResponse);
  rpc Logout(LogoutRequest) returns (LogoutResponse);
  rpc RefreshToken(RefreshTokenRequest) returns (AuthResponse);
  rpc ValidateToken(ValidateTokenRequest) returns (ValidateTokenResponse);
  rpc ResetPassword(ResetPasswordRequest) returns (ResetPasswordResponse);
}

message RegisterRequest {
  string email = 1;
  string password = 2;
  string display_name = 3;
}

message LoginRequest {
  string email = 1;
  string password = 2;
  string two_factor_code = 3;
}

message AuthResponse {
  bool success = 1;
  string access_token = 2;
  string refresh_token = 3;
  int64 expires_in = 4;
  string error_message = 5;
}
```

#### 3.3.2 User Service gRPC API
```protobuf
// user.proto
syntax = "proto3";

package user;

service UserService {
  rpc GetUser(GetUserRequest) returns (UserResponse);
  rpc UpdateUser(UpdateUserRequest) returns (UserResponse);
  rpc GetUserList(GetUserListRequest) returns (UserListResponse);
  rpc GetRecommendations(GetRecommendationsRequest) returns (UserListResponse);
  rpc FollowUser(FollowUserRequest) returns (FollowResponse);
  rpc UnfollowUser(UnfollowUserRequest) returns (FollowResponse);
}

message User {
  string id = 1;
  string email = 2;
  string display_name = 3;
  string bio = 4;
  int32 age = 5;
  string gender = 6;
  string location = 7;
  repeated string interests = 8;
  string avatar_url = 9;
  bool is_verified = 10;
}
```

#### 3.3.3 Chat Service gRPC API
```protobuf
// chat.proto
syntax = "proto3";

package chat;

service ChatService {
  rpc CreateChatRoom(CreateChatRoomRequest) returns (ChatRoomResponse);
  rpc GetChatRooms(GetChatRoomsRequest) returns (ChatRoomListResponse);
  rpc SendMessage(SendMessageRequest) returns (MessageResponse);
  rpc GetMessages(GetMessagesRequest) returns (MessageListResponse);
  rpc JoinRoom(JoinRoomRequest) returns (JoinRoomResponse);
  rpc LeaveRoom(LeaveRoomRequest) returns (LeaveRoomResponse);
}

message ChatRoom {
  string id = 1;
  string name = 2;
  string type = 3; // 'private', 'group'
  repeated string participant_ids = 4;
  int64 created_at = 5;
}

message Message {
  string id = 1;
  string room_id = 2;
  string sender_id = 3;
  string content = 4;
  string message_type = 5; // 'text', 'image', 'audio', 'video'
  string file_url = 6;
  int64 created_at = 7;
}
```

#### 3.3.4 Media Service gRPC API
```protobuf
// media.proto
syntax = "proto3";

package media;

service MediaService {
  rpc UploadFile(stream UploadFileRequest) returns (UploadFileResponse);
  rpc GetFile(GetFileRequest) returns (GetFileResponse);
  rpc DeleteFile(DeleteFileRequest) returns (DeleteFileResponse);
  rpc ProcessImage(ProcessImageRequest) returns (ProcessImageResponse);
  rpc GetMediaMetadata(GetMediaMetadataRequest) returns (MediaMetadataResponse);
}

message UploadFileRequest {
  oneof data {
    FileInfo file_info = 1;
    bytes chunk = 2;
  }
}

message FileInfo {
  string filename = 1;
  string content_type = 2;
  int64 file_size = 3;
  string user_id = 4;
}
```

#### 3.3.5 Search Service gRPC API
```protobuf
// search.proto
syntax = "proto3";

package search;

service SearchService {
  rpc SearchUsers(SearchUsersRequest) returns (SearchUsersResponse);
  rpc SearchByLocation(SearchByLocationRequest) returns (SearchUsersResponse);
  rpc SearchByInterests(SearchByInterestsRequest) returns (SearchUsersResponse);
  rpc GetSearchSuggestions(GetSearchSuggestionsRequest) returns (SearchSuggestionsResponse);
  rpc SaveSearchHistory(SaveSearchHistoryRequest) returns (SaveSearchHistoryResponse);
  rpc GetSearchHistory(GetSearchHistoryRequest) returns (SearchHistoryResponse);
  rpc IndexUser(IndexUserRequest) returns (IndexUserResponse);
  rpc RemoveUserFromIndex(RemoveUserFromIndexRequest) returns (RemoveUserFromIndexResponse);
}

message SearchUsersRequest {
  string query = 1;
  SearchFilters filters = 2;
  int32 page = 3;
  int32 limit = 4;
  string sort_by = 5; // 'relevance', 'distance', 'age', 'last_active'
  string user_id = 6; // Searcher ID for personalized results
}

message SearchFilters {
  int32 min_age = 1;
  int32 max_age = 2;
  string gender = 3;
  double max_distance_km = 4;
  repeated string interests = 5;
  bool verified_only = 6;
  bool online_only = 7;
}

message SearchUsersResponse {
  repeated SearchUserResult users = 1;
  int32 total_count = 2;
  int32 page = 3;
  int32 limit = 4;
  bool has_next_page = 5;
}

message SearchUserResult {
  string user_id = 1;
  string display_name = 2;
  int32 age = 3;
  string location = 4;
  repeated string interests = 5;
  string avatar_url = 6;
  double distance_km = 7;
  double relevance_score = 8;
  bool is_online = 9;
  bool is_verified = 10;
}

message SearchByLocationRequest {
  double latitude = 1;
  double longitude = 2;
  double radius_km = 3;
  SearchFilters filters = 4;
  int32 page = 5;
  int32 limit = 6;
  string user_id = 7;
}

message SearchByInterestsRequest {
  repeated string interests = 1;
  SearchFilters filters = 2;
  int32 page = 3;
  int32 limit = 4;
  string user_id = 5;
}
```

### 3.4 API Gateway Routing Design

#### 3.4.1 External RESTful API (via API Gateway)
```
# Authentication related
POST   /api/v1/auth/register       # User registration → Auth Service
POST   /api/v1/auth/login          # User login → Auth Service
POST   /api/v1/auth/logout         # User logout → Auth Service
POST   /api/v1/auth/refresh        # Refresh Token → Auth Service
POST   /api/v1/auth/reset-password # Reset password → Auth Service

# User related
GET    /api/v1/users              # Get user list → User Service
GET    /api/v1/users/:id          # Get specific user → User Service
PUT    /api/v1/users/:id          # Update user → User Service
GET    /api/v1/users/recommendations # Get recommended users → User Service
POST   /api/v1/users/:id/follow   # Follow user → User Service
DELETE /api/v1/users/:id/follow   # Unfollow user → User Service

# Chat related
GET    /api/v1/chats              # Get chat list → Chat Service
POST   /api/v1/chats              # Create chat → Chat Service
GET    /api/v1/chats/:id/messages # Get chat messages → Chat Service
POST   /api/v1/chats/:id/messages # Send message → Chat Service

# Media related
POST   /api/v1/media/upload       # Upload file → Media Service
GET    /api/v1/media/:id          # Get file → Media Service
DELETE /api/v1/media/:id          # Delete file → Media Service

# Search related
GET    /api/v1/search/users       # Search users → Search Service
GET    /api/v1/search/location    # Geographic location search → Search Service
GET    /api/v1/search/interests   # Interest tag search → Search Service
GET    /api/v1/search/suggestions # Search suggestions → Search Service
GET    /api/v1/search/history     # Search history → Search Service
POST   /api/v1/search/history     # Save search history → Search Service
DELETE /api/v1/search/history/:id # Delete search history → Search Service

# Admin related
GET    /api/v1/admin/users        # Manage users → Admin Service
GET    /api/v1/admin/stats        # System statistics → Admin Service
POST   /api/v1/admin/content/review # Content moderation → Admin Service
```

#### 3.4.2 WebSocket Events (Chat Service)
```javascript
// Client events
'join_room'         // Join chat room
'leave_room'        // Leave chat room
'send_message'      // Send message
'typing_start'      // Start typing
'typing_stop'       // Stop typing
'mark_as_read'      // Mark as read

// Server events
'message_received'  // Message received
'user_online'       // User online
'user_offline'      // User offline
'typing_indicator'  // Typing indicator
'message_read'      // Message read
'room_updated'      // Chat room updated
```

### 3.5 Inter-service Communication

#### 3.5.1 gRPC Communication Patterns
- **Synchronous Calls**: For operations requiring immediate response
- **Asynchronous Calls**: For non-critical path operations
- **Streaming Calls**: For large file transfers and real-time data
- **Bidirectional Streaming**: For real-time chat and push notifications

#### 3.5.2 Service Discovery
- **Consul**: Service registration and discovery
- **Health Checks**: gRPC health check protocol
- **Load Balancing**: Client-side load balancing
- **Circuit Breaker**: Prevent cascading failures

#### 3.5.3 Error Handling
- **gRPC Status Codes**: Standardized error responses
- **Retry Mechanism**: Exponential backoff retry
- **Timeout Control**: Request timeout settings
- **Degradation Strategy**: Graceful degradation when services are unavailable

## 4. Database Design

### 4.1 PostgreSQL Schema

#### 4.1.1 User Related Tables
```sql
-- User basic data
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    keycloak_id VARCHAR(255),
    discord_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User profiles
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(100) NOT NULL,
    bio TEXT,
    age INTEGER,
    gender VARCHAR(20),
    location VARCHAR(100),
    interests TEXT[], -- PostgreSQL array
    avatar_url VARCHAR(500),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User media files
CREATE TABLE media_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    file_type VARCHAR(20) NOT NULL, -- 'image', 'video', 'audio'
    file_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    file_size INTEGER,
    mime_type VARCHAR(100),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 4.1.2 Social Interaction Tables
```sql
-- Like records
CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    liker_id UUID REFERENCES users(id) ON DELETE CASCADE,
    liked_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(liker_id, liked_id)
);

-- Follow relationships
CREATE TABLE follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

-- Match records
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user2_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'matched', 'rejected'
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user1_id, user2_id)
);
```

#### 4.1.3 Chat Related Tables
```sql
-- Chat rooms
CREATE TABLE chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) DEFAULT 'private', -- 'private', 'group'
    name VARCHAR(100),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Chat room members
CREATE TABLE chat_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT NOW(),
    last_read_at TIMESTAMP,
    UNIQUE(room_id, user_id)
);

-- Message records
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT,
    message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'image', 'audio', 'video'
    file_url VARCHAR(500),
    reply_to UUID REFERENCES messages(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 4.2 Redis Data Structures
```
# User sessions
user:session:{user_id} -> {session_data}

# Online users
online:users -> Set of user_ids

# Chat room online users
room:{room_id}:online -> Set of user_ids

# Unread message count
user:{user_id}:unread -> Hash {room_id: count}

# Cached user data
user:profile:{user_id} -> {profile_json}

# Match recommendation cache
user:{user_id}:recommendations -> List of user_ids
```

## 5. Security Architecture

### 5.1 Authentication and Authorization
- **JWT Token**: Stateless authentication mechanism
- **Refresh Token**: Long-term valid refresh tokens
- **OAuth 2.0**: Third-party login integration
- **RBAC**: Role-based access control

### 5.2 Data Security
- **Encrypted Storage**: Sensitive data AES-256 encryption
- **Transmission Encryption**: TLS 1.3 site-wide encryption
- **Password Security**: bcrypt hash + salt
- **API Security**: Rate limiting + CORS configuration

### 5.3 Privacy Protection
- **Data Minimization**: Only collect necessary data
- **Anonymization**: Anonymize sensitive data processing
- **Access Control**: Fine-grained permission control
- **Audit Logs**: Complete operation records

## 6. Performance Optimization

### 6.1 Frontend Optimization
- **Code Splitting**: React.lazy + Suspense
- **Image Optimization**: WebP format + lazy loading
- **Caching Strategy**: Service Worker + HTTP caching
- **CDN**: Static resource CDN distribution

### 6.2 Backend Optimization
- **Database Indexing**: Query performance optimization
- **Connection Pooling**: Database connection pool management
- **Caching Layer**: Redis multi-layer caching
- **Load Balancing**: Horizontal scaling support

### 6.3 Monitoring and Alerting
- **APM**: Application performance monitoring
- **Metrics Monitoring**: Prometheus + Grafana metrics collection and visualization
- **Log Aggregation**: Grafana Loki + Promtail log collection and analysis
- **Error Tracking**: Sentry error monitoring and alerting
- **Health Checks**: Service health status monitoring
- **Alert System**: Grafana Alerting real-time notification for anomalies
- **Unified Monitoring**: Metrics, logs, and tracing unified in Grafana platform

## 7. Deployment Architecture

### 7.1 Containerization
```dockerfile
# Node.js service Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### 7.2 Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
    spec:
      containers:
      - name: user-service
        image: mking-friend/user-service:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
```

### 7.3 CI/CD Pipeline
```yaml
# GitHub Actions example
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
    - run: npm ci
    - run: npm test
    - run: npm run build
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - name: Deploy to Kubernetes
      run: kubectl apply -f k8s/
```

## 8. Scalability Considerations

### 8.1 Horizontal Scaling
- **Stateless Services**: All services designed to be stateless
- **Database Sharding**: Horizontal sharding of user data
- **Distributed Caching**: Redis Cluster deployment
- **CDN**: Global CDN node deployment

### 8.2 Vertical Scaling
- **Resource Monitoring**: CPU, memory usage monitoring
- **Auto Scaling**: Kubernetes HPA auto scaling
- **Performance Tuning**: Regular performance analysis and optimization

## 9. Disaster Recovery

### 9.1 Backup Strategy
- **Database Backup**: Daily full + real-time incremental backup
- **File Backup**: Media file off-site backup
- **Configuration Backup**: System configuration version control

### 9.2 Recovery Plan
- **RTO**: Recovery Time Objective < 4 hours
- **RPO**: Recovery Point Objective < 1 hour
- **Failover**: Automatic failover mechanism
- **Drill Plan**: Regular disaster recovery drills

## 10. Admin Management System Architecture

### 10.1 Admin Backend Overview
The admin management system is the core management tool for the MKing Friend platform, providing administrators with comprehensive platform monitoring, user management, content moderation, and system configuration capabilities.

### 10.2 Admin Backend Architecture Design

#### 10.2.1 Frontend Architecture
- **Technology Stack**: React 18+ + TypeScript + Ant Design Pro
- **State Management**: Zustand + React Query
- **Routing Management**: React Router v6
- **Build Tool**: Vite + pnpm
- **UI Framework**: Ant Design Pro (professional admin management solution)

#### 10.2.2 Backend Service (Admin Service)
- **Responsibilities**: Admin authentication, permission control, data statistics, system configuration
- **Technology**: Node.js + NestJS + TypeScript + Prisma ORM
- **Database**: PostgreSQL (admin data) + Redis (cache)
- **API Design**: RESTful API + GraphQL (complex queries)

### 10.3 Core Functional Modules

#### 10.3.1 Dashboard Module
```
┌─────────────────────────────────────────────────────────┐
│                    Admin Dashboard                      │
├─────────────────┬─────────────────┬─────────────────────┤
│   Real-time     │   User Activity │    System Health    │
│   Statistics    │ • Daily Active  │  • Service Status   │
│ • Online Users  │ • Monthly Active│  • Resource Usage   │
│ • New Signups   │ • User Retention│  • Error Rate Stats │
│ • Messages Sent │                 │                     │
└─────────────────┴─────────────────┴─────────────────────┘
```

#### 10.3.2 User Management Module
```
┌─────────────────────────────────────────────────────────┐
│                    User Management                      │
├─────────────────┬─────────────────┬─────────────────────┤
│   User List     │   User Details  │    User Actions     │
│ • Search Filter │ • Basic Info    │  • Ban/Unban        │
│ • Batch Ops     │ • Activity Log  │  • Permission Adjust│
│ • Export Data   │ • Report Records│  • Data Modification│
└─────────────────┴─────────────────┴─────────────────────┘
```

#### 10.3.3 Content Moderation Module
```
┌─────────────────────────────────────────────────────────┐
│                    Content Moderation                   │
├─────────────────┬─────────────────┬─────────────────────┤
│   Pending       │   Moderation    │    Moderation       │
│   Content       │   Tools         │    Records          │
│ • Text Content  │ • Batch Review  │  • Review History   │
│ • Image Content │ • Auto Flagging │  • Moderator Perf   │
│ • User Reports  │ • Review Rules  │  • Appeal Handling  │
└─────────────────┴─────────────────┴─────────────────────┘
```

### 10.4 Permission Control System

#### 10.4.1 Role Definition
```typescript
interface AdminRole {
  id: string;
  name: string;
  permissions: Permission[];
  level: 'super_admin' | 'admin' | 'moderator' | 'support';
}

interface Permission {
  resource: string;  // 'users', 'content', 'system', 'reports'
  actions: string[]; // 'read', 'write', 'delete', 'approve'
}
```

#### 10.4.2 Permission Matrix
| Role | User Management | Content Moderation | System Config | Data Analytics | Customer Service |
|------|-----------------|-------------------|---------------|----------------|------------------|
| Super Admin | ✅ All | ✅ All | ✅ All | ✅ All | ✅ All |
| Admin | ✅ View/Edit | ✅ All | ❌ Read Only | ✅ All | ✅ All |
| Moderator | ❌ Read Only | ✅ Review | ❌ None | ❌ Basic | ✅ Handle |
| Support | ❌ Basic | ❌ Reports | ❌ None | ❌ Basic | ✅ All |

### 10.5 API Design

#### 10.5.1 Admin API
```
# Admin authentication
POST   /api/admin/v1/auth/login
POST   /api/admin/v1/auth/logout
POST   /api/admin/v1/auth/refresh

# User management
GET    /api/admin/v1/users
GET    /api/admin/v1/users/:id
PUT    /api/admin/v1/users/:id/status
POST   /api/admin/v1/users/:id/ban
DELETE /api/admin/v1/users/:id/ban

# Content moderation
GET    /api/admin/v1/content/pending
POST   /api/admin/v1/content/:id/approve
POST   /api/admin/v1/content/:id/reject
GET    /api/admin/v1/reports
PUT    /api/admin/v1/reports/:id/status

# System statistics
GET    /api/admin/v1/stats/dashboard
GET    /api/admin/v1/stats/users
GET    /api/admin/v1/stats/content
GET    /api/admin/v1/stats/system
```

### 10.6 Security Design

#### 10.6.1 Authentication Mechanism
- **Two-Factor Authentication**: Admin login must enable 2FA
- **IP Whitelist**: Restrict admin backend access IPs
- **Session Management**: Short-term session timeout + forced re-authentication
- **Operation Logs**: Complete recording of all admin operations

#### 10.6.2 Data Security
- **Sensitive Data Masking**: User privacy data masked in admin backend
- **Operation Auditing**: All data modification operations recorded in audit logs
- **Least Privilege**: On-demand allocation of minimum permissions
- **Data Backup**: Automatic backup of critical data before admin operations

### 10.7 Monitoring and Alerting

#### 10.7.1 System Monitoring
- **Service Health Checks**: Real-time monitoring of microservice status
- **Performance Metrics**: API response time, error rate, throughput
- **Resource Monitoring**: CPU, memory, disk, network usage
- **Business Metrics**: User activity, content moderation efficiency

#### 10.7.2 Alert Mechanism
- **Real-time Alerts**: Immediate notification of system anomalies to admins
- **Alert Levels**: Emergency, Important, General three levels
- **Notification Channels**: Email, SMS, Slack, Enterprise WeChat
- **Alert Handling**: Alert confirmation, processing status tracking

### 10.8 Deployment Architecture

#### 10.8.1 Containerized Deployment
```yaml
# docker-compose.admin.yml
version: '3.8'
services:
  admin-frontend:
    image: mking-admin-frontend:latest
    ports:
      - "3001:80"
    environment:
      - REACT_APP_API_URL=https://admin-api.mking.com
      
  admin-service:
    image: mking-admin-service:latest
    ports:
      - "4001:4000"
    environment:
      - DATABASE_URL=postgresql://admin:password@postgres:5432/mking_admin
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
```

#### 10.8.2 Network Isolation
- **VPN Access**: Admin backend accessible only through VPN
- **Firewall Rules**: Strict inbound rule configuration
- **SSL/TLS**: Mandatory HTTPS encrypted transmission
- **Network Segmentation**: Admin network isolated from business network

### 10.9 Scalability Design

#### 10.9.1 Modular Architecture
- **Plugin System**: Support third-party plugin extensions
- **Micro-frontend**: Independent development and deployment of functional modules
- **API Versioning**: Backward-compatible API design
- **Configuration-driven**: Feature toggles controlled through configuration files

#### 10.9.2 Internationalization Support
- **Multi-language**: Support Chinese, English, and other languages
- **Timezone Handling**: Automatic handling of different timezone displays
- **Localization**: Date and number format localization
- **RTL Support**: Support right-to-left language display