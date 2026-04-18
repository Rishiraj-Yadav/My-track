import { useState } from 'react'
import { PageFrame } from '../components'

type Tier = {
  name: string
  tagline: string
  monthlyPrice: number
  yearlyPrice: number
  badge?: string
  highlighted?: boolean
  cta: string
  features: string[]
  limits: string[]
}

const tiers: Tier[] = [
  {
    name: 'Starter',
    tagline: 'Begin your financial journey',
    monthlyPrice: 0,
    yearlyPrice: 0,
    cta: 'Current Plan',
    features: [
      'Up to 15 expense entries',
      '2 financial goals',
      '1 scenario comparison',
      'Basic health score',
      'Simple SIP calculator',
      '3-month data history',
    ],
    limits: [
      'No category breakdown charts',
      'No AI insights',
      'No export / reports',
      'No family sharing',
    ],
  },
  {
    name: 'Architect',
    tagline: 'For the disciplined saver',
    monthlyPrice: 149,
    yearlyPrice: 1499,
    badge: 'Most Popular',
    highlighted: true,
    cta: 'Upgrade to Architect',
    features: [
      'Unlimited expenses',
      'Unlimited goals',
      'Unlimited scenarios',
      'AI spending insights',
      'Category breakdown charts',
      'Monte Carlo projections',
      'PDF & CSV exports',
      'Custom challenges',
      'Family mode (3 members)',
      'Unlimited data history',
      'Priority support',
    ],
    limits: [],
  },
  {
    name: 'Strategist',
    tagline: 'For serious wealth builders',
    monthlyPrice: 349,
    yearlyPrice: 3499,
    badge: 'Pro',
    cta: 'Go Strategist',
    features: [
      'Everything in Architect',
      'Multi-portfolio tracking',
      'Tax optimization (80C/80D)',
      'Goal auto-allocation',
      'Zerodha / Groww sync',
      'Advanced NLP console',
      'White-label PDF reports',
      'Dedicated account manager',
    ],
    limits: [],
  },
]

const comparisonFeatures = [
  { name: 'Expense tracking', starter: '15 max', architect: 'Unlimited', strategist: 'Unlimited' },
  { name: 'Financial goals', starter: '2 max', architect: 'Unlimited', strategist: 'Unlimited' },
  { name: 'Scenario comparisons', starter: '1', architect: 'Unlimited', strategist: 'Unlimited' },
  { name: 'Health score', starter: true, architect: true, strategist: true },
  { name: 'SIP calculator', starter: 'Basic', architect: 'Advanced', strategist: 'Advanced + Monte Carlo' },
  { name: 'Spending insights (AI)', starter: false, architect: true, strategist: true },
  { name: 'Category breakdown', starter: false, architect: true, strategist: true },
  { name: 'Data history', starter: '3 months', architect: 'Unlimited', strategist: 'Unlimited' },
  { name: 'Export (PDF / CSV)', starter: false, architect: true, strategist: true },
  { name: 'Custom challenges', starter: false, architect: true, strategist: true },
  { name: 'Family sharing', starter: false, architect: '3 members', strategist: '5 members' },
  { name: 'Multi-portfolio tracking', starter: false, architect: false, strategist: true },
  { name: 'Tax optimization hints', starter: false, architect: false, strategist: true },
  { name: 'Investment API sync', starter: false, architect: false, strategist: true },
  { name: 'NLP command console', starter: false, architect: false, strategist: true },
  { name: 'White-label reports', starter: false, architect: false, strategist: true },
  { name: 'Support', starter: 'Community', architect: 'Priority email', strategist: 'Dedicated manager' },
]

const faqs = [
  {
    q: 'Can I switch plans anytime?',
    a: 'Yes. Upgrade or downgrade anytime. When upgrading, you pay the prorated difference. When downgrading, your current features remain active until the billing cycle ends.',
  },
  {
    q: 'What happens to my data if I downgrade?',
    a: 'Your data is never deleted. On the free plan, you can only view the last 3 months, but upgrading again restores full access instantly.',
  },
  {
    q: 'Is there a refund policy?',
    a: 'Yes — full refund within 7 days of purchase, no questions asked. After 7 days, you can cancel and continue using premium until the billing cycle ends.',
  },
  {
    q: 'How does family sharing work?',
    a: 'Invite family members via email. Each person gets their own private dashboard. You share a combined household view for joint budgeting.',
  },
  {
    q: 'Is my financial data secure?',
    a: 'Absolutely. We use AES-256 encryption at rest, TLS 1.3 in transit, and never sell or share your data. Your financial information stays yours.',
  },
]

export function PricingPage() {
  const [isYearly, setIsYearly] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <PageFrame>
      {/* ─── Hero ─── */}
      <section className="relative text-center pt-8 pb-20">
        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/8 rounded-full blur-[120px] pointer-events-none" />

        <p className="relative z-10 font-label text-xs font-bold text-secondary uppercase tracking-[0.25em] mb-4">
          Pricing
        </p>
        <h1 className="relative z-10 font-headline text-5xl md:text-7xl font-extrabold text-on-surface tracking-tight leading-tight mb-6">
          Invest in your<br />
          <span className="text-primary">financial clarity.</span>
        </h1>
        <p className="relative z-10 font-body text-on-surface-variant text-lg max-w-2xl mx-auto leading-relaxed mb-12">
          Less than the cost of one Swiggy order per month. Choose the plan that fits your ambition.
        </p>

        {/* ─── Billing Toggle ─── */}
        <div className="relative z-10 flex items-center justify-center gap-4 mb-16">
          <span className={`font-label text-sm font-semibold transition-colors ${!isYearly ? 'text-on-surface' : 'text-on-surface-variant'}`}>
            Monthly
          </span>
          <button
            onClick={() => setIsYearly(!isYearly)}
            className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${isYearly ? 'bg-primary' : 'bg-surface-variant'}`}
          >
            <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-on-primary shadow-lg transition-transform duration-300 ${isYearly ? 'translate-x-7' : 'translate-x-0.5'}`} />
          </button>
          <span className={`font-label text-sm font-semibold transition-colors ${isYearly ? 'text-on-surface' : 'text-on-surface-variant'}`}>
            Yearly
          </span>
          {isYearly && (
            <span className="ml-2 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-bold animate-pulse">
              Save up to 16%
            </span>
          )}
        </div>

        {/* ─── Pricing Cards ─── */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
          {tiers.map((tier) => {
            const price = isYearly ? tier.yearlyPrice : tier.monthlyPrice
            const perMonth = isYearly && tier.yearlyPrice > 0
              ? Math.round(tier.yearlyPrice / 12)
              : tier.monthlyPrice

            return (
              <div
                key={tier.name}
                className={`relative flex flex-col rounded-2xl p-8 transition-all duration-500 group
                  ${tier.highlighted
                    ? 'bg-gradient-to-b from-surface-container-high to-surface-container-low border-2 border-primary/30 shadow-[0_30px_80px_-20px_rgba(78,222,163,0.25)] scale-[1.02] md:scale-105'
                    : 'bg-surface-container-low border border-outline-variant/15 shadow-[0_20px_40px_rgba(0,0,0,0.2)] hover:border-outline-variant/30'
                  }`}
              >
                {/* Badge */}
                {tier.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider
                    ${tier.highlighted
                      ? 'bg-primary text-on-primary shadow-[0_8px_20px_rgba(78,222,163,0.4)]'
                      : 'bg-secondary text-on-secondary shadow-[0_8px_20px_rgba(233,195,73,0.3)]'
                    }`}>
                    {tier.badge}
                  </div>
                )}

                {/* Tier Header */}
                <div className="mb-8 mt-2">
                  <h3 className="font-headline text-2xl font-bold text-on-surface mb-2">{tier.name}</h3>
                  <p className="font-body text-sm text-on-surface-variant">{tier.tagline}</p>
                </div>

                {/* Price */}
                <div className="mb-8">
                  {price === 0 ? (
                    <div className="flex items-baseline gap-1">
                      <span className="font-headline text-5xl font-extrabold text-on-surface">Free</span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="font-headline text-lg text-on-surface-variant">₹</span>
                      <span className="font-headline text-5xl font-extrabold text-on-surface tracking-tight">
                        {isYearly ? price.toLocaleString('en-IN') : price}
                      </span>
                      <span className="font-body text-on-surface-variant text-sm ml-1">
                        /{isYearly ? 'year' : 'mo'}
                      </span>
                    </div>
                  )}
                  {isYearly && price > 0 && (
                    <p className="font-body text-xs text-primary mt-2">
                      That's just ₹{perMonth}/month
                    </p>
                  )}
                </div>

                {/* CTA */}
                <button
                  className={`w-full py-4 rounded-xl font-headline font-bold text-base transition-all duration-300 mb-8
                    ${tier.highlighted
                      ? 'bg-gradient-to-r from-primary to-primary-fixed-dim text-on-primary shadow-[0_10px_30px_-5px_rgba(78,222,163,0.4)] hover:shadow-[0_15px_40px_-5px_rgba(78,222,163,0.5)] hover:scale-[1.02] active:scale-[0.98]'
                      : tier.monthlyPrice === 0
                        ? 'bg-surface-variant/50 text-on-surface-variant cursor-default'
                        : 'bg-surface-container-highest text-on-surface border border-outline-variant/20 hover:bg-surface-bright hover:border-outline-variant/40 active:scale-[0.98]'
                    }`}
                >
                  {tier.cta}
                </button>

                {/* Features */}
                <div className="flex-grow">
                  <p className="font-label text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-4">
                    {tier.monthlyPrice === 0 ? 'Includes' : 'Everything you get'}
                  </p>
                  <ul className="space-y-3">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-3">
                        <span className={`material-symbols-outlined text-base mt-0.5 flex-shrink-0 ${tier.highlighted ? 'text-primary' : 'text-on-surface-variant'}`}
                          style={{ fontVariationSettings: "'FILL' 1" }}>
                          check_circle
                        </span>
                        <span className="font-body text-sm text-on-surface">{f}</span>
                      </li>
                    ))}
                    {tier.limits.map((l) => (
                      <li key={l} className="flex items-start gap-3 opacity-50">
                        <span className="material-symbols-outlined text-base mt-0.5 flex-shrink-0 text-on-surface-variant">
                          cancel
                        </span>
                        <span className="font-body text-sm text-on-surface-variant line-through">{l}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ─── Social Proof Strip ─── */}
      <section className="py-16 border-y border-outline-variant/10">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '12,400+', label: 'Active users' },
            { value: '₹2.3Cr', label: 'Leakage detected' },
            { value: '4.8★', label: 'Average rating' },
            { value: '94%', label: 'Renewal rate' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="font-headline text-3xl md:text-4xl font-extrabold text-on-surface mb-2">{stat.value}</p>
              <p className="font-body text-sm text-on-surface-variant">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Feature Comparison Table ─── */}
      <section className="py-20 max-w-6xl mx-auto">
        <h2 className="font-headline text-3xl md:text-4xl font-bold text-on-surface text-center mb-4">
          Compare every detail
        </h2>
        <p className="font-body text-on-surface-variant text-center mb-14 max-w-xl mx-auto">
          See exactly what you get at each tier, feature by feature.
        </p>

        <div className="overflow-x-auto rounded-2xl border border-outline-variant/15 bg-surface-container-low/50 backdrop-blur-xl">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-outline-variant/15">
                <th className="font-label text-sm font-bold text-on-surface-variant uppercase tracking-wider p-5 w-1/3">
                  Feature
                </th>
                <th className="font-headline text-base font-bold text-on-surface p-5 text-center">Starter</th>
                <th className="font-headline text-base font-bold text-primary p-5 text-center bg-primary/5">Architect</th>
                <th className="font-headline text-base font-bold text-secondary p-5 text-center">Strategist</th>
              </tr>
            </thead>
            <tbody>
              {comparisonFeatures.map((row, i) => (
                <tr key={row.name} className={`border-b border-outline-variant/8 ${i % 2 === 0 ? '' : 'bg-surface-container-lowest/30'}`}>
                  <td className="font-body text-sm text-on-surface p-5 font-medium">{row.name}</td>
                  {(['starter', 'architect', 'strategist'] as const).map((tier) => {
                    const val = row[tier]
                    return (
                      <td key={tier} className={`p-5 text-center ${tier === 'architect' ? 'bg-primary/5' : ''}`}>
                        {val === true ? (
                          <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        ) : val === false ? (
                          <span className="material-symbols-outlined text-surface-variant text-xl">remove</span>
                        ) : (
                          <span className={`font-body text-sm ${tier === 'architect' ? 'text-primary font-semibold' : 'text-on-surface-variant'}`}>
                            {val}
                          </span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="py-20">
        <h2 className="font-headline text-3xl font-bold text-on-surface text-center mb-14">
          What users are saying
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {[
            {
              name: 'Priya Sharma',
              role: 'Product Designer, Bengaluru',
              text: 'I was spending ₹14K/month on food delivery without realizing. Architect showed me the leak in 2 minutes. Already saved ₹8K in the first month.',
              avatar: 'PS',
            },
            {
              name: 'Rahul Krishnan',
              role: 'Data Analyst, Chennai',
              text: 'The Scenario Lab is insane. I compared 4 different SIP strategies and figured out that cutting my OTT subscriptions could add ₹18L to my retirement corpus.',
              avatar: 'RK',
            },
            {
              name: 'Sneha Patel',
              role: 'Freelance Writer, Mumbai',
              text: 'As a freelancer with irregular income, the Goal Planner helps me stay on track. The family sharing feature means my husband and I finally budget together.',
              avatar: 'SP',
            },
          ].map((t) => (
            <div
              key={t.name}
              className="bg-surface-container-low rounded-2xl p-8 border border-outline-variant/10 hover:border-outline-variant/25 transition-colors duration-300 flex flex-col"
            >
              <div className="flex items-center gap-1 mb-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className="material-symbols-outlined text-secondary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                ))}
              </div>
              <p className="font-body text-on-surface text-sm leading-relaxed flex-grow mb-6">
                "{t.text}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center font-headline font-bold text-sm text-on-surface">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-headline text-sm font-bold text-on-surface">{t.name}</p>
                  <p className="font-body text-xs text-on-surface-variant">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-20 max-w-3xl mx-auto">
        <h2 className="font-headline text-3xl font-bold text-on-surface text-center mb-14">
          Frequently asked questions
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-surface-container-low rounded-xl border border-outline-variant/10 overflow-hidden transition-colors hover:border-outline-variant/20"
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <span className="font-headline text-base font-semibold text-on-surface pr-4">{faq.q}</span>
                <span className={`material-symbols-outlined text-on-surface-variant transition-transform duration-300 flex-shrink-0 ${openFaq === i ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-40 pb-6' : 'max-h-0'}`}>
                <p className="font-body text-sm text-on-surface-variant leading-relaxed px-6">
                  {faq.a}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-20 text-center relative">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent rounded-3xl pointer-events-none" />
        <div className="relative z-10">
          <h2 className="font-headline text-4xl md:text-5xl font-extrabold text-on-surface mb-6">
            Start building your<br />financial architecture.
          </h2>
          <p className="font-body text-on-surface-variant text-lg mb-10 max-w-xl mx-auto">
            Join 12,400+ Indians who stopped leaking money and started compounding wealth.
          </p>
          <button className="px-12 py-5 rounded-xl bg-gradient-to-r from-primary to-primary-fixed-dim text-on-primary font-headline font-bold text-lg shadow-[0_20px_50px_-10px_rgba(78,222,163,0.4)] hover:shadow-[0_25px_60px_-10px_rgba(78,222,163,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300">
            Get Architect — ₹149/mo
          </button>
          <p className="font-body text-xs text-on-surface-variant mt-4">
            7-day full refund guarantee · Cancel anytime · No credit card required for free plan
          </p>
        </div>
      </section>
    </PageFrame>
  )
}
