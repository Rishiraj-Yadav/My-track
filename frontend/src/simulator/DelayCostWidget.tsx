import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, Pill } from '../components'
import { formatCompactINR, formatINR, projectTimeline, projectWithEvents } from '../lib/finance'
import {
  formatCurrencyAxis,
  formatCurrencyTooltip,
  formatYearTick,
  simulationYear,
} from './chartHelpers'
import { useSimulator } from './SimulatorContext'

export function DelayCostWidget() {
  const { plan, events, activeMonth } = useSimulator()
  const delayMonths = Math.max(plan.delayMonths ?? 0, 1)

  const nowTimeline = useMemo(
    () =>
      events.length > 0
        ? projectWithEvents({ ...plan, delayMonths: 0 }, events)
        : projectTimeline({ ...plan, delayMonths: 0 }),
    [plan, events],
  )
  const laterTimeline = useMemo(
    () =>
      events.length > 0
        ? projectWithEvents({ ...plan, delayMonths }, events)
        : projectTimeline({ ...plan, delayMonths }),
    [plan, events, delayMonths],
  )

  const chartData = useMemo(() => {
    const end = Math.max(1, Math.floor(activeMonth))
    return nowTimeline.slice(0, end).map((point, index) => ({
      month: point.month,
      startNow: point.corpus,
      startLater: laterTimeline[index]?.corpus ?? 0,
    }))
  }, [nowTimeline, laterTimeline, activeMonth])

  const nowEnd = nowTimeline.at(-1)?.corpus ?? 0
  const laterEnd = laterTimeline.at(-1)?.corpus ?? 0
  const delayCost = nowEnd - laterEnd
  const maxY = Math.max(nowEnd, laterEnd, 1) * 1.05
  const perMonthCost = delayCost / delayMonths

  return (
    <Card className="dashboard-panel">
      <div className="panel-head">
        <span>Delay Cost Calculator</span>
        <Pill tone="warning">Urgency meter</Pill>
      </div>
      <p className="panel-copy" style={{ marginBottom: 14 }}>
        Every month you delay costs{' '}
        <strong style={{ color: 'var(--red)' }}>{formatCompactINR(perMonthCost)}</strong> of
        future corpus. The gap only widens.
      </p>

      <div className="comparison-grid" style={{ marginBottom: 18 }}>
        <div>
          <span>Start today</span>
          <strong style={{ color: 'var(--green)' }}>{formatCompactINR(nowEnd)}</strong>
        </div>
        <div>
          <span>Start {delayMonths} mo later</span>
          <strong style={{ color: 'var(--red)' }}>{formatCompactINR(laterEnd)}</strong>
        </div>
      </div>

      <div
        className="delay-callout"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 16px',
          borderRadius: 14,
          background: 'rgba(255,127,138,0.08)',
          border: '1px solid rgba(255,127,138,0.2)',
          marginBottom: 16,
        }}
      >
        <span style={{ fontSize: '1.1rem', color: 'var(--red)' }}>Warning</span>
        <div>
          <strong style={{ color: 'var(--red)', display: 'block' }}>
            {formatINR(delayCost)} lost
          </strong>
          <span style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>
            by waiting {delayMonths} months to start your SIP
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="dc-now" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7dff6c" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#7dff6c" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="dc-later" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff7f8a" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#ff7f8a" stopOpacity={0.02} />
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
              name === 'startNow' ? 'Start today' : `Start ${delayMonths}mo later`,
            ]}
            labelFormatter={(month) => `Year ${simulationYear(Number(month))}`}
          />
          <Area
            type="monotone"
            dataKey="startNow"
            stroke="#7dff6c"
            strokeWidth={2}
            fill="url(#dc-now)"
            dot={false}
          />
          <Area
            type="monotone"
            dataKey="startLater"
            stroke="#ff7f8a"
            strokeWidth={2}
            fill="url(#dc-later)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  )
}