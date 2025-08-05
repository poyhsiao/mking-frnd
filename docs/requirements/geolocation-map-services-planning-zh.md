# 地理位置與地圖服務規劃

## 1. 功能概述

### 1.1 服務範圍

**主要功能**
- 用戶位置定位
- 附近用戶搜尋
- 地圖顯示與導航
- 位置分享
- 地理圍欄
- 位置歷史記錄

**目標用戶**
- 尋找附近朋友的用戶
- 希望分享位置的用戶
- 需要地理相關服務的用戶
- 商家與服務提供者

**服務目標**
- 提升用戶連接體驗
- 增加平台黏性
- 支援本地化服務
- 保護用戶隱私

### 1.2 功能類型

**位置服務**
- GPS 定位
- IP 地理定位
- WiFi/基站定位
- 手動位置設定

**地圖功能**
- 地圖顯示
- 路線規劃
- 興趣點標記
- 自定義標記

**社交功能**
- 附近用戶
- 位置分享
- 簽到功能
- 活動地點

**隱私控制**
- 位置權限管理
- 精確度控制
- 歷史記錄管理
- 匿名模式

## 2. 技術方案比較

### 2.1 地圖服務提供商

#### 2.1.1 Google Maps API

**優點**
- 全球覆蓋率最高
- 數據準確性佳
- 功能豐富完整
- 開發文檔詳細

**缺點**
- 費用較高
- 在中國大陸受限
- 需要信用卡驗證

**適用場景**
- 國際化應用
- 高精度需求
- 豐富功能需求

```javascript
// Google Maps API 整合示例
class GoogleMapsService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.map = null;
        this.markers = [];
    }
    
    async initializeMap(containerId, options = {}) {
        const defaultOptions = {
            center: { lat: 25.0330, lng: 121.5654 }, // 台北
            zoom: 13,
            mapTypeId: 'roadmap'
        };
        
        const mapOptions = { ...defaultOptions, ...options };
        
        this.map = new google.maps.Map(
            document.getElementById(containerId),
            mapOptions
        );
        
        return this.map;
    }
    
    async getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('瀏覽器不支援地理定位'));
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    };
                    resolve(location);
                },
                (error) => {
                    reject(new Error(`定位失敗: ${error.message}`));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 // 5分鐘
                }
            );
        });
    }
    
    addMarker(location, options = {}) {
        const marker = new google.maps.Marker({
            position: location,
            map: this.map,
            title: options.title || '',
            icon: options.icon || null
        });
        
        if (options.infoWindow) {
            const infoWindow = new google.maps.InfoWindow({
                content: options.infoWindow
            });
            
            marker.addListener('click', () => {
                infoWindow.open(this.map, marker);
            });
        }
        
        this.markers.push(marker);
        return marker;
    }
    
    async searchNearbyPlaces(location, radius = 1000, type = 'restaurant') {
        const service = new google.maps.places.PlacesService(this.map);
        
        return new Promise((resolve, reject) => {
            const request = {
                location: location,
                radius: radius,
                type: [type]
            };
            
            service.nearbySearch(request, (results, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    resolve(results);
                } else {
                    reject(new Error(`搜尋失敗: ${status}`));
                }
            });
        });
    }
    
    calculateDistance(point1, point2) {
        const service = new google.maps.DistanceMatrixService();
        
        return new Promise((resolve, reject) => {
            service.getDistanceMatrix({
                origins: [point1],
                destinations: [point2],
                travelMode: google.maps.TravelMode.DRIVING,
                unitSystem: google.maps.UnitSystem.METRIC
            }, (response, status) => {
                if (status === google.maps.DistanceMatrixStatus.OK) {
                    const result = response.rows[0].elements[0];
                    resolve({
                        distance: result.distance,
                        duration: result.duration
                    });
                } else {
                    reject(new Error(`距離計算失敗: ${status}`));
                }
            });
        });
    }
}
```

#### 2.1.2 OpenStreetMap + Leaflet

**優點**
- 完全免費
- 開源社群支援
- 自主控制性高
- 無使用限制

**缺點**
- 數據準確性較低
- 功能相對簡單
- 需要自建服務

**適用場景**
- 預算有限
- 基礎地圖需求
- 自主控制需求

```javascript
// OpenStreetMap + Leaflet 整合示例
class LeafletMapService {
    constructor() {
        this.map = null;
        this.markers = [];
        this.userLocationMarker = null;
    }
    
    initializeMap(containerId, options = {}) {
        const defaultOptions = {
            center: [25.0330, 121.5654], // 台北
            zoom: 13
        };
        
        const mapOptions = { ...defaultOptions, ...options };
        
        this.map = L.map(containerId).setView(
            mapOptions.center,
            mapOptions.zoom
        );
        
        // 添加 OpenStreetMap 圖層
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(this.map);
        
        return this.map;
    }
    
    async getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('瀏覽器不支援地理定位'));
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    };
                    
                    // 更新地圖中心
                    this.map.setView([location.lat, location.lng], 15);
                    
                    // 添加用戶位置標記
                    if (this.userLocationMarker) {
                        this.map.removeLayer(this.userLocationMarker);
                    }
                    
                    this.userLocationMarker = L.marker([location.lat, location.lng])
                        .addTo(this.map)
                        .bindPopup('您的位置')
                        .openPopup();
                    
                    resolve(location);
                },
                (error) => {
                    reject(new Error(`定位失敗: ${error.message}`));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000
                }
            );
        });
    }
    
    addMarker(location, options = {}) {
        const marker = L.marker([location.lat, location.lng]);
        
        if (options.popup) {
            marker.bindPopup(options.popup);
        }
        
        if (options.icon) {
            const customIcon = L.icon({
                iconUrl: options.icon.url,
                iconSize: options.icon.size || [25, 41],
                iconAnchor: options.icon.anchor || [12, 41]
            });
            marker.setIcon(customIcon);
        }
        
        marker.addTo(this.map);
        this.markers.push(marker);
        
        return marker;
    }
    
    calculateDistance(point1, point2) {
        const lat1 = point1.lat;
        const lng1 = point1.lng;
        const lat2 = point2.lat;
        const lng2 = point2.lng;
        
        const R = 6371; // 地球半徑（公里）
        const dLat = this.toRadians(lat2 - lat1);
        const dLng = this.toRadians(lng2 - lng1);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        
        return {
            distance: {
                text: `${distance.toFixed(2)} 公里`,
                value: Math.round(distance * 1000) // 公尺
            }
        };
    }
    
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
    
    addCircle(center, radius, options = {}) {
        const circle = L.circle([center.lat, center.lng], {
            radius: radius,
            color: options.color || 'blue',
            fillColor: options.fillColor || 'blue',
            fillOpacity: options.fillOpacity || 0.2
        }).addTo(this.map);
        
        return circle;
    }
}
```

#### 2.1.3 高德地圖 API（不推薦使用）

> **注意**: 基於項目規劃，暫時不使用中國大陸地區的地圖服務

**優點**
- 中國大陸數據準確
- 本地化功能完善
- 費用相對較低
- 中文支援良好

**缺點**
- 僅限中國大陸
- 國際化支援有限
- 需要實名認證
- **項目限制**: 暫不採用中國大陸服務

**適用場景**
- ~~主要服務中國大陸~~（暫不適用）
- ~~需要本地化功能~~（暫不適用）
- ~~預算考量~~（暫不適用）

```javascript
// 高德地圖 API 整合示例
class AmapService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.map = null;
        this.geolocation = null;
    }
    
    async initializeMap(containerId, options = {}) {
        return new Promise((resolve, reject) => {
            AMap.load('AMap.Map,AMap.Geolocation,AMap.PlaceSearch', () => {
                const defaultOptions = {
                    center: [121.5654, 25.0330], // 台北
                    zoom: 13,
                    mapStyle: 'amap://styles/normal'
                };
                
                const mapOptions = { ...defaultOptions, ...options };
                
                this.map = new AMap.Map(containerId, mapOptions);
                
                // 初始化定位服務
                this.geolocation = new AMap.Geolocation({
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                    convert: true,
                    showButton: true,
                    buttonPosition: 'LB',
                    buttonOffset: new AMap.Pixel(10, 20),
                    showMarker: true,
                    showCircle: true,
                    panToLocation: true,
                    zoomToAccuracy: true
                });
                
                resolve(this.map);
            });
        });
    }
    
    async getCurrentLocation() {
        return new Promise((resolve, reject) => {
            this.geolocation.getCurrentPosition((status, result) => {
                if (status === 'complete') {
                    const location = {
                        lat: result.position.lat,
                        lng: result.position.lng,
                        accuracy: result.accuracy,
                        address: result.formattedAddress
                    };
                    resolve(location);
                } else {
                    reject(new Error(`定位失敗: ${result.message}`));
                }
            });
        });
    }
    
    addMarker(location, options = {}) {
        const marker = new AMap.Marker({
            position: [location.lng, location.lat],
            title: options.title || '',
            icon: options.icon || null
        });
        
        this.map.add(marker);
        
        if (options.infoWindow) {
            const infoWindow = new AMap.InfoWindow({
                content: options.infoWindow
            });
            
            marker.on('click', () => {
                infoWindow.open(this.map, marker.getPosition());
            });
        }
        
        return marker;
    }
    
    async searchNearbyPOI(location, keyword, radius = 1000) {
        return new Promise((resolve, reject) => {
            const placeSearch = new AMap.PlaceSearch({
                pageSize: 20,
                pageIndex: 1,
                city: '全國',
                map: this.map,
                panel: null
            });
            
            placeSearch.searchNearBy(keyword, [location.lng, location.lat], radius, (status, result) => {
                if (status === 'complete') {
                    resolve(result.poiList.pois);
                } else {
                    reject(new Error(`搜尋失敗: ${status}`));
                }
            });
        });
    }
}
```

### 2.2 位置服務架構

#### 2.2.1 位置數據管理服務

```javascript
// 位置數據管理服務
class LocationService {
    constructor() {
        this.db = require('../database/connection');
        this.redis = require('../cache/redis');
        this.mapService = new LeafletMapService(); // 可替換為其他地圖服務
    }
    
    async updateUserLocation(userId, location, options = {}) {
        try {
            // 驗證位置數據
            if (!this.isValidLocation(location)) {
                throw new Error('無效的位置數據');
            }
            
            // 檢查用戶隱私設定
            const privacySettings = await this.getUserPrivacySettings(userId);
            if (!privacySettings.allowLocationTracking) {
                throw new Error('用戶已禁用位置追蹤');
            }
            
            // 位置精確度處理
            const processedLocation = this.processLocationAccuracy(
                location, 
                privacySettings.locationAccuracy
            );
            
            // 更新資料庫
            const locationRecord = await db.userLocations.upsert({
                where: { userId },
                update: {
                    latitude: processedLocation.lat,
                    longitude: processedLocation.lng,
                    accuracy: processedLocation.accuracy,
                    address: options.address || null,
                    updatedAt: new Date()
                },
                create: {
                    userId,
                    latitude: processedLocation.lat,
                    longitude: processedLocation.lng,
                    accuracy: processedLocation.accuracy,
                    address: options.address || null,
                    isPublic: privacySettings.shareLocation,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });
            
            // 更新快取
            await this.updateLocationCache(userId, processedLocation);
            
            // 記錄位置歷史
            if (privacySettings.saveLocationHistory) {
                await this.saveLocationHistory(userId, processedLocation, options);
            }
            
            // 觸發位置相關事件
            await this.triggerLocationEvents(userId, processedLocation);
            
            return locationRecord;
            
        } catch (error) {
            console.error('更新用戶位置錯誤:', error);
            throw error;
        }
    }
    
    async findNearbyUsers(userId, radius = 5000, options = {}) {
        try {
            // 獲取用戶當前位置
            const userLocation = await this.getUserLocation(userId);
            if (!userLocation) {
                throw new Error('用戶位置不存在');
            }
            
            // 計算搜尋範圍
            const bounds = this.calculateBounds(userLocation, radius);
            
            // 搜尋附近用戶
            const nearbyUsers = await db.userLocations.findMany({
                where: {
                    userId: { not: userId },
                    isPublic: true,
                    latitude: {
                        gte: bounds.minLat,
                        lte: bounds.maxLat
                    },
                    longitude: {
                        gte: bounds.minLng,
                        lte: bounds.maxLng
                    },
                    updatedAt: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24小時內
                    }
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            avatar: true,
                            isOnline: true
                        }
                    }
                },
                take: options.limit || 50
            });
            
            // 計算距離並排序
            const usersWithDistance = nearbyUsers.map(userLoc => {
                const distance = this.calculateDistance(
                    userLocation,
                    { lat: userLoc.latitude, lng: userLoc.longitude }
                );
                
                return {
                    ...userLoc,
                    distance: distance.value,
                    distanceText: distance.text
                };
            }).filter(user => user.distance <= radius)
              .sort((a, b) => a.distance - b.distance);
            
            return usersWithDistance;
            
        } catch (error) {
            console.error('搜尋附近用戶錯誤:', error);
            throw error;
        }
    }
    
    async shareLocation(userId, targetUserId, duration = 3600) {
        try {
            // 檢查用戶關係
            const friendship = await db.friendships.findFirst({
                where: {
                    OR: [
                        { userId, friendId: targetUserId },
                        { userId: targetUserId, friendId: userId }
                    ],
                    status: 'accepted'
                }
            });
            
            if (!friendship) {
                throw new Error('只能與好友分享位置');
            }
            
            // 創建位置分享記錄
            const shareRecord = await db.locationShares.create({
                data: {
                    sharerId: userId,
                    receiverId: targetUserId,
                    expiresAt: new Date(Date.now() + duration * 1000),
                    isActive: true,
                    createdAt: new Date()
                }
            });
            
            // 發送通知
            await this.notificationService.sendLocationShareNotification(
                targetUserId,
                userId,
                shareRecord.id
            );
            
            return shareRecord;
            
        } catch (error) {
            console.error('分享位置錯誤:', error);
            throw error;
        }
    }
    
    async createGeofence(userId, name, center, radius, options = {}) {
        try {
            const geofence = await db.geofences.create({
                data: {
                    userId,
                    name,
                    centerLat: center.lat,
                    centerLng: center.lng,
                    radius,
                    isActive: true,
                    triggerOnEnter: options.triggerOnEnter || false,
                    triggerOnExit: options.triggerOnExit || false,
                    notificationMessage: options.notificationMessage || null,
                    createdAt: new Date()
                }
            });
            
            // 更新快取中的地理圍欄
            await this.updateGeofenceCache(userId);
            
            return geofence;
            
        } catch (error) {
            console.error('創建地理圍欄錯誤:', error);
            throw error;
        }
    }
    
    async checkGeofenceEvents(userId, location) {
        try {
            // 獲取用戶的地理圍欄
            const geofences = await this.getUserGeofences(userId);
            const events = [];
            
            for (const geofence of geofences) {
                const distance = this.calculateDistance(
                    location,
                    { lat: geofence.centerLat, lng: geofence.centerLng }
                );
                
                const isInside = distance.value <= geofence.radius;
                const wasInside = geofence.lastStatus === 'inside';
                
                if (isInside && !wasInside && geofence.triggerOnEnter) {
                    events.push({
                        type: 'enter',
                        geofence,
                        location
                    });
                } else if (!isInside && wasInside && geofence.triggerOnExit) {
                    events.push({
                        type: 'exit',
                        geofence,
                        location
                    });
                }
                
                // 更新圍欄狀態
                await db.geofences.update({
                    where: { id: geofence.id },
                    data: {
                        lastStatus: isInside ? 'inside' : 'outside',
                        lastTriggeredAt: events.length > 0 ? new Date() : geofence.lastTriggeredAt
                    }
                });
            }
            
            // 處理觸發事件
            for (const event of events) {
                await this.handleGeofenceEvent(userId, event);
            }
            
            return events;
            
        } catch (error) {
            console.error('檢查地理圍欄事件錯誤:', error);
            throw error;
        }
    }
    
    isValidLocation(location) {
        return location &&
               typeof location.lat === 'number' &&
               typeof location.lng === 'number' &&
               location.lat >= -90 && location.lat <= 90 &&
               location.lng >= -180 && location.lng <= 180;
    }
    
    processLocationAccuracy(location, accuracyLevel) {
        const accuracyMap = {
            'exact': 0,      // 精確位置
            'approximate': 0.01,  // 約1公里
            'city': 0.1,     // 約10公里
            'region': 1      // 約100公里
        };
        
        const noise = accuracyMap[accuracyLevel] || 0;
        
        if (noise === 0) {
            return location;
        }
        
        // 添加隨機偏移
        const latNoise = (Math.random() - 0.5) * noise;
        const lngNoise = (Math.random() - 0.5) * noise;
        
        return {
            lat: location.lat + latNoise,
            lng: location.lng + lngNoise,
            accuracy: location.accuracy
        };
    }
    
    calculateDistance(point1, point2) {
        const R = 6371000; // 地球半徑（公尺）
        const lat1Rad = point1.lat * Math.PI / 180;
        const lat2Rad = point2.lat * Math.PI / 180;
        const deltaLatRad = (point2.lat - point1.lat) * Math.PI / 180;
        const deltaLngRad = (point2.lng - point1.lng) * Math.PI / 180;
        
        const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
                  Math.cos(lat1Rad) * Math.cos(lat2Rad) *
                  Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        
        return {
            value: Math.round(distance),
            text: distance < 1000 
                ? `${Math.round(distance)} 公尺`
                : `${(distance / 1000).toFixed(1)} 公里`
        };
    }
    
    calculateBounds(center, radius) {
        const latDelta = radius / 111320; // 1度緯度約111320公尺
        const lngDelta = radius / (111320 * Math.cos(center.lat * Math.PI / 180));
        
        return {
            minLat: center.lat - latDelta,
            maxLat: center.lat + latDelta,
            minLng: center.lng - lngDelta,
            maxLng: center.lng + lngDelta
        };
    }
}
```

## 3. 資料庫設計

### 3.1 位置相關資料表

```sql
-- 用戶位置表
CREATE TABLE user_locations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy FLOAT,
    address TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 位置歷史記錄表
CREATE TABLE location_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy FLOAT,
    address TEXT,
    activity_type VARCHAR(50), -- walking, driving, stationary
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 位置分享表
CREATE TABLE location_shares (
    id SERIAL PRIMARY KEY,
    sharer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 地理圍欄表
CREATE TABLE geofences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    center_lat DECIMAL(10, 8) NOT NULL,
    center_lng DECIMAL(11, 8) NOT NULL,
    radius INTEGER NOT NULL, -- 半徑（公尺）
    is_active BOOLEAN DEFAULT true,
    trigger_on_enter BOOLEAN DEFAULT false,
    trigger_on_exit BOOLEAN DEFAULT false,
    notification_message TEXT,
    last_status VARCHAR(20), -- inside, outside
    last_triggered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 地理圍欄事件記錄表
CREATE TABLE geofence_events (
    id SERIAL PRIMARY KEY,
    geofence_id INTEGER NOT NULL REFERENCES geofences(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(20) NOT NULL, -- enter, exit
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用戶隱私設定表
CREATE TABLE user_privacy_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    allow_location_tracking BOOLEAN DEFAULT false,
    share_location BOOLEAN DEFAULT false,
    location_accuracy VARCHAR(20) DEFAULT 'approximate', -- exact, approximate, city, region
    save_location_history BOOLEAN DEFAULT false,
    auto_delete_history_days INTEGER DEFAULT 30,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 興趣點表
CREATE TABLE points_of_interest (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    address TEXT,
    description TEXT,
    rating DECIMAL(3, 2),
    phone VARCHAR(20),
    website VARCHAR(255),
    opening_hours JSONB,
    created_by INTEGER REFERENCES users(id),
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 簽到記錄表
CREATE TABLE check_ins (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    poi_id INTEGER REFERENCES points_of_interest(id),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    location_name VARCHAR(200),
    message TEXT,
    photo_url VARCHAR(255),
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_user_locations_user_id ON user_locations(user_id);
CREATE INDEX idx_user_locations_coordinates ON user_locations(latitude, longitude);
CREATE INDEX idx_user_locations_updated_at ON user_locations(updated_at);
CREATE INDEX idx_user_locations_public ON user_locations(is_public, updated_at);

CREATE INDEX idx_location_history_user_id ON location_history(user_id);
CREATE INDEX idx_location_history_created_at ON location_history(created_at);

CREATE INDEX idx_location_shares_sharer ON location_shares(sharer_id, is_active);
CREATE INDEX idx_location_shares_receiver ON location_shares(receiver_id, is_active);
CREATE INDEX idx_location_shares_expires ON location_shares(expires_at);

CREATE INDEX idx_geofences_user_id ON geofences(user_id);
CREATE INDEX idx_geofences_active ON geofences(is_active);
CREATE INDEX idx_geofences_coordinates ON geofences(center_lat, center_lng);

CREATE INDEX idx_geofence_events_geofence ON geofence_events(geofence_id);
CREATE INDEX idx_geofence_events_user ON geofence_events(user_id);
CREATE INDEX idx_geofence_events_created_at ON geofence_events(created_at);

CREATE INDEX idx_poi_coordinates ON points_of_interest(latitude, longitude);
CREATE INDEX idx_poi_category ON points_of_interest(category);
CREATE INDEX idx_poi_verified ON points_of_interest(is_verified);

CREATE INDEX idx_check_ins_user_id ON check_ins(user_id);
CREATE INDEX idx_check_ins_poi_id ON check_ins(poi_id);
CREATE INDEX idx_check_ins_created_at ON check_ins(created_at);
CREATE INDEX idx_check_ins_public ON check_ins(is_public, created_at);
```

## 4. 系統架構設計

### 4.1 地理位置服務架構圖

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   移動端應用    │    │   Web 應用      │    │   管理後台      │
│                 │    │                 │    │                 │
│ - GPS 定位      │    │ - 地圖顯示      │    │ - POI 管理      │
│ - 地圖導航      │    │ - 位置搜尋      │    │ - 數據分析      │
│ - 位置分享      │    │ - 附近用戶      │    │ - 隱私監控      │
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
                    │ - 位置權限檢查  │
                    └─────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   位置服務      │    │   地圖服務      │    │   通知服務      │
│                 │    │                 │    │                 │
│ - 位置更新      │    │ - 地圖渲染      │    │ - 位置通知      │
│ - 附近搜尋      │    │ - 路線規劃      │    │ - 圍欄告警      │
│ - 圍欄監控      │    │ - POI 搜尋      │    │ - 分享通知      │
│ - 隱私控制      │    │ - 距離計算      │    │ - 推播服務      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   資料層        │
                    │                 │
                    │ - PostgreSQL    │
                    │ - Redis 快取    │
                    │ - 地理索引      │
                    │ - 檔案儲存      │
                    └─────────────────┘
```

## 5. 實施計劃

### 5.1 第一階段：基礎位置服務（4-6週）

**核心功能**
- 用戶位置定位
- 基礎地圖顯示
- 附近用戶搜尋
- 隱私設定

**技術實現**
- OpenStreetMap + Leaflet
- PostgreSQL 地理數據
- 基礎位置 API
- 隱私控制機制

**交付成果**
- 用戶可定位並顯示在地圖上
- 可搜尋附近用戶
- 基本隱私保護
- 位置數據管理

### 5.2 第二階段：進階功能（3-4週）

**核心功能**
- 位置分享
- 地理圍欄
- 簽到功能
- 興趣點管理

**技術實現**
- 實時位置分享
- 圍欄監控系統
- POI 數據庫
- 通知系統整合

**交付成果**
- 好友間位置分享
- 地理圍欄告警
- 簽到與 POI 功能
- 位置相關通知

### 5.3 第三階段：優化完善（2-3週）

**核心功能**
- 位置歷史分析
- 路線規劃
- 性能優化
- 數據分析

**技術實現**
- 歷史軌跡分析
- 路線算法優化
- 快取策略優化
- 統計報表

**交付成果**
- 位置歷史功能
- 智能路線推薦
- 系統性能提升
- 詳細數據分析

## 6. 技術建議

### 6.1 推薦技術棧

**地圖服務**
- **主要選擇**: OpenStreetMap + Leaflet（免費、開源）
- **備選方案**: Google Maps API（功能豐富，但有費用）
- **注意**: 避免使用中國大陸地區的地圖服務（如高德地圖、百度地圖等）

**後端服務**
- **位置服務**: Node.js + Express
- **資料庫**: PostgreSQL + PostGIS 擴展
- **快取**: Redis（位置快取、會話管理）
- **隊列**: Bull Queue（地理圍欄處理）

**前端技術**
- **Web**: React + Leaflet.js
- **移動端**: React Native + react-native-maps
- **地圖組件**: 自建地圖組件庫

**部署與監控**
- **容器化**: Docker + Docker Compose
- **監控**: 自建位置服務監控
- **日誌**: 位置訪問日誌系統

### 6.2 成本估算

**開發成本**
- 第一階段：50-70 工時
- 第二階段：40-50 工時
- 第三階段：30-40 工時
- **總計**：120-160 工時

**運營成本（月）**
- 地圖服務：$0（OpenStreetMap）
- 伺服器：$100-200（地理計算需求較高）
- 儲存空間：$20-50（位置歷史數據）
- **總計**：$120-250/月

### 6.3 關鍵指標

**服務品質**
- 定位準確度：< 10公尺（GPS）
- 位置更新延遲：< 5秒
- 附近搜尋回應：< 2秒
- 地圖載入時間：< 3秒

**系統性能**
- 同時在線用戶：> 1000人
- 位置更新頻率：每30秒
- 資料庫查詢效率：< 100ms
- 系統可用性：> 99.5%

**隱私保護**
- 位置數據加密：100%
- 用戶同意率：> 80%
- 隱私設定使用率：> 60%
- 數據保留期限：可配置

## 7. 隱私與安全考量

### 7.1 隱私保護措施

**數據最小化**
- 只收集必要的位置數據
- 提供位置精確度選項
- 自動清理過期數據
- 匿名化歷史數據

**用戶控制**
- 明確的隱私設定界面
- 位置分享時間控制
- 隨時撤銷位置權限
- 數據下載與刪除

**技術保護**
- 位置數據加密存儲
- 傳輸過程 HTTPS 加密
- 訪問權限嚴格控制
- 定期安全審計

### 7.2 法規遵循

**GDPR 合規**
- 明確的數據收集同意
- 數據處理目的說明
- 用戶數據權利保障
- 數據保護影響評估

**本地法規**
- 遵循各地隱私法規
- 數據本地化存儲
- 政府數據請求處理
- 定期法規更新檢查

## 8. 風險評估與應對

### 8.1 技術風險

**風險**：地圖服務依賴性
**應對**：多地圖服務支援，可快速切換

**風險**：位置數據準確性
**應對**：多重定位方式，數據驗證機制

**風險**：大量位置更新影響性能
**應對**：智能更新頻率，快取優化

### 8.2 隱私風險

**風險**：位置數據洩露
**應對**：加密存儲，嚴格訪問控制

**風險**：用戶隱私擔憂
**應對**：透明的隱私政策，用戶教育

**風險**：法規變更影響
**應對**：靈活的隱私設定，快速適應能力

## 9. 未來擴展規劃

### 9.1 中期功能（6-12個月）

- **AR 地圖功能**：擴增實境位置體驗
- **智能推薦**：基於位置的個性化推薦
- **群組位置**：多人位置協調功能
- **離線地圖**：無網路環境地圖支援

### 9.2 長期功能（1-2年）

- **AI 路線優化**：機器學習路線推薦
- **IoT 設備整合**：智能設備位置服務
- **商業化功能**：位置廣告、商家服務
- **國際化擴展**：多國地圖服務整合

---

**備註**：此規劃以開源免費方案為主，確保成本控制的同時提供完整的地理位置服務功能。