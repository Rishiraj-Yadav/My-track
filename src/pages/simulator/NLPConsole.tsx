import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, Check, RotateCcw, WandSparkles } from 'lucide-react'
import { Card } from '../../components'
import {
  buildCommandSuggestions,
  formatCompactINR,
  parseMultiOp,
  projectTimeline,
  projectWithEvents,
  type MultiOpResult,
  type ParsedOp,
  type ParsedVerb,
  type SimPlan,
  type TimelineEvent,
} from '../../lib/finance'
import { useAppStore } from '../../store'
import { useSimulator } from './SimulatorContext'

type PrimaryVerb = Exclude<ParsedVerb, 'unknown'>

const VERB_META: Record<ParsedOp['verb'], { label: string; tone: string }> = {
  stop: { label: 'Stop', tone: 'danger' },
  add: { label: 'Add', tone: 'success' },
  cut: { label: 'Cut', tone: 'warning' },
  delay: { label: 'Delay', tone: 'info' },
  step_up: { label: 'Step Up', tone: 'accent' },
  lump_sum: { label: 'Lump Sum', tone: 'info' },
  pause: { label: 'Pause', tone: 'warning' },
  withdraw: { label: 'Withdraw', tone: 'danger' },
  redirect: { label: 'Redirect', tone: 'success' },
  unknown: { label: 'Unknown', tone: 'neutral' },
}

type HistoryEntry = {
  id: string
  command: string
  monthlyDelta: number
  nextSipAmount: number
  opCount: number
  confidence: number
  eventCount: number
  appliedAt: number
}

type ApplyPlan = {
  patch: Partial<SimPlan>
  events: TimelineEvent[]
  monthlyDelta: number
  previewOnlyOps: ParsedOp[]
}

const averageConfidence = (ops: ParsedOp[]) =>
  ops.length === 0
    ? 0
    : ops.reduce((total, op) => total + op.confidence, 0) / ops.length

const isUnsupportedOp = (op: ParsedOp) => op.verb === 'unknown'

function buildApplyPlan(result: MultiOpResult | null, plan: SimPlan): ApplyPlan {
  if (!result) {
    return { patch: {}, events: [], monthlyDelta: 0, previewOnlyOps: [] }
  }

  let monthlyDelta = 0
  const patch: Partial<SimPlan> = {}
  const events: TimelineEvent[] = []
  const previewOnlyOps: ParsedOp[] = []

  for (const op of result.ops) {
    if (isUnsupportedOp(op)) {
      previewOnlyOps.push(op)
      continue
    }

    if (op.verb === 'stop' || op.verb === 'redirect') {
      if (op.durationMonths && op.amount > 0) {
        for (let offset = 0; offset < op.durationMonths; offset++) {
          events.push({
            type: 'topup',
            atMonth: (op.atMonth ?? 1) + offset,
            amount: op.amount,
          })
        }
      } else {
        monthlyDelta += op.amount
      }
      continue
    }

    if (op.verb === 'add' || op.verb === 'cut') {
      monthlyDelta += op.amount
      continue
    }

    if (op.verb === 'delay' && op.delayMonths !== undefined) {
      patch.delayMonths = op.delayMonths
      continue
    }

    if (op.verb === 'step_up' && op.stepUpRate !== undefined) {
      if (op.atMonth && op.atMonth > 1) {
        events.push({
          type: 'stepUp',
          atMonth: op.atMonth,
          rate: op.stepUpRate,
        })
      } else {
        patch.stepUpRate = op.stepUpRate
      }
      continue
    }

    if (op.verb === 'pause') {
      events.push({
        type: 'pause',
        atMonth: op.atMonth ?? 1,
        durationMonths: op.durationMonths ?? 1,
      })
      continue
    }

    if (op.verb === 'lump_sum' && op.eventAmount) {
      events.push({
        type: 'lumpSum',
        atMonth: op.atMonth ?? 1,
        amount: op.eventAmount,
      })
      continue
    }

    if (op.verb === 'withdraw' && op.eventAmount) {
      events.push({
        type: 'withdraw',
        atMonth: op.atMonth ?? 1,
        amount: op.eventAmount,
      })
      continue
    }

    previewOnlyOps.push(op)
  }

  if (monthlyDelta !== 0) {
    patch.monthlyAmount = Math.max(0, plan.monthlyAmount + monthlyDelta)
  }

  return { patch, events, monthlyDelta, previewOnlyOps }
}

function confidenceLabel(value: number) {
  if (value >= 0.85) return 'High confidence'
  if (value >= 0.6) return 'Review once'
  if (value > 0) return 'Low confidence'
  return 'No signal'
}

function formatHistoryTime(value: number) {
  return new Date(value).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function ConfidenceBar({ value, label }: { value: number; label: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100)
  const toneClass =
    pct >= 80 ? 'is-strong' : pct >= 55 ? 'is-medium' : pct > 0 ? 'is-weak' : 'is-empty'

  return (
    <div className={`nlp-confidence ${toneClass}`}>
      <div className="nlp-confidence__label">
        <span>{label}</span>
        <strong>{pct}%</strong>
      </div>
      <div className="nlp-confidence__track">
        <div className="nlp-confidence__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function OpCard({ op }: { op: ParsedOp }) {
  const meta = VERB_META[op.verb]

  return (
    <article className={`nlp-op-card nlp-op-card--${meta.tone}`}>
      <div className="nlp-op-card__header">
        <div className="nlp-op-card__chips">
          <span className={`nlp-chip nlp-chip--${meta.tone}`}>{meta.label}</span>
          <span className="nlp-chip nlp-chip--target">{op.target}</span>
          {op.amount !== 0 ? (
            <span className="nlp-chip nlp-chip--detail">
              {op.amount > 0 ? '+' : ''}
              {formatCompactINR(op.amount)}/mo
            </span>
          ) : null}
          {op.eventAmount ? (
            <span className="nlp-chip nlp-chip--detail">{formatCompactINR(op.eventAmount)}</span>
          ) : null}
          {op.delayMonths !== undefined ? (
            <span className="nlp-chip nlp-chip--detail">{op.delayMonths} mo delay</span>
          ) : null}
          {op.stepUpRate !== undefined ? (
            <span className="nlp-chip nlp-chip--detail">{op.stepUpRate}% yearly</span>
          ) : null}
          {op.durationMonths !== undefined ? (
            <span className="nlp-chip nlp-chip--detail">for {op.durationMonths} mo</span>
          ) : null}
          {op.atMonth !== undefined ? (
            <span className="nlp-chip nlp-chip--detail">M{op.atMonth}</span>
          ) : null}
          {op.inheritedVerb ? (
            <span className="nlp-chip nlp-chip--detail">verb inherited</span>
          ) : null}
        </div>
        <span className="nlp-op-card__score">{Math.round(op.confidence * 100)}%</span>
      </div>
      <p className="nlp-op-card__copy">{op.label}</p>
      <ConfidenceBar value={op.confidence} label={confidenceLabel(op.confidence)} />
      {isUnsupportedOp(op) ? (
        <p className="nlp-op-card__hint">
          This phrase is still preview-only. The console will not guess and apply it blindly.
        </p>
      ) : null}
    </article>
  )
}

function ImpactSummary({
  plan,
  events,
  applyPlan,
}: {
  plan: SimPlan
  events: TimelineEvent[]
  applyPlan: ApplyPlan
}) {
  if (Object.keys(applyPlan.patch).length === 0 && applyPlan.events.length === 0) {
    return null
  }

  const nextPlan: SimPlan = { ...plan, ...applyPlan.patch }
  const currentTimeline =
    events.length > 0 ? projectWithEvents(plan, events) : projectTimeline(plan)
  const nextEvents = [...events, ...applyPlan.events]
  const nextTimeline =
    nextEvents.length > 0 ? projectWithEvents(nextPlan, nextEvents) : projectTimeline(nextPlan)
  const currentCorpus = currentTimeline.at(-1)?.corpus ?? 0
  const nextCorpus = nextTimeline.at(-1)?.corpus ?? 0
  const corpusDelta = nextCorpus - currentCorpus
  const nextSipAmount = nextPlan.monthlyAmount

  return (
    <div className="nlp-impact">
      <div className="nlp-impact__item">
        <span>Monthly SIP change</span>
        <strong className={applyPlan.monthlyDelta >= 0 ? 'is-positive' : 'is-negative'}>
          {applyPlan.monthlyDelta >= 0 ? '+' : ''}
          {formatCompactINR(applyPlan.monthlyDelta)}/mo
        </strong>
      </div>
      <div className="nlp-impact__item">
        <span>New SIP total</span>
        <strong>{formatCompactINR(nextSipAmount)}/mo</strong>
      </div>
      <div className="nlp-impact__item">
        <span>Scheduled events</span>
        <strong>{applyPlan.events.length}</strong>
      </div>
      <div className="nlp-impact__item">
        <span>Projected corpus delta</span>
        <strong className={corpusDelta >= 0 ? 'is-positive' : 'is-negative'}>
          {corpusDelta >= 0 ? '+' : ''}
          {formatCompactINR(corpusDelta)}
        </strong>
      </div>
    </div>
  )
}

function HistoryList({
  items,
  onReuse,
  onClear,
  onResetSession,
}: {
  items: HistoryEntry[]
  onReuse: (command: string) => void
  onClear: () => void
  onResetSession: () => void
}) {
  return (
    <section className="nlp-history">
      <div className="nlp-history__header">
        <div>
          <span className="nlp-section-label">Command history</span>
          <p className="panel-copy">Last applied simulator-safe commands.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="speed-btn" onClick={onResetSession}>
            Reset session
          </button>
          {items.length > 0 ? (
            <button className="speed-btn" onClick={onClear}>
              Clear history
            </button>
          ) : null}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="nlp-empty">
          <strong>No command history yet</strong>
          <p>Applied commands will appear here so you can quickly restore them into the console.</p>
        </div>
      ) : (
        <div className="nlp-history__list">
          {items.map((item) => (
            <article key={item.id} className="nlp-history__item">
              <div className="nlp-history__top">
                <strong>{item.command}</strong>
                <button className="speed-btn" onClick={() => onReuse(item.command)}>
                  Reuse
                </button>
              </div>
              <div className="nlp-history__meta">
                <span>{item.opCount} ops</span>
                <span>{item.eventCount} events</span>
                <span>{Math.round(item.confidence * 100)}% confidence</span>
                <span>
                  {item.monthlyDelta >= 0 ? '+' : ''}
                  {formatCompactINR(item.monthlyDelta)}/mo
                </span>
                <span>{formatCompactINR(item.nextSipAmount)}/mo total</span>
                <span>{formatHistoryTime(item.appliedAt)}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export function NLPConsole() {
  const { expenses } = useAppStore()
  const {
    plan,
    setPlan,
    events,
    addEvents,
    resetSimulationSession,
    lastAppliedOps,
    lastPrimaryVerb,
    rememberAppliedOps,
  } = useSimulator()
  const inputRef = useRef<HTMLInputElement>(null)
  const timeoutRef = useRef<number | null>(null)

  const [command, setCommand] = useState('')
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [flashMessage, setFlashMessage] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const commandSuggestions = useMemo(() => buildCommandSuggestions(expenses), [expenses])

  const result = useMemo(
    () =>
      command.trim()
        ? parseMultiOp(command, expenses, plan.monthlyAmount, {
            lastAppliedOps,
            lastPrimaryVerb,
          })
        : null,
    [command, expenses, plan.monthlyAmount, lastAppliedOps, lastPrimaryVerb],
  )

  const applyPlan = useMemo(() => buildApplyPlan(result, plan), [result, plan])
  const overallConfidence = useMemo(() => averageConfidence(result?.ops ?? []), [result])

  const hasParsedOps = (result?.ops.length ?? 0) > 0
  const hasUnknownOps = (result?.ops ?? []).some((op) => op.verb === 'unknown')
  const hasPendingChanges =
    Object.keys(applyPlan.patch).length > 0 || applyPlan.events.length > 0
  const canApply = hasPendingChanges && applyPlan.previewOnlyOps.length === 0 && !hasUnknownOps

  function focusInput() {
    inputRef.current?.focus()
  }

  function loadCommand(nextCommand: string) {
    setCommand(nextCommand)
    setFlashMessage(null)
    focusInput()
  }

  function clearCommand() {
    setCommand('')
    setFlashMessage(null)
    focusInput()
  }

  function handleApply() {
    if (!result || !canApply) return

    const nextPlan: Partial<SimPlan> = { ...applyPlan.patch }
    const nextSipAmount = nextPlan.monthlyAmount ?? plan.monthlyAmount

    if (Object.keys(nextPlan).length > 0) {
      setPlan(nextPlan)
    }
    if (applyPlan.events.length > 0) {
      addEvents(applyPlan.events)
    }
    rememberAppliedOps(result.ops, result.primaryVerb as PrimaryVerb | null)

    setHistory((prev) =>
      [
        {
          id: `${Date.now()}`,
          command,
          monthlyDelta: applyPlan.monthlyDelta,
          nextSipAmount,
          opCount: result.ops.length,
          confidence: overallConfidence,
          eventCount: applyPlan.events.length,
          appliedAt: Date.now(),
        },
        ...prev,
      ].slice(0, 8),
    )

    setCommand('')
    setFlashMessage('Applied to simulator')

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = window.setTimeout(() => {
      setFlashMessage(null)
      focusInput()
    }, 1600)
  }

  function handleResetSession() {
    resetSimulationSession()
    setHistory([])
    setCommand('')
    setFlashMessage('Session reset')

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = window.setTimeout(() => {
      setFlashMessage(null)
      focusInput()
    }, 1600)
  }

  return (
    <Card className="dashboard-panel dashboard-panel--wide">
      <div className="panel-head">
        <div>
          <span className="nlp-console__title">NLP command console</span>
          <p className="panel-copy">
            Chain multiple actions, inspect the parse, and apply recurring changes and scheduled
            events directly into the simulator session.
          </p>
        </div>
        <div className="nlp-status-row">
          <span className="nlp-status">Multi-op</span>
          <span className="nlp-status">Confidence preview</span>
          <span className="nlp-status">History</span>
        </div>
      </div>

      <div className="nlp-shell">
        <div className="nlp-main">
          <section className="nlp-composer">
            <div className="nlp-input-wrap">
              <div className="nlp-input-shell">
                <WandSparkles size={16} />
                <input
                  ref={inputRef}
                  className="text-input"
                  placeholder='Try "stop swiggy and add rs 3000 sip"'
                  value={command}
                  onChange={(event) => {
                    setCommand(event.target.value)
                    setFlashMessage(null)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      handleApply()
                    }
                  }}
                />
              </div>
              <div className="nlp-input-actions">
                <button className="button button--secondary" onClick={clearCommand}>
                  Clear
                </button>
                <button className="button button--primary" onClick={handleApply} disabled={!canApply}>
                  Apply
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>

            <div className="nlp-chips">
              {commandSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  className="nlp-chip nlp-chip--suggestion"
                  onClick={() => loadCommand(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {flashMessage ? (
              <div className="nlp-notice nlp-notice--success">
                {flashMessage === 'Session reset' ? <RotateCcw size={16} /> : <Check size={16} />}
                <span>{flashMessage}</span>
              </div>
            ) : null}
          </section>

          {!command.trim() ? (
            <section className="nlp-empty">
              <strong>Start with one habit change</strong>
              <p>
                The console breaks the command into operations, scores confidence, and shows the
                simulator-ready impact before anything is applied.
              </p>
            </section>
          ) : null}

          {hasParsedOps ? (
            <section className="nlp-preview">
              <div className="nlp-preview__header">
                <div>
                  <span className="nlp-section-label">Parse preview</span>
                  <p className="panel-copy">
                    {result?.ops.length} operation{result?.ops.length === 1 ? '' : 's'} detected
                    from the current command.
                  </p>
                </div>
                <div className="nlp-preview__stats">
                  <span className="nlp-stat">{result?.ops.length} ops</span>
                  <span className="nlp-stat">{Math.round(overallConfidence * 100)}% avg</span>
                  <span className="nlp-stat">{applyPlan.events.length} events</span>
                  {result?.primaryVerb ? <span className="nlp-stat">{result.primaryVerb}</span> : null}
                </div>
              </div>

              <ConfidenceBar
                value={overallConfidence}
                label={`Overall parser confidence - ${confidenceLabel(overallConfidence)}`}
              />

              {applyPlan.previewOnlyOps.length > 0 ? (
                <div className="nlp-notice nlp-notice--warning">
                  <span>
                    Unsupported clauses stay in preview mode. Review the low-confidence pieces
                    before applying.
                  </span>
                </div>
              ) : null}

              {result?.isAmbiguous && result.alternatives.length > 0 ? (
                <div className="nlp-notice nlp-notice--warning">
                  <span>Low-confidence parse. Try one of these clearer commands instead.</span>
                  <div className="nlp-chips">
                    {result.alternatives.map((alternative) => (
                      <button
                        key={alternative}
                        className="nlp-chip nlp-chip--suggestion"
                        onClick={() => loadCommand(alternative)}
                      >
                        {alternative}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="nlp-op-list">
                {result?.ops.map((op, index) => (
                  <OpCard key={`${op.verb}-${op.target}-${index}`} op={op} />
                ))}
              </div>

              <ImpactSummary plan={plan} events={events} applyPlan={applyPlan} />
            </section>
          ) : null}
        </div>

        <HistoryList
          items={history}
          onReuse={loadCommand}
          onClear={() => setHistory([])}
          onResetSession={handleResetSession}
        />
      </div>
    </Card>
  )
}
