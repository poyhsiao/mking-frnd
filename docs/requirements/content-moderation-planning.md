# MKing Friend - Content Moderation Planning

## 1. Feature Overview

### 1.1 Moderation Scope
- **User-Generated Content**: Personal profiles, photos, videos, text descriptions
- **Chat Content**: Private messages, group chats, voice messages
- **Community Content**: Posts, comments, shared content
- **Reported Content**: Inappropriate content reported by users
- **Media Files**: Images, videos, audio files

### 1.2 Moderation Objectives
- **Safety Protection**: Prevent harassment, bullying, threats
- **Content Compliance**: Meet legal and regulatory requirements
- **Community Quality**: Maintain a good dating environment
- **User Experience**: Quickly handle inappropriate content
- **Privacy Protection**: Protect user personal privacy

### 1.3 Moderation Types
- **Preventive Moderation**: Review content before publication
- **Post-Publication Moderation**: Review content after publication
- **Report-Triggered Moderation**: Review triggered by user reports
- **Periodic Moderation**: Regularly re-review content
- **Emergency Moderation**: Immediate review of high-risk content

## 2. Technical Solution Comparison

### 2.1 Basic Content Moderation (Phase 1 Implementation)

#### 2.1.1 Text Content Moderation

**Keyword Filtering + Pattern Matching (Primary Solution)**
```javascript
// Content Moderation Service
class ContentModerationService {
    constructor() {
        this.bannedWords = new Set([
            // Basic banned word database
            'pornography', 'violence', 'fraud', 'drugs',
            // Can be loaded from external files
        ]);
        
        this.suspiciousPatterns = [
            /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // Credit card numbers
            /\b\d{3}[-\s]?\d{3}[-\s]?\d{4}\b/, // Phone numbers
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
            // 1. Basic keyword check
            const keywordCheck = this.checkBannedWords(content);
            if (keywordCheck.hasViolation) {
                result.approved = false;
                result.flags.push('banned_words');
                result.blockedReasons.push(`Contains banned words: ${keywordCheck.words.join(', ')}`);
            }
            
            // 2. Pattern matching check
            const patternCheck = this.checkSuspiciousPatterns(content);
            if (patternCheck.hasViolation) {
                result.requiresHumanReview = true;
                result.flags.push('suspicious_pattern');
                result.blockedReasons.push('Contains sensitive information patterns');
            }
            
            // 3. Spam detection
            const spamScore = await this.checkSpam(content, userId);
            if (spamScore > 0.8) {
                result.approved = false;
                result.flags.push('spam');
                result.blockedReasons.push('Suspected spam message');
            }
            
            // 4. Log moderation result
            await this.logModerationResult({
                userId,
                content: content.substring(0, 100), // Only log first 100 characters
                contentType,
                result,
                timestamp: new Date()
            });
            
            return result;
            
        } catch (error) {
            console.error('Content moderation error:', error);
            // Default to human review on error
            return {
                approved: false,
                requiresHumanReview: true,
                flags: ['system_error'],
                blockedReasons: ['System error, requires human review']
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
        // Simple spam detection logic
        let spamScore = 0;
        
        // Check duplicate content
        const recentContent = await this.getRecentUserContent(userId, 10);
        const duplicateCount = recentContent.filter(c => c.content === content).length;
        if (duplicateCount > 2) spamScore += 0.5;
        
        // Check sending frequency
        const recentCount = recentContent.filter(c => 
            Date.now() - new Date(c.createdAt).getTime() < 60000 // Within 1 minute
        ).length;
        if (recentCount > 5) spamScore += 0.4;
        
        // Check link count
        const linkCount = (content.match(/https?:\/\//g) || []).length;
        if (linkCount > 2) spamScore += 0.3;
        
        return Math.min(spamScore, 1.0);
    }
    
    async logModerationResult(data) {
        // Log to database
        await db.contentModerationLogs.create(data);
    }
    
    async getRecentUserContent(userId, limit) {
        // Get user's recent content
        return await db.userContent.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit
        });
    }
}
```

**Advantages:**
- Real-time processing, fast response
- Customizable rules and thresholds
- Low cost, no external API required
- Simple implementation, easy maintenance
- Precise control over moderation standards

**Disadvantages:**
- Potential false positives
- Requires continuous word database maintenance
- Limited contextual understanding
- Cannot handle complex semantic analysis

#### 2.1.2 Image/Video Content Moderation

**Hash Comparison + Human Review (Primary Solution)**
```javascript
// Media Content Moderation Service
class MediaModerationService {
    constructor() {
        this.bannedImageHashes = new Set(); // Hash values of known violating images
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
            // 1. Basic file validation
            const fileValidation = this.validateFile(imageBuffer, metadata);
            if (!fileValidation.isValid) {
                result.approved = false;
                result.flags.push('invalid_file');
                result.blockedReasons.push(fileValidation.reason);
                return result;
            }
            
            // 2. Calculate image hash
            const imageHash = await this.calculateImageHash(imageBuffer);
            
            // 3. Check against known violating images
            if (this.bannedImageHashes.has(imageHash)) {
                result.approved = false;
                result.flags.push('banned_image');
                result.blockedReasons.push('Known violating image');
                return result;
            }
            
            // 4. Check duplicate uploads
            const isDuplicate = await this.checkDuplicateImage(imageHash, userId);
            if (isDuplicate) {
                result.requiresHumanReview = true;
                result.flags.push('duplicate_image');
                result.blockedReasons.push('Duplicate image upload');
            }
            
            // 5. All images require human review (Phase 1)
            result.requiresHumanReview = true;
            result.flags.push('pending_human_review');
            
            // 6. Log moderation result
            await this.logMediaModerationResult({
                userId,
                imageHash,
                metadata,
                result,
                timestamp: new Date()
            });
            
            return result;
            
        } catch (error) {
            console.error('Image moderation error:', error);
            return {
                approved: false,
                requiresHumanReview: true,
                flags: ['system_error'],
                blockedReasons: ['System error, requires human review']
            };
        }
    }
    
    validateFile(imageBuffer, metadata) {
        // Check file size
        if (imageBuffer.length > this.maxFileSize) {
            return {
                isValid: false,
                reason: `File too large, maximum allowed ${this.maxFileSize / 1024 / 1024}MB`
            };
        }
        
        // Check file format
        const fileExtension = metadata.filename?.split('.').pop()?.toLowerCase();
        if (fileExtension && !this.allowedFormats.includes(fileExtension)) {
            return {
                isValid: false,
                reason: `Unsupported file format, only supports: ${this.allowedFormats.join(', ')}`
            };
        }
        
        return { isValid: true };
    }
    
    async checkDuplicateImage(imageHash, userId) {
        // Check if user has already uploaded the same image
        const existingImage = await db.userImages.findFirst({
            where: {
                userId,
                imageHash
            }
        });
        
        return !!existingImage;
    }
}
```

**Advantages:**
- Fast duplicate detection
- Effective against known violating content
- Low computational cost
- Simple implementation
- Good for building violation database

**Disadvantages:**
- Cannot detect new violating content
- Requires human review for all new images
- Limited automated detection capabilities
- Dependent on hash database quality

    async calculateImageHash(imageBuffer) {
        // Use perceptual hash algorithm
        const sharp = require('sharp');
        const crypto = require('crypto');
        
        // Scale to fixed size and convert to grayscale
        const processedImage = await sharp(imageBuffer)
            .resize(8, 8)
            .greyscale()
            .raw()
            .toBuffer();
        
        // Calculate average value
        const pixels = Array.from(processedImage);
        const average = pixels.reduce((sum, pixel) => sum + pixel, 0) / pixels.length;
        
        // Generate hash
        const hash = pixels.map(pixel => pixel > average ? '1' : '0').join('');
        return crypto.createHash('md5').update(hash).digest('hex');
    }
    
    // AI-related features moved to future extensions
    // Including: NSFW detection, violence detection, object recognition, face detection
    // Current phase focuses on basic moderation features
    
    async logMediaModerationResult(data) {
        await db.mediaModerationLogs.create(data);
    }
}
```

### 2.2 User Reporting System

#### 2.2.1 Reporting Mechanism Design

**Multi-level Reporting System**
```javascript
// Reporting System Service
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
            'spam': 3, // 3 reports trigger auto-action
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
            // 1. Validate reporter eligibility
            const reporterValidation = await this.validateReporter(reporterId);
            if (!reporterValidation.isValid) {
                throw new Error(reporterValidation.reason);
            }
            
            // 2. Check duplicate reports
            const existingReport = await this.checkDuplicateReport(
                reporterId, targetUserId, targetContentId
            );
            if (existingReport) {
                throw new Error('You have already reported this content');
            }
            
            // 3. Create report record
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
            
            // 4. Check if immediate action is needed
            const reportConfig = this.reportTypes[reportType];
            if (reportConfig.autoAction === 'immediate_action') {
                await this.takeImmediateAction(report);
            } else if (reportConfig.autoAction === 'immediate_review') {
                await this.prioritizeForReview(report);
            }
            
            // 5. Check auto-action threshold
            await this.checkAutoActionThreshold(targetUserId, targetContentId, reportType);
            
            // 6. Notify moderators
            await this.notifyModerators(report);
            
            // 7. Update reporter activity
            await this.updateReporterActivity(reporterId);
            
            return {
                success: true,
                reportId: report.id,
                message: 'Report submitted, we will process it as soon as possible'
            };
            
        } catch (error) {
            console.error('Submit report error:', error);
            return {
                success: false,
                message: error.message || 'Failed to submit report'
            };
        }
    }
    
    async validateReporter(reporterId) {
        // Check reporter eligibility
        const reporter = await db.users.findUnique({
            where: { id: reporterId },
            include: { reportHistory: true }
        });
        
        if (!reporter) {
            return { isValid: false, reason: 'User does not exist' };
        }
        
        if (reporter.status === 'banned') {
            return { isValid: false, reason: 'Banned users cannot report' };
        }
        
        // Check reporting frequency (prevent abuse)
        const recentReports = reporter.reportHistory.filter(r => 
            Date.now() - new Date(r.createdAt).getTime() < 24 * 60 * 60 * 1000 // Within 24 hours
        );
        
        if (recentReports.length > 10) {
            return { isValid: false, reason: 'Too many reports, please try again later' };
        }
        
        // Check malicious reporting history
        const falseReportRate = await this.calculateFalseReportRate(reporterId);
        if (falseReportRate > 0.7) {
            return { isValid: false, reason: 'Report credibility too low' };
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
        // Take immediate action (e.g., temporarily hide content)
        if (report.targetContentId) {
            await db.content.update({
                where: { id: report.targetContentId },
                data: { 
                    status: 'hidden',
                    hiddenReason: `Emergency report: ${report.reportType}`,
                    hiddenAt: new Date()
                }
            });
        }
        
        // For serious violations, temporarily restrict user
        if (['violence_threat', 'underage'].includes(report.reportType)) {
            await db.users.update({
                where: { id: report.targetUserId },
                data: { 
                    status: 'restricted',
                    restrictionReason: `Emergency report: ${report.reportType}`,
                    restrictedAt: new Date()
                }
            });
        }
        
        // Update report status
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
        
        // Count reports for the same target
        const reportCount = await db.reports.count({
            where: {
                OR: [
                    { targetUserId, reportType },
                    { targetContentId, reportType }
                ],
                status: 'pending',
                createdAt: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Within 24 hours
                }
            }
        });
        
        if (reportCount >= threshold) {
            await this.executeAutoAction(targetUserId, targetContentId, reportType, reportCount);
        }
    }
    
    async executeAutoAction(targetUserId, targetContentId, reportType, reportCount) {
        console.log(`Executing auto-action: ${reportType}, report count: ${reportCount}`);
        
        // Execute corresponding action based on report type
        switch (reportType) {
            case 'spam':
                if (targetContentId) {
                    await db.content.update({
                        where: { id: targetContentId },
                        data: { status: 'removed', removedReason: 'Spam message' }
                    });
                }
                break;
                
            case 'inappropriate_content':
                if (targetContentId) {
                    await db.content.update({
                        where: { id: targetContentId },
                        data: { status: 'hidden', hiddenReason: 'Inappropriate content' }
                    });
                }
                break;
                
            case 'harassment':
                await db.users.update({
                    where: { id: targetUserId },
                    data: { 
                        status: 'warning',
                        warningReason: 'Harassment behavior',
                        warningCount: { increment: 1 }
                    }
                });
                break;
        }
        
        // Update related report status
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
                resolution: `Auto-processed - report count reached threshold (${reportCount})`
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
        
        const falseReports = reports.filter(r => r.status === 'dismissed').length;
        return falseReports / reports.length;
    }
}
```

#### 2.2.2 Notification and Statistics

```javascript
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
        // Notify administrators based on priority
        const notification = {
            type: 'new_report',
            priority: report.priority,
            reportId: report.id,
            reportType: report.reportType,
            createdAt: new Date()
        };
        
        if (report.priority === 'critical') {
            // Immediately notify all online administrators
            await this.sendUrgentNotification(notification);
        } else {
            // Add to administrator work queue
            await this.addToModerationQueue(notification);
        }
    }
    
    async sendUrgentNotification(notification) {
        // Send urgent notifications (Email, Slack, Push, etc.)
        const moderators = await db.users.findMany({
            where: { role: 'moderator', status: 'active' }
        });
        
        for (const moderator of moderators) {
            // Send Email
            await this.sendEmail(moderator.email, {
                subject: '[URGENT] New Report Requires Processing',
                template: 'urgent_report',
                data: notification
            });
            
            // Send push notification
            await this.sendPushNotification(moderator.id, {
                title: 'Urgent Report',
                body: `Received urgent report of type ${notification.reportType}`,
                data: notification
            });
        }
    }
}
```

### 2.3 Administrator Review System

#### 2.3.1 Review Dashboard Design

**Administrator Review Interface**
```javascript
// Administrator Review Service
class ModerationDashboardService {
    constructor() {
        this.reviewTimeouts = {
            'critical': 30 * 60 * 1000, // 30 minutes
            'high': 2 * 60 * 60 * 1000, // 2 hours
            'medium': 8 * 60 * 60 * 1000, // 8 hours
            'low': 24 * 60 * 60 * 1000 // 24 hours
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
        
        // Get pending review items
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
        
        // Calculate review deadlines
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
        
        // Sort by urgency
        enrichedReports.sort((a, b) => b.urgencyScore - a.urgencyScore);
        
        return {
            reports: enrichedReports,
            total: await db.reports.count({ where: whereClause }),
            statistics: await this.getModerationStatistics(moderatorId)
        };
    }
    
    async assignReportToModerator(reportId, moderatorId) {
        // Assign report to moderator
        const report = await db.reports.update({
            where: { id: reportId },
            data: {
                assignedModeratorId: moderatorId,
                status: 'in_review',
                assignedAt: new Date()
            }
        });
        
        // Record assignment history
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
            punishment, // If punishment is needed
            evidence
        } = decision;
        
        try {
            await db.$transaction(async (tx) => {
                // Update report status
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
                
                // Execute corresponding action
                if (action === 'approve') {
                    await this.executeApprovedAction(tx, report, punishment);
                } else if (action === 'escalate') {
                    await this.escalateReport(tx, report, reason);
                }
                
                // Record review history
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
                
                // Update moderator statistics
                await this.updateModeratorStats(tx, moderatorId, action);
                
                // Notify relevant users
                await this.notifyUsersOfDecision(tx, report, action, reason);
            });
            
            return { success: true, message: 'Review completed' };
            
        } catch (error) {
            console.error('Review error:', error);
            return { success: false, message: 'Review failed' };
        }
    }
    
    async executeApprovedAction(tx, report, punishment) {
        const { targetUserId, targetContentId, reportType } = report;
        
        // Handle content
        if (targetContentId) {
            await tx.content.update({
                where: { id: targetContentId },
                data: {
                    status: 'removed',
                    removedReason: `Violation: ${reportType}`,
                    removedAt: new Date(),
                    removedBy: report.resolvedBy
                }
            });
        }
        
        // Handle user punishment
        if (punishment && targetUserId) {
            await this.applyUserPunishment(tx, targetUserId, punishment, report);
        }
    }
    
    async applyUserPunishment(tx, userId, punishment, report) {
        const {
            type, // 'warning', 'temporary_ban', 'permanent_ban', 'restriction'
            duration, // For temporary punishments
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
        
        // Record punishment
        await tx.userPunishments.create({ data: punishmentData });
        
        // Update user status
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
        // Calculate urgency score
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
            // Total pending
            db.reports.count({
                where: { status: { in: ['pending', 'in_review'] } }
            }),
            
            // Today's resolved
            db.reports.count({
                where: {
                    resolvedBy: moderatorId,
                    resolvedAt: { gte: today }
                }
            }),
            
            // Weekly resolved
            db.reports.count({
                where: {
                    resolvedBy: moderatorId,
                    resolvedAt: { gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) }
                }
            }),
            
            // Average response time
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
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
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
        
        return Math.round(totalResponseTime / recentReports.length / (60 * 60 * 1000)); // Convert to hours
    }
}
```

## 3. Database Design

### 3.1 Content Moderation Related Table Structure

```sql
-- Content moderation logs table
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

-- Media moderation logs table
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

-- Reports table
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

-- Moderation history table
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

-- User punishments table
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

-- Banned words table
CREATE TABLE banned_words (
    id SERIAL PRIMARY KEY,
    word VARCHAR(255) NOT NULL,
    category VARCHAR(50),
    severity INTEGER DEFAULT 1, -- 1-5, 5 is most severe
    language VARCHAR(10) DEFAULT 'zh',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id)
);

-- Banned image hashes table
CREATE TABLE banned_image_hashes (
    id SERIAL PRIMARY KEY,
    image_hash VARCHAR(255) UNIQUE NOT NULL,
    reason TEXT,
    severity INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id)
);

-- Moderator statistics table
CREATE TABLE moderator_statistics (
    id SERIAL PRIMARY KEY,
    moderator_id INTEGER REFERENCES users(id),
    date DATE NOT NULL,
    reports_reviewed INTEGER DEFAULT 0,
    reports_approved INTEGER DEFAULT 0,
    reports_rejected INTEGER DEFAULT 0,
    average_response_time INTEGER, -- minutes
    accuracy_score DECIMAL(3,2), -- calculated based on subsequent appeal results
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(moderator_id, date)
);

-- Indexes
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

## 4. Implementation Plan

### 4.1 Phase 1 (Basic Moderation) - 3 weeks
- [ ] Text content moderation system
- [ ] Basic reporting mechanism
- [ ] Administrator review interface
- [ ] Banned words database setup
- [ ] Basic punishment system

### 4.2 Phase 2 (Media Moderation) - 4 weeks
- [ ] Image content moderation (hash comparison)
- [ ] Video content moderation (basic checks)
- [ ] Hash comparison system
- [ ] Human review workflow
- [ ] Moderation result optimization

### 4.3 Phase 3 (Advanced Features) - 3 weeks
- [ ] Automated processing rules
- [ ] Moderation statistics analysis
- [ ] Appeal handling system
- [ ] Moderation quality monitoring
- [ ] Performance optimization

### 4.4 Phase 4 (Refinement and Optimization) - 2 weeks
- [ ] Moderation rule fine-tuning
- [ ] User experience optimization
- [ ] Documentation and training
- [ ] Monitoring and alerting
- [ ] System stability improvements

### 4.5 Future Extensions (To be evaluated)
- [ ] AI model integration (Perspective API, Google Vision API)
- [ ] Machine learning model training
- [ ] Automated AI content detection
- [ ] Intelligent moderation recommendations
- [ ] Deep learning image recognition

## 5. Technical Recommendations

### 5.1 Recommended Technology Stack
- **Text Moderation**: Custom keyword + regex engine
- **Image Moderation**: Hash comparison + human review
- **Database**: PostgreSQL + Redis cache
- **Queue System**: Bull Queue (Redis)
- **Notification System**: Email + push notifications

### 5.2 Cost Estimation
- **Human moderation cost**: $800-1200/month (2-3 part-time moderators)
- **Server resources**: $200-500/month
- **Infrastructure**: $20-65/month (Redis, storage, monitoring)
- **Moderation tools and training**: $100-200/month
- **Total cost**: $1120-1965/month

**Future AI features cost (extensions)**:
- **Google Vision API**: $100-300/month
- **Perspective API**: $50-150/month
- **AI services total**: $150-450/month

### 5.3 Key Metrics

**Moderation Efficiency Metrics:**
- Human review processing time < 30 minutes
- Keyword filtering accuracy > 90%
- System availability > 99.5%
- Moderation backlog < 100 items

**Quality Metrics:**
- Human review accuracy > 95%
- User appeal success rate < 10%
- Repeat violation detection rate > 85%
- False positive rate < 3%

**User Experience:**
- User appeal response time < 24 hours
- Moderation result notification time < 2 hours
- User satisfaction > 80%
- Moderation transparency score > 4.0/5.0

---

**Document Version**: v1.0  
**Last Updated**: 2025-01-02  
**Status**: ✅ Planning complete, ready for implementation