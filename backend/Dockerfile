FROM maven:3.9.11-eclipse-temurin-21 AS build
WORKDIR /build
COPY pom.xml .
COPY src ./src
RUN mvn -B -ntp verify

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /build/target/accounts-0.0.1-SNAPSHOT.jar app.jar
USER 10001
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=70.0", "-jar", "/app/app.jar"]
