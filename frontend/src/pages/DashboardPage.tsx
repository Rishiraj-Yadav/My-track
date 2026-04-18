import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { PageFrame } from '../components'
import {
  buildSipGrowthSeries,
  calculateMonthlyTotals,
  calculateWhatIfImpact,
  formatCompactINR,
  formatINR,
  groupExpensesByCategory,
  healthScore,
  monthlyEquivalent,
} from '../lib/finance'
import { useAppStore } from '../store'
import { useI18n } from '../i18n'

export function DashboardPage() {
  const { copy } = useI18n()
  const { expenses, goals, sip, profile, whatIf } = useAppStore()
  const totals = calculateMonthlyTotals(expenses)
  const saveRate =
    profile.monthlySalary > 0
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
  const sipGrowth = buildSipGrowthSeries(impact.sipImpact, sip.annualReturn, sip.durationMonths)
  const cats = groupExpensesByCategory(expenses)

  const leaks = expenses
    .filter((e) => e.tag !== 'essential')
    .map((e) => ({ name: e.name, mo: monthlyEquivalent(e.amount, e.frequency), tag: e.tag }))
    .sort((a, b) => b.mo - a.mo)
    .slice(0, 5)

  const topCats = useMemo(() => {
    const totalCatAmount = cats.reduce((sum, c) => sum + c.amount, 0)
    const sorted = [...cats].sort((a, b) => b.amount - a.amount).slice(0, 3)
    const colors = ['bg-primary', 'bg-secondary', 'bg-tertiary']
    return sorted.map((c, i) => ({
      ...c,
      pct: totalCatAmount > 0 ? Math.round((c.amount / totalCatAmount) * 100) : 0,
      colorClass: colors[i % colors.length],
    }))
  }, [cats])

  return (
    <PageFrame>
      <header className="mb-16 flex flex-col md:flex-row justify-between items-baseline gap-6">
        <div>
          <h1 className="font-headline text-4xl md:text-[3.5rem] font-bold tracking-tight text-on-surface leading-tight">
            {(copy as any).dashboard?.title || 'Financial Overview'}
          </h1>
          <p className="text-on-surface-variant font-body text-base mt-2 max-w-lg">
            {(copy as any).dashboard?.subtitle || 'Your wealth architecture at a glance. Analyzing cash flow velocity and structural integrity.'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-outline uppercase tracking-widest mb-1">Monthly Salary</p>
            <div className="font-headline text-5xl md:text-6xl font-extrabold text-on-surface tracking-tighter group hover:text-primary transition-colors duration-500">
              {formatCompactINR(profile.monthlySalary)}
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 auto-rows-min">
        <div className="md:col-span-7 flex flex-col gap-6 md:gap-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
            <div className="bg-surface-container-low rounded-xl p-8 relative overflow-hidden group border border-outline-variant/15 shadow-[0_20px_40px_rgba(0,0,0,0.2)]">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-tertiary-fixed-dim/10 rounded-full blur-3xl group-hover:bg-tertiary-fixed-dim/20 transition-all duration-700"></div>
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                  <h3 className="font-headline text-lg font-bold text-on-surface">{(copy as any).dashboard?.totalSpending || 'Total Spending'}</h3>
                  <p className="text-sm text-on-surface-variant font-medium mt-1">{(copy as any).dashboard?.trailing30Days || 'Trailing 30 Days'}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-tertiary">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    credit_card
                  </span>
                </div>
              </div>
              <div className="relative z-10">
                <p className="font-headline text-[2.5rem] font-extrabold text-on-surface leading-none mb-2">
                  {formatCompactINR(totals.total)}
                </p>
              </div>
            </div>

            <div className="bg-surface-container-low rounded-xl p-8 relative overflow-hidden group border border-outline-variant/15 shadow-[0_20px_40px_rgba(0,0,0,0.2)]">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700"></div>
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                  <h3 className="font-headline text-lg font-bold text-on-surface">{(copy as any).dashboard?.savingsRate || 'Savings Rate'}</h3>
                  <p className="text-sm text-on-surface-variant font-medium mt-1">{(copy as any).dashboard?.monthlyVelocity || 'Monthly Velocity'}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    savings
                  </span>
                </div>
              </div>
              <div className="relative z-10">
                <p className="font-headline text-[2.5rem] font-extrabold text-on-surface leading-none mb-2">
                  {Math.round(saveRate)}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low rounded-xl p-8 border border-outline-variant/15 shadow-[0_20px_40px_rgba(0,0,0,0.2)] h-[440px] flex flex-col">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h3 className="font-headline text-xl font-bold text-on-surface mb-1">{(copy as any).dashboard?.sipGrowth || 'SIP Growth Trajectory'}</h3>
                <p className="text-sm text-on-surface-variant font-medium">
                  {(copy as any).dashboard?.sipDesc || 'Systematic Investment Portfolio Performance'}
                </p>
              </div>
              <div className="flex gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#66b8ff]"></div>
                  <span className="font-body text-xs text-on-surface-variant">Principal</span>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <div className="w-3 h-3 rounded-full bg-[#35f0d2]"></div>
                  <span className="font-body text-xs text-on-surface-variant">Returns</span>
                </div>
              </div>
            </div>

            <div className="relative flex-grow w-full">
              <ResponsiveContainer width="100%" height="100%">
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
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#121416',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => formatCompactINR(Number(value ?? 0))}
                  />
                  <Area type="monotone" dataKey="principal" stackId="1" stroke="#66b8ff" fill="url(#pg)" strokeWidth={2} name="You put in" />
                  <Area type="monotone" dataKey="returns" stackId="1" stroke="#35f0d2" fill="url(#rg)" strokeWidth={2} name="Market gives" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="md:col-span-5 flex flex-col gap-6 md:gap-8">
          <div className="bg-surface-container-highest rounded-xl p-8 relative overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.3)]">
            <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent"></div>
            <h3 className="font-headline text-lg font-bold text-on-surface mb-8">Architectural Score</h3>
            <div className="flex items-center gap-8">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" fill="none" r="45" stroke="#1a1c1e" strokeWidth="6"></circle>
                  <circle
                    className="drop-shadow-[0_0_10px_rgba(78,222,163,0.5)]"
                    cx="50"
                    cy="50"
                    fill="none"
                    r="45"
                    stroke="#4edea3"
                    strokeDasharray="283"
                    strokeDashoffset={283 - (283 * score) / 100}
                    strokeLinecap="round"
                    strokeWidth="6"
                  ></circle>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-headline text-4xl font-black text-on-surface">{score}</span>
                </div>
              </div>
              <div>
                <p className="text-lg font-bold text-primary mb-1">{(copy as any).dashboard?.healthRating || 'Health rating'}</p>
                <p className="text-sm text-on-surface-variant font-medium leading-relaxed">
                  {(copy as any).dashboard?.healthDesc || 'Based on your savings rate, leakage, and goal progress.'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low rounded-xl p-8 border border-outline-variant/15 shadow-[0_20px_40px_rgba(0,0,0,0.2)] flex-1">
            <h3 className="font-headline text-lg font-bold text-on-surface mb-6">{(copy as any).dashboard?.allocationArch || 'Allocation Architecture'}</h3>
            <div className="space-y-6">
              {topCats.map((c) => (
                <div key={c.category}>
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="flex items-center gap-2 text-on-surface">
                      <div className={`w-2 h-2 rounded-full ${c.colorClass}`}></div> {c.category}
                    </span>
                    <span className="text-on-surface">{c.pct}%</span>
                  </div>
                  <div className="w-full bg-surface-container-highest rounded-full h-2 overflow-hidden">
                    <div className={`${c.colorClass} h-full rounded-full`} style={{ width: `${c.pct}%` }}></div>
                  </div>
                </div>
              ))}
              {topCats.length === 0 ? (
                <p className="text-sm text-on-surface-variant">No expenses recorded yet.</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mt-6 md:mt-8">
        <div className="bg-surface-container-low rounded-xl p-8 border border-outline-variant/15 shadow-[0_20px_40px_rgba(0,0,0,0.2)] flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-headline text-lg font-bold text-on-surface">{(copy as any).dashboard?.leakageRadar || 'Leakage Radar'}</h3>
              <p className="text-sm text-on-surface-variant font-medium">{(copy as any).dashboard?.avoidableBleed || 'Identified inefficiencies'}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-tertiary-fixed-dim/10 flex items-center justify-center text-tertiary">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                warning
              </span>
            </div>
          </div>
          <div className="space-y-4 flex-grow overflow-y-auto max-h-64 pr-2">
            {leaks.map((l) => (
              <div key={l.name} className="flex items-center justify-between p-4 rounded-lg hover:bg-surface-container-highest transition-colors group cursor-pointer border border-transparent hover:border-outline-variant/15">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-outline group-hover:text-tertiary transition-colors">
                    <span className="material-symbols-outlined">payments</span>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-on-surface">{l.name}</p>
                    <p className="text-xs text-on-surface-variant">{l.tag} expense</p>
                  </div>
                </div>
                <p className="font-headline font-bold text-tertiary">-{formatINR(l.mo)}</p>
              </div>
            ))}
            {leaks.length === 0 ? (
              <p className="text-sm text-on-surface-variant">No leaks found. Great job!</p>
            ) : null}
          </div>
        </div>

        <div className="bg-surface-container-low rounded-xl p-8 border border-outline-variant/15 shadow-[0_20px_40px_rgba(0,0,0,0.2)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
          <h3 className="font-headline text-lg font-bold text-on-surface mb-8 relative z-10">{(copy as any).nav?.goals || 'Structural Goals'}</h3>
          <div className="relative z-10 space-y-8 flex-grow overflow-y-auto max-h-64 pr-2">
            {goals.map((g, i) => {
              const pct = (g.savedAmount / Math.max(g.targetAmount, 1)) * 100
              const progressColor = i % 2 === 0 ? 'secondary' : 'primary'
              return (
                <div key={g.id}>
                  <div className="flex justify-between items-end mb-3">
                    <div>
                      <p className="font-bold text-sm text-on-surface mb-1">{g.name}</p>
                      <p className={`font-headline text-2xl font-extrabold text-${progressColor}`}>
                        {formatINR(g.savedAmount)}
                      </p>
                    </div>
                    <span className={`text-sm font-bold text-${progressColor} bg-${progressColor}/10 px-3 py-1 rounded-full`}>
                      {Math.round(pct)}%
                    </span>
                  </div>
                  <div className="w-full bg-surface-container-highest rounded-full h-3 overflow-hidden border border-outline-variant/10">
                    <div
                      className={`bg-gradient-to-r from-${progressColor}-fixed-dim to-${progressColor} h-full rounded-full`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
            {goals.length === 0 ? (
              <p className="text-sm text-on-surface-variant">No goals established yet.</p>
            ) : null}
          </div>
        </div>
      </div>
    </PageFrame>
  )
}
