import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ArrowUpRight, Check, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, MetricRow, PageFrame, Pill, ProgressBar } from '../components'
import {
  annualLeakage,
  buildSipGrowthSeries,
  calculateMonthlyTotals,
  calculateWhatIfImpact,
  formatCompactINR,
  formatINR,
  futureValueMonthly,
  futureValueWithDelay,
  generateMonthlyTrend,
  groupExpensesByCategory,
  healthScore,
  monthlyEquivalent,
  monthlySavingsRequired,
  percentage,
  scoreLabel,
} from '../lib/finance'
import { useAppStore } from '../store'

/* ─── Helpers ─── */
const tip = {
  background: 'rgba(10,15,24,0.96)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 14,
  color: '#fff',
  fontSize: '0.84rem',
}

const catColor: Record<string, string> = {
  'Food & Delivery': '#ff7f8a',
  Subscriptions: '#f2c66d',
  Transport: '#66b8ff',
  'Digital & Cloud': '#a78bfa',
  'Fitness & Health': '#7dff6c',
  Shopping: '#f472b6',
  Other: '#94a3b8',
}

const tagColor: Record<string, string> = {
  essential: '#7dff6c',
  avoidable: '#f2c66d',
  impulse: '#ff7f8a',
}

/* ─── Animated bleed counter ─── */
function BleedCounter({ rate }: { rate: number }) {
  const [val, setVal] = useState(0)
  const t0 = useRef(Date.now())
  const raf = useRef(0)

  useEffect(() => {
    t0.current = Date.now()
    const loop = () => {
      setVal(((Date.now() - t0.current) / 1000) * rate)
      raf.current = requestAnimationFrame(loop)
    }
    raf.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf.current)
  }, [rate])

  return (
    <div className="bleed">
      <div className="bleed__top">
        <span className="bleed__dot" />
        <span className="bleed__label">money leaking right now</span>
      </div>
      <div className="bleed__rate">
        {formatINR(rate, 3)}<span>/sec</span>
      </div>
      <div className="bleed__since">{formatINR(val, 2)} gone since you opened this page</div>
    </div>
  )
}

/* ─── Mini sparkline ─── */
function Spark({ data, color, h = 40 }: { data: { v: number }[]; color: string; h?: number }) {
  return (
    <ResponsiveContainer width="100%" height={h}>
      <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`s${color.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          fill={`url(#s${color.slice(1)})`}
          strokeWidth={1.8}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function DashboardPage() {
  const { expenses, goals, sip, profile, whatIf, setWhatIf, badges, challenge } = useAppStore()
  const totals = calculateMonthlyTotals(expenses)
  const perSec = totals.leakage / 30 / 24 / 3600
  const saveRate = profile.monthlySalary > 0
    ? ((profile.monthlySalary - totals.total) / profile.monthlySalary) * 100
    : 0

  const score = healthScore({
    salary: profile.monthlySalary,
    leakage: totals.leakage,
    sipAmount: sip.monthlyAmount,
    goalsOnTrack: goals.some((g) => g.savedAmount >= g.targetAmount * 0.35),
    streak: 12,
    subscriptions: expenses.filter((e) => e.name.toLowerCase().includes('ott')).length,
  })

  const impact = calculateWhatIfImpact(whatIf, expenses, sip, profile, goals)
  const trend = generateMonthlyTrend(profile.monthlySalary, totals.total, totals.leakage)
  const sipGrowth = buildSipGrowthSeries(impact.sipImpact, sip.annualReturn, sip.durationMonths)
  const cats = groupExpensesByCategory(expenses)
  const proj = futureValueWithDelay(impact.sipImpact, sip.annualReturn, sip.durationMonths, sip.delayMonths)

  const leaks = expenses
    .filter((e) => e.tag !== 'essential')
    .map((e) => ({ name: e.name, mo: monthlyEquivalent(e.amount, e.frequency), tag: e.tag }))
    .sort((a, b) => b.mo - a.mo)
    .slice(0, 5)
  const maxLeak = leaks[0]?.mo ?? 1

  // Nudge rotation
  const [nIdx, setNIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setNIdx((i) => (i + 1) % 3), 6000)
    return () => clearInterval(t)
  }, [])
  const topLeak = leaks[0]
  const nudges = topLeak
    ? [
        `Skip ${topLeak.name} → ${formatCompactINR(futureValueMonthly(topLeak.mo, 12, 60))} in 5 years.`,
        `${topLeak.name} = ${formatCompactINR(topLeak.mo * 12)}/year. That's a trip to Goa.`,
        `Redirect ${topLeak.name} to a SIP → ${formatCompactINR(futureValueMonthly(topLeak.mo, 12, 120))} in 10 years.`,
      ]
    : ['Add expenses to get insights.']

  const g = goals[0]

  return (
    <PageFrame>
      {/* ─── Header row: bleed + 3 stats ─── */}
      <div className="d-header">
        <div className="d-bleed-card">
          <BleedCounter rate={perSec} />
          <div className="d-bleed-meta">
            <div>
              <span className="d-meta-label">Monthly leakage</span>
              <strong>{formatCompactINR(totals.leakage)}</strong>
            </div>
            <div>
              <span className="d-meta-label">10-year cost</span>
              <strong className="text-warn">{formatCompactINR(annualLeakage(totals.leakage, 12, 10))}</strong>
            </div>
          </div>
        </div>

        <div className="d-stats-col">
          <div className="d-stat">
            <span className="d-meta-label">Salary</span>
            <strong>{formatCompactINR(profile.monthlySalary)}</strong>
            <Spark data={trend.map((p) => ({ v: p.income }))} color="#7dff6c" h={32} />
          </div>
          <div className="d-stat">
            <span className="d-meta-label">Spent</span>
            <strong>{formatCompactINR(totals.total)}</strong>
            <Spark data={trend.map((p) => ({ v: p.spend }))} color="#ff7f8a" h={32} />
          </div>
          <div className="d-stat">
            <span className="d-meta-label">Saved</span>
            <strong className="text-up">{Math.round(saveRate)}%</strong>
            <Spark data={trend.map((p) => ({ v: p.savings }))} color="#35f0d2" h={32} />
          </div>
        </div>

        <div className="d-score-card">
          <div className="d-score-ring" style={{
            background: `conic-gradient(var(--teal) ${score * 3.6}deg, rgba(255,255,255,0.06) 0deg)`,
          }}>
            <div className="d-score-inner">
              <strong>{score}</strong>
              <span>{scoreLabel(score)}</span>
            </div>
          </div>
          <span className="d-meta-label" style={{ textAlign: 'center', marginTop: 8 }}>Health Score</span>
        </div>
      </div>

      {/* ─── Main split: big chart + sidebar ─── */}
      <div className="d-main">
        <div className="d-chart-card">
          <h3>Income vs Expenses</h3>
          <p className="d-muted">6 months · all figures monthly</p>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={trend}>
              <defs>
                <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#35f0d2" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#35f0d2" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12 }} />
              <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={tip} formatter={(v: number) => formatCompactINR(v)} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '0.82rem' }} />
              <Area type="monotone" dataKey="savings" stroke="#35f0d2" fill="url(#sg)" strokeWidth={2} name="Savings" />
              <Line type="monotone" dataKey="income" stroke="#7dff6c" strokeWidth={2.5} dot={false} name="Income" />
              <Line type="monotone" dataKey="spend" stroke="#ff7f8a" strokeWidth={2.5} dot={false} name="Spending" />
              <Line type="monotone" dataKey="leakage" stroke="#f2c66d" strokeWidth={1.8} strokeDasharray="5 3" dot={false} name="Leakage" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="d-sidebar">
          {/* What-if */}
          <div className="d-whatif">
            <h3>What if…</h3>
            <input
              className="text-input"
              value={whatIf}
              onChange={(e) => setWhatIf(e.target.value)}
              placeholder='"stop swiggy" · "add ₹3000 SIP"'
            />
            {whatIf && (
              <div className="d-whatif-result">
                <p className="d-muted">{impact.label}</p>
                <div className="d-deltas">
                  <div>
                    <span>Save</span>
                    <strong className="text-up">+{formatCompactINR(impact.monthlySavingsChange)}/mo</strong>
                  </div>
                  <div>
                    <span>Score</span>
                    <strong>{impact.healthScoreBefore} → <span className="text-up">{impact.healthScoreAfter}</span></strong>
                  </div>
                  <div>
                    <span>Corpus</span>
                    <strong className="text-up">+{formatCompactINR(impact.corpusAfter - impact.corpusBefore)}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Categories */}
          <div className="d-cats">
            <h3>Where it goes</h3>
            {cats.map((c) => (
              <div key={c.category} className="d-cat-row">
                <span className="d-cat-dot" style={{ background: catColor[c.category] || '#94a3b8' }} />
                <span className="d-cat-name">{c.category}</span>
                <div className="d-cat-bar">
                  <div style={{ width: `${c.percentage}%`, background: catColor[c.category] || '#94a3b8' }} />
                </div>
                <span className="d-cat-amt">{formatCompactINR(c.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Second row: SIP chart + Leaks ─── */}
      <div className="d-row2">
        <div className="d-chart-card d-chart-card--sip">
          <h3>SIP compounding</h3>
          <p className="d-muted">{formatCompactINR(impact.sipImpact)}/mo at {sip.annualReturn}% for {Math.round(sip.durationMonths / 12)}Y</p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={sipGrowth}>
              <defs>
                <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#66b8ff" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#66b8ff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#35f0d2" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#35f0d2" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="year" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
              <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 100000).toFixed(1)}L`} />
              <Tooltip contentStyle={tip} formatter={(v: number) => formatCompactINR(v)} />
              <Area type="monotone" dataKey="principal" stackId="1" stroke="#66b8ff" fill="url(#pg)" strokeWidth={1.5} name="You put in" />
              <Area type="monotone" dataKey="returns" stackId="1" stroke="#35f0d2" fill="url(#rg)" strokeWidth={1.5} name="Market gives" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="d-sip-row">
            <div><span className="d-muted">Start now</span><strong>{formatCompactINR(proj.startingNow)}</strong></div>
            <div><span className="d-muted">Delay {sip.delayMonths}mo</span><strong className="text-warn">{formatCompactINR(proj.afterDelay)}</strong></div>
            <div><span className="d-muted">You lose</span><strong className="text-red">{formatCompactINR(proj.delayCost)}</strong></div>
          </div>
        </div>

        <div className="d-leaks-card">
          <h3>Top leaks</h3>
          <p className="d-muted">Avoidable & impulse expenses ranked by cost</p>
          <div className="d-leak-list">
            {leaks.map((l, i) => (
              <div key={l.name} className="d-leak">
                <span className="d-leak-rank">{i + 1}</span>
                <div className="d-leak-mid">
                  <strong>{l.name}</strong>
                  <div className="d-leak-bar">
                    <div style={{ width: `${(l.mo / maxLeak) * 100}%`, background: tagColor[l.tag] }} />
                  </div>
                </div>
                <span className="d-leak-amt">{formatCompactINR(l.mo)}<small>/mo</small></span>
              </div>
            ))}
          </div>
          <div className="d-leak-total">
            <span>10-year compounded cost</span>
            <strong>{formatCompactINR(annualLeakage(totals.leakage, 12, 10))}</strong>
          </div>
        </div>
      </div>

      {/* ─── Bottom: Spend split + Goal + Streak ─── */}
      <div className="d-bottom">
        <div className="d-spend-card">
          <h3>Monthly breakdown</h3>
          <div className="d-spend-bar">
            <div style={{ width: `${percentage(totals.essential, totals.total)}%` }} className="bg-green" />
            <div style={{ width: `${percentage(totals.avoidable, totals.total)}%` }} className="bg-amber" />
            <div style={{ width: `${percentage(totals.impulse, totals.total)}%` }} className="bg-red" />
          </div>
          <div className="d-spend-leg">
            <span><i className="bg-green" /> Essential {formatCompactINR(totals.essential)}</span>
            <span><i className="bg-amber" /> Avoidable {formatCompactINR(totals.avoidable)}</span>
            <span><i className="bg-red" /> Impulse {formatCompactINR(totals.impulse)}</span>
          </div>
        </div>

        {g ? (
          <div className="d-goal-card">
            <div className="d-goal-head">
              <h3>{g.name}</h3>
              <span className="d-muted">{Math.round((g.savedAmount / Math.max(g.targetAmount, 1)) * 100)}% done</span>
            </div>
            <ProgressBar value={(g.savedAmount / Math.max(g.targetAmount, 1)) * 100} tone="positive" />
            <div className="d-goal-row">
              <div><span className="d-muted">Saved</span><strong>{formatCompactINR(g.savedAmount)}</strong></div>
              <div><span className="d-muted">Target</span><strong>{formatCompactINR(g.targetAmount)}</strong></div>
              <div><span className="d-muted">Need/mo</span><strong>{formatCompactINR(monthlySavingsRequired(g.targetAmount, g.targetDate, g.savedAmount))}</strong></div>
            </div>
          </div>
        ) : (
          <div className="d-goal-card">
            <h3>No goals yet</h3>
            <p className="d-muted">Set a goal to track progress.</p>
            <Link to="/goals" className="button button--secondary" style={{ marginTop: 12 }}>
              Create goal <ArrowRight size={14} />
            </Link>
          </div>
        )}

        <div className="d-streak-card">
          <div className="d-streak-num">18</div>
          <span className="d-muted">day savings streak</span>
          <div className="d-badges-mini">
            {badges.filter((b) => b.unlocked).slice(0, 2).map((b) => (
              <span key={b.id} className="d-badge"><Check size={12} /> {b.name}</span>
            ))}
          </div>
          {challenge && (
            <div className="d-challenge">
              <Zap size={13} /> {challenge.name} · {challenge.daysLeft}d left
            </div>
          )}
        </div>
      </div>

      {/* ─── Nudge ─── */}
      <div className="d-nudge">
        <div className="d-nudge-text">
          <span className="d-nudge-icon">💡</span>
          <p>{nudges[nIdx % nudges.length]}</p>
        </div>
        <Link to="/simulator" className="d-nudge-link">
          Simulate <ArrowUpRight size={14} />
        </Link>
      </div>
    </PageFrame>
  )
}
