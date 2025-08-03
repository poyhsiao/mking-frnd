# MKing Friend - 資料庫設計文檔

## 1. 資料庫概覽

### 1.1 設計原則
- **正規化**: 遵循第三正規化原則，減少資料冗餘
- **效能優化**: 適當的反正規化以提升查詢效能
- **擴展性**: 支援水平和垂直擴展
- **安全性**: 敏感資料加密，存取控制
- **版本控制**: 使用 Prisma 進行 schema 版本管理

### 1.2 技術選擇
- **主資料庫**: PostgreSQL 14+
- **快取資料庫**: Redis 7+
- **ORM**: Prisma 5+
- **遷移工具**: Prisma Migrate
- **備份策略**: 每日自動備份 + 即時複製

### 1.3 命名規範
- **資料表**: snake_case (例: user_profiles)
- **欄位**: snake_case (例: created_at)
- **索引**: idx_tablename_columnname
- **外鍵**: fk_tablename_columnname
- **約束**: ck_tablename_columnname

## 2. 核心資料表設計

### 2.1 用戶系統

#### 2.1.1 users 表
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- 可為空，支援 OAuth 用戶
    email_verified BOOLEAN DEFAULT FALSE,
    phone VARCHAR(20),
    phone_verified BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active', -- active, suspended, deleted
    last_login_at TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);
```

#### 2.1.2 user_profiles 表
```sql
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(100) NOT NULL,
    bio TEXT,
    birth_date DATE,
    gender VARCHAR(20), -- male, female, other, prefer_not_to_say
    location_city VARCHAR(100),
    location_country VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    height INTEGER, -- 身高 (cm)
    education VARCHAR(100),
    occupation VARCHAR(100),
    relationship_status VARCHAR(50), -- single, divorced, widowed, etc.
    looking_for VARCHAR(50), -- friendship, dating, serious_relationship
    avatar_url VARCHAR(500),
    is_verified BOOLEAN DEFAULT FALSE,
    is_premium BOOLEAN DEFAULT FALSE,
    privacy_level VARCHAR(20) DEFAULT 'public', -- public, friends, private
    show_distance BOOLEAN DEFAULT TRUE,
    show_age BOOLEAN DEFAULT TRUE,
    show_last_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE UNIQUE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_gender ON user_profiles(gender);
CREATE INDEX idx_user_profiles_location ON user_profiles(location_city, location_country);
CREATE INDEX idx_user_profiles_age ON user_profiles(birth_date);
CREATE INDEX idx_user_profiles_coordinates ON user_profiles(latitude, longitude);
```

#### 2.1.3 user_photos 表
```sql
CREATE TABLE user_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    is_primary BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    file_size INTEGER, -- bytes
    width INTEGER,
    height INTEGER,
    content_type VARCHAR(50)
);

-- 索引
CREATE INDEX idx_user_photos_user_id ON user_photos(user_id);
CREATE INDEX idx_user_photos_primary ON user_photos(user_id, is_primary);
CREATE INDEX idx_user_photos_order ON user_photos(user_id, display_order);
```

#### 2.1.4 user_interests 表
```sql
CREATE TABLE interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50), -- sports, music, travel, food, etc.
    icon_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    interest_id UUID NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, interest_id)
);

-- 索引
CREATE INDEX idx_user_interests_user_id ON user_interests(user_id);
CREATE INDEX idx_user_interests_interest_id ON user_interests(interest_id);
```

### 2.2 認證系統

#### 2.2.1 oauth_accounts 表
```sql
CREATE TABLE oauth_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- keycloak, email, line
    provider_user_id VARCHAR(255) NOT NULL,
    provider_email VARCHAR(255),
    provider_data JSONB, -- 儲存額外的 OAuth 資料
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(provider, provider_user_id)
);

-- 索引
CREATE INDEX idx_oauth_accounts_user_id ON oauth_accounts(user_id);
CREATE INDEX idx_oauth_accounts_provider ON oauth_accounts(provider, provider_user_id);
```

#### 2.2.2 user_sessions 表
```sql
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    device_info JSONB, -- 裝置資訊
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(token_hash);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
```

### 2.3 社交互動系統

#### 2.3.1 user_likes 表
```sql
CREATE TABLE user_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    liker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    liked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    like_type VARCHAR(20) DEFAULT 'like', -- like, super_like, pass
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(liker_id, liked_id),
    CHECK(liker_id != liked_id)
);

-- 索引
CREATE INDEX idx_user_likes_liker ON user_likes(liker_id);
CREATE INDEX idx_user_likes_liked ON user_likes(liked_id);
CREATE INDEX idx_user_likes_type ON user_likes(like_type);
CREATE INDEX idx_user_likes_created ON user_likes(created_at);
```

#### 2.3.2 user_matches 表
```sql
CREATE TABLE user_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    matched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'active', -- active, unmatched, blocked
    unmatched_by UUID REFERENCES users(id),
    unmatched_at TIMESTAMP WITH TIME ZONE,
    CHECK(user1_id < user2_id), -- 確保順序一致
    UNIQUE(user1_id, user2_id)
);

-- 索引
CREATE INDEX idx_user_matches_user1 ON user_matches(user1_id);
CREATE INDEX idx_user_matches_user2 ON user_matches(user2_id);
CREATE INDEX idx_user_matches_status ON user_matches(status);
CREATE INDEX idx_user_matches_date ON user_matches(matched_at);
```

#### 2.3.3 user_follows 表
```sql
CREATE TABLE user_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK(follower_id != following_id)
);

-- 索引
CREATE INDEX idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON user_follows(following_id);
```

#### 2.3.4 user_blocks 表
```sql
CREATE TABLE user_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id),
    CHECK(blocker_id != blocked_id)
);

-- 索引
CREATE INDEX idx_user_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX idx_user_blocks_blocked ON user_blocks(blocked_id);
```

### 2.4 聊天系統

#### 2.4.1 conversations 表
```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) DEFAULT 'direct', -- direct, group
    title VARCHAR(255), -- 群組聊天標題
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE
);

-- 索引
CREATE INDEX idx_conversations_type ON conversations(type);
CREATE INDEX idx_conversations_updated ON conversations(updated_at);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at);
```

#### 2.4.2 conversation_participants 表
```sql
CREATE TABLE conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member', -- admin, member
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    last_read_at TIMESTAMP WITH TIME ZONE,
    is_muted BOOLEAN DEFAULT FALSE,
    UNIQUE(conversation_id, user_id)
);

-- 索引
CREATE INDEX idx_conversation_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX idx_conversation_participants_user ON conversation_participants(user_id);
CREATE INDEX idx_conversation_participants_active ON conversation_participants(conversation_id, user_id) WHERE left_at IS NULL;
```

#### 2.4.3 messages 表
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT,
    message_type VARCHAR(20) DEFAULT 'text', -- text, image, video, audio, file, system
    media_url VARCHAR(500),
    media_metadata JSONB, -- 媒體檔案的額外資訊
    reply_to_id UUID REFERENCES messages(id),
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_type ON messages(message_type);
CREATE INDEX idx_messages_reply ON messages(reply_to_id);
```

#### 2.4.4 message_reactions 表
```sql
CREATE TABLE message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

-- 索引
CREATE INDEX idx_message_reactions_message ON message_reactions(message_id);
CREATE INDEX idx_message_reactions_user ON message_reactions(user_id);
```

### 2.5 通知系統

#### 2.5.1 notifications 表
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- like, match, message, follow, etc.
    title VARCHAR(255) NOT NULL,
    content TEXT,
    data JSONB, -- 額外的通知資料
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- 索引
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_expires ON notifications(expires_at);
```

#### 2.5.2 push_tokens 表
```sql
CREATE TABLE push_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    platform VARCHAR(20) NOT NULL, -- ios, android, web
    device_id VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(token)
);

-- 索引
CREATE INDEX idx_push_tokens_user ON push_tokens(user_id);
CREATE INDEX idx_push_tokens_active ON push_tokens(is_active) WHERE is_active = TRUE;
```

### 2.6 內容管理

#### 2.6.1 posts 表
```sql
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT,
    media_urls TEXT[], -- 多媒體檔案 URLs
    media_metadata JSONB,
    visibility VARCHAR(20) DEFAULT 'public', -- public, friends, private
    is_pinned BOOLEAN DEFAULT FALSE,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_posts_user ON posts(user_id, created_at);
CREATE INDEX idx_posts_visibility ON posts(visibility, created_at);
CREATE INDEX idx_posts_pinned ON posts(user_id, is_pinned) WHERE is_pinned = TRUE;
```

#### 2.6.2 post_likes 表
```sql
CREATE TABLE post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- 索引
CREATE INDEX idx_post_likes_post ON post_likes(post_id);
CREATE INDEX idx_post_likes_user ON post_likes(user_id);
```

#### 2.6.3 comments 表
```sql
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id), -- 回覆留言
    content TEXT NOT NULL,
    like_count INTEGER DEFAULT 0,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_comments_post ON comments(post_id, created_at);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);
```

### 2.7 舉報和安全

#### 2.7.1 reports 表
```sql
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES users(id),
    reported_user_id UUID REFERENCES users(id),
    reported_post_id UUID REFERENCES posts(id),
    reported_message_id UUID REFERENCES messages(id),
    report_type VARCHAR(50) NOT NULL, -- spam, harassment, inappropriate_content, fake_profile
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- pending, investigating, resolved, dismissed
    admin_notes TEXT,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (
        (reported_user_id IS NOT NULL AND reported_post_id IS NULL AND reported_message_id IS NULL) OR
        (reported_user_id IS NULL AND reported_post_id IS NOT NULL AND reported_message_id IS NULL) OR
        (reported_user_id IS NULL AND reported_post_id IS NULL AND reported_message_id IS NOT NULL)
    )
);

-- 索引
CREATE INDEX idx_reports_reporter ON reports(reporter_id);
CREATE INDEX idx_reports_reported_user ON reports(reported_user_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_type ON reports(report_type);
```

### 2.8 系統設定

#### 2.8.1 app_settings 表
```sql
CREATE TABLE app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    data_type VARCHAR(20) DEFAULT 'string', -- string, number, boolean, json
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE, -- 是否可以被前端存取
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_app_settings_key ON app_settings(key);
CREATE INDEX idx_app_settings_public ON app_settings(is_public) WHERE is_public = TRUE;
```

#### 2.8.2 user_settings 表
```sql
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, setting_key)
);

-- 索引
CREATE INDEX idx_user_settings_user ON user_settings(user_id);
CREATE INDEX idx_user_settings_key ON user_settings(setting_key);
```

## 3. Redis 資料結構設計

### 3.1 快取策略

#### 3.1.1 用戶資料快取
```
# 用戶基本資料
user:profile:{user_id} -> JSON (TTL: 1小時)

# 用戶在線狀態
user:online:{user_id} -> timestamp (TTL: 5分鐘)

# 用戶偏好設定
user:preferences:{user_id} -> JSON (TTL: 24小時)
```

#### 3.1.2 社交關係快取
```
# 用戶的按讚列表
user:likes:{user_id} -> SET (TTL: 30分鐘)

# 用戶的配對列表
user:matches:{user_id} -> ZSET (score: timestamp, TTL: 1小時)

# 用戶的追蹤者
user:followers:{user_id} -> SET (TTL: 1小時)

# 用戶的追蹤中
user:following:{user_id} -> SET (TTL: 1小時)
```

#### 3.1.3 聊天相關快取
```
# 對話參與者
conversation:participants:{conversation_id} -> SET (TTL: 1小時)

# 未讀訊息計數
user:unread:{user_id} -> HASH {conversation_id: count} (TTL: 24小時)

# 最近訊息
conversation:recent:{conversation_id} -> LIST (最多100條, TTL: 1小時)
```

#### 3.1.4 推薦系統快取
```
# 用戶推薦列表
user:recommendations:{user_id} -> ZSET (score: 推薦分數, TTL: 6小時)

# 熱門用戶
hot:users -> ZSET (score: 活躍度, TTL: 1小時)

# 地理位置索引
geo:users -> GEOSPATIAL (TTL: 30分鐘)
```

### 3.2 會話管理

#### 3.2.1 用戶會話
```
# JWT Token 黑名單
token:blacklist:{token_hash} -> 1 (TTL: token過期時間)

# 用戶活躍會話
user:sessions:{user_id} -> SET {session_id} (TTL: 30天)

# 會話資訊
session:{session_id} -> JSON (TTL: 30天)
```

#### 3.2.2 即時通訊
```
# Socket 連線映射
socket:user:{user_id} -> SET {socket_id} (TTL: 1小時)

# Socket 資訊
socket:{socket_id} -> JSON {user_id, room_id, connected_at} (TTL: 1小時)

# 房間成員
room:{room_id} -> SET {user_id} (TTL: 1小時)
```

### 3.3 限流和安全

#### 3.3.1 API 限流
```
# 用戶 API 請求計數
rate_limit:user:{user_id}:{endpoint} -> COUNT (TTL: 1分鐘/1小時)

# IP 限流
rate_limit:ip:{ip_address} -> COUNT (TTL: 1分鐘)

# 登入嘗試限制
login_attempts:{email} -> COUNT (TTL: 15分鐘)
```

#### 3.3.2 安全監控
```
# 可疑活動
suspicious:user:{user_id} -> LIST (TTL: 24小時)

# 失敗登入記錄
failed_logins:{ip} -> LIST (TTL: 1小時)
```

## 4. 資料庫版本控制

### 4.1 Prisma Schema 設計

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id              String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email           String    @unique @db.VarChar(255)
  passwordHash    String?   @map("password_hash") @db.VarChar(255)
  emailVerified   Boolean   @default(false) @map("email_verified")
  phone           String?   @db.VarChar(20)
  phoneVerified   Boolean   @default(false) @map("phone_verified")
  status          UserStatus @default(ACTIVE)
  lastLoginAt     DateTime? @map("last_login_at") @db.Timestamptz
  loginCount      Int       @default(0) @map("login_count")
  createdAt       DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt       DateTime  @updatedAt @map("updated_at") @db.Timestamptz

  // Relations
  profile         UserProfile?
  photos          UserPhoto[]
  interests       UserInterest[]
  oauthAccounts   OAuthAccount[]
  sessions        UserSession[]
  
  // Social relations
  likesGiven      UserLike[] @relation("LikesGiven")
  likesReceived   UserLike[] @relation("LikesReceived")
  matchesAsUser1  UserMatch[] @relation("MatchUser1")
  matchesAsUser2  UserMatch[] @relation("MatchUser2")
  following       UserFollow[] @relation("Following")
  followers       UserFollow[] @relation("Followers")
  blocking        UserBlock[] @relation("Blocking")
  blockedBy       UserBlock[] @relation("BlockedBy")
  
  // Content
  posts           Post[]
  postLikes       PostLike[]
  comments        Comment[]
  
  // Chat
  sentMessages    Message[]
  conversations   ConversationParticipant[]
  
  // Notifications
  notifications   Notification[]
  pushTokens      PushToken[]
  
  // Reports
  reportsGiven    Report[] @relation("ReportsGiven")
  reportsReceived Report[] @relation("ReportsReceived")
  
  // Settings
  settings        UserSetting[]

  @@map("users")
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  DELETED
  
  @@map("user_status")
}

// ... 其他模型定義
```

### 4.2 遷移策略

#### 4.2.1 遷移命名規範
```
# 格式: YYYYMMDD_HHMMSS_description
20240101_120000_init_user_system
20240102_100000_add_user_photos
20240103_150000_create_chat_system
20240104_090000_add_notifications
```

#### 4.2.2 遷移腳本範例
```sql
-- Migration: 20240101_120000_init_user_system
-- Description: 初始化用戶系統相關表格

BEGIN;

-- 建立用戶表
CREATE TABLE users (
    -- ... 如上所述
);

-- 建立索引
CREATE INDEX idx_users_email ON users(email);
-- ... 其他索引

-- 插入預設資料
INSERT INTO app_settings (key, value, data_type, description, is_public) VALUES
('app_name', 'MKing Friend', 'string', '應用程式名稱', true),
('max_photos_per_user', '10', 'number', '每個用戶最多照片數', false);

COMMIT;
```

#### 4.2.3 回滾策略
```sql
-- Rollback: 20240101_120000_init_user_system
-- Description: 回滾用戶系統初始化

BEGIN;

-- 刪除設定
DELETE FROM app_settings WHERE key IN ('app_name', 'max_photos_per_user');

-- 刪除表格 (注意順序，先刪除有外鍵的表)
DROP TABLE IF EXISTS user_interests;
DROP TABLE IF EXISTS interests;
DROP TABLE IF EXISTS user_photos;
DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS oauth_accounts;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS users;

COMMIT;
```

### 4.3 資料庫環境管理

#### 4.3.1 環境配置
```bash
# .env.development
DATABASE_URL="postgresql://user:password@localhost:5432/mking_friend_dev"
REDIS_URL="redis://localhost:6379/0"

# .env.test
DATABASE_URL="postgresql://user:password@localhost:5432/mking_friend_test"
REDIS_URL="redis://localhost:6379/1"

# .env.production
DATABASE_URL="postgresql://user:password@prod-db:5432/mking_friend_prod"
REDIS_URL="redis://prod-redis:6379/0"
```

#### 4.3.2 種子資料
```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 建立預設興趣標籤
  const interests = [
    { name: '音樂', category: 'entertainment' },
    { name: '電影', category: 'entertainment' },
    { name: '旅行', category: 'lifestyle' },
    { name: '美食', category: 'lifestyle' },
    { name: '運動', category: 'sports' },
    { name: '閱讀', category: 'education' },
  ];

  for (const interest of interests) {
    await prisma.interest.upsert({
      where: { name: interest.name },
      update: {},
      create: interest,
    });
  }

  // 建立測試用戶 (僅開發環境)
  if (process.env.NODE_ENV === 'development') {
    await createTestUsers();
  }
}

async function createTestUsers() {
  // 建立測試用戶的邏輯
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

## 5. 效能優化

### 5.1 索引策略

#### 5.1.1 複合索引
```sql
-- 用戶搜尋優化
CREATE INDEX idx_user_search ON user_profiles(gender, location_city, birth_date);

-- 聊天訊息查詢優化
CREATE INDEX idx_messages_conversation_time ON messages(conversation_id, created_at DESC);

-- 通知查詢優化
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);
```

#### 5.1.2 部分索引
```sql
-- 只索引活躍用戶
CREATE INDEX idx_active_users ON users(created_at) WHERE status = 'active';

-- 只索引未讀通知
CREATE INDEX idx_unread_notifications ON notifications(user_id, created_at) WHERE is_read = false;
```

### 5.2 查詢優化

#### 5.2.1 分頁查詢
```sql
-- 使用 cursor-based 分頁而非 offset
SELECT * FROM users 
WHERE created_at < $1 
ORDER BY created_at DESC 
LIMIT 20;
```

#### 5.2.2 預載入關聯
```typescript
// 使用 Prisma 的 include 預載入關聯資料
const users = await prisma.user.findMany({
  include: {
    profile: true,
    photos: {
      where: { isPrimary: true },
      take: 1
    },
    interests: {
      include: {
        interest: true
      }
    }
  },
  take: 20
});
```

### 5.3 資料分割

#### 5.3.1 水平分割 (Sharding)
```sql
-- 按用戶 ID 分割訊息表
CREATE TABLE messages_shard_1 (
    CHECK (hashtext(conversation_id::text) % 4 = 0)
) INHERITS (messages);

CREATE TABLE messages_shard_2 (
    CHECK (hashtext(conversation_id::text) % 4 = 1)
) INHERITS (messages);
```

#### 5.3.2 垂直分割
```sql
-- 將大型欄位分離到單獨的表
CREATE TABLE user_profile_extended (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    bio TEXT,
    detailed_preferences JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 6. 備份和災難恢復

### 6.1 備份策略

#### 6.1.1 自動備份腳本
```bash
#!/bin/bash
# backup.sh

DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/backups/postgresql"
DB_NAME="mking_friend_prod"

# 建立備份目錄
mkdir -p $BACKUP_DIR

# 執行備份
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# 刪除 7 天前的備份
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

# 上傳到雲端儲存
# 備份到 MinIO
docker-compose exec minio mc cp $BACKUP_DIR/backup_$DATE.sql.gz minio/mking-files/backups/
```

#### 6.1.2 即時複製設定
```sql
-- 設定 PostgreSQL 串流複製
-- 在 postgresql.conf
wal_level = replica
max_wal_senders = 3
wal_keep_segments = 64

-- 在 pg_hba.conf
host replication replicator 10.0.0.0/8 md5
```

### 6.2 災難恢復計劃

#### 6.2.1 恢復程序
1. **評估損害程度**
2. **啟動備用系統**
3. **恢復資料庫**
4. **驗證資料完整性**
5. **切換流量**
6. **監控系統狀態**

#### 6.2.2 恢復腳本
```bash
#!/bin/bash
# restore.sh

BACKUP_FILE=$1
DB_NAME="mking_friend_prod"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

# 停止應用服務
sudo systemctl stop mking-friend-api

# 刪除現有資料庫
dropdb $DB_NAME

# 建立新資料庫
createdb $DB_NAME

# 恢復資料
gunzip -c $BACKUP_FILE | psql -d $DB_NAME

# 啟動應用服務
sudo systemctl start mking-friend-api

echo "Database restored successfully"
```

## 7. 監控和維護

### 7.1 效能監控

#### 7.1.1 關鍵指標
- **連線數**: 監控資料庫連線使用情況
- **查詢時間**: 追蹤慢查詢
- **鎖等待**: 監控資料庫鎖競爭
- **磁碟使用**: 監控儲存空間
- **記憶體使用**: 監控快取命中率

#### 7.1.2 監控查詢
```sql
-- 查看慢查詢
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- 查看資料庫大小
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 7.2 定期維護

#### 7.2.1 清理任務
```sql
-- 清理過期的會話
DELETE FROM user_sessions WHERE expires_at < NOW();

-- 清理過期的通知
DELETE FROM notifications WHERE expires_at < NOW();

-- 清理軟刪除的訊息 (30天後)
DELETE FROM messages 
WHERE is_deleted = true 
AND deleted_at < NOW() - INTERVAL '30 days';
```

#### 7.2.2 統計更新
```sql
-- 更新資料庫統計資訊
ANALYZE;

-- 重建索引 (必要時)
REINDEX INDEX CONCURRENTLY idx_messages_conversation_time;
```

這個資料庫設計文檔提供了完整的資料模型、索引策略、版本控制和維護方案，確保 MKing Friend 平台能夠支援高效能、高可用性的服務。