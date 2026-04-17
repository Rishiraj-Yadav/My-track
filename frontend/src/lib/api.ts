const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'
const SESSION_KEY = 'mytracker-session-id'
const ACCESS_TOKEN_KEY = 'mytracker-access-token'
const REFRESH_TOKEN_KEY = 'mytracker-refresh-token'

type ApiResponse<T> = T

export type BootstrapPayload = {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    email: string | null
    profile: {
      name: string
      pin: string
      monthlySalary: number
      savings: number
    }
    sip: {
      monthlyAmount: number
      annualReturn: number
      durationMonths: number
      delayMonths: number
    }
    challenge: {
      name: string
      daysLeft: number
      saved: number
    }
    whatIf: string
    badges: Array<{ id: string; name: string; unlocked: boolean; hint: string }>
  }
}

export type ProfileResponse = {
  profile: BootstrapPayload['user']['profile']
}

export type SipResponse = {
  sip: BootstrapPayload['user']['sip']
}

export type WhatIfResponse = {
  whatIf: string
}

export type ChallengeResponse = {
  challenge: BootstrapPayload['user']['challenge']
}

export type BadgeResponse = {
  badges: BootstrapPayload['user']['badges']
}

export type ExpenseResponse = {
  expense: {
    _id?: string
    id?: string
    name: string
    amount: number
    frequency: 'daily' | 'weekly' | 'monthly'
    tag: 'essential' | 'avoidable' | 'impulse'
    archived?: boolean
  }
}

export type ExpensesResponse = {
  expenses: ExpenseResponse['expense'][]
}

export type GoalResponse = {
  goal: {
    _id?: string
    id?: string
    name: string
    targetAmount: number
    targetDate: string
    priority: 1 | 2 | 3
    savedAmount: number
  }
}

export type GoalsResponse = {
  goals: GoalResponse['goal'][]
}

export type ScenarioResponse = {
  scenario: {
    _id?: string
    id?: string
    name: string
    monthlySip: number
    avoidableCut: number
    months: number
  }
}

export type ScenariosResponse = {
  scenarios: ScenarioResponse['scenario'][]
}

export type DashboardSummaryResponse = {
  score: number
  totals: {
    total: number
    essential: number
    avoidable: number
    impulse: number
    leakage: number
    active: Array<unknown>
  }
  topLeaks: Array<{ id?: string; name: string; monthly: number }>
  goals: GoalResponse['goal'][]
  scenarios: ScenarioResponse['scenario'][]
  projectedCorpus: number
}

const generateSessionId = () => crypto.randomUUID()

export const getSessionId = () => {
  const existing = localStorage.getItem(SESSION_KEY)
  if (existing) return existing
  const sessionId = generateSessionId()
  localStorage.setItem(SESSION_KEY, sessionId)
  return sessionId
}

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY) ?? ''

export const setTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token = getAccessToken(),
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message ?? 'Request failed')
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export const api = {
  bootstrap: async (): Promise<ApiResponse<BootstrapPayload>> =>
    request('/api/bootstrap', {
      method: 'POST',
      body: JSON.stringify({ sessionId: getSessionId() }),
    }, ''),

  getProfile: async () => request<ProfileResponse>('/api/profile'),
  updateProfile: async (body: Record<string, unknown>) =>
    request<ProfileResponse>('/api/profile', { method: 'PUT', body: JSON.stringify(body) }),
  getSip: async () => request<SipResponse>('/api/profile/sip'),
  updateSip: async (body: Record<string, unknown>) =>
    request<SipResponse>('/api/profile/sip', { method: 'PUT', body: JSON.stringify(body) }),
  getWhatIf: async () => request<WhatIfResponse>('/api/profile/what-if'),
  updateWhatIf: async (whatIf: string) =>
    request<WhatIfResponse>('/api/profile/what-if', { method: 'PUT', body: JSON.stringify({ whatIf }) }),
  getChallenge: async () => request<ChallengeResponse>('/api/profile/challenge'),
  updateChallenge: async (body: Record<string, unknown>) =>
    request<ChallengeResponse>('/api/profile/challenge', { method: 'PUT', body: JSON.stringify(body) }),
  getBadges: async () => request<BadgeResponse>('/api/profile/badges'),
  updateBadge: async (body: { id: string; unlocked: boolean }) =>
    request<BadgeResponse>('/api/profile/badges', { method: 'PUT', body: JSON.stringify(body) }),
  listExpenses: async () => request<ExpensesResponse>('/api/expenses'),
  createExpense: async (body: Record<string, unknown>) =>
    request<ExpenseResponse>('/api/expenses', { method: 'POST', body: JSON.stringify(body) }),
  updateExpense: async (id: string, body: Record<string, unknown>) =>
    request<ExpenseResponse>(`/api/expenses/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteExpense: async (id: string) =>
    request(`/api/expenses/${id}`, { method: 'DELETE' }),
  listGoals: async () => request<GoalsResponse>('/api/goals'),
  createGoal: async (body: Record<string, unknown>) =>
    request<GoalResponse>('/api/goals', { method: 'POST', body: JSON.stringify(body) }),
  updateGoal: async (id: string, body: Record<string, unknown>) =>
    request<GoalResponse>(`/api/goals/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteGoal: async (id: string) =>
    request(`/api/goals/${id}`, { method: 'DELETE' }),
  listScenarios: async () => request<ScenariosResponse>('/api/scenarios'),
  createScenario: async (body: Record<string, unknown>) =>
    request<ScenarioResponse>('/api/scenarios', { method: 'POST', body: JSON.stringify(body) }),
  updateScenario: async (id: string, body: Record<string, unknown>) =>
    request<ScenarioResponse>(`/api/scenarios/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteScenario: async (id: string) =>
    request(`/api/scenarios/${id}`, { method: 'DELETE' }),
  getDashboardSummary: async () => request<DashboardSummaryResponse>('/api/dashboard/summary'),
}
