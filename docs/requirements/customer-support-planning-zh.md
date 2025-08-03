# MKing Friend - 客服與支援系統規劃

## 1. 功能概述

### 1.1 支援範圍
- **技術問題**: 登入問題、功能故障、性能問題
- **帳戶問題**: 密碼重設、帳戶驗證、資料修改
- **使用諮詢**: 功能使用、配對建議、隱私設定
- **舉報處理**: 不當行為、詐騙舉報、內容申訴
- **付費問題**: 訂閱問題、退款申請、發票需求
- **意見回饋**: 功能建議、錯誤回報、用戶體驗

### 1.2 支援方式
- **自助服務**: FAQ、知識庫、教學影片
- **表單系統**: 結構化問題提交
- **即時聊天**: 緊急問題快速回應（未來功能）
- **Email 支援**: 詳細問題處理
- **電話支援**: 緊急或複雜問題（未來功能）

### 1.3 服務目標
- **回應時間**: 一般問題 24 小時內，緊急問題 4 小時內
- **解決率**: 首次回應解決率 > 70%
- **滿意度**: 用戶滿意度 > 85%
- **可用性**: 7x24 小時自助服務

## 2. 技術方案比較

### 2.1 票務系統 (推薦)

#### 2.1.1 自建票務系統

**核心票務管理**
```javascript
// 票務系統服務
class TicketingService {
    constructor() {
        this.ticketStatuses = {
            'open': { priority: 1, sla: 24 * 60 * 60 * 1000 }, // 24小時
            'in_progress': { priority: 2, sla: 48 * 60 * 60 * 1000 }, // 48小時
            'waiting_user': { priority: 3, sla: 7 * 24 * 60 * 60 * 1000 }, // 7天
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
            // 1. 生成票務編號
            const ticketNumber = await this.generateTicketNumber();
            
            // 2. 自動分類和優先級調整
            const autoClassification = await this.autoClassifyTicket(subject, description);
            const finalPriority = this.determinePriority(priority, autoClassification);
            const finalCategory = autoClassification.category || category;
            
            // 3. 創建票務
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
            
            // 4. 自動分配
            if (this.categories[finalCategory].autoAssign) {
                await this.autoAssignTicket(ticket.id, finalCategory);
            }
            
            // 5. 發送確認郵件
            await this.sendTicketConfirmation(ticket);
            
            // 6. 檢查是否需要立即升級
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
            console.error('創建票務錯誤:', error);
            return {
                success: false,
                message: '票務創建失敗，請稍後再試'
            };
        }
    }
    
    async autoClassifyTicket(subject, description) {
        const content = `${subject} ${description}`.toLowerCase();
        
        // 關鍵字分類
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
        
        // 優先級建議
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
        // 獲取該部門可用的客服人員
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
            // 沒有可用客服，加入待分配佇列
            await this.addToAssignmentQueue(ticketId, department);
            return;
        }
        
        // 選擇工作負載最少的客服
        const selectedAgent = availableAgents.reduce((min, agent) => 
            agent._count.assignedTickets < min._count.assignedTickets ? agent : min
        );
        
        // 分配票務
        await db.supportTickets.update({
            where: { id: ticketId },
            data: {
                assignedAgentId: selectedAgent.id,
                assignedAt: new Date(),
                status: 'in_progress'
            }
        });
        
        // 通知客服人員
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
                // 1. 創建回應記錄
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
                
                // 2. 更新票務狀態
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
                
                // 3. 如果不是內部備註，發送郵件給用戶
                if (!isInternal) {
                    await this.sendResponseNotification(ticket, message, attachments);
                }
                
                // 4. 執行建議動作
                for (const action of suggestedActions) {
                    await this.executeSuggestedAction(tx, ticketId, action);
                }
                
                // 5. 更新客服統計
                await this.updateAgentStats(tx, agentId, 'response');
            });
            
            return { success: true, message: '回應已發送' };
            
        } catch (error) {
            console.error('回應票務錯誤:', error);
            return { success: false, message: '回應發送失敗' };
        }
    }
    
    async escalateTicket(ticketId, reason) {
        const ticket = await db.supportTickets.findUnique({
            where: { id: ticketId },
            include: {
                assignedAgent: true,
                user: true
            }
        });
        
        if (!ticket) {
            throw new Error('票務不存在');
        }
        
        // 升級到主管
        const supervisor = await db.supportAgents.findFirst({
            where: {
                department: ticket.assignedAgent?.department || 'support',
                role: 'supervisor',
                isActive: true
            }
        });
        
        if (supervisor) {
            await db.supportTickets.update({
                where: { id: ticketId },
                data: {
                    assignedAgentId: supervisor.id,
                    priority: this.upgradePriority(ticket.priority),
                    escalatedAt: new Date(),
                    escalationReason: reason
                }
            });
            
            // 記錄升級歷史
            await db.ticketEscalations.create({
                data: {
                    ticketId,
                    fromAgentId: ticket.assignedAgentId,
                    toAgentId: supervisor.id,
                    reason,
                    createdAt: new Date()
                }
            });
            
            // 通知主管
            await this.notifyEscalation(supervisor.id, ticketId, reason);
        }
    }
    
    async generateTicketNumber() {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        
        // 獲取今日票務數量
        const todayCount = await db.supportTickets.count({
            where: {
                createdAt: {
                    gte: new Date(today.setHours(0, 0, 0, 0)),
                    lt: new Date(today.setHours(23, 59, 59, 999))
                }
            }
        });
        
        const sequence = (todayCount + 1).toString().padStart(4, '0');
        return `TK${dateStr}${sequence}`;
    }
    
    determinePriority(userPriority, autoClassification) {
        // 如果自動分類建議更高優先級，採用建議
        const priorityOrder = ['low', 'medium', 'high', 'critical'];
        const userIndex = priorityOrder.indexOf(userPriority);
        const suggestedIndex = priorityOrder.indexOf(autoClassification.suggestedPriority);
        
        return suggestedIndex > userIndex ? autoClassification.suggestedPriority : userPriority;
    }
    
    getEstimatedResponseTime(priority) {
        const responseTime = {
            'low': '72 小時內',
            'medium': '24 小時內',
            'high': '8 小時內',
            'critical': '2 小時內'
        };
        return responseTime[priority] || '24 小時內';
    }
    
    upgradePriority(currentPriority) {
        const upgradeMap = {
            'low': 'medium',
            'medium': 'high',
            'high': 'critical',
            'critical': 'critical'
        };
        return upgradeMap[currentPriority] || 'medium';
    }
    
    async sendTicketConfirmation(ticket) {
        const user = await db.users.findUnique({
            where: { id: ticket.userId },
            select: { email: true, username: true }
        });
        
        if (user?.email) {
            await this.sendEmail(user.email, {
                subject: `[${ticket.ticketNumber}] 您的支援請求已收到`,
                template: 'ticket_confirmation',
                data: {
                    username: user.username,
                    ticketNumber: ticket.ticketNumber,
                    subject: ticket.subject,
                    estimatedResponseTime: this.getEstimatedResponseTime(ticket.priority),
                    trackingUrl: `${process.env.FRONTEND_URL}/support/ticket/${ticket.ticketNumber}`
                }
            });
        }
    }
    
    async sendResponseNotification(ticket, message, attachments) {
        if (ticket.user?.email) {
            await this.sendEmail(ticket.user.email, {
                subject: `[${ticket.ticketNumber}] 客服回應`,
                template: 'ticket_response',
                data: {
                    username: ticket.user.username,
                    ticketNumber: ticket.ticketNumber,
                    subject: ticket.subject,
                    message,
                    attachments,
                    replyUrl: `${process.env.FRONTEND_URL}/support/ticket/${ticket.ticketNumber}`
                }
            });
        }
    }
    
    async sendEmail(to, emailData) {
        // 郵件發送邏輯
        const nodemailer = require('nodemailer');
        
        const transporter = nodemailer.createTransporter({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
        
        try {
            await transporter.sendMail({
                from: process.env.SUPPORT_EMAIL,
                to,
                subject: emailData.subject,
                html: await this.renderEmailTemplate(emailData.template, emailData.data)
            });
        } catch (error) {
            console.error('郵件發送錯誤:', error);
        }
    }
    
    async renderEmailTemplate(template, data) {
        // 簡單的模板渲染
        const templates = {
            'ticket_confirmation': `
                <h2>支援請求確認</h2>
                <p>親愛的 ${data.username}，</p>
                <p>我們已收到您的支援請求：</p>
                <ul>
                    <li><strong>票務編號</strong>: ${data.ticketNumber}</li>
                    <li><strong>主題</strong>: ${data.subject}</li>
                    <li><strong>預計回應時間</strong>: ${data.estimatedResponseTime}</li>
                </ul>
                <p>您可以透過以下連結追蹤處理進度：</p>
                <p><a href="${data.trackingUrl}">查看票務狀態</a></p>
                <p>感謝您的耐心等待。</p>
            `,
            'ticket_response': `
                <h2>客服回應</h2>
                <p>親愛的 ${data.username}，</p>
                <p>您的支援請求 <strong>${data.ticketNumber}</strong> 有新的回應：</p>
                <div style="background: #f5f5f5; padding: 15px; margin: 15px 0;">
                    ${data.message}
                </div>
                ${data.attachments.length > 0 ? `
                    <p><strong>附件</strong>:</p>
                    <ul>
                        ${data.attachments.map(att => `<li>${att.name}</li>`).join('')}
                    </ul>
                ` : ''}
                <p><a href="${data.replyUrl}">回覆此票務</a></p>
            `
        };
        
        return templates[template] || '';
    }
}
```

**優點:**
- 完全自主控制
- 可深度客製化
- 與現有系統整合容易
- 無第三方依賴
- 成本可控

**缺點:**
- 開發時間較長
- 需要持續維護
- 功能相對簡單

#### 2.1.2 開源票務系統整合

**osTicket 整合**
```javascript
// osTicket API 整合
class OsTicketIntegration {
    constructor() {
        this.apiUrl = process.env.OSTICKET_API_URL;
        this.apiKey = process.env.OSTICKET_API_KEY;
    }
    
    async createTicket(ticketData) {
        const {
            userId,
            email,
            name,
            subject,
            message,
            priority = 'normal'
        } = ticketData;
        
        try {
            const response = await fetch(`${this.apiUrl}/tickets.json`, {
                method: 'POST',
                headers: {
                    'X-API-Key': this.apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    alert: true,
                    autorespond: true,
                    source: 'API',
                    name,
                    email,
                    subject,
                    message,
                    priority,
                    topicId: this.getTopicId(ticketData.category)
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                // 在本地資料庫記錄對應關係
                await db.ticketMappings.create({
                    data: {
                        userId,
                        osTicketId: result.ticket_id,
                        ticketNumber: result.number,
                        createdAt: new Date()
                    }
                });
                
                return {
                    success: true,
                    ticketId: result.ticket_id,
                    ticketNumber: result.number
                };
            } else {
                throw new Error(result.error || '票務創建失敗');
            }
            
        } catch (error) {
            console.error('osTicket 整合錯誤:', error);
            return { success: false, message: error.message };
        }
    }
    
    getTopicId(category) {
        const topicMapping = {
            'technical': 1,
            'account': 2,
            'billing': 3,
            'abuse': 4,
            'general': 5
        };
        return topicMapping[category] || 5;
    }
}
```

**優點:**
- 功能完整
- 社群支援
- 快速部署
- 成熟穩定

**缺點:**
- 客製化限制
- 介面較舊
- 整合複雜度

### 2.2 知識庫系統

#### 2.2.1 自建 FAQ 系統

**知識庫管理**
```javascript
// 知識庫服務
class KnowledgeBaseService {
    constructor() {
        this.searchEngine = new SearchEngine();
    }
    
    async searchFAQ(query, category = null, limit = 10) {
        try {
            // 1. 關鍵字搜尋
            const keywordResults = await this.keywordSearch(query, category, limit);
            
            // 2. 語義搜尋（如果有設定）
            const semanticResults = await this.semanticSearch(query, category, limit);
            
            // 3. 合併和排序結果
            const combinedResults = this.combineSearchResults(keywordResults, semanticResults);
            
            // 4. 記錄搜尋歷史
            await this.logSearch(query, category, combinedResults.length);
            
            return {
                success: true,
                results: combinedResults.slice(0, limit),
                suggestions: await this.getSuggestions(query),
                totalFound: combinedResults.length
            };
            
        } catch (error) {
            console.error('FAQ 搜尋錯誤:', error);
            return {
                success: false,
                results: [],
                message: '搜尋服務暫時不可用'
            };
        }
    }
    
    async keywordSearch(query, category, limit) {
        const whereClause = {
            isPublished: true,
            OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { content: { contains: query, mode: 'insensitive' } },
                { tags: { hasSome: query.split(' ') } }
            ],
            ...(category && { category })
        };
        
        const articles = await db.knowledgeBaseArticles.findMany({
            where: whereClause,
            include: {
                _count: {
                    select: {
                        views: true,
                        helpfulVotes: { where: { isHelpful: true } },
                        unhelpfulVotes: { where: { isHelpful: false } }
                    }
                }
            },
            take: limit
        });
        
        // 計算相關性分數
        return articles.map(article => ({
            ...article,
            relevanceScore: this.calculateRelevanceScore(article, query),
            helpfulnessRatio: this.calculateHelpfulnessRatio(article._count)
        })).sort((a, b) => b.relevanceScore - a.relevanceScore);
    }
    
    async semanticSearch(query, category, limit) {
        // 如果有設定向量搜尋（如 pgvector）
        if (!process.env.ENABLE_SEMANTIC_SEARCH) {
            return [];
        }
        
        try {
            // 生成查詢向量
            const queryVector = await this.generateEmbedding(query);
            
            // 向量相似度搜尋
            const results = await db.$queryRaw`
                SELECT 
                    id, title, content, category, tags,
                    (embedding <=> ${queryVector}::vector) as distance
                FROM knowledge_base_articles 
                WHERE is_published = true
                    ${category ? `AND category = ${category}` : ''}
                ORDER BY embedding <=> ${queryVector}::vector
                LIMIT ${limit}
            `;
            
            return results.map(result => ({
                ...result,
                relevanceScore: 1 - result.distance, // 轉換距離為相關性分數
                searchType: 'semantic'
            }));
            
        } catch (error) {
            console.error('語義搜尋錯誤:', error);
            return [];
        }
    }
    
    calculateRelevanceScore(article, query) {
        const queryTerms = query.toLowerCase().split(' ');
        const title = article.title.toLowerCase();
        const content = article.content.toLowerCase();
        
        let score = 0;
        
        // 標題匹配權重更高
        queryTerms.forEach(term => {
            if (title.includes(term)) score += 3;
            if (content.includes(term)) score += 1;
        });
        
        // 考慮文章受歡迎程度
        const popularityBonus = Math.log(article._count.views + 1) * 0.1;
        const helpfulnessBonus = this.calculateHelpfulnessRatio(article._count) * 0.5;
        
        return score + popularityBonus + helpfulnessBonus;
    }
    
    calculateHelpfulnessRatio(counts) {
        const total = counts.helpfulVotes + counts.unhelpfulVotes;
        if (total === 0) return 0.5; // 中性分數
        return counts.helpfulVotes / total;
    }
    
    async getSuggestions(query) {
        // 基於搜尋歷史和熱門問題提供建議
        const suggestions = await db.searchSuggestions.findMany({
            where: {
                OR: [
                    { query: { contains: query, mode: 'insensitive' } },
                    { relatedQueries: { hasSome: [query] } }
                ]
            },
            orderBy: { searchCount: 'desc' },
            take: 5
        });
        
        return suggestions.map(s => s.query);
    }
    
    async createArticle(articleData) {
        const {
            title,
            content,
            category,
            tags = [],
            authorId,
            isPublished = false
        } = articleData;
        
        try {
            // 生成內容向量（如果啟用語義搜尋）
            let embedding = null;
            if (process.env.ENABLE_SEMANTIC_SEARCH) {
                embedding = await this.generateEmbedding(`${title} ${content}`);
            }
            
            const article = await db.knowledgeBaseArticles.create({
                data: {
                    title,
                    content,
                    category,
                    tags,
                    authorId,
                    isPublished,
                    embedding,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });
            
            // 如果發布，更新搜尋索引
            if (isPublished) {
                await this.updateSearchIndex(article);
            }
            
            return { success: true, articleId: article.id };
            
        } catch (error) {
            console.error('創建文章錯誤:', error);
            return { success: false, message: '文章創建失敗' };
        }
    }
    
    async generateEmbedding(text) {
        // 使用 OpenAI Embeddings API 或其他嵌入服務
        try {
            const response = await fetch('https://api.openai.com/v1/embeddings', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    input: text,
                    model: 'text-embedding-ada-002'
                })
            });
            
            const data = await response.json();
            return data.data[0].embedding;
            
        } catch (error) {
            console.error('生成嵌入向量錯誤:', error);
            return null;
        }
    }
    
    async recordArticleView(articleId, userId = null) {
        // 記錄文章瀏覽
        await db.articleViews.create({
            data: {
                articleId,
                userId,
                viewedAt: new Date()
            }
        });
        
        // 更新文章瀏覽統計
        await db.knowledgeBaseArticles.update({
            where: { id: articleId },
            data: {
                viewCount: { increment: 1 },
                lastViewedAt: new Date()
            }
        });
    }
    
    async voteArticleHelpfulness(articleId, userId, isHelpful) {
        // 檢查是否已投票
        const existingVote = await db.articleHelpfulnessVotes.findUnique({
            where: {
                articleId_userId: { articleId, userId }
            }
        });
        
        if (existingVote) {
            // 更新投票
            await db.articleHelpfulnessVotes.update({
                where: { id: existingVote.id },
                data: { isHelpful, updatedAt: new Date() }
            });
        } else {
            // 新增投票
            await db.articleHelpfulnessVotes.create({
                data: {
                    articleId,
                    userId,
                    isHelpful,
                    createdAt: new Date()
                }
            });
        }
        
        // 更新文章統計
        await this.updateArticleHelpfulnessStats(articleId);
    }
    
    async updateArticleHelpfulnessStats(articleId) {
        const stats = await db.articleHelpfulnessVotes.groupBy({
            by: ['isHelpful'],
            where: { articleId },
            _count: true
        });
        
        const helpfulCount = stats.find(s => s.isHelpful)?.count || 0;
        const unhelpfulCount = stats.find(s => !s.isHelpful)?.count || 0;
        const totalVotes = helpfulCount + unhelpfulCount;
        const helpfulnessRatio = totalVotes > 0 ? helpfulCount / totalVotes : 0;
        
        await db.knowledgeBaseArticles.update({
            where: { id: articleId },
            data: {
                helpfulVotes: helpfulCount,
                unhelpfulVotes: unhelpfulCount,
                helpfulnessRatio
            }
        });
    }
}
```

### 2.3 表單系統設計

#### 2.3.1 動態表單生成器

**表單配置系統**
```javascript
// 動態表單服務
class DynamicFormService {
    constructor() {
        this.formTemplates = {
            'technical_issue': {
                title: '技術問題回報',
                description: '請詳細描述您遇到的技術問題',
                fields: [
                    {
                        name: 'issue_type',
                        type: 'select',
                        label: '問題類型',
                        required: true,
                        options: [
                            { value: 'login', label: '登入問題' },
                            { value: 'performance', label: '性能問題' },
                            { value: 'feature_bug', label: '功能故障' },
                            { value: 'ui_issue', label: '介面問題' },
                            { value: 'other', label: '其他' }
                        ]
                    },
                    {
                        name: 'description',
                        type: 'textarea',
                        label: '問題描述',
                        required: true,
                        placeholder: '請詳細描述問題發生的情況、步驟和預期結果',
                        validation: { minLength: 20 }
                    },
                    {
                        name: 'browser_info',
                        type: 'text',
                        label: '瀏覽器資訊',
                        required: false,
                        autoFill: 'userAgent'
                    },
                    {
                        name: 'screenshots',
                        type: 'file',
                        label: '截圖或錄影',
                        required: false,
                        accept: 'image/*,video/*',
                        multiple: true,
                        maxSize: '10MB'
                    },
                    {
                        name: 'urgency',
                        type: 'radio',
                        label: '緊急程度',
                        required: true,
                        options: [
                            { value: 'low', label: '低 - 不影響使用' },
                            { value: 'medium', label: '中 - 部分功能受影響' },
                            { value: 'high', label: '高 - 嚴重影響使用' },
                            { value: 'critical', label: '緊急 - 完全無法使用' }
                        ]
                    }
                ]
            },
            'account_issue': {
                title: '帳戶問題',
                description: '帳戶相關問題處理',
                fields: [
                    {
                        name: 'account_type',
                        type: 'select',
                        label: '問題類型',
                        required: true,
                        options: [
                            { value: 'password_reset', label: '密碼重設' },
                            { value: 'email_change', label: '更改 Email' },
                            { value: 'profile_issue', label: '個人資料問題' },
                            { value: 'verification', label: '帳戶驗證' },
                            { value: 'deletion', label: '帳戶刪除' }
                        ]
                    },
                    {
                        name: 'account_email',
                        type: 'email',
                        label: '帳戶 Email',
                        required: true,
                        validation: { email: true }
                    },
                    {
                        name: 'description',
                        type: 'textarea',
                        label: '詳細說明',
                        required: true,
                        placeholder: '請說明您的問題和需要的協助'
                    },
                    {
                        name: 'identity_verification',
                        type: 'file',
                        label: '身份驗證文件',
                        required: false,
                        accept: 'image/*,.pdf',
                        description: '如需修改重要資料，請提供身份證明文件'
                    }
                ]
            },
            'abuse_report': {
                title: '舉報不當行為',
                description: '舉報違規用戶或內容',
                fields: [
                    {
                        name: 'report_type',
                        type: 'select',
                        label: '舉報類型',
                        required: true,
                        options: [
                            { value: 'harassment', label: '騷擾行為' },
                            { value: 'inappropriate_content', label: '不當內容' },
                            { value: 'fake_profile', label: '虛假檔案' },
                            { value: 'scam', label: '詐騙行為' },
                            { value: 'spam', label: '垃圾訊息' },
                            { value: 'other', label: '其他違規' }
                        ]
                    },
                    {
                        name: 'target_user',
                        type: 'text',
                        label: '被舉報用戶',
                        required: false,
                        placeholder: '用戶名稱或 ID'
                    },
                    {
                        name: 'incident_description',
                        type: 'textarea',
                        label: '事件描述',
                        required: true,
                        placeholder: '請詳細描述發生的事件',
                        validation: { minLength: 30 }
                    },
                    {
                        name: 'evidence',
                        type: 'file',
                        label: '證據檔案',
                        required: false,
                        accept: 'image/*,video/*,.pdf',
                        multiple: true,
                        description: '截圖、錄影或其他相關證據'
                    },
                    {
                        name: 'incident_date',
                        type: 'datetime-local',
                        label: '事件發生時間',
                        required: false
                    }
                ]
            }
        };
    }
    
    async getFormTemplate(templateName) {
        const template = this.formTemplates[templateName];
        if (!template) {
            throw new Error('表單模板不存在');
        }
        
        return {
            ...template,
            id: templateName,
            version: '1.0',
            createdAt: new Date().toISOString()
        };
    }
    
    async submitForm(templateName, formData, userId) {
        try {
            // 1. 驗證表單數據
            const validation = await this.validateFormData(templateName, formData);
            if (!validation.isValid) {
                return {
                    success: false,
                    errors: validation.errors
                };
            }
            
            // 2. 處理檔案上傳
            const processedData = await this.processFormFiles(formData);
            
            // 3. 創建支援請求
            const ticketData = this.convertFormToTicket(templateName, processedData, userId);
            const ticketResult = await this.createSupportTicket(ticketData);
            
            if (!ticketResult.success) {
                return ticketResult;
            }
            
            // 4. 記錄表單提交
            await this.logFormSubmission(templateName, userId, ticketResult.ticketId);
            
            return {
                success: true,
                ticketId: ticketResult.ticketId,
                ticketNumber: ticketResult.ticketNumber,
                message: '您的請求已成功提交'
            };
            
        } catch (error) {
            console.error('表單提交錯誤:', error);
            return {
                success: false,
                message: '表單提交失敗，請稍後再試'
            };
        }
    }
    
    async validateFormData(templateName, formData) {
        const template = this.formTemplates[templateName];
        const errors = [];
        
        for (const field of template.fields) {
            const value = formData[field.name];
            
            // 必填欄位檢查
            if (field.required && (!value || value.toString().trim() === '')) {
                errors.push({
                    field: field.name,
                    message: `${field.label} 為必填欄位`
                });
                continue;
            }
            
            // 跳過空值的其他驗證
            if (!value) continue;
            
            // 類型驗證
            const typeValidation = this.validateFieldType(field, value);
            if (!typeValidation.isValid) {
                errors.push({
                    field: field.name,
                    message: typeValidation.message
                });
            }
            
            // 自定義驗證
            if (field.validation) {
                const customValidation = this.validateFieldCustom(field, value);
                if (!customValidation.isValid) {
                    errors.push({
                        field: field.name,
                        message: customValidation.message
                    });
                }
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    validateFieldType(field, value) {
        switch (field.type) {
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return {
                    isValid: emailRegex.test(value),
                    message: '請輸入有效的 Email 地址'
                };
                
            case 'select':
            case 'radio':
                const validOptions = field.options.map(opt => opt.value);
                return {
                    isValid: validOptions.includes(value),
                    message: '請選擇有效的選項'
                };
                
            case 'file':
                // 檔案驗證在檔案處理階段進行
                return { isValid: true };
                
            default:
                return { isValid: true };
        }
    }
    
    validateFieldCustom(field, value) {
        const validation = field.validation;
        
        if (validation.minLength && value.length < validation.minLength) {
            return {
                isValid: false,
                message: `${field.label} 至少需要 ${validation.minLength} 個字符`
            };
        }
        
        if (validation.maxLength && value.length > validation.maxLength) {
            return {
                isValid: false,
                message: `${field.label} 不能超過 ${validation.maxLength} 個字符`
            };
        }
        
        if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
            return {
                isValid: false,
                message: validation.patternMessage || `${field.label} 格式不正確`
            };
        }
        
        return { isValid: true };
    }
    
    async processFormFiles(formData) {
        const processedData = { ...formData };
        
        for (const [key, value] of Object.entries(formData)) {
            if (value && typeof value === 'object' && value.constructor.name === 'File') {
                // 單個檔案
                processedData[key] = await this.uploadFile(value);
            } else if (Array.isArray(value) && value.length > 0 && value[0].constructor.name === 'File') {
                // 多個檔案
                processedData[key] = await Promise.all(
                    value.map(file => this.uploadFile(file))
                );
            }
        }
        
        return processedData;
    }
    
    async uploadFile(file) {
        // 檔案上傳邏輯
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'application/pdf'];
        const maxSize = 10 * 1024 * 1024; // 10MB
        
        if (!allowedTypes.includes(file.type)) {
            throw new Error('不支援的檔案類型');
        }
        
        if (file.size > maxSize) {
            throw new Error('檔案大小超過限制');
        }
        
        // 生成唯一檔名
        const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${file.name}`;
        const filePath = `uploads/support/${fileName}`;
        
        // 這裡實現實際的檔案上傳邏輯
        // 可以上傳到本地、AWS S3、或其他雲端儲存
        
        return {
            originalName: file.name,
            fileName,
            filePath,
            fileSize: file.size,
            fileType: file.type,
            uploadedAt: new Date().toISOString()
        };
    }
    
    convertFormToTicket(templateName, formData, userId) {
        const template = this.formTemplates[templateName];
        
        // 根據表單類型決定票務類別和優先級
        const categoryMapping = {
            'technical_issue': 'technical',
            'account_issue': 'account',
            'abuse_report': 'abuse'
        };
        
        const priorityMapping = {
            'low': 'low',
            'medium': 'medium',
            'high': 'high',
            'critical': 'critical'
        };
        
        // 生成票務主題和描述
        const subject = this.generateTicketSubject(templateName, formData);
        const description = this.generateTicketDescription(template, formData);
        
        return {
            userId,
            category: categoryMapping[templateName] || 'general',
            subject,
            description,
            priority: priorityMapping[formData.urgency] || 'medium',
            formData: JSON.stringify(formData),
            formTemplate: templateName
        };
    }
    
    generateTicketSubject(templateName, formData) {
        const subjectTemplates = {
            'technical_issue': `技術問題: ${formData.issue_type || '未指定'}`,
            'account_issue': `帳戶問題: ${formData.account_type || '未指定'}`,
            'abuse_report': `舉報: ${formData.report_type || '未指定'}`
        };
        
        return subjectTemplates[templateName] || '一般支援請求';
    }
    
    generateTicketDescription(template, formData) {
        let description = `透過表單提交: ${template.title}\n\n`;
        
        for (const field of template.fields) {
            const value = formData[field.name];
            if (value) {
                if (field.type === 'file') {
                    if (Array.isArray(value)) {
                        description += `${field.label}: ${value.length} 個檔案\n`;
                        value.forEach((file, index) => {
                            description += `  ${index + 1}. ${file.originalName} (${file.fileSize} bytes)\n`;
                        });
                    } else {
                        description += `${field.label}: ${value.originalName} (${value.fileSize} bytes)\n`;
                    }
                } else {
                    description += `${field.label}: ${value}\n`;
                }
            }
        }
        
        return description;
    }
}
```

## 3. 資料庫設計

### 3.1 客服系統相關表結構

```sql
-- 支援票務表
CREATE TABLE support_tickets (
    id SERIAL PRIMARY KEY,
    ticket_number VARCHAR(20) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id),
    category VARCHAR(50) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'open',
    assigned_agent_id INTEGER REFERENCES users(id),
    form_template VARCHAR(100),
    form_data JSONB,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_at TIMESTAMP,
    last_response_at TIMESTAMP,
    last_response_by INTEGER REFERENCES users(id),
    escalated_at TIMESTAMP,
    escalation_reason TEXT,
    resolved_at TIMESTAMP,
    resolved_by INTEGER REFERENCES users(id)
);

-- 票務回應表
CREATE TABLE ticket_responses (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES support_tickets(id),
    agent_id INTEGER REFERENCES users(id),
    message TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE,
    attachments JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 票務升級記錄
CREATE TABLE ticket_escalations (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES support_tickets(id),
    from_agent_id INTEGER REFERENCES users(id),
    to_agent_id INTEGER REFERENCES users(id),
    reason TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 客服人員表
CREATE TABLE support_agents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    department VARCHAR(50) NOT NULL,
    role VARCHAR(50) DEFAULT 'agent', -- 'agent', 'supervisor', 'manager'
    status VARCHAR(20) DEFAULT 'available', -- 'available', 'busy', 'offline'
    max_concurrent_tickets INTEGER DEFAULT 10,
    specialties TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 知識庫文章表
CREATE TABLE knowledge_base_articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    tags TEXT[],
    author_id INTEGER REFERENCES users(id),
    is_published BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    helpful_votes INTEGER DEFAULT 0,
    unhelpful_votes INTEGER DEFAULT 0,
    helpfulness_ratio DECIMAL(3,2) DEFAULT 0,
    embedding vector(1536), -- 用於語義搜尋
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_viewed_at TIMESTAMP
);

-- 文章瀏覽記錄
CREATE TABLE article_views (
    id SERIAL PRIMARY KEY,
    article_id INTEGER REFERENCES knowledge_base_articles(id),
    user_id INTEGER REFERENCES users(id),
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 文章有用性投票
CREATE TABLE article_helpfulness_votes (
    id SERIAL PRIMARY KEY,
    article_id INTEGER REFERENCES knowledge_base_articles(id),
    user_id INTEGER REFERENCES users(id),
    is_helpful BOOLEAN NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(article_id, user_id)
);

-- 搜尋記錄
CREATE TABLE search_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    query VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    results_count INTEGER,
    clicked_result_id INTEGER REFERENCES knowledge_base_articles(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 搜尋建議
CREATE TABLE search_suggestions (
    id SERIAL PRIMARY KEY,
    query VARCHAR(255) UNIQUE NOT NULL,
    search_count INTEGER DEFAULT 1,
    related_queries TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 客服統計表
CREATE TABLE agent_statistics (
    id SERIAL PRIMARY KEY,
    agent_id INTEGER REFERENCES support_agents(id),
    date DATE NOT NULL,
    tickets_assigned INTEGER DEFAULT 0,
    tickets_resolved INTEGER DEFAULT 0,
    average_response_time INTEGER, -- 分鐘
    average_resolution_time INTEGER, -- 分鐘
    customer_satisfaction_score DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(agent_id, date)
);

-- 表單提交記錄
CREATE TABLE form_submissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    form_template VARCHAR(100) NOT NULL,
    ticket_id INTEGER REFERENCES support_tickets(id),
    submission_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX idx_support_tickets_assigned_agent_id ON support_tickets(assigned_agent_id);
CREATE INDEX idx_support_tickets_created_at ON support_tickets(created_at);
CREATE INDEX idx_support_tickets_ticket_number ON support_tickets(ticket_number);

CREATE INDEX idx_ticket_responses_ticket_id ON ticket_responses(ticket_id);
CREATE INDEX idx_ticket_responses_created_at ON ticket_responses(created_at);

CREATE INDEX idx_knowledge_base_articles_category ON knowledge_base_articles(category);
CREATE INDEX idx_knowledge_base_articles_is_published ON knowledge_base_articles(is_published);
CREATE INDEX idx_knowledge_base_articles_tags ON knowledge_base_articles USING GIN(tags);
CREATE INDEX idx_knowledge_base_articles_title ON knowledge_base_articles USING GIN(to_tsvector('chinese', title));
CREATE INDEX idx_knowledge_base_articles_content ON knowledge_base_articles USING GIN(to_tsvector('chinese', content));

-- 如果使用 pgvector 進行語義搜尋
CREATE INDEX idx_knowledge_base_articles_embedding ON knowledge_base_articles USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_search_logs_query ON search_logs(query);
CREATE INDEX idx_search_logs_created_at ON search_logs(created_at);

CREATE INDEX idx_agent_statistics_agent_id ON agent_statistics(agent_id);
CREATE INDEX idx_agent_statistics_date ON agent_statistics(date);
```

## 4. 系統架構設計

### 4.1 客服系統架構圖

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   用戶前端      │    │   管理員前端    │    │   知識庫前端    │
│                 │    │                 │    │                 │
│ - 表單提交      │    │ - 票務管理      │    │ - FAQ 搜尋      │
│ - 票務追蹤      │    │ - 回應處理      │    │ - 文章瀏覽      │
│ - FAQ 搜尋      │    │ - 統計報表      │    │ - 內容評分      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   API Gateway   │
                    │                 │
                    │ - 路由管理      │
                    │ - 身份驗證      │
                    │ - 限流控制      │
                    └─────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   票務服務      │    │   知識庫服務    │    │   通知服務      │
│                 │    │                 │    │                 │
│ - 票務管理      │    │ - 內容管理      │    │ - 郵件發送      │
│ - 自動分配      │    │ - 搜尋引擎      │    │ - 推播通知      │
│ - 升級處理      │    │ - 統計分析      │    │ - 簡訊發送      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   資料庫層      │
                    │                 │
                    │ - PostgreSQL    │
                    │ - Redis 快取    │
                    │ - 檔案儲存      │
                    └─────────────────┘
```

### 4.2 核心服務實現

#### 4.2.1 客服工作台服務

```javascript
// 客服工作台服務
class SupportDashboardService {
    constructor() {
        this.ticketingService = new TicketingService();
        this.notificationService = new NotificationService();
    }
    
    async getAgentDashboard(agentId) {
        try {
            const agent = await db.supportAgents.findUnique({
                where: { id: agentId },
                include: {
                    user: { select: { username: true, email: true } }
                }
            });
            
            if (!agent) {
                throw new Error('客服人員不存在');
            }
            
            // 獲取分配給該客服的票務
            const assignedTickets = await this.getAssignedTickets(agentId);
            
            // 獲取待分配的票務（如果是主管）
            const unassignedTickets = agent.role === 'supervisor' 
                ? await this.getUnassignedTickets(agent.department)
                : [];
            
            // 獲取今日統計
            const todayStats = await this.getTodayStats(agentId);
            
            // 獲取最近活動
            const recentActivity = await this.getRecentActivity(agentId);
            
            return {
                agent: {
                    id: agent.id,
                    name: agent.user.username,
                    department: agent.department,
                    role: agent.role,
                    status: agent.status
                },
                tickets: {
                    assigned: assignedTickets,
                    unassigned: unassignedTickets
                },
                statistics: todayStats,
                recentActivity
            };
            
        } catch (error) {
            console.error('獲取客服工作台錯誤:', error);
            throw error;
        }
    }
    
    async getAssignedTickets(agentId, status = null) {
        const whereClause = {
            assignedAgentId: agentId,
            ...(status && { status })
        };
        
        const tickets = await db.supportTickets.findMany({
            where: whereClause,
            include: {
                user: { select: { username: true, email: true } },
                _count: {
                    select: {
                        responses: true
                    }
                }
            },
            orderBy: [
                { priority: 'desc' },
                { createdAt: 'asc' }
            ]
        });
        
        return tickets.map(ticket => ({
            ...ticket,
            responseCount: ticket._count.responses,
            isOverdue: this.isTicketOverdue(ticket),
            timeRemaining: this.getTimeRemaining(ticket)
        }));
    }
    
    async getUnassignedTickets(department) {
        const tickets = await db.supportTickets.findMany({
            where: {
                assignedAgentId: null,
                status: 'open'
            },
            include: {
                user: { select: { username: true, email: true } }
            },
            orderBy: [
                { priority: 'desc' },
                { createdAt: 'asc' }
            ],
            take: 20
        });
        
        return tickets.filter(ticket => 
            this.isDepartmentMatch(ticket.category, department)
        );
    }
    
    async getTodayStats(agentId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const [assigned, resolved, avgResponseTime] = await Promise.all([
            // 今日分配的票務數
            db.supportTickets.count({
                where: {
                    assignedAgentId: agentId,
                    assignedAt: {
                        gte: today,
                        lt: tomorrow
                    }
                }
            }),
            
            // 今日解決的票務數
            db.supportTickets.count({
                where: {
                    resolvedBy: agentId,
                    resolvedAt: {
                        gte: today,
                        lt: tomorrow
                    }
                }
            }),
            
            // 平均回應時間
            this.getAverageResponseTime(agentId, today, tomorrow)
        ]);
        
        return {
            ticketsAssigned: assigned,
            ticketsResolved: resolved,
            averageResponseTime: avgResponseTime,
            resolutionRate: assigned > 0 ? (resolved / assigned * 100).toFixed(1) : 0
        };
    }
    
    async getAverageResponseTime(agentId, startDate, endDate) {
        const responses = await db.ticketResponses.findMany({
            where: {
                agentId,
                createdAt: {
                    gte: startDate,
                    lt: endDate
                }
            },
            include: {
                ticket: {
                    select: { createdAt: true }
                }
            }
        });
        
        if (responses.length === 0) return 0;
        
        const totalResponseTime = responses.reduce((sum, response) => {
            const responseTime = response.createdAt - response.ticket.createdAt;
            return sum + responseTime;
        }, 0);
        
        return Math.round(totalResponseTime / responses.length / (1000 * 60)); // 分鐘
    }
    
    isTicketOverdue(ticket) {
        const now = new Date();
        const slaTime = this.getSLATime(ticket.priority);
        const deadline = new Date(ticket.createdAt.getTime() + slaTime);
        return now > deadline;
    }
    
    getTimeRemaining(ticket) {
        const now = new Date();
        const slaTime = this.getSLATime(ticket.priority);
        const deadline = new Date(ticket.createdAt.getTime() + slaTime);
        const remaining = deadline - now;
        
        if (remaining <= 0) return '已逾期';
        
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours}小時${minutes}分鐘`;
    }
    
    getSLATime(priority) {
        const slaMap = {
            'critical': 2 * 60 * 60 * 1000, // 2小時
            'high': 8 * 60 * 60 * 1000,     // 8小時
            'medium': 24 * 60 * 60 * 1000,  // 24小時
            'low': 72 * 60 * 60 * 1000      // 72小時
        };
        return slaMap[priority] || slaMap['medium'];
    }
    
    isDepartmentMatch(category, department) {
        const categoryDepartmentMap = {
            'technical': 'tech',
            'account': 'support',
            'billing': 'billing',
            'abuse': 'moderation',
            'general': 'support'
        };
        return categoryDepartmentMap[category] === department;
    }
}
```

## 5. 實施計劃

### 5.1 第一階段：基礎客服系統（4-6週）

**核心功能**
- 基礎票務系統
- 表單提交系統
- 簡單 FAQ 系統
- 郵件通知

**技術實現**
- 自建票務系統
- 動態表單生成器
- PostgreSQL 資料庫
- Nodemailer 郵件服務

**交付成果**
- 用戶可提交支援請求
- 管理員可處理票務
- 基本 FAQ 功能
- 郵件通知系統

### 5.2 第二階段：進階功能（3-4週）

**核心功能**
- 自動分配系統
- 升級處理機制
- 搜尋功能優化
- 客服工作台

**技術實現**
- 智能分配算法
- SLA 監控
- 全文搜尋
- 統計報表

**交付成果**
- 自動化票務處理
- 客服效率提升
- 進階搜尋功能
- 性能監控

### 5.3 第三階段：優化完善（2-3週）

**核心功能**
- 語義搜尋
- 統計分析
- 用戶滿意度調查
- 系統優化

**技術實現**
- 向量搜尋（pgvector）
- 數據分析
- 性能優化
- 用戶體驗改善

**交付成果**
- 智能搜尋功能
- 詳細統計報表
- 用戶滿意度追蹤
- 系統穩定性提升

## 6. 技術建議

### 6.1 推薦技術棧

**後端服務**
- **票務系統**: 自建（Node.js + Express）
- **資料庫**: PostgreSQL + Redis
- **搜尋引擎**: Typesense (主要推薦) 或 PostgreSQL 全文搜尋
- **郵件服務**: Nodemailer + SMTP
- **檔案儲存**: 本地儲存 + 未來可擴展至 S3

**前端介面**
- **用戶端**: React + Ant Design
- **管理端**: React + Ant Design Pro
- **即時通訊**: Socket.IO（未來功能）

**部署與監控**
- **容器化**: Docker + Docker Compose
- **監控**: 自建日誌系統
- **備份**: 定期資料庫備份

### 6.2 成本估算

**開發成本**
- 第一階段：40-60 工時
- 第二階段：30-40 工時
- 第三階段：20-30 工時
- **總計**：90-130 工時

**運營成本（月）**
- 伺服器：$50-100
- 郵件服務：$10-20
- 儲存空間：$5-15
- **總計**：$65-135/月

### 6.3 關鍵指標

**服務品質**
- 首次回應時間：< 24小時
- 問題解決時間：< 72小時
- 用戶滿意度：> 85%
- 首次解決率：> 70%

**系統性能**
- 系統可用性：> 99.5%
- 頁面載入時間：< 3秒
- 搜尋回應時間：< 1秒
- 同時在線支援：> 100人

**業務指標**
- 票務處理效率：每日每人 > 20張
- 知識庫使用率：> 60%
- 自助解決率：> 40%
- 升級率：< 10%

## 7. 風險評估與應對

### 7.1 技術風險

**風險**：自建系統複雜度高
**應對**：分階段實施，先實現核心功能

**風險**：搜尋性能問題
**應對**：使用 Typesense 作為主要搜尋引擎，備選方案為 PostgreSQL 全文搜尋

**風險**：大量檔案上傳影響性能
**應對**：檔案大小限制，非同步處理，CDN 加速

### 7.2 業務風險

**風險**：客服人力不足
**應對**：自動化處理，FAQ 自助服務

**風險**：用戶滿意度下降
**應對**：持續監控，快速回應，定期改善

**風險**：系統故障影響服務
**應對**：備份機制，監控告警，快速恢復

## 8. 未來擴展規劃

### 8.1 中期功能（6-12個月）

- **即時聊天系統**：WebSocket 即時客服
- **AI 智能客服**：自動回答常見問題
- **多語言支援**：國際化客服服務
- **語音支援**：電話客服整合

### 8.2 長期功能（1-2年）

- **智能分析**：用戶行為分析，問題預測
- **自動化工作流**：複雜業務流程自動化
- **整合第三方**：CRM、ERP 系統整合
- **移動端優化**：原生 App 客服功能

---

**備註**：此規劃以自助服務和人工表單為主，符合初期需求。未來可根據業務發展逐步擴展功能。