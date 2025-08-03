# MKing Friend Platform - Data Analytics and Reporting Planning

## 1. Service Overview

### 1.1 Core Analytics Features

**Service Scope**
- User behavior analysis
- Content performance analysis
- Social interaction analysis
- Business metrics monitoring
- Real-time data monitoring
- Automated report generation
- Custom dashboard creation
- Data export and sharing

**Target Users**
- Platform administrators
- Operations team
- Marketing team
- Product managers
- Data analysts

**Service Objectives**
- Provide comprehensive data insights
- Support data-driven decision making
- Monitor platform health in real-time
- Optimize user experience
- Improve content strategy
- Enhance operational efficiency

### 1.2 Analysis Types

**Descriptive Analytics**
- Historical data analysis
- Trend identification
- Performance metrics
- Statistical summaries

**Diagnostic Analytics**
- Root cause analysis
- Correlation analysis
- Anomaly detection
- Performance bottleneck identification

**Predictive Analytics**
- User behavior prediction
- Content performance forecasting
- Growth trend prediction
- Churn risk assessment

**Prescriptive Analytics**
- Optimization recommendations
- Action plan suggestions
- Resource allocation guidance
- Strategy optimization

## 2. Technical Implementation

### 2.1 Data Analytics Technology Comparison

| Technology | Pros | Cons | Use Case | Recommendation |
|------------|------|------|----------|----------------|
| **Python + Pandas** | Flexible, rich ecosystem, easy to learn | Performance limitations for large datasets | Data processing, analysis, visualization | ⭐⭐⭐⭐⭐ |
| **Apache Spark** | High performance, distributed processing | Complex setup, resource intensive | Big data processing | ⭐⭐⭐ |
| **ClickHouse** | Excellent query performance, columnar storage | Limited ecosystem, learning curve | Real-time analytics | ⭐⭐⭐⭐ |
| **PostgreSQL + TimescaleDB** | Mature, reliable, time-series optimization | Limited scalability | Time-series data | ⭐⭐⭐⭐⭐ |
| **Grafana + Prometheus** | Excellent visualization, monitoring focus | Limited analytics capabilities | Monitoring dashboards | ⭐⭐⭐⭐ |

**Recommended Solution**: Python + Pandas + PostgreSQL + Grafana
- Cost-effective and open-source
- Suitable for medium-scale data processing
- Rich visualization capabilities
- Easy to maintain and extend

### 2.2 Core System Implementation

#### 2.2.1 Data Processing Engine

```python
# Data Analytics Engine
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import psycopg2
from sqlalchemy import create_engine
import redis
import logging
from concurrent.futures import ThreadPoolExecutor
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import json

class DataAnalyticsEngine:
    def __init__(self, db_config, redis_config):
        self.db_config = db_config
        self.redis_config = redis_config
        self.setup_connections()
        self.setup_logging()
    
    def setup_connections(self):
        """Setup database and cache connections"""
        # PostgreSQL connection
        db_url = f"postgresql://{self.db_config['user']}:{self.db_config['password']}@{self.db_config['host']}:{self.db_config['port']}/{self.db_config['database']}"
        self.engine = create_engine(db_url, pool_size=10, max_overflow=20)
        
        # Redis connection
        self.redis_client = redis.Redis(
            host=self.redis_config['host'],
            port=self.redis_config['port'],
            db=self.redis_config['db'],
            decode_responses=True
        )
    
    def setup_logging(self):
        """Setup logging configuration"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)
    
    def get_cache_key(self, query_type, params):
        """Generate cache key"""
        param_str = '_'.join([f"{k}_{v}" for k, v in sorted(params.items())])
        return f"analytics:{query_type}:{param_str}"
    
    def get_cached_data(self, cache_key):
        """Get data from cache"""
        try:
            cached_data = self.redis_client.get(cache_key)
            if cached_data:
                return pd.read_json(cached_data)
        except Exception as e:
            self.logger.warning(f"Cache read error: {e}")
        return None
    
    def set_cached_data(self, cache_key, data, expire_time=3600):
        """Set data to cache"""
        try:
            self.redis_client.setex(
                cache_key, 
                expire_time, 
                data.to_json()
            )
        except Exception as e:
            self.logger.warning(f"Cache write error: {e}")
    
    def execute_query(self, query, params=None, use_cache=True, cache_expire=3600):
        """Execute SQL query with caching support"""
        if use_cache and params:
            cache_key = self.get_cache_key('query', params)
            cached_result = self.get_cached_data(cache_key)
            if cached_result is not None:
                self.logger.info(f"Cache hit for query: {cache_key}")
                return cached_result
        
        try:
            result = pd.read_sql_query(query, self.engine, params=params)
            
            if use_cache and params:
                self.set_cached_data(cache_key, result, cache_expire)
            
            return result
        except Exception as e:
            self.logger.error(f"Query execution error: {e}")
            raise
    
    def get_user_analytics(self, start_date, end_date):
        """Get user analytics data"""
        # User registration trend
        registration_query = """
        SELECT 
            DATE(created_at) as date,
            COUNT(*) as new_users
        FROM users
        WHERE created_at BETWEEN %(start_date)s AND %(end_date)s
        GROUP BY DATE(created_at)
        ORDER BY date
        """
        
        registration_data = self.execute_query(
            registration_query,
            {'start_date': start_date, 'end_date': end_date}
        )
        
        # User activity trend
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
        
        # User retention analysis
        retention_query = """
        WITH user_cohorts AS (
            SELECT 
                user_id,
                DATE(created_at) as cohort_date
            FROM users
            WHERE created_at BETWEEN %(start_date)s AND %(end_date)s
        ),
        user_activities AS (
            SELECT 
                uc.user_id,
                uc.cohort_date,
                DATE(ubl.created_at) as activity_date,
                DATE(ubl.created_at) - uc.cohort_date as days_since_signup
            FROM user_cohorts uc
            LEFT JOIN user_behavior_logs ubl ON uc.user_id = ubl.user_id
            WHERE ubl.created_at >= uc.cohort_date
        )
        SELECT 
            cohort_date,
            COUNT(DISTINCT user_id) as cohort_size,
            COUNT(DISTINCT CASE WHEN days_since_signup = 1 THEN user_id END) as day_1_retained,
            COUNT(DISTINCT CASE WHEN days_since_signup = 7 THEN user_id END) as day_7_retained,
            COUNT(DISTINCT CASE WHEN days_since_signup = 30 THEN user_id END) as day_30_retained,
            ROUND(COUNT(DISTINCT CASE WHEN days_since_signup = 1 THEN user_id END)::numeric / COUNT(DISTINCT user_id) * 100, 2) as day_1_retention_rate,
            ROUND(COUNT(DISTINCT CASE WHEN days_since_signup = 7 THEN user_id END)::numeric / COUNT(DISTINCT user_id) * 100, 2) as day_7_retention_rate,
            ROUND(COUNT(DISTINCT CASE WHEN days_since_signup = 30 THEN user_id END)::numeric / COUNT(DISTINCT user_id) * 100, 2) as day_30_retention_rate
        FROM user_activities
        GROUP BY cohort_date
        ORDER BY cohort_date
        """
        
        retention_data = self.execute_query(
            retention_query,
            {'start_date': start_date, 'end_date': end_date}
        )
        
        # User behavior distribution
        behavior_query = """
        SELECT 
            device_type,
            COUNT(*) as session_count,
            AVG(time_spent) as avg_time_spent,
            AVG(page_views) as avg_page_views
        FROM user_behavior_logs
        WHERE created_at BETWEEN %(start_date)s AND %(end_date)s
        GROUP BY device_type
        ORDER BY session_count DESC
        """
        
        behavior_data = self.execute_query(
            behavior_query,
            {'start_date': start_date, 'end_date': end_date}
        )
        
        return {
            'registration_trend': registration_data.to_dict('records'),
            'activity_trend': activity_data.to_dict('records'),
            'retention_analysis': retention_data.to_dict('records'),
            'behavior_distribution': behavior_data.to_dict('records')
        }
    
    def get_content_analytics(self, start_date, end_date):
        """Get content analytics data"""
        # Content publishing trend
        content_trend_query = """
        SELECT 
            DATE(created_at) as date,
            COUNT(*) as posts_count,
            COUNT(DISTINCT user_id) as unique_authors
        FROM posts
        WHERE created_at BETWEEN %(start_date)s AND %(end_date)s
        GROUP BY DATE(created_at)
        ORDER BY date
        """
        
        content_trend_data = self.execute_query(
            content_trend_query,
            {'start_date': start_date, 'end_date': end_date}
        )
        
        # Popular content analysis
        popular_content_query = """
        SELECT 
            p.id,
            p.title,
            p.content_type,
            COUNT(DISTINCT l.user_id) as total_likes,
            COUNT(DISTINCT c.user_id) as total_comments,
            COUNT(DISTINCT s.user_id) as total_shares,
            (COUNT(DISTINCT l.user_id) + COUNT(DISTINCT c.user_id) + COUNT(DISTINCT s.user_id)) as total_engagement
        FROM posts p
        LEFT JOIN likes l ON p.id = l.post_id
        LEFT JOIN comments c ON p.id = c.post_id
        LEFT JOIN shares s ON p.id = s.post_id
        WHERE p.created_at BETWEEN %(start_date)s AND %(end_date)s
        GROUP BY p.id, p.title, p.content_type
        ORDER BY total_engagement DESC
        LIMIT 20
        """
        
        popular_content_data = self.execute_query(
            popular_content_query,
            {'start_date': start_date, 'end_date': end_date}
        )
        
        # Content type distribution
        content_type_query = """
        SELECT 
            content_type,
            COUNT(*) as count,
            AVG(COALESCE(like_count, 0)) as avg_likes,
            AVG(COALESCE(comment_count, 0)) as avg_comments,
            AVG(COALESCE(share_count, 0)) as avg_shares
        FROM posts
        WHERE created_at BETWEEN %(start_date)s AND %(end_date)s
        GROUP BY content_type
        ORDER BY count DESC
        """
        
        content_type_data = self.execute_query(
            content_type_query,
            {'start_date': start_date, 'end_date': end_date}
        )
        
        # Content engagement analysis
        engagement_query = """
        SELECT 
            DATE(p.created_at) as date,
            COUNT(DISTINCT p.id) as total_posts,
            COUNT(DISTINCT l.user_id) as total_likes,
            COUNT(DISTINCT c.user_id) as total_comments,
            COUNT(DISTINCT s.user_id) as total_shares
        FROM posts p
        LEFT JOIN likes l ON p.id = l.post_id AND l.created_at BETWEEN %(start_date)s AND %(end_date)s
        LEFT JOIN comments c ON p.id = c.post_id AND c.created_at BETWEEN %(start_date)s AND %(end_date)s
        LEFT JOIN shares s ON p.id = s.post_id AND s.created_at BETWEEN %(start_date)s AND %(end_date)s
        WHERE p.created_at BETWEEN %(start_date)s AND %(end_date)s
        GROUP BY DATE(p.created_at)
        ORDER BY date
        """
        
        engagement_data = self.execute_query(
            engagement_query,
            {'start_date': start_date, 'end_date': end_date}
        )
        
        return {
            'content_trend': content_trend_data.to_dict('records'),
            'popular_content': popular_content_data.to_dict('records'),
            'content_type_distribution': content_type_data.to_dict('records'),
            'engagement_analysis': engagement_data.to_dict('records')
        }
    
    def get_social_analytics(self, start_date, end_date):
        """Get social interaction analytics data"""
        # Follow relationship analysis
        follow_query = """
        SELECT 
            DATE(created_at) as date,
            COUNT(*) as new_follows
        FROM follows
        WHERE created_at BETWEEN %(start_date)s AND %(end_date)s
        GROUP BY DATE(created_at)
        ORDER BY date
        """
        
        follow_data = self.execute_query(
            follow_query,
            {'start_date': start_date, 'end_date': end_date}
        )
        
        # Interaction heat analysis
        interaction_query = """
        SELECT 
            'like' as interaction_type,
            DATE(created_at) as date,
            COUNT(*) as count
        FROM likes
        WHERE created_at BETWEEN %(start_date)s AND %(end_date)s
        GROUP BY DATE(created_at)
        
        UNION ALL
        
        SELECT 
            'comment' as interaction_type,
            DATE(created_at) as date,
            COUNT(*) as count
        FROM comments
        WHERE created_at BETWEEN %(start_date)s AND %(end_date)s
        GROUP BY DATE(created_at)
        
        UNION ALL
        
        SELECT 
            'share' as interaction_type,
            DATE(created_at) as date,
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
        
        # Social network analysis
        network_query = """
        SELECT 
            u.id as user_id,
            u.username,
            COUNT(DISTINCT f1.follower_id) as followers_count,
            COUNT(DISTINCT f2.following_id) as following_count,
            CASE 
                WHEN COUNT(DISTINCT f1.follower_id) > 1000 THEN 'influencer'
                WHEN COUNT(DISTINCT f1.follower_id) > 100 THEN 'active'
                ELSE 'regular'
            END as user_type
        FROM users u
        LEFT JOIN follows f1 ON u.id = f1.following_id
        LEFT JOIN follows f2 ON u.id = f2.follower_id
        WHERE u.created_at <= %(end_date)s
        GROUP BY u.id, u.username
        ORDER BY followers_count DESC
        LIMIT 100
        """
        
        network_data = self.execute_query(
            network_query,
            {'start_date': start_date, 'end_date': end_date}
        )
        
        return {
            'follow_trend': follow_data.to_dict('records'),
            'interaction_trend': interaction_data.to_dict('records'),
            'network_analysis': network_data.to_dict('records')
        }
    
    def get_business_metrics(self, start_date, end_date):
        """Get business metrics data"""
        # Key performance indicators
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
        
        # Growth metrics
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
        """Generate dashboard data"""
        # Parse date range
        if date_range == '7d':
            start_date = datetime.now() - timedelta(days=7)
        elif date_range == '30d':
            start_date = datetime.now() - timedelta(days=30)
        elif date_range == '90d':
            start_date = datetime.now() - timedelta(days=90)
        else:
            start_date = datetime.now() - timedelta(days=30)
        
        end_date = datetime.now()
        
        # Parallel data retrieval
        with ThreadPoolExecutor(max_workers=4) as executor:
            user_future = executor.submit(self.get_user_analytics, start_date, end_date)
            content_future = executor.submit(self.get_content_analytics, start_date, end_date)
            social_future = executor.submit(self.get_social_analytics, start_date, end_date)
            business_future = executor.submit(self.get_business_metrics, start_date, end_date)
            
            # Get results
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
        """Create data visualization"""
        if data_type == 'user_registration':
            df = pd.DataFrame(data)
            if chart_type == 'line':
                fig = px.line(df, x='date', y='new_users', 
                             title='User Registration Trend')
            else:
                fig = px.bar(df, x='date', y='new_users', 
                            title='User Registration Trend')
        
        elif data_type == 'content_engagement':
            df = pd.DataFrame(data)
            fig = make_subplots(
                rows=2, cols=2,
                subplot_titles=('Likes Trend', 'Comments Trend', 'Shares Trend', 'Posts Trend')
            )
            
            fig.add_trace(
                go.Scatter(x=df['date'], y=df['total_likes'], name='Likes'),
                row=1, col=1
            )
            fig.add_trace(
                go.Scatter(x=df['date'], y=df['total_comments'], name='Comments'),
                row=1, col=2
            )
            fig.add_trace(
                go.Scatter(x=df['date'], y=df['total_shares'], name='Shares'),
                row=2, col=1
            )
            fig.add_trace(
                go.Scatter(x=df['date'], y=df['total_posts'], name='Posts'),
                row=2, col=2
            )
        
        elif data_type == 'user_retention':
            df = pd.DataFrame(data)
            fig = go.Figure()
            
            fig.add_trace(go.Scatter(
                x=df['cohort_date'], 
                y=df['day_1_retention_rate'],
                name='1-Day Retention Rate',
                line=dict(color='blue')
            ))
            
            fig.add_trace(go.Scatter(
                x=df['cohort_date'], 
                y=df['day_7_retention_rate'],
                name='7-Day Retention Rate',
                line=dict(color='green')
            ))
            
            fig.add_trace(go.Scatter(
                x=df['cohort_date'], 
                y=df['day_30_retention_rate'],
                name='30-Day Retention Rate',
                line=dict(color='red')
            ))
            
            fig.update_layout(title='User Retention Rate Analysis')
        
        else:
            # Default chart
            fig = go.Figure()
            fig.add_annotation(text="No data available", x=0.5, y=0.5)
        
        return fig.to_json()
    
    def export_report(self, data, format='json', filename=None):
        """Export report"""
        if not filename:
            filename = f"analytics_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        if format == 'json':
            filepath = f"{filename}.json"
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2, default=str)
        
        elif format == 'csv':
            # Flatten nested data and export as CSV
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
        
        self.logger.info(f"Report exported: {filepath}")
        return filepath
```

#### 2.2.2 Real-time Monitoring System

```python
# Real-time monitoring and alerting system
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
        """Setup logging"""
        self.logger = logging.getLogger(__name__)
    
    def add_alert_rule(self, name, condition, threshold, action):
        """Add alert rule"""
        rule = {
            'name': name,
            'condition': condition,  # Function that returns a value
            'threshold': threshold,
            'action': action,  # Alert action
            'last_triggered': None,
            'cooldown': 300  # 5-minute cooldown
        }
        self.alert_rules.append(rule)
    
    def setup_default_rules(self):
        """Setup default monitoring rules"""
        # Low user activity alert
        self.add_alert_rule(
            name="Low Activity Alert",
            condition=lambda: self.get_current_active_users(),
            threshold=10,  # Less than 10 active users
            action=self.send_low_activity_alert
        )
        
        # High error rate alert
        self.add_alert_rule(
            name="High Error Rate Alert",
            condition=lambda: self.get_error_rate(),
            threshold=0.05,  # Error rate above 5%
            action=self.send_error_rate_alert
        )
        
        # Content publishing anomaly
        self.add_alert_rule(
            name="Content Publishing Anomaly",
            condition=lambda: self.get_content_publish_rate(),
            threshold=1,  # Less than 1 post per hour
            action=self.send_content_alert
        )
    
    def get_current_active_users(self):
        """Get current active user count"""
        query = """
        SELECT COUNT(DISTINCT user_id) as active_users
        FROM user_behavior_logs
        WHERE created_at >= NOW() - INTERVAL '1 hour'
        """
        
        result = self.analytics_engine.execute_query(query, use_cache=False)
        return result.iloc[0]['active_users'] if len(result) > 0 else 0
    
    def get_error_rate(self):
        """Get error rate"""
        # This should get error rate from application logs or monitoring system
        # Returning mock data for now
        return 0.02
    
    def get_content_publish_rate(self):
        """Get content publish rate"""
        query = """
        SELECT COUNT(*) as posts_count
        FROM posts
        WHERE created_at >= NOW() - INTERVAL '1 hour'
        """
        
        result = self.analytics_engine.execute_query(query, use_cache=False)
        return result.iloc[0]['posts_count'] if len(result) > 0 else 0
    
    def check_alert_rules(self):
        """Check alert rules"""
        current_time = datetime.now()
        
        for rule in self.alert_rules:
            try:
                # Check cooldown period
                if (rule['last_triggered'] and 
                    (current_time - rule['last_triggered']).seconds < rule['cooldown']):
                    continue
                
                # Execute condition check
                current_value = rule['condition']()
                
                # Check if alert should be triggered
                if current_value < rule['threshold']:
                    rule['last_triggered'] = current_time
                    rule['action'](rule['name'], current_value, rule['threshold'])
                    
                    self.logger.warning(
                        f"Alert triggered: {rule['name']}, Current value: {current_value}, Threshold: {rule['threshold']}"
                    )
                    
            except Exception as e:
                self.logger.error(f"Alert rule check failed {rule['name']}: {e}")
    
    def send_low_activity_alert(self, rule_name, current_value, threshold):
        """Send low activity alert"""
        message = f"Alert: {rule_name}\nCurrent active users: {current_value}\nThreshold: {threshold}"
        self.send_alert(message)
    
    def send_error_rate_alert(self, rule_name, current_value, threshold):
        """Send error rate alert"""
        message = f"Alert: {rule_name}\nCurrent error rate: {current_value:.2%}\nThreshold: {threshold:.2%}"
        self.send_alert(message)
    
    def send_content_alert(self, rule_name, current_value, threshold):
        """Send content publishing alert"""
        message = f"Alert: {rule_name}\nCurrent publish rate: {current_value}/hour\nThreshold: {threshold}/hour"
        self.send_alert(message)
    
    def send_alert(self, message):
        """Send alert notification"""
        # Send email
        if self.alert_config.get('email_enabled'):
            self.send_email_alert(message)
        
        # Send Slack notification
        if self.alert_config.get('slack_enabled'):
            self.send_slack_alert(message)
        
        # WebSocket real-time notification
        asyncio.create_task(self.broadcast_alert(message))
    
    def send_email_alert(self, message):
        """Send email alert"""
        try:
            smtp_config = self.alert_config['email']
            
            msg = MIMEMultipart()
            msg['From'] = smtp_config['from']
            msg['To'] = ', '.join(smtp_config['to'])
            msg['Subject'] = "MKing Friend System Alert"
            
            msg.attach(MIMEText(message, 'plain', 'utf-8'))
            
            server = smtplib.SMTP(smtp_config['host'], smtp_config['port'])
            server.starttls()
            server.login(smtp_config['username'], smtp_config['password'])
            server.send_message(msg)
            server.quit()
            
            self.logger.info("Email alert sent successfully")
            
        except Exception as e:
            self.logger.error(f"Email alert failed: {e}")
    
    def send_slack_alert(self, message):
        """Send Slack alert"""
        try:
            slack_config = self.alert_config['slack']
            
            payload = {
                'text': f"🚨 MKing Friend Alert\n{message}",
                'channel': slack_config['channel'],
                'username': 'MonitorBot'
            }
            
            response = requests.post(
                slack_config['webhook_url'],
                json=payload,
                timeout=10
            )
            
            if response.status_code == 200:
                self.logger.info("Slack alert sent successfully")
            else:
                self.logger.error(f"Slack alert failed: {response.status_code}")
                
        except Exception as e:
            self.logger.error(f"Slack alert failed: {e}")
    
    async def broadcast_alert(self, message):
        """Broadcast alert to WebSocket clients"""
        if self.websocket_clients:
            alert_data = {
                'type': 'alert',
                'message': message,
                'timestamp': datetime.now().isoformat()
            }
            
            # Send alert to all connected clients
            disconnected_clients = set()
            for client in self.websocket_clients:
                try:
                    await client.send(json.dumps(alert_data))
                except websockets.exceptions.ConnectionClosed:
                    disconnected_clients.add(client)
            
            # Remove disconnected connections
            self.websocket_clients -= disconnected_clients
    
    async def websocket_handler(self, websocket, path):
        """WebSocket connection handler"""
        self.websocket_clients.add(websocket)
        self.logger.info(f"New WebSocket connection: {websocket.remote_address}")
        
        try:
            async for message in websocket:
                # Handle client messages
                data = json.loads(message)
                
                if data.get('type') == 'get_metrics':
                    # Send real-time metrics
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
            self.logger.info(f"WebSocket connection closed: {websocket.remote_address}")
    
    def get_real_time_metrics(self):
        """Get real-time metrics"""
        return {
            'active_users': self.get_current_active_users(),
            'error_rate': self.get_error_rate(),
            'content_publish_rate': self.get_content_publish_rate(),
            'timestamp': datetime.now().isoformat()
        }
    
    async def start_monitoring(self):
        """Start monitoring"""
        self.monitoring_active = True
        self.setup_default_rules()
        
        self.logger.info("Real-time monitoring started")
        
        while self.monitoring_active:
            try:
                # Check alert rules
                self.check_alert_rules()
                
                # Broadcast real-time metrics
                if self.websocket_clients:
                    metrics = self.get_real_time_metrics()
                    await self.broadcast_metrics(metrics)
                
                # Wait 30 seconds
                await asyncio.sleep(30)
                
            except Exception as e:
                self.logger.error(f"Monitoring loop error: {e}")
                await asyncio.sleep(5)
    
    async def broadcast_metrics(self, metrics):
        """Broadcast real-time metrics"""
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
        """Stop monitoring"""
        self.monitoring_active = False
        self.logger.info("Real-time monitoring stopped")
```

### 2.3 Report Generation System

```python
# Automated report generation system
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
        
        # Setup Chinese fonts
        plt.rcParams['font.sans-serif'] = ['SimHei', 'Arial Unicode MS']
        plt.rcParams['axes.unicode_minus'] = False
    
    def setup_logging(self):
        """Setup logging"""
        self.logger = logging.getLogger(__name__)
    
    def generate_chart(self, data, chart_type, title, figsize=(10, 6)):
        """Generate chart"""
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
        
        # Convert to base64 string
        buffer = BytesIO()
        plt.savefig(buffer, format='png', dpi=300, bbox_inches='tight')
        buffer.seek(0)
        chart_base64 = base64.b64encode(buffer.getvalue()).decode()
        plt.close()
        
        return chart_base64
    
    def generate_daily_report(self, date=None):
        """Generate daily report"""
        if not date:
            date = datetime.now().date()
        
        start_date = datetime.combine(date, datetime.min.time())
        end_date = start_date + timedelta(days=1)
        
        # Get data
        user_data = self.analytics_engine.get_user_analytics(start_date, end_date)
        content_data = self.analytics_engine.get_content_analytics(start_date, end_date)
        social_data = self.analytics_engine.get_social_analytics(start_date, end_date)
        
        # Generate charts
        charts = {}
        
        # User activity chart
        if user_data['activity_trend']:
            charts['user_activity'] = self.generate_chart(
                [(item['date'], item['daily_active_users']) for item in user_data['activity_trend']],
                'line',
                'Daily Active Users Trend'
            )
        
        # Content publishing chart
        if content_data['content_trend']:
            charts['content_trend'] = self.generate_chart(
                [(item['date'], item['posts_count']) for item in content_data['content_trend']],
                'bar',
                'Content Publishing Trend'
            )
        
        # Interaction distribution chart
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
                'Interaction Type Distribution'
            )
        
        # Prepare report data
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
        """Generate weekly report"""
        if not week_start:
            today = datetime.now().date()
            week_start = today - timedelta(days=today.weekday())
        
        start_date = datetime.combine(week_start, datetime.min.time())
        end_date = start_date + timedelta(days=7)
        
        # Get data
        user_data = self.analytics_engine.get_user_analytics(start_date, end_date)
        content_data = self.analytics_engine.get_content_analytics(start_date, end_date)
        social_data = self.analytics_engine.get_social_analytics(start_date, end_date)
        business_data = self.analytics_engine.get_business_metrics(start_date, end_date)
        
        # Generate charts
        charts = {}
        
        # User registration trend
        if user_data['registration_trend']:
            charts['registration_trend'] = self.generate_chart(
                [(item['date'], item['new_users']) for item in user_data['registration_trend']],
                'line',
                'User Registration Trend'
            )
        
        # Content type distribution
        if content_data['content_type_distribution']:
            charts['content_type_dist'] = self.generate_chart(
                [(item['content_type'], item['count']) for item in content_data['content_type_distribution']],
                'bar',
                'Content Type Distribution'
            )
        
        # User retention rate
        if user_data['retention_analysis']:
            retention_data = user_data['retention_analysis']
            charts['retention_analysis'] = self.generate_chart(
                [(item['cohort_date'], item['day_7_retention_rate']) for item in retention_data],
                'line',
                '7-Day Retention Rate Trend'
            )
        
        # Prepare report data
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
        """Generate monthly report"""
        if not month_start:
            today = datetime.now().date()
            month_start = today.replace(day=1)
        
        start_date = datetime.combine(month_start, datetime.min.time())
        # Calculate month end
        if month_start.month == 12:
            next_month = month_start.replace(year=month_start.year + 1, month=1)
        else:
            next_month = month_start.replace(month=month_start.month + 1)
        end_date = datetime.combine(next_month, datetime.min.time())
        
        # Get data
        user_data = self.analytics_engine.get_user_analytics(start_date, end_date)
        content_data = self.analytics_engine.get_content_analytics(start_date, end_date)
        social_data = self.analytics_engine.get_social_analytics(start_date, end_date)
        business_data = self.analytics_engine.get_business_metrics(start_date, end_date)
        
        # Generate more detailed charts
        charts = {}
        
        # Multi-dimensional user analysis
        if user_data['registration_trend'] and user_data['activity_trend']:
            # Create dual-axis chart
            fig, ax1 = plt.subplots(figsize=(12, 6))
            
            reg_data = user_data['registration_trend']
            act_data = user_data['activity_trend']
            
            dates = [item['date'] for item in reg_data]
            new_users = [item['new_users'] for item in reg_data]
            
            ax1.plot(dates, new_users, 'b-', label='New User Registration')
            ax1.set_xlabel('Date')
            ax1.set_ylabel('New Users', color='b')
            ax1.tick_params(axis='y', labelcolor='b')
            
            ax2 = ax1.twinx()
            if act_data:
                active_users = [item['daily_active_users'] for item in act_data]
                ax2.plot(dates[:len(active_users)], active_users, 'r-', label='Daily Active Users')
                ax2.set_ylabel('Active Users', color='r')
                ax2.tick_params(axis='y', labelcolor='r')
            
            plt.title('User Growth and Activity Analysis')
            plt.xticks(rotation=45)
            plt.tight_layout()
            
            buffer = BytesIO()
            plt.savefig(buffer, format='png', dpi=300, bbox_inches='tight')
            buffer.seek(0)
            charts['user_comprehensive'] = base64.b64encode(buffer.getvalue()).decode()
            plt.close()
        
        # Content performance heatmap
        if content_data['engagement_analysis']:
            engagement_df = pd.DataFrame(content_data['engagement_analysis'])
            if len(engagement_df) > 0:
                # Create correlation matrix
                corr_columns = ['total_likes', 'total_comments', 'total_shares', 'total_posts']
                available_columns = [col for col in corr_columns if col in engagement_df.columns]
                
                if len(available_columns) > 1:
                    corr_matrix = engagement_df[available_columns].corr()
                    
                    plt.figure(figsize=(8, 6))
                    sns.heatmap(corr_matrix, annot=True, cmap='coolwarm', center=0)
                    plt.title('Content Interaction Metrics Correlation Analysis')
                    plt.tight_layout()
                    
                    buffer = BytesIO()
                    plt.savefig(buffer, format='png', dpi=300, bbox_inches='tight')
                    buffer.seek(0)
                    charts['engagement_correlation'] = base64.b64encode(buffer.getvalue()).decode()
                    plt.close()
        
        # Prepare report data
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
        """Generate daily report summary"""
        summary = {
            'total_active_users': 0,
            'total_new_posts': 0,
            'total_interactions': 0,
            'key_insights': []
        }
        
        # Calculate totals
        if user_data['activity_trend']:
            summary['total_active_users'] = sum(item['daily_active_users'] for item in user_data['activity_trend'])
        
        if content_data['content_trend']:
            summary['total_new_posts'] = sum(item['posts_count'] for item in content_data['content_trend'])
        
        if social_data['interaction_trend']:
            summary['total_interactions'] = sum(item['count'] for item in social_data['interaction_trend'])
        
        # Generate insights
        if summary['total_active_users'] > 100:
            summary['key_insights'].append("User activity is performing well")
        elif summary['total_active_users'] < 50:
            summary['key_insights'].append("User activity is low, attention needed")
        
        if summary['total_new_posts'] > 50:
            summary['key_insights'].append("Content creation is active")
        elif summary['total_new_posts'] < 10:
            summary['key_insights'].append("Content creation is insufficient, incentive measures needed")
        
        return summary
    
    def generate_weekly_summary(self, user_data, content_data, social_data, business_data):
        """Generate weekly report summary"""
        summary = {
            'new_users': 0,
            'avg_daily_active': 0,
            'total_content': 0,
            'engagement_rate': 0,
            'growth_insights': []
        }
        
        # Calculate metrics
        if user_data['registration_trend']:
            summary['new_users'] = sum(item['new_users'] for item in user_data['registration_trend'])
        
        if user_data['activity_trend']:
            daily_active = [item['daily_active_users'] for item in user_data['activity_trend']]
            summary['avg_daily_active'] = sum(daily_active) / len(daily_active) if daily_active else 0
        
        if content_data['content_trend']:
            summary['total_content'] = sum(item['posts_count'] for item in content_data['content_trend'])
        
        # Calculate engagement rate
        if content_data['engagement_analysis']:
            engagement = content_data['engagement_analysis']
            total_engagement = sum(item.get('total_likes', 0) + item.get('total_comments', 0) + item.get('total_shares', 0) for item in engagement)
            total_posts = sum(item.get('total_posts', 0) for item in engagement)
            summary['engagement_rate'] = total_engagement / total_posts if total_posts > 0 else 0
        
        return summary
    
    def generate_monthly_summary(self, user_data, content_data, social_data, business_data):
        """Generate monthly report summary"""
        summary = {
            'monthly_growth': 0,
            'content_performance': {},
            'user_engagement': {},
            'key_achievements': [],
            'areas_for_improvement': []
        }
        
        # Calculate monthly growth
        if business_data['growth_metrics']:
            growth_data = business_data['growth_metrics']
            if growth_data:
                latest_growth = growth_data[-1]
                summary['monthly_growth'] = latest_growth.get('growth_rate', 0)
        
        # Content performance analysis
        if content_data['content_type_distribution']:
            content_types = content_data['content_type_distribution']
            best_performing = max(content_types, key=lambda x: x.get('avg_likes', 0))
            summary['content_performance'] = {
                'best_type': best_performing.get('content_type', 'unknown'),
                'avg_engagement': best_performing.get('avg_likes', 0)
            }
        
        # User engagement
        if user_data['retention_analysis']:
            retention_data = user_data['retention_analysis']
            if retention_data:
                avg_retention = sum(item.get('day_7_retention_rate', 0) for item in retention_data) / len(retention_data)
                summary['user_engagement']['avg_7day_retention'] = round(avg_retention, 2)
        
        return summary
    
    def generate_recommendations(self, user_data, content_data, social_data, business_data):
        """Generate improvement recommendations"""
        recommendations = []
        
        # User growth recommendations
        if user_data['registration_trend']:
            recent_registrations = user_data['registration_trend'][-7:] if len(user_data['registration_trend']) >= 7 else user_data['registration_trend']
            avg_daily_reg = sum(item['new_users'] for item in recent_registrations) / len(recent_registrations) if recent_registrations else 0
            
            if avg_daily_reg < 5:
                recommendations.append({
                    'category': 'User Growth',
                    'priority': 'high',
                    'suggestion': 'Daily new user registration is low, recommend strengthening promotional activities and user referral mechanisms',
                    'expected_impact': 'Increase new user registration rate by 20-30%'
                })
        
        # Content strategy recommendations
        if content_data['content_type_distribution']:
            content_types = content_data['content_type_distribution']
            if content_types:
                best_type = max(content_types, key=lambda x: x.get('avg_likes', 0))
                recommendations.append({
                    'category': 'Content Strategy',
                    'priority': 'medium',
                    'suggestion': f"Encourage more {best_type['content_type']} type content creation, this type averages {best_type.get('avg_likes', 0):.1f} likes",
                    'expected_impact': 'Improve overall content engagement by 15-25%'
                })
        
        # User retention recommendations
        if user_data['retention_analysis']:
            retention_data = user_data['retention_analysis']
            if retention_data:
                avg_7day_retention = sum(item.get('day_7_retention_rate', 0) for item in retention_data) / len(retention_data)
                if avg_7day_retention < 30:
                    recommendations.append({
                        'category': 'User Retention',
                        'priority': 'high',
                        'suggestion': '7-day retention rate is low, recommend optimizing new user onboarding process and early interaction experience',
                        'expected_impact': 'Improve 7-day retention rate to 35-40%'
                    })
        
        return recommendations
    
    def generate_html_report(self, report_data, template_type='daily'):
        """Generate HTML report"""
        # HTML templates
        if template_type == 'daily':
            template_str = """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>MKing Friend Daily Report - {{ date }}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { background: #f4f4f4; padding: 20px; border-radius: 5px; }
                    .metric { display: inline-block; margin: 10px; padding: 15px; background: #e9e9e9; border-radius: 5px; }
                    .chart { margin: 20px 0; text-align: center; }
                    .summary { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>MKing Friend Daily Report</h1>
                    <p>Report Date: {{ date }}</p>
                    <p>Generated: {{ generated_at }}</p>
                </div>
                
                <div class="metrics">
                    <h2>Key Metrics</h2>
                    <div class="metric">
                        <h3>Active Users</h3>
                        <p>{{ summary.total_active_users }}</p>
                    </div>
                    <div class="metric">
                        <h3>New Posts</h3>
                        <p>{{ summary.total_new_posts }}</p>
                    </div>
                    <div class="metric">
                        <h3>Total Interactions</h3>
                        <p>{{ summary.total_interactions }}</p>
                    </div>
                </div>
                
                {% for chart_name, chart_data in charts.items() %}
                <div class="chart">
                    <h3>{{ chart_name.replace('_', ' ').title() }}</h3>
                    <img src="data:image/png;base64,{{ chart_data }}" alt="{{ chart_name }}">
                </div>
                {% endfor %}
                
                <div class="summary">
                    <h2>Summary</h2>
                    <ul>
                    {% for insight in summary.key_insights %}
                        <li>{{ insight }}</li>
                    {% endfor %}
                    </ul>
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
                <title>MKing Friend Weekly Report - {{ week_start }} to {{ week_end }}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { background: #f4f4f4; padding: 20px; border-radius: 5px; }
                    .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
                    .metric { padding: 15px; background: #e9e9e9; border-radius: 5px; text-align: center; }
                    .chart { margin: 20px 0; text-align: center; }
                    .summary { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>MKing Friend Weekly Report</h1>
                    <p>Period: {{ week_start }} to {{ week_end }}</p>
                    <p>Generated: {{ generated_at }}</p>
                </div>
                
                <div class="metric-grid">
                    <div class="metric">
                        <h3>New Users</h3>
                        <p>{{ summary.new_users }}</p>
                    </div>
                    <div class="metric">
                        <h3>Avg Daily Active</h3>
                        <p>{{ "%.1f"|format(summary.avg_daily_active) }}</p>
                    </div>
                    <div class="metric">
                        <h3>Total Content</h3>
                        <p>{{ summary.total_content }}</p>
                    </div>
                    <div class="metric">
                        <h3>Engagement Rate</h3>
                        <p>{{ "%.2f"|format(summary.engagement_rate) }}</p>
                    </div>
                </div>
                
                {% for chart_name, chart_data in charts.items() %}
                <div class="chart">
                    <h3>{{ chart_name.replace('_', ' ').title() }}</h3>
                    <img src="data:image/png;base64,{{ chart_data }}" alt="{{ chart_name }}">
                </div>
                {% endfor %}
                
                <div class="summary">
                    <h2>Weekly Summary</h2>
                    <p>This week saw {{ summary.new_users }} new user registrations with an average of {{ "%.1f"|format(summary.avg_daily_active) }} daily active users.</p>
                </div>
            </body>
            </html>
            """
        
        elif template_type == 'monthly':
            template_str = """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>MKing Friend Monthly Report - {{ month }}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { background: #f4f4f4; padding: 20px; border-radius: 5px; }
                    .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin: 20px 0; }
                    .metric { padding: 15px; background: #e9e9e9; border-radius: 5px; }
                    .chart { margin: 20px 0; text-align: center; }
                    .recommendations { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; }
                    .recommendation { margin: 10px 0; padding: 10px; background: white; border-radius: 3px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>MKing Friend Monthly Report</h1>
                    <p>Month: {{ month }}</p>
                    <p>Generated: {{ generated_at }}</p>
                </div>
                
                <div class="metric-grid">
                    <div class="metric">
                        <h3>Monthly Growth</h3>
                        <p>{{ "%.2f%"|format(summary.monthly_growth) }}</p>
                    </div>
                    <div class="metric">
                        <h3>Best Content Type</h3>
                        <p>{{ summary.content_performance.best_type }}</p>
                    </div>
                    <div class="metric">
                        <h3>7-Day Retention</h3>
                        <p>{{ "%.2f%"|format(summary.user_engagement.avg_7day_retention) }}</p>
                    </div>
                </div>
                
                {% for chart_name, chart_data in charts.items() %}
                <div class="chart">
                    <h3>{{ chart_name.replace('_', ' ').title() }}</h3>
                    <img src="data:image/png;base64,{{ chart_data }}" alt="{{ chart_name }}">
                </div>
                {% endfor %}
                
                <div class="recommendations">
                    <h2>Recommendations</h2>
                    {% for rec in recommendations %}
                    <div class="recommendation">
                        <h4>{{ rec.category }} ({{ rec.priority.title() }} Priority)</h4>
                        <p><strong>Suggestion:</strong> {{ rec.suggestion }}</p>
                        <p><strong>Expected Impact:</strong> {{ rec.expected_impact }}</p>
                    </div>
                    {% endfor %}
                </div>
            </body>
            </html>
            """
        
        # Render template
        template = Template(template_str)
        html_content = template.render(**report_data)
        
        return html_content
    
    def generate_pdf_report(self, html_content, filename):
        """Generate PDF report"""
        try:
            options = {
                'page-size': 'A4',
                'margin-top': '0.75in',
                'margin-right': '0.75in',
                'margin-bottom': '0.75in',
                'margin-left': '0.75in',
                'encoding': "UTF-8",
                'no-outline': None
            }
            
            pdf_path = f"{filename}.pdf"
            pdfkit.from_string(html_content, pdf_path, options=options)
            
            self.logger.info(f"PDF report generated: {pdf_path}")
            return pdf_path
            
        except Exception as e:
            self.logger.error(f"PDF generation failed: {e}")
            return None
```

## 3. Database Design

### 3.1 Analytics Tables

```sql
-- User behavior analytics table
CREATE TABLE user_behavior_analytics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    session_id VARCHAR(255),
    device_type VARCHAR(50),
    browser VARCHAR(100),
    ip_address INET,
    page_views INTEGER DEFAULT 0,
    time_spent INTEGER DEFAULT 0, -- seconds
    actions_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Content performance analytics table
CREATE TABLE content_performance_analytics (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL,
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    engagement_score DECIMAL(10,2) DEFAULT 0,
    reach_count INTEGER DEFAULT 0,
    click_through_rate DECIMAL(5,4) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Social interaction analytics table
CREATE TABLE social_interaction_analytics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    interaction_type VARCHAR(50) NOT NULL, -- like, comment, share, follow
    target_id INTEGER, -- post_id or user_id
    target_type VARCHAR(50), -- post, user
    interaction_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Business metrics table
CREATE TABLE business_metrics (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    metric_type VARCHAR(50), -- daily, weekly, monthly
    calculation_date DATE NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Report generation logs table
CREATE TABLE report_generation_logs (
    id SERIAL PRIMARY KEY,
    report_type VARCHAR(50) NOT NULL, -- daily, weekly, monthly
    report_date DATE NOT NULL,
    generation_status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed
    file_path VARCHAR(500),
    generation_time INTEGER, -- seconds
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Custom dashboard configurations table
CREATE TABLE dashboard_configs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    dashboard_name VARCHAR(200) NOT NULL,
    config_data JSONB NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Data export logs table
CREATE TABLE data_export_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    export_type VARCHAR(50) NOT NULL, -- json, csv, excel, pdf
    data_range VARCHAR(100),
    file_path VARCHAR(500),
    file_size INTEGER, -- bytes
    export_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Alert rules configuration table
CREATE TABLE alert_rules (
    id SERIAL PRIMARY KEY,
    rule_name VARCHAR(200) NOT NULL,
    rule_type VARCHAR(50) NOT NULL,
    condition_query TEXT NOT NULL,
    threshold_value DECIMAL(15,4) NOT NULL,
    comparison_operator VARCHAR(10) NOT NULL, -- >, <, >=, <=, =
    alert_channels JSONB, -- email, slack, webhook
    is_active BOOLEAN DEFAULT TRUE,
    cooldown_minutes INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alert triggers log table
CREATE TABLE alert_triggers (
    id SERIAL PRIMARY KEY,
    alert_rule_id INTEGER NOT NULL REFERENCES alert_rules(id),
    trigger_value DECIMAL(15,4) NOT NULL,
    threshold_value DECIMAL(15,4) NOT NULL,
    alert_message TEXT,
    notification_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);
```

### 3.2 Index Optimization

```sql
-- User behavior analytics indexes
CREATE INDEX idx_user_behavior_user_id ON user_behavior_analytics(user_id);
CREATE INDEX idx_user_behavior_created_at ON user_behavior_analytics(created_at);
CREATE INDEX idx_user_behavior_device_type ON user_behavior_analytics(device_type);

-- Content performance analytics indexes
CREATE INDEX idx_content_performance_post_id ON content_performance_analytics(post_id);
CREATE INDEX idx_content_performance_created_at ON content_performance_analytics(created_at);
CREATE INDEX idx_content_performance_engagement ON content_performance_analytics(engagement_score DESC);

-- Social interaction analytics indexes
CREATE INDEX idx_social_interaction_user_id ON social_interaction_analytics(user_id);
CREATE INDEX idx_social_interaction_type ON social_interaction_analytics(interaction_type);
CREATE INDEX idx_social_interaction_target ON social_interaction_analytics(target_id, target_type);
CREATE INDEX idx_social_interaction_created_at ON social_interaction_analytics(created_at);

-- Business metrics indexes
CREATE INDEX idx_business_metrics_name_date ON business_metrics(metric_name, calculation_date);
CREATE INDEX idx_business_metrics_type_date ON business_metrics(metric_type, calculation_date);

-- Report generation logs indexes
CREATE INDEX idx_report_logs_type_date ON report_generation_logs(report_type, report_date);
CREATE INDEX idx_report_logs_status ON report_generation_logs(generation_status);

-- Dashboard configs indexes
CREATE INDEX idx_dashboard_configs_user_id ON dashboard_configs(user_id);

-- Data export logs indexes
CREATE INDEX idx_data_export_user_id ON data_export_logs(user_id);
CREATE INDEX idx_data_export_created_at ON data_export_logs(created_at);

-- Alert rules indexes
CREATE INDEX idx_alert_rules_active ON alert_rules(is_active);
CREATE INDEX idx_alert_rules_type ON alert_rules(rule_type);

-- Alert triggers indexes
CREATE INDEX idx_alert_triggers_rule_id ON alert_triggers(alert_rule_id);
CREATE INDEX idx_alert_triggers_created_at ON alert_triggers(created_at);
```

## 4. System Architecture

### 4.1 Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   Analytics     │
│   Dashboard     │◄──►│   (FastAPI)     │◄──►│   Engine        │
│   (React/Vue)   │    │                 │    │   (Python)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Real-time     │    │   Report        │    │   Database      │
│   Monitor       │    │   Generator     │    │   (PostgreSQL)  │
│   (WebSocket)   │    │   (Background)  │    │   + Redis       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 4.2 Data Flow

```
1. Data Collection
   ├── User Behavior Tracking
   ├── Content Interaction Logging
   └── System Metrics Collection

2. Data Processing
   ├── Real-time Stream Processing
   ├── Batch Data Analysis
   └── Aggregation and Calculation

3. Data Storage
   ├── Raw Data (PostgreSQL)
   ├── Processed Metrics (PostgreSQL)
   └── Cache Layer (Redis)

4. Data Presentation
   ├── Real-time Dashboard
   ├── Scheduled Reports
   └── On-demand Analytics
```

## 5. Implementation Plan

### 5.1 Phase 1: Basic Analytics (Weeks 1-4)

**Week 1-2: Foundation Setup**
- Database schema design and creation
- Basic data collection implementation
- Core analytics engine development

**Week 3-4: Basic Dashboard**
- User analytics implementation
- Content analytics implementation
- Basic dashboard frontend

### 5.2 Phase 2: Advanced Analytics (Weeks 5-8)

**Week 5-6: Advanced Features**
- Social interaction analytics
- Business metrics calculation
- Real-time monitoring system

**Week 7-8: Report Generation**
- Automated report generation
- PDF/Excel export functionality
- Email notification system

### 5.3 Phase 3: Optimization and Extension (Weeks 9-12)

**Week 9-10: Performance Optimization**
- Query optimization
- Caching strategy implementation
- System performance tuning

**Week 11-12: Advanced Features**
- Custom dashboard creation
- Advanced visualization
- API documentation and testing

## 6. Technical Recommendations

### 6.1 Recommended Tech Stack

**Backend Technologies**
- **Language**: Python 3.9+
- **Framework**: FastAPI
- **Database**: PostgreSQL 13+
- **Cache**: Redis 6+
- **Task Queue**: Celery + Redis
- **Data Processing**: Pandas, NumPy
- **Visualization**: Plotly, Matplotlib

**Frontend Technologies**
- **Framework**: React 18+ or Vue 3+
- **UI Library**: Ant Design or Element Plus
- **Charts**: Chart.js or ECharts
- **State Management**: Redux or Vuex

**Data Processing**
- **ETL**: Apache Airflow (optional)
- **Real-time**: WebSocket
- **Monitoring**: Prometheus + Grafana (optional)

### 6.2 Cost Estimation

**Development Costs**
- Backend Development: 120-150 hours
- Frontend Development: 80-100 hours
- Database Design: 20-30 hours
- Testing and Optimization: 40-50 hours
- **Total**: 260-330 hours

**Operational Costs (Monthly)**
- Server Resources: $50-100
- Database Storage: $20-40
- Third-party Services: $10-30
- **Total**: $80-170/month

### 6.3 Key Performance Indicators

**System Performance**
- Query response time < 2 seconds
- Dashboard load time < 3 seconds
- Report generation time < 30 seconds
- System uptime > 99.5%

**Analytics Accuracy**
- Data freshness < 5 minutes
- Calculation accuracy > 99.9%
- Real-time metrics delay < 30 seconds

**User Experience**
- Dashboard usability score > 4.5/5
- Report usefulness rating > 4.0/5
- Feature adoption rate > 70%

## 7. Risk Assessment and Mitigation

### 7.1 Technical Risks

**Data Volume Growth**
- **Risk**: Performance degradation with large datasets
- **Mitigation**: Implement data partitioning and archiving strategies

**Real-time Processing**
- **Risk**: System overload during peak traffic
- **Mitigation**: Implement rate limiting and queue management

**Data Accuracy**
- **Risk**: Inconsistent or incorrect analytics results
- **Mitigation**: Implement data validation and reconciliation processes

### 7.2 Business Risks

**User Adoption**
- **Risk**: Low usage of analytics features
- **Mitigation**: Provide training and intuitive UI design

**Privacy Compliance**
- **Risk**: Data privacy regulation violations
- **Mitigation**: Implement data anonymization and consent management

## 8. Future Expansion

### 8.1 Medium-term Features (6-12 months)

- Machine learning-based user behavior prediction
- Advanced cohort analysis
- A/B testing framework integration
- Multi-tenant analytics support

### 8.2 Long-term Features (1-2 years)

- AI-powered insights and recommendations
- Cross-platform analytics integration
- Advanced data visualization tools
- Real-time collaboration features

## 9. Important Considerations

### 9.1 Technical Considerations

**Technology Selection**
- Choose mature and well-supported technologies
- Consider team expertise and learning curve
- Evaluate long-term maintenance costs

**Data Security**
- Implement proper access controls
- Encrypt sensitive data
- Regular security audits

**Performance Optimization**
- Design for scalability from the beginning
- Implement proper caching strategies
- Monitor and optimize query performance

### 9.2 User Experience

**Dashboard Design**
- Prioritize important metrics
- Provide customization options
- Ensure mobile responsiveness

**Report Usability**
- Generate actionable insights
- Provide clear visualizations
- Enable easy sharing and export

### 9.3 Continuous Improvement

**Feedback Collection**
- Regular user feedback sessions
- Usage analytics for feature optimization
- Performance monitoring and optimization

**Feature Evolution**
- Iterative development approach
- Regular feature updates
- Community-driven feature requests

---

**Document Version**: 1.0  
**Last Updated**: 2024-01-15  
**Next Review**: 2024-02-15