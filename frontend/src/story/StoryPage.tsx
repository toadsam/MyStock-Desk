import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ChartPie, ChevronUp, Coffee, Expand, Hand, Pause, PiggyBank, Play, RotateCcw, Volume2, VolumeX, Wallet, Waves, Eye, EyeOff } from 'lucide-react'
import { Link } from 'react-router-dom'
import { chapters, CHAPTER_SECONDS, TOTAL_SECONDS } from './chapters'
import './story.css'
import { applyAction, initialDemo, money, remaining, responseLine, type StoryAction } from './interaction'
import { useNarration } from './useNarration'
import AppTheatre from './AppTheatre'
import WaveTransition from './WaveTransition'
import OceanResponse from './OceanResponse'
import { TOUR_TAP_TIME, tourActions } from './tour'
import { SURF_TRANSITION_MS, SURF_COVER_MS, SURF_ARRIVAL_SECONDS } from './surf'
import { useSurfPresentation } from './useSurfPresentation'
import { isStoryActive, useStoryActivity } from './storyActivity'
import './direction.css'

const StoryStage = lazy(() => import('./StoryStage'))
const timeLabel = (time: number) => `${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(2, '0')}`
const chapterIcons = [Waves, Wallet, Coffee, PiggyBank, ChartPie, Hand]

export default function StoryPage() {
  const active = useStoryActivity()
  const initialChapter = Math.max(0, Math.min(chapters.length - 1, Math.floor(Number(new URLSearchParams(window.location.search).get('scene') || 1) - 1 || 0)))
  const [time, setTime] = useState(initialChapter * CHAPTER_SECONDS)
  const [playing, setPlaying] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [autoNext, setAutoNext] = useState(true)
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [fullScreenError, setFullScreenError] = useState('')
  const [controlsOpen, setControlsOpen] = useState(false)
  const [demo, setDemo] = useState(initialDemo)
  const [feedback, setFeedback] = useState(false)
  const [immersed, setImmersed] = useState(false)
  const [exploring, setExploring] = useState(false)
  const [wave, setWave] = useState<{id:number;chapter:number;clock:{elapsed:number}}|null>(null)
  const waveBusy = useRef(false)
  const surfClock = useRef({ elapsed: 0 })
  const pendingScene = useRef<{ next: number; restart: boolean; committed: boolean } | null>(null)
  const interactionTimer = useRef<number|undefined>(undefined)
  const autoActionFired = useRef<number|null>(null)
  const root = useRef<HTMLElement>(null)
  const timeRef = useRef(time)
  const lastChapter = useRef(initialChapter)
  const chapter = Math.max(0, Math.min(chapters.length - 1, Math.floor(time / CHAPTER_SECONDS)))
  const localTime = time - chapter * CHAPTER_SECONDS
  const data = chapters[chapter]
  useSurfPresentation(root, chapter, wave?.id, wave?.clock, playing)
  const beat = Math.min(2, Math.floor(localTime / (CHAPTER_SECONDS / 3)))
  const timelineLine = chapter === 1 && beat === 1 ? `오늘 ${money(demo.spent)}원을 썼다면, 잔에는 ${money(remaining(demo))}원이 남아요.`
    : chapter === 3 && beat === 1 ? `30만원 중 ${money(demo.saved)}원을 모았어요. 지금은 ${(demo.saved / 300000 * 100).toFixed(1)}%예요.` : data.captions[beat]
  const explanation = exploring ? '잠깐 함께 헤엄쳐요! 곧 제가 앱 설명을 이어갈게요.' : feedback && demo.chapter === chapter ? responseLine(demo) : timelineLine
  const narration = useNarration(explanation, playing || feedback)
  const narrationBusy = useRef(false)
  useEffect(() => { narrationBusy.current = narration.enabled && narration.speaking }, [narration.enabled, narration.speaking])
  // React only publishes the timeline at 10 Hz; the ocean owns its smooth RAF clock.
  const tourPhase = localTime < 4.4 ? 0 : localTime < 6.62 ? 1 : localTime < 7.45 ? 2 : localTime < 9.6 ? 3 : localTime < 11.2 ? 4 : localTime < 13.3 ? 5 : 6

  const seek = useCallback((next: number) => {
    window.clearTimeout(interactionTimer.current)
    setFeedback(false)
    setExploring(false)
    const value = Math.max(0, Math.min(TOTAL_SECONDS, next))
    // Seeking to the end can round slightly backwards; that must not re-arm a demo.
    // Only a new scene or a deliberate rewind before the tap point starts a new pass.
    if (Math.min(chapters.length - 1, Math.floor(value / CHAPTER_SECONDS)) !== lastChapter.current || value % CHAPTER_SECONDS < TOUR_TAP_TIME) autoActionFired.current = null
    timeRef.current = value
    setTime(value)
  }, [])
  const changeScene = useCallback((next:number, restart = false) => {
    const target = Math.max(0,Math.min(chapters.length-1,Math.floor(next/CHAPTER_SECONDS)))
    const commit = () => { if (restart) setDemo(initialDemo); seek(next) }
    if (reduced || !playing || target === lastChapter.current) { waveBusy.current=false; pendingScene.current=null; setWave(null); commit(); return }
    waveBusy.current=true
    surfClock.current.elapsed = 0
    pendingScene.current = { next, restart, committed: false }
    setWave({id:performance.now(),chapter:target,clock:surfClock.current})
  },[reduced,playing,seek])
  const go = useCallback((index: number) => { setControlsOpen(false); changeScene(Math.max(0, Math.min(chapters.length - 1, index)) * CHAPTER_SECONDS) }, [changeScene])
  const interact = useCallback((action: StoryAction) => {
    window.clearTimeout(interactionTimer.current)
    setExploring(false)
    setDemo(current => applyAction(current, action, lastChapter.current))
    setFeedback(true)
    interactionTimer.current=window.setTimeout(()=>setFeedback(false),3000)
  }, [])
  const explore = useCallback(() => {
    window.clearTimeout(interactionTimer.current)
    setExploring(true)
    setFeedback(false)
    interactionTimer.current=window.setTimeout(()=>setExploring(false),4000)
  }, [])
  const toggle = useCallback(() => {
    window.clearTimeout(interactionTimer.current)
    setFeedback(false)
    setExploring(false)
    if (timeRef.current >= TOTAL_SECONDS - 0.05) changeScene(0,true)
    setPlaying(value => !value)
  }, [changeScene])
  const fullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else if (root.current?.requestFullscreen) await root.current.requestFullscreen()
      else setFullScreenError('이 브라우저에서는 전체화면을 지원하지 않아요.')
    } catch { setFullScreenError('전체화면을 열 수 없어요. 브라우저 창을 넓혀 주세요.') }
  }, [])

  useEffect(() => {
    const previous = document.title
    document.title = 'MyWave · 나의 돈, 나의 물결'
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const change = () => { setReduced(media.matches); if (media.matches) setPlaying(false) }
    media.addEventListener('change', change)
    return () => { document.title = previous; media.removeEventListener('change', change) }
  }, [])

  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('scene', String(chapter + 1))
    window.history.replaceState(window.history.state, '', url)
    lastChapter.current = chapter
  }, [chapter])

  useEffect(()=>()=>{ window.clearTimeout(interactionTimer.current) },[])

  useEffect(()=>{
    if (!playing || waveBusy.current || localTime < TOUR_TAP_TIME || autoActionFired.current === chapter) return
    autoActionFired.current=chapter
    setFeedback(false)
    setDemo(current=>applyAction(current,tourActions[chapter],chapter))
  },[playing,chapter,localTime])

  useEffect(() => {
    if (!playing) return
    let frame = 0
    let previous = performance.now()
    let lastPublished = previous
    const resumeClock = () => { previous = performance.now() }
    document.addEventListener('visibilitychange', resumeClock)
    window.addEventListener('focus', resumeClock)
    const tick = (now: number) => {
      // Native animations continue through a delayed frame. Keep their clock on
      // active elapsed time too, instead of seeking them backward after a stall.
      const elapsed = !isStoryActive() ? 0 : Math.max(0, (now - previous) / 1000)
      const delta = Math.min(elapsed, .1)
      previous = now
      if (waveBusy.current && pendingScene.current) {
        surfClock.current.elapsed += elapsed * 1000
        if (!pendingScene.current.committed && surfClock.current.elapsed >= SURF_COVER_MS) {
          pendingScene.current.committed = true
          if (pendingScene.current.restart) setDemo(initialDemo)
          seek(pendingScene.current.next)
        }
        if (surfClock.current.elapsed >= SURF_TRANSITION_MS) { waveBusy.current = false; pendingScene.current = null; setWave(null) }
        frame=requestAnimationFrame(tick); return
      }
      const phraseEnd = (Math.floor(timeRef.current / (CHAPTER_SECONDS / 3)) + 1) * (CHAPTER_SECONDS / 3)
      const next = narrationBusy.current ? Math.min(timeRef.current + delta, phraseEnd - 0.001) : timeRef.current + delta
      const boundary = (lastChapter.current + 1) * CHAPTER_SECONDS
      if (!autoNext && next >= boundary) {
        seek(next >= TOTAL_SECONDS ? TOTAL_SECONDS : boundary - 0.001)
        setPlaying(false)
        return
      }
      if (next >= TOTAL_SECONDS) { changeScene(0,true); frame=requestAnimationFrame(tick); return }
      if (next >= boundary) { changeScene(boundary); frame=requestAnimationFrame(tick); return }
      timeRef.current = next
      if (now - lastPublished >= 100) { setTime(next); lastPublished = now }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(frame); document.removeEventListener('visibilitychange', resumeClock); window.removeEventListener('focus', resumeClock) }
  }, [playing, autoNext, seek, changeScene])

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || (event.target as HTMLElement).closest('input, textarea, select, [contenteditable=true]')) return
      if (event.code === 'Space' && !(event.target as HTMLElement).closest('button, a')) { event.preventDefault(); toggle() }
      if (event.code === 'ArrowRight') { event.preventDefault(); go(lastChapter.current + 1) }
      if (event.code === 'ArrowLeft') { event.preventDefault(); go(lastChapter.current - 1) }
      if (event.code === 'KeyF') void fullscreen()
      if (event.code === 'Escape') { setImmersed(false); setExploring(false); setControlsOpen(false) }
    }
    window.addEventListener('keydown', keydown)
    return () => window.removeEventListener('keydown', keydown)
  }, [toggle, go, fullscreen])

  return (
    <main className="wave-story" data-scene={chapter} data-playing={playing} data-suspended={!active} data-immersed={immersed} data-surfing={!!wave} ref={root} style={{ '--story-accent': data.accent } as React.CSSProperties}>
      <a className="story-skip" href="#story-player">재생 컨트롤로 건너뛰기</a>
      <section className="story-visual" aria-label={`${data.name} 전체 화면 3D 바다`}>
        <Suspense fallback={<div className="story-loading">벨루가가 헤엄쳐 오고 있어요…</div>}>
          <StoryStage chapter={chapter} time={localTime} playing={playing} reduced={reduced} demo={demo} onAction={interact} onExplore={explore} onViewChange={explore} presenting={!immersed&&!exploring} surfStarted={wave?.id} surfClock={wave?.clock} />
        </Suspense>
      </section>
      <div className="story-atmosphere" aria-hidden="true" />
      <OceanResponse sequence={demo.sequence} reduced={reduced}/>
      <header className="story-header">
        <Link className="story-brand" to="/story" aria-label="MyWave 소개 처음으로" onClick={() => go(0)}>
          <span className="story-brand-mark"><Waves size={25} strokeWidth={2.5} aria-hidden="true" /></span>
          <span translate="no">mywave<span className="story-brand-dot">.</span></span>
        </Link>
        <span className="story-header-note story-autoplay-status"><span className="story-live-dot"/>{playing ? '벨루가가 자동으로 안내하고 있어요' : '잠시 멈춘 소개 영상'}</span>
        <button className="story-immersion" aria-pressed={immersed} onClick={() => { setImmersed(v => !v); setExploring(false) }}>{immersed ? <Eye size={16} /> : <EyeOff size={16} />}{immersed ? '앱 시연 보기' : '바다만 보기'}</button>
        <Link to="/login" className="story-app-link">앱 열기 <ArrowRight size={16} aria-hidden="true" /></Link>
      </header>

      {!immersed && <div className="story-body">
        <section className="story-copy" key={chapter} aria-labelledby="story-title">
          <div className="story-eyebrow"><span />{data.eyebrow}</div>
          <h1 id="story-title">{data.title.split('\n').map((line, index) => <span key={line} className={index ? 'story-title-accent' : ''}>{line}</span>)}</h1>
          <p className="story-description">{data.description}</p>
          {(chapter === 1 || chapter === 3) && <div className="story-explainer story-live-metric" aria-live="polite">
            <span className="story-small-label">{chapter === 1 ? '오늘 더 써도 되는 돈' : '나의 첫 30만원'}</span>
            <strong className="story-amount" key={demo.sequence}>{chapter === 1 ? money(remaining(demo)) : (demo.saved / 300000 * 100).toFixed(1)}<span>{chapter === 1 ? '원' : '%'}</span></strong>
          </div>}
          {chapter === 0 && <div className="story-intro-actions"><div className="story-watch-note"><span className="story-film-bars" aria-hidden="true"><i/><i/><i/><i/></span><div><strong>{playing ? '편하게 구경하세요.' : '재생하면 제가 안내할게요.'}</strong><span>버튼부터 다음 장면까지, 제가 할게요!</span></div></div></div>}
          {chapter === 5 && <div className="story-end-actions"><Link className="story-start" to="/login">MyWave 시작하기 <span><ArrowRight size={20} aria-hidden="true" /></span></Link><button className="story-restart" onClick={() => { changeScene(0,true); setPlaying(true) }}><RotateCcw size={16} aria-hidden="true" /> 다시 보기</button></div>}
        </section>

      </div>}

      {!immersed && !exploring && <AppTheatre chapter={chapter} phase={tourPhase} playing={playing} reduced={reduced} demo={demo} onAction={interact} onChapter={go} arriving={localTime<SURF_ARRIVAL_SECONDS} surfStarted={wave?.id} surfClock={wave?.clock}/>}
      {!immersed && <>
        <div className="story-narrator" aria-live={playing ? 'off' : 'polite'}>
          <span className="story-speaker"><Waves size={15} aria-hidden="true" /> BELUGA <i>{exploring ? '잠깐 함께 헤엄쳐요' : feedback ? '곧 설명이 이어져요' : playing ? '자동 시연 중' : '일시정지'}</i></span>
          <p key={`${chapter}-${beat}-${feedback ? demo.sequence : 0}-${exploring}`}>{explanation}</p>
        </div>
      </>}

      <footer className="story-controls" id="story-player" data-expanded={controlsOpen} tabIndex={-1}>
        <div className="story-player-details" id="story-player-details" hidden={!controlsOpen}>
        {!immersed && <nav className="story-chapters" aria-label="소개 장면">
          {chapters.map((item, index) => { const Icon = chapterIcons[index]; return <button key={item.name} className={index === chapter ? 'is-current' : ''} aria-current={index === chapter ? 'step' : undefined} onClick={() => go(index)} aria-label={`${index + 1}. ${item.name}`}><span className="story-chapter-content"><Icon size={18} aria-hidden="true" /><span className="story-chapter-text"><i>SCENE {String(index + 1).padStart(2, '0')}</i>{item.name}</span></span><span className="story-chapter-track"><span style={{ transform: `scaleX(${index < chapter ? 1 : index === chapter ? localTime / CHAPTER_SECONDS : 0})` }} /></span></button> })}
        </nav>}
        <div className="story-player-options">
          <span className="story-key-hint"><kbd>←</kbd><kbd>→</kbd> 장면 <kbd>Space</kbd> 멈춤</span>
          <button className="story-auto" aria-pressed={autoNext} onClick={() => setAutoNext(value => !value)} title="장면 전환과 전체 영상 반복 재생"><span /> 자동 진행</button>
        </div>
        </div>
        <div className="story-transport">
          <div className="story-playback">
            <button className="story-icon-button" aria-label="이전 장면" onClick={() => go(chapter - 1)} disabled={chapter === 0}><ArrowLeft size={19} aria-hidden="true" /></button>
            <button className="story-play-button" aria-label={playing ? '일시정지' : '재생'} onClick={toggle}>{playing ? <Pause size={17} fill="currentColor" aria-hidden="true" /> : <Play size={17} fill="currentColor" aria-hidden="true" />}</button>
            <button className="story-icon-button" aria-label="다음 장면" onClick={() => go(chapter + 1)} disabled={chapter === chapters.length - 1}><ArrowRight size={19} aria-hidden="true" /></button>
          </div>
          <button className="story-scene-picker" aria-label="장면 및 재생 설정" aria-expanded={controlsOpen} aria-controls="story-player-details" onClick={()=>setControlsOpen(value=>!value)}><span>{String(chapter+1).padStart(2,'0')}</span>{data.name}<ChevronUp size={14}/></button>
          <span className="story-time">{timeLabel(time)} <span>/ {timeLabel(TOTAL_SECONDS)}</span></span>
          <input className="story-scrubber" aria-label="전체 재생 위치" aria-valuetext={`${timeLabel(time)}, ${data.name}`} name="playback-position" style={{ '--progress': `${time / TOTAL_SECONDS * 100}%` } as React.CSSProperties} type="range" min="0" max={TOTAL_SECONDS} step="0.1" value={time} onChange={event => changeScene(Number(event.target.value))} />
          <button className="story-voice" disabled={!narration.supported} aria-pressed={narration.enabled} onClick={narration.toggle} title={narration.supported ? '브라우저의 한국어 음성으로 설명을 읽어요' : '이 브라우저는 음성 설명을 지원하지 않아요'}>{narration.enabled ? <Volume2 size={16} aria-hidden="true" /> : <VolumeX size={16} aria-hidden="true" />} 음성 설명</button>
          <button className="story-icon-button" aria-label="전체화면 전환" onClick={() => void fullscreen()}><Expand size={18} aria-hidden="true" /></button>
        </div>
        {fullScreenError && <p role="status" className="story-error">{fullScreenError}</p>}
        {narration.error && <p role="status" className="story-error">{narration.error}</p>}
      </footer>
      {wave && <WaveTransition key={wave.id} label={chapters[wave.chapter].name}/>}
    </main>
  )
}
