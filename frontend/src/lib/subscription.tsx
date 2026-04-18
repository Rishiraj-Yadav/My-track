import { useState, useCallback, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

// ─── Tier Types ───────────────────────────────────────────────────
export type Tier = 'starter' | 'architect' | 'strategist'

export type Feature =
  | 'unlimited_expenses'
  | 'unlimited_goals'
  | 'unlimited_scenarios'
  | 'ai_insights'
  | 'category_breakdown'
  | 'monte_carlo'
  | 'export_reports'
  | 'custom_challenges'
  | 'family_mode'
  | 'unlimited_history'
  | 'multi_portfolio'
  | 'tax_optimizer'
  | 'goal_auto_allocate'
  | 'zerodha_sync'
  | 'nlp_advanced'
  | 'white_label_reports'

// ─── Tier Limits ──────────────────────────────────────────────────
export const TIER_LIMITS: Record<Tier, {
  maxExpenses: number
  maxGoals: number
  maxScenarios: number
  historyMonths: number
  features: Feature[]
}> = {
  starter: {
    maxExpenses: 15,
    maxGoals: 2,
    maxScenarios: 1,
    historyMonths: 3,
    features: ['category_breakdown'],
  },
  architect: {
    maxExpenses: Infinity,
    maxGoals: Infinity,
    maxScenarios: Infinity,
    historyMonths: Infinity,
    features: [
      'unlimited_expenses',
      'unlimited_goals',
      'unlimited_scenarios',
      'ai_insights',
      'category_breakdown',
      'monte_carlo',
      'export_reports',
      'custom_challenges',
      'family_mode',
      'unlimited_history',
    ],
  },
  strategist: {
    maxExpenses: Infinity,
    maxGoals: Infinity,
    maxScenarios: Infinity,
    historyMonths: Infinity,
    features: [
      'unlimited_expenses',
      'unlimited_goals',
      'unlimited_scenarios',
      'ai_insights',
      'category_breakdown',
      'monte_carlo',
      'export_reports',
      'custom_challenges',
      'family_mode',
      'unlimited_history',
      'multi_portfolio',
      'tax_optimizer',
      'goal_auto_allocate',
      'zerodha_sync',
      'nlp_advanced',
      'white_label_reports',
    ],
  },
}

// ─── Tier Storage ─────────────────────────────────────────────────
const TIER_KEY = 'mytracker-tier'

export const getTier = (): Tier => {
  const stored = localStorage.getItem(TIER_KEY)
  if (stored === 'architect' || stored === 'strategist') return stored
  return 'starter'
}

export const setTier = (tier: Tier) => {
  localStorage.setItem(TIER_KEY, tier)
}

// ─── Hook ─────────────────────────────────────────────────────────
export const useTier = () => {
  const [tier, _setTier] = useState<Tier>(getTier)

  const changeTier = useCallback((newTier: Tier) => {
    setTier(newTier)
    _setTier(newTier)
  }, [])

  const canAccess = useCallback(
    (feature: Feature) => TIER_LIMITS[tier].features.includes(feature),
    [tier],
  )

  const tierName = tier === 'starter' ? 'Starter' : tier === 'architect' ? 'Architect' : 'Strategist'

  return { tier, tierName, changeTier, canAccess, limits: TIER_LIMITS[tier] }
}

// ─── Feature Labels ───────────────────────────────────────────────
const FEATURE_LABELS: Record<Feature, { name: string; minTier: Tier }> = {
  unlimited_expenses: { name: 'Unlimited Expenses', minTier: 'architect' },
  unlimited_goals: { name: 'Unlimited Goals', minTier: 'architect' },
  unlimited_scenarios: { name: 'Unlimited Scenarios', minTier: 'architect' },
  ai_insights: { name: 'AI Spending Insights', minTier: 'architect' },
  category_breakdown: { name: 'Category Breakdown', minTier: 'starter' },
  monte_carlo: { name: 'Monte Carlo Projections', minTier: 'architect' },
  export_reports: { name: 'Export Reports', minTier: 'architect' },
  custom_challenges: { name: 'Custom Challenges', minTier: 'architect' },
  family_mode: { name: 'Family Mode', minTier: 'architect' },
  unlimited_history: { name: 'Unlimited History', minTier: 'architect' },
  multi_portfolio: { name: 'Multi-Portfolio Tracking', minTier: 'strategist' },
  tax_optimizer: { name: 'Tax Optimizer', minTier: 'strategist' },
  goal_auto_allocate: { name: 'Goal Auto-Allocation', minTier: 'strategist' },
  zerodha_sync: { name: 'Zerodha / Groww Sync', minTier: 'strategist' },
  nlp_advanced: { name: 'Advanced NLP Console', minTier: 'strategist' },
  white_label_reports: { name: 'White-label Reports', minTier: 'strategist' },
}

// ─── Gate Component ───────────────────────────────────────────────
type UpgradeGateProps = {
  feature: Feature
  children: ReactNode
  blur?: boolean
}

export function UpgradeGate({ feature, children, blur = true }: UpgradeGateProps) {
  const { canAccess } = useTier()

  if (canAccess(feature)) {
    return <>{children}</>
  }

  const meta = FEATURE_LABELS[feature]
  const tierLabel = meta.minTier === 'architect' ? 'Architect' : 'Strategist'

  return (
    <div className="relative">
      <div className={blur ? 'blur-sm pointer-events-none select-none opacity-60' : 'pointer-events-none select-none opacity-40'}>
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="bg-surface-container-low/95 backdrop-blur-xl rounded-2xl p-8 border border-outline-variant/20 shadow-[0_30px_60px_rgba(0,0,0,0.5)] text-center max-w-sm">
          <span className="material-symbols-outlined text-4xl text-secondary mb-4 block" style={{ fontVariationSettings: "'FILL' 1" }}>
            workspace_premium
          </span>
          <h3 className="font-headline text-xl font-bold text-on-surface mb-2">
            {meta.name}
          </h3>
          <p className="font-body text-sm text-on-surface-variant mb-6">
            This feature requires the <span className="text-primary font-semibold">{tierLabel}</span> plan or above.
          </p>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-fixed-dim text-on-primary font-headline font-bold text-sm shadow-[0_10px_20px_rgba(78,222,163,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-base">rocket_launch</span>
            Upgrade to {tierLabel}
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Tier Badge ───────────────────────────────────────────────────
export function TierBadge() {
  const { tier, tierName } = useTier()

  const colors = {
    starter: 'bg-surface-variant text-on-surface-variant',
    architect: 'bg-primary/15 text-primary',
    strategist: 'bg-secondary/15 text-secondary',
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${colors[tier]}`}>
      {tier !== 'starter' && (
        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
          workspace_premium
        </span>
      )}
      {tierName}
    </span>
  )
}
