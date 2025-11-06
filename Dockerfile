# Multi-stage build for Pulse Fetch HTTP Server

# Stage 1: Builder
FROM node:18-alpine AS builder

WORKDIR /app

# Copy root package files and shared package
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY shared/ ./shared/

# Copy remote package files
COPY remote/package*.json ./remote/

# Install dependencies for shared
WORKDIR /app/shared
RUN npm ci

# Build shared
RUN npm run build

# Install dependencies for remote
WORKDIR /app/remote
RUN npm ci

# Copy remote source
COPY remote/src ./src
COPY remote/tsconfig.json ./

# Build remote
RUN npm run build

# Stage 2: Production
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY --from=builder /app/remote/package*.json ./
COPY --from=builder /app/shared/package*.json ./shared/

# Copy built files
COPY --from=builder /app/remote/build ./build
COPY --from=builder /app/shared/build ./shared/build

# Install production dependencies only
RUN npm ci --only=production

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start server
CMD ["node", "build/index.js"]
