export interface Disclosure {
  id: string
  symbol: string
  companyName: string
  formType: string
  title: string
  summary: string
  source: string
  sourceUrl: string
  filingDate: string
  reportDate: string | null
  fetchedAt: string
  reliability: 'OFFICIAL' | string
  officialSource: boolean
}
