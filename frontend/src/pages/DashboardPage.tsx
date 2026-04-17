import { ArrowRight, Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, MetricRow, PageFrame, Pill, ProgressBar } from '../components'
import { annualLeakage, calculateMonthlyTotals, formatCompactINR, formatINR, futureValueMonthly, futureValueWithDelay, healthScore, monthlyEquivalent, percentage, parseWhatIfCommand, scoreLabel } from '../lib/finance'
import { useAppStore } from '../store'

const chartTheme = {
  teal: '#35f0d2',
  red: '#ff7f8a',
}

export function DashboardPage() {
  const { expenses, goals, sip, profile, whatIf, setWhatIf, badges } = useAppStore()
  const totals = calculateMonthlyTotals(expenses)
  const parsed = parseWhatIfCommand(whatIf, expenses, sip.monthlyAmount)
  const score = healthScore({
    salary: profile.monthlySalary,
    leakage: totals.leakage,
    sipAmount: parsed.sipImpact,
    goalsOnTrack: goals.some((goal) => goal.savedAmount >= goal.targetAmount * 0.35),
    streak: 12,
    subscriptions: expenses.filter((expense) => expense.name.toLowerCase().includes('ott')).length,
  })

  const projection = futureValueWithDelay(
    parsed.sipImpact,
    sip.annualReturn,
    sip.durationMonths,
    sip.delayMonths,
  )

  const topLeaks = expenses
    .filter((expense) => expense.tag !== 'essential')
    .map((expense) => ({ name: expense.name, monthly: monthlyEquivalent(expense.amount, expense.frequency) }))
    .sort((a, b) => b.monthly - a.monthly)
    .slice(0, 3)

  const chartData = Array.from({ length: 10 }, (_, index) => ({
    year: `${index + 1}Y`,
    spend: totals.leakage * (1 + index * 0.2),
    corpus: futureValueMonthly(parsed.sipImpact, sip.annualReturn, (index + 1) * 12),
  }))

  return (
    <PageFrame>
      <section className="page-hero">
        <div>
          <Pill tone="teal">Dashboard</Pill>
          <h1>Money bleeding, future cost, and compounding. All in one glance.</h1>
          <p>The dashboard turns spend habits into a live decision surface with rupee-per-second bleed, long-term cost, and what-if simulation side by side.</p>
        </div>
        <div className="page-hero__actions">
          <Link to="/expenses" className="button button--secondary">Open expenses</Link>
          <Link to="/simulator" className="button button--primary">Run a what-if <ArrowRight size={16} /></Link>
        </div>
      </section>

      <div className="dashboard-grid">
        <Card className="dashboard-panel dashboard-panel--wide">
          <div className="panel-head">
            <span>Live bleed ticker</span>
            <Pill tone="warning">Updating</Pill>
          </div>
          <div className="ticker-figure">{formatINR(totals.leakage / 30 / 24 / 3600, 3)} / sec</div>
          <ProgressBar value={percentage(totals.leakage, profile.monthlySalary)} tone="warning" />
          <MetricRow
            items={[
              { label: 'Salary', value: formatCompactINR(profile.monthlySalary) },
              { label: 'Spend', value: formatCompactINR(totals.total) },
              { label: 'Left over', value: formatCompactINR(profile.monthlySalary - totals.total) },
            ]}
          />
        </Card>

        <Card className="dashboard-panel">
          <div className="panel-head">
            <span>Financial health</span>
            <Pill tone="positive">{scoreLabel(score)}</Pill>
          </div>
          <div className="score-ring score-ring--large">
            <div className="score-ring__inner"><span>{score}</span></div>
          </div>
          <p className="panel-copy">The score responds to leakage, SIP behavior, and goal discipline.</p>
        </Card>

        <Card className="dashboard-panel">
          <div className="panel-head">
            <span>Monthly leakage</span>
            <Pill tone="warning">Focus area</Pill>
          </div>
          <div className="kpi-stack">
            <strong>{formatCompactINR(totals.leakage)}</strong>
            <span>avoidable + impulse spend</span>
          </div>
          <div className="mini-bars">
            <div style={{ width: `${percentage(totals.essential, totals.total)}%` }} className="mini-bars__essential" />
            <div style={{ width: `${percentage(totals.avoidable, totals.total)}%` }} className="mini-bars__avoidable" />
            <div style={{ width: `${percentage(totals.impulse, totals.total)}%` }} className="mini-bars__impulse" />
          </div>
        </Card>

        <Card className="dashboard-panel dashboard-panel--wide">
          <div className="panel-head">
            <span>Future cost of today</span>
            <Pill tone="teal">10 years</Pill>
          </div>
          <div className="ticker-figure">{formatCompactINR(annualLeakage(totals.leakage, 12, 10))}</div>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={chartData}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="year" stroke="rgba(255,255,255,0.4)" />
              <YAxis stroke="rgba(255,255,255,0.4)" />
              <Tooltip contentStyle={{ background: 'rgba(10,15,24,0.96)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16 }} />
              <Bar dataKey="spend" fill={chartTheme.red} radius={[10, 10, 0, 0]} />
              <Line type="monotone" dataKey="corpus" stroke={chartTheme.teal} strokeWidth={3} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>

        <Card className="dashboard-panel">
          <div className="panel-head">
            <span>Quick what-if</span>
            <Pill tone="teal">Live parser</Pill>
          </div>
          <input className="text-input" value={whatIf} onChange={(event) => void setWhatIf(event.target.value)} placeholder="Type a habit change" />
          <p className="panel-copy">{parsed.label}</p>
        </Card>

        <Card className="dashboard-panel">
          <div className="panel-head">
            <span>SIP status</span>
            <Pill tone="positive">On track</Pill>
          </div>
          <div className="kpi-stack">
            <strong>{formatCompactINR(parsed.sipImpact)}</strong>
            <span>{formatCompactINR(projection.startingNow)} projected corpus</span>
          </div>
          <p className="panel-copy">{formatCompactINR(projection.delayCost)} lost if the SIP starts later.</p>
        </Card>

        <Card className="dashboard-panel">
          <div className="panel-head">
            <span>Top leaks</span>
            <Pill tone="warning">Highest impact</Pill>
          </div>
          <ul className="rank-list">
            {topLeaks.map((leak, index) => (
              <li key={leak.name}>
                <span>{index + 1}</span>
                <div>
                  <strong>{leak.name}</strong>
                  <p>{formatCompactINR(leak.monthly)} / month</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="dashboard-panel">
          <div className="panel-head">
            <span>Active goal</span>
            <Pill tone="positive">Priority</Pill>
          </div>
          {goals[0] ? (
            <>
              <strong>{goals[0].name}</strong>
              <ProgressBar value={(goals[0].savedAmount / Math.max(goals[0].targetAmount, 1)) * 100} tone="positive" />
              <MetricRow
                items={[
                  { label: 'Saved', value: formatCompactINR(goals[0].savedAmount) },
                  { label: 'Target', value: formatCompactINR(goals[0].targetAmount) },
                  {
                    label: 'Required / mo',
                    value: formatCompactINR(
                      (goals[0].targetAmount - goals[0].savedAmount) /
                        Math.max(
                          1,
                          new Date(goals[0].targetDate).getMonth() -
                            new Date().getMonth() +
                            12 * (new Date(goals[0].targetDate).getFullYear() - new Date().getFullYear()),
                        ),
                    ),
                  },
                ]}
              />
            </>
          ) : (
            <p className="panel-copy">Add a goal in onboarding to see priority and monthly requirement here.</p>
          )}
        </Card>

        <Card className="dashboard-panel">
          <div className="panel-head">
            <span>Recent badges</span>
            <Pill tone="teal">Gamified</Pill>
          </div>
          <div className="badge-stack">
            {badges.filter((badge) => badge.unlocked).slice(0, 2).map((badge) => (
              <div key={badge.id} className="badge-chip">
                <Check size={14} /> {badge.name}
              </div>
            ))}
          </div>
          <p className="panel-copy">Unlock criteria becomes visible as the user moves through the app.</p>
        </Card>
      </div>

      <section className="section section--tight">
        <Card className="insight-banner">
          <div>
            <Pill tone="teal">Smart nudge</Pill>
            <h3>Cut {formatCompactINR(topLeaks[0]?.monthly ?? 0)} a month and redirect it into compounding.</h3>
          </div>
          <Link to="/simulator" className="button button--secondary">Simulate it</Link>
        </Card>
      </section>
    </PageFrame>
  )
}
