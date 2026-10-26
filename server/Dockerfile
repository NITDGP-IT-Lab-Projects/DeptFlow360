# ==============================================================================
# DeptFlow 360 - Node.js Express Backend Dockerfile
# ==============================================================================

FROM node:20-alpine

WORKDIR /app

# Install app dependencies
COPY package.json ./
RUN npm install --omit=dev

# Bundle app source
COPY . .

# Expose backend port
EXPOSE 5000

# Start server
CMD ["node", "server.js"]
