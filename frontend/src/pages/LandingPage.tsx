import { Link } from 'react-router-dom'
import { PageFrame } from '../components'
import { useAppStore } from '../store'
import { calculateMonthlyTotals, formatCompactINR } from '../lib/finance'

export function LandingPage() {
  const { expenses } = useAppStore()
  const totals = calculateMonthlyTotals(expenses)
  const leakMonthly = totals.leakage

  return (
    <PageFrame>
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex flex-col md:flex-row items-center justify-between gap-12 mb-32 -mt-10">
        <div className="w-full md:w-3/5 z-10 flex flex-col items-start gap-8 relative">
          {/* Ambient Glow Behind Text */}
          <div className="absolute -left-20 top-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
          
          <h1 className="font-headline font-extrabold text-5xl md:text-7xl leading-tight text-on-surface">
            See what your money decisions <span className="text-primary block mt-2">really cost.</span>
          </h1>
          
          <p className="font-body text-on-surface-variant text-lg md:text-xl max-w-xl leading-relaxed">
            Move beyond simple tracking. The Financial Architect reveals the true trajectory of your wealth with high-fidelity simulations.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 mt-4 w-full sm:w-auto">
            <Link to="/onboarding" className="bg-gradient-to-br from-primary to-[#008f62] text-on-primary font-headline font-bold text-lg px-10 py-5 rounded-xl shadow-[0_20px_40px_rgba(78,222,163,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 text-center">
              Start Tracking
            </Link>
            <Link to="/dashboard" className="bg-surface-container-highest/50 border border-outline-variant/15 text-on-surface font-headline font-bold text-lg px-10 py-5 rounded-xl hover:bg-surface-container-highest transition-colors duration-300 flex items-center justify-center gap-3">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
              View Gallery
            </Link>
          </div>
        </div>

        {/* Hero Visual - 3D Mockup Stand-in */}
        <div className="w-full md:w-2/5 relative h-[500px] flex items-center justify-center">
          {/* Layered Glass Cards mimicking a 3D interface */}
          <div className="absolute top-10 right-0 w-80 h-96 bg-surface-bright/40 backdrop-blur-2xl rounded-xl border border-outline-variant/15 shadow-[0_30px_60px_rgba(0,0,0,0.5)] transform rotate-3 translate-x-4 flex flex-col p-6 z-20">
            <div className="text-on-surface-variant text-sm font-label mb-2">Projected Net Worth</div>
            <div className="text-primary font-headline font-extrabold text-4xl mb-8">₹2.4Cr</div>
            <div className="flex-grow flex items-end gap-3 opacity-80">
              <div className="w-1/6 bg-surface-variant rounded-t-sm h-1/4"></div>
              <div className="w-1/6 bg-surface-variant rounded-t-sm h-2/4"></div>
              <div className="w-1/6 bg-primary/40 rounded-t-sm h-3/4"></div>
              <div className="w-1/6 bg-primary/60 rounded-t-sm h-[85%]"></div>
              <div className="w-1/6 bg-primary rounded-t-sm h-full relative shadow-[0_0_20px_rgba(78,222,163,0.4)]">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-on-surface rounded-full"></div>
              </div>
            </div>
          </div>
          
          <div className="absolute bottom-0 left-10 w-72 h-48 bg-surface-container-lowest/80 backdrop-blur-xl rounded-xl border border-outline-variant/10 shadow-[0_20px_40px_rgba(0,0,0,0.6)] transform -rotate-2 -translate-x-8 flex flex-col p-6 z-30">
            <div className="flex justify-between items-center mb-4">
              <div className="text-on-surface-variant font-label text-sm">Monthly Leakage</div>
              <span className="material-symbols-outlined text-tertiary">warning</span>
            </div>
            <div className="text-tertiary font-headline font-bold text-2xl mb-1">{formatCompactINR(leakMonthly)}</div>
            <div className="text-on-surface-variant text-xs">Subscription overlap detected</div>
          </div>
        </div>
      </section>

      {/* Feature Section: Bento Grid */}
      <section className="mb-32">
        <h2 className="font-headline font-bold text-3xl text-on-surface mb-12">The Blueprint</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1: Expense Tracking */}
          <div className="md:col-span-2 bg-surface-container-low rounded-xl p-10 flex flex-col justify-between relative overflow-hidden group hover:bg-surface-container-high transition-colors duration-500 min-h-[400px]">
            <div className="z-10 w-full md:w-1/2">
              <span className="material-symbols-outlined text-primary mb-6 text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
              <h3 className="font-headline font-bold text-2xl text-on-surface mb-4">Granular Expense Tracking</h3>
              <p className="font-body text-on-surface-variant leading-relaxed">
                Monitor cash flow with precision. Our categorizations go beyond standard labels to reveal the true utility of your spending.
              </p>
            </div>
            {/* Decorative Visual */}
            <div className="absolute right-[-10%] bottom-[-10%] w-[60%] h-[80%] bg-surface-container-highest rounded-xl transform -rotate-6 border border-outline-variant/15 p-6 flex flex-col gap-4 shadow-[0_20px_40px_rgba(0,0,0,0.4)] opacity-50 group-hover:opacity-100 transition-opacity duration-500">
              <div className="h-12 bg-surface-variant rounded-md w-full"></div>
              <div className="h-12 bg-surface-variant rounded-md w-4/5"></div>
              <div className="h-12 bg-tertiary/20 rounded-md w-full border border-tertiary/30"></div>
            </div>
          </div>

          {/* Feature 2: Scenario Simulation */}
          <div className="md:col-span-1 bg-surface-container-highest rounded-xl p-10 flex flex-col justify-between relative overflow-hidden group min-h-[400px]">
            <div className="absolute inset-0 bg-gradient-to-b from-secondary/5 to-transparent pointer-events-none"></div>
            <div className="z-10">
              <span className="material-symbols-outlined text-secondary mb-6 text-4xl">query_stats</span>
              <h3 className="font-headline font-bold text-2xl text-on-surface mb-4">Scenario Lab</h3>
              <p className="font-body text-on-surface-variant leading-relaxed">
                Simulate the future before you commit. Test property purchases, career changes, or market downturns.
              </p>
            </div>
            {/* Decorative Visual */}
            <div className="mt-8 flex items-center justify-center">
              <div className="w-full h-2 bg-surface-variant rounded-full relative">
                <div className="absolute left-0 top-0 h-full w-2/3 bg-secondary rounded-full shadow-[0_0_10px_rgba(233,195,73,0.3)]"></div>
                <div className="absolute left-2/3 top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-surface-bright rounded-full border-2 border-secondary shadow-lg"></div>
              </div>
            </div>
          </div>

          {/* Feature 3: Goal Planning */}
          <div className="md:col-span-3 bg-surface-container-lowest border border-outline-variant/10 rounded-xl p-10 flex flex-col md:flex-row items-center justify-between gap-12 group hover:border-outline-variant/30 transition-colors duration-500">
            <div className="w-full md:w-1/2 flex flex-col gap-6">
              <span className="material-symbols-outlined text-primary text-4xl">track_changes</span>
              <h3 className="font-headline font-bold text-3xl text-on-surface">Architectural Goal Planning</h3>
              <p className="font-body text-on-surface-variant text-lg">
                Structure your aspirations into achievable milestones. Set timelines, allocate capital, and watch the foundation build.
              </p>
            </div>
            <div className="w-[200px] h-[200px] flex justify-end">
              {/* Abstract rings representing goals */}
              <div className="relative w-full h-full">
                <div className="absolute inset-4 rounded-full border-4 border-surface-variant"></div>
                <div className="absolute inset-4 rounded-full border-4 border-primary border-t-transparent border-r-transparent transform rotate-45"></div>
                <div className="absolute inset-12 rounded-full border-4 border-surface-variant"></div>
                <div className="absolute inset-12 rounded-full border-4 border-secondary border-b-transparent transform -rotate-12"></div>
                <div className="absolute inset-0 flex items-center justify-center font-headline font-bold text-2xl text-on-surface">
                    68%
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageFrame>
  )
}
