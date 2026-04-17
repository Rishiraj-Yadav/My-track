import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { AppShell, TopNav } from './components'
import { useAppStore } from './store'
import { DashboardPage } from './pages/DashboardPage'
import { ExpensesPage } from './pages/ExpensesPage'
import { GoalsPage } from './pages/GoalsPage'
import { HealthPage } from './pages/HealthPage'
import { InsightsPage } from './pages/InsightsPage'
import { LandingPage } from './pages/LandingPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { ScenariosPage } from './pages/ScenariosPage'
import { SimulatorPage } from './pages/SimulatorPage'

function App() {
  const bootstrap = useAppStore((state) => state.bootstrap)
  const isLoading = useAppStore((state) => state.isLoading)
  const hasBootstrapped = useRef(false)

  useEffect(() => {
    if (hasBootstrapped.current) return
    hasBootstrapped.current = true
    void bootstrap()
  }, [bootstrap])

  return (
    <AppShell>
      <BootstrapGate />
      {isLoading ? null : <AppRoutes />}
    </AppShell>
  )
}

function BootstrapGate() {
  const { isLoading, error, bootstrap } = useAppStore()

  if (!isLoading && !error) return null

  if (error) {
    return (
      <div className="bootstrap-gate">
        <div className="bootstrap-gate__card">
          <p>Backend connection failed</p>
          <strong>{error}</strong>
          <button className="button button--primary" onClick={() => void bootstrap()}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bootstrap-gate">
      <div className="bootstrap-gate__card">
        <p>Connecting to backend...</p>
        <strong>Loading your finance workspace</strong>
      </div>
    </div>
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
            <Route path="/health" element={<HealthPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </>
  )
}

export default App
