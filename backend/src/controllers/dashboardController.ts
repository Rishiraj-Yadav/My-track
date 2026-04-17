import { asyncHandler } from '../utils/asyncHandler.js'
import { Expense } from '../models/Expense.js'
import { Goal } from '../models/Goal.js'
import { Scenario } from '../models/Scenario.js'
import { calculateMonthlyTotals, futureValueMonthly, healthScore, monthlyEquivalent } from '../utils/finance.js'

export const getDashboardSummary = asyncHandler(async (req, res) => {
  const [expenses, goals, scenarios] = await Promise.all([
    Expense.find({ userId: req.user?._id }),
    Goal.find({ userId: req.user?._id }),
    Scenario.find({ userId: req.user?._id }),
  ])

  const totals = calculateMonthlyTotals(expenses)
  const sipAmount = req.user?.sip?.monthlyAmount ?? 0
  const salary = req.user?.profile?.monthlySalary ?? 0
  const score = healthScore({
    salary,
    leakage: totals.leakage,
    sipAmount,
    goalsOnTrack: goals.some((goal) => goal.savedAmount >= goal.targetAmount * 0.35),
    streak: 12,
    subscriptions: expenses.filter((expense) => expense.name.toLowerCase().includes('ott')).length,
  })

  const topLeaks = expenses
    .filter((expense) => expense.tag !== 'essential')
    .map((expense) => ({
      id: expense.id,
      name: expense.name,
      monthly: monthlyEquivalent(expense.amount, expense.frequency),
    }))
    .sort((a, b) => b.monthly - a.monthly)
    .slice(0, 3)

  res.json({
    score,
    totals,
    topLeaks,
    goals,
    scenarios,
    projectedCorpus: futureValueMonthly(
      sipAmount,
      req.user?.sip?.annualReturn ?? 12,
      req.user?.sip?.durationMonths ?? 120,
    ),
  })
})

