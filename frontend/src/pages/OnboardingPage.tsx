import { useState } from 'react'
import { Card, MetricRow, PageFrame, Pill } from '../components'
import { calculateMonthlyTotals, formatCompactINR } from '../lib/finance'
import { useAppStore } from '../store'

export function OnboardingPage() {
  const { profile, setProfile, expenses, addExpense, goals, addGoal, sip, setSip } = useAppStore()
  const [step, setStep] = useState(1)
  const [expense, setExpense] = useState({ name: '', amount: '', frequency: 'monthly', tag: 'avoidable' })
  const [goal, setGoal] = useState({ name: '', targetAmount: '', targetDate: '', priority: '2' })
  const [pin, setPin] = useState(profile.pin)

  return (
    <PageFrame>
      <section className="page-hero">
        <div>
          <Pill tone="teal">Onboarding</Pill>
          <h1>A fast setup that gets to the first insight immediately.</h1>
          <p>Profile, expenses, goals, and SIP. Then the app flashes the habit cost in a way that lands fast.</p>
        </div>
      </section>

      <div className="onboarding-grid">
        <Card className="dashboard-panel">
          <div className="stepper">
            <button className={`stepper__item ${step === 1 ? 'is-active' : ''}`} onClick={() => setStep(1)}>1</button>
            <button className={`stepper__item ${step === 2 ? 'is-active' : ''}`} onClick={() => setStep(2)}>2</button>
            <button className={`stepper__item ${step === 3 ? 'is-active' : ''}`} onClick={() => setStep(3)}>3</button>
            <button className={`stepper__item ${step === 4 ? 'is-active' : ''}`} onClick={() => setStep(4)}>4</button>
          </div>

          {step === 1 ? (
            <>
              <h3>Basic profile</h3>
              <div className="form-stack">
                <input className="text-input" value={profile.name} onChange={(event) => setProfile({ name: event.target.value })} />
                <input className="text-input" value={profile.monthlySalary} onChange={(event) => setProfile({ monthlySalary: Number(event.target.value) })} />
                <input className="text-input" value={profile.savings} onChange={(event) => setProfile({ savings: Number(event.target.value) })} />
                <input className="text-input" value={pin} onChange={(event) => setPin(event.target.value)} placeholder="4-digit PIN" />
              </div>
              <button className="button button--primary" onClick={() => { setProfile({ pin }); setStep(2) }}>Continue</button>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <h3>Expense capture</h3>
              <div className="form-stack">
                <input className="text-input" placeholder="Expense name" value={expense.name} onChange={(event) => setExpense({ ...expense, name: event.target.value })} />
                <input className="text-input" placeholder="Amount" value={expense.amount} onChange={(event) => setExpense({ ...expense, amount: event.target.value })} />
                <select className="text-input" value={expense.frequency} onChange={(event) => setExpense({ ...expense, frequency: event.target.value })}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                <select className="text-input" value={expense.tag} onChange={(event) => setExpense({ ...expense, tag: event.target.value })}>
                  <option value="essential">Essential</option>
                  <option value="avoidable">Avoidable</option>
                  <option value="impulse">Impulse</option>
                </select>
              </div>
              <button className="button button--primary" onClick={() => {
                if (!expense.name || !expense.amount) return
                addExpense({
                  id: crypto.randomUUID(),
                  name: expense.name,
                  amount: Number(expense.amount),
                  frequency: expense.frequency as 'daily' | 'weekly' | 'monthly',
                  tag: expense.tag as 'essential' | 'avoidable' | 'impulse',
                })
                setStep(3)
              }}>Save expense</button>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <h3>Goals</h3>
              <div className="form-stack">
                <input className="text-input" placeholder="Goal name" value={goal.name} onChange={(event) => setGoal({ ...goal, name: event.target.value })} />
                <input className="text-input" placeholder="Target amount" value={goal.targetAmount} onChange={(event) => setGoal({ ...goal, targetAmount: event.target.value })} />
                <input className="text-input" type="date" value={goal.targetDate} onChange={(event) => setGoal({ ...goal, targetDate: event.target.value })} />
              </div>
              <button className="button button--primary" onClick={() => {
                if (!goal.name || !goal.targetAmount || !goal.targetDate) return
                addGoal({
                  id: crypto.randomUUID(),
                  name: goal.name,
                  targetAmount: Number(goal.targetAmount),
                  targetDate: goal.targetDate,
                  priority: Number(goal.priority) as 1 | 2 | 3,
                  savedAmount: 0,
                })
                setStep(4)
              }}>Add goal</button>
            </>
          ) : null}

          {step === 4 ? (
            <>
              <h3>SIP setup and first insight</h3>
              <div className="form-stack">
                <input className="text-input" value={sip.monthlyAmount} onChange={(event) => setSip({ monthlyAmount: Number(event.target.value) })} />
                <input className="text-input" value={sip.annualReturn} onChange={(event) => setSip({ annualReturn: Number(event.target.value) })} />
              </div>
              <button className="button button--primary">Reveal insight</button>
            </>
          ) : null}
        </Card>

        <Card className="dashboard-panel dashboard-panel--wide">
          <div className="panel-head"><span>First insight reveal</span></div>
          <div className="ticker-figure">{formatCompactINR(calculateMonthlyTotals(expenses).leakage * 12 * 10)}</div>
          <p className="panel-copy">That is the estimated 10-year cost of the current avoidable behavior.</p>
          <MetricRow items={[
            { label: 'Profile', value: profile.name },
            { label: 'Expenses', value: String(expenses.length) },
            { label: 'Goals', value: String(goals.length) },
          ]} />
        </Card>
      </div>
    </PageFrame>
  )
}

