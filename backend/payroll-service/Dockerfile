FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /build

ARG CACHEBUST=1
RUN echo "Cache bust: $CACHEBUST - $(date)"

COPY pom.xml ./pom.xml
COPY shared-lib ./shared-lib
COPY payroll-service ./payroll-service

RUN mvn install -N -DskipTests -B && \
    mvn -f shared-lib/pom.xml clean install -DskipTests -B && \
    mvn -f payroll-service/pom.xml clean package -DskipTests -B

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

COPY --from=build /build/payroll-service/target/*.jar app.jar

ENV SPRING_PROFILES_ACTIVE=docker

ENTRYPOINT ["java", "-jar", "app.jar"]
