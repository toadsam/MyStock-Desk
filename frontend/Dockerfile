FROM node:22-alpine AS builder
WORKDIR /app
# 비워 두면(기본) 화면과 같은 주소의 /api 로 부른다. nginx 가 그걸 백엔드로 넘긴다.
# API 를 다른 도메인에 둘 때만 https://api.example.com 처럼 채운다(그러면 백엔드 STOCKFLOW_CORS_ALLOWED_ORIGINS 도 필요하다).
ARG VITE_API_BASE_URL=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
# BACKEND_UPSTREAM: 백엔드 주소. compose 에서는 서비스 이름 backend, Railway 에서는 backend.railway.internal 로 닿는다.
# PORT: nginx 가 듣는 포트. Railway 처럼 플랫폼이 PORT 를 넣어 주면 그 값을 따른다.
# NGINX_RESOLVER 는 비워 두면 시작할 때 /etc/resolv.conf 에서 읽는다(docker/10-nginx-resolver.envsh).
ENV BACKEND_UPSTREAM=backend:8080 \
    PORT=80 \
    NGINX_ENVSUBST_FILTER='^(BACKEND_UPSTREAM|PORT|NGINX_RESOLVER)$'
COPY docker/10-nginx-resolver.envsh /docker-entrypoint.d/10-nginx-resolver.envsh
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
