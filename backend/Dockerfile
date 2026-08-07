# AFRERA Backend Dockerfile
# Multi-stage build for production-ready image using a Debian-based Node image
# to avoid Alpine-specific package manager and shell assumptions.

# Stage 1: Build
FROM node:18-slim AS builder

WORKDIR /app

# Copy package files first so dependencies can be cached in Docker.
COPY package*.json ./

# Install dependencies using npm in a Debian-slim image.
RUN npm ci --only=production

# Copy source code
COPY src ./src

# Stage 2: Production
FROM node:18-slim AS production

WORKDIR /app

# Copy dependencies from builder, preserving the standard production install layout.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/src ./src

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "src/index.js"]
