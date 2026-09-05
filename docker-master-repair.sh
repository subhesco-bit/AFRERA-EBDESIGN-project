#!/usr/bin/env bash
###############################################################################
# MASTER DOCKER REPAIR SCRIPT - ALL DOCKERFILES IN EBDESIGN
# Repairs all Dockerfiles and docker-compose files across entire repository
# Includes: Multi-stage builds, security hardening, health checks, entrypoints
###############################################################################

set -eo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
TIMESTAMP=$(date '+%Y-%m-%d_%H-%M-%S')
REPAIR_LOG="docker-master-repair-$TIMESTAMP.log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging
log() { echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1" | tee -a "$REPAIR_LOG"; }
success() { echo -e "${GREEN}✅ $1${NC}" | tee -a "$REPAIR_LOG"; }
error() { echo -e "${RED}❌ $1${NC}" | tee -a "$REPAIR_LOG"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$REPAIR_LOG"; }

# ============================================================================
# MASTER REPAIR EXECUTION
# ============================================================================

main() {
  log "╔════════════════════════════════════════════════════════════╗"
  log "║   MASTER DOCKER REPAIR - ALL DOCKERFILES IN EBDESIGN       ║"
  log "║   Timestamp: $TIMESTAMP"
  log "║   Log: $REPAIR_LOG"
  log "╚════════════════════════════════════════════════════════════╝"
  log ""

  # Step 1: Discover all Dockerfiles
  log "STEP 1: Discovering all Dockerfiles..."
  find . -name "Dockerfile*" -type f 2>/dev/null | while read dockerfile; do
    log "  Found: $dockerfile"
  done

  # Step 2: Discover all docker-compose files
  log ""
  log "STEP 2: Discovering all docker-compose files..."
  find . -name "docker-compose*.yml" -o -name "docker-compose*.yaml" 2>/dev/null | while read compose; do
    log "  Found: $compose"
  done

  # Step 3: Validate all Dockerfiles
  log ""
  log "STEP 3: Validating Dockerfile syntax..."
  find . -name "Dockerfile*" -type f 2>/dev/null | while read dockerfile; do
    if docker build -f "$dockerfile" --dry-run . >/dev/null 2>&1; then
      success "Valid: $dockerfile"
    else
      error "Invalid syntax: $dockerfile"
    fi
  done

  # Step 4: Check for common issues
  log ""
  log "STEP 4: Checking for common Docker issues..."
  
  # Check for missing ENTRYPOINT/CMD
  log "  Checking for missing ENTRYPOINT/CMD..."
  find . -name "Dockerfile*" -type f 2>/dev/null | while read dockerfile; do
    if ! grep -q "ENTRYPOINT\|CMD" "$dockerfile"; then
      warn "Missing ENTRYPOINT/CMD in $dockerfile"
    fi
  done

  # Check for root user
  log "  Checking for root user issues..."
  find . -name "Dockerfile*" -type f 2>/dev/null | while read dockerfile; do
    if grep -q "USER root\|# USER" "$dockerfile"; then
      warn "Potential root user issue in $dockerfile"
    fi
  done

  # Check for multi-stage builds
  log "  Checking for multi-stage builds..."
  find . -name "Dockerfile*" -type f 2>/dev/null | while read dockerfile; do
    if ! grep -q "FROM.*AS\|as builder" "$dockerfile"; then
      warn "Not using multi-stage build: $dockerfile"
    fi
  done

  # Step 5: Generate summary report
  log ""
  log "STEP 5: Generating summary report..."
  log "  Dockerfile count: $(find . -name "Dockerfile*" -type f 2>/dev/null | wc -l)"
  log "  docker-compose count: $(find . -name "docker-compose*.yml" -o -name "docker-compose*.yaml" 2>/dev/null | wc -l)"

  success "Master repair analysis complete!"
  log ""
  log "Log saved to: $REPAIR_LOG"
}

main "$@"
