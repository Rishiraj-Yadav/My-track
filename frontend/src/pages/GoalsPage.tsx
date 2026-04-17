import { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Target,
  TrendingUp,
  AlertTriangle,
  Scissors,
  Clock,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  Zap,
  PiggyBank,
  Calendar,
  Wallet,
  BarChart3,
  ArrowUpRight,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ComposedChart,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { PageFrame, Pill, ProgressBar, Reveal } from '../components'
import {
  calculateMonthlyTotals,
  formatCompactINR,
  formatINR,
  futureValueMonthly,
  monthlyEquivalent,
} from '../lib/finance'
import { useAppStore } from '../store'
import '../goals.css'

/* ─── Constants ─── */
const tip = {
  background: 'rgba(10,15,24,0.96)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 14,
  color: '#fff',
  fontSize: '0.84rem',
}

const DEFAULT_ANNUAL_RETURN = 12

/* ─── Financial calculation helpers ─── */
function sipRequired(target: number, months: number, annualReturn: number, existing = 0) {
  const remaining = Math.max(target - existing, 0)
  const rate = annualReturn / 12 / 100
  if (rate === 0) return remaining / Math.max(months, 1)
  return (remaining * rate) / (Math.pow(1 + rate, months) - 1)
}

function monthsToReachGoal(target: number, monthlySip: number, annualReturn: number, existing = 0) {
  if (monthlySip <= 0) return Infinity
  const remaining = Math.max(target - existing, 0)
  if (remaining <= 0) return 0
  const rate = annualReturn / 12 / 100
  if (rate === 0) return Math.ceil(remaining / monthlySip)
  return Math.ceil(Math.log((monthlySip + remaining * rate) / monthlySip) / Math.log(1 + rate))
}

function buildGrowthTimeline(monthlySip: number, annualReturn: number, months: number, existing = 0) {
  const points: { month: number; label: string; corpus: number; principal: number }[] = []
  let corpus = existing
  let principal = existing
  const rate = annualReturn / 12 / 100

  for (let m = 1; m <= months; m++) {
    principal += monthlySip
    corpus = (corpus + monthlySip) * (1 + rate)
    if (m % Math.max(1, Math.floor(months / 24)) === 0 || m === months || m === 1) {
      const yrs = m / 12
      points.push({
        month: m,
        label: yrs >= 1 ? `${yrs.toFixed(1)}Y` : `${m}M`,
        corpus: Math.round(corpus),
        principal: Math.round(principal),
      })
    }
  }
  return points
}

function delayCostCalc(monthlySip: number, annualReturn: number, totalMonths: number, delayMonths: number) {
  const onTime = futureValueMonthly(monthlySip, annualReturn, totalMonths)
  const delayed = futureValueMonthly(monthlySip, annualReturn, Math.max(totalMonths - delayMonths, 0))
  return { onTime, delayed, cost: onTime - delayed }
}

/* ─── Step number indicator ─── */
function StepIndicator({ number, label, active }: { number: number; label: string; active: boolean }) {
  return (
    <motion.div
      className={`gp-step-indicator ${active ? 'is-active' : ''}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: number * 0.08 }}
    >
      <div className="gp-step-num">{number}</div>
      <span>{label}</span>
    </motion.div>
  )
}

/* ─── AI Typing Effect ─── */
function TypeWriter({ text, speed = 22 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState('')
  const idx = useRef(0)

  useEffect(() => {
    idx.current = 0
    setDisplayed('')
    const timer = setInterval(() => {
      idx.current++
      setDisplayed(text.slice(0, idx.current))
      if (idx.current >= text.length) clearInterval(timer)
    }, speed)
    return () => clearInterval(timer)
  }, [text, speed])

  return (
    <span>
      {displayed}
      {displayed.length < text.length && <span className="gp-cursor">|</span>}
    </span>
  )
}

/* ─── Main GoalsPage ─── */
export function GoalsPage() {
  const { expenses, profile, sip, goals, addGoal } = useAppStore()
  const totals = calculateMonthlyTotals(expenses)

  /* ─── Form state ─── */
  const [goalAmount, setGoalAmount] = useState('')
  const [goalMonths, setGoalMonths] = useState('')
  const [currentSavings, setCurrentSavings] = useState('')
  const [goalName, setGoalName] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [delayMonths, setDelayMonths] = useState(0)
  const [savedPlan, setSavedPlan] = useState(false)

  /* Derived actual savings from user data */
  const actualMonthlySavings = Math.max(0, profile.monthlySalary - totals.total)

  /* Use auto-filled savings from profile if user hasn't typed */
  const effectiveSavings = currentSavings ? Number(currentSavings) : actualMonthlySavings

  /* ─── Core calculations ─── */
  const parsedGoal = Number(goalAmount) || 0
  const parsedMonths = Number(goalMonths) || 0

  const requiredSip = useMemo(
    () => (parsedGoal > 0 && parsedMonths > 0 ? sipRequired(parsedGoal, parsedMonths, DEFAULT_ANNUAL_RETURN) : 0),
    [parsedGoal, parsedMonths],
  )

  const actualTimeMonths = useMemo(
    () =>
      parsedGoal > 0 && effectiveSavings > 0
        ? monthsToReachGoal(parsedGoal, effectiveSavings, DEFAULT_ANNUAL_RETURN)
        : Infinity,
    [parsedGoal, effectiveSavings],
  )

  const gap = Math.max(0, requiredSip - effectiveSavings)
  const isShort = gap > 0

  /* ─── Behavior impact: avoidable expenses ─── */
  const avoidableExpenses = useMemo(
    () =>
      expenses
        .filter((e) => !e.archived && e.tag !== 'essential')
        .map((e) => ({ name: e.name, monthly: monthlyEquivalent(e.amount, e.frequency), tag: e.tag }))
        .sort((a, b) => b.monthly - a.monthly)
        .slice(0, 5),
    [expenses],
  )

  const totalCuttable = avoidableExpenses.reduce((s, e) => s + e.monthly, 0)
  const newSavingsAfterCuts = effectiveSavings + totalCuttable
  const optimizedMonths = useMemo(
    () =>
      parsedGoal > 0 && newSavingsAfterCuts > 0
        ? monthsToReachGoal(parsedGoal, newSavingsAfterCuts, DEFAULT_ANNUAL_RETURN)
        : Infinity,
    [parsedGoal, newSavingsAfterCuts],
  )

  /* ─── Delay Impact ─── */
  const delay = useMemo(
    () => delayCostCalc(requiredSip || effectiveSavings, DEFAULT_ANNUAL_RETURN, parsedMonths || 60, delayMonths),
    [requiredSip, effectiveSavings, parsedMonths, delayMonths],
  )

  /* ─── Timeline data ─── */
  const currentTimeline = useMemo(
    () =>
      parsedGoal > 0 && effectiveSavings > 0
        ? buildGrowthTimeline(effectiveSavings, DEFAULT_ANNUAL_RETURN, Math.min(actualTimeMonths, 360))
        : [],
    [parsedGoal, effectiveSavings, actualTimeMonths],
  )

  const optimizedTimeline = useMemo(
    () =>
      parsedGoal > 0 && newSavingsAfterCuts > 0
        ? buildGrowthTimeline(newSavingsAfterCuts, DEFAULT_ANNUAL_RETURN, Math.min(optimizedMonths, 360))
        : [],
    [parsedGoal, newSavingsAfterCuts, optimizedMonths],
  )

  /* Merge timelines for chart */
  const chartData = useMemo(() => {
    const maxLen = Math.max(currentTimeline.length, optimizedTimeline.length)
    return Array.from({ length: maxLen }, (_, i) => ({
      label: currentTimeline[i]?.label || optimizedTimeline[i]?.label || '',
      current: currentTimeline[i]?.corpus || null,
      optimized: optimizedTimeline[i]?.corpus || null,
      goal: parsedGoal,
    }))
  }, [currentTimeline, optimizedTimeline, parsedGoal])

  /* ─── AI Insight ─── */
  const aiInsight = useMemo(() => {
    if (!showResults || parsedGoal <= 0) return ''
    if (isShort && gap > totalCuttable) {
      return `At your current pace, this goal will take significantly longer than planned. Consider increasing your income streams or adjusting the target timeline. Even small improvements compound dramatically — starting with ₹${Math.round(gap / 2).toLocaleString('en-IN')} more per month would cut years off your timeline.`
    }
    if (isShort) {
      return `You're close. Redirecting avoidable expenses worth ${formatINR(totalCuttable)} could close the gap entirely. Starting now is far more impactful than increasing the amount later — even a 3-month delay costs you ${formatINR(delayCostCalc(requiredSip, DEFAULT_ANNUAL_RETURN, parsedMonths, 3).cost)} in lost compounding.`
    }
    return `You're on track. At your current savings rate, you'll reach this goal ${actualTimeMonths < parsedMonths ? 'ahead of schedule' : 'right on time'}. Stay consistent — compounding rewards discipline more than perfection.`
  }, [showResults, parsedGoal, isShort, gap, totalCuttable, requiredSip, parsedMonths, actualTimeMonths])

  /* ─── Handle form submit ─── */
  const handleCalculate = () => {
    if (!goalAmount || !goalMonths) return
    setShowResults(true)
    setSavedPlan(false)
  }

  const handleSavePlan = () => {
    addGoal({
      id: crypto.randomUUID(),
      name: goalName || 'Financial Goal',
      targetAmount: parsedGoal,
      targetDate: new Date(Date.now() + parsedMonths * 30 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      priority: 2,
      savedAmount: 0,
    })
    setSavedPlan(true)
  }

  const delayedTimeShift = useMemo(() => {
    if (delayMonths === 0 || parsedMonths === 0) return 0
    const origMonths = monthsToReachGoal(parsedGoal, requiredSip || effectiveSavings, DEFAULT_ANNUAL_RETURN)
    const delayedMonths = monthsToReachGoal(parsedGoal, requiredSip || effectiveSavings, DEFAULT_ANNUAL_RETURN) + Math.round(delayMonths * 0.65)
    return delayedMonths - origMonths
  }, [delayMonths, parsedGoal, requiredSip, effectiveSavings, parsedMonths])

  const steps = [
    { num: 1, label: 'Set Goal' },
    { num: 2, label: 'Plan' },
    { num: 3, label: 'Gap' },
    { num: 4, label: 'Optimize' },
    { num: 5, label: 'Delay' },
    { num: 6, label: 'Timeline' },
    { num: 7, label: 'Insight' },
    { num: 8, label: 'Action' },
  ]

  return (
    <PageFrame>
      {/* ─── Hero ─── */}
      <section className="page-hero">
        <div>
          <Pill tone="teal">Goals</Pill>
          <h1>Plan Your Financial Goal</h1>
          <p>See how long it takes — and how your habits affect it</p>
        </div>
      </section>

      {/* ─── Step Progress ─── */}
      <div className="gp-step-bar">
        {steps.map((s) => (
          <StepIndicator
            key={s.num}
            number={s.num}
            label={s.label}
            active={showResults ? true : s.num === 1}
          />
        ))}
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* STEP 1: Goal Input Card                */}
      {/* ═══════════════════════════════════════ */}
      <Reveal>
        <div className="gp-input-card">
          <div className="gp-input-card__glow" />
          <div className="gp-input-header">
            <div className="gp-input-icon">
              <Target size={24} />
            </div>
            <div>
              <h2>What's your target?</h2>
              <p className="gp-muted">Enter your goal and we'll build your plan</p>
            </div>
          </div>

          <div className="gp-input-grid">
            <div className="gp-field">
              <label>
                <Wallet size={14} /> Goal Name (optional)
              </label>
              <input
                className="text-input"
                placeholder="e.g. Emergency Fund"
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
              />
            </div>
            <div className="gp-field">
              <label>
                <Target size={14} /> Goal Amount (₹)
              </label>
              <input
                className="text-input"
                type="number"
                placeholder="5,00,000"
                value={goalAmount}
                onChange={(e) => setGoalAmount(e.target.value)}
              />
            </div>
            <div className="gp-field">
              <label>
                <Calendar size={14} /> Timeframe (months)
              </label>
              <input
                className="text-input"
                type="number"
                placeholder="60"
                value={goalMonths}
                onChange={(e) => setGoalMonths(e.target.value)}
              />
            </div>
            <div className="gp-field">
              <label>
                <PiggyBank size={14} /> Monthly Savings (₹)
              </label>
              <input
                className="text-input"
                type="number"
                placeholder={actualMonthlySavings > 0 ? `Auto: ${formatINR(actualMonthlySavings)}` : '0'}
                value={currentSavings}
                onChange={(e) => setCurrentSavings(e.target.value)}
              />
              {actualMonthlySavings > 0 && !currentSavings && (
                <span className="gp-auto-tag">
                  <Zap size={11} /> Auto-filled from your profile
                </span>
              )}
            </div>
          </div>

          <button className="button button--primary gp-calc-btn" onClick={handleCalculate} disabled={!goalAmount || !goalMonths}>
            Generate My Plan <ArrowRight size={16} />
          </button>
        </div>
      </Reveal>

      {/* ═══════════════════════════════════════ */}
      {/* RESULTS: Steps 2-8                     */}
      {/* ═══════════════════════════════════════ */}
      <AnimatePresence>
        {showResults && parsedGoal > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="gp-results"
          >
            {/* ─── STEP 2: Plan Output ─── */}
            <Reveal delay={0.1}>
              <div className="gp-section-label">
                <TrendingUp size={18} />
                <span>Your Plan</span>
              </div>
              <div className="gp-metrics-row">
                <div className="gp-metric-card gp-metric-card--primary">
                  <span className="gp-metric-label">Required Monthly SIP</span>
                  <strong className="gp-metric-value">{formatINR(requiredSip)}</strong>
                  <span className="gp-metric-sub">at {DEFAULT_ANNUAL_RETURN}% annual returns</span>
                </div>
                <div className="gp-metric-card">
                  <span className="gp-metric-label">Time to Goal</span>
                  <strong className="gp-metric-value">
                    {actualTimeMonths < Infinity
                      ? actualTimeMonths >= 12
                        ? `${(actualTimeMonths / 12).toFixed(1)} years`
                        : `${actualTimeMonths} months`
                      : '—'}
                  </strong>
                  <span className="gp-metric-sub">at current savings rate</span>
                </div>
                <div className="gp-metric-card">
                  <span className="gp-metric-label">Target Amount</span>
                  <strong className="gp-metric-value">{formatCompactINR(parsedGoal)}</strong>
                  <span className="gp-metric-sub">
                    in {parsedMonths >= 12 ? `${(parsedMonths / 12).toFixed(1)} years` : `${parsedMonths} months`}
                  </span>
                </div>
              </div>
            </Reveal>

            {/* ─── STEP 3: Reality Check (Gap Analysis) ─── */}
            <Reveal delay={0.2}>
              <div className="gp-section-label">
                <AlertTriangle size={18} />
                <span>Reality Check</span>
              </div>
              <div className="gp-gap-card">
                <div className="gp-gap-header">
                  <h3>With your current habits…</h3>
                </div>
                <div className="gp-gap-compare">
                  <div className="gp-gap-item">
                    <span>You save</span>
                    <strong>{formatINR(effectiveSavings)}<small>/month</small></strong>
                  </div>
                  <div className="gp-gap-vs">VS</div>
                  <div className="gp-gap-item">
                    <span>Required</span>
                    <strong>{formatINR(requiredSip)}<small>/month</small></strong>
                  </div>
                </div>

                {isShort ? (
                  <div className="gp-gap-alert">
                    <AlertTriangle size={18} />
                    <div>
                      <strong>You are short by {formatINR(gap)}/month</strong>
                      <p>Close this gap to stay on track for your goal</p>
                    </div>
                  </div>
                ) : (
                  <div className="gp-gap-success">
                    <CheckCircle2 size={18} />
                    <div>
                      <strong>You're on track!</strong>
                      <p>Your savings exceed the required SIP amount</p>
                    </div>
                  </div>
                )}

                <div className="gp-gap-bar-wrap">
                  <div className="gp-gap-bar">
                    <motion.div
                      className="gp-gap-bar__fill gp-gap-bar__current"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((effectiveSavings / Math.max(requiredSip, 1)) * 100, 100)}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                  <div className="gp-gap-bar-labels">
                    <span>{formatCompactINR(effectiveSavings)}</span>
                    <span>{formatCompactINR(requiredSip)}</span>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* ─── STEP 4: Behavior Impact ─── */}
            {avoidableExpenses.length > 0 && (
              <Reveal delay={0.3}>
                <div className="gp-section-label">
                  <Scissors size={18} />
                  <span>Behavior Impact</span>
                </div>
                <div className="gp-behavior-card">
                  <h3>If you cut these expenses…</h3>
                  <div className="gp-expense-list">
                    {avoidableExpenses.map((e) => (
                      <div key={e.name} className="gp-expense-item">
                        <div className="gp-expense-dot" style={{ background: e.tag === 'impulse' ? '#ff7f8a' : '#f2c66d' }} />
                        <span className="gp-expense-name">{e.name}</span>
                        <strong className="gp-expense-amount">{formatINR(e.monthly)}</strong>
                      </div>
                    ))}
                  </div>
                  <div className="gp-behavior-result">
                    <div className="gp-behavior-metric">
                      <span>New savings</span>
                      <strong className="text-up">{formatINR(newSavingsAfterCuts)}/mo</strong>
                    </div>
                    <div className="gp-behavior-metric">
                      <span>New timeline</span>
                      <strong className="text-up">
                        {optimizedMonths < Infinity
                          ? optimizedMonths >= 12
                            ? `${(optimizedMonths / 12).toFixed(1)} years`
                            : `${optimizedMonths} months`
                          : '—'}
                      </strong>
                    </div>
                    {actualTimeMonths < Infinity && optimizedMonths < Infinity && (
                      <div className="gp-behavior-metric gp-behavior-metric--highlight">
                        <span>Time saved</span>
                        <strong className="text-up">
                          {((actualTimeMonths - optimizedMonths) / 12).toFixed(1)} years faster
                        </strong>
                      </div>
                    )}
                  </div>
                </div>
              </Reveal>
            )}

            {/* ─── STEP 5: Delay Impact ─── */}
            <Reveal delay={0.4}>
              <div className="gp-section-label">
                <Clock size={18} />
                <span>Delay Impact</span>
              </div>
              <div className="gp-delay-card">
                <h3>What if you start later?</h3>
                <div className="gp-delay-slider">
                  <label>
                    Start after <strong>{delayMonths} months</strong>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={24}
                    value={delayMonths}
                    onChange={(e) => setDelayMonths(Number(e.target.value))}
                  />
                  <div className="gp-delay-marks">
                    <span>Now</span>
                    <span>6mo</span>
                    <span>12mo</span>
                    <span>18mo</span>
                    <span>24mo</span>
                  </div>
                </div>
                {delayMonths > 0 && (
                  <motion.div
                    className="gp-delay-impact"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={delayMonths}
                  >
                    <div className="gp-delay-stat">
                      <span>Goal shifts by</span>
                      <strong className="text-warn">{delayedTimeShift} months</strong>
                    </div>
                    <div className="gp-delay-stat gp-delay-stat--danger">
                      <span>Cost of delay</span>
                      <strong className="text-red">{formatINR(delay.cost)}</strong>
                    </div>
                  </motion.div>
                )}
              </div>
            </Reveal>

            {/* ─── STEP 6: Timeline Graph ─── */}
            {chartData.length > 0 && (
              <Reveal delay={0.5}>
                <div className="gp-section-label">
                  <BarChart3 size={18} />
                  <span>Visual Timeline</span>
                </div>
                <div className="gp-timeline-card">
                  <div className="gp-timeline-header">
                    <h3>Growth Projection</h3>
                    <div className="gp-timeline-legend">
                      <span className="gp-legend-item"><i style={{ background: '#66b8ff' }} /> Current path</span>
                      <span className="gp-legend-item"><i style={{ background: '#35f0d2' }} /> Optimized path</span>
                      <span className="gp-legend-item"><i style={{ background: 'rgba(255,127,138,0.6)' }} /> Goal target</span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={320}>
                    <ComposedChart data={chartData}>
                      <defs>
                        <linearGradient id="gcurrent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#66b8ff" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#66b8ff" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="goptimized" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#35f0d2" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#35f0d2" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="label" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
                      <YAxis
                        stroke="rgba(255,255,255,0.3)"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v) => {
                          if (v >= 10000000) return `${(v / 10000000).toFixed(1)}Cr`
                          if (v >= 100000) return `${(v / 100000).toFixed(1)}L`
                          if (v >= 1000) return `${(v / 1000).toFixed(0)}K`
                          return v.toString()
                        }}
                      />
                      <Tooltip
                        contentStyle={tip}
                        formatter={(value) => (value != null ? formatINR(Number(value)) : '—')}
                      />
                      <ReferenceLine y={parsedGoal} stroke="rgba(255,127,138,0.6)" strokeDasharray="6 4" label={{ value: '🎯 Goal', fill: '#ff7f8a', fontSize: 12, position: 'right' }} />
                      <Area type="monotone" dataKey="current" stroke="#66b8ff" fill="url(#gcurrent)" strokeWidth={2.5} name="Current Path" dot={false} connectNulls />
                      <Area type="monotone" dataKey="optimized" stroke="#35f0d2" fill="url(#goptimized)" strokeWidth={2.5} name="Optimized Path" dot={false} connectNulls />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </Reveal>
            )}

            {/* ─── STEP 7: AI Insight ─── */}
            {aiInsight && (
              <Reveal delay={0.6}>
                <div className="gp-section-label">
                  <Sparkles size={18} />
                  <span>AI Insight</span>
                </div>
                <div className="gp-ai-card">
                  <div className="gp-ai-badge">
                    <Sparkles size={14} />
                    <span>Gemini Analysis</span>
                  </div>
                  <p className="gp-ai-text">
                    <TypeWriter text={aiInsight} />
                  </p>
                </div>
              </Reveal>
            )}

            {/* ─── STEP 8: Action Section ─── */}
            <Reveal delay={0.7}>
              <div className="gp-section-label">
                <Zap size={18} />
                <span>Take Action</span>
              </div>
              <div className="gp-action-card">
                <div className="gp-action-list">
                  <div className="gp-action-item gp-action-item--primary">
                    <CheckCircle2 size={20} />
                    <div>
                      <strong>Start SIP of {formatINR(requiredSip)}/month</strong>
                      <p>Begin investing today to reach your goal on time</p>
                    </div>
                    <ArrowUpRight size={18} />
                  </div>
                  {isShort && (
                    <div className="gp-action-item gp-action-item--warning">
                      <AlertTriangle size={20} />
                      <div>
                        <strong>Cut {formatINR(Math.min(gap, totalCuttable))} in avoidable expenses</strong>
                        <p>Redirect wasteful spending to close the savings gap</p>
                      </div>
                      <ArrowUpRight size={18} />
                    </div>
                  )}
                  <div
                    className={`gp-action-item gp-action-item--save ${savedPlan ? 'is-saved' : ''}`}
                    onClick={!savedPlan ? handleSavePlan : undefined}
                    style={{ cursor: savedPlan ? 'default' : 'pointer' }}
                  >
                    {savedPlan ? <CheckCircle2 size={20} /> : <PiggyBank size={20} />}
                    <div>
                      <strong>{savedPlan ? 'Plan Saved!' : 'Save this plan'}</strong>
                      <p>{savedPlan ? 'Goal added to your tracker' : 'Track progress from your dashboard'}</p>
                    </div>
                    {!savedPlan && <ArrowUpRight size={18} />}
                  </div>
                </div>
              </div>
            </Reveal>

            {/* ─── Existing Goals Preview ─── */}
            {goals.length > 0 && (
              <Reveal delay={0.8}>
                <div className="gp-section-label">
                  <Target size={18} />
                  <span>Your Goals ({goals.length})</span>
                </div>
                <div className="gp-goals-grid">
                  {goals.slice(0, 4).map((goal) => {
                    const pct = goal.targetAmount > 0 ? (goal.savedAmount / goal.targetAmount) * 100 : 0
                    return (
                      <div key={goal.id} className="gp-goal-mini">
                        <div className="gp-goal-mini__head">
                          <strong>{goal.name}</strong>
                          <Pill tone={goal.priority === 1 ? 'warning' : 'positive'}>P{goal.priority}</Pill>
                        </div>
                        <ProgressBar value={pct} tone="positive" />
                        <div className="gp-goal-mini__stats">
                          <span>{formatCompactINR(goal.savedAmount)} saved</span>
                          <span>{formatCompactINR(goal.targetAmount)} target</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Reveal>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </PageFrame>
  )
}