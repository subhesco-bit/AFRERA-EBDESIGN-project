<!-- Claude AI Ready Module - Systematic Reorganization -->
<!-- Category: documentation -->
<!-- Processed: 2026-08-28 14:27:18 -->
<!-- Status: AI Integration Ready -->
<!-- File: README.md -->

# AFRERA Platform - Enterprise-Grade Rural Economy Platform

## Overview

AFRERA is a comprehensive multi-vertical rural economy platform designed to empower farmers across Northeast India through technology, fair trade practices, and intelligent decision-making. The platform connects farmers directly with consumers, provides financial services, logistics support, insurance coverage, and integrates with enterprise ERP systems.

## 🎯 Key Features

### Core Modules

- **GI Marketplace**: Direct-to-consumer marketplace for GI-tagged agricultural products
- **Farmer Portal**: Dashboard for farmers with FDI tracking, certifications, and financial services
- **Logistics**: Multimodal cold-chain logistics with real-time tracking
- **Insurance**: Comprehensive crop, transit, and warehouse insurance
- **Financial Services**: Loans, advances, credit scoring, and EMI management
- **Contract Farming**: Smart contracts with escrow and milestone tracking
- **Shared Infrastructure**: Equipment rental and booking system
- **AI Decision Engine**: Predictive analytics, risk assessment, and recommendations
- **ERP Integration**: SAP/Oracle/custom ERP synchronization

### Intelligent Features

- **Farmer Development Index (FDI)**: Comprehensive farmer scoring system
- **AI-Powered Decision Making**: Demand forecasting, price optimization, credit risk assessment
- **Fraud Detection**: Real-time transaction monitoring
- **Recommendation Engine**: Personalized product and service recommendations

## 🏗️ Architecture

### Microservices Architecture

The platform follows a microservices architecture with the following services:

1. **API Gateway**: Request routing, authentication, rate limiting
2. **Auth Service**: JWT-based authentication, OAuth2, MFA
3. **Product Service**: Product catalog, categories, inventory
4. **Order Service**: Cart management, order processing, payments
5. **Farmer Service**: Farmer profiles, FDI calculation, certifications
6. **Financial Service**: Loans, advances, credit scoring, EMI
7. **Logistics Service**: Shipments, tracking, vehicles, drivers
8. **Insurance Service**: Policies, claims, master policies
9. **AI Service**: Predictive analytics, recommendations, fraud detection
10. **ERP Service**: SAP/Oracle/custom ERP integration

### Technology Stack

#### Backend

- **Runtime**: Node.js 18+
- **API Framework**: Express.js
- **Databases**: PostgreSQL (relational), MongoDB (document)
- **Cache**: Redis
- **Message Queue**: RabbitMQ
- **Search**: Elasticsearch
- **Authentication**: JWT, OAuth2, bcrypt
- **AI/ML**: Custom decision engine with predictive models

#### Frontend

- **Framework**: React 18 with Vite
- **State Management**: Zustand
- **Data Fetching**: React Query
- **Routing**: React Router v6
- **UI Components**: Radix UI, TailwindCSS
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation

#### DevOps

- **Containerization**: Docker
- **Orchestration**: Kubernetes
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana (planned)
- **Logging**: Winston + ELK Stack

## 📁 Project Structure

```
EBDESIGN/
├── backend/                    # Backend microservices
│   ├── src/
│   │   ├── database/          # Database schemas and connections
│   │   ├── middleware/        # Express middleware
│   │   ├── services/          # Business logic services
│   │   ├── utils/             # Utility functions
│   │   └── index.js          # Main entry point
│   ├── Dockerfile             # Docker image
│   ├── docker-compose.yml     # Local development
│   └── package.json           # Dependencies
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API client
│   │   ├── store/             # State management
│   │   └── main.jsx           # Entry point
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── afrera_platform_v43.html   # Legacy monolithic version (reference)
└── README.md                   # This file

```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- MongoDB 7+
- Redis 7+
- Docker & Docker Compose (optional)

### Backend Setup

1. **Navigate to backend directory**

```bash

cd backend

```

2. **Install dependencies**

```bash

npm install

```

3. **Configure environment variables**
Create a `.env` file:

```env

NODE_ENV=development
PORT=3001

# Database

PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=afrera_db
PG_USER=afrera
PG_PASSWORD=your_password
MONGO_URI=mongodb://localhost:27017/afrera_mongo

# Redis

REDIS_HOST=localhost
REDIS_PORT=6379

# JWT

JWT_SECRET=your-super-secret-key-change-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Frontend

FRONTEND_URL=http://localhost:3000

# AI

ANTHROPIC_API_KEY=your_anthropic_api_key

# ERP (optional)

SAP_ENABLED=false
ORACLE_ENABLED=false
CUSTOM_ERP_ENABLED=false

```

4. **Initialize database**

```bash

npm run migrate

```

5. **Start development server**

```bash

npm run dev

```

The backend API will be available at `http://localhost:3001`

### Frontend Setup

1. **Navigate to frontend directory**

```bash

cd frontend

```

2. **Install dependencies**

```bash

npm install

```

3. **Configure environment variables**
Create a `.env` file:

```env

VITE_API_URL=http://localhost:3001/api/v1

```

4. **Start development server**

```bash

npm run dev

```

The frontend will be available at `http://localhost:3000`

### Docker Setup

For quick local development with all services:

```bash

cd backend
docker-compose up -d

```

This will start:
- PostgreSQL
- MongoDB
- Redis
- RabbitMQ
- Elasticsearch
- Backend API

## 📊 Database Schema

The platform uses PostgreSQL for relational data and MongoDB for document storage.

### Key Tables

- `users` - User accounts and authentication
- `products` - Product catalog with GI certification
- `orders` - Orders and order items
- `farmers` - Farmer profiles with FDI scores
- `fpos` - Farmer Producer Organizations
- `loans` - Loan applications and EMI schedules
- `policies` - Insurance policies
- `claims` - Insurance claims
- `shipments` - Logistics shipments
- `contracts` - Contract farming agreements
- `assets` - Shared infrastructure assets

See `backend/src/database/schema.sql` for complete schema.

## 🔐 Authentication & Authorization

### JWT-Based Authentication

- Access tokens: 15 minutes expiry
- Refresh tokens: 7 days expiry
- Token refresh mechanism with automatic retry

### Role-Based Access Control (RBAC)

- **admin**: Full platform access
- **farmer**: Marketplace, farmer portal, financial services
- **fpo**: Farmer management, procurement
- **corporate**: Bulk purchasing, contract farming
- **consumer**: Marketplace access
- **logistics**: Shipment management
- **horeca**: Hotel/Restaurant/Cafe ordering

### OAuth2 Integration

- Google OAuth (configurable)
- Facebook OAuth (configurable)

### Two-Factor Authentication

- TOTP-based 2FA support
- Backup codes for recovery

## 🤖 AI Decision-Making Engine

### Capabilities

1. **Demand Forecasting**: Predict product demand by season and region
2. **Price Optimization**: Dynamic pricing based on market conditions
3. **Credit Risk Assessment**: Evaluate farmer creditworthiness
4. **Fraud Detection**: Real-time transaction monitoring
5. **Recommendation Engine**: Personalized recommendations

### API Endpoints

- `POST /api/v1/ai/predict/demand` - Demand prediction
- `POST /api/v1/ai/optimize/price` - Price optimization
- `POST /api/v1/ai/assess/credit-risk` - Credit risk assessment
- `POST /api/v1/ai/detect/fraud` - Fraud detection
- `POST /api/v1/ai/recommend` - Generate recommendations

## 🔌 ERP Integration

### Supported Systems

- **SAP**: Material Management, Sales & Distribution, Financial Accounting
- **Oracle**: E-Business Suite, Supply Chain Management
- **Custom**: REST API-based custom ERP systems

### Synchronization

- Product master data sync
- Order sync for financial processing
- Farmer/vendor sync
- Financial transaction sync
- Asset/equipment sync

### API Endpoints

- `GET /api/v1/erp/status` - Sync status
- `POST /api/v1/erp/sync/product` - Sync product
- `POST /api/v1/erp/sync/order` - Sync order
- `POST /api/v1/erp/sync/farmer` - Sync farmer
- `POST /api/v1/erp/sync/bulk` - Bulk sync

## 🧪 Testing

### Backend Tests


```bash

cd backend
npm test

```

### Frontend Tests


```bash

cd frontend
npm test

```

### E2E Tests (planned)


```bash

npm run test:e2e

```

## 📦 Deployment

### Docker Build


```bash

docker build -t afrera-backend:latest ./backend
docker build -t afrera-frontend:latest ./frontend

```

### Kubernetes Deployment

See `.github/workflows/ci-cd.yml` for CI/CD pipeline configuration.

### Environment Variables

Ensure all required environment variables are configured for production deployment.

## 🔒 Security

### Implemented

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- Input validation
- SQL injection prevention
- XSS protection
- CSRF protection
- Security headers (Helmet)
- Audit logging

### Recommended for Production

- Enable HTTPS/TLS
- Configure CORS properly
- Use secrets management (AWS Secrets Manager, HashiCorp Vault)
- Enable database encryption at rest
- Regular security audits
- Penetration testing

## 📈 Monitoring & Logging

### Logging

- Winston for structured logging
- Log levels: error, warn, info, http, debug
- File-based logging in production
- Console logging in development

### Monitoring (Planned)

- Prometheus for metrics collection
- Grafana for visualization
- APM tools (New Relic, Datadog)
- Error tracking (Sentry)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

Proprietary - Ethnoverde Dynamics Pvt. Ltd.

## 📞 Support

For support, contact:
- Email: support@afrera.com
- Phone: +91 1800-123-4567

## 🙏 Acknowledgments

- Northeast India farmers and FPOs
- Government schemes and initiatives
- Open source community

## 🗺️ Roadmap

### Phase 1 (Completed)

- ✅ Microservices architecture
- ✅ Authentication system
- ✅ Core business modules
- ✅ AI decision engine
- ✅ ERP integration layer
- ✅ Frontend refactoring

### Phase 2 (In Progress)

- 🔄 Real-time WebSocket features
- 🔄 ORM and caching layer
- 🔄 Testing framework
- 🔄 Security enhancements

### Phase 3 (Planned)

- ⏳ Advanced monitoring
- ⏳ Mobile applications
- ⏳ Additional AI models
- ⏳ Blockchain integration for supply chain
- ⏳ Voice assistant integration

---

**AFRERA Platform** - Empowering Rural India Through Technology

DPIIT Registration: DIPP177638 | Non-NBFC Entity
