// src/layouts/SiteLayout.jsx
import { Link, NavLink, Outlet } from "react-router-dom";

export default function SiteLayout() {
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/favicon.svg" alt="" className="h-6 w-6" />
            <span className="font-semibold tracking-tight">Macro Tools</span>
          </Link>

          <nav className="hidden sm:flex items-center gap-2 text-sm">
            <Nav to="/" end>Home</Nav>
            <Nav to="/macro">Macro</Nav>
            <Nav to="/bmi">BMI</Nav>
            <Nav to="/ffmi">FFMI</Nav>
            <Nav to="/1rm">1RM</Nav>
          </nav>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>© {new Date().getFullYear()} Macro Tools</div>
          <div className="flex gap-4">
            <a href="/impressum.html" className="hover:underline">Impressum</a>
            <a href="/privacy.html" className="hover:underline">Privacy</a>
            <a href="/disclaimer.html" className="hover:underline">Disclaimer</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Nav({ to, end = false, children }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `px-2 py-1 rounded-md ${
          isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
        }`
      }
    >
      {children}
    </NavLink>
  );
}
