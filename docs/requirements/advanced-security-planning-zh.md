# MKing Friend - 安全防護進階功能規劃

## 1. 功能概述

### 1.1 核心安全需求
- **身份驗證強化**: 多因素認證、生物識別
- **數據保護**: 端到端加密、敏感數據保護
- **威脅檢測**: 異常行為檢測、惡意用戶識別
- **隱私保護**: 數據匿名化、隱私設定控制
- **合規性**: GDPR、個資法遵循
- **安全監控**: 實時安全監控、入侵檢測

### 1.2 威脅模型分析
- **外部威脅**: DDoS 攻擊、SQL 注入、XSS 攻擊
- **內部威脅**: 數據洩露、權限濫用
- **社交工程**: 釣魚攻擊、身份冒用
- **隱私威脅**: 數據追蹤、個人資訊洩露
- **業務威脅**: 假帳號、垃圾訊息、詐騙

### 1.3 安全等級分類
- **Level 1**: 基礎安全（密碼、HTTPS）
- **Level 2**: 進階安全（2FA、加密）
- **Level 3**: 企業級安全（零信任、AI 檢測）
- **Level 4**: 軍用級安全（端到端加密、硬體安全）

## 2. 技術方案比較

### 2.1 身份驗證解決方案

#### 2.1.1 多因素認證 (MFA)

**TOTP (Time-based OTP) - 推薦**
```typescript
// 使用 speakeasy 實現 TOTP
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

class TOTPService {
  generateSecret(userId: string): { secret: string; qrCode: string } {
    const secret = speakeasy.generateSecret({
      name: `MKing Friend (${userId})`,
      issuer: 'MKing Friend',
      length: 32
    });
    
    const qrCode = QRCode.toDataURL(secret.otpauth_url);
    
    return {
      secret: secret.base32,
      qrCode
    };
  }
  
  verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      token,
      window: 2, // 允許前後 2 個時間窗口
      encoding: 'base32'
    });
  }
  
  async enableMFA(userId: string, secret: string, token: string): Promise<void> {
    if (!this.verifyToken(secret, token)) {
      throw new Error('無效的驗證碼');
    }
    
    // 加密存儲密鑰
    const encryptedSecret = await this.encryptionService.encrypt(secret);
    
    await this.userSecurityRepository.update(userId, {
      mfa_enabled: true,
      mfa_secret: encryptedSecret,
      backup_codes: this.generateBackupCodes()
    });
  }
}
```

**優點:**
- 標準化協議
- 離線工作
- 多種 App 支援
- 成本低

**缺點:**
- 需要用戶安裝 App
- 時間同步問題

**SMS OTP**
**優點:**
- 用戶熟悉
- 無需額外 App

**缺點:**
- 成本較高
- SIM 卡劫持風險
- 依賴電信服務

#### 2.1.2 生物識別認證

**WebAuthn API (推薦)**
```typescript
// WebAuthn 實現
class WebAuthnService {
  async generateRegistrationOptions(userId: string): Promise<PublicKeyCredentialCreationOptions> {
    const user = await this.userService.getUser(userId);
    
    return {
      challenge: this.generateChallenge(),
      rp: {
        name: 'MKing Friend',
        id: 'mkingfriend.com'
      },
      user: {
        id: Buffer.from(userId),
        name: user.email,
        displayName: user.displayName
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' }, // ES256
        { alg: -257, type: 'public-key' } // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required'
      },
      timeout: 60000,
      attestation: 'direct'
    };
  }
  
  async verifyRegistration(userId: string, credential: AuthenticatorAttestationResponse): Promise<void> {
    // 驗證註冊響應
    const verification = await this.verifyAttestationResponse(credential);
    
    if (verification.verified) {
      // 存儲公鑰和認證器資訊
      await this.credentialRepository.create({
        user_id: userId,
        credential_id: verification.credentialID,
        public_key: verification.credentialPublicKey,
        counter: verification.counter,
        device_type: verification.credentialDeviceType,
        backed_up: verification.credentialBackedUp
      });
    }
  }
}
```

**優點:**
- 安全性極高
- 用戶體驗佳
- 標準化協議
- 防釣魚

**缺點:**
- 設備支援限制
- 實現複雜度高

### 2.2 數據加密解決方案

#### 2.2.1 端到端加密 (E2EE)

**Signal Protocol (推薦)**
```typescript
// 使用 libsignal-protocol-typescript
import { SignalProtocolStore, SessionBuilder, MessageCipher } from '@privacyresearch/libsignal-protocol-typescript';

class E2EEService {
  private store: SignalProtocolStore;
  
  async initializeSession(localUserId: string, remoteUserId: string): Promise<void> {
    const remoteIdentityKey = await this.getRemoteIdentityKey(remoteUserId);
    const remotePreKey = await this.getRemotePreKey(remoteUserId);
    const remoteSignedPreKey = await this.getRemoteSignedPreKey(remoteUserId);
    
    const sessionBuilder = new SessionBuilder(this.store, remoteUserId, 1);
    
    await sessionBuilder.processPreKey({
      registrationId: remotePreKey.registrationId,
      identityKey: remoteIdentityKey,
      signedPreKey: {
        keyId: remoteSignedPreKey.keyId,
        publicKey: remoteSignedPreKey.publicKey,
        signature: remoteSignedPreKey.signature
      },
      preKey: {
        keyId: remotePreKey.keyId,
        publicKey: remotePreKey.publicKey
      }
    });
  }
  
  async encryptMessage(recipientId: string, message: string): Promise<EncryptedMessage> {
    const cipher = new MessageCipher(this.store, recipientId, 1);
    const ciphertext = await cipher.encrypt(Buffer.from(message, 'utf8'));
    
    return {
      type: ciphertext.type,
      body: ciphertext.body,
      registrationId: ciphertext.registrationId
    };
  }
  
  async decryptMessage(senderId: string, encryptedMessage: EncryptedMessage): Promise<string> {
    const cipher = new MessageCipher(this.store, senderId, 1);
    const plaintext = await cipher.decryptFromSignal(encryptedMessage);
    
    return plaintext.toString('utf8');
  }
}
```

**優點:**
- 前向安全性
- 後向安全性
- 經過實戰驗證
- 開源實現

**缺點:**
- 實現複雜
- 性能開銷
- 密鑰管理複雜

#### 2.2.2 數據庫加密

**字段級加密 (推薦)**
```typescript
// AES-256-GCM 加密服務
import crypto from 'crypto';

class FieldEncryptionService {
  private algorithm = 'aes-256-gcm';
  private keyDerivationIterations = 100000;
  
  async encrypt(plaintext: string, masterKey: string): Promise<EncryptedData> {
    // 生成隨機 salt 和 IV
    const salt = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    
    // 派生加密密鑰
    const key = crypto.pbkdf2Sync(masterKey, salt, this.keyDerivationIterations, 32, 'sha256');
    
    // 加密數據
    const cipher = crypto.createCipher(this.algorithm, key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      salt: salt.toString('hex'),
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }
  
  async decrypt(encryptedData: EncryptedData, masterKey: string): Promise<string> {
    const salt = Buffer.from(encryptedData.salt, 'hex');
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const authTag = Buffer.from(encryptedData.authTag, 'hex');
    
    // 派生解密密鑰
    const key = crypto.pbkdf2Sync(masterKey, salt, this.keyDerivationIterations, 32, 'sha256');
    
    // 解密數據
    const decipher = crypto.createDecipher(this.algorithm, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

// 敏感字段自動加密
class EncryptedUserRepository {
  async createUser(userData: CreateUserInput): Promise<User> {
    const encryptedData = {
      ...userData,
      email: await this.encryptionService.encrypt(userData.email, this.getEncryptionKey()),
      phone: userData.phone ? await this.encryptionService.encrypt(userData.phone, this.getEncryptionKey()) : null,
      real_name: userData.real_name ? await this.encryptionService.encrypt(userData.real_name, this.getEncryptionKey()) : null
    };
    
    return this.userRepository.create(encryptedData);
  }
  
  async findByEmail(email: string): Promise<User | null> {
    // 注意：加密後無法直接查詢，需要建立雜湊索引
    const emailHash = this.hashService.hash(email);
    return this.userRepository.findOne({ email_hash: emailHash });
  }
}
```

### 2.3 威脅檢測系統

#### 2.3.1 異常行為檢測

**基於機器學習的檢測 (推薦)**
```typescript
// 異常檢測服務
class AnomalyDetectionService {
  private model: any; // TensorFlow.js 模型
  
  async detectAnomalousLogin(loginAttempt: LoginAttempt): Promise<AnomalyResult> {
    const features = this.extractLoginFeatures(loginAttempt);
    const anomalyScore = await this.model.predict(features);
    
    return {
      isAnomalous: anomalyScore > 0.7,
      score: anomalyScore,
      reasons: this.explainAnomaly(features, anomalyScore),
      recommendedAction: this.getRecommendedAction(anomalyScore)
    };
  }
  
  private extractLoginFeatures(attempt: LoginAttempt): number[] {
    const user = attempt.user;
    const currentTime = new Date(attempt.timestamp);
    
    return [
      this.normalizeTimeOfDay(currentTime.getHours()),
      this.normalizeDayOfWeek(currentTime.getDay()),
      this.calculateLocationDeviation(attempt.location, user.usualLocations),
      this.calculateDeviceFingerprint(attempt.device),
      this.calculateVelocity(attempt.location, user.lastLocation, attempt.timestamp),
      this.getBehaviorPattern(user.id, 'login_frequency'),
      this.getFailedAttemptCount(user.id, '1h')
    ];
  }
  
  async detectSuspiciousActivity(userId: string, activity: UserActivity): Promise<SuspiciousActivityResult> {
    const userProfile = await this.getUserBehaviorProfile(userId);
    const activityFeatures = this.extractActivityFeatures(activity, userProfile);
    
    const suspiciousScore = await this.evaluateActivity(activityFeatures);
    
    if (suspiciousScore > 0.8) {
      await this.triggerSecurityAlert(userId, activity, suspiciousScore);
    }
    
    return {
      isSuspicious: suspiciousScore > 0.6,
      score: suspiciousScore,
      riskLevel: this.calculateRiskLevel(suspiciousScore)
    };
  }
}
```

#### 2.3.2 惡意用戶識別

**多維度評分系統**
```typescript
class MaliciousUserDetectionService {
  async evaluateUser(userId: string): Promise<UserRiskAssessment> {
    const [profileRisk, behaviorRisk, networkRisk, contentRisk] = await Promise.all([
      this.evaluateProfileRisk(userId),
      this.evaluateBehaviorRisk(userId),
      this.evaluateNetworkRisk(userId),
      this.evaluateContentRisk(userId)
    ]);
    
    const overallRisk = this.calculateOverallRisk({
      profile: profileRisk,
      behavior: behaviorRisk,
      network: networkRisk,
      content: contentRisk
    });
    
    return {
      userId,
      riskScore: overallRisk.score,
      riskLevel: overallRisk.level,
      factors: overallRisk.factors,
      recommendedActions: this.getRecommendedActions(overallRisk)
    };
  }
  
  private async evaluateProfileRisk(userId: string): Promise<RiskFactor> {
    const user = await this.userService.getUser(userId);
    const profile = await this.userService.getUserProfile(userId);
    
    let riskScore = 0;
    const factors = [];
    
    // 檢查資料完整性
    if (!profile.avatar_url) {
      riskScore += 0.1;
      factors.push('缺少頭像');
    }
    
    if (!profile.bio || profile.bio.length < 10) {
      riskScore += 0.1;
      factors.push('個人簡介過短或缺失');
    }
    
    // 檢查註冊時間
    const accountAge = Date.now() - user.created_at.getTime();
    if (accountAge < 24 * 60 * 60 * 1000) { // 24小時內
      riskScore += 0.3;
      factors.push('新註冊帳號');
    }
    
    // 檢查驗證狀態
    if (!user.email_verified) {
      riskScore += 0.2;
      factors.push('郵箱未驗證');
    }
    
    return { score: Math.min(riskScore, 1), factors };
  }
  
  private async evaluateBehaviorRisk(userId: string): Promise<RiskFactor> {
    const activities = await this.getRecentActivities(userId, '7d');
    
    let riskScore = 0;
    const factors = [];
    
    // 檢查活動頻率
    const activityRate = activities.length / 7; // 每日平均活動
    if (activityRate > 100) {
      riskScore += 0.3;
      factors.push('異常高活動頻率');
    }
    
    // 檢查互動模式
    const likeRate = activities.filter(a => a.type === 'like').length / activities.length;
    if (likeRate > 0.8) {
      riskScore += 0.2;
      factors.push('過度點讚行為');
    }
    
    // 檢查訊息模式
    const messages = activities.filter(a => a.type === 'message');
    const duplicateMessages = this.findDuplicateMessages(messages);
    if (duplicateMessages.length > 5) {
      riskScore += 0.4;
      factors.push('重複訊息發送');
    }
    
    return { score: Math.min(riskScore, 1), factors };
  }
}
```

### 2.4 隱私保護技術

#### 2.4.1 數據匿名化

**差分隱私 (Differential Privacy)**
```typescript
class DifferentialPrivacyService {
  private epsilon = 1.0; // 隱私預算
  
  async anonymizeUserStats(userStats: UserStats[]): Promise<AnonymizedStats> {
    // 添加拉普拉斯噪聲
    const noisyStats = userStats.map(stat => ({
      ...stat,
      value: stat.value + this.generateLaplaceNoise(this.epsilon)
    }));
    
    return {
      stats: noisyStats,
      epsilon: this.epsilon,
      timestamp: new Date()
    };
  }
  
  private generateLaplaceNoise(epsilon: number): number {
    // 生成拉普拉斯分佈噪聲
    const u = Math.random() - 0.5;
    const scale = 1 / epsilon;
    return -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
  }
  
  async generateSyntheticData(originalData: UserData[], privacyBudget: number): Promise<SyntheticData[]> {
    // 使用生成對抗網絡 (GAN) 生成合成數據
    const generator = await this.loadSyntheticDataGenerator();
    
    // 添加差分隱私保護
    const noisyData = this.addDifferentialPrivacyNoise(originalData, privacyBudget);
    
    // 生成合成數據
    const syntheticData = await generator.generate(noisyData);
    
    return syntheticData;
  }
}
```

#### 2.4.2 零知識證明

**年齡驗證（不洩露具體年齡）**
```typescript
// 使用 zk-SNARKs 進行年齡驗證
class ZeroKnowledgeAgeVerification {
  async generateAgeProof(birthDate: Date, minimumAge: number): Promise<AgeProof> {
    const currentDate = new Date();
    const age = this.calculateAge(birthDate, currentDate);
    
    // 生成零知識證明：證明年齡 >= minimumAge，但不洩露具體年齡
    const circuit = await this.loadAgeVerificationCircuit();
    const witness = {
      birthYear: birthDate.getFullYear(),
      birthMonth: birthDate.getMonth() + 1,
      birthDay: birthDate.getDate(),
      currentYear: currentDate.getFullYear(),
      currentMonth: currentDate.getMonth() + 1,
      currentDay: currentDate.getDate(),
      minimumAge
    };
    
    const proof = await circuit.generateProof(witness);
    
    return {
      proof: proof.proof,
      publicSignals: proof.publicSignals,
      isValid: age >= minimumAge
    };
  }
  
  async verifyAgeProof(proof: AgeProof, minimumAge: number): Promise<boolean> {
    const circuit = await this.loadAgeVerificationCircuit();
    return circuit.verifyProof(proof.proof, proof.publicSignals);
  }
}
```

## 3. 系統架構設計

### 3.1 安全架構圖
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   WAF/CDN       │    │   負載均衡器    │    │   API Gateway   │
│  (CloudFlare)   │───►│   (Nginx)       │───►│   (Express)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   DDoS 防護     │    │   SSL 終端      │    │   認證服務      │
│   Bot 檢測      │    │   速率限制      │    │   (JWT + MFA)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │   授權服務      │
                                               │   (RBAC)        │
                                               └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   威脅檢測      │    │   審計日誌      │    │   業務服務      │
│   (AI/ML)       │◄──►│   (ELK Stack)   │◄──►│   (微服務)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   安全監控      │    │   合規報告      │    │   加密存儲      │
│   (SIEM)        │    │   (GDPR)        │    │   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 3.2 安全數據模型
```sql
-- 用戶安全設定表
CREATE TABLE user_security_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret TEXT, -- 加密存儲
    backup_codes TEXT[], -- 加密存儲
    trusted_devices JSONB DEFAULT '[]',
    login_notifications BOOLEAN DEFAULT TRUE,
    privacy_level INTEGER DEFAULT 2, -- 1: 低, 2: 中, 3: 高
    data_retention_days INTEGER DEFAULT 365,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 安全事件日誌表
CREATE TABLE security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    event_type VARCHAR(50), -- 'login', 'logout', 'password_change', 'suspicious_activity'
    severity VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
    source_ip INET,
    user_agent TEXT,
    location JSONB,
    device_fingerprint TEXT,
    event_data JSONB,
    risk_score FLOAT,
    is_blocked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 威脅檢測規則表
CREATE TABLE threat_detection_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR(100),
    rule_type VARCHAR(50), -- 'anomaly', 'signature', 'behavioral'
    conditions JSONB,
    actions JSONB,
    severity VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 用戶風險評估表
CREATE TABLE user_risk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    risk_score FLOAT,
    risk_level VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
    risk_factors JSONB,
    assessment_date TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    assessor_type VARCHAR(20) -- 'automated', 'manual'
);

-- 數據存取日誌表
CREATE TABLE data_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    accessed_user_id UUID REFERENCES users(id),
    data_type VARCHAR(50), -- 'profile', 'messages', 'location'
    access_type VARCHAR(20), -- 'read', 'write', 'delete'
    purpose VARCHAR(100),
    legal_basis VARCHAR(50), -- GDPR 法律依據
    source_ip INET,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_security_events_user_id ON security_events (user_id);
CREATE INDEX idx_security_events_type ON security_events (event_type);
CREATE INDEX idx_security_events_severity ON security_events (severity);
CREATE INDEX idx_security_events_created_at ON security_events (created_at DESC);
CREATE INDEX idx_user_risk_assessments_user_id ON user_risk_assessments (user_id);
CREATE INDEX idx_data_access_logs_user_id ON data_access_logs (user_id);
CREATE INDEX idx_data_access_logs_accessed_user_id ON data_access_logs (accessed_user_id);
```

## 4. 核心安全服務實現

### 4.1 安全監控服務
```typescript
class SecurityMonitoringService {
  private eventBus: EventEmitter;
  private riskThresholds = {
    low: 0.3,
    medium: 0.6,
    high: 0.8,
    critical: 0.9
  };
  
  async monitorUserActivity(userId: string, activity: UserActivity): Promise<void> {
    // 記錄活動
    await this.logSecurityEvent({
      user_id: userId,
      event_type: activity.type,
      event_data: activity.data,
      source_ip: activity.sourceIP,
      user_agent: activity.userAgent
    });
    
    // 異常檢測
    const anomalyResult = await this.anomalyDetectionService.detectAnomalousActivity(userId, activity);
    
    if (anomalyResult.isAnomalous) {
      await this.handleAnomalousActivity(userId, activity, anomalyResult);
    }
    
    // 風險評估
    const riskAssessment = await this.assessUserRisk(userId);
    
    if (riskAssessment.riskScore > this.riskThresholds.high) {
      await this.triggerHighRiskAlert(userId, riskAssessment);
    }
  }
  
  private async handleAnomalousActivity(userId: string, activity: UserActivity, anomaly: AnomalyResult): Promise<void> {
    const securityEvent = {
      user_id: userId,
      event_type: 'anomalous_activity',
      severity: this.mapAnomalyScoreToSeverity(anomaly.score),
      event_data: {
        activity,
        anomaly_score: anomaly.score,
        reasons: anomaly.reasons
      },
      risk_score: anomaly.score
    };
    
    await this.logSecurityEvent(securityEvent);
    
    // 根據嚴重程度採取行動
    if (anomaly.score > 0.9) {
      await this.blockUser(userId, '疑似惡意活動');
    } else if (anomaly.score > 0.7) {
      await this.requireAdditionalVerification(userId);
    } else if (anomaly.score > 0.5) {
      await this.sendSecurityAlert(userId);
    }
  }
  
  async generateSecurityReport(timeRange: TimeRange): Promise<SecurityReport> {
    const [events, riskAssessments, threats] = await Promise.all([
      this.getSecurityEvents(timeRange),
      this.getRiskAssessments(timeRange),
      this.getDetectedThreats(timeRange)
    ]);
    
    return {
      period: timeRange,
      summary: {
        total_events: events.length,
        high_risk_users: riskAssessments.filter(r => r.risk_level === 'high').length,
        blocked_threats: threats.filter(t => t.is_blocked).length,
        false_positives: threats.filter(t => t.is_false_positive).length
      },
      trends: this.analyzeTrends(events),
      recommendations: this.generateRecommendations(events, riskAssessments, threats)
    };
  }
}
```

### 4.2 合規性管理服務
```typescript
class ComplianceService {
  // GDPR 數據處理記錄
  async recordDataProcessing(processing: DataProcessingRecord): Promise<void> {
    await this.dataProcessingRepository.create({
      user_id: processing.userId,
      data_type: processing.dataType,
      processing_purpose: processing.purpose,
      legal_basis: processing.legalBasis,
      retention_period: processing.retentionPeriod,
      processor_id: processing.processorId,
      created_at: new Date()
    });
  }
  
  // 數據主體權利請求處理
  async handleDataSubjectRequest(request: DataSubjectRequest): Promise<DataSubjectResponse> {
    switch (request.type) {
      case 'access':
        return this.handleAccessRequest(request);
      case 'rectification':
        return this.handleRectificationRequest(request);
      case 'erasure':
        return this.handleErasureRequest(request);
      case 'portability':
        return this.handlePortabilityRequest(request);
      case 'restriction':
        return this.handleRestrictionRequest(request);
      case 'objection':
        return this.handleObjectionRequest(request);
      default:
        throw new Error('不支援的請求類型');
    }
  }
  
  private async handleAccessRequest(request: DataSubjectRequest): Promise<DataSubjectResponse> {
    const userData = await this.collectUserData(request.userId);
    
    // 記錄存取請求
    await this.logDataAccess({
      user_id: request.userId,
      accessed_user_id: request.userId,
      data_type: 'all',
      access_type: 'read',
      purpose: 'data_subject_access_request',
      legal_basis: 'article_15_gdpr'
    });
    
    return {
      request_id: request.id,
      status: 'completed',
      data: this.anonymizeExportData(userData),
      format: 'json',
      completed_at: new Date()
    };
  }
  
  private async handleErasureRequest(request: DataSubjectRequest): Promise<DataSubjectResponse> {
    // 檢查是否有法律義務保留數據
    const retentionRequirements = await this.checkRetentionRequirements(request.userId);
    
    if (retentionRequirements.mustRetain) {
      return {
        request_id: request.id,
        status: 'rejected',
        reason: retentionRequirements.reason,
        completed_at: new Date()
      };
    }
    
    // 執行數據刪除
    await this.eraseUserData(request.userId);
    
    return {
      request_id: request.id,
      status: 'completed',
      completed_at: new Date()
    };
  }
  
  // 數據保留政策執行
  async enforceDataRetentionPolicy(): Promise<void> {
    const retentionPolicies = await this.getDataRetentionPolicies();
    
    for (const policy of retentionPolicies) {
      const expiredData = await this.findExpiredData(policy);
      
      for (const data of expiredData) {
        if (policy.action === 'delete') {
          await this.deleteExpiredData(data);
        } else if (policy.action === 'anonymize') {
          await this.anonymizeExpiredData(data);
        } else if (policy.action === 'archive') {
          await this.archiveExpiredData(data);
        }
      }
    }
  }
}
```

### 4.3 事件響應服務
```typescript
class IncidentResponseService {
  private alertChannels = {
    email: this.emailService,
    slack: this.slackService,
    sms: this.smsService,
    webhook: this.webhookService
  };
  
  async handleSecurityIncident(incident: SecurityIncident): Promise<void> {
    // 分類事件嚴重程度
    const severity = this.classifyIncidentSeverity(incident);
    
    // 創建事件記錄
    const incidentRecord = await this.createIncidentRecord(incident, severity);
    
    // 立即響應
    await this.executeImmediateResponse(incident, severity);
    
    // 通知相關人員
    await this.notifyIncidentTeam(incidentRecord);
    
    // 啟動調查流程
    await this.initiateInvestigation(incidentRecord);
  }
  
  private async executeImmediateResponse(incident: SecurityIncident, severity: IncidentSeverity): Promise<void> {
    switch (severity) {
      case 'critical':
        // 立即阻斷威脅
        await this.blockThreatSource(incident.source);
        // 隔離受影響系統
        await this.isolateAffectedSystems(incident.affectedSystems);
        // 啟動災難恢復
        await this.activateDisasterRecovery();
        break;
        
      case 'high':
        // 增強監控
        await this.enhanceMonitoring(incident.indicators);
        // 限制存取
        await this.restrictAccess(incident.affectedUsers);
        break;
        
      case 'medium':
        // 記錄和監控
        await this.increaseLogging(incident.affectedSystems);
        // 通知用戶
        await this.notifyAffectedUsers(incident.affectedUsers);
        break;
        
      case 'low':
        // 持續監控
        await this.monitorIndicators(incident.indicators);
        break;
    }
  }
  
  async generateIncidentReport(incidentId: string): Promise<IncidentReport> {
    const incident = await this.getIncident(incidentId);
    const timeline = await this.getIncidentTimeline(incidentId);
    const impact = await this.assessIncidentImpact(incidentId);
    const rootCause = await this.performRootCauseAnalysis(incidentId);
    
    return {
      incident_id: incidentId,
      summary: incident.summary,
      timeline,
      impact,
      root_cause: rootCause,
      lessons_learned: await this.extractLessonsLearned(incidentId),
      recommendations: await this.generateRecommendations(incidentId),
      created_at: new Date()
    };
  }
}
```

## 5. 實施計劃

### 5.1 第一階段（基礎安全）- 4週
- [ ] 多因素認證 (TOTP)
- [ ] 基礎加密（傳輸和存儲）
- [ ] 安全日誌記錄
- [ ] 基礎威脅檢測
- [ ] HTTPS 強制

### 5.2 第二階段（進階安全）- 6週
- [ ] 異常行為檢測
- [ ] 端到端加密（聊天）
- [ ] 生物識別認證 (WebAuthn)
- [ ] 安全監控儀表板
- [ ] 事件響應流程

### 5.3 第三階段（企業級安全）- 8週
- [ ] AI 威脅檢測
- [ ] 零信任架構
- [ ] 數據匿名化
- [ ] 合規性自動化
- [ ] 安全審計工具

### 5.4 第四階段（持續改進）- 持續
- [ ] 威脅情報整合
- [ ] 安全自動化
- [ ] 紅隊演練
- [ ] 安全培訓
- [ ] 第三方安全評估

## 6. 技術建議

### 6.1 推薦技術棧
- **身份認證**: Passport.js + speakeasy + WebAuthn
- **加密**: Node.js crypto + libsignal-protocol
- **威脅檢測**: TensorFlow.js + 自建規則引擎
- **監控**: ELK Stack + Prometheus + Grafana
- **合規**: 自建 GDPR 工具

### 6.2 成本估算
- **安全監控工具**: $200-400/月
- **威脅檢測服務**: $100-300/月
- **合規工具**: $50-150/月
- **安全審計**: $500-1000/季
- **總成本**: $350-850/月 + $2000-4000/年

### 6.3 安全指標
- **事件響應時間**: < 15分鐘
- **威脅檢測準確率**: > 95%
- **誤報率**: < 5%
- **合規達成率**: 100%
- **安全培訓覆蓋率**: 100%

---

**文檔版本**: v1.0  
**最後更新**: 2025-01-02  
**狀態**: ✅ 規劃完成，待實施