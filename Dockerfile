# Use official Node.js image
FROM node:20-alpine

WORKDIR /app

# Copy package files and install ALL dependencies (including dev)
COPY package.json package-lock.json* ./
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Remove dev dependencies for a smaller image
RUN npm prune --production

ENV NODE_ENV=production

# Create a non-root user and group
RUN addgroup -g 1001 appuser && adduser -D -u 1001 -G appuser appuser

# Ensure /app/data exists and is owned by appuser
RUN mkdir -p /app/data && chown -R appuser:appuser /app/data

VOLUME ["/app/data"]

# Switch to non-root user
USER appuser

CMD ["node", "dist/index.js"]
