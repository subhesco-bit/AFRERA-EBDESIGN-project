# AFRERA Development Stack Setup Guide
## Enterprise Platform Development Environment

**Setup Date**: August 2, 2026  
**Project**: AFRERA Enterprise Platform  
**Purpose**: Complete development environment setup for Devin AI-assisted development

---

## Current Installation Status

### ✅ Already Installed

- **Git**: Version 2.55.0.3 (C:\Program Files\Git\cmd\git.exe)
- **Python**: Installed (C:\Users\DIYA GOEL\AppData\Local\Microsoft\WindowsApps\python.exe)

### ❌ Not Installed / Needs Installation

- **VS Code**: Not found
- **Node.js**: Not found
- **Docker Desktop**: Not found
- **PostgreSQL**: Not found
- **Redis**: Not found
- **NVM**: Not found

---

## Tier 0 – Foundation Installation (Mandatory)

### 1. VS Code Installation (High Priority)

**Status**: Not Installed  
**Importance**: ⭐⭐⭐⭐⭐  
**Installation Method**: Direct Download

```powershell


# Download VS Code

Invoke-WebRequest -Uri "https://code.visualstudio.com/win32/user/latest/stable" -OutFile "$env:TEMP\VSCodeUserSetup.exe"

# Install

Start-Process "$env:TEMP\VSCodeUserSetup.exe"

```

**Recommended Extensions for AFRERA**:
- GitLens (Git history)
- Error Lens (Inline errors)
- Docker (Container management)
- Markdown All in One (Documentation)
- YAML (YAML editing)
- Thunder Client (API testing)
- EditorConfig (Consistent formatting)
- Prettier (Code formatting)
- ESLint (JavaScript/TypeScript linting)
- Python (Python support)

### 2. Node.js Installation (High Priority)

**Status**: Not Installed  
**Importance**: ⭐⭐⭐⭐⭐  
**Installation Method**: NVM (Recommended) or Direct

#### Option A: Using NVM (Recommended)


```powershell


# Download nvm-windows

Invoke-WebRequest -Uri "https://github.com/coreybutler/nvm-windows/releases/download/1.1.12/nvm-setup.exe" -OutFile "$env:TEMP\nvm-setup.exe"

# Install nvm-windows

Start-Process "$env:TEMP\nvm-setup.exe"

# After installation and terminal restart:

nvm install 22.18.0
nvm use 22.18.0
node -v
npm -v

```

#### Option B: Direct Installation


```powershell


# Download Node.js 22.18.0

Invoke-WebRequest -Uri "https://nodejs.org/dist/v22.18.0/node-v22.18.0-x64.msi" -OutFile "$env:TEMP\node-v22.18.0-x64.msi"

# Install

Start-Process "$env:TEMP\node-v22.18.0-x64.msi"

```

### 3. Docker Desktop Installation (High Priority)

**Status**: Not Installed  
**Importance**: ⭐⭐⭐⭐⭐  
**Installation Method**: Direct Download

```powershell


# Download Docker Desktop

Invoke-WebRequest -Uri "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe" -OutFile "$env:TEMP\DockerDesktopInstaller.exe"

# Install

Start-Process "$env:TEMP\DockerDesktopInstaller.exe"

```

**Post-Installation**:
- Restart computer
- Start Docker Desktop
- Enable WSL 2 integration
- Verify: `docker --version`

### 4. PostgreSQL Installation (High Priority)

**Status**: Not Installed  
**Importance**: ⭐⭐⭐⭐⭐  
**Installation Method**: Direct Download or Docker

#### Option A: Direct Installation


```powershell


# Download PostgreSQL

Invoke-WebRequest -Uri "https://get.enterprisedb.com/postgresql/postgresql-16.3-1-windows-x64.exe" -OutFile "$env:TEMP\postgresql-16.3-1-windows-x64.exe"

# Install

Start-Process "$env:TEMP\postgresql-16.3-1-windows-x64.exe"

```

#### Option B: Docker (Recommended for Development)


```powershell


# Run PostgreSQL in Docker

docker run --name afrera-postgres -e POSTGRES_PASSWORD=afrera123 -p 5432:5432 -d postgres:16

```

### 5. Redis Installation (High Priority)

**Status**: Not Installed  
**Importance**: ⭐⭐⭐⭐⭐  
**Installation Method**: Docker (Recommended)

```powershell


# Run Redis in Docker

docker run --name afrera-redis -p 6379:6379 -d redis:7

```

---

## Tier 1 – Development Environment

### 6. NVM Installation (Already covered in Node.js section)

**Status**: Pending (choose Option A above)

### 7. pnpm Installation


```powershell


# After Node.js installation

npm install -g pnpm
pnpm --version

```

### 8. Python Package Manager (uv)


```powershell


# Install uv

pip install uv
uv --version

```

### 9. Development Tools Installation


```powershell


# Ruff (Python linting)

pip install ruff

# Prettier (Code formatting)

npm install -g prettier

# ESLint (JavaScript/TypeScript linting)

npm install -g eslint

# TypeScript

npm install -g typescript

```

---

## Tier 2 – API Development

### 10. Bruno Installation


```powershell


# Download Bruno

Invoke-WebRequest -Uri "https://github.com/usebruno/bruno/releases/download/v1.20.0/bruno_1.20.0_windows_x64.exe" -OutFile "$env:TEMP\bruno-setup.exe"

# Install

Start-Process "$env:TEMP\bruno-setup.exe"

```

---

## Tier 3 – Database Stack

### 11. DBeaver CE Installation


```powershell


# Download DBeaver

Invoke-WebRequest -Uri "https://dbeaver.io/files/dbeaver-ce-latest-x86_64-setup.exe" -OutFile "$env:TEMP\dbeaver-setup.exe"

# Install

Start-Process "$env:TEMP\dbeaver-setup.exe"

```

### 12. pgAdmin Installation (Optional)


```powershell


# Download pgAdmin

Invoke-WebRequest -Uri "https://ftp.postgresql.org/pub/pgadmin/pgadmin4/pgadmin4-8.11-x64.exe" -OutFile "$env:TEMP\pgadmin4-setup.exe"

# Install

Start-Process "$env:TEMP\pgadmin4-setup.exe"

```

---

## Tier 4 – Architecture & Documentation

### 13. PlantUML Installation


```powershell


# PlantUML requires Java
# Install Java first if not available

# Download PlantUML

Invoke-WebRequest -Uri "https://github.com/plantuml/plantuml/releases/download/v1.2024.5/plantuml-1.2024.5.jar" -OutFile "$env:TEMP\plantuml.jar"

# Create shortcut for PlantUML
# Usage: java -jar plantuml.jar diagram.puml


```

### 14. MkDocs Installation


```powershell


# Install MkDocs

pip install mkdocs mkdocs-material

# Verify

mkdocs --version

```

---

## Tier 5 – Testing

### 15. Playwright Installation


```powershell


# Install Playwright

npm install -g @playwright/test

# Install browsers

npx playwright install

```

### 16. Jest Installation


```powershell


# Install Jest

npm install -g jest

```

### 17. PyTest Installation


```powershell


# Install PyTest

pip install pytest

```

---

## Tier 6 – Code Quality

### 18. SonarQube Community Installation


```powershell


# Run SonarQube in Docker

docker run -d --name sonarqube -p 9000:9000 sonarqube/lts-community

# Access at http://localhost:9000
# Default credentials: admin/admin


```

### 19. Semgrep Installation


```powershell


# Install Semgrep

pip install semgrep

# Initialize

semgrep init

```

### 20. Trivy Installation


```powershell


# Run Trivy in Docker

docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -v $(pwd):/app aquasec/trivy image your-image-name

```

---

## Tier 7 – AI Tools

### 21. Ollama Installation


```powershell


# Download Ollama

Invoke-WebRequest -Uri "https://ollama.com/download/OllamaSetup.exe" -OutFile "$env:TEMP\OllamaSetup.exe"

# Install

Start-Process "$env:TEMP\OllamaSetup.exe"

# After installation, pull models

ollama pull llama3
ollama pull codellama

```

### 22. Qdrant Installation


```powershell


# Run Qdrant in Docker

docker run -d --name qdrant -p 6333:6333 qdrant/qdrant

```

---

## Tier 8 – DevOps

### 23. Docker Compose

**Included with Docker Desktop**

### 24. MinIO Installation


```powershell


# Run MinIO in Docker

docker run -d --name minio -p 9000:9000 -p 9001:9001 -e MINIO_ROOT_USER=admin -e MINIO_ROOT_PASSWORD=admin123 minio/minio server /data --console-address ":9001"

```

---

## Tier 9 – Monitoring

### 25. Grafana Installation


```powershell


# Run Grafana in Docker

docker run -d --name grafana -p 3000:3000 grafana/grafana

# Access at http://localhost:3000
# Default credentials: admin/admin


```

### 26. Prometheus Installation


```powershell


# Run Prometheus in Docker

docker run -d --name prometheus -p 9090:9090 prom/prometheus

```

---

## Tier 10 – Search

### 27. Meilisearch Installation


```powershell


# Run Meilisearch in Docker

docker run -d --name meilisearch -p 7700:7700 getmeili/meilisearch

```

---

## AFRERA-Specific Configuration

### Environment Variables Setup


```powershell


# Add to System Environment Variables

AFRERA_ENV=development
AFRERA_DB_HOST=localhost
AFRERA_DB_PORT=5432
AFRERA_DB_NAME=afrera
AFRERA_DB_USER=afrera
AFRERA_DB_PASSWORD=afrera123
AFRERA_REDIS_HOST=localhost
AFRERA_REDIS_PORT=6379
AFRERA_MINIO_ENDPOINT=localhost:9000
AFRERA_MINIO_ACCESS_KEY=admin
AFRERA_MINIO_SECRET_KEY=admin123

```

### Project Structure Setup


```powershell


# Create AFRERA project structure

mkdir C:\AFRERA
cd C:\AFRERA

# Initialize Git repository

git init

# Create project directories

mkdir src
mkdir tests
mkdir docs
mkdir scripts
mkdir docker
mkdir deployments

```

---

## Recommended Installation Order

### Phase 1: Foundation (Immediate)

1. ✅ Git (Already installed)
2. ❌ VS Code (High Priority)
3. ❌ Node.js 22.18.0 (High Priority)
4. ✅ Python (Already installed)
5. ❌ Docker Desktop (High Priority)

### Phase 2: Database & Tools (After Foundation)

6. ❌ PostgreSQL (High Priority)
7. ❌ Redis (High Priority)
8. ❌ DBeaver CE (Medium Priority)
9. ❌ pnpm (After Node.js)
10. ❌ Development tools (After Node.js/Python)

### Phase 3: Development & Testing (After Phase 2)

11. ❌ Bruno (Medium Priority)
12. ❌ Playwright (Medium Priority)
13. ❌ Jest (Medium Priority)
14. ❌ PyTest (Medium Priority)

### Phase 4: Quality & AI (After Phase 3)

15. ❌ SonarQube (Low Priority)
16. ❌ Semgrep (Low Priority)
17. ❌ Ollama (Low Priority)
18. ❌ Qdrant (Low Priority)

### Phase 5: Monitoring & Infrastructure (After Phase 4)

19. ❌ Grafana (Low Priority)
20. ❌ Prometheus (Low Priority)
21. ❌ MinIO (Low Priority)
22. ❌ Meilisearch (Low Priority)

---

## Devin Integration Benefits

### High Impact Tools for Devin

These tools directly increase Devin's capabilities:

1. **Git** - Version control, commits, branches
2. **Node.js** - Run JavaScript/TypeScript projects
3. **Python** - Scripts, automation, AI utilities
4. **Docker** - Reproducible environments
5. **PostgreSQL** - Database operations
6. **Redis** - Cache operations
7. **Playwright** - Browser automation testing
8. **SonarQube** - Code quality analysis
9. **Semgrep** - Security scanning
10. **PlantUML** - Architecture diagrams
11. **MkDocs** - Documentation generation

### Moderate Impact Tools

1. **Bruno** - API testing
2. **DBeaver** - Database management
3. **Grafana** - Monitoring dashboards
4. **MinIO** - Object storage

---

## Quick Start Commands

### After Completing Phase 1 Installation:


```powershell


# Verify installations

git --version
code --version
node -v
npm -v
python --version
docker --version

# Create AFRERA project

cd C:\
mkdir AFRERA
cd AFRERA
git init
git remote add origin <your-github-repo>

```

### After Completing Phase 2 Installation:


```powershell


# Start development services

docker start afrera-postgres
docker start afrera-redis

# Verify database connectivity

docker exec -it afrera-postgres psql -U postgres -c "SELECT version();"

```

### After Completing Phase 3 Installation:


```powershell


# Install project dependencies

npm install
pnpm install

# Run tests

npm test
pytest

# Run linting

eslint src/
ruff check src/

```

---

## Next Steps

1. **Complete Phase 1 Foundation Installation** (VS Code, Node.js, Docker)
2. **Verify all installations** using the commands above
3. **Set up GitHub repository** for AFRERA project
4. **Configure environment variables** for local development
5. **Initialize project structure** as outlined above
6. **Proceed to Phase 2** after Phase 1 is complete

---

## Troubleshooting

### Common Issues

**Node.js not found after installation**:
- Restart terminal or computer
- Add Node.js to PATH manually
- Use nvm instead of direct installation

**Docker not starting**:
- Ensure WSL 2 is enabled
- Restart Docker Desktop
- Check Windows Hypervisor Platform is enabled

**PostgreSQL connection issues**:
- Verify Docker container is running: `docker ps`
- Check port 5432 is not in use
- Verify connection string parameters

**Permission issues**:
- Run PowerShell as Administrator
- Check file/folder permissions
- Use User Account Control settings

---

## Additional Resources

- **VS Code Documentation**: https://code.visualstudio.com/docs
- **Node.js Documentation**: https://nodejs.org/docs
- **Docker Documentation**: https://docs.docker.com
- **PostgreSQL Documentation**: https://www.postgresql.org/docs
- **Git Documentation**: https://git-scm.com/doc

---

**Setup Guide Status**: Ready for Execution  
**Next Priority**: Phase 1 Foundation Installation  
**Estimated Time**: 2-3 hours for complete Phase 1