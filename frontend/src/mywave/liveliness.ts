import { createContext, useContext, useEffect, useState } from 'react'

/**
 * 화면 활기.
 *
 * 움직임의 세기를 사용자가 고른다. 셋 중 하나다.
 *  - quiet  조용히: 숫자와 글만 움직인다. 배경, 물결, 벨루가는 가만히 있다.
 *  - normal 보통:   물결과 기포, 벨루가 숨쉬기 정도. 기본값.
 *  - lively 신나게: 배경이 흐르고 카드가 떠 있고 벨루가가 혼자 논다.
 *
 * 값은 <html data-liveliness> 에 실린다. CSS 는 그 속성으로 켜고 끄고,
 * JS 쪽(벨루가 혼자 놀기, 전역 커서 따라보기)은 useLiveliness() 로 읽는다.
 * 운영체제의 동작 줄이기는 이 설정과 상관없이 늘 우선한다.
 */
export type LivelinessLevel = 'quiet' | 'normal' | 'lively'

export const LIVELINESS_LEVELS: ReadonlyArray<{ level: LivelinessLevel; label: string; hint: string }> = [
  { level: 'quiet', label: '조용히', hint: '숫자와 글만 움직여요.' },
  { level: 'normal', label: '보통', hint: '물결과 기포, 벨루가 숨쉬기 정도.' },
  { level: 'lively', label: '신나게', hint: '배경이 흐르고 카드가 떠 있고 벨루가가 혼자 놀아요.' },
]

const STORAGE_KEY = 'mywave:liveliness'

export const LivelinessContext = createContext<{ level: LivelinessLevel; setLevel: (level: LivelinessLevel) => void }>({
  level: 'normal',
  setLevel: () => {},
})

export function useLiveliness() {
  const { level, setLevel } = useContext(LivelinessContext)
  return { level, setLevel, lively: level === 'lively', quiet: level === 'quiet' }
}

/** Shell 이 한 번 부른다. 저장된 값을 읽고, 바뀔 때마다 <html> 과 저장소에 쓴다. */
export function useLivelinessState() {
  const [level, setLevel] = useState<LivelinessLevel>(readStoredLevel)

  useEffect(() => {
    document.documentElement.dataset.liveliness = level
    try {
      window.localStorage.setItem(STORAGE_KEY, level)
    } catch {
      /* 비공개 창에서는 저장이 막힐 수 있다. 이번 방문 동안은 유지된다. */
    }
  }, [level])

  return { level, setLevel }
}

function readStoredLevel(): LivelinessLevel {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored === 'quiet' || stored === 'lively' ? stored : 'normal'
  } catch {
    return 'normal'
  }
}
