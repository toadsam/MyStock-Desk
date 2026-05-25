import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './auth/ProtectedRoute'
import AppLayout from './layouts/AppLayout'
import AiReportPage from './pages/AiReportPage'
import AuthPage from './pages/AuthPage'
import EarningsCalendarPage from './pages/EarningsCalendarPage'
import HomePage from './pages/HomePage'
import MarketPage from './pages/MarketPage'
import PortfolioPage from './pages/PortfolioPage'
import ResearchPage from './pages/ResearchPage'
import StockDetailPage from './pages/StockDetailPage'
import ThemeDiscoveryPage from './pages/ThemeDiscoveryPage'
import TransactionsPage from './pages/TransactionsPage'
import WatchlistPage from './pages/WatchlistPage'

export default function App() {
  return (
    <Routes>
      <Route path="login" element={<AuthPage />} />
      <Route path="register" element={<AuthPage />} />
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="market" element={<MarketPage />} />
        <Route path="themes" element={<ThemeDiscoveryPage />} />
        <Route path="stock/:symbol" element={<StockDetailPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="portfolio" element={<PortfolioPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="watchlist" element={<WatchlistPage />} />
          <Route path="earnings-calendar" element={<EarningsCalendarPage />} />
          <Route path="ai-report" element={<AiReportPage />} />
          <Route path="trade" element={<Navigate to="/transactions" replace />} />
        </Route>
        <Route path="research" element={<ResearchPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
