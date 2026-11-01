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
# 백엔드 주소. compose 에서는 서비스 이름 backend 로 닿는다.
ENV BACKEND_UPSTREAM=backend:8080 \
    NGINX_ENVSUBST_FILTER=^BACKEND_
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
