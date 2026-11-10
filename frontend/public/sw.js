/*
 * MyWave 를 홈 화면에 설치할 수 있게 하는 최소한의 서비스 워커.
 *
 * 아무것도 저장하지 않는다. 화면의 숫자는 전부 서버에서 오기 때문에 연결이 없으면 보여 줄 것이 없고,
 * 화면 코드를 기기에 저장해 두면 새로 배포해도 옛 화면이 계속 뜨는 사고가 나기 쉽다.
 * 그래서 요청은 평소처럼 네트워크로 가게 두고, 설치 조건만 채운다.
 */
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// 일부 브라우저는 fetch 를 듣는 서비스 워커가 있어야 설치를 권한다. 듣기만 하고 손대지 않는다.
self.addEventListener('fetch', () => {})
