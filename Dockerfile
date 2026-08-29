# Multi-stage Dockerfile for AFRERA Platform
# Production-ready deployment with optimization

# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm ci --only=production
WORKDIR /app/frontend
RUN npm ci --only=production
WORKDIR /app/backend
RUN npm ci --only=production

# Copy source code
COPY . .

# Build frontend
WORKDIR /app/frontend
RUN npm run build

# Stage 2: Production
FROM node:18-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S afrera && \
    adduser -S afrera -u 1001

# Copy dependencies and built frontend
COPY --from=builder --chown=afrera:afrera /app/node_modules ./node_modules
COPY --from=builder --chown=afrera:afrera /app/backend/node_modules ./backend/node_modules
COPY --from=builder --chown=afrera:afrera /app/backend ./backend
COPY --from=builder --chown=afrera:afrera /app/frontend/dist ./frontend/dist
COPY --from=builder --chown=afrera:afrera /app/package*.json ./

# Create necessary directories
RUN mkdir -p uploads logs && \
    chown -R afrera:afrera uploads logs

# Switch to non-root user
USER afrera

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "backend/src/index.js"]
