import { api, requestData } from './axios'
import { mockThemeDiscoveries } from '../data/mockData'
import type { ThemeDiscovery } from '../types/theme'

export async function getThemes() {
  return requestData<ThemeDiscovery[]>(api.get('/api/themes'), mockThemeDiscoveries)
}

export async function searchThemes(keyword: string) {
  const normalized = keyword.trim()
  if (!normalized) return mockThemeDiscoveries
  return requestData<ThemeDiscovery[]>(api.get('/api/themes/search', { params: { keyword: normalized } }), localThemeSearch(normalized))
}

function localThemeSearch(keyword: string) {
  const lower = keyword.toLowerCase()
  const result = mockThemeDiscoveries.filter((theme) =>
    [
      theme.keyword,
      theme.title,
      theme.sourceCompany,
      ...theme.repeatedKeywords,
      ...theme.relatedStocks.flatMap((stock) => [stock.stockName, stock.symbol, ...stock.tags]),
    ].some((value) => value.toLowerCase().includes(lower)),
  )
  return result.length ? result : mockThemeDiscoveries
}
