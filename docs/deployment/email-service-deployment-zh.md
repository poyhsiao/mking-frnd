# 郵件服務部署指南

## 概述

本文檔說明如何在不同環境中配置和部署郵件服務，包括開發環境的 MailHog 和生產環境的免費 SMTP 服務。

## 開發環境配置

### MailHog 設置

開發環境使用 MailHog 作為郵件測試工具，它會捕獲所有發送的郵件而不實際發送到外部。

#### Docker Compose 配置

```yaml
mailhog:
  image: mailhog/mailhog:latest
  container_name: mking-mailhog
  ports:
    - "1025:1025"  # SMTP 服務端口
    - "8025:8025"  # Web 管理介面端口
  environment:
    MH_STORAGE: memory
    MH_MAILDIR_PATH: /tmp
  volumes:
    - mailhog_data:/tmp
  networks:
    - mking-network
  profiles:
    - development
  restart: unless-stopped
```

#### 環境變數配置

```bash
# 開發環境 SMTP 配置
SMTP_HOST=mailhog
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=noreply@mking.local
SMTP_FROM_NAME=MKing Friend
EMAIL_ENABLED=true
EMAIL_QUEUE_ENABLED=true
EMAIL_RATE_LIMIT=100
```

#### 使用方式

1. 啟動開發環境：
   ```bash
   docker-compose --profile development up -d
   ```

2. 訪問 MailHog Web 介面：
   - URL: http://localhost:8025
   - 查看所有捕獲的郵件
   - 測試郵件模板和內容

## 生產環境配置

### 推薦服務：MailerSend

根據郵件服務比較分析，推薦使用 MailerSend 作為生產環境的 SMTP 服務。

#### 優勢
- 每月 3,000 封免費郵件
- 99.3% 送達率
- 完整的分析和追蹤功能
- 良好的開發者文檔
- 支援 SMTP 和 API

#### 設置步驟

1. **註冊 MailerSend 帳戶**
   - 訪問 https://www.mailersend.com/
   - 註冊免費帳戶
   - 驗證域名（可選，但建議）

2. **獲取 SMTP 憑證**
   - 登入 MailerSend 控制台
   - 前往 Settings > SMTP
   - 記錄 SMTP 設置信息

3. **配置環境變數**
   ```bash
   # 生產環境 SMTP 配置
   SMTP_HOST=smtp.mailersend.net
   SMTP_PORT=587
   SMTP_SECURE=true
   SMTP_USER=your-mailersend-username
   SMTP_PASSWORD=your-mailersend-password
   SMTP_FROM_EMAIL=noreply@yourdomain.com
   SMTP_FROM_NAME=MKing Friend
   EMAIL_ENABLED=true
   EMAIL_QUEUE_ENABLED=true
   EMAIL_RATE_LIMIT=50  # 調整為適合的限制
   ```

4. **更新 Docker Compose**
   ```yaml
   backend:
     environment:
       SMTP_HOST: smtp.mailersend.net
       SMTP_PORT: 587
       SMTP_SECURE: true
       SMTP_USER: ${SMTP_USER}
       SMTP_PASSWORD: ${SMTP_PASSWORD}
       SMTP_FROM_EMAIL: ${SMTP_FROM_EMAIL}
       SMTP_FROM_NAME: ${SMTP_FROM_NAME}
   ```

### 替代方案

#### Brevo (前 Sendinblue)
- 每日 300 封免費郵件
- 99.22% 送達率
- 適合小型應用

```bash
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=true
```

#### SMTP2GO
- 每月 1,000 封免費郵件
- 99% 送達率
- 簡單易用

```bash
SMTP_HOST=mail.smtp2go.com
SMTP_PORT=587
SMTP_SECURE=true
```

## 部署流程

### 階段性部署策略

1. **階段 1：開發測試**
   - 使用 MailHog 進行本地開發
   - 測試所有郵件功能
   - 驗證郵件模板

2. **階段 2：預生產測試**
   - 配置免費 SMTP 服務
   - 使用測試域名
   - 小量真實郵件測試

3. **階段 3：生產部署**
   - 配置正式域名
   - 設置 SPF、DKIM 記錄
   - 監控送達率和錯誤

### 環境切換

#### 使用環境變數切換

```bash
# 開發環境
export NODE_ENV=development
export SMTP_HOST=mailhog

# 生產環境
export NODE_ENV=production
export SMTP_HOST=smtp.mailersend.net
```

#### 使用 Docker Profiles

```bash
# 開發環境
docker-compose --profile development up -d

# 生產環境
docker-compose --profile production up -d
```

## 監控和維護

### 郵件發送監控

1. **發送統計**
   - 監控每日/每月發送量
   - 追蹤送達率
   - 記錄失敗原因

2. **錯誤處理**
   - 設置重試機制
   - 記錄失敗郵件
   - 實施降級策略

3. **性能優化**
   - 使用郵件佇列
   - 批量發送
   - 限制發送頻率

### 安全考量

1. **憑證管理**
   - 使用環境變數存儲敏感信息
   - 定期輪換密碼
   - 限制 IP 訪問（如果支援）

2. **內容安全**
   - 驗證郵件內容
   - 防止垃圾郵件
   - 實施發送限制

## 故障排除

### 常見問題

1. **連接失敗**
   ```bash
   # 檢查網路連接
   telnet smtp.mailersend.net 587
   
   # 檢查 DNS 解析
   nslookup smtp.mailersend.net
   ```

2. **認證失敗**
   - 檢查用戶名和密碼
   - 確認帳戶狀態
   - 檢查 API 限制

3. **郵件被拒絕**
   - 檢查發送者域名
   - 設置 SPF 記錄
   - 配置 DKIM 簽名

### 日誌分析

```bash
# 查看郵件服務日誌
docker-compose logs backend | grep -i mail

# 查看 MailHog 日誌
docker-compose logs mailhog
```

## 成本分析

### 免費額度比較

| 服務 | 免費額度 | 送達率 | 特色功能 |
|------|----------|--------|----------|
| MailerSend | 3,000/月 | 99.3% | 完整分析 |
| Brevo | 300/日 | 99.22% | SMS 整合 |
| SMTP2GO | 1,000/月 | 99% | 簡單易用 |
| SendPulse | 12,000/月 | 98% | 多通道 |

### 成本預估

- **小型應用** (< 1,000 用戶)：免費額度足夠
- **中型應用** (1,000-10,000 用戶)：可能需要付費方案
- **大型應用** (> 10,000 用戶)：建議自建郵件服務器

## 總結

本部署指南提供了完整的郵件服務配置方案，從開發環境的 MailHog 到生產環境的免費 SMTP 服務。通過階段性部署和適當的監控，可以確保郵件服務的穩定性和可靠性。