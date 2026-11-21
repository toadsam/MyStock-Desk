import axios from 'axios'
import type { ApiResponse } from '../types/common'
import { api, requestStrictData } from './axios'

/** 서버가 받는 설문 답. 누가 보냈는지 알 수 있는 값은 없다. */
export type SurveySubmission = {
  path: 'USED' | 'LOOKED'
  /** 1(별로)~5(최고). 써 본 사람만. */
  satisfaction?: number
  /** 0~10. 써 본 사람만. */
  nps?: number
  best?: string[]
  pain?: string[]
  whyNot?: string[]
  wouldHelp?: string[]
  /** 지금 어떤 상황인지. 모두. */
  situation?: string
  /** 투자를 하고 있는지. 모두. */
  invest?: string
  /** 써 보고 돈 쓰는 게 달라졌는지. 써 본 사람만. */
  spendChange?: string
  comment?: string
}

/**
 * 설문 답을 보낸다.
 *
 * 공용 api 인스턴스를 쓰지 않는다. 그쪽은 로그인 토큰을 붙이는데, 설문은 익명이라 누구인지 알릴 이유가 없다.
 * 또 토큰이 만료된 사람이 설문을 보냈다고 로그아웃되어서도 안 된다.
 */
export async function submitSurvey(submission: SurveySubmission): Promise<void> {
  try {
    const response = await axios.post<ApiResponse<null>>(`${api.defaults.baseURL ?? ''}/api/surveys`, submission, { timeout: 15000 })
    if (!response.data.success) throw new Error(response.data.error?.message ?? '설문을 보내지 못했어요.')
  } catch (error) {
    if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
      throw new Error(error.response?.data?.error?.message ?? '설문을 보내지 못했어요. 연결을 확인하고 다시 눌러 주세요.', { cause: error })
    }
    throw error
  }
}

/** 선택지 하나와 그걸 고른 사람 수. 많이 고른 순서로 온다. */
export type SurveyTally = { option: string; count: number }

/** 한 상황을 고른 사람들의 만족도와 추천 지수. 답이 없으면 null. */
export type SurveySegment = { option: string; responses: number; used: number; satisfactionAverage: number | null; npsScore: number | null }

/** 모인 답의 요약. 서버가 계산해서 준다. */
export type SurveySummary = {
  total: number
  used: number
  looked: number
  /** 1~5. 답이 없으면 null. */
  satisfactionAverage: number | null
  /** 1점부터 5점까지 각각 몇 명인지. */
  satisfactionCounts: number[]
  /** 0~10. 답이 없으면 null. */
  npsAverage: number | null
  /** -100~100. 답이 없으면 null. */
  npsScore: number | null
  best: SurveyTally[]
  pain: SurveyTally[]
  whyNot: SurveyTally[]
  wouldHelp: SurveyTally[]
  /** 하나만 고르는 질문들(2026-11-21 부터). 합계가 그 질문에 답한 사람 수다. */
  situation: SurveyTally[]
  invest: SurveyTally[]
  spendChange: SurveyTally[]
  bySituation: SurveySegment[]
  comments: { path: 'USED' | 'LOOKED'; text: string; createdAt: string }[]
}

/** 설문 결과. 로그인한 관리자 계정에만 열린다. 아니면 서버의 거절 문구가 오류로 온다. */
export function getSurveySummary() {
  return requestStrictData<SurveySummary>(api.get('/api/surveys/summary'))
}
