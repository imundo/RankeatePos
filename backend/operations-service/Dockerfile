# Multi-stage build for operations-service
# Build context is ../backend (includes parent pom and shared-lib)
# Cache bust: 2025-12-25-v3

FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /build

# ARG to bust cache - Railway will invalidate layers after this
ARG CACHEBUST=1
RUN echo "Cache bust: $CACHEBUST - $(date)"

# Copy everything needed (cache invalidated by ARG above)
COPY pom.xml ./pom.xml
COPY shared-lib ./shared-lib
COPY operations-service ./operations-service

# Install parent POM first (non-recursive), then shared-lib, then operations-service
# Version 2 - force rebuild
RUN mvn install -N -DskipTests -B && \
    mvn -f shared-lib/pom.xml clean install -DskipTests -B && \
    mvn -f operations-service/pom.xml clean package -DskipTests -B

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create non-root user
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy JAR from build stage
COPY --from=build /build/operations-service/target/*.jar app.jar

# Environment
ENV SPRING_PROFILES_ACTIVE=docker

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s \
    CMD wget -q --spider http://localhost:8086/actuator/health || exit 1

EXPOSE 8086

ENTRYPOINT ["java", "-jar", "app.jar"]
