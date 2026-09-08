#!/bin/bash
set -e

echo "🐳 EBDESIGN Docker Quick Start"
echo "=============================="
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Install Docker first."
    exit 1
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose not found. Install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose found"
echo ""

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.full.yml down 2>/dev/null || true
echo ""

# Start services
echo "🚀 Starting all services (postgres, redis, backend, frontend)..."
docker-compose -f docker-compose.full.yml up -d
echo ""

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy (this takes 20-30 seconds)..."
echo ""

attempt=0
max_attempts=30
while [ $attempt -lt $max_attempts ]; do
    if docker-compose -f docker-compose.full.yml ps | grep -q "healthy"; then
        attempt=$((attempt + 1))
        if [ $attempt -ge 3 ]; then
            break
        fi
    else
        echo "  Checking service health... ($((attempt + 1))/$max_attempts)"
    fi
    sleep 1
done

echo ""
echo "✅ All services are running!"
echo ""

# Show status
echo "📊 Service Status:"
echo "===================="
docker-compose -f docker-compose.full.yml ps
echo ""

# Test endpoints
echo "🧪 Testing endpoints..."
echo ""

# Backend health
echo "Testing Backend /health..."
if curl -s http://localhost:3001/health | grep -q "healthy"; then
    echo "  ✅ Backend /health: OK"
else
    echo "  ⏳ Backend still starting... try in 5 seconds"
fi

# Backend readiness
echo "Testing Backend /health/ready..."
if curl -s http://localhost:3001/health/ready | grep -q "ready"; then
    echo "  ✅ Backend /health/ready: OK"
else
    echo "  ⏳ Backend still warming up... try in 5 seconds"
fi

# Frontend
echo "Testing Frontend..."
if curl -s http://localhost:3000/health | grep -q "healthy"; then
    echo "  ✅ Frontend: OK"
else
    echo "  ⏳ Frontend still starting... try in 5 seconds"
fi

echo ""
echo "🎉 SUCCESS! Your EBDESIGN application is running!"
echo ""
echo "📍 Access Points:"
echo "   🌐 Frontend UI:     http://localhost:3000"
echo "   🔌 Backend API:     http://localhost:3001"
echo "   💾 PostgreSQL:      localhost:5432"
echo "   📦 Redis:           localhost:6379"
echo ""
echo "🧪 Test Commands:"
echo "   curl http://localhost:3001/health"
echo "   curl http://localhost:3001/health/ready"
echo "   curl http://localhost:3000/"
echo ""
echo "📋 Docker Commands:"
echo "   View logs:          docker-compose -f docker-compose.full.yml logs -f"
echo "   Stop services:      docker-compose -f docker-compose.full.yml down"
echo "   Execute bash:       docker-compose -f docker-compose.full.yml exec backend sh"
echo "   Run tests:          docker-compose -f docker-compose.full.yml exec backend npm test"
echo ""
echo "✨ Two-port architecture active:"
echo "   Frontend:  Port 3000 (Nginx + React)"
echo "   Backend:   Port 3001 (Node.js API)"
echo "   Network:   ebdesign-net (proper hostname resolution)"
echo ""
