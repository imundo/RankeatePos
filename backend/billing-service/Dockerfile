FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /build

COPY pom.xml /build/pom.xml
COPY shared-lib/pom.xml /build/shared-lib/pom.xml
COPY auth-service/pom.xml /build/auth-service/pom.xml
COPY catalog-service/pom.xml /build/catalog-service/pom.xml
COPY sales-service/pom.xml /build/sales-service/pom.xml
COPY inventory-service/pom.xml /build/inventory-service/pom.xml
COPY bff-gateway/pom.xml /build/bff-gateway/pom.xml
COPY billing-service/pom.xml /build/billing-service/pom.xml

COPY shared-lib /build/shared-lib
COPY billing-service /build/billing-service

RUN apk add --no-cache maven && \
    mvn install -N -DskipTests && \
    mvn -f /build/shared-lib/pom.xml install -DskipTests && \
    mvn -f /build/billing-service/pom.xml package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /build/billing-service/target/*.jar app.jar
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s \
    CMD wget -q --spider http://localhost:8084/health || exit 1

EXPOSE 8084
ENTRYPOINT ["java", "-jar", "app.jar"]
