# MKing Friend - 日誌管理部署指南

> **狀態**: 📋 部署指南 | **更新日期**: 2025-01-02

## 1. 部署概述

### 1.1 選定方案
- **主要方案**: Grafana Loki + Promtail
- **整合策略**: 與現有 Grafana + Prometheus 監控棧整合
- **存儲後端**: MinIO (S3 兼容對象存儲)
- **部署方式**: Docker Compose

### 1.2 架構圖
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   應用程式       │    │   Docker 容器    │    │   系統日誌       │
│   (NestJS)      │    │   (各服務)       │    │   (Nginx等)     │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │        Promtail          │
                    │     (日誌收集器)          │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │         Loki             │
                    │     (日誌聚合器)          │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │        MinIO             │
                    │     (對象存儲)            │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │       Grafana            │
                    │    (可視化界面)           │
                    └─────────────────────────────┘
```

## 2. 階段式部署計劃

### 2.1 階段 1: 基礎設施部署 (第 1 週)

#### 目標
- 部署 Loki 和 Promtail 服務
- 配置基本的日誌收集
- 整合到現有 Grafana

#### 步驟
1. 更新 Docker Compose 配置
2. 創建 Loki 配置文件
3. 創建 Promtail 配置文件
4. 配置 Grafana 數據源
5. 測試基本功能

### 2.2 階段 2: 應用程式整合 (第 2-3 週)

#### 目標
- 整合 NestJS 應用程式日誌
- 標準化日誌格式
- 配置結構化日誌

#### 步驟
1. 安裝日誌庫 (Winston/Pino)
2. 配置日誌格式和輸出
3. 添加追蹤 ID 和上下文
4. 測試日誌流

### 2.3 階段 3: 監控和告警 (第 4 週)

#### 目標
- 創建日誌儀表板
- 配置告警規則
- 實施日誌分析

#### 步驟
1. 創建 Grafana 儀表板
2. 配置 Loki 告警規則
3. 設定通知渠道
4. 測試告警功能

### 2.4 階段 4: 優化和調優 (第 5-6 週)

#### 目標
- 性能優化
- 成本控制
- 運維自動化

#### 步驟
1. 調整存儲策略
2. 優化查詢性能
3. 實施自動化運維
4. 文檔完善

## 3. 詳細部署步驟

### 3.1 更新 Docker Compose 配置

#### 在 `docker-compose.yml` 中添加以下服務:

```yaml
  # Loki 日誌聚合服務
  loki:
    image: grafana/loki:2.9.0
    container_name: mking-loki
    ports:
      - "3100:3100"
    environment:
      # 基本配置
      LOKI_CONFIG_FILE: /etc/loki/local-config.yaml
    volumes:
      - ./config/loki/loki.yml:/etc/loki/local-config.yaml:ro
      - loki_data:/loki
    command: -config.file=/etc/loki/local-config.yaml
    networks:
      - mking-network
    depends_on:
      - minio
    healthcheck:
      test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:3100/ready || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  # Promtail 日誌收集器
  promtail:
    image: grafana/promtail:2.9.0
    container_name: mking-promtail
    volumes:
      # Promtail 配置
      - ./config/promtail/promtail.yml:/etc/promtail/config.yml:ro
      # 系統日誌
      - /var/log:/var/log:ro
      # Docker 容器日誌
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
      # 應用程式日誌
      - ./logs:/app/logs:ro
    environment:
      PROMTAIL_CONFIG_FILE: /etc/promtail/config.yml
    command: -config.file=/etc/promtail/config.yml
    networks:
      - mking-network
    depends_on:
      - loki
    restart: unless-stopped

  # 日誌輪轉服務 (可選)
  logrotate:
    image: linkyard/docker-logrotate:latest
    container_name: mking-logrotate
    volumes:
      - /var/lib/docker/containers:/var/lib/docker/containers:rw
      - ./config/logrotate/logrotate.conf:/etc/logrotate.conf:ro
    environment:
      CRON_SCHEDULE: "0 1 * * *"  # 每天凌晨 1 點執行
    networks:
      - mking-network
    restart: unless-stopped
```

#### 添加 volumes:
```yaml
volumes:
  # ... 現有 volumes ...
  loki_data:  # Loki 數據存儲
```

### 3.2 創建配置目錄結構

```bash
# 創建配置目錄
mkdir -p config/loki
mkdir -p config/promtail
mkdir -p config/grafana/dashboards/logs
mkdir -p config/logrotate
mkdir -p logs
```

### 3.3 Loki 配置文件

#### 創建 `config/loki/loki.yml`:

```yaml
# Loki 配置文件
auth_enabled: false

# HTTP 服務器配置
server:
  http_listen_port: 3100
  grpc_listen_port: 9096
  log_level: info

# 通用配置
common:
  path_prefix: /loki
  storage:
    filesystem:
      chunks_directory: /loki/chunks
      rules_directory: /loki/rules
  replication_factor: 1
  ring:
    instance_addr: 127.0.0.1
    kvstore:
      store: inmemory

# 查詢範圍配置
query_range:
  results_cache:
    cache:
      embedded_cache:
        enabled: true
        max_size_mb: 100

# Schema 配置
schema_config:
  configs:
    - from: 2020-10-24
      store: boltdb-shipper
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 24h

# 規則配置
ruler:
  alertmanager_url: http://prometheus:9093
  storage:
    type: local
    local:
      directory: /loki/rules
  rule_path: /loki/rules
  ring:
    kvstore:
      store: inmemory
  enable_api: true

# 分析配置
analytics:
  reporting_enabled: false

# 限制配置
limits_config:
  enforce_metric_name: false
  reject_old_samples: true
  reject_old_samples_max_age: 168h
  ingestion_rate_mb: 16
  ingestion_burst_size_mb: 32
  max_query_parallelism: 32
  max_streams_per_user: 10000
  max_line_size: 256000
  max_entries_limit_per_query: 5000
  max_global_streams_per_user: 5000
  max_chunks_per_query: 2000000
  max_query_length: 721h
  max_query_series: 500
  cardinality_limit: 100000
  max_streams_matchers_per_query: 1000
  max_concurrent_tail_requests: 10
  retention_period: 744h  # 31 天

# 表管理器配置
table_manager:
  retention_deletes_enabled: true
  retention_period: 744h  # 31 天

# 壓縮器配置
compactor:
  working_directory: /loki/compactor
  shared_store: filesystem
  compaction_interval: 10m
  retention_enabled: true
  retention_delete_delay: 2h
  retention_delete_worker_count: 150
```

### 3.4 Promtail 配置文件

#### 創建 `config/promtail/promtail.yml`:

```yaml
# Promtail 配置文件
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push
    tenant_id: mking-frnd

scrape_configs:
  # Docker 容器日誌
  - job_name: containers
    static_configs:
      - targets:
          - localhost
        labels:
          job: containerlogs
          __path__: /var/lib/docker/containers/*/*log
    pipeline_stages:
      - json:
          expressions:
            output: log
            stream: stream
            attrs:
      - json:
          expressions:
            tag:
          source: attrs
      - regex:
          expression: (?P<container_name>(?:[^|]*))
          source: tag
      - timestamp:
          format: RFC3339Nano
          source: time
      - labels:
          stream:
          container_name:
      - output:
          source: output

  # 系統日誌
  - job_name: syslog
    static_configs:
      - targets:
          - localhost
        labels:
          job: syslog
          __path__: /var/log/syslog
    pipeline_stages:
      - regex:
          expression: '(?P<timestamp>\S+\s+\d+\s+\d+:\d+:\d+)\s+(?P<hostname>\S+)\s+(?P<service>\S+)(?:\[(?P<pid>\d+)\])?:\s+(?P<message>.*)'
      - timestamp:
          format: 'Jan 2 15:04:05'
          source: timestamp
      - labels:
          hostname:
          service:
          pid:

  # Nginx 訪問日誌
  - job_name: nginx_access
    static_configs:
      - targets:
          - localhost
        labels:
          job: nginx
          type: access
          __path__: /var/log/nginx/access.log
    pipeline_stages:
      - regex:
          expression: '(?P<remote_addr>\S+)\s+-\s+(?P<remote_user>\S+)\s+\[(?P<time_local>[^\]]+)\]\s+"(?P<method>\S+)\s+(?P<request_uri>\S+)\s+(?P<protocol>\S+)"\s+(?P<status>\d+)\s+(?P<body_bytes_sent>\d+)\s+"(?P<http_referer>[^"]*)"\s+"(?P<http_user_agent>[^"]*)"'
      - timestamp:
          format: '02/Jan/2006:15:04:05 -0700'
          source: time_local
      - labels:
          method:
          status:
          remote_addr:

  # Nginx 錯誤日誌
  - job_name: nginx_error
    static_configs:
      - targets:
          - localhost
        labels:
          job: nginx
          type: error
          __path__: /var/log/nginx/error.log
    pipeline_stages:
      - regex:
          expression: '(?P<timestamp>\d{4}/\d{2}/\d{2}\s+\d{2}:\d{2}:\d{2})\s+\[(?P<level>\w+)\]\s+(?P<pid>\d+)#(?P<tid>\d+):\s+(?P<message>.*)'
      - timestamp:
          format: '2006/01/02 15:04:05'
          source: timestamp
      - labels:
          level:
          pid:

  # 應用程式日誌 (NestJS)
  - job_name: mking_backend
    static_configs:
      - targets:
          - localhost
        labels:
          job: mking-backend
          service: backend
          __path__: /app/logs/application.log
    pipeline_stages:
      - json:
          expressions:
            timestamp: timestamp
            level: level
            message: message
            module: module
            userId: userId
            traceId: traceId
            ip: ip
      - timestamp:
          format: RFC3339
          source: timestamp
      - labels:
          level:
          module:
          service:
      - output:
          source: message

  # PostgreSQL 日誌
  - job_name: postgresql
    static_configs:
      - targets:
          - localhost
        labels:
          job: postgresql
          service: database
          __path__: /var/log/postgresql/*.log
    pipeline_stages:
      - regex:
          expression: '(?P<timestamp>\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\.\d{3}\s+\w+)\s+\[(?P<pid>\d+)\]\s+(?P<level>\w+):\s+(?P<message>.*)'
      - timestamp:
          format: '2006-01-02 15:04:05.000 MST'
          source: timestamp
      - labels:
          level:
          pid:
          service:
```

### 3.5 Grafana 數據源配置

#### 創建 `config/grafana/datasources/loki.yml`:

```yaml
# Loki 數據源配置
apiVersion: 1

datasources:
  - name: Loki
    type: loki
    access: proxy
    url: http://loki:3100
    isDefault: false
    editable: true
    jsonData:
      maxLines: 1000
      derivedFields:
        - datasourceUid: prometheus
          matcherRegex: "traceID=(\\w+)"
          name: TraceID
          url: "http://localhost:16686/trace/$${__value.raw}"
```

### 3.6 創建基礎儀表板

#### 創建 `config/grafana/dashboards/logs/mking-logs-overview.json`:

```json
{
  "dashboard": {
    "id": null,
    "title": "MKing Friend - 日誌概覽",
    "tags": ["mking", "logs"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "日誌量趨勢",
        "type": "stat",
        "targets": [
          {
            "expr": "sum(rate({job=\"mking-backend\"}[5m]))",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": {
              "mode": "palette-classic"
            },
            "unit": "logs/sec"
          }
        },
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 0,
          "y": 0
        }
      },
      {
        "id": 2,
        "title": "錯誤日誌",
        "type": "logs",
        "targets": [
          {
            "expr": "{job=\"mking-backend\", level=\"error\"}",
            "refId": "A"
          }
        ],
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 12,
          "y": 0
        }
      },
      {
        "id": 3,
        "title": "服務日誌分佈",
        "type": "piechart",
        "targets": [
          {
            "expr": "sum by (service) (rate({job=~\".*\"}[5m]))",
            "refId": "A"
          }
        ],
        "gridPos": {
          "h": 8,
          "w": 24,
          "x": 0,
          "y": 8
        }
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "30s"
  }
}
```

## 4. 應用程式日誌整合

### 4.1 NestJS 日誌配置

#### 安裝依賴:
```bash
cd backend
npm install winston winston-daily-rotate-file
npm install @types/winston --save-dev
```

#### 創建日誌配置 `backend/src/config/logger.config.ts`:

```typescript
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, context, trace, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      service: 'mking-backend',
      module: context || 'unknown',
      message,
      traceId: meta.traceId,
      userId: meta.userId,
      ip: meta.ip,
      ...(trace && { trace }),
      ...meta
    });
  })
);

export const loggerConfig = WinstonModule.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // 控制台輸出
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // 應用程式日誌文件
    new DailyRotateFile({
      filename: '/app/logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: 'info'
    }),
    
    // 錯誤日誌文件
    new DailyRotateFile({
      filename: '/app/logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error'
    })
  ]
});
```

#### 更新 `backend/src/main.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { loggerConfig } from './config/logger.config';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: loggerConfig
  });
  
  // 添加日誌攔截器
  app.useGlobalInterceptors(new LoggingInterceptor());
  
  await app.listen(3000);
}
bootstrap();
```

#### 創建日誌攔截器 `backend/src/common/interceptors/logging.interceptor.ts`:

```typescript
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const traceId = uuidv4();
    
    // 添加追蹤 ID 到請求
    request.traceId = traceId;
    
    const startTime = Date.now();
    
    this.logger.log({
      message: `Incoming request`,
      method,
      url,
      ip,
      userAgent,
      traceId,
      userId: request.user?.id
    });

    return next.handle().pipe(
      tap(() => {
        const { statusCode } = response;
        const responseTime = Date.now() - startTime;
        
        this.logger.log({
          message: `Request completed`,
          method,
          url,
          statusCode,
          responseTime,
          traceId,
          userId: request.user?.id
        });
      })
    );
  }
}
```

### 4.2 Docker Compose 日誌配置

#### 更新後端服務配置:

```yaml
  backend:
    # ... 現有配置 ...
    volumes:
      - ./logs:/app/logs  # 添加日誌目錄掛載
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        labels: "service,version"
    labels:
      - "service=mking-backend"
      - "version=1.0.0"
```

## 5. 告警配置

### 5.1 Loki 告警規則

#### 創建 `config/loki/rules/mking-alerts.yml`:

```yaml
groups:
  - name: mking-logs-alerts
    rules:
      # 高錯誤率告警
      - alert: HighErrorRate
        expr: |
          (
            sum(rate({service="mking-backend", level="error"}[5m]))
            /
            sum(rate({service="mking-backend"}[5m]))
          ) > 0.05
        for: 2m
        labels:
          severity: warning
          service: mking-backend
        annotations:
          summary: "後端服務錯誤率過高"
          description: "後端服務在過去 5 分鐘內錯誤率超過 5%"
          
      # 無日誌告警
      - alert: NoLogs
        expr: |
          absent_over_time({service="mking-backend"}[10m])
        for: 5m
        labels:
          severity: critical
          service: mking-backend
        annotations:
          summary: "後端服務無日誌輸出"
          description: "後端服務在過去 10 分鐘內沒有日誌輸出"
          
      # 資料庫連接錯誤
      - alert: DatabaseConnectionError
        expr: |
          sum(rate({service="mking-backend"} |= "database connection failed"[5m])) > 0
        for: 1m
        labels:
          severity: critical
          service: database
        annotations:
          summary: "資料庫連接失敗"
          description: "檢測到資料庫連接失敗錯誤"
          
      # 認證失敗過多
      - alert: HighAuthFailureRate
        expr: |
          sum(rate({service="mking-backend", module="auth"} |= "authentication failed"[5m])) > 10
        for: 2m
        labels:
          severity: warning
          service: auth
        annotations:
          summary: "認證失敗率過高"
          description: "過去 5 分鐘內認證失敗次數超過 10 次，可能存在暴力破解攻擊"
```

### 5.2 Grafana 告警配置

#### 創建告警通知渠道 (Grafana UI 配置):

1. 登入 Grafana (http://localhost:3000)
2. 進入 Alerting > Notification channels
3. 添加新的通知渠道:
   - **Name**: mking-alerts
   - **Type**: Webhook
   - **URL**: http://your-webhook-url
   - **HTTP Method**: POST

## 6. 運維和監控

### 6.1 日誌輪轉配置

#### 創建 `config/logrotate/logrotate.conf`:

```bash
# 日誌輪轉配置
/app/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        /usr/bin/docker kill -s USR1 mking-backend
    endscript
}

/var/log/nginx/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 644 nginx nginx
    postrotate
        /usr/bin/docker kill -s USR1 mking-nginx
    endscript
}
```

### 6.2 監控指標

#### 創建監控腳本 `scripts/monitor-logs.sh`:

```bash
#!/bin/bash

# 日誌監控腳本
LOG_DIR="./logs"
LOKI_URL="http://localhost:3100"
ALERT_WEBHOOK="your-webhook-url"

# 檢查日誌文件大小
check_log_size() {
    local max_size=100  # MB
    for log_file in "$LOG_DIR"/*.log; do
        if [ -f "$log_file" ]; then
            size=$(du -m "$log_file" | cut -f1)
            if [ "$size" -gt "$max_size" ]; then
                echo "警告: 日誌文件 $log_file 大小超過 ${max_size}MB"
                # 發送告警
                curl -X POST "$ALERT_WEBHOOK" \
                    -H "Content-Type: application/json" \
                    -d "{\"message\": \"日誌文件過大: $log_file ($size MB)\"}"
            fi
        fi
    done
}

# 檢查 Loki 健康狀態
check_loki_health() {
    if ! curl -s "$LOKI_URL/ready" > /dev/null; then
        echo "錯誤: Loki 服務不可用"
        curl -X POST "$ALERT_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{\"message\": \"Loki 服務不可用\"}"
        return 1
    fi
    echo "Loki 服務正常"
    return 0
}

# 檢查磁碟空間
check_disk_space() {
    local threshold=80
    local usage=$(df /var/lib/docker | tail -1 | awk '{print $5}' | sed 's/%//')
    
    if [ "$usage" -gt "$threshold" ]; then
        echo "警告: 磁碟使用率 ${usage}% 超過閾值 ${threshold}%"
        curl -X POST "$ALERT_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{\"message\": \"磁碟空間不足: ${usage}%\"}"
    fi
}

# 主函數
main() {
    echo "開始日誌監控檢查 - $(date)"
    check_log_size
    check_loki_health
    check_disk_space
    echo "監控檢查完成 - $(date)"
}

main
```

### 6.3 備份策略

#### 創建備份腳本 `scripts/backup-logs.sh`:

```bash
#!/bin/bash

# 日誌備份腳本
BACKUP_DIR="./backups/logs"
LOG_DIR="./logs"
RETENTION_DAYS=90
S3_BUCKET="mking-logs-backup"  # 如果使用 S3

# 創建備份目錄
mkdir -p "$BACKUP_DIR"

# 壓縮並備份日誌
backup_logs() {
    local date_str=$(date +"%Y%m%d")
    local backup_file="$BACKUP_DIR/logs-$date_str.tar.gz"
    
    echo "開始備份日誌到 $backup_file"
    tar -czf "$backup_file" -C "$LOG_DIR" .
    
    if [ $? -eq 0 ]; then
        echo "日誌備份成功: $backup_file"
        
        # 可選: 上傳到 S3
        # aws s3 cp "$backup_file" "s3://$S3_BUCKET/"
        
        # 可選: 上傳到 MinIO
        # mc cp "$backup_file" "minio/logs-backup/"
    else
        echo "日誌備份失敗"
        exit 1
    fi
}

# 清理舊備份
cleanup_old_backups() {
    echo "清理 $RETENTION_DAYS 天前的備份"
    find "$BACKUP_DIR" -name "logs-*.tar.gz" -mtime +$RETENTION_DAYS -delete
}

# 主函數
main() {
    echo "開始日誌備份 - $(date)"
    backup_logs
    cleanup_old_backups
    echo "日誌備份完成 - $(date)"
}

main
```

## 7. 故障排除

### 7.1 常見問題和解決方案

#### 問題 1: Loki 無法啟動
```bash
# 檢查配置文件語法
docker run --rm -v $(pwd)/config/loki:/etc/loki grafana/loki:latest -config.file=/etc/loki/loki.yml -verify-config

# 檢查權限
sudo chown -R 10001:10001 ./loki_data

# 檢查日誌
docker-compose logs loki
```

#### 問題 2: Promtail 無法收集日誌
```bash
# 檢查 Promtail 狀態
curl http://localhost:9080/metrics

# 檢查目標狀態
curl http://localhost:9080/targets

# 檢查配置
docker run --rm -v $(pwd)/config/promtail:/etc/promtail grafana/promtail:latest -config.file=/etc/promtail/promtail.yml -dry-run
```

#### 問題 3: 查詢性能慢
```bash
# 檢查查詢統計
curl http://localhost:3100/metrics | grep loki_query

# 優化查詢
# 1. 使用更具體的標籤選擇器
# 2. 縮小時間範圍
# 3. 避免高基數標籤
```

### 7.2 性能調優

#### Loki 性能優化:
```yaml
# 在 loki.yml 中調整以下參數
limits_config:
  max_query_parallelism: 64  # 增加並行查詢數
  max_concurrent_tail_requests: 20  # 增加並發尾隨請求
  ingestion_rate_mb: 32  # 增加攝取速率
  ingestion_burst_size_mb: 64  # 增加突發大小

querier:
  max_concurrent: 20  # 增加並發查詢數
  
query_range:
  parallelise_shardable_queries: true  # 啟用查詢分片
```

## 8. 部署檢查清單

### 8.1 部署前檢查
- [ ] Docker 和 Docker Compose 已安裝
- [ ] 配置文件已創建並驗證
- [ ] 存儲目錄權限正確
- [ ] 網路配置正確
- [ ] 防火牆規則已配置

### 8.2 部署後驗證
- [ ] 所有服務正常啟動
- [ ] Loki API 可訪問 (http://localhost:3100/ready)
- [ ] Promtail 正在收集日誌
- [ ] Grafana 可以查詢 Loki 數據
- [ ] 告警規則正常工作
- [ ] 日誌輪轉正常

### 8.3 監控檢查
- [ ] 日誌攝取速率正常
- [ ] 查詢響應時間合理
- [ ] 存儲使用量在預期範圍
- [ ] 錯誤率在可接受範圍
- [ ] 告警通知正常

---

**下一步**: 開始階段 1 的基礎設施部署，並逐步實施完整的日誌管理解決方案。