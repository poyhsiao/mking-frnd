# MKing Friend - 搜尋服務技術比較

## 1. 功能概述

### 1.1 核心需求
- **中文分詞搜尋**: 支援繁體中文、簡體中文的精確分詞
- **地理位置查詢**: 基於地理座標的空間搜尋
- **全文搜尋**: 用戶資料、聊天記錄、社群內容搜尋
- **即時搜尋**: 低延遲的搜尋響應
- **模糊搜尋**: 容錯搜尋和自動完成
- **多欄位搜尋**: 跨多個資料欄位的複合查詢

### 1.2 技術要求
- **Self-hosted**: 優先考慮可自建的開源方案
- **免費使用**: 無授權費用的解決方案
- **高可用性**: 支援叢集部署和故障轉移
- **可擴展性**: 支援水平擴展
- **API 整合**: 提供 RESTful API 接口

## 2. 技術方案比較

### 2.1 Typesense (推薦)

#### 2.1.1 基本資訊
- **授權**: Apache 2.0 (7.x 版本後為 Elastic License)
- **語言**: Java
- **部署方式**: Docker, 原生安裝
- **記憶體需求**: 最少 2GB RAM

#### 2.1.2 中文分詞支援
**內建分詞器:**
- `ik_max_word`: 最細粒度分詞
- `ik_smart`: 智能分詞
- `standard`: 標準分詞器

**IK 分詞器配置範例:**
```json
{
  "settings": {
    "analysis": {
      "analyzer": {
        "ik_analyzer": {
          "type": "custom",
          "tokenizer": "ik_max_word",
          "filter": ["lowercase"]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "content": {
        "type": "text",
        "analyzer": "ik_analyzer",
        "search_analyzer": "ik_smart"
      }
    }
  }
}
```

#### 2.1.3 地理查詢支援
**地理資料類型:**
- `geo_point`: 經緯度點
- `geo_shape`: 複雜地理形狀

**地理查詢範例:**
```json
{
  "query": {
    "bool": {
      "must": {
        "match": {
          "content": "咖啡廳"
        }
      },
      "filter": {
        "geo_distance": {
          "distance": "5km",
          "location": {
            "lat": 25.0330,
            "lon": 121.5654
          }
        }
      }
    }
  }
}
```

#### 2.1.4 優缺點分析
**優點:**
- 功能最完整，生態系統豐富
- 中文分詞支援優秀 (IK 分詞器)
- 地理查詢功能強大
- 社群支援活躍
- 豐富的聚合分析功能
- Kibana 視覺化工具

**缺點:**
- 記憶體消耗較大
- 配置複雜度高
- 7.x 後授權變更 (Elastic License)
- 需要 Java 環境

#### 2.1.5 部署建議
```yaml
# docker-compose.yml
version: '3.8'
services:
  elasticsearch:
    image: elasticsearch:7.17.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms2g -Xmx2g"
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
    volumes:
      - es_data:/usr/share/elasticsearch/data
      - ./plugins:/usr/share/elasticsearch/plugins
    
volumes:
  es_data:
```

### 2.2 OpenSearch (推薦)

#### 2.2.1 基本資訊
- **授權**: Apache 2.0
- **語言**: Java
- **來源**: Elasticsearch 7.10.2 分支
- **維護**: AWS 主導的開源專案

#### 2.2.2 中文分詞支援
**分詞器選項:**
- IK 分詞器 (相容 Elasticsearch 版本)
- analysis-smartcn 插件
- 自定義分詞器

**配置範例:**
```json
{
  "settings": {
    "analysis": {
      "analyzer": {
        "chinese_analyzer": {
          "type": "custom",
          "tokenizer": "ik_max_word",
          "filter": ["lowercase", "stop"]
        }
      }
    }
  }
}
```

#### 2.2.3 地理查詢支援
- 完全相容 Elasticsearch 地理查詢 API
- 支援 geo_point 和 geo_shape
- 距離聚合和地理邊界查詢

#### 2.2.4 優缺點分析
**優點:**
- 完全開源 (Apache 2.0)
- 與 Elasticsearch 高度相容
- AWS 支援和維護
- 無授權限制
- 持續更新和改進

**缺點:**
- 相對較新的專案
- 社群規模較小
- 第三方插件支援有限

### 2.3 Apache Solr

#### 2.3.1 基本資訊
- **授權**: Apache 2.0
- **語言**: Java
- **特點**: 企業級搜尋平台
- **管理介面**: 內建 Web UI

#### 2.3.2 中文分詞支援
**分詞器選項:**
- SmartChineseAnalyzer
- IK 分詞器 (第三方)
- HanLP 分詞器

**配置範例:**
```xml
<fieldType name="text_zh" class="solr.TextField">
  <analyzer type="index">
    <tokenizer class="org.apache.lucene.analysis.cn.smart.SmartChineseSentenceTokenizerFactory"/>
    <filter class="org.apache.lucene.analysis.cn.smart.SmartChineseWordTokenFilterFactory"/>
    <filter class="solr.LowerCaseFilterFactory"/>
  </analyzer>
  <analyzer type="query">
    <tokenizer class="org.apache.lucene.analysis.cn.smart.SmartChineseSentenceTokenizerFactory"/>
    <filter class="org.apache.lucene.analysis.cn.smart.SmartChineseWordTokenFilterFactory"/>
    <filter class="solr.LowerCaseFilterFactory"/>
  </analyzer>
</fieldType>
```

#### 2.3.3 地理查詢支援
**地理欄位類型:**
- `location`: 經緯度點
- `location_rpt`: 遞歸前綴樹

**查詢範例:**
```
q=*:*&fq={!geofilt pt=25.0330,121.5654 sfield=location d=5}
```

#### 2.3.4 優缺點分析
**優點:**
- 完全開源
- 企業級功能完整
- 內建管理介面
- 文檔豐富
- 穩定性高

**缺點:**
- 學習曲線陡峭
- 配置複雜
- 中文分詞支援不如 Elasticsearch
- 社群活躍度較低

### 2.4 MeiliSearch

#### 2.4.1 基本資訊
- **授權**: MIT
- **語言**: Rust
- **特點**: 輕量級、即時搜尋
- **部署**: 單一執行檔

#### 2.4.2 中文分詞支援
**分詞方式:**
- 內建 Unicode 分詞
- 支援 CJK (中日韓) 字符
- 可配置自定義分詞規則

**配置範例:**
```json
{
  "searchableAttributes": ["title", "content"],
  "stopWords": ["的", "了", "在", "是"],
  "synonyms": {
    "台北": ["臺北", "Taipei"]
  }
}
```

#### 2.4.3 地理查詢支援
**限制:**
- 目前不支援原生地理查詢
- 需要透過過濾器實現簡單地理搜尋
- 適合簡單的地理範圍查詢

#### 2.4.4 優缺點分析
**優點:**
- 部署極其簡單
- 記憶體使用量低
- 搜尋速度快
- API 設計友善
- 即時索引更新

**缺點:**
- 功能相對簡單
- 地理查詢支援有限
- 中文分詞不如專業方案
- 聚合分析功能缺乏

### 2.5 PostgreSQL 全文搜尋

#### 2.5.1 基本資訊
- **授權**: PostgreSQL License
- **特點**: 資料庫內建搜尋
- **優勢**: 與現有資料庫整合

#### 2.5.2 中文分詞支援
**分詞器選項:**
- zhparser 擴展 (基於 SCWS)
- pg_jieba 擴展
- 自定義分詞函數

**安裝和配置:**
```sql
-- 安裝 zhparser
CREATE EXTENSION zhparser;

-- 創建中文配置
CREATE TEXT SEARCH CONFIGURATION chinese (PARSER = zhparser);
ALTER TEXT SEARCH CONFIGURATION chinese ADD MAPPING FOR n,v,a,i,e,l WITH simple;

-- 創建全文搜尋索引
CREATE INDEX idx_content_fts ON posts 
USING gin(to_tsvector('chinese', content));
```

#### 2.5.3 地理查詢支援
**PostGIS 整合:**
```sql
-- 地理和全文搜尋結合
SELECT p.*, 
       ST_Distance(p.location, ST_Point(121.5654, 25.0330)) as distance
FROM posts p
WHERE to_tsvector('chinese', p.content) @@ plainto_tsquery('chinese', '咖啡廳')
  AND ST_DWithin(p.location, ST_Point(121.5654, 25.0330), 5000)
ORDER BY distance;
```

#### 2.5.4 優缺點分析
**優點:**
- 與資料庫完全整合
- 無需額外服務
- 支援複雜 SQL 查詢
- 事務一致性

**缺點:**
- 功能相對有限
- 性能不如專用搜尋引擎
- 中文分詞效果一般
- 缺乏高級搜尋功能

### 2.6 Typesense

#### 2.6.1 基本資訊
- **授權**: GPL v3
- **語言**: C++
- **特點**: 開源的即時搜尋引擎
- **部署方式**: Docker, 原生安裝, 雲端服務
- **記憶體需求**: 最少 1GB RAM

#### 2.6.2 中文分詞支援
**分詞方式:**
- 內建 Unicode 分詞支援
- 支援 CJK (中日韓) 字符處理
- 可配置自定義分詞規則
- 支援同義詞和停用詞

**配置範例:**
```json
{
  "name": "users",
  "fields": [
    {
      "name": "nickname",
      "type": "string",
      "locale": "zh"
    },
    {
      "name": "bio",
      "type": "string",
      "locale": "zh"
    },
    {
      "name": "location",
      "type": "geopoint"
    }
  ],
  "default_sorting_field": "created_at",
  "token_separators": ["+", "-", "_"],
  "symbols_to_index": ["@", "#"]
}
```

#### 2.6.3 地理查詢支援
**地理資料類型:**
- `geopoint`: 經緯度點 (格式: [lat, lon])
- 支援地理半徑搜尋
- 支援地理邊界框查詢

**地理查詢範例:**
```bash
# 半徑搜尋
curl "http://localhost:8108/collections/users/documents/search" \
  -X GET \
  -H "X-TYPESENSE-API-KEY: xyz" \
  -G \
  --data-urlencode "q=咖啡廳" \
  --data-urlencode "query_by=nickname,bio" \
  --data-urlencode "filter_by=location:(25.0330, 121.5654, 5 km)"

# 邊界框查詢
curl "http://localhost:8108/collections/users/documents/search" \
  -X GET \
  -H "X-TYPESENSE-API-KEY: xyz" \
  -G \
  --data-urlencode "q=*" \
  --data-urlencode "filter_by=location:(24.9, 121.4, 25.1, 121.7)"
```

#### 2.6.4 優缺點分析
**優點:**
- 部署和配置極其簡單
- 搜尋速度非常快 (亞毫秒級)
- 記憶體使用效率高
- 內建容錯搜尋 (typo tolerance)
- RESTful API 設計友善
- 即時索引更新
- 支援面向搜尋 (faceted search)
- 內建搜尋分析和指標
- 良好的中文字符支援

**缺點:**
- 相對較新的專案 (2019年開源)
- 社群規模較小
- 中文分詞不如 IK 分詞器精確
- 聚合分析功能有限
- 缺乏複雜的查詢語法
- GPL 授權可能限制商業使用

#### 2.6.5 部署建議
```yaml
# docker-compose.yml
version: '3.8'
services:
  typesense:
    image: typesense/typesense:0.25.2
    ports:
      - "8108:8108"
    volumes:
      - typesense_data:/data
    environment:
      - TYPESENSE_DATA_DIR=/data
      - TYPESENSE_API_KEY=your-api-key-here
      - TYPESENSE_ENABLE_CORS=true
    command: '--data-dir /data --api-key=your-api-key-here --listen-port 8108 --enable-cors'
    restart: unless-stopped

volumes:
  typesense_data:
```

## 3. 技術方案比較表

| 特性 | Elasticsearch | OpenSearch | Solr | MeiliSearch | PostgreSQL | Typesense |
|------|---------------|------------|------|-------------|------------|----------|
| **授權** | Elastic License | Apache 2.0 | Apache 2.0 | MIT | PostgreSQL | GPL v3 |
| **中文分詞** | ★★★★★ | ★★★★★ | ★★★☆☆ | ★★☆☆☆ | ★★☆☆☆ | ★★★☆☆ |
| **地理查詢** | ★★★★★ | ★★★★★ | ★★★★☆ | ★☆☆☆☆ | ★★★★☆ | ★★★★☆ |
| **部署難度** | ★★☆☆☆ | ★★☆☆☆ | ★★☆☆☆ | ★★★★★ | ★★★★☆ | ★★★★★ |
| **記憶體使用** | ★★☆☆☆ | ★★☆☆☆ | ★★☆☆☆ | ★★★★☆ | ★★★★☆ | ★★★★★ |
| **搜尋性能** | ★★★★★ | ★★★★★ | ★★★★☆ | ★★★★☆ | ★★★☆☆ | ★★★★★ |
| **功能豐富度** | ★★★★★ | ★★★★★ | ★★★★☆ | ★★☆☆☆ | ★★☆☆☆ | ★★★☆☆ |
| **社群支援** | ★★★★★ | ★★★☆☆ | ★★★☆☆ | ★★★☆☆ | ★★★★☆ | ★★☆☆☆ |
| **學習曲線** | ★★☆☆☆ | ★★☆☆☆ | ★★☆☆☆ | ★★★★☆ | ★★★☆☆ | ★★★★★ |

## 4. 推薦方案

### 4.1 主要推薦：Typesense

**選擇理由:**
- 部署極其簡單，單一執行檔
- 搜尋速度極快 (亞毫秒級響應)
- 記憶體使用效率高
- 內建容錯搜尋和自動完成
- API 設計友善，學習曲線平緩
- 良好的地理查詢支援
- 適合快速開發和部署

**適用場景:**
- 需要極快搜尋響應的應用
- 中小型到中型資料量
- 重視用戶體驗的即時搜尋
- 資源有限但需要高性能的環境
- 快速原型開發和 MVP
- MKing Friend 這類社交應用的搜尋需求

**注意事項:**
- GPL v3 授權可能限制商業使用
- 中文分詞效果不如 OpenSearch
- 社群相對較小

### 4.2 企業級備選：OpenSearch

**選擇理由:**
- 完全開源，無授權限制
- 與 Elasticsearch 高度相容
- 優秀的中文分詞支援
- 強大的地理查詢功能
- AWS 支援保證長期維護
- 豐富的聚合分析功能

**適用場景:**
- 需要複雜搜尋功能的應用
- 大量資料的全文搜尋
- 需要高精度中文分詞的應用
- 需要聚合分析功能
- 企業級部署需求

### 4.3 輕量級方案：MeiliSearch

**選擇理由:**
- 部署和維護極其簡單
- 資源消耗低
- 適合中小型應用
- 即時搜尋體驗優秀

**適用場景:**
- 簡單的全文搜尋需求
- 資源有限的環境
- 快速原型開發
- 對地理查詢要求不高

### 4.4 特殊場景：PostgreSQL

**選擇理由:**
- 與現有資料庫整合
- 無需額外服務
- 適合簡單搜尋需求

**適用場景:**
- 搜尋需求相對簡單
- 希望減少系統複雜度
- 資料量不大的應用

## 5. 搜尋 API 設計建議

### 5.1 RESTful API 設計

#### 5.1.1 用戶搜尋 API
```http
GET /v1/search/users?q={query}&location={lat,lon}&radius={distance}&page={page}&limit={limit}
```

**參數說明:**
- `q`: 搜尋關鍵字 (支援中文分詞)
- `location`: 地理位置 (格式: "緯度,經度")
- `radius`: 搜尋半徑 (預設: 5km)
- `page`: 頁碼 (預設: 1)
- `limit`: 每頁數量 (預設: 20)

**回應範例:**
```json
{
  "success": true,
  "data": [
    {
      "id": "user123",
      "nickname": "張小明",
      "bio": "喜歡旅行和攝影",
      "location": {
        "lat": 25.0330,
        "lon": 121.5654,
        "distance": 1.2
      },
      "avatar": "https://example.com/avatar.jpg",
      "interests": ["旅行", "攝影", "美食"],
      "lastActive": "2024-01-01T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8
  },
  "meta": {
    "searchTime": 45,
    "query": "攝影",
    "location": "25.0330,121.5654",
    "radius": "5km"
  }
}
```

#### 5.1.2 內容搜尋 API
```http
GET /v1/search/posts?q={query}&category={category}&tags={tags}&location={lat,lon}&radius={distance}
```

**回應範例:**
```json
{
  "success": true,
  "data": [
    {
      "id": "post456",
      "title": "台北最佳咖啡廳推薦",
      "content": "今天發現一家很棒的咖啡廳...",
      "author": {
        "id": "user123",
        "nickname": "咖啡愛好者"
      },
      "location": {
        "lat": 25.0330,
        "lon": 121.5654,
        "address": "台北市信義區"
      },
      "tags": ["咖啡", "台北", "推薦"],
      "createdAt": "2024-01-01T10:00:00Z",
      "highlights": {
        "title": ["台北最佳<em>咖啡廳</em>推薦"],
        "content": ["今天發現一家很棒的<em>咖啡廳</em>..."]
      }
    }
  ]
}
```

#### 5.1.3 自動完成 API
```http
GET /v1/search/autocomplete?q={partial_query}&type={user|post|location}
```

**回應範例:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "text": "咖啡廳推薦",
        "type": "keyword",
        "count": 156
      },
      {
        "text": "咖啡豆烘焙",
        "type": "keyword",
        "count": 89
      }
    ],
    "users": [
      {
        "id": "user123",
        "nickname": "咖啡達人",
        "avatar": "https://example.com/avatar.jpg"
      }
    ],
    "locations": [
      {
        "name": "咖啡街",
        "address": "台北市大安區咖啡街",
        "lat": 25.0330,
        "lon": 121.5654
      }
    ]
  }
}
```

### 5.2 搜尋參數標準化

#### 5.2.1 通用參數
- `q`: 搜尋查詢字串
- `page`: 頁碼 (從 1 開始)
- `limit`: 每頁結果數量 (最大 100)
- `sort`: 排序方式 (`relevance`, `date`, `distance`)
- `order`: 排序順序 (`asc`, `desc`)

#### 5.2.2 地理參數
- `location`: 中心點座標 (格式: "lat,lon")
- `radius`: 搜尋半徑 (支援單位: km, m)
- `bounds`: 邊界框 (格式: "sw_lat,sw_lon,ne_lat,ne_lon")

#### 5.2.3 過濾參數
- `category`: 內容分類
- `tags`: 標籤列表 (逗號分隔)
- `date_from`: 開始日期
- `date_to`: 結束日期
- `user_id`: 特定用戶 ID

## 6. 實施建議

### 6.1 Typesense 部署方案 (主要推薦)

#### 6.1.1 Docker Compose 配置
```yaml
version: '3.8'
services:
  typesense:
    image: typesense/typesense:0.25.2
    ports:
      - "8108:8108"
    volumes:
      - typesense_data:/data
    environment:
      - TYPESENSE_DATA_DIR=/data
      - TYPESENSE_API_KEY=${TYPESENSE_API_KEY}
      - TYPESENSE_ENABLE_CORS=true
    command: '--data-dir /data --api-key=${TYPESENSE_API_KEY} --listen-port 8108 --enable-cors'
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8108/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  typesense_data:
```

#### 6.1.2 集合 (Collection) 配置
```json
{
  "name": "mking_users",
  "fields": [
    {
      "name": "id",
      "type": "string"
    },
    {
      "name": "nickname",
      "type": "string",
      "locale": "zh"
    },
    {
      "name": "bio",
      "type": "string",
      "locale": "zh",
      "optional": true
    },
    {
      "name": "interests",
      "type": "string[]",
      "locale": "zh"
    },
    {
      "name": "location",
      "type": "geopoint",
      "optional": true
    },
    {
      "name": "created_at",
      "type": "int64"
    },
    {
      "name": "last_active",
      "type": "int64"
    }
  ],
  "default_sorting_field": "last_active",
  "token_separators": ["+", "-", "_"],
  "symbols_to_index": ["@", "#"]
}
```

#### 6.1.3 搜尋查詢範例
```javascript
// 用戶搜尋
const searchUsers = async (query, location = null, radius = '5km') => {
  const searchParams = {
    q: query,
    query_by: 'nickname,bio,interests',
    sort_by: '_text_match:desc,last_active:desc',
    per_page: 20,
    page: 1
  };

  // 添加地理過濾
  if (location) {
    searchParams.filter_by = `location:(${location.lat}, ${location.lon}, ${radius})`;
  }

  const response = await typesenseClient
    .collections('mking_users')
    .documents()
    .search(searchParams);

  return response;
};
```

### 6.2 OpenSearch 部署方案 (企業級備選)

#### 6.2.1 Docker Compose 配置
```yaml
version: '3.8'
services:
  opensearch:
    image: opensearchproject/opensearch:2.11.0
    environment:
      - cluster.name=mking-friend-search
      - node.name=opensearch-node1
      - discovery.type=single-node
      - "OPENSEARCH_JAVA_OPTS=-Xms2g -Xmx2g"
      - plugins.security.disabled=true
    ports:
      - "9200:9200"
      - "9600:9600"
    volumes:
      - opensearch_data:/usr/share/opensearch/data
      - ./opensearch/plugins:/usr/share/opensearch/plugins
    ulimits:
      memlock:
        soft: -1
        hard: -1
      nofile:
        soft: 65536
        hard: 65536

  opensearch-dashboards:
    image: opensearchproject/opensearch-dashboards:2.11.0
    ports:
      - "5601:5601"
    environment:
      - 'OPENSEARCH_HOSTS=["http://opensearch:9200"]'
      - plugins.security.disabled=true
    depends_on:
      - opensearch

volumes:
  opensearch_data:
```

#### 6.2.2 IK 分詞器安裝
```bash
# 下載 IK 分詞器
wget https://github.com/medcl/elasticsearch-analysis-ik/releases/download/v7.17.0/elasticsearch-analysis-ik-7.17.0.zip

# 解壓到 plugins 目錄
unzip elasticsearch-analysis-ik-7.17.0.zip -d ./opensearch/plugins/ik/

# 重啟 OpenSearch
docker-compose restart opensearch
```

#### 6.2.3 索引模板配置
```json
{
  "index_patterns": ["mking-*"],
  "template": {
    "settings": {
      "number_of_shards": 1,
      "number_of_replicas": 0,
      "analysis": {
        "analyzer": {
          "chinese_analyzer": {
            "type": "custom",
            "tokenizer": "ik_max_word",
            "filter": ["lowercase", "stop"]
          },
          "chinese_search_analyzer": {
            "type": "custom",
            "tokenizer": "ik_smart",
            "filter": ["lowercase", "stop"]
          }
        }
      }
    },
    "mappings": {
      "properties": {
        "content": {
          "type": "text",
          "analyzer": "chinese_analyzer",
          "search_analyzer": "chinese_search_analyzer"
        },
        "title": {
          "type": "text",
          "analyzer": "chinese_analyzer",
          "search_analyzer": "chinese_search_analyzer"
        },
        "location": {
          "type": "geo_point"
        },
        "created_at": {
          "type": "date"
        }
      }
    }
  }
}
```

### 6.3 應用程式整合

#### 6.3.1 Typesense Node.js 客戶端 (主要推薦)
```javascript
const Typesense = require('typesense');

class TypesenseSearchService {
  constructor() {
    this.client = new Typesense.Client({
      nodes: [{
        host: process.env.TYPESENSE_HOST || 'localhost',
        port: process.env.TYPESENSE_PORT || '8108',
        protocol: process.env.TYPESENSE_PROTOCOL || 'http'
      }],
      apiKey: process.env.TYPESENSE_API_KEY,
      connectionTimeoutSeconds: 2
    });
  }

  async searchUsers(query, location = null, radius = '5km', page = 1, limit = 20) {
    const searchParams = {
      q: query || '*',
      query_by: 'nickname,bio,interests',
      sort_by: '_text_match:desc,last_active:desc',
      per_page: limit,
      page: page,
      highlight_full_fields: 'nickname,bio',
      typo_tokens_threshold: 1,
      drop_tokens_threshold: 1
    };

    // 添加地理過濾
    if (location && location.lat && location.lon) {
      searchParams.filter_by = `location:(${location.lat}, ${location.lon}, ${radius})`;
    }

    try {
      const response = await this.client
        .collections('mking_users')
        .documents()
        .search(searchParams);
      
      return {
        hits: response.hits,
        found: response.found,
        page: response.page,
        search_time_ms: response.search_time_ms
      };
    } catch (error) {
      console.error('Typesense search error:', error);
      throw error;
    }
  }

  async searchPosts(query, location = null, radius = '10km', category = null) {
    const searchParams = {
      q: query || '*',
      query_by: 'title,content,tags',
      sort_by: '_text_match:desc,created_at:desc',
      per_page: 20,
      highlight_full_fields: 'title,content'
    };

    // 構建過濾條件
    const filters = [];
    if (location && location.lat && location.lon) {
      filters.push(`location:(${location.lat}, ${location.lon}, ${radius})`);
    }
    if (category) {
      filters.push(`category:=${category}`);
    }
    
    if (filters.length > 0) {
      searchParams.filter_by = filters.join(' && ');
    }

    const response = await this.client
      .collections('mking_posts')
      .documents()
      .search(searchParams);

    return response;
  }

  async indexUser(user) {
    const document = {
      id: user.id,
      nickname: user.nickname,
      bio: user.bio || '',
      interests: user.interests || [],
      location: user.location ? [user.location.latitude, user.location.longitude] : null,
      created_at: Math.floor(new Date(user.created_at).getTime() / 1000),
      last_active: Math.floor(new Date(user.last_active || user.created_at).getTime() / 1000)
    };

    await this.client
      .collections('mking_users')
      .documents()
      .upsert(document);
  }

  async autocomplete(query, collections = ['mking_users', 'mking_posts']) {
    const suggestions = [];
    
    for (const collection of collections) {
      try {
        const response = await this.client
          .collections(collection)
          .documents()
          .search({
            q: query,
            query_by: collection === 'mking_users' ? 'nickname,bio' : 'title,content',
            per_page: 5,
            prefix: true
          });
        
        suggestions.push({
          collection,
          results: response.hits
        });
      } catch (error) {
        console.error(`Autocomplete error for ${collection}:`, error);
      }
    }
    
    return suggestions;
  }
}

module.exports = TypesenseSearchService;
```

#### 6.3.2 OpenSearch Node.js 客戶端 (備選方案)
```javascript
const { Client } = require('@opensearch-project/opensearch');

class OpenSearchService {
  constructor() {
    this.client = new Client({
      node: process.env.OPENSEARCH_URL || 'http://localhost:9200'
    });
  }

  async searchUsers(query, location = null, radius = '5km') {
    const searchBody = {
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query: query,
                fields: ['nickname^2', 'bio', 'interests'],
                type: 'best_fields',
                fuzziness: 'AUTO'
              }
            }
          ]
        }
      },
      highlight: {
        fields: {
          nickname: {},
          bio: {},
          interests: {}
        }
      }
    };

    // 添加地理過濾
    if (location) {
      searchBody.query.bool.filter = {
        geo_distance: {
          distance: radius,
          location: location
        }
      };
    }

    const response = await this.client.search({
      index: 'mking-users',
      body: searchBody
    });

    return response.body.hits;
  }

  async searchPosts(query, location = null, radius = '10km') {
    const searchBody = {
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query: query,
                fields: ['title^3', 'content^2', 'tags'],
                type: 'best_fields'
              }
            }
          ]
        }
      },
      sort: [
        { _score: { order: 'desc' } },
        { created_at: { order: 'desc' } }
      ]
    };

    if (location) {
      searchBody.query.bool.filter = {
        geo_distance: {
          distance: radius,
          location: location
        }
      };
    }

    const response = await this.client.search({
      index: 'mking-posts',
      body: searchBody
    });

    return response.body.hits;
  }

  async indexUser(user) {
    await this.client.index({
      index: 'mking-users',
      id: user.id,
      body: {
        nickname: user.nickname,
        bio: user.bio,
        interests: user.interests,
        location: user.location ? {
          lat: user.location.latitude,
          lon: user.location.longitude
        } : null,
        created_at: user.created_at
      }
    });
  }
}

module.exports = SearchService;
```

### 6.4 監控和維護

#### 6.4.1 Typesense 健康檢查 (主要推薦)
```bash
#!/bin/bash
# typesense-health-check.sh

TYPESENSE_URL="http://localhost:8108"
API_KEY="your-api-key-here"

# 檢查 Typesense 健康狀態
HEALTH=$(curl -s -H "X-TYPESENSE-API-KEY: $API_KEY" "$TYPESENSE_URL/health")

if echo "$HEALTH" | grep -q '"ok":true'; then
    echo "Typesense 服務狀態正常"
    exit 0
else
    echo "警告: Typesense 服務異常"
    echo "回應: $HEALTH"
    exit 1
fi

# 檢查集合狀態
COLLECTIONS=$(curl -s -H "X-TYPESENSE-API-KEY: $API_KEY" "$TYPESENSE_URL/collections")
echo "集合狀態: $COLLECTIONS"

# 檢查記憶體使用
STATS=$(curl -s -H "X-TYPESENSE-API-KEY: $API_KEY" "$TYPESENSE_URL/stats.json")
echo "統計資訊: $STATS"
```

#### 6.4.2 OpenSearch 健康檢查 (備選方案)
```bash
#!/bin/bash
# opensearch-health-check.sh

OPENSEARCH_URL="http://localhost:9200"

# 檢查叢集健康狀態
HEALTH=$(curl -s "$OPENSEARCH_URL/_cluster/health" | jq -r '.status')

if [ "$HEALTH" = "green" ]; then
    echo "OpenSearch 叢集狀態正常"
    exit 0
elif [ "$HEALTH" = "yellow" ]; then
    echo "警告: OpenSearch 叢集狀態為黃色"
    exit 1
else
    echo "錯誤: OpenSearch 叢集狀態為紅色或無法連接"
    exit 2
fi
```

#### 6.3.2 索引維護
```bash
#!/bin/bash
# index-maintenance.sh

OPENSEARCH_URL="http://localhost:9200"

# 強制合併索引
curl -X POST "$OPENSEARCH_URL/mking-*/_forcemerge?max_num_segments=1"

# 清理舊索引 (保留 30 天)
DATE_30_DAYS_AGO=$(date -d '30 days ago' +%Y.%m.%d)
curl -X DELETE "$OPENSEARCH_URL/mking-logs-*" -H 'Content-Type: application/json' -d'
{
  "query": {
    "range": {
      "@timestamp": {
        "lt": "'$DATE_30_DAYS_AGO'"
      }
    }
  }
}'
```

## 7. 成本分析

### 7.1 硬體需求

| 方案 | CPU | 記憶體 | 儲存 | 月成本估算 |
|------|-----|--------|------|------------|
| OpenSearch (小型) | 2 核心 | 4GB | 50GB SSD | $30-50 |
| OpenSearch (中型) | 4 核心 | 8GB | 100GB SSD | $60-100 |
| Typesense (小型) | 1 核心 | 1GB | 20GB SSD | $10-20 |
| Typesense (中型) | 2 核心 | 2GB | 50GB SSD | $20-35 |
| MeiliSearch | 1 核心 | 2GB | 20GB SSD | $15-25 |
| PostgreSQL FTS | 2 核心 | 4GB | 50GB SSD | $30-50 |

### 7.2 維護成本
- **OpenSearch**: 需要專業知識，維護成本較高
- **Typesense**: 維護極其簡單，成本很低
- **MeiliSearch**: 維護簡單，成本低
- **PostgreSQL**: 與現有資料庫整合，維護成本中等

## 8. 結論

基於 MKing Friend 的需求分析，提供以下分層推薦：

### 8.1 主要推薦：Typesense
**推薦使用 Typesense** 作為主要搜尋解決方案：

1. **部署簡單**: 單一執行檔，配置極其簡單
2. **性能卓越**: 亞毫秒級搜尋響應，完美符合即時搜尋需求
3. **資源效率**: 記憶體使用量低，成本控制佳
4. **用戶體驗**: 內建容錯搜尋和即時回應
5. **地理支援**: 良好的地理查詢功能，滿足位置相關搜尋
6. **開發效率**: API 設計友善，學習曲線平緩

**注意**: GPL v3 授權需要評估商業使用限制

### 8.2 企業級替代：OpenSearch
對於需要**複雜功能和大規模數據處理**的場景，**OpenSearch** 是優秀的選擇：

1. **完全開源**: 無授權限制，符合專案理念
2. **中文支援優秀**: IK 分詞器提供最佳中文搜尋體驗
3. **地理查詢強大**: 滿足複雜位置相關搜尋需求
4. **功能完整**: 支援複雜查詢和聚合分析
5. **長期維護**: AWS 支援保證專案持續發展

### 8.3 輕量級方案：MeiliSearch
對於資源有限或需求簡單的場景，可以考慮 **MeiliSearch** 作為輕量級替代方案。

### 8.4 實施建議
1. **首選方案**: 直接採用 **Typesense** 作為主要搜尋引擎
2. **備用方案**: 如遇到 GPL v3 授權限制，則選擇 **OpenSearch**
3. **簡化方案**: 資源極度有限時，可暫時使用 **MeiliSearch**

**最終建議**: 對於 MKing Friend 專案，**強烈推薦採用 Typesense 作為主要搜尋引擎**。它提供了性能、易用性、開發效率和用戶體驗的最佳平衡，完全符合現代社交應用的搜尋需求。