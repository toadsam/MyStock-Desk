import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

/** 문의와 삭제 요청을 받는 주소. 화면에 그대로 보인다. */
const CONTACT_EMAIL = 'toadsam@naver.com'

/**
 * 어떤 정보를 받고, 어디에 쓰고, 어떻게 지우는지.
 *
 * 로그인하기 전에도 읽을 수 있어야 해서 보호된 화면 밖에 둔다.
 * 여기 적는 말은 코드가 실제로 하는 일과 같아야 한다. 받는 정보나 밖으로 보내는 곳이 바뀌면 이 화면도 같이 고친다.
 */
export default function PrivacyPage() {
  const navigate = useNavigate()

  return (
    <main className="min-h-screen bg-[var(--bg)] px-5 py-8 text-slate-900">
      <div className="mx-auto max-w-2xl space-y-4">
        <button onClick={() => navigate(-1)} className="pressable -ml-2 flex items-center gap-1 rounded-full px-2 py-1.5 text-[14px] font-semibold text-slate-500">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" /> 돌아가기
        </button>
        <h1 className="text-[26px] font-bold tracking-[-0.02em]">MyWave가 받는 정보</h1>
        <p className="text-[14px] font-medium leading-6 text-slate-500">
          MyWave는 지금 시범 운영 중이에요. 무엇을 받고 어디에 쓰는지 있는 그대로 적어 둡니다.
        </p>

        <Section title="받는 정보">
          <Item>구글 계정의 이름, 이메일, 프로필 사진 주소, 그리고 같은 사람인지 알아보는 구글 계정 번호.</Item>
          <Item>직접 적은 기록: 소비 내역, 목표, 계좌 이름과 잔액, 생활비 예산, 거래 기록과 메모, 코치에게 한 질문.</Item>
        </Section>

        <Section title="받지 않는 정보">
          <Item>구글 비밀번호. 로그인은 구글이 확인하고, MyWave는 확인됐다는 결과만 받아요.</Item>
          <Item>은행이나 카드사 계정. 계좌와 잔액은 직접 적은 숫자뿐이고, 금융사에 연결하지 않아요.</Item>
        </Section>

        <Section title="쓰는 곳">
          <Item>내 화면에 보이는 숫자를 계산하는 데만 써요. 광고에 쓰거나 다른 곳에 팔지 않아요.</Item>
          <Item>기록은 MyWave 서버의 데이터베이스(Railway 클라우드)에 저장돼요.</Item>
          <Item>로그인 상태는 이 브라우저에 하루 동안 남아요.</Item>
        </Section>

        <Section title="밖으로 나가는 것">
          <Item>시세, 뉴스, 공시를 가져올 때 종목 코드와 회사 이름만 보내요(Yahoo Finance, Google 뉴스, DART, SEC). 누구의 요청인지는 보내지 않아요.</Item>
          <Item>붙여넣은 카드 문자는 MyWave 서버 안에서만 읽어요.</Item>
          <Item>결제 내역 캡처 읽기가 켜져 있을 때는, 올린 이미지와 가게 이름이 글자를 읽고 분류하기 위해 OpenAI로 전송돼요. MyWave는 그 이미지를 저장하지 않아요.</Item>
        </Section>

        <Section title="지우는 방법">
          <Item>내 정보 화면 맨 아래의 계정 삭제를 누르면 계정과 모든 기록이 바로 지워져요. 되살릴 수 없어요.</Item>
          <Item>기록 하나하나는 각 화면에서 언제든 지울 수 있어요.</Item>
          <Item>로그인할 수 없어서 직접 지우지 못할 때는 아래 주소로 알려 주세요. 가입한 구글 이메일을 적어 주시면 지워 드려요.</Item>
        </Section>

        <Section title="문의">
          <Item>
            궁금한 점, 불편한 점, 삭제 요청은{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-blue-700 underline underline-offset-4">{CONTACT_EMAIL}</a>
            {' '}로 보내 주세요.
          </Item>
        </Section>
      </div>
    </main>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[20px] bg-white p-5 md:p-6">
      <h2 className="text-[17px] font-bold tracking-[-0.02em]">{title}</h2>
      <ul className="mt-3 space-y-2.5">{children}</ul>
    </section>
  )
}

function Item({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-2.5 text-[14px] font-medium leading-6 text-slate-600">
      <span aria-hidden="true" className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
      <span>{children}</span>
    </li>
  )
}
