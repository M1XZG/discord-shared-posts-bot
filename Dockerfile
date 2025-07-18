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
VOLUME ["/app/data"]

CMD ["node", "dist/index.js"]
