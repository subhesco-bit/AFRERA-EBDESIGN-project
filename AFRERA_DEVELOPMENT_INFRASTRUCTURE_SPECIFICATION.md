# AFRERA Development Infrastructure Specification
## Repository Structure, Cloud Services, and Infrastructure as Code

**Document Version**: 1.0  
**Infrastructure Date**: July 28, 2026  
**Document Type**: Development Infrastructure Specification  
**Status**: Partial Implementation / Verification In Progress

---

## Executive Summary

This specification defines the development infrastructure for AFRERA, leveraging mostly free cloud services to build a powerful, scalable, and maintainable platform. The infrastructure is designed to support the multi-experience platform architecture (Public Website, Enterprise Web Application, Desktop Application, Mobile Application) with a common backend, while enabling parallel development through a well-organized repository structure and comprehensive Infrastructure as Code (IaC) approach.

The current repository state is not fully complete; the implementation is a remediation-and-verification pass with build/test evidence now being reconciled against the module catalogue rather than presented as a closed-out end state.

### Infrastructure Philosophy

- **Git-based workflow**: GitHub as the single source of truth for all code and infrastructure
- **Free-first approach**: Leverage free tiers for development and validation
- **Phased scaling**: Upgrade services only when bottlenecks emerge
- **Infrastructure as Code**: Version-controlled, reproducible infrastructure
- **Parallel development**: Separate repositories for different components while sharing common libraries
- **Devin-ready**: Optimized for AI-assisted development workflows

---

## Repository Structure

### Organization

AFRERA codebase is organized into multiple repositories to enable parallel development while maintaining shared libraries:

```
afrera-platform          # Common platform libraries and shared components
afrera-web              # Public website
afrera-app              # Enterprise web application
afrera-desktop         # Desktop application
afrera-mobile          # Mobile application
afrera-api             # Backend APIs and services
afrera-ai              # AI models and services
afrera-docs            # Documentation
afrera-infrastructure  # Infrastructure as Code (IaC)
afrera-devops          # DevOps workflows and automation
afrera-design-system   # Design system and UI components

```

### Repository Details

#### afrera-platform

**Purpose**: Common platform libraries and shared components

**Contents**:
- Shared domain models
- Common utilities
- Shared authentication/authorization
- Shared API clients
- Common validation logic
- Shared constants and configurations
- Shared error handling
- Common logging utilities

**Dependencies**: None (base library)

**Dependents**: afrera-web, afrera-app, afrera-desktop, afrera-mobile, afrera-api

#### afrera-web

**Purpose**: Public website (digital experience platform)

**Contents**:
- Corporate website
- Product showcase
- Government schemes portal
- Farmer knowledge portal
- Marketplace catalog
- Investor portal
- CSR portal
- Partner portal
- Documentation
- Blogs
- News
- AI knowledge center
- Project showcase
- Success stories
- Interactive maps
- Public dashboards
- API documentation
- Developer portal

**Technology Stack**:
- Next.js 14+ (React)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Cloudflare Pages

**Dependencies**: afrera-platform, afrera-design-system

#### afrera-app

**Purpose**: Enterprise web application (operational platform)

**Contents**:
- ERP module
- CRM module
- Finance module
- Marketplace module
- Procurement module
- Inventory module
- Logistics module
- AI module
- Reports module
- Administration module

**Technology Stack**:
- Next.js 14+ (React)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Vercel

**Dependencies**: afrera-platform, afrera-design-system, afrera-api

#### afrera-desktop

**Purpose**: Desktop application for power users and operational centers

**Contents**:
- Offline operation
- Hardware integration (barcode scanners, QR scanners, receipt printers, label printers)
- Bulk operations
- Large-screen dashboards
- Multiple monitors
- File system access
- High-volume data entry

**Technology Stack**:
- Electron
- React
- TypeScript
- Tailwind CSS

**Dependencies**: afrera-platform, afrera-design-system, afrera-api

#### afrera-mobile

**Purpose**: Mobile application for field operations

**Contents**:
- Farmer registration
- Farm visits
- Geo-tagging
- GPS
- Camera
- Document upload
- Digital signatures
- Offline synchronization
- Notifications
- AI assistant
- Marketplace orders
- Expense capture
- Inspection checklists

**Technology Stack**:
- React Native
- TypeScript
- Expo

**Dependencies**: afrera-platform, afrera-design-system, afrera-api

#### afrera-api

**Purpose**: Backend APIs and services

**Contents**:
- API Gateway
- Business Services
- AI Engine
- Knowledge Graph
- Workflow Engine
- ERP Engine
- Forms Engine
- Identity & RBAC
- Notifications
- Analytics

**Technology Stack**:
- Node.js
- TypeScript
- Express / Fastify
- PostgreSQL
- Redis
- Oracle Cloud Always Free

**Dependencies**: afrera-platform, afrera-ai

#### afrera-ai

**Purpose**: AI models and services

**Contents**:
- Demand forecasting models
- Price projection models
- Crop recommendation models
- Risk assessment models
- Anomaly detection models
- Recommendation engine
- Decision support models
- Natural language processing models
- Computer vision models
- Predictive analytics models

**Technology Stack**:
- Python
- TensorFlow / PyTorch
- scikit-learn
- Oracle Cloud Always Free

**Dependencies**: afrera-platform

#### afrera-docs

**Purpose**: Documentation

**Contents**:
- Architecture documentation
- API documentation
- User documentation
- Developer documentation
- Training materials
- Release notes

**Technology Stack**:
- Markdown
- Docusaurus
- Cloudflare Pages

**Dependencies**: None

#### afrera-infrastructure

**Purpose**: Infrastructure as Code (IaC)

**Contents**:
- Docker configurations
- Kubernetes manifests (when needed)
- Terraform / OpenTofu infrastructure definitions
- GitHub Actions workflows
- Environment configuration
- Secrets management references
- Backup and disaster recovery automation
- Monitoring and alerting configuration
- Security policies
- Automated deployment pipelines

**Technology Stack**:
- Docker
- Kubernetes (when needed)
- Terraform / OpenTofu
- GitHub Actions
- Ansible

**Dependencies**: None

#### afrera-devops

**Purpose**: DevOps workflows and automation

**Contents**:
- CI/CD pipelines
- Testing automation
- Deployment automation
- Monitoring automation
- Backup automation
- Security scanning
- Performance testing
- Load testing

**Technology Stack**:
- GitHub Actions
- Docker
- Kubernetes (when needed)

**Dependencies**: afrera-infrastructure

#### afrera-design-system

**Purpose**: Design system and UI components

**Contents**:
- Design tokens
- Component library
- Style guide
- Accessibility guidelines
- Responsive design patterns
- Animation library
- Icon library

**Technology Stack**:
- React
- TypeScript
- Tailwind CSS
- Storybook

**Dependencies**: None

---

## Cloud Services

### Phase 1: Free Tier (Development and Validation)

#### Source Code

| Service | Free Tier | Purpose |
|---------|-----------|---------|
| GitHub | ✅ Yes | Git repositories, Issues, Projects, Pull Requests |
| GitHub Actions | ✅ Included | Automated builds and testing |
| GitHub Codespaces | ✅ Limited free usage | Cloud development environment |

#### Static Website

| Service | Free Tier | Purpose |
|---------|-----------|---------|
| Cloudflare Pages | ✅ Yes | Corporate website, documentation, landing pages |

#### Web Hosting

| Service | Free Tier | Purpose |
|---------|-----------|---------|
| Vercel | ✅ Yes | Frontend deployment (afrera-app) |
| Netlify | ✅ Yes | Alternative frontend deployment |

#### Backend Hosting

| Service | Free Tier | Purpose |
|---------|-----------|---------|
| Oracle Cloud Always Free | ✅ Yes | APIs and backend services |

#### Container Hosting

| Service | Free Tier | Purpose |
|---------|-----------|---------|
| Google Cloud Run | ✅ Limited | Microservices (when needed) |

#### Object Storage

| Service | Free Tier | Purpose |
|---------|-----------|---------|
| Cloudflare R2 | ✅ Generous free tier | Images, documents, backups |

#### Database

| Service | Free Tier | Purpose |
|---------|-----------|---------|
| Supabase | ✅ Yes | PostgreSQL, authentication, storage |

#### Cache

| Service | Free Tier | Purpose |
|---------|-----------|---------|
| Upstash Redis | ✅ Yes | Redis caching |

#### Search

| Service | Free Tier | Purpose |
|---------|-----------|---------|
| Meilisearch | ✅ Self-host | Full-text search |

#### Monitoring

| Service | Free Tier | Purpose |
|---------|-----------|---------|
| Grafana Cloud | ✅ Yes | Metrics and dashboards |

#### Error Tracking

| Service | Free Tier | Purpose |
|---------|-----------|---------|
| Sentry | ✅ Yes | Application monitoring |

### Phase 2: Pilot (Limited Production)

Upgrade only services that become bottlenecks while keeping architecture unchanged:

- **GitHub Actions**: Upgrade to paid plan for increased CI/CD minutes
- **Cloudflare R2**: Upgrade for increased storage
- **Supabase**: Upgrade for increased database capacity
- **Oracle Cloud**: Upgrade to paid tier for increased compute
- **Vercel**: Upgrade to Pro plan for increased bandwidth and build minutes

### Phase 3: Production (Enterprise-Grade)

Move to enterprise-grade infrastructure:

- **Kubernetes**: Container orchestration
- **Managed databases**: AWS RDS, Google Cloud SQL, or Azure Database
- **CDN**: Cloudflare Enterprise or AWS CloudFront
- **Centralized observability**: Datadog, New Relic, or Splunk
- **Backups**: Automated backup solutions
- **Disaster recovery**: Multi-region deployment

---

## Infrastructure as Code (IaC)

### afrera-infrastructure Repository Structure

```
afrera-infrastructure/
├── docker/
│   ├── afrera-api/
│   │   ├── Dockerfile
│   │   ├── docker-compose.yml
│   │   └── .dockerignore
│   ├── afrera-ai/
│   │   ├── Dockerfile
│   │   ├── docker-compose.yml
│   │   └── .dockerignore
│   └── afrera-app/
│       ├── Dockerfile
│       ├── docker-compose.yml
│       └── .dockerignore
├── kubernetes/
│   ├── base/
│   │   ├── afrera-api-deployment.yaml
│   │   ├── afrera-api-service.yaml
│   │   ├── afrera-ai-deployment.yaml
│   │   └── afrera-ai-service.yaml
│   ├── overlays/
│   │   ├── development/
│   │   ├── staging/
│   │   └── production/
│   └── helm/
│       └── afrera/
│           ├── Chart.yaml
│           ├── values.yaml
│           └── templates/
├── terraform/
│   ├── modules/
│   │   ├── network/
│   │   ├── database/
│   │   ├── storage/
│   │   └── compute/
│   ├── environments/
│   │   ├── development/
│   │   ├── staging/
│   │   └── production/
│   └── main.tf
├── github-actions/
│   ├── ci.yml
│   ├── cd.yml
│   ├── security-scan.yml
│   ├── performance-test.yml
│   └── backup.yml
├── ansible/
│   ├── playbooks/
│   ├── roles/
│   └── inventory/
├── monitoring/
│   ├── prometheus/
│   ├── grafana/
│   └── alerts/
├── security/
│   ├── policies/
│   ├── scans/
│   └── compliance/
├── backups/
│   ├── scripts/
│   ├── schedules/
│   └── retention/
└── README.md

```

### Docker Configurations

#### afrera-api Dockerfile

```dockerfile

FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["npm", "start"]

```

#### afrera-ai Dockerfile

```dockerfile

FROM python:3.11-slim AS builder
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

FROM python:3.11-slim AS runner
WORKDIR /app
COPY --from=builder /app ./
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

```

### Terraform Configurations

#### main.tf

```hcl

terraform {
  required_version = ">= 1.0"
  required_providers {
    oracle = {
      source  = "oracle/oci"
      version = "~> 5.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.0"
    }
  }
  backend "s3" {
    bucket = "afrera-terraform-state"
    key    = "infrastructure/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "oracle" {
  region = var.oracle_region
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

provider "supabase" {
  access_token = var.supabase_access_token
}

```

### Kubernetes Manifests

#### afrera-api-deployment.yaml

```yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: afrera-api
  labels:
    app: afrera-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: afrera-api
  template:
    metadata:
      labels:
        app: afrera-api
    spec:
      containers:
      - name: afrera-api
        image: afrera-api:latest
        ports:
        - containerPort: 3000
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: afrera-secrets
              key: database-url

```

---

## CI/CD Pipelines

### GitHub Actions Workflows

#### CI Pipeline (.github/workflows/ci.yml)

```yaml

name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test
      - run: npm run lint
      - run: npm run build

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm audit
      - uses: github/super-linter@v4

```

#### CD Pipeline (.github/workflows/cd.yml)

```yaml

name: CD

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'

```

---

## Environment Configuration

### Environment Variables

#### Development (.env.development)

```env

DATABASE_URL=postgresql://user:password@localhost:5432/afrera_dev
REDIS_URL=redis://localhost:6379
API_URL=http://localhost:3000
AI_URL=http://localhost:8000
LOG_LEVEL=debug

```

#### Staging (.env.staging)

```env

DATABASE_URL=${DATABASE_URL}
REDIS_URL=${REDIS_URL}
API_URL=https://api-staging.afrera.com
AI_URL=https://ai-staging.afrera.com
LOG_LEVEL=info

```

#### Production (.env.production)

```env

DATABASE_URL=${DATABASE_URL}
REDIS_URL=${REDIS_URL}
API_URL=https://api.afrera.com
AI_URL=https://ai.afrera.com
LOG_LEVEL=warn

```

### Secrets Management

#### GitHub Secrets

- `DATABASE_URL`
- `REDIS_URL`
- `CLOUDFLARE_API_TOKEN`
- `SUPABASE_ACCESS_TOKEN`
- `VERCEL_TOKEN`
- `ORG_ID`
- `PROJECT_ID`
- `ORACLE_CLOUD_API_KEY`

---

## Monitoring and Observability

### Grafana Cloud

**Dashboards**:
- API Performance
- Database Performance
- AI Model Performance
- Error Rates
- User Activity
- System Resources

**Alerts**:
- API response time > 500ms
- Error rate > 5%
- Database connection pool exhausted
- AI model latency > 10s
- Disk space < 10%

### Sentry

**Error Tracking**:
- JavaScript errors
- API errors
- Database errors
- AI model errors
- Integration errors

**Performance Monitoring**:
- Transaction tracing
- Database query performance
- API endpoint performance
- User session replay

---

## Backup and Disaster Recovery

### Backup Strategy

**Database Backups**:
- Daily full backups
- Hourly incremental backups
- 30-day retention
- Off-site storage (Cloudflare R2)

**Code Backups**:
- GitHub repository (primary)
- Cloudflare R2 (secondary)
- Daily snapshots

**Configuration Backups**:
- Terraform state
- Kubernetes manifests
- Environment variables
- Secrets

### Disaster Recovery

**RTO (Recovery Time Objective)**: 4 hours  
**RPO (Recovery Point Objective)**: 1 hour

**Recovery Steps**:
1. Restore database from latest backup
2. Deploy application from latest commit
3. Restore configuration
4. Verify functionality
5. Switch DNS to recovered environment

---

## Security

### Security Policies

**Code Security**:
- Static code analysis (Super-Linter)
- Dependency scanning (npm audit)
- Secret scanning (GitHub Advanced Security)
- Security code reviews

**Infrastructure Security**:
- Network security groups
- Firewall rules
- TLS encryption
- Secrets management
- Access control

**Application Security**:
- OWASP Top 10 compliance
- Authentication (OAuth 2.0, JWT)
- Authorization (RBAC)
- Data encryption at rest
- Data encryption in transit

### Security Scanning

**GitHub Actions Workflow** (.github/workflows/security-scan.yml)

```yaml

name: Security Scan

on:
  push:
    branches: [ main, develop ]
  schedule:
    - cron: '0 0 * * *'

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm audit
      - uses: github/super-linter@v4
      - uses: trivy-actions/scan@master

```

---

## Deployment Strategy

### Phase 1: Development

**Environments**:
- Development (local)
- Staging (Cloudflare Pages, Vercel, Oracle Cloud)

**Deployment**:
- Manual deployment to staging
- Automated testing
- Manual approval for production

### Phase 2: Pilot

**Environments**:
- Development (local)
- Staging (Cloudflare Pages, Vercel, Oracle Cloud)
- Production (upgraded services)

**Deployment**:
- Automated deployment to staging
- Automated testing
- Manual approval for production
- Blue-green deployment

### Phase 3: Production

**Environments**:
- Development (local)
- Staging (Kubernetes cluster)
- Production (Kubernetes cluster, multi-region)

**Deployment**:
- Automated deployment to staging
- Automated testing
- Automated approval for production
- Canary deployment
- Rollback capability

---

## Cost Estimation

### Phase 1: Free Tier

**Monthly Cost**: $0

**Included Services**:
- GitHub (free)
- GitHub Actions (included)
- GitHub Codespaces (limited free)
- Cloudflare Pages (free)
- Vercel (free)
- Oracle Cloud Always Free (free)
- Supabase (free)
- Upstash Redis (free)
- Meilisearch (self-host)
- Grafana Cloud (free)
- Sentry (free)

### Phase 2: Pilot

**Estimated Monthly Cost**: $200-500

**Upgraded Services**:
- GitHub Actions: $20-50
- Cloudflare R2: $50-100
- Supabase: $25-50
- Oracle Cloud: $100-200
- Vercel: $20-100

### Phase 3: Production

**Estimated Monthly Cost**: $5,000-20,000

**Enterprise Services**:
- Kubernetes cluster: $1,000-5,000
- Managed databases: $500-2,000
- CDN: $500-2,000
- Observability: $500-2,000
- Backup and disaster recovery: $500-2,000
- Load balancers: $500-2,000
- Support and maintenance: $1,000-5,000

---

## Devin Integration

### Devin Workflow

Devin can work with Git-based workflows by:

1. **Cloning repositories**: Clone specific repositories based on task
2. **Creating feature branches**: Create branches for each task
3. **Implementing features**: Implement features in appropriate repositories
4. **Running tests**: Run tests locally and in CI
5. **Opening pull requests**: Open PRs for review
6. **Reviewing code**: Review code and provide feedback
7. **Refactoring**: Refactor code across repositories
8. **Updating documentation**: Update documentation in afrera-docs
9. **Fixing bugs**: Fix bugs across repositories
10. **Running CI/CD workflows**: Trigger and monitor CI/CD workflows

### Devin-Specific Configurations

**GitHub Integration**:
- GitHub App for Devin
- Repository access permissions
- Branch protection rules
- Required status checks

**Codespaces Integration**:
- Pre-configured devcontainers
- Required extensions
- Environment variables
- SSH keys

**CI/CD Integration**:
- GitHub Actions workflows
- Automated testing
- Automated deployment
- Rollback notifications

---

## Success Metrics

### Infrastructure Metrics

- **Deployment Success Rate**: Target 99%
- **Deployment Time**: Target < 10 minutes
- **Uptime**: Target 99.9%
- **Recovery Time**: Target < 4 hours
- **Backup Success Rate**: Target 100%

### Development Metrics

- **CI/CD Pipeline Success Rate**: Target 95%
- **Test Coverage**: Target 80%
- **Code Review Time**: Target < 24 hours
- **Bug Fix Time**: Target < 48 hours
- **Feature Delivery Time**: Target < 2 weeks

### Security Metrics

- **Vulnerability Response Time**: Target < 24 hours
- **Security Scan Success Rate**: Target 100%
- **Compliance Rate**: Target 100%
- **Security Incident Rate**: Target 0

---

## Conclusion

This Development Infrastructure Specification provides a comprehensive, cost-effective approach to building and deploying AFRERA. By leveraging free cloud services for development and validation, and scaling to enterprise-grade infrastructure only when needed, AFRERA can minimize costs while maintaining the flexibility to grow.

The Infrastructure as Code approach ensures that the entire platform—from source code to cloud infrastructure—is version-controlled, reproducible, and easier to maintain over time. This makes the platform well-suited for AI-assisted development workflows with Devin, enabling systematic, parallel development across multiple repositories.

The phased approach (Free → Pilot → Production) allows AFRERA to validate the platform architecture and business value before committing to significant infrastructure investments, while maintaining the ability to scale seamlessly as usage grows.

---

**Document Status**: Complete  
**Next Steps**: Awaiting approval to begin Phase 1 infrastructure setup
