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

export type MonthPoint = {
  month: number
  corpus: number
  principal: number
  interest: number
  realCorpus: number
}

export type TimelineEvent =
  | {
      atMonth: number
      type: 'pause'
      durationMonths: number
    }
  | {
      atMonth: number
      type: 'topup' | 'lumpSum' | 'withdraw'
      amount: number
    }
  | {
      atMonth: number
      type: 'stepUp'
      rate: number
    }

export type SimPlan = {
  monthlyAmount: number
  annualReturn: number
  durationMonths: number
  delayMonths?: number
  inflationRate?: number
  stepUpRate?: number
  initialCorpus?: number
}

export type MonteCarloBand = {
  month: number
  p10: number
  p50: number
  p90: number
}

export type ScenarioDiff = {
  month: number
  delta: number
  deltaPercent: number
}

export type GoalETA = {
  monthsToReach: number | null
  onTrack: boolean
  shortfall: number
  requiredMonthlySIP: number
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

const clampMonthNumber = (month: number) => Math.max(1, Math.round(month))

const investedMonthNumber = (month: number, delayMonths: number) => month - delayMonths

const investedYearIndex = (month: number, delayMonths: number) => {
  const investedMonth = investedMonthNumber(month, delayMonths)
  return investedMonth > 0 ? Math.floor((investedMonth - 1) / 12) : 0
}

const annualStepUpMultiplier = (month: number, delayMonths: number, stepUpRate: number) => {
  if (investedMonthNumber(month, delayMonths) <= 0) {
    return 0
  }

  return (1 + stepUpRate / 100) ** investedYearIndex(month, delayMonths)
}

const buildEventMap = (events: TimelineEvent[]) => {
  const eventMap = new Map<number, TimelineEvent[]>()

  for (const event of events) {
    const month = clampMonthNumber(event.atMonth)
    if (!eventMap.has(month)) {
      eventMap.set(month, [])
    }
    eventMap.get(month)!.push({ ...event, atMonth: month })
  }

  return eventMap
}

const finalCorpus = (timeline: MonthPoint[], fallback = 0) =>
  timeline.at(-1)?.corpus ?? fallback

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
  const startingNow = finalCorpus(
    projectTimeline({
      monthlyAmount: monthlyContribution,
      annualReturn,
      durationMonths: totalMonths,
      delayMonths: 0,
    }),
  )
  const startingLater = finalCorpus(
    projectTimeline({
      monthlyAmount: monthlyContribution,
      annualReturn,
      durationMonths: totalMonths,
      delayMonths,
    }),
  )

  return {
    startingNow,
    startingLater,
    delayCost: startingNow - startingLater,
  }
}

const projectCore = (plan: SimPlan, events: TimelineEvent[] = []): MonthPoint[] => {
  const {
    monthlyAmount,
    annualReturn,
    durationMonths,
    delayMonths = 0,
    inflationRate = 6,
    stepUpRate = 0,
    initialCorpus = 0,
  } = plan

  const monthlyRate = annualReturn / 12 / 100
  const monthlyInflation = inflationRate / 12 / 100
  const eventMap = buildEventMap(events)

  let corpus = initialCorpus
  let totalPrincipal = initialCorpus
  let pauseUntilMonth = 0
  let scheduledStepUpMultiplier = 1
  const points: MonthPoint[] = []

  for (let month = 1; month <= durationMonths; month++) {
    const monthEvents = eventMap.get(month) ?? []

    for (const event of monthEvents) {
      if (event.type === 'pause') {
        pauseUntilMonth = Math.max(
          pauseUntilMonth,
          event.atMonth + Math.max(0, event.durationMonths) - 1,
        )
        continue
      }

      if (event.type === 'stepUp') {
        scheduledStepUpMultiplier *= 1 + event.rate / 100
        continue
      }

      if (event.type === 'withdraw') {
        corpus = Math.max(0, corpus - event.amount)
        continue
      }

      corpus += event.amount
      totalPrincipal += event.amount
    }

    const recurringSip =
      investedMonthNumber(month, delayMonths) > 0 && month > pauseUntilMonth
        ? monthlyAmount *
          annualStepUpMultiplier(month, delayMonths, stepUpRate) *
          scheduledStepUpMultiplier
        : 0

    corpus = corpus * (1 + monthlyRate) + recurringSip
    totalPrincipal += recurringSip

    // Real corpus is expressed in today's rupees from the scenario start month.
    const realCorpus = corpus / (1 + monthlyInflation) ** month

    points.push({
      month,
      corpus,
      principal: totalPrincipal,
      interest: corpus - totalPrincipal,
      realCorpus,
    })
  }

  return points
}

export const projectTimeline = (plan: SimPlan): MonthPoint[] => projectCore(plan)

export const projectWithEvents = (plan: SimPlan, events: TimelineEvent[]): MonthPoint[] =>
  projectCore(plan, events)

export const inflationAdjust = (
  series: MonthPoint[],
  annualInflationRate: number,
): MonthPoint[] => {
  const monthlyRate = annualInflationRate / 12 / 100
  return series.map((point) => ({
    ...point,
    corpus: point.corpus / (1 + monthlyRate) ** point.month,
    interest: point.interest / (1 + monthlyRate) ** point.month,
    realCorpus: point.realCorpus,
  }))
}

export const monteCarlo = (
  plan: SimPlan,
  { mean = 12, stdDev = 18, runs = 500 }: { mean?: number; stdDev?: number; runs?: number } = {},
  events: TimelineEvent[] = [],
): MonteCarloBand[] => {
  const {
    monthlyAmount,
    durationMonths,
    delayMonths = 0,
    initialCorpus = 0,
    stepUpRate = 0,
  } = plan
  const monthlyMean = mean / 12 / 100
  const monthlyStdDev = stdDev / 12 / 100
  const eventMap = buildEventMap(events)

  const randn = () => {
    const u = 1 - Math.random()
    const v = Math.random()
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  }

  const allRuns: number[][] = Array.from({ length: runs }, () => {
    let corpus = initialCorpus
    let pauseUntilMonth = 0
    let scheduledStepUpMultiplier = 1

    return Array.from({ length: durationMonths }, (_, index) => {
      const month = index + 1
      const monthEvents = eventMap.get(month) ?? []

      for (const event of monthEvents) {
        if (event.type === 'pause') {
          pauseUntilMonth = Math.max(
            pauseUntilMonth,
            event.atMonth + Math.max(0, event.durationMonths) - 1,
          )
          continue
        }

        if (event.type === 'stepUp') {
          scheduledStepUpMultiplier *= 1 + event.rate / 100
          continue
        }

        if (event.type === 'withdraw') {
          corpus = Math.max(0, corpus - event.amount)
          continue
        }

        corpus += event.amount
      }

      const recurringSip =
        investedMonthNumber(month, delayMonths) > 0 && month > pauseUntilMonth
          ? monthlyAmount *
            annualStepUpMultiplier(month, delayMonths, stepUpRate) *
            scheduledStepUpMultiplier
          : 0
      const monthlyReturn = monthlyMean + monthlyStdDev * randn()
      corpus = corpus * (1 + monthlyReturn) + recurringSip
      return Math.max(0, corpus)
    })
  })

  return Array.from({ length: durationMonths }, (_, index) => {
    const values = allRuns.map((run) => run[index]).sort((a, b) => a - b)
    const percentile = (pct: number) =>
      values[Math.floor((pct / 100) * (values.length - 1))]
    return {
      month: index + 1,
      p10: percentile(10),
      p50: percentile(50),
      p90: percentile(90),
    }
  })
}

export const solveForMonthlySIP = (
  targetCorpus: number,
  annualReturn: number,
  months: number,
  initialCorpus = 0,
): number => {
  if (months <= 0) return targetCorpus
  const rate = annualReturn / 12 / 100
  const corpusFromInitial = initialCorpus * (1 + rate) ** months
  const remaining = targetCorpus - corpusFromInitial
  if (remaining <= 0) return 0
  if (rate === 0) return remaining / months
  const fvFactor = ((1 + rate) ** months - 1) / rate
  return remaining / fvFactor
}

export const goalETA = (goal: Goal, plan: SimPlan): GoalETA => {
  const { targetAmount, savedAmount, targetDate } = goal
  const { monthlyAmount } = plan
  const now = new Date()
  const end = new Date(targetDate)
  const targetMonths = Math.max(
    1,
    (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth()),
  )

  const targetPlan = {
    ...plan,
    durationMonths: targetMonths,
    initialCorpus: savedAmount,
  }

  let low = 0
  let high = Math.max(monthlyAmount, 1000)
  while (
    finalCorpus(projectTimeline({ ...targetPlan, monthlyAmount: high }), savedAmount) <
    targetAmount
  ) {
    high *= 2
    if (high > Math.max(targetAmount * 2, 10000000)) {
      break
    }
  }

  for (let i = 0; i < 32; i++) {
    const mid = (low + high) / 2
    const projected = finalCorpus(
      projectTimeline({ ...targetPlan, monthlyAmount: mid }),
      savedAmount,
    )
    if (projected >= targetAmount) {
      high = mid
    } else {
      low = mid
    }
  }

  const requiredMonthlySIP = Math.max(0, high)
  const onTrack = monthlyAmount >= requiredMonthlySIP
  const shortfall = Math.max(0, requiredMonthlySIP - monthlyAmount)
  const etaTimeline = projectTimeline({
    ...plan,
    durationMonths: 600,
    initialCorpus: savedAmount,
  })
  const monthsToReach = etaTimeline.find((point) => point.corpus >= targetAmount)?.month ?? null

  return {
    monthsToReach,
    onTrack,
    shortfall,
    requiredMonthlySIP,
  }
}

export const compareScenarios = (
  timelineA: MonthPoint[],
  timelineB: MonthPoint[],
): ScenarioDiff[] =>
  timelineA.map((point, index) => {
    const other = timelineB[index]
    const delta = other.corpus - point.corpus
    return {
      month: point.month,
      delta,
      deltaPercent: point.corpus > 0 ? (delta / point.corpus) * 100 : 0,
    }
  })

export const taxAdjustedCorpus = (
  corpus: number,
  principal: number,
  holdingYears: number,
): number => {
  if (holdingYears < 1) return corpus
  const gains = corpus - principal
  const exemption = 125000
  const taxableGains = Math.max(0, gains - exemption)
  const tax = taxableGains * 0.125
  return corpus - tax
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
    { total: 0, essential: 0, avoidable: 0, impulse: 0 },
  )
  return { ...byTag, leakage: byTag.avoidable + byTag.impulse, active }
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
  if (!text) return { label: 'Waiting for a command', monthlyImpact: 0, sipImpact: sipAmount }

  const stopMatch = text.match(/stop\s+(.+)/)
  if (stopMatch) {
    const term = stopMatch[1].replace(/[^\w\s]/g, '').trim()
    const matched = expenses.find((expense) => expense.name.toLowerCase().includes(term))
    const monthlyImpact = matched ? monthlyEquivalent(matched.amount, matched.frequency) : 0
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

export type ParsedVerb =
  | 'stop'
  | 'add'
  | 'cut'
  | 'delay'
  | 'step_up'
  | 'lump_sum'
  | 'pause'
  | 'withdraw'
  | 'redirect'
  | 'unknown'

export type ParsedOp = {
  verb: ParsedVerb
  target: string
  expenseId?: string
  amount: number
  durationMonths?: number
  delayMonths?: number
  stepUpRate?: number
  confidence: number
  label: string
  atMonth?: number
  eventAmount?: number
  relativeMultiplier?: number
  inheritedVerb?: boolean
}

type ResolvedVerb = Exclude<ParsedVerb, 'unknown'>

export type ParseSessionContext = {
  lastAppliedOps?: ParsedOp[]
  lastPrimaryVerb?: ResolvedVerb | null
}

export type MultiOpResult = {
  ops: ParsedOp[]
  totalMonthlyImpact: number
  newSipAmount: number
  alternatives: string[]
  isAmbiguous: boolean
  primaryVerb: ResolvedVerb | null
}

const levenshtein = (a: string, b: string): number => {
  const dp = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  )
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
  return dp[a.length][b.length]
}

const EXPENSE_SYNONYMS: [string[], string[]][] = [
  [['swiggy', 'zomato', 'blinkit'], ['food delivery', 'food', 'delivery', 'zometo', 'swigy', 'zomate']],
  [['netflix', 'hotstar', 'prime', 'disney'], ['ott', 'streaming', 'subscription', 'shows', 'web series']],
  [['gym', 'cult.fit'], ['fitness', 'workout', 'exercise', 'gym membership']],
  [['metro', 'bus', 'uber', 'ola'], ['commute', 'travel', 'transport', 'cab']],
  [['cloud storage', 'google drive', 'icloud'], ['cloud', 'storage', 'backup']],
  [['cafe', 'starbucks'], ['coffee', 'latte', 'coffee runs', 'cafe runs']],
]

type MatchQuality = 'exact' | 'synonym' | 'prefix' | 'fuzzy'

type ExpenseMatch = {
  expense: Expense
  score: number
  quality: MatchQuality
}

const clampConfidence = (value: number) => Math.max(0, Math.min(1, value))

const normalizeNlpText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[?!]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const parseDurationMonths = (count?: string, unit?: string) => {
  if (!count) return undefined
  const value = Number(count)
  if (!Number.isFinite(value) || value <= 0) return undefined
  return unit?.startsWith('y') ? value * 12 : value
}

const CALENDAR_MONTHS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
] as const

const resolveScheduleMonth = (text: string | undefined, defaultMonth = 1) => {
  const raw = normalizeNlpText(text ?? '')
  const yearMatch = raw.match(/\byear\s+(\d+)\b/)
  const monthMatch = raw.match(/\bmonth\s+(\d+)\b/)
  const namedMonthIndex = CALENDAR_MONTHS.findIndex((name) => raw.includes(name))

  if (yearMatch && namedMonthIndex >= 0) {
    const year = Math.max(1, Number(yearMatch[1]))
    return {
      atMonth: (year - 1) * 12 + namedMonthIndex + 1,
      label: `Year ${year}, ${CALENDAR_MONTHS[namedMonthIndex]}`,
      inferred: false,
    }
  }

  if (/\bnext year\b/.test(raw)) {
    return { atMonth: 13, label: 'next year', inferred: false }
  }

  if (yearMatch) {
    const year = Math.max(1, Number(yearMatch[1]))
    return { atMonth: (year - 1) * 12 + 1, label: `Year ${year}`, inferred: false }
  }

  if (monthMatch) {
    const atMonth = Math.max(1, Number(monthMatch[1]))
    return { atMonth, label: `Month ${atMonth}`, inferred: false }
  }

  if (namedMonthIndex >= 0) {
    const now = new Date()
    let diff = (namedMonthIndex - now.getMonth() + 12) % 12
    if (diff === 0) {
      diff = 12
    }
    return {
      atMonth: diff,
      label: CALENDAR_MONTHS[namedMonthIndex],
      inferred: true,
    }
  }

  return {
    atMonth: Math.max(1, defaultMonth),
    label: defaultMonth <= 1 ? 'now' : `Month ${defaultMonth}`,
    inferred: false,
  }
}

export const parseCurrencyAmount = (input: string): number | null => {
  const match = input.match(
    /(?:₹|rs\.?|inr)?\s*(\d[\d,]*(?:\.\d+)?)\s*(lakh|lakhs|lac|lacs|crore|crores|cr)?/i,
  )
  if (!match) return null

  const value = Number(match[1].replace(/,/g, ''))
  if (!Number.isFinite(value)) return null

  const unit = match[2]?.toLowerCase()
  if (!unit) return value
  if (unit.startsWith('lac') || unit.startsWith('lakh')) return value * 100000
  if (unit === 'cr' || unit.startsWith('crore')) return value * 10000000
  return value
}

export const fuzzyMatchExpense = (
  query: string,
  expenses: Expense[],
): ExpenseMatch | null => {
  const q = normalizeNlpText(query)
  if (!q) return null

  let bestExpense: Expense | null = null
  let bestScore = 0
  let bestQuality: MatchQuality = 'fuzzy'

  const tryKeep = (expense: Expense, score: number, quality: MatchQuality) => {
    if (score > bestScore) {
      bestExpense = expense
      bestScore = score
      bestQuality = quality
    }
  }

  for (const expense of expenses) {
    const name = normalizeNlpText(expense.name)

    if (name.includes(q)) {
      return { expense, score: 1, quality: 'exact' }
    }

    const qWords = q.split(/\s+/)
    const nWords = name.split(/\s+/)
    if (
      qWords.some(
        (word) =>
          word.length >= 3 &&
          nWords.some((candidate) => candidate.startsWith(word) || word.startsWith(candidate)),
      )
    ) {
      tryKeep(expense, 0.8, 'prefix')
    }

    for (const [primaries, aliases] of EXPENSE_SYNONYMS) {
      const expensePrimary = primaries.some((value) => name.includes(value))
      const expenseAlias = aliases.some((value) => name.includes(value))
      const queryPrimary = primaries.some((value) => q.includes(value))
      const queryAlias = aliases.some((value) => q.includes(value))

      if (
        (expensePrimary && queryAlias) ||
        (expenseAlias && queryPrimary) ||
        (expenseAlias && queryAlias)
      ) {
        tryKeep(expense, 0.84, 'synonym')
      }
    }

    const dist = levenshtein(q, name)
    const sim = 1 - dist / Math.max(q.length, name.length, 1)
    if (sim >= 0.55) {
      tryKeep(expense, sim, 'fuzzy')
    }
  }

  const matched = bestExpense
  return matched !== null && bestScore >= 0.55
    ? { expense: matched, score: bestScore, quality: bestQuality }
    : null
}

const confidenceFromMatch = (match: ExpenseMatch, inheritedVerb: boolean) => {
  let base =
    match.quality === 'exact'
      ? 0.97
      : match.quality === 'synonym'
        ? 0.84
        : match.quality === 'prefix'
          ? 0.78
          : 0.58 + (match.score - 0.55) * 0.6

  if (inheritedVerb) {
    base -= 0.08
  }

  return clampConfidence(base)
}

const detectLeadingVerb = (fragment: string): ResolvedVerb | null => {
  if (/^(?:stop|pause|cancel|quit|drop|skip|cut out|remove|eliminate)\b/.test(fragment)) return 'stop'
  if (/^(?:redirect|divert)\b/.test(fragment)) return 'redirect'
  if (/^(?:withdraw|take out|pull out|redeem)\b/.test(fragment)) return 'withdraw'
  if (/^(?:delay|start)\b/.test(fragment)) return 'delay'
  if (/^(?:step.?up|annual.?step|annual.?increase|escalate)\b/.test(fragment)) return 'step_up'
  if (/^(?:bonus|windfall|lump.?sum|one.?time)\b/.test(fragment)) return 'lump_sum'
  if (/^(?:cut|reduce|lower|trim|save|shave|halve|half)\b/.test(fragment)) return 'cut'
  if (/^(?:add|increase|boost|grow|top.?up|invest|put|contribute|double|triple)\b/.test(fragment)) return 'add'
  return null
}

const canInheritVerb = (verb: ResolvedVerb | null | undefined) =>
  verb === 'stop' || verb === 'redirect'

const looksLikeExpenseObject = (fragment: string, expenses: Expense[]) => {
  if (/\d/.test(fragment)) return false
  if (/\b(?:sip|bonus|lump|withdraw|delay|step|month|year)\b/.test(fragment)) return false
  return fuzzyMatchExpense(fragment, expenses.filter((expense) => !expense.archived)) !== null
}

const splitCommandClauses = (
  command: string,
  expenses: Expense[],
  session?: ParseSessionContext,
) => {
  const normalized = normalizeNlpText(command).replace(/^(?:and|also|then|plus|&)\s+/, '')
  const rawClauses = normalized
    .split(/\s+(?:and|also|then|plus|&)\s+/)
    .map((value) => value.trim())
    .filter(Boolean)

  const active = expenses.filter((expense) => !expense.archived)
  const clauses: { text: string; inheritedVerb: boolean }[] = []
  let priorVerb: ResolvedVerb | null = null

  rawClauses.forEach((fragment, index) => {
    const explicitVerb = detectLeadingVerb(fragment)
    if (explicitVerb) {
      priorVerb = explicitVerb
      clauses.push({ text: fragment, inheritedVerb: false })
      return
    }

    const fallbackVerb = index === 0 ? session?.lastPrimaryVerb ?? null : priorVerb
    if (canInheritVerb(fallbackVerb) && looksLikeExpenseObject(fragment, active)) {
      clauses.push({ text: `${fallbackVerb} ${fragment}`, inheritedVerb: true })
      return
    }

    clauses.push({ text: fragment, inheritedVerb: false })
  })

  return clauses
}

const parseSingleOp = (
  part: string,
  expenses: Expense[],
  sipAmount: number,
  options: { inheritedVerb?: boolean } = {},
): ParsedOp => {
  const p = normalizeNlpText(part)
  const active = expenses.filter((expense) => !expense.archived)
  const inheritedVerb = options.inheritedVerb === true
  const confidencePenalty = inheritedVerb ? 0.08 : 0

  const sipPauseMatch = p.match(
    /^(?:skip|pause|hold|stop)\s+(?:my\s+)?sip(?:\s+contributions?)?(?:\s+for\s+(\d+)\s*(years?|yrs?|months?|mos?|mo|m))?(.*)$/i,
  )
  if (sipPauseMatch) {
    const durationMonths = parseDurationMonths(sipPauseMatch[1], sipPauseMatch[2]) ?? 1
    const schedule = resolveScheduleMonth(sipPauseMatch[3], 1)
    return {
      verb: 'pause',
      target: 'SIP',
      amount: 0,
      durationMonths,
      atMonth: schedule.atMonth,
      confidence: clampConfidence(0.92 - confidencePenalty - (schedule.inferred ? 0.05 : 0)),
      label: `Pause SIP for ${durationMonths} mo ${schedule.atMonth <= 1 ? 'now' : `from ${schedule.label}`}`,
      inheritedVerb,
    }
  }

  const delayMatch = p.match(
    /^(?:delay|start)\s+(?:(?:my\s+)?sip\s+)?(?:by\s+|after\s+)?(\d+)\s*(months?|mos?|mo|m)\b/i,
  )
  if (delayMatch) {
    const delayMonths = Number(delayMatch[1])
    return {
      verb: 'delay',
      target: 'SIP',
      amount: 0,
      delayMonths,
      confidence: clampConfidence(0.95 - confidencePenalty),
      label: `Delay SIP start by ${delayMonths} months`,
      inheritedVerb,
    }
  }

  const stepMatch = p.match(
    /^(?:step.?up|annual.?step|annual.?increase|escalate)(?:\s+(?:my\s+)?sip)?(?:\s+by)?\s+(\d+(?:\.\d+)?)\s*%?(.*)$/i,
  )
  if (stepMatch) {
    const stepUpRate = Number(stepMatch[1])
    const scheduleText = normalizeNlpText(stepMatch[2] ?? '')
    const hasSchedule = scheduleText.length > 0
    const schedule = resolveScheduleMonth(scheduleText, 1)
    return {
      verb: 'step_up',
      target: 'SIP',
      amount: 0,
      stepUpRate,
      atMonth: hasSchedule ? schedule.atMonth : undefined,
      confidence: clampConfidence(0.93 - confidencePenalty - (schedule.inferred ? 0.05 : 0)),
      label: hasSchedule
        ? `Step up SIP by ${stepUpRate}% from ${schedule.label}`
        : `Step up SIP by ${stepUpRate}% every year`,
      inheritedVerb,
    }
  }

  if (/\b(?:bonus|windfall|lump.?sum|one.?time|annual bonus)\b/i.test(p)) {
    const eventAmount = parseCurrencyAmount(p)
    if (eventAmount && eventAmount > 0) {
      const schedule = resolveScheduleMonth(p, 1)
      return {
        verb: 'lump_sum',
        target: 'corpus',
        amount: 0,
        eventAmount,
        atMonth: schedule.atMonth,
        confidence: clampConfidence(0.9 - confidencePenalty - (schedule.inferred ? 0.05 : 0)),
        label: `Invest ${formatINR(eventAmount)} ${schedule.atMonth <= 1 ? 'now' : `in ${schedule.label}`}`,
        inheritedVerb,
      }
    }
  }

  const withdrawMatch = p.match(/^(?:withdraw|take out|pull out|redeem)\s+(.+)$/i)
  if (withdrawMatch) {
    const eventAmount = parseCurrencyAmount(withdrawMatch[1])
    if (eventAmount && eventAmount > 0) {
      const schedule = resolveScheduleMonth(withdrawMatch[1], 1)
      return {
        verb: 'withdraw',
        target: 'corpus',
        amount: 0,
        eventAmount,
        atMonth: schedule.atMonth,
        confidence: clampConfidence(0.9 - confidencePenalty - (schedule.inferred ? 0.04 : 0)),
        label: `Withdraw ${formatINR(eventAmount)} ${schedule.atMonth <= 1 ? 'now' : `in ${schedule.label}`}`,
        inheritedVerb,
      }
    }
  }

  const doubleSipMatch = p.match(/^(double|triple)\s+(?:my\s+)?sip$/i)
  if (doubleSipMatch) {
    const relativeMultiplier = doubleSipMatch[1].toLowerCase() === 'triple' ? 3 : 2
    const amount = sipAmount * (relativeMultiplier - 1)
    return {
      verb: 'add',
      target: 'SIP',
      amount,
      relativeMultiplier,
      confidence: clampConfidence(0.88 - confidencePenalty),
      label: `${doubleSipMatch[1][0].toUpperCase()}${doubleSipMatch[1].slice(1)} SIP to ${formatINR(sipAmount * relativeMultiplier)}/mo`,
      inheritedVerb,
    }
  }

  if (
    /^(?:halve|half)\s+(?:my\s+)?sip$/i.test(p) ||
    /^(?:reduce|cut|lower)\s+(?:my\s+)?sip\s+by\s+half$/i.test(p)
  ) {
    return {
      verb: 'cut',
      target: 'SIP',
      amount: -sipAmount / 2,
      relativeMultiplier: 0.5,
      confidence: clampConfidence(0.88 - confidencePenalty),
      label: `Reduce SIP to ${formatINR(sipAmount / 2)}/mo`,
      inheritedVerb,
    }
  }

  const sipPercentMatch = p.match(
    /^(increase|raise|boost|reduce|cut|lower)\s+(?:my\s+)?sip\s+by\s+(\d+(?:\.\d+)?)\s*%$/i,
  )
  if (sipPercentMatch) {
    const pct = Number(sipPercentMatch[2]) / 100
    const isIncrease = /increase|raise|boost/i.test(sipPercentMatch[1])
    const relativeMultiplier = Math.max(0, isIncrease ? 1 + pct : 1 - pct)
    const amount = sipAmount * (relativeMultiplier - 1)
    return {
      verb: isIncrease ? 'add' : 'cut',
      target: 'SIP',
      amount,
      relativeMultiplier,
      confidence: clampConfidence(0.86 - confidencePenalty),
      label: `${isIncrease ? 'Increase' : 'Reduce'} SIP by ${Math.round(pct * 100)}%`,
      inheritedVerb,
    }
  }

  const stopMatch = p.match(
    /^(stop|pause|cancel|quit|drop|skip|cut out|remove|eliminate|redirect|divert)\s+(.+?)(?:\s+for\s+(\d+)\s*(years?|yrs?|months?|mos?|mo|m))?(?:\s+(?:to|into)\s+(?:sip|savings|investment).*)?$/i,
  )
  if (stopMatch) {
    const verb = /redirect|divert/i.test(stopMatch[1]) ? 'redirect' : 'stop'
    const nameQuery = stopMatch[2].replace(/\s+(?:to|into)\s+(?:sip|savings|investment).*/i, '').trim()
    const matched = fuzzyMatchExpense(nameQuery, active)
    const durationMonths = parseDurationMonths(stopMatch[3], stopMatch[4])

    if (matched) {
      const monthly = monthlyEquivalent(matched.expense.amount, matched.expense.frequency)
      return {
        verb,
        target: matched.expense.name,
        expenseId: matched.expense.id,
        amount: monthly,
        durationMonths,
        confidence: confidenceFromMatch(matched, inheritedVerb),
        label: durationMonths
          ? `Stop "${matched.expense.name}" for ${durationMonths} mo -> free ${formatINR(monthly)}/mo`
          : `${verb === 'redirect' ? 'Redirect' : 'Stop'} "${matched.expense.name}" -> free ${formatINR(monthly)}/mo`,
        inheritedVerb,
      }
    }

    return {
      verb,
      target: nameQuery,
      amount: 0,
      confidence: clampConfidence(0.2 - confidencePenalty),
      label: `No expense matches "${nameQuery}" - check spelling`,
      inheritedVerb,
    }
  }

  const addMatch = p.match(/^(?:add|start|increase|boost|grow|top.?up|invest|put|contribute)\s+(.+)$/i)
  if (addMatch) {
    const value = parseCurrencyAmount(addMatch[1])
    if (value && value > 0) {
      return {
        verb: 'add',
        target: 'SIP',
        amount: value,
        confidence: clampConfidence(0.94 - confidencePenalty),
        label: `Add ${formatINR(value)}/mo to SIP`,
        inheritedVerb,
      }
    }
  }

  const cutMatch = p.match(/^(?:cut|reduce|lower|trim|save|shave)\s+(.+)$/i)
  if (cutMatch) {
    const value = parseCurrencyAmount(cutMatch[1])
    if (value && value > 0) {
      return {
        verb: 'cut',
        target: 'spending',
        amount: value,
        confidence: clampConfidence(0.82 - confidencePenalty),
        label: `Cut ${formatINR(value)}/mo -> redirect to SIP`,
        inheritedVerb,
      }
    }
  }

  const fuzzy = fuzzyMatchExpense(p, active)
  if (fuzzy && fuzzy.score > 0.65) {
    const monthly = monthlyEquivalent(fuzzy.expense.amount, fuzzy.expense.frequency)
    return {
      verb: inheritedVerb ? 'redirect' : 'stop',
      target: fuzzy.expense.name,
      expenseId: fuzzy.expense.id,
      amount: monthly,
      confidence: clampConfidence(confidenceFromMatch(fuzzy, inheritedVerb) - 0.08),
      label: `Did you mean: stop "${fuzzy.expense.name}" -> free ${formatINR(monthly)}/mo?`,
      inheritedVerb,
    }
  }

  return {
    verb: 'unknown',
    target: p,
    amount: 0,
    confidence: 0,
    label: `Couldn't parse "${p}" - try "stop Swiggy" or "invest my annual bonus of 50000 in year 3"`,
    inheritedVerb,
  }
}

export const buildCommandSuggestions = (expenses: Expense[]) => {
  const ranked = expenses
    .filter((expense) => !expense.archived)
    .sort((a, b) => {
      const aPriority = a.tag === 'essential' ? 0 : 1
      const bPriority = b.tag === 'essential' ? 0 : 1
      const priorityDelta = bPriority - aPriority
      if (priorityDelta !== 0) return priorityDelta
      return monthlyEquivalent(b.amount, b.frequency) - monthlyEquivalent(a.amount, a.frequency)
    })

  const focusExpenses = ranked.filter(
    (expense) => expense.tag === 'avoidable' || expense.tag === 'impulse',
  )
  const source = focusExpenses.length > 0 ? focusExpenses : ranked
  const suggestions = [
    source[0] ? `stop ${source[0].name}` : null,
    source[0] && source[1] ? `stop ${source[0].name} and ${source[1].name}` : null,
    source[1] ? `cut rs 2000 and stop ${source[1].name}` : null,
    source[2] ? `also ${source[2].name}` : null,
    'reduce my sip by half',
    'skip my sip for 3 months next year',
    'invest my annual bonus of 50000 in year 3',
  ]

  return Array.from(new Set(suggestions.filter((value): value is string => Boolean(value)))).slice(
    0,
    6,
  )
}

export const parseMultiOp = (
  command: string,
  expenses: Expense[],
  sipAmount: number,
  session?: ParseSessionContext,
): MultiOpResult => {
  if (!command.trim()) {
    return {
      ops: [],
      totalMonthlyImpact: 0,
      newSipAmount: sipAmount,
      alternatives: [],
      isAmbiguous: false,
      primaryVerb: null,
    }
  }

  const clauses = splitCommandClauses(command, expenses, session)
  const ops = clauses.map((clause) =>
    parseSingleOp(clause.text, expenses, sipAmount, {
      inheritedVerb: clause.inheritedVerb,
    }),
  )
  const totalMonthlyImpact = ops.reduce((sum, op) => sum + op.amount, 0)
  const isAmbiguous = ops.some((op) => op.confidence < 0.7)
  const alternatives =
    ops.some((op) => op.verb === 'unknown') || isAmbiguous
      ? buildCommandSuggestions(expenses)
      : []
  const primaryVerb = ops.find((op) => op.verb !== 'unknown')?.verb ?? null

  return {
    ops,
    totalMonthlyImpact,
    newSipAmount: Math.max(0, sipAmount + totalMonthlyImpact),
    alternatives,
    isAmbiguous,
    primaryVerb: primaryVerb === 'unknown' ? null : primaryVerb,
  }
}

export const monthlySavingsRequired = (targetAmount: number, targetDate: string, saved = 0) => {
  const end = new Date(targetDate)
  const now = new Date()
  const months = Math.max(
    1,
    (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth()),
  )
  return Math.max(0, (targetAmount - saved) / months)
}

export const percentage = (part: number, total: number) =>
  total > 0 ? Math.max(0, Math.min(100, (part / total) * 100)) : 0
