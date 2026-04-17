import { CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, MetricRow, PageFrame, Pill } from '../components'
import { calculateMonthlyTotals, detectPersonality, formatCompactINR, monthlyEquivalent } from '../lib/finance'
import { useAppStore } from '../store'

const palette = ['#35f0d2', '#7dff6c', '#66b8ff', '#f2c66d', '#ff7f8a']

export function InsightsPage() {
  const { expenses, goals, badges, challenge, sip, profile } = useAppStore()
  const totals = calculateMonthlyTotals(expenses)
  const personality = detectPersonality({
    avoidableShare: totals.leakage / profile.monthlySalary,
    sipAmount: sip.monthlyAmount,
    salary: profile.monthlySalary,
    goalCount: goals.length,
    subscriptions: expenses.filter((expense) => expense.name.toLowerCase().includes('ott')).length,
  })

  const monthlyTrend = Array.from({ length: 6 }, (_, index) => ({
    month: `M${index + 1}`,
    total: totals.total * (0.94 + index * 0.02),
    avoidable: totals.leakage * (0.88 + index * 0.03),
    savings: profile.monthlySalary - totals.total * (0.92 + index * 0.015),
  }))

  const pieData = expenses.map((expense) => ({ name: expense.name, value: monthlyEquivalent(expense.amount, expense.frequency) }))
  const recs = expenses
    .filter((expense) => expense.tag !== 'essential')
    .slice(0, 3)
    .map((expense) => ({
      label: `Review ${expense.name}`,
      value: formatCompactINR(monthlyEquivalent(expense.amount, expense.frequency)),
    }))

  return (
    <PageFrame>
      <section className="page-hero">
        <div>
          <Pill tone="teal">Insights</Pill>
          <h1>Package habits into a personality, then show the rupee consequence.</h1>
          <p>Clean signals, low cognitive load, and enough visual polish to feel premium in a demo room.</p>
        </div>
      </section>

      <div className="dashboard-grid">
        <Card className="dashboard-panel">
          <div className="panel-head"><span>Spending personality</span><Pill tone="warning">{personality}</Pill></div>
          <MetricRow items={[
            { label: 'Savings streak', value: '18 days' },
            { label: 'No-spend challenge', value: challenge.name },
            { label: 'Saved so far', value: formatCompactINR(challenge.saved) },
          ]} />
        </Card>

        <Card className="dashboard-panel dashboard-panel--wide">
          <div className="panel-head"><span>Monthly trend</span></div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" />
              <YAxis stroke="rgba(255,255,255,0.4)" />
              <Tooltip contentStyle={{ background: 'rgba(10,15,24,0.96)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16 }} />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#66b8ff" strokeWidth={3} />
              <Line type="monotone" dataKey="avoidable" stroke="#ff7f8a" strokeWidth={3} />
              <Line type="monotone" dataKey="savings" stroke="#35f0d2" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="dashboard-panel">
          <div className="panel-head"><span>Expense pie</span></div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} dataKey="value" innerRadius={55} outerRadius={90}>
                {pieData.map((entry, index) => (
                  <Cell key={entry.name} fill={palette[index % palette.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'rgba(10,15,24,0.96)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="dashboard-panel">
          <div className="panel-head"><span>Recommendations</span></div>
          {recs.length ? (
            <ul className="recommendation-list">
              {recs.map((rec) => (
                <li key={rec.label}>
                  <strong>{rec.label}</strong>
                  <span>{rec.value}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="panel-copy">Add avoidable or impulse expenses and this panel will suggest where to start.</p>
          )}
        </Card>

        <Card className="dashboard-panel">
          <div className="panel-head"><span>Badges wall</span></div>
          <div className="badge-wall">
            {badges.map((badge) => (
              <div key={badge.id} className={`badge-wall__item ${badge.unlocked ? 'is-unlocked' : ''}`}>
                <strong>{badge.name}</strong>
                <span>{badge.hint}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageFrame>
  )
}
