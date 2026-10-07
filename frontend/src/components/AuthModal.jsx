import { useState } from 'react'
import { api } from '../api.js'
import { CloseIcon } from './Icons.jsx'

/** Log in / sign up dialog. On success hands { token, user } back to App. */
export default function AuthModal({ initialMode = 'login', onClose, onSuccess }) {
  const [mode, setMode] = useState(initialMode)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

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
    <div
      className="fixed inset-0 z-[2000] flex items-end justify-center bg-stone-900/40 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-1 flex items-center justify-between">
          <h2 id="auth-title" className="text-xl font-extrabold">
            {isSignup ? 'Create an account' : 'Welcome back'}
          </h2>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-stone-500 hover:bg-stone-100">
            <CloseIcon />
          </button>
        </div>
        <p className="mb-5 text-sm text-stone-500">Save your go-to places and see your recent searches.</p>

        <form onSubmit={submit} className="space-y-3">
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
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-brand-700 py-2.5 text-sm font-bold text-white hover:bg-brand-800 disabled:opacity-60"
          >
            {busy ? 'Please wait…' : isSignup ? 'Sign up' : 'Log in'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-stone-600">
          {isSignup ? 'Already have an account?' : 'New here?'}{' '}
          <button
            onClick={() => {
              setMode(isSignup ? 'login' : 'signup')
              setError('')
            }}
            className="font-semibold text-brand-700 hover:underline"
          >
            {isSignup ? 'Log in' : 'Create an account'}
          </button>
        </p>
      </div>
    </div>
  )
}

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-stone-600">{label}</span>
      <input
        required
        {...props}
        className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
      />
    </label>
  )
}
