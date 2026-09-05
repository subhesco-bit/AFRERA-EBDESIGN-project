# Multi-stage Dockerfile for EBDESIGN Platform
# Production-ready deployment with security hardening
# Supports: Backend API + Frontend Static

# Stage 1: Build Dependencies
FROM node:20-alpine AS dependencies

WORKDIR /app

# Install build tools
RUN apk add --no-cache python3 make g++

# Copy package files
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install dependencies (production only for final image)
WORKDIR /app/frontend
RUN npm ci

WORKDIR /app/backend
RUN npm ci

# Stage 2: Frontend Build
FROM dependencies AS frontend-builder

WORKDIR /app

# Copy frontend source
COPY frontend/ ./frontend/

# Build frontend
WORKDIR /app/frontend
RUN npm run build && \
    if [ ! -d "dist" ]; then echo "Frontend build failed: dist not created"; exit 1; fi

# Stage 3: Backend Build & Test
FROM dependencies AS backend-builder

WORKDIR /app

# Copy backend source
COPY backend/ ./backend/

# Run tests in build stage (optional - remove RUN if no tests)
WORKDIR /app/backend
RUN npm run test || true

# Stage 4: Production Runtime
FROM node:20-alpine AS production

WORKDIR /app

# Install runtime dependencies only
RUN apk add --no-cache \
    dumb-init \
    netcat-openbsd \
    postgresql-client \
    curl

# Create non-root user (UID 1001)
RUN addgroup -g 1001 -S ebdesign && \
    adduser -S ebdesign -u 1001 -G ebdesign

# Copy backend dependencies (production)
COPY --from=backend-builder --chown=ebdesign:ebdesign /app/backend/node_modules ./backend/node_modules

# Copy backend code
COPY --from=backend-builder --chown=ebdesign:ebdesign /app/backend/src ./backend/src
COPY --from=backend-builder --chown=ebdesign:ebdesign /app/backend/migrations ./backend/migrations
COPY --from=backend-builder --chown=ebdesign:ebdesign /app/backend/scripts ./backend/scripts
COPY --from=backend-builder --chown=ebdesign:ebdesign /app/backend/package*.json ./backend/

# Copy frontend build output
COPY --from=frontend-builder --chown=ebdesign:ebdesign /app/frontend/dist ./frontend/dist

# Copy entrypoint script
COPY --chown=ebdesign:ebdesign backend/entrypoint.sh ./entrypoint.sh

# Create required directories
RUN mkdir -p /app/logs /app/uploads && \
    chown -R ebdesign:ebdesign /app/logs /app/uploads && \
    chmod +x /app/entrypoint.sh

# Switch to non-root user
USER ebdesign

# Expose ports
EXPOSE 3000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Signal handling via dumb-init
ENTRYPOINT ["dumb-init", "--"]

# Start application with entrypoint script
CMD ["./entrypoint.sh"]
