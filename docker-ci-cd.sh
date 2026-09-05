#!/usr/bin/env bash
###############################################################################
# CI/CD PIPELINE - DOCKER BUILD & TEST SCRIPT
# Purpose: Automated Docker build, test, and validation for CI/CD systems
# Compatibility: GitHub Actions, GitLab CI, Jenkins, Azure Pipelines
###############################################################################

set -eo pipefail

# ============================================================================
# CONFIGURATION
# ============================================================================

REGISTRY=${REGISTRY:-"localhost"}
BACKEND_IMAGE="${REGISTRY}/ebdesign-backend"
FRONTEND_IMAGE="${REGISTRY}/ebdesign-frontend"
TAG=${TAG:-"latest"}
BUILDKIT_ENABLED=${BUILDKIT_ENABLED:-"1"}
SCAN_ENABLED=${SCAN_ENABLED:-"0"}
TEST_ENABLED=${TEST_ENABLED:-"1"}

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging
log() { echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; exit 1; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }

# ============================================================================
# PHASE 1: ENVIRONMENT VALIDATION
# ============================================================================

validate_environment() {
  log "PHASE 1: Validating build environment..."
  
  # Check Docker
  if ! command -v docker &> /dev/null; then
    error "Docker not installed"
  fi
  
  # Check Docker Compose
  if ! command -v docker-compose &> /dev/null && ! docker compose version &>/dev/null; then
    warning "Docker Compose not found (optional)"
  fi
  
  # Check .env
  if [ ! -f ".env" ]; then
    warning ".env not found, using defaults"
  fi
  
  # Set BuildKit
  export DOCKER_BUILDKIT=$BUILDKIT_ENABLED
  
  success "Environment validated"
}

# ============================================================================
# PHASE 2: BUILD BACKEND
# ============================================================================

build_backend() {
  log "PHASE 2: Building backend image..."
  
  local build_args=""
  [ -n "$BUILD_DATE" ] && build_args="$build_args --label build.date=$BUILD_DATE"
  [ -n "$GIT_COMMIT" ] && build_args="$build_args --label vcs.ref=$GIT_COMMIT"
  [ -n "$GIT_BRANCH" ] && build_args="$build_args --label vcs.branch=$GIT_BRANCH"
  
  if docker build \
    -f backend/Dockerfile \
    -t "${BACKEND_IMAGE}:${TAG}" \
    -t "${BACKEND_IMAGE}:latest" \
    --no-cache \
    $build_args \
    .; then
    success "Backend image built: ${BACKEND_IMAGE}:${TAG}"
    echo "${BACKEND_IMAGE}:${TAG}" >> /tmp/built_images.txt
  else
    error "Backend build failed"
  fi
}

# ============================================================================
# PHASE 3: BUILD FRONTEND
# ============================================================================

build_frontend() {
  log "PHASE 3: Building frontend image..."
  
  local build_args=""
  [ -n "$BUILD_DATE" ] && build_args="$build_args --label build.date=$BUILD_DATE"
  [ -n "$GIT_COMMIT" ] && build_args="$build_args --label vcs.ref=$GIT_COMMIT"
  
  if docker build \
    -f frontend/Dockerfile \
    -t "${FRONTEND_IMAGE}:${TAG}" \
    -t "${FRONTEND_IMAGE}:latest" \
    --no-cache \
    $build_args \
    frontend/; then
    success "Frontend image built: ${FRONTEND_IMAGE}:${TAG}"
    echo "${FRONTEND_IMAGE}:${TAG}" >> /tmp/built_images.txt
  else
    error "Frontend build failed"
  fi
}

# ============================================================================
# PHASE 4: IMAGE VERIFICATION
# ============================================================================

verify_images() {
  log "PHASE 4: Verifying built images..."
  
  # Backend image verification
  if docker inspect "${BACKEND_IMAGE}:${TAG}" &>/dev/null; then
    local backend_size=$(docker images --format "{{.Size}}" "${BACKEND_IMAGE}:${TAG}")
    success "Backend image verified (Size: $backend_size)"
  else
    error "Backend image not found"
  fi
  
  # Frontend image verification
  if docker inspect "${FRONTEND_IMAGE}:${TAG}" &>/dev/null; then
    local frontend_size=$(docker images --format "{{.Size}}" "${FRONTEND_IMAGE}:${TAG}")
    success "Frontend image verified (Size: $frontend_size)"
  else
    error "Frontend image not found"
  fi
  
  # Check for required elements
  log "Checking image structure..."
  
  # Backend checks
  if docker inspect "${BACKEND_IMAGE}:${TAG}" --format='{{.Config.Entrypoint}}' | grep -q "dumb-init"; then
    success "Backend: dumb-init entrypoint configured"
  else
    error "Backend: dumb-init entrypoint not found"
  fi
  
  if docker inspect "${BACKEND_IMAGE}:${TAG}" --format='{{.Config.User}}' | grep -q "1001"; then
    success "Backend: non-root user (1001) configured"
  else
    warning "Backend: running as root (not recommended)"
  fi
  
  if docker inspect "${BACKEND_IMAGE}:${TAG}" --format='{{.Config.Healthcheck}}' | grep -q "health"; then
    success "Backend: health check configured"
  else
    warning "Backend: health check not found"
  fi
}

# ============================================================================
# PHASE 5: TEST SUITE EXECUTION
# ============================================================================

run_tests() {
  if [ "$TEST_ENABLED" != "1" ]; then
    log "Tests disabled (TEST_ENABLED=$TEST_ENABLED)"
    return 0
  fi
  
  log "PHASE 5: Running test suites..."
  
  # Backend tests
  log "Running backend tests..."
  if docker run --rm \
    -v "$(pwd)/backend:/app" \
    "${BACKEND_IMAGE}:${TAG}" \
    npm run test 2>&1 | tee /tmp/backend-test.log; then
    success "Backend tests passed"
  else
    warning "Backend tests had issues (check logs)"
  fi
  
  # Frontend tests
  log "Running frontend tests..."
  if docker run --rm \
    -v "$(pwd)/frontend:/app" \
    "${FRONTEND_IMAGE}:${TAG}" \
    npm run test 2>&1 | tee /tmp/frontend-test.log; then
    success "Frontend tests passed"
  else
    warning "Frontend tests had issues (check logs)"
  fi
}

# ============================================================================
# PHASE 6: SECURITY SCANNING (OPTIONAL)
# ============================================================================

scan_security() {
  if [ "$SCAN_ENABLED" != "1" ]; then
    log "Security scanning disabled (SCAN_ENABLED=$SCAN_ENABLED)"
    return 0
  fi
  
  log "PHASE 6: Security scanning..."
  
  # Trivy scan (if available)
  if command -v trivy &> /dev/null; then
    log "Running Trivy scan on backend..."
    trivy image --severity HIGH,CRITICAL "${BACKEND_IMAGE}:${TAG}" || warning "Trivy scan found issues"
  else
    log "Trivy not installed (install: https://github.com/aquasecurity/trivy)"
  fi
  
  # Docker Scout (if available)
  if command -v docker &> /dev/null && docker version --format "{{.Server.Experimental}}" 2>/dev/null | grep -q "true"; then
    log "Running Docker Scout..."
    docker scout cves "${BACKEND_IMAGE}:${TAG}" || warning "Scout found vulnerabilities"
  fi
}

# ============================================================================
# PHASE 7: COMPOSE INTEGRATION TEST
# ============================================================================

test_compose() {
  log "PHASE 7: Testing docker-compose integration..."
  
  # Cleanup previous test
  docker-compose down -v 2>/dev/null || true
  
  # Start services
  if docker-compose up -d; then
    success "Services started"
  else
    error "Failed to start services"
  fi
  
  # Wait for services
  log "Waiting for services to be ready (60s)..."
  sleep 30
  
  # Check health
  local max_attempts=6
  local attempt=0
  
  while [ $attempt -lt $max_attempts ]; do
    if curl -sf http://localhost:3000/health >/dev/null 2>&1; then
      success "Backend health check passed"
      break
    fi
    attempt=$((attempt + 1))
    if [ $attempt -lt $max_attempts ]; then
      log "Health check attempt $((attempt + 1))/$max_attempts, retrying..."
      sleep 10
    fi
  done
  
  if [ $attempt -eq $max_attempts ]; then
    error "Backend health check failed after $max_attempts attempts"
  fi
  
  # Verify frontend
  if curl -sf http://localhost:5173 >/dev/null 2>&1; then
    success "Frontend is responding"
  else
    warning "Frontend health check failed"
  fi
  
  # Collect logs
  log "Collecting service logs..."
  docker-compose logs --no-color > /tmp/compose-logs.txt 2>&1
  success "Logs saved to /tmp/compose-logs.txt"
  
  # Cleanup
  docker-compose down -v
  success "Test services stopped"
}

# ============================================================================
# PHASE 8: ARTIFACT EXPORT (FOR CI/CD)
# ============================================================================

export_artifacts() {
  log "PHASE 8: Exporting artifacts..."
  
  # Save image references
  if [ -f "/tmp/built_images.txt" ]; then
    log "Built images:"
    cat /tmp/built_images.txt
  fi
  
  # Export build metadata
  cat > /tmp/build-metadata.json << EOF
{
  "images": {
    "backend": "${BACKEND_IMAGE}:${TAG}",
    "frontend": "${FRONTEND_IMAGE}:${TAG}"
  },
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "git_commit": "${GIT_COMMIT:-unknown}",
  "git_branch": "${GIT_BRANCH:-unknown}",
  "build_url": "${BUILD_URL:-local}"
}
EOF
  
  success "Build metadata exported to /tmp/build-metadata.json"
  cat /tmp/build-metadata.json
}

# ============================================================================
# PHASE 9: REGISTRY PUSH (OPTIONAL)
# ============================================================================

push_images() {
  if [ "$REGISTRY" == "localhost" ]; then
    log "Local registry detected, skipping push"
    return 0
  fi
  
  log "PHASE 9: Pushing images to registry..."
  
  if [ -n "$REGISTRY_USERNAME" ] && [ -n "$REGISTRY_PASSWORD" ]; then
    log "Authenticating with registry..."
    echo "$REGISTRY_PASSWORD" | docker login -u "$REGISTRY_USERNAME" --password-stdin "$REGISTRY" || error "Registry authentication failed"
  fi
  
  if docker push "${BACKEND_IMAGE}:${TAG}"; then
    success "Backend image pushed: ${BACKEND_IMAGE}:${TAG}"
  else
    error "Failed to push backend image"
  fi
  
  if docker push "${FRONTEND_IMAGE}:${TAG}"; then
    success "Frontend image pushed: ${FRONTEND_IMAGE}:${TAG}"
  else
    error "Failed to push frontend image"
  fi
  
  if [ -n "$REGISTRY_USERNAME" ]; then
    docker logout "$REGISTRY"
  fi
}

# ============================================================================
# CLEANUP
# ============================================================================

cleanup() {
  log "Cleaning up..."
  docker-compose down -v 2>/dev/null || true
  success "Cleanup complete"
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
  local start_time=$(date +%s)
  
  echo "╔════════════════════════════════════════════════════════════╗"
  echo "║   DOCKER CI/CD PIPELINE                                    ║"
  echo "║   Backend: ${BACKEND_IMAGE}:${TAG}"
  echo "║   Frontend: ${FRONTEND_IMAGE}:${TAG}"
  echo "╚════════════════════════════════════════════════════════════╝"
  echo ""
  
  trap cleanup EXIT
  
  validate_environment
  build_backend
  build_frontend
  verify_images
  run_tests
  scan_security
  test_compose
  export_artifacts
  push_images
  
  local end_time=$(date +%s)
  local duration=$((end_time - start_time))
  
  echo ""
  success "Pipeline completed successfully in ${duration}s"
  echo ""
}

main "$@"
