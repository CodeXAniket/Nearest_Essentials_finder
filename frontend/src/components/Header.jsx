/** Masthead: the wordmark on the left, account actions on the right, a hairline underneath. */
export default function Header({ user, onLogin, onLogout }) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-ink bg-canvas px-4 sm:px-5">
      <div className="flex min-w-0 items-baseline gap-4">
        <h1 className="truncate font-display text-[26px] leading-none tracking-[-0.4px] text-ink">
          Nearest Essentials
        </h1>
        <p className="type-caption hidden truncate text-body md:block">
          Groceries, medicines, cash and more, close by
        </p>
      </div>

      {user ? (
        <div className="flex items-center gap-4">
          <span className="type-body-sm hidden text-body sm:inline">
            Signed in as <span className="font-bold text-ink">{user.name}</span>
          </span>
          <button
            onClick={onLogout}
            className="type-body-sm-strong border border-ink bg-canvas px-4 py-2.5 text-ink hover:bg-canvas-soft"
          >
            Log out
          </button>
        </div>
      ) : (
        <button onClick={onLogin} className="type-body-sm-strong bg-ink px-5 py-2.5 text-canvas hover:bg-ink-soft">
          Log in
        </button>
      )}
    </header>
  )
}
