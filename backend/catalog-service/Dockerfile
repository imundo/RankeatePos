# Multi-stage build for catalog-service
# Build context is ../backend (includes parent pom and shared-lib)

FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /build

# Copy everything needed
COPY pom.xml ./pom.xml
COPY shared-lib ./shared-lib
COPY catalog-service ./catalog-service

# Install parent POM first (non-recursive), then shared-lib, then catalog-service
RUN mvn install -N -DskipTests -B && \
    mvn -f shared-lib/pom.xml clean install -DskipTests -B && \
    mvn -f catalog-service/pom.xml clean package -DskipTests -B

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create non-root user
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy JAR from build stage
COPY --from=build /build/catalog-service/target/*.jar app.jar

# Environment
ENV SPRING_PROFILES_ACTIVE=docker

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s \
    CMD wget -q --spider http://localhost:8082/actuator/health || exit 1

EXPOSE 8082

ENTRYPOINT ["java", "-jar", "app.jar"]
