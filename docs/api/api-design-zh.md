# MKing Friend - API 設計文檔

## 1. API 設計原則

### 1.1 設計理念
- **RESTful 設計**: 遵循 REST 架構原則
- **一致性**: 統一的命名規範和回應格式
- **版本控制**: 支援 API 版本管理
- **安全性**: 完整的認證和授權機制
- **效能**: 支援分頁、快取和壓縮
- **文檔化**: 完整的 API 文檔和範例

### 1.2 基礎規範

#### 1.2.1 URL 設計
```
# 基礎 URL 格式
https://api.mkingfriend.com/v1/{resource}

# 範例
GET    /v1/users              # 獲取用戶列表
GET    /v1/users/{id}         # 獲取特定用戶
POST   /v1/users              # 建立新用戶
PUT    /v1/users/{id}         # 更新用戶
DELETE /v1/users/{id}         # 刪除用戶

# 巢狀資源
GET    /v1/users/{id}/photos  # 獲取用戶照片
POST   /v1/users/{id}/photos  # 上傳用戶照片
```

#### 1.2.2 HTTP 方法
- **GET**: 獲取資源
- **POST**: 建立資源
- **PUT**: 完整更新資源
- **PATCH**: 部分更新資源
- **DELETE**: 刪除資源

#### 1.2.3 狀態碼
- **200 OK**: 請求成功
- **201 Created**: 資源建立成功
- **204 No Content**: 請求成功但無內容回傳
- **400 Bad Request**: 請求參數錯誤
- **401 Unauthorized**: 未認證
- **403 Forbidden**: 無權限
- **404 Not Found**: 資源不存在
- **409 Conflict**: 資源衝突
- **422 Unprocessable Entity**: 驗證失敗
- **429 Too Many Requests**: 請求過於頻繁
- **500 Internal Server Error**: 伺服器錯誤

### 1.3 回應格式

#### 1.3.1 成功回應
```json
{
  "success": true,
  "data": {
    // 實際資料
  },
  "meta": {
    "timestamp": "2024-01-01T12:00:00Z",
    "version": "1.0.0"
  }
}
```

#### 1.3.2 分頁回應
```json
{
  "success": true,
  "data": [
    // 資料陣列
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  },
  "meta": {
    "timestamp": "2024-01-01T12:00:00Z",
    "version": "1.0.0"
  }
}
```

#### 1.3.3 錯誤回應
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "輸入資料驗證失敗",
    "details": [
      {
        "field": "email",
        "message": "Email 格式不正確"
      }
    ]
  },
  "meta": {
    "timestamp": "2024-01-01T12:00:00Z",
    "version": "1.0.0",
    "requestId": "req_123456789"
  }
}
```

## 2. 認證和授權

### 2.1 JWT 認證

#### 2.1.1 Token 格式
```
Authorization: Bearer <JWT_TOKEN>
```

#### 2.1.2 JWT Payload
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "user",
  "iat": 1640995200,
  "exp": 1641081600,
  "jti": "token_id"
}
```

#### 2.1.3 Token 刷新
```http
POST /v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh_token_here"
}
```

### 2.2 OAuth 整合

#### 2.2.1 Keycloak OAuth
```http
# 取得授權 URL
GET /v1/auth/keycloak/url

# 回應
{
  "success": true,
  "data": {
    "authUrl": "http://keycloak:8080/realms/mking/protocol/openid-connect/auth?...",
    "state": "random_state_string"
  }
}

# 處理回調
POST /v1/auth/keycloak/callback
Content-Type: application/json

{
  "code": "authorization_code",
  "state": "random_state_string"
}
```

#### 2.2.2 Line OAuth
```http
# 取得授權 URL
GET /v1/auth/line/url

# 處理回調
POST /v1/auth/line/callback
Content-Type: application/json

{
  "code": "authorization_code",
  "state": "random_state_string"
}
```

## 3. 用戶管理 API

### 3.1 用戶註冊和登入

#### 3.1.1 用戶註冊
```http
POST /v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "displayName": "張小美",
  "birthDate": "1995-05-15",
  "gender": "female",
  "agreeToTerms": true
}

# 回應
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "emailVerified": false,
      "profile": {
        "displayName": "張小美",
        "birthDate": "1995-05-15",
        "gender": "female"
      }
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token",
      "expiresIn": 3600
    }
  }
}
```

#### 3.1.2 用戶登入
```http
POST /v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "rememberMe": true
}

# 回應
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "profile": {
        "displayName": "張小美",
        "avatarUrl": "https://cdn.example.com/avatar.jpg"
      }
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token",
      "expiresIn": 3600
    }
  }
}
```

#### 3.1.3 用戶登出
```http
POST /v1/auth/logout
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "refreshToken": "jwt_refresh_token"
}

# 回應
{
  "success": true,
  "data": {
    "message": "登出成功"
  }
}
```

### 3.2 用戶資料管理

#### 3.2.1 獲取用戶資料
```http
GET /v1/users/me
Authorization: Bearer <JWT_TOKEN>

# 回應
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "profile": {
      "displayName": "張小美",
      "bio": "喜歡旅行和美食的女孩",
      "birthDate": "1995-05-15",
      "age": 28,
      "gender": "female",
      "location": {
        "city": "台北市",
        "country": "台灣"
      },
      "avatarUrl": "https://cdn.example.com/avatar.jpg",
      "photos": [
        {
          "id": "photo_1",
          "url": "https://cdn.example.com/photo1.jpg",
          "isPrimary": true,
          "order": 0
        }
      ],
      "interests": [
        {
          "id": "interest_1",
          "name": "旅行",
          "category": "lifestyle"
        }
      ]
    },
    "settings": {
      "privacyLevel": "public",
      "showDistance": true,
      "showAge": true
    }
  }
}
```

#### 3.2.2 更新用戶資料
```http
PUT /v1/users/me/profile
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "displayName": "張小美",
  "bio": "更新後的自我介紹",
  "location": {
    "city": "新北市",
    "country": "台灣"
  },
  "interests": ["interest_1", "interest_2"]
}

# 回應
{
  "success": true,
  "data": {
    "profile": {
      // 更新後的資料
    }
  }
}
```

#### 3.2.3 上傳用戶照片
```http
POST /v1/users/me/photos
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data

# Form data:
# file: [image file]
# isPrimary: true
# order: 0

# 回應
{
  "success": true,
  "data": {
    "photo": {
      "id": "photo_123",
      "url": "https://cdn.example.com/photo123.jpg",
      "thumbnailUrl": "https://cdn.example.com/thumb123.jpg",
      "isPrimary": true,
      "order": 0,
      "uploadDate": "2024-01-01T12:00:00Z"
    }
  }
}
```

### 3.3 用戶搜尋和瀏覽

#### 3.3.1 瀏覽用戶
```http
GET /v1/users/discover?page=1&limit=20&gender=female&minAge=25&maxAge=35&city=台北市
Authorization: Bearer <JWT_TOKEN>

# 回應
{
  "success": true,
  "data": [
    {
      "id": "user_456",
      "profile": {
        "displayName": "李小花",
        "age": 27,
        "avatarUrl": "https://cdn.example.com/avatar456.jpg",
        "photos": [
          {
            "url": "https://cdn.example.com/photo456.jpg",
            "isPrimary": true
          }
        ],
        "bio": "喜歡音樂和電影",
        "location": {
          "city": "台北市",
          "distance": 5.2
        },
        "interests": [
          {"name": "音樂", "category": "entertainment"},
          {"name": "電影", "category": "entertainment"}
        ]
      },
      "compatibility": {
        "score": 85,
        "commonInterests": 3
      },
      "lastActive": "2024-01-01T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "hasNext": true
  }
}
```

#### 3.3.2 搜尋用戶
```http
GET /v1/users/search?q=張&interests=旅行,美食&location=台北市
Authorization: Bearer <JWT_TOKEN>

# 回應格式同瀏覽用戶
```

#### 3.3.3 獲取用戶詳情
```http
GET /v1/users/{userId}
Authorization: Bearer <JWT_TOKEN>

# 回應
{
  "success": true,
  "data": {
    "id": "user_456",
    "profile": {
      // 詳細的用戶資料
    },
    "photos": [
      // 所有照片
    ],
    "posts": [
      // 最近的動態 (如果有權限)
    ],
    "mutualConnections": {
      "count": 5,
      "users": [
        // 共同好友
      ]
    }
  }
}
```

## 4. 社交互動 API

### 4.1 按讚系統

#### 4.1.1 按讚用戶
```http
POST /v1/users/{userId}/like
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "type": "like" // like, super_like, pass
}

# 回應
{
  "success": true,
  "data": {
    "liked": true,
    "isMatch": false,
    "matchId": null
  }
}

# 如果產生配對
{
  "success": true,
  "data": {
    "liked": true,
    "isMatch": true,
    "matchId": "match_123",
    "matchedAt": "2024-01-01T12:00:00Z"
  }
}
```

#### 4.1.2 取消按讚
```http
DELETE /v1/users/{userId}/like
Authorization: Bearer <JWT_TOKEN>

# 回應
{
  "success": true,
  "data": {
    "message": "已取消按讚"
  }
}
```

#### 4.1.3 獲取按讚列表
```http
GET /v1/users/me/likes?type=given&page=1&limit=20
Authorization: Bearer <JWT_TOKEN>

# type: given (我按讚的), received (按讚我的)

# 回應
{
  "success": true,
  "data": [
    {
      "id": "like_123",
      "user": {
        "id": "user_456",
        "profile": {
          "displayName": "李小花",
          "avatarUrl": "https://cdn.example.com/avatar456.jpg"
        }
      },
      "type": "like",
      "createdAt": "2024-01-01T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50
  }
}
```

### 4.2 配對系統

#### 4.2.1 獲取配對列表
```http
GET /v1/matches?page=1&limit=20
Authorization: Bearer <JWT_TOKEN>

# 回應
{
  "success": true,
  "data": [
    {
      "id": "match_123",
      "user": {
        "id": "user_456",
        "profile": {
          "displayName": "李小花",
          "avatarUrl": "https://cdn.example.com/avatar456.jpg"
        }
      },
      "matchedAt": "2024-01-01T12:00:00Z",
      "conversation": {
        "id": "conv_123",
        "lastMessage": {
          "content": "你好！",
          "sentAt": "2024-01-01T12:30:00Z"
        },
        "unreadCount": 2
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 25
  }
}
```

#### 4.2.2 取消配對
```http
DELETE /v1/matches/{matchId}
Authorization: Bearer <JWT_TOKEN>

# 回應
{
  "success": true,
  "data": {
    "message": "已取消配對"
  }
}
```

### 4.3 追蹤系統

#### 4.3.1 追蹤用戶
```http
POST /v1/users/{userId}/follow
Authorization: Bearer <JWT_TOKEN>

# 回應
{
  "success": true,
  "data": {
    "following": true,
    "followedAt": "2024-01-01T12:00:00Z"
  }
}
```

#### 4.3.2 取消追蹤
```http
DELETE /v1/users/{userId}/follow
Authorization: Bearer <JWT_TOKEN>

# 回應
{
  "success": true,
  "data": {
    "message": "已取消追蹤"
  }
}
```

#### 4.3.3 獲取追蹤列表
```http
GET /v1/users/me/following?page=1&limit=20
GET /v1/users/me/followers?page=1&limit=20
Authorization: Bearer <JWT_TOKEN>

# 回應格式類似按讚列表
```

## 5. 聊天系統 API

### 5.1 對話管理

#### 5.1.1 獲取對話列表
```http
GET /v1/conversations?page=1&limit=20
Authorization: Bearer <JWT_TOKEN>

# 回應
{
  "success": true,
  "data": [
    {
      "id": "conv_123",
      "type": "direct",
      "participants": [
        {
          "id": "user_456",
          "profile": {
            "displayName": "李小花",
            "avatarUrl": "https://cdn.example.com/avatar456.jpg"
          },
          "isOnline": true,
          "lastSeen": "2024-01-01T12:00:00Z"
        }
      ],
      "lastMessage": {
        "id": "msg_789",
        "content": "你好嗎？",
        "type": "text",
        "sender": {
          "id": "user_456",
          "displayName": "李小花"
        },
        "sentAt": "2024-01-01T12:00:00Z"
      },
      "unreadCount": 3,
      "updatedAt": "2024-01-01T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15
  }
}
```

#### 5.1.2 獲取對話詳情
```http
GET /v1/conversations/{conversationId}
Authorization: Bearer <JWT_TOKEN>

# 回應
{
  "success": true,
  "data": {
    "id": "conv_123",
    "type": "direct",
    "participants": [
      // 參與者詳情
    ],
    "createdAt": "2024-01-01T10:00:00Z",
    "settings": {
      "isMuted": false,
      "canCall": true
    }
  }
}
```

### 5.2 訊息管理

#### 5.2.1 獲取訊息歷史
```http
GET /v1/conversations/{conversationId}/messages?before=msg_123&limit=50
Authorization: Bearer <JWT_TOKEN>

# 回應
{
  "success": true,
  "data": [
    {
      "id": "msg_789",
      "content": "你好！",
      "type": "text",
      "sender": {
        "id": "user_456",
        "displayName": "李小花",
        "avatarUrl": "https://cdn.example.com/avatar456.jpg"
      },
      "sentAt": "2024-01-01T12:00:00Z",
      "readBy": [
        {
          "userId": "user_123",
          "readAt": "2024-01-01T12:01:00Z"
        }
      ],
      "reactions": [
        {
          "emoji": "❤️",
          "users": ["user_123"],
          "count": 1
        }
      ]
    }
  ],
  "pagination": {
    "hasMore": true,
    "nextCursor": "msg_788"
  }
}
```

#### 5.2.2 發送訊息
```http
POST /v1/conversations/{conversationId}/messages
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "content": "你好！很高興認識你",
  "type": "text",
  "replyTo": "msg_456" // 可選，回覆特定訊息
}

# 回應
{
  "success": true,
  "data": {
    "id": "msg_790",
    "content": "你好！很高興認識你",
    "type": "text",
    "sender": {
      "id": "user_123",
      "displayName": "張小美"
    },
    "sentAt": "2024-01-01T12:05:00Z",
    "replyTo": {
      "id": "msg_456",
      "content": "原始訊息內容"
    }
  }
}
```

#### 5.2.3 發送媒體訊息
```http
POST /v1/conversations/{conversationId}/messages
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data

# Form data:
# file: [image/video/audio file]
# type: image/video/audio
# caption: 可選的說明文字

# 回應
{
  "success": true,
  "data": {
    "id": "msg_791",
    "type": "image",
    "mediaUrl": "https://cdn.example.com/message_image.jpg",
    "thumbnailUrl": "https://cdn.example.com/message_thumb.jpg",
    "caption": "美麗的風景",
    "metadata": {
      "width": 1920,
      "height": 1080,
      "fileSize": 2048576
    },
    "sender": {
      "id": "user_123",
      "displayName": "張小美"
    },
    "sentAt": "2024-01-01T12:10:00Z"
  }
}
```

#### 5.2.4 標記訊息為已讀
```http
POST /v1/conversations/{conversationId}/read
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "messageId": "msg_789"
}

# 回應
{
  "success": true,
  "data": {
    "readAt": "2024-01-01T12:15:00Z"
  }
}
```

#### 5.2.5 訊息反應
```http
POST /v1/messages/{messageId}/reactions
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "emoji": "❤️"
}

# 回應
{
  "success": true,
  "data": {
    "emoji": "❤️",
    "addedAt": "2024-01-01T12:20:00Z"
  }
}
```

## 6. 內容管理 API

### 6.1 動態發布

#### 6.1.1 發布動態
```http
POST /v1/posts
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data

# Form data:
# content: 動態文字內容
# files: 媒體檔案 (可多個)
# visibility: public/friends/private

# 回應
{
  "success": true,
  "data": {
    "id": "post_123",
    "content": "今天天氣真好！",
    "mediaUrls": [
      "https://cdn.example.com/post_image1.jpg",
      "https://cdn.example.com/post_image2.jpg"
    ],
    "visibility": "public",
    "author": {
      "id": "user_123",
      "displayName": "張小美",
      "avatarUrl": "https://cdn.example.com/avatar123.jpg"
    },
    "stats": {
      "likeCount": 0,
      "commentCount": 0,
      "shareCount": 0
    },
    "createdAt": "2024-01-01T12:00:00Z"
  }
}
```

#### 6.1.2 獲取動態列表
```http
GET /v1/posts?page=1&limit=20&userId=user_123
Authorization: Bearer <JWT_TOKEN>

# 回應
{
  "success": true,
  "data": [
    {
      "id": "post_123",
      "content": "今天天氣真好！",
      "mediaUrls": [
        "https://cdn.example.com/post_image1.jpg"
      ],
      "author": {
        "id": "user_123",
        "displayName": "張小美",
        "avatarUrl": "https://cdn.example.com/avatar123.jpg"
      },
      "stats": {
        "likeCount": 15,
        "commentCount": 3,
        "shareCount": 2
      },
      "userInteraction": {
        "hasLiked": false,
        "hasCommented": false
      },
      "createdAt": "2024-01-01T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50
  }
}
```

### 6.2 留言系統

#### 6.2.1 獲取留言
```http
GET /v1/posts/{postId}/comments?page=1&limit=20
Authorization: Bearer <JWT_TOKEN>

# 回應
{
  "success": true,
  "data": [
    {
      "id": "comment_123",
      "content": "很棒的照片！",
      "author": {
        "id": "user_456",
        "displayName": "李小花",
        "avatarUrl": "https://cdn.example.com/avatar456.jpg"
      },
      "likeCount": 5,
      "hasLiked": false,
      "replies": [
        {
          "id": "comment_124",
          "content": "謝謝！",
          "author": {
            "id": "user_123",
            "displayName": "張小美"
          },
          "createdAt": "2024-01-01T12:30:00Z"
        }
      ],
      "createdAt": "2024-01-01T12:25:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10
  }
}
```

#### 6.2.2 新增留言
```http
POST /v1/posts/{postId}/comments
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "content": "很棒的分享！",
  "parentId": "comment_123" // 可選，回覆特定留言
}

# 回應
{
  "success": true,
  "data": {
    "id": "comment_125",
    "content": "很棒的分享！",
    "author": {
      "id": "user_456",
      "displayName": "李小花"
    },
    "parentId": "comment_123",
    "createdAt": "2024-01-01T12:35:00Z"
  }
}
```

## 7. 通知系統 API

### 7.1 通知管理

#### 7.1.1 獲取通知列表
```http
GET /v1/notifications?page=1&limit=20&unreadOnly=true
Authorization: Bearer <JWT_TOKEN>

# 回應
{
  "success": true,
  "data": [
    {
      "id": "notif_123",
      "type": "like",
      "title": "有人按讚了你",
      "content": "李小花 按讚了你的照片",
      "data": {
        "userId": "user_456",
        "postId": "post_123"
      },
      "isRead": false,
      "createdAt": "2024-01-01T12:00:00Z"
    },
    {
      "id": "notif_124",
      "type": "match",
      "title": "新的配對",
      "content": "你和王小明互相按讚了！",
      "data": {
        "matchId": "match_456",
        "userId": "user_789"
      },
      "isRead": false,
      "createdAt": "2024-01-01T11:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 25
  },
  "unreadCount": 8
}
```

#### 7.1.2 標記通知為已讀
```http
POST /v1/notifications/{notificationId}/read
Authorization: Bearer <JWT_TOKEN>

# 回應
{
  "success": true,
  "data": {
    "readAt": "2024-01-01T12:30:00Z"
  }
}
```

#### 7.1.3 標記所有通知為已讀
```http
POST /v1/notifications/read-all
Authorization: Bearer <JWT_TOKEN>

# 回應
{
  "success": true,
  "data": {
    "readCount": 8,
    "readAt": "2024-01-01T12:30:00Z"
  }
}
```

### 7.2 推送設定

#### 7.2.1 註冊推送 Token
```http
POST /v1/push/tokens
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "token": "push_token_string",
  "platform": "ios", // ios, android, web
  "deviceId": "device_unique_id"
}

# 回應
{
  "success": true,
  "data": {
    "id": "token_123",
    "registered": true
  }
}
```

#### 7.2.2 更新推送設定
```http
PUT /v1/users/me/notification-settings
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "pushEnabled": true,
  "emailEnabled": false,
  "types": {
    "likes": true,
    "matches": true,
    "messages": true,
    "comments": false
  }
}

# 回應
{
  "success": true,
  "data": {
    "settings": {
      // 更新後的設定
    }
  }
}
```

## 8. WebSocket API

### 8.1 連線管理

#### 8.1.1 建立連線
```javascript
// 客戶端連線
const socket = io('wss://api.mkingfriend.com', {
  auth: {
    token: 'jwt_access_token'
  },
  transports: ['websocket']
});

// 連線成功
socket.on('connect', () => {
  console.log('Connected to server');
});

// 認證成功
socket.on('authenticated', (data) => {
  console.log('Authenticated:', data.userId);
});
```

#### 8.1.2 加入房間
```javascript
// 加入對話房間
socket.emit('join_conversation', {
  conversationId: 'conv_123'
});

// 加入成功
socket.on('joined_conversation', (data) => {
  console.log('Joined conversation:', data.conversationId);
});
```

### 8.2 即時訊息

#### 8.2.1 發送訊息
```javascript
// 發送文字訊息
socket.emit('send_message', {
  conversationId: 'conv_123',
  content: '你好！',
  type: 'text'
});

// 訊息發送確認
socket.on('message_sent', (data) => {
  console.log('Message sent:', data.messageId);
});
```

#### 8.2.2 接收訊息
```javascript
// 接收新訊息
socket.on('new_message', (data) => {
  console.log('New message:', {
    id: data.id,
    content: data.content,
    sender: data.sender,
    conversationId: data.conversationId,
    sentAt: data.sentAt
  });
});

// 訊息狀態更新
socket.on('message_read', (data) => {
  console.log('Message read:', {
    messageId: data.messageId,
    readBy: data.readBy,
    readAt: data.readAt
  });
});
```

### 8.3 用戶狀態

#### 8.3.1 在線狀態
```javascript
// 用戶上線
socket.on('user_online', (data) => {
  console.log('User online:', data.userId);
});

// 用戶離線
socket.on('user_offline', (data) => {
  console.log('User offline:', {
    userId: data.userId,
    lastSeen: data.lastSeen
  });
});

// 正在輸入
socket.emit('typing_start', {
  conversationId: 'conv_123'
});

socket.emit('typing_stop', {
  conversationId: 'conv_123'
});

// 接收輸入狀態
socket.on('user_typing', (data) => {
  console.log('User typing:', {
    userId: data.userId,
    conversationId: data.conversationId
  });
});
```

### 8.4 即時通知

#### 8.4.1 接收通知
```javascript
// 新通知
socket.on('new_notification', (data) => {
  console.log('New notification:', {
    id: data.id,
    type: data.type,
    title: data.title,
    content: data.content,
    data: data.data
  });
});

// 新配對
socket.on('new_match', (data) => {
  console.log('New match:', {
    matchId: data.matchId,
    user: data.user,
    matchedAt: data.matchedAt
  });
});

// 新按讚
socket.on('new_like', (data) => {
  console.log('New like:', {
    userId: data.userId,
    type: data.type,
    likedAt: data.likedAt
  });
});
```

## 9. 錯誤處理

### 9.1 錯誤代碼

```typescript
enum ErrorCode {
  // 認證錯誤 (1000-1099)
  INVALID_CREDENTIALS = 1001,
  TOKEN_EXPIRED = 1002,
  TOKEN_INVALID = 1003,
  EMAIL_NOT_VERIFIED = 1004,
  ACCOUNT_SUSPENDED = 1005,
  
  // 驗證錯誤 (1100-1199)
  VALIDATION_ERROR = 1101,
  MISSING_REQUIRED_FIELD = 1102,
  INVALID_EMAIL_FORMAT = 1103,
  PASSWORD_TOO_WEAK = 1104,
  
  // 資源錯誤 (1200-1299)
  USER_NOT_FOUND = 1201,
  CONVERSATION_NOT_FOUND = 1202,
  MESSAGE_NOT_FOUND = 1203,
  POST_NOT_FOUND = 1204,
  
  // 權限錯誤 (1300-1399)
  INSUFFICIENT_PERMISSIONS = 1301,
  BLOCKED_BY_USER = 1302,
  PRIVACY_RESTRICTION = 1303,
  
  // 業務邏輯錯誤 (1400-1499)
  ALREADY_LIKED = 1401,
  ALREADY_MATCHED = 1402,
  CANNOT_LIKE_SELF = 1403,
  MAX_PHOTOS_EXCEEDED = 1404,
  
  // 限流錯誤 (1500-1599)
  RATE_LIMIT_EXCEEDED = 1501,
  TOO_MANY_REQUESTS = 1502,
  
  // 系統錯誤 (1600-1699)
  INTERNAL_SERVER_ERROR = 1601,
  DATABASE_ERROR = 1602,
  EXTERNAL_SERVICE_ERROR = 1603
}
```

### 9.2 錯誤回應範例

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "輸入資料驗證失敗",
    "details": [
      {
        "field": "email",
        "code": "INVALID_EMAIL_FORMAT",
        "message": "Email 格式不正確"
      },
      {
        "field": "password",
        "code": "PASSWORD_TOO_WEAK",
        "message": "密碼強度不足，至少需要8個字符"
      }
    ]
  },
  "meta": {
    "timestamp": "2024-01-01T12:00:00Z",
    "version": "1.0.0",
    "requestId": "req_123456789"
  }
}
```

## 10. API 版本控制

### 10.1 版本策略
- **URL 版本控制**: `/v1/`, `/v2/`
- **向後相容**: 舊版本至少維護6個月
- **棄用通知**: 提前3個月通知 API 棄用
- **版本文檔**: 每個版本都有完整文檔

### 10.2 版本升級
```http
# 舊版本 (v1)
GET /v1/users/me

# 新版本 (v2) - 增加更多欄位
GET /v2/users/me

# 回應標頭包含版本資訊
API-Version: 2.0.0
Deprecated: false
```

### 10.3 棄用處理
```http
# 棄用的 API 回應標頭
Deprecated: true
Sunset: 2024-06-01T00:00:00Z
Link: </v2/users/me>; rel="successor-version"
```

這個 API 設計文檔提供了完整的 RESTful API 和 WebSocket API 規範，確保 MKing Friend 平台能夠提供一致、安全、高效的 API 服務。