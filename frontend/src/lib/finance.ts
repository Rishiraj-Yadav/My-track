export type Frequency = 'daily' | 'weekly' | 'monthly'
export type ExpenseTag = 'essential' | 'avoidable' | 'impulse'

export type Expense = {
  id: string
  name: string
  amount: number
  frequency: Frequency
  tag: ExpenseTag
  archived?: boolean
}

export type Goal = {
  id: string
  name: string
  targetAmount: number
  targetDate: string
  priority: 1 | 2 | 3
  savedAmount: number
}

export type Profile = {
  name: string
  handle: string
  pin: string
  monthlySalary: number
  savings: number
}

export type SipPlan = {
  monthlyAmount: number
  annualReturn: number
  durationMonths: number
  delayMonths: number
}

export type Scenario = {
  id: string
  name: string
  monthlySip: number
  avoidableCut: number
  months: number
}

export type Badge = {
  id: string
  name: string
  unlocked: boolean
  hint: string
}

export const formatINR = (value: number, maximumFractionDigits = 0) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits,
  }).format(Number.isFinite(value) ? value : 0)

export const formatCompactINR = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number.isFinite(value) ? value : 0)

export const monthlyEquivalent = (amount: number, frequency: Frequency) => {
  if (frequency === 'daily') return amount * 30
  if (frequency === 'weekly') return amount * 4.345
  return amount
}

export const futureValueMonthly = (
  monthlyContribution: number,
  annualReturn: number,
  months: number,
) => {
  if (months <= 0 || monthlyContribution <= 0) return 0
  const rate = annualReturn / 12 / 100
  if (rate === 0) return monthlyContribution * months
  return monthlyContribution * (((1 + rate) ** months - 1) / rate)
}

export const futureValueWithDelay = (
  monthlyContribution: number,
  annualReturn: number,
  totalMonths: number,
  delayMonths: number,
) => {
  const investedMonths = Math.max(totalMonths - delayMonths, 0)
  const startingNow = futureValueMonthly(monthlyContribution, annualReturn, totalMonths)
  const startingLater = futureValueMonthly(
    monthlyContribution,
    annualReturn,
    investedMonths,
  )
  return {
    startingNow,
    startingLater,
    delayCost: startingNow - startingLater,
  }
}

export const calculateMonthlyTotals = (expenses: Expense[]) => {
  const active = expenses.filter((expense) => !expense.archived)
  const byTag = active.reduce(
    (acc, expense) => {
      const monthly = monthlyEquivalent(expense.amount, expense.frequency)
      acc.total += monthly
      acc[expense.tag] += monthly
      return acc
    },
    {
      total: 0,
      essential: 0,
      avoidable: 0,
      impulse: 0,
    },
  )

  return {
    ...byTag,
    leakage: byTag.avoidable + byTag.impulse,
    active,
  }
}

export const annualLeakage = (monthlyLeakage: number, annualReturn = 12, years = 10) =>
  futureValueMonthly(monthlyLeakage, annualReturn, years * 12)

export const healthScore = ({
  salary,
  leakage,
  sipAmount,
  goalsOnTrack,
  streak,
  subscriptions,
}: {
  salary: number
  leakage: number
  sipAmount: number
  goalsOnTrack: boolean
  streak: number
  subscriptions: number
}) => {
  if (salary <= 0) return 0
  const leakageRatio = leakage / salary
  const sipBonus = Math.min((sipAmount / salary) * 20, 16)
  const streakBonus = Math.min(streak / 4, 10)
  const goalBonus = goalsOnTrack ? 8 : 0
  const subscriptionPenalty = Math.min(subscriptions * 1.25, 12)
  const score =
    80 - leakageRatio * 110 + sipBonus + streakBonus + goalBonus - subscriptionPenalty
  return Math.max(0, Math.min(100, Math.round(score)))
}

export const scoreLabel = (score: number) => {
  if (score >= 85) return 'Excellent'
  if (score >= 70) return 'Healthy'
  if (score >= 55) return 'Watchful'
  if (score >= 35) return 'Leaking'
  return 'Critical'
}

export const detectPersonality = ({
  avoidableShare,
  sipAmount,
  salary,
  goalCount,
  subscriptions,
}: {
  avoidableShare: number
  sipAmount: number
  salary: number
  goalCount: number
  subscriptions: number
}) => {
  if (sipAmount <= 0) return 'SIP neglector'
  if (avoidableShare > 0.3) return 'Impulse spender'
  if (subscriptions > 5) return 'Subscription hoarder'
  if (goalCount > 0 && avoidableShare < 0.18 && sipAmount > salary * 0.08) {
    return 'Disciplined saver'
  }
  return 'Balanced planner'
}

export const parseWhatIfCommand = (
  command: string,
  expenses: Expense[],
  sipAmount: number,
) => {
  const text = command.trim().toLowerCase()
  if (!text) {
    return {
      label: 'Waiting for a command',
      monthlyImpact: 0,
      sipImpact: sipAmount,
    }
  }

  const stopMatch = text.match(/stop\s+(.+)/)
  if (stopMatch) {
    const term = stopMatch[1].replace(/[^\w\s]/g, '').trim()
    const matched = expenses.find((expense) =>
      expense.name.toLowerCase().includes(term),
    )
    const monthlyImpact = matched
      ? monthlyEquivalent(matched.amount, matched.frequency)
      : 0
    return {
      label: matched
        ? `Stopping ${matched.name} could free up ${formatINR(monthlyImpact)} each month`
        : 'No matching expense found yet',
      monthlyImpact,
      sipImpact: sipAmount + monthlyImpact,
    }
  }

  const sipMatch = text.match(/(?:add|start|increase)\s*(?:sip|sip by)?\s*₹?\s*([\d,]+)/)
  if (sipMatch) {
    const value = Number(sipMatch[1].replace(/,/g, ''))
    return {
      label: `That adds ${formatINR(value)} to monthly SIPs`,
      monthlyImpact: value,
      sipImpact: sipAmount + value,
    }
  }

  const cutMatch = text.match(/cut\s*₹?\s*([\d,]+)/)
  if (cutMatch) {
    const value = Number(cutMatch[1].replace(/,/g, ''))
    return {
      label: `You'd redirect ${formatINR(value)} a month`,
      monthlyImpact: value,
      sipImpact: sipAmount + value,
    }
  }

  const delayMatch = text.match(/delay\s+sip\s+(\d+)/)
  if (delayMatch) {
    const months = Number(delayMatch[1])
    return {
      label: `Delaying SIPs by ${months} months hurts compounding immediately`,
      monthlyImpact: 0,
      sipImpact: sipAmount,
      delayMonths: months,
    }
  }

  return {
    label: 'Try "stop Swiggy" or "add ₹2000 SIP"',
    monthlyImpact: 0,
    sipImpact: sipAmount,
  }
}

export const monthlySavingsRequired = (targetAmount: number, targetDate: string, saved = 0) => {
  const end = new Date(targetDate)
  const now = new Date()
  const months =
    Math.max(1, (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth()))
  return Math.max(0, (targetAmount - saved) / months)
}

export const percentage = (part: number, total: number) =>
  total > 0 ? Math.max(0, Math.min(100, (part / total) * 100)) : 0

// Category grouping for horizontal bar chart
const categoryKeywords: [string, string[]][] = [
  ['Food & Delivery', ['swiggy', 'zomato', 'food', 'dinner', 'lunch', 'breakfast', 'cafe', 'coffee']],
  ['Subscriptions', ['netflix', 'ott', 'spotify', 'prime', 'hotstar', 'youtube', 'subscription']],
  ['Transport', ['metro', 'uber', 'ola', 'commute', 'fuel', 'petrol', 'bus', 'train']],
  ['Digital & Cloud', ['cloud', 'storage', 'icloud', 'google', 'drive', 'hosting', 'domain']],
  ['Fitness & Health', ['gym', 'fitness', 'health', 'yoga', 'supplement']],
  ['Shopping', ['amazon', 'flipkart', 'shopping', 'clothes', 'gadget']],
]

export type CategoryBreakdown = {
  category: string
  amount: number
  percentage: number
  tag: ExpenseTag
}

export const groupExpensesByCategory = (expenses: Expense[]): CategoryBreakdown[] => {
  const active = expenses.filter((e) => !e.archived)
  const groups: Record<string, { amount: number; tag: ExpenseTag }> = {}

  for (const expense of active) {
    const monthly = monthlyEquivalent(expense.amount, expense.frequency)
    const lowerName = expense.name.toLowerCase()
    let matched = false
    for (const [category, keywords] of categoryKeywords) {
      if (keywords.some((kw) => lowerName.includes(kw))) {
        if (!groups[category]) groups[category] = { amount: 0, tag: expense.tag }
        groups[category].amount += monthly
        matched = true
        break
      }
    }
    if (!matched) {
      const cat = 'Other'
      if (!groups[cat]) groups[cat] = { amount: 0, tag: expense.tag }
      groups[cat].amount += monthly
    }
  }

  const total = Object.values(groups).reduce((s, g) => s + g.amount, 0)
  return Object.entries(groups)
    .map(([category, data]) => ({
      category,
      amount: Math.round(data.amount),
      percentage: total > 0 ? Math.round((data.amount / total) * 100) : 0,
      tag: data.tag,
    }))
    .sort((a, b) => b.amount - a.amount)
}

// Generate realistic 6-month trend data from current state
export type MonthlyTrendPoint = {
  month: string
  income: number
  spend: number
  savings: number
  leakage: number
}

export const generateMonthlyTrend = (
  salary: number,
  totalSpend: number,
  leakage: number,
): MonthlyTrendPoint[] => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
  const now = new Date()
  const currentMonthIndex = now.getMonth()

  return months.map((_, i) => {
    const monthIdx = (currentMonthIndex - 5 + i + 12) % 12
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const variance = 1 + Math.sin(i * 1.2) * 0.08 + (i - 3) * 0.015
    const spendVariance = 1 + Math.cos(i * 0.9) * 0.12 - i * 0.02
    const currentSpend = totalSpend * spendVariance
    const currentLeakage = leakage * (spendVariance + 0.04)
    return {
      month: monthNames[monthIdx],
      income: Math.round(salary * variance),
      spend: Math.round(currentSpend),
      savings: Math.round(salary * variance - currentSpend),
      leakage: Math.round(currentLeakage),
    }
  })
}

// SIP growth series for stacked area chart (principal vs returns)
export type SipGrowthPoint = {
  year: string
  principal: number
  returns: number
  total: number
}

export const buildSipGrowthSeries = (
  monthlyAmount: number,
  annualReturn: number,
  durationMonths: number,
): SipGrowthPoint[] => {
  const years = Math.ceil(durationMonths / 12)
  return Array.from({ length: years }, (_, i) => {
    const months = (i + 1) * 12
    const principal = monthlyAmount * months
    const total = futureValueMonthly(monthlyAmount, annualReturn, months)
    return {
      year: `${i + 1}Y`,
      principal: Math.round(principal),
      returns: Math.round(total - principal),
      total: Math.round(total),
    }
  })
}

// What-if impact calculator — returns deltas for dashboard panels
export type WhatIfImpact = {
  label: string
  monthlySavingsChange: number
  healthScoreBefore: number
  healthScoreAfter: number
  corpusBefore: number
  corpusAfter: number
  sipImpact: number
}

export const calculateWhatIfImpact = (
  command: string,
  expenses: Expense[],
  sip: { monthlyAmount: number; annualReturn: number; durationMonths: number },
  profile: { monthlySalary: number },
  goals: { savedAmount: number; targetAmount: number }[],
): WhatIfImpact => {
  const parsed = parseWhatIfCommand(command, expenses, sip.monthlyAmount)
  const totals = calculateMonthlyTotals(expenses)
  const subsCount = expenses.filter((e) => e.name.toLowerCase().includes('ott')).length
  const goalsOnTrack = goals.some((g) => g.savedAmount >= g.targetAmount * 0.35)

  const scoreBefore = healthScore({
    salary: profile.monthlySalary,
    leakage: totals.leakage,
    sipAmount: sip.monthlyAmount,
    goalsOnTrack,
    streak: 12,
    subscriptions: subsCount,
  })

  const newLeakage = Math.max(0, totals.leakage - parsed.monthlyImpact)
  const scoreAfter = healthScore({
    salary: profile.monthlySalary,
    leakage: newLeakage,
    sipAmount: parsed.sipImpact,
    goalsOnTrack,
    streak: 12,
    subscriptions: subsCount,
  })

  const corpusBefore = futureValueMonthly(sip.monthlyAmount, sip.annualReturn, sip.durationMonths)
  const corpusAfter = futureValueMonthly(parsed.sipImpact, sip.annualReturn, sip.durationMonths)

  return {
    label: parsed.label,
    monthlySavingsChange: parsed.monthlyImpact,
    healthScoreBefore: scoreBefore,
    healthScoreAfter: scoreAfter,
    corpusBefore,
    corpusAfter,
    sipImpact: parsed.sipImpact,
  }
}

export type SimPlan = {
  monthlyAmount: number
  annualReturn: number
  durationMonths: number
  delayMonths: number
  inflationRate?: number
  stepUpRate?: number
  initialCorpus?: number
}

export type TimelineEvent = {
  id?: string
  month?: number
  atMonth?: number
  amount?: number
  type?: string
  rate?: number
  durationMonths?: number
  label?: string
}

export type MonthPoint = {
  month: number
  corpus: number
  principal: number
  realCorpus: number
  interest: number
}

export type MonteCarloBand = {
  p10: number
  p50: number
  p90: number
}

export type ParsedVerb = 'stop' | 'add' | 'cut' | 'delay' | 'unknown' | 'step_up' | 'pause' | 'lump_sum' | 'withdraw' | 'redirect'

export type ParsedOp = {
  verb: ParsedVerb
  target?: string
  amount?: number
  originalText?: string
  confidence?: number
  durationMonths?: number
  atMonth?: number
  delayMonths?: number
  stepUpRate?: number
  eventAmount?: number
  inheritedVerb?: ParsedVerb | null
  label?: string
}

export type MultiOpResult = {
  ops: ParsedOp[]
  newEvents?: TimelineEvent[]
  planUpdates?: Partial<SimPlan>
  message: string
  primaryVerb?: ParsedVerb | null
  isAmbiguous?: boolean
  alternatives?: string[]
}

export const projectTimeline = (plan: SimPlan): MonthPoint[] => {
  const points: MonthPoint[] = []
  let corpus = plan.initialCorpus || 0
  let principal = plan.initialCorpus || 0
  let currentSip = plan.monthlyAmount
  const currentDelay = plan.delayMonths || 0

  const monthlyRate = plan.annualReturn / 12 / 100
  const inflationRate = (plan.inflationRate ?? 6) / 12 / 100

  for (let m = 1; m <= plan.durationMonths; m++) {
    const isInvesting = m > currentDelay

    if (isInvesting) {
      principal += currentSip
      corpus += currentSip
    }

    corpus = corpus * (1 + monthlyRate)

    if (isInvesting && m % 12 === 0 && plan.stepUpRate) {
      currentSip = currentSip * (1 + plan.stepUpRate / 100)
    }

    const realCorpus = corpus / Math.pow(1 + inflationRate, m)

    points.push({ month: m, corpus, principal, realCorpus, interest: corpus - principal })
  }

  return points
}

export const projectWithEvents = (plan: SimPlan, events: TimelineEvent[]): MonthPoint[] => {
  const points: MonthPoint[] = []
  let corpus = plan.initialCorpus || 0
  let principal = plan.initialCorpus || 0
  let currentSip = plan.monthlyAmount
  const currentDelay = plan.delayMonths || 0

  const monthlyRate = plan.annualReturn / 12 / 100
  const inflationRate = (plan.inflationRate ?? 6) / 12 / 100

  for (let m = 1; m <= plan.durationMonths; m++) {
    const isInvesting = m > currentDelay

    if (isInvesting) {
      principal += currentSip
      corpus += currentSip
    }

    const monthEvents = events.filter(e => (e.month ?? e.atMonth) === m)
    for (const e of monthEvents) {
      const eAmt = e.amount || 0;
      corpus += eAmt
      if (eAmt > 0) principal += eAmt
    }

    corpus = corpus * (1 + monthlyRate)

    if (isInvesting && m % 12 === 0 && plan.stepUpRate) {
      currentSip = currentSip * (1 + plan.stepUpRate / 100)
    }

    const realCorpus = corpus / Math.pow(1 + inflationRate, m)

    points.push({ month: m, corpus, principal, realCorpus, interest: corpus - principal })
  }

  return points
}

export const monteCarlo = (plan: SimPlan, options: { runs: number }, events: TimelineEvent[] = []): MonteCarloBand[] => {
  const results: number[][] = Array.from({ length: plan.durationMonths }, () => [])
  const meanAnnual = plan.annualReturn / 100
  const volatility = 0.15 

  for (let r = 0; r < options.runs; r++) {
    let corpus = plan.initialCorpus || 0
    let currentSip = plan.monthlyAmount
    const currentDelay = plan.delayMonths || 0

    for (let m = 1; m <= plan.durationMonths; m++) {
      const isInvesting = m > currentDelay

      if (isInvesting) corpus += currentSip

      const monthEvents = events.filter(e => (e.month ?? e.atMonth) === m)
      for (const e of monthEvents) corpus += (e.amount || 0)

      const u1 = Math.max(Math.random(), Number.EPSILON)
      const u2 = Math.random()
      const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2)
      
      const monthlyReturn = (meanAnnual / 12) + (volatility / Math.sqrt(12)) * z0
      corpus = corpus * (1 + monthlyReturn)

      if (isInvesting && m % 12 === 0 && plan.stepUpRate) currentSip = currentSip * (1 + plan.stepUpRate / 100)

      results[m - 1].push(corpus)
    }
  }

  return results.map(monthResults => {
    monthResults.sort((a, b) => a - b)
    return {
      p10: monthResults[Math.floor(monthResults.length * 0.1)] || 0,
      p50: monthResults[Math.floor(monthResults.length * 0.5)] || 0,
      p90: monthResults[Math.floor(monthResults.length * 0.9)] || 0,
    }
  })
}

export const goalETA = (
  goal: Goal,
  plan: SimPlan
): {
  onTrack: boolean;
  monthsToReach: number | null;
  requiredMonthlySIP: number;
  shortfall: number;
} => {
  const targetDate = new Date(goal.targetDate);
  const now = new Date();
  const monthsRemaining = Math.max(1, (targetDate.getFullYear() - now.getFullYear()) * 12 + targetDate.getMonth() - now.getMonth());

  const timeline = projectTimeline(plan);
  const targetAmount = goal.targetAmount;
  const found = timeline.find(p => p.corpus >= targetAmount);
  const monthsToReach = found ? found.month : null;

  const rate = plan.annualReturn / 12 / 100;
  const fv = targetAmount;
  let requiredMonthlySIP = fv * rate / (Math.pow(1 + rate, monthsRemaining) - 1);
  if (rate === 0) requiredMonthlySIP = fv / monthsRemaining;

  const onTrack = monthsToReach !== null && monthsToReach <= monthsRemaining;
  const shortfall = Math.max(0, requiredMonthlySIP - plan.monthlyAmount);

  return {
    onTrack,
    monthsToReach,
    requiredMonthlySIP,
    shortfall,
  };
}

export const parseMultiOp = (command: string, expenses: Expense[], sipAmount: number, ctx?: any): MultiOpResult => {
  return {
    ops: [{ verb: 'unknown', originalText: command, confidence: 0 }],
    message: 'Parsed command placeholder.',
    primaryVerb: 'unknown',
  }
}

export const buildCommandSuggestions = (expenses: Expense[]): string[] => {
  return [
    'Add ₹5000 to monthly SIP',
    'Increase SIP by 10%',
    'Delay SIPs by 3 months',
    ...(expenses || []).slice(0, 2).map(e => `Stop ${e.name}`),
  ]
}
