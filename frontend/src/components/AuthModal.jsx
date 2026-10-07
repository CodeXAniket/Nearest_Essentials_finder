import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { CloseIcon } from './Icons.jsx'

/** Log in / sign up dialog. On success hands { token, user } back to App. */
export default function AuthModal({ initialMode = 'login', onClose, onSuccess }) {
  const [mode, setMode] = useState(initialMode)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const isSignup = mode === 'signup'
  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const result = isSignup
        ? await api.register(form.name, form.email, form.password)
        : await api.login(form.email, form.password)
      onSuccess(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-ink/50 p-4 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md border border-ink bg-canvas"
      >
        <div className="flex items-center justify-between border-b border-hairline px-6 py-4">
          <p className="type-eyebrow text-ink">{isSignup ? 'New account' : 'Members'}</p>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full border border-hairline text-ink hover:border-ink"
          >
            <CloseIcon width={16} height={16} />
          </button>
        </div>

        <div className="px-6 pb-6 pt-5">
          <h2 id="auth-title" className="type-display-md text-ink">
            {isSignup ? 'Create an account' : 'Welcome back'}
          </h2>
          <p className="type-body-serif-md mb-6 mt-2 text-body">Save your go-to places and see your recent searches.</p>

          <form onSubmit={submit} className="space-y-4">
            {isSignup && <Field label="Name" value={form.name} onChange={update('name')} autoComplete="name" />}
            <Field label="Email" type="email" value={form.email} onChange={update('email')} autoComplete="email" />
            <Field
              label="Password"
              type="password"
              value={form.password}
              onChange={update('password')}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              minLength={isSignup ? 6 : undefined}
            />
            {error && (
              <p role="alert" className="type-body-sm border-l-2 border-ink bg-canvas-soft px-3 py-2.5 text-ink">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={busy}
              className="type-button min-h-12 w-full bg-ink px-5 py-3 text-canvas hover:bg-ink-soft disabled:opacity-60"
            >
              {busy ? 'Please wait…' : isSignup ? 'Sign up' : 'Log in'}
            </button>
          </form>

          <p className="type-body-sm mt-5 text-center text-body">
            {isSignup ? 'Already have an account?' : 'New here?'}{' '}
            <button
              onClick={() => {
                setMode(isSignup ? 'login' : 'signup')
                setError('')
              }}
              className="font-bold text-ink underline underline-offset-4"
            >
              {isSignup ? 'Log in' : 'Create an account'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="type-eyebrow mb-1.5 block text-ink">{label}</span>
      <input
        required
        {...props}
        className="type-body-md w-full border border-ink bg-canvas px-4 py-3 text-ink outline-none focus:shadow-[inset_0_0_0_1px_var(--color-ink)]"
      />
    </label>
  )
}
