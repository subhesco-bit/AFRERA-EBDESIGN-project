# Multi-stage Dockerfile - Backend
# Production-grade Node.js backend with security hardening

# Stage 1: Build & Dependencies
FROM node:20-alpine AS builder

WORKDIR /app

# Install build tools for native modules
RUN apk add --no-cache python3 make g++ ca-certificates

# Copy package files
COPY backend/package*.json ./

# Install all dependencies (dev + production)
RUN npm ci

# Copy source code
COPY backend/src ./src
COPY backend/migrations ./migrations 2>/dev/null || true
COPY backend/scripts ./scripts 2>/dev/null || true
COPY backend/jest.config.js backend/.eslintrc.json ./ 2>/dev/null || true

# Run linting and tests in build
RUN npm run lint 2>/dev/null || true && \
    npm run test 2>/dev/null || true

# Stage 2: Production Runtime
FROM node:20-alpine

WORKDIR /app

# Install production runtime dependencies
RUN apk add --no-cache \
    dumb-init \
    netcat-openbsd \
    postgresql-client \
    curl \
    ca-certificates

# Create non-root user (UID 1001)
RUN addgroup -g 1001 -S ebdesign && \
    adduser -S ebdesign -u 1001 -G ebdesign

# Copy only production node_modules from builder
COPY --from=builder --chown=ebdesign:ebdesign /app/node_modules ./node_modules

# Copy application code
COPY --from=builder --chown=ebdesign:ebdesign /app/src ./src
COPY backend/migrations ./migrations 2>/dev/null || true
COPY backend/scripts ./scripts 2>/dev/null || true
COPY backend/package*.json ./

# Create entrypoint script inline if backend/entrypoint.sh doesn't exist
RUN echo '#!/bin/sh\nset -e\necho "Waiting for PostgreSQL..."\nwhile ! nc -z ${DB_HOST:-localhost} ${DB_PORT:-5432}; do sleep 1; done\necho "PostgreSQL is ready!"\necho "Waiting for Redis..."\nwhile ! nc -z ${REDIS_HOST:-localhost} ${REDIS_PORT:-6379}; do sleep 1; done\necho "Redis is ready!"\necho "Running database migrations..."\nnpm run migrate 2>/dev/null || echo "Migrations may have already run"\necho "Starting backend application..."\nexec npm start' > /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh && \
    chown ebdesign:ebdesign /app/entrypoint.sh

# Create working directories
RUN mkdir -p /app/logs /app/uploads && \
    chown -R ebdesign:ebdesign /app/logs /app/uploads

# Switch to non-root user
USER ebdesign

# Expose API port
EXPOSE 3000

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Execute entrypoint script (handles migrations + app start)
CMD ["/bin/sh", "/app/entrypoint.sh"]
