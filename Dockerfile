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

# Remove default files
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf

# Copy optimized nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
