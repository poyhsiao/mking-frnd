# MKing Friend 微服務 API 規範

## 1. 概述

本文檔詳細說明 MKing Friend 微服務架構中各個服務的 API 規範，包括 RESTful API 和 gRPC 服務定義。

### 1.1 API 架構

- **對外 API**: 通過 API Gateway 提供統一的 RESTful API
- **內部通訊**: 微服務間使用 gRPC 進行通訊
- **實時通訊**: WebSocket 用於聊天和即時通知
- **文檔**: 每個服務提供 Swagger/OpenAPI 文檔

### 1.2 服務端口分配

| 服務 | HTTP 端口 | gRPC 端口 | WebSocket 端口 |
|------|-----------|-----------|----------------|
| API Gateway | 3000 | 50000 | - |
| 認證服務 | 3001 | 50001 | - |
| 用戶服務 | 3002 | 50002 | - |
| 聊天服務 | 3003 | 50003 | 3004 |
| 媒體服務 | 3005 | 50005 | - |
| 搜尋服務 | 3006 | 50006 | - |
| 管理服務 | 3007 | 50007 | - |

## 2. API Gateway

### 2.1 路由配置

API Gateway 負責將外部 RESTful API 請求路由到相應的微服務。

```typescript
// API Gateway 路由配置
const routes = {
  // 認證相關
  'POST /api/auth/register': 'auth-service:50001/AuthService/Register',
  'POST /api/auth/login': 'auth-service:50001/AuthService/Login',
  'POST /api/auth/logout': 'auth-service:50001/AuthService/Logout',
  'POST /api/auth/refresh': 'auth-service:50001/AuthService/RefreshToken',
  'POST /api/auth/verify-email': 'auth-service:50001/AuthService/VerifyEmail',
  'POST /api/auth/forgot-password': 'auth-service:50001/AuthService/ForgotPassword',
  'POST /api/auth/reset-password': 'auth-service:50001/AuthService/ResetPassword',

  // 用戶相關
  'GET /api/users/profile': 'user-service:50002/UserService/GetProfile',
  'PUT /api/users/profile': 'user-service:50002/UserService/UpdateProfile',
  'GET /api/users/search': 'user-service:50002/UserService/SearchUsers',
  'GET /api/users/:id': 'user-service:50002/UserService/GetUser',
  'POST /api/users/like': 'user-service:50002/UserService/LikeUser',
  'POST /api/users/unlike': 'user-service:50002/UserService/UnlikeUser',
  'GET /api/users/matches': 'user-service:50002/UserService/GetMatches',
  'GET /api/users/liked-by': 'user-service:50002/UserService/GetLikedBy',

  // 聊天相關
  'GET /api/chats': 'chat-service:50003/ChatService/GetChats',
  'POST /api/chats': 'chat-service:50003/ChatService/CreateChat',
  'GET /api/chats/:id': 'chat-service:50003/ChatService/GetChat',
  'GET /api/chats/:id/messages': 'chat-service:50003/ChatService/GetMessages',
  'POST /api/chats/:id/messages': 'chat-service:50003/ChatService/SendMessage',
  'PUT /api/chats/:id/read': 'chat-service:50003/ChatService/MarkAsRead',

  // 媒體相關
  'POST /api/media/upload': 'media-service:50005/MediaService/UploadFile',
  'GET /api/media/:id': 'media-service:50005/MediaService/GetFile',
  'DELETE /api/media/:id': 'media-service:50005/MediaService/DeleteFile',
  'POST /api/media/avatar': 'media-service:50005/MediaService/UploadAvatar',
  'POST /api/media/photos': 'media-service:50005/MediaService/UploadPhoto',

  // 搜尋相關
  'GET /api/search/users': 'search-service:50006/SearchService/SearchUsers',
  'GET /api/search/location': 'search-service:50006/SearchService/SearchByLocation',
  'GET /api/search/interests': 'search-service:50006/SearchService/SearchByInterests',
  'GET /api/search/suggestions': 'search-service:50006/SearchService/GetSuggestions',
  'GET /api/search/history': 'search-service:50006/SearchService/GetSearchHistory',
  'POST /api/search/history': 'search-service:50006/SearchService/SaveSearchHistory',
  'DELETE /api/search/history/:id': 'search-service:50006/SearchService/DeleteSearchHistory',

  // 管理相關 (需要管理員權限)
  'GET /api/admin/users': 'admin-service:50007/AdminService/GetUsers',
  'PUT /api/admin/users/:id/status': 'admin-service:50007/AdminService/UpdateUserStatus',
  'GET /api/admin/reports': 'admin-service:50007/AdminService/GetReports',
  'PUT /api/admin/reports/:id': 'admin-service:50007/AdminService/HandleReport',
  'GET /api/admin/analytics': 'admin-service:50007/AdminService/GetAnalytics'
};
```

### 2.2 中間件

```typescript
// 認證中間件
export class AuthMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token required' });
    }

    try {
      // 通過 gRPC 驗證 token
      const authResult = await this.authService.validateToken({ token });
      req.user = authResult.user;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  }
}

// 速率限制中間件
export class RateLimitMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const key = `rate_limit:${req.ip}`;
    const current = await this.redis.incr(key);
    
    if (current === 1) {
      await this.redis.expire(key, 60); // 1 分鐘窗口
    }
    
    if (current > 100) { // 每分鐘最多 100 請求
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }
    
    next();
  }
}
```

### 2.3 Swagger 配置

```typescript
// API Gateway Swagger 配置
const swaggerConfig = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MKing Friend API',
      version: '1.0.0',
      description: 'MKing Friend 交友平台 API 文檔'
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: '開發環境'
      },
      {
        url: 'https://api.mking-friend.com',
        description: '生產環境'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts']
};
```

## 3. 認證服務 (Auth Service)

### 3.1 gRPC 服務定義

```protobuf
// proto/auth.proto
syntax = "proto3";

package auth;

service AuthService {
  rpc Register(RegisterRequest) returns (RegisterResponse);
  rpc Login(LoginRequest) returns (LoginResponse);
  rpc Logout(LogoutRequest) returns (LogoutResponse);
  rpc RefreshToken(RefreshTokenRequest) returns (RefreshTokenResponse);
  rpc ValidateToken(ValidateTokenRequest) returns (ValidateTokenResponse);
  rpc VerifyEmail(VerifyEmailRequest) returns (VerifyEmailResponse);
  rpc ForgotPassword(ForgotPasswordRequest) returns (ForgotPasswordResponse);
  rpc ResetPassword(ResetPasswordRequest) returns (ResetPasswordResponse);
  rpc ChangePassword(ChangePasswordRequest) returns (ChangePasswordResponse);
}

message RegisterRequest {
  string email = 1;
  string password = 2;
  string name = 3;
  int32 age = 4;
  string gender = 5;
}

message RegisterResponse {
  bool success = 1;
  string message = 2;
  string user_id = 3;
  string verification_token = 4;
}

message LoginRequest {
  string email = 1;
  string password = 2;
}

message LoginResponse {
  bool success = 1;
  string message = 2;
  string access_token = 3;
  string refresh_token = 4;
  User user = 5;
  int64 expires_at = 6;
}

message LogoutRequest {
  string token = 1;
}

message LogoutResponse {
  bool success = 1;
  string message = 2;
}

message RefreshTokenRequest {
  string refresh_token = 1;
}

message RefreshTokenResponse {
  bool success = 1;
  string access_token = 2;
  string refresh_token = 3;
  int64 expires_at = 4;
}

message ValidateTokenRequest {
  string token = 1;
}

message ValidateTokenResponse {
  bool valid = 1;
  User user = 2;
  repeated string permissions = 3;
}

message VerifyEmailRequest {
  string token = 1;
}

message VerifyEmailResponse {
  bool success = 1;
  string message = 2;
}

message ForgotPasswordRequest {
  string email = 1;
}

message ForgotPasswordResponse {
  bool success = 1;
  string message = 2;
}

message ResetPasswordRequest {
  string token = 1;
  string new_password = 2;
}

message ResetPasswordResponse {
  bool success = 1;
  string message = 2;
}

message ChangePasswordRequest {
  string user_id = 1;
  string current_password = 2;
  string new_password = 3;
}

message ChangePasswordResponse {
  bool success = 1;
  string message = 2;
}

message User {
  string id = 1;
  string email = 2;
  string name = 3;
  int32 age = 4;
  string gender = 5;
  bool email_verified = 6;
  string status = 7;
  int64 created_at = 8;
  int64 updated_at = 9;
}
```

### 3.2 RESTful API 端點

```typescript
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: 用戶註冊
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *               - age
 *               - gender
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: password123
 *               name:
 *                 type: string
 *                 example: 張三
 *               age:
 *                 type: integer
 *                 minimum: 18
 *                 maximum: 100
 *                 example: 25
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *                 example: male
 *     responses:
 *       201:
 *         description: 註冊成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 註冊成功，請檢查郵箱進行驗證
 *                 userId:
 *                   type: string
 *                   example: 123e4567-e89b-12d3-a456-426614174000
 *       400:
 *         description: 請求參數錯誤
 *       409:
 *         description: 郵箱已存在
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: 用戶登入
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: 登入成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 accessToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 refreshToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 expiresAt:
 *                   type: integer
 *                   example: 1640995200
 *       401:
 *         description: 認證失敗
 *       403:
 *         description: 帳號未驗證或被停用
 */
```

## 4. 用戶服務 (User Service)

### 4.1 gRPC 服務定義

```protobuf
// proto/user.proto
syntax = "proto3";

package user;

service UserService {
  rpc GetProfile(GetProfileRequest) returns (GetProfileResponse);
  rpc UpdateProfile(UpdateProfileRequest) returns (UpdateProfileResponse);
  rpc GetUser(GetUserRequest) returns (GetUserResponse);
  rpc SearchUsers(SearchUsersRequest) returns (SearchUsersResponse);
  rpc LikeUser(LikeUserRequest) returns (LikeUserResponse);
  rpc UnlikeUser(UnlikeUserRequest) returns (UnlikeUserResponse);
  rpc GetMatches(GetMatchesRequest) returns (GetMatchesResponse);
  rpc GetLikedBy(GetLikedByRequest) returns (GetLikedByResponse);
  rpc BlockUser(BlockUserRequest) returns (BlockUserResponse);
  rpc UnblockUser(UnblockUserRequest) returns (UnblockUserResponse);
  rpc ReportUser(ReportUserRequest) returns (ReportUserResponse);
}

message GetProfileRequest {
  string user_id = 1;
}

message GetProfileResponse {
  UserProfile profile = 1;
}

message UpdateProfileRequest {
  string user_id = 1;
  UserProfile profile = 2;
}

message UpdateProfileResponse {
  bool success = 1;
  string message = 2;
  UserProfile profile = 3;
}

message GetUserRequest {
  string user_id = 1;
  string target_user_id = 2;
}

message GetUserResponse {
  UserProfile profile = 1;
  bool is_liked = 2;
  bool is_matched = 3;
  bool is_blocked = 4;
}

message SearchUsersRequest {
  string user_id = 1;
  SearchFilters filters = 2;
  int32 page = 3;
  int32 limit = 4;
}

message SearchUsersResponse {
  repeated UserProfile users = 1;
  int32 total = 2;
  int32 page = 3;
  int32 limit = 4;
  bool has_more = 5;
}

message LikeUserRequest {
  string user_id = 1;
  string target_user_id = 2;
}

message LikeUserResponse {
  bool success = 1;
  bool is_match = 2;
  string message = 3;
}

message UnlikeUserRequest {
  string user_id = 1;
  string target_user_id = 2;
}

message UnlikeUserResponse {
  bool success = 1;
  string message = 2;
}

message GetMatchesRequest {
  string user_id = 1;
  int32 page = 2;
  int32 limit = 3;
}

message GetMatchesResponse {
  repeated Match matches = 1;
  int32 total = 2;
  int32 page = 3;
  int32 limit = 4;
}

message GetLikedByRequest {
  string user_id = 1;
  int32 page = 2;
  int32 limit = 3;
}

message GetLikedByResponse {
  repeated UserProfile users = 1;
  int32 total = 2;
  int32 page = 3;
  int32 limit = 4;
}

message BlockUserRequest {
  string user_id = 1;
  string target_user_id = 2;
  string reason = 3;
}

message BlockUserResponse {
  bool success = 1;
  string message = 2;
}

message UnblockUserRequest {
  string user_id = 1;
  string target_user_id = 2;
}

message UnblockUserResponse {
  bool success = 1;
  string message = 2;
}

message ReportUserRequest {
  string user_id = 1;
  string target_user_id = 2;
  string reason = 3;
  string description = 4;
}

message ReportUserResponse {
  bool success = 1;
  string message = 2;
  string report_id = 3;
}

message UserProfile {
  string id = 1;
  string name = 2;
  int32 age = 3;
  string gender = 4;
  string bio = 5;
  repeated string interests = 6;
  string location = 7;
  string avatar_url = 8;
  repeated string photo_urls = 9;
  string occupation = 10;
  string education = 11;
  int32 height = 12;
  string relationship_type = 13;
  bool is_verified = 14;
  int64 last_active = 15;
  int64 created_at = 16;
  int64 updated_at = 17;
}

message SearchFilters {
  int32 min_age = 1;
  int32 max_age = 2;
  string gender = 3;
  string location = 4;
  int32 max_distance = 5;
  repeated string interests = 6;
  string relationship_type = 7;
  bool verified_only = 8;
}

message Match {
  string id = 1;
  UserProfile user = 2;
  int64 matched_at = 3;
  bool has_unread_messages = 4;
  string last_message = 5;
  int64 last_message_at = 6;
}
```

### 4.2 RESTful API 端點

```typescript
/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: 獲取用戶個人資料
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功獲取個人資料
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: 未授權
 *   put:
 *     summary: 更新用戶個人資料
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *     responses:
 *       200:
 *         description: 更新成功
 *       400:
 *         description: 請求參數錯誤
 *       401:
 *         description: 未授權
 */

/**
 * @swagger
 * /api/users/search:
 *   get:
 *     summary: 搜索用戶
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: minAge
 *         schema:
 *           type: integer
 *           minimum: 18
 *         description: 最小年齡
 *       - in: query
 *         name: maxAge
 *         schema:
 *           type: integer
 *           maximum: 100
 *         description: 最大年齡
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *           enum: [male, female, other]
 *         description: 性別
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: 地點
 *       - in: query
 *         name: maxDistance
 *         schema:
 *           type: integer
 *         description: 最大距離 (公里)
 *       - in: query
 *         name: interests
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: 興趣愛好
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 頁碼
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: 每頁數量
 *     responses:
 *       200:
 *         description: 搜索成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserProfile'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 hasMore:
 *                   type: boolean
 */

/**
 * @swagger
 * /api/users/like:
 *   post:
 *     summary: 按讚用戶
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetUserId
 *             properties:
 *               targetUserId:
 *                 type: string
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       200:
 *         description: 按讚成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 isMatch:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: 請求參數錯誤
 *       401:
 *         description: 未授權
 *       404:
 *         description: 用戶不存在
 */
```

## 5. 聊天服務 (Chat Service)

### 5.1 gRPC 服務定義

```protobuf
// proto/chat.proto
syntax = "proto3";

package chat;

service ChatService {
  rpc GetChats(GetChatsRequest) returns (GetChatsResponse);
  rpc CreateChat(CreateChatRequest) returns (CreateChatResponse);
  rpc GetChat(GetChatRequest) returns (GetChatResponse);
  rpc GetMessages(GetMessagesRequest) returns (GetMessagesResponse);
  rpc SendMessage(SendMessageRequest) returns (SendMessageResponse);
  rpc MarkAsRead(MarkAsReadRequest) returns (MarkAsReadResponse);
  rpc DeleteMessage(DeleteMessageRequest) returns (DeleteMessageResponse);
  rpc GetUnreadCount(GetUnreadCountRequest) returns (GetUnreadCountResponse);
}

message GetChatsRequest {
  string user_id = 1;
  int32 page = 2;
  int32 limit = 3;
}

message GetChatsResponse {
  repeated Chat chats = 1;
  int32 total = 2;
  int32 page = 3;
  int32 limit = 4;
}

message CreateChatRequest {
  string user_id = 1;
  string target_user_id = 2;
}

message CreateChatResponse {
  bool success = 1;
  string message = 2;
  Chat chat = 3;
}

message GetChatRequest {
  string user_id = 1;
  string chat_id = 2;
}

message GetChatResponse {
  Chat chat = 1;
}

message GetMessagesRequest {
  string user_id = 1;
  string chat_id = 2;
  int32 page = 3;
  int32 limit = 4;
  string before_message_id = 5;
}

message GetMessagesResponse {
  repeated Message messages = 1;
  int32 total = 2;
  int32 page = 3;
  int32 limit = 4;
  bool has_more = 5;
}

message SendMessageRequest {
  string user_id = 1;
  string chat_id = 2;
  string content = 3;
  MessageType type = 4;
  string media_url = 5;
  string reply_to_message_id = 6;
}

message SendMessageResponse {
  bool success = 1;
  string message = 2;
  Message sent_message = 3;
}

message MarkAsReadRequest {
  string user_id = 1;
  string chat_id = 2;
  string message_id = 3;
}

message MarkAsReadResponse {
  bool success = 1;
  string message = 2;
}

message DeleteMessageRequest {
  string user_id = 1;
  string message_id = 2;
}

message DeleteMessageResponse {
  bool success = 1;
  string message = 2;
}

message GetUnreadCountRequest {
  string user_id = 1;
}

message GetUnreadCountResponse {
  int32 unread_count = 1;
}

message Chat {
  string id = 1;
  repeated string participant_ids = 2;
  string last_message = 3;
  int64 last_message_at = 4;
  int32 unread_count = 5;
  bool is_active = 6;
  int64 created_at = 7;
  int64 updated_at = 8;
}

message Message {
  string id = 1;
  string chat_id = 2;
  string sender_id = 3;
  string content = 4;
  MessageType type = 5;
  string media_url = 6;
  string reply_to_message_id = 7;
  bool is_read = 8;
  bool is_deleted = 9;
  int64 created_at = 10;
  int64 updated_at = 11;
}

enum MessageType {
  TEXT = 0;
  IMAGE = 1;
  VIDEO = 2;
  AUDIO = 3;
  FILE = 4;
  LOCATION = 5;
  SYSTEM = 6;
}
```

### 5.2 WebSocket 事件

```typescript
// WebSocket 事件定義
interface WebSocketEvents {
  // 客戶端發送的事件
  'join-chat': {
    chatId: string;
    userId: string;
  };
  
  'leave-chat': {
    chatId: string;
    userId: string;
  };
  
  'send-message': {
    chatId: string;
    content: string;
    type: MessageType;
    mediaUrl?: string;
    replyToMessageId?: string;
  };
  
  'typing-start': {
    chatId: string;
    userId: string;
  };
  
  'typing-stop': {
    chatId: string;
    userId: string;
  };
  
  'mark-as-read': {
    chatId: string;
    messageId: string;
  };
  
  // 服務器發送的事件
  'message-received': {
    message: Message;
  };
  
  'message-read': {
    chatId: string;
    messageId: string;
    readBy: string;
  };
  
  'user-typing': {
    chatId: string;
    userId: string;
    isTyping: boolean;
  };
  
  'user-online': {
    userId: string;
  };
  
  'user-offline': {
    userId: string;
  };
  
  'chat-updated': {
    chat: Chat;
  };
  
  'error': {
    message: string;
    code: string;
  };
}

// WebSocket 連接處理
export class ChatWebSocketHandler {
  async handleConnection(socket: Socket, userId: string) {
    // 用戶上線
    await this.userService.setUserOnline(userId);
    socket.broadcast.emit('user-online', { userId });
    
    // 加入聊天室
    socket.on('join-chat', async (data) => {
      const { chatId } = data;
      
      // 驗證用戶是否有權限加入聊天室
      const hasPermission = await this.chatService.checkChatPermission(userId, chatId);
      if (!hasPermission) {
        socket.emit('error', { message: '無權限加入聊天室', code: 'FORBIDDEN' });
        return;
      }
      
      socket.join(chatId);
      
      // 標記消息為已讀
      await this.chatService.markChatAsRead(userId, chatId);
    });
    
    // 發送消息
    socket.on('send-message', async (data) => {
      try {
        const message = await this.chatService.sendMessage({
          userId,
          chatId: data.chatId,
          content: data.content,
          type: data.type,
          mediaUrl: data.mediaUrl,
          replyToMessageId: data.replyToMessageId
        });
        
        // 廣播消息到聊天室
        socket.to(data.chatId).emit('message-received', { message });
        
        // 發送推送通知
        await this.notificationService.sendMessageNotification(message);
      } catch (error) {
        socket.emit('error', { message: error.message, code: 'SEND_MESSAGE_FAILED' });
      }
    });
    
    // 輸入狀態
    socket.on('typing-start', (data) => {
      socket.to(data.chatId).emit('user-typing', {
        chatId: data.chatId,
        userId,
        isTyping: true
      });
    });
    
    socket.on('typing-stop', (data) => {
      socket.to(data.chatId).emit('user-typing', {
        chatId: data.chatId,
        userId,
        isTyping: false
      });
    });
    
    // 標記為已讀
    socket.on('mark-as-read', async (data) => {
      await this.chatService.markAsRead(userId, data.chatId, data.messageId);
      socket.to(data.chatId).emit('message-read', {
        chatId: data.chatId,
        messageId: data.messageId,
        readBy: userId
      });
    });
    
    // 斷線處理
    socket.on('disconnect', async () => {
      await this.userService.setUserOffline(userId);
      socket.broadcast.emit('user-offline', { userId });
    });
  }
}
```

### 5.3 RESTful API 端點

```typescript
/**
 * @swagger
 * /api/chats:
 *   get:
 *     summary: 獲取聊天列表
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: 成功獲取聊天列表
 *   post:
 *     summary: 創建新聊天
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetUserId
 *             properties:
 *               targetUserId:
 *                 type: string
 *     responses:
 *       201:
 *         description: 聊天創建成功
 *       400:
 *         description: 請求參數錯誤
 *       403:
 *         description: 無法與該用戶聊天
 */

/**
 * @swagger
 * /api/chats/{chatId}/messages:
 *   get:
 *     summary: 獲取聊天消息
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *         description: 獲取指定消息之前的消息
 *     responses:
 *       200:
 *         description: 成功獲取消息列表
 *   post:
 *     summary: 發送消息
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - type
 *             properties:
 *               content:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [text, image, video, audio, file, location]
 *               mediaUrl:
 *                 type: string
 *               replyToMessageId:
 *                 type: string
 *     responses:
 *       201:
 *         description: 消息發送成功
 *       400:
 *         description: 請求參數錯誤
 *       403:
 *         description: 無權限發送消息
 */
```

## 6. 媒體服務 (Media Service)

### 6.1 gRPC 服務定義

```protobuf
// proto/media.proto
syntax = "proto3";

package media;

service MediaService {
  rpc UploadFile(stream UploadFileRequest) returns (UploadFileResponse);
  rpc GetFile(GetFileRequest) returns (GetFileResponse);
  rpc DeleteFile(DeleteFileRequest) returns (DeleteFileResponse);
  rpc UploadAvatar(stream UploadAvatarRequest) returns (UploadAvatarResponse);
  rpc UploadPhoto(stream UploadPhotoRequest) returns (UploadPhotoResponse);
  rpc GetUploadUrl(GetUploadUrlRequest) returns (GetUploadUrlResponse);
  rpc ProcessImage(ProcessImageRequest) returns (ProcessImageResponse);
}

message UploadFileRequest {
  oneof data {
    FileMetadata metadata = 1;
    bytes chunk = 2;
  }
}

message UploadFileResponse {
  bool success = 1;
  string message = 2;
  string file_id = 3;
  string file_url = 4;
  string thumbnail_url = 5;
}

message GetFileRequest {
  string file_id = 1;
  string user_id = 2;
}

message GetFileResponse {
  string file_url = 1;
  string thumbnail_url = 2;
  FileMetadata metadata = 3;
}

message DeleteFileRequest {
  string file_id = 1;
  string user_id = 2;
}

message DeleteFileResponse {
  bool success = 1;
  string message = 2;
}

message UploadAvatarRequest {
  oneof data {
    AvatarMetadata metadata = 1;
    bytes chunk = 2;
  }
}

message UploadAvatarResponse {
  bool success = 1;
  string message = 2;
  string avatar_url = 3;
  string thumbnail_url = 4;
}

message UploadPhotoRequest {
  oneof data {
    PhotoMetadata metadata = 1;
    bytes chunk = 2;
  }
}

message UploadPhotoResponse {
  bool success = 1;
  string message = 2;
  string photo_id = 3;
  string photo_url = 4;
  string thumbnail_url = 5;
}

message GetUploadUrlRequest {
  string user_id = 1;
  string file_name = 2;
  string content_type = 3;
  FileType file_type = 4;
}

message GetUploadUrlResponse {
  string upload_url = 1;
  string file_id = 2;
  int32 expires_in = 3;
}

message ProcessImageRequest {
  string file_id = 1;
  ImageProcessingOptions options = 2;
}

message ProcessImageResponse {
  bool success = 1;
  string message = 2;
  string processed_url = 3;
}

message FileMetadata {
  string user_id = 1;
  string file_name = 2;
  string content_type = 3;
  int64 file_size = 4;
  FileType file_type = 5;
}

message AvatarMetadata {
  string user_id = 1;
  string file_name = 2;
  string content_type = 3;
  int64 file_size = 4;
}

message PhotoMetadata {
  string user_id = 1;
  string file_name = 2;
  string content_type = 3;
  int64 file_size = 4;
  string description = 5;
}

message ImageProcessingOptions {
  int32 width = 1;
  int32 height = 2;
  string format = 3;
  int32 quality = 4;
  bool crop = 5;
  bool watermark = 6;
}

enum FileType {
  AVATAR = 0;
  PHOTO = 1;
  CHAT_IMAGE = 2;
  CHAT_VIDEO = 3;
  CHAT_AUDIO = 4;
  CHAT_FILE = 5;
}
```

### 6.2 RESTful API 端點

```typescript
/**
 * @swagger
 * /api/media/upload:
 *   post:
 *     summary: 上傳檔案
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               type:
 *                 type: string
 *                 enum: [avatar, photo, chat_image, chat_video, chat_audio, chat_file]
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: 檔案上傳成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 fileId:
 *                   type: string
 *                 fileUrl:
 *                   type: string
 *                 thumbnailUrl:
 *                   type: string
 *       400:
 *         description: 檔案格式不支援或檔案過大
 *       401:
 *         description: 未授權
 */

/**
 * @swagger
 * /api/media/avatar:
 *   post:
 *     summary: 上傳頭像
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: 頭像上傳成功
 *       400:
 *         description: 檔案格式不支援
 */

/**
 * @swagger
 * /api/media/{fileId}:
 *   get:
 *     summary: 獲取檔案
 *     tags: [Media]
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: size
 *         schema:
 *           type: string
 *           enum: [thumbnail, small, medium, large, original]
 *           default: original
 *     responses:
 *       200:
 *         description: 檔案獲取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fileUrl:
 *                   type: string
 *                 thumbnailUrl:
 *                   type: string
 *       404:
 *         description: 檔案不存在
 *   delete:
 *     summary: 刪除檔案
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 檔案刪除成功
 *       403:
 *         description: 無權限刪除檔案
 *       404:
 *         description: 檔案不存在
 */
```

## 7. 搜尋服務 (Search Service)

### 7.1 gRPC 服務定義

```protobuf
// proto/search.proto
syntax = "proto3";

package search;

service SearchService {
  rpc SearchUsers(SearchUsersRequest) returns (SearchUsersResponse);
  rpc SearchByLocation(SearchByLocationRequest) returns (SearchUsersResponse);
  rpc SearchByInterests(SearchByInterestsRequest) returns (SearchUsersResponse);
  rpc GetSuggestions(GetSuggestionsRequest) returns (GetSuggestionsResponse);
  rpc GetSearchHistory(GetSearchHistoryRequest) returns (GetSearchHistoryResponse);
  rpc SaveSearchHistory(SaveSearchHistoryRequest) returns (SaveSearchHistoryResponse);
  rpc DeleteSearchHistory(DeleteSearchHistoryRequest) returns (DeleteSearchHistoryResponse);
  rpc IndexUser(IndexUserRequest) returns (IndexUserResponse);
  rpc UpdateUserIndex(UpdateUserIndexRequest) returns (UpdateUserIndexResponse);
  rpc DeleteUserIndex(DeleteUserIndexRequest) returns (DeleteUserIndexResponse);
}

// 搜尋用戶請求
message SearchUsersRequest {
  string user_id = 1;
  string query = 2;
  int32 page = 3;
  int32 limit = 4;
  SearchFilters filters = 5;
  SearchSort sort = 6;
}

// 地理位置搜尋請求
message SearchByLocationRequest {
  string user_id = 1;
  double latitude = 2;
  double longitude = 3;
  double radius_km = 4;
  int32 page = 5;
  int32 limit = 6;
  SearchFilters filters = 7;
}

// 興趣標籤搜尋請求
message SearchByInterestsRequest {
  string user_id = 1;
  repeated string interests = 2;
  int32 page = 3;
  int32 limit = 4;
  SearchFilters filters = 5;
}

// 搜尋篩選條件
message SearchFilters {
  int32 min_age = 1;
  int32 max_age = 2;
  string gender = 3;
  repeated string interests = 4;
  string education = 5;
  string occupation = 6;
  bool online_only = 7;
  bool has_photos = 8;
}

// 搜尋排序
message SearchSort {
  string field = 1; // distance, age, last_active, relevance
  string order = 2; // asc, desc
}

// 搜尋用戶響應
message SearchUsersResponse {
  repeated SearchUserResult users = 1;
  int32 total = 2;
  int32 page = 3;
  int32 limit = 4;
  bool has_next = 5;
}

// 搜尋用戶結果
message SearchUserResult {
  string user_id = 1;
  string username = 2;
  string display_name = 3;
  int32 age = 4;
  string avatar_url = 5;
  repeated string photos = 6;
  string bio = 7;
  repeated string interests = 8;
  string location = 9;
  double distance_km = 10;
  string last_active = 11;
  bool is_online = 12;
  float relevance_score = 13;
}

// 搜尋建議請求
message GetSuggestionsRequest {
  string user_id = 1;
  string query = 2;
  int32 limit = 3;
}

// 搜尋建議響應
message GetSuggestionsResponse {
  repeated SearchSuggestion suggestions = 1;
}

// 搜尋建議
message SearchSuggestion {
  string text = 1;
  string type = 2; // user, interest, location
  int32 count = 3;
}

// 搜尋歷史請求
message GetSearchHistoryRequest {
  string user_id = 1;
  int32 page = 2;
  int32 limit = 3;
}

// 搜尋歷史響應
message GetSearchHistoryResponse {
  repeated SearchHistoryItem items = 1;
  int32 total = 2;
}

// 搜尋歷史項目
message SearchHistoryItem {
  string id = 1;
  string query = 2;
  string type = 3; // text, location, interests
  string created_at = 4;
  int32 result_count = 5;
}

// 保存搜尋歷史請求
message SaveSearchHistoryRequest {
  string user_id = 1;
  string query = 2;
  string type = 3;
  int32 result_count = 4;
}

// 保存搜尋歷史響應
message SaveSearchHistoryResponse {
  string id = 1;
  bool success = 2;
}

// 刪除搜尋歷史請求
message DeleteSearchHistoryRequest {
  string user_id = 1;
  string history_id = 2;
}

// 刪除搜尋歷史響應
message DeleteSearchHistoryResponse {
  bool success = 1;
}

// 索引用戶請求
message IndexUserRequest {
  string user_id = 1;
  UserIndexData data = 2;
}

// 用戶索引數據
message UserIndexData {
  string username = 1;
  string display_name = 2;
  string bio = 3;
  int32 age = 4;
  string gender = 5;
  repeated string interests = 6;
  string education = 7;
  string occupation = 8;
  string location = 9;
  double latitude = 10;
  double longitude = 11;
  repeated string photos = 12;
  string last_active = 13;
  bool is_online = 14;
}

// 索引用戶響應
message IndexUserResponse {
  bool success = 1;
  string message = 2;
}

// 更新用戶索引請求
message UpdateUserIndexRequest {
  string user_id = 1;
  UserIndexData data = 2;
}

// 更新用戶索引響應
message UpdateUserIndexResponse {
  bool success = 1;
  string message = 2;
}

// 刪除用戶索引請求
message DeleteUserIndexRequest {
  string user_id = 1;
}

// 刪除用戶索引響應
message DeleteUserIndexResponse {
  bool success = 1;
  string message = 2;
}
```

### 7.2 RESTful API (通過 API Gateway)

#### 7.2.1 搜尋用戶

```typescript
/**
 * @swagger
 * /api/search/users:
 *   get:
 *     summary: 搜尋用戶
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: 搜尋關鍵字
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 頁碼
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 每頁數量
 *       - in: query
 *         name: min_age
 *         schema:
 *           type: integer
 *         description: 最小年齡
 *       - in: query
 *         name: max_age
 *         schema:
 *           type: integer
 *         description: 最大年齡
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *           enum: [male, female, other]
 *         description: 性別
 *       - in: query
 *         name: interests
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: 興趣標籤
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [relevance, distance, age, last_active]
 *           default: relevance
 *         description: 排序方式
 *     responses:
 *       200:
 *         description: 搜尋成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SearchUserResult'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 has_next:
 *                   type: boolean
 */
```

#### 7.2.2 地理位置搜尋

```typescript
/**
 * @swagger
 * /api/search/location:
 *   get:
 *     summary: 地理位置搜尋
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *         description: 緯度
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *         description: 經度
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 10
 *         description: 搜尋半徑 (公里)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: 搜尋成功
 */
```

#### 7.2.3 搜尋建議

```typescript
/**
 * @swagger
 * /api/search/suggestions:
 *   get:
 *     summary: 獲取搜尋建議
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: 搜尋關鍵字
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: 獲取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 suggestions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SearchSuggestion'
 */
```

#### 7.2.4 搜尋歷史

```typescript
/**
 * @swagger
 * /api/search/history:
 *   get:
 *     summary: 獲取搜尋歷史
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: 獲取成功
 *   post:
 *     summary: 保存搜尋歷史
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [text, location, interests]
 *               result_count:
 *                 type: integer
 *     responses:
 *       201:
 *         description: 保存成功
 */
```

## 8. 管理服務 (Admin Service)

### 8.1 gRPC 服務定義

```protobuf
// proto/admin.proto
syntax = "proto3";

package admin;

service AdminService {
  rpc GetUsers(GetUsersRequest) returns (GetUsersResponse);
  rpc UpdateUserStatus(UpdateUserStatusRequest) returns (UpdateUserStatusResponse);
  rpc GetReports(GetReportsRequest) returns (GetReportsResponse);
  rpc HandleReport(HandleReportRequest) returns (HandleReportResponse);
  rpc GetAnalytics(GetAnalyticsRequest) returns (GetAnalyticsResponse);
  rpc GetSystemStats(GetSystemStatsRequest) returns (GetSystemStatsResponse);
  rpc BanUser(BanUserRequest) returns (BanUserResponse);
  rpc UnbanUser(UnbanUserRequest) returns (UnbanUserResponse);
  rpc DeleteUser(DeleteUserRequest) returns (DeleteUserResponse);
}

message GetUsersRequest {
  string admin_id = 1;
  UserFilters filters = 2;
  int32 page = 3;
  int32 limit = 4;
  string sort_by = 5;
  string sort_order = 6;
}

message GetUsersResponse {
  repeated AdminUser users = 1;
  int32 total = 2;
  int32 page = 3;
  int32 limit = 4;
}

message UpdateUserStatusRequest {
  string admin_id = 1;
  string user_id = 2;
  UserStatus status = 3;
  string reason = 4;
}

message UpdateUserStatusResponse {
  bool success = 1;
  string message = 2;
}

message GetReportsRequest {
  string admin_id = 1;
  ReportFilters filters = 2;
  int32 page = 3;
  int32 limit = 4;
}

message GetReportsResponse {
  repeated Report reports = 1;
  int32 total = 2;
  int32 page = 3;
  int32 limit = 4;
}

message HandleReportRequest {
  string admin_id = 1;
  string report_id = 2;
  ReportAction action = 3;
  string notes = 4;
}

message HandleReportResponse {
  bool success = 1;
  string message = 2;
}

message GetAnalyticsRequest {
  string admin_id = 1;
  string start_date = 2;
  string end_date = 3;
  repeated string metrics = 4;
}

message GetAnalyticsResponse {
  Analytics analytics = 1;
}

message GetSystemStatsRequest {
  string admin_id = 1;
}

message GetSystemStatsResponse {
  SystemStats stats = 1;
}

message BanUserRequest {
  string admin_id = 1;
  string user_id = 2;
  string reason = 3;
  int64 ban_until = 4; // 0 for permanent ban
}

message BanUserResponse {
  bool success = 1;
  string message = 2;
}

message UnbanUserRequest {
  string admin_id = 1;
  string user_id = 2;
  string reason = 3;
}

message UnbanUserResponse {
  bool success = 1;
  string message = 2;
}

message DeleteUserRequest {
  string admin_id = 1;
  string user_id = 2;
  string reason = 3;
  bool hard_delete = 4;
}

message DeleteUserResponse {
  bool success = 1;
  string message = 2;
}

message AdminUser {
  string id = 1;
  string email = 2;
  string name = 3;
  int32 age = 4;
  string gender = 5;
  UserStatus status = 6;
  bool email_verified = 7;
  int32 report_count = 8;
  int64 last_active = 9;
  int64 created_at = 10;
  int64 updated_at = 11;
}

message UserFilters {
  UserStatus status = 1;
  string email = 2;
  string name = 3;
  bool email_verified = 4;
  int64 created_after = 5;
  int64 created_before = 6;
  int64 last_active_after = 7;
  int64 last_active_before = 8;
}

message Report {
  string id = 1;
  string reporter_id = 2;
  string reported_user_id = 3;
  string reason = 4;
  string description = 5;
  ReportStatus status = 6;
  string handled_by = 7;
  string admin_notes = 8;
  int64 created_at = 9;
  int64 handled_at = 10;
}

message ReportFilters {
  ReportStatus status = 1;
  string reason = 2;
  int64 created_after = 3;
  int64 created_before = 4;
}

message Analytics {
  int32 total_users = 1;
  int32 active_users = 2;
  int32 new_users = 3;
  int32 total_matches = 4;
  int32 total_messages = 5;
  repeated DailyStats daily_stats = 6;
}

message DailyStats {
  string date = 1;
  int32 new_users = 2;
  int32 active_users = 3;
  int32 matches = 4;
  int32 messages = 5;
}

message SystemStats {
  int32 total_users = 1;
  int32 online_users = 2;
  int32 pending_reports = 3;
  int32 total_matches = 4;
  int32 total_messages = 5;
  double cpu_usage = 6;
  double memory_usage = 7;
  double disk_usage = 8;
}

enum UserStatus {
  ACTIVE = 0;
  INACTIVE = 1;
  SUSPENDED = 2;
  BANNED = 3;
  DELETED = 4;
}

enum ReportStatus {
  PENDING = 0;
  REVIEWING = 1;
  RESOLVED = 2;
  DISMISSED = 3;
}

enum ReportAction {
  DISMISS = 0;
  WARNING = 1;
  SUSPEND = 2;
  BAN = 3;
  DELETE = 4;
}
```

### 8.2 RESTful API 端點

```typescript
/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: 獲取用戶列表 (管理員)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, suspended, banned, deleted]
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *       - in: query
 *         name: emailVerified
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [created_at, updated_at, last_active, name, email]
 *           default: created_at
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: 成功獲取用戶列表
 *       401:
 *         description: 未授權
 *       403:
 *         description: 無管理員權限
 */

/**
 * @swagger
 * /api/admin/users/{userId}/status:
 *   put:
 *     summary: 更新用戶狀態 (管理員)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive, suspended, banned, deleted]
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: 用戶狀態更新成功
 *       400:
 *         description: 請求參數錯誤
 *       401:
 *         description: 未授權
 *       403:
 *         description: 無管理員權限
 *       404:
 *         description: 用戶不存在
 */

/**
 * @swagger
 * /api/admin/reports:
 *   get:
 *     summary: 獲取舉報列表 (管理員)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, reviewing, resolved, dismissed]
 *       - in: query
 *         name: reason
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: 成功獲取舉報列表
 *       401:
 *         description: 未授權
 *       403:
 *         description: 無管理員權限
 */

/**
 * @swagger
 * /api/admin/analytics:
 *   get:
 *     summary: 獲取分析數據 (管理員)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: metrics
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [users, matches, messages, reports]
 *     responses:
 *       200:
 *         description: 成功獲取分析數據
 *       401:
 *         description: 未授權
 *       403:
 *         description: 無管理員權限
 */
```

## 8. 共用數據模型

### 8.1 Swagger 組件定義

```yaml
# swagger-components.yaml
components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
          example: 123e4567-e89b-12d3-a456-426614174000
        email:
          type: string
          format: email
          example: user@example.com
        name:
          type: string
          example: 張三
        age:
          type: integer
          example: 25
        gender:
          type: string
          enum: [male, female, other]
          example: male
        emailVerified:
          type: boolean
          example: true
        status:
          type: string
          enum: [active, inactive, suspended, banned, deleted]
          example: active
        createdAt:
          type: integer
          example: 1640995200
        updatedAt:
          type: integer
          example: 1640995200

    UserProfile:
      allOf:
        - $ref: '#/components/schemas/User'
        - type: object
          properties:
            bio:
              type: string
              example: 喜歡旅行和攝影的軟體工程師
            interests:
              type: array
              items:
                type: string
              example: [旅行, 攝影, 程式設計, 音樂]
            location:
              type: string
              example: 台北市
            avatarUrl:
              type: string
              example: https://example.com/avatar.jpg
            photoUrls:
              type: array
              items:
                type: string
              example: [https://example.com/photo1.jpg, https://example.com/photo2.jpg]
            occupation:
              type: string
              example: 軟體工程師
            education:
              type: string
              example: 台灣大學資訊工程學系
            height:
              type: integer
              example: 175
            relationshipType:
              type: string
              enum: [casual, serious, friendship, marriage]
              example: serious
            isVerified:
              type: boolean
              example: false
            lastActive:
              type: integer
              example: 1640995200

    UpdateProfileRequest:
      type: object
      properties:
        name:
          type: string
          example: 張三
        bio:
          type: string
          example: 喜歡旅行和攝影的軟體工程師
        interests:
          type: array
          items:
            type: string
          example: [旅行, 攝影, 程式設計, 音樂]
        location:
          type: string
          example: 台北市
        occupation:
          type: string
          example: 軟體工程師
        education:
          type: string
          example: 台灣大學資訊工程學系
        height:
          type: integer
          example: 175
        relationshipType:
          type: string
          enum: [casual, serious, friendship, marriage]
          example: serious

    Chat:
      type: object
      properties:
        id:
          type: string
          example: 123e4567-e89b-12d3-a456-426614174000
        participantIds:
          type: array
          items:
            type: string
          example: [user1-id, user2-id]
        lastMessage:
          type: string
          example: 你好，很高興認識你！
        lastMessageAt:
          type: integer
          example: 1640995200
        unreadCount:
          type: integer
          example: 3
        isActive:
          type: boolean
          example: true
        createdAt:
          type: integer
          example: 1640995200
        updatedAt:
          type: integer
          example: 1640995200

    Message:
      type: object
      properties:
        id:
          type: string
          example: 123e4567-e89b-12d3-a456-426614174000
        chatId:
          type: string
          example: 123e4567-e89b-12d3-a456-426614174000
        senderId:
          type: string
          example: 123e4567-e89b-12d3-a456-426614174000
        content:
          type: string
          example: 你好，很高興認識你！
        type:
          type: string
          enum: [text, image, video, audio, file, location, system]
          example: text
        mediaUrl:
          type: string
          example: https://example.com/image.jpg
        replyToMessageId:
          type: string
          example: 123e4567-e89b-12d3-a456-426614174000
        isRead:
          type: boolean
          example: true
        isDeleted:
          type: boolean
          example: false
        createdAt:
          type: integer
          example: 1640995200
        updatedAt:
          type: integer
          example: 1640995200

    Match:
      type: object
      properties:
        id:
          type: string
          example: 123e4567-e89b-12d3-a456-426614174000
        user:
          $ref: '#/components/schemas/UserProfile'
        matchedAt:
          type: integer
          example: 1640995200
        hasUnreadMessages:
          type: boolean
          example: true
        lastMessage:
          type: string
          example: 你好，很高興認識你！
        lastMessageAt:
          type: integer
          example: 1640995200

    Error:
      type: object
      properties:
        error:
          type: string
          example: 請求參數錯誤
        code:
          type: string
          example: INVALID_REQUEST
        details:
          type: object
          example: { field: 'email', message: '郵箱格式不正確' }
        timestamp:
          type: integer
          example: 1640995200
        requestId:
          type: string
          example: 123e4567-e89b-12d3-a456-426614174000

  responses:
    BadRequest:
      description: 請求參數錯誤
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            error: 請求參數錯誤
            code: INVALID_REQUEST
            details: { field: 'email', message: '郵箱格式不正確' }
            timestamp: 1640995200
            requestId: 123e4567-e89b-12d3-a456-426614174000

    Unauthorized:
      description: 未授權
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            error: 未授權
            code: UNAUTHORIZED
            details: {}
            timestamp: 1640995200
            requestId: 123e4567-e89b-12d3-a456-426614174000

    Forbidden:
      description: 無權限
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            error: 無權限執行此操作
            code: FORBIDDEN
            details: {}
            timestamp: 1640995200
            requestId: 123e4567-e89b-12d3-a456-426614174000

    NotFound:
      description: 資源不存在
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            error: 資源不存在
            code: NOT_FOUND
            details: {}
            timestamp: 1640995200
            requestId: 123e4567-e89b-12d3-a456-426614174000

    TooManyRequests:
      description: 請求過於頻繁
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            error: 請求過於頻繁
            code: RATE_LIMIT_EXCEEDED
            details: { retryAfter: 60 }
            timestamp: 1640995200
            requestId: 123e4567-e89b-12d3-a456-426614174000

    InternalServerError:
      description: 服務器內部錯誤
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            error: 服務器內部錯誤
            code: INTERNAL_SERVER_ERROR
            details: {}
            timestamp: 1640995200
            requestId: 123e4567-e89b-12d3-a456-426614174000
```

## 9. 錯誤處理

### 9.1 HTTP 狀態碼

| 狀態碼 | 說明 | 使用場景 |
|--------|------|----------|
| 200 | OK | 請求成功 |
| 201 | Created | 資源創建成功 |
| 400 | Bad Request | 請求參數錯誤 |
| 401 | Unauthorized | 未授權 |
| 403 | Forbidden | 無權限 |
| 404 | Not Found | 資源不存在 |
| 409 | Conflict | 資源衝突 |
| 422 | Unprocessable Entity | 請求格式正確但語義錯誤 |
| 429 | Too Many Requests | 請求過於頻繁 |
| 500 | Internal Server Error | 服務器內部錯誤 |
| 502 | Bad Gateway | 網關錯誤 |
| 503 | Service Unavailable | 服務不可用 |

### 9.2 gRPC 狀態碼

| gRPC 狀態碼 | HTTP 狀態碼 | 說明 |
|-------------|-------------|------|
| OK | 200 | 成功 |
| INVALID_ARGUMENT | 400 | 無效參數 |
| UNAUTHENTICATED | 401 | 未認證 |
| PERMISSION_DENIED | 403 | 權限拒絕 |
| NOT_FOUND | 404 | 未找到 |
| ALREADY_EXISTS | 409 | 已存在 |
| RESOURCE_EXHAUSTED | 429 | 資源耗盡 |
| INTERNAL | 500 | 內部錯誤 |
| UNAVAILABLE | 503 | 服務不可用 |
| DEADLINE_EXCEEDED | 504 | 超時 |

### 9.3 錯誤代碼定義

```typescript
// 錯誤代碼枚舉
export enum ErrorCode {
  // 通用錯誤
  INVALID_REQUEST = 'INVALID_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

  // 認證相關
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED',
  ACCOUNT_BANNED = 'ACCOUNT_BANNED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',

  // 用戶相關
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  INVALID_EMAIL_FORMAT = 'INVALID_EMAIL_FORMAT',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  PROFILE_INCOMPLETE = 'PROFILE_INCOMPLETE',

  // 聊天相關
  CHAT_NOT_FOUND = 'CHAT_NOT_FOUND',
  MESSAGE_NOT_FOUND = 'MESSAGE_NOT_FOUND',
  CANNOT_MESSAGE_USER = 'CANNOT_MESSAGE_USER',
  MESSAGE_TOO_LONG = 'MESSAGE_TOO_LONG',

  // 媒體相關
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  UPLOAD_FAILED = 'UPLOAD_FAILED',

  // 配對相關
  ALREADY_LIKED = 'ALREADY_LIKED',
  CANNOT_LIKE_SELF = 'CANNOT_LIKE_SELF',
  USER_BLOCKED = 'USER_BLOCKED',

  // 管理相關
  ADMIN_PERMISSION_REQUIRED = 'ADMIN_PERMISSION_REQUIRED',
  INVALID_ADMIN_ACTION = 'INVALID_ADMIN_ACTION'
}

// 錯誤響應接口
export interface ErrorResponse {
  error: string;
  code: ErrorCode;
  details?: Record<string, any>;
  timestamp: number;
  requestId: string;
}

// 錯誤處理中間件
export class ErrorHandler {
  static handle(error: any, req: Request, res: Response, next: NextFunction) {
    const requestId = req.headers['x-request-id'] as string || generateRequestId();
    const timestamp = Date.now();

    let statusCode = 500;
    let errorCode = ErrorCode.INTERNAL_SERVER_ERROR;
    let message = '服務器內部錯誤';
    let details = {};

    // 根據錯誤類型設置響應
    if (error.name === 'ValidationError') {
      statusCode = 400;
      errorCode = ErrorCode.INVALID_REQUEST;
      message = '請求參數錯誤';
      details = error.details;
    } else if (error.name === 'UnauthorizedError') {
      statusCode = 401;
      errorCode = ErrorCode.UNAUTHORIZED;
      message = '未授權';
    } else if (error.name === 'ForbiddenError') {
      statusCode = 403;
      errorCode = ErrorCode.FORBIDDEN;
      message = '無權限執行此操作';
    } else if (error.name === 'NotFoundError') {
      statusCode = 404;
      errorCode = ErrorCode.NOT_FOUND;
      message = '資源不存在';
    }

    const errorResponse: ErrorResponse = {
      error: message,
      code: errorCode,
      details,
      timestamp,
      requestId
    };

    // 記錄錯誤日誌
    logger.error('API Error', {
      error: error.message,
      stack: error.stack,
      requestId,
      url: req.url,
      method: req.method,
      userAgent: req.headers['user-agent'],
      ip: req.ip
    });

    res.status(statusCode).json(errorResponse);
  }
}
```

## 10. API 測試

### 10.1 Swagger UI 配置

每個微服務都提供 Swagger UI 界面，用於 API 測試和文檔查看：

- API Gateway: `http://localhost:3000/api/docs`
- 認證服務: `http://localhost:3001/api/docs`
- 用戶服務: `http://localhost:3002/api/docs`
- 聊天服務: `http://localhost:3003/api/docs`
- 媒體服務: `http://localhost:3005/api/docs`
- 管理服務: `http://localhost:3006/api/docs`

### 10.2 Postman 集合

```json
{
  "info": {
    "name": "MKing Friend API",
    "description": "MKing Friend 微服務 API 測試集合",
    "version": "1.0.0"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{accessToken}}",
        "type": "string"
      }
    ]
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000",
      "type": "string"
    },
    {
      "key": "accessToken",
      "value": "",
      "type": "string"
    },
    {
      "key": "userId",
      "value": "",
      "type": "string"
    }
  ],
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"test@example.com\",\n  \"password\": \"password123\",\n  \"name\": \"測試用戶\",\n  \"age\": 25,\n  \"gender\": \"male\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/api/auth/register",
              "host": ["{{baseUrl}}"],
              "path": ["api", "auth", "register"]
            }
          }
        },
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"test@example.com\",\n  \"password\": \"password123\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/api/auth/login",
              "host": ["{{baseUrl}}"],
              "path": ["api", "auth", "login"]
            }
          },
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "if (pm.response.code === 200) {",
                  "    const response = pm.response.json();",
                  "    pm.environment.set('accessToken', response.accessToken);",
                  "    pm.environment.set('userId', response.user.id);",
                  "}"
                ]
              }
            }
          ]
        }
      ]
    }
  ]
}
```

### 10.3 gRPC 測試

使用 `grpcurl` 工具測試 gRPC 服務：

```bash
# 列出服務
grpcurl -plaintext localhost:50001 list

# 列出方法
grpcurl -plaintext localhost:50001 list auth.AuthService

# 調用方法
grpcurl -plaintext -d '{
  "email": "test@example.com",
  "password": "password123",
  "name": "測試用戶",
  "age": 25,
  "gender": "male"
}' localhost:50001 auth.AuthService/Register

# 使用 token 調用
grpcurl -plaintext -H "authorization: Bearer YOUR_TOKEN" -d '{
  "user_id": "123e4567-e89b-12d3-a456-426614174000"
}' localhost:50002 user.UserService/GetProfile
```

## 11. 版本控制

### 11.1 API 版本策略

- **URL 版本控制**: `/api/v1/users`, `/api/v2/users`
- **Header 版本控制**: `Accept: application/vnd.api+json;version=1`
- **gRPC 版本控制**: 使用不同的 package 名稱 (`auth.v1`, `auth.v2`)

### 11.2 向後兼容性

- 新增字段時保持向後兼容
- 廢棄字段時提供遷移期
- 重大變更時發布新版本
- 維護多個版本的並行支持

### 11.3 版本發布流程

```yaml
# API 版本發布檢查清單
- [ ] API 變更文檔
- [ ] 向後兼容性測試
- [ ] 客戶端 SDK 更新
- [ ] 文檔更新
- [ ] 遷移指南
- [ ] 廢棄通知
```

## 12. 安全考量

### 12.1 認證和授權

- JWT Token 認證
- 角色基礎存取控制 (RBAC)
- API 金鑰管理
- OAuth 2.0 支持

### 12.2 數據驗證

- 輸入參數驗證
- SQL 注入防護
- XSS 攻擊防護
- CSRF 保護

### 12.3 速率限制

- 基於 IP 的速率限制
- 基於用戶的速率限制
- API 配額管理
- 熔斷器模式

## 13. 監控和日誌

### 13.1 API 監控指標

- 請求數量和響應時間
- 錯誤率和成功率
- 併發用戶數
- 資源使用率

### 13.2 日誌格式

```json
{
  "timestamp": "2023-12-01T10:00:00Z",
  "level": "info",
  "service": "api-gateway",
  "requestId": "123e4567-e89b-12d3-a456-426614174000",
  "method": "POST",
  "url": "/api/auth/login",
  "statusCode": 200,
  "responseTime": 150,
  "userAgent": "Mozilla/5.0...",
  "ip": "192.168.1.100",
  "userId": "user-123"
}
```

## 14. 總結

本 API 規範文檔詳細定義了 MKing Friend 微服務架構中各個服務的 API 接口，包括：

- RESTful API 端點設計
- gRPC 服務定義
- WebSocket 事件規範
- 數據模型和錯誤處理
- 測試和監控指南
- 安全和版本控制策略

遵循這些規範可以確保微服務間的一致性和可維護性，為前端開發和第三方集成提供清晰的接口定義。