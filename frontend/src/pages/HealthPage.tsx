import { Card, BulletList, PageFrame, Pill, ProgressBar } from '../components'
import { calculateMonthlyTotals, healthScore, scoreLabel } from '../lib/finance'
import { useAppStore } from '../store'

export function HealthPage() {
  const { expenses, goals, profile, sip } = useAppStore()
  const totals = calculateMonthlyTotals(expenses)
  const score = healthScore({
    salary: profile.monthlySalary,
    leakage: totals.leakage,
    sipAmount: sip.monthlyAmount,
    goalsOnTrack: goals.some((goal) => goal.savedAmount >= goal.targetAmount * 0.35),
    streak: 12,
    subscriptions: expenses.filter((expense) => expense.name.toLowerCase().includes('ott')).length,
  })

  return (
    <PageFrame>
      <section className="page-hero">
        <div>
          <Pill tone="positive">Health</Pill>
          <h1>Your score is the simplest language in the product.</h1>
          <p>It summarizes leakage, SIP discipline, and goals into one number that moves with the user.</p>
        </div>
      </section>

      <div className="dashboard-grid">
        <Card className="dashboard-panel dashboard-panel--wide">
          <div className="panel-head"><span>Health score</span><Pill tone="teal">{scoreLabel(score)}</Pill></div>
          <div className="score-ring score-ring--hero">
            <div className="score-ring__inner"><span>{score}</span></div>
          </div>
          <ProgressBar value={score} tone="positive" />
        </Card>

        <Card className="dashboard-panel">
          <div className="panel-head"><span>What drives the score</span></div>
          <BulletList items={[
            'Avoidable spend lowers the score.',
            'SIPs push it upward.',
            'Goal progress adds confidence.',
            'Subscription clutter drags it down.',
          ]} />
        </Card>

        <Card className="dashboard-panel">
          <div className="panel-head"><span>Journey</span></div>
          <BulletList items={[
            'Dashboard ticker first',
            'Expenses 10-year impact',
            'Simulator delay slider',
            'Scenario apply moment',
          ]} />
        </Card>
      </div>
    </PageFrame>
  )
}
