import { api, requestData } from './axios'
import { mockNews } from '../data/mockData'
import type { ImpactType } from '../types/common'
import type { News } from '../types/news'

export function getNews(params?: { category?: string; impactType?: ImpactType; symbol?: string }) {
  return requestData<News[]>(api.get('/api/news', { params }), mockNews)
}

export function getNewsBriefing() {
  return requestData<News[]>(api.get('/api/news/briefing'), mockNews.slice(0, 6))
}

export function getResearchNews() {
  return requestData<News[]>(api.get('/api/news/research'), mockNews.slice(0, 8))
}
