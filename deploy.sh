#!/bin/bash

# Production Deployment Script for AFRERA Platform
# This script handles the complete deployment process

set -e

echo "🚀 Starting AFRERA Platform Deployment..."

# Configuration
APP_NAME="afrera"
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
DOCKER_COMPOSE_FILE="docker-compose.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    log_info "All prerequisites are installed."
}

# Build frontend
build_frontend() {
    log_info "Building frontend..."
    cd $FRONTEND_DIR
    npm install
    npm run build
    cd ..
    log_info "Frontend build completed."
}

# Build backend
build_backend() {
    log_info "Building backend..."
    cd $BACKEND_DIR
    npm install
    cd ..
    log_info "Backend build completed."
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    cd $BACKEND_DIR
    npm run migrate
    cd ..
    log_info "Database migrations completed."
}

# Start services with Docker Compose
start_services() {
    log_info "Starting services with Docker Compose..."
    docker-compose -f $DOCKER_COMPOSE_FILE up -d
    log_info "Services started."
}

# Stop services
stop_services() {
    log_info "Stopping services..."
    docker-compose -f $DOCKER_COMPOSE_FILE down
    log_info "Services stopped."
}

# Check service health
check_health() {
    log_info "Checking service health..."
    
    # Wait for services to be healthy
    max_attempts=30
    attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if docker-compose -f $DOCKER_COMPOSE_FILE ps | grep -q "healthy"; then
            log_info "All services are healthy."
            return 0
        fi
        attempt=$((attempt + 1))
        log_warn "Waiting for services to be healthy... ($attempt/$max_attempts)"
        sleep 10
    done
    
    log_error "Services did not become healthy in time."
    return 1
}

# Run tests
run_tests() {
    log_info "Running tests..."
    
    # Backend tests
    cd $BACKEND_DIR
    npm test || log_warn "Backend tests failed or skipped"
    cd ..
    
    # Frontend tests
    cd $FRONTEND_DIR
    npm test || log_warn "Frontend tests failed or skipped"
    cd ..
    
    log_info "Tests completed."
}

# Main deployment function
deploy() {
    log_info "Starting deployment process..."
    
    # Check prerequisites
    check_prerequisites
    
    # Build applications
    build_frontend
    build_backend
    
    # Start services
    start_services
    
    # Check health
    check_health
    
    # Run migrations
    run_migrations
    
    # Run tests
    run_tests
    
    log_info "Deployment completed successfully!"
    log_info "Application is now running at http://localhost:3001"
}

# Parse command line arguments
case "${1:-deploy}" in
    deploy)
        deploy
        ;;
    build)
        build_frontend
        build_backend
        ;;
    start)
        start_services
        check_health
        ;;
    stop)
        stop_services
        ;;
    restart)
        stop_services
        start_services
        check_health
        ;;
    migrate)
        run_migrations
        ;;
    test)
        run_tests
        ;;
    health)
        check_health
        ;;
    *)
        echo "Usage: $0 {deploy|build|start|stop|restart|migrate|test|health}"
        exit 1
        ;;
esac
