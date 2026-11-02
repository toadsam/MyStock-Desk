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
# curl 은 compose 의 healthcheck(/api/health)가 쓴다.
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*     && groupadd --system stockflow && useradd --system --gid stockflow --no-create-home stockflow
COPY --from=builder /tmp/stockflow-backend-build/libs/*.jar app.jar
USER stockflow
# 운영 프로파일이 기본. 개발 프로파일로 띄우려면 compose 나 docker run 에서 SPRING_PROFILES_ACTIVE 를 덮는다.
ENV SPRING_PROFILES_ACTIVE=prod \
    JAVA_TOOL_OPTIONS="-Xms128m -Xmx512m -XX:MaxMetaspaceSize=192m -Duser.timezone=Asia/Seoul"
# 힙 상한을 고정하는 이유: 컨테이너 한도가 크면(Railway 는 8GB) 비율로 두었을 때 Java 가 필요 이상으로 메모리를 늘려 잡고,
# 쓴 메모리만큼 요금이 된다. 이 앱은 512MB 힙이면 충분하다. 플랫폼 변수로 JAVA_TOOL_OPTIONS 를 주면 그 값이 이긴다.
EXPOSE 8080
# 포트는 prod 프로파일이 ${PORT:8080} 으로 읽는다. Railway 처럼 PORT 를 넣어 주는 곳에서는 그 값을 따른다.
HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=5 CMD curl -fsS http://127.0.0.1:${PORT:-8080}/api/health > /dev/null || exit 1
ENTRYPOINT ["java", "-jar", "app.jar"]
