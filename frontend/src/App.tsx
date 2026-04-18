import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Route, Routes, useLocation, Navigate } from 'react-router-dom'
import { AppShell, TopNav } from './components'
import { AuthPage } from './pages/AuthPage'
import { DashboardPage } from './pages/DashboardPage'
import { ExpensesPage } from './pages/ExpensesPage'
import { GoalsPage } from './pages/GoalsPage'
import { LandingPage } from './pages/LandingPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { PricingPage } from './pages/PricingPage'
import { ProfilePage } from './pages/ProfilePage'
import { ScenariosPage } from './pages/ScenariosPage'
import { SimulatorPage } from './pages/SimulatorPage'
import { useAppStore } from './store'
import { useI18n } from './i18n'
import { clearTokens, getAccessToken } from './lib/api'

function App() {
  const bootstrap = useAppStore((state) => state.bootstrap)
  const isLoading = useAppStore((state) => state.isLoading)
  const error = useAppStore((state) => state.error)
  const { copy } = useI18n()
  const [isAuthed, setIsAuthed] = useState(() => !!getAccessToken())

  useEffect(() => {
    if (isAuthed) {
      void bootstrap()
    }
  }, [bootstrap, isAuthed])

  const handleLogout = () => {
    clearTokens()
    localStorage.removeItem('mytracker-authed')
    localStorage.removeItem('mytracker-user-email')
    localStorage.removeItem('mytracker-user-name')
    localStorage.removeItem('mytracker-tier')
    localStorage.removeItem('mytracker-session-id')
    setIsAuthed(false)
    window.location.href = '/auth'
  }

  // Not authenticated → show auth page
  if (!isAuthed) {
    return (
      <AppShell>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </AppShell>
    )
  }

  if (isLoading) {
    return (
      <AppShell>
        <div className="page-frame" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
          <div className="card" style={{ padding: '2rem 2.5rem', textAlign: 'center' }}>
            <p className="eyebrow">{copy.app.loadingEyebrow}</p>
            <h2>{copy.app.loadingTitle}</h2>
            <p className="section-copy">{copy.app.loadingCopy}</p>
          </div>
        </div>
      </AppShell>
    )
  }

  if (error) {
    return (
      <AppShell>
        <div className="page-frame" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
          <div className="card" style={{ padding: '2rem 2.5rem', maxWidth: '560px' }}>
            <p className="eyebrow">{copy.app.errorEyebrow}</p>
            <h2>{copy.app.errorTitle}</h2>
            <p className="section-copy">{error}</p>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <AppRoutes onLogout={handleLogout} />
    </AppShell>
  )
}

function AppRoutes({ onLogout }: { onLogout: () => void }) {
  const location = useLocation()

  return (
    <>
      <TopNav onLogout={onLogout} />
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <Routes location={location}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/simulator" element={<SimulatorPage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/scenarios" element={<ScenariosPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/pricing" element={<PricingPage />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </>
  )
}

export default App
