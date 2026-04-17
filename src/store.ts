import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type {
  Badge,
  Expense,
  Goal,
  Profile,
  Scenario,
  SipPlan,
} from './lib/finance'

type Challenge = {
  name: string
  daysLeft: number
  saved: number
}

type AppState = {
  profile: Profile
  expenses: Expense[]
  goals: Goal[]
  sip: SipPlan
  scenarios: Scenario[]
  badges: Badge[]
  challenge: Challenge
  whatIf: string
  setProfile: (profile: Partial<Profile>) => void
  addExpense: (expense: Expense) => void
  updateExpense: (id: string, patch: Partial<Expense>) => void
  deleteExpense: (id: string) => void
  addGoal: (goal: Goal) => void
  updateGoal: (id: string, patch: Partial<Goal>) => void
  setSip: (patch: Partial<SipPlan>) => void
  setWhatIf: (value: string) => void
  setScenario: (id: string, patch: Partial<Scenario>) => void
  addScenario: (scenario: Scenario) => void
  unlockBadge: (id: string) => void
  setChallenge: (patch: Partial<Challenge>) => void
}

const demoProfile: Profile = {
  name: 'Aarav',
  pin: '2468',
  monthlySalary: 85000,
  savings: 42000,
}

const demoExpenses: Expense[] = [
  {
    id: '1',
    name: 'Swiggy dinners',
    amount: 350,
    frequency: 'weekly',
    tag: 'impulse',
  },
  {
    id: '2',
    name: 'Netflix + OTT stack',
    amount: 1299,
    frequency: 'monthly',
    tag: 'avoidable',
  },
  {
    id: '3',
    name: 'Metro commute',
    amount: 55,
    frequency: 'daily',
    tag: 'essential',
  },
  {
    id: '4',
    name: 'Weekend cafe runs',
    amount: 900,
    frequency: 'weekly',
    tag: 'avoidable',
  },
  {
    id: '5',
    name: 'Cloud storage',
    amount: 299,
    frequency: 'monthly',
    tag: 'avoidable',
  },
  {
    id: '6',
    name: 'Gym membership',
    amount: 1499,
    frequency: 'monthly',
    tag: 'essential',
  },
]

const demoGoals: Goal[] = [
  {
    id: 'g1',
    name: 'Trip to Japan',
    targetAmount: 250000,
    targetDate: '2027-09-01',
    priority: 2,
    savedAmount: 72000,
  },
  {
    id: 'g2',
    name: 'Emergency fund',
    targetAmount: 400000,
    targetDate: '2026-12-01',
    priority: 1,
    savedAmount: 168000,
  },
]

const demoSip: SipPlan = {
  monthlyAmount: 12000,
  annualReturn: 12,
  durationMonths: 120,
  delayMonths: 0,
}

const demoScenarios: Scenario[] = [
  {
    id: 's1',
    name: 'Keep habits unchanged',
    monthlySip: 12000,
    avoidableCut: 0,
    months: 120,
  },
  {
    id: 's2',
    name: 'Cut food delivery',
    monthlySip: 15500,
    avoidableCut: 3500,
    months: 120,
  },
]

const demoBadges: Badge[] = [
  {
    id: 'b1',
    name: 'Leak Finder',
    unlocked: true,
    hint: 'Tagged 3 expenses correctly',
  },
  {
    id: 'b2',
    name: 'SIP Starter',
    unlocked: true,
    hint: 'Started a monthly SIP',
  },
  {
    id: 'b3',
    name: 'No-Spend Week',
    unlocked: false,
    hint: '7 days under avoidable-spend target',
  },
  {
    id: 'b4',
    name: 'Goal Climber',
    unlocked: false,
    hint: 'Kept 2 goals on track',
  },
]

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      profile: demoProfile,
      expenses: demoExpenses,
      goals: demoGoals,
      sip: demoSip,
      scenarios: demoScenarios,
      badges: demoBadges,
      challenge: {
        name: 'No-spend week',
        daysLeft: 4,
        saved: 1880,
      },
      whatIf: 'stop swiggy twice a week',
      setProfile: (profile) =>
        set((state) => ({ profile: { ...state.profile, ...profile } })),
      addExpense: (expense) =>
        set((state) => ({ expenses: [expense, ...state.expenses] })),
      updateExpense: (id, patch) =>
        set((state) => ({
          expenses: state.expenses.map((expense) =>
            expense.id === id ? { ...expense, ...patch } : expense,
          ),
        })),
      deleteExpense: (id) =>
        set((state) => ({
          expenses: state.expenses.filter((expense) => expense.id !== id),
        })),
      addGoal: (goal) => set((state) => ({ goals: [goal, ...state.goals] })),
      updateGoal: (id, patch) =>
        set((state) => ({
          goals: state.goals.map((goal) => (goal.id === id ? { ...goal, ...patch } : goal)),
        })),
      setSip: (patch) => set((state) => ({ sip: { ...state.sip, ...patch } })),
      setWhatIf: (value) => set(() => ({ whatIf: value })),
      setScenario: (id, patch) =>
        set((state) => ({
          scenarios: state.scenarios.map((scenario) =>
            scenario.id === id ? { ...scenario, ...patch } : scenario,
          ),
        })),
      addScenario: (scenario) =>
        set((state) => ({ scenarios: [scenario, ...state.scenarios] })),
      unlockBadge: (id) =>
        set((state) => ({
          badges: state.badges.map((badge) =>
            badge.id === id ? { ...badge, unlocked: true } : badge,
          ),
        })),
      setChallenge: (patch) =>
        set((state) => ({ challenge: { ...state.challenge, ...patch } })),
    }),
    {
      name: 'expense-autopsy-demo',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

