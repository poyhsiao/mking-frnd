# MKing Friend - 社群功能擴展規劃

## 1. 功能概述

### 1.1 核心社群功能
- **興趣群組**: 基於共同興趣的群組功能
- **活動組織**: 線上/線下活動創建與參與
- **社群動態**: 類似社交媒體的動態分享
- **論壇討論**: 主題式討論區
- **用戶生成內容**: 文章、照片、影片分享
- **社群治理**: 舉報、審核、管理機制

### 1.2 社群互動功能
- **群組聊天**: 多人群組即時通訊
- **視訊聊天**: 一對一和群組視訊通話
- **語音聊天**: 語音通話和語音訊息
- **活動報名**: 活動參與和管理
- **內容互動**: 點讚、評論、分享
- **用戶關注**: 關注感興趣的用戶
- **社群排行**: 活躍度、貢獻度排行
- **徽章系統**: 成就和認證徽章

### 1.3 內容管理功能
- **內容分類**: 多層級內容分類系統
- **搜尋功能**: 全文搜尋和標籤搜尋
- **內容推薦**: 個性化內容推薦
- **熱門內容**: 趨勢和熱門內容展示
- **內容歸檔**: 歷史內容管理

## 2. 技術方案比較

### 2.1 即時通訊解決方案

#### 2.1.1 Socket.IO (推薦)
**優點:**
- 與 Node.js 完美整合
- 自動降級支援
- 豐富的功能和插件
- 支援房間和命名空間
- 良好的錯誤處理

**缺點:**
- 相對較重
- 需要 sticky sessions

**實現範例:**
```javascript
// 群組聊天服務
class GroupChatService {
  constructor(io) {
    this.io = io;
    this.setupEventHandlers();
  }
  
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      // 加入群組
      socket.on('join-group', async (data) => {
        const { groupId, userId } = data;
        const hasPermission = await this.checkGroupPermission(userId, groupId);
        
        if (hasPermission) {
          socket.join(`group-${groupId}`);
          socket.emit('joined-group', { groupId });
          
          // 通知其他成員
          socket.to(`group-${groupId}`).emit('user-joined', {
            userId,
            timestamp: new Date()
          });
        }
      });
      
      // 群組訊息
      socket.on('group-message', async (data) => {
        const { groupId, message, userId } = data;
        
        // 儲存訊息
        const savedMessage = await this.saveGroupMessage({
          groupId,
          userId,
          content: message.content,
          type: message.type
        });
        
        // 廣播給群組成員
        this.io.to(`group-${groupId}`).emit('new-group-message', savedMessage);
      });
    });
  }
}
```

#### 2.1.2 原生 WebSocket
**優點:**
- 輕量級
- 完全控制
- 性能最佳

**缺點:**
- 需要自行處理連接管理
- 缺少自動重連等功能
- 開發複雜度高

#### 2.1.3 第三方服務 (如 Pusher)
**優點:**
- 快速實現
- 穩定可靠
- 功能豐富

**缺點:**
- 成本較高
- 依賴第三方
- 客製化限制

### 2.2 視訊聊天解決方案

#### 2.2.1 WebRTC (推薦)
**優點:**
- 開源免費
- 點對點通信，低延遲
- 瀏覽器原生支援
- 支援音訊、視訊、數據傳輸
- 自動適應網路狀況

**缺點:**
- 實現複雜度較高
- 需要 STUN/TURN 服務器
- 跨平台兼容性需要處理

**實現範例:**
```javascript
// WebRTC 視訊聊天服務
class VideoCallService {
  constructor(io, stunServers) {
    this.io = io;
    this.stunServers = stunServers;
    this.activeCalls = new Map();
    this.setupSignalingServer();
  }
  
  setupSignalingServer() {
    this.io.on('connection', (socket) => {
      // 發起視訊通話
      socket.on('initiate-call', async (data) => {
        const { callerId, targetUserId, callType } = data; // callType: 'video' | 'audio'
        
        // 檢查目標用戶是否在線
        const targetSocket = this.getUserSocket(targetUserId);
        if (!targetSocket) {
          socket.emit('call-failed', { reason: 'User offline' });
          return;
        }
        
        // 檢查用戶是否已在通話中
        if (this.isUserInCall(targetUserId)) {
          socket.emit('call-failed', { reason: 'User busy' });
          return;
        }
        
        const callId = this.generateCallId();
        const callData = {
          id: callId,
          caller: callerId,
          target: targetUserId,
          type: callType,
          status: 'ringing',
          startTime: new Date()
        };
        
        this.activeCalls.set(callId, callData);
        
        // 發送通話邀請
        targetSocket.emit('incoming-call', {
          callId,
          caller: await this.getUserInfo(callerId),
          callType
        });
        
        socket.emit('call-initiated', { callId });
      });
      
      // 接受通話
      socket.on('accept-call', (data) => {
        const { callId } = data;
        const call = this.activeCalls.get(callId);
        
        if (call) {
          call.status = 'connected';
          
          // 通知雙方開始 WebRTC 連接
          const callerSocket = this.getUserSocket(call.caller);
          const targetSocket = this.getUserSocket(call.target);
          
          callerSocket.emit('call-accepted', { callId });
          targetSocket.emit('call-accepted', { callId });
          
          // 加入通話房間
          callerSocket.join(`call-${callId}`);
          targetSocket.join(`call-${callId}`);
        }
      });
      
      // 拒絕通話
      socket.on('reject-call', (data) => {
        const { callId } = data;
        const call = this.activeCalls.get(callId);
        
        if (call) {
          const callerSocket = this.getUserSocket(call.caller);
          callerSocket.emit('call-rejected', { callId });
          
          this.activeCalls.delete(callId);
        }
      });
      
      // WebRTC 信令
      socket.on('webrtc-offer', (data) => {
        const { callId, offer } = data;
        socket.to(`call-${callId}`).emit('webrtc-offer', { offer });
      });
      
      socket.on('webrtc-answer', (data) => {
        const { callId, answer } = data;
        socket.to(`call-${callId}`).emit('webrtc-answer', { answer });
      });
      
      socket.on('webrtc-ice-candidate', (data) => {
        const { callId, candidate } = data;
        socket.to(`call-${callId}`).emit('webrtc-ice-candidate', { candidate });
      });
      
      // 結束通話
      socket.on('end-call', (data) => {
        const { callId } = data;
        this.endCall(callId);
      });
      
      // 用戶斷線處理
      socket.on('disconnect', () => {
        this.handleUserDisconnect(socket.userId);
      });
    });
  }
  
  endCall(callId) {
    const call = this.activeCalls.get(callId);
    if (call) {
      // 通知所有參與者
      this.io.to(`call-${callId}`).emit('call-ended', { callId });
      
      // 記錄通話歷史
      this.saveCallHistory(call);
      
      // 清理資源
      this.activeCalls.delete(callId);
    }
  }
}
```

#### 2.2.2 Jitsi Meet (開源方案)
**優點:**
- 完整的視訊會議解決方案
- 開源免費
- 支援多人視訊會議
- 可以 self-hosted
- 功能豐富（螢幕分享、錄製等）

**缺點:**
- 資源消耗較大
- 需要額外的服務器配置
- 客製化程度有限

**整合範例:**
```javascript
// Jitsi Meet 整合
class JitsiVideoService {
  constructor(jitsiDomain) {
    this.jitsiDomain = jitsiDomain;
  }
  
  async createVideoRoom(roomData) {
    const roomName = this.generateRoomName(roomData.groupId, roomData.callId);
    
    const jitsiConfig = {
      roomName,
      width: '100%',
      height: '100%',
      parentNode: document.querySelector('#jitsi-container'),
      configOverwrite: {
        startWithAudioMuted: true,
        startWithVideoMuted: false,
        enableWelcomePage: false,
        prejoinPageEnabled: false
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [
          'microphone', 'camera', 'closedcaptions', 'desktop',
          'fullscreen', 'fodeviceselection', 'hangup', 'profile',
          'chat', 'recording', 'livestreaming', 'etherpad',
          'sharedvideo', 'settings', 'raisehand', 'videoquality',
          'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
          'tileview', 'videobackgroundblur', 'download', 'help'
        ]
      }
    };
    
    return new JitsiMeetExternalAPI(this.jitsiDomain, jitsiConfig);
  }
  
  generateRoomName(groupId, callId) {
    return `mking-${groupId}-${callId}-${Date.now()}`;
  }
}
```

#### 2.2.3 Coturn (TURN/STUN 服務器)
**用途:**
- 為 WebRTC 提供 NAT 穿透
- 處理防火牆和路由器限制
- 確保視訊通話連接成功率

**配置範例:**
```bash
# /etc/turnserver.conf
listening-port=3478
tls-listening-port=5349
min-port=10000
max-port=20000
verbose
fingerprint
lt-cred-mech
use-auth-secret
static-auth-secret=your-secret-key
realm=your-domain.com
total-quota=100
bq-size=1200000
stale-nonce=600
cert=/path/to/cert.pem
pkey=/path/to/private.pem
no-stdout-log
log-file=/var/log/turnserver.log
```

#### 2.2.4 技術方案比較總結

| 方案 | 成本 | 複雜度 | 功能完整性 | 可控性 | 推薦指數 |
|------|------|--------|------------|--------|-----------|
| WebRTC + 自建信令 | 低 | 高 | 中 | 高 | ⭐⭐⭐⭐ |
| Jitsi Meet | 低 | 中 | 高 | 中 | ⭐⭐⭐⭐⭐ |
| 第三方服務 | 高 | 低 | 高 | 低 | ⭐⭐ |

**推薦方案**: 採用 **Jitsi Meet** 作為主要視訊會議解決方案，配合 **WebRTC** 實現一對一通話功能。

### 2.3 內容管理系統

#### 2.3.1 自建 CMS (推薦)
**優點:**
- 完全客製化
- 與現有系統整合
- 無授權費用
- 完全控制數據

**缺點:**
- 開發時間長
- 需要持續維護

**架構設計:**
```typescript
// 內容管理服務
interface ContentManagementService {
  // 內容 CRUD
  createContent(content: ContentInput): Promise<Content>;
  updateContent(id: string, updates: Partial<ContentInput>): Promise<Content>;
  deleteContent(id: string): Promise<void>;
  getContent(id: string): Promise<Content>;
  
  // 內容查詢
  searchContent(query: SearchQuery): Promise<SearchResult>;
  getContentByCategory(categoryId: string, pagination: Pagination): Promise<Content[]>;
  getTrendingContent(timeRange: TimeRange): Promise<Content[]>;
  
  // 內容互動
  likeContent(contentId: string, userId: string): Promise<void>;
  commentOnContent(contentId: string, comment: CommentInput): Promise<Comment>;
  shareContent(contentId: string, userId: string): Promise<void>;
  
  // 內容審核
  reportContent(contentId: string, report: ReportInput): Promise<void>;
  moderateContent(contentId: string, action: ModerationAction): Promise<void>;
}
```

#### 2.3.2 Headless CMS (如 Strapi)
**優點:**
- 快速搭建
- 管理界面完整
- API 自動生成
- 插件生態豐富

**缺點:**
- 學習曲線
- 可能過於複雜
- 客製化限制

### 2.4 搜尋引擎選擇

#### 2.4.1 Typesense (主要推薦)
**優點:**
- 即時搜尋體驗
- 配置簡單
- 優秀的中文分詞
- 低資源消耗
- 內建地理搜尋

**缺點:**
- GPL v3 授權
- 相對較新的技術
- 社群規模較小

#### 2.4.2 Elasticsearch (企業級備選，已改用 Typesense)
**優點:**
- 強大的全文搜尋
- 支援複雜查詢
- 良好的中文支援
- 豐富的分析功能

**缺點:**
- 資源消耗大
- 配置複雜
- 學習曲線陡峭

**實現範例:**
```javascript
// Typesense 搜尋服務 (主要推薦)
class SearchService {
  constructor(typesenseClient) {
    this.client = typesenseClient;
  }
  
  async searchContent(query, filters = {}) {
    const searchParameters = {
      q: query,
      query_by: 'title,content,tags',
      query_by_weights: '3,2,1',
      highlight_fields: 'title,content',
      highlight_affix_num_tokens: 4,
      sort_by: '_text_match:desc,created_at:desc',
      per_page: 20,
      page: 1
    };
    
    // 添加過濾條件
    const filterBy = this.buildFilters(filters);
    if (filterBy.length > 0) {
      searchParameters.filter_by = filterBy.join(' && ');
    }
    
    try {
      const result = await this.client
        .collections('community_content')
        .documents()
        .search(searchParameters);
      
      return this.formatSearchResults(result);
    } catch (error) {
      console.error('搜尋錯誤:', error);
      throw error;
    }
  }
  
  buildFilters(filters) {
    const filterClauses = [];
    
    if (filters.category) {
      filterClauses.push(`category_id:=${filters.category}`);
    }
    
    if (filters.author) {
      filterClauses.push(`author_id:=${filters.author}`);
    }
    
    if (filters.dateRange) {
      filterClauses.push(
        `created_at:>=${filters.dateRange.start} && created_at:<=${filters.dateRange.end}`
      );
    }
    
    return filterClauses;
  }
  
  formatSearchResults(result) {
    return {
      hits: result.hits.map(hit => ({
        id: hit.document.id,
        title: hit.document.title,
        content: hit.document.content,
        author: hit.document.author,
        category: hit.document.category,
        created_at: hit.document.created_at,
        highlights: hit.highlights || []
      })),
      found: result.found,
      page: result.page
    };
  }
}
```

#### 2.4.3 PostgreSQL 全文搜尋
**優點:**
- 與現有資料庫整合
- 無需額外服務
- 支援中文分詞

**缺點:**
- 功能相對簡單
- 性能不如專用搜尋引擎
- 複雜查詢支援有限

#### 2.4.4 Algolia
**優點:**
- 即時搜尋體驗
- 易於整合
- 強大的分析功能

**缺點:**
- 付費服務
- 依賴第三方
- 成本隨使用量增長

## 3. 系統架構設計

### 3.1 整體架構
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端應用      │    │   API Gateway   │    │   群組服務      │
│   (React)       │◄──►│   (Express)     │◄──►│   (Node.js)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   內容服務      │    │   活動服務      │
                       │   (Node.js)     │    │   (Node.js)     │
                       └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   搜尋引擎      │    │   主資料庫      │    │   檔案存儲      │
│  (Typesense)    │◄──►│  (PostgreSQL)   │◄──►│  (MinIO/S3)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   快取層        │
                       │   (Redis)       │
                       └─────────────────┘
```

### 3.2 資料庫設計
```sql
-- 群組表
CREATE TABLE community_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES group_categories(id),
    creator_id UUID REFERENCES users(id),
    privacy_level INTEGER DEFAULT 1, -- 1: 公開, 2: 私人, 3: 邀請制
    max_members INTEGER DEFAULT 1000,
    current_members INTEGER DEFAULT 0,
    avatar_url TEXT,
    cover_url TEXT,
    rules TEXT,
    tags TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 群組成員表
CREATE TABLE group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES community_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member', -- 'admin', 'moderator', 'member'
    joined_at TIMESTAMP DEFAULT NOW(),
    last_active_at TIMESTAMP DEFAULT NOW(),
    is_muted BOOLEAN DEFAULT FALSE,
    UNIQUE(group_id, user_id)
);

-- 群組內容表
CREATE TABLE group_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES community_groups(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content_type VARCHAR(20), -- 'post', 'image', 'video', 'poll', 'event'
    title VARCHAR(200),
    content TEXT,
    media_urls TEXT[],
    tags TEXT[],
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 活動表
CREATE TABLE community_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES community_groups(id) ON DELETE CASCADE,
    organizer_id UUID REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_type VARCHAR(20), -- 'online', 'offline', 'hybrid'
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    location TEXT,
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    registration_deadline TIMESTAMP,
    cover_image_url TEXT,
    tags TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 活動參與表
CREATE TABLE event_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES community_events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'registered', -- 'registered', 'attended', 'cancelled'
    registered_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- 內容互動表
CREATE TABLE content_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID REFERENCES group_content(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    interaction_type VARCHAR(20), -- 'like', 'comment', 'share', 'report'
    comment_text TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(content_id, user_id, interaction_type)
);

-- 索引
CREATE INDEX idx_community_groups_category ON community_groups (category_id);
CREATE INDEX idx_community_groups_creator ON community_groups (creator_id);
CREATE INDEX idx_group_members_group_id ON group_members (group_id);
CREATE INDEX idx_group_members_user_id ON group_members (user_id);
CREATE INDEX idx_group_content_group_id ON group_content (group_id);
CREATE INDEX idx_group_content_author_id ON group_content (author_id);
CREATE INDEX idx_group_content_created_at ON group_content (created_at DESC);
CREATE INDEX idx_community_events_group_id ON community_events (group_id);
CREATE INDEX idx_community_events_start_time ON community_events (start_time);
CREATE INDEX idx_event_participants_event_id ON event_participants (event_id);
CREATE INDEX idx_content_interactions_content_id ON content_interactions (content_id);
```

### 3.3 API 設計
```typescript
// 社群服務 API
interface CommunityService {
  // 群組管理
  createGroup(group: CreateGroupInput): Promise<Group>;
  updateGroup(groupId: string, updates: UpdateGroupInput): Promise<Group>;
  deleteGroup(groupId: string): Promise<void>;
  getGroup(groupId: string): Promise<Group>;
  searchGroups(query: GroupSearchQuery): Promise<Group[]>;
  
  // 成員管理
  joinGroup(groupId: string, userId: string): Promise<void>;
  leaveGroup(groupId: string, userId: string): Promise<void>;
  inviteToGroup(groupId: string, inviterUserId: string, inviteeUserId: string): Promise<void>;
  updateMemberRole(groupId: string, userId: string, role: MemberRole): Promise<void>;
  
  // 內容管理
  createContent(content: CreateContentInput): Promise<Content>;
  updateContent(contentId: string, updates: UpdateContentInput): Promise<Content>;
  deleteContent(contentId: string): Promise<void>;
  getGroupContent(groupId: string, pagination: Pagination): Promise<Content[]>;
  
  // 活動管理
  createEvent(event: CreateEventInput): Promise<Event>;
  updateEvent(eventId: string, updates: UpdateEventInput): Promise<Event>;
  registerForEvent(eventId: string, userId: string): Promise<void>;
  cancelEventRegistration(eventId: string, userId: string): Promise<void>;
  
  // 互動功能
  likeContent(contentId: string, userId: string): Promise<void>;
  commentOnContent(contentId: string, comment: CommentInput): Promise<Comment>;
  reportContent(contentId: string, report: ReportInput): Promise<void>;
}
```

## 4. 核心功能實現

### 4.1 群組管理系統
```typescript
class GroupManagementService {
  async createGroup(groupData: CreateGroupInput, creatorId: string): Promise<Group> {
    // 驗證創建權限
    await this.validateGroupCreationPermission(creatorId);
    
    // 創建群組
    const group = await this.groupRepository.create({
      ...groupData,
      creator_id: creatorId,
      current_members: 1
    });
    
    // 將創建者加入群組並設為管理員
    await this.addGroupMember(group.id, creatorId, 'admin');
    
    // 創建預設頻道
    await this.createDefaultChannels(group.id);
    
    // 發送通知
    await this.notificationService.sendGroupCreatedNotification(group);
    
    return group;
  }
  
  async joinGroup(groupId: string, userId: string): Promise<void> {
    const group = await this.getGroup(groupId);
    
    // 檢查群組是否已滿
    if (group.current_members >= group.max_members) {
      throw new Error('群組已滿');
    }
    
    // 檢查隱私設定
    if (group.privacy_level === 3) { // 邀請制
      const invitation = await this.getGroupInvitation(groupId, userId);
      if (!invitation) {
        throw new Error('需要邀請才能加入此群組');
      }
    }
    
    // 加入群組
    await this.addGroupMember(groupId, userId, 'member');
    
    // 更新群組成員數
    await this.updateGroupMemberCount(groupId, 1);
    
    // 發送歡迎訊息
    await this.sendWelcomeMessage(groupId, userId);
  }
  
  private async addGroupMember(groupId: string, userId: string, role: MemberRole): Promise<void> {
    await this.groupMemberRepository.create({
      group_id: groupId,
      user_id: userId,
      role
    });
  }
}
```

### 4.2 內容管理系統
```typescript
class ContentManagementService {
  async createContent(contentData: CreateContentInput): Promise<Content> {
    // 內容驗證
    await this.validateContent(contentData);
    
    // 創建內容
    const content = await this.contentRepository.create(contentData);
    
    // 處理媒體文件
    if (contentData.media_files) {
      await this.processMediaFiles(content.id, contentData.media_files);
    }
    
    // 提取和處理標籤
    const tags = this.extractTags(contentData.content);
    await this.updateContentTags(content.id, tags);
    
    // 索引到 Typesense 搜尋引擎
    await this.searchService.indexContent(content);
    
    // 發送通知給群組成員
    await this.notifyGroupMembers(content.group_id, content);
    
    return content;
  }
  
  async moderateContent(contentId: string, action: ModerationAction): Promise<void> {
    const content = await this.getContent(contentId);
    
    switch (action.type) {
      case 'approve':
        await this.approveContent(contentId);
        break;
      case 'reject':
        await this.rejectContent(contentId, action.reason);
        break;
      case 'flag':
        await this.flagContent(contentId, action.reason);
        break;
      case 'delete':
        await this.deleteContent(contentId);
        break;
    }
    
    // 記錄審核日誌
    await this.logModerationAction(contentId, action);
  }
  
  private async validateContent(content: CreateContentInput): Promise<void> {
    // 內容長度檢查
    if (content.content && content.content.length > 10000) {
      throw new Error('內容長度超過限制');
    }
    
    // 敏感詞檢查
    const hasSensitiveWords = await this.checkSensitiveWords(content.content);
    if (hasSensitiveWords) {
      throw new Error('內容包含敏感詞彙');
    }
    
    // 垃圾內容檢查
    const isSpam = await this.checkSpamContent(content);
    if (isSpam) {
      throw new Error('內容被識別為垃圾內容');
    }
  }
}
```

### 4.3 活動管理系統
```typescript
class EventManagementService {
  async createEvent(eventData: CreateEventInput): Promise<Event> {
    // 驗證活動數據
    await this.validateEventData(eventData);
    
    // 創建活動
    const event = await this.eventRepository.create(eventData);
    
    // 設置提醒
    await this.scheduleEventReminders(event);
    
    // 通知群組成員
    await this.notifyGroupMembers(event.group_id, {
      type: 'new_event',
      event
    });
    
    return event;
  }
  
  async registerForEvent(eventId: string, userId: string): Promise<void> {
    const event = await this.getEvent(eventId);
    
    // 檢查報名截止時間
    if (event.registration_deadline && new Date() > event.registration_deadline) {
      throw new Error('報名已截止');
    }
    
    // 檢查人數限制
    if (event.max_participants && event.current_participants >= event.max_participants) {
      throw new Error('活動已滿');
    }
    
    // 檢查是否已報名
    const existingRegistration = await this.getEventRegistration(eventId, userId);
    if (existingRegistration) {
      throw new Error('已經報名此活動');
    }
    
    // 創建報名記錄
    await this.eventParticipantRepository.create({
      event_id: eventId,
      user_id: userId,
      status: 'registered'
    });
    
    // 更新參與人數
    await this.updateEventParticipantCount(eventId, 1);
    
    // 發送確認通知
    await this.sendRegistrationConfirmation(eventId, userId);
  }
  
  private async scheduleEventReminders(event: Event): Promise<void> {
    const reminderTimes = [
      new Date(event.start_time.getTime() - 24 * 60 * 60 * 1000), // 1天前
      new Date(event.start_time.getTime() - 60 * 60 * 1000), // 1小時前
      new Date(event.start_time.getTime() - 15 * 60 * 1000)  // 15分鐘前
    ];
    
    for (const reminderTime of reminderTimes) {
      if (reminderTime > new Date()) {
        await this.scheduleService.scheduleNotification({
          type: 'event_reminder',
          eventId: event.id,
          scheduledTime: reminderTime
        });
      }
    }
  }
}
```

### 4.4 社群治理系統
```typescript
class CommunityModerationService {
  async reportContent(contentId: string, reportData: ReportInput): Promise<void> {
    // 創建舉報記錄
    const report = await this.reportRepository.create({
      content_id: contentId,
      reporter_id: reportData.reporter_id,
      reason: reportData.reason,
      description: reportData.description,
      status: 'pending'
    });
    
    // 自動檢查是否需要立即處理
    const shouldAutoModerate = await this.shouldAutoModerate(contentId, reportData.reason);
    if (shouldAutoModerate) {
      await this.autoModerateContent(contentId);
    }
    
    // 通知管理員
    await this.notifyModerators(report);
  }
  
  async processReport(reportId: string, action: ModerationAction): Promise<void> {
    const report = await this.getReport(reportId);
    
    // 更新舉報狀態
    await this.updateReportStatus(reportId, 'processed');
    
    // 執行相應動作
    switch (action.type) {
      case 'dismiss':
        await this.dismissReport(reportId);
        break;
      case 'warn_user':
        await this.warnUser(report.content.author_id, action.reason);
        break;
      case 'remove_content':
        await this.removeContent(report.content_id);
        break;
      case 'ban_user':
        await this.banUser(report.content.author_id, action.duration);
        break;
    }
    
    // 記錄處理結果
    await this.logModerationAction(reportId, action);
  }
  
  private async shouldAutoModerate(contentId: string, reason: string): Promise<boolean> {
    // 檢查舉報次數
    const reportCount = await this.getContentReportCount(contentId);
    if (reportCount >= 5) {
      return true;
    }
    
    // 檢查舉報原因嚴重性
    const severityLevel = this.getReasonSeverity(reason);
    if (severityLevel >= 8) {
      return true;
    }
    
    return false;
  }
}
```

## 5. 用戶體驗優化

### 5.1 個性化推薦
```typescript
class CommunityRecommendationService {
  async getRecommendedGroups(userId: string): Promise<Group[]> {
    const userProfile = await this.getUserProfile(userId);
    const userInterests = await this.getUserInterests(userId);
    const userActivity = await this.getUserActivity(userId);
    
    // 基於興趣的推薦
    const interestBasedGroups = await this.getGroupsByInterests(userInterests);
    
    // 基於地理位置的推薦
    const locationBasedGroups = await this.getNearbyGroups(userProfile.location);
    
    // 基於朋友活動的推薦
    const friendBasedGroups = await this.getGroupsByFriends(userId);
    
    // 合併和排序推薦結果
    return this.combineAndRankRecommendations([
      { groups: interestBasedGroups, weight: 0.5 },
      { groups: locationBasedGroups, weight: 0.3 },
      { groups: friendBasedGroups, weight: 0.2 }
    ]);
  }
  
  async getRecommendedContent(userId: string, groupId?: string): Promise<Content[]> {
    const userPreferences = await this.getUserContentPreferences(userId);
    
    let baseQuery = this.contentRepository.createQueryBuilder('content')
      .where('content.is_approved = :approved', { approved: true });
    
    if (groupId) {
      baseQuery = baseQuery.andWhere('content.group_id = :groupId', { groupId });
    } else {
      // 只推薦用戶已加入群組的內容
      const userGroups = await this.getUserGroups(userId);
      baseQuery = baseQuery.andWhere('content.group_id IN (:...groupIds)', {
        groupIds: userGroups.map(g => g.id)
      });
    }
    
    // 根據用戶偏好排序
    return baseQuery
      .orderBy('content.like_count * :likeWeight + content.comment_count * :commentWeight', 'DESC')
      .setParameters({
        likeWeight: userPreferences.likeWeight,
        commentWeight: userPreferences.commentWeight
      })
      .limit(20)
      .getMany();
  }
}
```

### 5.2 通知系統
```typescript
class CommunityNotificationService {
  async sendGroupNotification(groupId: string, notification: NotificationData): Promise<void> {
    const groupMembers = await this.getGroupMembers(groupId);
    
    // 批次發送通知
    const notifications = groupMembers.map(member => ({
      user_id: member.user_id,
      type: notification.type,
      title: notification.title,
      content: notification.content,
      data: notification.data,
      group_id: groupId
    }));
    
    await this.notificationRepository.createMany(notifications);
    
    // 即時推送
    for (const member of groupMembers) {
      if (member.notification_preferences.push_enabled) {
        await this.pushNotificationService.send(member.user_id, notification);
      }
    }
  }
  
  async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    return this.userPreferencesRepository.findOne({
      where: { user_id: userId }
    }) || this.getDefaultNotificationPreferences();
  }
  
  async updateNotificationPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<void> {
    await this.userPreferencesRepository.upsert({
      user_id: userId,
      ...preferences
    }, ['user_id']);
  }
}
```

## 6. 性能優化策略

### 6.1 快取策略
```typescript
class CommunityCache {
  private redis: Redis;
  
  // 群組資訊快取
  async cacheGroupInfo(groupId: string, groupData: Group): Promise<void> {
    const cacheKey = `group:${groupId}`;
    await this.redis.setex(cacheKey, 3600, JSON.stringify(groupData));
  }
  
  async getCachedGroupInfo(groupId: string): Promise<Group | null> {
    const cacheKey = `group:${groupId}`;
    const cached = await this.redis.get(cacheKey);
    return cached ? JSON.parse(cached) : null;
  }
  
  // 熱門內容快取
  async cacheTrendingContent(timeRange: string, content: Content[]): Promise<void> {
    const cacheKey = `trending:${timeRange}`;
    await this.redis.setex(cacheKey, 1800, JSON.stringify(content)); // 30分鐘
  }
  
  // 用戶群組列表快取
  async cacheUserGroups(userId: string, groups: Group[]): Promise<void> {
    const cacheKey = `user:groups:${userId}`;
    await this.redis.setex(cacheKey, 1800, JSON.stringify(groups));
  }
  
  // 快取失效策略
  async invalidateGroupCache(groupId: string): Promise<void> {
    const patterns = [
      `group:${groupId}`,
      `group:members:${groupId}`,
      `group:content:${groupId}*`
    ];
    
    for (const pattern of patterns) {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    }
  }
}
```

### 6.2 資料庫優化
```sql
-- 分區表設計（按時間分區）
CREATE TABLE group_content_y2025m01 PARTITION OF group_content
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE group_content_y2025m02 PARTITION OF group_content
FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- 複合索引優化
CREATE INDEX idx_group_content_group_time ON group_content (group_id, created_at DESC);
CREATE INDEX idx_group_content_author_time ON group_content (author_id, created_at DESC);
CREATE INDEX idx_content_interactions_content_type ON content_interactions (content_id, interaction_type);

-- 部分索引（只索引活躍內容）
CREATE INDEX idx_active_group_content ON group_content (group_id, created_at DESC)
WHERE is_approved = true AND created_at > NOW() - INTERVAL '30 days';
```

## 7. 實施計劃

### 7.1 第一階段（MVP）- 6週
- [ ] 基礎群組功能（創建、加入、離開）
- [ ] 群組聊天功能
- [ ] 簡單的內容發布和瀏覽
- [ ] 基礎的用戶權限管理
- [ ] 內容舉報功能

### 7.2 第二階段 - 8週
- [ ] 活動管理系統
- [ ] 內容搜尋功能
- [ ] 推薦系統整合
- [ ] 通知系統
- [ ] 進階權限管理

### 7.3 第三階段 - 10週
- [ ] 內容審核系統
- [ ] 徽章和成就系統
- [ ] 社群分析功能
- [ ] 進階搜尋和過濾
- [ ] 多媒體內容支援

### 7.4 第四階段 - 持續優化
- [ ] AI 內容審核 (未來延伸功能)
- [ ] 個性化推薦優化
- [ ] 社群治理工具
- [ ] 數據分析儀表板
- [ ] 第三方整合

## 8. 技術建議

### 8.1 推薦技術棧
- **即時通訊**: Socket.IO + Redis Adapter
- **搜尋引擎**: Typesense (主要推薦) + 中文分詞
- **檔案存儲**: MinIO (自建) 或 AWS S3
- **快取**: Redis Cluster
- **資料庫**: PostgreSQL + 讀寫分離

### 8.2 成本估算
- **Typesense 服務器**: $30-80/月 (已選用，相比 Elasticsearch 節省 60-70%)
- **檔案存儲**: $50-150/月
- **額外計算資源**: $100-200/月
- **總成本**: $180-430/月 (相比原方案節省 $120-220/月)

### 8.3 性能目標
- **群組聊天延遲**: < 100ms
- **內容載入時間**: < 500ms
- **搜尋響應時間**: < 200ms
- **系統可用性**: > 99.9%
- **並發用戶**: 10,000+

---

**文檔版本**: v1.0  
**最後更新**: 2025-01-02  
**狀態**: ✅ 規劃完成，待實施