# 內容審核與管理規劃

## 1. 功能概述

### 1.1 服務範圍

**核心審核功能**
- 文本內容審核
- 圖片內容審核
- 視頻內容審核
- 音頻內容審核
- 用戶行為審核
- 垃圾信息過濾

**目標用戶**
- 平台管理員
- 內容審核員
- 社群管理員
- 一般用戶（舉報功能）

**服務目標**
- 維護社群環境
- 保護用戶安全
- 遵守法規要求
- 提升內容品質

### 1.2 審核類型

**自動審核**
- 關鍵詞過濾
- 機器學習分類
- 圖像識別
- 行為模式分析

**人工審核**
- 專業審核員
- 社群自治
- 用戶舉報
- 申訴處理

**混合審核**
- 自動預篩選
- 人工複審
- 分級處理
- 持續學習

## 2. 技術方案比較

### 2.1 內容審核技術比較

| 技術方案 | 優點 | 缺點 | 適用場景 | 成本 | 推薦度 |
|---------|------|------|----------|------|--------|
| 關鍵詞過濾 | 簡單快速，成本低 | 容易繞過，誤判率高 | 基礎過濾 | 極低 | ⭐⭐⭐ |
| 機器學習分類 | 準確率較高，可學習 | 需要訓練數據，計算成本 | 文本分類 | 中等 | ⭐⭐⭐⭐ |
| 深度學習 | 效果最佳，自動特徵 | 計算複雜，黑盒問題 | 複雜內容 | 高 | ⭐⭐⭐⭐ |
| 第三方API | 即用即得，專業效果 | 依賴外部，費用較高 | 快速部署 | 高 | ⭐⭐⭐ |
| 混合方案 | 綜合優勢，靈活調整 | 實現複雜，維護成本 | 生產環境 | 中高 | ⭐⭐⭐⭐⭐ |

**推薦方案**：混合審核系統（關鍵詞過濾 + 機器學習 + 人工審核）

### 2.2 開源內容審核工具

#### 2.2.1 文本內容審核

```python
# 基於機器學習的文本內容審核系統
import re
import jieba
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
import pickle
import json
from datetime import datetime
import logging

class TextModerationEngine:
    def __init__(self):
        self.keyword_filters = []
        self.ml_model = None
        self.vectorizer = None
        self.load_keyword_filters()
        self.setup_logging()
    
    def setup_logging(self):
        """設置日誌記錄"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('content_moderation.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def load_keyword_filters(self):
        """載入關鍵詞過濾器"""
        # 敏感詞庫
        sensitive_words = [
            # 政治敏感詞
            '政治敏感詞1', '政治敏感詞2',
            # 色情內容
            '色情詞1', '色情詞2',
            # 暴力內容
            '暴力詞1', '暴力詞2',
            # 仇恨言論
            '仇恨詞1', '仇恨詞2',
            # 垃圾廣告
            '廣告詞1', '廣告詞2'
        ]
        
        # 編譯正則表達式
        self.keyword_filters = [
            re.compile(word, re.IGNORECASE) for word in sensitive_words
        ]
    
    def keyword_filter(self, text):
        """關鍵詞過濾"""
        violations = []
        
        for pattern in self.keyword_filters:
            matches = pattern.findall(text)
            if matches:
                violations.extend(matches)
        
        return {
            'is_violation': len(violations) > 0,
            'violations': violations,
            'confidence': 1.0 if violations else 0.0,
            'method': 'keyword_filter'
        }
    
    def preprocess_text(self, text):
        """文本預處理"""
        # 移除特殊字符
        text = re.sub(r'[^\u4e00-\u9fa5a-zA-Z0-9\s]', '', text)
        
        # 中文分詞
        words = jieba.cut(text)
        
        # 移除停用詞
        stop_words = {'的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一個'}
        words = [word for word in words if word not in stop_words and len(word) > 1]
        
        return ' '.join(words)
    
    def train_ml_model(self, training_data):
        """訓練機器學習模型"""
        texts = [item['text'] for item in training_data]
        labels = [item['label'] for item in training_data]  # 0: 正常, 1: 違規
        
        # 文本預處理
        processed_texts = [self.preprocess_text(text) for text in texts]
        
        # 特徵提取
        self.vectorizer = TfidfVectorizer(
            max_features=10000,
            ngram_range=(1, 2),
            min_df=2,
            max_df=0.95
        )
        
        X = self.vectorizer.fit_transform(processed_texts)
        y = np.array(labels)
        
        # 分割訓練和測試數據
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # 訓練多個模型並選擇最佳
        models = {
            'naive_bayes': MultinomialNB(),
            'logistic_regression': LogisticRegression(random_state=42),
            'random_forest': RandomForestClassifier(n_estimators=100, random_state=42)
        }
        
        best_score = 0
        best_model = None
        best_name = None
        
        for name, model in models.items():
            model.fit(X_train, y_train)
            score = model.score(X_test, y_test)
            
            self.logger.info(f"{name} 準確率: {score:.4f}")
            
            if score > best_score:
                best_score = score
                best_model = model
                best_name = name
        
        self.ml_model = best_model
        self.logger.info(f"選擇最佳模型: {best_name}, 準確率: {best_score:.4f}")
        
        # 評估報告
        y_pred = best_model.predict(X_test)
        report = classification_report(y_test, y_pred)
        self.logger.info(f"分類報告:\n{report}")
        
        return best_score
    
    def ml_classify(self, text):
        """機器學習分類"""
        if self.ml_model is None or self.vectorizer is None:
            return {
                'is_violation': False,
                'confidence': 0.0,
                'method': 'ml_classify',
                'error': '模型未訓練'
            }
        
        try:
            # 預處理文本
            processed_text = self.preprocess_text(text)
            
            # 特徵提取
            features = self.vectorizer.transform([processed_text])
            
            # 預測
            prediction = self.ml_model.predict(features)[0]
            confidence = self.ml_model.predict_proba(features)[0].max()
            
            return {
                'is_violation': bool(prediction),
                'confidence': float(confidence),
                'method': 'ml_classify'
            }
            
        except Exception as e:
            self.logger.error(f"ML分類錯誤: {e}")
            return {
                'is_violation': False,
                'confidence': 0.0,
                'method': 'ml_classify',
                'error': str(e)
            }
    
    def moderate_text(self, text, user_id=None):
        """綜合文本審核"""
        result = {
            'text': text,
            'user_id': user_id,
            'timestamp': datetime.now().isoformat(),
            'results': [],
            'final_decision': 'approved',
            'confidence': 0.0,
            'actions': []
        }
        
        # 關鍵詞過濾
        keyword_result = self.keyword_filter(text)
        result['results'].append(keyword_result)
        
        # 機器學習分類
        ml_result = self.ml_classify(text)
        result['results'].append(ml_result)
        
        # 綜合決策
        max_confidence = 0
        is_violation = False
        
        for res in result['results']:
            if res.get('is_violation', False):
                is_violation = True
                if res.get('confidence', 0) > max_confidence:
                    max_confidence = res.get('confidence', 0)
        
        result['confidence'] = max_confidence
        
        # 決策邏輯
        if keyword_result['is_violation']:
            result['final_decision'] = 'rejected'
            result['actions'].append('keyword_violation')
        elif ml_result.get('is_violation', False) and ml_result.get('confidence', 0) > 0.8:
            result['final_decision'] = 'rejected'
            result['actions'].append('ml_high_confidence_violation')
        elif ml_result.get('is_violation', False) and ml_result.get('confidence', 0) > 0.6:
            result['final_decision'] = 'pending_review'
            result['actions'].append('ml_medium_confidence_violation')
        else:
            result['final_decision'] = 'approved'
        
        # 記錄日誌
        self.logger.info(f"文本審核: {result['final_decision']}, 信心度: {result['confidence']:.4f}")
        
        return result
    
    def save_model(self, filepath):
        """保存模型"""
        model_data = {
            'ml_model': self.ml_model,
            'vectorizer': self.vectorizer,
            'keyword_filters': [pattern.pattern for pattern in self.keyword_filters]
        }
        
        with open(filepath, 'wb') as f:
            pickle.dump(model_data, f)
        
        self.logger.info(f"模型已保存到: {filepath}")
    
    def load_model(self, filepath):
        """載入模型"""
        try:
            with open(filepath, 'rb') as f:
                model_data = pickle.load(f)
            
            self.ml_model = model_data['ml_model']
            self.vectorizer = model_data['vectorizer']
            
            # 重新編譯關鍵詞過濾器
            self.keyword_filters = [
                re.compile(pattern, re.IGNORECASE) 
                for pattern in model_data['keyword_filters']
            ]
            
            self.logger.info(f"模型已從 {filepath} 載入")
            return True
            
        except Exception as e:
            self.logger.error(f"載入模型失敗: {e}")
            return False
```

#### 2.2.2 圖片內容審核

```python
# 圖片內容審核系統
import cv2
import numpy as np
from PIL import Image
import requests
import base64
import hashlib
from typing import Dict, List, Optional
import logging

class ImageModerationEngine:
    def __init__(self):
        self.setup_logging()
        self.blocked_hashes = set()
        self.load_blocked_hashes()
    
    def setup_logging(self):
        """設置日誌記錄"""
        self.logger = logging.getLogger(__name__)
    
    def load_blocked_hashes(self):
        """載入已知違規圖片的哈希值"""
        # 這裡可以從數據庫或文件載入已知的違規圖片哈希
        pass
    
    def calculate_image_hash(self, image_path):
        """計算圖片哈希值"""
        try:
            with open(image_path, 'rb') as f:
                image_data = f.read()
            return hashlib.md5(image_data).hexdigest()
        except Exception as e:
            self.logger.error(f"計算圖片哈希失敗: {e}")
            return None
    
    def hash_check(self, image_path):
        """哈希值檢查"""
        image_hash = self.calculate_image_hash(image_path)
        
        if image_hash is None:
            return {
                'is_violation': False,
                'confidence': 0.0,
                'method': 'hash_check',
                'error': '無法計算哈希值'
            }
        
        is_blocked = image_hash in self.blocked_hashes
        
        return {
            'is_violation': is_blocked,
            'confidence': 1.0 if is_blocked else 0.0,
            'method': 'hash_check',
            'hash': image_hash
        }
    
    def detect_nudity(self, image_path):
        """檢測裸體內容（簡化版）"""
        try:
            # 載入圖片
            image = cv2.imread(image_path)
            if image is None:
                return {
                    'is_violation': False,
                    'confidence': 0.0,
                    'method': 'nudity_detection',
                    'error': '無法載入圖片'
                }
            
            # 轉換到HSV色彩空間
            hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
            
            # 定義膚色範圍
            lower_skin = np.array([0, 20, 70], dtype=np.uint8)
            upper_skin = np.array([20, 255, 255], dtype=np.uint8)
            
            # 創建膚色遮罩
            skin_mask = cv2.inRange(hsv, lower_skin, upper_skin)
            
            # 計算膚色像素比例
            total_pixels = image.shape[0] * image.shape[1]
            skin_pixels = cv2.countNonZero(skin_mask)
            skin_ratio = skin_pixels / total_pixels
            
            # 簡單的閾值判斷
            is_violation = skin_ratio > 0.3  # 如果膚色超過30%可能是問題
            confidence = min(skin_ratio * 2, 1.0)  # 簡化的信心度計算
            
            return {
                'is_violation': is_violation,
                'confidence': confidence,
                'method': 'nudity_detection',
                'skin_ratio': skin_ratio
            }
            
        except Exception as e:
            self.logger.error(f"裸體檢測錯誤: {e}")
            return {
                'is_violation': False,
                'confidence': 0.0,
                'method': 'nudity_detection',
                'error': str(e)
            }
    
    def detect_violence(self, image_path):
        """檢測暴力內容（簡化版）"""
        try:
            # 載入圖片
            image = cv2.imread(image_path)
            if image is None:
                return {
                    'is_violation': False,
                    'confidence': 0.0,
                    'method': 'violence_detection',
                    'error': '無法載入圖片'
                }
            
            # 轉換為灰度圖
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # 檢測邊緣（暴力圖片通常有更多尖銳邊緣）
            edges = cv2.Canny(gray, 50, 150)
            edge_ratio = cv2.countNonZero(edges) / (gray.shape[0] * gray.shape[1])
            
            # 檢測紅色區域（可能的血液）
            hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
            lower_red1 = np.array([0, 50, 50])
            upper_red1 = np.array([10, 255, 255])
            lower_red2 = np.array([170, 50, 50])
            upper_red2 = np.array([180, 255, 255])
            
            red_mask1 = cv2.inRange(hsv, lower_red1, upper_red1)
            red_mask2 = cv2.inRange(hsv, lower_red2, upper_red2)
            red_mask = cv2.bitwise_or(red_mask1, red_mask2)
            
            red_ratio = cv2.countNonZero(red_mask) / (image.shape[0] * image.shape[1])
            
            # 簡化的暴力檢測邏輯
            violence_score = (edge_ratio * 0.7 + red_ratio * 0.3)
            is_violation = violence_score > 0.15
            
            return {
                'is_violation': is_violation,
                'confidence': min(violence_score * 3, 1.0),
                'method': 'violence_detection',
                'edge_ratio': edge_ratio,
                'red_ratio': red_ratio
            }
            
        except Exception as e:
            self.logger.error(f"暴力檢測錯誤: {e}")
            return {
                'is_violation': False,
                'confidence': 0.0,
                'method': 'violence_detection',
                'error': str(e)
            }
    
    def moderate_image(self, image_path, user_id=None):
        """綜合圖片審核"""
        result = {
            'image_path': image_path,
            'user_id': user_id,
            'timestamp': datetime.now().isoformat(),
            'results': [],
            'final_decision': 'approved',
            'confidence': 0.0,
            'actions': []
        }
        
        # 哈希檢查
        hash_result = self.hash_check(image_path)
        result['results'].append(hash_result)
        
        # 裸體檢測
        nudity_result = self.detect_nudity(image_path)
        result['results'].append(nudity_result)
        
        # 暴力檢測
        violence_result = self.detect_violence(image_path)
        result['results'].append(violence_result)
        
        # 綜合決策
        max_confidence = 0
        
        for res in result['results']:
            if res.get('is_violation', False):
                confidence = res.get('confidence', 0)
                if confidence > max_confidence:
                    max_confidence = confidence
        
        result['confidence'] = max_confidence
        
        # 決策邏輯
        if hash_result['is_violation']:
            result['final_decision'] = 'rejected'
            result['actions'].append('known_violation')
        elif nudity_result.get('is_violation', False) and nudity_result.get('confidence', 0) > 0.7:
            result['final_decision'] = 'rejected'
            result['actions'].append('nudity_violation')
        elif violence_result.get('is_violation', False) and violence_result.get('confidence', 0) > 0.6:
            result['final_decision'] = 'rejected'
            result['actions'].append('violence_violation')
        elif max_confidence > 0.4:
            result['final_decision'] = 'pending_review'
            result['actions'].append('manual_review_required')
        else:
            result['final_decision'] = 'approved'
        
        # 記錄日誌
        self.logger.info(f"圖片審核: {result['final_decision']}, 信心度: {result['confidence']:.4f}")
        
        return result
```

### 2.3 用戶行為審核

```python
# 用戶行為審核系統
from datetime import datetime, timedelta
from collections import defaultdict, deque
import json
import redis

class BehaviorModerationEngine:
    def __init__(self, redis_client=None):
        self.redis = redis_client or redis.Redis(host='localhost', port=6379, db=0)
        self.setup_logging()
        
        # 行為閾值配置
        self.thresholds = {
            'post_frequency': {'limit': 10, 'window': 3600},  # 1小時內最多10篇貼文
            'comment_frequency': {'limit': 50, 'window': 3600},  # 1小時內最多50條評論
            'like_frequency': {'limit': 200, 'window': 3600},  # 1小時內最多200個讚
            'follow_frequency': {'limit': 20, 'window': 3600},  # 1小時內最多關注20人
            'message_frequency': {'limit': 100, 'window': 3600},  # 1小時內最多100條私訊
            'report_frequency': {'limit': 5, 'window': 86400},  # 24小時內最多5次舉報
        }
    
    def setup_logging(self):
        """設置日誌記錄"""
        self.logger = logging.getLogger(__name__)
    
    def track_user_action(self, user_id, action_type, metadata=None):
        """追蹤用戶行為"""
        timestamp = datetime.now().timestamp()
        
        action_data = {
            'user_id': user_id,
            'action_type': action_type,
            'timestamp': timestamp,
            'metadata': metadata or {}
        }
        
        # 存儲到Redis
        key = f"user_actions:{user_id}:{action_type}"
        self.redis.zadd(key, {json.dumps(action_data): timestamp})
        
        # 設置過期時間（保留7天數據）
        self.redis.expire(key, 604800)
        
        # 檢查是否超過頻率限制
        return self.check_frequency_limit(user_id, action_type)
    
    def check_frequency_limit(self, user_id, action_type):
        """檢查頻率限制"""
        if action_type not in self.thresholds:
            return {'is_violation': False, 'method': 'frequency_check'}
        
        threshold = self.thresholds[action_type]
        window_start = datetime.now().timestamp() - threshold['window']
        
        key = f"user_actions:{user_id}:{action_type}"
        
        # 獲取時間窗口內的行為數量
        count = self.redis.zcount(key, window_start, '+inf')
        
        is_violation = count > threshold['limit']
        confidence = min(count / threshold['limit'], 2.0) if threshold['limit'] > 0 else 0
        
        result = {
            'is_violation': is_violation,
            'confidence': confidence,
            'method': 'frequency_check',
            'action_type': action_type,
            'count': count,
            'limit': threshold['limit'],
            'window': threshold['window']
        }
        
        if is_violation:
            self.logger.warning(f"用戶 {user_id} 行為 {action_type} 超過頻率限制: {count}/{threshold['limit']}")
        
        return result
    
    def detect_spam_pattern(self, user_id):
        """檢測垃圾信息模式"""
        patterns = []
        
        # 檢查重複內容
        recent_posts = self.get_recent_user_posts(user_id, hours=24)
        if len(recent_posts) > 5:
            content_similarity = self.calculate_content_similarity(recent_posts)
            if content_similarity > 0.8:
                patterns.append({
                    'type': 'duplicate_content',
                    'confidence': content_similarity,
                    'description': '發布重複或相似內容'
                })
        
        # 檢查異常活躍
        activity_score = self.calculate_activity_score(user_id)
        if activity_score > 2.0:  # 超過正常活躍度2倍
            patterns.append({
                'type': 'abnormal_activity',
                'confidence': min(activity_score / 2.0, 1.0),
                'description': '異常活躍行為'
            })
        
        # 檢查關注模式
        follow_pattern = self.analyze_follow_pattern(user_id)
        if follow_pattern['is_suspicious']:
            patterns.append({
                'type': 'suspicious_follow',
                'confidence': follow_pattern['confidence'],
                'description': '可疑關注模式'
            })
        
        return {
            'is_violation': len(patterns) > 0,
            'confidence': max([p['confidence'] for p in patterns]) if patterns else 0.0,
            'method': 'spam_pattern_detection',
            'patterns': patterns
        }
    
    def get_recent_user_posts(self, user_id, hours=24):
        """獲取用戶最近的貼文"""
        # 這裡應該從數據庫獲取用戶最近的貼文
        # 暫時返回示例數據
        return []
    
    def calculate_content_similarity(self, posts):
        """計算內容相似度"""
        # 簡化的相似度計算
        if len(posts) < 2:
            return 0.0
        
        # 這裡應該使用更複雜的文本相似度算法
        # 暫時返回示例值
        return 0.5
    
    def calculate_activity_score(self, user_id):
        """計算活躍度分數"""
        now = datetime.now().timestamp()
        hour_ago = now - 3600
        
        total_actions = 0
        
        for action_type in self.thresholds.keys():
            key = f"user_actions:{user_id}:{action_type}"
            count = self.redis.zcount(key, hour_ago, '+inf')
            total_actions += count
        
        # 正常用戶每小時平均活動次數假設為20
        normal_activity = 20
        return total_actions / normal_activity if normal_activity > 0 else 0
    
    def analyze_follow_pattern(self, user_id):
        """分析關注模式"""
        # 獲取最近關注的用戶
        recent_follows = self.get_recent_follows(user_id, hours=24)
        
        if len(recent_follows) < 5:
            return {'is_suspicious': False, 'confidence': 0.0}
        
        # 檢查是否快速連續關注
        time_intervals = []
        for i in range(1, len(recent_follows)):
            interval = recent_follows[i]['timestamp'] - recent_follows[i-1]['timestamp']
            time_intervals.append(interval)
        
        avg_interval = sum(time_intervals) / len(time_intervals) if time_intervals else 0
        
        # 如果平均間隔小於30秒，可能是機器人行為
        is_suspicious = avg_interval < 30 and len(recent_follows) > 10
        confidence = max(0, 1 - (avg_interval / 30)) if avg_interval < 30 else 0
        
        return {
            'is_suspicious': is_suspicious,
            'confidence': confidence,
            'avg_interval': avg_interval,
            'follow_count': len(recent_follows)
        }
    
    def get_recent_follows(self, user_id, hours=24):
        """獲取最近關注記錄"""
        # 這裡應該從數據庫獲取關注記錄
        # 暫時返回示例數據
        return []
    
    def moderate_user_behavior(self, user_id):
        """綜合用戶行為審核"""
        result = {
            'user_id': user_id,
            'timestamp': datetime.now().isoformat(),
            'results': [],
            'final_decision': 'approved',
            'confidence': 0.0,
            'actions': []
        }
        
        # 檢查各種行為頻率
        for action_type in self.thresholds.keys():
            freq_result = self.check_frequency_limit(user_id, action_type)
            if freq_result['is_violation']:
                result['results'].append(freq_result)
        
        # 檢測垃圾信息模式
        spam_result = self.detect_spam_pattern(user_id)
        result['results'].append(spam_result)
        
        # 綜合決策
        max_confidence = 0
        violation_count = 0
        
        for res in result['results']:
            if res.get('is_violation', False):
                violation_count += 1
                confidence = res.get('confidence', 0)
                if confidence > max_confidence:
                    max_confidence = confidence
        
        result['confidence'] = max_confidence
        
        # 決策邏輯
        if violation_count >= 3:  # 多項違規
            result['final_decision'] = 'suspended'
            result['actions'].append('account_suspension')
        elif max_confidence > 0.8:  # 高信心度違規
            result['final_decision'] = 'restricted'
            result['actions'].append('rate_limiting')
        elif max_confidence > 0.6:  # 中等信心度違規
            result['final_decision'] = 'warning'
            result['actions'].append('user_warning')
        else:
            result['final_decision'] = 'approved'
        
        # 記錄日誌
        self.logger.info(f"用戶行為審核: {result['final_decision']}, 信心度: {result['confidence']:.4f}")
        
        return result
```

## 3. 數據庫設計

### 3.1 內容審核相關資料表

```sql
-- 內容審核記錄表
CREATE TABLE content_moderation_logs (
    id SERIAL PRIMARY KEY,
    content_id INTEGER NOT NULL,
    content_type VARCHAR(50) NOT NULL, -- post, comment, image, video, audio
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    moderation_type VARCHAR(50) NOT NULL, -- automatic, manual, hybrid
    decision VARCHAR(20) NOT NULL, -- approved, rejected, pending_review
    confidence DECIMAL(5, 4),
    violation_types JSONB, -- 違規類型列表
    moderator_id INTEGER REFERENCES users(id), -- 人工審核員ID
    review_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 敏感詞庫表
CREATE TABLE sensitive_keywords (
    id SERIAL PRIMARY KEY,
    keyword VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL, -- political, sexual, violent, hate, spam
    severity INTEGER DEFAULT 1, -- 1-5, 嚴重程度
    is_regex BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用戶舉報表
CREATE TABLE user_reports (
    id SERIAL PRIMARY KEY,
    reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    reported_content_id INTEGER,
    reported_content_type VARCHAR(50), -- post, comment, user, message
    report_type VARCHAR(50) NOT NULL, -- spam, harassment, inappropriate, fake
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- pending, investigating, resolved, dismissed
    assigned_to INTEGER REFERENCES users(id), -- 分配給的審核員
    resolution TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- 用戶行為記錄表
CREATE TABLE user_behavior_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- post, comment, like, follow, message, report
    target_id INTEGER,
    target_type VARCHAR(50), -- user, post, comment
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 違規處罰記錄表
CREATE TABLE violation_penalties (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    violation_type VARCHAR(50) NOT NULL,
    penalty_type VARCHAR(50) NOT NULL, -- warning, restriction, suspension, ban
    duration INTEGER, -- 處罰持續時間（秒）
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id), -- 執行處罰的管理員
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- 內容標籤表
CREATE TABLE content_tags (
    id SERIAL PRIMARY KEY,
    content_id INTEGER NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    tag_type VARCHAR(50) NOT NULL, -- nsfw, violence, spam, verified
    confidence DECIMAL(5, 4),
    tagged_by VARCHAR(20) NOT NULL, -- system, moderator, user
    tagged_by_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 審核員工作記錄表
CREATE TABLE moderator_activities (
    id SERIAL PRIMARY KEY,
    moderator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- review, approve, reject, escalate
    content_id INTEGER,
    content_type VARCHAR(50),
    decision VARCHAR(20),
    processing_time INTEGER, -- 處理時間（秒）
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 自動審核規則表
CREATE TABLE moderation_rules (
    id SERIAL PRIMARY KEY,
    rule_name VARCHAR(100) NOT NULL,
    rule_type VARCHAR(50) NOT NULL, -- keyword, ml_model, behavior, image
    conditions JSONB NOT NULL, -- 規則條件
    actions JSONB NOT NULL, -- 執行動作
    priority INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 申訴記錄表
CREATE TABLE appeals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    violation_id INTEGER REFERENCES violation_penalties(id),
    moderation_log_id INTEGER REFERENCES content_moderation_logs(id),
    appeal_reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    reviewed_by INTEGER REFERENCES users(id),
    review_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP
);

-- 索引
CREATE INDEX idx_content_moderation_logs_content ON content_moderation_logs(content_id, content_type);
CREATE INDEX idx_content_moderation_logs_user ON content_moderation_logs(user_id);
CREATE INDEX idx_content_moderation_logs_decision ON content_moderation_logs(decision);
CREATE INDEX idx_content_moderation_logs_created_at ON content_moderation_logs(created_at);

CREATE INDEX idx_sensitive_keywords_category ON sensitive_keywords(category);
CREATE INDEX idx_sensitive_keywords_active ON sensitive_keywords(is_active);
CREATE INDEX idx_sensitive_keywords_keyword ON sensitive_keywords(keyword);

CREATE INDEX idx_user_reports_reporter ON user_reports(reporter_id);
CREATE INDEX idx_user_reports_reported_user ON user_reports(reported_user_id);
CREATE INDEX idx_user_reports_status ON user_reports(status);
CREATE INDEX idx_user_reports_created_at ON user_reports(created_at);

CREATE INDEX idx_user_behavior_logs_user ON user_behavior_logs(user_id);
CREATE INDEX idx_user_behavior_logs_action ON user_behavior_logs(action_type);
CREATE INDEX idx_user_behavior_logs_created_at ON user_behavior_logs(created_at);

CREATE INDEX idx_violation_penalties_user ON violation_penalties(user_id);
CREATE INDEX idx_violation_penalties_active ON violation_penalties(is_active);
CREATE INDEX idx_violation_penalties_expires ON violation_penalties(expires_at);

CREATE INDEX idx_content_tags_content ON content_tags(content_id, content_type);
CREATE INDEX idx_content_tags_type ON content_tags(tag_type);

CREATE INDEX idx_moderator_activities_moderator ON moderator_activities(moderator_id);
CREATE INDEX idx_moderator_activities_created_at ON moderator_activities(created_at);

CREATE INDEX idx_moderation_rules_active ON moderation_rules(is_active);
CREATE INDEX idx_moderation_rules_priority ON moderation_rules(priority);

CREATE INDEX idx_appeals_user ON appeals(user_id);
CREATE INDEX idx_appeals_status ON appeals(status);
CREATE INDEX idx_appeals_created_at ON appeals(created_at);
```

## 4. 系統架構設計

### 4.1 內容審核系統架構總覽

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   用戶端應用    │    │   Web 應用      │    │   管理後台      │
│                 │    │                 │    │                 │
│ - 內容發布      │    │ - 內容展示      │    │ - 審核管理      │
│ - 舉報功能      │    │ - 舉報處理      │    │ - 規則配置      │
│ - 申訴功能      │    │ - 申訴提交      │    │ - 數據分析      │
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
                    │ - 請求記錄      │
                    └─────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   自動審核      │    │   人工審核      │    │   行為監控      │
│                 │    │                 │    │                 │
│ - 關鍵詞過濾    │    │ - 審核隊列      │    │ - 行為追蹤      │
│ - 機器學習分類  │    │ - 審核工具      │    │ - 異常檢測      │
│ - 圖像識別      │    │ - 決策記錄      │    │ - 風險評估      │
│ - 實時處理      │    │ - 申訴處理      │    │ - 處罰執行      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   數據層        │
                    │                 │
                    │ - PostgreSQL    │
                    │ - Redis 快取    │
                    │ - 文件存儲      │
                    │ - 日誌存儲      │
                    └─────────────────┘
```

### 4.2 內容審核流程圖

```
用戶發布內容
     │
     ▼
自動預審核
     │
     ├─── 明顯違規 ──► 直接拒絕 ──► 通知用戶
     │
     ├─── 可疑內容 ──► 人工審核隊列
     │                    │
     │                    ▼
     │               審核員處理
     │                    │
     │                    ├─── 批准 ──► 內容發布
     │                    │
     │                    └─── 拒絕 ──► 通知用戶 ──► 申訴流程
     │
     └─── 正常內容 ──► 直接發布
                          │
                          ▼
                     持續監控
                          │
                          ├─── 用戶舉報 ──► 重新審核
                          │
                          └─── 行為異常 ──► 風險評估
```

## 5. 實施計劃

### 5.1 第一階段：基礎審核功能（4-6週）

**核心功能**
- 關鍵詞過濾系統
- 基礎圖片審核
- 用戶舉報功能
- 簡單的人工審核工具
- 基礎處罰機制

**技術實現**
- Python + 正則表達式
- OpenCV 圖像處理
- PostgreSQL 數據存儲
- Redis 快取
- RESTful API

**預期成果**
- 基本的內容過濾能力
- 舉報和處理流程
- 審核管理後台

### 5.2 第二階段：智能審核功能（6-8週）

**核心功能**
- 機器學習文本分類
- 進階圖像識別
- 用戶行為分析
- 自動化處罰系統
- 申訴處理流程

**技術實現**
- Scikit-learn 機器學習
- 深度學習模型（可選）
- 行為模式分析
- 自動化工作流

**預期成果**
- 智能化審核能力
- 減少人工審核負擔
- 提升審核準確率

### 5.3 第三階段：優化與擴展（4-6週）

**核心功能**
- 多模態內容審核
- 實時風險評估
- 審核效果分析
- 規則動態調整
- 國際化支援

**技術實現**
- 多模型融合
- 實時數據處理
- 統計分析工具
- A/B測試框架

**預期成果**
- 全面的內容安全保障
- 數據驅動的優化
- 可擴展的審核架構

## 6. 技術建議

### 6.1 審核技術棧

**文本審核**
- 關鍵詞過濾：正則表達式, Aho-Corasick
- 機器學習：Scikit-learn, NLTK, jieba
- 深度學習：TensorFlow, PyTorch（可選）
- 語言檢測：langdetect, polyglot

**圖像審核**
- 基礎處理：OpenCV, PIL
- 機器學習：Scikit-image
- 深度學習：TensorFlow, PyTorch（可選）
- 哈希比對：imagehash

**行為分析**
- 數據處理：Pandas, NumPy
- 統計分析：SciPy, statsmodels
- 時序分析：Prophet, ARIMA
- 異常檢測：Isolation Forest, One-Class SVM

**系統架構**
- API服務：FastAPI, Flask
- 任務隊列：Celery, RQ
- 快取系統：Redis
- 數據庫：PostgreSQL
- 監控：Prometheus + Grafana

### 6.2 成本估算

**開發成本**
- 第一階段：240-320 小時（1.5-2 人月）
- 第二階段：320-400 小時（2-2.5 人月）
- 第三階段：160-240 小時（1-1.5 人月）
- **總計：720-960 小時（4.5-6 人月）**

**運營成本（月）**
- 服務器資源：$30-100
- 存儲空間：$10-30
- 第三方API：$0-50（如使用）
- 人工審核：$200-500（兼職）
- **總計：$240-680/月**

### 6.3 關鍵指標

**審核效果指標**
- 準確率：>95%
- 召回率：>90%
- 誤報率：<5%
- 處理速度：<1秒（自動審核）
- 人工審核響應時間：<24小時

**系統性能指標**
- API響應時間：<200ms
- 系統可用性：>99.5%
- 審核隊列處理能力：>1000條/小時
- 存儲空間使用率：<80%

**業務指標**
- 違規內容攔截率：>98%
- 用戶申訴成功率：<10%
- 社群滿意度：>4.0/5.0
- 審核成本控制：<$0.01/條內容

## 7. 風險評估與應對

### 7.1 技術風險

**風險**：誤判率過高
**應對**：多層審核機制，人工複審，持續模型優化

**風險**：處理能力不足
**應對**：分散式處理，優先級隊列，彈性擴容

**風險**：規避檢測
**應對**：多種檢測方法，定期更新規則，社群舉報

**風險**：數據隱私洩露
**應對**：數據加密，訪問控制，審計日誌

### 7.2 業務風險

**風險**：過度審核影響用戶體驗
**應對**：精準調整閾值，快速申訴流程，透明化政策

**風險**：法規合規問題
**應對**：定期法規更新，專業法務諮詢，靈活配置

**風險**：人工審核成本過高
**應對**：提升自動化比例，社群自治，外包合作

## 8. 未來擴展規劃

### 8.1 中期功能（6-12個月）

- **多語言支援**：支援更多語言的內容審核
- **視頻音頻審核**：擴展到多媒體內容審核
- **社群自治**：用戶參與的審核機制
- **智能推薦**：基於審核數據的內容推薦優化

### 8.2 長期功能（1-2年）

- **AI輔助審核**：更先進的AI模型應用
- **跨平台整合**：與其他平台的審核數據共享
- **預測性審核**：預測潛在風險內容
- **個性化審核**：基於用戶偏好的審核標準

---

**備註**：此規劃以開源免費技術為主，確保在控制成本的同時提供有效的內容安全保障，維護健康的社群環境。