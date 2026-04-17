import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, MetricRow, PageFrame, Pill } from '../components'
import { annualLeakage, calculateMonthlyTotals, formatCompactINR, monthlyEquivalent } from '../lib/finance'
import { useAppStore } from '../store'

export function ExpensesPage() {
  const { expenses, addExpense, updateExpense, deleteExpense } = useAppStore()
  const [form, setForm] = useState({
    name: '',
    amount: '',
    frequency: 'monthly',
    tag: 'avoidable',
  })

  const totals = calculateMonthlyTotals(expenses)

  const submit = () => {
    if (!form.name.trim() || !form.amount) return
    addExpense({
      id: crypto.randomUUID(),
      name: form.name.trim(),
      amount: Number(form.amount),
      frequency: form.frequency as 'daily' | 'weekly' | 'monthly',
      tag: form.tag as 'essential' | 'avoidable' | 'impulse',
    })
    setForm({ name: '', amount: '', frequency: 'monthly', tag: 'avoidable' })
  }

  return (
    <PageFrame>
      <section className="page-hero">
        <div>
          <Pill tone="warning">Expenses</Pill>
          <h1>Tag every recurring cost once and let the app do the rest.</h1>
          <p>Essential stays clean. Avoidable and impulse flow straight into leakage and projections.</p>
        </div>
      </section>

      <div className="dashboard-grid dashboard-grid--expenses">
        <Card className="dashboard-panel">
          <div className="panel-head"><span>Add expense</span><Pill tone="teal">Quick entry</Pill></div>
          <div className="form-grid">
            <input className="text-input" placeholder="Expense name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            <input className="text-input" placeholder="Amount" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
            <select className="text-input" value={form.frequency} onChange={(event) => setForm({ ...form, frequency: event.target.value })}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <select className="text-input" value={form.tag} onChange={(event) => setForm({ ...form, tag: event.target.value })}>
              <option value="essential">Essential</option>
              <option value="avoidable">Avoidable</option>
              <option value="impulse">Impulse</option>
            </select>
          </div>
          <button className="button button--primary" onClick={submit}>Add expense <ArrowRight size={16} /></button>
        </Card>

        <Card className="dashboard-panel dashboard-panel--wide">
          <div className="panel-head"><span>Expense list</span><Pill tone="positive">Sortable</Pill></div>
          <div className="table-wrap">
            <table className="expense-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Tag</th>
                  <th>Monthly eq.</th>
                  <th>10-year cost</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => {
                  const monthly = monthlyEquivalent(expense.amount, expense.frequency)
                  return (
                    <tr key={expense.id}>
                      <td>{expense.name}</td>
                      <td>
                        <button
                          className={`tag-btn tag-btn--${expense.tag}`}
                          onClick={() =>
                            updateExpense(expense.id, {
                              tag:
                                expense.tag === 'essential'
                                  ? 'avoidable'
                                  : expense.tag === 'avoidable'
                                    ? 'impulse'
                                    : 'essential',
                            })
                          }
                        >
                          {expense.tag}
                        </button>
                      </td>
                      <td>{formatCompactINR(monthly)}</td>
                      <td>{formatCompactINR(annualLeakage(monthly, 12, 10))}</td>
                      <td>
                        <button className="icon-btn" onClick={() => deleteExpense(expense.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="dashboard-panel">
          <div className="panel-head"><span>Monthly total split</span></div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={[{ name: 'Spend', essential: totals.essential, avoidable: totals.avoidable, impulse: totals.impulse }]}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" />
              <YAxis stroke="rgba(255,255,255,0.4)" />
              <Tooltip contentStyle={{ background: 'rgba(10,15,24,0.96)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16 }} />
              <Legend />
              <Bar dataKey="essential" stackId="a" fill="#7dff6c" radius={[10, 10, 0, 0]} />
              <Bar dataKey="avoidable" stackId="a" fill="#f2c66d" />
              <Bar dataKey="impulse" stackId="a" fill="#ff7f8a" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="dashboard-panel">
          <div className="panel-head"><span>Burn rate</span></div>
          <MetricRow
            items={[
              { label: 'Per day', value: formatCompactINR(totals.leakage / 30) },
              { label: 'Per hour', value: formatCompactINR(totals.leakage / 30 / 24) },
              { label: 'Per minute', value: formatCompactINR(totals.leakage / 30 / 24 / 60) },
            ]}
          />
        </Card>
      </div>
    </PageFrame>
  )
}

