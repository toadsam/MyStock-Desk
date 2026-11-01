FROM eclipse-temurin:17-jdk AS builder
WORKDIR /app
COPY gradlew gradlew.bat settings.gradle build.gradle ./
COPY gradle ./gradle
RUN chmod +x gradlew
# 의존성만 먼저 받아 두면 소스가 바뀌어도 이 레이어는 캐시에 남는다.
RUN ./gradlew dependencies --no-daemon -q > /dev/null 2>&1 || true
COPY src ./src
RUN ./gradlew bootJar --no-daemon
# build.gradle 이 산출물을 OS 임시 폴더에 둔다(Windows OneDrive 경로 문제 회피). 컨테이너 안에서는 /tmp 다.

FROM eclipse-temurin:17-jre
WORKDIR /app
RUN groupadd --system stockflow && useradd --system --gid stockflow --no-create-home stockflow
COPY --from=builder /tmp/stockflow-backend-build/libs/*.jar app.jar
USER stockflow
# 운영 프로파일이 기본. 개발 프로파일로 띄우려면 compose 나 docker run 에서 SPRING_PROFILES_ACTIVE 를 덮는다.
ENV SPRING_PROFILES_ACTIVE=prod \
    JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -Duser.timezone=Asia/Seoul"
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
