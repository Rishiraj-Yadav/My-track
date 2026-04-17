export type Frequency = 'daily' | 'weekly' | 'monthly'
export type ExpenseTag = 'essential' | 'avoidable' | 'impulse'

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

export const calculateMonthlyTotals = (
  expenses: Array<{ amount: number; frequency: Frequency; tag: ExpenseTag; archived?: boolean }>,
) => {
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

