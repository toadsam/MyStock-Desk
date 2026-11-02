import { Coffee, Hand, PiggyBank, Plus, RotateCcw, Sparkles, Utensils } from 'lucide-react'
import { GOAL, initialDemo, money, portions, remaining, type DemoState, type StoryAction } from './interaction'

export default function StoryExperiment({ chapter, demo, onAction }: { chapter: number; demo: DemoState; onAction: (action: StoryAction) => void }) {
  return <section className="story-experiment" aria-label="직접 체험하기">
    <div className="story-experiment-heading"><span><span className="story-pulse-dot" /> 직접 해보세요</span><button onClick={() => onAction({type:'reset'})} aria-label="체험 초기화"><RotateCcw size={12} aria-hidden="true" /> 초기화</button></div>
    {chapter === 0 && <><p>바다 어디든 누르면 벨루가가 따라와요. 드래그해서 360도로 둘러보세요.</p><button className="story-experiment-primary" onClick={() => onAction({type:'hello'})}><Hand size={17} aria-hidden="true" /> 벨루가, 이리 와!</button></>}
    {(chapter === 1 || chapter === 2) && <>
      <p>{chapter === 1 ? '한 번 써볼까요? 기록할 때마다 물이 줄어들어요.' : '커피를 누르면 영수증이 생기고 기록에 더해져요.'}</p>
      <div className="story-experiment-actions"><button onClick={() => onAction({type:'spend',amount:3000})}><Coffee size={17} aria-hidden="true" /><span>커피 기록<small>−3,000원</small></span></button><button onClick={() => onAction({type:'spend',amount:3800})}><Utensils size={17} aria-hidden="true" /><span>점심 기록<small>−3,800원</small></span></button></div>
      <div className="story-mini-meter"><span style={{transform:`scaleX(${remaining(demo) / 19700})`}} /></div>
      <div className="story-experiment-stat"><span>내가 추가한 기록 <b>{demo.records}건</b></span><span>남은 돈 <b>{money(remaining(demo))}원</b></span></div>
    </>}
    {chapter === 3 && <>
      <p>{demo.saved === GOAL ? '목표 달성! 초기화하면 다시 모아볼 수 있어요.' : '동전을 넣어볼까요? 저금통을 눌러도 돼요.'}</p>
      <div className="story-experiment-actions"><button disabled={demo.saved === GOAL} onClick={() => onAction({type:'save',amount:10000})}><PiggyBank size={17} aria-hidden="true" /><span>1만원 넣기<small>작게, 꾸준하게</small></span></button><button disabled={demo.saved === GOAL} onClick={() => onAction({type:'save',amount:50000})}><Plus size={17} aria-hidden="true" /><span>5만원 넣기<small>목표에 한 걸음 더</small></span></button></div>
      <div className="story-mini-meter is-saving"><span style={{transform:`scaleX(${demo.saved / GOAL})`}} /></div>
      <div className="story-experiment-stat"><span>더 모은 돈 <b>{money(demo.saved - initialDemo.saved)}원</b></span><b>{(demo.saved / GOAL * 100).toFixed(1)}%</b></div>
    </>}
    {chapter === 4 && <>
      <p>그래프 조각을 눌러서 나의 자산을 펼쳐 보세요.</p>
      <div className="story-allocation-buttons">{portions.map((value, index) => <button key={index} aria-pressed={demo.selected === index} onClick={() => onAction({type:'select',index})}><i style={{background:['#397be1','#a698d8','#65c4ad'][index]}} /><span>예시 {'ABC'[index]}</span><strong>{value}%</strong></button>)}</div>
    </>}
    {chapter === 5 && <>
      <p>직접 만든 작은 변화들을 함께 축하해요.</p>
      <button className="story-experiment-primary" onClick={() => onAction({type:'celebrate'})}><Sparkles size={17} aria-hidden="true" /> 벨루가와 축하하기</button>
    </>}
    <small className="story-experiment-disclaimer">소개용 체험이에요. 실제 계정에는 저장되지 않아요.</small>
  </section>
}
