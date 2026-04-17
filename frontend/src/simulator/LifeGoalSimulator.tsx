import { Card, Pill } from '../components'
import { formatCompactINR, formatINR, goalETA, percentage } from '../lib/finance'
import { useAppStore } from '../store'
import { useSimulator } from './SimulatorContext'

function ProgressRing({ value, size = 64 }: { value: number; size?: number }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.max(0, Math.min(100, value)) / 100)
  const color = value >= 80 ? '#7dff6c' : value >= 50 ? '#f2c66d' : '#ff7f8a'
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={6} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text
        x={size / 2} y={size / 2 + 5}
        textAnchor="middle"
        fill="white"
        fontSize={12}
        fontWeight={700}
        fontFamily="Space Grotesk, sans-serif"
      >
        {Math.round(value)}%
      </text>
    </svg>
  )
}

export function LifeGoalSimulator() {
  const { goals } = useAppStore()
  const { plan } = useSimulator()

  const goalData = goals.map((g) => {
    const eta = goalETA(g, plan)
    const prog = percentage(g.savedAmount, g.targetAmount)
    const etaYears = eta.monthsToReach !== null ? Math.floor(eta.monthsToReach / 12) : null
    const etaMonths = eta.monthsToReach !== null ? eta.monthsToReach % 12 : null
    return { ...g, eta, prog, etaYears, etaMonths }
  })

  // collision: total required SIPs vs what the current plan allows
  const totalRequired = goalData.reduce((s, g) => s + g.eta.requiredMonthlySIP, 0)
  const collision = totalRequired > plan.monthlyAmount * 1.5

  return (
    <Card className="dashboard-panel dashboard-panel--wide">
      <div className="panel-head">
        <span>Life Goal Simulator</span>
        {collision ? (
          <Pill tone="warning">Goals conflict — SIP too low</Pill>
        ) : (
          <Pill tone="positive">Goals on track</Pill>
        )}
      </div>

      {collision && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 12,
            background: 'rgba(242,198,109,0.08)',
            border: '1px solid rgba(242,198,109,0.2)',
            marginBottom: 16,
            fontSize: '0.9rem',
            color: 'var(--amber)',
          }}
        >
          Combined required SIP is {formatCompactINR(totalRequired)} — raise your monthly
          contribution or extend goal deadlines.
        </div>
      )}

      <div className="goal-grid">
        {goalData.map((g) => (
          <div
            key={g.id}
            className={`goal-eta-card ${g.eta.onTrack ? 'is-on-track' : 'is-off-track'}`}
          >
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 12 }}>
              <ProgressRing value={g.prog} />
              <div style={{ flex: 1 }}>
                <strong style={{ display: 'block', marginBottom: 2 }}>{g.name}</strong>
                <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                  {formatINR(g.savedAmount)} of {formatINR(g.targetAmount)}
                </span>
              </div>
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: 999,
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  background: g.eta.onTrack
                    ? 'rgba(125,255,108,0.1)'
                    : 'rgba(255,127,138,0.1)',
                  color: g.eta.onTrack ? 'var(--green)' : 'var(--red)',
                  border: `1px solid ${g.eta.onTrack ? 'rgba(125,255,108,0.2)' : 'rgba(255,127,138,0.2)'}`,
                }}
              >
                {g.eta.onTrack ? 'On track' : 'Behind'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="sim-kpi" style={{ padding: '10px 12px' }}>
                <span>ETA at current SIP</span>
                <strong style={{ fontSize: '1rem' }}>
                  {g.eta.monthsToReach === null
                    ? 'Never'
                    : g.etaYears! > 0
                    ? `${g.etaYears}y ${g.etaMonths}m`
                    : `${g.eta.monthsToReach}mo`}
                </strong>
              </div>
              <div className="sim-kpi" style={{ padding: '10px 12px' }}>
                <span>Required SIP</span>
                <strong
                  style={{
                    fontSize: '1rem',
                    color: g.eta.onTrack ? 'var(--green)' : 'var(--red)',
                  }}
                >
                  {formatCompactINR(g.eta.requiredMonthlySIP)}/mo
                </strong>
              </div>
            </div>

            {!g.eta.onTrack && (
              <p
                style={{
                  marginTop: 10,
                  fontSize: '0.84rem',
                  color: 'var(--red)',
                  opacity: 0.85,
                }}
              >
                Shortfall: {formatCompactINR(g.eta.shortfall)}/mo — raise SIP or extend deadline
              </p>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}