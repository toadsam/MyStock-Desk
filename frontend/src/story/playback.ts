/** Shared story-time rate for narration, native animation and the ocean. */
export const STORY_RATE = 1.3
/** One question, one greeting. Chapter 1 opens straight on the app, so no second hello. */
export const OPENING_SECONDS = 7
/** Story time where the hello turns into the swim toward the phone. */
export const OPENING_TURN_SECONDS = OPENING_SECONDS - 1.1
/** Story time where the ocean starts carrying the guide out of the opening. */
export const OPENING_TRAVEL_SECONDS = OPENING_SECONDS - 2.4
export const openingLines = [
  '내 돈은 어디로 흘러가고 있을까?',
  '안녕! 나는 벨루가야. 소비, 저축, 투자까지 같이 탐험해볼까?',
] as const
export const OPENING_BEAT_SECONDS = 2.8
export const openingBeat = (elapsed: number) => elapsed < OPENING_BEAT_SECONDS ? 0 : 1
