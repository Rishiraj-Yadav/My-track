import { PageFrame, Pill } from '../components'
import { CompoundingVisualizer } from './simulator/CompoundingVisualizer'
import { DelayCostWidget } from './simulator/DelayCostWidget'
import { LifeGoalSimulator } from './simulator/LifeGoalSimulator'
import { NLPConsole } from './simulator/NLPConsole'
import { ScenarioLab } from './simulator/ScenarioLab'
import { SimulatorProvider, useSimulator } from './simulator/SimulatorContext'
import { TimelineAnimator } from './simulator/TimelineAnimator'
import { WhatIfPlayground } from './simulator/WhatIfPlayground'

function MCToggle() {
  const { showMC, setShowMC, showReal, setShowReal } = useSimulator()
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <button
        className={`speed-btn ${showMC ? 'is-active' : ''}`}
        onClick={() => setShowMC(!showMC)}
      >
        Monte Carlo
      </button>
      <button
        className={`speed-btn ${showReal ? 'is-active' : ''}`}
        onClick={() => setShowReal(!showReal)}
      >
        Real ₹
      </button>
    </div>
  )
}

function SimulatorContent() {
  return (
    <PageFrame>
      {/* Hero */}
      <section className="page-hero">
        <div>
          <Pill tone="positive">Simulator 2.0</Pill>
          <h1>Make the invisible visible.</h1>
          <p>
            Play with sliders, run scenarios, and watch the future take shape — month by month.
            Every choice has a price; this shows you exactly what it is.
          </p>
        </div>
        <MCToggle />
      </section>

      {/* NLP command bar */}
      <div style={{ marginBottom: 18 }}>
        <NLPConsole />
      </div>

      {/* Main playground + timeline */}
      <div style={{ marginBottom: 18 }}>
        <WhatIfPlayground />
      </div>
      <div style={{ marginBottom: 18 }}>
        <TimelineAnimator />
      </div>

      {/* Side-by-side: compounding aha + delay cost */}
      <div className="dashboard-grid" style={{ marginBottom: 18 }}>
        <CompoundingVisualizer />
        <DelayCostWidget />
      </div>

      {/* Scenario comparison */}
      <div style={{ marginBottom: 18 }}>
        <ScenarioLab />
      </div>

      {/* Goal tracker */}
      <LifeGoalSimulator />
    </PageFrame>
  )
}

export function SimulatorPage() {
  return (
    <SimulatorProvider>
      <SimulatorContent />
    </SimulatorProvider>
  )
}
