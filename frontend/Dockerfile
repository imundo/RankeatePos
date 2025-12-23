# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files from pos-app
COPY pos-app/package.json pos-app/package-lock.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source and build
COPY pos-app/ .
RUN npm run build:railway

# Runtime stage
FROM nginx:alpine

# Copy built app to nginx
COPY --from=build /app/dist/pos-app/browser /usr/share/nginx/html
COPY pos-app/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
