# StockFlow

StockFlow는 관심종목, 시장 현황, 뉴스 브리핑, 포트폴리오, 가상 매수/매도, AI 투자 요약을 한 화면에서 관리하는 주식/투자 관리 웹앱 프로토타입입니다.

이 프로젝트는 실제 증권사 API, 계좌 연동, 실주문 기능을 포함하지 않습니다. 모든 데이터와 AI 분석은 mock/seed data 기반이며, 주문은 가상 주문/가상 체결로만 처리됩니다.

## 기술 스택

- Frontend: React, TypeScript, Vite, TailwindCSS, React Router, Axios, Recharts, lucide-react
- Backend: Java 17, Spring Boot, Spring Web, Spring Data JPA, Spring Security, Validation, Lombok
- Database: H2 기본 실행, MySQL 전환용 `application-mysql.yml` 제공

## 프로젝트 구조

```text
backend/
  src/main/java/com/stockflow/
    global/
    member/
    stock/
    market/
    portfolio/
    watchlist/
    news/
    trade/
    research/
    seed/
frontend/
  src/
    api/
    components/
    layouts/
    pages/
    types/
    utils/
```

## 백엔드 실행

```bash
cd backend
./gradlew bootRun
```

Windows PowerShell:

```powershell
cd backend
.\gradlew.bat bootRun
```

백엔드는 `http://localhost:8080`에서 실행됩니다.

기본 데모 계정:

- Email: `investor@stockflow.com`
- Password: `stockflow1234`

Windows OneDrive 경로에서 Gradle이 `.class` 파일 동기화 속성 때문에 실패하지 않도록 백엔드 빌드 산출물은 OS 임시 폴더의 `stockflow-backend-build`에 생성되도록 설정했습니다.

## 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

프론트엔드는 기본적으로 `http://localhost:5173`에서 실행됩니다.

환경변수 예시는 [frontend/.env.example](frontend/.env.example)를 참고하세요.

```env
VITE_API_BASE_URL=http://localhost:8080
```

## H2 콘솔

- URL: `http://localhost:8080/h2-console`
- JDBC URL: `jdbc:h2:mem:stockflow`
- Username: `sa`
- Password: 빈 값

## MySQL 전환

`backend/src/main/resources/application-mysql.yml`에 MySQL 연결 설정이 준비되어 있습니다.

```bash
cd backend
./gradlew bootRun --args='--spring.profiles.active=mysql'
```

## 주요 페이지

- `/` 홈 대시보드
- `/login` 로그인
- `/register` 회원가입
- `/market` 시장 페이지
- `/stock/005930` 종목 상세
- `/portfolio` 포트폴리오
- `/trade` 주문/체결
- `/research` AI 리서치

## 주요 API

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/members/me`
- `GET /api/data/status`
- `POST /api/data/refresh`
- `GET /api/market/indices`
- `GET /api/market/indices/{code}/prices`
- `GET /api/market/heatmap`
- `GET /api/market/sectors`
- `GET /api/market/breadth`
- `GET /api/stocks`
- `GET /api/stocks/{symbol}`
- `GET /api/stocks/{symbol}/prices`
- `GET /api/stocks/{symbol}/orderbook`
- `GET /api/stocks/{symbol}/news`
- `GET /api/watchlist`
- `POST /api/watchlist/{symbol}`
- `DELETE /api/watchlist/{symbol}`
- `GET /api/portfolio`
- `GET /api/portfolio/holdings`
- `GET /api/portfolio/performance`
- `GET /api/portfolio/allocation`
- `GET /api/portfolio/transactions`
- `POST /api/trades/orders`
- `GET /api/trades/orders`
- `GET /api/trades/executions`
- `PATCH /api/trades/orders/{orderId}/cancel`
- `GET /api/news`
- `GET /api/news/briefing`
- `GET /api/news/research`
- `GET /api/research/briefing`
- `GET /api/research/sentiment`
- `GET /api/research/risks`
- `GET /api/research/recommendations`
- `GET /api/research/portfolio-impact`

## 주의사항

StockFlow는 실제 투자/주문 서비스가 아닙니다. 모든 포트폴리오, 뉴스, 주가, AI 분석, 주문/체결 데이터는 데모용 가상 데이터입니다. `POST /api/data/refresh`도 데모 시세 Provider를 통해 mock 시세를 갱신할 뿐이며, 결제, 실명인증, 계좌연동, 민감정보 입력, 실제 매수/매도 기능은 구현하지 않았습니다.
