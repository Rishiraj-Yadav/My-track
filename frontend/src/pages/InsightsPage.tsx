import { useMemo } from 'react'
import { PageFrame } from '../components'
import {
  calculateMonthlyTotals,
  detectPersonality,
  groupExpensesByCategory,
  monthlyEquivalent,
  formatINR,
  formatCompactINR,
  type Expense,
} from '../lib/finance'
import { useAppStore } from '../store'
import { UpgradeGate } from '../lib/subscription'

// ─── Helpers ──────────────────────────────────────────────────────
const subscriptionKeywords = ['netflix', 'spotify', 'hotstar', 'youtube', 'prime', 'disney', 'icloud', 'google', 'jio', 'ott', 'hbo', 'subscription']

const detectSubscriptions = (expenses: Expense[]) =>
  expenses
    .filter(e => !e.archived && subscriptionKeywords.some(kw => e.name.toLowerCase().includes(kw)))
    .map(e => ({ ...e, monthly: monthlyEquivalent(e.amount, e.frequency) }))

const generateTips = (expenses: Expense[], salary: number) => {
  const totals = calculateMonthlyTotals(expenses)
  const tips: { icon: string; title: string; body: string; impact: string }[] = []

  // Food delivery tip
  const food = expenses.filter(e => ['swiggy', 'zomato', 'food', 'dinner'].some(kw => e.name.toLowerCase().includes(kw)))
  const foodTotal = food.reduce((s, e) => s + monthlyEquivalent(e.amount, e.frequency), 0)
  if (foodTotal > salary * 0.05) {
    tips.push({
      icon: 'restaurant',
      title: 'Food delivery is eating your salary',
      body: `You spend ${formatINR(foodTotal)}/mo on food delivery — that's ${((foodTotal / salary) * 100).toFixed(1)}% of your salary. Try meal-prep Sundays to cut this by 40%.`,
      impact: `Save ${formatINR(foodTotal * 0.4)}/mo`,
    })
  }

  // Subscription overlap
  const subs = detectSubscriptions(expenses)
  const streamingCount = subs.filter(s => ['netflix', 'hotstar', 'prime', 'youtube', 'disney'].some(kw => s.name.toLowerCase().includes(kw))).length
  if (streamingCount >= 3) {
    const subTotal = subs.reduce((s, e) => s + e.monthly, 0)
    tips.push({
      icon: 'subscriptions',
      title: `${streamingCount} streaming subscriptions detected`,
      body: `You're paying for ${streamingCount} streaming services. Most people actively use only 1-2. Rotate them monthly instead of paying for all simultaneously.`,
      impact: `Save ${formatINR(subTotal * 0.5)}/mo`,
    })
  }

  // SIP ratio
  const sipRatio = totals.leakage > 0 ? totals.leakage / salary : 0
  if (sipRatio > 0.15) {
    tips.push({
      icon: 'trending_up',
      title: 'Leakage exceeds SIP potential',
      body: `Your avoidable + impulse spending is ${formatINR(totals.leakage)}/mo. Redirecting just 30% of this to SIP could compound to ${formatCompactINR(totals.leakage * 0.3 * 180)} over 15 years.`,
      impact: `+${formatINR(totals.leakage * 0.3)}/mo to SIP`,
    })
  }

  // Transport optimization
  const transport = expenses.filter(e => ['uber', 'ola', 'ride', 'cab'].some(kw => e.name.toLowerCase().includes(kw)))
  const transportTotal = transport.reduce((s, e) => s + monthlyEquivalent(e.amount, e.frequency), 0)
  if (transportTotal > 1500) {
    tips.push({
      icon: 'directions_bus',
      title: 'Cab rides add up quickly',
      body: `${formatINR(transportTotal)}/mo on ride-hailing. Consider a metro pass or bike for regular commutes, and reserve cabs for rain days and late nights.`,
      impact: `Save ${formatINR(transportTotal * 0.6)}/mo`,
    })
  }

  // Impulse spending pattern
  const impulseTotal = totals.impulse
  if (impulseTotal > salary * 0.04) {
    tips.push({
      icon: 'shopping_cart',
      title: 'Impulse buying pattern detected',
      body: `${formatINR(impulseTotal)}/mo in impulse purchases. Try the 48-hour rule — wait 2 days before any non-essential purchase over ₹500.`,
      impact: `Save ${formatINR(impulseTotal * 0.5)}/mo`,
    })
  }

  return tips
}

type HeatmapCell = { day: string; intensity: number; amount: number }

const buildSpendHeatmap = (expenses: Expense[]): HeatmapCell[] => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const totals = calculateMonthlyTotals(expenses)
  const dailyAvg = totals.total / 30

  return days.map((day, i) => {
    // Simulate realistic spending patterns
    const isWeekend = i >= 5
    const variance = isWeekend ? 1.4 + Math.random() * 0.3 : 0.7 + Math.random() * 0.4
    const amount = dailyAvg * variance
    const intensity = Math.min(1, amount / (dailyAvg * 2))
    return { day, intensity, amount: Math.round(amount) }
  })
}

// ─── Personality Archetypes ───────────────────────────────────────
const archetypeConfig: Record<string, { emoji: string; color: string; advice: string }> = {
  'SIP neglector': {
    emoji: '😴',
    color: 'text-tertiary',
    advice: 'Start with even ₹500/mo SIP. The habit matters more than the amount.',
  },
  'Impulse spender': {
    emoji: '🛒',
    color: 'text-tertiary',
    advice: 'Try the 48-hour rule: wait 2 days before any non-essential purchase.',
  },
  'Subscription hoarder': {
    emoji: '📺',
    color: 'text-secondary',
    advice: 'Rotate subscriptions monthly. You only need 1-2 active at a time.',
  },
  'Disciplined saver': {
    emoji: '🎯',
    color: 'text-primary',
    advice: 'You\'re doing great! Consider stepping up SIP by 10% annually.',
  },
  'Balanced planner': {
    emoji: '⚖️',
    color: 'text-secondary',
    advice: 'Good balance! Small tweaks to avoidable spending could accelerate goals.',
  },
}

// ─── Component ────────────────────────────────────────────────────
export function InsightsPage() {
  const { expenses, sip, profile } = useAppStore()
  const totals = useMemo(() => calculateMonthlyTotals(expenses), [expenses])
  const personality = useMemo(
    () =>
      detectPersonality({
        avoidableShare: totals.total > 0 ? totals.avoidable / totals.total : 0,
        sipAmount: sip.monthlyAmount,
        salary: profile.monthlySalary,
        goalCount: 6,
        subscriptions: detectSubscriptions(expenses).length,
      }),
    [expenses, sip, profile, totals],
  )
  const archetype = archetypeConfig[personality] ?? archetypeConfig['Balanced planner']
  const cats = useMemo(() => groupExpensesByCategory(expenses), [expenses])
  const subs = useMemo(() => detectSubscriptions(expenses), [expenses])
  const tips = useMemo(() => generateTips(expenses, profile.monthlySalary), [expenses, profile])
  const heatmap = useMemo(() => buildSpendHeatmap(expenses), [expenses])
  const subsTotal = subs.reduce((s, e) => s + e.monthly, 0)

  return (
    <PageFrame>
      <UpgradeGate feature="ai_insights">
        {/* Header */}
        <header className="mb-12">
          <p className="font-label text-xs font-bold text-secondary uppercase tracking-[0.25em] mb-3">AI Insights</p>
          <h1 className="font-headline text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight mb-4">
            Spending Intelligence
          </h1>
          <p className="font-body text-on-surface-variant text-lg max-w-2xl">
            AI-powered analysis of your financial patterns. Personalized recommendations to optimize your cash flow.
          </p>
        </header>

        {/* Row 1: Personality + Heatmap */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Spending Personality */}
          <div className="bg-surface-container-low rounded-2xl p-8 border border-outline-variant/15 shadow-[0_20px_40px_rgba(0,0,0,0.2)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-on-surface-variant">psychology</span>
                <h3 className="font-headline text-lg font-bold text-on-surface">Spending Personality</h3>
              </div>
              <div className="flex items-center gap-6 mb-6">
                <div className="text-6xl">{archetype.emoji}</div>
                <div>
                  <p className={`font-headline text-3xl font-extrabold ${archetype.color} tracking-tight`}>
                    {personality}
                  </p>
                  <p className="font-body text-sm text-on-surface-variant mt-1">Based on your expense patterns</p>
                </div>
              </div>
              <div className="bg-surface-container-lowest/50 rounded-xl p-5 border border-outline-variant/10">
                <p className="font-body text-sm text-on-surface leading-relaxed">
                  <span className="material-symbols-outlined text-sm text-secondary align-middle mr-1">lightbulb</span>
                  {archetype.advice}
                </p>
              </div>
            </div>
          </div>

          {/* Spending Heatmap */}
          <div className="bg-surface-container-low rounded-2xl p-8 border border-outline-variant/15 shadow-[0_20px_40px_rgba(0,0,0,0.2)]">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-on-surface-variant">calendar_month</span>
              <h3 className="font-headline text-lg font-bold text-on-surface">Weekly Spend Pattern</h3>
            </div>
            <div className="grid grid-cols-7 gap-3 mb-6">
              {heatmap.map(cell => (
                <div key={cell.day} className="flex flex-col items-center gap-2">
                  <div
                    className="w-full aspect-square rounded-lg transition-all duration-300 hover:scale-110 cursor-default flex items-center justify-center"
                    style={{
                      backgroundColor: `rgba(78, 222, 163, ${0.08 + cell.intensity * 0.6})`,
                      border: `1px solid rgba(78, 222, 163, ${cell.intensity * 0.3})`,
                    }}
                    title={`${cell.day}: ₹${cell.amount}`}
                  >
                    <span className="font-headline text-sm font-bold text-on-surface opacity-80">
                      {formatCompactINR(cell.amount)}
                    </span>
                  </div>
                  <span className="font-label text-[10px] text-on-surface-variant uppercase">{cell.day}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-xs text-on-surface-variant">
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-primary/10 border border-primary/20" /> Low spend
              </span>
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-primary/60 border border-primary/40" /> High spend
              </span>
            </div>
          </div>
        </div>

        {/* Row 2: Subscription Audit */}
        <div className="bg-surface-container-low rounded-2xl p-8 border border-outline-variant/15 shadow-[0_20px_40px_rgba(0,0,0,0.2)] mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary">subscriptions</span>
              <h3 className="font-headline text-lg font-bold text-on-surface">Subscription Audit</h3>
            </div>
            <div className="flex items-center gap-2 bg-tertiary/10 text-tertiary px-4 py-2 rounded-full">
              <span className="material-symbols-outlined text-sm">warning</span>
              <span className="font-label text-xs font-bold">{subs.length} active · {formatINR(subsTotal)}/mo</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {subs.map(sub => (
              <div
                key={sub.id}
                className="flex items-center justify-between bg-surface-container-lowest/50 rounded-xl p-4 border border-outline-variant/10 group hover:border-tertiary/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-surface-variant text-lg">play_circle</span>
                  </div>
                  <div>
                    <p className="font-headline text-sm font-bold text-on-surface">{sub.name}</p>
                    <p className="font-body text-xs text-on-surface-variant capitalize">{sub.frequency}</p>
                  </div>
                </div>
                <span className="font-headline text-base font-bold text-tertiary">{formatINR(sub.monthly)}</span>
              </div>
            ))}
          </div>

          {subs.length >= 3 && (
            <div className="bg-secondary/5 border border-secondary/15 rounded-xl p-5">
              <p className="font-body text-sm text-on-surface">
                <span className="font-bold text-secondary">💡 Rotate, don't stack:</span> Most people watch only 1 platform at a time. Cancel 2, save {formatINR(subsTotal * 0.5)}/mo → that's {formatINR(subsTotal * 0.5 * 12)}/year redirected to your goals.
              </p>
            </div>
          )}
        </div>

        {/* Row 3: Smart Tips */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-primary">auto_awesome</span>
            <h3 className="font-headline text-lg font-bold text-on-surface">Smart Recommendations</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tips.map((tip, i) => (
              <div
                key={i}
                className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/15 shadow-[0_15px_30px_rgba(0,0,0,0.15)] hover:border-primary/20 transition-all duration-300 group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <span className="material-symbols-outlined text-primary text-2xl">{tip.icon}</span>
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-headline text-base font-bold text-on-surface mb-2">{tip.title}</h4>
                    <p className="font-body text-sm text-on-surface-variant leading-relaxed mb-4">{tip.body}</p>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                      <span className="material-symbols-outlined text-sm">savings</span>
                      {tip.impact}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {tips.length === 0 && (
              <div className="col-span-2 text-center py-12">
                <span className="material-symbols-outlined text-5xl text-primary mb-4 block">verified</span>
                <p className="font-headline text-xl font-bold text-on-surface mb-2">You're doing great!</p>
                <p className="font-body text-sm text-on-surface-variant">No major spending issues detected. Keep it up.</p>
              </div>
            )}
          </div>
        </div>

        {/* Row 4: Category Deep Dive */}
        <div className="bg-surface-container-low rounded-2xl p-8 border border-outline-variant/15 shadow-[0_20px_40px_rgba(0,0,0,0.2)]">
          <div className="flex items-center gap-3 mb-8">
            <span className="material-symbols-outlined text-on-surface-variant">donut_large</span>
            <h3 className="font-headline text-lg font-bold text-on-surface">Category Deep Dive</h3>
          </div>
          <div className="space-y-4">
            {cats.map((cat, i) => {
              const colors = ['bg-primary', 'bg-secondary', 'bg-tertiary', 'bg-primary-fixed-dim', 'bg-secondary-fixed', 'bg-tertiary-fixed']
              return (
                <div key={cat.category} className="group">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-headline text-sm font-bold text-on-surface">{cat.category}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-headline text-sm font-bold text-on-surface">{formatINR(cat.amount)}</span>
                      <span className="font-body text-xs text-on-surface-variant">{cat.percentage}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-surface-container-highest rounded-full h-3 overflow-hidden">
                    <div
                      className={`${colors[i % colors.length]} h-full rounded-full transition-all duration-700 group-hover:opacity-80`}
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </UpgradeGate>
    </PageFrame>
  )
}
