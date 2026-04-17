import { AnimatePresence, motion } from 'framer-motion'
import { Route, Routes, useLocation } from 'react-router-dom'
import { AppShell, TopNav } from './components'
import { DashboardPage } from './pages/DashboardPage'
import { ExpensesPage } from './pages/ExpensesPage'
import { GoalsPage } from './pages/GoalsPage'
import { InsightsPage } from './pages/InsightsPage'
import { LandingPage } from './pages/LandingPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { ScenariosPage } from './pages/ScenariosPage'
import { SimulatorPage } from './pages/SimulatorPage'

function App() {
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
          </Routes>
        </motion.div>
      </AnimatePresence>
    </>
  )
}

export default App

