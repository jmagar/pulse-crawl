# Multi-stage build for Pulse Fetch HTTP Server

# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files (includes workspace configuration)
COPY package*.json ./

# Copy workspace packages
COPY shared/ ./shared/
COPY remote/ ./remote/

# Install all dependencies via root workspace
RUN npm ci

# Build shared
WORKDIR /app/shared
RUN npm run build

# Build remote
WORKDIR /app/remote
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Copy root package files (workspace configuration)
COPY --from=builder /app/package*.json ./

# Copy workspace package files
COPY --from=builder /app/shared/package*.json ./shared/
COPY --from=builder /app/remote/package*.json ./remote/

# Copy built files
COPY --from=builder /app/remote/dist ./remote/dist
COPY --from=builder /app/shared/dist ./shared/dist
# Copy shared dist into remote/dist/shared to match compiled import paths
COPY --from=builder /app/shared/dist ./remote/dist/shared

# Install all production dependencies via workspace
RUN npm ci --omit=dev --ignore-scripts

# Move to remote directory for runtime
WORKDIR /app/remote

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start server
CMD ["node", "/app/remote/dist/index.js"]
