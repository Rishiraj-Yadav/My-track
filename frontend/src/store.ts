import { create } from 'zustand'
import type {
  Badge,
  Expense,
  Goal,
  Profile,
  Scenario,
  SipPlan,
} from './lib/finance'
import { api, clearTokens, getAccessToken, getSessionId, setTokens } from './lib/api'

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
  isLoading: boolean
  hasBootstrapped: boolean
  error: string | null
  bootstrap: () => Promise<void>
  setProfile: (profile: Partial<Profile>) => Promise<void>
  addExpense: (expense: Expense) => Promise<void>
  updateExpense: (id: string, patch: Partial<Expense>) => Promise<void>
  deleteExpense: (id: string) => Promise<void>
  addGoal: (goal: Goal) => Promise<void>
  updateGoal: (id: string, patch: Partial<Goal>) => Promise<void>
  setSip: (patch: Partial<SipPlan>) => Promise<void>
  setWhatIf: (value: string) => Promise<void>
  setScenario: (id: string, patch: Partial<Scenario>) => Promise<void>
  addScenario: (scenario: Scenario) => Promise<void>
  unlockBadge: (id: string) => Promise<void>
  setChallenge: (patch: Partial<Challenge>) => Promise<void>
}

type ApiExpense = Expense & { _id?: string; id?: string }
type ApiGoal = Goal & { _id?: string; id?: string }
type ApiScenario = Scenario & { _id?: string; id?: string }
type ApiBadge = Badge & { _id?: string; id?: string }

const emptySip: SipPlan = {
  monthlyAmount: 0,
  annualReturn: 12,
  durationMonths: 120,
  delayMonths: 0,
}

const emptyChallenge: Challenge = {
  name: 'No-spend week',
  daysLeft: 0,
  saved: 0,
}

const normalizeId = <T extends { _id?: string; id?: string }>(item: T) => ({
  ...item,
  id: item.id ?? item._id ?? crypto.randomUUID(),
})

const normalizeExpense = (item: ApiExpense): Expense =>
  normalizeId(item) as Expense

const normalizeGoal = (item: ApiGoal): Goal =>
  normalizeId(item) as Goal

const normalizeScenario = (item: ApiScenario): Scenario =>
  normalizeId(item) as Scenario

const normalizeBadge = (item: ApiBadge): Badge =>
  normalizeId(item) as Badge

export const useAppStore = create<AppState>()((set, get) => ({
  profile: {
    name: '',
    handle: '',
    pin: '',
    monthlySalary: 0,
    savings: 0,
  },
  expenses: [],
  goals: [],
  sip: emptySip,
  scenarios: [],
  badges: [],
  challenge: emptyChallenge,
  whatIf: '',
  isLoading: true,
  hasBootstrapped: false,
  error: null,
  bootstrap: async () => {
    try {
      const { hasBootstrapped } = get()
      if (hasBootstrapped) return
      set({ hasBootstrapped: true, isLoading: true, error: null })

      const existingToken = getAccessToken()
      let userData: any

      if (existingToken) {
        // User logged in via AuthPage — use their existing tokens to fetch profile
        const meRes = await api.getMe()
        userData = meRes.user
      } else {
        // Anonymous / first visit — bootstrap a session
        getSessionId()
        const session = await api.bootstrap()
        setTokens(session.accessToken, session.refreshToken)
        userData = session.user
      }

      // Sync tier from DB → localStorage
      const userTier = userData.tier || 'starter'
      localStorage.setItem('mytracker-tier', userTier)

      set({
        profile: userData.profile,
        sip: userData.sip,
        challenge: userData.challenge,
        whatIf: userData.whatIf,
        badges: (userData.badges || []).map(normalizeBadge),
        isLoading: false,
      })

      const [expensesRes, goalsRes, scenariosRes] = await Promise.all([
        api.listExpenses(),
        api.listGoals(),
        api.listScenarios(),
      ])

      set({
        expenses: (expensesRes.expenses as ApiExpense[]).map(normalizeExpense),
        goals: (goalsRes.goals as ApiGoal[]).map(normalizeGoal),
        scenarios: (scenariosRes.scenarios as ApiScenario[]).map(normalizeScenario),
      })
    } catch (error) {
      clearTokens()
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load data',
      })
    }
  },
  setProfile: async (profile) => {
    const response = await api.updateProfile(profile)
    set({ profile: response.profile })
  },
  addExpense: async (expense) => {
    const response = await api.createExpense({
      name: expense.name,
      amount: expense.amount,
      frequency: expense.frequency,
      tag: expense.tag,
      archived: expense.archived ?? false,
    })
    set((state) => ({
      expenses: [normalizeExpense(response.expense as ApiExpense), ...state.expenses],
    }))
  },
  updateExpense: async (id, patch) => {
    const response = await api.updateExpense(id, patch)
    set((state) => ({
      expenses: state.expenses.map((expense) =>
        expense.id === id ? normalizeExpense(response.expense as ApiExpense) : expense,
      ),
    }))
  },
  deleteExpense: async (id) => {
    await api.deleteExpense(id)
    set((state) => ({
      expenses: state.expenses.filter((expense) => expense.id !== id),
    }))
  },
  addGoal: async (goal) => {
    const response = await api.createGoal({
      name: goal.name,
      targetAmount: goal.targetAmount,
      targetDate: goal.targetDate,
      priority: goal.priority,
      savedAmount: goal.savedAmount,
    })
    set((state) => ({
      goals: [normalizeGoal(response.goal as ApiGoal), ...state.goals],
    }))
  },
  updateGoal: async (id, patch) => {
    const response = await api.updateGoal(id, patch)
    set((state) => ({
      goals: state.goals.map((goal) =>
        goal.id === id ? normalizeGoal(response.goal as ApiGoal) : goal,
      ),
    }))
  },
  setSip: async (patch) => {
    const response = await api.updateSip(patch)
    set({ sip: response.sip })
  },
  setWhatIf: async (value) => {
    const response = await api.updateWhatIf(value)
    set({ whatIf: response.whatIf })
  },
  setScenario: async (id, patch) => {
    const response = await api.updateScenario(id, patch)
    set((state) => ({
      scenarios: state.scenarios.map((scenario) =>
        scenario.id === id ? normalizeScenario(response.scenario as ApiScenario) : scenario,
      ),
    }))
  },
  addScenario: async (scenario) => {
    const response = await api.createScenario({
      name: scenario.name,
      monthlySip: scenario.monthlySip,
      avoidableCut: scenario.avoidableCut,
      months: scenario.months,
    })
    set((state) => ({
      scenarios: [normalizeScenario(response.scenario as ApiScenario), ...state.scenarios],
    }))
  },
  unlockBadge: async (id) => {
    const badge = get().badges.find((item) => item.id === id)
    if (!badge) return
    const response = await api.updateBadge({ id, unlocked: true })
    set({
      badges: (response.badges as ApiBadge[]).map(normalizeBadge),
    })
  },
  setChallenge: async (patch) => {
    const response = await api.updateChallenge(patch)
    set({ challenge: response.challenge })
  },
}))
