# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Cache bust to force rebuild
ARG CACHEBUST=3
RUN echo "Cache bust: $CACHEBUST - API Integration Complete"

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies - use install with legacy-peer-deps for compatibility
RUN npm install --legacy-peer-deps

# Copy source and build for Docker local environment
COPY . .
RUN npm run build:docker

# Runtime stage
FROM nginx:alpine

# Copy built app to nginx
COPY --from=build /app/dist/pos-app/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
