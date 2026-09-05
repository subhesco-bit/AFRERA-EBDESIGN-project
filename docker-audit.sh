#!/bin/bash
###############################################################################
# DOCKER ECOSYSTEM AUDIT & REPAIR SCRIPT
# Purpose: Comprehensive verification of Docker setup, images, and services
# Compliance: Audit-ready documentation with reproducible commands
###############################################################################

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
TIMESTAMP=$(date '+%Y-%m-%d_%H-%M-%S')
AUDIT_REPORT="docker-audit-report-${TIMESTAMP}.md"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# LOGGING FUNCTIONS
# ============================================================================

log_header() {
  echo -e "${BLUE}===================================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}===================================================${NC}"
  echo "$1" >> "$AUDIT_REPORT"
  echo "" >> "$AUDIT_REPORT"
}

log_section() {
  echo -e "${YELLOW}>> $1${NC}"
  echo "### $1" >> "$AUDIT_REPORT"
  echo "" >> "$AUDIT_REPORT"
}

log_success() {
  echo -e "${GREEN}✅ $1${NC}"
  echo "✅ $1" >> "$AUDIT_REPORT"
}

log_error() {
  echo -e "${RED}❌ $1${NC}"
  echo "❌ $1" >> "$AUDIT_REPORT"
}

log_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
  echo "ℹ️  $1" >> "$AUDIT_REPORT"
}

log_raw() {
  echo "$1" >> "$AUDIT_REPORT"
}

# ============================================================================
# PHASE 1: ENVIRONMENT & DEPENDENCIES
# ============================================================================

audit_environment() {
  log_header "PHASE 1: ENVIRONMENT & DEPENDENCIES AUDIT"
  
  log_section "Docker Installation"
  if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    log_success "Docker installed: $DOCKER_VERSION"
    log_raw "\`\`\`"
    log_raw "$DOCKER_VERSION"
    log_raw "\`\`\`"
  else
    log_error "Docker not found"
    exit 1
  fi

  log_section "Docker Compose Installation"
  if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version)
    log_success "Docker Compose installed: $COMPOSE_VERSION"
    log_raw "\`\`\`"
    log_raw "$COMPOSE_VERSION"
    log_raw "\`\`\`"
  else
    log_error "Docker Compose not found"
  fi

  log_section "Docker Daemon Status"
  if docker ps &>/dev/null; then
    log_success "Docker daemon running"
  else
    log_error "Docker daemon not running"
    exit 1
  fi

  log_section ".env File Validation"
  if [ -f ".env" ]; then
    log_success ".env file exists"
    log_info "Checking required variables..."
    REQUIRED_VARS=("DB_USER" "DB_PASSWORD" "DB_NAME" "ANTHROPIC_API_KEY")
    for var in "${REQUIRED_VARS[@]}"; do
      if grep -q "^${var}=" .env; then
        log_success "$var is set"
      else
        log_error "$var is NOT set"
      fi
    done
  else
    log_error ".env file not found"
  fi
}

# ============================================================================
# PHASE 2: DOCKERFILE ANALYSIS
# ============================================================================

audit_dockerfiles() {
  log_header "PHASE 2: DOCKERFILE ANALYSIS"
  
  log_section "Backend Dockerfile"
  if [ -f "backend/Dockerfile" ]; then
    log_success "backend/Dockerfile exists"
    log_raw "\`\`\`dockerfile"
    cat backend/Dockerfile >> "$AUDIT_REPORT"
    log_raw "\`\`\`"
  else
    log_error "backend/Dockerfile not found"
  fi

  log_section "Frontend Dockerfile"
  if [ -f "frontend/Dockerfile" ]; then
    log_success "frontend/Dockerfile exists"
    log_raw "\`\`\`dockerfile"
    cat frontend/Dockerfile >> "$AUDIT_REPORT"
    log_raw "\`\`\`"
  else
    log_error "frontend/Dockerfile not found"
  fi

  log_section "Multi-stage Build Verification"
  if grep -q "^FROM.*AS" backend/Dockerfile; then
    log_success "Backend uses multi-stage build"
  else
    log_error "Backend does NOT use multi-stage build"
  fi

  log_section ".dockerignore Validation"
  if [ -f ".dockerignore" ]; then
    log_success ".dockerignore exists"
    log_raw "\`\`\`"
    wc -l .dockerignore | awk '{print $1 " patterns"}' >> "$AUDIT_REPORT"
    log_raw "\`\`\`"
  else
    log_error ".dockerignore not found"
  fi
}

# ============================================================================
# PHASE 3: DOCKER COMPOSE VALIDATION
# ============================================================================

audit_docker_compose() {
  log_header "PHASE 3: DOCKER COMPOSE VALIDATION"
  
  log_section "docker-compose.yml Structure"
  if [ -f "docker-compose.yml" ]; then
    log_success "docker-compose.yml exists"
    
    log_info "Checking services defined..."
    SERVICES=$(grep -E "^  [a-z_]+:$" docker-compose.yml | awk '{print $1}' | tr -d ':' | sort)
    for service in $SERVICES; do
      log_success "Service: $service"
    done
  else
    log_error "docker-compose.yml not found"
  fi

  log_section "Health Checks"
  if grep -q "healthcheck:" docker-compose.yml; then
    log_success "Health checks configured"
    log_info "Services with health checks:"
    grep -B5 "healthcheck:" docker-compose.yml | grep -E "^  [a-z_]+:" | awk '{print "  - " $1}' >> "$AUDIT_REPORT"
  else
    log_error "No health checks found in docker-compose.yml"
  fi
}

# ============================================================================
# PHASE 4: SCRIPT & ENTRYPOINT VALIDATION
# ============================================================================

audit_scripts() {
  log_header "PHASE 4: STARTUP SCRIPTS VALIDATION"
  
  log_section "Backend Entrypoint"
  if [ -f "backend/entrypoint.sh" ]; then
    log_success "backend/entrypoint.sh exists"
    if [ -x "backend/entrypoint.sh" ]; then
      log_success "entrypoint.sh is executable"
    else
      log_error "entrypoint.sh is NOT executable"
    fi
  else
    log_error "backend/entrypoint.sh not found"
  fi

  log_section "Migration Runner"
  if [ -f "backend/src/database/migrate.js" ]; then
    log_success "backend/src/database/migrate.js exists"
  else
    log_error "backend/src/database/migrate.js not found"
  fi

  log_section "Migrations Directory"
  if [ -d "backend/migrations" ]; then
    MIGRATION_COUNT=$(ls -1 backend/migrations/*.sql 2>/dev/null | wc -l)
    log_success "Migrations directory exists with $MIGRATION_COUNT SQL files"
  else
    log_error "backend/migrations directory not found"
  fi
}

# ============================================================================
# PHASE 5: CURRENT CONTAINER STATE
# ============================================================================

audit_containers() {
  log_header "PHASE 5: CURRENT CONTAINER STATE"
  
  log_section "Running Containers"
  RUNNING=$(docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}")
  if [ -z "$RUNNING" ]; then
    log_info "No containers currently running"
  else
    log_success "Running containers:"
    log_raw "\`\`\`"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" >> "$AUDIT_REPORT"
    log_raw "\`\`\`"
  fi

  log_section "All Containers (Running & Stopped)"
  log_raw "\`\`\`"
  docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Image}}" >> "$AUDIT_REPORT"
  log_raw "\`\`\`"

  log_section "Container Logs (Backend)"
  if docker ps -a --format "{{.Names}}" | grep -q "ebdesign-backend"; then
    log_success "Backend container found"
    log_raw "\`\`\`"
    docker logs ebdesign-backend --tail 20 2>&1 >> "$AUDIT_REPORT" || true
    log_raw "\`\`\`"
  fi
}

# ============================================================================
# PHASE 6: IMAGE ANALYSIS
# ============================================================================

audit_images() {
  log_header "PHASE 6: DOCKER IMAGES ANALYSIS"
  
  log_section "Local Images"
  log_raw "\`\`\`"
  docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}" >> "$AUDIT_REPORT"
  log_raw "\`\`\`"

  log_section "Image Build Verification"
  for image in "ebdesign-backend" "ebdesign-frontend"; do
    if docker images --format "{{.Repository}}" | grep -q "^$image$"; then
      SIZE=$(docker images --format "{{.Size}}" --filter "reference=$image" | head -1)
      log_success "Image $image exists (Size: $SIZE)"
    else
      log_error "Image $image not found"
    fi
  done
}

# ============================================================================
# PHASE 7: SECURITY SCANNING (OPTIONAL - if trivy available)
# ============================================================================

audit_security() {
  log_header "PHASE 7: SECURITY SCANNING"
  
  if command -v trivy &> /dev/null; then
    log_section "Trivy Vulnerability Scan"
    log_info "Scanning backend image..."
    log_raw "\`\`\`"
    trivy image ebdesign-backend:latest 2>&1 | head -50 >> "$AUDIT_REPORT" || true
    log_raw "\`\`\`"
  else
    log_info "Trivy not installed (optional). Install with: curl https://github.com/aquasecurity/trivy/releases/download/.../trivy_Linux_x86_64.tar.gz"
  fi

  if command -v docker &> /dev/null && docker version --format "{{.Server.Experimental}}" | grep -q "true"; then
    log_section "Docker Scan"
    log_raw "\`\`\`"
    docker scan ebdesign-backend:latest 2>&1 | head -50 >> "$AUDIT_REPORT" || true
    log_raw "\`\`\`"
  fi
}

# ============================================================================
# PHASE 8: REPRODUCIBILITY TEST
# ============================================================================

audit_reproducibility() {
  log_header "PHASE 8: REPRODUCIBILITY TEST"
  
  log_section "Fresh Build Test"
  log_info "Testing clean build of backend image..."
  log_raw "\`\`\`"
  echo "Command: docker build -f backend/Dockerfile -t ebdesign-backend:latest --no-cache . 2>&1 | tail -20" >> "$AUDIT_REPORT"
  log_raw "\`\`\`"
  log_info "Execution: Deferred to manual run (long-running operation)"
  
  log_section "Compose Up Test"
  log_raw "\`\`\`bash"
  log_raw "# Test reproducible startup"
  log_raw "docker-compose down -v"
  log_raw "docker-compose up -d"
  log_raw "sleep 30"
  log_raw "docker-compose ps"
  log_raw "docker-compose logs --tail=20"
  log_raw "\`\`\`"
}

# ============================================================================
# PHASE 9: SUMMARY & RECOMMENDATIONS
# ============================================================================

audit_summary() {
  log_header "PHASE 9: AUDIT SUMMARY & RECOMMENDATIONS"
  
  log_section "Checklist"
  log_raw "- [ ] All Dockerfiles present and use multi-stage builds"
  log_raw "- [ ] Health checks configured for all services"
  log_raw "- [ ] Entrypoint scripts exist and are executable"
  log_raw "- [ ] Migrations directory populated with .sql files"
  log_raw "- [ ] .env file configured with all required variables"
  log_raw "- [ ] .dockerignore excludes unnecessary files"
  log_raw "- [ ] docker-compose.yml has no syntax errors"
  log_raw "- [ ] All services restart policies set"
  log_raw "- [ ] Resource limits configured (CPU/memory)"
  log_raw "- [ ] Security options enforced (CAP_DROP, no-new-privileges)"
  
  log_section "Next Steps"
  log_raw "1. Review any ❌ failures above"
  log_raw "2. Run: \`docker-compose up -d\`"
  log_raw "3. Verify: \`docker-compose ps\` (all healthy)"
  log_raw "4. Test health endpoints: \`curl http://localhost:3000/health\`"
  log_raw "5. Check logs: \`docker-compose logs -f backend\`"
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
  echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║   DOCKER ECOSYSTEM AUDIT & REPAIR SCRIPT                   ║${NC}"
  echo -e "${BLUE}║   Timestamp: $TIMESTAMP                        ║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  
  # Initialize report
  echo "# Docker Audit Report" > "$AUDIT_REPORT"
  echo "**Generated:** $TIMESTAMP" >> "$AUDIT_REPORT"
  echo "" >> "$AUDIT_REPORT"
  
  # Run audit phases
  audit_environment
  audit_dockerfiles
  audit_docker_compose
  audit_scripts
  audit_containers
  audit_images
  audit_security
  audit_reproducibility
  audit_summary
  
  echo ""
  echo -e "${GREEN}✅ Audit complete!${NC}"
  echo -e "${YELLOW}📄 Report saved to: $AUDIT_REPORT${NC}"
  echo ""
}

main "$@"
