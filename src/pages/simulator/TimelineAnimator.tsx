import { Pause, Play, SkipBack } from 'lucide-react'
import { formatCompactINR, formatINR } from '../../lib/finance'
import { simulationMonthInYear, simulationYear } from './chartHelpers'
import { useSimulator } from './SimulatorContext'

const SPEEDS = [0.5, 1, 2] as const

export function TimelineAnimator() {
  const { plan, timeline, activeMonth, setActiveMonth, isPlaying, togglePlay, speed, setSpeed } =
    useSimulator()

  const displayMonth = Math.min(Math.max(1, Math.round(activeMonth)), plan.durationMonths)
  const point = timeline[displayMonth - 1]
  const yearDisplay = `Year ${simulationYear(displayMonth)}  Month ${simulationMonthInYear(displayMonth)}`

  function reset() {
    setActiveMonth(1)
  }

  return (
    <div className="timeline-animator">
      <div className="timeline-animator__controls">
        <button className="icon-btn" style={{ width: 36, minHeight: 36 }} onClick={reset} title="Reset">
          <SkipBack size={14} />
        </button>
        <button className="play-btn" onClick={togglePlay} title={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
        </button>
        <div style={{ display: 'flex', gap: 4 }}>
          {SPEEDS.map((speedValue) => (
            <button
              key={speedValue}
              className={`speed-btn ${speed === speedValue ? 'is-active' : ''}`}
              onClick={() => setSpeed(speedValue)}
            >
              {speedValue}x
            </button>
          ))}
        </div>
      </div>

      <div className="timeline-animator__scrubber">
        <input
          type="range"
          min={1}
          max={plan.durationMonths}
          step={1}
          value={displayMonth}
          onChange={(event) => setActiveMonth(Number(event.target.value))}
          style={{
            width: '100%',
            appearance: 'none',
            height: 6,
            borderRadius: 999,
            background: `linear-gradient(to right, var(--teal) ${(displayMonth / plan.durationMonths) * 100}%, rgba(255,255,255,0.12) 0%)`,
            outline: 'none',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          {Array.from({ length: Math.min(plan.durationMonths / 12, 10) + 1 }, (_, index) => {
            const years = Math.round(
              (index / Math.min(plan.durationMonths / 12, 10)) * (plan.durationMonths / 12),
            )
            return (
              <span key={index} style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                Y{Math.max(1, years)}
              </span>
            )
          })}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          minWidth: 140,
          gap: 2,
        }}
      >
        <strong
          style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: '1.25rem',
            letterSpacing: '-0.04em',
            color: 'var(--teal)',
          }}
        >
          {formatCompactINR(point?.corpus ?? 0)}
        </strong>
        <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{yearDisplay}</span>
        {point ? (
          <span style={{ fontSize: '0.75rem', color: 'var(--green)' }}>
            +{formatINR(point.interest, 0)} gains
          </span>
        ) : null}
      </div>
    </div>
  )
}
