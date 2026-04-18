import { useState, useMemo } from 'react'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from 'recharts'
import { PageFrame } from '../components'
import {
  calculateMonthlyTotals,
  formatCompactINR,
  formatINR,
} from '../lib/finance'
import { useAppStore } from '../store'

/* ─── Financial calculation helpers ─── */
function sipRequired(target: number, months: number, annualReturn: number, existing = 0) {
  const remaining = Math.max(target - existing, 0)
  const rate = annualReturn / 12 / 100
  if (rate === 0) return remaining / Math.max(months, 1)
  return (remaining * rate) / (Math.pow(1 + rate, months) - 1)
}

function buildGrowthTimeline(monthlySip: number, annualReturn: number, months: number, existing = 0) {
  const points: { month: number; label: string; corpus: number; principal: number }[] = []
  let corpus = existing
  let principal = existing
  const rate = annualReturn / 12 / 100

  for (let m = 1; m <= months; m++) {
    principal += monthlySip
    corpus = (corpus + monthlySip) * (1 + rate)
    if (m % Math.max(1, Math.floor(months / 5)) === 0 || m === months || m === 1) {
      const yrs = m / 12
      points.push({
        month: m,
        label: yrs >= 1 ? `Y${yrs.toFixed(0)}` : `${m}M`,
        corpus: Math.round(corpus),
        principal: Math.round(principal),
      })
    }
  }
  return points
}

export function GoalsPage() {
  const { expenses, profile } = useAppStore()
  const totals = calculateMonthlyTotals(expenses)

  /* Derived actual savings from user data */
  const actualMonthlySavings = Math.max(0, profile.monthlySalary - totals.total)

  /* ─── Form state ─── */
  const [goalAmount, setGoalAmount] = useState('2500000')
  const [goalYears, setGoalYears] = useState('15')
  const [expectedReturn, setExpectedReturn] = useState('8.5')
  const [currentSavings, setCurrentSavings] = useState(actualMonthlySavings.toString())

  /* ─── Core calculations ─── */
  const parsedGoal = Number(goalAmount.replace(/,/g, '')) || 0
  const parsedYears = Number(goalYears) || 0
  const parsedMonths = parsedYears * 12
  const parsedReturn = Number(expectedReturn) || 0
  const effectiveSavings = Number(currentSavings) || 0

  const requiredSip = useMemo(
    () => (parsedGoal > 0 && parsedMonths > 0 ? sipRequired(parsedGoal, parsedMonths, parsedReturn) : 0),
    [parsedGoal, parsedMonths, parsedReturn],
  )

  const gap = requiredSip - effectiveSavings
  const isShort = gap > 0

  /* ─── Timeline data ─── */
  const chartData = useMemo(() => {
    return parsedGoal > 0 && parsedMonths > 0
      ? buildGrowthTimeline(requiredSip, parsedReturn, Math.min(parsedMonths, 360))
      : []
  }, [parsedGoal, requiredSip, parsedReturn, parsedMonths])

  /* Extra insight: What if +3 years? */
  const sipIfPlus3Years = useMemo(() => {
    return parsedGoal > 0 && parsedMonths > 0
      ? sipRequired(parsedGoal, parsedMonths + 36, parsedReturn)
      : 0
  }, [parsedGoal, parsedMonths, parsedReturn])

  return (
    <PageFrame>
      <div className="mb-16 max-w-5xl">
        <h1 className="font-headline text-[3.5rem] font-bold text-on-surface leading-tight tracking-tight mb-4">
          Retirement Horizon
        </h1>
        <p className="font-body text-on-surface-variant text-lg max-w-2xl">
          Calibrate your monthly systematic investment plan to reach your target corpus.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 max-w-[1600px]">
        {/* Left Column: Inputs & Summary (40%) */}
        <div className="xl:col-span-5 flex flex-col gap-8">
          <div className="bg-surface-container-low rounded-[3rem] p-10 relative overflow-hidden border border-outline-variant/15 group">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-[80px] group-hover:bg-primary/20 transition-all duration-700"></div>
            <div className="relative z-10">
              <span className="font-body text-on-surface-variant text-sm uppercase tracking-widest font-medium block mb-2">Required Monthly SIP</span>
              <div className="flex items-baseline gap-2 mb-8">
                <span className="font-headline text-[3.5rem] font-extrabold text-primary tracking-tighter">
                  {formatINR(Math.round(requiredSip)).replace('₹', '$')}
                </span>
                <span className="font-body text-on-surface-variant text-lg">/mo</span>
              </div>
              <div className="space-y-6">
                <div className="relative border-b border-surface-variant pb-2 group/input">
                  <label className="font-body text-xs text-on-surface-variant uppercase tracking-wider block mb-1">Target Corpus</label>
                  <div className="flex items-center">
                    <span className="font-headline text-2xl text-on-surface mr-1">$</span>
                    <input
                      className="bg-transparent border-none text-2xl font-headline font-bold text-on-surface p-0 focus:ring-0 w-full"
                      type="text"
                      value={goalAmount}
                      onChange={(e) => setGoalAmount(e.target.value)}
                    />
                  </div>
                </div>

                <div className="relative border-b border-surface-variant pb-2 group/input">
                  <label className="font-body text-xs text-on-surface-variant uppercase tracking-wider block mb-1">Timeline (Years)</label>
                  <div className="flex items-center">
                    <input
                      className="bg-transparent border-none text-2xl font-headline font-bold text-on-surface p-0 focus:ring-0 w-full"
                      type="number"
                      value={goalYears}
                      onChange={(e) => setGoalYears(e.target.value)}
                    />
                  </div>
                </div>

                <div className="relative border-b border-surface-variant pb-2 group/input">
                  <label className="font-body text-xs text-on-surface-variant uppercase tracking-wider block mb-1">Expected Return</label>
                  <div className="flex items-center">
                    <input
                      className="bg-transparent border-none text-2xl font-headline font-bold text-on-surface p-0 focus:ring-0 w-full"
                      type="text"
                      value={expectedReturn}
                      onChange={(e) => setExpectedReturn(e.target.value)}
                    />
                    <span className="font-headline text-2xl text-on-surface-variant ml-1">%</span>
                  </div>
                </div>
                
                <div className="relative border-b border-surface-variant pb-2 group/input">
                  <label className="font-body text-xs text-on-surface-variant uppercase tracking-wider block mb-1">Current Savings Available (/mo)</label>
                  <div className="flex items-center">
                    <span className="font-headline text-2xl text-on-surface mr-1">$</span>
                    <input
                      className="bg-transparent border-none text-2xl font-headline font-bold text-on-surface p-0 focus:ring-0 w-full"
                      type="text"
                      value={currentSavings}
                      onChange={(e) => setCurrentSavings(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Visuals & Insights (60%) */}
        <div className="xl:col-span-7 flex flex-col gap-8">
          <div className="bg-surface-container-highest rounded-[3rem] p-10 border border-outline-variant/15 flex-grow min-h-[400px] flex flex-col">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="font-headline text-xl font-bold text-on-surface">Growth Trajectory</h3>
                <p className="font-body text-sm text-on-surface-variant mt-1">Projected value vs. invested capital</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <span className="font-body text-xs text-on-surface-variant">Projected Corpus</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-surface-variant"></div>
                  <span className="font-body text-xs text-on-surface-variant">Invested Principals</span>
                </div>
              </div>
            </div>

            <div className="flex-grow relative mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <defs>
                    <linearGradient id="corpusGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4edea3" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#4edea3" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="label" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
                  <YAxis
                    stroke="rgba(255,255,255,0.3)"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => formatCompactINR(v).replace('₹', '$')}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#121416', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    formatter={(value) => formatINR(Number(value)).replace('₹', '$')}
                  />
                  <ReferenceLine y={parsedGoal} stroke="#e9c349" strokeDasharray="6 4" label={{ value: 'Target', fill: '#e9c349', fontSize: 12, position: 'right' }} />
                  <Area type="monotone" dataKey="principal" stroke="#333537" fill="#333537" strokeWidth={2} name="Invested" dot={false} />
                  <Area type="monotone" dataKey="corpus" stroke="#4edea3" fill="url(#corpusGrad)" strokeWidth={3} name="Projected" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-surface-container-low rounded-[2rem] p-8 border border-outline-variant/15 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="material-symbols-outlined text-tertiary">{isShort ? 'trending_down' : 'trending_up'}</span>
                  <h4 className="font-headline text-lg font-bold text-on-surface">Current Gap</h4>
                </div>
                <p className="font-body text-sm text-on-surface-variant mb-6">
                  {isShort
                    ? `Based on your current $${effectiveSavings}/mo contribution, you will face a shortfall.`
                    : `Your current $${effectiveSavings}/mo covers the required SIP amount.`}
                </p>
              </div>
              {isShort && (
                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="font-body text-xs text-on-surface-variant uppercase tracking-wider">Monthly Shortfall</span>
                    <span className="font-headline text-2xl font-bold text-tertiary">-${Math.round(gap).toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-surface-variant h-2 rounded-full overflow-hidden">
                    <div className="bg-tertiary h-full" style={{ width: `${Math.min((gap / requiredSip) * 100, 100)}%` }}></div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-surface-container-low rounded-[2rem] p-8 border border-outline-variant/15 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="material-symbols-outlined text-secondary">lightbulb</span>
                  <h4 className="font-headline text-lg font-bold text-on-surface">Architect Suggestion</h4>
                </div>
                <p className="font-body text-sm text-on-surface-variant">Increasing your timeline by just 3 years reduces the required monthly SIP significantly.</p>
              </div>
              <div className="mt-6">
                <div className="flex items-center justify-between bg-surface-variant/50 p-4 rounded-xl">
                  <span className="font-body text-sm text-on-surface font-medium">+3 Years</span>
                  <span className="font-headline text-lg font-bold text-primary">
                    SIP drops to ${Math.round(sipIfPlus3Years).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageFrame>
  )
}