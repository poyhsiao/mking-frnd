# 數據分析與報表規劃

## 1. 功能概述

### 1.1 服務範圍

**核心分析功能**
- 用戶行為分析
- 內容表現分析
- 社群互動分析
- 業務指標監控
- 實時數據儀表板
- 自定義報表生成

**目標用戶**
- 平台管理員
- 產品經理
- 運營團隊
- 數據分析師
- 社群管理員

**服務目標**
- 數據驅動決策
- 用戶體驗優化
- 業務增長洞察
- 風險預警監控
- 運營效率提升

### 1.2 分析類型

**描述性分析**
- 歷史數據統計
- 趨勢變化分析
- 用戶畫像描述
- 內容分佈統計

**診斷性分析**
- 異常原因分析
- 相關性分析
- 漏斗分析
- 留存分析

**預測性分析**
- 用戶流失預測
- 內容熱度預測
- 增長趨勢預測
- 風險預警

**規範性分析**
- 推薦策略
- 優化建議
- A/B測試分析
- 決策支援

## 2. 技術方案比較

### 2.1 數據分析技術比較

| 技術方案 | 優點 | 缺點 | 適用場景 | 成本 | 推薦度 |
|---------|------|------|----------|------|--------|
| Python + Pandas | 靈活強大，生態豐富 | 性能限制，內存消耗 | 中小規模分析 | 低 | ⭐⭐⭐⭐⭐ |
| Apache Spark | 大數據處理，分散式 | 複雜度高，資源需求大 | 大規模數據 | 高 | ⭐⭐⭐ |
| ClickHouse | 高性能OLAP，實時查詢 | 學習成本，維護複雜 | 實時分析 | 中 | ⭐⭐⭐⭐ |
| PostgreSQL + TimescaleDB | 時序數據優化，SQL友好 | 擴展性限制 | 時序分析 | 低 | ⭐⭐⭐⭐ |
| Grafana + Prometheus | 監控可視化，開源免費 | 功能相對簡單 | 系統監控 | 低 | ⭐⭐⭐⭐⭐ |

**推薦方案**：Python + Pandas + PostgreSQL + Grafana（成本效益最佳）

### 2.2 開源數據分析平台

#### 2.2.1 數據處理引擎

```python
# 基於 Python 的數據分析引擎
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import psycopg2
from sqlalchemy import create_engine
import redis
import json
from typing import Dict, List, Optional, Any
import logging
from concurrent.futures import ThreadPoolExecutor
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots

class DataAnalyticsEngine:
    def __init__(self, db_config, redis_config=None):
        self.db_engine = create_engine(
            f"postgresql://{db_config['user']}:{db_config['password']}@"
            f"{db_config['host']}:{db_config['port']}/{db_config['database']}"
        )
        
        self.redis_client = None
        if redis_config:
            self.redis_client = redis.Redis(
                host=redis_config['host'],
                port=redis_config['port'],
                db=redis_config['db']
            )
        
        self.setup_logging()
        self.cache_ttl = 3600  # 1小時快取
    
    def setup_logging(self):
        """設置日誌記錄"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)
    
    def get_cached_data(self, cache_key):
        """獲取快取數據"""
        if not self.redis_client:
            return None
        
        try:
            cached_data = self.redis_client.get(cache_key)
            if cached_data:
                return json.loads(cached_data)
        except Exception as e:
            self.logger.warning(f"快取讀取失敗: {e}")
        
        return None
    
    def set_cached_data(self, cache_key, data, ttl=None):
        """設置快取數據"""
        if not self.redis_client:
            return
        
        try:
            ttl = ttl or self.cache_ttl
            self.redis_client.setex(
                cache_key, 
                ttl, 
                json.dumps(data, default=str)
            )
        except Exception as e:
            self.logger.warning(f"快取寫入失敗: {e}")
    
    def execute_query(self, query, params=None, use_cache=True):
        """執行SQL查詢"""
        cache_key = f"query:{hash(query + str(params or ''))}"
        
        # 嘗試從快取獲取
        if use_cache:
            cached_result = self.get_cached_data(cache_key)
            if cached_result is not None:
                return pd.DataFrame(cached_result)
        
        try:
            # 執行查詢
            df = pd.read_sql_query(query, self.db_engine, params=params)
            
            # 快取結果
            if use_cache and len(df) > 0:
                self.set_cached_data(cache_key, df.to_dict('records'))
            
            return df
            
        except Exception as e:
            self.logger.error(f"查詢執行失敗: {e}")
            return pd.DataFrame()
    
    def get_user_analytics(self, start_date=None, end_date=None):
        """用戶分析數據"""
        if not start_date:
            start_date = datetime.now() - timedelta(days=30)
        if not end_date:
            end_date = datetime.now()
        
        # 用戶註冊趨勢
        registration_query = """
        SELECT 
            DATE(created_at) as date,
            COUNT(*) as new_users,
            COUNT(*) OVER (ORDER BY DATE(created_at)) as cumulative_users
        FROM users 
        WHERE created_at BETWEEN %(start_date)s AND %(end_date)s
        GROUP BY DATE(created_at)
        ORDER BY date
        """
        
        registration_data = self.execute_query(
            registration_query, 
            {'start_date': start_date, 'end_date': end_date}
        )
        
        # 用戶活躍度
        activity_query = """
        SELECT 
            DATE(created_at) as date,
            COUNT(DISTINCT user_id) as daily_active_users
        FROM user_behavior_logs 
        WHERE created_at BETWEEN %(start_date)s AND %(end_date)s
        GROUP BY DATE(created_at)
        ORDER BY date
        """
        
        activity_data = self.execute_query(
            activity_query,
            {'start_date': start_date, 'end_date': end_date}
        )
        
        # 用戶留存分析
        retention_data = self.calculate_user_retention(start_date, end_date)
        
        # 用戶行為分佈
        behavior_query = """
        SELECT 
            action_type,
            COUNT(*) as action_count,
            COUNT(DISTINCT user_id) as unique_users
        FROM user_behavior_logs 
        WHERE created_at BETWEEN %(start_date)s AND %(end_date)s
        GROUP BY action_type
        ORDER BY action_count DESC
        """
        
        behavior_data = self.execute_query(
            behavior_query,
            {'start_date': start_date, 'end_date': end_date}
        )
        
        return {
            'registration_trend': registration_data.to_dict('records'),
            'activity_trend': activity_data.to_dict('records'),
            'retention_analysis': retention_data,
            'behavior_distribution': behavior_data.to_dict('records')
        }
    
    def calculate_user_retention(self, start_date, end_date):
        """計算用戶留存率"""
        retention_query = """
        WITH user_first_activity AS (
            SELECT 
                user_id,
                MIN(DATE(created_at)) as first_activity_date
            FROM user_behavior_logs
            WHERE created_at BETWEEN %(start_date)s AND %(end_date)s
            GROUP BY user_id
        ),
        retention_cohorts AS (
            SELECT 
                ufa.first_activity_date as cohort_date,
                COUNT(DISTINCT ufa.user_id) as cohort_size,
                COUNT(DISTINCT CASE 
                    WHEN DATE(ubl.created_at) = ufa.first_activity_date + INTERVAL '1 day' 
                    THEN ufa.user_id END) as day_1_retention,
                COUNT(DISTINCT CASE 
                    WHEN DATE(ubl.created_at) = ufa.first_activity_date + INTERVAL '7 days' 
                    THEN ufa.user_id END) as day_7_retention,
                COUNT(DISTINCT CASE 
                    WHEN DATE(ubl.created_at) = ufa.first_activity_date + INTERVAL '30 days' 
                    THEN ufa.user_id END) as day_30_retention
            FROM user_first_activity ufa
            LEFT JOIN user_behavior_logs ubl ON ufa.user_id = ubl.user_id
            GROUP BY ufa.first_activity_date
            ORDER BY ufa.first_activity_date
        )
        SELECT 
            cohort_date,
            cohort_size,
            ROUND(day_1_retention::numeric / cohort_size * 100, 2) as day_1_retention_rate,
            ROUND(day_7_retention::numeric / cohort_size * 100, 2) as day_7_retention_rate,
            ROUND(day_30_retention::numeric / cohort_size * 100, 2) as day_30_retention_rate
        FROM retention_cohorts
        WHERE cohort_size >= 10
        """
        
        return self.execute_query(
            retention_query,
            {'start_date': start_date, 'end_date': end_date}
        ).to_dict('records')
    
    def get_content_analytics(self, start_date=None, end_date=None):
        """內容分析數據"""
        if not start_date:
            start_date = datetime.now() - timedelta(days=30)
        if not end_date:
            end_date = datetime.now()
        
        # 內容發布趨勢
        content_trend_query = """
        SELECT 
            DATE(created_at) as date,
            COUNT(*) as posts_count,
            COUNT(DISTINCT user_id) as active_creators
        FROM posts 
        WHERE created_at BETWEEN %(start_date)s AND %(end_date)s
        GROUP BY DATE(created_at)
        ORDER BY date
        """
        
        content_trend = self.execute_query(
            content_trend_query,
            {'start_date': start_date, 'end_date': end_date}
        )
        
        # 熱門內容分析
        popular_content_query = """
        SELECT 
            p.id,
            p.title,
            p.user_id,
            u.username,
            p.created_at,
            COUNT(DISTINCT l.user_id) as likes_count,
            COUNT(DISTINCT c.id) as comments_count,
            COUNT(DISTINCT s.user_id) as shares_count
        FROM posts p
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN likes l ON p.id = l.post_id
        LEFT JOIN comments c ON p.id = c.post_id
        LEFT JOIN shares s ON p.id = s.post_id
        WHERE p.created_at BETWEEN %(start_date)s AND %(end_date)s
        GROUP BY p.id, p.title, p.user_id, u.username, p.created_at
        ORDER BY (likes_count + comments_count * 2 + shares_count * 3) DESC
        LIMIT 20
        """
        
        popular_content = self.execute_query(
            popular_content_query,
            {'start_date': start_date, 'end_date': end_date}
        )
        
        # 內容類型分佈
        content_type_query = """
        SELECT 
            content_type,
            COUNT(*) as count,
            AVG(COALESCE(likes_count, 0)) as avg_likes,
            AVG(COALESCE(comments_count, 0)) as avg_comments
        FROM posts 
        WHERE created_at BETWEEN %(start_date)s AND %(end_date)s
        GROUP BY content_type
        ORDER BY count DESC
        """
        
        content_type_dist = self.execute_query(
            content_type_query,
            {'start_date': start_date, 'end_date': end_date}
        )
        
        # 內容互動分析
        engagement_query = """
        SELECT 
            DATE(p.created_at) as date,
            COUNT(DISTINCT l.user_id) as total_likes,
            COUNT(DISTINCT c.id) as total_comments,
            COUNT(DISTINCT s.user_id) as total_shares,
            COUNT(DISTINCT p.id) as total_posts,
            ROUND(COUNT(DISTINCT l.user_id)::numeric / COUNT(DISTINCT p.id), 2) as avg_likes_per_post
        FROM posts p
        LEFT JOIN likes l ON p.id = l.post_id AND DATE(l.created_at) = DATE(p.created_at)
        LEFT JOIN comments c ON p.id = c.post_id AND DATE(c.created_at) = DATE(p.created_at)
        LEFT JOIN shares s ON p.id = s.post_id AND DATE(s.created_at) = DATE(p.created_at)
        WHERE p.created_at BETWEEN %(start_date)s AND %(end_date)s
        GROUP BY DATE(p.created_at)
        ORDER BY date
        """
        
        engagement_data = self.execute_query(
            engagement_query,
            {'start_date': start_date, 'end_date': end_date}
        )
        
        return {
            'content_trend': content_trend.to_dict('records'),
            'popular_content': popular_content.to_dict('records'),
            'content_type_distribution': content_type_dist.to_dict('records'),
            'engagement_analysis': engagement_data.to_dict('records')
        }
    
    def get_social_analytics(self, start_date=None, end_date=None):
        """社交互動分析"""
        if not start_date:
            start_date = datetime.now() - timedelta(days=30)
        if not end_date:
            end_date = datetime.now()
        
        # 關注關係分析
        follow_query = """
        SELECT 
            DATE(created_at) as date,
            COUNT(*) as new_follows,
            COUNT(*) OVER (ORDER BY DATE(created_at)) as cumulative_follows
        FROM follows 
        WHERE created_at BETWEEN %(start_date)s AND %(end_date)s
        GROUP BY DATE(created_at)
        ORDER BY date
        """
        
        follow_data = self.execute_query(
            follow_query,
            {'start_date': start_date, 'end_date': end_date}
        )
        
        # 互動熱度分析
        interaction_query = """
        SELECT 
            DATE(created_at) as date,
            'likes' as interaction_type,
            COUNT(*) as count
        FROM likes 
        WHERE created_at BETWEEN %(start_date)s AND %(end_date)s
        GROUP BY DATE(created_at)
        
        UNION ALL
        
        SELECT 
            DATE(created_at) as date,
            'comments' as interaction_type,
            COUNT(*) as count
        FROM comments 
        WHERE created_at BETWEEN %(start_date)s AND %(end_date)s
        GROUP BY DATE(created_at)
        
        UNION ALL
        
        SELECT 
            DATE(created_at) as date,
            'shares' as interaction_type,
            COUNT(*) as count
        FROM shares 
        WHERE created_at BETWEEN %(start_date)s AND %(end_date)s
        GROUP BY DATE(created_at)
        
        ORDER BY date, interaction_type
        """
        
        interaction_data = self.execute_query(
            interaction_query,
            {'start_date': start_date, 'end_date': end_date}
        )
        
        # 社群網絡分析
        network_query = """
        WITH user_connections AS (
            SELECT 
                follower_id as user_id,
                COUNT(*) as following_count
            FROM follows
            GROUP BY follower_id
        ),
        user_followers AS (
            SELECT 
                following_id as user_id,
                COUNT(*) as followers_count
            FROM follows
            GROUP BY following_id
        )
        SELECT 
            u.id,
            u.username,
            COALESCE(uc.following_count, 0) as following_count,
            COALESCE(uf.followers_count, 0) as followers_count,
            CASE 
                WHEN COALESCE(uf.followers_count, 0) > 1000 THEN 'influencer'
                WHEN COALESCE(uf.followers_count, 0) > 100 THEN 'active'
                ELSE 'regular'
            END as user_type
        FROM users u
        LEFT JOIN user_connections uc ON u.id = uc.user_id
        LEFT JOIN user_followers uf ON u.id = uf.user_id
        WHERE u.created_at <= %(end_date)s
        ORDER BY followers_count DESC
        LIMIT 100
        """
        
        network_data = self.execute_query(
            network_query,
            {'end_date': end_date}
        )
        
        return {
            'follow_trend': follow_data.to_dict('records'),
            'interaction_trend': interaction_data.to_dict('records'),
            'network_analysis': network_data.to_dict('records')
        }
    
    def get_business_metrics(self, start_date=None, end_date=None):
        """業務指標分析"""
        if not start_date:
            start_date = datetime.now() - timedelta(days=30)
        if not end_date:
            end_date = datetime.now()
        
        # 關鍵業務指標
        kpi_query = """
        WITH daily_metrics AS (
            SELECT 
                DATE(created_at) as date,
                COUNT(DISTINCT user_id) as daily_active_users
            FROM user_behavior_logs
            WHERE created_at BETWEEN %(start_date)s AND %(end_date)s
            GROUP BY DATE(created_at)
        ),
        weekly_metrics AS (
            SELECT 
                DATE_TRUNC('week', created_at) as week,
                COUNT(DISTINCT user_id) as weekly_active_users
            FROM user_behavior_logs
            WHERE created_at BETWEEN %(start_date)s AND %(end_date)s
            GROUP BY DATE_TRUNC('week', created_at)
        ),
        monthly_metrics AS (
            SELECT 
                DATE_TRUNC('month', created_at) as month,
                COUNT(DISTINCT user_id) as monthly_active_users
            FROM user_behavior_logs
            WHERE created_at BETWEEN %(start_date)s AND %(end_date)s
            GROUP BY DATE_TRUNC('month', created_at)
        )
        SELECT 
            'DAU' as metric_name,
            AVG(daily_active_users) as avg_value,
            MAX(daily_active_users) as max_value,
            MIN(daily_active_users) as min_value
        FROM daily_metrics
        
        UNION ALL
        
        SELECT 
            'WAU' as metric_name,
            AVG(weekly_active_users) as avg_value,
            MAX(weekly_active_users) as max_value,
            MIN(weekly_active_users) as min_value
        FROM weekly_metrics
        
        UNION ALL
        
        SELECT 
            'MAU' as metric_name,
            AVG(monthly_active_users) as avg_value,
            MAX(monthly_active_users) as max_value,
            MIN(monthly_active_users) as min_value
        FROM monthly_metrics
        """
        
        kpi_data = self.execute_query(
            kpi_query,
            {'start_date': start_date, 'end_date': end_date}
        )
        
        # 增長指標
        growth_query = """
        WITH monthly_stats AS (
            SELECT 
                DATE_TRUNC('month', created_at) as month,
                COUNT(*) as new_users
            FROM users
            WHERE created_at BETWEEN %(start_date)s AND %(end_date)s
            GROUP BY DATE_TRUNC('month', created_at)
            ORDER BY month
        )
        SELECT 
            month,
            new_users,
            LAG(new_users) OVER (ORDER BY month) as prev_month_users,
            CASE 
                WHEN LAG(new_users) OVER (ORDER BY month) > 0 THEN
                    ROUND((new_users - LAG(new_users) OVER (ORDER BY month))::numeric / 
                          LAG(new_users) OVER (ORDER BY month) * 100, 2)
                ELSE 0
            END as growth_rate
        FROM monthly_stats
        """
        
        growth_data = self.execute_query(
            growth_query,
            {'start_date': start_date, 'end_date': end_date}
        )
        
        return {
            'key_metrics': kpi_data.to_dict('records'),
            'growth_metrics': growth_data.to_dict('records')
        }
    
    def generate_dashboard_data(self, date_range='30d'):
        """生成儀表板數據"""
        # 解析日期範圍
        if date_range == '7d':
            start_date = datetime.now() - timedelta(days=7)
        elif date_range == '30d':
            start_date = datetime.now() - timedelta(days=30)
        elif date_range == '90d':
            start_date = datetime.now() - timedelta(days=90)
        else:
            start_date = datetime.now() - timedelta(days=30)
        
        end_date = datetime.now()
        
        # 並行獲取各類分析數據
        with ThreadPoolExecutor(max_workers=4) as executor:
            user_future = executor.submit(self.get_user_analytics, start_date, end_date)
            content_future = executor.submit(self.get_content_analytics, start_date, end_date)
            social_future = executor.submit(self.get_social_analytics, start_date, end_date)
            business_future = executor.submit(self.get_business_metrics, start_date, end_date)
            
            # 獲取結果
            user_analytics = user_future.result()
            content_analytics = content_future.result()
            social_analytics = social_future.result()
            business_metrics = business_future.result()
        
        return {
            'user_analytics': user_analytics,
            'content_analytics': content_analytics,
            'social_analytics': social_analytics,
            'business_metrics': business_metrics,
            'generated_at': datetime.now().isoformat(),
            'date_range': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat()
            }
        }
    
    def create_visualization(self, data_type, data, chart_type='line'):
        """創建數據可視化"""
        if data_type == 'user_registration':
            df = pd.DataFrame(data)
            if chart_type == 'line':
                fig = px.line(df, x='date', y='new_users', 
                             title='用戶註冊趨勢')
            else:
                fig = px.bar(df, x='date', y='new_users', 
                            title='用戶註冊趨勢')
        
        elif data_type == 'content_engagement':
            df = pd.DataFrame(data)
            fig = make_subplots(
                rows=2, cols=2,
                subplot_titles=('讚數趨勢', '評論趨勢', '分享趨勢', '貼文數趨勢')
            )
            
            fig.add_trace(
                go.Scatter(x=df['date'], y=df['total_likes'], name='讚數'),
                row=1, col=1
            )
            fig.add_trace(
                go.Scatter(x=df['date'], y=df['total_comments'], name='評論數'),
                row=1, col=2
            )
            fig.add_trace(
                go.Scatter(x=df['date'], y=df['total_shares'], name='分享數'),
                row=2, col=1
            )
            fig.add_trace(
                go.Scatter(x=df['date'], y=df['total_posts'], name='貼文數'),
                row=2, col=2
            )
        
        elif data_type == 'user_retention':
            df = pd.DataFrame(data)
            fig = go.Figure()
            
            fig.add_trace(go.Scatter(
                x=df['cohort_date'], 
                y=df['day_1_retention_rate'],
                name='1日留存率',
                line=dict(color='blue')
            ))
            
            fig.add_trace(go.Scatter(
                x=df['cohort_date'], 
                y=df['day_7_retention_rate'],
                name='7日留存率',
                line=dict(color='green')
            ))
            
            fig.add_trace(go.Scatter(
                x=df['cohort_date'], 
                y=df['day_30_retention_rate'],
                name='30日留存率',
                line=dict(color='red')
            ))
            
            fig.update_layout(title='用戶留存率分析')
        
        else:
            # 默認圖表
            fig = go.Figure()
            fig.add_annotation(text="暫無數據", x=0.5, y=0.5)
        
        return fig.to_json()
    
    def export_report(self, data, format='json', filename=None):
        """導出報表"""
        if not filename:
            filename = f"analytics_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        if format == 'json':
            filepath = f"{filename}.json"
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2, default=str)
        
        elif format == 'csv':
            # 將嵌套數據展平並導出為CSV
            flattened_data = []
            for key, value in data.items():
                if isinstance(value, list):
                    for item in value:
                        flattened_item = {'category': key}
                        flattened_item.update(item)
                        flattened_data.append(flattened_item)
            
            df = pd.DataFrame(flattened_data)
            filepath = f"{filename}.csv"
            df.to_csv(filepath, index=False, encoding='utf-8')
        
        elif format == 'excel':
            filepath = f"{filename}.xlsx"
            with pd.ExcelWriter(filepath, engine='openpyxl') as writer:
                for key, value in data.items():
                    if isinstance(value, list) and value:
                        df = pd.DataFrame(value)
                        df.to_excel(writer, sheet_name=key[:31], index=False)
        
        self.logger.info(f"報表已導出: {filepath}")
        return filepath
```

#### 2.2.2 實時監控系統

```python
# 實時監控與告警系統
import asyncio
import websockets
import json
from datetime import datetime, timedelta
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import requests
from typing import Dict, List, Callable

class RealTimeMonitor:
    def __init__(self, analytics_engine, alert_config):
        self.analytics_engine = analytics_engine
        self.alert_config = alert_config
        self.alert_rules = []
        self.websocket_clients = set()
        self.monitoring_active = False
        self.setup_logging()
    
    def setup_logging(self):
        """設置日誌記錄"""
        self.logger = logging.getLogger(__name__)
    
    def add_alert_rule(self, name, condition, threshold, action):
        """添加告警規則"""
        rule = {
            'name': name,
            'condition': condition,  # 函數，返回數值
            'threshold': threshold,
            'action': action,  # 告警動作
            'last_triggered': None,
            'cooldown': 300  # 5分鐘冷卻期
        }
        self.alert_rules.append(rule)
    
    def setup_default_rules(self):
        """設置默認監控規則"""
        # 用戶活躍度異常
        self.add_alert_rule(
            name="低活躍度告警",
            condition=lambda: self.get_current_active_users(),
            threshold=10,  # 當前活躍用戶少於10人
            action=self.send_low_activity_alert
        )
        
        # 錯誤率異常
        self.add_alert_rule(
            name="高錯誤率告警",
            condition=lambda: self.get_error_rate(),
            threshold=0.05,  # 錯誤率超過5%
            action=self.send_error_rate_alert
        )
        
        # 內容發布異常
        self.add_alert_rule(
            name="內容發布異常",
            condition=lambda: self.get_content_publish_rate(),
            threshold=1,  # 每小時發布少於1篇
            action=self.send_content_alert
        )
    
    def get_current_active_users(self):
        """獲取當前活躍用戶數"""
        query = """
        SELECT COUNT(DISTINCT user_id) as active_users
        FROM user_behavior_logs
        WHERE created_at >= NOW() - INTERVAL '1 hour'
        """
        
        result = self.analytics_engine.execute_query(query, use_cache=False)
        return result.iloc[0]['active_users'] if len(result) > 0 else 0
    
    def get_error_rate(self):
        """獲取錯誤率"""
        # 這裡應該從應用日誌或監控系統獲取錯誤率
        # 暫時返回模擬數據
        return 0.02
    
    def get_content_publish_rate(self):
        """獲取內容發布率"""
        query = """
        SELECT COUNT(*) as posts_count
        FROM posts
        WHERE created_at >= NOW() - INTERVAL '1 hour'
        """
        
        result = self.analytics_engine.execute_query(query, use_cache=False)
        return result.iloc[0]['posts_count'] if len(result) > 0 else 0
    
    def check_alert_rules(self):
        """檢查告警規則"""
        current_time = datetime.now()
        
        for rule in self.alert_rules:
            try:
                # 檢查冷卻期
                if (rule['last_triggered'] and 
                    (current_time - rule['last_triggered']).seconds < rule['cooldown']):
                    continue
                
                # 執行條件檢查
                current_value = rule['condition']()
                
                # 判斷是否觸發告警
                if current_value < rule['threshold']:
                    rule['last_triggered'] = current_time
                    rule['action'](rule['name'], current_value, rule['threshold'])
                    
                    self.logger.warning(
                        f"告警觸發: {rule['name']}, 當前值: {current_value}, 閾值: {rule['threshold']}"
                    )
                    
            except Exception as e:
                self.logger.error(f"告警規則檢查失敗 {rule['name']}: {e}")
    
    def send_low_activity_alert(self, rule_name, current_value, threshold):
        """發送低活躍度告警"""
        message = f"告警: {rule_name}\n當前活躍用戶: {current_value}\n閾值: {threshold}"
        self.send_alert(message)
    
    def send_error_rate_alert(self, rule_name, current_value, threshold):
        """發送錯誤率告警"""
        message = f"告警: {rule_name}\n當前錯誤率: {current_value:.2%}\n閾值: {threshold:.2%}"
        self.send_alert(message)
    
    def send_content_alert(self, rule_name, current_value, threshold):
        """發送內容發布告警"""
        message = f"告警: {rule_name}\n當前發布率: {current_value}/小時\n閾值: {threshold}/小時"
        self.send_alert(message)
    
    def send_alert(self, message):
        """發送告警通知"""
        # 發送郵件
        if self.alert_config.get('email_enabled'):
            self.send_email_alert(message)
        
        # 發送Slack通知
        if self.alert_config.get('slack_enabled'):
            self.send_slack_alert(message)
        
        # WebSocket實時通知
        asyncio.create_task(self.broadcast_alert(message))
    
    def send_email_alert(self, message):
        """發送郵件告警"""
        try:
            smtp_config = self.alert_config['email']
            
            msg = MIMEMultipart()
            msg['From'] = smtp_config['from']
            msg['To'] = ', '.join(smtp_config['to'])
            msg['Subject'] = "MKing Friend 系統告警"
            
            msg.attach(MIMEText(message, 'plain', 'utf-8'))
            
            server = smtplib.SMTP(smtp_config['host'], smtp_config['port'])
            server.starttls()
            server.login(smtp_config['username'], smtp_config['password'])
            server.send_message(msg)
            server.quit()
            
            self.logger.info("郵件告警發送成功")
            
        except Exception as e:
            self.logger.error(f"郵件告警發送失敗: {e}")
    
    def send_slack_alert(self, message):
        """發送Slack告警"""
        try:
            slack_config = self.alert_config['slack']
            
            payload = {
                'text': f"🚨 MKing Friend 告警\n{message}",
                'channel': slack_config['channel'],
                'username': 'MonitorBot'
            }
            
            response = requests.post(
                slack_config['webhook_url'],
                json=payload,
                timeout=10
            )
            
            if response.status_code == 200:
                self.logger.info("Slack告警發送成功")
            else:
                self.logger.error(f"Slack告警發送失敗: {response.status_code}")
                
        except Exception as e:
            self.logger.error(f"Slack告警發送失敗: {e}")
    
    async def broadcast_alert(self, message):
        """廣播告警到WebSocket客戶端"""
        if self.websocket_clients:
            alert_data = {
                'type': 'alert',
                'message': message,
                'timestamp': datetime.now().isoformat()
            }
            
            # 向所有連接的客戶端發送告警
            disconnected_clients = set()
            for client in self.websocket_clients:
                try:
                    await client.send(json.dumps(alert_data))
                except websockets.exceptions.ConnectionClosed:
                    disconnected_clients.add(client)
            
            # 移除斷開的連接
            self.websocket_clients -= disconnected_clients
    
    async def websocket_handler(self, websocket, path):
        """WebSocket連接處理"""
        self.websocket_clients.add(websocket)
        self.logger.info(f"新的WebSocket連接: {websocket.remote_address}")
        
        try:
            async for message in websocket:
                # 處理客戶端消息
                data = json.loads(message)
                
                if data.get('type') == 'get_metrics':
                    # 發送實時指標
                    metrics = self.get_real_time_metrics()
                    await websocket.send(json.dumps({
                        'type': 'metrics',
                        'data': metrics,
                        'timestamp': datetime.now().isoformat()
                    }))
                    
        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            self.websocket_clients.discard(websocket)
            self.logger.info(f"WebSocket連接斷開: {websocket.remote_address}")
    
    def get_real_time_metrics(self):
        """獲取實時指標"""
        return {
            'active_users': self.get_current_active_users(),
            'error_rate': self.get_error_rate(),
            'content_publish_rate': self.get_content_publish_rate(),
            'timestamp': datetime.now().isoformat()
        }
    
    async def start_monitoring(self):
        """開始監控"""
        self.monitoring_active = True
        self.setup_default_rules()
        
        self.logger.info("實時監控已啟動")
        
        while self.monitoring_active:
            try:
                # 檢查告警規則
                self.check_alert_rules()
                
                # 廣播實時指標
                if self.websocket_clients:
                    metrics = self.get_real_time_metrics()
                    await self.broadcast_metrics(metrics)
                
                # 等待30秒
                await asyncio.sleep(30)
                
            except Exception as e:
                self.logger.error(f"監控循環錯誤: {e}")
                await asyncio.sleep(5)
    
    async def broadcast_metrics(self, metrics):
        """廣播實時指標"""
        metrics_data = {
            'type': 'metrics_update',
            'data': metrics
        }
        
        disconnected_clients = set()
        for client in self.websocket_clients:
            try:
                await client.send(json.dumps(metrics_data))
            except websockets.exceptions.ConnectionClosed:
                disconnected_clients.add(client)
        
        self.websocket_clients -= disconnected_clients
    
    def stop_monitoring(self):
        """停止監控"""
        self.monitoring_active = False
        self.logger.info("實時監控已停止")
```

### 2.3 報表生成系統

```python
# 自動化報表生成系統
from jinja2 import Template
import pdfkit
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
import seaborn as sns
import base64
from io import BytesIO

class ReportGenerator:
    def __init__(self, analytics_engine):
        self.analytics_engine = analytics_engine
        self.setup_logging()
        
        # 設置中文字體
        plt.rcParams['font.sans-serif'] = ['SimHei', 'Arial Unicode MS']
        plt.rcParams['axes.unicode_minus'] = False
    
    def setup_logging(self):
        """設置日誌記錄"""
        self.logger = logging.getLogger(__name__)
    
    def generate_chart(self, data, chart_type, title, figsize=(10, 6)):
        """生成圖表"""
        plt.figure(figsize=figsize)
        
        if chart_type == 'line':
            df = pd.DataFrame(data)
            plt.plot(df.iloc[:, 0], df.iloc[:, 1])
            plt.xticks(rotation=45)
        
        elif chart_type == 'bar':
            df = pd.DataFrame(data)
            plt.bar(df.iloc[:, 0], df.iloc[:, 1])
            plt.xticks(rotation=45)
        
        elif chart_type == 'pie':
            df = pd.DataFrame(data)
            plt.pie(df.iloc[:, 1], labels=df.iloc[:, 0], autopct='%1.1f%%')
        
        elif chart_type == 'heatmap':
            df = pd.DataFrame(data)
            sns.heatmap(df, annot=True, cmap='YlOrRd')
        
        plt.title(title)
        plt.tight_layout()
        
        # 轉換為base64字符串
        buffer = BytesIO()
        plt.savefig(buffer, format='png', dpi=300, bbox_inches='tight')
        buffer.seek(0)
        chart_base64 = base64.b64encode(buffer.getvalue()).decode()
        plt.close()
        
        return chart_base64
    
    def generate_daily_report(self, date=None):
        """生成日報"""
        if not date:
            date = datetime.now().date()
        
        start_date = datetime.combine(date, datetime.min.time())
        end_date = start_date + timedelta(days=1)
        
        # 獲取數據
        user_data = self.analytics_engine.get_user_analytics(start_date, end_date)
        content_data = self.analytics_engine.get_content_analytics(start_date, end_date)
        social_data = self.analytics_engine.get_social_analytics(start_date, end_date)
        
        # 生成圖表
        charts = {}
        
        # 用戶活躍度圖表
        if user_data['activity_trend']:
            charts['user_activity'] = self.generate_chart(
                [(item['date'], item['daily_active_users']) for item in user_data['activity_trend']],
                'line',
                '日活躍用戶趨勢'
            )
        
        # 內容發布圖表
        if content_data['content_trend']:
            charts['content_trend'] = self.generate_chart(
                [(item['date'], item['posts_count']) for item in content_data['content_trend']],
                'bar',
                '內容發布趨勢'
            )
        
        # 互動分佈圖表
        if social_data['interaction_trend']:
            interaction_summary = {}
            for item in social_data['interaction_trend']:
                interaction_type = item['interaction_type']
                if interaction_type not in interaction_summary:
                    interaction_summary[interaction_type] = 0
                interaction_summary[interaction_type] += item['count']
            
            charts['interaction_distribution'] = self.generate_chart(
                list(interaction_summary.items()),
                'pie',
                '互動類型分佈'
            )
        
        # 準備報表數據
        report_data = {
            'date': date.strftime('%Y-%m-%d'),
            'generated_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'user_data': user_data,
            'content_data': content_data,
            'social_data': social_data,
            'charts': charts,
            'summary': self.generate_daily_summary(user_data, content_data, social_data)
        }
        
        return report_data
    
    def generate_weekly_report(self, week_start=None):
        """生成週報"""
        if not week_start:
            today = datetime.now().date()
            week_start = today - timedelta(days=today.weekday())
        
        start_date = datetime.combine(week_start, datetime.min.time())
        end_date = start_date + timedelta(days=7)
        
        # 獲取數據
        user_data = self.analytics_engine.get_user_analytics(start_date, end_date)
        content_data = self.analytics_engine.get_content_analytics(start_date, end_date)
        social_data = self.analytics_engine.get_social_analytics(start_date, end_date)
        business_data = self.analytics_engine.get_business_metrics(start_date, end_date)
        
        # 生成圖表
        charts = {}
        
        # 用戶註冊趨勢
        if user_data['registration_trend']:
            charts['registration_trend'] = self.generate_chart(
                [(item['date'], item['new_users']) for item in user_data['registration_trend']],
                'line',
                '用戶註冊趨勢'
            )
        
        # 內容類型分佈
        if content_data['content_type_distribution']:
            charts['content_type_dist'] = self.generate_chart(
                [(item['content_type'], item['count']) for item in content_data['content_type_distribution']],
                'bar',
                '內容類型分佈'
            )
        
        # 用戶留存率
        if user_data['retention_analysis']:
            retention_data = user_data['retention_analysis']
            charts['retention_analysis'] = self.generate_chart(
                [(item['cohort_date'], item['day_7_retention_rate']) for item in retention_data],
                'line',
                '7日留存率趨勢'
            )
        
        # 準備報表數據
        report_data = {
            'week_start': week_start.strftime('%Y-%m-%d'),
            'week_end': (week_start + timedelta(days=6)).strftime('%Y-%m-%d'),
            'generated_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'user_data': user_data,
            'content_data': content_data,
            'social_data': social_data,
            'business_data': business_data,
            'charts': charts,
            'summary': self.generate_weekly_summary(user_data, content_data, social_data, business_data)
        }
        
        return report_data
    
    def generate_monthly_report(self, month_start=None):
        """生成月報"""
        if not month_start:
            today = datetime.now().date()
            month_start = today.replace(day=1)
        
        start_date = datetime.combine(month_start, datetime.min.time())
        # 計算月末
        if month_start.month == 12:
            next_month = month_start.replace(year=month_start.year + 1, month=1)
        else:
            next_month = month_start.replace(month=month_start.month + 1)
        end_date = datetime.combine(next_month, datetime.min.time())
        
        # 獲取數據
        user_data = self.analytics_engine.get_user_analytics(start_date, end_date)
        content_data = self.analytics_engine.get_content_analytics(start_date, end_date)
        social_data = self.analytics_engine.get_social_analytics(start_date, end_date)
        business_data = self.analytics_engine.get_business_metrics(start_date, end_date)
        
        # 生成更詳細的圖表
        charts = {}
        
        # 多維度用戶分析
        if user_data['registration_trend'] and user_data['activity_trend']:
            # 創建雙軸圖表
            fig, ax1 = plt.subplots(figsize=(12, 6))
            
            reg_data = user_data['registration_trend']
            act_data = user_data['activity_trend']
            
            dates = [item['date'] for item in reg_data]
            new_users = [item['new_users'] for item in reg_data]
            
            ax1.plot(dates, new_users, 'b-', label='新用戶註冊')
            ax1.set_xlabel('日期')
            ax1.set_ylabel('新用戶數', color='b')
            ax1.tick_params(axis='y', labelcolor='b')
            
            ax2 = ax1.twinx()
            if act_data:
                active_users = [item['daily_active_users'] for item in act_data]
                ax2.plot(dates[:len(active_users)], active_users, 'r-', label='日活躍用戶')
                ax2.set_ylabel('活躍用戶數', color='r')
                ax2.tick_params(axis='y', labelcolor='r')
            
            plt.title('用戶增長與活躍度分析')
            plt.xticks(rotation=45)
            plt.tight_layout()
            
            buffer = BytesIO()
            plt.savefig(buffer, format='png', dpi=300, bbox_inches='tight')
            buffer.seek(0)
            charts['user_comprehensive'] = base64.b64encode(buffer.getvalue()).decode()
            plt.close()
        
        # 內容表現熱力圖
        if content_data['engagement_analysis']:
            engagement_df = pd.DataFrame(content_data['engagement_analysis'])
            if len(engagement_df) > 0:
                # 創建相關性矩陣
                corr_columns = ['total_likes', 'total_comments', 'total_shares', 'total_posts']
                available_columns = [col for col in corr_columns if col in engagement_df.columns]
                
                if len(available_columns) > 1:
                    corr_matrix = engagement_df[available_columns].corr()
                    
                    plt.figure(figsize=(8, 6))
                    sns.heatmap(corr_matrix, annot=True, cmap='coolwarm', center=0)
                    plt.title('內容互動指標相關性分析')
                    plt.tight_layout()
                    
                    buffer = BytesIO()
                    plt.savefig(buffer, format='png', dpi=300, bbox_inches='tight')
                    buffer.seek(0)
                    charts['engagement_correlation'] = base64.b64encode(buffer.getvalue()).decode()
                    plt.close()
        
        # 準備報表數據
        report_data = {
            'month': month_start.strftime('%Y-%m'),
            'generated_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'user_data': user_data,
            'content_data': content_data,
            'social_data': social_data,
            'business_data': business_data,
            'charts': charts,
            'summary': self.generate_monthly_summary(user_data, content_data, social_data, business_data),
            'recommendations': self.generate_recommendations(user_data, content_data, social_data, business_data)
        }
        
        return report_data
    
    def generate_daily_summary(self, user_data, content_data, social_data):
        """生成日報摘要"""
        summary = {
            'total_active_users': 0,
            'total_new_posts': 0,
            'total_interactions': 0,
            'key_insights': []
        }
        
        # 計算總數
        if user_data['activity_trend']:
            summary['total_active_users'] = sum(item['daily_active_users'] for item in user_data['activity_trend'])
        
        if content_data['content_trend']:
            summary['total_new_posts'] = sum(item['posts_count'] for item in content_data['content_trend'])
        
        if social_data['interaction_trend']:
            summary['total_interactions'] = sum(item['count'] for item in social_data['interaction_trend'])
        
        # 生成洞察
        if summary['total_active_users'] > 100:
            summary['key_insights'].append("用戶活躍度表現良好")
        elif summary['total_active_users'] < 50:
            summary['key_insights'].append("用戶活躍度偏低，需要關注")
        
        if summary['total_new_posts'] > 50:
            summary['key_insights'].append("內容創作活躍")
        elif summary['total_new_posts'] < 10:
            summary['key_insights'].append("內容創作不足，需要激勵措施")
        
        return summary
    
    def generate_weekly_summary(self, user_data, content_data, social_data, business_data):
        """生成週報摘要"""
        summary = {
            'new_users': 0,
            'avg_daily_active': 0,
            'total_content': 0,
            'engagement_rate': 0,
            'growth_insights': []
        }
        
        # 計算指標
        if user_data['registration_trend']:
            summary['new_users'] = sum(item['new_users'] for item in user_data['registration_trend'])
        
        if user_data['activity_trend']:
            daily_active = [item['daily_active_users'] for item in user_data['activity_trend']]
            summary['avg_daily_active'] = sum(daily_active) / len(daily_active) if daily_active else 0
        
        if content_data['content_trend']:
            summary['total_content'] = sum(item['posts_count'] for item in content_data['content_trend'])
        
        # 計算參與率
        if content_data['engagement_analysis']:
            engagement = content_data['engagement_analysis']
            total_engagement = sum(item.get('total_likes', 0) + item.get('total_comments', 0) + item.get('total_shares', 0) for item in engagement)
            total_posts = sum(item.get('total_posts', 0) for item in engagement)
            summary['engagement_rate'] = total_engagement / total_posts if total_posts > 0 else 0
        
        return summary
    
    def generate_monthly_summary(self, user_data, content_data, social_data, business_data):
        """生成月報摘要"""
        summary = {
            'monthly_growth': 0,
            'content_performance': {},
            'user_engagement': {},
            'key_achievements': [],
            'areas_for_improvement': []
        }
        
        # 計算月度增長
        if business_data['growth_metrics']:
            growth_data = business_data['growth_metrics']
            if growth_data:
                latest_growth = growth_data[-1]
                summary['monthly_growth'] = latest_growth.get('growth_rate', 0)
        
        # 內容表現分析
        if content_data['content_type_distribution']:
            content_types = content_data['content_type_distribution']
            best_performing = max(content_types, key=lambda x: x.get('avg_likes', 0))
            summary['content_performance'] = {
                'best_type': best_performing.get('content_type', 'unknown'),
                'avg_engagement': best_performing.get('avg_likes', 0)
            }
        
        # 用戶參與度
        if user_data['retention_analysis']:
            retention_data = user_data['retention_analysis']
            if retention_data:
                avg_retention = sum(item.get('day_7_retention_rate', 0) for item in retention_data) / len(retention_data)
                summary['user_engagement']['avg_7day_retention'] = round(avg_retention, 2)
        
        return summary
    
    def generate_recommendations(self, user_data, content_data, social_data, business_data):
        """生成改進建議"""
        recommendations = []
        
        # 用戶增長建議
        if user_data['registration_trend']:
            recent_registrations = user_data['registration_trend'][-7:] if len(user_data['registration_trend']) >= 7 else user_data['registration_trend']
            avg_daily_reg = sum(item['new_users'] for item in recent_registrations) / len(recent_registrations) if recent_registrations else 0
            
            if avg_daily_reg < 5:
                recommendations.append({
                    'category': '用戶增長',
                    'priority': 'high',
                    'suggestion': '日均新用戶註冊偏低，建議加強推廣活動和用戶推薦機制',
                    'expected_impact': '提升20-30%新用戶註冊率'
                })
        
        # 內容策略建議
        if content_data['content_type_distribution']:
            content_types = content_data['content_type_distribution']
            if content_types:
                best_type = max(content_types, key=lambda x: x.get('avg_likes', 0))
                recommendations.append({
                    'category': '內容策略',
                    'priority': 'medium',
                    'suggestion': f"鼓勵更多{best_type['content_type']}類型內容創作，該類型平均獲得{best_type.get('avg_likes', 0):.1f}個讚",
                    'expected_impact': '提升整體內容參與度15-25%'
                })
        
        # 用戶留存建議
        if user_data['retention_analysis']:
            retention_data = user_data['retention_analysis']
            if retention_data:
                avg_7day_retention = sum(item.get('day_7_retention_rate', 0) for item in retention_data) / len(retention_data)
                if avg_7day_retention < 30:
                    recommendations.append({
                        'category': '用戶留存',
                        'priority': 'high',
                        'suggestion': '7日留存率偏低，建議優化新用戶引導流程和早期互動體驗',
                        'expected_impact': '提升7日留存率至35-40%'
                    })
        
        return recommendations
    
    def generate_html_report(self, report_data, template_type='daily'):
        """生成HTML報表"""
        # HTML模板
        if template_type == 'daily':
            template_str = """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>MKing Friend 日報 - {{ date }}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { background: #f4f4f4; padding: 20px; border-radius: 5px; }
                    .metric { display: inline-block; margin: 10px; padding: 15px; background: #e9e9e9; border-radius: 5px; }
                    .chart { text-align: center; margin: 20px 0; }
                    .insight { background: #fff3cd; padding: 10px; margin: 10px 0; border-radius: 5px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>MKing Friend 平台日報</h1>
                    <p>報表日期: {{ date }}</p>
                    <p>生成時間: {{ generated_at }}</p>
                </div>
                
                <div class="metrics">
                    <div class="metric">
                        <h3>活躍用戶</h3>
                        <p>{{ summary.total_active_users }}</p>
                    </div>
                    <div class="metric">
                        <h3>新發布內容</h3>
                        <p>{{ summary.total_new_posts }}</p>
                    </div>
                    <div class="metric">
                        <h3>總互動數</h3>
                        <p>{{ summary.total_interactions }}</p>
                    </div>
                </div>
                
                {% for chart_name, chart_data in charts.items() %}
                <div class="chart">
                    <h3>{{ chart_name }}</h3>
                    <img src="data:image/png;base64,{{ chart_data }}" alt="{{ chart_name }}">
                </div>
                {% endfor %}
                
                <div class="insights">
                    <h3>關鍵洞察</h3>
                    {% for insight in summary.key_insights %}
                    <div class="insight">{{ insight }}</div>
                    {% endfor %}
                </div>
            </body>
            </html>
            """
        
        elif template_type == 'weekly':
            template_str = """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>MKing Friend 週報 - {{ week_start }} 至 {{ week_end }}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { background: #f4f4f4; padding: 20px; border-radius: 5px; }
                    .section { margin: 30px 0; }
                    .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
                    .metric { padding: 15px; background: #e9e9e9; border-radius: 5px; text-align: center; }
                    .chart { text-align: center; margin: 20px 0; }
                    .summary { background: #d4edda; padding: 15px; border-radius: 5px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>MKing Friend 平台週報</h1>
                    <p>報表週期: {{ week_start }} 至 {{ week_end }}</p>
                    <p>生成時間: {{ generated_at }}</p>
                </div>
                
                <div class="section">
                    <h2>核心指標</h2>
                    <div class="metric-grid">
                        <div class="metric">
                            <h3>新用戶</h3>
                            <p>{{ summary.new_users }}</p>
                        </div>
                        <div class="metric">
                            <h3>平均日活</h3>
                            <p>{{ "%.1f"|format(summary.avg_daily_active) }}</p>
                        </div>
                        <div class="metric">
                            <h3>內容總數</h3>
                            <p>{{ summary.total_content }}</p>
                        </div>
                        <div class="metric">
                            <h3>參與率</h3>
                            <p>{{ "%.2f"|format(summary.engagement_rate) }}</p>
                        </div>
                    </div>
                </div>
                
                {% for chart_name, chart_data in charts.items() %}
                <div class="section">
                    <div class="chart">
                        <h3>{{ chart_name }}</h3>
                        <img src="data:image/png;base64,{{ chart_data }}" alt="{{ chart_name }}">
                    </div>
                </div>
                {% endfor %}
                
                <div class="section">
                    <div class="summary">
                        <h3>週度總結</h3>
                        <p>本週新增用戶 {{ summary.new_users }} 人，平均日活躍用戶 {{ "%.1f"|format(summary.avg_daily_active) }} 人。</p>
                        <p>內容創作活躍，共發布 {{ summary.total_content }} 篇內容，平均參與率為 {{ "%.2f"|format(summary.engagement_rate) }}。</p>
                    </div>
                </div>
            </body>
            </html>
            """
        
        else:  # monthly
            template_str = """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>MKing Friend 月報 - {{ month }}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; }
                    .section { margin: 40px 0; }
                    .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
                    .metric { padding: 20px; background: #f8f9fa; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                    .chart { text-align: center; margin: 30px 0; }
                    .recommendation { background: #fff3cd; padding: 15px; margin: 10px 0; border-left: 4px solid #ffc107; border-radius: 5px; }
                    .high-priority { border-left-color: #dc3545; }
                    .medium-priority { border-left-color: #fd7e14; }
                    .low-priority { border-left-color: #28a745; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>MKing Friend 平台月報</h1>
                    <p>報表月份: {{ month }}</p>
                    <p>生成時間: {{ generated_at }}</p>
                </div>
                
                <div class="section">
                    <h2>月度概覽</h2>
                    <div class="metric-grid">
                        <div class="metric">
                            <h3>月度增長率</h3>
                            <p>{{ "%.2f%"|format(summary.monthly_growth) }}</p>
                        </div>
                        <div class="metric">
                            <h3>最佳內容類型</h3>
                            <p>{{ summary.content_performance.best_type }}</p>
                            <small>平均 {{ "%.1f"|format(summary.content_performance.avg_engagement) }} 個讚</small>
                        </div>
                        <div class="metric">
                            <h3>7日留存率</h3>
                            <p>{{ "%.1f%"|format(summary.user_engagement.avg_7day_retention) }}</p>
                        </div>
                    </div>
                </div>
                
                {% for chart_name, chart_data in charts.items() %}
                <div class="section">
                    <div class="chart">
                        <h3>{{ chart_name }}</h3>
                        <img src="data:image/png;base64,{{ chart_data }}" alt="{{ chart_name }}">
                    </div>
                </div>
                {% endfor %}
                
                <div class="section">
                    <h2>改進建議</h2>
                    {% for rec in recommendations %}
                    <div class="recommendation {{ rec.priority }}-priority">
                        <h4>{{ rec.category }} ({{ rec.priority|upper }} 優先級)</h4>
                        <p><strong>建議:</strong> {{ rec.suggestion }}</p>
                        <p><strong>預期效果:</strong> {{ rec.expected_impact }}</p>
                    </div>
                    {% endfor %}
                </div>
            </body>
            </html>
            """
        
        # 渲染模板
        template = Template(template_str)
        html_content = template.render(**report_data)
        
        return html_content
    
    def generate_pdf_report(self, report_data, template_type='daily', output_path=None):
        """生成PDF報表"""
        # 生成HTML
        html_content = self.generate_html_report(report_data, template_type)
        
        # 設置PDF選項
        options = {
            'page-size': 'A4',
            'margin-top': '0.75in',
            'margin-right': '0.75in',
            'margin-bottom': '0.75in',
            'margin-left': '0.75in',
            'encoding': "UTF-8",
            'no-outline': None,
            'enable-local-file-access': None
        }
        
        # 生成PDF
        if not output_path:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            output_path = f"report_{template_type}_{timestamp}.pdf"
        
        try:
            pdfkit.from_string(html_content, output_path, options=options)
            self.logger.info(f"PDF報表已生成: {output_path}")
            return output_path
        except Exception as e:
            self.logger.error(f"PDF生成失敗: {e}")
            return None
```

## 3. 數據庫設計

### 3.1 分析數據表

```sql
-- 用戶行為分析表
CREATE TABLE user_behavior_analytics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    date DATE NOT NULL,
    session_count INTEGER DEFAULT 0,
    page_views INTEGER DEFAULT 0,
    time_spent INTEGER DEFAULT 0, -- 秒
    actions_count INTEGER DEFAULT 0,
    last_activity TIMESTAMP,
    device_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 內容表現分析表
CREATE TABLE content_performance_analytics (
    id SERIAL PRIMARY KEY,
    content_id INTEGER REFERENCES posts(id),
    date DATE NOT NULL,
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,4) DEFAULT 0,
    reach_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 社交互動分析表
CREATE TABLE social_interaction_analytics (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    follows_count INTEGER DEFAULT 0,
    unfollows_count INTEGER DEFAULT 0,
    mentions_count INTEGER DEFAULT 0,
    direct_messages_count INTEGER DEFAULT 0,
    group_interactions_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 業務指標表
CREATE TABLE business_metrics (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    metric_type VARCHAR(50), -- daily, weekly, monthly
    category VARCHAR(50), -- user, content, revenue, engagement
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 報表生成記錄表
CREATE TABLE report_generation_logs (
    id SERIAL PRIMARY KEY,
    report_type VARCHAR(50) NOT NULL, -- daily, weekly, monthly
    report_date DATE NOT NULL,
    generated_by INTEGER REFERENCES users(id),
    file_path VARCHAR(500),
    file_format VARCHAR(20), -- html, pdf, json, csv
    generation_time INTEGER, -- 生成耗時(秒)
    status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 自定義儀表板配置表
CREATE TABLE dashboard_configs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    dashboard_name VARCHAR(100) NOT NULL,
    config_json JSONB NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 數據導出記錄表
CREATE TABLE data_export_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    export_type VARCHAR(50) NOT NULL,
    date_range_start DATE,
    date_range_end DATE,
    filters_json JSONB,
    file_path VARCHAR(500),
    file_size INTEGER,
    export_time INTEGER, -- 導出耗時(秒)
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 告警規則配置表
CREATE TABLE alert_rules (
    id SERIAL PRIMARY KEY,
    rule_name VARCHAR(100) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    condition_type VARCHAR(20) NOT NULL, -- gt, lt, eq, gte, lte
    threshold_value DECIMAL(15,4) NOT NULL,
    alert_channels JSONB, -- email, slack, webhook
    is_active BOOLEAN DEFAULT TRUE,
    cooldown_minutes INTEGER DEFAULT 60,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 告警觸發記錄表
CREATE TABLE alert_triggers (
    id SERIAL PRIMARY KEY,
    rule_id INTEGER REFERENCES alert_rules(id),
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metric_value DECIMAL(15,4) NOT NULL,
    threshold_value DECIMAL(15,4) NOT NULL,
    alert_sent BOOLEAN DEFAULT FALSE,
    alert_channels_used JSONB,
    resolved_at TIMESTAMP,
    notes TEXT
);
```

### 3.2 索引優化

```sql
-- 用戶行為分析索引
CREATE INDEX idx_user_behavior_analytics_user_date ON user_behavior_analytics(user_id, date);
CREATE INDEX idx_user_behavior_analytics_date ON user_behavior_analytics(date);
CREATE INDEX idx_user_behavior_analytics_device ON user_behavior_analytics(device_type, date);

-- 內容表現分析索引
CREATE INDEX idx_content_performance_content_date ON content_performance_analytics(content_id, date);
CREATE INDEX idx_content_performance_date ON content_performance_analytics(date);
CREATE INDEX idx_content_performance_engagement ON content_performance_analytics(engagement_rate DESC, date);

-- 社交互動分析索引
CREATE INDEX idx_social_interaction_date ON social_interaction_analytics(date);

-- 業務指標索引
CREATE INDEX idx_business_metrics_name_date ON business_metrics(metric_name, date);
CREATE INDEX idx_business_metrics_type_category ON business_metrics(metric_type, category, date);
CREATE INDEX idx_business_metrics_date ON business_metrics(date);

-- 報表生成記錄索引
CREATE INDEX idx_report_logs_type_date ON report_generation_logs(report_type, report_date);
CREATE INDEX idx_report_logs_user ON report_generation_logs(generated_by, created_at);
CREATE INDEX idx_report_logs_status ON report_generation_logs(status, created_at);

-- 儀表板配置索引
CREATE INDEX idx_dashboard_configs_user ON dashboard_configs(user_id, is_default);
CREATE INDEX idx_dashboard_configs_public ON dashboard_configs(is_public, created_at);

-- 數據導出記錄索引
CREATE INDEX idx_data_export_user_date ON data_export_logs(user_id, created_at);
CREATE INDEX idx_data_export_status ON data_export_logs(status, created_at);

-- 告警規則索引
CREATE INDEX idx_alert_rules_active ON alert_rules(is_active, metric_name);
CREATE INDEX idx_alert_rules_user ON alert_rules(created_by, is_active);

-- 告警觸發記錄索引
CREATE INDEX idx_alert_triggers_rule_time ON alert_triggers(rule_id, triggered_at);
CREATE INDEX idx_alert_triggers_unresolved ON alert_triggers(resolved_at) WHERE resolved_at IS NULL;
```

## 4. 系統架構設計

### 4.1 數據分析系統架構總覽

```
┌─────────────────────────────────────────────────────────────────┐
│                        數據分析與報表系統                          │
├─────────────────────────────────────────────────────────────────┤
│  前端層 (Frontend)                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   管理後台      │  │   儀表板界面    │  │   報表查看器    │ │
│  │   Dashboard     │  │   Analytics UI  │  │   Report Viewer │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  API層 (API Gateway)                                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   分析API       │  │   報表API       │  │   導出API       │ │
│  │   Analytics API │  │   Report API    │  │   Export API    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  服務層 (Services)                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   數據分析引擎  │  │   報表生成器    │  │   實時監控      │ │
│  │   Analytics     │  │   Report Gen    │  │   Real-time     │ │
│  │   Engine        │  │                 │  │   Monitor       │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   數據收集器    │  │   告警系統      │  │   任務調度器    │ │
│  │   Data Collector│  │   Alert System  │  │   Task Scheduler│ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  數據層 (Data Layer)                                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   PostgreSQL    │  │   Redis Cache   │  │   文件存儲      │ │
│  │   主數據庫      │  │   快取層        │  │   File Storage  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   時序數據庫    │  │   日誌存儲      │  │   備份存儲      │ │
│  │   TimescaleDB   │  │   Log Storage   │  │   Backup        │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 數據流程圖

```
用戶行為數據 ──┐
              │
內容互動數據 ──┼──► 數據收集器 ──► 數據預處理 ──► 數據存儲
              │                                    │
系統日誌數據 ──┘                                    │
                                                   ▼
實時監控 ◄──── 數據分析引擎 ◄─────────────────────── 數據查詢
    │              │                               │
    ▼              ▼                               ▼
告警通知      分析結果快取                    報表生成
    │              │                               │
    ▼              ▼                               ▼
通知發送      儀表板展示                      報表導出
```

## 5. 實施計劃

### 5.1 第一階段：基礎分析功能 (4-6週)

**核心功能**
- 基礎數據收集系統
- 用戶行為分析
- 內容表現分析
- 簡單儀表板
- 基礎報表生成

**技術實現**
- PostgreSQL 數據庫設計
- Python 分析引擎開發
- 基礎 Web 儀表板
- 日報/週報生成

**預期成果**
- 完成基礎數據分析功能
- 提供核心業務指標監控
- 支援基礎報表導出

### 5.2 第二階段：進階分析功能 (6-8週)

**核心功能**
- 實時數據監控
- 預測性分析
- 用戶留存分析
- 自定義儀表板
- 告警系統

**技術實現**
- Redis 快取層
- WebSocket 實時通信
- 機器學習模型
- 告警規則引擎
- 高級可視化

**預期成果**
- 實現實時監控能力
- 提供預測性洞察
- 支援自定義分析

### 5.3 第三階段：優化與擴展 (4-6週)

**核心功能**
- 性能優化
- 高級分析算法
- 多維度分析
- API 開放
- 移動端支援

**技術實現**
- 查詢優化
- 分散式處理
- 高級統計分析
- RESTful API
- 響應式設計

**預期成果**
- 系統性能大幅提升
- 支援複雜分析需求
- 提供完整 API 接口

## 6. 技術建議

### 6.1 推薦技術棧

**後端技術**
- **數據分析**: Python + Pandas + NumPy + SciPy
- **Web框架**: FastAPI / Flask
- **任務隊列**: Celery + Redis
- **數據庫**: PostgreSQL + TimescaleDB
- **快取**: Redis
- **監控**: Prometheus + Grafana

**前端技術**
- **框架**: React / Vue.js
- **圖表庫**: Chart.js / D3.js / Plotly.js
- **UI組件**: Ant Design / Material-UI
- **狀態管理**: Redux / Vuex

**數據處理**
- **ETL工具**: Apache Airflow (可選)
- **數據可視化**: Matplotlib + Seaborn
- **報表生成**: Jinja2 + wkhtmltopdf
- **機器學習**: Scikit-learn

### 6.2 成本估算

**開發成本**
- 第一階段: 320-480小時 (2-3人月)
- 第二階段: 480-640小時 (3-4人月)
- 第三階段: 320-480小時 (2-3人月)
- **總計**: 1120-1600小時 (7-10人月)

**運營成本** (月度)
- 服務器資源: $100-300
- 數據存儲: $50-150
- 第三方服務: $20-50
- **總計**: $170-500/月

### 6.3 關鍵指標

**系統性能**
- 查詢響應時間: <2秒
- 報表生成時間: <30秒
- 系統可用性: >99.5%
- 數據處理能力: >10萬條記錄/分鐘

**分析準確性**
- 數據準確率: >99%
- 預測準確率: >80%
- 異常檢測率: >95%

**用戶體驗**
- 儀表板載入時間: <3秒
- 報表導出成功率: >98%
- 用戶滿意度: >4.0/5.0

## 7. 風險評估與應對

### 7.1 技術風險

**數據處理性能瓶頸**
- **風險**: 大量數據處理導致系統響應緩慢
- **應對**: 實施數據分片、查詢優化、快取策略
- **預防**: 性能測試、容量規劃

**數據準確性問題**
- **風險**: 數據收集或處理錯誤影響分析結果
- **應對**: 數據驗證機制、多重校驗、異常檢測
- **預防**: 完善的測試覆蓋、數據品質監控

**系統擴展性限制**
- **風險**: 用戶增長導致系統無法承載
- **應對**: 微服務架構、水平擴展、負載均衡
- **預防**: 可擴展的架構設計、性能監控

### 7.2 業務風險

**數據隱私合規**
- **風險**: 違反數據保護法規
- **應對**: 數據匿名化、權限控制、合規審計
- **預防**: 隱私設計原則、法律諮詢

**分析結果誤導**
- **風險**: 錯誤的分析結論影響業務決策
- **應對**: 多維度驗證、專家審核、置信度標示
- **預防**: 統計學培訓、方法論標準化

## 8. 未來擴展規劃

### 8.1 中期功能 (6-12個月)

**智能化分析**
- 自動異常檢測
- 智能洞察生成
- 預測性維護
- 自適應告警閾值

**高級可視化**
- 3D數據可視化
- 互動式圖表
- 地理信息分析
- 實時數據流可視化

**協作功能**
- 報表分享與協作
- 註釋與討論
- 版本控制
- 團隊儀表板

### 8.2 長期功能 (1-2年)

**人工智能整合**
- 自然語言查詢
- 智能報表生成
- 自動化洞察發現
- 對話式分析界面

**大數據處理**
- 流式數據處理
- 分散式計算
- 實時機器學習
- 多源數據整合

**生態系統整合**
- 第三方數據源接入
- API生態建設
- 插件系統
- 開放平台

## 9. 注意事項

**技術選擇**
- 優先選擇開源免費技術，控制成本
- 確保技術棧的長期可維護性
- 考慮團隊技術能力和學習成本

**數據安全**
- 實施嚴格的數據訪問控制
- 定期進行安全審計
- 遵循數據保護最佳實踐

**性能優化**
- 從設計階段就考慮性能問題
- 實施有效的快取策略
- 定期進行性能調優

**用戶體驗**
- 簡化複雜的分析功能
- 提供直觀的可視化界面
- 確保系統響應速度

**持續改進**
- 收集用戶反饋並持續優化
- 跟蹤行業最佳實踐
- 定期評估和升級技術棧

---

*本規劃文件為 MKing Friend 平台數據分析與報表功能的詳細設計方案，以開源免費技術為主，旨在為平台提供強大的數據洞察能力，支援數據驅動的業務決策。*