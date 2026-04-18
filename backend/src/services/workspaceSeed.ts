import { Expense } from '../models/Expense.js'
import { Goal } from '../models/Goal.js'
import { Scenario } from '../models/Scenario.js'
import type { IUser } from '../models/User.js'

type SeedExpense = {
  name: string
  amount: number
  frequency: 'daily' | 'weekly' | 'monthly'
  tag: 'essential' | 'avoidable' | 'impulse'
  archived?: boolean
  createdAt: Date
  updatedAt: Date
}

type SeedGoal = {
  name: string
  targetAmount: number
  targetDate: string
  priority: 1 | 2 | 3
  savedAmount: number
  createdAt: Date
  updatedAt: Date
}

type SeedScenario = {
  name: string
  monthlySip: number
  avoidableCut: number
  months: number
  createdAt: Date
  updatedAt: Date
}

const dateMonthsAgo = (monthsAgo: number, day = 8) => {
  const now = new Date()
  return new Date(
    now.getFullYear(),
    now.getMonth() - monthsAgo,
    day,
    9,
    30,
    0,
    0,
  )
}

const starterExpenses: SeedExpense[] = [
  {
    name: '1BHK rent - Whitefield',
    amount: 21000,
    frequency: 'monthly',
    tag: 'essential',
    createdAt: dateMonthsAgo(8, 3),
    updatedAt: dateMonthsAgo(1, 3),
  },
  {
    name: 'Groceries',
    amount: 7600,
    frequency: 'monthly',
    tag: 'essential',
    createdAt: dateMonthsAgo(8, 5),
    updatedAt: dateMonthsAgo(0, 5),
  },
  {
    name: 'Electricity bill',
    amount: 2400,
    frequency: 'monthly',
    tag: 'essential',
    createdAt: dateMonthsAgo(7, 9),
    updatedAt: dateMonthsAgo(0, 9),
  },
  {
    name: 'Broadband internet',
    amount: 899,
    frequency: 'monthly',
    tag: 'essential',
    createdAt: dateMonthsAgo(7, 9),
    updatedAt: dateMonthsAgo(0, 9),
  },
  {
    name: 'Metro commute',
    amount: 2200,
    frequency: 'monthly',
    tag: 'essential',
    createdAt: dateMonthsAgo(6, 10),
    updatedAt: dateMonthsAgo(0, 10),
  },
  {
    name: 'Health insurance top-up',
    amount: 1450,
    frequency: 'monthly',
    tag: 'essential',
    createdAt: dateMonthsAgo(6, 14),
    updatedAt: dateMonthsAgo(0, 14),
  },
  {
    name: 'Parents medicine support',
    amount: 3000,
    frequency: 'monthly',
    tag: 'essential',
    createdAt: dateMonthsAgo(6, 14),
    updatedAt: dateMonthsAgo(0, 14),
  },
  {
    name: 'Gym membership',
    amount: 1800,
    frequency: 'monthly',
    tag: 'essential',
    createdAt: dateMonthsAgo(5, 11),
    updatedAt: dateMonthsAgo(0, 11),
  },
  {
    name: 'Swiggy dinner',
    amount: 520,
    frequency: 'weekly',
    tag: 'avoidable',
    createdAt: dateMonthsAgo(5, 12),
    updatedAt: dateMonthsAgo(0, 12),
  },
  {
    name: 'Weekend cafe',
    amount: 350,
    frequency: 'weekly',
    tag: 'avoidable',
    createdAt: dateMonthsAgo(4, 16),
    updatedAt: dateMonthsAgo(0, 16),
  },
  {
    name: 'Netflix OTT',
    amount: 649,
    frequency: 'monthly',
    tag: 'avoidable',
    createdAt: dateMonthsAgo(4, 18),
    updatedAt: dateMonthsAgo(0, 18),
  },
  {
    name: 'Spotify Premium',
    amount: 119,
    frequency: 'monthly',
    tag: 'avoidable',
    createdAt: dateMonthsAgo(4, 18),
    updatedAt: dateMonthsAgo(0, 18),
  },
  {
    name: 'Impulse Amazon buys',
    amount: 2400,
    frequency: 'monthly',
    tag: 'impulse',
    createdAt: dateMonthsAgo(3, 21),
    updatedAt: dateMonthsAgo(0, 21),
  },
  {
    name: 'UPI snacks & chai',
    amount: 120,
    frequency: 'daily',
    tag: 'impulse',
    createdAt: dateMonthsAgo(3, 24),
    updatedAt: dateMonthsAgo(0, 24),
  },
  {
    name: 'Hotstar OTT',
    amount: 299,
    frequency: 'monthly',
    tag: 'avoidable',
    archived: true,
    createdAt: dateMonthsAgo(8, 7),
    updatedAt: dateMonthsAgo(2, 7),
  },
]

const starterGoals: SeedGoal[] = [
  {
    name: 'Emergency fund',
    targetAmount: 400000,
    targetDate: '2027-03-31',
    priority: 1,
    savedAmount: 185000,
    createdAt: dateMonthsAgo(8, 6),
    updatedAt: dateMonthsAgo(0, 6),
  },
  {
    name: 'Younger sister wedding contribution',
    targetAmount: 250000,
    targetDate: '2027-11-30',
    priority: 1,
    savedAmount: 70000,
    createdAt: dateMonthsAgo(6, 12),
    updatedAt: dateMonthsAgo(1, 12),
  },
  {
    name: 'Goa trip with friends',
    targetAmount: 60000,
    targetDate: '2026-12-15',
    priority: 3,
    savedAmount: 18000,
    createdAt: dateMonthsAgo(3, 19),
    updatedAt: dateMonthsAgo(0, 19),
  },
]

const starterScenarios: SeedScenario[] = [
  {
    name: 'Cut delivery and snacks',
    monthlySip: 11000,
    avoidableCut: 5600,
    months: 120,
    createdAt: dateMonthsAgo(2, 8),
    updatedAt: dateMonthsAgo(0, 8),
  },
  {
    name: 'Annual 10% SIP step-up',
    monthlySip: 9500,
    avoidableCut: 2500,
    months: 180,
    createdAt: dateMonthsAgo(1, 14),
    updatedAt: dateMonthsAgo(0, 14),
  },
  {
    name: 'Delay SIP by 12 months',
    monthlySip: 7000,
    avoidableCut: 0,
    months: 120,
    createdAt: dateMonthsAgo(1, 27),
    updatedAt: dateMonthsAgo(0, 27),
  },
]

const hasMeaningfulProfile = (user: IUser) =>
  Boolean(
    user.profile.name ||
      user.profile.handle ||
      user.profile.monthlySalary > 0 ||
      user.profile.savings > 0 ||
      user.sip.monthlyAmount > 0 ||
      user.whatIf,
  )

export async function seedStarterWorkspaceIfEmpty(user: IUser) {
  const [expenseCount, goalCount, scenarioCount] = await Promise.all([
    Expense.countDocuments({ userId: user._id }),
    Goal.countDocuments({ userId: user._id }),
    Scenario.countDocuments({ userId: user._id }),
  ])

  const workspaceHasData =
    hasMeaningfulProfile(user) || expenseCount > 0 || goalCount > 0 || scenarioCount > 0

  if (workspaceHasData) {
    return user
  }

  user.profile = {
    name: 'Rahul Sharma',
    handle: 'rahul-sharma',
    pin: '2580',
    monthlySalary: 78000,
    savings: 235000,
  }
  user.sip = {
    monthlyAmount: 7000,
    annualReturn: 12,
    durationMonths: 180,
    delayMonths: 0,
  }
  user.challenge = {
    name: 'No food delivery for 21 days',
    daysLeft: 11,
    saved: 2460,
  }
  user.whatIf = 'stop swiggy and add 3000 SIP'
  await user.save()

  await Promise.all([
    Expense.insertMany(starterExpenses.map((expense) => ({ ...expense, userId: user._id }))),
    Goal.insertMany(starterGoals.map((goal) => ({ ...goal, userId: user._id }))),
    Scenario.insertMany(starterScenarios.map((scenario) => ({ ...scenario, userId: user._id }))),
  ])

  return user
}
