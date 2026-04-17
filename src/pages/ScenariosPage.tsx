import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, PageFrame, Pill } from '../components'
import { formatCompactINR, futureValueMonthly } from '../lib/finance'
import { useAppStore } from '../store'

export function ScenariosPage() {
  const { scenarios, setScenario, setSip, sip } = useAppStore()
  const [template, setTemplate] = useState('')

  const winner = scenarios[1]?.monthlySip > scenarios[0]?.monthlySip ? scenarios[1] : scenarios[0]
  const comparison = scenarios.map((scenario) => ({
    name: scenario.name,
    corpus: futureValueMonthly(scenario.monthlySip, 12, scenario.months),
    savings: scenario.avoidableCut * 12,
  }))

  const applyScenario = (scenarioId: string) => {
    const scenario = scenarios.find((item) => item.id === scenarioId)
    if (!scenario) return
    setSip({ monthlyAmount: scenario.monthlySip })
  }

  const applyTemplate = (name: string) => {
    setTemplate(name)
    if (name === 'stop-food') setScenario(scenarios[0].id, { avoidableCut: 4200 })
    if (name === 'start-sip') setScenario(scenarios[0].id, { monthlySip: sip.monthlyAmount + 3000 })
  }

  return (
    <PageFrame>
      <section className="page-hero">
        <div>
          <Pill tone="teal">Scenarios</Pill>
          <h1>Run side-by-side financial futures without leaving the browser.</h1>
          <p>Two scenarios, one winner, and a clear rupee delta makes the narrative easy to follow.</p>
        </div>
      </section>

      <div className="dashboard-grid">
        <Card className="dashboard-panel">
          <div className="panel-head"><span>Templates</span></div>
          <div className="template-stack">
            <button className="template-btn" onClick={() => applyTemplate('stop-food')}>Stop food delivery</button>
            <button className="template-btn" onClick={() => applyTemplate('start-sip')}>Start SIP today</button>
            <button className="template-btn" onClick={() => applyTemplate('buy-laptop')}>Buy laptop in 6 mo</button>
          </div>
          <p className="panel-copy">{template ? `Applied template: ${template}` : 'Pick a preset to seed the comparison.'}</p>
        </Card>

        <Card className="dashboard-panel dashboard-panel--wide">
          <div className="panel-head"><span>Outcome comparison</span><Pill tone="warning">Winner: {winner?.name}</Pill></div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={comparison}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" />
              <YAxis stroke="rgba(255,255,255,0.4)" />
              <Tooltip contentStyle={{ background: 'rgba(10,15,24,0.96)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16 }} />
              <Legend />
              <Bar dataKey="corpus" fill="#35f0d2" radius={[10, 10, 0, 0]} />
              <Bar dataKey="savings" fill="#ff7f8a" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="dashboard-panel">
          <div className="panel-head"><span>Saved scenarios</span></div>
          <ul className="rank-list">
            {scenarios.map((scenario) => (
              <li key={scenario.id}>
                <span>•</span>
                <div>
                  <strong>{scenario.name}</strong>
                  <p>{formatCompactINR(scenario.monthlySip)} SIP / month</p>
                </div>
                <button className="icon-btn" onClick={() => applyScenario(scenario.id)}>Apply</button>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="dashboard-panel">
          <div className="panel-head"><span>Delta</span></div>
          <h3>{formatCompactINR((comparison[1]?.corpus ?? 0) - (comparison[0]?.corpus ?? 0))}</h3>
          <p className="panel-copy">System declares the better future by rupee impact, not vibes.</p>
        </Card>
      </div>
    </PageFrame>
  )
}

