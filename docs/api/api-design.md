# MKing Friend - API Design Documentation

## 1. API Design Principles

### 1.1 Design Philosophy
- **RESTful Design**: Follow REST architectural principles
- **Consistency**: Unified naming conventions and response formats
- **Version Control**: Support API version management
- **Security**: Complete authentication and authorization mechanisms
- **Performance**: Support pagination, caching, and compression
- **Documentation**: Complete API documentation and examples

### 1.2 Basic Specifications

#### 1.2.1 URL Design
```
# Base URL format
https://api.mkingfriend.com/v1/{resource}

# Examples
GET    /v1/users              # Get user list
GET    /v1/users/{id}         # Get specific user
POST   /v1/users              # Create new user
PUT    /v1/users/{id}         # Update user
DELETE /v1/users/{id}         # Delete user

# Nested resources
GET    /v1/users/{id}/photos  # Get user photos
POST   /v1/users/{id}/photos  # Upload user photos
```

#### 1.2.2 HTTP Methods
- **GET**: Retrieve resources
- **POST**: Create resources
- **PUT**: Complete resource update
- **PATCH**: Partial resource update
- **DELETE**: Delete resources

#### 1.2.3 Status Codes
- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **204 No Content**: Request successful but no content returned
- **400 Bad Request**: Invalid request parameters
- **401 Unauthorized**: Not authenticated
- **403 Forbidden**: No permission
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource conflict
- **422 Unprocessable Entity**: Validation failed
- **429 Too Many Requests**: Too many requests
- **500 Internal Server Error**: Server error

#### 1.2.4 Response Format
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation successful",
  "timestamp": "2024-01-01T00:00:00Z",
  "requestId": "req_123456789"
}
```

#### 1.2.5 Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "timestamp": "2024-01-01T00:00:00Z",
  "requestId": "req_123456789"
}
```

## 2. Authentication & Authorization

### 2.1 JWT Token Authentication
```http
Authorization: Bearer <jwt_token>
```

### 2.2 OAuth 2.0 Integration
- Support Google, Facebook, Apple login
- Standard OAuth 2.0 flow implementation
- Refresh token mechanism

### 2.3 API Key Authentication
```http
X-API-Key: <api_key>
```

## 3. Core API Endpoints

### 3.1 User Management

#### 3.1.1 User Registration
```http
POST /v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "nickname": "UserNickname",
  "birthDate": "1990-01-01",
  "gender": "male"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "nickname": "UserNickname",
      "status": "pending_verification"
    },
    "token": "jwt_token_here"
  }
}
```

#### 3.1.2 User Login
```http
POST /v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

#### 3.1.3 Get User Profile
```http
GET /v1/users/{userId}
Authorization: Bearer <jwt_token>
```

#### 3.1.4 Update User Profile
```http
PUT /v1/users/{userId}
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "nickname": "NewNickname",
  "bio": "Updated bio",
  "interests": ["music", "travel", "photography"]
}
```

### 3.2 Photo Management

#### 3.2.1 Upload Photo
```http
POST /v1/users/{userId}/photos
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data

file: <image_file>
order: 1
isMain: true
```

#### 3.2.2 Get User Photos
```http
GET /v1/users/{userId}/photos
Authorization: Bearer <jwt_token>
```

### 3.3 Matching System

#### 3.3.1 Get Recommendations
```http
GET /v1/matches/recommendations
Authorization: Bearer <jwt_token>

Query Parameters:
- limit: number (default: 10, max: 50)
- offset: number (default: 0)
- ageMin: number
- ageMax: number
- distance: number (km)
- interests: string[] (comma-separated)
```

#### 3.3.2 Like/Pass Action
```http
POST /v1/matches/actions
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "targetUserId": "user_456",
  "action": "like", // "like" or "pass"
  "message": "Hi there!" // optional for likes
}
```

#### 3.3.3 Get Matches
```http
GET /v1/matches
Authorization: Bearer <jwt_token>

Query Parameters:
- status: string ("pending", "matched", "expired")
- limit: number
- offset: number
```

### 3.4 Chat System

#### 3.4.1 Get Conversations
```http
GET /v1/conversations
Authorization: Bearer <jwt_token>

Query Parameters:
- limit: number (default: 20)
- offset: number (default: 0)
- status: string ("active", "archived")
```

#### 3.4.2 Get Messages
```http
GET /v1/conversations/{conversationId}/messages
Authorization: Bearer <jwt_token>

Query Parameters:
- limit: number (default: 50)
- before: string (message_id for pagination)
- after: string (message_id for pagination)
```

#### 3.4.3 Send Message
```http
POST /v1/conversations/{conversationId}/messages
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "content": "Hello! How are you?",
  "type": "text", // "text", "image", "emoji"
  "metadata": {
    // Additional message metadata
  }
}
```

### 3.5 Geolocation Services

#### 3.5.1 Update Location
```http
PUT /v1/users/{userId}/location
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "latitude": 25.0330,
  "longitude": 121.5654,
  "accuracy": 10,
  "timestamp": "2024-01-01T12:00:00Z"
}
```

#### 3.5.2 Search Nearby Users
```http
GET /v1/users/nearby
Authorization: Bearer <jwt_token>

Query Parameters:
- radius: number (km, default: 50)
- limit: number (default: 20)
- ageMin: number
- ageMax: number
```

## 4. WebSocket API

### 4.1 Real-time Chat
```javascript
// Connection
const socket = new WebSocket('wss://api.mkingfriend.com/v1/ws');

// Authentication
socket.send(JSON.stringify({
  type: 'auth',
  token: 'jwt_token_here'
}));

// Join conversation
socket.send(JSON.stringify({
  type: 'join_conversation',
  conversationId: 'conv_123'
}));

// Send message
socket.send(JSON.stringify({
  type: 'message',
  conversationId: 'conv_123',
  content: 'Hello!',
  messageType: 'text'
}));
```

### 4.2 Real-time Notifications
```javascript
// Listen for notifications
socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch(data.type) {
    case 'new_message':
      // Handle new message
      break;
    case 'new_match':
      // Handle new match
      break;
    case 'user_online':
      // Handle user online status
      break;
  }
};
```

## 5. Rate Limiting

### 5.1 Rate Limit Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
X-RateLimit-Window: 3600
```

### 5.2 Rate Limit Rules
- **General API**: 1000 requests per hour per user
- **Authentication**: 10 requests per minute per IP
- **Photo Upload**: 20 uploads per hour per user
- **Messaging**: 100 messages per hour per user

## 6. Pagination

### 6.1 Cursor-based Pagination
```http
GET /v1/users?limit=20&cursor=eyJpZCI6IjEyMyJ9
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "hasNext": true,
      "nextCursor": "eyJpZCI6IjE0MyJ9",
      "limit": 20,
      "total": 1500
    }
  }
}
```

### 6.2 Offset-based Pagination
```http
GET /v1/users?limit=20&offset=40
```

## 7. File Upload

### 7.1 Direct Upload
```http
POST /v1/upload
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data

file: <file>
type: "profile_photo"
resize: "800x600"
```

### 7.2 Presigned URL Upload
```http
POST /v1/upload/presigned
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "filename": "photo.jpg",
  "contentType": "image/jpeg",
  "size": 1024000
}
```

## 8. Error Handling

### 8.1 Validation Errors
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "code": "INVALID_FORMAT",
        "message": "Invalid email format"
      },
      {
        "field": "age",
        "code": "OUT_OF_RANGE",
        "message": "Age must be between 18 and 100"
      }
    ]
  }
}
```

### 8.2 Business Logic Errors
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "Not enough credits to perform this action",
    "details": {
      "required": 10,
      "available": 5
    }
  }
}
```

## 9. API Versioning

### 9.1 URL Versioning
```
GET /v1/users/{id}  # Version 1
GET /v2/users/{id}  # Version 2
```

### 9.2 Header Versioning
```http
GET /users/{id}
API-Version: v1
```

### 9.3 Deprecation Notice
```http
HTTP/1.1 200 OK
Deprecation: true
Sunset: Wed, 11 Nov 2024 23:59:59 GMT
Link: </v2/users/{id}>; rel="successor-version"
```

## 10. Security Considerations

### 10.1 Input Validation
- Validate all input parameters
- Sanitize user-generated content
- Implement proper data type checking

### 10.2 Authentication Security
- Use secure JWT implementation
- Implement token refresh mechanism
- Support token revocation

### 10.3 Data Protection
- Encrypt sensitive data
- Implement proper access controls
- Log security events

### 10.4 CORS Configuration
```http
Access-Control-Allow-Origin: https://mkingfriend.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type, X-API-Key
Access-Control-Max-Age: 86400
```

## 11. Monitoring & Analytics

### 11.1 Health Check
```http
GET /v1/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00Z",
  "version": "1.0.0",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "storage": "healthy"
  }
}
```

### 11.2 Metrics Endpoint
```http
GET /v1/metrics
Authorization: Bearer <admin_token>
```

## 12. Testing

### 12.1 API Testing Tools
- Postman collections
- OpenAPI/Swagger documentation
- Automated integration tests

### 12.2 Test Environment
```
Base URL: https://api-staging.mkingfriend.com/v1
Test Credentials: Available in development documentation
```

---

**Document Version**: v1.0  
**Last Updated**: 2025-01-02  
**Maintainer**: API Development Team

**Note**: This document should be updated whenever API changes are made. Both English and Chinese versions must be maintained simultaneously.