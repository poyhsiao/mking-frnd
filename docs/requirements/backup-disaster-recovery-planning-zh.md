# MKing Friend 平台 - 備份與災難恢復規劃

## 1. 功能概述

### 1.1 服務範圍

**核心備份功能**
- 資料庫備份與恢復 (PostgreSQL, Redis)
- 應用程式碼備份 (Git 倉庫)
- 用戶上傳文件備份 (圖片、影片、文檔)
- 系統配置備份 (環境變數、配置文件)
- 日誌文件備份 (應用日誌、系統日誌)
- 自動化備份調度

**災難恢復服務**
- 快速恢復機制
- 數據完整性驗證
- 業務連續性保障
- 恢復時間優化
- 恢復點目標管理
- 災難演練計劃

**監控與告警**
- 備份狀態監控
- 失敗告警通知
- 存儲空間監控
- 恢復測試自動化
- 性能指標追蹤

### 1.2 目標用戶

**主要用戶群體**
- 系統管理員
- DevOps 工程師
- 數據庫管理員
- 技術主管

**次要用戶群體**
- 開發團隊
- 運營團隊
- 安全團隊
- 業務負責人

### 1.3 服務目標

**可靠性目標**
- 數據零丟失 (RPO = 0)
- 快速恢復 (RTO < 4小時)
- 備份成功率 >99.9%
- 數據完整性 100%

**業務目標**
- 保障業務連續性
- 降低數據丟失風險
- 提升系統可用性
- 滿足合規要求
- 降低運營成本

## 2. 技術方案比較

### 2.1 資料庫備份方案

#### 2.1.1 PostgreSQL 備份策略

**方案比較**

| 方案 | 優點 | 缺點 | 適用場景 | 成本 |
|------|------|------|----------|------|
| pg_dump | 邏輯備份，跨版本兼容 | 速度慢，鎖表時間長 | 小型數據庫 | 免費 |
| pg_basebackup | 物理備份，速度快 | 版本依賴，空間占用大 | 大型數據庫 | 免費 |
| WAL-E/WAL-G | 增量備份，空間效率高 | 配置複雜 | 生產環境 | 免費 |
| Streaming Replication | 實時同步，零數據丟失 | 資源消耗大 | 高可用需求 | 免費 |

**推薦方案：pg_basebackup + WAL-G (Self-hosted)**

```bash
#!/bin/bash
# PostgreSQL 自動備份腳本

# 配置變數
DB_NAME="mking_friend"
DB_USER="postgres"
DB_HOST="localhost"
BACKUP_DIR="/backup/postgresql"
LOCAL_BACKUP_DIR="/backup/local"
REMOTE_BACKUP_HOST="backup-server"
RETENTION_DAYS=30
LOG_FILE="/var/log/backup/postgresql.log"

# 創建備份目錄
mkdir -p $BACKUP_DIR $LOCAL_BACKUP_DIR
mkdir -p $(dirname $LOG_FILE)

# 日誌函數
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $LOG_FILE
}

# 全量備份函數
full_backup() {
    local backup_name="full_backup_$(date +%Y%m%d_%H%M%S)"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    log "開始全量備份: $backup_name"
    
    # 使用 pg_basebackup 進行物理備份
    pg_basebackup -h $DB_HOST -U $DB_USER -D $backup_path -Ft -z -P -v
    
    if [ $? -eq 0 ]; then
        log "全量備份成功: $backup_path"
        
        # 同步到遠程備份服務器
        rsync -av --delete $backup_path/ $REMOTE_BACKUP_HOST:/backup/postgresql/$backup_name/
        
        if [ $? -eq 0 ]; then
            log "備份同步到遠程服務器成功"
            # 本地保留最近3天的備份
            find $BACKUP_DIR -name "full_backup_*" -mtime +3 -exec rm -rf {} \;
        else
            log "ERROR: 備份同步失敗"
        fi
    else
        log "ERROR: 全量備份失敗"
        exit 1
    fi
}

# 增量備份函數 (WAL 文件)
wal_backup() {
    log "開始 WAL 文件備份"
    
    # WAL 文件路徑
    WAL_DIR="/var/lib/postgresql/data/pg_wal"
    WAL_BACKUP_DIR="$BACKUP_DIR/wal"
    
    mkdir -p $WAL_BACKUP_DIR
    
    # 複製 WAL 文件
    rsync -av $WAL_DIR/ $WAL_BACKUP_DIR/
    
    if [ $? -eq 0 ]; then
        log "WAL 備份成功"
        
        # 同步到遠程服務器
        rsync -av $WAL_BACKUP_DIR/ $REMOTE_BACKUP_HOST:/backup/postgresql/wal/
        
        # 清理過期 WAL 文件（保留7天）
        find $WAL_BACKUP_DIR -name "*.wal" -mtime +7 -delete
    else
        log "ERROR: WAL 備份失敗"
        exit 1
    fi
}

# 邏輯備份函數 (用於跨版本恢復)
logical_backup() {
    local backup_name="logical_backup_$(date +%Y%m%d_%H%M%S).sql"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    log "開始邏輯備份: $backup_name"
    
    # 使用 pg_dump 進行邏輯備份
    pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME -f $backup_path --verbose
    
    if [ $? -eq 0 ]; then
        log "邏輯備份成功: $backup_path"
        
        # 壓縮備份文件
        gzip $backup_path
        
        # 同步到遠程服務器
        scp "$backup_path.gz" $REMOTE_BACKUP_HOST:/backup/postgresql/logical/
        
        if [ $? -eq 0 ]; then
            log "邏輯備份同步成功"
            # 本地保留最近7天的邏輯備份
            find $BACKUP_DIR -name "logical_backup_*.sql.gz" -mtime +7 -delete
        else
            log "ERROR: 邏輯備份同步失敗"
        fi
    else
        log "ERROR: 邏輯備份失敗"
        exit 1
    fi
}

# 備份驗證函數
verify_backup() {
    local backup_path=$1
    
    log "開始驗證備份: $backup_path"
    
    # 檢查備份文件完整性
    if [ -f "$backup_path/base.tar.gz" ]; then
        tar -tzf "$backup_path/base.tar.gz" > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            log "備份文件完整性驗證通過"
            return 0
        else
            log "ERROR: 備份文件損壞"
            return 1
        fi
    else
        log "ERROR: 備份文件不存在"
        return 1
    fi
}

# 主執行邏輯
case "$1" in
    "full")
        full_backup
        ;;
    "wal")
        wal_backup
        ;;
    "logical")
        logical_backup
        ;;
    "verify")
        verify_backup "$2"
        ;;
    *)
        echo "使用方法: $0 {full|wal|logical|verify}"
        exit 1
        ;;
esac

log "備份腳本執行完成"
```

#### 2.1.2 Redis 備份策略

**方案比較**

| 方案 | 優點 | 缺點 | 適用場景 | 成本 |
|------|------|------|----------|------|
| RDB 快照 | 文件小，恢復快 | 可能丟失最新數據 | 定期備份 | 免費 |
| AOF 日誌 | 數據完整性高 | 文件大，恢復慢 | 實時備份 | 免費 |
| RDB + AOF | 兼具兩者優點 | 配置複雜 | 生產環境 | 免費 |
| Redis Replication | 實時同步 | 資源消耗 | 高可用 | 免費 |

**推薦方案：RDB + AOF (Self-hosted)**

```bash
#!/bin/bash
# Redis 備份腳本

REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD="your_password"
BACKUP_DIR="/backup/redis"
REMOTE_BACKUP_HOST="backup-server"
LOG_FILE="/var/log/backup/redis.log"

# 創建備份目錄
mkdir -p $BACKUP_DIR
mkdir -p $(dirname $LOG_FILE)

# 日誌函數
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $LOG_FILE
}

# Redis 備份函數
redis_backup() {
    local backup_name="redis_backup_$(date +%Y%m%d_%H%M%S)"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    log "開始 Redis 備份: $backup_name"
    
    # 創建備份目錄
    mkdir -p $backup_path
    
    # 執行 BGSAVE 命令
    redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD BGSAVE
    
    # 等待備份完成
    while [ $(redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD LASTSAVE) -eq $(redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD LASTSAVE) ]; do
        sleep 1
    done
    
    # 複製 RDB 文件
    cp /var/lib/redis/dump.rdb $backup_path/
    
    # 複製 AOF 文件（如果啟用）
    if [ -f "/var/lib/redis/appendonly.aof" ]; then
        cp /var/lib/redis/appendonly.aof $backup_path/
    fi
    
    # 壓縮備份
    tar -czf "$backup_path.tar.gz" -C $BACKUP_DIR $backup_name
    rm -rf $backup_path
    
    if [ $? -eq 0 ]; then
        log "Redis 備份成功: $backup_path.tar.gz"
        
        # 同步到遠程服務器
        scp "$backup_path.tar.gz" $REMOTE_BACKUP_HOST:/backup/redis/
        
        if [ $? -eq 0 ]; then
            log "Redis 備份同步成功"
            # 本地保留最近7天的備份
            find $BACKUP_DIR -name "redis_backup_*.tar.gz" -mtime +7 -delete
        else
            log "ERROR: Redis 備份同步失敗"
        fi
    else
        log "ERROR: Redis 備份失敗"
        exit 1
    fi
}

# 執行備份
redis_backup

log "Redis 備份腳本執行完成"
```

### 2.2 應用程式碼備份方案

#### 2.2.1 Git 倉庫備份

**方案比較**

| 方案 | 優點 | 缺點 | 適用場景 | 成本 |
|------|------|------|----------|------|
| Git Mirror | 完整歷史，自動同步 | 需要額外倉庫 | 主要方案 | 免費 |
| Git Bundle | 單文件，易傳輸 | 手動操作 | 離線備份 | 免費 |
| 壓縮打包 | 簡單直接 | 無版本信息 | 快照備份 | 免費 |
| 雲端倉庫 | 自動備份，高可用 | 依賴第三方 | 輔助方案 | 免費/付費 |

**推薦方案：Git Mirror + 本地備份 (Self-hosted)**

```bash
#!/bin/bash
# Git 倉庫備份腳本

SOURCE_REPO="/path/to/mking-friend"
BACKUP_DIR="/backup/git"
REMOTE_BACKUP_HOST="backup-server"
REMOTE_BACKUP_DIR="/backup/mking-friend/git"
LOG_FILE="/var/log/backup/git.log"

# 創建備份目錄
mkdir -p $BACKUP_DIR
mkdir -p $(dirname $LOG_FILE)

# 日誌函數
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $LOG_FILE
}

# Git 鏡像備份
git_mirror_backup() {
    local backup_name="git_mirror_$(date +%Y%m%d_%H%M%S)"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    log "開始 Git 鏡像備份: $backup_name"
    
    # 創建裸倉庫鏡像
    git clone --mirror $SOURCE_REPO $backup_path
    
    if [ $? -eq 0 ]; then
        log "Git 鏡像備份成功: $backup_path"
        
        # 壓縮備份
        tar -czf "$backup_path.tar.gz" -C $BACKUP_DIR $backup_name
        rm -rf $backup_path
        
        # 同步到遠程服務器
        scp "$backup_path.tar.gz" $REMOTE_BACKUP_HOST:$REMOTE_BACKUP_DIR/
        
        if [ $? -eq 0 ]; then
            log "Git 備份同步成功"
            # 本地保留最近30天的備份
            find $BACKUP_DIR -name "git_mirror_*.tar.gz" -mtime +30 -delete
        else
            log "ERROR: Git 備份同步失敗"
        fi
    else
        log "ERROR: Git 鏡像備份失敗"
        exit 1
    fi
}

# Git Bundle 備份
git_bundle_backup() {
    local backup_name="git_bundle_$(date +%Y%m%d_%H%M%S).bundle"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    log "開始 Git Bundle 備份: $backup_name"
    
    cd $SOURCE_REPO
    
    # 創建 bundle 文件
    git bundle create $backup_path --all
    
    if [ $? -eq 0 ]; then
        log "Git Bundle 備份成功: $backup_path"
        
        # 驗證 bundle 完整性
        git bundle verify $backup_path
        
        if [ $? -eq 0 ]; then
            log "Git Bundle 驗證通過"
            
            # 同步到遠程服務器
            scp $backup_path $REMOTE_BACKUP_HOST:$REMOTE_BACKUP_DIR/bundles/
            
            if [ $? -eq 0 ]; then
                log "Git Bundle 同步成功"
                # 本地保留最近7天的 bundle
                find $BACKUP_DIR -name "git_bundle_*.bundle" -mtime +7 -delete
            else
                log "ERROR: Git Bundle 同步失敗"
            fi
        else
            log "ERROR: Git Bundle 驗證失敗"
            rm -f $backup_path
        fi
    else
        log "ERROR: Git Bundle 備份失敗"
        exit 1
    fi
}

# 主執行邏輯
case "$1" in
    "mirror")
        git_mirror_backup
        ;;
    "bundle")
        git_bundle_backup
        ;;
    "all")
        git_mirror_backup
        git_bundle_backup
        ;;
    *)
        echo "使用方法: $0 {mirror|bundle|all}"
        exit 1
        ;;
esac

log "Git 備份腳本執行完成"
```

### 2.3 文件備份方案

#### 2.3.1 用戶上傳文件備份

**方案比較**

| 方案 | 優點 | 缺點 | 適用場景 | 成本 |
|------|------|------|----------|------|
| rsync | 增量同步，效率高 | 需要目標服務器 | 服務器間同步 | 免費 |
| tar + 壓縮 | 簡單可靠 | 全量備份 | 定期歸檔 | 免費 |
| 分布式存儲 | 自動冗餘 | 複雜度高 | 大規模部署 | 免費/付費 |
| 雲端同步 | 高可用性 | 網絡依賴 | 混合備份 | 付費 |

**推薦方案：rsync + 本地備份 (Self-hosted)**

```bash
#!/bin/bash
# 文件備份腳本

SOURCE_DIR="/var/www/mking-friend/uploads"
LOCAL_BACKUP_DIR="/backup/files"
REMOTE_BACKUP_HOST="backup-server"
REMOTE_BACKUP_DIR="/backup/mking-friend/files"
LOG_FILE="/var/log/backup/files.log"
EXCLUDE_FILE="/etc/backup/file-exclude.txt"

# 創建備份目錄
mkdir -p $LOCAL_BACKUP_DIR
mkdir -p $(dirname $LOG_FILE)

# 日誌函數
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $LOG_FILE
}

# 創建排除文件列表
create_exclude_file() {
    cat > $EXCLUDE_FILE << EOF
*.tmp
*.log
*.cache
.DS_Store
Thumbs.db
*.swp
*.swo
*~
EOF
}

# 本地備份
local_backup() {
    local backup_name="files_$(date +%Y%m%d_%H%M%S)"
    local backup_path="$LOCAL_BACKUP_DIR/$backup_name"
    
    log "開始本地文件備份: $backup_name"
    
    # 使用 rsync 進行增量備份
    rsync -av --delete --exclude-from=$EXCLUDE_FILE $SOURCE_DIR/ $backup_path/
    
    if [ $? -eq 0 ]; then
        log "本地文件備份成功: $backup_path"
        
        # 創建備份信息文件
        echo "Backup Date: $(date)" > $backup_path/.backup_info
        echo "Source: $SOURCE_DIR" >> $backup_path/.backup_info
        echo "File Count: $(find $backup_path -type f | wc -l)" >> $backup_path/.backup_info
        echo "Total Size: $(du -sh $backup_path | cut -f1)" >> $backup_path/.backup_info
        
        return 0
    else
        log "ERROR: 本地文件備份失敗"
        return 1
    fi
}

# 遠程備份
remote_backup() {
    log "開始遠程文件備份"
    
    # 使用 rsync 同步到遠程服務器
    rsync -av --delete --exclude-from=$EXCLUDE_FILE -e ssh $SOURCE_DIR/ $REMOTE_BACKUP_HOST:$REMOTE_BACKUP_DIR/
    
    if [ $? -eq 0 ]; then
        log "遠程文件備份成功"
        return 0
    else
        log "ERROR: 遠程文件備份失敗"
        return 1
    fi
}

# 備份驗證
verify_backup() {
    local backup_path=$1
    
    log "開始驗證備份: $backup_path"
    
    if [ -d "$backup_path" ]; then
        # 檢查備份目錄是否存在且非空
        if [ "$(ls -A $backup_path)" ]; then
            # 隨機檢查幾個文件的完整性
            local sample_files=$(find $backup_path -type f | shuf -n 5)
            local verification_passed=true
            
            for file in $sample_files; do
                local original_file="${file/$backup_path/$SOURCE_DIR}"
                if [ -f "$original_file" ]; then
                    if ! cmp -s "$file" "$original_file"; then
                        log "ERROR: 文件不匹配: $file"
                        verification_passed=false
                    fi
                fi
            done
            
            if [ "$verification_passed" = true ]; then
                log "備份驗證通過"
                return 0
            else
                log "ERROR: 備份驗證失敗"
                return 1
            fi
        else
            log "ERROR: 備份目錄為空"
            return 1
        fi
    else
        log "ERROR: 備份目錄不存在"
        return 1
    fi
}

# 清理過期備份
cleanup_old_backups() {
    log "開始清理過期備份"
    
    # 清理本地過期備份（保留30天）
    find $LOCAL_BACKUP_DIR -name "files_*" -mtime +30 -exec rm -rf {} \;
    
    log "過期備份清理完成"
}

# 創建排除文件
create_exclude_file

# 主執行邏輯
case "$1" in
    "local")
        local_backup
        ;;
    "remote")
        remote_backup
        ;;
    "verify")
        verify_backup "$2"
        ;;
    "cleanup")
        cleanup_old_backups
        ;;
    "all")
        local_backup && remote_backup
        ;;
    *)
        echo "使用方法: $0 {local|remote|verify|cleanup|all}"
        exit 1
        ;;
esac

log "文件備份腳本執行完成"
```

### 2.4 自動化調度配置

#### 2.4.1 Cron 定時任務配置

**推薦調度策略**

```bash
# /etc/crontab 或 crontab -e

# PostgreSQL 備份
# 每日凌晨 2:00 執行全量備份
0 2 * * * root /backup/scripts/postgresql_backup.sh full

# 每小時執行 WAL 備份
0 * * * * root /backup/scripts/postgresql_backup.sh wal

# 每週日執行邏輯備份
0 3 * * 0 root /backup/scripts/postgresql_backup.sh logical

# Redis 備份
# 每日凌晨 3:00 執行 Redis 備份
0 3 * * * root /backup/scripts/redis_backup.sh

# Git 倉庫備份
# 每日凌晨 4:00 執行 Git 鏡像備份
0 4 * * * root /backup/scripts/git_backup.sh mirror

# 每週執行 Git Bundle 備份
0 5 * * 0 root /backup/scripts/git_backup.sh bundle

# 文件備份
# 每日凌晨 1:00 執行文件備份
0 1 * * * root /backup/scripts/files_backup.sh all

# 備份驗證
# 每日上午 8:00 執行備份驗證
0 8 * * * root /backup/scripts/verify_backups.sh

# 清理過期備份
# 每週日凌晨 6:00 清理過期備份
0 6 * * 0 root /backup/scripts/cleanup_backups.sh
```

#### 2.4.2 Systemd Timer 配置（推薦）

**創建 Timer 服務**

```ini
# /etc/systemd/system/postgresql-backup.timer
[Unit]
Description=PostgreSQL Backup Timer
Requires=postgresql-backup.service

[Timer]
# 每日凌晨 2:00 執行
OnCalendar=*-*-* 02:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

```ini
# /etc/systemd/system/postgresql-backup.service
[Unit]
Description=PostgreSQL Backup Service
After=postgresql.service

[Service]
Type=oneshot
User=postgres
ExecStart=/backup/scripts/postgresql_backup.sh full
StandardOutput=journal
StandardError=journal
```

**啟用 Timer**

```bash
# 重新載入 systemd 配置
sudo systemctl daemon-reload

# 啟用並啟動 timer
sudo systemctl enable postgresql-backup.timer
sudo systemctl start postgresql-backup.timer

# 查看 timer 狀態
sudo systemctl list-timers
```

### 2.5 監控與告警配置

#### 2.5.1 備份狀態監控腳本

```bash
#!/bin/bash
# 備份監控腳本

BACKUP_LOG_DIR="/var/log/backup"
MONITOR_LOG="/var/log/backup/monitor.log"
ALERT_EMAIL="admin@mking-friend.com"
SLACK_WEBHOOK="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"

# 日誌函數
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $MONITOR_LOG
}

# 發送告警郵件
send_alert_email() {
    local subject="$1"
    local message="$2"
    
    echo "$message" | mail -s "$subject" $ALERT_EMAIL
}

# 發送 Slack 通知
send_slack_notification() {
    local message="$1"
    local color="$2"  # good, warning, danger
    
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"attachments\":[{\"color\":\"$color\",\"text\":\"$message\"}]}" \
        $SLACK_WEBHOOK
}

# 檢查備份狀態
check_backup_status() {
    local backup_type="$1"
    local log_file="$BACKUP_LOG_DIR/${backup_type}.log"
    local hours_threshold=25  # 25小時內應該有備份
    
    if [ -f "$log_file" ]; then
        # 檢查最近的備份時間
        local last_backup=$(tail -n 100 $log_file | grep "備份成功" | tail -n 1 | cut -d' ' -f1-2)
        
        if [ -n "$last_backup" ]; then
            local last_backup_timestamp=$(date -d "$last_backup" +%s)
            local current_timestamp=$(date +%s)
            local hours_diff=$(( (current_timestamp - last_backup_timestamp) / 3600 ))
            
            if [ $hours_diff -gt $hours_threshold ]; then
                log "WARNING: $backup_type 備份超過 $hours_diff 小時未執行"
                send_alert_email "備份告警: $backup_type" "$backup_type 備份超過 $hours_diff 小時未執行，最後備份時間: $last_backup"
                send_slack_notification "⚠️ $backup_type 備份超過 $hours_diff 小時未執行" "warning"
                return 1
            else
                log "INFO: $backup_type 備份正常，最後備份: $last_backup"
                return 0
            fi
        else
            log "ERROR: $backup_type 備份日誌中未找到成功記錄"
            send_alert_email "備份錯誤: $backup_type" "$backup_type 備份日誌中未找到成功記錄"
            send_slack_notification "🚨 $backup_type 備份日誌中未找到成功記錄" "danger"
            return 1
        fi
    else
        log "ERROR: $backup_type 備份日誌文件不存在: $log_file"
        send_alert_email "備份錯誤: $backup_type" "$backup_type 備份日誌文件不存在: $log_file"
        send_slack_notification "🚨 $backup_type 備份日誌文件不存在" "danger"
        return 1
    fi
}

# 檢查存儲空間
check_storage_space() {
    local backup_dir="/backup"
    local threshold=90  # 90% 使用率告警
    
    local usage=$(df $backup_dir | tail -1 | awk '{print $5}' | sed 's/%//')
    
    if [ $usage -gt $threshold ]; then
        log "WARNING: 備份存儲空間使用率 $usage% 超過閾值 $threshold%"
        send_alert_email "存儲空間告警" "備份存儲空間使用率 $usage% 超過閾值 $threshold%"
        send_slack_notification "⚠️ 備份存儲空間使用率 $usage% 超過閾值" "warning"
        return 1
    else
        log "INFO: 備份存儲空間使用率正常: $usage%"
        return 0
    fi
}

# 主監控邏輯
log "開始備份狀態監控"

# 檢查各類備份狀態
check_backup_status "postgresql"
check_backup_status "redis"
check_backup_status "git"
check_backup_status "files"

# 檢查存儲空間
check_storage_space

log "備份狀態監控完成"
```

#### 2.5.2 監控 Cron 配置

```bash
# 每小時檢查備份狀態
0 * * * * root /backup/scripts/backup_monitor.sh

# 每日生成備份報告
0 9 * * * root /backup/scripts/generate_backup_report.sh
```

## 3. 數據庫設計

### 3.1 備份配置表

```sql
-- 備份配置表
CREATE TABLE backup_configurations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    backup_type VARCHAR(50) NOT NULL, -- 'postgresql', 'redis', 'files', 'git'
    source_path TEXT NOT NULL,
    destination_path TEXT NOT NULL,
    schedule_cron VARCHAR(100),
    retention_days INTEGER DEFAULT 30,
    compression_enabled BOOLEAN DEFAULT true,
    encryption_enabled BOOLEAN DEFAULT false,
    remote_backup_enabled BOOLEAN DEFAULT false,
    remote_host VARCHAR(255),
    remote_path TEXT,
    notification_enabled BOOLEAN DEFAULT true,
    notification_email VARCHAR(255),
    notification_slack_webhook TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 備份執行記錄表
CREATE TABLE backup_executions (
    id SERIAL PRIMARY KEY,
    configuration_id INTEGER REFERENCES backup_configurations(id),
    execution_type VARCHAR(50) NOT NULL, -- 'full', 'incremental', 'wal', 'logical'
    status VARCHAR(50) NOT NULL, -- 'running', 'success', 'failed', 'cancelled'
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    duration_seconds INTEGER,
    backup_size_bytes BIGINT,
    backup_path TEXT,
    file_count INTEGER,
    error_message TEXT,
    verification_status VARCHAR(50), -- 'pending', 'passed', 'failed', 'skipped'
    verification_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 恢復任務表
CREATE TABLE restore_tasks (
    id SERIAL PRIMARY KEY,
    backup_execution_id INTEGER REFERENCES backup_executions(id),
    restore_type VARCHAR(50) NOT NULL, -- 'full', 'partial', 'point_in_time'
    target_path TEXT NOT NULL,
    restore_point TIMESTAMP,
    status VARCHAR(50) NOT NULL, -- 'pending', 'running', 'success', 'failed', 'cancelled'
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    duration_seconds INTEGER,
    restored_size_bytes BIGINT,
    restored_file_count INTEGER,
    error_message TEXT,
    requested_by VARCHAR(100),
    approved_by VARCHAR(100),
    approval_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 備份驗證記錄表
CREATE TABLE backup_verifications (
    id SERIAL PRIMARY KEY,
    backup_execution_id INTEGER REFERENCES backup_executions(id),
    verification_type VARCHAR(50) NOT NULL, -- 'checksum', 'restore_test', 'file_integrity'
    status VARCHAR(50) NOT NULL, -- 'pending', 'running', 'passed', 'failed'
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    duration_seconds INTEGER,
    verified_file_count INTEGER,
    failed_file_count INTEGER,
    checksum_match BOOLEAN,
    error_details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 存儲空間監控表
CREATE TABLE storage_monitoring (
    id SERIAL PRIMARY KEY,
    storage_path VARCHAR(255) NOT NULL,
    total_space_bytes BIGINT NOT NULL,
    used_space_bytes BIGINT NOT NULL,
    available_space_bytes BIGINT NOT NULL,
    usage_percentage DECIMAL(5,2) NOT NULL,
    threshold_warning INTEGER DEFAULT 80,
    threshold_critical INTEGER DEFAULT 90,
    alert_sent BOOLEAN DEFAULT false,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 災難恢復計劃表
CREATE TABLE disaster_recovery_plans (
    id SERIAL PRIMARY KEY,
    plan_name VARCHAR(100) NOT NULL UNIQUE,
    disaster_type VARCHAR(50) NOT NULL, -- 'hardware_failure', 'data_corruption', 'security_breach', 'natural_disaster'
    priority_level INTEGER NOT NULL, -- 1-5, 1 being highest priority
    rpo_minutes INTEGER NOT NULL, -- Recovery Point Objective in minutes
    rto_minutes INTEGER NOT NULL, -- Recovery Time Objective in minutes
    recovery_steps TEXT NOT NULL,
    required_resources TEXT,
    contact_list TEXT,
    test_schedule VARCHAR(100),
    last_tested TIMESTAMP,
    test_results TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3.2 索引設計

```sql
-- 備份配置表索引
CREATE INDEX idx_backup_configurations_type ON backup_configurations(backup_type);
CREATE INDEX idx_backup_configurations_active ON backup_configurations(is_active);

-- 備份執行記錄表索引
CREATE INDEX idx_backup_executions_config_id ON backup_executions(configuration_id);
CREATE INDEX idx_backup_executions_status ON backup_executions(status);
CREATE INDEX idx_backup_executions_start_time ON backup_executions(start_time);
CREATE INDEX idx_backup_executions_type_status ON backup_executions(execution_type, status);

-- 恢復任務表索引
CREATE INDEX idx_restore_tasks_backup_id ON restore_tasks(backup_execution_id);
CREATE INDEX idx_restore_tasks_status ON restore_tasks(status);
CREATE INDEX idx_restore_tasks_start_time ON restore_tasks(start_time);

-- 備份驗證記錄表索引
CREATE INDEX idx_backup_verifications_backup_id ON backup_verifications(backup_execution_id);
CREATE INDEX idx_backup_verifications_status ON backup_verifications(status);
CREATE INDEX idx_backup_verifications_start_time ON backup_verifications(start_time);

-- 存儲空間監控表索引
CREATE INDEX idx_storage_monitoring_path ON storage_monitoring(storage_path);
CREATE INDEX idx_storage_monitoring_recorded_at ON storage_monitoring(recorded_at);
CREATE INDEX idx_storage_monitoring_usage ON storage_monitoring(usage_percentage);

-- 災難恢復計劃表索引
CREATE INDEX idx_disaster_recovery_plans_type ON disaster_recovery_plans(disaster_type);
CREATE INDEX idx_disaster_recovery_plans_priority ON disaster_recovery_plans(priority_level);
CREATE INDEX idx_disaster_recovery_plans_active ON disaster_recovery_plans(is_active);
```

## 4. 系統架構設計

### 4.1 備份系統架構總覽

```
┌─────────────────────────────────────────────────────────────────┐
│                    MKing Friend 備份與災難恢復系統                    │
├─────────────────────────────────────────────────────────────────┤
│                          應用層                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Web UI    │  │  Admin CLI  │  │   API       │  │  監控面板    │ │
│  │   備份管理   │  │   備份腳本   │  │   備份服務   │  │   狀態監控   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                          服務層                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │ 備份調度器   │  │ 備份執行器   │  │ 驗證服務    │  │ 告警服務    │ │
│  │ Scheduler   │  │ Executor    │  │ Validator   │  │ Alerting    │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │ 恢復管理器   │  │ 存儲管理器   │  │ 加密服務    │  │ 審計日誌    │ │
│  │ Recovery    │  │ Storage     │  │ Encryption  │  │ Audit Log   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                          數據層                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │ PostgreSQL  │  │    Redis    │  │ 用戶文件    │  │ Git 倉庫    │ │
│  │   主數據庫   │  │   緩存數據   │  │ 上傳文件    │  │  源代碼     │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                          存儲層                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │ 本地存儲    │  │ 遠程存儲    │  │ 對象存儲    │  │ 離線存儲    │ │
│  │ Local NAS   │  │ Remote NAS  │  │ MinIO S3    │  │ Tape/DVD    │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 災難恢復流程

```
┌─────────────────────────────────────────────────────────────────┐
│                        災難恢復流程                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  │   災難檢測   │───▶│   影響評估   │───▶│   恢復決策   │          │
│  │ Disaster    │    │ Impact      │    │ Recovery    │          │
│  │ Detection   │    │ Assessment  │    │ Decision    │          │
│  └─────────────┘    └─────────────┘    └─────────────┘          │
│         │                   │                   │               │
│         ▼                   ▼                   ▼               │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  │ 自動告警    │    │ 手動評估    │    │ 恢復計劃    │          │
│  │ Auto Alert  │    │ Manual      │    │ Recovery    │          │
│  │             │    │ Review      │    │ Plan        │          │
│  └─────────────┘    └─────────────┘    └─────────────┘          │
│                                                │               │
│                                                ▼               │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    恢復執行階段                          │    │
│  │                                                         │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │    │
│  │  │ 基礎設施    │  │ 數據恢復    │  │ 應用恢復    │      │    │
│  │  │ 恢復        │─▶│             │─▶│             │      │    │
│  │  │ Infra       │  │ Data        │  │ Application │      │    │
│  │  │ Recovery    │  │ Recovery    │  │ Recovery    │      │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘      │    │
│  │         │               │               │              │    │
│  │         ▼               ▼               ▼              │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │    │
│  │  │ 服務器重建  │  │ 數據庫恢復  │  │ 服務啟動    │      │    │
│  │  │ 網絡配置    │  │ 文件恢復    │  │ 功能驗證    │      │    │
│  │  │ 安全設置    │  │ 一致性檢查  │  │ 性能測試    │      │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                │               │
│                                                ▼               │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  │ 服務驗證    │───▶│ 用戶通知    │───▶│ 事後分析    │          │
│  │ Service     │    │ User        │    │ Post        │          │
│  │ Validation  │    │ Notification│    │ Analysis    │          │
│  └─────────────┘    └─────────────┘    └─────────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 5. 實施計劃

### 5.1 第一階段：基礎備份功能（1-2 個月）

**目標：建立基本的備份與恢復能力**

- **PostgreSQL 備份**
  - 實施 pg_dump 全量備份
  - 配置 WAL 歸檔
  - 建立基本的備份驗證機制
  - 設置備份保留策略

- **Redis 備份**
  - 配置 RDB 快照備份
  - 實施 AOF 持久化
  - 建立 Redis 備份腳本

- **文件備份**
  - 實施用戶上傳文件的 rsync 備份
  - 配置基本的文件排除規則
  - 建立文件完整性檢查

- **Git 倉庫備份**
  - 設置 Git 鏡像備份
  - 配置自動推送到備份倉庫

- **基礎監控**
  - 實施備份狀態監控
  - 配置基本的郵件告警
  - 建立備份執行日誌

### 5.2 第二階段：進階備份功能（2-3 個月）

**目標：提升備份效率和可靠性**

- **增量備份**
  - 實施 PostgreSQL WAL-G 增量備份
  - 優化文件增量同步
  - 建立備份鏈管理

- **自動化調度**
  - 部署 Systemd Timer 調度
  - 實施備份任務依賴管理
  - 配置動態調度策略

- **備份驗證**
  - 實施自動備份驗證
  - 建立恢復測試機制
  - 配置備份完整性檢查

- **遠程備份**
  - 配置遠程服務器同步
  - 實施網絡備份傳輸
  - 建立多地備份策略

- **進階監控**
  - 部署 Slack 通知
  - 實施存儲空間監控
  - 建立備份性能監控

### 5.3 第三階段：災難恢復與優化（1-2 個月）

**目標：完善災難恢復能力**

- **災難恢復計劃**
  - 制定詳細的恢復流程
  - 建立恢復時間目標（RTO）
  - 設定恢復點目標（RPO）

- **自動化恢復**
  - 實施一鍵恢復腳本
  - 建立恢復驗證機制
  - 配置恢復進度監控

- **加密與安全**
  - 實施備份數據加密
  - 配置訪問控制
  - 建立安全審計日誌

- **性能優化**
  - 優化備份傳輸速度
  - 實施並行備份處理
  - 配置存儲壓縮策略

- **測試與演練**
  - 定期災難恢復演練
  - 建立測試環境
  - 驗證恢復流程有效性

## 6. 技術建議

### 6.1 推薦技術棧

#### 6.1.1 備份工具

**PostgreSQL 備份**
- **主要工具**：pg_dump, pg_basebackup, WAL-G
- **優勢**：官方支持，穩定可靠，功能完整
- **成本**：免費

**Redis 備份**
- **主要工具**：redis-cli, RDB, AOF
- **優勢**：內建支持，配置簡單
- **成本**：免費

**文件備份**
- **主要工具**：rsync, tar, gzip
- **優勢**：高效增量同步，廣泛支持
- **成本**：免費

**Git 備份**
- **主要工具**：git clone --mirror, git bundle
- **優勢**：版本控制原生支持
- **成本**：免費

#### 6.1.2 調度與監控

**任務調度**
- **推薦**：Systemd Timer（主要）+ Cron（備用）
- **優勢**：系統集成度高，日誌管理完善
- **成本**：免費

**監控告警**
- **推薦**：自建腳本 + 郵件 + Slack
- **優勢**：輕量級，可定制化
- **成本**：免費（除 Slack 付費版）

**日誌管理**
- **推薦**：systemd journal + 自定義日誌
- **優勢**：統一日誌管理，查詢方便
- **成本**：免費

#### 6.1.3 存儲方案

**本地存儲**
- **推薦**：LVM + ext4/xfs
- **優勢**：靈活擴展，性能穩定
- **成本**：硬體成本

**遠程存儲**
- **推薦**：NFS/CIFS + rsync
- **優勢**：網絡透明，易於管理
- **成本**：網絡和硬體成本

**遠端對象存儲（推薦）**
- **推薦**：MinIO (Self-hosted S3 兼容對象存儲)
- **備選**：其他 S3 兼容存儲服務
- **優勢**：API 兼容，可自建
- **成本**：自建免費，雲端付費

### 6.2 成本估算

#### 6.2.1 開發成本

| 階段 | 工作內容 | 預估工時 | 人力需求 |
|------|----------|----------|----------|
| 第一階段 | 基礎備份功能 | 160-240 小時 | 1 DevOps 工程師 |
| 第二階段 | 進階備份功能 | 240-320 小時 | 1 DevOps 工程師 |
| 第三階段 | 災難恢復優化 | 120-200 小時 | 1 DevOps 工程師 |
| **總計** | **完整備份系統** | **520-760 小時** | **3-5 人月** |

#### 6.2.2 運營成本（月）

| 項目 | Self-hosted | 雲端服務 | 混合方案 |
|------|-------------|----------|----------|
| 存儲成本 | $50-200 | $100-500 | $75-350 |
| 網絡成本 | $20-50 | $50-200 | $35-125 |
| 維護成本 | $200-500 | $0-100 | $100-300 |
| 監控成本 | $0-50 | $50-150 | $25-100 |
| **總計** | **$270-800** | **$200-950** | **$235-875** |

### 6.3 關鍵指標

#### 6.3.1 備份指標

- **備份成功率**：≥ 99.5%
- **備份完成時間**：
  - PostgreSQL 全量：< 2 小時
  - PostgreSQL WAL：< 5 分鐘
  - Redis：< 30 分鐘
  - 文件：< 4 小時
  - Git：< 1 小時

- **備份驗證率**：100%
- **備份保留期**：
  - 日備份：30 天
  - 週備份：12 週
  - 月備份：12 個月
  - 年備份：7 年

#### 6.3.2 恢復指標

- **恢復點目標（RPO）**：≤ 1 小時
- **恢復時間目標（RTO）**：
  - 數據庫：≤ 4 小時
  - 文件系統：≤ 2 小時
  - 完整系統：≤ 8 小時

- **恢復成功率**：≥ 99%
- **恢復驗證時間**：≤ 1 小時

#### 6.3.3 系統指標

- **存儲使用率**：≤ 80%
- **網絡傳輸效率**：≥ 80%
- **備份壓縮率**：≥ 60%
- **系統可用性**：≥ 99.9%

## 7. 風險評估與應對

### 7.1 技術風險

#### 7.1.1 備份失敗風險

**風險描述**：備份過程中出現錯誤導致備份失敗

**影響程度**：高

**應對策略**：
- 實施多重備份策略（本地 + 遠程）
- 建立備份失敗自動重試機制
- 配置即時告警通知
- 定期備份驗證和測試

#### 7.1.2 數據損壞風險

**風險描述**：備份數據在存儲或傳輸過程中損壞

**影響程度**：高

**應對策略**：
- 實施校驗和驗證機制
- 使用多份備份副本
- 定期進行恢復測試
- 採用錯誤檢測和糾正技術

#### 7.1.3 存儲空間不足

**風險描述**：備份存儲空間耗盡導致備份失敗

**影響程度**：中

**應對策略**：
- 實施存儲空間監控和告警
- 配置自動清理過期備份
- 建立存儲擴展計劃
- 實施數據壓縮和去重

#### 7.1.4 網絡傳輸失敗

**風險描述**：網絡問題導致遠程備份失敗

**影響程度**：中

**應對策略**：
- 實施斷點續傳機制
- 配置多條網絡路徑
- 建立本地備份作為備用
- 實施網絡狀態監控

### 7.2 業務風險

#### 7.2.1 恢復時間過長

**風險描述**：災難恢復時間超過業務容忍度

**影響程度**：高

**應對策略**：
- 優化恢復流程和腳本
- 實施並行恢復處理
- 建立熱備份系統
- 定期進行恢復演練

#### 7.2.2 數據丟失風險

**風險描述**：災難發生時丟失關鍵業務數據

**影響程度**：極高

**應對策略**：
- 縮短備份間隔時間
- 實施實時數據同步
- 建立多地備份策略
- 實施數據版本控制

#### 7.2.3 合規性風險

**風險描述**：備份策略不符合法規要求

**影響程度**：中

**應對策略**：
- 研究相關法規要求
- 實施數據加密和訪問控制
- 建立審計日誌機制
- 定期合規性檢查

## 8. 未來擴展規劃

### 8.1 中期功能（6-12 個月）

#### 8.1.1 智能備份優化
- **自適應備份策略**：根據數據變化頻率自動調整備份頻率
- **智能壓縮算法**：採用更高效的壓縮技術減少存儲空間
- **預測性維護**：基於歷史數據預測備份失敗風險

#### 8.1.2 多雲備份支持
- **對象存儲集成**：支持 MinIO、AWS S3 兼容存儲等自建方案
- **混合雲策略**：本地 + 多雲的備份分佈策略
- **成本優化**：自動選擇最經濟的存儲方案

#### 8.1.3 高可用性增強
- **主備切換**：實施自動主備切換機制
- **負載均衡**：備份任務的負載分散處理
- **容錯機制**：提升系統容錯能力

### 8.2 長期願景（1-2 年）

#### 8.2.1 AI 驅動的備份管理
- **智能異常檢測**：使用機器學習檢測備份異常
- **自動化決策**：AI 輔助的備份策略優化
- **預測性分析**：預測存儲需求和性能瓶頸

#### 8.2.2 企業級功能
- **多租戶支持**：支持多個獨立的備份環境
- **細粒度權限控制**：實施基於角色的訪問控制
- **合規性自動化**：自動化合規性檢查和報告

#### 8.2.3 創新技術應用
- **區塊鏈驗證**：使用區塊鏈技術驗證備份完整性
- **邊緣計算**：在邊緣節點實施分散式備份
- **量子加密**：採用量子加密技術保護備份數據

## 9. 注意事項

### 9.1 開發注意事項

#### 9.1.1 安全考量
- **數據加密**：所有備份數據必須加密存儲和傳輸
- **訪問控制**：實施嚴格的備份系統訪問控制
- **審計日誌**：記錄所有備份和恢復操作
- **密鑰管理**：建立安全的加密密鑰管理機制

#### 9.1.2 性能考量
- **資源隔離**：備份操作不應影響生產系統性能
- **網絡優化**：優化備份數據傳輸效率
- **存儲優化**：合理規劃存儲空間和 I/O 性能
- **並發控制**：避免備份操作之間的資源競爭

#### 9.1.3 可維護性
- **模組化設計**：採用模組化架構便於維護和擴展
- **標準化配置**：統一配置格式和管理方式
- **文檔完整性**：維護完整的技術文檔和操作手冊
- **版本控制**：對備份腳本和配置進行版本控制

### 9.2 運營注意事項

#### 9.2.1 監控與告警
- **全面監控**：監控備份的各個環節和指標
- **分級告警**：建立不同級別的告警機制
- **響應流程**：制定明確的告警響應流程
- **性能分析**：定期分析備份性能和趨勢

#### 9.2.2 測試與演練
- **定期測試**：定期進行備份恢復測試
- **災難演練**：定期進行災難恢復演練
- **流程驗證**：驗證恢復流程的有效性
- **文檔更新**：根據測試結果更新操作文檔

#### 9.2.3 持續改進
- **性能優化**：持續優化備份性能和效率
- **技術更新**：跟進新技術和最佳實踐
- **流程改進**：根據實際運營經驗改進流程
- **培訓教育**：定期進行團隊技能培訓

---

**文檔版本**：v1.0  
**最後更新**：2024年12月  
**負責人**：DevOps 團隊  
**審核人**：技術總監
    mc cp "$BACKUP_DIR/full_backup_$DATE.dump.gz" "minio/mking-friend-backups/database/full/"
    
    # 驗證備份完整性
    pg_restore --list "$BACKUP_DIR/full_backup_$DATE.dump.gz" > /dev/null
    if [ $? -eq 0 ]; then
        echo "備份驗證成功"
    else
        echo "備份驗證失敗" | mail -s "備份失敗警告" admin@mkingfriend.com
    fi
else
    # 增量備份（每小時）
    echo "執行增量備份..."
    
    # 使用 WAL 歸檔進行增量備份
    LAST_WAL=$(ls -t /var/lib/postgresql/12/main/pg_wal/ | head -1)
    cp "/var/lib/postgresql/12/main/pg_wal/$LAST_WAL" "$BACKUP_DIR/wal_$DATE"
    
    # 上傳 WAL 檔案
    mc cp "$BACKUP_DIR/wal_$DATE" "minio/mking-friend-backups/database/wal/"
fi

# 清理舊備份
find $BACKUP_DIR -name "*.dump.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "wal_*" -mtime +7 -delete

# 記錄備份狀態
echo "$(date): 備份完成" >> /var/log/backup.log
```

**PostgreSQL 連續歸檔配置**
```sql
-- postgresql.conf 設定
wal_level = replica
archive_mode = on
archive_command = 'cp %p /backup/wal_archive/%f'
max_wal_senders = 3
wal_keep_segments = 64

-- 建立備份用戶
CREATE ROLE backup_user WITH LOGIN PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE mking_friend TO backup_user;
GRANT USAGE ON SCHEMA public TO backup_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO backup_user;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO backup_user;

-- 自動備份函數
CREATE OR REPLACE FUNCTION perform_backup()
RETURNS void AS $$
BEGIN
    -- 執行 CHECKPOINT 確保數據寫入磁碟
    CHECKPOINT;
    
    -- 記錄備份時間
    INSERT INTO backup_log (backup_type, start_time, status) 
    VALUES ('auto', NOW(), 'started');
    
    -- 這裡可以添加額外的備份邏輯
    
    UPDATE backup_log 
    SET end_time = NOW(), status = 'completed' 
    WHERE backup_type = 'auto' AND start_time = (
        SELECT MAX(start_time) FROM backup_log WHERE backup_type = 'auto'
    );
END;
$$ LANGUAGE plpgsql;

-- 定時執行備份（使用 pg_cron 擴展）
SELECT cron.schedule('database-backup', '0 */1 * * *', 'SELECT perform_backup();');
```

**優點:**
- 標準工具，穩定可靠
- 支援增量備份
- 可以進行時間點恢復
- 備份檔案可壓縮

**缺點:**
- 需要停機時間（完整備份）
- 大型資料庫備份時間長

**Barman (Backup and Recovery Manager)**
```yaml
# barman.conf
[barman]
barman_home = /var/lib/barman
barman_user = barman
log_file = /var/log/barman/barman.log
log_level = INFO
compression = gzip
reuse_backup = link
retention_policy = RECOVERY WINDOW OF 30 DAYS

[mking-friend-db]
description = "MKing Friend Database"
conninfo = host=localhost user=barman dbname=mking_friend
ssh_command = ssh postgres@localhost
backup_method = rsync
archiver = on
archiver_batch_size = 50
path_prefix = /usr/pgsql-12/bin
```

**優點:**
- 專業的 PostgreSQL 備份工具
- 支援多種備份策略
- 自動化程度高
- 內建監控和報告

**缺點:**
- 學習曲線較陡
- 需要額外的系統資源

#### 2.1.2 Redis 備份策略

**RDB + AOF 混合備份**
```bash
#!/bin/bash
# Redis 備份腳本

REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD="your_password"
BACKUP_DIR="/backup/redis"
DATE=$(date +"%Y%m%d_%H%M%S")

# 創建備份目錄
mkdir -p $BACKUP_DIR

# 執行 BGSAVE 創建 RDB 快照
redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD BGSAVE

# 等待備份完成
while [ $(redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD LASTSAVE) -eq $(redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD LASTSAVE) ]; do
    sleep 1
done

# 複製 RDB 檔案
cp /var/lib/redis/dump.rdb "$BACKUP_DIR/redis_dump_$DATE.rdb"

# 複製 AOF 檔案（如果啟用）
if [ -f /var/lib/redis/appendonly.aof ]; then
    cp /var/lib/redis/appendonly.aof "$BACKUP_DIR/redis_aof_$DATE.aof"
fi

# 壓縮備份
gzip "$BACKUP_DIR/redis_dump_$DATE.rdb"
[ -f "$BACKUP_DIR/redis_aof_$DATE.aof" ] && gzip "$BACKUP_DIR/redis_aof_$DATE.aof"

# 上傳到 MinIO
mc cp "$BACKUP_DIR/redis_dump_$DATE.rdb.gz" "minio/mking-friend-backups/redis/"
[ -f "$BACKUP_DIR/redis_aof_$DATE.aof.gz" ] && mc cp "$BACKUP_DIR/redis_aof_$DATE.aof.gz" "minio/mking-friend-backups/redis/"

# 清理舊備份
find $BACKUP_DIR -name "redis_*" -mtime +7 -delete

echo "$(date): Redis 備份完成" >> /var/log/backup.log
```

### 2.2 檔案備份解決方案

#### 2.2.1 用戶上傳檔案備份

**rsync + MinIO 同步 (推薦)**
```bash
#!/bin/bash
# 檔案備份腳本

SOURCE_DIR="/var/www/mking-friend/uploads"
BACKUP_DIR="/backup/files"
MINIO_BUCKET="mking-friend-file-backups"
DATE=$(date +"%Y%m%d")
LOG_FILE="/var/log/file_backup.log"

# 記錄開始時間
echo "$(date): 開始檔案備份" >> $LOG_FILE

# 使用 rsync 進行增量備份
rsync -av --delete --progress --stats \
    --exclude="*.tmp" \
    --exclude="*.temp" \
    --log-file=$LOG_FILE \
    $SOURCE_DIR/ $BACKUP_DIR/

# 檢查 rsync 結果
if [ $? -eq 0 ]; then
    echo "$(date): 本地備份完成" >> $LOG_FILE
else
    echo "$(date): 本地備份失敗" >> $LOG_FILE
    exit 1
fi

# 同步到 MinIO（增量）
mc mirror $BACKUP_DIR minio/$MINIO_BUCKET/files/ \
    --exclude "*.tmp" \
    --exclude "*.temp" \
    --remove

if [ $? -eq 0 ]; then
    echo "$(date): MinIO 同步完成" >> $LOG_FILE
else
    echo "$(date): MinIO 同步失敗" >> $LOG_FILE
    exit 1
fi

# 生成備份報告
FILE_COUNT=$(find $SOURCE_DIR -type f | wc -l)
TOTAL_SIZE=$(du -sh $SOURCE_DIR | cut -f1)

echo "備份統計:" >> $LOG_FILE
echo "檔案數量: $FILE_COUNT" >> $LOG_FILE
echo "總大小: $TOTAL_SIZE" >> $LOG_FILE
echo "$(date): 檔案備份完成" >> $LOG_FILE

# 發送備份報告
echo "檔案備份完成\n檔案數量: $FILE_COUNT\n總大小: $TOTAL_SIZE" | \
    mail -s "MKing Friend 檔案備份報告" admin@mkingfriend.com
```

**檔案完整性驗證**
```bash
#!/bin/bash
# 檔案完整性檢查腳本

SOURCE_DIR="/var/www/mking-friend/uploads"
BACKUP_DIR="/backup/files"
CHECKSUM_FILE="/backup/checksums/files_$(date +%Y%m%d).md5"

# 生成源檔案校驗和
find $SOURCE_DIR -type f -exec md5sum {} \; > $CHECKSUM_FILE

# 驗證備份檔案
echo "驗證備份檔案完整性..."
ERROR_COUNT=0

while IFS= read -r line; do
    CHECKSUM=$(echo $line | cut -d' ' -f1)
    FILE_PATH=$(echo $line | cut -d' ' -f2-)
    BACKUP_FILE_PATH=${FILE_PATH/$SOURCE_DIR/$BACKUP_DIR}
    
    if [ -f "$BACKUP_FILE_PATH" ]; then
        BACKUP_CHECKSUM=$(md5sum "$BACKUP_FILE_PATH" | cut -d' ' -f1)
        if [ "$CHECKSUM" != "$BACKUP_CHECKSUM" ]; then
            echo "校驗和不匹配: $FILE_PATH"
            ERROR_COUNT=$((ERROR_COUNT + 1))
        fi
    else
        echo "備份檔案不存在: $BACKUP_FILE_PATH"
        ERROR_COUNT=$((ERROR_COUNT + 1))
    fi
done < $CHECKSUM_FILE

if [ $ERROR_COUNT -eq 0 ]; then
    echo "所有檔案驗證通過"
else
    echo "發現 $ERROR_COUNT 個錯誤"
    exit 1
fi
```

#### 2.2.2 應用程式碼備份

**Git + 自動化部署備份**
```bash
#!/bin/bash
# 程式碼備份腳本

REPO_DIR="/var/www/mking-friend"
BACKUP_DIR="/backup/code"
DATE=$(date +"%Y%m%d_%H%M%S")
MINIO_BUCKET="mking-friend-code-backups"

# 創建程式碼快照
cd $REPO_DIR

# 獲取當前 commit 資訊
CURRENT_COMMIT=$(git rev-parse HEAD)
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# 創建 tar 備份
tar -czf "$BACKUP_DIR/code_backup_$DATE.tar.gz" \
    --exclude="node_modules" \
    --exclude=".git" \
    --exclude="dist" \
    --exclude="build" \
    --exclude="*.log" \
    .

# 記錄版本資訊
echo "Backup Date: $(date)" > "$BACKUP_DIR/version_info_$DATE.txt"
echo "Commit: $CURRENT_COMMIT" >> "$BACKUP_DIR/version_info_$DATE.txt"
echo "Branch: $CURRENT_BRANCH" >> "$BACKUP_DIR/version_info_$DATE.txt"
echo "Tag: $(git describe --tags --abbrev=0 2>/dev/null || echo 'No tags')" >> "$BACKUP_DIR/version_info_$DATE.txt"

# 上傳到 MinIO
mc cp "$BACKUP_DIR/code_backup_$DATE.tar.gz" "minio/$MINIO_BUCKET/code/"
mc cp "$BACKUP_DIR/version_info_$DATE.txt" "minio/$MINIO_BUCKET/code/"

# 清理舊備份
find $BACKUP_DIR -name "code_backup_*" -mtime +30 -delete
find $BACKUP_DIR -name "version_info_*" -mtime +30 -delete

echo "$(date): 程式碼備份完成 - Commit: $CURRENT_COMMIT"
```

### 2.3 系統配置備份

**配置檔案備份腳本**
```bash
#!/bin/bash
# 系統配置備份腳本

BACKUP_DIR="/backup/config"
DATE=$(date +"%Y%m%d_%H%M%S")
CONFIG_BACKUP_FILE="$BACKUP_DIR/system_config_$DATE.tar.gz"

# 要備份的配置檔案和目錄
CONFIG_PATHS=(
    "/etc/nginx"
    "/etc/postgresql"
    "/etc/redis"
    "/etc/ssl"
    "/etc/systemd/system/mking-friend*"
    "/var/www/mking-friend/.env"
    "/var/www/mking-friend/docker-compose.yml"
    "/etc/crontab"
    "/etc/logrotate.d"
)

# 創建配置備份
tar -czf $CONFIG_BACKUP_FILE ${CONFIG_PATHS[@]} 2>/dev/null

# 備份環境變數（加密）
echo "# MKing Friend Environment Variables Backup" > "$BACKUP_DIR/env_backup_$DATE.txt"
echo "# Created: $(date)" >> "$BACKUP_DIR/env_backup_$DATE.txt"
echo "" >> "$BACKUP_DIR/env_backup_$DATE.txt"

# 從 .env 檔案備份（移除敏感資訊）
if [ -f "/var/www/mking-friend/.env" ]; then
    grep -v -E "(PASSWORD|SECRET|KEY|TOKEN)" "/var/www/mking-friend/.env" >> "$BACKUP_DIR/env_backup_$DATE.txt"
fi

# 加密敏感配置
if [ -f "/var/www/mking-friend/.env" ]; then
    grep -E "(PASSWORD|SECRET|KEY|TOKEN)" "/var/www/mking-friend/.env" | \
        openssl enc -aes-256-cbc -salt -in - -out "$BACKUP_DIR/sensitive_env_$DATE.enc" -k "$BACKUP_ENCRYPTION_KEY"
fi

# 上傳到 MinIO
mc cp $CONFIG_BACKUP_FILE "minio/mking-friend-backups/config/"
mc cp "$BACKUP_DIR/env_backup_$DATE.txt" "minio/mking-friend-backups/config/"
mc cp "$BACKUP_DIR/sensitive_env_$DATE.enc" "minio/mking-friend-backups/config/"

# 清理舊備份
find $BACKUP_DIR -name "system_config_*" -mtime +30 -delete
find $BACKUP_DIR -name "env_backup_*" -mtime +30 -delete
find $BACKUP_DIR -name "sensitive_env_*" -mtime +30 -delete

echo "$(date): 系統配置備份完成"
```

## 3. 災難恢復架構

### 3.1 災難恢復架構圖
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   主要站點      │    │   備份站點      │    │   雲端備份      │
│   (Production)  │───►│   (Standby)     │───►│   (MinIO)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   即時複製      │    │   定期同步      │    │   長期保存      │
│   (Streaming)   │    │   (Daily)       │    │   (Monthly)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │   PostgreSQL    │    │   Compressed    │
│   Master        │    │   Replica       │    │   Archives      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │    │   Application   │    │   Backup        │
│   Servers       │    │   Servers       │    │   Verification  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 3.2 恢復流程設計

**災難恢復自動化腳本**
```bash
#!/bin/bash
# 災難恢復主腳本

DISASTER_TYPE=$1  # database, application, full
RECOVERY_POINT=$2 # 恢復時間點
BACKUP_SOURCE=$3  # local, minio, replica

LOG_FILE="/var/log/disaster_recovery.log"
RECOVERY_DIR="/recovery"
NOTIFICATION_EMAIL="admin@mkingfriend.com"

# 記錄恢復開始
echo "$(date): 開始災難恢復 - 類型: $DISASTER_TYPE, 時間點: $RECOVERY_POINT" >> $LOG_FILE

# 發送開始通知
echo "災難恢復已開始\n類型: $DISASTER_TYPE\n時間點: $RECOVERY_POINT" | \
    mail -s "[緊急] MKing Friend 災難恢復開始" $NOTIFICATION_EMAIL

case $DISASTER_TYPE in
    "database")
        echo "執行資料庫恢復..." >> $LOG_FILE
        ./scripts/recover_database.sh $RECOVERY_POINT $BACKUP_SOURCE
        ;;
    "application")
        echo "執行應用程式恢復..." >> $LOG_FILE
        ./scripts/recover_application.sh $RECOVERY_POINT $BACKUP_SOURCE
        ;;
    "full")
        echo "執行完整系統恢復..." >> $LOG_FILE
        ./scripts/recover_database.sh $RECOVERY_POINT $BACKUP_SOURCE
        ./scripts/recover_application.sh $RECOVERY_POINT $BACKUP_SOURCE
        ./scripts/recover_files.sh $RECOVERY_POINT $BACKUP_SOURCE
        ;;
    *)
        echo "未知的災難類型: $DISASTER_TYPE" >> $LOG_FILE
        exit 1
        ;;
esac

# 檢查恢復結果
if [ $? -eq 0 ]; then
    echo "$(date): 災難恢復完成" >> $LOG_FILE
    echo "災難恢復成功完成" | mail -s "[成功] MKing Friend 災難恢復完成" $NOTIFICATION_EMAIL
else
    echo "$(date): 災難恢復失敗" >> $LOG_FILE
    echo "災難恢復失敗，需要人工介入" | mail -s "[失敗] MKing Friend 災難恢復失敗" $NOTIFICATION_EMAIL
    exit 1
fi

# 執行恢復後驗證
./scripts/verify_recovery.sh
```

**資料庫恢復腳本**
```bash
#!/bin/bash
# 資料庫恢復腳本

RECOVERY_POINT=$1
BACKUP_SOURCE=$2
DB_NAME="mking_friend"
DB_USER="postgres"
RECOVERY_DIR="/recovery/database"

echo "$(date): 開始資料庫恢復" >> /var/log/disaster_recovery.log

# 停止應用程式服務
systemctl stop mking-friend
systemctl stop nginx

# 停止 PostgreSQL
systemctl stop postgresql

# 備份當前損壞的資料庫
if [ -d "/var/lib/postgresql/12/main" ]; then
    mv /var/lib/postgresql/12/main /var/lib/postgresql/12/main.corrupted.$(date +%Y%m%d_%H%M%S)
fi

# 創建新的資料目錄
mkdir -p /var/lib/postgresql/12/main
chown postgres:postgres /var/lib/postgresql/12/main
chmod 700 /var/lib/postgresql/12/main

# 根據備份來源恢復
case $BACKUP_SOURCE in
    "local")
        echo "從本地備份恢復..." >> /var/log/disaster_recovery.log
        BACKUP_FILE=$(find /backup/database -name "full_backup_*.dump.gz" | sort -r | head -1)
        gunzip -c $BACKUP_FILE | pg_restore -h localhost -U $DB_USER -d $DB_NAME -v
        ;;
    "minio")
        echo "從 MinIO 備份恢復..." >> /var/log/disaster_recovery.log
        # 下載最新備份
        mc cp minio/mking-friend-backups/database/full/ $RECOVERY_DIR --recursive
        BACKUP_FILE=$(find $RECOVERY_DIR -name "full_backup_*.dump.gz" | sort -r | head -1)
        gunzip -c $BACKUP_FILE | pg_restore -h localhost -U $DB_USER -d $DB_NAME -v
        ;;
    "replica")
        echo "從備用伺服器恢復..." >> /var/log/disaster_recovery.log
        # 從備用伺服器同步
        rsync -av backup-server:/var/lib/postgresql/12/main/ /var/lib/postgresql/12/main/
        ;;
esac

# 啟動 PostgreSQL
systemctl start postgresql

# 等待資料庫啟動
sleep 10

# 驗證資料庫
psql -h localhost -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) FROM users;" > /dev/null
if [ $? -eq 0 ]; then
    echo "$(date): 資料庫恢復成功" >> /var/log/disaster_recovery.log
else
    echo "$(date): 資料庫恢復失敗" >> /var/log/disaster_recovery.log
    exit 1
fi

# 重啟應用程式服務
systemctl start mking-friend
systemctl start nginx

echo "$(date): 資料庫恢復完成" >> /var/log/disaster_recovery.log
```

### 3.3 恢復驗證系統

**恢復驗證腳本**
```bash
#!/bin/bash
# 恢復驗證腳本

VERIFICATION_LOG="/var/log/recovery_verification.log"
FAILED_CHECKS=0

echo "$(date): 開始恢復驗證" >> $VERIFICATION_LOG

# 1. 資料庫連接測試
echo "檢查資料庫連接..." >> $VERIFICATION_LOG
psql -h localhost -U postgres -d mking_friend -c "SELECT 1;" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ 資料庫連接正常" >> $VERIFICATION_LOG
else
    echo "✗ 資料庫連接失敗" >> $VERIFICATION_LOG
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

# 2. 資料完整性檢查
echo "檢查資料完整性..." >> $VERIFICATION_LOG
USER_COUNT=$(psql -h localhost -U postgres -d mking_friend -t -c "SELECT COUNT(*) FROM users;" | xargs)
if [ $USER_COUNT -gt 0 ]; then
    echo "✓ 用戶數據完整 ($USER_COUNT 用戶)" >> $VERIFICATION_LOG
else
    echo "✗ 用戶數據異常" >> $VERIFICATION_LOG
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

# 3. 應用程式服務檢查
echo "檢查應用程式服務..." >> $VERIFICATION_LOG
systemctl is-active mking-friend > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ 應用程式服務運行正常" >> $VERIFICATION_LOG
else
    echo "✗ 應用程式服務異常" >> $VERIFICATION_LOG
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

# 4. Web 服務檢查
echo "檢查 Web 服務..." >> $VERIFICATION_LOG
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health | grep -q "200"
if [ $? -eq 0 ]; then
    echo "✓ Web 服務響應正常" >> $VERIFICATION_LOG
else
    echo "✗ Web 服務響應異常" >> $VERIFICATION_LOG
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

# 5. 檔案系統檢查
echo "檢查檔案系統..." >> $VERIFICATION_LOG
if [ -d "/var/www/mking-friend/uploads" ] && [ "$(ls -A /var/www/mking-friend/uploads)" ]; then
    echo "✓ 上傳檔案目錄正常" >> $VERIFICATION_LOG
else
    echo "✗ 上傳檔案目錄異常" >> $VERIFICATION_LOG
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

# 6. Redis 服務檢查
echo "檢查 Redis 服務..." >> $VERIFICATION_LOG
redis-cli ping | grep -q "PONG"
if [ $? -eq 0 ]; then
    echo "✓ Redis 服務正常" >> $VERIFICATION_LOG
else
    echo "✗ Redis 服務異常" >> $VERIFICATION_LOG
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

# 7. 功能測試
echo "執行功能測試..." >> $VERIFICATION_LOG
# 這裡可以添加自動化測試腳本
npm test --silent > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ 功能測試通過" >> $VERIFICATION_LOG
else
    echo "✗ 功能測試失敗" >> $VERIFICATION_LOG
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

# 總結驗證結果
echo "$(date): 恢復驗證完成" >> $VERIFICATION_LOG
echo "失敗檢查項目: $FAILED_CHECKS" >> $VERIFICATION_LOG

if [ $FAILED_CHECKS -eq 0 ]; then
    echo "所有驗證項目通過，系統恢復成功" >> $VERIFICATION_LOG
    echo "系統恢復驗證通過\n所有服務運行正常" | \
        mail -s "[成功] MKing Friend 恢復驗證通過" admin@mkingfriend.com
    exit 0
else
    echo "有 $FAILED_CHECKS 個驗證項目失敗，需要人工檢查" >> $VERIFICATION_LOG
    echo "系統恢復驗證失敗\n失敗項目: $FAILED_CHECKS\n請檢查日誌: $VERIFICATION_LOG" | \
        mail -s "[警告] MKing Friend 恢復驗證失敗" admin@mkingfriend.com
    exit 1
fi
```

## 4. 監控與告警系統

### 4.1 備份監控

**備份狀態監控腳本**
```bash
#!/bin/bash
# 備份狀態監控腳本

MONITOR_LOG="/var/log/backup_monitor.log"
ALERT_EMAIL="admin@mkingfriend.com"
CURRENT_TIME=$(date +%s)
ALERT_THRESHOLD=86400  # 24小時

echo "$(date): 開始備份狀態檢查" >> $MONITOR_LOG

# 檢查資料庫備份
LAST_DB_BACKUP=$(find /backup/database -name "full_backup_*.dump.gz" -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f1)
if [ ! -z "$LAST_DB_BACKUP" ]; then
    DB_BACKUP_AGE=$((CURRENT_TIME - ${LAST_DB_BACKUP%.*}))
    if [ $DB_BACKUP_AGE -gt $ALERT_THRESHOLD ]; then
        echo "警告: 資料庫備份過期 ($(($DB_BACKUP_AGE / 3600)) 小時前)" >> $MONITOR_LOG
        echo "資料庫備份過期警告\n最後備份: $(($DB_BACKUP_AGE / 3600)) 小時前" | \
            mail -s "[警告] 資料庫備份過期" $ALERT_EMAIL
    else
        echo "資料庫備份正常 ($(($DB_BACKUP_AGE / 3600)) 小時前)" >> $MONITOR_LOG
    fi
else
    echo "錯誤: 找不到資料庫備份檔案" >> $MONITOR_LOG
    echo "找不到資料庫備份檔案" | mail -s "[錯誤] 資料庫備份遺失" $ALERT_EMAIL
fi

# 檢查檔案備份
LAST_FILE_SYNC=$(stat -c %Y /backup/files 2>/dev/null)
if [ ! -z "$LAST_FILE_SYNC" ]; then
    FILE_SYNC_AGE=$((CURRENT_TIME - LAST_FILE_SYNC))
    if [ $FILE_SYNC_AGE -gt $ALERT_THRESHOLD ]; then
        echo "警告: 檔案備份過期 ($(($FILE_SYNC_AGE / 3600)) 小時前)" >> $MONITOR_LOG
        echo "檔案備份過期警告\n最後同步: $(($FILE_SYNC_AGE / 3600)) 小時前" | \
            mail -s "[警告] 檔案備份過期" $ALERT_EMAIL
    else
        echo "檔案備份正常 ($(($FILE_SYNC_AGE / 3600)) 小時前)" >> $MONITOR_LOG
    fi
else
    echo "錯誤: 檔案備份目錄不存在" >> $MONITOR_LOG
    echo "檔案備份目錄不存在" | mail -s "[錯誤] 檔案備份目錄遺失" $ALERT_EMAIL
fi

# 檢查 MinIO 備份
MINIO_BACKUP_COUNT=$(mc ls minio/mking-friend-backups/database/full/ | wc -l)
if [ $MINIO_BACKUP_COUNT -lt 7 ]; then
    echo "警告: MinIO 備份數量不足 ($MINIO_BACKUP_COUNT 個)" >> $MONITOR_LOG
    echo "MinIO 備份數量不足\n當前數量: $MINIO_BACKUP_COUNT" | \
        mail -s "[警告] MinIO 備份數量不足" $ALERT_EMAIL
else
    echo "MinIO 備份數量正常 ($MINIO_BACKUP_COUNT 個)" >> $MONITOR_LOG
fi

# 檢查備份空間使用率
BACKUP_USAGE=$(df /backup | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $BACKUP_USAGE -gt 80 ]; then
    echo "警告: 備份空間使用率過高 ($BACKUP_USAGE%)" >> $MONITOR_LOG
    echo "備份空間使用率過高\n當前使用率: $BACKUP_USAGE%" | \
        mail -s "[警告] 備份空間不足" $ALERT_EMAIL
else
    echo "備份空間使用率正常 ($BACKUP_USAGE%)" >> $MONITOR_LOG
fi

echo "$(date): 備份狀態檢查完成" >> $MONITOR_LOG
```

### 4.2 系統健康監控

**系統健康檢查腳本**
```bash
#!/bin/bash
# 系統健康檢查腳本

HEALTH_LOG="/var/log/system_health.log"
ALERT_EMAIL="admin@mkingfriend.com"
CRITICAL_ALERTS=0

echo "$(date): 開始系統健康檢查" >> $HEALTH_LOG

# 1. CPU 使用率檢查
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//')
if (( $(echo "$CPU_USAGE > 80" | bc -l) )); then
    echo "警告: CPU 使用率過高 ($CPU_USAGE%)" >> $HEALTH_LOG
    CRITICAL_ALERTS=$((CRITICAL_ALERTS + 1))
else
    echo "CPU 使用率正常 ($CPU_USAGE%)" >> $HEALTH_LOG
fi

# 2. 記憶體使用率檢查
MEM_USAGE=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
if (( $(echo "$MEM_USAGE > 85" | bc -l) )); then
    echo "警告: 記憶體使用率過高 ($MEM_USAGE%)" >> $HEALTH_LOG
    CRITICAL_ALERTS=$((CRITICAL_ALERTS + 1))
else
    echo "記憶體使用率正常 ($MEM_USAGE%)" >> $HEALTH_LOG
fi

# 3. 磁碟空間檢查
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 85 ]; then
    echo "警告: 磁碟空間不足 ($DISK_USAGE%)" >> $HEALTH_LOG
    CRITICAL_ALERTS=$((CRITICAL_ALERTS + 1))
else
    echo "磁碟空間正常 ($DISK_USAGE%)" >> $HEALTH_LOG
fi

# 4. 資料庫連接檢查
psql -h localhost -U postgres -d mking_friend -c "SELECT 1;" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "資料庫連接正常" >> $HEALTH_LOG
else
    echo "錯誤: 資料庫連接失敗" >> $HEALTH_LOG
    CRITICAL_ALERTS=$((CRITICAL_ALERTS + 1))
fi

# 5. 應用程式服務檢查
systemctl is-active mking-friend > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "應用程式服務正常" >> $HEALTH_LOG
else
    echo "錯誤: 應用程式服務異常" >> $HEALTH_LOG
    CRITICAL_ALERTS=$((CRITICAL_ALERTS + 1))
fi

# 6. 網路連接檢查
ping -c 1 8.8.8.8 > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "網路連接正常" >> $HEALTH_LOG
else
    echo "警告: 網路連接異常" >> $HEALTH_LOG
    CRITICAL_ALERTS=$((CRITICAL_ALERTS + 1))
fi

# 發送警報
if [ $CRITICAL_ALERTS -gt 0 ]; then
    echo "發現 $CRITICAL_ALERTS 個嚴重問題" >> $HEALTH_LOG
    echo "系統健康檢查發現問題\n嚴重問題數量: $CRITICAL_ALERTS\n詳細信息請查看: $HEALTH_LOG" | \
        mail -s "[警告] 系統健康檢查異常" $ALERT_EMAIL
else
    echo "系統健康狀況良好" >> $HEALTH_LOG
fi

echo "$(date): 系統健康檢查完成" >> $HEALTH_LOG
```

## 5. 實施計劃

### 5.1 第一階段（基礎備份）- 2週
- [ ] 資料庫備份腳本開發
- [ ] 檔案備份腳本開發
- [ ] MinIO 儲存設置
- [ ] 基礎監控腳本
- [ ] 備份測試驗證

### 5.2 第二階段（災難恢復）- 3週
- [ ] 災難恢復腳本開發
- [ ] 恢復驗證系統
- [ ] 備用伺服器設置
- [ ] 自動化恢復流程
- [ ] 恢復測試演練

### 5.3 第三階段（監控告警）- 2週
- [ ] 備份狀態監控
- [ ] 系統健康監控
- [ ] 告警通知系統
- [ ] 監控儀表板
- [ ] 報告生成系統

### 5.4 第四階段（優化完善）- 1週
- [ ] 性能優化
- [ ] 文檔完善
- [ ] 培訓材料
- [ ] 定期演練計劃
- [ ] 持續改進機制

## 6. 技術建議

### 6.1 推薦技術棧
- **資料庫備份**: pg_dump + WAL 歸檔
- **檔案備份**: rsync + MinIO
- **程式碼備份**: Git + 自動化 CI/CD
- **監控**: 自建腳本 + Cron
- **通知**: Email + Slack (可選)

### 6.2 成本估算
- **MinIO 儲存**: $20-80/月 (硬體成本)
- **備用伺服器**: $100-300/月
- **監控工具**: $0-50/月
- **人力成本**: $2000-4000/月
- **總成本**: $150-500/月

### 6.3 關鍵指標
- **備份成功率**: > 99%
- **恢復時間**: < 4小時
- **數據遺失**: < 1小時
- **備份驗證**: 100%
- **演練頻率**: 每月一次

---

**文檔版本**: v1.0  
**最後更新**: 2025-01-02  
**狀態**: ✅ 規劃完成，待實施