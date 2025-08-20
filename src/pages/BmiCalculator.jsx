// src/pages/BmiCalculator.jsx
import { useMemo, useState } from "react";

const LB_PER_KG = 2.2046226218;

export default function BmiCalculator() {
  const [units, setUnits] = useState("metric"); // 'metric' | 'imperial'
  const [sex, setSex] = useState("male");       // 'male' | 'female'
  const [age, setAge] = useState(25);           // years

  // Metric base state (derive imperial display from these)
  const [heightCm, setHeightCm] = useState(175);
  const [weightKg, setWeightKg] = useState(70);

  // Imperial display helpers
  const totalInches = Math.round(heightCm / 2.54);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches - feet * 12;
  const pounds = Math.round(weightKg * LB_PER_KG);

  // BMI computation (adult formula same for men/women; imperial uses 703 factor)
  const bmi = useMemo(() => {
    if (units === "metric") {
      const m = heightCm / 100;
      return +(weightKg / (m * m)).toFixed(1);
    } else {
      const inches = Math.round(heightCm / 2.54);
      const lb = Math.round(weightKg * LB_PER_KG);
      return +((703 * lb) / (inches * inches)).toFixed(1);
    }
  }, [units, heightCm, weightKg]);

  // Adult categories (used only when age >= 20)
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

  const ageIsAdult = age >= 20;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <main className="mx-auto max-w-5xl px-4 py-8 grid gap-6">
        {/* Title + unit toggle */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">BMI Calculator</h1>
          <div className="inline-flex rounded-xl overflow-hidden border border-slate-200">
            <button
              className={`px-3 py-2 text-sm font-medium ${
                units === "metric" ? "bg-slate-900 text-white" : "bg-white text-slate-800 hover:bg-slate-50"
              }`}
              onClick={() => setUnits("metric")}
            >
              Metric
            </button>
            <button
              className={`px-3 py-2 text-sm font-medium ${
                units === "imperial" ? "bg-slate-900 text-white" : "bg-white text-slate-800 hover:bg-slate-50"
              }`}
              onClick={() => setUnits("imperial")}
            >
              Imperial
            </button>
          </div>
        </div>

        {/* Sex + Age selectors */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm font-medium text-slate-700 mb-2">Sex</div>
              <div className="flex gap-2">
                <Segmented active={sex === "male"} onClick={() => setSex("male")}>Male</Segmented>
                <Segmented active={sex === "female"} onClick={() => setSex("female")}>Female</Segmented>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Adult BMI is calculated the same for men and women; interpretation differs only for children/teens.
              </p>
            </div>

            <div className="md:col-span-2">
              <Field label={`Age: ${age} yrs`}>
                <input
                  type="range"
                  min={2}
                  max={80}
                  step={1}
                  value={age}
                  onChange={(e) => setAge(+e.target.value)}
                  className="w-full"
                />
              </Field>
              {!ageIsAdult && (
                <div className="mt-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  For people under 20, BMI must be interpreted using sex‑ and age‑specific percentiles (BMI‑for‑age). Adult categories are not used.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Inputs */}
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

              <Results bmi={bmi} category={ageIsAdult ? category : "-"} showCategory={ageIsAdult} />
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

              <Results bmi={bmi} category={ageIsAdult ? category : "-"} showCategory={ageIsAdult} />
            </div>
          )}
        </section>

        {/* Explainer (official method + caveats) */}
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3">
          <h3 className="text-sm font-semibold">How BMI is officially calculated</h3>
          <p className="text-sm text-slate-700">
            BMI is weight relative to height: <span className="font-medium">metric</span> — weight (kg) / height (m)<sup>2</sup>;
            <span className="font-medium"> U.S. customary</span> — weight (lb) / height (in)<sup>2</sup> × 703. For adults (20+),
            the same categories are used for men and women. For people under 20, BMI must be interpreted using
            sex‑ and age‑specific percentiles (BMI‑for‑age) rather than adult cut‑offs.
          </p>
          <div className="text-xs text-slate-500">
            Adult categories (20+): Underweight &lt; 18.5 · Normal 18.5–24.9 · Overweight 25.0–29.9 ·
            Obesity I 30.0–34.9 · Obesity II 35.0–39.9 · Obesity III ≥ 40.0.
          </div>
          <p className="text-xs text-slate-500">
            BMI is a screening tool — it does not measure body fat directly and can misclassify very muscular people.
            Consider waist measures, body composition, and clinical context for a fuller picture.
          </p>
        </section>
      </main>
    </div>
  );
}

/* ---------- UI helpers ---------- */
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
function Segmented({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-xl text-sm font-medium border ${
        active
          ? "bg-slate-900 text-white border-slate-900"
          : "bg-white text-slate-800 border-slate-300 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}
function Results({ bmi, category, showCategory }) {
  const chip = showCategory
    ? chipClasses(category)
    : { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" };
  return (
    <Card>
      <div className="text-sm text-slate-600">Your BMI</div>
      <div className="mt-1 text-3xl font-bold">{isFinite(bmi) ? bmi : "-"}</div>
      {showCategory ? (
        <div className={`mt-2 inline-block rounded-full px-3 py-1 text-sm border ${chip.bg} ${chip.text} ${chip.border}`}>
          {category}
        </div>
      ) : (
        <div className="mt-2 inline-block rounded-full px-3 py-1 text-sm border border-slate-200 bg-slate-50 text-slate-700">
          Use BMI‑for‑age
        </div>
      )}
    </Card>
  );
}
function chipClasses(category) {
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
