# Dockerfile for API Gateway Service
FROM node:18-alpine AS base

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Copy package files
COPY package*.json ./
COPY nest-cli.json ./

# Development stage
FROM base AS development
# Install all dependencies including dev dependencies for building
# Using npm install instead of npm ci to handle lock file inconsistencies
RUN npm install && npm cache clean --force
COPY . .

# Build stage
FROM development AS build
RUN npm run build:api-gateway

# Production stage
FROM node:18-alpine AS production

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

# Copy package files
COPY --from=build --chown=nestjs:nodejs /app/package*.json ./

# Install only production dependencies
# Using npm install instead of npm ci to handle lock file inconsistencies
RUN npm install --only=production && npm cache clean --force

# Copy built application
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist

USER nestjs

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:4000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

CMD ["node", "dist/apps/api-gateway/main.js"]
