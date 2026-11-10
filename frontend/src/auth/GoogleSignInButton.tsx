import { useEffect, useRef } from 'react'

type CredentialResponse = { credential?: string }

type GoogleAccountsId = {
  initialize: (options: {
    client_id: string
    callback: (response: CredentialResponse) => void
    ux_mode?: 'popup'
  }) => void
  renderButton: (parent: HTMLElement, options: Record<string, string | number>) => void
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } }
  }
}

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

let scriptPromise: Promise<void> | null = null

/** 구글 스크립트는 로그인 화면에서, 구글 로그인이 켜져 있을 때만 받는다. 앱 전체가 그 무게를 지지 않게 한다. */
function loadGoogleScript() {
  if (window.google?.accounts?.id) {
    return Promise.resolve()
  }
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      // 다음에 다시 시도할 수 있게 비운다.
      scriptPromise = null
      reject(new Error('구글 로그인을 불러오지 못했어요.'))
    }
    document.head.appendChild(script)
  })
  return scriptPromise
}

/**
 * "Google 계정으로 계속하기" 버튼.
 *
 * 버튼은 구글이 자기 iframe 안에 그린다. 모양을 우리가 꾸미지 않는 이유는 구글의 브랜드 규칙이기도 하고,
 * 그래야 이 화면의 코드가 사용자의 구글 계정에 손댈 수 없기 때문이다. 우리가 받는 것은 구글이 서명한 토큰 한 줄뿐이고,
 * 그 토큰이 진짜인지는 서버가 확인한다.
 *
 * 클라이언트 ID 는 로그인 화면이 서버에서 받아 넘겨준다. 위에 다른 로그인 방법이 있을 때만 "또는" 줄을 긋는다.
 */
export function GoogleSignInButton({ clientId, onCredential, divider = false }: { clientId: string; onCredential: (credential: string) => void; divider?: boolean }) {
  const slotRef = useRef<HTMLDivElement>(null)
  const callbackRef = useRef(onCredential)

  useEffect(() => {
    callbackRef.current = onCredential
  }, [onCredential])

  useEffect(() => {
    let ignore = false
    loadGoogleScript()
      .then(() => {
        const slot = slotRef.current
        const googleId = window.google?.accounts.id
        if (ignore || !slot || !googleId) return
        googleId.initialize({
          client_id: clientId,
          ux_mode: 'popup',
          callback: (response) => {
            if (response.credential) callbackRef.current(response.credential)
          },
        })
        slot.replaceChildren()
        googleId.renderButton(slot, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          shape: 'rectangular',
          text: 'continue_with',
          logo_alignment: 'center',
          locale: 'ko',
          // 구글이 받는 너비는 200~400px 이다.
          width: Math.min(400, Math.max(200, Math.round(slot.offsetWidth))),
        })
      })
      .catch(() => {
        // 광고 차단이나 네트워크로 스크립트가 막힌 경우. 자리만 비고 나머지는 그대로 쓴다.
      })
    return () => {
      ignore = true
    }
  }, [clientId])

  return (
    <div className="space-y-4">
      {divider && (
        <div className="flex items-center gap-3 text-[13px] font-semibold text-slate-400" aria-hidden="true">
          <span className="h-px flex-1 bg-slate-200" />
          또는
          <span className="h-px flex-1 bg-slate-200" />
        </div>
      )}
      <div ref={slotRef} className="flex min-h-[44px] justify-center" />
    </div>
  )
}
