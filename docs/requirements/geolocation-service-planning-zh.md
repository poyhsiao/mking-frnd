# MKing Friend - 地理位置與地圖服務規劃

## 1. 功能概述

### 1.1 核心需求
- **附近用戶搜尋**: 基於地理位置的用戶推薦
- **位置隱私保護**: 模糊化位置顯示，保護用戶隱私
- **地理編碼**: 地址轉座標服務
- **距離計算**: 用戶間距離計算與顯示
- **位置驗證**: 防止虛假位置資訊

### 1.2 隱私保護策略
- **模糊化顯示**: 只顯示大概區域（如：台北市信義區）
- **距離範圍**: 顯示距離範圍而非精確距離（如：1-3公里內）
- **用戶控制**: 用戶可選擇是否分享位置資訊
- **動態位置**: 支援用戶手動調整顯示位置

## 2. 技術方案比較

### 2.1 地圖服務選項

#### 2.1.1 OpenStreetMap (推薦)
**優點:**
- 完全免費且開源
- 支援自建地圖服務
- 台灣地區資料完整
- 無使用量限制
- 社群維護，資料更新及時

**缺點:**
- 需要自建基礎設施
- 初期設置較複雜
- 需要額外的地理編碼服務

**實現方案:**
```javascript
// 使用 Leaflet + OpenStreetMap
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const map = L.map('map').setView([25.0330, 121.5654], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);
```

#### 2.1.2 Google Maps API
**優點:**
- 功能完整且穩定
- 地理編碼服務優秀
- 文檔完整

**缺點:**
- 收費服務（每月 $200 免費額度）
- 依賴第三方服務
- 可能有使用限制

#### 2.1.3 MapBox
**優點:**
- 自定義程度高
- 效能優秀
- 有免費額度

**缺點:**
- 超過免費額度後收費
- 台灣本地化程度較低

### 2.2 地理編碼服務

#### 2.2.1 Nominatim (OpenStreetMap) (推薦)
**優點:**
- 完全免費
- 支援自建服務
- 台灣地址支援良好
- 支援正向和反向地理編碼
- 多語言支援（中文、英文）

**缺點:**
- 查詢速度較慢
- 需要自建基礎設施
- 公共 API 有使用限制

**實現方案:**
```javascript
// Nominatim 地理編碼服務
class NominatimGeocodingService {
  constructor(baseUrl = 'https://nominatim.openstreetmap.org') {
    this.baseUrl = baseUrl;
    this.rateLimiter = new RateLimiter(1, 1000); // 1 request per second
  }
  
  // 正向地理編碼（地址 -> 座標）
  async geocodeAddress(address, options = {}) {
    await this.rateLimiter.wait();
    
    const params = new URLSearchParams({
      format: 'json',
      q: address,
      countrycodes: options.countryCode || 'tw',
      limit: options.limit || 5,
      addressdetails: 1,
      extratags: 1,
      namedetails: 1,
      'accept-language': options.language || 'zh-TW,zh,en'
    });
    
    const response = await fetch(`${this.baseUrl}/search?${params}`);
    const results = await response.json();
    
    return results.map(result => ({
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      displayName: result.display_name,
      address: this.parseAddress(result.address),
      importance: result.importance,
      type: result.type,
      class: result.class
    }));
  }
  
  // 反向地理編碼（座標 -> 地址）
  async reverseGeocode(latitude, longitude, options = {}) {
    await this.rateLimiter.wait();
    
    const params = new URLSearchParams({
      format: 'json',
      lat: latitude.toString(),
      lon: longitude.toString(),
      zoom: options.zoom || 18,
      addressdetails: 1,
      extratags: 1,
      namedetails: 1,
      'accept-language': options.language || 'zh-TW,zh,en'
    });
    
    const response = await fetch(`${this.baseUrl}/reverse?${params}`);
    const result = await response.json();
    
    if (result.error) {
      throw new Error(`Reverse geocoding failed: ${result.error}`);
    }
    
    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      displayName: result.display_name,
      address: this.parseAddress(result.address),
      type: result.type,
      class: result.class
    };
  }
  
  // 地址結構化解析
  parseAddress(addressData) {
    return {
      houseNumber: addressData.house_number,
      road: addressData.road,
      neighbourhood: addressData.neighbourhood,
      suburb: addressData.suburb,
      district: addressData.city_district || addressData.district,
      city: addressData.city || addressData.town || addressData.village,
      county: addressData.county,
      state: addressData.state,
      postcode: addressData.postcode,
      country: addressData.country,
      countryCode: addressData.country_code
    };
  }
  
  // 批次地理編碼
  async batchGeocode(addresses, options = {}) {
    const results = [];
    
    for (const address of addresses) {
      try {
        const result = await this.geocodeAddress(address, options);
        results.push({ address, result, success: true });
      } catch (error) {
        results.push({ address, error: error.message, success: false });
      }
    }
    
    return results;
  }
}
```

#### 2.2.2 自建 Nominatim 服務
**優點:**
- 無 API 使用限制
- 更快的響應速度
- 完全控制數據和服務
- 可自定義搜尋邏輯

**缺點:**
- 需要大量存儲空間（台灣資料約 2-5GB）
- 需要定期更新資料
- 服務器資源需求較高

**部署方案:**
```bash
# Docker 部署 Nominatim
docker run -it \
  -e PBF_URL=https://download.geofabrik.de/asia/taiwan-latest.osm.pbf \
  -e REPLICATION_URL=https://download.geofabrik.de/asia/taiwan-updates/ \
  -e IMPORT_WIKIPEDIA=false \
  -e NOMINATIM_PASSWORD=your-password \
  -p 8080:8080 \
  --name nominatim \
  mediagis/nominatim:4.2
```

### 2.3 自建 Nominatim 部署方案

#### 2.3.1 系統需求

**硬體需求 (混合式部署):**
- CPU: 4+ 核心 (建議 8 核心)
- RAM: 16GB+ (建議 32GB)
- 儲存: 200GB+ SSD (初始部署，可擴展)
- 網路: 穩定的網路連線

**軟體需求:**
- Ubuntu 20.04+ 或 CentOS 8+
- PostgreSQL 14+
- PostGIS 3.2+
- Apache/Nginx
- PHP 8.0+
- Docker & Docker Compose (推薦)

#### 2.3.4 資料同步與擴展策略

**智能資料同步:**
```bash
# sync_strategy.sh - 智能同步腳本
#!/bin/bash

# 配置參數
LOCAL_DB="nominatim_local"
SYNC_LOG="/var/log/nominatim-sync.log"
API_USAGE_LIMIT=1000  # 每日 API 調用限制
CURRENT_USAGE_FILE="/tmp/api_usage_today.count"

# 檢查今日 API 使用量
check_api_usage() {
    local today=$(date +%Y%m%d)
    local usage_file="${CURRENT_USAGE_FILE}_${today}"
    
    if [ -f "$usage_file" ]; then
        local current_usage=$(cat "$usage_file")
    else
        local current_usage=0
        echo "0" > "$usage_file"
    fi
    
    echo "$current_usage"
}

# 更新 API 使用計數
update_api_usage() {
    local today=$(date +%Y%m%d)
    local usage_file="${CURRENT_USAGE_FILE}_${today}"
    local current_usage=$(check_api_usage)
    local new_usage=$((current_usage + 1))
    
    echo "$new_usage" > "$usage_file"
    echo "API usage updated: $new_usage/$API_USAGE_LIMIT"
}

# 從公共 API 獲取並同步資料
sync_from_public_api() {
    local address="$1"
    local current_usage=$(check_api_usage)
    
    if [ "$current_usage" -ge "$API_USAGE_LIMIT" ]; then
        echo "API usage limit reached for today: $current_usage/$API_USAGE_LIMIT"
        return 1
    fi
    
    # 調用公共 API
    local response=$(curl -s "https://nominatim.openstreetmap.org/search?q=${address}&format=json&limit=5")
    
    if [ $? -eq 0 ] && [ "$response" != "[]" ]; then
        # 解析並存入本地資料庫
        echo "$response" | jq -r '.[] | [.lat, .lon, .display_name, .importance] | @csv' | \
        while IFS=',' read -r lat lon display_name importance; do
            # 清理資料
            lat=$(echo "$lat" | tr -d '"')
            lon=$(echo "$lon" | tr -d '"')
            display_name=$(echo "$display_name" | tr -d '"')
            importance=$(echo "$importance" | tr -d '"')
            
            # 插入本地資料庫
            psql -d "$LOCAL_DB" -c "
                INSERT INTO place_cache (address, latitude, longitude, display_name, importance, source, created_at) 
                VALUES ('$address', $lat, $lon, '$display_name', $importance, 'public_api', NOW())
                ON CONFLICT (address) DO UPDATE SET
                    latitude = EXCLUDED.latitude,
                    longitude = EXCLUDED.longitude,
                    display_name = EXCLUDED.display_name,
                    importance = EXCLUDED.importance,
                    updated_at = NOW();
            "
        done
        
        update_api_usage
        echo "Synced address: $address"
        return 0
    else
        echo "Failed to sync address: $address"
        return 1
    fi
}

# 批次同步熱門地址
batch_sync_popular_addresses() {
    # 從應用程式日誌中提取熱門搜尋地址
    local popular_addresses=$(psql -d "$LOCAL_DB" -t -c "
        SELECT address FROM search_logs 
        WHERE created_at >= NOW() - INTERVAL '7 days'
        AND result_count = 0
        GROUP BY address 
        ORDER BY COUNT(*) DESC 
        LIMIT 50;
    ")
    
    echo "Starting batch sync for popular addresses..."
    
    while IFS= read -r address; do
        address=$(echo "$address" | xargs)  # 移除前後空白
        if [ -n "$address" ]; then
            sync_from_public_api "$address"
            sleep 2  # 避免過度請求
        fi
    done <<< "$popular_addresses"
}

# 主執行邏輯
case "$1" in
    "sync")
        if [ -n "$2" ]; then
            sync_from_public_api "$2"
        else
            echo "Usage: $0 sync <address>"
        fi
        ;;
    "batch")
        batch_sync_popular_addresses
        ;;
    "usage")
        echo "Today's API usage: $(check_api_usage)/$API_USAGE_LIMIT"
        ;;
    *)
        echo "Usage: $0 {sync|batch|usage} [address]"
        exit 1
        ;;
esac
```

#### 2.3.5 成本效益分析

**混合式方案 vs 純公共 API:**

| 項目 | 純公共 API | 混合式方案 | 節省 |
|------|------------|------------|------|
| 初始建置成本 | $0 | $500-1000 | - |
| 月度伺服器成本 | $0 | $50-100 | - |
| API 調用成本 | 受限制 | 90% 減少 | 大幅節省 |
| 服務可靠性 | 中等 | 高 | 提升 |
| 回應速度 | 慢 | 快 | 3-5x 提升 |
| 客製化能力 | 無 | 高 | 完全控制 |

**ROI 計算 (年度):**
```
假設每月 10,000 次地理編碼請求:

純公共 API:
- 受 rate limiting 限制，需要多個 IP 或付費服務
- 估計成本: $200-500/月

混合式方案:
- 伺服器成本: $75/月
- 90% 請求使用本地服務
- 10% 使用公共 API (1,000 次/月)
- 總成本: $75/月

年度節省: ($300 - $75) × 12 = $2,700
投資回收期: 3-4 個月
```

#### 2.3.6 擴展路徑

**階段性擴展計劃:**

1. **第一階段 (1-3個月):**
   - 部署台灣地區資料
   - 建立基本監控
   - 實現 API 備援機制

2. **第二階段 (3-6個月):**
   - 擴展到亞洲主要城市
   - 實現智能快取策略
   - 添加地理圍欄功能

3. **第三階段 (6-12個月):**
   - 全球資料覆蓋
   - 機器學習優化
   - 多語言支援

**資料擴展策略:**
```bash
# 階段性資料下載腳本
#!/bin/bash

STAGE="$1"
DATA_DIR="/data/osm"

case "$STAGE" in
    "taiwan")
        wget -P "$DATA_DIR" https://download.geofabrik.de/asia/taiwan-latest.osm.pbf
        ;;
    "asia-cities")
        # 下載主要亞洲城市
        cities=("japan" "south-korea" "hong-kong" "singapore" "thailand" "malaysia")
        for city in "${cities[@]}"; do
            wget -P "$DATA_DIR" "https://download.geofabrik.de/asia/${city}-latest.osm.pbf"
        done
        ;;
    "global")
        # 下載全球資料 (需要大量儲存空間)
        wget -P "$DATA_DIR" https://planet.openstreetmap.org/pbf/planet-latest.osm.pbf
        ;;
    *)
        echo "Usage: $0 {taiwan|asia-cities|global}"
        exit 1
        ;;
esac

# 匯入資料
for pbf_file in "$DATA_DIR"/*.osm.pbf; do
    echo "Importing $pbf_file..."
    docker-compose run --rm nominatim nominatim import --osm-file "/nominatim/$(basename "$pbf_file")"
done
```

#### 2.3.2 漸進式資料建置策略

**階段一: 基礎部署**
```bash
# 1. 建立專案目錄
mkdir -p ~/nominatim-hybrid
cd ~/nominatim-hybrid

# 2. 下載 Docker Compose 配置
wget https://raw.githubusercontent.com/mediagis/nominatim-docker/master/docker-compose.yml

# 3. 建立環境配置
cat > .env << EOF
NOMINATIM_PASSWORD=your_secure_password
POSTGRES_PASSWORD=postgres_password
NOMINATIM_REPLICATION_URL=https://download.geofabrik.de/asia/taiwan-updates/
NOMINATIM_IMPORT_STYLE=full
NOMINATIM_THREADS=4
EOF
```

**階段二: 初始資料匯入**
```bash
# 1. 下載台灣地區資料 (較小的資料集開始)
wget https://download.geofabrik.de/asia/taiwan-latest.osm.pbf

# 2. 啟動 PostgreSQL 容器
docker-compose up -d postgres

# 3. 等待資料庫就緒
sleep 30

# 4. 匯入初始資料
docker-compose run --rm nominatim nominatim import --osm-file /nominatim/taiwan-latest.osm.pbf

# 5. 啟動 Nominatim 服務
docker-compose up -d nominatim
```

**階段三: 增量資料更新**
```bash
# 建立自動更新腳本
cat > update_nominatim.sh << 'EOF'
#!/bin/bash

# 設定日誌
LOG_FILE="/var/log/nominatim-update.log"
exec 1> >(tee -a "$LOG_FILE")
exec 2>&1

echo "[$(date)] Starting Nominatim update..."

# 檢查服務狀態
if ! docker-compose ps nominatim | grep -q "Up"; then
    echo "[$(date)] Nominatim service is not running, starting..."
    docker-compose up -d nominatim
    sleep 30
fi

# 執行增量更新
docker-compose exec nominatim nominatim replication --once

if [ $? -eq 0 ]; then
    echo "[$(date)] Update completed successfully"
else
    echo "[$(date)] Update failed with exit code $?"
fi

# 清理舊日誌 (保留 7 天)
find /var/log -name "nominatim-update.log*" -mtime +7 -delete
EOF

chmod +x update_nominatim.sh

# 設定 cron 任務 (每小時更新)
echo "0 * * * * /path/to/update_nominatim.sh" | crontab -
```

#### 2.3.3 混合式服務配置

**Nginx 反向代理配置:**
```nginx
# /etc/nginx/sites-available/nominatim-hybrid
server {
    listen 80;
    server_name your-nominatim-domain.com;
    
    # 本地 Nominatim 服務
    location /local/ {
        proxy_pass http://localhost:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_connect_timeout 5s;
        proxy_read_timeout 10s;
        
        # 本地服務失敗時的錯誤處理
        error_page 502 503 504 = @fallback;
    }
    
    # 公共 API 備援
    location @fallback {
        proxy_pass https://nominatim.openstreetmap.org;
        proxy_set_header Host nominatim.openstreetmap.org;
        proxy_set_header User-Agent "YourApp/1.0 (your-email@domain.com)";
        
        # 限制請求頻率
        limit_req zone=nominatim_public burst=5 nodelay;
    }
    
    # 健康檢查端點
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # 狀態監控
    location /status {
        proxy_pass http://localhost:3000/api/nominatim/status;
    }
}

# 限制公共 API 使用頻率
http {
    limit_req_zone $binary_remote_addr zone=nominatim_public:10m rate=1r/s;
}
```

**監控腳本:**
```bash
# health_check.sh
#!/bin/bash

SERVICE_URL="http://localhost:8080"
PUBLIC_URL="https://nominatim.openstreetmap.org"
STATUS_FILE="/tmp/nominatim_status.json"

# 檢查本地服務
check_local() {
    local start_time=$(date +%s%3N)
    local response=$(curl -s -w "%{http_code}" -o /dev/null "$SERVICE_URL/search?q=台北市&format=json&limit=1")
    local end_time=$(date +%s%3N)
    local response_time=$((end_time - start_time))
    
    if [ "$response" = "200" ]; then
        echo "local_available=true local_response_time=${response_time}ms"
        return 0
    else
        echo "local_available=false local_error=HTTP_$response"
        return 1
    fi
}

# 檢查公共服務
check_public() {
    local start_time=$(date +%s%3N)
    local response=$(curl -s -w "%{http_code}" -o /dev/null "$PUBLIC_URL/search?q=Taipei&format=json&limit=1")
    local end_time=$(date +%s%3N)
    local response_time=$((end_time - start_time))
    
    if [ "$response" = "200" ]; then
        echo "public_available=true public_response_time=${response_time}ms"
        return 0
    else
        echo "public_available=false public_error=HTTP_$response"
        return 1
    fi
}

# 生成狀態報告
generate_status() {
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local local_status=$(check_local)
    local public_status=$(check_public)
    
    cat > "$STATUS_FILE" << EOF
{
  "timestamp": "$timestamp",
  "services": {
    "local": { $local_status },
    "public": { $public_status }
  }
}
EOF
    
    echo "Status updated: $STATUS_FILE"
}

# 主執行
generate_status

# 如果本地服務不可用，發送警告
if ! check_local > /dev/null; then
    echo "WARNING: Local Nominatim service is down!" | logger -t nominatim-monitor
fi
```

#### 2.2.3 Pelias 地理編碼引擎
**技術棧:**
- **Pelias**: 開源地理編碼引擎
- **Typesense**: 搜尋引擎後端 (已選用，推薦)
- **OpenAddresses**: 開放地址資料
- **OpenStreetMap**: 地圖資料來源

**優點:**
- 模組化架構
- 支援多種資料來源
- 高性能搜尋
- 支援自動完成

**缺點:**
- 配置複雜
- 資源需求高
- 學習曲線陡峭

**實現範例:**
```javascript
// Pelias API 整合
class PeliasGeocodingService {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }
  
  async search(query, options = {}) {
    const params = new URLSearchParams({
      text: query,
      'boundary.country': options.country || 'TWN',
      size: options.limit || 10,
      layers: options.layers || 'address,venue,street',
      'focus.point.lat': options.focusLat,
      'focus.point.lon': options.focusLon
    });
    
    const response = await fetch(`${this.baseUrl}/v1/search?${params}`);
    return response.json();
  }
  
  async autocomplete(query, options = {}) {
    const params = new URLSearchParams({
      text: query,
      'boundary.country': options.country || 'TWN',
      size: options.limit || 10,
      layers: options.layers || 'address,venue'
    });
    
    const response = await fetch(`${this.baseUrl}/v1/autocomplete?${params}`);
    return response.json();
  }
}
```

#### 2.2.4 混合式 Nominatim 方案 (主要推薦)

**策略概述:**
結合公共 Nominatim API 與自建服務的混合方案，實現漸進式部署和成本優化。

**實施架構:**
```
用戶請求 → 本地快取檢查 → 自建 Nominatim → 公共 API (備援) → 結果快取
```

**優勢:**
- **成本控制**: 大部分查詢使用自建服務，減少 API 調用
- **高可用性**: 公共 API 作為備援，確保服務穩定
- **漸進擴展**: 可根據使用量逐步擴展自建服務
- **資料完整性**: 結合本地資料與公共資料的優勢

**實現策略:**
```javascript
// 混合式地理編碼服務
class HybridNominatimService {
  constructor(options = {}) {
    this.localNominatim = new LocalNominatimService(options.localUrl);
    this.publicNominatim = new PublicNominatimService();
    this.cache = new GeocodingCache();
    this.rateLimiter = new RateLimiter(1, 1000); // 公共 API 限制
    
    // 配置策略
    this.config = {
      preferLocal: true,
      fallbackToPublic: true,
      cacheResults: true,
      maxRetries: 2,
      timeout: 5000
    };
  }
  
  async geocodeAddress(address, options = {}) {
    // 1. 檢查快取
    const cacheKey = this.generateCacheKey(address, options);
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return { ...cached, source: 'cache' };
    }
    
    let result = null;
    let errors = [];
    
    try {
      // 2. 優先使用自建服務
      if (this.config.preferLocal && await this.localNominatim.isAvailable()) {
        result = await this.localNominatim.geocodeAddress(address, options);
        if (result && result.length > 0) {
          result.forEach(r => r.source = 'local');
          await this.cache.set(cacheKey, result);
          return result;
        }
      }
    } catch (error) {
      errors.push({ service: 'local', error: error.message });
    }
    
    try {
      // 3. 備援使用公共 API
      if (this.config.fallbackToPublic) {
        await this.rateLimiter.wait();
        result = await this.publicNominatim.geocodeAddress(address, options);
        if (result && result.length > 0) {
          result.forEach(r => r.source = 'public');
          
          // 4. 將公共 API 結果同步到本地服務
          this.syncToLocal(address, result).catch(err => 
            console.warn('Failed to sync to local:', err)
          );
          
          await this.cache.set(cacheKey, result);
          return result;
        }
      }
    } catch (error) {
      errors.push({ service: 'public', error: error.message });
    }
    
    // 5. 所有服務都失敗
    throw new Error(`Geocoding failed: ${JSON.stringify(errors)}`);
  }
  
  // 將公共 API 結果同步到本地資料庫
  async syncToLocal(address, results) {
    try {
      for (const result of results) {
        await this.localNominatim.addToDatabase({
          address: address,
          latitude: result.latitude,
          longitude: result.longitude,
          displayName: result.displayName,
          addressComponents: result.address,
          source: 'public_api_sync',
          confidence: result.importance || 0.5
        });
      }
    } catch (error) {
      console.error('Sync to local failed:', error);
    }
  }
  
  // 批次地理編碼（優化版）
  async batchGeocode(addresses, options = {}) {
    const results = [];
    const batchSize = 10;
    
    for (let i = 0; i < addresses.length; i += batchSize) {
      const batch = addresses.slice(i, i + batchSize);
      const batchPromises = batch.map(address => 
        this.geocodeAddress(address, options)
          .then(result => ({ address, result, success: true }))
          .catch(error => ({ address, error: error.message, success: false }))
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // 避免過度使用公共 API
      if (i + batchSize < addresses.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }
  
  // 服務健康檢查
  async getServiceStatus() {
    const status = {
      local: { available: false, responseTime: null },
      public: { available: false, responseTime: null },
      cache: { hitRate: 0, entries: 0 }
    };
    
    // 檢查本地服務
    try {
      const start = Date.now();
      await this.localNominatim.healthCheck();
      status.local = {
        available: true,
        responseTime: Date.now() - start
      };
    } catch (error) {
      status.local.error = error.message;
    }
    
    // 檢查公共服務
    try {
      const start = Date.now();
      await this.publicNominatim.healthCheck();
      status.public = {
        available: true,
        responseTime: Date.now() - start
      };
    } catch (error) {
      status.public.error = error.message;
    }
    
    // 快取統計
    status.cache = await this.cache.getStats();
    
    return status;
  }
}
```

#### 2.2.5 地理編碼服務比較

| 服務 | 成本 | 性能 | 準確度 | 維護難度 | 推薦指數 |
|------|------|------|--------|----------|----------|
| 混合式 Nominatim | 低 | 高 | 高 | 中 | ⭐⭐⭐⭐⭐ |
| 自建 Nominatim | 低 | 高 | 高 | 中 | ⭐⭐⭐⭐ |
| Nominatim (公共) | 免費 | 中 | 高 | 低 | ⭐⭐⭐ |
| Pelias | 低 | 高 | 高 | 高 | ⭐⭐⭐ |
| Google Geocoding | 高 | 高 | 很高 | 低 | ⭐⭐ |

**推薦方案**: **混合式 Nominatim 方案** - 結合自建服務與公共 API 的最佳實踐。

#### 2.3.7 實施建議與最佳實踐

**部署檢查清單:**

✅ **前置準備**
- [ ] 確認伺服器規格符合需求
- [ ] 安裝 Docker 和 Docker Compose
- [ ] 設定防火牆規則 (開放 80, 443, 8080 端口)
- [ ] 準備域名和 SSL 憑證

✅ **初始部署**
- [ ] 下載並配置 Docker Compose 檔案
- [ ] 設定環境變數 (.env 檔案)
- [ ] 下載台灣地區 OSM 資料
- [ ] 執行初始資料匯入
- [ ] 配置 Nginx 反向代理

✅ **監控設定**
- [ ] 部署健康檢查腳本
- [ ] 設定日誌輪轉
- [ ] 配置警報通知
- [ ] 建立效能監控儀表板

✅ **安全配置**
- [ ] 設定資料庫密碼
- [ ] 配置 API 速率限制
- [ ] 啟用 HTTPS
- [ ] 設定備份策略

**維護計劃:**

```bash
# 每日維護腳本
#!/bin/bash
# daily_maintenance.sh

echo "[$(date)] Starting daily maintenance..."

# 1. 檢查服務狀態
docker-compose ps

# 2. 更新 OSM 資料
./update_nominatim.sh

# 3. 清理舊日誌
find /var/log -name "*.log" -mtime +30 -delete

# 4. 檢查磁碟空間
df -h | grep -E '(8[0-9]|9[0-9])%' && echo "WARNING: Disk space running low!"

# 5. 備份重要配置
tar -czf "/backup/config_$(date +%Y%m%d).tar.gz" \
    docker-compose.yml .env nginx.conf

# 6. 生成狀態報告
./health_check.sh > "/tmp/status_$(date +%Y%m%d).json"

echo "[$(date)] Daily maintenance completed."
```

**效能優化建議:**

1. **資料庫優化:**
   ```sql
   -- PostgreSQL 效能調整
   ALTER SYSTEM SET shared_buffers = '4GB';
   ALTER SYSTEM SET effective_cache_size = '12GB';
   ALTER SYSTEM SET maintenance_work_mem = '1GB';
   ALTER SYSTEM SET checkpoint_completion_target = 0.9;
   ALTER SYSTEM SET wal_buffers = '16MB';
   ALTER SYSTEM SET default_statistics_target = 100;
   
   -- 重新載入配置
   SELECT pg_reload_conf();
   ```

2. **快取策略:**
   - 使用 Redis 快取熱門查詢結果
   - 實施地理區域快取
   - 設定適當的 TTL 值

3. **負載平衡:**
   - 部署多個 Nominatim 實例
   - 使用 Nginx 負載平衡
   - 實施健康檢查

**故障排除指南:**

| 問題 | 可能原因 | 解決方案 |
|------|----------|----------|
| 本地服務無回應 | 容器停止運行 | `docker-compose restart nominatim` |
| 查詢結果為空 | 資料未完全匯入 | 檢查匯入日誌，重新匯入 |
| 記憶體不足 | PostgreSQL 配置過高 | 調整 shared_buffers 設定 |
| 磁碟空間不足 | 日誌檔案過大 | 清理舊日誌，設定日誌輪轉 |
| API 限制達到 | 公共 API 使用過度 | 檢查同步腳本，調整頻率 |

**成功指標 (KPI):**

- **可用性**: > 99.5%
- **回應時間**: < 200ms (本地查詢)
- **API 節省率**: > 85%
- **資料新鮮度**: < 24 小時
- **成本節省**: > 60% vs 純商業方案

## 3. 架構設計

### 3.1 系統架構
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端應用      │    │   地理位置API   │    │   地圖瓦片服務  │
│   (React)       │◄──►│   (Node.js)     │◄──►│  (OpenStreetMap)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   位置資料庫    │
                       │  (PostgreSQL)   │
                       │   + PostGIS     │
                       └─────────────────┘
```

### 3.2 資料庫設計
```sql
-- 啟用 PostGIS 擴展
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- 用戶位置表
CREATE TABLE user_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    location GEOGRAPHY(POINT, 4326), -- PostGIS 地理位置
    address TEXT,
    formatted_address TEXT, -- 格式化地址
    city VARCHAR(100),
    district VARCHAR(100),
    county VARCHAR(100),
    postal_code VARCHAR(20),
    country_code VARCHAR(2) DEFAULT 'TW',
    is_active BOOLEAN DEFAULT TRUE,
    privacy_level INTEGER DEFAULT 2, -- 1: 精確, 2: 區域, 3: 城市
    location_source VARCHAR(20) DEFAULT 'manual', -- manual, gps, geocoded
    accuracy_meters INTEGER, -- GPS 精確度（米）
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id) -- 每個用戶只有一個活躍位置
);

-- 位置歷史記錄表
CREATE TABLE user_location_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    location GEOGRAPHY(POINT, 4326),
    address TEXT,
    city VARCHAR(100),
    district VARCHAR(100),
    privacy_level INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 地理編碼快取表
CREATE TABLE geocoding_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address_hash VARCHAR(64) UNIQUE, -- 地址的 SHA256 雜湊
    original_address TEXT,
    location GEOGRAPHY(POINT, 4326),
    formatted_address TEXT,
    address_components JSONB,
    confidence_score DECIMAL(3,2), -- 0.00-1.00
    provider VARCHAR(50), -- nominatim, pelias, etc.
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '30 days'
);

-- 地理圍欄表（未來功能）
CREATE TABLE geo_fences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100),
    description TEXT,
    boundary GEOGRAPHY(POLYGON, 4326),
    fence_type VARCHAR(20), -- 'inclusion', 'exclusion'
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 位置搜尋記錄表（用於分析和優化）
CREATE TABLE location_search_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    search_type VARCHAR(20), -- 'nearby_users', 'geocoding', 'reverse_geocoding'
    search_params JSONB,
    result_count INTEGER,
    response_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 地理位置索引
CREATE INDEX idx_user_locations_geography ON user_locations USING GIST (location);
CREATE INDEX idx_user_locations_user_id ON user_locations (user_id);
CREATE INDEX idx_user_locations_city ON user_locations (city);
CREATE INDEX idx_user_locations_district ON user_locations (district);
CREATE INDEX idx_user_locations_active ON user_locations (is_active) WHERE is_active = true;
CREATE INDEX idx_user_locations_privacy ON user_locations (privacy_level);

-- 位置歷史索引
CREATE INDEX idx_location_history_user_id ON user_location_history (user_id);
CREATE INDEX idx_location_history_created_at ON user_location_history (created_at DESC);
CREATE INDEX idx_location_history_geography ON user_location_history USING GIST (location);

-- 地理編碼快取索引
CREATE INDEX idx_geocoding_cache_hash ON geocoding_cache (address_hash);
CREATE INDEX idx_geocoding_cache_expires ON geocoding_cache (expires_at);
CREATE INDEX idx_geocoding_cache_geography ON geocoding_cache USING GIST (location);

-- 地理圍欄索引
CREATE INDEX idx_geo_fences_boundary ON geo_fences USING GIST (boundary);
CREATE INDEX idx_geo_fences_active ON geo_fences (is_active) WHERE is_active = true;

-- 搜尋記錄索引
CREATE INDEX idx_search_logs_user_id ON location_search_logs (user_id);
CREATE INDEX idx_search_logs_created_at ON location_search_logs (created_at DESC);
CREATE INDEX idx_search_logs_search_type ON location_search_logs (search_type);
```

### 3.3 API 設計
```typescript
interface GeolocationService {
  // 位置管理
  updateLocation(userId: string, location: {
    latitude: number;
    longitude: number;
    address?: string;
    privacyLevel?: number;
    source?: 'manual' | 'gps' | 'geocoded';
    accuracy?: number;
  }): Promise<LocationUpdateResult>;

  getCurrentLocation(userId: string): Promise<UserLocation | null>;
  
  getLocationHistory(userId: string, options: {
    limit?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<LocationHistory[]>;

  // 地理編碼服務
  geocodeAddress(address: string, options?: {
    country?: string;
    language?: string;
    limit?: number;
    useCache?: boolean;
  }): Promise<GeocodeResult[]>;

  reverseGeocode(latitude: number, longitude: number, options?: {
    language?: string;
    useCache?: boolean;
  }): Promise<ReverseGeocodeResult>;

  // 批量地理編碼
  batchGeocode(addresses: string[], options?: {
    country?: string;
    language?: string;
  }): Promise<BatchGeocodeResult[]>;

  // 附近用戶搜尋
  findNearbyUsers(userId: string, options: {
    radius: number; // 公里
    limit?: number;
    excludeBlocked?: boolean;
    privacyLevel?: number;
    includeDistance?: boolean;
  }): Promise<NearbyUser[]>;

  // 地理查詢
  searchLocationsByName(query: string, options: {
    country?: string;
    bounds?: BoundingBox;
    limit?: number;
  }): Promise<LocationSearchResult[]>;

  findUsersInArea(bounds: BoundingBox, options?: {
    limit?: number;
    excludeBlocked?: boolean;
  }): Promise<NearbyUser[]>;

  // 距離計算
  calculateDistance(point1: GeoPoint, point2: GeoPoint): number;
  
  calculateBearing(point1: GeoPoint, point2: GeoPoint): number;

  // 地理圍欄（未來功能）
  createGeoFence(fence: {
    name: string;
    description?: string;
    boundary: GeoPolygon;
    type: 'inclusion' | 'exclusion';
  }): Promise<GeoFence>;

  checkPointInFences(point: GeoPoint): Promise<GeoFence[]>;

  // 快取管理
  clearGeocodingCache(olderThan?: Date): Promise<number>;
  
  getGeocodingCacheStats(): Promise<CacheStats>;
}

// 類型定義
interface LocationUpdateResult {
  success: boolean;
  location: UserLocation;
  geocoded?: boolean;
}

interface UserLocation {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  address?: string;
  formattedAddress?: string;
  city?: string;
  district?: string;
  county?: string;
  postalCode?: string;
  countryCode: string;
  privacyLevel: number;
  source: string;
  accuracy?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  addressComponents: {
    streetNumber?: string;
    streetName?: string;
    district?: string;
    city?: string;
    county?: string;
    postalCode?: string;
    country?: string;
  };
  confidence: number;
  provider: string;
}

interface ReverseGeocodeResult {
  address: string;
  formattedAddress: string;
  addressComponents: any;
  confidence: number;
}

interface BatchGeocodeResult {
  originalAddress: string;
  result?: GeocodeResult;
  error?: string;
}

interface NearbyUser {
  userId: string;
  username: string;
  avatar?: string;
  distance?: number; // 公里
  bearing?: number; // 度數
  approximateLocation: {
    latitude: number;
    longitude: number;
    accuracy: 'exact' | 'district' | 'city';
  };
  lastSeen: Date;
}

interface LocationSearchResult {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: 'city' | 'district' | 'landmark' | 'address';
  importance: number;
}

interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface GeoPoint {
  latitude: number;
  longitude: number;
}

interface GeoPolygon {
  coordinates: GeoPoint[];
}

interface GeoFence {
  id: string;
  name: string;
  description?: string;
  boundary: GeoPolygon;
  type: 'inclusion' | 'exclusion';
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
}

interface CacheStats {
  totalEntries: number;
  hitRate: number;
  averageResponseTime: number;
  oldestEntry: Date;
  newestEntry: Date;
}
```

## 4. 隱私保護實現

### 4.1 位置模糊化算法
```typescript
// 位置隱私保護
class LocationPrivacy {
  static fuzzyLocation(lat: number, lng: number, level: number): {
    lat: number;
    lng: number;
    radius: number;
  } {
    switch (level) {
      case 1: // 精確位置（100米內）
        return {
          lat: Math.round(lat * 1000) / 1000,
          lng: Math.round(lng * 1000) / 1000,
          radius: 0.1
        };
      case 2: // 區域位置（1公里內）
        return {
          lat: Math.round(lat * 100) / 100,
          lng: Math.round(lng * 100) / 100,
          radius: 1
        };
      case 3: // 城市位置（5公里內）
        return {
          lat: Math.round(lat * 10) / 10,
          lng: Math.round(lng * 10) / 10,
          radius: 5
        };
      default:
        return { lat, lng, radius: 0 };
    }
  }
}
```

### 4.2 距離顯示策略
```typescript
// 距離顯示邏輯
class DistanceDisplay {
  static formatDistance(distance: number, privacyLevel: number): string {
    if (privacyLevel >= 2) {
      // 模糊化距離顯示
      if (distance < 1) return "1公里內";
      if (distance < 3) return "1-3公里內";
      if (distance < 5) return "3-5公里內";
      if (distance < 10) return "5-10公里內";
      return "10公里以上";
    }
    
    // 精確距離顯示
    if (distance < 1) return `${Math.round(distance * 1000)}公尺`;
    return `${distance.toFixed(1)}公里`;
  }
}
```

## 5. 實施計劃

### 5.1 第一階段（MVP）
- [ ] 基礎地圖顯示（OpenStreetMap + Leaflet）
- [ ] 用戶位置設定與更新
- [ ] 簡單的附近用戶搜尋
- [ ] 基礎隱私保護（區域顯示）

### 5.2 第二階段
- [ ] 地理編碼服務整合
- [ ] 進階隱私設定
- [ ] 距離計算優化
- [ ] 位置驗證機制

### 5.3 第三階段
- [ ] 自建地圖瓦片服務
- [ ] 進階地理搜尋功能
- [ ] 位置歷史記錄
- [ ] 地理圍欄功能

## 6. 技術建議

### 6.1 推薦技術棧
- **地圖服務**: OpenStreetMap + Leaflet
- **地理編碼**: Nominatim (自建)
- **資料庫**: PostgreSQL + PostGIS
- **快取**: Redis (地理位置查詢快取)
- **CDN**: 自建或使用 CloudFlare (地圖瓦片快取)

### 6.2 成本考量
- **OpenStreetMap**: 完全免費
- **自建 Nominatim**: 伺服器成本約 $50-100/月
- **PostGIS**: 包含在 PostgreSQL 中，無額外成本
- **總成本**: 約 $50-100/月（主要是伺服器成本）

### 6.3 效能優化
- **地理索引**: 使用 PostGIS 的 GIST 索引
- **查詢快取**: Redis 快取常用地理查詢
- **CDN**: 地圖瓦片使用 CDN 加速
- **分頁**: 附近用戶搜尋結果分頁載入

## 7. 安全考量

### 7.1 位置資料保護
- **加密存儲**: 敏感位置資料加密存儲
- **存取控制**: 嚴格的位置資料存取權限
- **資料清理**: 定期清理過期位置資料
- **匿名化**: 統計分析時位置資料匿名化

### 7.2 防止濫用
- **頻率限制**: API 呼叫頻率限制
- **異常檢測**: 檢測異常位置更新行為
- **虛假位置檢測**: 檢測明顯虛假的位置資訊

---

**文檔版本**: v1.0  
**最後更新**: 2025-01-02  
**狀態**: ✅ 規劃完成，待實施