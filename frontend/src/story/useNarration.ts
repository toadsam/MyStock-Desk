import { useEffect, useMemo, useState } from 'react'

export function useNarration(text: string, active: boolean) {
  const [enabled, setEnabled] = useState(false)
  const [error, setError] = useState('')
  const [speaking, setSpeaking] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window
  useEffect(() => {
    if (!supported) return
    const refresh = () => setVoices(window.speechSynthesis.getVoices())
    refresh()
    window.speechSynthesis.addEventListener('voiceschanged', refresh)
    return () => { window.speechSynthesis.removeEventListener('voiceschanged', refresh); window.speechSynthesis.cancel() }
  }, [supported])
  const voice = useMemo(
    () => voices.find(item => item.lang.startsWith('ko') && item.localService) ?? voices.find(item => item.lang.startsWith('ko')),
    [voices],
  )
  const missingVoice = supported && enabled && active && !voice ? '한국어 음성이 설치되지 않아 자막으로 안내해요.' : ''
  useEffect(() => {
    if (!supported || !enabled || !active || !voice) return
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.voice = voice
    utterance.lang = 'ko-KR'
    utterance.rate = 1.08
    utterance.pitch = 1.16
    utterance.onstart = () => setSpeaking(true)
    const timeout = window.setTimeout(() => {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      setError('음성 재생이 지연되어 자막으로 이어가요.')
    }, Math.max(15000, text.length * 350))
    utterance.onend = () => { clearTimeout(timeout); setSpeaking(false) }
    utterance.onerror = event => { clearTimeout(timeout); setSpeaking(false); if (!['interrupted', 'canceled'].includes(event.error)) setError('음성을 재생하지 못했어요. 자막으로 계속 볼 수 있어요.') }
    window.speechSynthesis.speak(utterance)
    return () => { clearTimeout(timeout); utterance.onstart = null; utterance.onend = null; utterance.onerror = null; window.speechSynthesis.cancel(); setSpeaking(false); setError('') }
  }, [supported, enabled, active, text, voice])
  return { enabled, error: error || missingVoice, supported, speaking, toggle: () => { setError(''); setEnabled(value => !value) } }
}
