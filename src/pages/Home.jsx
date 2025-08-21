// src/pages/Home.jsx
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <>
      <title>Macro Tools</title>
      <meta name="description" content="Macro Tools: Macro Calculator, BMI, and FFMI calculators." />

      <div className="min-h-screen bg-white text-slate-900">
        <main className="mx-auto max-w-5xl px-4 py-8">
          <h1 className="text-2xl font-semibold tracking-tight mb-6">Macro Tools</h1>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <ToolCard
              to="/macro"
              title="Macro Calculator"
              desc="Plan daily protein, carbs, and fats from your goals."
            />
            <ToolCard
              to="/bmi"
              title="BMI Calculator"
              desc="Adult BMI, child percentiles, and healthy weight ranges."
            />
            <ToolCard
              to="/ffmi"
              title="FFMI Calculator"
              desc="Estimate muscularity from lean mass and height."
              badge="New"
            />
            <ToolCard
                to="/1rm"
                title="1RM Calculator"
               desc="Estimate your one-rep max, training max, and %1RM loads."
                badge="New"
            />

          </div>
        </main>
      </div>
    </>
  );
}

function ToolCard({ to, title, desc, badge }) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-300 hover:shadow-sm transition"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        {badge && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            {badge}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-slate-600">{desc}</p>
      <div className="mt-3 text-sm font-medium text-slate-900 group-hover:underline">Open →</div>
    </Link>
  );
}
