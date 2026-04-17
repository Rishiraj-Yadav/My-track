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

