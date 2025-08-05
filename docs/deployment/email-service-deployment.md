# MKing Friend - Email Service Deployment Guide

## Overview

This guide covers the deployment and configuration of email services for the MKing Friend application, including development and production environments.

## Development Environment - MailHog Setup

### Docker Compose Configuration

MailHog is used for email testing in development environment:

```yaml
# In docker-compose.yml
services:
  mailhog:
    image: mailhog/mailhog:latest
    container_name: mking-mailhog
    ports:
      - "1025:1025"  # SMTP port
      - "8025:8025"  # Web UI port
    networks:
      - mking-network
```

### Environment Variables Configuration

```bash
# Development environment (.env)
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_USER=
MAIL_PASS=
MAIL_FROM=noreply@mking-friend.local
MAIL_TRANSPORT=smtp
```

### Usage

1. **Start MailHog**:
   ```bash
   docker-compose up mailhog
   ```

2. **Access Web Interface**:
   - URL: http://localhost:8025
   - View all sent emails in the web interface

3. **Test Email Sending**:
   ```bash
   # Send test email via API
   curl -X POST http://localhost:3000/api/auth/test-email \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com"}'
   ```

## Production Environment - Free SMTP Services

### Option 1: Gmail SMTP

```bash
# Production environment (.env)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-gmail@gmail.com
MAIL_PASS=your-app-password
MAIL_FROM=your-gmail@gmail.com
MAIL_TRANSPORT=smtp
MAIL_SECURE=false
MAIL_TLS=true
```

**Setup Steps**:
1. Enable 2-factor authentication on Gmail
2. Generate an App Password
3. Use the App Password as MAIL_PASS

### Option 2: Outlook/Hotmail SMTP

```bash
# Production environment (.env)
MAIL_HOST=smtp-mail.outlook.com
MAIL_PORT=587
MAIL_USER=your-email@outlook.com
MAIL_PASS=your-password
MAIL_FROM=your-email@outlook.com
MAIL_TRANSPORT=smtp
MAIL_SECURE=false
MAIL_TLS=true
```

### Option 3: SendGrid (Recommended for Production)

```bash
# Production environment (.env)
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USER=apikey
MAIL_PASS=your-sendgrid-api-key
MAIL_FROM=noreply@yourdomain.com
MAIL_TRANSPORT=smtp
MAIL_SECURE=false
MAIL_TLS=true
```

**Benefits**:
- 100 emails/day free tier
- Better deliverability
- Detailed analytics
- Professional email templates

## Email Service Implementation

### NestJS Email Service

```typescript
// src/email/email.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransporter({
      host: this.configService.get('MAIL_HOST'),
      port: this.configService.get('MAIL_PORT'),
      secure: this.configService.get('MAIL_SECURE') === 'true',
      auth: {
        user: this.configService.get('MAIL_USER'),
        pass: this.configService.get('MAIL_PASS'),
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async sendVerificationEmail(email: string, token: string) {
    const verificationUrl = `${this.configService.get('FRONTEND_URL')}/verify-email?token=${token}`;
    
    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM'),
      to: email,
      subject: 'Verify Your Email - MKing Friend',
      html: `
        <h1>Welcome to MKing Friend!</h1>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}">Verify Email</a>
        <p>This link will expire in 24 hours.</p>
      `,
    });
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${token}`;
    
    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM'),
      to: email,
      subject: 'Reset Your Password - MKing Friend',
      html: `
        <h1>Password Reset Request</h1>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });
  }
}
```

### Email Templates

```typescript
// src/email/templates/email-templates.ts
export const EMAIL_TEMPLATES = {
  VERIFICATION: {
    subject: 'Verify Your Email - MKing Friend',
    template: (verificationUrl: string) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Email Verification</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
          <h1 style="color: #e91e63;">Welcome to MKing Friend!</h1>
        </div>
        <div style="padding: 20px;">
          <p>Thank you for signing up! Please verify your email address to complete your registration.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #e91e63; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">This link will expire in 24 hours.</p>
          <p style="color: #666; font-size: 14px;">If you didn't create an account, please ignore this email.</p>
        </div>
      </body>
      </html>
    `,
  },
  PASSWORD_RESET: {
    subject: 'Reset Your Password - MKing Friend',
    template: (resetUrl: string) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Password Reset</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
          <h1 style="color: #e91e63;">Password Reset Request</h1>
        </div>
        <div style="padding: 20px;">
          <p>We received a request to reset your password for your MKing Friend account.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #e91e63; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
          <p style="color: #666; font-size: 14px;">If you didn't request this reset, please ignore this email.</p>
        </div>
      </body>
      </html>
    `,
  },
};
```

## Monitoring and Troubleshooting

### Email Queue Monitoring

```typescript
// src/email/email-queue.service.ts
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class EmailQueueService {
  constructor(@InjectQueue('email') private emailQueue: Queue) {}

  async getQueueStats() {
    const waiting = await this.emailQueue.getWaiting();
    const active = await this.emailQueue.getActive();
    const completed = await this.emailQueue.getCompleted();
    const failed = await this.emailQueue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
    };
  }
}
```

### Health Check Endpoint

```typescript
// src/health/email-health.indicator.ts
import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { EmailService } from '../email/email.service';

@Injectable()
export class EmailHealthIndicator extends HealthIndicator {
  constructor(private emailService: EmailService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Test SMTP connection
      await this.emailService.verifyConnection();
      return this.getStatus(key, true);
    } catch (error) {
      throw new HealthCheckError('Email service check failed', this.getStatus(key, false));
    }
  }
}
```

### Common Issues and Solutions

#### Issue 1: SMTP Authentication Failed

**Symptoms**:
- Error: "Invalid login: 535 5.7.8 Username and Password not accepted"

**Solutions**:
1. Verify credentials are correct
2. Enable "Less secure app access" for Gmail (not recommended)
3. Use App Passwords for Gmail with 2FA
4. Check if account is locked or suspended

#### Issue 2: Connection Timeout

**Symptoms**:
- Error: "Connection timeout"

**Solutions**:
1. Check firewall settings
2. Verify SMTP port (587 for TLS, 465 for SSL)
3. Test connection from server:
   ```bash
   telnet smtp.gmail.com 587
   ```

#### Issue 3: Emails Going to Spam

**Solutions**:
1. Set up SPF record:
   ```
   v=spf1 include:_spf.google.com ~all
   ```
2. Set up DKIM authentication
3. Use a dedicated IP address
4. Maintain good sender reputation

## Security Considerations

### Environment Variables Security

```bash
# Use strong passwords
MAIL_PASS=your-strong-app-password

# Enable TLS
MAIL_TLS=true

# Use secure ports
MAIL_PORT=587  # TLS
# or
MAIL_PORT=465  # SSL
```

### Rate Limiting

```typescript
// src/email/email.service.ts
import { Injectable } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

@Injectable()
export class EmailService {
  @Throttle(5, 60) // 5 emails per minute
  async sendEmail(to: string, subject: string, content: string) {
    // Email sending logic
  }
}
```

### Input Validation

```typescript
// src/email/dto/send-email.dto.ts
import { IsEmail, IsString, MaxLength } from 'class-validator';

export class SendEmailDto {
  @IsEmail()
  to: string;

  @IsString()
  @MaxLength(200)
  subject: string;

  @IsString()
  @MaxLength(10000)
  content: string;
}
```

## Deployment Commands

### Development

```bash
# Start MailHog
docker-compose up mailhog

# Start application with email service
npm run start:dev
```

### Production

```bash
# Set production environment variables
export MAIL_HOST=smtp.sendgrid.net
export MAIL_PORT=587
export MAIL_USER=apikey
export MAIL_PASS=your-sendgrid-api-key

# Start application
npm run start:prod
```

### Health Check

```bash
# Check email service health
curl http://localhost:3000/health/email

# Expected response:
# {
#   "status": "ok",
#   "info": {
#     "email": {
#       "status": "up"
#     }
#   }
# }
```