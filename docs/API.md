# API 명세

MyWave 화면이 실제로 부르는 엔드포인트 58개입니다. 프론트의 [`myWaveApi.ts`](../frontend/src/mywave/myWaveApi.ts)와 [`authApi.ts`](../frontend/src/api/authApi.ts)에서 호출하는 주소를 컨트롤러와 하나씩 맞춰 봤습니다(2026-10-12). 백엔드에는 이 밖에도 예전 모의투자 화면이 쓰던 엔드포인트가 50개 남짓 더 있습니다. 맨 아래에 묶어서만 적었습니다.

## 공통

**주소.** 로컬 기본값은 `http://localhost:8080`입니다.

**인증.** `/api/auth/**`를 뺀 모든 요청에 로그인할 때 받은 토큰을 붙입니다. 세션은 쓰지 않습니다(`STATELESS`). 토큰은 24시간 유효합니다. 로그아웃한 토큰과, 비밀번호를 바꾸기 전에 발급된 토큰은 만료 전이라도 401입니다.

```http
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**응답 모양.** 성공이든 실패든 같은 껍데기에 담깁니다.

```json
{ "success": true,  "data": { ... }, "error": null }
{ "success": false, "data": null,   "error": { "code": "BAD_REQUEST", "message": "계좌를 찾을 수 없습니다." } }
```

| HTTP | `error.code` | 언제 |
|---|---|---|
| 400 | `VALIDATION_ERROR` | `@Valid` 검사 실패. 우리가 적은 문장은 그대로(`금액은 1억 원 이하로 입력해 주세요.`), 라이브러리 기본 문구는 `필드: 이유`로 나갑니다 |
| 400 | `BAD_REQUEST` | 없는 기록, 남의 기록, 잘못된 값 (`IllegalArgumentException`) |
| 400 | `INVALID_JSON` | 요청 본문을 읽을 수 없음 |
| 401 | | 토큰이 없거나 만료, 또는 폐기됨. 프론트는 토큰을 지우고 로그인 화면으로 보냅니다 |
| 403 | `FORBIDDEN` | 로그인은 했지만 이 계정으로는 할 수 없는 일. 지금은 데모 계정의 프로필, 비밀번호 변경 |
| 404 | `NOT_FOUND` | 없는 주소 |
| 405 | `METHOD_NOT_ALLOWED` | 그 주소에서 받지 않는 메서드 |
| 429 | `TOO_MANY_REQUESTS` | 같은 주소에서 같은 이메일로 로그인을 5번 틀림. 10분 동안 맞는 비밀번호도 막힙니다 |
| 503 | `SERVICE_UNAVAILABLE` | `/api/health`에서 DB에 닿지 못함 |
| 500 | `INTERNAL_SERVER_ERROR` | 그 밖의 서버 오류 |

**구글 로그인.** 화면은 이름과 이메일을 보내지 않습니다. 구글이 서명한 ID 토큰만 보내고, 서버가 서명, 발급자, 대상(우리 클라이언트 ID), 만료를 확인한 뒤 토큰 안의 값을 씁니다([`JwksGoogleIdTokenVerifier`](../backend/src/main/java/com/stockflow/auth/google/JwksGoogleIdTokenVerifier.java)). 회원은 이메일이 아니라 구글 계정 번호(`sub`)로 찾습니다. 같은 이메일로 이미 비밀번호 가입이 돼 있으면 합치지 않고 400으로 거절합니다. 구글로 만든 계정은 `member.loginProvider`가 `GOOGLE`이고, 비밀번호 변경은 403입니다.

**입력 한도.** 지출 한 건은 1억 원, 목표·예산·매매 단가는 100억 원, 계좌 잔액은 ±1조 원까지입니다. 지출과 매매는 미래 날짜를, 새 목표는 과거 날짜를 받지 않습니다. 코치 질문은 500자까지입니다.

**형식.** 금액은 숫자(원), 날짜는 `2026-10-12`, 달은 `2026-10`(`yyyy-MM`)입니다. `month`를 빼면 이번 달입니다. 시간대는 `Asia/Seoul`입니다.

**본인 기록만.** `{id}`로 남의 기록을 고치거나 지우려 하면 400 `BAD_REQUEST`가 납니다.

---

## 1. 인증 · 회원

| 메서드 | 주소 | 하는 일 | 요청 |
|---|---|---|---|
| POST | `/api/auth/register` 🔓 | 회원가입. 가입하자마자 로그인된 상태로 토큰을 돌려줌 | `{ name, email, password }` |
| POST | `/api/auth/login` 🔓 | 로그인 | `{ email, password }` |
| GET | `/api/auth/config` 🔓 | 로그인 화면이 뜰 때 묻는 설정. `{ googleClientId, passwordLoginEnabled }`. `googleClientId`가 없으면 구글 로그인이 꺼져 있고, `passwordLoginEnabled`가 `false`면 화면은 이메일·비밀번호 칸과 데모 버튼을 그리지 않고 서버도 `/login`, `/register`에 403 | |
| POST | `/api/auth/google` 🔓 | 구글 로그인. 구글 버튼이 준 ID 토큰을 서버가 직접 검증하고, 처음 온 사람은 그 자리에서 가입시킴. 응답은 로그인과 같음 | `{ credential }` |
| POST | `/api/auth/logout` 🔓 | 로그아웃. 헤더로 온 토큰 한 장을 폐기함. 같은 계정의 다른 로그인은 그대로 | |
| GET | `/api/health` 🔓 | 살아 있는지. DB 커넥션을 하나 빌려 확인하고 `{ status, db }`를 돌려줌. compose healthcheck와 모니터가 부름 | |
| GET | `/api/members/me` | 내 정보 | |
| PATCH | `/api/members/me/profile` | 이름, 이메일, 프로필 이미지 수정. 데모 계정은 403 | `{ name, email, profileImageUrl }` |
| POST | `/api/members/me/password` | 비밀번호 변경. 성공하면 그 전에 받은 토큰이 모두 폐기됨. 데모 계정은 403 | `{ currentPassword, newPassword }` |
| DELETE | `/api/members/me` | 탈퇴. 회원과 그 회원의 기록(`memberId` 칸이 있는 모든 표, 보유 종목, 체결)을 전부 지움. 되돌릴 수 없음. 쓰던 토큰은 그 뒤로 401. 데모 계정은 403 | |

🔓 = 토큰 없이 부를 수 있음

로그인과 회원가입의 응답:

```json
{ "accessToken": "eyJ...", "tokenType": "Bearer",
  "member": { "id": 1, "name": "김투자", "email": "investor@stockflow.com", "membershipGrade": "VIP", ... } }
```

## 2. 홈 · 대시보드

| 메서드 | 주소 | 하는 일 | 요청 |
|---|---|---|---|
| GET | `/api/dashboard/today` | **홈 한 장.** 오늘 더 써도 되는 돈, 이번 주 7일, 오늘 기록, 메인 목표, 투자 요약 | |
| GET | `/api/dashboard/mywave` | 다른 화면들이 같이 쓰는 이번 달 요약. 자산, 목표, 소비, 포트폴리오, 문장형 인사이트 | `?month=` |

`/api/dashboard/today` 응답 (데모 계정, 2026-10-12):

```json
{
  "date": "2026-10-12",
  "budgetSet": true,
  "monthlyLivingBudget": 550000,
  "dailyBudget": 19700,
  "spentToday": 6800,
  "remainingToday": 12900,
  "overToday": 0,
  "remainingLivingBudget": 387300,
  "daysLeftInMonth": 20,
  "baselineDailyBudget": 17700,
  "week": [ { "date": "2026-10-12", "amount": 6800, "today": true, "future": false }, ... ],
  "todayExpenses": [ { "id": 121, "category": "식비", "merchant": "학생식당", "amount": 3800, "spentDate": "2026-10-12", "memo": null, "createdAt": "2026-10-12T12:10:00" } ],
  "mainGoal": { "title": "다음 달까지 30만원 모으기", "progressRate": 37.3, "remainingDays": 16, "dailyRequiredAmount": 11750, ... },
  "investment": { "evaluationAmount": 427300, "returnRate": 6.28, "plannedThisMonth": 30000, "remainingThisMonth": 30000 }
}
```

`budgetSet`이 `false`면 예산을 정하지 않은 것입니다. 이때 `dailyBudget`은 0이고, 화면은 숫자 대신 "예산 정하기"를 띄웁니다. `investment`는 포트폴리오가 없으면 `null`입니다. 각 숫자의 계산식은 [RULES.md](RULES.md#1-오늘-더-써도-되는-돈)에 있습니다.

## 3. 소비

| 메서드 | 주소 | 하는 일 | 요청 |
|---|---|---|---|
| GET | `/api/expenses` | 그 달 소비 목록 (최근 날짜부터) | `?month=` |
| POST | `/api/expenses` | 소비 기록 | `{ category, merchant, amount, spentDate, memo }` |
| PATCH | `/api/expenses/{id}` | 소비 수정 | 위와 같음 |
| DELETE | `/api/expenses/{id}` | 소비 삭제. 홈의 "되돌리기"도 이것 | |
| GET | `/api/expenses/monthly-summary` | 그 달 합계, 지난달 같은 기간과 비교, 일평균, 카테고리별, TOP 3, 6개월 추이 | `?month=` |
| POST | `/api/expenses/saving-simulation` | 카테고리를 몇 % 줄이면 메인 목표 달성률이 얼마가 되는지 | `?month=` + `{ categoryReductionRates: { "카페": 20 }, fixedSavingAmount }` |
| GET | `/api/expenses/cash-flow` | 이번 달 소비와 투자 매수를 한 목록으로. 합계는 따로 | `?month=` |
| GET | `/api/expenses/merchants/suggest` | 가게 이름 자동완성. 예전에 쓴 카테고리와 금액을 같이 줌 | `?q=` |
| POST | `/api/expenses/parse-sms` | 카드 결제 문자를 붙여 넣으면 소비 후보로 바꿈 (저장 안 함) | `{ text }` |
| POST | `/api/expenses/parse-image` | 결제 내역 캡처에서 소비 후보를 읽음 (저장 안 함, 이미지도 저장 안 함) | `multipart/form-data`, `file` |
| GET | `/api/expenses/import-status` | 캡처 읽기를 오늘 몇 번 더 쓸 수 있는지 (하루 20회) | |
| POST | `/api/expenses/bulk` | 문자, 캡처에서 확인한 후보를 한꺼번에 저장 | `{ items: [ExpenseRequest, ...] }` |

`parse-sms`와 `parse-image`는 같은 모양의 후보 목록을 돌려줍니다. 후보마다 추측한 카테고리, 이미 같은 기록이 있는지(`duplicate`), 경고(`warning`)가 붙습니다. 사용자가 확인한 뒤 `bulk`로 저장합니다. 캡처 읽기는 `stockflow.ai.provider: openai`일 때만 비전 모델을 부르고, 기본값 `local`에서는 `import-status`가 `imageParsingAvailable: false`를 돌려주고 화면이 캡처 버튼을 막습니다.

## 4. 퀵버튼 (소비 템플릿)

| 메서드 | 주소 | 하는 일 | 요청 |
|---|---|---|---|
| GET | `/api/expense-templates` | 내 퀵버튼 목록. 홈은 `usageCount`가 높은 3개만 씀 | |
| GET | `/api/expense-templates/suggestions` | 자주 쓴 소비 중 아직 버튼이 아닌 것 추천 | |
| POST | `/api/expense-templates` | 버튼 만들기 | `{ name, category, merchant, amount }` |
| DELETE | `/api/expense-templates/{id}` | 버튼 지우기 | |
| POST | `/api/expense-templates/{id}/log` | **한 번 눌러 기록.** 버튼 내용으로 오늘 소비를 만들고 `usageCount`를 올림. 만든 소비를 돌려줌 | `{ amount?, spentDate? }` (비우면 버튼 금액, 오늘) |

## 5. 목표

| 메서드 | 주소 | 하는 일 | 요청 |
|---|---|---|---|
| GET | `/api/goals` | 목표 목록. 남은 금액, 달성률, 남은 날수, 하루에 모아야 할 돈이 계산되어 나옴 | `?status=ACTIVE` |
| POST | `/api/goals` | 목표 만들기 | `{ title, targetAmount, currentAmount, targetDate, status, priority }` |
| PATCH | `/api/goals/{id}` | 목표 수정. `status: COMPLETED`로 바꾸면 화면에서 축하 화면이 뜸 | 위와 같음 |
| DELETE | `/api/goals/{id}` | 목표 삭제 | |
| GET | `/api/goals/actions` | 추천 행동. 이번 달 가장 많이 쓴 카테고리 3곳을 20% 줄였을 때 아끼는 돈 | |

## 6. 투자

| 메서드 | 주소 | 하는 일 | 요청 |
|---|---|---|---|
| GET | `/api/transactions` | 투자 거래 기록 목록 | |
| POST | `/api/transactions` | 거래 기록. 저장 후 보유 종목을 처음부터 다시 계산 | 아래 참고 |
| PATCH | `/api/transactions/{id}` | 거래 수정. 마찬가지로 다시 계산 | 위와 같음 |
| DELETE | `/api/transactions/{id}` | 거래 삭제. 마찬가지로 다시 계산 | |
| GET | `/api/holdings` | 종목별 보유 요약 (수량, 평균단가, 평가금액, 수익률, 비중) | |
| GET | `/api/portfolio` | 포트폴리오 합계 (총 투자자산, 현금, 손익, 수익률) | |
| POST | `/api/portfolio/risk-actions` | 리스크 화면에서 고른 조정 행동 저장 | `{ action }` |
| GET | `/api/companies/{symbol}/analysis` | 기업 상세. 시세, 재무 지표, 출처 | |
| POST | `/api/watchlist/{symbol}` | 관심 종목 추가 | |
| DELETE | `/api/watchlist/{symbol}` | 관심 종목 해제 | |

거래 요청:

```json
{ "symbol": "005930", "stockName": "삼성전자", "transactionType": "BUY",
  "quantity": 1, "price": 78600, "fee": 0, "tax": 0,
  "transactionDate": "2026-10-12", "memo": "", "reason": "", "tags": ["장기"] }
```

`transactionType`은 `BUY`, `SELL`, `DIVIDEND`, `DEPOSIT`, `WITHDRAWAL` 중 하나입니다.

## 7. 자산 · 예산

| 메서드 | 주소 | 하는 일 | 요청 |
|---|---|---|---|
| GET | `/api/assets/summary` | 총자산, 계좌 잔액 합, 투자자산, 이번 달 소비, 남은 생활비, 투자 가능 금액, 저축률, 그 달 예산 | `?month=` |
| GET | `/api/assets/accounts` | 계좌 목록 | |
| POST | `/api/assets/accounts` | 계좌 등록 (직접 입력, 은행 연결 없음) | `{ name, accountType, institutionName, balance, includedInAssets }` |
| PATCH | `/api/assets/accounts/{id}` | 계좌 수정 | 위와 같음 |
| DELETE | `/api/assets/accounts/{id}` | 계좌 삭제 | |
| POST | `/api/assets/budgets/monthly` | 그 달 예산 저장. 없으면 만들고 있으면 덮어씀 | `{ budgetMonth, incomeAmount, livingBudgetAmount, fixedExpenseAmount, plannedSavingAmount, plannedInvestmentAmount }` |

## 8. 알림 · 코치 · 검색

| 메서드 | 주소 | 하는 일 | 요청 |
|---|---|---|---|
| GET | `/api/notifications` | 알림 목록과 안 읽은 개수 | `?category=` |
| PATCH | `/api/notifications/{id}/read` | 하나 읽음 | |
| PATCH | `/api/notifications/read-all` | 전부 읽음 | |
| DELETE | `/api/notifications/{id}` | 하나 삭제 | |
| DELETE | `/api/notifications/read` | 읽은 알림 전부 삭제 | |
| GET | `/api/ai/financial-coach/messages` | 코치 대화 기록. 처음이면 인사 한 줄을 만들어 줌 | |
| GET | `/api/ai/financial-coach/status` | 모델이 답을 쓰는지(`aiEnabled`), 오늘 남은 AI 답변 횟수(`remainingToday`), 하루 한도(`dailyLimit`) | |
| POST | `/api/ai/financial-coach/chat` | 질문하고 답 받기. 질문과 답 둘 다 저장. 응답의 `source` 가 `AI` 면 모델이 쓴 답, `RULE` 이면 정해진 문장. 질문에 앱이 아는 종목이 나오면 `news`(최근 기사 세 건, 최신순)가 함께 옴 | `{ message }` |
| GET | `/api/search` | 목표, 소비 카테고리, 보유 종목, 종목을 한 번에 검색. 결과마다 `{ type, title, detail, targetPath }` | `?query=` |

코치의 답은 언어 모델이 아니라 규칙이 만듭니다. 질문에 "투자", "소비", "목표"가 들어 있는지 보고 이번 달 숫자로 문장을 조립합니다.

---

## MyWave가 쓰지 않는 나머지

백엔드에 남아 있지만 지금 화면에서 부르지 않습니다. 정리 대상입니다.

| 묶음 | 주소 |
|---|---|
| 모의 주문 | `/api/trades/orders`, `/api/trades/executions`, `/api/trades/ledger` |
| 시장, 종목 | `/api/market/**`, `/api/stocks/**`, `/api/themes/**`, `/api/data/**` |
| 뉴스, 공시, 실적 | `/api/news/**`, `/api/disclosures/sec`, `/api/earnings/calendar` |
| 리서치, AI 리포트 | `/api/research/**`, `/api/ai/portfolio-report/**`, `/api/ai/financial-coach/context` |
| 기타 | `/api/investment-memos/**`, `/api/uploads/screenshots`, `/api/watchlist`(목록, 메모), `/api/portfolio/holdings`, `/api/portfolio/performance`, `/api/portfolio/allocation`, `/api/portfolio/transactions`, `/api/portfolio/study-candidates`, `/api/portfolio/risk-alerts`, `/api/transactions/summary`, `/api/transactions/timeline`, `/api/transactions/import/csv`, `/api/holdings/{symbol}`, `/api/goals/summary` |
