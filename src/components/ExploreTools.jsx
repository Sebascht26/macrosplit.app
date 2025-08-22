// src/components/ExploreTools.jsx
import { Link, useLocation } from "react-router-dom";

const TOOLS = [
  { path: "/calories", title: "Calorie Calculator", blurb: "Estimate TDEE with activity and goals." }, // ← new
  { path: "/macro", title: "Macro Calculator", blurb: "Split your calories into protein, carbs, and fat." },
  { path: "/bmi", title: "BMI Calculator", blurb: "Body mass index with age-aware ranges." },
  { path: "/ffmi", title: "FFMI Calculator", blurb: "Fat-free mass index and category spectrum." },
  { path: "/1rm", title: "1RM Calculator", blurb: "Estimate your one-rep max from reps." },
];

export default function ExploreTools() {
  const { pathname } = useLocation();
  if (pathname === "/") return null;
  const cards = TOOLS.filter((t) => t.path !== pathname);
  if (cards.length === 0) return null;

  return (
    <section className="mt-12">
      <h3 className="text-lg font-semibold">Explore more tools</h3>
      <div className="mt-3 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((t) => (
          <Link key={t.path} to={t.path} className="block rounded-2xl border border-slate-200 bg-white p-4 hover:border-slate-300 hover:shadow-sm transition">
            <div className="font-medium">{t.title}</div>
            <div className="mt-1 text-xs text-slate-600">{t.blurb}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
