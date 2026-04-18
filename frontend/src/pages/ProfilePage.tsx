import { useState } from 'react'
import { PageFrame } from '../components'
import { formatCompactINR, formatINR } from '../lib/finance'
import { useAppStore } from '../store'

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export function ProfilePage() {
  const { profile, setProfile } = useAppStore()

  const [draftName, setDraftName] = useState(profile.name)
  const [draftSalary, setDraftSalary] = useState(String(profile.monthlySalary || ''))
  const [draftSavings, setDraftSavings] = useState(String(profile.savings || ''))
  const [publicHandle, setPublicHandle] = useState(profile.handle || slugify(profile.name) || 'your-profile')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const openEditor = () => {
    setDraftName(profile.name)
    setDraftSalary(String(profile.monthlySalary || ''))
    setDraftSavings(String(profile.savings || ''))
    setPublicHandle(profile.handle || slugify(profile.name) || 'your-profile')
    setIsEditing(true)
  }

  const cancelEditor = () => {
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
        pin: profile.pin,
        handle: normalizedHandle,
      })
      setIsEditing(false)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save profile')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <PageFrame>
      <div className="mb-12">
        <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight text-on-surface mb-2">Client Identity</h1>
        <p className="font-body text-on-surface-variant text-sm tracking-wide">Manage your central profile and security posture.</p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Identity Card (Hero) */}
        <div className="md:col-span-8 bg-surface-container-low rounded-xl p-10 relative overflow-hidden ring-1 ring-outline-variant/15 shadow-[0_20px_40px_rgba(0,0,0,0.2)] flex flex-col justify-between min-h-[300px]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="font-body text-primary text-xs font-bold tracking-widest uppercase mb-1">Primary Holder</p>
              <h2 className="font-headline text-3xl font-bold text-on-surface">{profile.name || 'Anonymous User'}</h2>
            </div>
            <button 
              onClick={openEditor}
              className="px-6 py-2 rounded-full border border-primary text-primary hover:bg-primary/10 transition-colors text-sm font-bold uppercase tracking-wider"
            >
              Edit Profile
            </button>
          </div>
          
          <div className="relative z-10 mt-12 grid grid-cols-2 gap-8">
            <div>
              <p className="font-body text-on-surface-variant text-xs mb-1">Client Handle</p>
              <p className="font-body text-on-surface font-medium text-sm tracking-widest">@{profile.handle || slugify(profile.name)}</p>
            </div>
            <div>
              <p className="font-body text-on-surface-variant text-xs mb-1">Status</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(78,222,163,0.6)]"></span>
                <p className="font-body text-on-surface font-medium text-sm">Verified Premium</p>
              </div>
            </div>
          </div>
        </div>

        {/* Salary/Income Card */}
        <div className="md:col-span-4 bg-surface-container-low rounded-xl p-8 relative overflow-hidden ring-1 ring-outline-variant/15 shadow-[0_20px_40px_rgba(0,0,0,0.2)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[1.2rem]">trending_up</span>
              </div>
              <p className="font-body text-on-surface-variant text-sm font-medium">Declared Inflow</p>
            </div>
            <h3 className="font-headline text-4xl font-extrabold text-on-surface tracking-tight">
              {formatCompactINR(profile.monthlySalary)}<span className="text-xl text-on-surface-variant font-medium">/mo</span>
            </h3>
          </div>
          <div className="mt-8">
            <button onClick={openEditor} className="text-xs font-body text-primary hover:text-primary-fixed transition-colors flex items-center gap-1 uppercase tracking-widest font-bold">
              Update Income <span className="material-symbols-outlined text-[1rem]">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Savings/Vault Card */}
        <div className="md:col-span-5 bg-surface-container-low rounded-xl p-8 relative overflow-hidden ring-1 ring-outline-variant/15 shadow-[0_20px_40px_rgba(0,0,0,0.2)] flex flex-col justify-between">
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-secondary/5 to-transparent"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center">
                <span className="material-symbols-outlined text-secondary text-[1.2rem]">account_balance</span>
              </div>
              <p className="font-body text-on-surface-variant text-sm font-medium">Vault Reserves (Savings)</p>
            </div>
            <h3 className="font-headline text-4xl font-extrabold text-on-surface tracking-tight">
              {formatINR(profile.savings)}
            </h3>
            <p className="font-body text-secondary text-xs mt-2">+4.2% optimized yield</p>
          </div>
        </div>

        {/* Security Settings Card */}
        <div className="md:col-span-7 bg-surface-container-low rounded-xl p-8 relative overflow-hidden ring-1 ring-outline-variant/15 shadow-[0_20px_40px_rgba(0,0,0,0.2)]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-headline text-xl font-bold text-on-surface">Security Posture</h3>
            <span className="px-3 py-1 bg-primary/10 text-primary text-[0.65rem] uppercase tracking-widest font-bold rounded-full">Maximum</span>
          </div>
          
          <div className="space-y-2">
            {/* Security Item */}
            <div className="flex items-center justify-between p-4 rounded-lg hover:bg-surface-container-highest/50 transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors text-[1.25rem]">fingerprint</span>
                <div>
                  <p className="font-body text-sm font-medium text-on-surface">Biometric Authentication</p>
                  <p className="font-body text-xs text-on-surface-variant mt-0.5">Enabled for Web & Mobile</p>
                </div>
              </div>
              <div className="w-10 h-6 bg-primary rounded-full relative shadow-[0_0_10px_rgba(78,222,163,0.3)]">
                <div className="w-4 h-4 bg-background rounded-full absolute right-1 top-1"></div>
              </div>
            </div>
            
            {/* Security Item */}
            <div className="flex items-center justify-between p-4 rounded-lg hover:bg-surface-container-highest/50 transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors text-[1.25rem]">phonelink_lock</span>
                <div>
                  <p className="font-body text-sm font-medium text-on-surface">Two-Factor Auth (2FA)</p>
                  <p className="font-body text-xs text-on-surface-variant mt-0.5">Authenticator App Configured</p>
                </div>
              </div>
              <button className="text-xs font-body text-on-surface hover:text-primary transition-colors">Manage</button>
            </div>
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={cancelEditor}>
          <div className="bg-surface-container-high rounded-3xl p-8 w-full max-w-lg shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-outline-variant/20" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-headline text-2xl font-bold text-on-surface">Edit Profile</h3>
              <button className="text-on-surface-variant hover:text-on-surface transition-colors" onClick={cancelEditor}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="flex flex-col">
                <label className="font-body text-xs text-on-surface-variant uppercase tracking-wider mb-2">Display Name</label>
                <input
                  className="bg-transparent border-b-2 border-surface-variant focus:border-primary text-xl font-headline font-bold text-on-surface p-2 focus:ring-0 outline-none transition-colors"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                />
              </div>
              
              <div className="flex flex-col">
                <label className="font-body text-xs text-on-surface-variant uppercase tracking-wider mb-2">Handle</label>
                <div className="flex items-baseline border-b-2 border-surface-variant focus-within:border-primary transition-colors">
                  <span className="text-on-surface-variant text-xl p-2 pl-0">@</span>
                  <input
                    className="bg-transparent border-none text-xl font-headline text-on-surface p-2 focus:ring-0 outline-none w-full"
                    value={publicHandle}
                    onChange={(e) => setPublicHandle(slugify(e.target.value))}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <label className="font-body text-xs text-on-surface-variant uppercase tracking-wider mb-2">Monthly Salary (₹)</label>
                  <input
                    className="bg-transparent border-b-2 border-surface-variant focus:border-primary text-xl font-headline font-bold text-on-surface p-2 focus:ring-0 outline-none transition-colors"
                    value={draftSalary}
                    type="number"
                    onChange={(e) => setDraftSalary(e.target.value)}
                  />
                </div>
                
                <div className="flex flex-col">
                  <label className="font-body text-xs text-on-surface-variant uppercase tracking-wider mb-2">Total Savings (₹)</label>
                  <input
                    className="bg-transparent border-b-2 border-surface-variant focus:border-primary text-xl font-headline font-bold text-on-surface p-2 focus:ring-0 outline-none transition-colors"
                    value={draftSavings}
                    type="number"
                    onChange={(e) => setDraftSavings(e.target.value)}
                  />
                </div>
              </div>

              {saveError && <p className="text-error text-sm font-body">{saveError}</p>}
              
              <div className="flex gap-4 mt-8">
                <button 
                  className="flex-1 py-4 rounded-xl border border-outline-variant/30 text-on-surface font-bold hover:bg-surface-variant/50 transition-colors"
                  onClick={cancelEditor}
                >
                  Cancel
                </button>
                <button 
                  className="flex-1 py-4 rounded-xl bg-primary text-on-primary font-bold hover:bg-primary-fixed transition-colors"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageFrame>
  )
}
