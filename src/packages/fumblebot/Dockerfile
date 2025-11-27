# FumbleBot Dockerfile
# Production-ready image for DigitalOcean droplet deployment

FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache \
    bash \
    curl \
    git \
    openssl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate --schema=prisma/schema.prisma

# Build TypeScript
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S fumblebot && \
    adduser -S fumblebot -u 1001

# Change ownership
RUN chown -R fumblebot:fumblebot /app

# Switch to non-root user
USER fumblebot

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Expose port
EXPOSE 3000

# Start bot
CMD ["npm", "start"]
