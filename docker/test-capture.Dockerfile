# Test Capture Container
# Provides enhanced video/screenshot capture tools for Playwright tests
# Can be used standalone or via MCP server for background test execution

FROM mcr.microsoft.com/playwright:v1.40.0-jammy

# Install additional capture and processing tools
RUN apt-get update && apt-get install -y \
    ffmpeg \
    imagemagick \
    gifsicle \
    optipng \
    jpegoptim \
    xvfb \
    x11vnc \
    fluxbox \
    && rm -rf /var/lib/apt/lists/*

# Set up working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Install dependencies
RUN npm install -g pnpm && pnpm install

# Copy test files and configuration
COPY playwright.config.ts ./
COPY tests/ ./tests/
COPY tsconfig.json ./

# Copy source files needed for tests
COPY src/ ./src/
COPY prisma/ ./prisma/

# Create output directories
RUN mkdir -p /app/tests/screenshots \
             /app/tests/videos \
             /app/tests/results \
             /app/tests/traces

# Set up environment for headless operation with video
ENV DISPLAY=:99
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Create startup script for running tests with enhanced capture
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
# Start virtual display for video capture\n\
Xvfb :99 -screen 0 1920x1080x24 > /dev/null 2>&1 &\n\
XVFB_PID=$!\n\
\n\
# Wait for X server\n\
sleep 2\n\
\n\
# Run tests\n\
echo "Running Playwright tests with enhanced capture..."\n\
pnpm test:e2e "$@"\n\
\n\
# Process captures if requested\n\
if [ "$PROCESS_CAPTURES" = "true" ]; then\n\
  echo "Processing video captures..."\n\
  find /app/tests/videos -name "*.webm" -exec ffmpeg -i {} -vf "scale=1280:720" -c:v libx264 -crf 23 {}.mp4 \\;\n\
  \n\
  echo "Optimizing screenshots..."\n\
  find /app/tests/screenshots -name "*.png" -exec optipng -o2 {} \\;\n\
fi\n\
\n\
# Cleanup\n\
kill $XVFB_PID || true\n\
\n\
echo "Test execution complete!"\n\
' > /app/run-tests.sh && chmod +x /app/run-tests.sh

# Expose port for VNC (optional - for debugging)
EXPOSE 5900

# Default command
CMD ["/app/run-tests.sh"]
