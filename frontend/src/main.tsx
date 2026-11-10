import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { AuthProvider } from './auth/AuthContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)

/**
 * index.html 에 적어 둔 첫 화면(스플래시)을 걷어 낸다.
 *
 * 앱이 준비되면 바로 걷는다. 일부러 기다리게 하지 않는다.
 * 다만 이번 방문에서 처음 열었을 때는 깜빡하고 사라지지 않게 벨루가가 올라올 만큼(0.9초)은 보여 준다.
 * 같은 방문에서 새로고침할 때는 그 시간도 두지 않는다.
 */
const SPLASH_SEEN_KEY = 'mywave:splash-seen'
const SPLASH_MIN_MS = 900

let splashDismissed = false

function dismissSplash() {
  if (splashDismissed) return
  splashDismissed = true
  const splash = document.getElementById('splash')
  if (!splash) return
  let seen = false
  try {
    seen = sessionStorage.getItem(SPLASH_SEEN_KEY) === '1'
    sessionStorage.setItem(SPLASH_SEEN_KEY, '1')
  } catch {
    // 비공개 창에서는 저장이 막힐 수 있다. 그러면 매번 처음처럼 보여 준다.
  }
  const wait = seen ? 0 : Math.max(0, SPLASH_MIN_MS - performance.now())
  window.setTimeout(() => {
    splash.classList.add('splash-out')
    window.setTimeout(() => splash.remove(), 450)
  }, wait)
}

// 첫 화면이 실제로 그려진 다음 프레임에 걷는다. 그 전에 걷으면 빈 화면이 한 번 비친다.
requestAnimationFrame(() => requestAnimationFrame(dismissSplash))
// 가려진 탭에서는 다음 프레임이 오지 않는다. 그 경우에도 스플래시가 앱을 덮은 채 남지 않게 시간으로도 걷는다.
window.setTimeout(dismissSplash, 1500)
