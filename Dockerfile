# ==============================================================================
# DeptFlow 360 - Departmental Activity & Workflow Management System
# Multi-Stage Production Nginx Alpine Dockerfile for React SPA
# ==============================================================================

# Stage 1: Build React Application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json ./

# Install build dependencies
RUN npm install

# Copy application assets and source code
COPY . .

# Compile production bundle to /app/dist
RUN npm run build

# Stage 2: Production Nginx Server
FROM nginx:alpine

LABEL maintainer="IT Department Engineering Lab" \
      version="2.0.0" \
      description="DeptFlow 360 - Departmental Workflow & Project Allocation Suite (React SPA)"

# Clean default nginx static assets and configs
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/*

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled React application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy docs for reference
COPY docs/ /usr/share/nginx/html/docs/

# Enforce secure read-only permissions on static files
RUN chmod -R 755 /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Built-in Healthcheck against internal /healthz endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:80/healthz || exit 1

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
