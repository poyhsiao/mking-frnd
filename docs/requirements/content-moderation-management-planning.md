# Content Moderation and Management Planning

## 1. Feature Overview

### 1.1 Service Scope

**Core Moderation Features**
- Text content moderation
- Image content moderation
- Video content moderation
- Audio content moderation
- User behavior moderation
- Spam filtering

**Target Users**
- Platform administrators
- Content moderators
- Community managers
- General users (reporting functionality)

**Service Objectives**
- Maintain community environment
- Protect user safety
- Comply with regulatory requirements
- Improve content quality

### 1.2 Moderation Types

**Automated Moderation**
- Keyword filtering
- Machine learning classification
- Image recognition
- Behavior pattern analysis

**Manual Moderation**
- Professional moderators
- Community self-governance
- User reporting
- Appeal processing

**Hybrid Moderation**
- Automated pre-screening
- Manual review
- Tiered processing
- Continuous learning

## 2. Technical Solution Comparison

### 2.1 Content Moderation Technology Comparison

| Technical Solution | Advantages | Disadvantages | Use Cases | Cost | Recommendation |
|-------------------|------------|---------------|-----------|------|----------------|
| Keyword Filtering | Simple and fast, low cost | Easy to bypass, high false positive rate | Basic filtering | Very Low | ⭐⭐⭐ |
| Machine Learning Classification | Higher accuracy, learnable | Requires training data, computational cost | Text classification | Medium | ⭐⭐⭐⭐ |
| Deep Learning | Best performance, automatic features | Complex computation, black box problem | Complex content | High | ⭐⭐⭐⭐ |
| Third-party API | Ready to use, professional results | External dependency, higher cost | Quick deployment | High | ⭐⭐⭐ |
| Hybrid Solution | Combined advantages, flexible adjustment | Complex implementation, maintenance cost | Production environment | Medium-High | ⭐⭐⭐⭐⭐ |

**Recommended Solution**: Hybrid moderation system (Keyword filtering + Machine learning + Manual review)

### 2.2 Open Source Content Moderation Tools

#### 2.2.1 Text Content Moderation

```python
# Machine learning-based text content moderation system
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
        """Setup logging"""
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
        """Load keyword filters"""
        # Sensitive word database
        sensitive_words = [
            # Political sensitive words
            'political_sensitive_word1', 'political_sensitive_word2',
            # Sexual content
            'sexual_word1', 'sexual_word2',
            # Violent content
            'violent_word1', 'violent_word2',
            # Hate speech
            'hate_word1', 'hate_word2',
            # Spam advertising
            'ad_word1', 'ad_word2'
        ]
        
        # Compile regular expressions
        self.keyword_filters = [
            re.compile(word, re.IGNORECASE) for word in sensitive_words
        ]
    
    def keyword_filter(self, text):
        """Keyword filtering"""
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
        """Text preprocessing"""
        # Remove special characters
        text = re.sub(r'[^\u4e00-\u9fa5a-zA-Z0-9\s]', '', text)
        
        # Chinese word segmentation
        words = jieba.cut(text)
        
        # Remove stop words
        stop_words = {'the', 'of', 'in', 'is', 'I', 'have', 'and', 'not', 'people', 'all', 'a', 'an'}
        words = [word for word in words if word not in stop_words and len(word) > 1]
        
        return ' '.join(words)
    
    def train_ml_model(self, training_data):
        """Train machine learning model"""
        texts = [item['text'] for item in training_data]
        labels = [item['label'] for item in training_data]  # 0: normal, 1: violation
        
        # Text preprocessing
        processed_texts = [self.preprocess_text(text) for text in texts]
        
        # Feature extraction
        self.vectorizer = TfidfVectorizer(
            max_features=10000,
            ngram_range=(1, 2),
            min_df=2,
            max_df=0.95
        )
        
        X = self.vectorizer.fit_transform(processed_texts)
        y = np.array(labels)
        
        # Split training and test data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Train multiple models and select the best
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
            
            self.logger.info(f"{name} accuracy: {score:.4f}")
            
            if score > best_score:
                best_score = score
                best_model = model
                best_name = name
        
        self.ml_model = best_model
        self.logger.info(f"Selected best model: {best_name}, accuracy: {best_score:.4f}")
        
        # Evaluation report
        y_pred = best_model.predict(X_test)
        report = classification_report(y_test, y_pred)
        self.logger.info(f"Classification report:\n{report}")
        
        return best_score
    
    def ml_classify(self, text):
        """Machine learning classification"""
        if self.ml_model is None or self.vectorizer is None:
            return {
                'is_violation': False,
                'confidence': 0.0,
                'method': 'ml_classify',
                'error': 'Model not trained'
            }
        
        try:
            # Preprocess text
            processed_text = self.preprocess_text(text)
            
            # Feature extraction
            features = self.vectorizer.transform([processed_text])
            
            # Prediction
            prediction = self.ml_model.predict(features)[0]
            confidence = self.ml_model.predict_proba(features)[0].max()
            
            return {
                'is_violation': bool(prediction),
                'confidence': float(confidence),
                'method': 'ml_classify'
            }
            
        except Exception as e:
            self.logger.error(f"ML classification error: {e}")
            return {
                'is_violation': False,
                'confidence': 0.0,
                'method': 'ml_classify',
                'error': str(e)
            }
    
    def moderate_text(self, text, user_id=None):
        """Comprehensive text moderation"""
        result = {
            'text': text,
            'user_id': user_id,
            'timestamp': datetime.now().isoformat(),
            'results': [],
            'final_decision': 'approved',
            'confidence': 0.0,
            'actions': []
        }
        
        # Keyword filtering
        keyword_result = self.keyword_filter(text)
        result['results'].append(keyword_result)
        
        # Machine learning classification
        ml_result = self.ml_classify(text)
        result['results'].append(ml_result)
        
        # Comprehensive decision
        max_confidence = 0
        is_violation = False
        
        for res in result['results']:
            if res.get('is_violation', False):
                is_violation = True
                if res.get('confidence', 0) > max_confidence:
                    max_confidence = res.get('confidence', 0)
        
        result['confidence'] = max_confidence
        
        # Decision logic
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
        
        # Log
        self.logger.info(f"Text moderation: {result['final_decision']}, confidence: {result['confidence']:.4f}")
        
        return result
    
    def save_model(self, filepath):
        """Save model"""
        model_data = {
            'ml_model': self.ml_model,
            'vectorizer': self.vectorizer,
            'keyword_filters': [pattern.pattern for pattern in self.keyword_filters]
        }
        
        with open(filepath, 'wb') as f:
            pickle.dump(model_data, f)
        
        self.logger.info(f"Model saved to: {filepath}")
    
    def load_model(self, filepath):
        """Load model"""
        try:
            with open(filepath, 'rb') as f:
                model_data = pickle.load(f)
            
            self.ml_model = model_data['ml_model']
            self.vectorizer = model_data['vectorizer']
            
            # Recompile keyword filters
            self.keyword_filters = [
                re.compile(pattern, re.IGNORECASE) 
                for pattern in model_data['keyword_filters']
            ]
            
            self.logger.info(f"Model loaded from {filepath}")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to load model: {e}")
            return False
```

#### 2.2.2 Image Content Moderation

```python
# Image content moderation system
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
        """Setup logging"""
        self.logger = logging.getLogger(__name__)
    
    def load_blocked_hashes(self):
        """Load known violation image hashes"""
        # Here you can load known violation image hashes from database or file
        pass
    
    def calculate_image_hash(self, image_path):
        """Calculate image hash"""
        try:
            with open(image_path, 'rb') as f:
                image_data = f.read()
            return hashlib.md5(image_data).hexdigest()
        except Exception as e:
            self.logger.error(f"Failed to calculate image hash: {e}")
            return None
    
    def hash_check(self, image_path):
        """Hash check"""
        image_hash = self.calculate_image_hash(image_path)
        
        if image_hash is None:
            return {
                'is_violation': False,
                'confidence': 0.0,
                'method': 'hash_check',
                'error': 'Unable to calculate hash'
            }
        
        is_blocked = image_hash in self.blocked_hashes
        
        return {
            'is_violation': is_blocked,
            'confidence': 1.0 if is_blocked else 0.0,
            'method': 'hash_check',
            'hash': image_hash
        }
    
    def detect_nudity(self, image_path):
        """Detect nudity content (simplified version)"""
        try:
            # Load image
            image = cv2.imread(image_path)
            if image is None:
                return {
                    'is_violation': False,
                    'confidence': 0.0,
                    'method': 'nudity_detection',
                    'error': 'Unable to load image'
                }
            
            # Convert to HSV color space
            hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
            
            # Define skin color range
            lower_skin = np.array([0, 20, 70], dtype=np.uint8)
            upper_skin = np.array([20, 255, 255], dtype=np.uint8)
            
            # Create skin mask
            skin_mask = cv2.inRange(hsv, lower_skin, upper_skin)
            
            # Calculate skin pixel ratio
            total_pixels = image.shape[0] * image.shape[1]
            skin_pixels = cv2.countNonZero(skin_mask)
            skin_ratio = skin_pixels / total_pixels
            
            # Simple threshold judgment
            is_violation = skin_ratio > 0.3  # If skin color exceeds 30% might be problematic
            confidence = min(skin_ratio * 2, 1.0)  # Simplified confidence calculation
            
            return {
                'is_violation': is_violation,
                'confidence': confidence,
                'method': 'nudity_detection',
                'skin_ratio': skin_ratio
            }
            
        except Exception as e:
            self.logger.error(f"Nudity detection error: {e}")
            return {
                'is_violation': False,
                'confidence': 0.0,
                'method': 'nudity_detection',
                'error': str(e)
            }
    
    def detect_violence(self, image_path):
        """Detect violent content (simplified version)"""
        try:
            # Load image
            image = cv2.imread(image_path)
            if image is None:
                return {
                    'is_violation': False,
                    'confidence': 0.0,
                    'method': 'violence_detection',
                    'error': 'Unable to load image'
                }
            
            # Convert to grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Detect edges (violent images usually have more sharp edges)
            edges = cv2.Canny(gray, 50, 150)
            edge_ratio = cv2.countNonZero(edges) / (gray.shape[0] * gray.shape[1])
            
            # Detect red areas (possible blood)
            hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
            lower_red1 = np.array([0, 50, 50])
            upper_red1 = np.array([10, 255, 255])
            lower_red2 = np.array([170, 50, 50])
            upper_red2 = np.array([180, 255, 255])
            
            red_mask1 = cv2.inRange(hsv, lower_red1, upper_red1)
            red_mask2 = cv2.inRange(hsv, lower_red2, upper_red2)
            red_mask = cv2.bitwise_or(red_mask1, red_mask2)
            
            red_ratio = cv2.countNonZero(red_mask) / (image.shape[0] * image.shape[1])
            
            # Simplified violence detection logic
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
            self.logger.error(f"Violence detection error: {e}")
            return {
                'is_violation': False,
                'confidence': 0.0,
                'method': 'violence_detection',
                'error': str(e)
            }
    
    def moderate_image(self, image_path, user_id=None):
        """Comprehensive image moderation"""
        result = {
            'image_path': image_path,
            'user_id': user_id,
            'timestamp': datetime.now().isoformat(),
            'results': [],
            'final_decision': 'approved',
            'confidence': 0.0,
            'actions': []
        }
        
        # Hash check
        hash_result = self.hash_check(image_path)
        result['results'].append(hash_result)
        
        # Nudity detection
        nudity_result = self.detect_nudity(image_path)
        result['results'].append(nudity_result)
        
        # Violence detection
        violence_result = self.detect_violence(image_path)
        result['results'].append(violence_result)
        
        # Comprehensive decision
        max_confidence = 0
        
        for res in result['results']:
            if res.get('is_violation', False):
                confidence = res.get('confidence', 0)
                if confidence > max_confidence:
                    max_confidence = confidence
        
        result['confidence'] = max_confidence
        
        # Decision logic
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
        
        # Log
        self.logger.info(f"Image moderation: {result['final_decision']}, confidence: {result['confidence']:.4f}")
        
        return result
```

### 2.3 User Behavior Moderation

```python
# User behavior moderation system
from datetime import datetime, timedelta
from collections import defaultdict, deque
import json
import redis

class BehaviorModerationEngine:
    def __init__(self, redis_client=None):
        self.redis = redis_client or redis.Redis(host='localhost', port=6379, db=0)
        self.setup_logging()
        
        # Behavior threshold configuration
        self.thresholds = {
            'post_frequency': {'limit': 10, 'window': 3600},  # Max 10 posts per hour
            'comment_frequency': {'limit': 50, 'window': 3600},  # Max 50 comments per hour
            'like_frequency': {'limit': 200, 'window': 3600},  # Max 200 likes per hour
            'follow_frequency': {'limit': 20, 'window': 3600},  # Max 20 follows per hour
            'message_frequency': {'limit': 100, 'window': 3600},  # Max 100 messages per hour
            'report_frequency': {'limit': 5, 'window': 86400},  # Max 5 reports per 24 hours
        }
    
    def setup_logging(self):
        """Setup logging"""
        self.logger = logging.getLogger(__name__)
    
    def track_user_action(self, user_id, action_type, metadata=None):
        """Track user behavior"""
        timestamp = datetime.now().timestamp()
        
        action_data = {
            'user_id': user_id,
            'action_type': action_type,
            'timestamp': timestamp,
            'metadata': metadata or {}
        }
        
        # Store to Redis
        key = f"user_actions:{user_id}:{action_type}"
        self.redis.zadd(key, {json.dumps(action_data): timestamp})
        
        # Set expiration time (keep 7 days of data)
        self.redis.expire(key, 604800)
        
        # Check if frequency limit is exceeded
        return self.check_frequency_limit(user_id, action_type)
    
    def check_frequency_limit(self, user_id, action_type):
        """Check frequency limit"""
        if action_type not in self.thresholds:
            return {'is_violation': False, 'method': 'frequency_check'}
        
        threshold = self.thresholds[action_type]
        window_start = datetime.now().timestamp() - threshold['window']
        
        key = f"user_actions:{user_id}:{action_type}"
        
        # Get behavior count within time window
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
            self.logger.warning(f"User {user_id} behavior {action_type} exceeds frequency limit: {count}/{threshold['limit']}")
        
        return result
    
    def detect_spam_pattern(self, user_id):
        """Detect spam patterns"""
        patterns = []
        
        # Check duplicate content
        recent_posts = self.get_recent_user_posts(user_id, hours=24)
        if len(recent_posts) > 5:
            content_similarity = self.calculate_content_similarity(recent_posts)
            if content_similarity > 0.8:
                patterns.append({
                    'type': 'duplicate_content',
                    'confidence': content_similarity,
                    'description': 'Publishing duplicate or similar content'
                })
        
        # Check abnormal activity
        activity_score = self.calculate_activity_score(user_id)
        if activity_score > 2.0:  # Exceeds normal activity by 2x
            patterns.append({
                'type': 'abnormal_activity',
                'confidence': min(activity_score / 2.0, 1.0),
                'description': 'Abnormal activity behavior'
            })
        
        # Check follow patterns
        follow_pattern = self.analyze_follow_pattern(user_id)
        if follow_pattern['is_suspicious']:
            patterns.append({
                'type': 'suspicious_follow',
                'confidence': follow_pattern['confidence'],
                'description': 'Suspicious follow pattern'
            })
        
        return {
            'is_violation': len(patterns) > 0,
            'confidence': max([p['confidence'] for p in patterns]) if patterns else 0.0,
            'method': 'spam_pattern_detection',
            'patterns': patterns
        }
    
    def get_recent_user_posts(self, user_id, hours=24):
        """Get user's recent posts"""
        # This should fetch user's recent posts from database
        # Returning sample data for now
        return []
    
    def calculate_content_similarity(self, posts):
        """Calculate content similarity"""
        # Simplified similarity calculation
        if len(posts) < 2:
            return 0.0
        
        # Should use more complex text similarity algorithms here
        # Returning sample value for now
        return 0.5
    
    def calculate_activity_score(self, user_id):
        """Calculate activity score"""
        now = datetime.now().timestamp()
        hour_ago = now - 3600
        
        total_actions = 0
        
        for action_type in self.thresholds.keys():
            key = f"user_actions:{user_id}:{action_type}"
            count = self.redis.zcount(key, hour_ago, '+inf')
            total_actions += count
        
        # Assume normal user averages 20 actions per hour
        normal_activity = 20
        return total_actions / normal_activity if normal_activity > 0 else 0
    
    def analyze_follow_pattern(self, user_id):
        """Analyze follow pattern"""
        # Get recent follows
        recent_follows = self.get_recent_follows(user_id, hours=24)
        
        if len(recent_follows) < 5:
            return {'is_suspicious': False, 'confidence': 0.0}
        
        # Check if following rapidly in succession
        time_intervals = []
        for i in range(1, len(recent_follows)):
            interval = recent_follows[i]['timestamp'] - recent_follows[i-1]['timestamp']
            time_intervals.append(interval)
        
        avg_interval = sum(time_intervals) / len(time_intervals) if time_intervals else 0
        
        # If average interval is less than 30 seconds, might be bot behavior
        is_suspicious = avg_interval < 30 and len(recent_follows) > 10
        confidence = max(0, 1 - (avg_interval / 30)) if avg_interval < 30 else 0
        
        return {
            'is_suspicious': is_suspicious,
            'confidence': confidence,
            'avg_interval': avg_interval,
            'follow_count': len(recent_follows)
        }
    
    def get_recent_follows(self, user_id, hours=24):
        """Get recent follow records"""
        # This should fetch follow records from database
        # Returning sample data for now
        return []
    
    def moderate_user_behavior(self, user_id):
        """Comprehensive user behavior moderation"""
        result = {
            'user_id': user_id,
            'timestamp': datetime.now().isoformat(),
            'results': [],
            'final_decision': 'approved',
            'confidence': 0.0,
            'actions': []
        }
        
        # Check various behavior frequencies
        for action_type in self.thresholds.keys():
            freq_result = self.check_frequency_limit(user_id, action_type)
            if freq_result['is_violation']:
                result['results'].append(freq_result)
        
        # Detect spam patterns
        spam_result = self.detect_spam_pattern(user_id)
        result['results'].append(spam_result)
        
        # Comprehensive decision
        max_confidence = 0
        violation_count = 0
        
        for res in result['results']:
            if res.get('is_violation', False):
                violation_count += 1
                confidence = res.get('confidence', 0)
                if confidence > max_confidence:
                    max_confidence = confidence
        
        result['confidence'] = max_confidence
        
        # Decision logic
        if violation_count >= 3:  # Multiple violations
            result['final_decision'] = 'suspended'
            result['actions'].append('account_suspension')
        elif max_confidence > 0.8:  # High confidence violation
            result['final_decision'] = 'restricted'
            result['actions'].append('rate_limiting')
        elif max_confidence > 0.6:  # Medium confidence violation
            result['final_decision'] = 'warning'
            result['actions'].append('user_warning')
        else:
            result['final_decision'] = 'approved'
        
        # Log
        self.logger.info(f"User behavior moderation: {result['final_decision']}, confidence: {result['confidence']:.4f}")
        
        return result
```

## 3. Database Design

### 3.1 Content Moderation Related Tables

```sql
-- Content moderation logs table
CREATE TABLE content_moderation_logs (
    id SERIAL PRIMARY KEY,
    content_id INTEGER NOT NULL,
    content_type VARCHAR(50) NOT NULL, -- post, comment, image, video, audio
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    moderation_type VARCHAR(50) NOT NULL, -- automatic, manual, hybrid
    decision VARCHAR(20) NOT NULL, -- approved, rejected, pending_review
    confidence DECIMAL(5, 4),
    violation_types JSONB, -- List of violation types
    moderator_id INTEGER REFERENCES users(id), -- Manual moderator ID
    review_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sensitive keywords table
CREATE TABLE sensitive_keywords (
    id SERIAL PRIMARY KEY,
    keyword VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL, -- political, sexual, violent, hate, spam
    severity INTEGER DEFAULT 1, -- 1-5, severity level
    is_regex BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User reports table
CREATE TABLE user_reports (
    id SERIAL PRIMARY KEY,
    reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    reported_content_id INTEGER,
    reported_content_type VARCHAR(50), -- post, comment, user, message
    report_type VARCHAR(50) NOT NULL, -- spam, harassment, inappropriate, fake
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- pending, investigating, resolved, dismissed
    assigned_to INTEGER REFERENCES users(id), -- Assigned moderator
    resolution TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- User behavior logs table
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

-- Violation penalties table
CREATE TABLE violation_penalties (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    violation_type VARCHAR(50) NOT NULL,
    penalty_type VARCHAR(50) NOT NULL, -- warning, restriction, suspension, ban
    duration INTEGER, -- Penalty duration (seconds)
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id), -- Administrator who executed penalty
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- Content tags table
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

-- Moderator activities table
CREATE TABLE moderator_activities (
    id SERIAL PRIMARY KEY,
    moderator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- review, approve, reject, escalate
    content_id INTEGER,
    content_type VARCHAR(50),
    decision VARCHAR(20),
    processing_time INTEGER, -- Processing time (seconds)
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Automatic moderation rules table
CREATE TABLE moderation_rules (
    id SERIAL PRIMARY KEY,
    rule_name VARCHAR(100) NOT NULL,
    rule_type VARCHAR(50) NOT NULL, -- keyword, ml_model, behavior, image
    conditions JSONB NOT NULL, -- Rule conditions
    actions JSONB NOT NULL, -- Actions to execute
    priority INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Appeals table
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

-- Indexes
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

## 4. System Architecture Design

### 4.1 Content Moderation System Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Apps   │    │   Web App       │    │   Admin Panel   │
│                 │    │                 │    │                 │
│ - Content Post  │    │ - Content View  │    │ - Moderation    │
│ - Report        │    │ - Report Handle │    │ - Rule Config   │
│ - Appeal        │    │ - Appeal Submit │    │ - Data Analysis │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   API Gateway   │
                    │                 │
                    │ - Route Mgmt    │
                    │ - Auth          │
                    │ - Rate Limiting │
                    │ - Request Log   │
                    └─────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Auto Moderation │    │ Manual Review   │    │ Behavior Monitor│
│                 │    │                 │    │                 │
│ - Keyword Filter│    │ - Review Queue  │    │ - Behavior Track│
│ - ML Classify   │    │ - Review Tools  │    │ - Anomaly Detect│
│ - Image Recog   │    │ - Decision Log  │    │ - Risk Assess   │
│ - Real-time     │    │ - Appeal Handle │    │ - Penalty Exec  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Data Layer    │
                    │                 │
                    │ - PostgreSQL    │
                    │ - Redis Cache   │
                    │ - File Storage  │
                    │ - Log Storage   │
                    └─────────────────┘
```

### 4.2 Content Moderation Flow Chart

```
User Posts Content
     │
     ▼
Auto Pre-moderation
     │
     ├─── Clear Violation ──► Direct Reject ──► Notify User
     │
     ├─── Suspicious Content ──► Manual Review Queue
     │                              │
     │                              ▼
     │                         Moderator Process
     │                              │
     │                              ├─── Approve ──► Content Published
     │                              │
     │                              └─── Reject ──► Notify User ──► Appeal Process
     │
     └─── Normal Content ──► Direct Publish
                              │
                              ▼
                         Continuous Monitor
                              │
                              ├─── User Report ──► Re-review
                              │
                              └─── Behavior Anomaly ──► Risk Assessment
```

## 5. Implementation Plan

### 5.1 Phase 1: Basic Moderation Features (4-6 weeks)

**Core Features**
- Keyword filtering system
- Basic image moderation
- User reporting functionality
- Simple manual review tools
- Basic penalty mechanism

**Technical Implementation**
- Python + Regular expressions
- OpenCV image processing
- PostgreSQL data storage
- Redis caching
- RESTful API

**Expected Outcomes**
- Basic content filtering capability
- Reporting and handling process
- Moderation admin panel

### 5.2 Phase 2: Intelligent Moderation Features (6-8 weeks)

**Core Features**
- Machine learning text classification
- Advanced image recognition
- User behavior analysis
- Automated penalty system
- Appeal handling process

**Technical Implementation**
- Scikit-learn machine learning
- Deep learning models (optional)
- Behavior pattern analysis
- Automated workflows

**Expected Outcomes**
- Intelligent moderation capability
- Reduced manual review burden
- Improved moderation accuracy

### 5.3 Phase 3: Optimization and Extension (4-6 weeks)

**Core Features**
- Multi-modal content moderation
- Real-time risk assessment
- Moderation effectiveness analysis
- Dynamic rule adjustment
- Internationalization support

**Technical Implementation**
- Multi-model fusion
- Real-time data processing
- Statistical analysis tools
- A/B testing framework

**Expected Outcomes**
- Comprehensive content security
- Data-driven optimization
- Scalable moderation architecture

## 6. Technical Recommendations

### 6.1 Moderation Technology Stack

**Text Moderation**
- Keyword filtering: Regular expressions, Aho-Corasick
- Machine learning: Scikit-learn, NLTK, jieba
- Deep learning: TensorFlow, PyTorch (optional)
- Language detection: langdetect, polyglot

**Image Moderation**
- Basic processing: OpenCV, PIL
- Machine learning: Scikit-image
- Deep learning: TensorFlow, PyTorch (optional)
- Hash comparison: imagehash

**Behavior Analysis**
- Data processing: Pandas, NumPy
- Statistical analysis: SciPy, statsmodels
- Time series analysis: Prophet, ARIMA
- Anomaly detection: Isolation Forest, One-Class SVM

**System Architecture**
- API services: FastAPI, Flask
- Task queues: Celery, RQ
- Caching system: Redis
- Database: PostgreSQL
- Monitoring: Prometheus + Grafana

### 6.2 Cost Estimation

**Development Cost**
- Phase 1: 240-320 hours (1.5-2 person-months)
- Phase 2: 320-400 hours (2-2.5 person-months)
- Phase 3: 160-240 hours (1-1.5 person-months)
- **Total: 720-960 hours (4.5-6 person-months)**

**Operating Cost (Monthly)**
- Server resources: $30-100
- Storage space: $10-30
- Third-party APIs: $0-50 (if used)
- Manual moderation: $200-500 (part-time)
- **Total: $240-680/month**

### 6.3 Key Metrics

**Moderation Effectiveness Metrics**
- Accuracy: >95%
- Recall: >90%
- False positive rate: <5%
- Processing speed: <1 second (auto moderation)
- Manual review response time: <24 hours

**System Performance Metrics**
- API response time: <200ms
- System availability: >99.5%
- Review queue processing capacity: >1000 items/hour
- Storage usage: <80%

**Business Metrics**
- Violation content interception rate: >98%
- User appeal success rate: <10%
- Community satisfaction: >4.0/5.0
- Moderation cost control: <$0.01/content item

## 7. Risk Assessment and Mitigation

### 7.1 Technical Risks

**Risk**: High false positive rate
**Mitigation**: Multi-layer moderation mechanism, manual review, continuous model optimization

**Risk**: Insufficient processing capacity
**Mitigation**: Distributed processing, priority queues, elastic scaling

**Risk**: Detection evasion
**Mitigation**: Multiple detection methods, regular rule updates, community reporting

**Risk**: Data privacy leakage
**Mitigation**: Data encryption, access control, audit logs

### 7.2 Business Risks

**Risk**: Over-moderation affecting user experience
**Mitigation**: Precise threshold adjustment, fast appeal process, transparent policies

**Risk**: Regulatory compliance issues
**Mitigation**: Regular regulatory updates, professional legal consultation, flexible configuration

**Risk**: High manual moderation costs
**Mitigation**: Increase automation ratio, community self-governance, outsourcing partnerships

## 8. Future Expansion Planning

### 8.1 Medium-term Features (6-12 months)

- **Multi-language Support**: Support content moderation in more languages
- **Video/Audio Moderation**: Extend to multimedia content moderation
- **Community Self-governance**: User-participated moderation mechanisms
- **Smart Recommendations**: Content recommendation optimization based on moderation data

### 8.2 Long-term Features (1-2 years)

- **AI-assisted Moderation**: Application of more advanced AI models
- **Cross-platform Integration**: Moderation data sharing with other platforms
- **Predictive Moderation**: Predict potentially risky content
- **Personalized Moderation**: Moderation standards based on user preferences

---

**Note**: This plan primarily uses open-source free technologies to ensure effective content security while controlling costs and maintaining a healthy community environment.