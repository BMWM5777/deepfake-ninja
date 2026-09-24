# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definitions and install cleanly
COPY package*.json ./
RUN npm ci

# Copy source files and compile production bundle
COPY . .
RUN npm run build

# Production Server Stage
FROM nginx:alpine

# Install Node.js for the shared leaderboard API
RUN apk add --no-cache nodejs && \
    rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf

# Setup app directory and data volume
WORKDIR /app
COPY server.js start.sh ./
RUN chmod +x start.sh && mkdir -p /app/data

# Copy optimized nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1/healthz || exit 1

CMD ["/app/start.sh"]
