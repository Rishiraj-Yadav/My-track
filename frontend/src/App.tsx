import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Route, Routes, useLocation } from 'react-router-dom'
import { AppShell, TopNav } from './components'
import { DashboardPage } from './pages/DashboardPage'
import { ExpensesPage } from './pages/ExpensesPage'
import { GoalsPage } from './pages/GoalsPage'
import { InsightsPage } from './pages/InsightsPage'
import { LandingPage } from './pages/LandingPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { ProfilePage } from './pages/ProfilePage'
import { ScenariosPage } from './pages/ScenariosPage'
import { SimulatorPage } from './pages/SimulatorPage'
import { useAppStore } from './store'

function App() {
  const bootstrap = useAppStore((state) => state.bootstrap)
  const isLoading = useAppStore((state) => state.isLoading)
  const error = useAppStore((state) => state.error)

  useEffect(() => {
    void bootstrap()
  }, [bootstrap])

  if (isLoading) {
    return (
      <AppShell>
        <div className="page-frame" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
          <div className="card" style={{ padding: '2rem 2.5rem', textAlign: 'center' }}>
            <p className="eyebrow">Loading profile</p>
            <h2>Fetching your saved data from MongoDB</h2>
            <p className="section-copy">Hang tight while we restore your profile, expenses, goals, and SIP state.</p>
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
            <p className="eyebrow">Startup error</p>
            <h2>We could not load your saved profile</h2>
            <p className="section-copy">{error}</p>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <AppRoutes />
    </AppShell>
  )
}

function AppRoutes() {
  const location = useLocation()

  return (
    <>
      <TopNav />
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
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/simulator" element={<SimulatorPage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/scenarios" element={<ScenariosPage />} />
            <Route path="/insights" element={<InsightsPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </>
  )
}

export default App
