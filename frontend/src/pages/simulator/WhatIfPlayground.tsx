import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card } from '../../components'
import { formatCompactINR, formatINR } from '../../lib/finance'
import {
  formatCurrencyAxis,
  formatCurrencyTooltip,
  formatYearTick,
  simulationYear,
} from './chartHelpers'
import { useSimulator } from './SimulatorContext'

export function WhatIfPlayground() {
  const { plan, setPlan, timeline, activeMonth, showReal, setShowReal, mcBands, showMC } =
    useSimulator()

  const chartData = useMemo(() => {
    const monthlyInflation = (plan.inflationRate ?? 6) / 12 / 100

    return timeline.map((point, index) => {
      const band = showMC ? mcBands[index] : undefined
      const adjustMonteCarlo = (value: number) =>
        showReal ? value / (1 + monthlyInflation) ** point.month : value
      const p10 = band ? adjustMonteCarlo(band.p10) : undefined
      const p50 = band ? adjustMonteCarlo(band.p50) : undefined
      const p90 = band ? adjustMonteCarlo(band.p90) : undefined

      return {
        month: point.month,
        corpus: showReal ? point.realCorpus : point.corpus,
        principal: point.principal,
        p10,
        p50,
        p90,
        mcFloor: p10 ?? 0,
        mcSpread: band && p10 !== undefined && p90 !== undefined ? Math.max(0, p90 - p10) : 0,
      }
    })
  }, [timeline, activeMonth, plan.inflationRate, mcBands, showMC, showReal])

  const maxCorpus = Math.max(
    1,
    ...chartData.map((point) => Math.max(point.corpus, point.principal, point.p90 ?? 0)),
  )
  const active = timeline[Math.min(Math.floor(activeMonth), timeline.length) - 1]
  const corpus = showReal ? (active?.realCorpus ?? 0) : (active?.corpus ?? 0)
  const invested = active?.principal ?? 0
  const gained = corpus - invested
  const refMonth = Math.floor(activeMonth)

  return (
    <Card className="dashboard-panel dashboard-panel--wide">
      <div className="panel-head">
        <span>What-If Playground</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={`speed-btn ${showReal ? 'is-active' : ''}`}
            onClick={() => setShowReal(!showReal)}
          >
            Real terms
          </button>
        </div>
      </div>

      <div className="sim-sliders">
        <label className="slider-field">
          Monthly SIP
          <input
            type="range"
            min={1000}
            max={50000}
            step={500}
            value={plan.monthlyAmount}
            onChange={(event) => setPlan({ monthlyAmount: Number(event.target.value) })}
          />
          <strong>{formatINR(plan.monthlyAmount)}</strong>
        </label>
        <label className="slider-field">
          Annual Return
          <input
            type="range"
            min={6}
            max={18}
            step={0.5}
            value={plan.annualReturn}
            onChange={(event) => setPlan({ annualReturn: Number(event.target.value) })}
          />
          <strong>{plan.annualReturn}%</strong>
        </label>
        <label className="slider-field">
          Duration
          <input
            type="range"
            min={12}
            max={360}
            step={12}
            value={plan.durationMonths}
            onChange={(event) => setPlan({ durationMonths: Number(event.target.value) })}
          />
          <strong>{plan.durationMonths / 12} yr</strong>
        </label>
        <label className="slider-field">
          Inflation
          <input
            type="range"
            min={3}
            max={10}
            step={0.5}
            value={plan.inflationRate ?? 6}
            onChange={(event) => setPlan({ inflationRate: Number(event.target.value) })}
          />
          <strong>{plan.inflationRate ?? 6}%</strong>
        </label>
        <label className="slider-field">
          Annual Step-Up
          <input
            type="range"
            min={0}
            max={20}
            step={1}
            value={plan.stepUpRate ?? 0}
            onChange={(event) => setPlan({ stepUpRate: Number(event.target.value) })}
          />
          <strong>{plan.stepUpRate ?? 0}%</strong>
        </label>
        <label className="slider-field">
          Delay Start
          <input
            type="range"
            min={0}
            max={24}
            step={6}
            value={plan.delayMonths ?? 0}
            onChange={(event) => setPlan({ delayMonths: Number(event.target.value) })}
          />
          <strong>{plan.delayMonths ?? 0} mo</strong>
        </label>
      </div>

      <div className="sim-kpi-row">
        <div className="sim-kpi">
          <span>Total Corpus</span>
          <strong style={{ color: 'var(--teal)' }}>{formatCompactINR(corpus)}</strong>
        </div>
        <div className="sim-kpi">
          <span>Total Invested</span>
          <strong>{formatCompactINR(invested)}</strong>
        </div>
        <div className="sim-kpi">
          <span>Wealth Gained</span>
          <strong style={{ color: 'var(--green)' }}>{formatCompactINR(gained)}</strong>
        </div>
        <div className="sim-kpi">
          <span>
            Month {refMonth} of {plan.durationMonths}
          </span>
          <strong style={{ color: 'var(--amber)' }}>
            {Math.round((refMonth / plan.durationMonths) * 100)}% complete
          </strong>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="wip-corpus" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#35f0d2" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#35f0d2" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="wip-principal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#66b8ff" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#66b8ff" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="mc-band" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f2c66d" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#f2c66d" stopOpacity={0.02} />
            </linearGradient>
          </defs>
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
            domain={[0, maxCorpus * 1.05]}
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
            formatter={(value, name) => [
              formatCurrencyTooltip(value),
              name === 'corpus'
                ? 'Corpus'
                : name === 'principal'
                  ? 'Invested'
                  : name === 'p50'
                    ? 'Monte Carlo median'
                    : name === 'mcSpread'
                      ? 'Monte Carlo range'
                      : 'Monte Carlo floor',
            ]}
            labelFormatter={(month) => `Month ${month} · Year ${simulationYear(Number(month))}`}
          />
          {showMC ? (
            <>
              <Area
                type="monotone"
                dataKey="mcFloor"
                stackId="mc-band"
                stroke="none"
                fill="transparent"
                dot={false}
                activeDot={false}
                isAnimationActive={false}
                legendType="none"
              />
              <Area
                type="monotone"
                dataKey="mcSpread"
                stackId="mc-band"
                stroke="none"
                fill="url(#mc-band)"
                dot={false}
                activeDot={false}
                isAnimationActive={false}
                name="mcSpread"
              />
            </>
          ) : null}
          <Area
            type="monotone"
            dataKey="principal"
            stroke="#66b8ff"
            strokeWidth={1.5}
            fill="url(#wip-principal)"
            dot={false}
            name="principal"
          />
          <Area
            type="monotone"
            dataKey="corpus"
            stroke="#35f0d2"
            strokeWidth={2.5}
            fill="url(#wip-corpus)"
            dot={false}
            name="corpus"
          />
          {showMC ? (
            <Line
              type="monotone"
              dataKey="p50"
              stroke="#f2c66d"
              strokeWidth={2}
              dot={false}
              strokeDasharray="6 4"
              isAnimationActive={false}
              name="p50"
            />
          ) : null}
          {refMonth > 0 && refMonth <= plan.durationMonths ? (
            <ReferenceLine
              x={refMonth}
              stroke="rgba(255,255,255,0.6)"
              strokeDasharray="4 3"
              strokeWidth={2}
              label={{ value: `Playback: M${refMonth}`, fill: 'rgba(255,255,255,0.9)', fontSize: 13, position: 'top' }}
            />
          ) : null}
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  )
}
