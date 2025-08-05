# Geolocation and Map Service Planning

## 1. Service Overview

### 1.1 Core Requirements

**Primary Features:**
- **Nearby User Search**: Find users within specified radius
- **Location Privacy Protection**: Multi-level privacy settings
- **Geocoding Services**: Address to coordinates conversion
- **Distance Calculation**: Accurate distance and bearing calculation
- **Location Verification**: Prevent fake location abuse

**Secondary Features:**
- **Location History**: Track user location changes
- **Geofencing**: Define geographical boundaries (future feature)
- **Location-based Notifications**: Proximity-based alerts
- **Map Integration**: Interactive map display

### 1.2 Privacy Protection Strategy

**Fuzzy Display:**
- **Level 1 (Precise)**: Within 100 meters
- **Level 2 (Regional)**: Within 1 kilometer  
- **Level 3 (City)**: Within 5 kilometers

**Distance Ranges:**
- Instead of exact distances, show ranges like "1-3km away"
- Users can choose their preferred privacy level

**User Control:**
- Complete control over location visibility
- Temporary location hiding
- Selective visibility to specific users

**Dynamic Location:**
- Automatic location updates based on user activity
- Smart location caching to reduce battery usage

## 2. Technical Solution Comparison

### 2.1 Map Service Options

#### 2.1.1 OpenStreetMap (Recommended)
**Advantages:**
- Completely free and open source
- No API call limits
- Rich Taiwan region data
- Community-driven updates
- Full control over styling

**Disadvantages:**
- Requires self-hosting tile servers
- Higher initial setup complexity
- Need to handle tile caching

**Implementation Example:**
```javascript
// Leaflet + OpenStreetMap integration
import L from 'leaflet';

class MapService {
  constructor(containerId) {
    this.map = L.map(containerId).setView([25.0330, 121.5654], 13);
    
    // Use OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);
  }
  
  addUserMarker(lat, lng, userData, privacyLevel = 2) {
    const fuzzyLocation = this.fuzzyLocation(lat, lng, privacyLevel);
    
    const marker = L.marker([fuzzyLocation.lat, fuzzyLocation.lng])
      .addTo(this.map)
      .bindPopup(`
        <div class="user-popup">
          <img src="${userData.avatar}" alt="${userData.username}" />
          <h4>${userData.username}</h4>
          <p>Distance: ${this.formatDistance(userData.distance, privacyLevel)}</p>
        </div>
      `);
    
    // Add uncertainty circle for privacy levels
    if (privacyLevel > 1) {
      L.circle([fuzzyLocation.lat, fuzzyLocation.lng], {
        radius: fuzzyLocation.radius * 1000, // Convert to meters
        fillColor: '#3388ff',
        fillOpacity: 0.1,
        color: '#3388ff',
        weight: 1
      }).addTo(this.map);
    }
    
    return marker;
  }
  
  fuzzyLocation(lat, lng, level) {
    switch (level) {
      case 1: // Precise (within 100m)
        return {
          lat: Math.round(lat * 1000) / 1000,
          lng: Math.round(lng * 1000) / 1000,
          radius: 0.1
        };
      case 2: // Regional (within 1km)
        return {
          lat: Math.round(lat * 100) / 100,
          lng: Math.round(lng * 100) / 100,
          radius: 1
        };
      case 3: // City (within 5km)
        return {
          lat: Math.round(lat * 10) / 10,
          lng: Math.round(lng * 10) / 10,
          radius: 5
        };
      default:
        return { lat, lng, radius: 0 };
    }
  }
  
  formatDistance(distance, privacyLevel) {
    if (privacyLevel >= 2) {
      if (distance < 1) return "Within 1km";
      if (distance < 3) return "1-3km away";
      if (distance < 5) return "3-5km away";
      if (distance < 10) return "5-10km away";
      return "10km+ away";
    }
    
    if (distance < 1) return `${Math.round(distance * 1000)}m`;
    return `${distance.toFixed(1)}km`;
  }
}
```

#### 2.1.2 Google Maps API
**Advantages:**
- High-quality maps and satellite imagery
- Excellent geocoding accuracy
- Rich features and documentation
- Global coverage

**Disadvantages:**
- **High cost**: $7 per 1000 map loads
- API call limits
- Vendor lock-in
- Terms of service restrictions

**Cost Analysis:**
```
Assuming 10,000 monthly active users:
- Average 20 map views per user per month
- Total: 200,000 map loads/month
- Cost: 200,000 × $0.007 = $1,400/month
- Annual cost: $16,800
```

#### 2.1.3 MapBox
**Advantages:**
- Beautiful map styling
- Good performance
- Reasonable pricing
- Developer-friendly

**Disadvantages:**
- Still has usage costs
- Less detailed Taiwan data compared to OSM
- Vendor dependency

**Recommendation**: **OpenStreetMap** - Best balance of cost, features, and control.

### 2.2 Geocoding Service Options

#### 2.2.1 Nominatim (OpenStreetMap Geocoding)
**Public API:**
- Free to use
- Rate limited (1 request/second)
- Good accuracy for Taiwan addresses
- No API key required

**Implementation Example:**
```javascript
class NominatimGeocodingService {
  constructor() {
    this.baseUrl = 'https://nominatim.openstreetmap.org';
    this.rateLimiter = new RateLimiter(1, 1000); // 1 request per second
  }
  
  async geocodeAddress(address, options = {}) {
    await this.rateLimiter.wait();
    
    const params = new URLSearchParams({
      q: address,
      format: 'json',
      addressdetails: '1',
      limit: options.limit || '5',
      countrycodes: options.country || 'tw',
      'accept-language': options.language || 'zh-TW,zh,en'
    });
    
    const response = await fetch(`${this.baseUrl}/search?${params}`, {
      headers: {
        'User-Agent': 'MKingFriend/1.0 (contact@mkingfriend.com)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`);
    }
    
    const results = await response.json();
    
    return results.map(result => ({
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      formattedAddress: result.display_name,
      addressComponents: {
        houseNumber: result.address?.house_number,
        street: result.address?.road,
        district: result.address?.suburb || result.address?.neighbourhood,
        city: result.address?.city || result.address?.town,
        county: result.address?.county || result.address?.state,
        postalCode: result.address?.postcode,
        country: result.address?.country
      },
      confidence: parseFloat(result.importance || 0.5),
      provider: 'nominatim'
    }));
  }
  
  async reverseGeocode(lat, lng, options = {}) {
    await this.rateLimiter.wait();
    
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lng.toString(),
      format: 'json',
      addressdetails: '1',
      'accept-language': options.language || 'zh-TW,zh,en'
    });
    
    const response = await fetch(`${this.baseUrl}/reverse?${params}`, {
      headers: {
        'User-Agent': 'MKingFriend/1.0 (contact@mkingfriend.com)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${response.status}`);
    }
    
    const result = await response.json();
    
    return {
      address: result.display_name,
      formattedAddress: result.display_name,
      addressComponents: result.address,
      confidence: parseFloat(result.importance || 0.5)
    };
  }
}

// Rate limiter utility
class RateLimiter {
  constructor(maxRequests, timeWindow) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
    this.requests = [];
  }
  
  async wait() {
    const now = Date.now();
    
    // Remove old requests outside time window
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.timeWindow - (now - oldestRequest);
      
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    this.requests.push(now);
  }
}
```

**Self-hosted Nominatim:**
```bash
# Docker deployment of Nominatim
docker run -it \
  -e PBF_URL=https://download.geofabrik.de/asia/taiwan-latest.osm.pbf \
  -e REPLICATION_URL=https://download.geofabrik.de/asia/taiwan-updates/ \
  -e IMPORT_WIKIPEDIA=false \
  -e NOMINATIM_PASSWORD=your-password \
  -p 8080:8080 \
  --name nominatim \
  mediagis/nominatim:4.2
```

### 2.3 Self-hosted Nominatim Deployment

#### 2.3.1 System Requirements

**Hardware Requirements (Hybrid Deployment):**
- CPU: 4+ cores (recommended 8 cores)
- RAM: 16GB+ (recommended 32GB)
- Storage: 200GB+ SSD (initial deployment, expandable)
- Network: Stable internet connection

**Software Requirements:**
- Ubuntu 20.04+ or CentOS 8+
- PostgreSQL 14+
- PostGIS 3.2+
- Apache/Nginx
- PHP 8.0+
- Docker & Docker Compose (recommended)

#### 2.3.4 Data Synchronization and Scaling Strategy

**Smart Data Synchronization:**
```bash
# sync_strategy.sh - Smart synchronization script
#!/bin/bash

# Configuration parameters
LOCAL_DB="nominatim_local"
SYNC_LOG="/var/log/nominatim-sync.log"
API_USAGE_LIMIT=1000  # Daily API call limit
CURRENT_USAGE_FILE="/tmp/api_usage_today.count"

# Check today's API usage
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

# Update API usage count
update_api_usage() {
    local today=$(date +%Y%m%d)
    local usage_file="${CURRENT_USAGE_FILE}_${today}"
    local current_usage=$(check_api_usage)
    local new_usage=$((current_usage + 1))
    
    echo "$new_usage" > "$usage_file"
    echo "API usage updated: $new_usage/$API_USAGE_LIMIT"
}

# Sync data from public API
sync_from_public_api() {
    local address="$1"
    local current_usage=$(check_api_usage)
    
    if [ "$current_usage" -ge "$API_USAGE_LIMIT" ]; then
        echo "API usage limit reached for today: $current_usage/$API_USAGE_LIMIT"
        return 1
    fi
    
    # Call public API
    local response=$(curl -s "https://nominatim.openstreetmap.org/search?q=${address}&format=json&limit=5")
    
    if [ $? -eq 0 ] && [ "$response" != "[]" ]; then
        # Parse and store in local database
        echo "$response" | jq -r '.[] | [.lat, .lon, .display_name, .importance] | @csv' | \
        while IFS=',' read -r lat lon display_name importance; do
            # Clean data
            lat=$(echo "$lat" | tr -d '"')
            lon=$(echo "$lon" | tr -d '"')
            display_name=$(echo "$display_name" | tr -d '"')
            importance=$(echo "$importance" | tr -d '"')
            
            # Insert into local database
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

# Batch sync popular addresses
batch_sync_popular_addresses() {
    # Extract popular search addresses from application logs
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
        address=$(echo "$address" | xargs)  # Remove leading/trailing whitespace
        if [ -n "$address" ]; then
            sync_from_public_api "$address"
            sleep 2  # Avoid excessive requests
        fi
    done <<< "$popular_addresses"
}

# Main execution logic
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

#### 2.3.5 Cost-Benefit Analysis

**Hybrid Solution vs Pure Public API:**

| Item | Pure Public API | Hybrid Solution | Savings |
|------|-----------------|-----------------|----------|
| Initial Setup Cost | $0 | $500-1000 | - |
| Monthly Server Cost | $0 | $50-100 | - |
| API Call Cost | Limited | 90% reduction | Significant |
| Service Reliability | Medium | High | Improved |
| Response Speed | Slow | Fast | 3-5x improvement |
| Customization | None | High | Full control |

**ROI Calculation (Annual):**
```
Assuming 10,000 geocoding requests per month:

Pure Public API:
- Limited by rate limiting, requires multiple IPs or paid services
- Estimated cost: $200-500/month

Hybrid Solution:
- Server cost: $75/month
- 90% requests use local service
- 10% use public API (1,000 requests/month)
- Total cost: $75/month

Annual savings: ($300 - $75) × 12 = $2,700
Payback period: 3-4 months
```

#### 2.3.6 Scaling Path

**Phased Scaling Plan:**

1. **Phase 1 (1-3 months):**
   - Deploy Taiwan region data
   - Establish basic monitoring
   - Implement API fallback mechanism

2. **Phase 2 (3-6 months):**
   - Expand to major Asian cities
   - Implement smart caching strategy
   - Add geofencing functionality

3. **Phase 3 (6-12 months):**
   - Global data coverage
   - Machine learning optimization
   - Multi-language support

**Data Expansion Strategy:**
```bash
# Phased data download script
#!/bin/bash

STAGE="$1"
DATA_DIR="/data/osm"

case "$STAGE" in
    "taiwan")
        wget -P "$DATA_DIR" https://download.geofabrik.de/asia/taiwan-latest.osm.pbf
        ;;
    "asia-cities")
        # Download major Asian cities
        cities=("japan" "south-korea" "hong-kong" "singapore" "thailand" "malaysia")
        for city in "${cities[@]}"; do
            wget -P "$DATA_DIR" "https://download.geofabrik.de/asia/${city}-latest.osm.pbf"
        done
        ;;
    "global")
        # Download global data (requires significant storage)
        wget -P "$DATA_DIR" https://planet.openstreetmap.org/pbf/planet-latest.osm.pbf
        ;;
    *)
        echo "Usage: $0 {taiwan|asia-cities|global}"
        exit 1
        ;;
esac

# Import data
for pbf_file in "$DATA_DIR"/*.osm.pbf; do
    echo "Importing $pbf_file..."
    docker-compose run --rm nominatim nominatim import --osm-file "/nominatim/$(basename "$pbf_file")"
done
```

#### 2.3.2 Progressive Data Building Strategy

**Phase 1: Basic Deployment**
```bash
# 1. Create project directory
mkdir -p ~/nominatim-hybrid
cd ~/nominatim-hybrid

# 2. Download Docker Compose configuration
wget https://raw.githubusercontent.com/mediagis/nominatim-docker/master/docker-compose.yml

# 3. Create environment configuration
cat > .env << EOF
NOMINATIM_PASSWORD=your_secure_password
POSTGRES_PASSWORD=postgres_password
NOMINATIM_REPLICATION_URL=https://download.geofabrik.de/asia/taiwan-updates/
NOMINATIM_IMPORT_STYLE=full
NOMINATIM_THREADS=4
EOF
```

**Phase 2: Initial Data Import**
```bash
# 1. Download Taiwan region data (smaller dataset to start)
wget https://download.geofabrik.de/asia/taiwan-latest.osm.pbf

# 2. Start PostgreSQL container
docker-compose up -d postgres

# 3. Wait for database to be ready
sleep 30

# 4. Import initial data
docker-compose run --rm nominatim nominatim import --osm-file /nominatim/taiwan-latest.osm.pbf

# 5. Start Nominatim service
docker-compose up -d nominatim
```

**Phase 3: Incremental Data Updates**
```bash
# Create automatic update script
cat > update_nominatim.sh << 'EOF'
#!/bin/bash

# Set up logging
LOG_FILE="/var/log/nominatim-update.log"
exec 1> >(tee -a "$LOG_FILE")
exec 2>&1

echo "[$(date)] Starting Nominatim update..."

# Check service status
if ! docker-compose ps nominatim | grep -q "Up"; then
    echo "[$(date)] Nominatim service is not running, starting..."
    docker-compose up -d nominatim
    sleep 30
fi

# Execute incremental update
docker-compose exec nominatim nominatim replication --once

if [ $? -eq 0 ]; then
    echo "[$(date)] Update completed successfully"
else
    echo "[$(date)] Update failed with exit code $?"
fi

# Clean old logs (keep 7 days)
find /var/log -name "nominatim-update.log*" -mtime +7 -delete
EOF

chmod +x update_nominatim.sh

# Set up cron job (hourly updates)
echo "0 * * * * /path/to/update_nominatim.sh" | crontab -
```

#### 2.3.3 Hybrid Service Configuration

**Nginx Reverse Proxy Configuration:**
```nginx
# /etc/nginx/sites-available/nominatim-hybrid
server {
    listen 80;
    server_name your-nominatim-domain.com;
    
    # Local Nominatim service
    location /local/ {
        proxy_pass http://localhost:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_connect_timeout 5s;
        proxy_read_timeout 10s;
        
        # Error handling for local service failures
        error_page 502 503 504 = @fallback;
    }
    
    # Public API fallback
    location @fallback {
        proxy_pass https://nominatim.openstreetmap.org;
        proxy_set_header Host nominatim.openstreetmap.org;
        proxy_set_header User-Agent "YourApp/1.0 (your-email@domain.com)";
        
        # Rate limiting
        limit_req zone=nominatim_public burst=5 nodelay;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # Status monitoring
    location /status {
        proxy_pass http://localhost:3000/api/nominatim/status;
    }
}

# Rate limiting for public API usage
http {
    limit_req_zone $binary_remote_addr zone=nominatim_public:10m rate=1r/s;
}
```

**Monitoring Script:**
```bash
# health_check.sh
#!/bin/bash

SERVICE_URL="http://localhost:8080"
PUBLIC_URL="https://nominatim.openstreetmap.org"
STATUS_FILE="/tmp/nominatim_status.json"

# Check local service
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

# Check public service
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

# Generate status report
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

# Main execution
generate_status

# Send warning if local service is unavailable
if ! check_local > /dev/null; then
    echo "WARNING: Local Nominatim service is down!" | logger -t nominatim-monitor
fi
```

#### 2.2.3 Pelias Geocoding Engine
**Technology Stack:**
- **Pelias**: Open source geocoding engine
- **Typesense**: Search engine backend (already selected, recommended)
- **OpenAddresses**: Open address data
- **OpenStreetMap**: Map data source

**Advantages:**
- Modular architecture
- Supports multiple data sources
- High-performance search
- Supports autocomplete

**Disadvantages:**
- Complex configuration
- High resource requirements
- Steep learning curve

**Implementation Example:**
```javascript
// Pelias API integration
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

#### 2.2.4 Hybrid Nominatim Solution (Primary Recommendation)

**Strategy Overview:**
Combined solution using public Nominatim API with self-hosted service for progressive deployment and cost optimization.

**Implementation Architecture:**
```
User Request → Local Cache Check → Self-hosted Nominatim → Public API (Fallback) → Result Cache
```

**Advantages:**
- **Cost Control**: Most queries use self-hosted service, reducing API calls
- **High Availability**: Public API as fallback ensures service stability
- **Progressive Scaling**: Can gradually expand self-hosted service based on usage
- **Data Completeness**: Combines advantages of local and public data

**Implementation Strategy:**
```javascript
// Hybrid geocoding service
class HybridNominatimService {
  constructor(options = {}) {
    this.localNominatim = new LocalNominatimService(options.localUrl);
    this.publicNominatim = new PublicNominatimService();
    this.cache = new GeocodingCache();
    this.rateLimiter = new RateLimiter(1, 1000); // Public API limit
    
    // Configuration strategy
    this.config = {
      preferLocal: true,
      fallbackToPublic: true,
      cacheResults: true,
      maxRetries: 2,
      timeout: 5000
    };
  }
  
  async geocodeAddress(address, options = {}) {
    // 1. Check cache
    const cacheKey = this.generateCacheKey(address, options);
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return { ...cached, source: 'cache' };
    }
    
    let result = null;
    let errors = [];
    
    try {
      // 2. Prefer self-hosted service
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
      // 3. Fallback to public API
      if (this.config.fallbackToPublic) {
        await this.rateLimiter.wait();
        result = await this.publicNominatim.geocodeAddress(address, options);
        if (result && result.length > 0) {
          result.forEach(r => r.source = 'public');
          
          // 4. Sync public API results to local service
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
    
    // 5. All services failed
    throw new Error(`Geocoding failed: ${JSON.stringify(errors)}`);
  }
  
  // Sync public API results to local database
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
  
  // Batch geocoding (optimized version)
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
      
      // Avoid excessive public API usage
      if (i + batchSize < addresses.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }
  
  // Service health check
  async getServiceStatus() {
    const status = {
      local: { available: false, responseTime: null },
      public: { available: false, responseTime: null },
      cache: { hitRate: 0, entries: 0 }
    };
    
    // Check local service
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
    
    // Check public service
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
    
    // Cache statistics
    status.cache = await this.cache.getStats();
    
    return status;
  }
}
```

#### 2.2.5 Geocoding Service Comparison

| Service | Cost | Performance | Accuracy | Maintenance | Recommendation |
|---------|------|-------------|----------|-------------|----------------|
| Hybrid Nominatim | Low | High | High | Medium | ⭐⭐⭐⭐⭐ |
| Self-hosted Nominatim | Low | High | High | Medium | ⭐⭐⭐⭐ |
| Nominatim (Public) | Free | Medium | High | Low | ⭐⭐⭐ |
| Pelias | Low | High | High | High | ⭐⭐⭐ |
| Google Geocoding | High | High | Very High | Low | ⭐⭐ |

**Recommended Solution**: **Hybrid Nominatim Solution** - Best practice combining self-hosted service with public API.

#### 2.3.7 Implementation Recommendations and Best Practices

**Deployment Checklist:**

✅ **Prerequisites**
- [ ] Confirm server specifications meet requirements
- [ ] Install Docker and Docker Compose
- [ ] Configure firewall rules (open ports 80, 443, 8080)
- [ ] Prepare domain name and SSL certificates

✅ **Initial Deployment**
- [ ] Download and configure Docker Compose files
- [ ] Set environment variables (.env file)
- [ ] Download Taiwan region OSM data
- [ ] Execute initial data import
- [ ] Configure Nginx reverse proxy

✅ **Monitoring Setup**
- [ ] Deploy health check scripts
- [ ] Set up log rotation
- [ ] Configure alert notifications
- [ ] Create performance monitoring dashboard

✅ **Security Configuration**
- [ ] Set database passwords
- [ ] Configure API rate limiting
- [ ] Enable HTTPS
- [ ] Set up backup strategy

**Maintenance Plan:**

```bash
# Daily maintenance script
#!/bin/bash
# daily_maintenance.sh

echo "[$(date)] Starting daily maintenance..."

# 1. Check service status
docker-compose ps

# 2. Update OSM data
./update_nominatim.sh

# 3. Clean old logs
find /var/log -name "*.log" -mtime +30 -delete

# 4. Check disk space
df -h | grep -E '(8[0-9]|9[0-9])%' && echo "WARNING: Disk space running low!"

# 5. Backup important configurations
tar -czf "/backup/config_$(date +%Y%m%d).tar.gz" \
    docker-compose.yml .env nginx.conf

# 6. Generate status report
./health_check.sh > "/tmp/status_$(date +%Y%m%d).json"

echo "[$(date)] Daily maintenance completed."
```

**Performance Optimization Recommendations:**

1. **Database Optimization:**
   ```sql
   -- PostgreSQL performance tuning
   ALTER SYSTEM SET shared_buffers = '4GB';
   ALTER SYSTEM SET effective_cache_size = '12GB';
   ALTER SYSTEM SET maintenance_work_mem = '1GB';
   ALTER SYSTEM SET checkpoint_completion_target = 0.9;
   ALTER SYSTEM SET wal_buffers = '16MB';
   ALTER SYSTEM SET default_statistics_target = 100;
   
   -- Reload configuration
   SELECT pg_reload_conf();
   ```

2. **Caching Strategy:**
   - Use Redis for caching popular query results
   - Implement geographical region caching
   - Set appropriate TTL values

3. **Load Balancing:**
   - Deploy multiple Nominatim instances
   - Use Nginx load balancing
   - Implement health checks

**Troubleshooting Guide:**

| Issue | Possible Cause | Solution |
|-------|----------------|----------|
| Local service not responding | Container stopped | `docker-compose restart nominatim` |
| Empty query results | Data not fully imported | Check import logs, re-import |
| Out of memory | PostgreSQL config too high | Adjust shared_buffers settings |
| Disk space full | Log files too large | Clean old logs, set log rotation |
| API limit reached | Excessive public API usage | Check sync scripts, adjust frequency |

**Success Metrics (KPIs):**

- **Availability**: > 99.5%
- **Response Time**: < 200ms (local queries)
- **API Savings Rate**: > 85%
- **Data Freshness**: < 24 hours
- **Cost Savings**: > 60% vs pure commercial solution

## 3. Architecture Design

### 3.1 System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend App  │    │  Geolocation API│    │  Map Tile Service│
│   (React)       │◄──►│   (Node.js)     │◄──►│  (OpenStreetMap)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  Location DB    │
                       │  (PostgreSQL)   │
                       │   + PostGIS     │
                       └─────────────────┘
```

### 3.2 Database Design
```sql
-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- User locations table
CREATE TABLE user_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    location GEOGRAPHY(POINT, 4326), -- PostGIS geographic location
    address TEXT,
    formatted_address TEXT, -- Formatted address
    city VARCHAR(100),
    district VARCHAR(100),
    county VARCHAR(100),
    postal_code VARCHAR(20),
    country_code VARCHAR(2) DEFAULT 'TW',
    is_active BOOLEAN DEFAULT TRUE,
    privacy_level INTEGER DEFAULT 2, -- 1: precise, 2: regional, 3: city
    location_source VARCHAR(20) DEFAULT 'manual', -- manual, gps, geocoded
    accuracy_meters INTEGER, -- GPS accuracy (meters)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id) -- Each user has only one active location
);

-- Location history table
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

-- Geocoding cache table
CREATE TABLE geocoding_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address_hash VARCHAR(64) UNIQUE, -- SHA256 hash of address
    original_address TEXT,
    location GEOGRAPHY(POINT, 4326),
    formatted_address TEXT,
    address_components JSONB,
    confidence_score DECIMAL(3,2), -- 0.00-1.00
    provider VARCHAR(50), -- nominatim, pelias, etc.
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '30 days'
);

-- Geofences table (future feature)
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

-- Location search logs table (for analysis and optimization)
CREATE TABLE location_search_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    search_type VARCHAR(20), -- 'nearby_users', 'geocoding', 'reverse_geocoding'
    search_params JSONB,
    result_count INTEGER,
    response_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Geographic location indexes
CREATE INDEX idx_user_locations_geography ON user_locations USING GIST (location);
CREATE INDEX idx_user_locations_user_id ON user_locations (user_id);
CREATE INDEX idx_user_locations_city ON user_locations (city);
CREATE INDEX idx_user_locations_district ON user_locations (district);
CREATE INDEX idx_user_locations_active ON user_locations (is_active) WHERE is_active = true;
CREATE INDEX idx_user_locations_privacy ON user_locations (privacy_level);

-- Location history indexes
CREATE INDEX idx_location_history_user_id ON user_location_history (user_id);
CREATE INDEX idx_location_history_created_at ON user_location_history (created_at DESC);
CREATE INDEX idx_location_history_geography ON user_location_history USING GIST (location);

-- Geocoding cache indexes
CREATE INDEX idx_geocoding_cache_hash ON geocoding_cache (address_hash);
CREATE INDEX idx_geocoding_cache_expires ON geocoding_cache (expires_at);
CREATE INDEX idx_geocoding_cache_geography ON geocoding_cache USING GIST (location);

-- Geofence indexes
CREATE INDEX idx_geo_fences_boundary ON geo_fences USING GIST (boundary);
CREATE INDEX idx_geo_fences_active ON geo_fences (is_active) WHERE is_active = true;

-- Search logs indexes
CREATE INDEX idx_search_logs_user_id ON location_search_logs (user_id);
CREATE INDEX idx_search_logs_created_at ON location_search_logs (created_at DESC);
CREATE INDEX idx_search_logs_search_type ON location_search_logs (search_type);
```

### 3.3 API Design
```typescript
interface GeolocationService {
  // Location management
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

  // Geocoding services
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

  // Batch geocoding
  batchGeocode(addresses: string[], options?: {
    country?: string;
    language?: string;
  }): Promise<BatchGeocodeResult[]>;

  // Nearby user search
  findNearbyUsers(userId: string, options: {
    radius: number; // kilometers
    limit?: number;
    excludeBlocked?: boolean;
    privacyLevel?: number;
    includeDistance?: boolean;
  }): Promise<NearbyUser[]>;

  // Geographic queries
  searchLocationsByName(query: string, options: {
    country?: string;
    bounds?: BoundingBox;
    limit?: number;
  }): Promise<LocationSearchResult[]>;

  findUsersInArea(bounds: BoundingBox, options?: {
    limit?: number;
    excludeBlocked?: boolean;
  }): Promise<NearbyUser[]>;

  // Distance calculation
  calculateDistance(point1: GeoPoint, point2: GeoPoint): number;
  
  calculateBearing(point1: GeoPoint, point2: GeoPoint): number;

  // Geofencing (future feature)
  createGeoFence(fence: {
    name: string;
    description?: string;
    boundary: GeoPolygon;
    type: 'inclusion' | 'exclusion';
  }): Promise<GeoFence>;

  checkPointInFences(point: GeoPoint): Promise<GeoFence[]>;

  // Cache management
  clearGeocodingCache(olderThan?: Date): Promise<number>;
  
  getGeocodingCacheStats(): Promise<CacheStats>;
}

// Type definitions
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
  distance?: number; // kilometers
  bearing?: number; // degrees
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

## 4. Privacy Protection Implementation

### 4.1 Location Fuzzing Algorithm
```typescript
// Location privacy protection
class LocationPrivacy {
  static fuzzyLocation(lat: number, lng: number, level: number): {
    lat: number;
    lng: number;
    radius: number;
  } {
    switch (level) {
      case 1: // Precise location (within 100m)
        return {
          lat: Math.round(lat * 1000) / 1000,
          lng: Math.round(lng * 1000) / 1000,
          radius: 0.1
        };
      case 2: // Regional location (within 1km)
        return {
          lat: Math.round(lat * 100) / 100,
          lng: Math.round(lng * 100) / 100,
          radius: 1
        };
      case 3: // City location (within 5km)
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

### 4.2 Distance Display Strategy
```typescript
// Distance display logic
class DistanceDisplay {
  static formatDistance(distance: number, privacyLevel: number): string {
    if (privacyLevel >= 2) {
      // Fuzzy distance display
      if (distance < 1) return "Within 1km";
      if (distance < 3) return "1-3km away";
      if (distance < 5) return "3-5km away";
      if (distance < 10) return "5-10km away";
      return "10km+ away";
    }
    
    // Precise distance display
    if (distance < 1) return `${Math.round(distance * 1000)}m`;
    return `${distance.toFixed(1)}km`;
  }
}
```

## 5. Implementation Plan

### 5.1 Phase 1 (MVP)
- [ ] Basic map display (OpenStreetMap + Leaflet)
- [ ] User location setting and updates
- [ ] Simple nearby user search
- [ ] Basic privacy protection (regional display)

### 5.2 Phase 2
- [ ] Geocoding service integration
- [ ] Advanced privacy settings
- [ ] Distance calculation optimization
- [ ] Location verification mechanism

### 5.3 Phase 3
- [ ] Self-hosted map tile service
- [ ] Advanced geographic search features
- [ ] Location history records
- [ ] Geofencing functionality

## 6. Technical Recommendations

### 6.1 Recommended Technology Stack
- **Map Service**: OpenStreetMap + Leaflet
- **Geocoding**: Nominatim (self-hosted)
- **Database**: PostgreSQL + PostGIS
- **Cache**: Redis (geographic location query cache)
- **CDN**: Self-hosted or CloudFlare (map tile cache)

### 6.2 Cost Considerations
- **OpenStreetMap**: Completely free
- **Self-hosted Nominatim**: Server costs ~$50-100/month
- **PostGIS**: Included with PostgreSQL, no additional cost
- **Total Cost**: ~$50-100/month (mainly server costs)

### 6.3 Performance Optimization
- **Geographic Indexes**: Use PostGIS GIST indexes
- **Query Cache**: Redis cache for common geographic queries
- **CDN**: Map tiles using CDN acceleration
- **Pagination**: Paginated loading of nearby user search results

## 7. Security Considerations

### 7.1 Location Data Protection
- **Encrypted Storage**: Encrypt sensitive location data
- **Access Control**: Strict location data access permissions
- **Data Cleanup**: Regular cleanup of expired location data
- **Anonymization**: Anonymize location data for statistical analysis

### 7.2 Abuse Prevention
- **Rate Limiting**: API call frequency limits
- **Anomaly Detection**: Detect abnormal location update behavior
- **Fake Location Detection**: Detect obviously fake location information

---

**Document Version**: v1.0  
**Last Updated**: 2025-01-02  
**Status**: ✅ Planning Complete, Ready for Implementation