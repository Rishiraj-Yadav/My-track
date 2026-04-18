import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, Pill } from '../../components'
import { formatCompactINR, projectTimeline } from '../../lib/finance'
import { useAppStore } from '../../store'
import {
  formatCurrencyAxis,
  formatCurrencyTooltip,
  formatYearTick,
  simulationYear,
} from './chartHelpers'
import { useSimulator } from './SimulatorContext'

const COLORS = ['#35f0d2', '#7dff6c', '#f2c66d', '#ff7f8a']

export function ScenarioLab() {
  const { plan, timeline, activeMonth } = useSimulator()
  const { scenarios, addScenario } = useAppStore()
  const [selectedIds, setSelectedIds] = useState<string[]>([scenarios[0]?.id ?? ''])

  const selectedScenarios = scenarios.filter((scenario) => selectedIds.includes(scenario.id))

  const scenarioTimelines = useMemo(
    () =>
      selectedScenarios.map((scenario) =>
        projectTimeline({
          ...plan,
          monthlyAmount: scenario.monthlySip + scenario.avoidableCut,
          durationMonths: scenario.months,
        }),
      ),
    [selectedScenarios, plan],
  )

  const end = Math.max(1, Math.floor(activeMonth))

  const chartData = useMemo(() => {
    const maxLen = Math.max(...scenarioTimelines.map((timelineRow) => timelineRow.length), timeline.length)
    return Array.from({ length: Math.min(end, maxLen) }, (_, index) => {
      const month = index + 1
      const row: Record<string, number> = { month, current: timeline[index]?.corpus ?? 0 }
      selectedScenarios.forEach((scenario, scenarioIndex) => {
        row[scenario.id] = scenarioTimelines[scenarioIndex]?.[index]?.corpus ?? 0
      })
      return row
    })
  }, [timeline, scenarioTimelines, selectedScenarios, end])

  const maxY =
    Math.max(
      timeline.at(-1)?.corpus ?? 0,
      ...scenarioTimelines.map((timelineRow) => timelineRow.at(-1)?.corpus ?? 0),
    ) * 1.05

  const currentEnd = timeline.at(-1)?.corpus ?? 0

  function toggleScenario(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev.slice(-2), id],
    )
  }

  function saveCurrentAsScenario() {
    addScenario({
      id: `s${Date.now()}`,
      name: `Custom ${new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`,
      monthlySip: plan.monthlyAmount,
      avoidableCut: 0,
      months: plan.durationMonths,
    })
  }

  return (
    <Card className="dashboard-panel dashboard-panel--wide">
      <div className="panel-head">
        <span>Scenario Lab</span>
        <Pill tone="teal">A/B Compare</Pill>
      </div>

      <div
        style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}
      >
        <div className="scenario-tabs">
          {scenarios.map((scenario) => (
            <button
              key={scenario.id}
              className={`scenario-tab ${selectedIds.includes(scenario.id) ? 'is-active' : ''}`}
              onClick={() => toggleScenario(scenario.id)}
            >
              {scenario.name}
            </button>
          ))}
        </div>
        <button className="tag-btn" onClick={saveCurrentAsScenario} style={{ width: 'auto' }}>
          + Save current
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        {selectedScenarios.map((scenario, index) => {
          const scenarioEnd = scenarioTimelines[index]?.at(-1)?.corpus ?? 0
          const delta = scenarioEnd - currentEnd
          return (
            <div
              key={scenario.id}
              className={`delta-chip ${delta >= 0 ? 'delta-chip--positive' : 'delta-chip--negative'}`}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: COLORS[index + 1],
                  display: 'inline-block',
                }}
              />
              {scenario.name}: {delta >= 0 ? '+' : ''}
              {formatCompactINR(delta)} vs current
            </div>
          )
        })}
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="month"
            tickFormatter={formatYearTick}
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval={Math.floor(plan.durationMonths / 6)}
          />
          <YAxis
            domain={[0, maxY]}
            tickFormatter={formatCurrencyAxis}
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={54}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(10,15,24,0.96)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 14,
              fontSize: 13,
            }}
            formatter={(value) => formatCurrencyTooltip(value)}
            labelFormatter={(month) => `Year ${simulationYear(Number(month))}`}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }} />
          <Line
            type="monotone"
            dataKey="current"
            stroke={COLORS[0]}
            strokeWidth={2.5}
            dot={false}
            name="Current plan"
          />
          {selectedScenarios.map((scenario, index) => (
            <Line
              key={scenario.id}
              type="monotone"
              dataKey={scenario.id}
              stroke={COLORS[index + 1]}
              strokeWidth={2}
              strokeDasharray={index % 2 === 0 ? undefined : '6 3'}
              dot={false}
              name={scenario.name}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}
