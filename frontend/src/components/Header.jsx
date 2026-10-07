import { LogoMark } from './Icons.jsx'

export default function Header({ user, onLogin, onLogout }) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-stone-200 bg-white px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-2.5">
        <LogoMark className="shrink-0 text-brand-700" />
        <div className="min-w-0 leading-tight">
          <h1 className="truncate text-[17px] font-extrabold tracking-tight text-stone-900">Nearest Essentials</h1>
          <p className="hidden text-xs text-stone-500 sm:block">Groceries, medicines, cash and more, close by</p>
        </div>
      </div>

      {user ? (
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-stone-600 sm:inline">
            Hi, <span className="font-semibold text-stone-900">{user.name}</span>
          </span>
          <button
            onClick={onLogout}
            className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
          >
            Log out
          </button>
        </div>
      ) : (
        <button
          onClick={onLogin}
          className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-800"
        >
          Log in
        </button>
      )}
    </header>
  )
}
