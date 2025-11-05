# Multi-stage Dockerfile for Decode Backend Microservices
# This Dockerfile supports building all microservices in the monorepo

# Stage 1: Base image with Node.js and dependencies
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Install system dependencies needed for native module compilation
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Copy package files
COPY package*.json ./
COPY nest-cli.json ./

# Stage 2: Development dependencies
FROM base AS development

# Install all dependencies including dev dependencies
# This ensures native modules like dd-trace are built correctly
# Using npm install instead of npm ci to handle lock file inconsistencies
RUN npm install && npm cache clean --force

# Copy source code
COPY . .

# Stage 3: Build stage
FROM development AS build

# Build the application
RUN npm run build:all

# Stage 4: Production image
FROM node:18-alpine AS production

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY --from=build --chown=nestjs:nodejs /app/package*.json ./

# Install only production dependencies
# Using npm install instead of npm ci to handle lock file inconsistencies
RUN npm install --only=production && npm cache clean --force

# Copy built application
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist

# Switch to non-root user
USER nestjs

# Expose port (will be overridden in docker-compose)
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:4000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Default command (will be overridden in docker-compose)
CMD ["node", "dist/apps/api-gateway/main.js"]
