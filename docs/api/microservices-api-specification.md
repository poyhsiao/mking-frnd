# MKing Friend Microservices API Specification

## 1. Overview

This document details the API specifications for each service in the MKing Friend microservices architecture, including RESTful APIs and gRPC service definitions.

### 1.1 API Architecture

- **External APIs**: Unified RESTful APIs provided through API Gateway
- **Internal Communication**: gRPC communication between microservices
- **Real-time Communication**: WebSocket for chat and instant notifications
- **Documentation**: Each service provides Swagger/OpenAPI documentation

### 1.2 Service Port Allocation

| Service | HTTP Port | gRPC Port | WebSocket Port |
|---------|-----------|-----------|----------------|
| API Gateway | 3000 | 50000 | - |
| Auth Service | 3001 | 50001 | - |
| User Service | 3002 | 50002 | - |
| Chat Service | 3003 | 50003 | 3004 |
| Media Service | 3005 | 50005 | - |
| Search Service | 3006 | 50006 | - |
| Admin Service | 3007 | 50007 | - |

## 2. API Gateway

### 2.1 Route Configuration

The API Gateway is responsible for routing external RESTful API requests to the appropriate microservices.

```typescript
// API Gateway Route Configuration
const routes = {
  // Authentication related
  'POST /api/auth/register': 'auth-service:50001/AuthService/Register',
  'POST /api/auth/login': 'auth-service:50001/AuthService/Login',
  'POST /api/auth/logout': 'auth-service:50001/AuthService/Logout',
  'POST /api/auth/refresh': 'auth-service:50001/AuthService/RefreshToken',
  'POST /api/auth/verify-email': 'auth-service:50001/AuthService/VerifyEmail',
  'POST /api/auth/forgot-password': 'auth-service:50001/AuthService/ForgotPassword',
  'POST /api/auth/reset-password': 'auth-service:50001/AuthService/ResetPassword',

  // User related
  'GET /api/users/profile': 'user-service:50002/UserService/GetProfile',
  'PUT /api/users/profile': 'user-service:50002/UserService/UpdateProfile',
  'GET /api/users/search': 'user-service:50002/UserService/SearchUsers',
  'GET /api/users/:id': 'user-service:50002/UserService/GetUser',
  'POST /api/users/like': 'user-service:50002/UserService/LikeUser',
  'POST /api/users/unlike': 'user-service:50002/UserService/UnlikeUser',
  'GET /api/users/matches': 'user-service:50002/UserService/GetMatches',
  'GET /api/users/liked-by': 'user-service:50002/UserService/GetLikedBy',

  // Chat related
  'GET /api/chats': 'chat-service:50003/ChatService/GetChats',
  'POST /api/chats': 'chat-service:50003/ChatService/CreateChat',
  'GET /api/chats/:id': 'chat-service:50003/ChatService/GetChat',
  'GET /api/chats/:id/messages': 'chat-service:50003/ChatService/GetMessages',
  'POST /api/chats/:id/messages': 'chat-service:50003/ChatService/SendMessage',
  'PUT /api/chats/:id/read': 'chat-service:50003/ChatService/MarkAsRead',

  // Media related
  'POST /api/media/upload': 'media-service:50005/MediaService/UploadFile',
  'GET /api/media/:id': 'media-service:50005/MediaService/GetFile',
  'DELETE /api/media/:id': 'media-service:50005/MediaService/DeleteFile',
  'POST /api/media/avatar': 'media-service:50005/MediaService/UploadAvatar',
  'POST /api/media/photos': 'media-service:50005/MediaService/UploadPhoto',

  // Search related
  'GET /api/search/users': 'search-service:50006/SearchService/SearchUsers',
  'GET /api/search/location': 'search-service:50006/SearchService/SearchByLocation',
  'GET /api/search/interests': 'search-service:50006/SearchService/SearchByInterests',
  'GET /api/search/suggestions': 'search-service:50006/SearchService/GetSuggestions',
  'GET /api/search/history': 'search-service:50006/SearchService/GetSearchHistory',
  'POST /api/search/history': 'search-service:50006/SearchService/SaveSearchHistory',
  'DELETE /api/search/history/:id': 'search-service:50006/SearchService/DeleteSearchHistory',

  // Admin related (requires admin permissions)
  'GET /api/admin/users': 'admin-service:50007/AdminService/GetUsers',
  'PUT /api/admin/users/:id/status': 'admin-service:50007/AdminService/UpdateUserStatus',
  'GET /api/admin/reports': 'admin-service:50007/AdminService/GetReports',
  'PUT /api/admin/reports/:id': 'admin-service:50007/AdminService/HandleReport',
  'GET /api/admin/analytics': 'admin-service:50007/AdminService/GetAnalytics'
};
```

### 2.2 Middleware

```typescript
// Authentication Middleware
export class AuthMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token required' });
    }

    try {
      // Verify token through gRPC
      const authClient = new AuthServiceClient('auth-service:50001');
      const result = await authClient.verifyToken({ token });
      
      if (!result.valid) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      
      req.user = result.user;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Authentication failed' });
    }
  }
}

// Rate Limiting Middleware
export class RateLimitMiddleware {
  private redis: Redis;
  
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }
  
  async use(req: Request, res: Response, next: NextFunction) {
    const key = `rate_limit:${req.ip}:${req.path}`;
    const limit = this.getLimit(req.path);
    const window = 3600; // 1 hour
    
    const current = await this.redis.incr(key);
    
    if (current === 1) {
      await this.redis.expire(key, window);
    }
    
    if (current > limit) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        limit,
        reset: await this.redis.ttl(key)
      });
    }
    
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - current));
    res.setHeader('X-RateLimit-Reset', await this.redis.ttl(key));
    
    next();
  }
  
  private getLimit(path: string): number {
    if (path.includes('/auth/')) return 10;
    if (path.includes('/media/upload')) return 20;
    if (path.includes('/chats/')) return 100;
    return 1000;
  }
}
```

## 3. Authentication Service

### 3.1 gRPC Service Definition

```protobuf
syntax = "proto3";

package auth;

service AuthService {
  rpc Register(RegisterRequest) returns (RegisterResponse);
  rpc Login(LoginRequest) returns (LoginResponse);
  rpc Logout(LogoutRequest) returns (LogoutResponse);
  rpc RefreshToken(RefreshTokenRequest) returns (RefreshTokenResponse);
  rpc VerifyToken(VerifyTokenRequest) returns (VerifyTokenResponse);
  rpc VerifyEmail(VerifyEmailRequest) returns (VerifyEmailResponse);
  rpc ForgotPassword(ForgotPasswordRequest) returns (ForgotPasswordResponse);
  rpc ResetPassword(ResetPasswordRequest) returns (ResetPasswordResponse);
  rpc ChangePassword(ChangePasswordRequest) returns (ChangePasswordResponse);
  rpc GetUserSessions(GetUserSessionsRequest) returns (GetUserSessionsResponse);
  rpc RevokeSession(RevokeSessionRequest) returns (RevokeSessionResponse);
}

message RegisterRequest {
  string email = 1;
  string password = 2;
  string nickname = 3;
  string birth_date = 4;
  string gender = 5;
  repeated string interests = 6;
}

message RegisterResponse {
  bool success = 1;
  string message = 2;
  User user = 3;
  string access_token = 4;
  string refresh_token = 5;
}

message LoginRequest {
  string email = 1;
  string password = 2;
  string device_id = 3;
  string device_type = 4;
}

message LoginResponse {
  bool success = 1;
  string message = 2;
  User user = 3;
  string access_token = 4;
  string refresh_token = 5;
  int64 expires_at = 6;
}

message User {
  string id = 1;
  string email = 2;
  string nickname = 3;
  string avatar_url = 4;
  string status = 5;
  bool email_verified = 6;
  int64 created_at = 7;
  int64 updated_at = 8;
}

message VerifyTokenRequest {
  string token = 1;
}

message VerifyTokenResponse {
  bool valid = 1;
  User user = 2;
  repeated string permissions = 3;
}
```

### 3.2 RESTful API Endpoints

#### 3.2.1 User Registration
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "nickname": "UserNickname",
  "birthDate": "1990-01-01",
  "gender": "male",
  "interests": ["music", "travel", "photography"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "nickname": "UserNickname",
      "status": "pending_verification"
    },
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

---

**Document Version**: v1.0  
**Last Updated**: 2025-01-02  
**Maintainer**: Backend Development Team

**Note**: This document should be updated whenever API changes are made. Both English and Chinese versions must be maintained simultaneously.