# MKing Friend - Community Features Expansion Planning

## 1. Feature Overview

### 1.1 Core Community Features
- **Interest Groups**: Group functionality based on shared interests
- **Event Organization**: Online/offline event creation and participation
- **Community Feed**: Social media-like dynamic sharing
- **Forum Discussions**: Topic-based discussion areas
- **User-Generated Content**: Article, photo, and video sharing
- **Community Governance**: Reporting, moderation, and management mechanisms

### 1.2 Community Interaction Features
- **Group Chat**: Multi-user group instant messaging
- **Video Chat**: One-on-one and group video calls
- **Voice Chat**: Voice calls and voice messages
- **Event Registration**: Event participation and management
- **Content Interaction**: Likes, comments, and shares
- **User Following**: Follow users of interest
- **Community Rankings**: Activity and contribution rankings
- **Badge System**: Achievement and certification badges

### 1.3 Content Management Features
- **Content Classification**: Multi-level content categorization system
- **Search Functionality**: Full-text search and tag search
- **Content Recommendation**: Personalized content recommendations
- **Trending Content**: Trending and popular content display
- **Content Archiving**: Historical content management

## 2. Technical Solution Comparison

### 2.1 Real-time Communication Solutions

#### 2.1.1 Socket.IO (Recommended)
**Advantages:**
- Perfect integration with Node.js
- Automatic fallback support
- Rich features and plugins
- Support for rooms and namespaces
- Good error handling

**Disadvantages:**
- Relatively heavy
- Requires sticky sessions

**Implementation Example:**
```javascript
// Group chat service
class GroupChatService {
  constructor(io) {
    this.io = io;
    this.setupEventHandlers();
  }
  
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      // Join group
      socket.on('join-group', async (data) => {
        const { groupId, userId } = data;
        const hasPermission = await this.checkGroupPermission(userId, groupId);
        
        if (hasPermission) {
          socket.join(`group-${groupId}`);
          socket.emit('joined-group', { groupId });
          
          // Notify other members
          socket.to(`group-${groupId}`).emit('user-joined', {
            userId,
            timestamp: new Date()
          });
        }
      });
      
      // Group message
      socket.on('group-message', async (data) => {
        const { groupId, message, userId } = data;
        
        // Save message
        const savedMessage = await this.saveGroupMessage({
          groupId,
          userId,
          content: message.content,
          type: message.type
        });
        
        // Broadcast to group members
        this.io.to(`group-${groupId}`).emit('new-group-message', savedMessage);
      });
    });
  }
}
```

#### 2.1.2 Native WebSocket
**Advantages:**
- Lightweight
- Full control
- Best performance

**Disadvantages:**
- Need to handle connection management manually
- Lack of features like auto-reconnection
- High development complexity

#### 2.1.3 Third-party Services (e.g., Pusher)
**Advantages:**
- Quick implementation
- Stable and reliable
- Feature-rich

**Disadvantages:**
- Higher cost
- Third-party dependency
- Customization limitations

### 2.2 Video Chat Solutions

#### 2.2.1 WebRTC (Recommended)
**Advantages:**
- Open source and free
- Peer-to-peer communication with low latency
- Native browser support
- Supports audio, video, and data transmission
- Automatic network adaptation

**Disadvantages:**
- Higher implementation complexity
- Requires STUN/TURN servers
- Cross-platform compatibility needs handling

**Implementation Example:**
```javascript
// WebRTC video chat service
class VideoCallService {
  constructor(io, stunServers) {
    this.io = io;
    this.stunServers = stunServers;
    this.activeCalls = new Map();
    this.setupSignalingServer();
  }
  
  setupSignalingServer() {
    this.io.on('connection', (socket) => {
      // Initiate video call
      socket.on('initiate-call', async (data) => {
        const { callerId, targetUserId, callType } = data; // callType: 'video' | 'audio'
        
        // Check if target user is online
        const targetSocket = this.getUserSocket(targetUserId);
        if (!targetSocket) {
          socket.emit('call-failed', { reason: 'User offline' });
          return;
        }
        
        // Check if user is already in a call
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
        
        // Send call invitation
        targetSocket.emit('incoming-call', {
          callId,
          caller: await this.getUserInfo(callerId),
          callType
        });
        
        socket.emit('call-initiated', { callId });
      });
      
      // Accept call
      socket.on('accept-call', (data) => {
        const { callId } = data;
        const call = this.activeCalls.get(callId);
        
        if (call) {
          call.status = 'connected';
          
          // Notify both parties to start WebRTC connection
          const callerSocket = this.getUserSocket(call.caller);
          const targetSocket = this.getUserSocket(call.target);
          
          callerSocket.emit('call-accepted', { callId });
          targetSocket.emit('call-accepted', { callId });
          
          // Join call room
          callerSocket.join(`call-${callId}`);
          targetSocket.join(`call-${callId}`);
        }
      });
      
      // Reject call
      socket.on('reject-call', (data) => {
        const { callId } = data;
        const call = this.activeCalls.get(callId);
        
        if (call) {
          const callerSocket = this.getUserSocket(call.caller);
          callerSocket.emit('call-rejected', { callId });
          
          this.activeCalls.delete(callId);
        }
      });
      
      // WebRTC signaling
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
      
      // End call
      socket.on('end-call', (data) => {
        const { callId } = data;
        this.endCall(callId);
      });
      
      // Handle user disconnect
      socket.on('disconnect', () => {
        this.handleUserDisconnect(socket.userId);
      });
    });
  }
  
  endCall(callId) {
    const call = this.activeCalls.get(callId);
    if (call) {
      // Notify all participants
      this.io.to(`call-${callId}`).emit('call-ended', { callId });
      
      // Record call history
      this.saveCallHistory(call);
      
      // Clean up resources
      this.activeCalls.delete(callId);
    }
  }
}
```

#### 2.2.2 Jitsi Meet (Open Source Solution)
**Advantages:**
- Complete video conferencing solution
- Open source and free
- Supports multi-party video conferences
- Can be self-hosted
- Feature-rich (screen sharing, recording, etc.)

**Disadvantages:**
- Higher resource consumption
- Requires additional server configuration
- Limited customization

**Integration Example:**
```javascript
// Jitsi Meet integration
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

#### 2.2.3 Coturn (TURN/STUN Server)
**Purpose:**
- Provide NAT traversal for WebRTC
- Handle firewall and router limitations
- Ensure video call connection success rate

**Configuration Example:**
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

#### 2.2.4 Technical Solution Comparison Summary

| Solution | Cost | Complexity | Feature Completeness | Control | Recommendation |
|----------|------|------------|---------------------|---------|----------------|
| WebRTC + Custom Signaling | Low | High | Medium | High | ⭐⭐⭐⭐ |
| Jitsi Meet | Low | Medium | High | Medium | ⭐⭐⭐⭐⭐ |
| Third-party Service | High | Low | High | Low | ⭐⭐ |

**Recommended Solution**: Use **Jitsi Meet** as the main video conferencing solution, combined with **WebRTC** for one-on-one call functionality.

### 2.3 Content Management System

#### 2.3.1 Custom CMS (Recommended)
**Advantages:**
- Fully customizable
- Integration with existing systems
- No licensing fees
- Complete data control

**Disadvantages:**
- Longer development time
- Requires ongoing maintenance

**Architecture Design:**
```typescript
// Content management service
interface ContentManagementService {
  // Content CRUD
  createContent(content: ContentInput): Promise<Content>;
  updateContent(id: string, updates: Partial<ContentInput>): Promise<Content>;
  deleteContent(id: string): Promise<void>;
  getContent(id: string): Promise<Content>;
  
  // Content queries
  searchContent(query: SearchQuery): Promise<SearchResult>;
  getContentByCategory(categoryId: string, pagination: Pagination): Promise<Content[]>;
  getTrendingContent(timeRange: TimeRange): Promise<Content[]>;
  
  // Content interaction
  likeContent(contentId: string, userId: string): Promise<void>;
  commentOnContent(contentId: string, comment: CommentInput): Promise<Comment>;
  shareContent(contentId: string, userId: string): Promise<void>;
  
  // Content moderation
  reportContent(contentId: string, report: ReportInput): Promise<void>;
  moderateContent(contentId: string, action: ModerationAction): Promise<void>;
}
```

#### 2.3.2 Headless CMS (e.g., Strapi)
**Advantages:**
- Quick setup
- Complete admin interface
- Auto-generated APIs
- Rich plugin ecosystem

**Disadvantages:**
- Learning curve
- May be overly complex
- Customization limitations

### 2.4 Search Engine Selection

#### 2.4.1 Typesense (Primary Recommendation)
**Advantages:**
- Real-time search experience
- Simple configuration
- Excellent Chinese word segmentation
- Low resource consumption
- Built-in geo-search

**Disadvantages:**
- GPL v3 license
- Relatively new technology
- Smaller community

#### 2.4.2 Elasticsearch (Enterprise Alternative, replaced with Typesense)
**Advantages:**
- Powerful full-text search
- Supports complex queries
- Good Chinese support
- Rich analytics features

**Disadvantages:**
- High resource consumption
- Complex configuration
- Steep learning curve

**Implementation Example:**
```javascript
// Typesense search service (Primary recommendation)
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
    
    // Add filter conditions
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
      console.error('Search error:', error);
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

#### 2.4.3 PostgreSQL Full-text Search
**Advantages:**
- Integration with existing database
- No additional services needed
- Supports Chinese word segmentation

**Disadvantages:**
- Relatively simple functionality
- Performance not as good as dedicated search engines
- Limited complex query support

#### 2.4.4 Algolia
**Advantages:**
- Real-time search experience
- Easy integration
- Powerful analytics features

**Disadvantages:**
- Paid service
- Third-party dependency
- Cost increases with usage

## 3. System Architecture Design

### 3.1 Overall Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend App  │    │   API Gateway   │    │   Group Service │
│   (React)       │◄──►│   (Express)     │◄──►│   (Node.js)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │ Content Service │    │  Event Service  │
                       │   (Node.js)     │    │   (Node.js)     │
                       └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Search Engine  │    │ Main Database   │    │  File Storage   │
│  (Typesense)    │◄──►│  (PostgreSQL)   │◄──►│  (MinIO/S3)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Cache Layer   │
                       │   (Redis)       │
                       └─────────────────┘
```

### 3.2 Database Design
```sql
-- Groups table
CREATE TABLE community_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES group_categories(id),
    creator_id UUID REFERENCES users(id),
    privacy_level INTEGER DEFAULT 1, -- 1: public, 2: private, 3: invite-only
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

-- Group members table
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

-- Group content table
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

-- Events table
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

-- Event participants table
CREATE TABLE event_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES community_events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'registered', -- 'registered', 'attended', 'cancelled'
    registered_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- Content interactions table
CREATE TABLE content_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID REFERENCES group_content(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    interaction_type VARCHAR(20), -- 'like', 'comment', 'share', 'report'
    comment_text TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(content_id, user_id, interaction_type)
);

-- Indexes
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

### 3.3 API Design
```typescript
// Community service API
interface CommunityService {
  // Group management
  createGroup(group: CreateGroupInput): Promise<Group>;
  updateGroup(groupId: string, updates: UpdateGroupInput): Promise<Group>;
  deleteGroup(groupId: string): Promise<void>;
  getGroup(groupId: string): Promise<Group>;
  searchGroups(query: GroupSearchQuery): Promise<Group[]>;
  
  // Member management
  joinGroup(groupId: string, userId: string): Promise<void>;
  leaveGroup(groupId: string, userId: string): Promise<void>;
  inviteToGroup(groupId: string, inviterUserId: string, inviteeUserId: string): Promise<void>;
  updateMemberRole(groupId: string, userId: string, role: MemberRole): Promise<void>;
  
  // Content management
  createContent(content: CreateContentInput): Promise<Content>;
  updateContent(contentId: string, updates: UpdateContentInput): Promise<Content>;
  deleteContent(contentId: string): Promise<void>;
  getGroupContent(groupId: string, pagination: Pagination): Promise<Content[]>;
  
  // Event management
  createEvent(event: CreateEventInput): Promise<Event>;
  updateEvent(eventId: string, updates: UpdateEventInput): Promise<Event>;
  registerForEvent(eventId: string, userId: string): Promise<void>;
  cancelEventRegistration(eventId: string, userId: string): Promise<void>;
  
  // Interaction features
  likeContent(contentId: string, userId: string): Promise<void>;
  commentOnContent(contentId: string, comment: CommentInput): Promise<Comment>;
  reportContent(contentId: string, report: ReportInput): Promise<void>;
}
```

## 4. Core Feature Implementation

### 4.1 Group Management System
```typescript
class GroupManagementService {
  async createGroup(groupData: CreateGroupInput, creatorId: string): Promise<Group> {
    // Validate group creation permission
    await this.validateGroupCreationPermission(creatorId);
    
    // Create group
    const group = await this.groupRepository.create({
      ...groupData,
      creator_id: creatorId,
      current_members: 1
    });
    
    // Add creator to group as admin
    await this.addGroupMember(group.id, creatorId, 'admin');
    
    // Create default channels
    await this.createDefaultChannels(group.id);
    
    // Send notification
    await this.notificationService.sendGroupCreatedNotification(group);
    
    return group;
  }
  
  async joinGroup(groupId: string, userId: string): Promise<void> {
    const group = await this.getGroup(groupId);
    
    // Check if group is full
    if (group.current_members >= group.max_members) {
      throw new Error('Group is full');
    }
    
    // Check privacy settings
    if (group.privacy_level === 3) { // Invite-only
      const invitation = await this.getGroupInvitation(groupId, userId);
      if (!invitation) {
        throw new Error('Invitation required to join this group');
      }
    }
    
    // Join group
    await this.addGroupMember(groupId, userId, 'member');
    
    // Update group member count
    await this.updateGroupMemberCount(groupId, 1);
    
    // Send welcome message
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

### 4.2 Content Management System
```typescript
class ContentManagementService {
  async createContent(contentData: CreateContentInput): Promise<Content> {
    // Content validation
    await this.validateContent(contentData);
    
    // Create content
    const content = await this.contentRepository.create(contentData);
    
    // Process media files
    if (contentData.media_files) {
      await this.processMediaFiles(content.id, contentData.media_files);
    }
    
    // Extract and process tags
    const tags = this.extractTags(contentData.content);
    await this.updateContentTags(content.id, tags);
    
    // Index to Typesense search engine
    await this.searchService.indexContent(content);
    
    // Notify group members
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
    
    // Log moderation action
    await this.logModerationAction(contentId, action);
  }
  
  private async validateContent(content: CreateContentInput): Promise<void> {
    // Content length check
    if (content.content && content.content.length > 10000) {
      throw new Error('Content length exceeds limit');
    }
    
    // Sensitive word check
    const hasSensitiveWords = await this.checkSensitiveWords(content.content);
    if (hasSensitiveWords) {
      throw new Error('Content contains sensitive words');
    }
    
    // Spam content check
    const isSpam = await this.checkSpamContent(content);
    if (isSpam) {
      throw new Error('Content identified as spam');
    }
  }
}
```

### 4.3 Event Management System
```typescript
class EventManagementService {
  async createEvent(eventData: CreateEventInput): Promise<Event> {
    // Validate event data
    await this.validateEventData(eventData);
    
    // Create event
    const event = await this.eventRepository.create(eventData);
    
    // Set up reminders
    await this.scheduleEventReminders(event);
    
    // Notify group members
    await this.notifyGroupMembers(event.group_id, {
      type: 'new_event',
      event
    });
    
    return event;
  }
  
  async registerForEvent(eventId: string, userId: string): Promise<void> {
    const event = await this.getEvent(eventId);
    
    // Check registration deadline
    if (event.registration_deadline && new Date() > event.registration_deadline) {
      throw new Error('Registration deadline has passed');
    }
    
    // Check participant limit
    if (event.max_participants && event.current_participants >= event.max_participants) {
      throw new Error('Event is full');
    }
    
    // Check if already registered
    const existingRegistration = await this.getEventRegistration(eventId, userId);
    if (existingRegistration) {
      throw new Error('Already registered for this event');
    }
    
    // Create registration record
    await this.eventParticipantRepository.create({
      event_id: eventId,
      user_id: userId,
      status: 'registered'
    });
    
    // Update participant count
    await this.updateEventParticipantCount(eventId, 1);
    
    // Send confirmation notification
    await this.sendRegistrationConfirmation(eventId, userId);
  }
  
  private async scheduleEventReminders(event: Event): Promise<void> {
    const reminderTimes = [
      new Date(event.start_time.getTime() - 24 * 60 * 60 * 1000), // 1 day before
      new Date(event.start_time.getTime() - 60 * 60 * 1000), // 1 hour before
      new Date(event.start_time.getTime() - 15 * 60 * 1000)  // 15 minutes before
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

### 4.4 Community Governance System
```typescript
class CommunityModerationService {
  async reportContent(contentId: string, reportData: ReportInput): Promise<void> {
    // Create report record
    const report = await this.reportRepository.create({
      content_id: contentId,
      reporter_id: reportData.reporter_id,
      reason: reportData.reason,
      description: reportData.description,
      status: 'pending'
    });
    
    // Auto-check if immediate action is needed
    const shouldAutoModerate = await this.shouldAutoModerate(contentId, reportData.reason);
    if (shouldAutoModerate) {
      await this.autoModerateContent(contentId);
    }
    
    // Notify moderators
    await this.notifyModerators(report);
  }
  
  async processReport(reportId: string, action: ModerationAction): Promise<void> {
    const report = await this.getReport(reportId);
    
    // Update report status
    await this.updateReportStatus(reportId, 'processed');
    
    // Execute corresponding action
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
    
    // Log processing result
    await this.logModerationAction(reportId, action);
  }
  
  private async shouldAutoModerate(contentId: string, reason: string): Promise<boolean> {
    // Check report count
    const reportCount = await this.getContentReportCount(contentId);
    if (reportCount >= 5) {
      return true;
    }
    
    // Check reason severity
    const severityLevel = this.getReasonSeverity(reason);
    if (severityLevel >= 8) {
      return true;
    }
    
    return false;
  }
}
```

## 5. User Experience Optimization

### 5.1 Personalized Recommendations
```typescript
class CommunityRecommendationService {
  async getRecommendedGroups(userId: string): Promise<Group[]> {
    const userProfile = await this.getUserProfile(userId);
    const userInterests = await this.getUserInterests(userId);
    const userActivity = await this.getUserActivity(userId);
    
    // Interest-based recommendations
    const interestBasedGroups = await this.getGroupsByInterests(userInterests);
    
    // Location-based recommendations
    const locationBasedGroups = await this.getNearbyGroups(userProfile.location);
    
    // Friend activity-based recommendations
    const friendBasedGroups = await this.getGroupsByFriends(userId);
    
    // Combine and rank recommendations
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
      // Only recommend content from groups user has joined
      const userGroups = await this.getUserGroups(userId);
      baseQuery = baseQuery.andWhere('content.group_id IN (:...groupIds)', {
        groupIds: userGroups.map(g => g.id)
      });
    }
    
    // Sort by user preferences
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

### 5.2 Notification System
```typescript
class CommunityNotificationService {
  async sendGroupNotification(groupId: string, notification: NotificationData): Promise<void> {
    const groupMembers = await this.getGroupMembers(groupId);
    
    // Batch send notifications
    const notifications = groupMembers.map(member => ({
      user_id: member.user_id,
      type: notification.type,
      title: notification.title,
      content: notification.content,
      data: notification.data,
      group_id: groupId
    }));
    
    await this.notificationRepository.createMany(notifications);
    
    // Real-time push
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

## 6. Performance Optimization Strategies

### 6.1 Caching Strategy
```typescript
class CommunityCache {
  private redis: Redis;
  
  // Group info cache
  async cacheGroupInfo(groupId: string, groupData: Group): Promise<void> {
    const cacheKey = `group:${groupId}`;
    await this.redis.setex(cacheKey, 3600, JSON.stringify(groupData));
  }
  
  async getCachedGroupInfo(groupId: string): Promise<Group | null> {
    const cacheKey = `group:${groupId}`;
    const cached = await this.redis.get(cacheKey);
    return cached ? JSON.parse(cached) : null;
  }
  
  // Trending content cache
  async cacheTrendingContent(timeRange: string, content: Content[]): Promise<void> {
    const cacheKey = `trending:${timeRange}`;
    await this.redis.setex(cacheKey, 1800, JSON.stringify(content)); // 30 minutes
  }
  
  // User groups list cache
  async cacheUserGroups(userId: string, groups: Group[]): Promise<void> {
    const cacheKey = `user:groups:${userId}`;
    await this.redis.setex(cacheKey, 1800, JSON.stringify(groups));
  }
  
  // Cache invalidation strategy
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

### 6.2 Database Optimization
```sql
-- Partitioned tables (by time)
CREATE TABLE group_content_y2025m01 PARTITION OF group_content
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE group_content_y2025m02 PARTITION OF group_content
FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- Composite index optimization
CREATE INDEX idx_group_content_group_time ON group_content (group_id, created_at DESC);
CREATE INDEX idx_group_content_author_time ON group_content (author_id, created_at DESC);
CREATE INDEX idx_content_interactions_content_type ON content_interactions (content_id, interaction_type);

-- Partial indexes (only index active content)
CREATE INDEX idx_active_group_content ON group_content (group_id, created_at DESC)
WHERE is_approved = true AND created_at > NOW() - INTERVAL '30 days';
```

## 7. Implementation Plan

### 7.1 Phase 1 (MVP) - 6 weeks
- [ ] Basic group functionality (create, join, leave)
- [ ] Group chat functionality
- [ ] Simple content publishing and browsing
- [ ] Basic user permission management
- [ ] Content reporting functionality

### 7.2 Phase 2 - 8 weeks
- [ ] Event management system
- [ ] Content search functionality
- [ ] Recommendation system integration
- [ ] Notification system
- [ ] Advanced permission management

### 7.3 Phase 3 - 10 weeks
- [ ] Content moderation system
- [ ] Badge and achievement system
- [ ] Community analytics features
- [ ] Advanced search and filtering
- [ ] Multimedia content support

### 7.4 Phase 4 - Continuous optimization
- [ ] AI content moderation (future extension)
- [ ] Personalized recommendation optimization
- [ ] Community governance tools
- [ ] Data analytics dashboard
- [ ] Third-party integrations

## 8. Technical Recommendations

### 8.1 Recommended Tech Stack
- **Real-time Communication**: Socket.IO + Redis Adapter
- **Search Engine**: Typesense (primary recommendation) + Chinese word segmentation
- **File Storage**: MinIO (self-hosted) or AWS S3
- **Caching**: Redis Cluster
- **Database**: PostgreSQL + read-write separation

### 8.2 Cost Estimation
- **Typesense Server**: $30-80/month (selected, saves 60-70% compared to Elasticsearch)
- **File Storage**: $50-150/month
- **Additional Computing Resources**: $100-200/month
- **Total Cost**: $180-430/month (saves $120-220/month compared to original plan)

### 8.3 Performance Goals
- **Group Chat Latency**: < 100ms
- **Content Load Time**: < 500ms
- **Search Response Time**: < 200ms
- **System Availability**: > 99.9%
- **Concurrent Users**: 10,000+

---

**Document Version**: v1.0  
**Last Updated**: 2025-01-02  
**Status**: ✅ Planning Complete, Ready for Implementation