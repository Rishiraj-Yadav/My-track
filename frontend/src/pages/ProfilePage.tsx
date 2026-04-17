import { useMemo, useState } from 'react'
import { ArrowRight, PencilLine, X } from 'lucide-react'
import { Card, PageFrame, Pill } from '../components'
import { calculateMonthlyTotals, formatCompactINR, healthScore, scoreLabel } from '../lib/finance'
import { useAppStore } from '../store'

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const initialsFor = (value: string) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'U'

const hashString = (value: string) =>
  Array.from(value).reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 360, 0)

export function ProfilePage() {
  const { profile, setProfile, expenses, goals, sip } = useAppStore()
  const totals = calculateMonthlyTotals(expenses)
  const netCashflow = profile.monthlySalary - totals.total
  const savingsRate = profile.monthlySalary > 0 ? Math.max(0, (netCashflow / profile.monthlySalary) * 100) : 0
  const currentHealth = healthScore({
    salary: profile.monthlySalary,
    leakage: totals.leakage,
    sipAmount: sip.monthlyAmount,
    goalsOnTrack: goals.some((goal) => goal.savedAmount >= goal.targetAmount * 0.35),
    streak: 12,
    subscriptions: expenses.filter((expense) => expense.name.toLowerCase().includes('ott')).length,
  })

  const [draftName, setDraftName] = useState(profile.name)
  const [draftSalary, setDraftSalary] = useState(String(profile.monthlySalary || ''))
  const [draftSavings, setDraftSavings] = useState(String(profile.savings || ''))
  const [pin, setPin] = useState(profile.pin)
  const [publicHandle, setPublicHandle] = useState(profile.handle || slugify(profile.name) || 'your-profile')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const displayHandle = useMemo(
    () => profile.handle || slugify(profile.name) || 'your-profile',
    [profile.handle, profile.name],
  )
  const displayEmail = `${displayHandle}@expenseautopsy.app`
  const avatarHue = useMemo(() => hashString(profile.name || 'user'), [profile.name])
  const avatarInitials = useMemo(() => initialsFor(profile.name || 'User'), [profile.name])

  const openEditor = () => {
    setDraftName(profile.name)
    setDraftSalary(String(profile.monthlySalary || ''))
    setDraftSavings(String(profile.savings || ''))
    setPin(profile.pin)
    setPublicHandle(profile.handle || slugify(profile.name) || 'your-profile')
    setIsEditing(true)
  }

  const cancelEditor = () => {
    setDraftName(profile.name)
    setDraftSalary(String(profile.monthlySalary || ''))
    setDraftSavings(String(profile.savings || ''))
    setPin(profile.pin)
    setPublicHandle(profile.handle || slugify(profile.name) || 'your-profile')
    setIsEditing(false)
  }

  const handleSave = async () => {
    const normalizedHandle = slugify(publicHandle) || slugify(draftName) || 'your-profile'
    try {
      setIsSaving(true)
      setSaveError('')
      await setProfile({
        name: draftName.trim(),
        monthlySalary: Number(draftSalary) || 0,
        savings: Number(draftSavings) || 0,
        pin,
        handle: normalizedHandle,
      })
      setPublicHandle(normalizedHandle)
      setIsEditing(false)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save profile')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <PageFrame>
      <div className="profile-page">
        <Card className="profile-hero">
          <div
            className="profile-hero__cover"
            style={{
              background: `linear-gradient(135deg, hsla(${avatarHue}, 84%, 84%, 0.95), rgba(245, 250, 255, 0.92) 54%, hsla(${(avatarHue + 40) % 360}, 82%, 86%, 0.92))`,
            }}
          />
          <div className="profile-hero__body">
            <div className="profile-hero__top">
              <div className="profile-ident">
                <div className="profile-avatar" style={{ background: `linear-gradient(180deg, hsla(${avatarHue}, 88%, 74%, 1), hsla(${(avatarHue + 28) % 360}, 84%, 68%, 1))` }}>
                  <span>{avatarInitials}</span>
                </div>
                <div>
                  <Pill tone="teal">Profile</Pill>
                  <h1 className="profile-name">{draftName.trim() || 'Your Profile'}</h1>
                  <p className="profile-email">{displayEmail}</p>
                  <p className="profile-handle">/{displayHandle}</p>
                </div>
              </div>

              <button
                className="button button--secondary profile-hero__action"
                onClick={openEditor}
              >
                <PencilLine size={16} />
                Edit profile
              </button>
            </div>

            <div className="profile-metrics">
              <div className="profile-metric">
                <span>Monthly salary</span>
                <strong>{formatCompactINR(Number(draftSalary) || 0)}</strong>
              </div>
              <div className="profile-metric">
                <span>Savings rate</span>
                <strong>{Math.round(savingsRate)}%</strong>
              </div>
              <div className="profile-metric">
                <span>Leakage</span>
                <strong className="text-warn">{formatCompactINR(totals.leakage)}</strong>
              </div>
              <div className="profile-metric">
                <span>Health score</span>
                <strong className="text-up">
                  {currentHealth} {scoreLabel(currentHealth)}
                </strong>
              </div>
            </div>
          </div>
        </Card>

        {isEditing ? (
          <div
            className="profile-modal__backdrop"
            role="presentation"
            onClick={cancelEditor}
          >
            <div
              className="profile-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="profile-modal-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="profile-panel__head">
                <div>
                  <Pill tone="teal">Public profile</Pill>
                  <h3 id="profile-modal-title">Edit your public profile</h3>
                </div>
                <button className="icon-btn" onClick={cancelEditor} aria-label="Close editor">
                  <X size={16} />
                </button>
              </div>

              <div className="profile-form">
                <label className="profile-field">
                  <span>Display name</span>
                  <input
                    className="text-input"
                    value={draftName}
                    onChange={(event) => setDraftName(event.target.value)}
                    placeholder="Your name"
                  />
                </label>

                <label className="profile-field">
                  <span>Profile URL</span>
                  <div className="profile-handle-row">
                    <span>expenseautopsy.app/</span>
                    <input
                      className="profile-handle-input"
                      value={publicHandle}
                      onChange={(event) => setPublicHandle(slugify(event.target.value))}
                      placeholder="your-handle"
                    />
                  </div>
                </label>

                <div className="profile-input-row">
                  <label className="profile-field">
                    <span>Monthly salary</span>
                    <input
                      className="text-input"
                      value={draftSalary}
                      onChange={(event) => setDraftSalary(event.target.value)}
                      inputMode="numeric"
                      placeholder="0"
                    />
                  </label>

                  <label className="profile-field">
                    <span>Savings</span>
                    <input
                      className="text-input"
                      value={draftSavings}
                      onChange={(event) => setDraftSavings(event.target.value)}
                      inputMode="numeric"
                      placeholder="0"
                    />
                  </label>
                </div>

                <label className="profile-field">
                  <span>PIN</span>
                  <input
                    className="text-input"
                    value={pin}
                    onChange={(event) => setPin(event.target.value)}
                    placeholder="4-digit PIN"
                    inputMode="numeric"
                  />
                </label>

                {saveError ? <p className="profile-summary-note">{saveError}</p> : null}

                <div className="profile-actions">
                  <button className="button button--secondary" onClick={cancelEditor}>
                    Cancel
                  </button>
                  <button className="button button--primary" onClick={handleSave} disabled={isSaving}>
                    <ArrowRight size={16} />
                    {isSaving ? 'Saving...' : 'Save changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </PageFrame>
  )
}
