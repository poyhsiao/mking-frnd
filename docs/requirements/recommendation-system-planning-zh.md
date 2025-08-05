# MKing Friend - 推薦系統與機器學習規劃

## 1. 功能概述

### 1.1 核心推薦功能
- **用戶匹配推薦**: 基於多維度特徵的智能配對
- **個性化內容推薦**: 動態推薦相關用戶和內容
- **實時推薦**: 基於用戶行為的即時推薦調整
- **多樣性保證**: 避免推薦結果過於單一
- **冷啟動處理**: 新用戶的初始推薦策略

### 1.2 推薦維度
- **基礎資訊**: 年齡、性別、地理位置、職業
- **興趣愛好**: 標籤、喜好、活動偏好
- **行為數據**: 瀏覽、點讚、聊天、互動模式
- **社交網絡**: 共同朋友、社群參與
- **時間模式**: 活躍時間、使用習慣

## 2. 技術方案比較

### 2.1 推薦算法選擇

#### 2.1.1 協同過濾 (Collaborative Filtering)
**優點:**
- 實現相對簡單
- 不需要內容特徵工程
- 能發現意外的推薦

**缺點:**
- 冷啟動問題嚴重
- 稀疏性問題
- 計算複雜度高

**適用場景:**
- 用戶行為數據豐富時
- 作為混合推薦的一部分

#### 2.1.2 內容基礎推薦 (Content-Based)
**優點:**
- 解決冷啟動問題
- 推薦結果可解釋
- 不依賴其他用戶數據

**缺點:**
- 推薦多樣性較低
- 需要豐富的內容特徵
- 難以發現新興趣

**適用場景:**
- 新用戶推薦
- 基於用戶資料的初始匹配

#### 2.1.3 混合推薦系統 (推薦)
**組合策略:**
- **加權混合**: 不同算法結果加權組合
- **切換混合**: 根據情況選擇不同算法
- **分層混合**: 不同層級使用不同算法

### 2.2 機器學習框架選擇

#### 2.2.1 TensorFlow.js (推薦)
**優點:**
- 可在 Node.js 環境運行
- 支援前端推理
- Google 維護，生態完整
- 支援模型轉換和部署

**缺點:**
- 學習曲線較陡
- 資源消耗較大

**實現範例:**
```javascript
import * as tf from '@tensorflow/tfjs-node';

// 用戶特徵嵌入模型
class UserEmbeddingModel {
  constructor() {
    this.model = this.buildModel();
  }
  
  buildModel() {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [50], units: 128, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dense({ units: 32, activation: 'sigmoid' })
      ]
    });
    
    model.compile({
      optimizer: 'adam',
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });
    
    return model;
  }
}
```

#### 2.2.2 Scikit-learn + Python 微服務
**優點:**
- 豐富的機器學習算法
- 文檔完整，社群活躍
- 快速原型開發

**缺點:**
- 需要額外的 Python 服務
- 跨語言通信開銷

#### 2.2.3 自建輕量級推薦引擎
**優點:**
- 完全可控
- 性能優化空間大
- 無外部依賴

**缺點:**
- 開發成本高
- 需要深度機器學習知識

### 2.3 向量資料庫選擇

#### 2.3.1 Qdrant (推薦)
**優點:**
- 開源且可自建
- 高性能向量搜索
- 支援過濾和混合查詢
- Rust 編寫，性能優秀

**缺點:**
- 相對較新的項目
- 社群規模較小

**實現範例:**
```javascript
import { QdrantClient } from '@qdrant/js-client-rest';

class VectorSearchService {
  constructor() {
    this.client = new QdrantClient({ host: 'localhost', port: 6333 });
  }
  
  async searchSimilarUsers(userVector, limit = 10) {
    const searchResult = await this.client.search('user_embeddings', {
      vector: userVector,
      limit,
      with_payload: true,
      filter: {
        must: [
          { key: 'is_active', match: { value: true } }
        ]
      }
    });
    
    return searchResult;
  }
}
```

#### 2.3.2 PostgreSQL + pgvector
**優點:**
- 與現有資料庫整合
- 無需額外服務
- 支援 SQL 查詢

**缺點:**
- 性能不如專用向量資料庫
- 向量維度限制

#### 2.3.3 Redis + RedisSearch
**優點:**
- 與現有 Redis 整合
- 內存存儲，速度快
- 支援混合查詢

**缺點:**
- 內存成本高
- 向量搜索功能相對簡單

## 3. 系統架構設計

### 3.1 整體架構
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   用戶行為      │    │   特徵工程      │    │   推薦模型      │
│   收集服務      │───►│   服務          │───►│   訓練服務      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   行為資料庫    │    │   特徵存儲      │    │   模型存儲      │
│  (PostgreSQL)   │    │   (Redis)       │    │  (File System)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   推薦服務API   │
                       │   (Node.js)     │
                       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   向量資料庫    │
                       │   (Qdrant)      │
                       └─────────────────┘
```

### 3.2 資料模型設計
```sql
-- 用戶特徵表
CREATE TABLE user_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    feature_vector JSONB, -- 特徵向量
    interests TEXT[], -- 興趣標籤
    personality_traits JSONB, -- 性格特徵
    activity_pattern JSONB, -- 活動模式
    preference_settings JSONB, -- 偏好設定
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 用戶行為記錄表
CREATE TABLE user_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    target_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    interaction_type VARCHAR(50), -- 'view', 'like', 'pass', 'message', 'match'
    interaction_value FLOAT, -- 互動強度 (0-1)
    context_data JSONB, -- 上下文資訊
    created_at TIMESTAMP DEFAULT NOW()
);

-- 推薦結果快取表
CREATE TABLE recommendation_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    recommended_users JSONB, -- 推薦用戶列表
    recommendation_scores JSONB, -- 推薦分數
    algorithm_version VARCHAR(20),
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_user_features_user_id ON user_features (user_id);
CREATE INDEX idx_user_interactions_user_id ON user_interactions (user_id);
CREATE INDEX idx_user_interactions_target_user_id ON user_interactions (target_user_id);
CREATE INDEX idx_user_interactions_type ON user_interactions (interaction_type);
CREATE INDEX idx_recommendation_cache_user_id ON recommendation_cache (user_id);
CREATE INDEX idx_recommendation_cache_expires ON recommendation_cache (expires_at);
```

### 3.3 推薦服務 API 設計
```typescript
// 推薦服務接口
interface RecommendationService {
  // 獲取用戶推薦
  getRecommendations(userId: string, params: {
    limit: number;
    algorithm?: 'collaborative' | 'content' | 'hybrid';
    filters?: RecommendationFilters;
    refresh?: boolean;
  }): Promise<RecommendationResult[]>;
  
  // 記錄用戶互動
  recordInteraction(interaction: {
    userId: string;
    targetUserId: string;
    type: InteractionType;
    value: number;
    context?: any;
  }): Promise<void>;
  
  // 更新用戶特徵
  updateUserFeatures(userId: string, features: {
    interests?: string[];
    personality?: PersonalityTraits;
    preferences?: UserPreferences;
  }): Promise<void>;
  
  // 獲取推薦解釋
  getRecommendationExplanation(userId: string, targetUserId: string): Promise<{
    reasons: string[];
    confidence: number;
    factors: RecommendationFactor[];
  }>;
}

// 推薦結果類型
interface RecommendationResult {
  userId: string;
  score: number;
  reasons: string[];
  confidence: number;
  metadata: {
    algorithm: string;
    timestamp: Date;
    factors: RecommendationFactor[];
  };
}
```

## 4. 推薦算法實現

### 4.1 混合推薦系統
```typescript
class HybridRecommendationEngine {
  private contentBasedWeight = 0.4;
  private collaborativeWeight = 0.3;
  private locationWeight = 0.2;
  private behaviorWeight = 0.1;
  
  async generateRecommendations(userId: string, limit: number): Promise<RecommendationResult[]> {
    // 並行執行不同推薦算法
    const [contentBased, collaborative, locationBased, behaviorBased] = await Promise.all([
      this.getContentBasedRecommendations(userId, limit * 2),
      this.getCollaborativeRecommendations(userId, limit * 2),
      this.getLocationBasedRecommendations(userId, limit * 2),
      this.getBehaviorBasedRecommendations(userId, limit * 2)
    ]);
    
    // 合併和重新排序
    const combinedResults = this.combineRecommendations([
      { results: contentBased, weight: this.contentBasedWeight },
      { results: collaborative, weight: this.collaborativeWeight },
      { results: locationBased, weight: this.locationWeight },
      { results: behaviorBased, weight: this.behaviorWeight }
    ]);
    
    // 多樣性處理
    const diversifiedResults = this.ensureDiversity(combinedResults);
    
    return diversifiedResults.slice(0, limit);
  }
  
  private combineRecommendations(algorithmResults: AlgorithmResult[]): RecommendationResult[] {
    const userScores = new Map<string, number>();
    const userReasons = new Map<string, string[]>();
    
    algorithmResults.forEach(({ results, weight }) => {
      results.forEach(result => {
        const currentScore = userScores.get(result.userId) || 0;
        const currentReasons = userReasons.get(result.userId) || [];
        
        userScores.set(result.userId, currentScore + (result.score * weight));
        userReasons.set(result.userId, [...currentReasons, ...result.reasons]);
      });
    });
    
    return Array.from(userScores.entries())
      .map(([userId, score]) => ({
        userId,
        score,
        reasons: userReasons.get(userId) || [],
        confidence: this.calculateConfidence(score),
        metadata: {
          algorithm: 'hybrid',
          timestamp: new Date(),
          factors: this.extractFactors(userId)
        }
      }))
      .sort((a, b) => b.score - a.score);
  }
}
```

### 4.2 特徵工程
```typescript
class FeatureEngineering {
  // 用戶特徵向量生成
  async generateUserVector(userId: string): Promise<number[]> {
    const user = await this.getUserProfile(userId);
    const interactions = await this.getUserInteractions(userId);
    const preferences = await this.getUserPreferences(userId);
    
    const features = [
      ...this.encodeBasicInfo(user),
      ...this.encodeInterests(user.interests),
      ...this.encodeInteractionPattern(interactions),
      ...this.encodePreferences(preferences),
      ...this.encodeTemporalFeatures(interactions)
    ];
    
    return this.normalizeVector(features);
  }
  
  private encodeBasicInfo(user: UserProfile): number[] {
    return [
      user.age / 100, // 年齡正規化
      user.gender === 'male' ? 1 : 0, // 性別編碼
      user.education_level / 5, // 教育程度正規化
      user.occupation_category / 10 // 職業類別正規化
    ];
  }
  
  private encodeInterests(interests: string[]): number[] {
    const interestCategories = [
      'sports', 'music', 'travel', 'food', 'technology',
      'art', 'reading', 'movies', 'gaming', 'fitness'
    ];
    
    return interestCategories.map(category => 
      interests.includes(category) ? 1 : 0
    );
  }
  
  private encodeInteractionPattern(interactions: UserInteraction[]): number[] {
    const totalInteractions = interactions.length;
    const likeRate = interactions.filter(i => i.type === 'like').length / totalInteractions;
    const messageRate = interactions.filter(i => i.type === 'message').length / totalInteractions;
    const avgResponseTime = this.calculateAvgResponseTime(interactions);
    
    return [likeRate, messageRate, avgResponseTime / 3600]; // 小時正規化
  }
}
```

### 4.3 冷啟動處理
```typescript
class ColdStartHandler {
  // 新用戶推薦策略
  async handleNewUser(userId: string): Promise<RecommendationResult[]> {
    const user = await this.getUserProfile(userId);
    
    // 基於人口統計學的推薦
    const demographicRecommendations = await this.getDemographicBasedRecommendations(user);
    
    // 基於地理位置的推薦
    const locationRecommendations = await this.getLocationBasedRecommendations(user);
    
    // 熱門用戶推薦
    const popularRecommendations = await this.getPopularUserRecommendations();
    
    // 合併推薦結果
    return this.combineNewUserRecommendations([
      { results: demographicRecommendations, weight: 0.5 },
      { results: locationRecommendations, weight: 0.3 },
      { results: popularRecommendations, weight: 0.2 }
    ]);
  }
  
  // 逐步學習用戶偏好
  async adaptiveRecommendation(userId: string, interactionHistory: UserInteraction[]): Promise<void> {
    if (interactionHistory.length < 5) {
      // 探索階段：提供多樣化推薦
      await this.enableExplorationMode(userId);
    } else if (interactionHistory.length < 20) {
      // 學習階段：平衡探索和利用
      await this.enableLearningMode(userId);
    } else {
      // 穩定階段：主要基於學習到的偏好
      await this.enableExploitationMode(userId);
    }
  }
}
```

## 5. 性能優化策略

### 5.1 快取策略
```typescript
class RecommendationCache {
  private redis: Redis;
  private cacheExpiry = 3600; // 1小時
  
  async getCachedRecommendations(userId: string): Promise<RecommendationResult[] | null> {
    const cacheKey = `recommendations:${userId}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    return null;
  }
  
  async setCachedRecommendations(userId: string, recommendations: RecommendationResult[]): Promise<void> {
    const cacheKey = `recommendations:${userId}`;
    await this.redis.setex(cacheKey, this.cacheExpiry, JSON.stringify(recommendations));
  }
  
  // 智能快取失效
  async invalidateUserCache(userId: string, reason: 'interaction' | 'profile_update' | 'preference_change'): Promise<void> {
    const cacheKey = `recommendations:${userId}`;
    await this.redis.del(cacheKey);
    
    // 根據失效原因決定是否需要重新計算
    if (reason === 'interaction') {
      // 互動後立即重新計算部分推薦
      this.schedulePartialRecomputation(userId);
    }
  }
}
```

### 5.2 批次處理
```typescript
class BatchRecommendationProcessor {
  // 批次更新用戶特徵
  async batchUpdateUserFeatures(): Promise<void> {
    const batchSize = 100;
    let offset = 0;
    
    while (true) {
      const users = await this.getUserBatch(offset, batchSize);
      if (users.length === 0) break;
      
      await Promise.all(users.map(user => 
        this.updateUserFeatureVector(user.id)
      ));
      
      offset += batchSize;
    }
  }
  
  // 批次重新訓練模型
  async batchRetrainModels(): Promise<void> {
    const interactionData = await this.getRecentInteractions();
    const userFeatures = await this.getAllUserFeatures();
    
    // 重新訓練協同過濾模型
    await this.retrainCollaborativeModel(interactionData);
    
    // 重新訓練內容推薦模型
    await this.retrainContentModel(userFeatures);
    
    // 更新模型版本
    await this.updateModelVersion();
  }
}
```

## 6. 評估與監控

### 6.1 推薦效果評估
```typescript
class RecommendationEvaluator {
  // A/B 測試框架
  async runABTest(testConfig: {
    name: string;
    algorithmA: string;
    algorithmB: string;
    userSegment: string;
    duration: number;
  }): Promise<ABTestResult> {
    const testUsers = await this.getTestUsers(testConfig.userSegment);
    const groupA = testUsers.slice(0, testUsers.length / 2);
    const groupB = testUsers.slice(testUsers.length / 2);
    
    // 為兩組用戶提供不同算法的推薦
    await this.assignAlgorithm(groupA, testConfig.algorithmA);
    await this.assignAlgorithm(groupB, testConfig.algorithmB);
    
    // 收集測試期間的指標
    const metricsA = await this.collectMetrics(groupA, testConfig.duration);
    const metricsB = await this.collectMetrics(groupB, testConfig.duration);
    
    return this.analyzeABTestResults(metricsA, metricsB);
  }
  
  // 推薦指標計算
  async calculateRecommendationMetrics(userId: string, timeRange: TimeRange): Promise<RecommendationMetrics> {
    const recommendations = await this.getRecommendationHistory(userId, timeRange);
    const interactions = await this.getUserInteractions(userId, timeRange);
    
    return {
      clickThroughRate: this.calculateCTR(recommendations, interactions),
      conversionRate: this.calculateConversionRate(recommendations, interactions),
      diversity: this.calculateDiversity(recommendations),
      novelty: this.calculateNovelty(recommendations, userId),
      coverage: this.calculateCoverage(recommendations),
      precision: this.calculatePrecision(recommendations, interactions),
      recall: this.calculateRecall(recommendations, interactions)
    };
  }
}
```

### 6.2 實時監控
```typescript
class RecommendationMonitor {
  // 推薦系統健康監控
  async monitorSystemHealth(): Promise<SystemHealthReport> {
    const metrics = await Promise.all([
      this.checkRecommendationLatency(),
      this.checkCacheHitRate(),
      this.checkModelAccuracy(),
      this.checkDataFreshness(),
      this.checkSystemLoad()
    ]);
    
    return {
      status: this.determineOverallStatus(metrics),
      metrics,
      alerts: this.generateAlerts(metrics),
      timestamp: new Date()
    };
  }
  
  // 異常檢測
  async detectAnomalies(): Promise<Anomaly[]> {
    const currentMetrics = await this.getCurrentMetrics();
    const historicalBaseline = await this.getHistoricalBaseline();
    
    const anomalies: Anomaly[] = [];
    
    // 檢測推薦點擊率異常下降
    if (currentMetrics.ctr < historicalBaseline.ctr * 0.8) {
      anomalies.push({
        type: 'CTR_DROP',
        severity: 'HIGH',
        description: '推薦點擊率異常下降',
        value: currentMetrics.ctr,
        baseline: historicalBaseline.ctr
      });
    }
    
    // 檢測推薦延遲異常
    if (currentMetrics.latency > historicalBaseline.latency * 2) {
      anomalies.push({
        type: 'HIGH_LATENCY',
        severity: 'MEDIUM',
        description: '推薦服務延遲過高',
        value: currentMetrics.latency,
        baseline: historicalBaseline.latency
      });
    }
    
    return anomalies;
  }
}
```

## 7. 實施計劃

### 7.1 第一階段（MVP）- 4週
- [ ] 基礎推薦服務架構
- [ ] 簡單的內容基礎推薦
- [ ] 用戶特徵收集和存儲
- [ ] 基礎的推薦 API
- [ ] 推薦結果快取

### 7.2 第二階段 - 6週
- [ ] 協同過濾算法實現
- [ ] 混合推薦系統
- [ ] 用戶行為追蹤
- [ ] 推薦效果評估
- [ ] A/B 測試框架

### 7.3 第三階段 - 8週
- [ ] 機器學習模型整合
- [ ] 向量資料庫部署
- [ ] 實時推薦更新
- [ ] 進階個性化
- [ ] 推薦解釋功能

### 7.4 第四階段 - 持續優化
- [ ] 深度學習模型
- [ ] 多臂老虎機算法
- [ ] 強化學習探索
- [ ] 跨平台推薦
- [ ] 推薦系統自動化

## 8. 技術建議

### 8.1 推薦技術棧
- **機器學習**: TensorFlow.js + Node.js
- **向量資料庫**: Qdrant (自建)
- **特徵存儲**: Redis + PostgreSQL
- **模型服務**: Node.js 微服務
- **監控**: Prometheus + Grafana

### 8.2 成本估算
- **Qdrant 服務器**: $100-200/月
- **機器學習計算**: $50-150/月
- **額外存儲**: $20-50/月
- **總成本**: $170-400/月

### 8.3 性能目標
- **推薦延遲**: < 100ms (P95)
- **快取命中率**: > 80%
- **推薦點擊率**: > 15%
- **模型準確率**: > 85%
- **系統可用性**: > 99.9%

---

**文檔版本**: v1.0  
**最後更新**: 2025-01-02  
**狀態**: ✅ 規劃完成，待實施