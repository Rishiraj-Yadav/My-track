import { useState, useMemo } from 'react'
import { PageFrame } from '../components'
import { formatINR } from '../lib/finance'
import { UpgradeGate } from '../lib/subscription'

type Deduction = {
  id: string
  name: string
  icon: string
  section: string
  amount: number
  maxLimit: number
  description: string
}

const DEFAULT_DEDUCTIONS: Deduction[] = [
  { id: 'ppf', name: 'PPF Contribution', icon: 'savings', section: '80C', amount: 0, maxLimit: 150000, description: 'Public Provident Fund annual deposit' },
  { id: 'elss', name: 'ELSS Mutual Fund', icon: 'trending_up', section: '80C', amount: 0, maxLimit: 150000, description: 'Equity Linked Savings Scheme SIP' },
  { id: 'lic', name: 'LIC Premium', icon: 'shield', section: '80C', amount: 0, maxLimit: 150000, description: 'Life Insurance Corporation premium' },
  { id: 'epf', name: 'EPF (Employee share)', icon: 'account_balance', section: '80C', amount: 0, maxLimit: 150000, description: 'Employee Provident Fund deduction' },
  { id: 'tuition', name: 'Children Tuition Fees', icon: 'school', section: '80C', amount: 0, maxLimit: 150000, description: 'Max 2 children tuition fees' },
  { id: 'nps', name: 'NPS Contribution', icon: 'elderly', section: '80CCD', amount: 0, maxLimit: 50000, description: 'National Pension System (additional ₹50K)' },
  { id: 'health_self', name: 'Health Insurance (Self)', icon: 'health_and_safety', section: '80D', amount: 0, maxLimit: 25000, description: 'Medical insurance premium for self & family' },
  { id: 'health_parents', name: 'Health Insurance (Parents)', icon: 'family_restroom', section: '80D', amount: 0, maxLimit: 50000, description: 'Parents medical insurance (₹50K if senior citizen)' },
  { id: 'education_loan', name: 'Education Loan Interest', icon: 'cast_for_education', section: '80E', amount: 0, maxLimit: Infinity, description: 'No upper limit on education loan interest' },
  { id: 'home_loan', name: 'Home Loan Interest', icon: 'home', section: '24(b)', amount: 0, maxLimit: 200000, description: 'Interest on housing loan for self-occupied property' },
]

type TaxRegime = 'old' | 'new'

const OLD_SLABS = [
  { min: 0, max: 250000, rate: 0 },
  { min: 250000, max: 500000, rate: 5 },
  { min: 500000, max: 1000000, rate: 20 },
  { min: 1000000, max: Infinity, rate: 30 },
]

const NEW_SLABS = [
  { min: 0, max: 300000, rate: 0 },
  { min: 300000, max: 700000, rate: 5 },
  { min: 700000, max: 1000000, rate: 10 },
  { min: 1000000, max: 1200000, rate: 15 },
  { min: 1200000, max: 1500000, rate: 20 },
  { min: 1500000, max: Infinity, rate: 30 },
]

const calcTax = (income: number, slabs: typeof OLD_SLABS) => {
  let tax = 0
  for (const slab of slabs) {
    if (income <= slab.min) break
    const taxable = Math.min(income, slab.max) - slab.min
    tax += taxable * (slab.rate / 100)
  }
  // 4% Health & Education Cess
  return Math.round(tax * 1.04)
}

export function TaxPage() {
  const [ctc, setCtc] = useState(864000) // ₹8.64L (₹72K × 12)
  const [regime, setRegime] = useState<TaxRegime>('old')
  const [hra, setHra] = useState(192000) // ₹16K rent × 12
  const [deductions, setDeductions] = useState<Deduction[]>(DEFAULT_DEDUCTIONS)

  const updateDeduction = (id: string, amount: number) => {
    setDeductions(ds => ds.map(d =>
      d.id === id ? { ...d, amount: Math.min(amount, d.maxLimit) } : d
    ))
  }

  const analysis = useMemo(() => {
    const grossIncome = ctc
    const standardDeduction = 50000

    // Section-wise totals
    const sec80C = Math.min(
      deductions.filter(d => d.section === '80C').reduce((s, d) => s + d.amount, 0),
      150000,
    )
    const sec80CCD = deductions.find(d => d.id === 'nps')?.amount || 0
    const sec80D = deductions
      .filter(d => d.section === '80D')
      .reduce((s, d) => s + Math.min(d.amount, d.maxLimit), 0)
    const sec80E = deductions.find(d => d.id === 'education_loan')?.amount || 0
    const sec24b = Math.min(deductions.find(d => d.id === 'home_loan')?.amount || 0, 200000)
    const hraExemption = Math.min(hra, grossIncome * 0.4) // Simplified HRA calc

    const totalDeductions = standardDeduction + sec80C + sec80CCD + sec80D + sec80E + sec24b + hraExemption

    const oldTaxableIncome = Math.max(0, grossIncome - totalDeductions)
    const newTaxableIncome = Math.max(0, grossIncome - standardDeduction) // New regime: only standard deduction

    const oldTax = calcTax(oldTaxableIncome, OLD_SLABS)
    const newTax = calcTax(newTaxableIncome, NEW_SLABS)

    const currentTax = regime === 'old' ? oldTax : newTax
    const effectiveRate = grossIncome > 0 ? (currentTax / grossIncome) * 100 : 0
    const recommended = oldTax < newTax ? 'old' : 'new'
    const savings = Math.abs(oldTax - newTax)

    return {
      grossIncome,
      totalDeductions: regime === 'old' ? totalDeductions : standardDeduction,
      taxableIncome: regime === 'old' ? oldTaxableIncome : newTaxableIncome,
      tax: currentTax,
      effectiveRate,
      oldTax,
      newTax,
      recommended,
      savings,
      sec80C,
      sec80CCD,
      sec80D,
      hraExemption,
      monthlyTax: Math.round(currentTax / 12),
      monthlyInHand: Math.round((grossIncome - currentTax) / 12),
    }
  }, [ctc, regime, hra, deductions])

  return (
    <PageFrame>
      <UpgradeGate feature="tax_optimizer">
        {/* Header */}
        <header className="mb-10">
          <p className="font-label text-xs font-bold text-secondary uppercase tracking-[0.25em] mb-3">Tax Optimizer</p>
          <h1 className="font-headline text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight mb-4">
            Tax Architecture
          </h1>
          <p className="font-body text-on-surface-variant text-lg max-w-2xl">
            Optimize deductions under 80C, 80D, 80CCD, and HRA. Compare old vs new tax regime.
          </p>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Annual Tax', value: formatINR(analysis.tax), icon: 'receipt_long', color: 'text-tertiary' },
            { label: 'Effective Rate', value: `${analysis.effectiveRate.toFixed(1)}%`, icon: 'percent', color: 'text-secondary' },
            { label: 'Monthly Tax', value: formatINR(analysis.monthlyTax), icon: 'calendar_month', color: 'text-on-surface-variant' },
            { label: 'Monthly In-Hand', value: formatINR(analysis.monthlyInHand), icon: 'account_balance_wallet', color: 'text-primary' },
          ].map(card => (
            <div key={card.label} className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/15">
              <div className="flex items-center gap-2 mb-3">
                <span className={`material-symbols-outlined text-lg ${card.color}`}>{card.icon}</span>
                <span className="font-label text-[10px] text-on-surface-variant uppercase tracking-wider">{card.label}</span>
              </div>
              <p className={`font-headline text-2xl font-extrabold ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Regime Comparison */}
        <div className="bg-surface-container-low rounded-2xl p-8 border border-outline-variant/15 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-on-surface-variant">compare</span>
            <h3 className="font-headline text-lg font-bold text-on-surface">Regime Comparison</h3>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {([
              { key: 'old' as TaxRegime, label: 'Old Regime', tax: analysis.oldTax, desc: 'With all deductions' },
              { key: 'new' as TaxRegime, label: 'New Regime', tax: analysis.newTax, desc: 'Lower slabs, no deductions' },
            ]).map(r => (
              <button
                key={r.key}
                onClick={() => setRegime(r.key)}
                className={`p-6 rounded-xl border-2 text-left transition-all ${
                  regime === r.key
                    ? 'border-primary bg-primary/5'
                    : 'border-outline-variant/15 hover:border-outline-variant/30'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-headline text-base font-bold text-on-surface">{r.label}</span>
                  {analysis.recommended === r.key && (
                    <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold">RECOMMENDED</span>
                  )}
                </div>
                <p className="font-headline text-3xl font-extrabold text-on-surface mb-1">{formatINR(r.tax)}</p>
                <p className="font-body text-xs text-on-surface-variant">{r.desc}</p>
              </button>
            ))}
          </div>

          {analysis.savings > 0 && (
            <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 text-center">
              <p className="font-body text-sm text-on-surface">
                Switching to <span className="font-bold text-primary">{analysis.recommended === 'old' ? 'Old' : 'New'} Regime</span> saves you{' '}
                <span className="font-bold text-primary">{formatINR(analysis.savings)}/year</span> ({formatINR(Math.round(analysis.savings / 12))}/month)
              </p>
            </div>
          )}
        </div>

        {/* Income Input */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/15">
            <label className="font-label text-xs text-on-surface-variant uppercase tracking-wider mb-2 block">Annual CTC (₹)</label>
            <input
              type="number"
              value={ctc}
              onChange={e => setCtc(Number(e.target.value))}
              className="w-full bg-transparent border-b-2 border-surface-variant focus:border-primary text-xl font-headline font-bold text-on-surface p-2 focus:ring-0 outline-none transition-colors"
            />
          </div>
          <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/15">
            <label className="font-label text-xs text-on-surface-variant uppercase tracking-wider mb-2 block">Annual Rent Paid (₹)</label>
            <input
              type="number"
              value={hra}
              onChange={e => setHra(Number(e.target.value))}
              className="w-full bg-transparent border-b-2 border-surface-variant focus:border-primary text-xl font-headline font-bold text-on-surface p-2 focus:ring-0 outline-none transition-colors"
            />
          </div>
          <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/15 flex flex-col justify-center">
            <p className="font-label text-xs text-on-surface-variant uppercase tracking-wider mb-1">HRA Exemption</p>
            <p className="font-headline text-2xl font-bold text-primary">{formatINR(Math.min(hra, ctc * 0.4))}</p>
          </div>
        </div>

        {/* Deductions Grid */}
        <div className="bg-surface-container-low rounded-2xl p-8 border border-outline-variant/15">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">receipt</span>
              <h3 className="font-headline text-lg font-bold text-on-surface">Deductions</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-on-surface-variant font-body">80C Used:</span>
              <span className={`font-headline text-sm font-bold ${analysis.sec80C >= 150000 ? 'text-primary' : 'text-tertiary'}`}>
                {formatINR(analysis.sec80C)} / ₹1,50,000
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deductions.map(d => (
              <div
                key={d.id}
                className="flex items-center gap-4 bg-surface-container-lowest/50 rounded-xl p-4 border border-outline-variant/10 group hover:border-primary/15 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary text-lg">{d.icon}</span>
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-headline text-sm font-bold text-on-surface truncate">{d.name}</p>
                    <span className="px-2 py-0.5 rounded bg-surface-variant text-on-surface-variant text-[10px] font-bold flex-shrink-0">
                      {d.section}
                    </span>
                  </div>
                  <p className="font-body text-[11px] text-on-surface-variant truncate">{d.description}</p>
                </div>
                <div className="flex-shrink-0 w-28">
                  <input
                    type="number"
                    value={d.amount || ''}
                    onChange={e => updateDeduction(d.id, Number(e.target.value))}
                    placeholder="0"
                    className="w-full bg-transparent border-b border-surface-variant focus:border-primary text-sm font-headline font-bold text-on-surface text-right p-1 focus:ring-0 outline-none transition-colors"
                  />
                  {d.maxLimit < Infinity && (
                    <p className="text-[10px] text-on-surface-variant text-right mt-0.5">
                      max {formatINR(d.maxLimit)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </UpgradeGate>
    </PageFrame>
  )
}
