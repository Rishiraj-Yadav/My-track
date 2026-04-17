import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, Pill } from '../components'
import { formatCompactINR } from '../lib/finance'
import {
  formatCurrencyAxis,
  formatCurrencyTooltip,
  formatYearTick,
  simulationYear,
} from './chartHelpers'
import { useSimulator } from './SimulatorContext'

export function CompoundingVisualizer() {
  const { timeline, activeMonth, plan } = useSimulator()

  const chartData = useMemo(() => {
    const end = Math.max(1, Math.floor(activeMonth))
    return timeline.slice(0, end).map((point) => ({
      month: point.month,
      principal: point.principal,
      interest: point.interest,
    }))
  }, [timeline, activeMonth])

  const last = timeline.at(-1)
  const maxY = (last?.corpus ?? 1) * 1.05
  const interestPct =
    last && last.corpus > 0 ? Math.round((last.interest / last.corpus) * 100) : 0

  return (
    <Card className="dashboard-panel">
      <div className="panel-head">
        <span>Compounding Visualizer</span>
        <Pill tone="positive">{interestPct}% from growth</Pill>
      </div>
      <p className="panel-copy" style={{ marginBottom: 16 }}>
        The green area is compounding at work. By year {Math.max(1, plan.durationMonths / 12)},
        growth outweighs what you put in.
      </p>

      <div className="sim-aha-row">
        <div className="sim-aha-item">
          <span>You invest</span>
          <strong style={{ color: 'var(--blue)' }}>{formatCompactINR(last?.principal ?? 0)}</strong>
        </div>
        <div className="sim-aha-arrow">to</div>
        <div className="sim-aha-item">
          <span>Compounding adds</span>
          <strong style={{ color: 'var(--green)' }}>{formatCompactINR(last?.interest ?? 0)}</strong>
        </div>
        <div className="sim-aha-arrow">to</div>
        <div className="sim-aha-item">
          <span>Total corpus</span>
          <strong style={{ color: 'var(--teal)' }}>{formatCompactINR(last?.corpus ?? 0)}</strong>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={chartData} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="cv-principal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#66b8ff" stopOpacity={0.55} />
              <stop offset="100%" stopColor="#66b8ff" stopOpacity={0.08} />
            </linearGradient>
            <linearGradient id="cv-interest" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7dff6c" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#7dff6c" stopOpacity={0.08} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="month"
            tickFormatter={formatYearTick}
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval={Math.floor(plan.durationMonths / 5)}
          />
          <YAxis
            domain={[0, maxY]}
            tickFormatter={formatCurrencyAxis}
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={50}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(10,15,24,0.96)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 14,
              fontSize: 13,
            }}
            formatter={(value, name) => [
              formatCurrencyTooltip(value),
              name === 'principal' ? 'You invested' : 'Compounding added',
            ]}
            labelFormatter={(month) => `Year ${simulationYear(Number(month))}`}
          />
          <Legend
            formatter={(value) =>
              value === 'principal' ? 'Your contributions' : 'Compounding returns'
            }
            wrapperStyle={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}
          />
          <Area
            type="monotone"
            dataKey="principal"
            stackId="1"
            stroke="#66b8ff"
            strokeWidth={1.5}
            fill="url(#cv-principal)"
            dot={false}
          />
          <Area
            type="monotone"
            dataKey="interest"
            stackId="1"
            stroke="#7dff6c"
            strokeWidth={2}
            fill="url(#cv-interest)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  )
}