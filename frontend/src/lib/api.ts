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
      handle: string
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

export type SimulatorNlpParseResponse = {
  ops: Array<{
    verb: 'stop' | 'add' | 'cut' | 'delay' | 'unknown' | 'step_up' | 'pause' | 'lump_sum' | 'withdraw' | 'redirect'
    target?: string
    amount?: number
    originalText?: string
    confidence?: number
    durationMonths?: number
    atMonth?: number
    delayMonths?: number
    stepUpRate?: number
    eventAmount?: number
    inheritedVerb?: 'stop' | 'add' | 'cut' | 'delay' | 'unknown' | 'step_up' | 'pause' | 'lump_sum' | 'withdraw' | 'redirect' | null
    label?: string
  }>
  primaryVerb?: 'stop' | 'add' | 'cut' | 'delay' | 'unknown' | 'step_up' | 'pause' | 'lump_sum' | 'withdraw' | 'redirect' | null
  isAmbiguous: boolean
  alternatives: string[]
  message: string
  model: string
  provider: 'gemini' | 'fallback'
  configured: boolean
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

export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY) ?? ''

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

async function requestWithRefresh<T>(path: string, options: RequestInit = {}) {
  try {
    return await request<T>(path, options)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed'
    const shouldRefresh = message.toLowerCase().includes('jwt expired')
    if (!shouldRefresh) throw error

    const refreshToken = getRefreshToken()
    if (!refreshToken) throw error

    const refreshed = await request<BootstrapPayload>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }, '')
    setTokens(refreshed.accessToken, refreshed.refreshToken)
    return request<T>(path, options)
  }
}

export const api = {
  bootstrap: async (): Promise<ApiResponse<BootstrapPayload>> =>
    request('/api/bootstrap', {
      method: 'POST',
      body: JSON.stringify({ sessionId: getSessionId() }),
    }, ''),

  getMe: async () => requestWithRefresh<{ user: BootstrapPayload['user'] }>('/api/auth/me'),

  getProfile: async () => requestWithRefresh<ProfileResponse>('/api/profile'),
  updateProfile: async (body: Record<string, unknown>) =>
    requestWithRefresh<ProfileResponse>('/api/profile', { method: 'PUT', body: JSON.stringify(body) }),
  getSip: async () => requestWithRefresh<SipResponse>('/api/profile/sip'),
  updateSip: async (body: Record<string, unknown>) =>
    requestWithRefresh<SipResponse>('/api/profile/sip', { method: 'PUT', body: JSON.stringify(body) }),
  getWhatIf: async () => requestWithRefresh<WhatIfResponse>('/api/profile/what-if'),
  updateWhatIf: async (whatIf: string) =>
    requestWithRefresh<WhatIfResponse>('/api/profile/what-if', { method: 'PUT', body: JSON.stringify({ whatIf }) }),
  getChallenge: async () => requestWithRefresh<ChallengeResponse>('/api/profile/challenge'),
  updateChallenge: async (body: Record<string, unknown>) =>
    requestWithRefresh<ChallengeResponse>('/api/profile/challenge', { method: 'PUT', body: JSON.stringify(body) }),
  getBadges: async () => requestWithRefresh<BadgeResponse>('/api/profile/badges'),
  updateBadge: async (body: { id: string; unlocked: boolean }) =>
    requestWithRefresh<BadgeResponse>('/api/profile/badges', { method: 'PUT', body: JSON.stringify(body) }),
  listExpenses: async () => requestWithRefresh<ExpensesResponse>('/api/expenses'),
  createExpense: async (body: Record<string, unknown>) =>
    requestWithRefresh<ExpenseResponse>('/api/expenses', { method: 'POST', body: JSON.stringify(body) }),
  updateExpense: async (id: string, body: Record<string, unknown>) =>
    requestWithRefresh<ExpenseResponse>(`/api/expenses/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteExpense: async (id: string) =>
    requestWithRefresh(`/api/expenses/${id}`, { method: 'DELETE' }),
  listGoals: async () => requestWithRefresh<GoalsResponse>('/api/goals'),
  createGoal: async (body: Record<string, unknown>) =>
    requestWithRefresh<GoalResponse>('/api/goals', { method: 'POST', body: JSON.stringify(body) }),
  updateGoal: async (id: string, body: Record<string, unknown>) =>
    requestWithRefresh<GoalResponse>(`/api/goals/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteGoal: async (id: string) =>
    requestWithRefresh(`/api/goals/${id}`, { method: 'DELETE' }),
  listScenarios: async () => requestWithRefresh<ScenariosResponse>('/api/scenarios'),
  createScenario: async (body: Record<string, unknown>) =>
    requestWithRefresh<ScenarioResponse>('/api/scenarios', { method: 'POST', body: JSON.stringify(body) }),
  updateScenario: async (id: string, body: Record<string, unknown>) =>
    requestWithRefresh<ScenarioResponse>(`/api/scenarios/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteScenario: async (id: string) =>
    requestWithRefresh(`/api/scenarios/${id}`, { method: 'DELETE' }),
  getDashboardSummary: async () => requestWithRefresh<DashboardSummaryResponse>('/api/dashboard/summary'),
  parseSimulatorCommand: async (command: string) =>
    requestWithRefresh<SimulatorNlpParseResponse>('/api/simulator/nlp/parse', {
      method: 'POST',
      body: JSON.stringify({ command }),
    }),

  // Auth
  login: async (email: string, password: string) =>
    request<BootstrapPayload>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }, ''),

  register: async (email: string, password: string, name: string) =>
    request<BootstrapPayload>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }, ''),

  // Tier
  getTier: async () => requestWithRefresh<{ tier: string }>('/api/profile/tier'),
  updateTier: async (tier: string) =>
    requestWithRefresh<{ tier: string }>('/api/profile/tier', {
      method: 'PUT',
      body: JSON.stringify({ tier }),
    }),

  // Payments
  createPaymentOrder: async (tierName: string, amount: number) =>
    requestWithRefresh<{ success: boolean; order: { id: string; amount: number; currency: string } }>('/api/payments/create-order', {
      method: 'POST',
      body: JSON.stringify({ tierName, amount }),
    }),

  verifyPayment: async (payload: { razorpay_payment_id?: string; razorpay_order_id?: string; razorpay_signature?: string; status?: string; newTier: string }) =>
    requestWithRefresh<{ success: boolean }>('/api/payments/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
}
