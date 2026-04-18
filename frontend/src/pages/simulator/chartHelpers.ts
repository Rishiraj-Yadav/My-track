import { formatCompactINR, formatINR } from '../../lib/finance'

export const simulationYear = (month: number) => Math.max(1, Math.ceil(month / 12))

export const simulationMonthInYear = (month: number) =>
  ((Math.max(1, Math.round(month)) - 1) % 12) + 1

export const formatYearTick = (value: number | string) =>
  `Y${simulationYear(Number(value) || 0)}`

const coerceTooltipValue = (value: unknown) => {
  if (Array.isArray(value)) {
    return Number(value[0] ?? 0)
  }

  return Number(value ?? 0)
}

export const formatCurrencyAxis = (value: unknown) =>
  formatCompactINR(coerceTooltipValue(value)).replace(/^[^\d-]+/, '')

export const formatCurrencyTooltip = (value: unknown) =>
  formatINR(coerceTooltipValue(value))
