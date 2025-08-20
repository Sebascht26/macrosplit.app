// src/pages/BmiCalculator.jsx
import { useMemo, useState } from "react";

const LB_PER_KG = 2.2046226218;

export default function BmiCalculator() {
  const [units, setUnits] = useState("metric"); // 'metric' | 'imperial'
  // Metric base state (we’ll derive imperial display from these)
  const [heightCm, setHeightCm] = useState(175);
  const [weightKg, setWeightKg] = useState(70);

  // Imperial display helpers
  const totalInches = Math.round(heightCm / 2.54);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches - feet * 12;
  const pounds = Math.round(weightKg * LB_PER_KG);

  const bmi = useMemo(() => {
    if (units === "metric") {
      const m = heightCm / 100;
      return +(weightKg / (m * m)).toFixed(1);
    } else {
      // BMI = 703 * lb / in^2
      const inches = Math.round(heightCm / 2.54);
      const lb = Math.round(weightKg * LB_PER_KG);
      return +((703 * lb) / (inches * inches)).toFixed(1);
    }
  }, [units, heightCm, weightKg]);

  const category = useMemo(() => {
    if (!bmi || !isFinite(bmi)) return "-";
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Normal";
    if (bmi < 30) return "Overweight";
    if (bmi < 35) return "Obesity (Class I)";
    if (bmi < 40) return "Obesity (Class II)";
    return "Obesity (Class III)";
  }, [bmi]);

  const setHeightFromFtIn = (ft, inch) => {
    const cm = Math.round(((ft * 12) + inch) * 2.54);
    setHeightCm(Math.max(120, Math.min(220, cm)));
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <main className="mx-auto max-w-5xl px-4 py-8 grid gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">BMI Calculator</h1>
          <div className="inline-flex rounded-xl overflow-hidden border border-slate-200">
            <button
              className={`px-3 py-2 text-sm font-medium ${units === "metric" ? "bg-slate-900 text-white" : "bg-white text-slate-800 hover:bg-slate-50"}`}
              onClick={() => setUnits("metric")}
            >
              Metric (kg/cm)
            </button>
            <button
              className={`px-3 py-2 text-sm font-medium ${units === "imperial" ? "bg-slate-900 text-white" : "bg-white text-slate-800 hover:bg-slate-50"}`}
              onClick={() => setUnits("imperial")}
            >
              Imperial (lb/ft/in)
            </button>
          </div>
        </div>

        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          {units === "metric" ? (
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <Field label={`Height: ${heightCm} cm`}>
                  <input
                    type="range"
                    min={120}
                    max={220}
                    value={heightCm}
                    onChange={(e) => setHeightCm(+e.target.value)}
                    className="w-full"
                  />
                </Field>
                <Field label={`Weight: ${weightKg.toFixed(1)} kg`}>
                  <input
                    type="range"
                    min={35}
                    max={200}
                    step={0.5}
                    value={weightKg}
                    onChange={(e) => setWeightKg(+e.target.value)}
                    className="w-full"
                  />
                </Field>
              </Card>

              <Results bmi={bmi} category={category} />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <Field label={`Height: ${feet} ft ${inches} in`}>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Feet</div>
                      <input
                        type="range"
                        min={4}
                        max={7}
                        value={feet}
                        onChange={(e) => setHeightFromFtIn(+e.target.value, inches)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Inches</div>
                      <input
                        type="range"
                        min={0}
                        max={11}
                        value={inches}
                        onChange={(e) => setHeightFromFtIn(feet, +e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>
                </Field>
                <Field label={`Weight: ${pounds} lb`}>
                  <input
                    type="range"
                    min={90}
                    max={440}
                    step={1}
                    value={pounds}
                    onChange={(e) => {
                      const lbs = +e.target.value;
                      setWeightKg(parseFloat((lbs / LB_PER_KG).toFixed(1)));
                    }}
                    className="w-full"
                  />
                </Field>
              </Card>

              <Results bmi={bmi} category={category} />
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-sm font-semibold mb-2">What the numbers mean</h3>
          <ul className="text-sm text-slate-700 space-y-1">
            <li><span className="font-medium">Underweight</span>: &lt; 18.5</li>
            <li><span className="font-medium">Normal</span>: 18.5–24.9</li>
            <li><span className="font-medium">Overweight</span>: 25.0–29.9</li>
            <li><span className="font-medium">Obesity (Class I)</span>: 30.0–34.9</li>
            <li><span className="font-medium">Obesity (Class II)</span>: 35.0–39.9</li>
            <li><span className="font-medium">Obesity (Class III)</span>: ≥ 40.0</li>
          </ul>
          <p className="text-xs text-slate-500 mt-3">
            BMI is a population screening metric; it doesn’t directly measure body fat or account for high muscle mass.
          </p>
        </section>
      </main>
    </div>
  );
}

function Card({ children }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4">{children}</div>;
}
function Field({ label, hint, children }) {
  return (
    <div className="mb-4">
      <div className="flex items-baseline justify-between">
        <div className="text-sm font-medium text-slate-800">{label}</div>
        {hint && <div className="text-xs text-slate-500">{hint}</div>}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}
function Results({ bmi, category }) {
  const chip = chipClasses(category);
  return (
    <Card>
      <div className="text-sm text-slate-600">Your BMI</div>
      <div className="mt-1 text-3xl font-bold">{isFinite(bmi) ? bmi : "-"}</div>
      <div
        className={`mt-2 inline-block rounded-full px-3 py-1 text-sm border ${chip.bg} ${chip.text} ${chip.border}`}
      >
        {category}
      </div>
    </Card>
  );
}

function chipClasses(category) {
  // Subtle: green for Normal; amber for Under/Overweight; rose for Obesity classes; grey fallback
  if (category === "Normal") {
    return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" };
  }
  if (category === "Underweight" || category === "Overweight") {
    return { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200" };
  }
  if (category.startsWith("Obesity")) {
    return { bg: "bg-rose-50", text: "text-rose-800", border: "border-rose-200" };
  }
  return { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" };
}
