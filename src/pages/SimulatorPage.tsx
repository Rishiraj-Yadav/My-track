import { useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, MetricRow, PageFrame, Pill } from '../components'
import { calculateMonthlyTotals, formatCompactINR, futureValueMonthly, futureValueWithDelay, monthlyEquivalent } from '../lib/finance'
import { useAppStore } from '../store'

export function SimulatorPage() {
  const { sip, expenses, setSip } = useAppStore()
  const [redirectId, setRedirectId] = useState(expenses[0]?.id ?? '')
  const redirectExpense = expenses.find((expense) => expense.id === redirectId)
  const redirectValue = redirectExpense ? monthlyEquivalent(redirectExpense.amount, redirectExpense.frequency) : 0
  const plan = {
    ...sip,
    monthlyAmount: sip.monthlyAmount + redirectValue,
  }
  const now = futureValueWithDelay(plan.monthlyAmount, plan.annualReturn, plan.durationMonths, 0)
  const later = futureValueWithDelay(plan.monthlyAmount, plan.annualReturn, plan.durationMonths, sip.delayMonths)
  const data = Array.from({ length: plan.durationMonths }, (_, index) => ({
    month: index + 1,
    corpus: futureValueMonthly(plan.monthlyAmount, plan.annualReturn, index + 1),
    principal: plan.monthlyAmount * (index + 1),
  }))

  const totals = calculateMonthlyTotals(expenses)

  return (
    <PageFrame>
      <section className="page-hero">
        <div>
          <Pill tone="positive">Simulator</Pill>
          <h1>Compare start today against waiting, then redirect leaks into SIPs.</h1>
          <p>The curve drops hard when you delay. That is the whole pitch, visualized cleanly.</p>
        </div>
      </section>

      <div className="dashboard-grid">
        <Card className="dashboard-panel">
          <div className="panel-head"><span>SIP inputs</span></div>
          <label className="slider-field">
            Monthly SIP
            <input type="range" min="1000" max="50000" step="500" value={sip.monthlyAmount} onChange={(event) => setSip({ monthlyAmount: Number(event.target.value) })} />
            <strong>{formatCompactINR(sip.monthlyAmount)}</strong>
          </label>
          <label className="slider-field">
            Annual return
            <input type="range" min="6" max="18" step="0.5" value={sip.annualReturn} onChange={(event) => setSip({ annualReturn: Number(event.target.value) })} />
            <strong>{sip.annualReturn}%</strong>
          </label>
          <label className="slider-field">
            Duration
            <input type="range" min="12" max="240" step="12" value={sip.durationMonths} onChange={(event) => setSip({ durationMonths: Number(event.target.value) })} />
            <strong>{sip.durationMonths} mo</strong>
          </label>
          <label className="slider-field">
            Delay
            <input type="range" min="0" max="24" step="6" value={sip.delayMonths} onChange={(event) => setSip({ delayMonths: Number(event.target.value) })} />
            <strong>{sip.delayMonths} mo</strong>
          </label>
        </Card>

        <Card className="dashboard-panel dashboard-panel--wide">
          <div className="panel-head">
            <span>Start today vs start later</span>
            <Pill tone="warning">Compounding gap</Pill>
          </div>
          <div className="comparison-grid">
            <div>
              <span>Start now</span>
              <strong>{formatCompactINR(now.startingNow)}</strong>
            </div>
            <div>
              <span>Start after {sip.delayMonths} months</span>
              <strong>{formatCompactINR(later.startingLater)}</strong>
            </div>
          </div>
          <h3 className="delay-callout">{formatCompactINR(later.delayCost)} lost by waiting.</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="simCorpus" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#35f0d2" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#35f0d2" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="month" hide />
              <YAxis hide />
              <Tooltip contentStyle={{ background: 'rgba(10,15,24,0.96)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16 }} />
              <Area type="monotone" dataKey="corpus" stroke="#35f0d2" fill="url(#simCorpus)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="dashboard-panel">
          <div className="panel-head"><span>Invest this instead</span></div>
          <select className="text-input" value={redirectId} onChange={(event) => setRedirectId(event.target.value)}>
            {expenses.filter((expense) => expense.tag !== 'essential').map((expense) => (
              <option key={expense.id} value={expense.id}>{expense.name}</option>
            ))}
          </select>
          <p className="panel-copy">{redirectExpense?.name} adds {formatCompactINR(redirectValue)} every month to your SIP.</p>
          <MetricRow
            items={[
              { label: 'Monthly corpus', value: formatCompactINR(plan.monthlyAmount) },
              { label: '10-year corpus', value: formatCompactINR(now.startingNow) },
              { label: 'Leakage baseline', value: formatCompactINR(totals.leakage) },
            ]}
          />
        </Card>
      </div>
    </PageFrame>
  )
}

