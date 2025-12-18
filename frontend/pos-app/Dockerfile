# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies - use install with legacy-peer-deps for compatibility
RUN npm install --legacy-peer-deps

# Copy source and build
COPY . .
RUN npm run build:prod

# Runtime stage
FROM nginx:alpine

# Copy built app to nginx
COPY --from=build /app/dist/pos-app/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
