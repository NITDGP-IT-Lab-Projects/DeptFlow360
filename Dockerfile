# ==============================================================================
# DeptFlow 360 - Departmental Activity & Workflow Management System
# Production-Hardened Nginx Alpine Dockerfile
# ==============================================================================

FROM nginx:alpine

LABEL maintainer="IT Department Engineering Lab" \
      version="1.0.0" \
      description="DeptFlow 360 - Departmental Workflow & Project Allocation Suite"

# Remove default nginx static assets and configs
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/*

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy web application assets
COPY index.html /usr/share/nginx/html/
COPY css/ /usr/share/nginx/html/css/
COPY js/ /usr/share/nginx/html/js/
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
