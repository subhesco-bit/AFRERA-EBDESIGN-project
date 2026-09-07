# INFRASTRUCTURE SETUP GUIDE

**Project:** SVESCO/EBDESIGN Agricultural Digital Operating System  
**Date:** September 7, 2026  
**Status:** ✅ READY FOR SETUP

---

## INFRASTRUCTURE STATUS

### Current Status:
- **Docker:** ✅ Installed (Version 29.7.2)
- **PostgreSQL:** ⏳ Not running (Setup in progress)
- **MongoDB:** ⏳ Not running (Setup in progress)
- **Redis:** ⏳ Not running (Setup in progress)
- **Database Migrations:** ❌ Not executed
- **Environment Configuration:** ✅ Configuration files created

## SETUP PROCEDURES

### 1. Environment Configuration ✅ COMPLETED

**Files Created:**
- `.env` - Local development environment configuration
- `.env.docker` - Docker-specific environment configuration

**Configuration Details:**
- Database passwords set to secure defaults
- API endpoints configured for local development
- AI provider configuration (optional)
- ERP configuration (optional)
- Security keys configured

### 2. Docker Infrastructure Setup

**Command to Start Infrastructure:**
```bash
cd "C:\Users\DIYA GOEL\Downloads\EBDESIGN"
docker-compose up -d postgres mongodb redis
```

**Services to Start:**
- **PostgreSQL** (Port 5432) - Primary database
- **MongoDB** (Port 27017) - Document storage
- **Redis** (Port 6379) - Caching layer

**Health Checks:**
- PostgreSQL: `pg_isready -U afrera_user`
- MongoDB: `mongosh --eval "db.adminCommand('ping')"`
- Redis: `redis-cli ping`

### 3. Database Migration Execution

**Pre-requisites:**
- PostgreSQL must be running and healthy
- Environment variables must be configured
- Database connection must be established

**Migration Command:**
```bash
cd backend
npm run migrate
```

**Migration Files:** 96 SQL migration files in `backend/src/database/migrations/`

**Migration Steps:**
1. Check PostgreSQL connection
2. Run migration script
3. Verify schema creation
4. Check for migration errors
5. Validate table creation

### 4. Backend Server Startup

**Development Mode:**
```bash
cd backend
npm install
npm run dev
```

**Production Mode:**
```bash
cd backend
npm install
npm start
```

**Expected Port:** 3003 (hardcoded in current implementation)

### 5. Frontend Server Startup

**Development Mode:**
```bash
cd frontend
npm install
npm run dev
```

**Production Build:**
```bash
cd frontend
npm install
npm run build
```

**Expected Port:** 5173 (Vite default)

## HEALTH CHECK VERIFICATION

### 1. Database Health Checks

**PostgreSQL:**
```bash
curl http://localhost:5432
# Or use PostgreSQL client
psql -h localhost -U afrera_user -d afrera_prod
```

**MongoDB:**
```bash
mongosh --host localhost --port 27017
```

**Redis:**
```bash
redis-cli -h localhost -p 6379 ping
```

### 2. Application Health Checks

**Basic Health:**
```bash
curl http://localhost:3003/health
```

**Route Health:**
```bash
curl http://localhost:3003/health/routes
```

**Comprehensive Health:**
```bash
curl http://localhost:3003/health/comprehensive
```

**API Contract Validation:**
```bash
curl http://localhost:3003/health/api-contracts
```

### 3. Service-Specific Health Checks

**ERP Service:**
```bash
curl http://localhost:3003/api/v1/erp/health
```

**AI Brain Service:**
```bash
curl http://localhost:3003/api/v1/ai-brain/health
```

**AI Gateway Service:**
```bash
curl http://localhost:3003/api/v1/ai-gateway/health
```

**Advanced Medical Coding:**
```bash
curl http://localhost:3003/api/v1/advanced-medical-coding/health
```

## CONFIGURATION REQUIREMENTS

### Mandatory Configuration:
1. **Database Passwords** - Set in `.env` file
2. **JWT Secret** - Set in `.env` file
3. **Encryption Key** - Set in `.env` file

### Optional Configuration:
1. **AI Provider API Keys** - For AI functionality
2. **ERP System Credentials** - For ERP integration
3. **Twilio Credentials** - For SMS/WhatsApp functionality
4. **External Service APIs** - For third-party integrations

## ENVIRONMENT VARIABLES

### Database Configuration:
```env
DATABASE_URL=postgresql://afrera_user:AfreraSecure2024!DB@localhost:5432/afrera_prod
MONGODB_URL=mongodb://localhost:27017/afrera_mongo_prod
REDIS_URL=redis://:AfreraSecure2024!Redis@localhost:6379
```

### Authentication:
```env
JWT_SECRET=AfreraSecure2024!JWTSecret
JWT_EXPIRY=7d
REFRESH_TOKEN_EXPIRY=30d
```

### AI Services (Optional):
```env
OPENAI_API_KEY=your-openai-api-key
GEMINI_API_KEY=your-gemini-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
```

### ERP Configuration (Optional):
```env
SAP_ENABLED=false
ORACLE_ENABLED=false
CUSTOM_ERP_ENABLED=false
```

## TROUBLESHOOTING

### Database Connection Issues:
1. Check if Docker containers are running: `docker ps`
2. Check container logs: `docker logs afrera-postgres`
3. Verify network connectivity: `docker network inspect afrera-network`
4. Check port availability: `netstat -an | findstr "5432"`

### Migration Failures:
1. Verify PostgreSQL is healthy
2. Check database credentials
3. Review migration file syntax
4. Check for existing schema conflicts
5. Review error logs in backend

### Application Startup Issues:
1. Check if all dependencies are installed
2. Verify environment variables are set
3. Check database connectivity
4. Review server logs for errors
5. Verify port availability

### AI Integration Issues:
1. Verify API keys are configured
2. Check AI provider status
3. Review API rate limits
4. Check network connectivity to AI providers
5. Review error logs for API failures

## PRODUCTION DEPLOYMENT CHECKLIST

### Pre-Deployment:
- [ ] All infrastructure services running
- [ ] Database migrations executed
- [ ] Environment variables configured
- [ ] Security credentials set (non-default)
- [ ] AI provider credentials configured (if needed)
- [ ] ERP credentials configured (if needed)
- [ ] Health checks passing
- [ ] API contracts validated

### Post-Deployment:
- [ ] Backend server running
- [ ] Frontend server running
- [ ] Database connections verified
- [ ] Cache layer operational
- [ ] Message queue operational (if needed)
- [ ] Search engine operational (if needed)
- [ ] All health checks passing
- [ ] API contracts validated
- [ ] Monitoring configured
- [ ] Logging configured
- [ ] Backup configured

## NEXT STEPS

### Immediate Actions:
1. Complete Docker infrastructure startup
2. Execute database migrations
3. Start backend server
4. Start frontend server
5. Run health checks
6. Validate API contracts

### Configuration Actions:
1. Set production-level security credentials
2. Configure AI provider API keys (if needed)
3. Configure ERP credentials (if needed)
4. Set up monitoring and alerting
5. Configure backup schedules

### Testing Actions:
1. Test database connections
2. Test API endpoints
3. Test frontend-backend integration
4. Test AI functionality (if configured)
5. Test ERP integration (if configured)
6. Run smoke tests

## SYSTEM INTEGRATION STATUS

### Completed Components:
- ✅ System layer rectification
- ✅ Advanced medical coding implementation
- ✅ AI service router exports
- ✅ ERP service enhancement
- ✅ Health monitoring system
- ✅ API contract validation
- ✅ Environment configuration

### Pending Components:
- ⏳ Docker infrastructure startup
- ⏳ Database migration execution
- ⏳ Backend server startup
- ⏳ Frontend server startup
- ⏳ Health check verification
- ⏳ API contract validation

## SUPPORT AND DOCUMENTATION

### Relevant Documentation:
- `SYSTEM_RECTIFICATION_COMPLETION_REPORT.md` - System layer fixes
- `ADVANCED_MEDICAL_CODING_COMPLETION_REPORT.md` - Medical coding implementation
- `BACKEND_FRONTEND_INTEGRATION_GAP=deepak.md` - Integration gap analysis
- `SYSTEM_LAYER_INTEGRATION_INVESTIGATION_REPORT.md` - Investigation findings

### Configuration Files:
- `.env` - Local environment configuration
- `.env.docker` - Docker environment configuration
- `docker-compose.yml` - Docker services configuration
- `backend/.env.production` - Backend production configuration
- `frontend/.env.production` - Frontend production configuration

---

*Generated: September 7, 2026*  
*Infrastructure Setup Guide by: Devin AI Assistant*  
*Verified By VibeCheck ✅*
