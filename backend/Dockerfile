# Multi-stage Dockerfile - Backend
# Stage 1: Build & Dependencies
FROM node:20-alpine AS builder

WORKDIR /app

# Install build tools
RUN apk add --no-cache python3 make g++

# Copy package files
COPY backend/package*.json ./

# Install production + dev dependencies for build
RUN npm ci

# Copy source code
COPY backend/src ./src
COPY backend/scripts ./scripts
COPY backend/migrations ./migrations
COPY backend/jest.config.js ./
COPY backend/.eslintrc.json ./
COPY backend/entrypoint.sh ./

# Run tests in build stage
RUN npm run test || true

# Stage 2: Production Runtime
FROM node:20-alpine

WORKDIR /app

# Install production-only dependencies
RUN apk add --no-cache \
    dumb-init \
    netcat-openbsd \
    postgresql-client

# Create non-root user
RUN addgroup -g 1001 -S ebdesign && \
    adduser -S ebdesign -u 1001

# Copy from builder (only production node_modules and code)
COPY --from=builder --chown=ebdesign:ebdesign /app/node_modules ./node_modules
COPY --from=builder --chown=ebdesign:ebdesign /app/src ./src
COPY --from=builder --chown=ebdesign:ebdesign /app/migrations ./migrations
COPY --from=builder --chown=ebdesign:ebdesign /app/scripts ./scripts
COPY --from=builder --chown=ebdesign:ebdesign /app/entrypoint.sh ./
COPY backend/package*.json ./

# Create required directories
RUN mkdir -p logs uploads && \
    chown -R ebdesign:ebdesign logs uploads && \
    chmod +x entrypoint.sh

# Switch to non-root user
USER ebdesign

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application with entrypoint script
CMD ["./entrypoint.sh"]
