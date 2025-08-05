# MKing Friend - 國際化與本地化規劃

## 1. 功能概述

### 1.1 目標市場
- **主要市場**: 台灣（繁體中文）
- **次要市場**: 中國大陸（簡體中文）、香港、澳門
- **國際市場**: 英語地區（美國、加拿大、澳洲、英國）
- **潛在市場**: 東南亞華語社群

### 1.2 支援語言
- **繁體中文 (zh-TW)** - 主要語言
- **簡體中文 (zh-CN)** - 次要語言
- **英文 (en-US)** - 國際語言

### 1.3 本地化需求
- **語言翻譯**: 界面文字、錯誤訊息、通知
- **日期時間**: 格式、時區處理
- **數字格式**: 貨幣、百分比、小數點
- **文化適應**: 顏色、圖標、排版
- **法規遵循**: 各地隱私法規、內容規範
- **支付方式**: 本地化支付選項

## 2. 技術方案比較

### 2.1 國際化框架

#### 2.1.1 前端國際化

**React i18next (推薦)**
```typescript
// i18n 配置
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    lng: 'zh-TW', // 預設語言
    fallbackLng: 'zh-TW',
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false, // React 已經處理 XSS
    },
    
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    
    resources: {
      'zh-TW': {
        common: {
          welcome: '歡迎來到 MKing Friend',
          login: '登入',
          register: '註冊',
          profile: '個人檔案',
          settings: '設定',
          logout: '登出'
        },
        validation: {
          required: '此欄位為必填',
          email: '請輸入有效的電子郵件地址',
          password: '密碼至少需要 8 個字元'
        }
      },
      'zh-CN': {
        common: {
          welcome: '欢迎来到 MKing Friend',
          login: '登录',
          register: '注册',
          profile: '个人资料',
          settings: '设置',
          logout: '登出'
        },
        validation: {
          required: '此字段为必填',
          email: '请输入有效的电子邮件地址',
          password: '密码至少需要 8 个字符'
        }
      },
      'en-US': {
        common: {
          welcome: 'Welcome to MKing Friend',
          login: 'Login',
          register: 'Register',
          profile: 'Profile',
          settings: 'Settings',
          logout: 'Logout'
        },
        validation: {
          required: 'This field is required',
          email: 'Please enter a valid email address',
          password: 'Password must be at least 8 characters'
        }
      }
    }
  });

export default i18n;
```

**React 組件使用範例**
```typescript
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';

interface LoginFormProps {
  onSubmit: (data: LoginData) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSubmit }) => {
  const { t } = useTranslation(['common', 'validation']);
  const { register, handleSubmit, formState: { errors } } = useForm();
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h1>{t('common:welcome')}</h1>
      
      <div className="form-group">
        <label>{t('common:email')}</label>
        <input
          type="email"
          {...register('email', {
            required: t('validation:required'),
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: t('validation:email')
            }
          })}
        />
        {errors.email && <span className="error">{errors.email.message}</span>}
      </div>
      
      <div className="form-group">
        <label>{t('common:password')}</label>
        <input
          type="password"
          {...register('password', {
            required: t('validation:required'),
            minLength: {
              value: 8,
              message: t('validation:password')
            }
          })}
        />
        {errors.password && <span className="error">{errors.password.message}</span>}
      </div>
      
      <button type="submit">{t('common:login')}</button>
    </form>
  );
};

export default LoginForm;
```

**優點:**
- 功能完整
- 社群活躍
- 支援命名空間
- 動態載入
- TypeScript 支援

**缺點:**
- 學習曲線
- 包大小較大

**React Intl**
**優點:**
- Facebook 官方支援
- 格式化功能強大
- ICU 訊息格式

**缺點:**
- 配置複雜
- 動態載入支援有限

#### 2.1.2 後端國際化

**Node.js i18n (推薦)**
```typescript
import i18n from 'i18n';
import path from 'path';

// i18n 配置
i18n.configure({
  locales: ['zh-TW', 'zh-CN', 'en-US'],
  defaultLocale: 'zh-TW',
  directory: path.join(__dirname, '../locales'),
  objectNotation: true,
  updateFiles: false, // 生產環境設為 false
  syncFiles: false,
  api: {
    '__': 't',
    '__n': 'tn'
  }
});

// Express 中間件
export const i18nMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // 從 header 或 query 參數獲取語言
  const language = req.headers['accept-language'] || req.query.lang || 'zh-TW';
  
  // 設定當前請求的語言
  i18n.setLocale(req, language);
  
  // 將翻譯函數添加到 response locals
  res.locals.t = req.t;
  res.locals.tn = req.tn;
  
  next();
};

// 服務層使用
class NotificationService {
  async sendWelcomeEmail(userId: string, language: string): Promise<void> {
    i18n.setLocale(language);
    
    const user = await this.userService.getUser(userId);
    const subject = i18n.__('email.welcome.subject', { name: user.name });
    const content = i18n.__('email.welcome.content', {
      name: user.name,
      appName: 'MKing Friend'
    });
    
    await this.emailService.send({
      to: user.email,
      subject,
      html: content
    });
  }
  
  async sendNotification(userId: string, type: string, data: any): Promise<void> {
    const user = await this.userService.getUser(userId);
    const language = user.preferred_language || 'zh-TW';
    
    i18n.setLocale(language);
    
    const message = i18n.__(`notification.${type}`, data);
    
    await this.pushNotificationService.send(userId, {
      title: i18n.__(`notification.${type}.title`),
      body: message,
      data
    });
  }
}
```

**翻譯檔案結構**
```
locales/
├── zh-TW/
│   ├── common.json
│   ├── validation.json
│   ├── email.json
│   └── notification.json
├── zh-CN/
│   ├── common.json
│   ├── validation.json
│   ├── email.json
│   └── notification.json
└── en-US/
    ├── common.json
    ├── validation.json
    ├── email.json
    └── notification.json
```

### 2.2 本地化工具

#### 2.2.1 翻譯管理平台

**Crowdin (推薦)**
```typescript
// Crowdin CLI 自動化
const crowdinConfig = {
  project_id: 'mking-friend',
  api_token: process.env.CROWDIN_API_TOKEN,
  base_path: './src',
  base_url: 'https://api.crowdin.com',
  
  files: [
    {
      source: '/locales/zh-TW/**/*.json',
      translation: '/locales/%two_letters_code%/**/%original_file_name%',
      languages_mapping: {
        two_letters_code: {
          'zh-CN': 'zh-CN',
          'en': 'en-US'
        }
      }
    }
  ]
};

// 自動化腳本
class TranslationManager {
  async uploadSourceFiles(): Promise<void> {
    // 上傳源文件到 Crowdin
    await this.crowdinClient.sourceFilesApi.createFile(this.projectId, {
      storageId: await this.uploadFile('./locales/zh-TW/common.json'),
      name: 'common.json',
      type: 'json'
    });
  }
  
  async downloadTranslations(): Promise<void> {
    // 下載翻譯文件
    const build = await this.crowdinClient.translationsApi.buildProject(this.projectId);
    
    // 等待構建完成
    await this.waitForBuild(build.data.id);
    
    // 下載並解壓縮
    const downloadUrl = await this.crowdinClient.translationsApi.downloadTranslations(this.projectId, build.data.id);
    await this.downloadAndExtract(downloadUrl.data.url);
  }
  
  async syncTranslations(): Promise<void> {
    await this.uploadSourceFiles();
    await this.downloadTranslations();
    
    // 提交到版本控制
    await this.commitTranslations();
  }
}
```

**優點:**
- 專業翻譯管理
- 協作功能強大
- API 整合
- 品質保證工具

**缺點:**
- 付費服務
- 依賴第三方

**Lokalise**
**優點:**
- 開發者友好
- 實時同步
- 強大的 API

**缺點:**
- 價格較高
- 學習曲線

**自建翻譯管理系統**
```typescript
// 簡單的翻譯管理 API
class TranslationManagementService {
  async getTranslations(language: string, namespace?: string): Promise<TranslationData> {
    const query = this.translationRepository.createQueryBuilder('t')
      .where('t.language = :language', { language });
    
    if (namespace) {
      query.andWhere('t.namespace = :namespace', { namespace });
    }
    
    const translations = await query.getMany();
    
    return this.formatTranslations(translations);
  }
  
  async updateTranslation(key: string, language: string, value: string, namespace: string): Promise<void> {
    await this.translationRepository.upsert({
      key,
      language,
      value,
      namespace,
      updated_at: new Date()
    }, ['key', 'language', 'namespace']);
    
    // 清除快取
    await this.cacheService.del(`translations:${language}:${namespace}`);
    
    // 通知前端更新
    this.eventBus.emit('translation.updated', { key, language, namespace });
  }
  
  async exportTranslations(language: string, format: 'json' | 'csv' | 'xlsx'): Promise<Buffer> {
    const translations = await this.getTranslations(language);
    
    switch (format) {
      case 'json':
        return Buffer.from(JSON.stringify(translations, null, 2));
      case 'csv':
        return this.convertToCSV(translations);
      case 'xlsx':
        return this.convertToXLSX(translations);
      default:
        throw new Error('不支援的格式');
    }
  }
}
```

### 2.3 格式化與本地化

#### 2.3.1 日期時間處理

**date-fns + date-fns-tz (推薦)**
```typescript
import { format, parseISO } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';
import { zhTW, zhCN, enUS } from 'date-fns/locale';

class DateTimeService {
  private locales = {
    'zh-TW': zhTW,
    'zh-CN': zhCN,
    'en-US': enUS
  };
  
  private timezones = {
    'zh-TW': 'Asia/Taipei',
    'zh-CN': 'Asia/Shanghai',
    'en-US': 'America/New_York'
  };
  
  formatDateTime(date: Date | string, language: string, formatString?: string): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const locale = this.locales[language] || this.locales['zh-TW'];
    const timezone = this.timezones[language] || this.timezones['zh-TW'];
    
    // 轉換到本地時區
    const zonedDate = utcToZonedTime(dateObj, timezone);
    
    // 根據語言選擇格式
    const defaultFormats = {
      'zh-TW': 'yyyy年MM月dd日 HH:mm',
      'zh-CN': 'yyyy年MM月dd日 HH:mm',
      'en-US': 'MMM dd, yyyy HH:mm'
    };
    
    const formatStr = formatString || defaultFormats[language] || defaultFormats['zh-TW'];
    
    return format(zonedDate, formatStr, { locale });
  }
  
  getRelativeTime(date: Date | string, language: string): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
    
    const intervals = {
      'zh-TW': {
        year: '年前',
        month: '個月前',
        week: '週前',
        day: '天前',
        hour: '小時前',
        minute: '分鐘前',
        second: '秒前',
        just_now: '剛剛'
      },
      'zh-CN': {
        year: '年前',
        month: '个月前',
        week: '周前',
        day: '天前',
        hour: '小时前',
        minute: '分钟前',
        second: '秒前',
        just_now: '刚刚'
      },
      'en-US': {
        year: 'years ago',
        month: 'months ago',
        week: 'weeks ago',
        day: 'days ago',
        hour: 'hours ago',
        minute: 'minutes ago',
        second: 'seconds ago',
        just_now: 'just now'
      }
    };
    
    const strings = intervals[language] || intervals['zh-TW'];
    
    if (diffInSeconds < 60) {
      return diffInSeconds < 10 ? strings.just_now : `${diffInSeconds}${strings.second}`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}${strings.minute}`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}${strings.hour}`;
    } else if (diffInSeconds < 604800) {
      return `${Math.floor(diffInSeconds / 86400)}${strings.day}`;
    } else if (diffInSeconds < 2629746) {
      return `${Math.floor(diffInSeconds / 604800)}${strings.week}`;
    } else if (diffInSeconds < 31556952) {
      return `${Math.floor(diffInSeconds / 2629746)}${strings.month}`;
    } else {
      return `${Math.floor(diffInSeconds / 31556952)}${strings.year}`;
    }
  }
}
```

#### 2.3.2 數字和貨幣格式化

**Intl API (推薦)**
```typescript
class NumberFormatService {
  formatNumber(value: number, language: string, options?: Intl.NumberFormatOptions): string {
    const locale = this.getLocale(language);
    return new Intl.NumberFormat(locale, options).format(value);
  }
  
  formatCurrency(value: number, language: string, currency?: string): string {
    const locale = this.getLocale(language);
    const defaultCurrencies = {
      'zh-TW': 'TWD',
      'zh-CN': 'CNY',
      'en-US': 'USD'
    };
    
    const currencyCode = currency || defaultCurrencies[language] || 'TWD';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode
    }).format(value);
  }
  
  formatPercentage(value: number, language: string): string {
    const locale = this.getLocale(language);
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 2
    }).format(value);
  }
  
  private getLocale(language: string): string {
    const localeMap = {
      'zh-TW': 'zh-TW',
      'zh-CN': 'zh-CN',
      'en-US': 'en-US'
    };
    
    return localeMap[language] || 'zh-TW';
  }
}

// React Hook 使用
const useNumberFormat = () => {
  const { i18n } = useTranslation();
  const numberFormatService = new NumberFormatService();
  
  return {
    formatNumber: (value: number, options?: Intl.NumberFormatOptions) => 
      numberFormatService.formatNumber(value, i18n.language, options),
    formatCurrency: (value: number, currency?: string) => 
      numberFormatService.formatCurrency(value, i18n.language, currency),
    formatPercentage: (value: number) => 
      numberFormatService.formatPercentage(value, i18n.language)
  };
};
```

## 3. 系統架構設計

### 3.1 國際化架構圖
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   用戶瀏覽器    │    │   CDN/快取      │    │   前端應用      │
│   (語言偵測)    │───►│   (翻譯檔案)    │───►│   (React i18n)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   語言偏好      │    │   翻譯快取      │    │   動態載入      │
│   (localStorage)│    │   (Redis)       │    │   (懶載入)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   API Gateway   │
                       │   (語言路由)    │
                       └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   翻譯管理      │    │   後端服務      │    │   資料庫        │
│   (Crowdin)     │◄──►│   (Node.js i18n)│◄──►│   (多語言內容)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   翻譯工作流    │    │   本地化服務    │    │   內容版本控制  │
│   (審核/品質)   │    │   (格式化)      │    │   (多語言)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 3.2 資料庫設計
```sql
-- 用戶語言偏好表
CREATE TABLE user_language_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    preferred_language VARCHAR(10) DEFAULT 'zh-TW',
    timezone VARCHAR(50) DEFAULT 'Asia/Taipei',
    date_format VARCHAR(20) DEFAULT 'yyyy-MM-dd',
    time_format VARCHAR(10) DEFAULT '24h', -- '12h' or '24h'
    number_format VARCHAR(10) DEFAULT 'decimal', -- 'decimal' or 'comma'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 多語言內容表
CREATE TABLE localized_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type VARCHAR(50), -- 'user_bio', 'group_description', 'event_title'
    content_id UUID, -- 關聯到具體內容的 ID
    language VARCHAR(10),
    title TEXT,
    content TEXT,
    metadata JSONB,
    is_machine_translated BOOLEAN DEFAULT FALSE,
    translation_quality_score FLOAT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(content_type, content_id, language)
);

-- 翻譯管理表
CREATE TABLE translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    namespace VARCHAR(50),
    key VARCHAR(200),
    language VARCHAR(10),
    value TEXT,
    context TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    translator_id UUID REFERENCES users(id),
    reviewer_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(namespace, key, language)
);

-- 地區設定表
CREATE TABLE locale_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language VARCHAR(10),
    region VARCHAR(10),
    currency VARCHAR(3),
    date_format VARCHAR(20),
    time_format VARCHAR(10),
    number_format JSONB,
    rtl BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE
);

-- 內容審核表（多語言）
CREATE TABLE content_moderation_i18n (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type VARCHAR(50),
    content_id UUID,
    language VARCHAR(10),
    moderation_status VARCHAR(20), -- 'pending', 'approved', 'rejected'
    moderation_reason TEXT,
    moderator_id UUID REFERENCES users(id),
    automated_score FLOAT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_user_language_preferences_user_id ON user_language_preferences (user_id);
CREATE INDEX idx_localized_content_type_id ON localized_content (content_type, content_id);
CREATE INDEX idx_localized_content_language ON localized_content (language);
CREATE INDEX idx_translations_namespace_key ON translations (namespace, key);
CREATE INDEX idx_translations_language ON translations (language);
CREATE INDEX idx_content_moderation_i18n_content ON content_moderation_i18n (content_type, content_id);
```

## 4. 核心功能實現

### 4.1 語言偵測與切換
```typescript
class LanguageDetectionService {
  detectUserLanguage(req: Request): string {
    // 1. URL 參數
    if (req.query.lang && this.isSupportedLanguage(req.query.lang as string)) {
      return req.query.lang as string;
    }
    
    // 2. 用戶設定（已登入用戶）
    if (req.user?.preferred_language) {
      return req.user.preferred_language;
    }
    
    // 3. Cookie
    if (req.cookies.language && this.isSupportedLanguage(req.cookies.language)) {
      return req.cookies.language;
    }
    
    // 4. Accept-Language Header
    const acceptLanguage = req.headers['accept-language'];
    if (acceptLanguage) {
      const preferredLanguage = this.parseAcceptLanguage(acceptLanguage);
      if (preferredLanguage) {
        return preferredLanguage;
      }
    }
    
    // 5. IP 地理位置
    const geoLanguage = this.detectLanguageByIP(req.ip);
    if (geoLanguage) {
      return geoLanguage;
    }
    
    // 6. 預設語言
    return 'zh-TW';
  }
  
  private parseAcceptLanguage(acceptLanguage: string): string | null {
    const languages = acceptLanguage
      .split(',')
      .map(lang => {
        const [language, quality = '1'] = lang.trim().split(';q=');
        return { language: language.trim(), quality: parseFloat(quality) };
      })
      .sort((a, b) => b.quality - a.quality);
    
    for (const { language } of languages) {
      // 完全匹配
      if (this.isSupportedLanguage(language)) {
        return language;
      }
      
      // 語言代碼匹配（忽略地區）
      const langCode = language.split('-')[0];
      const matchedLanguage = this.findLanguageByCode(langCode);
      if (matchedLanguage) {
        return matchedLanguage;
      }
    }
    
    return null;
  }
  
  private detectLanguageByIP(ip: string): string | null {
    // 使用 IP 地理位置服務
    const geoData = this.geoLocationService.getLocation(ip);
    
    const countryLanguageMap = {
      'TW': 'zh-TW',
      'CN': 'zh-CN',
      'HK': 'zh-TW',
      'MO': 'zh-TW',
      'SG': 'zh-CN',
      'MY': 'zh-CN',
      'US': 'en-US',
      'CA': 'en-US',
      'GB': 'en-US',
      'AU': 'en-US'
    };
    
    return countryLanguageMap[geoData?.country] || null;
  }
}

// React 語言切換組件
const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  
  const languages = [
    { code: 'zh-TW', name: '繁體中文', flag: '🇹🇼' },
    { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
    { code: 'en-US', name: 'English', flag: '🇺🇸' }
  ];
  
  const handleLanguageChange = async (languageCode: string) => {
    // 更新 i18n
    await i18n.changeLanguage(languageCode);
    
    // 保存到 localStorage
    localStorage.setItem('language', languageCode);
    
    // 更新用戶偏好（如果已登入）
    if (user) {
      await userService.updateLanguagePreference(user.id, languageCode);
    }
    
    // 更新狀態
    setCurrentLanguage(languageCode);
    
    // 重新載入頁面以確保所有內容更新
    window.location.reload();
  };
  
  return (
    <div className="language-switcher">
      <select 
        value={currentLanguage} 
        onChange={(e) => handleLanguageChange(e.target.value)}
        className="language-select"
      >
        {languages.map(lang => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};
```

### 4.2 動態內容翻譯
```typescript
class ContentTranslationService {
  async translateUserContent(contentId: string, contentType: string, targetLanguage: string): Promise<LocalizedContent> {
    // 檢查是否已有翻譯
    const existingTranslation = await this.localizedContentRepository.findOne({
      content_type: contentType,
      content_id: contentId,
      language: targetLanguage
    });
    
    if (existingTranslation) {
      return existingTranslation;
    }
    
    // 獲取原始內容
    const originalContent = await this.getOriginalContent(contentId, contentType);
    
    // 機器翻譯
    const translatedContent = await this.machineTranslate(originalContent, targetLanguage);
    
    // 保存翻譯
    const localizedContent = await this.localizedContentRepository.create({
      content_type: contentType,
      content_id: contentId,
      language: targetLanguage,
      title: translatedContent.title,
      content: translatedContent.content,
      is_machine_translated: true,
      translation_quality_score: translatedContent.qualityScore
    });
    
    return localizedContent;
  }
  
  private async machineTranslate(content: OriginalContent, targetLanguage: string): Promise<TranslatedContent> {
    // 使用 Google Translate API 或其他翻譯服務
    const translationResult = await this.googleTranslateService.translate({
      text: [content.title, content.content],
      target: targetLanguage,
      source: content.language
    });
    
    return {
      title: translationResult.translations[0].translatedText,
      content: translationResult.translations[1].translatedText,
      qualityScore: this.calculateQualityScore(translationResult)
    };
  }
  
  async getLocalizedContent(contentId: string, contentType: string, language: string): Promise<LocalizedContent> {
    // 嘗試獲取指定語言的內容
    let content = await this.localizedContentRepository.findOne({
      content_type: contentType,
      content_id: contentId,
      language
    });
    
    // 如果沒有，嘗試自動翻譯
    if (!content) {
      content = await this.translateUserContent(contentId, contentType, language);
    }
    
    // 如果翻譯失敗，返回原始語言內容
    if (!content) {
      content = await this.localizedContentRepository.findOne({
        content_type: contentType,
        content_id: contentId
      });
    }
    
    return content;
  }
}

// React Hook 使用
const useLocalizedContent = (contentId: string, contentType: string) => {
  const { i18n } = useTranslation();
  const [content, setContent] = useState<LocalizedContent | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      try {
        const localizedContent = await contentTranslationService.getLocalizedContent(
          contentId,
          contentType,
          i18n.language
        );
        setContent(localizedContent);
      } catch (error) {
        console.error('載入本地化內容失敗:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadContent();
  }, [contentId, contentType, i18n.language]);
  
  return { content, loading };
};
```

### 4.3 文化適應性設計
```typescript
class CulturalAdaptationService {
  getThemeByLanguage(language: string): ThemeConfig {
    const themes = {
      'zh-TW': {
        primaryColor: '#E53E3E', // 紅色 - 吉祥色
        secondaryColor: '#FFD700', // 金色
        fontFamily: 'Noto Sans TC, sans-serif',
        direction: 'ltr',
        dateFormat: 'yyyy年MM月dd日',
        culturalElements: {
          showLunarCalendar: true,
          showTraditionalHolidays: true,
          preferredColors: ['red', 'gold', 'jade']
        }
      },
      'zh-CN': {
        primaryColor: '#DC143C',
        secondaryColor: '#FFD700',
        fontFamily: 'Noto Sans SC, sans-serif',
        direction: 'ltr',
        dateFormat: 'yyyy年MM月dd日',
        culturalElements: {
          showLunarCalendar: true,
          showTraditionalHolidays: true,
          preferredColors: ['red', 'gold']
        }
      },
      'en-US': {
        primaryColor: '#3182CE',
        secondaryColor: '#38A169',
        fontFamily: 'Inter, sans-serif',
        direction: 'ltr',
        dateFormat: 'MM/dd/yyyy',
        culturalElements: {
          showLunarCalendar: false,
          showTraditionalHolidays: false,
          preferredColors: ['blue', 'green', 'purple']
        }
      }
    };
    
    return themes[language] || themes['zh-TW'];
  }
  
  getContentGuidelines(language: string): ContentGuidelines {
    const guidelines = {
      'zh-TW': {
        sensitiveTopics: ['政治', '宗教', '兩岸關係'],
        culturalTaboos: ['數字4', '白色花朵', '時鐘禮品'],
        preferredCommunicationStyle: 'indirect',
        formalityLevel: 'medium',
        emojiUsage: 'moderate'
      },
      'zh-CN': {
        sensitiveTopics: ['政治', '宗教', '社會議題'],
        culturalTaboos: ['數字4', '白色花朵'],
        preferredCommunicationStyle: 'direct',
        formalityLevel: 'medium',
        emojiUsage: 'high'
      },
      'en-US': {
        sensitiveTopics: ['politics', 'religion', 'personal_finance'],
        culturalTaboos: ['age_questions', 'weight_comments'],
        preferredCommunicationStyle: 'direct',
        formalityLevel: 'low',
        emojiUsage: 'high'
      }
    };
    
    return guidelines[language] || guidelines['zh-TW'];
  }
}

// React 文化適應組件
const CulturallyAdaptiveComponent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();
  const theme = culturalAdaptationService.getThemeByLanguage(i18n.language);
  
  return (
    <ThemeProvider theme={theme}>
      <div 
        dir={theme.direction}
        style={{
          fontFamily: theme.fontFamily,
          '--primary-color': theme.primaryColor,
          '--secondary-color': theme.secondaryColor
        } as React.CSSProperties}
      >
        {children}
      </div>
    </ThemeProvider>
  );
};
```

## 5. 實施計劃

### 5.1 第一階段（基礎國際化）- 3週
- [ ] 前端 i18n 框架設置 (React i18next)
- [ ] 後端 i18n 支援 (Node.js i18n)
- [ ] 基礎翻譯檔案（繁體中文）
- [ ] 語言偵測與切換
- [ ] 資料庫多語言支援

### 5.2 第二階段（多語言支援）- 4週
- [ ] 簡體中文翻譯
- [ ] 英文翻譯
- [ ] 翻譯管理系統
- [ ] 動態內容翻譯
- [ ] 日期時間本地化

### 5.3 第三階段（文化適應）- 3週
- [ ] 數字貨幣格式化
- [ ] 文化適應性設計
- [ ] 地區特定功能
- [ ] 內容審核本地化
- [ ] 用戶偏好管理

### 5.4 第四階段（優化完善）- 2週
- [ ] 翻譯品質優化
- [ ] 性能優化
- [ ] 自動化測試
- [ ] 文檔完善
- [ ] 上線部署

## 6. 技術建議

### 6.1 推薦技術棧
- **前端**: React i18next + date-fns + Intl API
- **後端**: Node.js i18n + ICU MessageFormat
- **翻譯管理**: Crowdin 或自建系統
- **機器翻譯**: Google Translate API
- **字體**: Noto Sans 系列

### 6.2 成本估算
- **翻譯管理平台**: $50-200/月
- **機器翻譯 API**: $20-100/月
- **專業翻譯服務**: $500-2000/次
- **字體授權**: $0（使用開源字體）
- **總成本**: $70-300/月 + $2000-8000/年

### 6.3 品質指標
- **翻譯覆蓋率**: 100%
- **翻譯準確率**: > 95%
- **載入時間**: < 200ms
- **用戶滿意度**: > 90%
- **本地化適應度**: > 85%

---

**文檔版本**: v1.0  
**最後更新**: 2025-01-02  
**狀態**: ✅ 規劃完成，待實施