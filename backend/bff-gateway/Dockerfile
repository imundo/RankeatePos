# Multi-stage build for bff-gateway
# Build context is ../backend (includes parent pom and shared-lib)

FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /build

# Copy everything needed
COPY pom.xml ./pom.xml
COPY shared-lib ./shared-lib
COPY bff-gateway ./bff-gateway

# Install parent POM first (non-recursive), then shared-lib, then bff-gateway
RUN mvn install -N -DskipTests -B && \
    mvn -f shared-lib/pom.xml clean install -DskipTests -B && \
    mvn -f bff-gateway/pom.xml clean package -DskipTests -B

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create non-root user
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy JAR from build stage
COPY --from=build /build/bff-gateway/target/*.jar app.jar

# Environment
ENV SPRING_PROFILES_ACTIVE=docker

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s \
    CMD wget -q --spider http://localhost:${PORT:-8080}/actuator/health || exit 1

EXPOSE 8080

ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
