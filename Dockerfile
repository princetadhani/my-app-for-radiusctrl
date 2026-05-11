# ============================================
# FreeRADIUS Control Panel - Production Docker Image
# ============================================
# This Dockerfile creates a single, portable image that can run on any device
# without requiring configuration changes. It includes:
#   - Built Next.js frontend (served by nginx)
#   - Node.js backend (production mode)
#   - nginx reverse proxy
#   - supervisord process manager
# ============================================

# ============================================
# Stage 1: Build Frontend
# ============================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy frontend package files
COPY package*.json ./
COPY tsconfig.json ./
COPY next.config.ts ./
COPY postcss.config.mjs ./
COPY components.json ./

# Install ALL dependencies (including dev dependencies needed for build)
RUN npm ci --ignore-scripts

# Copy frontend source code
COPY app ./app
COPY components ./components
COPY lib ./lib
COPY public ./public

# Build Next.js application for production
# This creates optimized static files in .next directory
RUN npm run build

# ============================================
# Stage 2: Build Backend
# ============================================
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./
COPY backend/tsconfig.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci

# Copy backend source code
COPY backend/src ./src

# Build TypeScript backend
RUN npm run build

# ============================================
# Stage 3: Production Image
# ============================================
FROM node:20-alpine

# Install required system packages
# - nginx: web server and reverse proxy
# - supervisor: process manager for nginx + backend
# - sudo: required for backend to control FreeRADIUS service
# - shadow: for usermod/groupmod commands
# - util-linux: provides nsenter for host command execution
RUN apk add --no-cache \
    nginx \
    supervisor \
    sudo \
    shadow \
    util-linux

# Configure sudo for node user and root
# Allow passwordless sudo for all commands (needed for backend operations)
RUN echo "root ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/docker && \
    echo "node ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers.d/docker && \
    chmod 0440 /etc/sudoers.d/docker && \
    addgroup -g 112 freerad 2>/dev/null || true && \
    addgroup node freerad 2>/dev/null || true

# Create application directory
WORKDIR /app

# ============================================
# Copy Built Frontend from Stage 1
# ============================================
COPY --from=frontend-builder /app/.next /app/.next
COPY --from=frontend-builder /app/public /app/public
COPY --from=frontend-builder /app/package*.json /app/
COPY --from=frontend-builder /app/next.config.ts /app/

# Install only production dependencies for runtime
RUN npm ci --omit=dev --ignore-scripts

# ============================================
# Copy Built Backend from Stage 2
# ============================================
COPY --from=backend-builder /app/backend/dist /app/backend/dist
COPY --from=backend-builder /app/backend/package*.json /app/backend/

# Install only production dependencies for backend
RUN cd /app/backend && npm ci --omit=dev --ignore-scripts

# ============================================
# Copy nginx configuration
# ============================================
COPY docker/nginx.conf /etc/nginx/http.d/default.conf

# ============================================
# Copy supervisord configuration
# ============================================
COPY docker/supervisord.conf /etc/supervisord.conf

# ============================================
# Copy entrypoint script
# ============================================
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# ============================================
# Create required directories
# ============================================
# Create nginx temp directories with proper subdirectories for client_body, proxy, fastcgi, etc.
RUN mkdir -p /var/log/supervisor \
    /var/log/nginx \
    /var/lib/nginx/tmp/client_body \
    /var/lib/nginx/tmp/proxy \
    /var/lib/nginx/tmp/fastcgi \
    /var/lib/nginx/tmp/uwsgi \
    /var/lib/nginx/tmp/scgi \
    /run/nginx && \
    chown -R node:node /var/log/supervisor /var/log/nginx && \
    chmod -R 777 /var/lib/nginx /run/nginx

# ============================================
# Environment Variables
# ============================================
# Backend configuration (production defaults)
ENV NODE_ENV=production \
    PORT=3001 \
    FREERADIUS_BASE_DIR=/etc/freeradius/3.0 \
    FREERADIUS_LOG_FILE=/var/log/freeradius/radius.log \
    FREERADIUS_COA_DIR=/etc/freeradius/3.0/coa \
    FREERADIUS_SERVICE_NAME=freeradius \
    WEBSOCKET_CORS_ORIGIN=*

# ============================================
# Expose Port
# ============================================
# Expose port 80 for nginx (internal container port)
# Maps to host port 9000 to avoid conflicts with other services
# Users will access the application via http://<host-ip>:9000
EXPOSE 80

# ============================================
# Health Check
# ============================================
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/api/health || exit 1

# ============================================
# Entrypoint
# ============================================
ENTRYPOINT ["/entrypoint.sh"]
