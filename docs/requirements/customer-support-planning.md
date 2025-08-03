# MKing Friend - Customer Support System Planning

## 1. Feature Overview

### 1.1 Support Scope
- **Technical Issues**: Login problems, feature malfunctions, performance issues
- **Account Issues**: Password reset, account verification, data modification
- **Usage Consultation**: Feature usage, matching suggestions, privacy settings
- **Report Handling**: Inappropriate behavior, fraud reports, content appeals
- **Payment Issues**: Subscription problems, refund requests, invoice needs
- **Feedback**: Feature suggestions, bug reports, user experience

### 1.2 Support Methods
- **Self-Service**: FAQ, knowledge base, tutorial videos
- **Form System**: Structured problem submission
- **Live Chat**: Quick response for urgent issues (future feature)
- **Email Support**: Detailed problem handling
- **Phone Support**: Emergency or complex issues (future feature)

### 1.3 Service Goals
- **Response Time**: General issues within 24 hours, urgent issues within 4 hours
- **Resolution Rate**: First response resolution rate > 70%
- **Satisfaction**: User satisfaction > 85%
- **Availability**: 7x24 hour self-service

## 2. Technical Solution Comparison

### 2.1 Ticketing System (Recommended)

#### 2.1.1 Self-Built Ticketing System

**Core Ticket Management**
```javascript
// Ticketing System Service
class TicketingService {
    constructor() {
        this.ticketStatuses = {
            'open': { priority: 1, sla: 24 * 60 * 60 * 1000 }, // 24 hours
            'in_progress': { priority: 2, sla: 48 * 60 * 60 * 1000 }, // 48 hours
            'waiting_user': { priority: 3, sla: 7 * 24 * 60 * 60 * 1000 }, // 7 days
            'resolved': { priority: 4, sla: null },
            'closed': { priority: 5, sla: null }
        };
        
        this.priorityLevels = {
            'low': { sla: 72 * 60 * 60 * 1000, escalation: 96 * 60 * 60 * 1000 },
            'medium': { sla: 24 * 60 * 60 * 1000, escalation: 48 * 60 * 60 * 1000 },
            'high': { sla: 8 * 60 * 60 * 1000, escalation: 12 * 60 * 60 * 1000 },
            'critical': { sla: 2 * 60 * 60 * 1000, escalation: 4 * 60 * 60 * 1000 }
        };
        
        this.categories = {
            'technical': { department: 'tech', autoAssign: true },
            'account': { department: 'support', autoAssign: true },
            'billing': { department: 'billing', autoAssign: true },
            'abuse': { department: 'moderation', autoAssign: true },
            'general': { department: 'support', autoAssign: false }
        };
    }
    
    async createTicket(ticketData) {
        const {
            userId,
            category,
            subject,
            description,
            priority = 'medium',
            attachments = [],
            userAgent,
            ipAddress
        } = ticketData;
        
        try {
            // 1. Generate ticket number
            const ticketNumber = await this.generateTicketNumber();
            
            // 2. Auto classification and priority adjustment
            const autoClassification = await this.autoClassifyTicket(subject, description);
            const finalPriority = this.determinePriority(priority, autoClassification);
            const finalCategory = autoClassification.category || category;
            
            // 3. Create ticket
            const ticket = await db.supportTickets.create({
                data: {
                    ticketNumber,
                    userId,
                    category: finalCategory,
                    subject,
                    description,
                    priority: finalPriority,
                    status: 'open',
                    metadata: {
                        userAgent,
                        ipAddress,
                        autoClassification,
                        attachments
                    },
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });
            
            // 4. Auto assignment
            if (this.categories[finalCategory].autoAssign) {
                await this.autoAssignTicket(ticket.id, finalCategory);
            }
            
            // 5. Send confirmation email
            await this.sendTicketConfirmation(ticket);
            
            // 6. Check if immediate escalation is needed
            if (finalPriority === 'critical') {
                await this.escalateTicket(ticket.id, 'Critical priority ticket');
            }
            
            return {
                success: true,
                ticketId: ticket.id,
                ticketNumber,
                estimatedResponseTime: this.getEstimatedResponseTime(finalPriority)
            };
            
        } catch (error) {
            console.error('Create ticket error:', error);
            return {
                success: false,
                message: 'Ticket creation failed, please try again later'
            };
        }
    }
    
    async autoClassifyTicket(subject, description) {
        const content = `${subject} ${description}`.toLowerCase();
        
        // Keyword classification
        const classificationRules = {
            'technical': [
                '登入', '登錄', '無法', '錯誤', '故障', '當機', '緩慢', '載入',
                'login', 'error', 'bug', 'crash', 'slow', 'loading'
            ],
            'account': [
                '帳戶', '帳號', '密碼', '驗證', '個人資料', '設定',
                'account', 'password', 'verification', 'profile', 'settings'
            ],
            'billing': [
                '付費', '訂閱', '退款', '發票', '收費', '金額',
                'payment', 'subscription', 'refund', 'invoice', 'billing', 'charge'
            ],
            'abuse': [
                '舉報', '騷擾', '詐騙', '不當', '違規', '封鎖',
                'report', 'harassment', 'scam', 'inappropriate', 'violation', 'block'
            ]
        };
        
        let bestMatch = { category: 'general', confidence: 0 };
        
        for (const [category, keywords] of Object.entries(classificationRules)) {
            const matches = keywords.filter(keyword => content.includes(keyword)).length;
            const confidence = matches / keywords.length;
            
            if (confidence > bestMatch.confidence) {
                bestMatch = { category, confidence };
            }
        }
        
        // Priority suggestion
        const urgencyKeywords = {
            'critical': ['無法登入', '帳戶被盜', '詐騙', '緊急', 'cannot login', 'account hacked', 'urgent'],
            'high': ['錯誤', '故障', '問題', 'error', 'bug', 'issue'],
            'low': ['建議', '意見', '諮詢', 'suggestion', 'feedback', 'question']
        };
        
        let suggestedPriority = 'medium';
        for (const [priority, keywords] of Object.entries(urgencyKeywords)) {
            if (keywords.some(keyword => content.includes(keyword))) {
                suggestedPriority = priority;
                break;
            }
        }
        
        return {
            category: bestMatch.confidence > 0.3 ? bestMatch.category : 'general',
            confidence: bestMatch.confidence,
            suggestedPriority,
            keywords: Object.keys(classificationRules).reduce((acc, cat) => {
                acc[cat] = classificationRules[cat].filter(kw => content.includes(kw));
                return acc;
            }, {})
        };
    }
    
    async autoAssignTicket(ticketId, category) {
        // Get available support agents for the department
        const department = this.categories[category].department;
        const availableAgents = await db.supportAgents.findMany({
            where: {
                department,
                status: 'available',
                isActive: true
            },
            include: {
                _count: {
                    select: {
                        assignedTickets: {
                            where: {
                                status: { in: ['open', 'in_progress'] }
                            }
                        }
                    }
                }
            }
        });
        
        if (availableAgents.length === 0) {
            // No available agents, add to assignment queue
            await this.addToAssignmentQueue(ticketId, department);
            return;
        }
        
        // Select agent with least workload
        const selectedAgent = availableAgents.reduce((min, agent) => 
            agent._count.assignedTickets < min._count.assignedTickets ? agent : min
        );
        
        // Assign ticket
        await db.supportTickets.update({
            where: { id: ticketId },
            data: {
                assignedAgentId: selectedAgent.id,
                assignedAt: new Date(),
                status: 'in_progress'
            }
        });
        
        // Notify agent
        await this.notifyAgentAssignment(selectedAgent.id, ticketId);
    }
    
    async respondToTicket(ticketId, agentId, response) {
        const {
            message,
            status = 'in_progress',
            isInternal = false,
            attachments = [],
            suggestedActions = []
        } = response;
        
        try {
            await db.$transaction(async (tx) => {
                // 1. Create response record
                const ticketResponse = await tx.ticketResponses.create({
                    data: {
                        ticketId,
                        agentId,
                        message,
                        isInternal,
                        attachments: JSON.stringify(attachments),
                        createdAt: new Date()
                    }
                });
                
                // 2. Update ticket status
                const ticket = await tx.supportTickets.update({
                    where: { id: ticketId },
                    data: {
                        status,
                        lastResponseAt: new Date(),
                        lastResponseBy: agentId,
                        updatedAt: new Date()
                    },
                    include: {
                        user: { select: { email: true, username: true } }
                    }
                });
                
                // 3. If not internal note, send email to user
                if (!isInternal) {
                    await this.sendResponseNotification(ticket, message, attachments);
                }
                
                // 4. Execute suggested actions
                for (const action of suggestedActions) {
                    await this.executeSuggestedAction(tx, ticketId, action);
                }
                
                // 5. Update agent statistics
                await this.updateAgentStats(tx, agentId, 'response');
            });
            
            return { success: true, message: 'Response sent' };
            
        } catch (error) {
            console.error('Respond to ticket error:', error);
            return { success: false, message: 'Response sending failed' };
        }
    }
    
    async escalateTicket(ticketId, reason) {
        const ticket = await db.supportTickets.findUnique({
            where: { id: ticketId },
            include: {
                assignedAgent: { select: { id: true, name: true, department: true } },
                user: { select: { id: true, username: true, email: true } }
            }
        });
        
        if (!ticket) {
            throw new Error('Ticket not found');
        }
        
        // Find supervisor or senior agent
        const supervisor = await db.supportAgents.findFirst({
            where: {
                department: ticket.assignedAgent?.department || 'support',
                role: { in: ['supervisor', 'senior'] },
                isActive: true
            }
        });
        
        if (!supervisor) {
            console.warn('No supervisor found for escalation');
            return;
        }
        
        // Create escalation record
        await db.ticketEscalations.create({
            data: {
                ticketId,
                fromAgentId: ticket.assignedAgentId,
                toAgentId: supervisor.id,
                reason,
                escalatedAt: new Date()
            }
        });
        
        // Update ticket assignment
        await db.supportTickets.update({
            where: { id: ticketId },
            data: {
                assignedAgentId: supervisor.id,
                priority: this.increasePriority(ticket.priority),
                updatedAt: new Date()
            }
        });
        
        // Notify supervisor
        await this.notifyEscalation(supervisor.id, ticketId, reason);
    }
    
    async generateTicketNumber() {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        
        // Get today's ticket count
        const todayCount = await db.supportTickets.count({
            where: {
                createdAt: {
                    gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
                    lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
                }
            }
        });
        
        const sequence = (todayCount + 1).toString().padStart(4, '0');
        return `TK${dateStr}${sequence}`;
    }
    
    determinePriority(userPriority, autoClassification) {
        const priorityWeights = {
            'low': 1,
            'medium': 2,
            'high': 3,
            'critical': 4
        };
        
        const userWeight = priorityWeights[userPriority] || 2;
        const autoWeight = priorityWeights[autoClassification.suggestedPriority] || 2;
        
        // Use higher priority
        const finalWeight = Math.max(userWeight, autoWeight);
        
        const weightToPriority = {
            1: 'low',
            2: 'medium',
            3: 'high',
            4: 'critical'
        };
        
        return weightToPriority[finalWeight];
    }
    
    getEstimatedResponseTime(priority) {
        const responseTime = {
            'low': '72 hours',
            'medium': '24 hours',
            'high': '8 hours',
            'critical': '2 hours'
        };
        
        return responseTime[priority] || '24 hours';
    }
    
    increasePriority(currentPriority) {
        const priorityOrder = ['low', 'medium', 'high', 'critical'];
        const currentIndex = priorityOrder.indexOf(currentPriority);
        
        if (currentIndex < priorityOrder.length - 1) {
            return priorityOrder[currentIndex + 1];
        }
        
        return currentPriority;
    }
}
```

#### 2.1.2 Knowledge Base System

**FAQ Management**
```javascript
// Knowledge Base Service
class KnowledgeBaseService {
    constructor() {
        this.searchEngine = new TypesenseClient({
            nodes: [{
                host: process.env.TYPESENSE_HOST,
                port: process.env.TYPESENSE_PORT,
                protocol: process.env.TYPESENSE_PROTOCOL
            }],
            apiKey: process.env.TYPESENSE_API_KEY
        });
    }
    
    async createArticle(articleData) {
        const {
            title,
            content,
            category,
            tags = [],
            authorId,
            isPublished = false,
            language = 'zh'
        } = articleData;
        
        try {
            // 1. Create article in database
            const article = await db.knowledgeArticles.create({
                data: {
                    title,
                    content,
                    category,
                    tags,
                    authorId,
                    isPublished,
                    language,
                    slug: this.generateSlug(title),
                    searchableContent: this.extractSearchableContent(content),
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });
            
            // 2. Index in search engine if published
            if (isPublished) {
                await this.indexArticle(article);
            }
            
            return { success: true, articleId: article.id };
            
        } catch (error) {
            console.error('Create article error:', error);
            return { success: false, message: 'Article creation failed' };
        }
    }
    
    async searchArticles(query, options = {}) {
        const {
            category,
            language = 'zh',
            limit = 10,
            page = 1
        } = options;
        
        try {
            // Search using Typesense
            const searchParams = {
                q: query,
                query_by: 'title,searchableContent,tags',
                filter_by: `isPublished:true && language:${language}`,
                sort_by: '_text_match:desc,viewCount:desc',
                per_page: limit,
                page: page
            };
            
            if (category) {
                searchParams.filter_by += ` && category:${category}`;
            }
            
            const searchResults = await this.searchEngine
                .collections('knowledge_articles')
                .documents()
                .search(searchParams);
            
            // Update search statistics
            await this.updateSearchStats(query, searchResults.found);
            
            return {
                success: true,
                results: searchResults.hits.map(hit => ({
                    id: hit.document.id,
                    title: hit.document.title,
                    excerpt: this.generateExcerpt(hit.document.content),
                    category: hit.document.category,
                    tags: hit.document.tags,
                    relevanceScore: hit.text_match
                })),
                total: searchResults.found,
                page,
                totalPages: Math.ceil(searchResults.found / limit)
            };
            
        } catch (error) {
            console.error('Search articles error:', error);
            
            // Fallback to database search
            return await this.fallbackSearch(query, options);
        }
    }
    
    async getPopularArticles(category = null, limit = 10) {
        const whereClause = {
            isPublished: true
        };
        
        if (category) {
            whereClause.category = category;
        }
        
        const articles = await db.knowledgeArticles.findMany({
            where: whereClause,
            orderBy: [
                { viewCount: 'desc' },
                { helpfulCount: 'desc' },
                { createdAt: 'desc' }
            ],
            take: limit,
            select: {
                id: true,
                title: true,
                category: true,
                tags: true,
                viewCount: true,
                helpfulCount: true,
                createdAt: true
            }
        });
        
        return articles;
    }
    
    async recordArticleView(articleId, userId = null) {
        try {
            await db.$transaction(async (tx) => {
                // Update view count
                await tx.knowledgeArticles.update({
                    where: { id: articleId },
                    data: {
                        viewCount: { increment: 1 },
                        lastViewedAt: new Date()
                    }
                });
                
                // Record user view if user is logged in
                if (userId) {
                    await tx.articleViews.upsert({
                        where: {
                            userId_articleId: {
                                userId,
                                articleId
                            }
                        },
                        update: {
                            viewCount: { increment: 1 },
                            lastViewedAt: new Date()
                        },
                        create: {
                            userId,
                            articleId,
                            viewCount: 1,
                            lastViewedAt: new Date()
                        }
                    });
                }
            });
            
        } catch (error) {
            console.error('Record article view error:', error);
        }
    }
    
    async rateArticleHelpfulness(articleId, userId, isHelpful) {
        try {
            await db.$transaction(async (tx) => {
                // Check if user already rated
                const existingRating = await tx.articleRatings.findUnique({
                    where: {
                        userId_articleId: {
                            userId,
                            articleId
                        }
                    }
                });
                
                if (existingRating) {
                    // Update existing rating
                    const oldRating = existingRating.isHelpful;
                    await tx.articleRatings.update({
                        where: {
                            userId_articleId: {
                                userId,
                                articleId
                            }
                        },
                        data: {
                            isHelpful,
                            updatedAt: new Date()
                        }
                    });
                    
                    // Update article counters
                    const helpfulIncrement = isHelpful ? (oldRating ? 0 : 1) : (oldRating ? -1 : 0);
                    const notHelpfulIncrement = !isHelpful ? (oldRating ? 0 : 1) : (oldRating ? -1 : 0);
                    
                    await tx.knowledgeArticles.update({
                        where: { id: articleId },
                        data: {
                            helpfulCount: { increment: helpfulIncrement },
                            notHelpfulCount: { increment: notHelpfulIncrement }
                        }
                    });
                } else {
                    // Create new rating
                    await tx.articleRatings.create({
                        data: {
                            userId,
                            articleId,
                            isHelpful,
                            createdAt: new Date()
                        }
                    });
                    
                    // Update article counters
                    await tx.knowledgeArticles.update({
                        where: { id: articleId },
                        data: {
                            helpfulCount: { increment: isHelpful ? 1 : 0 },
                            notHelpfulCount: { increment: isHelpful ? 0 : 1 }
                        }
                    });
                }
            });
            
            return { success: true };
            
        } catch (error) {
            console.error('Rate article error:', error);
            return { success: false, message: 'Rating failed' };
        }
    }
    
    generateSlug(title) {
        return title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    
    extractSearchableContent(content) {
        // Remove HTML tags and extract plain text
        return content
            .replace(/<[^>]*>/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }
    
    generateExcerpt(content, length = 200) {
        const plainText = this.extractSearchableContent(content);
        return plainText.length > length 
            ? plainText.substring(0, length) + '...'
            : plainText;
    }
    
    async indexArticle(article) {
        try {
            await this.searchEngine
                .collections('knowledge_articles')
                .documents()
                .upsert({
                    id: article.id.toString(),
                    title: article.title,
                    searchableContent: article.searchableContent,
                    category: article.category,
                    tags: article.tags,
                    language: article.language,
                    isPublished: article.isPublished,
                    viewCount: article.viewCount || 0,
                    helpfulCount: article.helpfulCount || 0,
                    createdAt: article.createdAt.getTime()
                });
        } catch (error) {
            console.error('Index article error:', error);
        }
    }
    
    async fallbackSearch(query, options) {
        const {
            category,
            language = 'zh',
            limit = 10,
            page = 1
        } = options;
        
        const whereClause = {
            isPublished: true,
            language,
            OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { searchableContent: { contains: query, mode: 'insensitive' } },
                { tags: { has: query } }
            ]
        };
        
        if (category) {
            whereClause.category = category;
        }
        
        const [articles, total] = await Promise.all([
            db.knowledgeArticles.findMany({
                where: whereClause,
                orderBy: [
                    { viewCount: 'desc' },
                    { helpfulCount: 'desc' }
                ],
                skip: (page - 1) * limit,
                take: limit,
                select: {
                    id: true,
                    title: true,
                    content: true,
                    category: true,
                    tags: true
                }
            }),
            db.knowledgeArticles.count({ where: whereClause })
        ]);
        
        return {
            success: true,
            results: articles.map(article => ({
                id: article.id,
                title: article.title,
                excerpt: this.generateExcerpt(article.content),
                category: article.category,
                tags: article.tags,
                relevanceScore: 0.5 // Default relevance for fallback
            })),
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }
}
```

### 2.2 Alternative Solutions

#### 2.2.1 Third-party Services

**Zendesk**
- Pros: Feature-rich, mature platform, good integrations
- Cons: Expensive ($49+/agent/month), overkill for small teams
- Recommendation: Not suitable for initial phase

**Freshdesk**
- Pros: More affordable ($15+/agent/month), good features
- Cons: Still costly, limited customization
- Recommendation: Consider for future expansion

**Intercom**
- Pros: Excellent live chat, modern interface
- Cons: Very expensive, focused on sales
- Recommendation: Not suitable for support-focused needs

#### 2.2.2 Open Source Solutions

**osTicket**
- Pros: Free, mature, customizable
- Cons: PHP-based, outdated interface, limited modern features
- Recommendation: Not recommended

**Zammad**
- Pros: Modern interface, good features, Ruby-based
- Cons: Complex setup, different tech stack
- Recommendation: Consider if Ruby expertise available

**UVdesk**
- Pros: Symfony-based, modern, customizable
- Cons: PHP-based, smaller community
- Recommendation: Not recommended

## 3. Database Design

### 3.1 Core Tables

```sql
-- Support Tickets
CREATE TABLE support_tickets (
    id SERIAL PRIMARY KEY,
    ticket_number VARCHAR(20) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id),
    assigned_agent_id INTEGER REFERENCES support_agents(id),
    category VARCHAR(50) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'open',
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    assigned_at TIMESTAMP,
    resolved_at TIMESTAMP,
    closed_at TIMESTAMP,
    last_response_at TIMESTAMP,
    last_response_by INTEGER REFERENCES support_agents(id)
);

-- Support Agents
CREATE TABLE support_agents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    department VARCHAR(50) NOT NULL,
    role VARCHAR(20) DEFAULT 'agent',
    status VARCHAR(20) DEFAULT 'available',
    is_active BOOLEAN DEFAULT true,
    skills JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Ticket Responses
CREATE TABLE ticket_responses (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES support_tickets(id),
    agent_id INTEGER REFERENCES support_agents(id),
    message TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    attachments JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Knowledge Articles
CREATE TABLE knowledge_articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    searchable_content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    tags TEXT[],
    author_id INTEGER REFERENCES support_agents(id),
    language VARCHAR(5) DEFAULT 'zh',
    is_published BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_viewed_at TIMESTAMP
);

-- Article Ratings
CREATE TABLE article_ratings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    article_id INTEGER REFERENCES knowledge_articles(id),
    is_helpful BOOLEAN NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, article_id)
);

-- Ticket Escalations
CREATE TABLE ticket_escalations (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES support_tickets(id),
    from_agent_id INTEGER REFERENCES support_agents(id),
    to_agent_id INTEGER REFERENCES support_agents(id),
    reason TEXT NOT NULL,
    escalated_at TIMESTAMP DEFAULT NOW()
);
```

### 3.2 Indexes

```sql
-- Performance indexes
CREATE INDEX idx_tickets_status ON support_tickets(status);
CREATE INDEX idx_tickets_priority ON support_tickets(priority);
CREATE INDEX idx_tickets_assigned_agent ON support_tickets(assigned_agent_id);
CREATE INDEX idx_tickets_user ON support_tickets(user_id);
CREATE INDEX idx_tickets_created_at ON support_tickets(created_at);
CREATE INDEX idx_tickets_category ON support_tickets(category);

CREATE INDEX idx_responses_ticket ON ticket_responses(ticket_id);
CREATE INDEX idx_responses_agent ON ticket_responses(agent_id);
CREATE INDEX idx_responses_created_at ON ticket_responses(created_at);

CREATE INDEX idx_articles_published ON knowledge_articles(is_published);
CREATE INDEX idx_articles_category ON knowledge_articles(category);
CREATE INDEX idx_articles_language ON knowledge_articles(language);
CREATE INDEX idx_articles_view_count ON knowledge_articles(view_count);

-- Full-text search index
CREATE INDEX idx_articles_search ON knowledge_articles 
USING gin(to_tsvector('english', title || ' ' || searchable_content));
```

## 4. User Interface Design

### 4.1 User Portal

**Ticket Submission Form**
```jsx
// Ticket Submission Component
import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Upload, Button, Alert, Steps } from 'antd';
import { UploadOutlined, QuestionCircleOutlined } from '@ant-design/icons';

const TicketSubmissionForm = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [suggestedArticles, setSuggestedArticles] = useState([]);
    const [currentStep, setCurrentStep] = useState(0);
    
    const categories = [
        { value: 'technical', label: 'Technical Issues' },
        { value: 'account', label: 'Account Issues' },
        { value: 'billing', label: 'Billing & Payments' },
        { value: 'abuse', label: 'Report Abuse' },
        { value: 'general', label: 'General Inquiry' }
    ];
    
    const priorities = [
        { value: 'low', label: 'Low - General question' },
        { value: 'medium', label: 'Medium - Issue affecting usage' },
        { value: 'high', label: 'High - Significant problem' },
        { value: 'critical', label: 'Critical - Service unavailable' }
    ];
    
    const handleSubjectChange = async (value) => {
        if (value && value.length > 10) {
            // Search for relevant articles
            try {
                const response = await fetch('/api/knowledge/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: value, limit: 3 })
                });
                
                const data = await response.json();
                if (data.success) {
                    setSuggestedArticles(data.results);
                }
            } catch (error) {
                console.error('Search error:', error);
            }
        }
    };
    
    const handleSubmit = async (values) => {
        setLoading(true);
        
        try {
            const formData = new FormData();
            Object.keys(values).forEach(key => {
                if (key === 'attachments' && values[key]) {
                    values[key].fileList.forEach(file => {
                        formData.append('attachments', file.originFileObj);
                    });
                } else {
                    formData.append(key, values[key]);
                }
            });
            
            const response = await fetch('/api/support/tickets', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                setCurrentStep(2);
                // Show success message with ticket number
            } else {
                throw new Error(result.message);
            }
            
        } catch (error) {
            console.error('Submit error:', error);
            // Show error message
        } finally {
            setLoading(false);
        }
    };
    
    const steps = [
        {
            title: 'Describe Issue',
            content: (
                <>
                    <Form.Item
                        name="category"
                        label="Category"
                        rules={[{ required: true, message: 'Please select a category' }]}
                    >
                        <Select placeholder="Select issue category">
                            {categories.map(cat => (
                                <Select.Option key={cat.value} value={cat.value}>
                                    {cat.label}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    
                    <Form.Item
                        name="subject"
                        label="Subject"
                        rules={[{ required: true, message: 'Please enter a subject' }]}
                    >
                        <Input 
                            placeholder="Brief description of your issue"
                            onChange={(e) => handleSubjectChange(e.target.value)}
                        />
                    </Form.Item>
                    
                    {suggestedArticles.length > 0 && (
                        <Alert
                            message="Suggested Help Articles"
                            description={
                                <ul>
                                    {suggestedArticles.map(article => (
                                        <li key={article.id}>
                                            <a href={`/help/${article.id}`} target="_blank">
                                                {article.title}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            }
                            type="info"
                            showIcon
                            icon={<QuestionCircleOutlined />}
                            style={{ marginBottom: 16 }}
                        />
                    )}
                    
                    <Form.Item
                        name="description"
                        label="Description"
                        rules={[{ required: true, message: 'Please provide details' }]}
                    >
                        <Input.TextArea 
                            rows={6}
                            placeholder="Please provide detailed information about your issue..."
                        />
                    </Form.Item>
                </>
            )
        },
        {
            title: 'Additional Details',
            content: (
                <>
                    <Form.Item
                        name="priority"
                        label="Priority"
                        rules={[{ required: true, message: 'Please select priority' }]}
                    >
                        <Select placeholder="How urgent is this issue?">
                            {priorities.map(priority => (
                                <Select.Option key={priority.value} value={priority.value}>
                                    {priority.label}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    
                    <Form.Item
                        name="attachments"
                        label="Attachments"
                    >
                        <Upload
                            multiple
                            beforeUpload={() => false}
                            accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt"
                        >
                            <Button icon={<UploadOutlined />}>
                                Upload Files (Max 5MB each)
                            </Button>
                        </Upload>
                    </Form.Item>
                </>
            )
        },
        {
            title: 'Confirmation',
            content: (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <h3>Ticket Submitted Successfully!</h3>
                    <p>Your ticket number is: <strong>TK20240115001</strong></p>
                    <p>Expected response time: <strong>24 hours</strong></p>
                    <p>You will receive email updates on your ticket status.</p>
                </div>
            )
        }
    ];
    
    return (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
            <h2>Submit Support Ticket</h2>
            
            <Steps current={currentStep} style={{ marginBottom: 32 }}>
                {steps.map(step => (
                    <Steps.Step key={step.title} title={step.title} />
                ))}
            </Steps>
            
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                style={{ marginTop: 24 }}
            >
                {steps[currentStep].content}
                
                {currentStep < 2 && (
                    <Form.Item style={{ marginTop: 32 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            {currentStep > 0 && (
                                <Button onClick={() => setCurrentStep(currentStep - 1)}>
                                    Previous
                                </Button>
                            )}
                            
                            {currentStep === 0 && (
                                <Button 
                                    type="primary" 
                                    onClick={() => setCurrentStep(1)}
                                >
                                    Next
                                </Button>
                            )}
                            
                            {currentStep === 1 && (
                                <Button 
                                    type="primary" 
                                    htmlType="submit"
                                    loading={loading}
                                >
                                    Submit Ticket
                                </Button>
                            )}
                        </div>
                    </Form.Item>
                )}
            </Form>
        </div>
    );
};

export default TicketSubmissionForm;
```

### 4.2 Agent Dashboard

**Ticket Management Interface**
```jsx
// Agent Dashboard Component
import React, { useState, useEffect } from 'react';
import { 
    Table, 
    Tag, 
    Button, 
    Modal, 
    Form, 
    Input, 
    Select, 
    Badge,
    Tabs,
    Card,
    Statistic,
    Row,
    Col
} from 'antd';
import { 
    ClockCircleOutlined, 
    ExclamationCircleOutlined,
    CheckCircleOutlined,
    MessageOutlined
} from '@ant-design/icons';

const AgentDashboard = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [responseModal, setResponseModal] = useState(false);
    const [stats, setStats] = useState({});
    const [activeTab, setActiveTab] = useState('assigned');
    
    const priorityColors = {
        low: 'green',
        medium: 'blue',
        high: 'orange',
        critical: 'red'
    };
    
    const statusColors = {
        open: 'red',
        in_progress: 'blue',
        waiting_user: 'orange',
        resolved: 'green',
        closed: 'default'
    };
    
    useEffect(() => {
        loadTickets();
        loadStats();
    }, [activeTab]);
    
    const loadTickets = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/support/agent/tickets?filter=${activeTab}`);
            const data = await response.json();
            if (data.success) {
                setTickets(data.tickets);
            }
        } catch (error) {
            console.error('Load tickets error:', error);
        } finally {
            setLoading(false);
        }
    };
    
    const loadStats = async () => {
        try {
            const response = await fetch('/api/support/agent/stats');
            const data = await response.json();
            if (data.success) {
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Load stats error:', error);
        }
    };
    
    const handleTicketAction = async (ticketId, action, data = {}) => {
        try {
            const response = await fetch(`/api/support/tickets/${ticketId}/${action}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            if (result.success) {
                loadTickets();
                loadStats();
                setResponseModal(false);
            }
        } catch (error) {
            console.error('Ticket action error:', error);
        }
    };
    
    const columns = [
        {
            title: 'Ticket #',
            dataIndex: 'ticketNumber',
            key: 'ticketNumber',
            width: 120,
            render: (text, record) => (
                <Button 
                    type="link" 
                    onClick={() => setSelectedTicket(record)}
                >
                    {text}
                </Button>
            )
        },
        {
            title: 'Subject',
            dataIndex: 'subject',
            key: 'subject',
            ellipsis: true
        },
        {
            title: 'User',
            dataIndex: ['user', 'username'],
            key: 'user',
            width: 120
        },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            width: 100,
            render: (category) => (
                <Tag color="blue">{category}</Tag>
            )
        },
        {
            title: 'Priority',
            dataIndex: 'priority',
            key: 'priority',
            width: 100,
            render: (priority) => (
                <Tag color={priorityColors[priority]}>
                    {priority.toUpperCase()}
                </Tag>
            )
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status) => (
                <Badge 
                    status={statusColors[status]} 
                    text={status.replace('_', ' ').toUpperCase()}
                />
            )
        },
        {
            title: 'Created',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 120,
            render: (date) => new Date(date).toLocaleDateString()
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 150,
            render: (_, record) => (
                <div>
                    <Button 
                        size="small" 
                        icon={<MessageOutlined />}
                        onClick={() => {
                            setSelectedTicket(record);
                            setResponseModal(true);
                        }}
                        style={{ marginRight: 8 }}
                    >
                        Reply
                    </Button>
                    
                    {record.status !== 'resolved' && (
                        <Button 
                            size="small" 
                            type="primary"
                            onClick={() => handleTicketAction(record.id, 'resolve')}
                        >
                            Resolve
                        </Button>
                    )}
                </div>
            )
        }
    ];
    
    const tabItems = [
        {
            key: 'assigned',
            label: `Assigned to Me (${stats.assignedCount || 0})`,
            children: (
                <Table 
                    columns={columns}
                    dataSource={tickets}
                    loading={loading}
                    rowKey="id"
                    pagination={{ pageSize: 20 }}
                />
            )
        },
        {
            key: 'unassigned',
            label: `Unassigned (${stats.unassignedCount || 0})`,
            children: (
                <Table 
                    columns={[
                        ...columns.slice(0, -1),
                        {
                            title: 'Actions',
                            key: 'actions',
                            width: 100,
                            render: (_, record) => (
                                <Button 
                                    size="small" 
                                    type="primary"
                                    onClick={() => handleTicketAction(record.id, 'assign')}
                                >
                                    Take
                                </Button>
                            )
                        }
                    ]}
                    dataSource={tickets}
                    loading={loading}
                    rowKey="id"
                    pagination={{ pageSize: 20 }}
                />
            )
        },
        {
            key: 'all',
            label: 'All Tickets',
            children: (
                <Table 
                    columns={columns}
                    dataSource={tickets}
                    loading={loading}
                    rowKey="id"
                    pagination={{ pageSize: 20 }}
                />
            )
        }
    ];
    
    return (
        <div style={{ padding: 24 }}>
            <h2>Support Dashboard</h2>
            
            {/* Statistics */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Open Tickets"
                            value={stats.openCount || 0}
                            prefix={<ExclamationCircleOutlined />}
                            valueStyle={{ color: '#cf1322' }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="In Progress"
                            value={stats.inProgressCount || 0}
                            prefix={<ClockCircleOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Resolved Today"
                            value={stats.resolvedTodayCount || 0}
                            prefix={<CheckCircleOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Avg Response Time"
                            value={stats.avgResponseTime || '0h'}
                            valueStyle={{ color: '#722ed1' }}
                        />
                    </Card>
                </Col>
            </Row>
            
            {/* Tickets Table */}
            <Tabs 
                activeKey={activeTab}
                onChange={setActiveTab}
                items={tabItems}
            />
            
            {/* Response Modal */}
            <Modal
                title={`Respond to Ticket ${selectedTicket?.ticketNumber}`}
                open={responseModal}
                onCancel={() => setResponseModal(false)}
                footer={null}
                width={800}
            >
                {selectedTicket && (
                    <TicketResponseForm 
                        ticket={selectedTicket}
                        onSubmit={(data) => handleTicketAction(selectedTicket.id, 'respond', data)}
                        onCancel={() => setResponseModal(false)}
                    />
                )}
            </Modal>
        </div>
    );
};

// Ticket Response Form Component
const TicketResponseForm = ({ ticket, onSubmit, onCancel }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    
    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            await onSubmit(values);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
        >
            <div style={{ marginBottom: 16, padding: 16, backgroundColor: '#f5f5f5' }}>
                <h4>{ticket.subject}</h4>
                <p>{ticket.description}</p>
                <small>From: {ticket.user?.username} | Created: {new Date(ticket.createdAt).toLocaleString()}</small>
            </div>
            
            <Form.Item
                name="message"
                label="Response"
                rules={[{ required: true, message: 'Please enter your response' }]}
            >
                <Input.TextArea 
                    rows={6}
                    placeholder="Type your response here..."
                />
            </Form.Item>
            
            <Form.Item
                name="status"
                label="Update Status"
                initialValue="in_progress"
            >
                <Select>
                    <Select.Option value="in_progress">In Progress</Select.Option>
                    <Select.Option value="waiting_user">Waiting for User</Select.Option>
                    <Select.Option value="resolved">Resolved</Select.Option>
                </Select>
            </Form.Item>
            
            <Form.Item
                name="isInternal"
                valuePropName="checked"
            >
                <input type="checkbox" /> Internal note (not visible to user)
            </Form.Item>
            
            <Form.Item style={{ marginTop: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <Button onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button 
                        type="primary" 
                        htmlType="submit"
                        loading={loading}
                    >
                        Send Response
                    </Button>
                </div>
            </Form.Item>
        </Form>
    );
};

export default AgentDashboard;
```

## 5. Implementation Plan

### 5.1 Phase 1: Core Foundation (2-3 weeks)

**Core Features**
- Basic ticket system
- User ticket submission
- Agent assignment
- Email notifications
- Simple knowledge base

**Technical Implementation**
- Database schema setup
- Basic API endpoints
- User authentication integration
- Email service configuration
- Basic UI components

**Deliverables**
- Functional ticket creation and management
- Agent dashboard
- User portal
- Email notifications

### 5.2 Phase 2: Advanced Features (2-3 weeks)

**Core Features**
- Auto-classification
- SLA management
- Escalation system
- Advanced search
- Reporting dashboard

**Technical Implementation**
- Machine learning classification
- Automated workflows
- Search engine integration
- Statistics reports

**Deliverables**
- Automated ticket processing
- Improved agent efficiency
- Advanced search functionality
- Performance monitoring

### 5.3 Phase 3: Optimization & Enhancement (2-3 weeks)

**Core Features**
- Semantic search
- Statistical analysis
- User satisfaction surveys
- System optimization

**Technical Implementation**
- Vector search (pgvector)
- Data analytics
- Performance optimization
- User experience improvements

**Deliverables**
- Intelligent search functionality
- Detailed statistical reports
- User satisfaction tracking
- System stability improvements

## 6. Technical Recommendations

### 6.1 Recommended Technology Stack

**Backend Services**
- **Ticketing System**: Self-built (Node.js + Express)
- **Database**: PostgreSQL + Redis
- **Search Engine**: Typesense (primary recommendation) or PostgreSQL full-text search
- **Email Service**: Nodemailer + SMTP
- **File Storage**: Local storage + future expansion to S3

**Frontend Interface**
- **User Portal**: React + Ant Design
- **Admin Panel**: React + Ant Design Pro
- **Real-time Communication**: Socket.IO (future feature)

**Deployment & Monitoring**
- **Containerization**: Docker + Docker Compose
- **Monitoring**: Self-built logging system
- **Backup**: Regular database backups

### 6.2 Cost Estimation

**Development Cost**
- Phase 1: 40-60 hours
- Phase 2: 30-40 hours
- Phase 3: 20-30 hours
- **Total**: 90-130 hours

**Operating Cost (Monthly)**
- Server: $50-100
- Email Service: $10-20
- Storage: $5-15
- **Total**: $65-135/month

### 6.3 Key Metrics

**Service Quality**
- First response time: < 24 hours
- Issue resolution time: < 72 hours
- User satisfaction: > 85%
- First contact resolution: > 70%

**System Performance**
- System availability: > 99.5%
- Page load time: < 3 seconds
- Search response time: < 1 second
- Concurrent online support: > 100 users

**Business Metrics**
- Ticket processing efficiency: > 20 tickets/day/agent
- Knowledge base usage rate: > 60%
- Self-service resolution rate: > 40%
- Escalation rate: < 10%

## 7. Risk Assessment and Mitigation

### 7.1 Technical Risks

**Risk**: High complexity of self-built system
**Mitigation**: Phased implementation, focus on core features first

**Risk**: Search performance issues
**Mitigation**: Use Typesense as primary search engine, PostgreSQL full-text search as backup

**Risk**: Large file uploads affecting performance
**Mitigation**: File size limits, asynchronous processing, CDN acceleration

### 7.2 Business Risks

**Risk**: Insufficient support staff
**Mitigation**: Automated processing, FAQ self-service

**Risk**: User adoption challenges
**Mitigation**: Intuitive interface design, comprehensive documentation

**Risk**: Data privacy concerns
**Mitigation**: Strict data protection measures, compliance with privacy regulations

## 8. Future Expansion Planning

### 8.1 Medium-term Features (6-12 months)

**Live Chat System**
- Real-time messaging
- Agent availability status
- Chat routing and queuing
- Chat history and transcripts

**Advanced Analytics**
- Customer satisfaction surveys
- Agent performance metrics
- Trend analysis and reporting
- Predictive analytics for ticket volume

**Mobile Application**
- Native mobile app for ticket submission
- Push notifications for updates
- Offline capability for viewing tickets

**Integration Capabilities**
- CRM system integration
- Third-party tool connections
- API for external services
- Webhook support for automation

### 8.2 Long-term Features (1-2 years)

**AI-Powered Features**
- Chatbot for initial support
- Automated response suggestions
- Sentiment analysis
- Intelligent ticket routing

**Advanced Workflow Management**
- Custom workflow builder
- Approval processes
- Multi-department coordination
- SLA customization per customer

**Enterprise Features**
- Multi-tenant support
- Advanced security features
- Custom branding options
- Enterprise SSO integration

## 9. Important Considerations

### 9.1 Data Quality
- Ensure accurate ticket categorization
- Maintain clean customer data
- Regular data validation and cleanup
- Consistent data entry standards

### 9.2 User Experience
- Intuitive interface design
- Mobile-responsive layouts
- Fast loading times
- Clear navigation and workflows

### 9.3 Security & Privacy
- Secure data transmission (HTTPS)
- Regular security audits
- Access control and permissions
- Data retention policies

### 9.4 Scalability
- Design for growth
- Performance optimization
- Load balancing capabilities
- Database optimization

### 9.5 Continuous Improvement
- Regular user feedback collection
- Performance monitoring
- Feature usage analytics
- Iterative development approach

## 10. Success Metrics

### 10.1 Customer Satisfaction
- Customer satisfaction score (CSAT) > 85%
- Net Promoter Score (NPS) > 50
- First contact resolution rate > 70%
- Average resolution time < 72 hours

### 10.2 Operational Efficiency
- Agent productivity (tickets/hour)
- System uptime > 99.5%
- Knowledge base utilization > 60%
- Self-service resolution rate > 40%

### 10.3 Business Impact
- Reduced support costs
- Improved customer retention
- Faster issue resolution
- Enhanced brand reputation

---

*This document serves as a comprehensive guide for implementing a customer support system for MKing Friend. Regular updates and revisions should be made based on user feedback and changing business requirements.*