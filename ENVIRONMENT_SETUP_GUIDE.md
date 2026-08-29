<!-- Claude AI Ready Module - Systematic Reorganization -->
<!-- Category: configurations -->
<!-- Processed: 2026-08-28 14:27:18 -->
<!-- Status: AI Integration Ready -->
<!-- File: ENVIRONMENT_SETUP_GUIDE.md -->

# AFRERA Platform - Environment Setup Guide

## Overview

This guide provides step-by-step instructions for setting up the environment configuration for both frontend and backend applications.

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL >= 13.0
- MongoDB >= 5.0
- Redis >= 6.0

## Backend Environment Setup

### Step 1: Create Backend .env File

Copy the example file and create your actual environment file:

```bash
cd backend
cp .env.example .env
```

### Step 2: Configure Required Variables

Edit the `.env` file and configure the following critical variables:

#### Core Configuration
```env
NODE_ENV=production
PORT=3001
BASE_URL=https://api.afrera.platform
FRONTEND_URL=https://afrera.platform
LOG_LEVEL=info
LOG_DIR=logs
```

#### Database Configuration
```env
# PostgreSQL
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=afrera_production
PG_USER=postgres
PG_PASSWORD=your_secure_password_here
DATABASE_URL=postgresql://postgres:your_secure_password_here@localhost:5432/afrera_production

# MongoDB
MONGO_URI=mongodb://localhost:27017/afrera_mongo
MONGODB_URI=mongodb://localhost:27017/afrera_mongo
MONGO_DATABASE=afrera_mongo

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password_here
REDIS_DB=0
```

#### Security Configuration (CRITICAL)
```env
# Generate these using: node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
JWT_SECRET=your_generated_jwt_secret_here
ENCRYPTION_KEY=your_generated_encryption_key_here
OFFLINE_PAYMENT_SECRET=your_generated_payment_secret_here
SYNC_SECRET=your_generated_sync_secret_here

JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
JWT_ISSUER=afrera-platform
JWT_AUDIENCE=afrera-users
```

#### Third-Party Services
```env
# Twilio (SMS & WhatsApp)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
TWILIO_WHATSAPP_NUMBER=your_whatsapp_number
PUBLIC_BASE_URL=https://api.afrera.platform

# Google OAuth (optional)
GOOGLE_OAUTH_ENABLED=false
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://api.afrera.platform/api/v1/auth/oauth/google/callback

# Facebook OAuth (optional)
FACEBOOK_OAUTH_ENABLED=false
FACEBOOK_CLIENT_ID=your_facebook_client_id
FACEBOOK_CLIENT_SECRET=your_facebook_client_secret
FACEBOOK_REDIRECT_URI=https://api.afrera.platform/api/v1/auth/oauth/facebook/callback
```

#### Database Enhancement Configuration
```env
# Connection Pooling
DATABASE_POOL_MIN=10
DATABASE_POOL_MAX=20
DATABASE_POOL_IDLE_TIMEOUT=30000

# Backup Configuration
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
BACKUP_ENCRYPTION_KEY=your_backup_encryption_key_here

# AWS S3 (for cloud backups)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=afrera-backups

# Monitoring
DB_ALERT_WEBHOOK=https://your-webhook-url.com/alerts
```

### Step 3: Validate Environment Variables

Create a validation script to ensure all required variables are set:

```javascript
// backend/scripts/validate-env.js
require('dotenv').config();

const requiredVars = [
  'NODE_ENV',
  'PORT',
  'DATABASE_URL',
  'JWT_SECRET',
  'ENCRYPTION_KEY'
];

const missing = requiredVars.filter(varName => !process.env[varName]);

if (missing.length > 0) {
  console.error('Missing required environment variables:', missing);
  process.exit(1);
}

console.log('All required environment variables are set');
```

Run the validation:
```bash
node scripts/validate-env.js
```

## Frontend Environment Setup

### Step 1: Create Frontend .env File

Create a new `.env` file in the frontend directory:

```bash
cd frontend
touch .env
```

### Step 2: Configure Frontend Variables

Add the following configuration to `frontend/.env`:

```env
# API Configuration
VITE_API_BASE_URL=https://api.afrera.platform
VITE_WS_URL=wss://api.afrera.platform

# Application Configuration
VITE_APP_NAME=AFRERA Platform
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=production

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true
VITE_ENABLE_PERFORMANCE_MONITORING=true

# Third-Party Services
VITE_GOOGLE_MAPS_KEY=your_google_maps_key
VITE_SENTRY_DSN=your_sentry_dsn

# Build Configuration
VITE_BUNDLE_ANALYZE=false
```

### Step 3: Update Frontend Config

Ensure `frontend/src/config/env.js` reads from environment variables:

```javascript
// frontend/src/config/env.js
const config = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:3001',
  APP_NAME: import.meta.env.VITE_APP_NAME || 'AFRERA Platform',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  APP_ENV: import.meta.env.VITE_APP_ENV || 'development',
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  ENABLE_ERROR_REPORTING: import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true',
  ENABLE_PERFORMANCE_MONITORING: import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true',
  GOOGLE_MAPS_KEY: import.meta.env.VITE_GOOGLE_MAPS_KEY,
  SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
  BUNDLE_ANALYZE: import.meta.env.VITE_BUNDLE_ANALYZE === 'true'
};

export default config;
```

## Security Best Practices

### 1. Never Commit .env Files

Ensure `.gitignore` includes:
```
.env
.env.local
.env.*.local
```

### 2. Use Strong Secrets

Generate cryptographically secure secrets:
```bash
# Generate JWT Secret
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"

# Generate Encryption Key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Rotate Secrets Regularly

- Change JWT secrets every 90 days
- Rotate encryption keys quarterly
- Update API keys as needed

### 4. Use Different Secrets per Environment

- Development secrets can be less strict
- Staging secrets should be production-like
- Production secrets must be maximum security

### 5. Store Secrets Securely

- Use secret management services (AWS Secrets Manager, HashiCorp Vault)
- Never hardcode secrets in code
- Use environment-specific .env files

## Testing Environment Setup

### Development Environment

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with development values
npm run dev

# Frontend
cd frontend
# Create .env with development values
npm run dev
```

### Staging Environment

```bash
# Backend
cd backend
cp .env.example .env.staging
# Edit .env.staging with staging values
export NODE_ENV=staging
npm start

# Frontend
cd frontend
# Create .env.staging with staging values
npm run build -- --mode staging
```

### Production Environment

```bash
# Backend
cd backend
# Create .env.production with production values
export NODE_ENV=production
npm start

# Frontend
cd frontend
# Create .env.production with production values
npm run build -- --mode production
```

## Troubleshooting

### Issue: Application won't start

**Solution:** Check that all required environment variables are set
```bash
node scripts/validate-env.js
```

### Issue: Database connection fails

**Solution:** Verify DATABASE_URL is correct and database is running
```bash
psql $DATABASE_URL
```

### Issue: Redis connection fails

**Solution:** Check Redis is running and credentials are correct
```bash
redis-cli -h localhost -p 6379 ping
```

### Issue: JWT authentication fails

**Solution:** Ensure JWT_SECRET is set and consistent across restarts

### Issue: Frontend can't connect to API

**Solution:** Check VITE_API_BASE_URL is correct and CORS is configured

## Validation Checklist

Before deploying to production, ensure:

- [ ] All required environment variables are set
- [ ] JWT_SECRET is cryptographically secure
- [ ] ENCRYPTION_KEY is cryptographically secure
- [ ] Database credentials are strong
- [ ] Redis password is set
- [ ] Third-party API keys are valid
- [ ] CORS configuration is correct
- [ ] Rate limiting is configured
- [ ] Logging is configured appropriately
- [ ] Monitoring endpoints are accessible
- [ ] Backup configuration is correct
- [ ] SSL/TLS is enabled for all connections

## Next Steps

After completing environment setup:

1. Test application startup
2. Verify database connections
3. Test authentication flow
4. Verify third-party integrations
5. Test monitoring and logging
6. Run integration tests
7. Deploy to staging
8. Perform staging validation
9. Deploy to production

## Support

For issues or questions:
1. Check this guide first
2. Review the PROJECT_ANALYSIS_REPORT.md
3. Check application logs
4. Consult development team

---

**Last Updated:** August 15, 2026  
**Version:** 1.0
