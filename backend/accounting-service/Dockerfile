# Multi-stage build for accounting-service
# Build context is ../backend (includes parent pom and shared-lib)

FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /build

# ARG to bust cache if needed
ARG CACHEBUST=1
RUN echo "Cache bust: $CACHEBUST - $(date)"

# Copy everything needed
COPY pom.xml ./pom.xml
COPY shared-lib ./shared-lib
COPY accounting-service ./accounting-service

# Install parent POM first (non-recursive), then shared-lib, then accounting-service
RUN mvn install -N -DskipTests -B && \
    mvn -f shared-lib/pom.xml clean install -DskipTests -B && \
    mvn -f accounting-service/pom.xml clean package -DskipTests -B

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create non-root user
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy JAR from build stage
COPY --from=build /build/accounting-service/target/*.jar app.jar

# Environment
ENV SPRING_PROFILES_ACTIVE=docker

# Note: Railway manages healthcheck and PORT assignment dynamically
# The app uses ${PORT} environment variable from application.yml

ENTRYPOINT ["java", "-jar", "app.jar"]
