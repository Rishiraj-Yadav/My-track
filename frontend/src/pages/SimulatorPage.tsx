import { useState, useMemo } from 'react'
import {
  Area,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { PageFrame } from '../components'
import { formatCompactINR, formatINR } from '../lib/finance'

// Compute compounding over N years
function computeTrajectory(initial: number, monthly: number, rate: number, years: number) {
  const points = []
  let corpus = initial
  const monthlyRate = rate / 12 / 100

  for (let m = 0; m <= years * 12; m++) {
    if (m > 0) {
      corpus = (corpus + monthly) * (1 + monthlyRate)
    }
    
    if (m % 12 === 0) {
      points.push({
        year: m / 12,
        label: `Year ${m / 12}`,
        value: Math.round(corpus)
      })
    }
  }
  return points
}

export function SimulatorPage() {
  const [initialCapital, setInitialCapital] = useState('1000000')
  const [monthlyAddition, setMonthlyAddition] = useState('50000')
  const [horizon, setHorizon] = useState('10') // years
  const [returnRate, setReturnRate] = useState('12.5') // percentage
  
  const parsedInitial = Number(initialCapital) || 0
  const parsedMonthly = Number(monthlyAddition) || 0
  const parsedHorizon = Number(horizon) || 0
  const parsedRate = Number(returnRate) || 0
  
  const statusQuoRate = 4.0 // Assuming status quo is a basic savings account
  
  const chartData = useMemo(() => {
    const optimized = computeTrajectory(parsedInitial, parsedMonthly, parsedRate, parsedHorizon)
    const statusQuo = computeTrajectory(parsedInitial, parsedMonthly, statusQuoRate, parsedHorizon)
    
    return optimized.map((opt, i) => ({
      label: opt.label,
      optimized: opt.value,
      statusQuo: statusQuo[i]?.value || 0,
      gap: opt.value - (statusQuo[i]?.value || 0)
    }))
  }, [parsedInitial, parsedMonthly, parsedRate, parsedHorizon])
  
  const finalOptimized = chartData[chartData.length - 1]?.optimized || 0
  const finalStatusQuo = chartData[chartData.length - 1]?.statusQuo || 0
  const finalGap = chartData[chartData.length - 1]?.gap || 0
  
  // Calculate cost per minute of delay (theoretical)
  const lossPerMinute = (finalGap / (parsedHorizon * 365 * 24 * 60)) || 0

  return (
    <PageFrame>
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:24px_24px] pointer-events-none opacity-50 z-0"></div>
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-primary/5 to-transparent blur-3xl pointer-events-none z-0"></div>
      
      <div className="relative z-10">
        {/* Header Section */}
        <header className="flex flex-col gap-3 mb-12">
          <p className="font-body text-secondary text-xs font-semibold tracking-[0.2em] uppercase">Simulation Analysis</p>
          <h2 className="font-headline text-5xl lg:text-7xl font-extrabold tracking-tight text-on-surface drop-shadow-sm">
            You are giving up <span className="text-tertiary font-black drop-shadow-[0_0_15px_rgba(255,179,173,0.3)]">${formatCompactINR(finalGap).replace('₹', '')}</span>
          </h2>
          <p className="font-body text-on-surface-variant text-lg max-w-2xl mt-4 leading-relaxed font-light">
            Projected over a {parsedHorizon}-year horizon, your current idle capital is experiencing significant opportunity leakage relative to our proposed market index strategy.
          </p>
        </header>

        {/* Asymmetric Layout Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Inputs */}
          <div className="xl:col-span-4 flex flex-col gap-10 bg-surface-container-low/40 backdrop-blur-2xl rounded-[2rem] p-10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none"></div>
            <h3 className="font-headline text-2xl font-bold text-on-surface mb-2 tracking-tight">Parameters</h3>
            
            {/* Input: Amount */}
            <div className="flex flex-col gap-3 relative z-10">
              <label className="font-label text-xs font-semibold text-on-surface-variant uppercase tracking-[0.15em]">Initial Capital</label>
              <div className="relative border-b border-white/10 pb-3 group focus-within:border-primary transition-colors">
                <span className="absolute left-0 bottom-4 text-on-surface-variant font-headline text-3xl font-light">$</span>
                <input 
                  className="w-full bg-transparent border-none focus:ring-0 text-on-surface font-headline font-black text-4xl pl-8 p-0 outline-none tracking-tight transition-colors" 
                  type="number" 
                  value={initialCapital}
                  onChange={(e) => setInitialCapital(e.target.value)}
                />
              </div>
            </div>
            
            {/* Input: Frequency */}
            <div className="flex flex-col gap-3 mt-4 relative z-10">
              <label className="font-label text-xs font-semibold text-on-surface-variant uppercase tracking-[0.15em]">Monthly Addition</label>
              <div className="relative border-b border-white/10 pb-3 group focus-within:border-primary transition-colors">
                <span className="absolute left-0 bottom-4 text-on-surface-variant font-headline text-3xl font-light">$</span>
                <input 
                  className="w-full bg-transparent border-none focus:ring-0 text-on-surface font-headline font-black text-4xl pl-8 p-0 outline-none tracking-tight transition-colors" 
                  type="number" 
                  value={monthlyAddition}
                  onChange={(e) => setMonthlyAddition(e.target.value)}
                />
              </div>
            </div>
            
            {/* Input: Duration Slider */}
            <div className="flex flex-col gap-4 mt-6 relative z-10">
              <div className="flex justify-between items-end border-b border-white/10 pb-3 group focus-within:border-primary transition-colors">
                <label className="font-label text-xs font-semibold text-on-surface-variant uppercase tracking-[0.15em] pb-1">Horizon (Years)</label>
                <input 
                  className="bg-transparent border-none focus:ring-0 text-on-surface font-headline font-bold text-xl p-0 outline-none w-20 text-right" 
                  type="number" 
                  value={horizon}
                  onChange={(e) => setHorizon(e.target.value)}
                />
              </div>
            </div>
            
            {/* Input: Expected Return Rate */}
            <div className="flex flex-col gap-4 mt-6 mb-6 relative z-10">
              <div className="flex justify-between items-end border-b border-white/10 pb-3 group focus-within:border-primary transition-colors">
                <label className="font-label text-xs font-semibold text-on-surface-variant uppercase tracking-[0.15em] pb-1">Target Return (%)</label>
                <input 
                  className="bg-transparent border-none focus:ring-0 text-primary drop-shadow-[0_0_8px_rgba(78,222,163,0.2)] font-headline font-bold text-xl p-0 outline-none w-20 text-right" 
                  type="number" 
                  value={returnRate}
                  onChange={(e) => setReturnRate(e.target.value)}
                />
              </div>
            </div>
            
            <button className="w-full py-4 rounded-xl font-headline font-bold text-on-primary bg-gradient-to-b from-primary to-primary-fixed-dim hover:opacity-90 transition-opacity flex justify-center items-center gap-2 shadow-[0_10px_25px_-5px_rgba(78,222,163,0.3)] text-lg mt-4 border border-primary-fixed/50 relative z-10">
              <span className="material-symbols-outlined text-sm">refresh</span>
              Recalculate Model
            </button>
          </div>

          {/* Right Column: Visualization & Insights */}
          <div className="xl:col-span-8 flex flex-col gap-8">
            {/* Main Graph Area */}
            <div className="bg-surface-container-lowest/50 backdrop-blur-3xl rounded-[2rem] p-10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] border border-white/5 relative overflow-hidden h-[500px] flex flex-col group">
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent opacity-50 pointer-events-none"></div>
              
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div>
                  <p className="font-body text-xs font-semibold text-on-surface-variant uppercase tracking-[0.15em] mb-3">Projected Valuation Gap</p>
                  <div className="flex items-baseline gap-4">
                    <h3 className="font-headline text-4xl md:text-5xl font-black text-primary tracking-tight drop-shadow-[0_0_15px_rgba(78,222,163,0.2)]">
                      ${formatCompactINR(finalOptimized).replace('₹', '')}
                    </h3>
                    <span className="font-body text-sm text-on-surface-variant/80 font-medium tracking-wide">
                      vs. ${formatCompactINR(finalStatusQuo).replace('₹', '')} <br/>(Status Quo)
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-5 bg-zinc-900/50 backdrop-blur-xl px-5 py-2.5 rounded-full border border-white/5 shadow-lg">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_10px_rgba(78,222,163,0.8)]"></div>
                    <span className="font-body text-xs font-medium text-zinc-300">Optimized</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-tertiary shadow-[0_0_10px_rgba(255,179,173,0.5)]"></div>
                    <span className="font-body text-xs font-medium text-zinc-300">Current</span>
                  </div>
                </div>
              </div>

              {/* Chart Area */}
              <div className="flex-grow w-full relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="optGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4edea3" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#4edea3" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="stGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ffb3ad" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#ffb3ad" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
                    <YAxis 
                      stroke="rgba(255,255,255,0.3)" 
                      tick={{ fontSize: 11 }} 
                      tickFormatter={(v) => formatCompactINR(v).replace('₹', '$')} 
                      orientation="right"
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(18, 20, 22, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                      formatter={(value: any, name: any) => [
                        `$${formatINR(Number(value)).replace('₹', '')}`, 
                        name === 'optimized' ? 'Optimized Portfolio' : name === 'statusQuo' ? 'Status Quo' : 'Gap'
                      ]}
                    />
                    <Area type="monotone" dataKey="optimized" stroke="#4edea3" strokeWidth={3} fill="url(#optGrad)" name="optimized" />
                    <Area type="monotone" dataKey="statusQuo" stroke="#ffb3ad" strokeDasharray="5 5" strokeWidth={2} fill="url(#stGrad)" name="statusQuo" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bottom Row: Ticker & AI Insight */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Live Loss Ticker */}
              <div className="bg-surface-container-highest/60 backdrop-blur-2xl rounded-[2rem] p-10 flex flex-col justify-center relative overflow-hidden border border-white/5 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] group">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-tertiary/10 via-transparent to-transparent opacity-50 group-hover:opacity-70 transition-opacity duration-700 pointer-events-none"></div>
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-tertiary/10 rounded-full blur-[80px] pointer-events-none"></div>
                
                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="w-8 h-8 rounded-full bg-tertiary/10 flex items-center justify-center border border-tertiary/20">
                    <span className="material-symbols-outlined text-tertiary text-sm animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>timer</span>
                  </div>
                  <h4 className="font-body text-xs font-semibold text-on-surface uppercase tracking-[0.15em]">Opportunity Cost Rate</h4>
                </div>
                
                <div className="flex items-baseline gap-3 relative z-10">
                  <span className="font-headline text-6xl font-black text-tertiary tracking-tighter drop-shadow-[0_0_15px_rgba(255,179,173,0.3)]">
                    -${lossPerMinute.toFixed(2)}
                  </span>
                  <span className="font-body text-on-surface-variant font-medium tracking-wide">/ minute</span>
                </div>
                
                <p className="font-body text-sm text-on-surface-variant mt-6 opacity-80 leading-relaxed font-light relative z-10">
                    Based on historical market averages, this is the estimated theoretical loss incurred by delaying capital deployment against inflation.
                </p>
              </div>

              {/* AI Insight Card */}
              <div className="bg-gradient-to-br from-zinc-800/40 to-zinc-900/40 backdrop-blur-2xl rounded-[2rem] p-10 border border-white/5 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] relative overflow-hidden">
                <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none"></div>
                
                <div className="flex items-center gap-3 mb-8 relative z-10">
                  <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center border border-secondary/20">
                    <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  </div>
                  <h4 className="font-body text-xs font-semibold text-on-surface uppercase tracking-[0.15em]">Architect Insight</h4>
                </div>
                
                <p className="font-body text-zinc-300 text-[15px] leading-relaxed mb-8 relative z-10 font-light">
                    Reallocating <strong>60% of your idle cash position</strong> ({formatCompactINR(parsedInitial * 0.6).replace('₹', '$')}) into a diversified equity model could neutralize the current inflation drag within <strong className="text-secondary font-semibold">14 months</strong>, significantly altering the {parsedHorizon}-year trajectory curve shown above.
                </p>
                
                <button className="text-xs font-headline font-bold text-secondary uppercase tracking-[0.2em] hover:text-secondary-fixed transition-colors flex items-center gap-2 group relative z-10">
                  View Execution Strategy 
                  <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageFrame>
  )
}