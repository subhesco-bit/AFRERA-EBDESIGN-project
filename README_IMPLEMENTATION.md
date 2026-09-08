# EBDESIGN - Agricultural Digital Operating System

## Overview
Complete agricultural platform with AI integration, real-time monitoring, GDPR compliance, and enterprise-grade infrastructure.

## Architecture

### Backend (Node.js + Express)
- **Auto-discovery**: Dynamic service/route loading
- **Database**: PostgreSQL (523+ tables, 96 migrations)
- **Cache**: Redis
- **Real-time**: Socket.IO
- **Search**: Elasticsearch

### Frontend (React 18)
- **State**: Zustand
- **UI**: Radix UI + TailwindCSS
- **Routes**: 150+ pages
- **Components**: AI Chat, MFA, GDPR, Digital Twin

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- npm or yarn

### Installation

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

## API Endpoints

### AI Models (23 total)
- **Predictions**: Weather, market price, pest, soil, yield, equipment, supply/demand, quality, risk
- **Optimizations**: Resource, crop, inventory, logistics, financial, insurance, procurement
- **Analysis**: Soil, water, crop health

### Training & Evaluation
- Model accuracy calculation
- Hyperparameter optimization
- Drift detection
- Quality reporting

### Infrastructure Monitoring
- Datadog/Prometheus integration
- Real-time metrics
- Alert management
- Dashboard

### GDPR Compliance
- Data inventory
- Consent management
- Data export
- Right to be forgotten

### Digital Twin Platform
- Real-time farm monitoring
- IoT device management
- Sensor data streaming
- Simulation engine

## Database Setup

```bash
# Execute migrations (requires PostgreSQL running)
cd backend
npm run migrate
```

## Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## Environment Variables

Create `.env` file in backend:

```
DATABASE_URL=postgresql://user:password@localhost:5432/ebdesign
REDIS_URL=redis://localhost:6379
FRONTEND_URL=http://localhost:3000
DATADOG_API_KEY=your_key
ANTHROPIC_API_KEY=your_key
```

## Project Status

- ✅ AI Integration (23 models)
- ✅ Digital Twin Platform
- ✅ Infrastructure Monitoring
- ✅ GDPR Compliance
- ✅ CI/CD Pipeline
- ✅ Security Testing
- ⏳ Database Execution (next step)

## Support

For issues and questions, please refer to `.ai/PROJECT_CONTEXT.md`
