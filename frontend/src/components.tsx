import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

type ShellProps = {
  children: ReactNode
}

export function AppShell({ children }: ShellProps) {
  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="ambient ambient-three" />
      {children}
    </div>
  )
}

type PageFrameProps = {
  children: ReactNode
}

export function PageFrame({ children }: PageFrameProps) {
  return <main className="page-frame">{children}</main>
}

export function TopNav() {
  const links = [
    ['Dashboard', '/dashboard'],
    ['Expenses', '/expenses'],
    ['Simulator', '/simulator'],
    ['Goals', '/goals'],
  ] as const

  return (
    <header className="topnav">
      <div className="topnav__brand">
        <Link to="/" className="brand-mark" aria-label="Expense Autopsy home">
          <span>Expense Autopsy</span>
        </Link>
      </div>
      <nav className="topnav__links">
        {links.map(([label, href]) => (
          <NavLink
            key={href}
            to={href}
            className={({ isActive }) => `topnav__link ${isActive ? 'is-active' : ''}`}
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="topnav__actions">
        <Link to="/profile" className="button button--primary">
          Profile
          <ArrowRight size={16} />
        </Link>
      </div>
    </header>
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
