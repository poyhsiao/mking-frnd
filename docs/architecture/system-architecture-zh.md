# MKing Friend - 系統架構設計

## 1. 整體架構概述

### 1.1 架構原則
- **微服務架構**: 模組化設計，便於擴展和維護
- **雲原生**: 容器化部署，支援水平擴展
- **安全第一**: 多層安全防護機制
- **高可用性**: 99.9%以上的服務可用性

### 1.2 系統架構圖
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

## 2. 前端架構

### 2.1 技術棧
- **框架**: React 18 + TypeScript
- **狀態管理**: Redux Toolkit + RTK Query
- **路由**: React Router v6
- **UI框架**: Tailwind CSS + Headless UI
- **PWA**: Workbox for service worker

### 2.2 目錄結構
```
src/
├── components/          # 可重用組件
│   ├── ui/             # 基礎UI組件
│   ├── forms/          # 表單組件
│   └── layout/         # 佈局組件
├── pages/              # 頁面組件
├── hooks/              # 自定義Hooks
├── store/              # Redux store
├── services/           # API服務
├── utils/              # 工具函數
├── types/              # TypeScript類型定義
└── assets/             # 靜態資源
```

### 2.3 響應式設計
- **斷點**: Mobile (320px), Tablet (768px), Desktop (1024px)
- **設計系統**: 統一的色彩、字體、間距規範
- **暗黑模式**: CSS變量實現主題切換

## 3. 後端微服務架構

### 3.1 微服務架構概述

#### 3.1.1 架構原則
- **服務獨立性**: 每個微服務可獨立開發、部署和擴展
- **gRPC 通訊**: 服務間使用 gRPC 進行高效通訊
- **API Gateway**: 統一對外 API 入口
- **獨立倉庫**: 每個服務使用獨立的 Git 倉庫管理
- **容器化部署**: 所有服務支援 Docker 容器化

#### 3.1.2 微服務架構圖
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

### 3.2 微服務詳細設計

#### 3.2.1 API Gateway 服務
- **Git 倉庫**: `mking-friend-api-gateway`
- **職責**: 
  - 統一 API 入口點
  - 路由轉發到對應微服務
  - 認證和授權檢查
  - 請求/響應轉換 (REST ↔ gRPC)
  - API 限流和監控
- **技術棧**: Node.js + NestJS + TypeScript + gRPC Client
- **對外 API**: RESTful API + GraphQL
- **內部通訊**: gRPC
- **API 文檔**: Swagger/OpenAPI 3.0
- **端口**: 3000 (HTTP), 50000 (gRPC Health Check)

#### 3.2.2 認證服務 (Auth Service)
- **Git 倉庫**: `mking-friend-auth-service`
- **職責**: 
  - 用戶註冊、登入、登出
  - JWT Token 管理
  - OAuth 2.0 第三方登入
  - 密碼重置和驗證
  - 雙因子認證 (2FA)
- **技術棧**: Node.js + NestJS + TypeScript + Passport.js + gRPC
- **資料庫**: PostgreSQL (用戶認證資料)
- **gRPC 服務**: AuthService
- **API 文檔**: Swagger/OpenAPI 3.0
- **端口**: 3001 (HTTP), 50001 (gRPC)

#### 3.2.3 用戶服務 (User Service)
- **Git 倉庫**: `mking-friend-user-service`
- **職責**: 
  - 用戶資料管理
  - 個人檔案 CRUD
  - 用戶偏好設定
  - 配對算法和推薦
  - 用戶關係管理 (追蹤、封鎖)
- **技術棧**: Node.js + NestJS + TypeScript + Prisma ORM + gRPC
- **資料庫**: PostgreSQL (用戶資料)
- **gRPC 服務**: UserService
- **API 文檔**: Swagger/OpenAPI 3.0
- **端口**: 3002 (HTTP), 50002 (gRPC)

#### 3.2.4 聊天服務 (Chat Service)
- **Git 倉庫**: `mking-friend-chat-service`
- **職責**: 
  - 即時訊息處理
  - 聊天室管理
  - WebSocket 連接管理
  - 訊息歷史記錄
  - 群組聊天功能
- **技術棧**: Node.js + NestJS + TypeScript + Socket.io + WebRTC + gRPC
- **資料庫**: Redis (即時資料) + PostgreSQL (歷史記錄)
- **gRPC 服務**: ChatService
- **API 文檔**: Swagger/OpenAPI 3.0
- **端口**: 3003 (HTTP), 3004 (WebSocket), 50003 (gRPC)

#### 3.2.5 媒體服務 (Media Service)
- **Git 倉庫**: `mking-friend-media-service`
- **職責**: 
  - 檔案上傳和下載
  - 圖片/影片處理和壓縮
  - CDN 管理
  - 媒體檔案元數據管理
  - 內容審核 (AI 輔助)
- **技術棧**: Node.js + NestJS + TypeScript + Multer + Sharp + gRPC
- **存儲**: MinIO (S3兼容) + Redis (快取)
- **gRPC 服務**: MediaService
- **API 文檔**: Swagger/OpenAPI 3.0
- **端口**: 3005 (HTTP), 50005 (gRPC)

#### 3.2.6 搜尋服務 (Search Service)
- **Git 倉庫**: `mking-friend-search-service`
- **職責**: 
  - 用戶搜尋和篩選
  - 地理位置搜尋
  - 興趣標籤搜尋
  - 全文搜尋功能
  - 搜尋結果排序和推薦
  - 搜尋歷史記錄
  - 搜尋分析和統計
- **技術棧**: Node.js + NestJS + TypeScript + Typesense + gRPC
- **資料庫**: Typesense (搜尋索引) + Redis (快取) + PostgreSQL (搜尋歷史)
- **gRPC 服務**: SearchService
- **API 文檔**: Swagger/OpenAPI 3.0
- **端口**: 3007 (HTTP), 50007 (gRPC)
- **水平擴展**: 支援多實例部署，Typesense 集群

#### 3.2.7 管理服務 (Admin Service)
- **Git 倉庫**: `mking-friend-admin-service`
- **職責**: 
  - 管理員認證和授權
  - 用戶管理和審核
  - 內容審核和管理
  - 系統統計和報告
  - 系統配置管理
- **技術棧**: Node.js + NestJS + TypeScript + Prisma ORM + gRPC
- **資料庫**: PostgreSQL (管理數據) + Redis (快取)
- **gRPC 服務**: AdminService
- **API 文檔**: Swagger/OpenAPI 3.0
- **端口**: 3006 (HTTP), 50006 (gRPC)

### 3.3 gRPC 服務定義

#### 3.3.1 認證服務 gRPC API
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

#### 3.3.2 用戶服務 gRPC API
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

#### 3.3.3 聊天服務 gRPC API
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

#### 3.3.4 媒體服務 gRPC API
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

#### 3.3.5 搜尋服務 gRPC API
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
  string user_id = 6; // 搜尋者ID，用於個人化結果
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

### 3.4 API Gateway 路由設計

#### 3.4.1 對外 RESTful API (通過 API Gateway)
```
# 認證相關
POST   /api/v1/auth/register       # 用戶註冊 → Auth Service
POST   /api/v1/auth/login          # 用戶登入 → Auth Service
POST   /api/v1/auth/logout         # 用戶登出 → Auth Service
POST   /api/v1/auth/refresh        # 刷新Token → Auth Service
POST   /api/v1/auth/reset-password # 重置密碼 → Auth Service

# 用戶相關
GET    /api/v1/users              # 獲取用戶列表 → User Service
GET    /api/v1/users/:id          # 獲取特定用戶 → User Service
PUT    /api/v1/users/:id          # 更新用戶 → User Service
GET    /api/v1/users/recommendations # 獲取推薦用戶 → User Service
POST   /api/v1/users/:id/follow   # 追蹤用戶 → User Service
DELETE /api/v1/users/:id/follow   # 取消追蹤 → User Service

# 聊天相關
GET    /api/v1/chats              # 獲取聊天列表 → Chat Service
POST   /api/v1/chats              # 創建聊天 → Chat Service
GET    /api/v1/chats/:id/messages # 獲取聊天訊息 → Chat Service
POST   /api/v1/chats/:id/messages # 發送訊息 → Chat Service

# 媒體相關
POST   /api/v1/media/upload       # 上傳檔案 → Media Service
GET    /api/v1/media/:id          # 獲取檔案 → Media Service
DELETE /api/v1/media/:id          # 刪除檔案 → Media Service

# 搜尋相關
GET    /api/v1/search/users       # 搜尋用戶 → Search Service
GET    /api/v1/search/location    # 地理位置搜尋 → Search Service
GET    /api/v1/search/interests   # 興趣標籤搜尋 → Search Service
GET    /api/v1/search/suggestions # 搜尋建議 → Search Service
GET    /api/v1/search/history     # 搜尋歷史 → Search Service
POST   /api/v1/search/history     # 保存搜尋歷史 → Search Service
DELETE /api/v1/search/history/:id # 刪除搜尋歷史 → Search Service

# 管理相關
GET    /api/v1/admin/users        # 管理用戶 → Admin Service
GET    /api/v1/admin/stats        # 系統統計 → Admin Service
POST   /api/v1/admin/content/review # 內容審核 → Admin Service
```

#### 3.4.2 WebSocket 事件 (Chat Service)
```javascript
// 客戶端事件
'join_room'         // 加入聊天室
'leave_room'        // 離開聊天室
'send_message'      // 發送訊息
'typing_start'      // 開始輸入
'typing_stop'       // 停止輸入
'mark_as_read'      // 標記已讀

// 服務端事件
'message_received'  // 收到訊息
'user_online'       // 用戶上線
'user_offline'      // 用戶離線
'typing_indicator'  // 輸入指示器
'message_read'      // 訊息已讀
'room_updated'      // 聊天室更新
```

### 3.5 服務間通訊

#### 3.5.1 gRPC 通訊模式
- **同步調用**: 用於需要立即響應的操作
- **異步調用**: 用於非關鍵路徑操作
- **流式調用**: 用於大檔案傳輸和實時數據
- **雙向流**: 用於實時聊天和推送

#### 3.5.2 服務發現
- **Consul**: 服務註冊和發現
- **健康檢查**: gRPC 健康檢查協議
- **負載均衡**: 客戶端負載均衡
- **熔斷器**: 防止級聯故障

#### 3.5.3 錯誤處理
- **gRPC 狀態碼**: 標準化錯誤響應
- **重試機制**: 指數退避重試
- **超時控制**: 請求超時設定
- **降級策略**: 服務不可用時的降級處理

## 4. 資料庫設計

### 4.1 PostgreSQL Schema

#### 4.1.1 用戶相關表
```sql
-- 用戶基本資料
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    keycloak_id VARCHAR(255),
    discord_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 用戶檔案
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

-- 用戶媒體檔案
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

#### 4.1.2 社交互動表
```sql
-- 按讚記錄
CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    liker_id UUID REFERENCES users(id) ON DELETE CASCADE,
    liked_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(liker_id, liked_id)
);

-- 追蹤關係
CREATE TABLE follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

-- 配對記錄
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user2_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'matched', 'rejected'
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user1_id, user2_id)
);
```

#### 4.1.3 聊天相關表
```sql
-- 聊天室
CREATE TABLE chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) DEFAULT 'private', -- 'private', 'group'
    name VARCHAR(100),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 聊天室成員
CREATE TABLE chat_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT NOW(),
    last_read_at TIMESTAMP,
    UNIQUE(room_id, user_id)
);

-- 訊息記錄
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

### 4.2 Redis資料結構
```
# 用戶會話
user:session:{user_id} -> {session_data}

# 在線用戶
online:users -> Set of user_ids

# 聊天室在線用戶
room:{room_id}:online -> Set of user_ids

# 未讀訊息計數
user:{user_id}:unread -> Hash {room_id: count}

# 快取用戶資料
user:profile:{user_id} -> {profile_json}

# 配對推薦快取
user:{user_id}:recommendations -> List of user_ids
```

## 5. 安全架構

### 5.1 認證與授權
- **JWT Token**: 無狀態認證機制
- **Refresh Token**: 長期有效的刷新令牌
- **OAuth 2.0**: 第三方登入整合
- **RBAC**: 角色基礎存取控制

### 5.2 資料安全
- **加密存儲**: 敏感資料AES-256加密
- **傳輸加密**: TLS 1.3全站加密
- **密碼安全**: bcrypt雜湊 + salt
- **API安全**: Rate limiting + CORS設定

### 5.3 隱私保護
- **資料最小化**: 只收集必要資料
- **匿名化**: 敏感資料匿名化處理
- **存取控制**: 細粒度權限控制
- **審計日誌**: 完整的操作記錄

## 6. 效能優化

### 6.1 前端優化
- **代碼分割**: React.lazy + Suspense
- **圖片優化**: WebP格式 + 懶加載
- **快取策略**: Service Worker + HTTP快取
- **CDN**: 靜態資源CDN分發

### 6.2 後端優化
- **資料庫索引**: 查詢效能優化
- **連接池**: 資料庫連接池管理
- **快取層**: Redis多層快取
- **負載平衡**: 水平擴展支援

### 6.3 監控與告警
- **APM**: 應用效能監控
- **指標監控**: Prometheus + Grafana 指標收集與可視化
- **日誌聚合**: Grafana Loki + Promtail 日誌收集與分析
- **錯誤追蹤**: Sentry 錯誤監控與告警
- **健康檢查**: 服務健康狀態監控
- **告警系統**: Grafana Alerting 異常情況即時通知
- **統一監控**: 指標、日誌、追蹤統一在 Grafana 平台

## 7. 部署架構

### 7.1 容器化
```dockerfile
# Node.js服務Dockerfile範例
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### 7.2 Kubernetes部署
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

### 7.3 CI/CD流程
```yaml
# GitHub Actions範例
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

## 8. 擴展性考量

### 8.1 水平擴展
- **無狀態服務**: 所有服務設計為無狀態
- **資料庫分片**: 用戶資料水平分片
- **快取分散**: Redis Cluster部署
- **CDN**: 全球CDN節點部署

### 8.2 垂直擴展
- **資源監控**: CPU、記憶體使用率監控
- **自動擴展**: Kubernetes HPA自動擴展
- **效能調優**: 定期效能分析和優化

## 9. 災難恢復

### 9.1 備份策略
- **資料庫備份**: 每日全量 + 實時增量備份
- **檔案備份**: 媒體檔案異地備份
- **配置備份**: 系統配置版本控制

### 9.2 恢復計劃
- **RTO**: 恢復時間目標 < 4小時
- **RPO**: 恢復點目標 < 1小時
- **故障轉移**: 自動故障轉移機制
- **演練計劃**: 定期災難恢復演練

## 10. 後台管理系統架構

### 10.1 管理後台概述
後台管理系統是 MKing Friend 平台的核心管理工具，為管理員提供全面的平台監控、用戶管理、內容審核和系統配置功能。

### 10.2 管理後台架構設計

#### 10.2.1 前端架構
- **技術棧**: React 18+ + TypeScript + Ant Design Pro
- **狀態管理**: Zustand + React Query
- **路由管理**: React Router v6
- **構建工具**: Vite + pnpm
- **UI框架**: Ant Design Pro (專業的後台管理解決方案)

#### 10.2.2 後端服務 (Admin Service)
- **職責**: 管理員認證、權限控制、數據統計、系統配置
- **技術**: Node.js + NestJS + TypeScript + Prisma ORM
- **資料庫**: PostgreSQL (管理數據) + Redis (快取)
- **API設計**: RESTful API + GraphQL (複雜查詢)

### 10.3 核心功能模組

#### 10.3.1 儀表板模組
```
┌─────────────────────────────────────────────────────────┐
│                    管理儀表板                           │
├─────────────────┬─────────────────┬─────────────────────┤
│   實時統計      │   用戶活躍度    │    系統健康狀態     │
│ • 在線用戶數    │ • 日活躍用戶    │  • 服務狀態監控     │
│ • 新註冊用戶    │ • 月活躍用戶    │  • 資源使用率       │
│ • 訊息發送量    │ • 用戶留存率    │  • 錯誤率統計       │
└─────────────────┴─────────────────┴─────────────────────┘
```

#### 10.3.2 用戶管理模組
```
┌─────────────────────────────────────────────────────────┐
│                    用戶管理                             │
├─────────────────┬─────────────────┬─────────────────────┤
│   用戶列表      │   用戶詳情      │    用戶操作         │
│ • 搜索過濾      │ • 基本資料      │  • 封禁/解封        │
│ • 批量操作      │ • 活動記錄      │  • 權限調整         │
│ • 導出數據      │ • 舉報記錄      │  • 數據修改         │
└─────────────────┴─────────────────┴─────────────────────┘
```

#### 10.3.3 內容審核模組
```
┌─────────────────────────────────────────────────────────┐
│                    內容審核                             │
├─────────────────┬─────────────────┬─────────────────────┤
│   待審核內容    │   審核工具      │    審核記錄         │
│ • 文本內容      │ • 批量審核      │  • 審核歷史         │
│ • 圖片內容      │ • 自動標記      │  • 審核員績效       │
│ • 用戶舉報      │ • 審核規則      │  • 申訴處理         │
└─────────────────┴─────────────────┴─────────────────────┘
```

### 10.4 權限控制系統

#### 10.4.1 角色定義
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

#### 10.4.2 權限矩陣
| 角色 | 用戶管理 | 內容審核 | 系統配置 | 數據分析 | 客服管理 |
|------|----------|----------|----------|----------|----------|
| 超級管理員 | ✅ 全部 | ✅ 全部 | ✅ 全部 | ✅ 全部 | ✅ 全部 |
| 管理員 | ✅ 查看/編輯 | ✅ 全部 | ❌ 只讀 | ✅ 全部 | ✅ 全部 |
| 審核員 | ❌ 只讀 | ✅ 審核 | ❌ 無 | ❌ 基礎 | ✅ 處理 |
| 客服 | ❌ 基礎 | ❌ 舉報 | ❌ 無 | ❌ 基礎 | ✅ 全部 |

### 10.5 API 設計

#### 10.5.1 管理員 API
```
# 管理員認證
POST   /api/admin/v1/auth/login
POST   /api/admin/v1/auth/logout
POST   /api/admin/v1/auth/refresh

# 用戶管理
GET    /api/admin/v1/users
GET    /api/admin/v1/users/:id
PUT    /api/admin/v1/users/:id/status
POST   /api/admin/v1/users/:id/ban
DELETE /api/admin/v1/users/:id/ban

# 內容審核
GET    /api/admin/v1/content/pending
POST   /api/admin/v1/content/:id/approve
POST   /api/admin/v1/content/:id/reject
GET    /api/admin/v1/reports
PUT    /api/admin/v1/reports/:id/status

# 系統統計
GET    /api/admin/v1/stats/dashboard
GET    /api/admin/v1/stats/users
GET    /api/admin/v1/stats/content
GET    /api/admin/v1/stats/system
```

### 10.6 安全設計

#### 10.6.1 認證機制
- **雙因子認證**: 管理員登入必須啟用 2FA
- **IP 白名單**: 限制管理後台訪問 IP
- **會話管理**: 短期會話超時 + 強制重新認證
- **操作日誌**: 所有管理操作完整記錄

#### 10.6.2 數據安全
- **敏感數據脫敏**: 用戶隱私數據在管理後台中脫敏顯示
- **操作審計**: 所有數據修改操作記錄審計日誌
- **權限最小化**: 按需分配最小權限原則
- **數據備份**: 管理操作前自動備份關鍵數據

### 10.7 監控與告警

#### 10.7.1 系統監控
- **服務健康檢查**: 實時監控各微服務狀態
- **性能指標**: API 響應時間、錯誤率、吞吐量
- **資源監控**: CPU、內存、磁盤、網絡使用率
- **業務指標**: 用戶活躍度、內容審核效率

#### 10.7.2 告警機制
- **即時告警**: 系統異常立即通知管理員
- **告警等級**: 緊急、重要、一般三個等級
- **通知渠道**: 郵件、短信、Slack、企業微信
- **告警處理**: 告警確認、處理狀態追蹤

### 10.8 部署架構

#### 10.8.1 容器化部署
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

#### 10.8.2 網絡隔離
- **VPN 訪問**: 管理後台僅通過 VPN 訪問
- **防火牆規則**: 嚴格的入站規則配置
- **SSL/TLS**: 強制 HTTPS 加密傳輸
- **網絡分段**: 管理網絡與業務網絡隔離

### 10.9 擴展性設計

#### 10.9.1 模組化架構
- **插件系統**: 支援第三方插件擴展
- **微前端**: 各功能模組獨立開發部署
- **API 版本控制**: 向後兼容的 API 設計
- **配置驅動**: 通過配置文件控制功能開關

#### 10.9.2 國際化支援
- **多語言**: 支援中文、英文等多語言
- **時區處理**: 自動處理不同時區顯示
- **本地化**: 日期、數字格式本地化
- **RTL 支援**: 支援右到左語言顯示