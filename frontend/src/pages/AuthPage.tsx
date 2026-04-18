import { useState } from 'react'
import { api, setTokens } from '../lib/api'
import { setTier, type Tier } from '../lib/subscription'

type Mode = 'login' | 'signup'

export function AuthPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      let result
      if (mode === 'login') {
        result = await api.login(email, password)
      } else {
        if (!name.trim()) {
          setError('Name is required')
          setIsLoading(false)
          return
        }
        result = await api.register(email, password, name)
      }

      // Store tokens
      setTokens(result.accessToken, result.refreshToken)
      // Store session
      localStorage.setItem('mytracker-session-id', result.user.id)
      // Set tier from DB
      const userTier = (result.user as any).tier as Tier || 'starter'
      setTier(userTier)
      // Store auth state
      localStorage.setItem('mytracker-authed', 'true')
      localStorage.setItem('mytracker-user-email', result.user.email || '')
      localStorage.setItem('mytracker-user-name', result.user.profile?.name || '')

      // Force full reload to re-bootstrap with the new user's data
      window.location.href = '/dashboard'
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
    } finally {
      setIsLoading(false)
    }
  }

  const fillDemo = (email: string, password: string) => {
    setEmail(email)
    setPassword(password)
    setMode('login')
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambience */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="font-headline text-4xl font-black tracking-tighter text-primary mb-2">
            Architect
          </h1>
          <p className="font-body text-on-surface-variant text-sm">
            Your personal wealth intelligence platform
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-surface-container-low rounded-3xl p-8 border border-outline-variant/15 shadow-[0_40px_80px_rgba(0,0,0,0.3)]">
          {/* Mode Toggle */}
          <div className="flex bg-surface-container-highest rounded-xl p-1 mb-8">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-3 rounded-lg font-headline font-bold text-sm transition-all duration-300 ${
                mode === 'login'
                  ? 'bg-surface-container-low text-on-surface shadow-md'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-3 rounded-lg font-headline font-bold text-sm transition-all duration-300 ${
                mode === 'signup'
                  ? 'bg-surface-container-low text-on-surface shadow-md'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name (signup only) */}
            {mode === 'signup' && (
              <div>
                <label className="font-label text-xs text-on-surface-variant uppercase tracking-wider mb-2 block">
                  Full Name
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                    person
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Arjun Mehta"
                    className="w-full bg-surface-container-lowest rounded-xl pl-12 pr-4 py-3.5 border border-outline-variant/15 text-on-surface font-body focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="font-label text-xs text-on-surface-variant uppercase tracking-wider mb-2 block">
                Email
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  mail
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-surface-container-lowest rounded-xl pl-12 pr-4 py-3.5 border border-outline-variant/15 text-on-surface font-body focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="font-label text-xs text-on-surface-variant uppercase tracking-wider mb-2 block">
                Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  lock
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                  className="w-full bg-surface-container-lowest rounded-xl pl-12 pr-4 py-3.5 border border-outline-variant/15 text-on-surface font-body focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-tertiary/10 text-tertiary rounded-xl px-4 py-3 text-sm font-body">
                <span className="material-symbols-outlined text-base">error</span>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 rounded-xl font-headline font-bold text-base transition-all duration-300
                bg-gradient-to-r from-primary to-primary-fixed-dim text-on-primary
                shadow-[0_10px_30px_-5px_rgba(78,222,163,0.4)]
                hover:shadow-[0_15px_40px_-5px_rgba(78,222,163,0.5)]
                hover:scale-[1.01] active:scale-[0.99]
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                  {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : (
                mode === 'login' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>
        </div>

        {/* Demo Accounts */}
        <div className="mt-8 bg-surface-container-low/60 rounded-2xl p-6 border border-outline-variant/10 backdrop-blur-xl">
          <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-[0.2em] mb-4 text-center">
            Demo Accounts
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => fillDemo('arjun.mehta@gmail.com', 'arjun123')}
              className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-surface-container-lowest/50 border border-outline-variant/10 hover:border-primary/30 transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                  workspace_premium
                </span>
              </div>
              <div className="text-center">
                <p className="font-headline text-xs font-bold text-on-surface">Arjun Mehta</p>
                <p className="font-body text-[10px] text-primary font-semibold">Strategist Plan</p>
                <p className="font-body text-[10px] text-on-surface-variant mt-0.5">All features unlocked</p>
              </div>
            </button>
            <button
              onClick={() => fillDemo('sneha.patel@gmail.com', 'sneha123')}
              className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-surface-container-lowest/50 border border-outline-variant/10 hover:border-secondary/30 transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center">
                <span className="material-symbols-outlined text-on-surface-variant text-lg">
                  person
                </span>
              </div>
              <div className="text-center">
                <p className="font-headline text-xs font-bold text-on-surface">Sneha Patel</p>
                <p className="font-body text-[10px] text-on-surface-variant font-semibold">Free Plan</p>
                <p className="font-body text-[10px] text-on-surface-variant mt-0.5">Limited features</p>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center font-body text-xs text-on-surface-variant mt-6">
          By signing in, you agree to our Terms and Privacy Policy
        </p>
      </div>
    </div>
  )
}
