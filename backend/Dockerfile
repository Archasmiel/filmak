# Simple production Dockerfile for the backend (Node ESM)
FROM node:20-alpine AS base
WORKDIR /app

# Copy package and install only production deps (faster builds)
COPY package*.json ./
RUN npm ci --only=production

# Copy app sources
COPY . .

# Ensure logs directory exists and has correct permissions
RUN mkdir -p /app/logs && chown -R node:node /app/logs

USER node
ENV NODE_ENV=production
EXPOSE 5000

# Start app (assumes entry at src/index.js)
CMD ["node", "src/index.js"]
