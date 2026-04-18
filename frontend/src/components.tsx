import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

type ShellProps = {
  children: ReactNode
}

export function AppShell({ children }: ShellProps) {
  return (
    <div className="bg-surface text-on-surface font-body antialiased selection:bg-primary-container selection:text-primary min-h-screen">
      {/* Background Ambience if desired */}
      {children}
    </div>
  )
}

type PageFrameProps = {
  children: ReactNode
}

export function PageFrame({ children }: PageFrameProps) {
  return <main className="pt-32 pb-24 lg:pl-[22rem] pr-8 lg:pr-12 min-h-screen">{children}</main>
}

export function TopNav() {
  const navLinks = [
    { label: 'Overview', href: '/dashboard', icon: 'dashboard' },
    { label: 'Cash Flow', href: '/expenses', icon: 'payments' },
    { label: 'Scenario Lab', href: '/simulator', icon: 'query_stats' },
    { label: 'Aspirations', href: '/goals', icon: 'track_changes', primary: true },
    { label: 'Vault', href: '/profile', icon: 'lock' },
  ]

  return (
    <>
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-zinc-950/80 backdrop-blur-2xl bg-gradient-to-b from-zinc-900/50 to-transparent shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
        <div className="flex justify-between items-center px-12 py-6 w-full max-w-[1920px] mx-auto">
          <div className="flex items-center gap-12">
            <Link to="/" className="text-2xl font-black tracking-tighter text-emerald-400 font-headline">
              Architect
            </Link>
            <nav className="hidden md:flex items-center gap-8 font-['Manrope'] font-bold tracking-tight text-sm uppercase">
              {navLinks.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) =>
                    isActive
                      ? "text-emerald-400 font-extrabold border-b-2 border-emerald-400 pb-1 hover:bg-white/5 transition-all duration-300 scale-95 active:scale-90 px-3 py-2 rounded-lg"
                      : "text-zinc-500 hover:text-zinc-100 transition-colors hover:bg-white/5 transition-all duration-300 scale-95 active:scale-90 px-3 py-2 rounded-lg"
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-6">
            <button className="hidden md:flex items-center gap-2 px-6 py-3 rounded-full bg-surface-container-highest text-on-surface hover:bg-surface-variant transition-colors text-sm font-medium font-body border border-outline-variant/15">
              Secure Portal
            </button>
            <div className="flex items-center gap-4 text-primary">
              <button className="hover:bg-white/5 p-2 rounded-full transition-colors">
                <span className="material-symbols-outlined text-2xl">notifications_active</span>
              </button>
              <Link to="/profile" className="hover:bg-white/5 p-2 rounded-full transition-colors">
                <span className="material-symbols-outlined text-2xl">account_circle</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* SideNavBar */}
      <nav className="hidden lg:flex flex-col h-screen w-72 rounded-r-[3rem] fixed left-0 top-0 z-40 bg-zinc-950 bg-zinc-900/30 shadow-[40px_0_80px_rgba(0,0,0,0.3)] py-10 pt-32">
        <div className="px-8 mb-12">
          <h2 className="text-xl font-bold text-zinc-100 font-headline mb-1">Wealth Gallery</h2>
          <p className="text-xs text-zinc-500 font-body uppercase tracking-wider">Premium Tier</p>
        </div>
        <div className="flex flex-col gap-2 font-['Manrope'] font-medium text-sm flex-grow">
          {navLinks.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                isActive || item.primary
                  ? "flex items-center gap-4 bg-emerald-400/10 text-emerald-400 rounded-full mx-4 py-4 px-6 font-bold hover:bg-zinc-900/50 transition-all translate-x-1 transition-transform"
                  : "flex items-center gap-4 text-zinc-500 hover:text-zinc-200 mx-4 py-4 px-6 hover:bg-zinc-900/50 transition-all rounded-xl translate-x-1 transition-transform"
              }
            >
              <span
                className="material-symbols-outlined"
                style={item.primary ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
        </div>
        <div className="px-8 mt-auto mb-8">
          <button className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-primary-fixed-dim text-on-primary font-bold font-headline shadow-[0_10px_20px_rgba(78,222,163,0.2)] hover:shadow-[0_15px_30px_rgba(78,222,163,0.3)] transition-all">
            New Simulation
          </button>
        </div>
        <div className="flex flex-col gap-2 font-['Manrope'] font-medium text-sm mt-auto">
          <a className="flex items-center gap-4 text-zinc-500 hover:text-zinc-200 mx-4 py-3 px-6 hover:bg-zinc-900/50 transition-all rounded-xl" href="#">
            <span className="material-symbols-outlined text-lg">settings</span>
            Settings
          </a>
          <a className="flex items-center gap-4 text-zinc-500 hover:text-zinc-200 mx-4 py-3 px-6 hover:bg-zinc-900/50 transition-all rounded-xl" href="#">
            <span className="material-symbols-outlined text-lg">gavel</span>
            Legal
          </a>
        </div>
      </nav>
    </>
  )
}

type SectionProps = {
  eyebrow?: string
  title: string
  description?: string
  align?: 'left' | 'center'
  children?: ReactNode
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = 'left',
  children,
}: SectionProps) {
  return (
    <div className={`section-header section-header--${align}`}>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2>{title}</h2>
      {description ? <p className="section-copy">{description}</p> : null}
      {children}
    </div>
  )
}

type CardProps = {
  children: ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return <div className={`card ${className}`.trim()}>{children}</div>
}

type StatCardProps = {
  label: string
  value: string
  note?: string
}

export function StatCard({ label, value, note }: StatCardProps) {
  return (
    <Card className="stat-card">
      <span className="stat-card__label">{label}</span>
      <strong className="stat-card__value">{value}</strong>
      {note ? <span className="stat-card__note">{note}</span> : null}
    </Card>
  )
}

type PillProps = {
  children: ReactNode
  tone?: 'default' | 'positive' | 'warning' | 'teal'
}

export function Pill({ children, tone = 'default' }: PillProps) {
  return <span className={`pill pill--${tone}`}>{children}</span>
}

type ProgressBarProps = {
  value: number
  tone?: 'default' | 'warning' | 'positive'
}

export function ProgressBar({ value, tone = 'default' }: ProgressBarProps) {
  return (
    <div className={`progress progress--${tone}`}>
      <motion.div
        className="progress__fill"
        initial={{ width: 0 }}
        whileInView={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        viewport={{ once: true, margin: '-20px' }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      />
    </div>
  )
}

type RevealProps = {
  children: ReactNode
  delay?: number
  className?: string
}

export function Reveal({ children, delay = 0, className = '' }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  )
}

type MetricRowProps = {
  items: Array<{ label: string; value: string }>
}

export function MetricRow({ items }: MetricRowProps) {
  return (
    <div className="metric-row">
      {items.map((item) => (
        <div key={item.label} className="metric-row__item">
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  )
}

type BulletListProps = {
  items: string[]
}

export function BulletList({ items }: BulletListProps) {
  return (
    <ul className="bullet-list">
      {items.map((item) => (
        <li key={item}>
          <CheckCircle2 size={16} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

type CTAProps = {
  primary: { label: string; to: string }
  secondary: { label: string; to: string }
}

export function CTARow({ primary, secondary }: CTAProps) {
  return (
    <div className="cta-row">
      <Link to={primary.to} className="button button--primary">
        {primary.label}
        <ArrowRight size={16} />
      </Link>
      <Link to={secondary.to} className="button button--secondary">
        {secondary.label}
      </Link>
    </div>
  )
}
