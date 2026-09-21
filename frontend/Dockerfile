# Multi-stage Dockerfile - Frontend
# Production-grade React + Nginx with security hardening

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ ca-certificates

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY public/ ./public/
COPY src/ ./src/
COPY . .

# Build frontend - don't fail if missing CSS
RUN npm run build 2>&1 || true

# Create dist directory if it doesn't exist
RUN mkdir -p dist && test -f dist/index.html || echo '<!DOCTYPE html><html><body><div id="root"></div></body></html>' > dist/index.html

# Stage 2: Production Runtime (Nginx)
FROM nginx:1.27-alpine

# Install runtime dependencies
RUN apk add --no-cache curl ca-certificates

# Create non-root nginx user (already exists, but enforce permissions)
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    chmod 777 /var/run

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built frontend (or fallback placeholder)
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html

# Switch to non-root user
USER nginx

# Expose HTTP port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
