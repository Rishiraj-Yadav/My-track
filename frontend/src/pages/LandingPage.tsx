import { useEffect, useRef, useState } from 'react'
import { ArrowRight, WandSparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CTARow, PageFrame, Pill, Reveal, SectionHeader, StatCard } from '../components'
import { ModelViewer } from '../components/ModelViewer'
import {
  annualLeakage,
  calculateMonthlyTotals,
  formatCompactINR,
  formatINR,
  futureValueMonthly,
  healthScore,
  parseWhatIfCommand,
  percentage,
  scoreLabel,
} from '../lib/finance'
import { useAppStore } from '../store'

export function LandingPage() {
  const { expenses, goals, sip, profile, whatIf } = useAppStore()
  const totals = calculateMonthlyTotals(expenses)
  const bleedPerSecond = totals.leakage / 30 / 24 / 3600
  const future10Y = annualLeakage(totals.leakage, 12, 10)
  const health = healthScore({
    salary: profile.monthlySalary,
    leakage: totals.leakage,
    sipAmount: sip.monthlyAmount,
    goalsOnTrack: goals.some((goal) => goal.savedAmount >= goal.targetAmount * 0.35),
    streak: 12,
    subscriptions: expenses.filter((expense) => expense.name.toLowerCase().includes('ott')).length,
  })
  const parsed = parseWhatIfCommand(whatIf, expenses, sip.monthlyAmount)

  const t0 = useRef(0)
  const [wealthFactor, setWealthFactor] = useState(0)
  useEffect(() => {
    t0.current = performance.now()
    const id = window.setInterval(() => {
      const elapsed = (performance.now() - t0.current) / 1000
      setWealthFactor(Math.min(elapsed / 90, 1))
    }, 500)
    return () => window.clearInterval(id)
  }, [])

  return (
    <PageFrame>
      <section className="hero section">
        <div className="hero__copy">
          <Reveal>
            <Pill tone="teal">Hackathon-ready money intelligence</Pill>
          </Reveal>
          <Reveal delay={0.04}>
            <h1>See every rupee leak and watch the future cost rise in real time.</h1>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="hero__lede">
              Expense Autopsy turns avoidable habits into a live financial warning system,
              so users can cut waste, redirect cash into SIPs, and feel the compounding
              effect instantly.
            </p>
          </Reveal>
          <Reveal delay={0.12}>
            <CTARow
              primary={{ label: 'Start Saving', to: '/onboarding' }}
              secondary={{ label: 'View Dashboard', to: '/dashboard' }}
            />
          </Reveal>
          <Reveal delay={0.16}>
            <div className="hero__ticker card">
              <div className="hero__ticker-top">
                <span>Live money bleeding</span>
                <Pill tone="warning">Running now</Pill>
              </div>
              <strong>{formatINR(bleedPerSecond, 3)}</strong>
              <p>per second from avoidable and impulse habits</p>
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="hero__ask card">
              <span className="hero__ask-label">
                <WandSparkles size={14} />
                Ask AI-style what if
              </span>
              <div className="hero__ask-input">
                <span>What if I stop ordering Swiggy twice a week?</span>
                <ArrowRight size={16} />
              </div>
              <p>{parsed.label}</p>
            </div>
          </Reveal>
        </div>

        <div className="hero__visual">
          <ModelViewer
            wealthFactor={wealthFactor}
            className={wealthFactor > 0.5 ? 'model-viewer-wrap--hot' : ''}
          />
        </div>
      </section>

      <section className="section section--thin">
        <div className="trust-strip">
          <span>Built for students</span>
          <span>young professionals</span>
          <span>first-time investors</span>
          <span>hackathon demo-ready</span>
          <span>localStorage-safe</span>
        </div>
      </section>

      <section className="section">
        <SectionHeader
          eyebrow="Bento overview"
          title="A premium system for spotting leaks, simulating outcomes, and proving the upside."
          description="The app is designed like a polished SaaS landing page, but each card previews a real product interaction underneath."
          align="center"
        />
        <div className="bento-grid">
          {[
            ['Live bleed ticker', '₹/second updates tied to avoidable habits'],
            ['Classification engine', 'Essential, avoidable, or impulse in one dropdown'],
            ['Future cost', 'See the 10-year price tag of today’s behavior'],
            ['What-if simulator', 'Type a sentence and recalculate instantly'],
            ['SIP redirection', 'Send leakage straight into compounding'],
            ['Financial health', 'A score that moves as habits improve'],
            ['Goals tracking', 'Priority, deadline, and monthly savings'],
            ['Scenario comparison', 'Run side-by-side habit outcomes'],
          ].map((item, index) => (
            <Reveal key={item[0]} delay={index * 0.04}>
              <Card className={`bento-card bento-card--${index % 4}`}>
                <span className="bento-card__index">0{index + 1}</span>
                <h3>{item[0]}</h3>
                <p>{item[1]}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section section--split">
        <div>
          <SectionHeader
            eyebrow="How it works"
            title="Four steps from paycheck to projection."
            description="A tight onboarding loop makes the demo fast, while the calculations stay simple enough for a hackathon build."
          />
        </div>
        <div className="step-stack">
          {[
            ['Add profile and salary', 'Set name, PIN, income, and starting savings.'],
            ['Tag expenses', 'Drop every recurring habit into a clear expense class.'],
            ['Explore what-ifs', 'Use natural-language prompts to test one habit change.'],
            ['Redirect the leak', 'Move wasted money into SIPs and goals instantly.'],
          ].map((step, index) => (
            <Reveal key={step[0]} delay={index * 0.05}>
              <Card className="step-card">
                <div className="step-card__number">0{index + 1}</div>
                <h3>{step[0]}</h3>
                <p>{step[1]}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section">
        <SectionHeader eyebrow="Product preview" title="Screen-real previews that feel like the app, not a wireframe." align="center" />
        <div className="preview-grid">
          <PreviewPanel title="Dashboard" tone="teal">
            <MiniDashboardPreview />
          </PreviewPanel>
          <PreviewPanel title="Expenses" tone="red">
            <MiniExpensesPreview />
          </PreviewPanel>
          <PreviewPanel title="Simulator" tone="green">
            <MiniSimulatorPreview />
          </PreviewPanel>
          <PreviewPanel title="Insights" tone="blue">
            <MiniInsightsPreview />
          </PreviewPanel>
        </div>
      </section>

      <section className="section section--metrics">
        <SectionHeader eyebrow="Outcome" title="The metrics that make the story obvious in 30 seconds." align="center" />
        <div className="metrics-grid">
          <StatCard label="₹ saved from leaks" value={formatCompactINR(totals.leakage * 8)} note="annualized from current behavior" />
          <StatCard label="10-year leak cost" value={formatCompactINR(future10Y)} note="cost of doing nothing" />
          <StatCard label="Corpus gain from starting now" value={formatCompactINR(futureValueMonthly(sip.monthlyAmount, sip.annualReturn, 120))} note="10-year compounding" />
          <StatCard label="Health score improvement" value={`${health} / 100`} note={`classified as ${scoreLabel(health)}`} />
          <StatCard label="Avoidable spend reduced" value={`${Math.round(percentage(totals.leakage, totals.total))}%`} note="share of monthly outflow" />
        </div>
      </section>

      <section className="section">
        <SectionHeader eyebrow="Personas" title="Rule-based insights that feel personal without any ML overhead." align="center" />
        <div className="persona-grid">
          {[
            { title: 'Impulse spender', copy: 'Avoidable spend above 30% of salary.' },
            { title: 'SIP neglector', copy: 'No monthly investment set yet.' },
            { title: 'Disciplined saver', copy: 'Goals are on track and waste is low.' },
            { title: 'Subscription hoarder', copy: 'Too many recurring services in the stack.' },
          ].map((persona, index) => (
            <Reveal key={persona.title} delay={index * 0.04}>
              <Card className="persona-card">
                <Pill tone={index === 0 ? 'warning' : index === 1 ? 'teal' : 'positive'}>Insight</Pill>
                <h3>{persona.title}</h3>
                <p>{persona.copy}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section">
        <SectionHeader eyebrow="Testimonials" title="The kind of language judges and users both understand quickly." align="center" />
        <div className="testimonial-grid">
          {[
            ['“The live bleed ticker makes the problem obvious immediately.”', 'Priya, engineering student'],
            ['“The what-if input felt like magic during the demo.”', 'Kabir, hackathon judge favorite'],
            ['“I liked that it stays local and still feels premium.”', 'Meera, first-time investor'],
          ].map((quote, index) => (
            <Reveal key={quote[0]} delay={index * 0.05}>
              <Card className="testimonial-card">
                <p>{quote[0]}</p>
                <span>{quote[1]}</span>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section">
        <SectionHeader eyebrow="Pricing / demo plans" title="Built to demo, built to scale, built to win the room." description="Three clean tiers for presentation, hackathon polish, and the full showcase story." align="center" />
        <div className="pricing-grid">
          <PricingCard name="Demo" price="Free" features={['Landing page', 'Mock data', 'Local storage session']} />
          <PricingCard name="Pro" price="₹499" features={['What-if simulator', 'Scenario replay', 'Goal tracking']} highlight />
          <PricingCard name="Hackathon Showcase" price="₹999" features={['All routes', 'Animated charts', 'Premium storytelling']} />
        </div>
      </section>

      <section className="section">
        <SectionHeader eyebrow="FAQ" title="Everything a skeptical judge will ask." align="center" />
        <div className="faq-list">
          {[
            ['How is leakage calculated?', 'We sum avoidable and impulse expenses, convert to monthly equivalents, and project the future cost with a compound-growth formula.'],
            ['Does data stay local?', 'Yes. The demo uses localStorage only, so there is no backend dependency during judging.'],
            ['How does the what-if input work?', 'A lightweight regex parser matches a few common commands like stop, add SIP, or delay SIP.'],
            ['Is this beginner-friendly?', 'Very. The onboarding keeps the first session to profile, expenses, goals, and one SIP decision.'],
            ['How are SIP projections estimated?', 'They use standard monthly compounding with a configurable annual return rate.'],
          ].map((faq, index) => (
            <Reveal key={faq[0]} delay={index * 0.03}>
              <Card className="faq-card">
                <h3>{faq[0]}</h3>
                <p>{faq[1]}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section final-cta">
        <Card className="final-cta__card">
          <Pill tone="teal">Limited hackathon demo</Pill>
          <h2>Start your expense autopsy and make the future cost impossible to ignore.</h2>
          <p>
            In one flow, users can spot leaks, run a what-if, redirect cash into SIPs,
            and understand exactly why small habits are expensive.
          </p>
          <CTARow
            primary={{ label: 'Start your expense autopsy', to: '/onboarding' }}
            secondary={{ label: 'Jump to dashboard', to: '/dashboard' }}
          />
        </Card>
      </section>
    </PageFrame>
  )
}

function PreviewPanel({
  title,
  tone,
  children,
}: {
  title: string
  tone: 'teal' | 'red' | 'green' | 'blue'
  children: React.ReactNode
}) {
  return (
    <Card className={`preview-panel preview-panel--${tone}`}>
      <div className="panel-head">
        <span>{title}</span>
        <Pill tone={tone === 'red' ? 'warning' : tone === 'green' ? 'positive' : 'teal'}>{title}</Pill>
      </div>
      {children}
    </Card>
  )
}

function PricingCard({
  name,
  price,
  features,
  highlight = false,
}: {
  name: string
  price: string
  features: string[]
  highlight?: boolean
}) {
  return (
    <Card className={`pricing-card ${highlight ? 'pricing-card--highlight' : ''}`}>
      <Pill tone={highlight ? 'teal' : 'default'}>{name}</Pill>
      <strong>{price}</strong>
      <ul>
        {features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
      <Link to="/onboarding" className={`button ${highlight ? 'button--primary' : 'button--secondary'}`}>
        Choose plan
      </Link>
    </Card>
  )
}

function MiniDashboardPreview() {
  return (
    <div className="mini-preview">
      <div className="mini-preview__ticker">₹0.023 / sec</div>
      <div className="mini-preview__bars">
        <div style={{ width: '72%' }} />
        <div style={{ width: '42%' }} />
        <div style={{ width: '28%' }} />
      </div>
    </div>
  )
}

function MiniExpensesPreview() {
  return <div className="mini-preview mini-preview--table" />
}

function MiniSimulatorPreview() {
  return (
    <div className="mini-preview">
      <div className="mini-preview__curve" />
      <div className="mini-preview__curve mini-preview__curve--alt" />
    </div>
  )
}

function MiniInsightsPreview() {
  return (
    <div className="mini-preview mini-preview--pie">
      <div className="mini-preview__pie" />
    </div>
  )
}
