/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useDeferredValue, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type {
  MonteCarloBand,
  MonthPoint,
  ParsedOp,
  ParsedVerb,
  SimPlan,
  TimelineEvent,
} from '../lib/finance'
import { monteCarlo, projectTimeline, projectWithEvents } from '../lib/finance'
import { useAppStore } from '../store'

type PrimaryVerb = Exclude<ParsedVerb, 'unknown'>

type SimCtx = {
  plan: SimPlan
  setPlan: (patch: Partial<SimPlan>) => void
  events: TimelineEvent[]
  addEvents: (events: TimelineEvent[]) => void
  clearEvents: () => void
  resetSimulationSession: () => void
  lastAppliedOps: ParsedOp[]
  lastPrimaryVerb: PrimaryVerb | null
  rememberAppliedOps: (ops: ParsedOp[], primaryVerb?: PrimaryVerb | null) => void
  timeline: MonthPoint[]
  mcBands: MonteCarloBand[]
  activeMonth: number
  setActiveMonth: (m: number) => void
  isPlaying: boolean
  togglePlay: () => void
  speed: number
  setSpeed: (s: number) => void
  showMC: boolean
  setShowMC: (b: boolean) => void
  showReal: boolean
  setShowReal: (b: boolean) => void
}

const Ctx = createContext<SimCtx | null>(null)

const buildInitialPlan = (sip: { monthlyAmount: number; annualReturn: number; durationMonths: number; delayMonths: number }): SimPlan => ({
  monthlyAmount: sip.monthlyAmount,
  annualReturn: sip.annualReturn,
  durationMonths: sip.durationMonths,
  delayMonths: sip.delayMonths,
  inflationRate: 6,
  stepUpRate: 0,
  initialCorpus: 0,
})

export function SimulatorProvider({ children }: { children: ReactNode }) {
  const { sip } = useAppStore()
  const initialPlan = useMemo(() => buildInitialPlan(sip), [sip])

  const [plan, setPlanState] = useState<SimPlan>(initialPlan)
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [lastAppliedOps, setLastAppliedOps] = useState<ParsedOp[]>([])
  const [lastPrimaryVerb, setLastPrimaryVerb] = useState<PrimaryVerb | null>(null)
  const [activeMonth, setActiveMonth] = useState(plan.durationMonths)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [showMC, setShowMC] = useState(false)
  const [showReal, setShowReal] = useState(false)

  const deferredPlan = useDeferredValue(plan)
  const deferredEvents = useDeferredValue(events)
  const clampedActiveMonth = Math.min(activeMonth, plan.durationMonths)

  const timeline = useMemo(
    () =>
      deferredEvents.length > 0
        ? projectWithEvents(deferredPlan, deferredEvents)
        : projectTimeline(deferredPlan),
    [deferredPlan, deferredEvents],
  )

  const mcBands = useMemo(
    () => (showMC ? monteCarlo(deferredPlan, { runs: 300 }, deferredEvents) : []),
    [deferredPlan, deferredEvents, showMC],
  )

  // animation loop
  useEffect(() => {
    if (!isPlaying) return
    let rafId: number
    let last = 0
    let done = false

    const step = (ts: number) => {
      if (done) return
      if (!last) last = ts
      const dt = ts - last
      last = ts

      setActiveMonth((prev) => {
        const next = Math.min(prev + (dt / 1000) * speed * 12, plan.durationMonths)
        if (next >= plan.durationMonths) done = true
        return next
      })

      if (!done) {
        rafId = requestAnimationFrame(step)
      } else {
        setIsPlaying(false)
      }
    }

    rafId = requestAnimationFrame(step)
    return () => {
      done = true
      cancelAnimationFrame(rafId)
    }
  }, [isPlaying, speed, plan.durationMonths])

  const setPlan = useCallback((patch: Partial<SimPlan>) => {
    if (typeof patch.durationMonths === 'number' && !isPlaying) {
      setActiveMonth(patch.durationMonths)
    }
    setPlanState((prev) => ({ ...prev, ...patch }))
  }, [isPlaying])

  const addEvents = useCallback((nextEvents: TimelineEvent[]) => {
    if (nextEvents.length === 0) return
    setEvents((prev) => [...prev, ...nextEvents])
  }, [])

  const clearEvents = useCallback(() => {
    setEvents([])
  }, [])

  const rememberAppliedOps = useCallback(
    (ops: ParsedOp[], primaryVerb?: PrimaryVerb | null) => {
      setLastAppliedOps(ops)
      setLastPrimaryVerb(
        primaryVerb ??
          (ops.find((op) => op.verb !== 'unknown')?.verb as PrimaryVerb | undefined) ??
          null,
      )
    },
    [],
  )

  const resetSimulationSession = useCallback(() => {
    setPlanState(initialPlan)
    setEvents([])
    setLastAppliedOps([])
    setLastPrimaryVerb(null)
    setActiveMonth(initialPlan.durationMonths)
    setIsPlaying(false)
    setSpeed(1)
    setShowMC(false)
    setShowReal(false)
  }, [initialPlan])

  const updateActiveMonth = useCallback((month: number) => {
    setActiveMonth(Math.max(1, Math.min(month, plan.durationMonths)))
  }, [plan.durationMonths])

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      if (!prev) setActiveMonth(1)
      return !prev
    })
  }, [])

  return (
    <Ctx.Provider
      value={{
        plan, setPlan, events, addEvents, clearEvents, resetSimulationSession,
        lastAppliedOps, lastPrimaryVerb, rememberAppliedOps, timeline, mcBands,
        activeMonth: clampedActiveMonth, setActiveMonth: updateActiveMonth, isPlaying, togglePlay,
        speed, setSpeed, showMC, setShowMC, showReal, setShowReal,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export const useSimulator = () => {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useSimulator must be inside SimulatorProvider')
  return ctx
}