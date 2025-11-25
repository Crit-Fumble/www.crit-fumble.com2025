# MCP Server for Background Test Execution
# Provides Model Context Protocol server for running Playwright tests

FROM node:20-slim

# Install only essential dependencies
RUN apt-get update && apt-get install -y \
    docker.io \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set up working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies for MCP server
# This dramatically reduces build time by skipping Playwright browsers
RUN npm install --omit=dev express uuid

# Copy MCP server code (lightweight, no tests needed in MCP container)
COPY mcp-server/ ./mcp-server/
COPY docker/ ./docker/
COPY docker-compose.test.yml ./

# Create directories for MCP server state
RUN mkdir -p /app/mcp-state \
             /app/mcp-logs \
             /app/test-results

# Environment configuration
ENV NODE_ENV=production
ENV MCP_PORT=3333
ENV MCP_HOST=0.0.0.0
ENV DOCKER_HOST=unix:///var/run/docker.sock

# Expose MCP server port
EXPOSE 3333

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3333/health || exit 1

# Start MCP server
CMD ["node", "mcp-server/index.js"]
