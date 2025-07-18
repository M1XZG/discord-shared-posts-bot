# Use official Node.js image
FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install --production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Set environment to production
ENV NODE_ENV=production

# Data volume for persistent storage
VOLUME ["/app/data"]

# Start the bot
CMD ["node", "dist/index.js"]
