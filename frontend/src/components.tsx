import { motion } from 'framer-motion'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { ArrowRight, Check, CheckCircle2, ChevronDown, Languages, Moon, Sun } from 'lucide-react'
import { useI18n } from './i18n'
import { TierBadge } from './lib/subscription'

type ShellProps = {
  children: ReactNode
}

export function AppShell({ children }: ShellProps) {
  return (
    <div className="app-shell bg-surface text-on-surface font-body antialiased selection:bg-primary-container selection:text-primary min-h-screen">
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

export function TopNav({ onLogout }: { onLogout?: () => void } = {}) {
  const { language, setLanguage, copy } = useI18n()
  const [isLanguageOpen, setIsLanguageOpen] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') return 'dark'

    const storedTheme = window.localStorage.getItem('mytrack-theme')
    if (storedTheme === 'dark' || storedTheme === 'light') return storedTheme

    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  })
  const languageMenuRef = useRef<HTMLDivElement | null>(null)
  const navLinks = [
    { label: copy.nav.dashboard, href: '/dashboard', icon: 'dashboard' },
    { label: copy.nav.expenses, href: '/expenses', icon: 'payments' },
    { label: copy.nav.simulator, href: '/simulator', icon: 'query_stats' },
    { label: copy.nav.goals, href: '/goals', icon: 'track_changes' },
    { label: copy.nav.profile, href: '/profile', icon: 'lock' },
  ]
  const languages = [
    { value: 'en', label: copy.nav.languageNames.en },
    { value: 'hi', label: copy.nav.languageNames.hi },
    { value: 'ta', label: copy.nav.languageNames.ta },
    { value: 'bn', label: copy.nav.languageNames.bn },
  ] as const

  useEffect(() => {
    if (!isLanguageOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!languageMenuRef.current?.contains(event.target as Node)) {
        setIsLanguageOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsLanguageOpen(false)
      }
    }

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isLanguageOpen])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem('mytrack-theme', theme)
  }, [theme])

  return (
    <>
      <header className="topnav-header fixed top-0 w-full z-50 backdrop-blur-2xl">
        <div className="flex justify-between items-center px-12 py-6 w-full max-w-[1920px] mx-auto">
          <div className="flex items-center gap-12">
            <Link to="/" className="text-2xl font-black tracking-tighter text-emerald-400 font-headline">
              {copy.nav.brand}
            </Link>
            <nav className="hidden md:flex items-center gap-8 font-['Manrope'] font-bold tracking-tight text-sm uppercase">
              {navLinks.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) =>
                    isActive
                      ? 'topnav-link topnav-link--active'
                      : 'topnav-link'
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-6">
            <div ref={languageMenuRef} className={`language-picker ${isLanguageOpen ? 'is-open' : ''}`}>
              <button
                type="button"
                className="language-picker__trigger"
                aria-label={copy.nav.languageLabel}
                aria-haspopup="menu"
                aria-expanded={isLanguageOpen}
                onClick={() => setIsLanguageOpen((open) => !open)}
              >
                <span className="language-picker__badge">{copy.nav.languageLabel}</span>
                <span className="language-picker__icon" aria-hidden="true">
                  <Languages size={15} />
                </span>
                <span className="language-picker__value">
                  {languages.find((item) => item.value === language)?.label}
                </span>
                <span className="language-picker__chevron" aria-hidden="true">
                  <ChevronDown size={14} />
                </span>
              </button>
              {isLanguageOpen ? (
                <div className="language-picker__menu" role="menu" aria-label={copy.nav.languageLabel}>
                  {languages.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      role="menuitemradio"
                      aria-checked={language === item.value}
                      className={`language-picker__option ${language === item.value ? 'is-active' : ''}`}
                      onClick={() => {
                        setLanguage(item.value)
                        setIsLanguageOpen(false)
                      }}
                    >
                      <span>{item.label}</span>
                      {language === item.value ? <Check size={14} /> : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <button
              type="button"
              className="theme-toggle hidden md:inline-flex"
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              onClick={() => setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))}
            >
              <span className={`theme-toggle__thumb theme-toggle__thumb--${theme}`} aria-hidden="true" />
              <span className={`theme-toggle__icon ${theme === 'light' ? 'is-active' : ''}`} aria-hidden="true">
                <Sun size={16} />
              </span>
              <span className={`theme-toggle__icon ${theme === 'dark' ? 'is-active' : ''}`} aria-hidden="true">
                <Moon size={16} />
              </span>
            </button>
            <button
              onClick={onLogout}
              className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-full bg-surface-container-highest text-on-surface hover:bg-tertiary/15 hover:text-tertiary transition-colors text-sm font-medium font-body border border-outline-variant/15"
            >
              <span className="material-symbols-outlined text-base">logout</span>
              Sign Out
            </button>
            <div className="flex items-center gap-4 text-primary">
              <button className="topnav-icon-button">
                <span className="material-symbols-outlined text-2xl">notifications_active</span>
              </button>
              <Link to="/profile" className="topnav-icon-button" aria-label={copy.nav.profile}>
                <span className="material-symbols-outlined text-2xl">account_circle</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <nav className="side-rail hidden lg:flex flex-col h-screen w-72 rounded-r-[3rem] fixed left-0 top-0 z-40 py-10 pt-32">
        <div className="px-8 mb-12">
          <h2 className="side-rail__title text-xl font-bold font-headline mb-1">Wealth Gallery</h2>
          <TierBadge />
        </div>
        <div className="flex flex-col gap-2 font-['Manrope'] font-medium text-sm flex-grow">
          {navLinks.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                isActive
                  ? 'side-rail__link side-rail__link--active'
                  : 'side-rail__link'
              }
            >
              <span
                className="material-symbols-outlined"
              >
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
        </div>
        <div className="flex flex-col gap-2 font-['Manrope'] font-medium text-sm mt-auto">
          <NavLink
            to="/pricing"
            className={({ isActive }) =>
              isActive
                ? 'side-rail__link side-rail__link--accent'
                : 'side-rail__link'
            }
          >
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
            Pricing
          </NavLink>
          <a className="side-rail__link" href="#">
            <span className="material-symbols-outlined text-lg">settings</span>
            Settings
          </a>
          <a className="side-rail__link" href="#">
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
