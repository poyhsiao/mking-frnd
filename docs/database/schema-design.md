# MKing Friend - Database Schema Design

## 1. Database Overview

### 1.1 Design Principles
- **Normalization**: Follow Third Normal Form (3NF) to reduce data redundancy
- **Performance Optimization**: Strategic denormalization for query performance
- **Scalability**: Support for horizontal and vertical scaling
- **Security**: Sensitive data encryption and access control
- **Version Control**: Schema versioning using Prisma migrations

### 1.2 Technology Stack
- **Primary Database**: PostgreSQL 14+
- **Cache Database**: Redis 7+
- **ORM**: Prisma 5+
- **Migration Tool**: Prisma Migrate
- **Backup Strategy**: Daily automated backups + real-time replication

### 1.3 Naming Conventions
- **Tables**: snake_case (e.g., user_profiles)
- **Columns**: snake_case (e.g., created_at)
- **Indexes**: idx_tablename_columnname
- **Foreign Keys**: fk_tablename_columnname
- **Constraints**: ck_tablename_columnname

## 2. Core Database Tables

### 2.1 User System

#### 2.1.1 users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- Nullable for OAuth users
    email_verified BOOLEAN DEFAULT FALSE,
    phone VARCHAR(20),
    phone_verified BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active', -- active, suspended, deleted
    last_login_at TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);
```

#### 2.1.2 user_profiles Table
```sql
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url VARCHAR(500),
    cover_image_url VARCHAR(500),
    birth_date DATE,
    gender VARCHAR(20),
    location VARCHAR(100),
    website VARCHAR(200),
    privacy_level VARCHAR(20) DEFAULT 'public', -- public, friends, private
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_user_profiles_display_name ON user_profiles(display_name);
```

### 2.2 Social Relationships

#### 2.2.1 friendships Table
```sql
CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    addressee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, blocked
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(requester_id, addressee_id)
);

-- Indexes
CREATE INDEX idx_friendships_requester_id ON friendships(requester_id);
CREATE INDEX idx_friendships_addressee_id ON friendships(addressee_id);
CREATE INDEX idx_friendships_status ON friendships(status);
```

#### 2.2.2 followers Table
```sql
CREATE TABLE followers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

-- Indexes
CREATE INDEX idx_followers_follower_id ON followers(follower_id);
CREATE INDEX idx_followers_following_id ON followers(following_id);
```

### 2.3 Content System

#### 2.3.1 posts Table
```sql
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    post_type VARCHAR(20) DEFAULT 'text', -- text, image, video, link
    privacy_level VARCHAR(20) DEFAULT 'public', -- public, friends, private
    location VARCHAR(100),
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_created_at ON posts(created_at);
CREATE INDEX idx_posts_privacy_level ON posts(privacy_level);
CREATE INDEX idx_posts_post_type ON posts(post_type);
```

#### 2.3.2 post_media Table
```sql
CREATE TABLE post_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    media_type VARCHAR(20) NOT NULL, -- image, video, audio
    media_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    file_size BIGINT,
    duration INTEGER, -- For video/audio in seconds
    width INTEGER, -- For images/videos
    height INTEGER, -- For images/videos
    alt_text TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_post_media_post_id ON post_media(post_id);
CREATE INDEX idx_post_media_media_type ON post_media(media_type);
```

#### 2.3.3 comments Table
```sql
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    replies_count INTEGER DEFAULT 0,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_author_id ON comments(author_id);
CREATE INDEX idx_comments_parent_comment_id ON comments(parent_comment_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);
```

#### 2.3.4 likes Table
```sql
CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(20) NOT NULL, -- post, comment
    target_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, target_type, target_id)
);

-- Indexes
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_likes_target ON likes(target_type, target_id);
```

### 2.4 Messaging System

#### 2.4.1 conversations Table
```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_type VARCHAR(20) DEFAULT 'direct', -- direct, group
    title VARCHAR(100), -- For group conversations
    description TEXT, -- For group conversations
    avatar_url VARCHAR(500), -- For group conversations
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    last_message_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_conversations_type ON conversations(conversation_type);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at);
```

#### 2.4.2 conversation_participants Table
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

-- Indexes
CREATE INDEX idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX idx_conversation_participants_user_id ON conversation_participants(user_id);
```

#### 2.4.3 messages Table
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_type VARCHAR(20) DEFAULT 'text', -- text, image, video, audio, file
    content TEXT,
    media_url VARCHAR(500),
    file_name VARCHAR(255),
    file_size BIGINT,
    reply_to_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_reply_to ON messages(reply_to_message_id);
```

### 2.5 Groups and Communities

#### 2.5.1 groups Table
```sql
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    avatar_url VARCHAR(500),
    cover_image_url VARCHAR(500),
    group_type VARCHAR(20) DEFAULT 'public', -- public, private, secret
    category VARCHAR(50),
    location VARCHAR(100),
    member_count INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_groups_name ON groups(name);
CREATE INDEX idx_groups_type ON groups(group_type);
CREATE INDEX idx_groups_category ON groups(category);
CREATE INDEX idx_groups_created_by ON groups(created_by);
```

#### 2.5.2 group_members Table
```sql
CREATE TABLE group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member', -- admin, moderator, member
    status VARCHAR(20) DEFAULT 'active', -- active, pending, banned
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(group_id, user_id)
);

-- Indexes
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_group_members_role ON group_members(role);
```

### 2.6 Events System

#### 2.6.1 events Table
```sql
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_type VARCHAR(50),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    timezone VARCHAR(50),
    location VARCHAR(200),
    venue_name VARCHAR(100),
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    max_attendees INTEGER,
    current_attendees INTEGER DEFAULT 0,
    is_online BOOLEAN DEFAULT FALSE,
    meeting_url VARCHAR(500),
    cover_image_url VARCHAR(500),
    privacy_level VARCHAR(20) DEFAULT 'public',
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
    is_cancelled BOOLEAN DEFAULT FALSE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_location ON events(location);
CREATE INDEX idx_events_created_by ON events(created_by);
CREATE INDEX idx_events_group_id ON events(group_id);
```

#### 2.6.2 event_attendees Table
```sql
CREATE TABLE event_attendees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'going', -- going, maybe, not_going
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- Indexes
CREATE INDEX idx_event_attendees_event_id ON event_attendees(event_id);
CREATE INDEX idx_event_attendees_user_id ON event_attendees(user_id);
CREATE INDEX idx_event_attendees_status ON event_attendees(status);
```

### 2.7 Notifications System

#### 2.7.1 notifications Table
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    data JSONB, -- Additional structured data
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    action_url VARCHAR(500),
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_data ON notifications USING GIN(data);
```

## 3. Data Relationships

### 3.1 Primary Relationships
- Users have one-to-one relationship with UserProfiles
- Users can have many-to-many relationships through Friendships
- Users can create many Posts, Comments, and Messages
- Posts can have many Comments and Likes
- Conversations can have many Messages and Participants
- Groups can have many Members and Events

### 3.2 Referential Integrity
- All foreign keys use CASCADE DELETE where appropriate
- Soft deletes implemented for critical data (posts, messages)
- Orphaned records cleanup through scheduled jobs

## 4. Performance Optimization

### 4.1 Indexing Strategy
- Primary keys: UUID with B-tree indexes
- Foreign keys: Composite indexes for join optimization
- Search fields: GIN indexes for full-text search
- Timestamp fields: B-tree indexes for range queries

### 4.2 Query Optimization
- Materialized views for complex aggregations
- Partial indexes for filtered queries
- Connection pooling with PgBouncer
- Read replicas for read-heavy operations

### 4.3 Caching Strategy
- Redis for session management
- Application-level caching for frequently accessed data
- CDN for media content
- Database query result caching

## 5. Security Considerations

### 5.1 Data Protection
- Password hashing using bcrypt
- Sensitive data encryption at rest
- PII data anonymization for analytics
- GDPR compliance for data deletion

### 5.2 Access Control
- Row-level security (RLS) policies
- Database user roles and permissions
- API-level authorization checks
- Audit logging for sensitive operations

## 6. Backup and Recovery

### 6.1 Backup Strategy
- Daily full database backups
- Continuous WAL archiving
- Point-in-time recovery capability
- Cross-region backup replication

### 6.2 Disaster Recovery
- Hot standby replicas
- Automated failover procedures
- Recovery time objective (RTO): < 1 hour
- Recovery point objective (RPO): < 15 minutes

## 7. Monitoring and Maintenance

### 7.1 Database Monitoring
- Query performance monitoring
- Connection pool monitoring
- Disk space and I/O monitoring
- Replication lag monitoring

### 7.2 Maintenance Tasks
- Regular VACUUM and ANALYZE operations
- Index maintenance and optimization
- Statistics updates
- Log rotation and cleanup

## 8. Migration Strategy

### 8.1 Schema Migrations
- Prisma Migrate for version control
- Backward-compatible changes when possible
- Blue-green deployments for major changes
- Rollback procedures for failed migrations

### 8.2 Data Migrations
- Incremental data migration scripts
- Data validation and integrity checks
- Performance impact assessment
- Rollback data procedures

## 9. Future Considerations

### 9.1 Scalability Planning
- Horizontal partitioning strategies
- Microservices data separation
- Event sourcing for audit trails
- CQRS pattern implementation

### 9.2 Technology Evolution
- PostgreSQL version upgrade path
- Alternative database technologies evaluation
- Cloud-native database services migration
- Real-time data streaming integration

---

**Note**: This schema design follows industry best practices and is optimized for a social media platform. Regular reviews and updates should be conducted as the application evolves and scales.