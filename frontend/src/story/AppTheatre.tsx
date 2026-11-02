import { memo, useLayoutEffect, useRef, useState } from 'react'
import { ArrowUpRight, BatteryFull, Bell, Check, Coffee, Home, MessageCircle, Plus, ReceiptText, Signal, Target, TrendingUp, Waves, Wifi } from 'lucide-react'
import { BelugaArt, type BelugaMood } from '../mywave/BelugaArt'
import { SodaHero } from '../mywave/TodayHome'
import { Progress } from '../mywave/components'
import ReliefChart from './ReliefChart'
import { type SurfClock } from './surf'
import { useExplodedScreen } from './useExplodedScreen'
import { useGuideDirector } from './useGuideDirector'
import { Odometer } from '../mywave/motion'
import { DAILY_BUDGET, GOAL, money, portions, remaining, type DemoState, type StoryAction } from './interaction'
import { tourHints, tourTargets } from './tour'
import type { MyWaveTodayResponse } from '../mywave/myWaveApi'
import './theatre.css'
import './relief.css'

type Props = { chapter: number; phase: number; playing: boolean; reduced: boolean; demo: DemoState; onAction: (action: StoryAction) => void; onChapter: (index: number) => void; arriving: boolean; surfStarted?: number; surfClock?: SurfClock }
const menu = [{icon:Home,name:'홈',scene:1},{icon:Target,name:'목표',scene:3},{icon:ReceiptText,name:'소비',scene:2},{icon:TrendingUp,name:'투자',scene:4},{icon:MessageCircle,name:'AI코치',scene:5}]
const guidePoses:BelugaMood[] = ['hello','point','cheer','trophy']
const templates = [
  {id:1,name:'커피',category:'카페',merchant:'동네 카페',amount:3000,usageCount:8},
  {id:2,name:'점심',category:'식비',merchant:'점심 식사',amount:3800,usageCount:5},
]
const allocation = portions.map((rate,index)=>({name:`예시 ${'ABC'[index]}`,rate,color:['#397be1','#a698d8','#65c4ad'][index]}))

function AppTheatre({chapter,phase,playing,reduced,demo,onAction,onChapter,arriving,surfStarted,surfClock}:Props) {
  const stage = useRef<HTMLDivElement>(null)
  const guide = useRef<HTMLDivElement>(null)
  const touch = useRef<HTMLDivElement>(null)
  const windowRef = useRef<HTMLDivElement>(null)
  const anchor = useRef<HTMLDivElement>(null)
  const camera = useRef<HTMLDivElement>(null)

  const [manual, setManual] = useState(false)
  const [formChapter, setFormChapter] = useState(chapter)
  if (formChapter !== chapter) { setFormChapter(chapter); setManual(false) }
  const [expense, setExpense] = useState<3000|3800>(3000)
  const changingScreen = chapter < 4 && phase >= 5
  const pointing = chapter > 0 && (phase === 1 || phase === 2) || changingScreen
  const tapping = chapter > 0 && phase === 2 || changingScreen && phase === 6
  const success = demo.chapter === chapter && demo.sequence > 0 && demo.action !== 'reset'
  const mood:BelugaMood = surfStarted !== undefined || arriving || tapping || changingScreen ? 'point' : success ? demo.saved === GOAL || chapter === 5 ? 'trophy' : 'cheer' : pointing ? 'point' : chapter === 0 ? 'hello' : 'point'
  const today:MyWaveTodayResponse = {date:'2026-11-02',budgetSet:true,monthlyLivingBudget:600000,dailyBudget:DAILY_BUDGET,spentToday:demo.spent,remainingToday:remaining(demo),overToday:Math.max(0,demo.spent-DAILY_BUDGET),remainingLivingBudget:571300,daysLeftInMonth:29,baselineDailyBudget:DAILY_BUDGET,week:[],todayExpenses:[],mainGoal:null,investment:null}

  // Hold the camera during disassembly so viewport-space paths have a stable frame.
  useLayoutEffect(() => {
    if (surfStarted === undefined || !camera.current) return
    const node = camera.current
    node.style.transform = getComputedStyle(node).transform
    return () => { node.style.removeProperty('transform') }
  }, [surfStarted])
  useGuideDirector(stage, guide, windowRef, surfStarted, surfClock, playing, reduced)
  useExplodedScreen(windowRef, chapter, surfStarted, surfClock, playing, reduced)

  // Read layout only when the pose, screen, or viewport changes. CSS interpolates the flight.
  // The phone frame persists between scenes so the guide never chases a remount animation.
  useLayoutEffect(() => {
    if (surfStarted !== undefined) return
    let frame = 0
    const place = () => {
      const root = stage.current, actor = guide.current, panel = windowRef.current, dot = touch.current
      if (!root || !actor || !panel || !dot) return
      const base = root.getBoundingClientRect()
      const compact = base.width < 761
      const top = compact ? (base.height < 760 ? 137 : 155) : 94
      const scale = Math.max(.36,Math.min(1.08,(base.height-top-(compact ? 207 : 188))/640,(base.width*(compact ? .69 : .39))/350))
      root.style.setProperty('--phone-scale',String(scale))
      const bounds = panel.getBoundingClientRect()
      const selector = changingScreen ? `[data-tour-menu="${chapter+1}"]` : (chapter === 1 || chapter === 2) ? '[data-beluga-target="quick-1"]' : `[data-tour-target="${tourTargets[chapter]}"]`
      const target = panel.querySelector<HTMLElement>(selector)
      const rect = target?.getBoundingClientRect() ?? bounds
      const size = actor.offsetWidth
      const small = compact
      const actorScale = pointing ? (small ? .82 : .72) : 1
      const pointX = rect.left + rect.width * .55 - base.left
      const pointY = rect.top + rect.height * .5 - base.top
      const restX = small ? 6 : Math.max(25, bounds.left - base.left - size * .9)
      const restY = small ? bounds.bottom - base.top - size * .75 : bounds.bottom - base.top - size * .9
      const x = pointing ? Math.max(0, Math.min(base.width-size*actorScale,pointX-size*actorScale*.94)) : restX
      const y = pointing ? Math.max(70,pointY-size*actorScale*.43) : restY
      actor.style.transform = `translate3d(${x}px,${y}px,0) scale(${actorScale})`
      dot.style.transform = `translate3d(${pointX}px,${pointY}px,0)`
    }
    const schedule = () => { cancelAnimationFrame(frame); frame=requestAnimationFrame(place) }
    const observer = new ResizeObserver(schedule)
    if (stage.current) observer.observe(stage.current)
    if (windowRef.current) observer.observe(windowRef.current)
    const panel = windowRef.current
    const cameraNode = camera.current
    const cameraSettled = (event: TransitionEvent) => { if (event.target === cameraNode) schedule() }
    cameraNode?.addEventListener('transitionend', cameraSettled)
    panel?.addEventListener('transitionend', schedule)
    panel?.addEventListener('animationend', schedule)
    panel?.addEventListener('scroll', schedule, true)
    place()
    return()=>{ cancelAnimationFrame(frame); observer.disconnect(); cameraNode?.removeEventListener('transitionend', cameraSettled); panel?.removeEventListener('transitionend', schedule); panel?.removeEventListener('animationend', schedule); panel?.removeEventListener('scroll', schedule, true) }
  },[chapter,pointing,changingScreen,surfStarted,arriving])

  const act = (action:StoryAction) => { setManual(false); onAction(action) }
  const titles = ['오늘의 홈','오늘의 홈','소비 기록','목표 관리','투자 포트폴리오','나의 재무 데스크']
  return <div className="story-app-theatre" ref={stage} inert={surfStarted !== undefined} data-focus={chapter>0&&phase>=1&&phase<=4} data-pointing={pointing&&!changingScreen} data-tapping={tapping} data-playing={playing} data-chapter={chapter} data-arriving={arriving&&!reduced}>
    <div className="story-product-anchor" ref={anchor}>
      <div className="story-assembly-pulse" aria-hidden="true"/>
      <div className="story-product-focus" ref={camera}>
      <div className="story-product-window" ref={windowRef}>
        <div className="story-phone-backplate story-phone-part" aria-hidden="true"/>
        <i className="story-chassis-piece story-chassis-tl story-phone-part" aria-hidden="true"/>
        <i className="story-chassis-piece story-chassis-tr story-phone-part" aria-hidden="true"/>
        <i className="story-chassis-piece story-chassis-bl story-phone-part" aria-hidden="true"/>
        <i className="story-chassis-piece story-chassis-br story-phone-part" aria-hidden="true"/>
        <i className="story-phone-homebar story-phone-part" aria-hidden="true"/>
        <div className="story-phone-status" aria-hidden="true"><b>9:41</b><span className="story-phone-island"/><span><Signal size={13}/><Wifi size={13}/><BatteryFull size={17}/></span></div>
        <header className="story-phone-brand"><span><Waves size={21}/><b>mywave.</b></span><span><Bell size={17}/><b className="story-phone-avatar">M</b></span></header>
        <div className="story-product-shell">
          <nav className="story-product-nav" aria-label="체험 앱 메뉴">{menu.map(({icon:Icon,name,scene})=><button key={name} data-tour-menu={scene} className={changingScreen&&scene===chapter+1?'is-tour-focus':''} aria-label={`체험 앱 ${name}`} aria-current={(chapter===scene || chapter===0&&scene===1)?'page':undefined} onClick={()=>onChapter(scene)}><Icon size={19}/><span>{name}</span></button>)}</nav>
          <div className="story-product-main">
            <header className="story-product-heading"><h2>{titles[chapter]}</h2><button className="story-demo-badge" aria-label="체험 초기화" onClick={()=>act({type:'reset'})}>예시 ↻</button></header>
            {chapter < 3 ? <div className="story-home-grid">
              <div className="story-native-home" data-tour-target="home">
                <SodaHero today={today} templates={templates} busyId={null} notice={demo.records>0?`${demo.records}건 기록했어요!`:''} splash={demo.records} shake={demo.spent>DAILY_BUDGET?demo.sequence:0} onQuick={item=>act({type:'spend',amount:item.id===1?3000:3800})} onManual={()=>setManual(true)} onSetBudget={()=>setManual(true)}/>
              </div>
              <div className="story-product-side">
                <button className="story-ui-card story-goal-peek" onClick={()=>onChapter(3)}><span>나의 첫 30만원 <ArrowUpRight size={14}/></span><strong>{(demo.saved/GOAL*100).toFixed(1)}<small>%</small></strong><Progress value={demo.saved/GOAL*100}/><p>{money(demo.saved)}원 모았어요</p></button>
                <div className="story-ui-card story-receipts"><h3>오늘의 소비 <span>{demo.records+2}건</span></h3><div className="story-receipt-row"><i><Coffee size={15}/></i><span>카페<small>오늘 · 퀵버튼</small></span><b>3,000원</b></div><div className="story-receipt-row"><i><ReceiptText size={15}/></i><span>점심<small>오늘 · 식비</small></span><b>3,800원</b></div>{demo.records>0&&<div className="story-receipt-new" key={demo.records}><Check size={13}/>{demo.records}건 추가했어요</div>}</div>
                <div className="story-product-tip"><span>작은 기록, 정확한 오늘</span><p>기록한 소비가 오늘의 잔에<br/>바로 반영돼요.</p></div>
              </div>
            </div> : chapter===3 ? <div className="story-goals-demo">
              <section className="story-ui-card story-main-goal"><div className="story-ui-card-title"><span>메인 목표</span><Target size={20}/></div><h3>나의 첫 30만원</h3><div className="story-goal-details"><ReliefChart slices={[{value:demo.saved/GOAL*100,color:"#397be1",label:"모은 금액"},{value:100-demo.saved/GOAL*100,color:"#dce7f8",label:"남은 금액"}]} value={`${(demo.saved/GOAL*100).toFixed(1)}%`} label="달성률"/><dl><div><dt>현재 금액</dt><dd><Odometer value={money(demo.saved)}/>원</dd></div><div><dt>남은 금액</dt><dd>{money(GOAL-demo.saved)}원</dd></div><div><dt>목표 금액</dt><dd>300,000원</dd></div></dl></div><div className="story-goal-actions"><button data-tour-target="save" className={pointing?'is-tour-focus':''} disabled={demo.saved>=GOAL} onClick={()=>act({type:'save',amount:50000})}><Plus size={16}/> 5만원 저축하기</button><button disabled={demo.saved>=GOAL} onClick={()=>act({type:'save',amount:10000})}>1만원 넣기</button></div></section>
              <div className="story-ui-card story-goal-result" key={demo.saved}><span>{demo.saved===GOAL?'목표 달성!':'차곡차곡 모이는 내일'}</span><strong>{money(demo.saved-112000)}<small>원 더 모았어요</small></strong><Progress value={demo.saved/GOAL*100}/><p>{demo.saved===GOAL?'작은 저축이 모여 목표를 완성했어요.':'목표와 현재 금액을 한눈에 확인해요.'}</p></div>
            </div> : chapter===4 ? <div className="story-portfolio-demo">
              <section className="story-ui-portfolio-hero"><span>전체 투자 자산 · 예시</span><strong>1,000,000<small>원</small></strong><p>직접 기록한 거래로 보는 나의 투자</p></section>
              <section className="story-ui-card story-allocation"><h3>포트폴리오 구성</h3><div><ReliefChart slices={allocation.map(item=>({value:item.rate,color:item.color,label:item.name}))} value="총 3개" label="예시 자산" selected={demo.selected}/><div className="story-asset-choices">{allocation.map((item,i)=><button key={item.name} data-tour-target={i===1?'allocation':undefined} className={pointing&&i===1?'is-tour-focus':''} aria-pressed={demo.selected===i} onClick={()=>act({type:'select',index:i})}><i style={{background:item.color}}/><span>{item.name}</span><b>{item.rate}%</b></button>)}</div></div><p className="story-selected-asset">{demo.selected<0?'자산을 누르면 비중이 펼쳐져요.':`${allocation[demo.selected].name} · ${money(allocation[demo.selected].rate*10000)}원 · 전체의 ${allocation[demo.selected].rate}%`}</p></section>
            </div> : <div className="story-finale-demo" data-tour-target="finish"><div className="story-ui-portfolio-hero"><span>오늘의 작은 기록이 만든</span><strong>나의 물결.</strong><p>소비부터 저축, 투자까지. 한 곳에서.</p></div><div className="story-finale-stats"><button className="story-ui-card" onClick={()=>onChapter(1)}><Coffee size={20}/><span>오늘 남은 돈</span><strong>{money(remaining(demo))}원</strong></button><button className="story-ui-card" onClick={()=>onChapter(3)}><Target size={20}/><span>목표 달성률</span><strong>{(demo.saved/GOAL*100).toFixed(1)}%</strong></button></div><button className="story-finale-celebrate" onClick={()=>act({type:'celebrate'})}>벨루가와 함께 축하하기 ✦</button></div>}
            <div className="story-product-footnote">소개용 예시 · 계정에 저장되지 않아요</div>
          </div>
        </div>
        {manual&&<form className="story-demo-entry" onSubmit={e=>{e.preventDefault();act({type:'spend',amount:expense})}}><h3>소비 기록</h3><label>기록할 소비<select value={expense} onChange={e=>setExpense(Number(e.target.value) as 3000|3800)}><option value={3000}>커피 · 3,000원</option><option value={3800}>점심 · 3,800원</option></select></label><div><button type="button" onClick={()=>setManual(false)}>취소</button><button type="submit">기록하기</button></div></form>}
      </div>
      </div>
      <div className="story-ui-float-label"><span/><b>LIVE DEMO</b> 보고 있는 버튼을 직접 눌러도 돼요</div>
    </div>
    <div className="story-guide-touch" ref={touch} data-visible={pointing} aria-hidden="true"><span/><i/></div>
    <div className="story-guide" ref={guide} aria-hidden="true"><div className="story-guide-line">{changingScreen?`${menu.find(item=>item.scene===chapter+1)?.name} 화면도 제가 보여드릴게요!`:success&&demo.action!=='hello'?'이렇게 바뀌었어요!':tourHints[chapter]}</div><div className="story-guide-wake"><i/><i/><i/></div><div className="story-guide-bob"><div className="story-guide-swim"><BelugaArt mood="swim" className="story-original-beluga" swimming={playing&&surfStarted!==undefined} blink={false} gaze={false}/></div><div className={`story-guide-art story-guide-presenter ${tapping?'is-tapping':''}`}>{guidePoses.map(pose=><div className="story-guide-pose" key={pose} data-active={mood===pose}><BelugaArt mood={pose} className="story-original-beluga" swimming={playing&&mood===pose} blink={!reduced&&mood===pose} gaze={false}/></div>)}</div></div><span className="story-guide-shadow"/></div>
  </div>
}

export default memo(AppTheatre)
