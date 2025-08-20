import { Link, NavLink } from "react-router-dom";

export default function Shell({ children }) {
  return (
    <div className="min-h-dvh bg-neutral-950 text-neutral-100">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-neutral-950/70 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-semibold tracking-tight">
            Macro Tools
          </Link>
          <nav className="flex gap-4 text-sm">
            <NavLink to="/" className={({isActive}) => isActive ? "underline" : "hover:opacity-80"}>Home</NavLink>
            <NavLink to="/macro" className={({isActive}) => isActive ? "underline" : "hover:opacity-80"}>Macro Calc</NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>

      <footer className="mt-12 border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-neutral-400">
          © {new Date().getFullYear()} Macro Tools — All rights reserved
        </div>
      </footer>
    </div>
  );
}
