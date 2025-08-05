# MKing Friend - 內容審核規劃

## 1. 功能概述

### 1.1 審核範圍
- **用戶生成內容**: 個人資料、照片、影片、文字描述
- **聊天內容**: 私人訊息、群組聊天、語音訊息
- **社群內容**: 貼文、評論、分享內容
- **舉報內容**: 用戶舉報的不當內容
- **媒體檔案**: 圖片、影片、音頻檔案

### 1.2 審核目標
- **安全保護**: 防止騷擾、霸凌、威脅
- **內容合規**: 符合法律法規要求
- **社群品質**: 維護良好的交友環境
- **用戶體驗**: 快速處理不當內容
- **隱私保護**: 保護用戶個人隱私

### 1.3 審核類型
- **預防性審核**: 內容發布前審核
- **事後審核**: 內容發布後審核
- **舉報審核**: 用戶舉報觸發審核
- **定期審核**: 定期重新審核內容
- **緊急審核**: 高風險內容立即審核

## 2. 技術方案比較

### 2.1 基礎內容審核（第一階段實施）

#### 2.1.1 文字內容審核

**關鍵字過濾 + 模式匹配 (主要方案)**
```javascript
// 內容審核服務
class ContentModerationService {
    constructor() {
        this.bannedWords = new Set([
            // 基礎違禁詞庫
            '色情', '暴力', '詐騙', '毒品',
            // 可以從外部檔案載入
        ]);
        
        this.suspiciousPatterns = [
            /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // 信用卡號
            /\b\d{3}[-\s]?\d{3}[-\s]?\d{4}\b/, // 電話號碼
            /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, // Email
            /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/, // URL
        ];
        
        this.toxicityThreshold = 0.7;
    }
    
    async moderateText(content, userId, contentType) {
        const result = {
            approved: true,
            confidence: 1.0,
            flags: [],
            requiresHumanReview: false,
            blockedReasons: []
        };
        
        try {
            // 1. 基礎關鍵字檢查
            const keywordCheck = this.checkBannedWords(content);
            if (keywordCheck.hasViolation) {
                result.approved = false;
                result.flags.push('banned_words');
                result.blockedReasons.push(`包含違禁詞: ${keywordCheck.words.join(', ')}`);
            }
            
            // 2. 模式匹配檢查
            const patternCheck = this.checkSuspiciousPatterns(content);
            if (patternCheck.hasViolation) {
                result.requiresHumanReview = true;
                result.flags.push('suspicious_pattern');
                result.blockedReasons.push('包含敏感信息模式');
            }
            
            // 3. 垃圾訊息檢測
            const spamScore = await this.checkSpam(content, userId);
            if (spamScore > 0.8) {
                result.approved = false;
                result.flags.push('spam');
                result.blockedReasons.push('疑似垃圾訊息');
            }
            
            // 4. 記錄審核結果
            await this.logModerationResult({
                userId,
                content: content.substring(0, 100), // 只記錄前100字符
                contentType,
                result,
                timestamp: new Date()
            });
            
            return result;
            
        } catch (error) {
            console.error('內容審核錯誤:', error);
            // 錯誤時預設需要人工審核
            return {
                approved: false,
                requiresHumanReview: true,
                flags: ['system_error'],
                blockedReasons: ['系統錯誤，需要人工審核']
            };
        }
    }
    
    checkBannedWords(content) {
        const foundWords = [];
        const normalizedContent = content.toLowerCase();
        
        for (const word of this.bannedWords) {
            if (normalizedContent.includes(word.toLowerCase())) {
                foundWords.push(word);
            }
        }
        
        return {
            hasViolation: foundWords.length > 0,
            words: foundWords
        };
    }
    
    checkSuspiciousPatterns(content) {
        const foundPatterns = [];
        
        for (const pattern of this.suspiciousPatterns) {
            if (pattern.test(content)) {
                foundPatterns.push(pattern.toString());
            }
        }
        
        return {
            hasViolation: foundPatterns.length > 0,
            patterns: foundPatterns
        };
    }
    

    
    async checkSpam(content, userId) {
        // 簡單的垃圾訊息檢測邏輯
        let spamScore = 0;
        
        // 檢查重複內容
        const recentContent = await this.getRecentUserContent(userId, 10);
        const duplicateCount = recentContent.filter(c => c.content === content).length;
        if (duplicateCount > 2) spamScore += 0.5;
        
        // 檢查發送頻率
        const recentCount = recentContent.filter(c => 
            Date.now() - new Date(c.createdAt).getTime() < 60000 // 1分鐘內
        ).length;
        if (recentCount > 5) spamScore += 0.4;
        
        // 檢查連結數量
        const linkCount = (content.match(/https?:\/\//g) || []).length;
        if (linkCount > 2) spamScore += 0.3;
        
        return Math.min(spamScore, 1.0);
    }
    
    async logModerationResult(data) {
        // 記錄到資料庫
        await db.contentModerationLogs.create(data);
    }
    
    async getRecentUserContent(userId, limit) {
        // 獲取用戶最近的內容
        return await db.userContent.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit
        });
    }
}
```

**優點:**
- 即時處理，響應快速
- 可自定義規則和閾值
- 成本低廉，無需外部 API
- 實施簡單，維護容易
- 可精確控制審核標準

**缺點:**
- 可能有誤判
- 需要持續維護詞庫
- 對語境理解有限
- 無法處理複雜的語義分析

#### 2.1.2 圖片/影片內容審核

**哈希比對 + 人工審核 (主要方案)**
```javascript
// 媒體內容審核服務
class MediaModerationService {
    constructor() {
        this.bannedImageHashes = new Set(); // 已知違規圖片的哈希值
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.allowedFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    }
    
    async moderateImage(imageBuffer, userId, metadata = {}) {
        const result = {
            approved: true,
            confidence: 1.0,
            flags: [],
            requiresHumanReview: false,
            blockedReasons: []
        };
        
        try {
            // 1. 基礎檔案檢查
            const fileValidation = this.validateFile(imageBuffer, metadata);
            if (!fileValidation.isValid) {
                result.approved = false;
                result.flags.push('invalid_file');
                result.blockedReasons.push(fileValidation.reason);
                return result;
            }
            
            // 2. 計算圖片哈希值
            const imageHash = await this.calculateImageHash(imageBuffer);
            
            // 3. 檢查是否為已知違規圖片
            if (this.bannedImageHashes.has(imageHash)) {
                result.approved = false;
                result.flags.push('banned_image');
                result.blockedReasons.push('已知違規圖片');
                return result;
            }
            
            // 4. 檢查重複上傳
            const isDuplicate = await this.checkDuplicateImage(imageHash, userId);
            if (isDuplicate) {
                result.requiresHumanReview = true;
                result.flags.push('duplicate_image');
                result.blockedReasons.push('重複上傳圖片');
            }
            
            // 5. 所有圖片都需要人工審核（第一階段）
            result.requiresHumanReview = true;
            result.flags.push('pending_human_review');
            
            // 6. 記錄審核結果
            await this.logMediaModerationResult({
                userId,
                imageHash,
                metadata,
                result,
                timestamp: new Date()
            });
            
            return result;
            
        } catch (error) {
            console.error('圖片審核錯誤:', error);
            return {
                approved: false,
                requiresHumanReview: true,
                flags: ['system_error'],
                blockedReasons: ['系統錯誤，需要人工審核']
            };
        }
    }
    
    validateFile(imageBuffer, metadata) {
        // 檢查檔案大小
        if (imageBuffer.length > this.maxFileSize) {
            return {
                isValid: false,
                reason: `檔案過大，最大允許 ${this.maxFileSize / 1024 / 1024}MB`
            };
        }
        
        // 檢查檔案格式
        const fileExtension = metadata.filename?.split('.').pop()?.toLowerCase();
        if (fileExtension && !this.allowedFormats.includes(fileExtension)) {
            return {
                isValid: false,
                reason: `不支援的檔案格式，僅支援: ${this.allowedFormats.join(', ')}`
            };
        }
        
        return { isValid: true };
    }
    
    async checkDuplicateImage(imageHash, userId) {
        // 檢查用戶是否已上傳相同圖片
        const existingImage = await db.userImages.findFirst({
            where: {
                userId,
                imageHash
            }
        });
        
        return !!existingImage;
    }
    
    async calculateImageHash(imageBuffer) {
        // 使用 perceptual hash 算法
        const sharp = require('sharp');
        const crypto = require('crypto');
        
        // 縮放到固定大小並轉為灰階
        const processedImage = await sharp(imageBuffer)
            .resize(8, 8)
            .greyscale()
            .raw()
            .toBuffer();
        
        // 計算平均值
        const pixels = Array.from(processedImage);
        const average = pixels.reduce((sum, pixel) => sum + pixel, 0) / pixels.length;
        
        // 生成哈希
        const hash = pixels.map(pixel => pixel > average ? '1' : '0').join('');
        return crypto.createHash('md5').update(hash).digest('hex');
    }
    
    // AI 相關功能已移至未來延伸功能
    // 包括：NSFW 檢測、暴力內容檢測、物體識別、人臉檢測
    // 目前階段專注於基礎審核功能
    

    
    async logMediaModerationResult(data) {
        await db.mediaModerationLogs.create(data);
    }
}
```

### 2.2 用戶舉報系統

#### 2.2.1 舉報機制設計

**多層級舉報系統**
```javascript
// 舉報系統服務
class ReportingService {
    constructor() {
        this.reportTypes = {
            'inappropriate_content': { priority: 'medium', autoAction: 'review' },
            'harassment': { priority: 'high', autoAction: 'immediate_review' },
            'spam': { priority: 'low', autoAction: 'auto_moderate' },
            'fake_profile': { priority: 'medium', autoAction: 'review' },
            'violence_threat': { priority: 'critical', autoAction: 'immediate_action' },
            'sexual_content': { priority: 'high', autoAction: 'immediate_review' },
            'hate_speech': { priority: 'high', autoAction: 'immediate_review' },
            'scam': { priority: 'high', autoAction: 'immediate_review' },
            'underage': { priority: 'critical', autoAction: 'immediate_action' },
            'other': { priority: 'low', autoAction: 'review' }
        };
        
        this.autoActionThresholds = {
            'spam': 3, // 3個舉報自動處理
            'inappropriate_content': 5,
            'harassment': 2,
            'fake_profile': 3
        };
    }
    
    async submitReport(reportData) {
        const {
            reporterId,
            targetUserId,
            targetContentId,
            reportType,
            description,
            evidence = []
        } = reportData;
        
        try {
            // 1. 驗證舉報者資格
            const reporterValidation = await this.validateReporter(reporterId);
            if (!reporterValidation.isValid) {
                throw new Error(reporterValidation.reason);
            }
            
            // 2. 檢查重複舉報
            const existingReport = await this.checkDuplicateReport(
                reporterId, targetUserId, targetContentId
            );
            if (existingReport) {
                throw new Error('您已經舉報過此內容');
            }
            
            // 3. 創建舉報記錄
            const report = await db.reports.create({
                data: {
                    reporterId,
                    targetUserId,
                    targetContentId,
                    reportType,
                    description,
                    evidence: JSON.stringify(evidence),
                    status: 'pending',
                    priority: this.reportTypes[reportType].priority,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });
            
            // 4. 檢查是否需要立即行動
            const reportConfig = this.reportTypes[reportType];
            if (reportConfig.autoAction === 'immediate_action') {
                await this.takeImmediateAction(report);
            } else if (reportConfig.autoAction === 'immediate_review') {
                await this.prioritizeForReview(report);
            }
            
            // 5. 檢查自動處理閾值
            await this.checkAutoActionThreshold(targetUserId, targetContentId, reportType);
            
            // 6. 通知相關人員
            await this.notifyModerators(report);
            
            // 7. 記錄舉報者活動
            await this.updateReporterActivity(reporterId);
            
            return {
                success: true,
                reportId: report.id,
                message: '舉報已提交，我們會盡快處理'
            };
            
        } catch (error) {
            console.error('提交舉報錯誤:', error);
            return {
                success: false,
                message: error.message || '舉報提交失敗'
            };
        }
    }
    
    async validateReporter(reporterId) {
        // 檢查舉報者資格
        const reporter = await db.users.findUnique({
            where: { id: reporterId },
            include: { reportHistory: true }
        });
        
        if (!reporter) {
            return { isValid: false, reason: '用戶不存在' };
        }
        
        if (reporter.status === 'banned') {
            return { isValid: false, reason: '已被封禁的用戶無法舉報' };
        }
        
        // 檢查舉報頻率（防止濫用）
        const recentReports = reporter.reportHistory.filter(r => 
            Date.now() - new Date(r.createdAt).getTime() < 24 * 60 * 60 * 1000 // 24小時內
        );
        
        if (recentReports.length > 10) {
            return { isValid: false, reason: '舉報過於頻繁，請稍後再試' };
        }
        
        // 檢查惡意舉報歷史
        const falseReportRate = await this.calculateFalseReportRate(reporterId);
        if (falseReportRate > 0.7) {
            return { isValid: false, reason: '舉報信譽度過低' };
        }
        
        return { isValid: true };
    }
    
    async checkDuplicateReport(reporterId, targetUserId, targetContentId) {
        return await db.reports.findFirst({
            where: {
                reporterId,
                targetUserId,
                targetContentId,
                status: { in: ['pending', 'in_review'] }
            }
        });
    }
    
    async takeImmediateAction(report) {
        // 立即行動（如暫時隱藏內容）
        if (report.targetContentId) {
            await db.content.update({
                where: { id: report.targetContentId },
                data: { 
                    status: 'hidden',
                    hiddenReason: `緊急舉報: ${report.reportType}`,
                    hiddenAt: new Date()
                }
            });
        }
        
        // 如果是嚴重違規，暫時限制用戶
        if (['violence_threat', 'underage'].includes(report.reportType)) {
            await db.users.update({
                where: { id: report.targetUserId },
                data: { 
                    status: 'restricted',
                    restrictionReason: `緊急舉報: ${report.reportType}`,
                    restrictedAt: new Date()
                }
            });
        }
        
        // 更新舉報狀態
        await db.reports.update({
            where: { id: report.id },
            data: { 
                status: 'immediate_action_taken',
                actionTakenAt: new Date()
            }
        });
    }
    
    async checkAutoActionThreshold(targetUserId, targetContentId, reportType) {
        const threshold = this.autoActionThresholds[reportType];
        if (!threshold) return;
        
        // 計算相同目標的舉報數量
        const reportCount = await db.reports.count({
            where: {
                OR: [
                    { targetUserId, reportType },
                    { targetContentId, reportType }
                ],
                status: 'pending',
                createdAt: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24小時內
                }
            }
        });
        
        if (reportCount >= threshold) {
            await this.executeAutoAction(targetUserId, targetContentId, reportType, reportCount);
        }
    }
    
    async executeAutoAction(targetUserId, targetContentId, reportType, reportCount) {
        console.log(`執行自動處理: ${reportType}, 舉報數: ${reportCount}`);
        
        // 根據舉報類型執行相應動作
        switch (reportType) {
            case 'spam':
                if (targetContentId) {
                    await db.content.update({
                        where: { id: targetContentId },
                        data: { status: 'removed', removedReason: '垃圾訊息' }
                    });
                }
                break;
                
            case 'inappropriate_content':
                if (targetContentId) {
                    await db.content.update({
                        where: { id: targetContentId },
                        data: { status: 'hidden', hiddenReason: '不當內容' }
                    });
                }
                break;
                
            case 'harassment':
                await db.users.update({
                    where: { id: targetUserId },
                    data: { 
                        status: 'warning',
                        warningReason: '騷擾行為',
                        warningCount: { increment: 1 }
                    }
                });
                break;
        }
        
        // 更新相關舉報狀態
        await db.reports.updateMany({
            where: {
                OR: [
                    { targetUserId, reportType },
                    { targetContentId, reportType }
                ],
                status: 'pending'
            },
            data: {
                status: 'auto_resolved',
                resolvedAt: new Date(),
                resolution: `自動處理 - 舉報數達到閾值 (${reportCount})`
            }
        });
    }
    
    async calculateFalseReportRate(reporterId) {
        const reports = await db.reports.findMany({
            where: { 
                reporterId,
                status: { in: ['resolved', 'dismissed'] }
            }
        });
        
        if (reports.length === 0) return 0;
        
        const falseReports = reports.filter(r => r.resolution === 'false_report').length;
        return falseReports / reports.length;
    }
    
    async notifyModerators(report) {
        // 根據優先級通知管理員
        const notification = {
            type: 'new_report',
            priority: report.priority,
            reportId: report.id,
            reportType: report.reportType,
            createdAt: new Date()
        };
        
        if (report.priority === 'critical') {
            // 立即通知所有在線管理員
            await this.sendUrgentNotification(notification);
        } else {
            // 加入管理員工作佇列
            await this.addToModerationQueue(notification);
        }
    }
    
    async sendUrgentNotification(notification) {
        // 發送緊急通知（Email, Slack, 推播等）
        const moderators = await db.users.findMany({
            where: { role: 'moderator', status: 'active' }
        });
        
        for (const moderator of moderators) {
            // 發送 Email
            await this.sendEmail(moderator.email, {
                subject: '[緊急] 新的舉報需要處理',
                template: 'urgent_report',
                data: notification
            });
            
            // 發送推播通知
            await this.sendPushNotification(moderator.id, {
                title: '緊急舉報',
                body: `收到 ${notification.reportType} 類型的緊急舉報`,
                data: notification
            });
        }
    }
}
```

### 2.3 管理員審核系統

#### 2.3.1 審核工作台設計

**管理員審核介面**
```javascript
// 管理員審核服務
class ModerationDashboardService {
    constructor() {
        this.reviewTimeouts = {
            'critical': 30 * 60 * 1000, // 30分鐘
            'high': 2 * 60 * 60 * 1000, // 2小時
            'medium': 8 * 60 * 60 * 1000, // 8小時
            'low': 24 * 60 * 60 * 1000 // 24小時
        };
    }
    
    async getModerationQueue(moderatorId, filters = {}) {
        const {
            priority,
            reportType,
            status = 'pending',
            limit = 20,
            offset = 0
        } = filters;
        
        const whereClause = {
            status,
            ...(priority && { priority }),
            ...(reportType && { reportType })
        };
        
        // 獲取待審核項目
        const reports = await db.reports.findMany({
            where: whereClause,
            include: {
                reporter: {
                    select: { id: true, username: true, email: true }
                },
                targetUser: {
                    select: { id: true, username: true, email: true, status: true }
                },
                targetContent: {
                    select: { id: true, type: true, content: true, createdAt: true }
                },
                assignedModerator: {
                    select: { id: true, username: true }
                }
            },
            orderBy: [
                { priority: 'desc' },
                { createdAt: 'asc' }
            ],
            take: limit,
            skip: offset
        });
        
        // 計算審核時效
        const enrichedReports = reports.map(report => {
            const timeLimit = this.reviewTimeouts[report.priority];
            const timeElapsed = Date.now() - new Date(report.createdAt).getTime();
            const isOverdue = timeElapsed > timeLimit;
            const timeRemaining = Math.max(0, timeLimit - timeElapsed);
            
            return {
                ...report,
                timeElapsed,
                timeRemaining,
                isOverdue,
                urgencyScore: this.calculateUrgencyScore(report, timeElapsed, timeLimit)
            };
        });
        
        // 按緊急程度排序
        enrichedReports.sort((a, b) => b.urgencyScore - a.urgencyScore);
        
        return {
            reports: enrichedReports,
            total: await db.reports.count({ where: whereClause }),
            statistics: await this.getModerationStatistics(moderatorId)
        };
    }
    
    async assignReportToModerator(reportId, moderatorId) {
        // 分配舉報給管理員
        const report = await db.reports.update({
            where: { id: reportId },
            data: {
                assignedModeratorId: moderatorId,
                status: 'in_review',
                assignedAt: new Date()
            }
        });
        
        // 記錄分配歷史
        await db.moderationHistory.create({
            data: {
                reportId,
                moderatorId,
                action: 'assigned',
                timestamp: new Date()
            }
        });
        
        return report;
    }
    
    async reviewReport(reportId, moderatorId, decision) {
        const {
            action, // 'approve', 'reject', 'escalate', 'request_more_info'
            reason,
            notes,
            punishment, // 如果需要懲罰
            evidence
        } = decision;
        
        try {
            await db.$transaction(async (tx) => {
                // 更新舉報狀態
                const report = await tx.reports.update({
                    where: { id: reportId },
                    data: {
                        status: this.getReportStatusFromAction(action),
                        resolution: reason,
                        moderatorNotes: notes,
                        resolvedAt: new Date(),
                        resolvedBy: moderatorId
                    }
                });
                
                // 執行相應動作
                if (action === 'approve') {
                    await this.executeApprovedAction(tx, report, punishment);
                } else if (action === 'escalate') {
                    await this.escalateReport(tx, report, reason);
                }
                
                // 記錄審核歷史
                await tx.moderationHistory.create({
                    data: {
                        reportId,
                        moderatorId,
                        action,
                        reason,
                        notes,
                        evidence: JSON.stringify(evidence || []),
                        timestamp: new Date()
                    }
                });
                
                // 更新管理員統計
                await this.updateModeratorStats(tx, moderatorId, action);
                
                // 通知相關用戶
                await this.notifyUsersOfDecision(tx, report, action, reason);
            });
            
            return { success: true, message: '審核完成' };
            
        } catch (error) {
            console.error('審核錯誤:', error);
            return { success: false, message: '審核失敗' };
        }
    }
    
    async executeApprovedAction(tx, report, punishment) {
        const { targetUserId, targetContentId, reportType } = report;
        
        // 處理內容
        if (targetContentId) {
            await tx.content.update({
                where: { id: targetContentId },
                data: {
                    status: 'removed',
                    removedReason: `違規內容: ${reportType}`,
                    removedAt: new Date(),
                    removedBy: report.resolvedBy
                }
            });
        }
        
        // 處理用戶懲罰
        if (punishment && targetUserId) {
            await this.applyUserPunishment(tx, targetUserId, punishment, report);
        }
    }
    
    async applyUserPunishment(tx, userId, punishment, report) {
        const {
            type, // 'warning', 'temporary_ban', 'permanent_ban', 'restriction'
            duration, // 對於臨時懲罰
            reason
        } = punishment;
        
        const punishmentData = {
            userId,
            type,
            reason,
            reportId: report.id,
            appliedBy: report.resolvedBy,
            appliedAt: new Date(),
            ...(duration && { expiresAt: new Date(Date.now() + duration) })
        };
        
        // 記錄懲罰
        await tx.userPunishments.create({ data: punishmentData });
        
        // 更新用戶狀態
        const userUpdate = {
            updatedAt: new Date()
        };
        
        switch (type) {
            case 'warning':
                userUpdate.warningCount = { increment: 1 };
                userUpdate.lastWarningAt = new Date();
                break;
                
            case 'temporary_ban':
                userUpdate.status = 'banned';
                userUpdate.bannedUntil = new Date(Date.now() + duration);
                userUpdate.banReason = reason;
                break;
                
            case 'permanent_ban':
                userUpdate.status = 'permanently_banned';
                userUpdate.banReason = reason;
                break;
                
            case 'restriction':
                userUpdate.status = 'restricted';
                userUpdate.restrictedUntil = duration ? new Date(Date.now() + duration) : null;
                userUpdate.restrictionReason = reason;
                break;
        }
        
        await tx.users.update({
            where: { id: userId },
            data: userUpdate
        });
    }
    
    calculateUrgencyScore(report, timeElapsed, timeLimit) {
        // 計算緊急程度分數
        const priorityWeight = {
            'critical': 100,
            'high': 75,
            'medium': 50,
            'low': 25
        };
        
        const baseScore = priorityWeight[report.priority] || 0;
        const timeScore = Math.min(50, (timeElapsed / timeLimit) * 50);
        
        return baseScore + timeScore;
    }
    
    getReportStatusFromAction(action) {
        const statusMap = {
            'approve': 'resolved',
            'reject': 'dismissed',
            'escalate': 'escalated',
            'request_more_info': 'pending_info'
        };
        return statusMap[action] || 'resolved';
    }
    
    async getModerationStatistics(moderatorId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const [totalPending, todayResolved, weeklyResolved, averageResponseTime] = await Promise.all([
            // 待處理總數
            db.reports.count({
                where: { status: { in: ['pending', 'in_review'] } }
            }),
            
            // 今日處理數
            db.reports.count({
                where: {
                    resolvedBy: moderatorId,
                    resolvedAt: { gte: today }
                }
            }),
            
            // 本週處理數
            db.reports.count({
                where: {
                    resolvedBy: moderatorId,
                    resolvedAt: { gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) }
                }
            }),
            
            // 平均響應時間
            this.calculateAverageResponseTime(moderatorId)
        ]);
        
        return {
            totalPending,
            todayResolved,
            weeklyResolved,
            averageResponseTime
        };
    }
    
    async calculateAverageResponseTime(moderatorId) {
        const recentReports = await db.reports.findMany({
            where: {
                resolvedBy: moderatorId,
                resolvedAt: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 最近30天
                }
            },
            select: {
                createdAt: true,
                resolvedAt: true
            }
        });
        
        if (recentReports.length === 0) return 0;
        
        const totalResponseTime = recentReports.reduce((sum, report) => {
            return sum + (new Date(report.resolvedAt).getTime() - new Date(report.createdAt).getTime());
        }, 0);
        
        return Math.round(totalResponseTime / recentReports.length / (60 * 60 * 1000)); // 轉換為小時
    }
}
```

## 3. 資料庫設計

### 3.1 內容審核相關表結構

```sql
-- 內容審核日誌表
CREATE TABLE content_moderation_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    content_id INTEGER,
    content_type VARCHAR(50) NOT NULL, -- 'text', 'image', 'video', 'profile'
    content_hash VARCHAR(255),
    moderation_result JSONB NOT NULL,
    flags TEXT[],
    confidence_score DECIMAL(3,2),
    requires_human_review BOOLEAN DEFAULT FALSE,
    blocked_reasons TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 媒體審核日誌表
CREATE TABLE media_moderation_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    file_hash VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER,
    moderation_result JSONB NOT NULL,
    detected_objects JSONB,
    nsfw_score DECIMAL(3,2),
    violence_score DECIMAL(3,2),
    flags TEXT[],
    requires_human_review BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 舉報表
CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    reporter_id INTEGER REFERENCES users(id),
    target_user_id INTEGER REFERENCES users(id),
    target_content_id INTEGER,
    report_type VARCHAR(50) NOT NULL,
    description TEXT,
    evidence JSONB,
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'medium',
    assigned_moderator_id INTEGER REFERENCES users(id),
    resolution TEXT,
    moderator_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_at TIMESTAMP,
    resolved_at TIMESTAMP,
    resolved_by INTEGER REFERENCES users(id)
);

-- 審核歷史表
CREATE TABLE moderation_history (
    id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES reports(id),
    moderator_id INTEGER REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    reason TEXT,
    notes TEXT,
    evidence JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用戶懲罰表
CREATE TABLE user_punishments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    type VARCHAR(50) NOT NULL, -- 'warning', 'temporary_ban', 'permanent_ban', 'restriction'
    reason TEXT NOT NULL,
    report_id INTEGER REFERENCES reports(id),
    applied_by INTEGER REFERENCES users(id),
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- 違禁詞庫表
CREATE TABLE banned_words (
    id SERIAL PRIMARY KEY,
    word VARCHAR(255) NOT NULL,
    category VARCHAR(50),
    severity INTEGER DEFAULT 1, -- 1-5, 5最嚴重
    language VARCHAR(10) DEFAULT 'zh',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id)
);

-- 違規圖片哈希表
CREATE TABLE banned_image_hashes (
    id SERIAL PRIMARY KEY,
    image_hash VARCHAR(255) UNIQUE NOT NULL,
    reason TEXT,
    severity INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id)
);

-- 審核員統計表
CREATE TABLE moderator_statistics (
    id SERIAL PRIMARY KEY,
    moderator_id INTEGER REFERENCES users(id),
    date DATE NOT NULL,
    reports_reviewed INTEGER DEFAULT 0,
    reports_approved INTEGER DEFAULT 0,
    reports_rejected INTEGER DEFAULT 0,
    average_response_time INTEGER, -- 分鐘
    accuracy_score DECIMAL(3,2), -- 基於後續申訴結果計算
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(moderator_id, date)
);

-- 索引
CREATE INDEX idx_content_moderation_logs_user_id ON content_moderation_logs(user_id);
CREATE INDEX idx_content_moderation_logs_created_at ON content_moderation_logs(created_at);
CREATE INDEX idx_content_moderation_logs_flags ON content_moderation_logs USING GIN(flags);

CREATE INDEX idx_media_moderation_logs_file_hash ON media_moderation_logs(file_hash);
CREATE INDEX idx_media_moderation_logs_user_id ON media_moderation_logs(user_id);

CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_priority ON reports(priority);
CREATE INDEX idx_reports_target_user_id ON reports(target_user_id);
CREATE INDEX idx_reports_created_at ON reports(created_at);
CREATE INDEX idx_reports_assigned_moderator_id ON reports(assigned_moderator_id);

CREATE INDEX idx_user_punishments_user_id ON user_punishments(user_id);
CREATE INDEX idx_user_punishments_is_active ON user_punishments(is_active);
CREATE INDEX idx_user_punishments_expires_at ON user_punishments(expires_at);

CREATE INDEX idx_banned_words_word ON banned_words(word);
CREATE INDEX idx_banned_words_is_active ON banned_words(is_active);

CREATE INDEX idx_banned_image_hashes_hash ON banned_image_hashes(image_hash);
CREATE INDEX idx_banned_image_hashes_is_active ON banned_image_hashes(is_active);
```

## 4. 實施計劃

### 4.1 第一階段（基礎審核）- 3週
- [ ] 文字內容審核系統
- [ ] 基礎舉報機制
- [ ] 管理員審核介面
- [ ] 違禁詞庫建立
- [ ] 基礎懲罰系統

### 4.2 第二階段（媒體審核）- 4週
- [ ] 圖片內容審核（哈希比對）
- [ ] 影片內容審核（基礎檢查）
- [ ] 哈希比對系統
- [ ] 人工審核流程
- [ ] 審核結果優化

### 4.3 第三階段（進階功能）- 3週
- [ ] 自動化處理規則
- [ ] 審核統計分析
- [ ] 申訴處理系統
- [ ] 審核品質監控
- [ ] 性能優化

### 4.4 第四階段（完善優化）- 2週
- [ ] 審核規則調優
- [ ] 用戶體驗優化
- [ ] 文檔和培訓
- [ ] 監控和告警
- [ ] 系統穩定性提升

### 4.5 未來延伸功能（待評估）
- [ ] AI 模型整合（Perspective API、Google Vision API）
- [ ] 機器學習模型訓練
- [ ] 自動化 AI 內容檢測
- [ ] 智能審核推薦
- [ ] 深度學習圖像識別

## 5. 技術建議

### 5.1 推薦技術棧
- **文字審核**: 自建關鍵字 + 正則表達式引擎
- **圖片審核**: 哈希比對 + 人工審核
- **資料庫**: PostgreSQL + Redis 快取
- **佇列系統**: Bull Queue (Redis)
- **通知系統**: Email + 推播通知

### 5.2 成本估算
- **人工審核成本**: $800-1200/月 (兼職審核員 2-3 人)
- **伺服器資源**: $200-500/月
- **基礎設施**: $20-65/月 (Redis、儲存、監控)
- **審核工具和培訓**: $100-200/月
- **總成本**: $1120-1965/月

**未來 AI 功能成本 (延伸)**:
- **Google Vision API**: $100-300/月
- **Perspective API**: $50-150/月
- **AI 服務總計**: $150-450/月

### 5.3 關鍵指標

**審核效率指標:**
- 人工審核處理時間 < 30 分鐘
- 關鍵字過濾準確率 > 90%
- 系統可用性 > 99.5%
- 審核積壓 < 100 件

**品質指標:**
- 人工審核準確率 > 95%
- 用戶申訴成功率 < 10%
- 重複違規檢測率 > 85%
- 誤封率 < 3%

**用戶體驗:**
- 用戶申訴回應時間 < 24 小時
- 審核結果通知時間 < 2 小時
- 用戶滿意度 > 80%
- 審核透明度評分 > 4.0/5.0

---

**文檔版本**: v1.0  
**最後更新**: 2025-01-02  
**狀態**: ✅ 規劃完成，待實施