import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BulletList, Card, MetricRow, PageFrame, Pill, ProgressBar } from '../components'
import { formatCompactINR, futureValueMonthly, monthlySavingsRequired, percentage } from '../lib/finance'
import { useAppStore } from '../store'

export function GoalsPage() {
  const { goals, addGoal } = useAppStore()
  const [form, setForm] = useState({ name: '', targetAmount: '', targetDate: '', priority: '2' })
  const topGoal = goals[0]
  const required = topGoal ? monthlySavingsRequired(topGoal.targetAmount, topGoal.targetDate, topGoal.savedAmount) : 0

  const submit = () => {
    if (!form.name || !form.targetAmount || !form.targetDate) return
    addGoal({
      id: crypto.randomUUID(),
      name: form.name,
      targetAmount: Number(form.targetAmount),
      targetDate: form.targetDate,
      priority: Number(form.priority) as 1 | 2 | 3,
      savedAmount: 0,
    })
    setForm({ name: '', targetAmount: '', targetDate: '', priority: '2' })
  }

  const timeline = goals.map((goal, index) => ({
    name: goal.name,
    month: index + 1,
    projected: futureValueMonthly(monthlySavingsRequired(goal.targetAmount, goal.targetDate, goal.savedAmount), 12, 12),
  }))

  return (
    <PageFrame>
      <section className="page-hero">
        <div>
          <Pill tone="teal">Goals</Pill>
          <h1>Turn target dates into a monthly number that can be acted on now.</h1>
          <p>Each goal card shows progress, required monthly saving, and whether investing beats plain saving.</p>
        </div>
      </section>

      <div className="dashboard-grid">
        <Card className="dashboard-panel">
          <div className="panel-head"><span>Add goal</span></div>
          <div className="form-stack">
            <input className="text-input" placeholder="Goal name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            <input className="text-input" placeholder="Target amount" value={form.targetAmount} onChange={(event) => setForm({ ...form, targetAmount: event.target.value })} />
            <input className="text-input" type="date" value={form.targetDate} onChange={(event) => setForm({ ...form, targetDate: event.target.value })} />
            <select className="text-input" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
              <option value="1">Priority 1</option>
              <option value="2">Priority 2</option>
              <option value="3">Priority 3</option>
            </select>
          </div>
          <button className="button button--primary" onClick={submit}>Add goal <ArrowRight size={16} /></button>
        </Card>

        <Card className="dashboard-panel dashboard-panel--wide">
          <div className="panel-head"><span>Goal cards</span><Pill tone="positive">On track</Pill></div>
          <div className="goal-grid">
            {goals.map((goal) => (
              <div key={goal.id} className="goal-card">
                <div className="panel-head">
                  <strong>{goal.name}</strong>
                  <Pill tone={goal.priority === 1 ? 'warning' : 'positive'}>P{goal.priority}</Pill>
                </div>
                <ProgressBar value={percentage(goal.savedAmount, goal.targetAmount)} tone="positive" />
                <MetricRow
                  items={[
                    { label: 'Saved', value: formatCompactINR(goal.savedAmount) },
                    { label: 'Target', value: formatCompactINR(goal.targetAmount) },
                    { label: 'Needed / mo', value: formatCompactINR(monthlySavingsRequired(goal.targetAmount, goal.targetDate, goal.savedAmount)) },
                  ]}
                />
              </div>
            ))}
          </div>
        </Card>

        <Card className="dashboard-panel">
          <div className="panel-head"><span>Invest vs save</span></div>
          <div className="comparison-grid">
            <div><span>Save only</span><strong>{formatCompactINR(topGoal?.savedAmount ?? 0)}</strong></div>
            <div><span>Invest same amount</span><strong>{formatCompactINR(futureValueMonthly(required, 12, 24))}</strong></div>
          </div>
        </Card>

        <Card className="dashboard-panel">
          <div className="panel-head"><span>Suggested cuts</span></div>
          <BulletList items={['Trim one delivery habit', 'Remove duplicate subscriptions', 'Redirect one impulse purchase']} />
        </Card>

        <Card className="dashboard-panel dashboard-panel--wide">
          <div className="panel-head"><span>Goal timeline</span></div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={timeline}>
              <defs>
                <linearGradient id="goalGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#35f0d2" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#35f0d2" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" />
              <YAxis stroke="rgba(255,255,255,0.4)" />
              <Tooltip contentStyle={{ background: 'rgba(10,15,24,0.96)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16 }} />
              <Area type="monotone" dataKey="projected" stroke="#35f0d2" fill="url(#goalGradient)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </PageFrame>
  )
}

