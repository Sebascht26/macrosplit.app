import { Link, NavLink } from "react-router-dom";

export default function Shell({ children }) {
  return (
    <div className="min-h-dvh bg-white text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-semibold tracking-tight">
            Macro Tools
          </Link>
          <nav className="flex gap-4 text-sm">
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive
                  ? "underline underline-offset-4"
                  : "text-slate-600 hover:text-slate-900"
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/macro"
              className={({ isActive }) =>
                isActive
                  ? "underline underline-offset-4"
                  : "text-slate-600 hover:text-slate-900"
              }
            >
              Macro Calc
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>

      <footer className="mt-12 border-t border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>© {new Date().getFullYear()} Macro Tools — All rights reserved</div>
          <div className="flex gap-4">
            <a href="/impressum.html" className="underline underline-offset-4 hover:text-slate-900">
              Impressum
            </a>
            <a href="/privacy.html" className="underline underline-offset-4 hover:text-slate-900">
              Privacy Policy
            </a>
            <a href="/disclaimer.html" className="underline underline-offset-4 hover:text-slate-900">
              Disclaimer
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
