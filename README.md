# StockFlow

StockFlow는 사용자가 직접 입력한 투자 기록을 기반으로 보유 종목, 수익률, 자산 비중, 뉴스 영향도, AI 체크포인트를 분석하는 투자 기록/포트폴리오 관리 웹앱 프로토타입입니다.

이 프로젝트는 실제 증권사 API, 실제 계좌 연동, 실제 주문 기능을 포함하지 않습니다. 포트폴리오는 사용자가 입력한 거래 기록을 바탕으로 계산하는 구조입니다. 시세와 테마탐색 뉴스는 외부 참고 데이터 Provider를 사용할 수 있고, Provider 실패 시에는 seed/mock data로 화면을 유지합니다. AI는 매수/매도 추천이 아니라 확인해야 할 점, 리스크, 뉴스 변화, 재무지표 변화, 내 보유 기준 영향도를 정리합니다.

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
    transaction/
    memo/
    upload/
    watchlist/
    news/
    research/
    theme/
    marketdata/
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

## 주요 페이지

- `/` 홈 대시보드
- `/login` 로그인
- `/register` 회원가입
- `/market` 시장 페이지
- `/stock/005930` 종목 상세 및 체크포인트
- `/portfolio` 포트폴리오
- `/transactions` 거래 기록 입력/관리
- `/trade` 기존 호환 리다이렉트
- `/themes` 테마/공급망 연관 종목 탐색
- `/research` AI 체크포인트

## 외부 참고 데이터

기본 설정은 `stockflow.market-data.provider: yahoo`입니다.

- 시세 갱신: Yahoo Finance chart endpoint를 통해 현재가, 고가, 저가, 거래량을 참고 데이터로 가져옵니다.
- 테마탐색 뉴스: Google News RSS 검색 결과를 읽어 최신 기사 제목, 출처, 발행시간, 반복 키워드를 표시합니다.
- 네트워크 오류나 외부 응답 실패 시 기존 seed/mock data로 보정합니다.
- 실제 증권사 주문, 체결, 계좌 잔고와는 연결되지 않습니다.
- 테마 관련 종목 설명은 기본적으로 뉴스 근거와 공급망 관계를 바탕으로 로컬 설명을 생성합니다.
- `stockflow.ai.provider: openai`와 `OPENAI_API_KEY`를 설정하면 OpenAI Responses API 기반 설명으로 교체됩니다. 이 경우에도 매수/매도 추천, 목표가, 상승 확률 표현은 사용하지 않도록 제한합니다.

데모 시세 Provider로 되돌리려면 `application.yml`에서 아래처럼 변경하세요.

```yaml
stockflow:
  market-data:
    provider: demo
```

선택적 AI Provider 설정:

```yaml
stockflow:
  ai:
    provider: openai
    openai:
      api-key: ${OPENAI_API_KEY}
      model: ${OPENAI_MODEL:gpt-4.1-mini}
```

## 주요 API

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/members/me`
- `GET /api/data/status`
- `POST /api/data/refresh`
- `GET /api/market/indices`
- `GET /api/market/indices/{code}/prices`
- `GET /api/stocks`
- `GET /api/stocks/{symbol}`
- `GET /api/stocks/{symbol}/prices`
- `GET /api/stocks/{symbol}/news`
- `GET /api/transactions`
- `POST /api/transactions`
- `GET /api/transactions/{id}`
- `PATCH /api/transactions/{id}`
- `DELETE /api/transactions/{id}`
- `GET /api/transactions/summary`
- `GET /api/transactions/timeline`
- `POST /api/transactions/import/csv`
- `GET /api/holdings`
- `GET /api/holdings/{symbol}`
- `GET /api/portfolio`
- `GET /api/portfolio/holdings`
- `GET /api/portfolio/performance`
- `GET /api/portfolio/allocation`
- `GET /api/portfolio/transactions`
- `GET /api/investment-memos`
- `POST /api/investment-memos`
- `PATCH /api/investment-memos/{id}`
- `DELETE /api/investment-memos/{id}`
- `POST /api/uploads/screenshots`
- `GET /api/news`
- `GET /api/news/briefing`
- `GET /api/news/research`
- `GET /api/research/briefing`
- `GET /api/research/sentiment`
- `GET /api/research/risks`
- `GET /api/research/portfolio-impact`
- `GET /api/themes`
- `GET /api/themes/search?keyword=nvidia`

## CSV 형식

```csv
date,type,symbol,stockName,quantity,price,fee,tax,memo,reason,tags
2026-05-25,BUY,005930,삼성전자,10,78600,590,0,6개월 이상 보유 예정,HBM 수요 증가 기대,반도체|장기보유
```

## 주의사항

StockFlow는 투자 기록 관리 및 참고용 정보 제공을 목적으로 하며, 투자 판단의 최종 책임은 본인에게 있습니다. 실제 주문·체결 기능은 제공하지 않습니다.
