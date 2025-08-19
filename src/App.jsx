import { useEffect, useMemo, useState } from "react";

const ACTIVITY_STEPS = [
  { key: 1, label: "Sedentary", mult: 1.2, desc: "Little/no exercise" },
  { key: 2, label: "Light", mult: 1.375, desc: "1–3x/week" },
  { key: 3, label: "Moderate", mult: 1.55, desc: "3–5x/week" },
  { key: 4, label: "Active", mult: 1.725, desc: "6–7x/week" },
  { key: 5, label: "Very Active", mult: 1.9, desc: "Physical job + training" },
];

const LB_PER_KG = 2.2046226218;

function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max);
}

export default function App() {
  // Units for Step 1
  const [units, setUnits] = useState("metric"); // 'metric' | 'imperial'

  // STEP 1 — CALORIES (underlying state kept in METRIC: kg + cm)
  const [mode, setMode] = useState("calculate"); // 'calculate' | 'custom'
  const [age, setAge] = useState(25);
  const [height, setHeight] = useState(175); // cm
  const [weight, setWeight] = useState(70);  // kg
  const [sex, setSex] = useState("male");    // 'male' | 'female'
  const [activityIndex, setActivityIndex] = useState(3); // 1..5
  // goalRate is in CURRENT UNITS: kg/week for metric, lb/week for imperial
  const [goalRate, setGoalRate] = useState(0);
  const [customCalories, setCustomCalories] = useState(2200);

  // STEP 2 — MACROS (grams)
  const [protein, setProtein] = useState(140);
  const [fat, setFat] = useState(56);
  const [carbs, setCarbs] = useState(250);

  // Lock macro total to target calories by auto-adjusting CARBS
  const [lockMacrosToCalories, setLockMacrosToCalories] = useState(true);

  const [showActivityHelp, setShowActivityHelp] = useState(false);


  // ---- Derived displays for imperial inputs (but keep core in metric) ----
  const displayedLbs = Math.round(weight * LB_PER_KG);
  const totalInches = Math.round(height / 2.54);
  const displayedFt = Math.floor(totalInches / 12);
  const displayedIn = totalInches - displayedFt * 12;

  const activity = useMemo(
    () => ACTIVITY_STEPS.find(a => a.key === activityIndex) ?? ACTIVITY_STEPS[2],
    [activityIndex]
  );

  // Mifflin–St Jeor BMR (requires metric internally)
  const bmr = useMemo(() => {
    const base = 10 * weight + 6.25 * height - 5 * age;
    return Math.round(sex === "male" ? base + 5 : base - 161);
  }, [age, height, weight, sex]);

  // Goal rate energy conversion per mass unit
  const deltaPerUnit = units === "metric" ? 7700 : 3500; // kcal per kg or per lb (approx)
  const calcCalories = useMemo(() => {
    if (mode === "custom") return Math.max(0, Math.round(customCalories || 0));
    const dailyDelta = (deltaPerUnit * goalRate) / 7;
    const tdee = bmr * activity.mult + dailyDelta;
    return Math.max(0, Math.round(tdee));
  }, [mode, customCalories, bmr, activity.mult, goalRate, deltaPerUnit]);

  const macroCalories = protein * 4 + fat * 9 + carbs * 4;
  const kcalDiff = calcCalories - macroCalories;
  const KCAL_TOL = 15; // allow small rounding tolerance for macro calories
  // Auto-balance carbs whenever locked and dependencies change
  useEffect(() => {
    if (!lockMacrosToCalories) return;
    const remaining = calcCalories - (protein * 4 + fat * 9);
    setCarbs(clamp(Math.round(remaining / 4), 0, 600));
  }, [lockMacrosToCalories, calcCalories, protein, fat]);

  const autoBalanceCarbs = () => {
    const remaining = calcCalories - (protein * 4 + fat * 9);
    setCarbs(clamp(Math.round(remaining / 4), 0, 600));
  };

  const applySmartDefaults = () => {
    const p = clamp(Math.round(weight * 2.0), 60, 260);   // ≈2.0 g/kg
    const f = clamp(Math.round(weight * 0.8), 35, 120);   // ≈0.8 g/kg
    setProtein(p);
    setFat(f);
    // carbs will auto-update if locked; otherwise compute once
    if (!lockMacrosToCalories) autoBalanceCarbs();
  };

  // Handle unit switch — convert goalRate so calorie delta stays consistent
  const switchUnits = (target) => {
    if (target === units) return;
    // Convert goalRate kg<->lb
    setGoalRate(prev => {
      if (target === "imperial") return +(prev * LB_PER_KG).toFixed(2); // kg/wk -> lb/wk
      return +(prev / LB_PER_KG).toFixed(2); // lb/wk -> kg/wk
    });
    setUnits(target);
  };

  // Helpers to set metric height from ft/in sliders
  const setHeightFromFtIn = (ft, inch) => {
    const cm = Math.round(((ft * 12) + inch) * 2.54);
    setHeight(clamp(cm, 120, 220));
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur bg-white/70 border-b border-gray-200">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-blue-700">
            Macro Calculator
          </h1>
          <div className="flex gap-2">
            <button
              onClick={applySmartDefaults}
              className="rounded-xl px-3 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
            >
              Smart defaults
            </button>
            {!lockMacrosToCalories && (
              <button
                onClick={autoBalanceCarbs}
                className="rounded-xl px-3 py-2 text-sm font-medium bg-gray-200 text-gray-800 hover:bg-gray-300"
              >
                Auto-balance carbs
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 grid gap-6">
        {/* STEP 1: CALORIES */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Step 1 · Calories</h2>
            <div className="inline-flex rounded-xl overflow-hidden border border-gray-200">
              <button
                className={`px-3 py-2 text-sm font-medium ${units === "metric" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
                onClick={() => switchUnits("metric")}
              >
                Metric (kg/cm)
              </button>
              <button
                className={`px-3 py-2 text-sm font-medium ${units === "imperial" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
                onClick={() => switchUnits("imperial")}
              >
                Imperial (lb/ft/in)
              </button>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="inline-flex rounded-xl overflow-hidden border border-gray-200">
            <button
              className={`px-4 py-2 text-sm font-medium ${mode === "calculate" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
              onClick={() => setMode("calculate")}
            >
              Calculate
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${mode === "custom" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
              onClick={() => setMode("custom")}
            >
              Enter custom
            </button>
          </div>

          {/* Calculate Mode */}
          {mode === "calculate" ? (
            <div className="mt-6 grid md:grid-cols-2 gap-6">
              <Card>
                <Field label={`Age: ${age} yrs`}>
                  <input type="range" min={15} max={80} value={age}
                    onChange={(e) => setAge(+e.target.value)} className="w-full" />
                </Field>

                {units === "metric" ? (
                  <>
                    <Field label={`Height: ${height} cm`}>
                      <input type="range" min={140} max={210} value={height}
                        onChange={(e) => setHeight(+e.target.value)} className="w-full" />
                    </Field>
                    <Field label={`Weight: ${weight.toFixed(1)} kg`}>
                      <input type="range" min={40} max={200} step={0.5} value={weight}
                        onChange={(e) => setWeight(+e.target.value)} className="w-full" />
                    </Field>
                  </>
                ) : (
                  <>
                    <Field label={`Height: ${displayedFt} ft ${displayedIn} in`}>
                      <div className="space-y-2">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Feet</div>
                          <input type="range" min={4} max={7} value={displayedFt}
                            onChange={(e) => setHeightFromFtIn(+e.target.value, displayedIn)}
                            className="w-full" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Inches</div>
                          <input type="range" min={0} max={11} value={displayedIn}
                            onChange={(e) => setHeightFromFtIn(displayedFt, +e.target.value)}
                            className="w-full" />
                        </div>
                      </div>
                    </Field>
                    <Field label={`Weight: ${displayedLbs} lb`}>
                      <input
                        type="range"
                        min={90} max={440} step={1}
                        value={displayedLbs}
                        onChange={(e) => {
                          const lbs = +e.target.value;
                          setWeight(parseFloat((lbs / LB_PER_KG).toFixed(1)));
                        }}
                        className="w-full"
                      />
                    </Field>
                  </>
                )}
              </Card>

              <Card>
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">Sex</div>
                  <div className="flex gap-2">
                    <Segmented active={sex === "male"} onClick={() => setSex("male")}>Male</Segmented>
                    <Segmented active={sex === "female"} onClick={() => setSex("female")}>Female</Segmented>
                  </div>
                </div>

                <Field label={`Activity: ${activity.label} (×${activity.mult})`}>
                  <input
                    type="range"
                    min={1} max={5} step={1}
                    value={activityIndex}
                    onChange={(e) => setActivityIndex(+e.target.value)}
                    className="w-full"
                  />
                  <div className="mt-1 text-xs text-gray-500">{activity.desc}</div>
                </Field>

                <Field
                  label={`Goal: ${goalRate.toFixed(2)} ${units === "metric" ? "kg/week" : "lb/week"} (${goalRate === 0 ? "Maintain" : goalRate < 0 ? "Lose" : "Gain"})`}
                  hint={units === "metric" ? "Daily kcal change ≈ 1100 × kg/week" : "Daily kcal change ≈ 500 × lb/week"}
                >
                  <input
                    type="range"
                    min={units === "metric" ? -1 : -2.2}
                    max={units === "metric" ? 1 : 2.2}
                    step={units === "metric" ? 0.25 : 0.5}
                    value={goalRate}
                    onChange={(e) => setGoalRate(+e.target.value)}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Lose faster</span>
                    <span>Maintain</span>
                    <span>Gain faster</span>
                  </div>
                </Field>
              </Card>
            </div>
          ) : (
            // Custom Mode
            <div className="mt-6 max-w-sm">
              <label className="block text-sm font-medium text-gray-700 mb-1">Custom calories</label>
              <input
                type="number"
                inputMode="numeric"
                className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={customCalories}
                onChange={(e) => setCustomCalories(+e.target.value)}
                min={0}
              />
            </div>
          )}

          <div className="mt-6 grid sm:grid-cols-3 gap-4">
            <InfoTile title="BMR (Mifflin-St Jeor)" value={`${bmr} kcal/day`} />
            <InfoTile title="Target calories" value={`${calcCalories} kcal/day`} highlight />
            <InfoTile title="Activity factor" value={`× ${activity.mult}`} />
          </div>
        </section>

        {/* STEP 2: MACROS */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Step 2 · Macros (grams)</h2>
            <label className="inline-flex items-center gap-2 select-none">
              <input
                type="checkbox"
                className="sr-only"
                checked={lockMacrosToCalories}
                onChange={(e) => setLockMacrosToCalories(e.target.checked)}
              />
              <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                lockMacrosToCalories ? "bg-blue-600" : "bg-gray-300"
              }`}>
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                  lockMacrosToCalories ? "translate-x-5" : "translate-x-1"
                }`} />
              </span>
              <span className="text-sm font-medium">
                {lockMacrosToCalories ? "Locked to calories (auto-carbs)" : "Unlocked (edit carbs freely)"}
              </span>
            </label>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <MacroSlider
              label={`Protein: ${protein} g`}
              min={40} max={300} value={protein}
              onChange={(v) => setProtein(v)}
              subtitle="~2.0 g/kg is common for lifters"
            />
            <MacroSlider
              label={`Fat: ${fat} g`}
              min={20} max={150} value={fat}
              onChange={(v) => setFat(v)}
              subtitle="~0.6–1.0 g/kg is typical"
            />
            <MacroSlider
              label={`Carbs: ${carbs} g`}
              min={0} max={600} value={carbs}
              onChange={(v) => setCarbs(v)}
              subtitle={lockMacrosToCalories ? "Auto-adjusted to hit calories" : "Adjust freely"}
              disabled={lockMacrosToCalories}
            />
          </div>

          <div className="mt-6 grid sm:grid-cols-4 gap-4">
            <InfoTile title="Protein kcal" value={`${protein * 4}`} />
            <InfoTile title="Fat kcal" value={`${fat * 9}`} />
            <InfoTile title="Carb kcal" value={`${carbs * 4}`} />
            <InfoTile title="Macros total" value={`${macroCalories} kcal`} />
          </div>

          <div className="mt-4">
  {Math.abs(kcalDiff) <= KCAL_TOL ? (
    <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2 inline-block">
      Macros closely match your target (±{KCAL_TOL} kcal).
    </div>
  ) : lockMacrosToCalories ? (
    <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 inline-block">
      Protein/Fat combination exceeds target — carbs floored at 0 g. Reduce Protein/Fat or increase calories.
    </div>
  ) : (
    <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 inline-flex items-center gap-2">
      Your macros are {Math.abs(kcalDiff)} kcal {kcalDiff > 0 ? "below" : "above"} target.
      <button
        onClick={autoBalanceCarbs}
        className="ml-1 underline decoration-amber-500 hover:opacity-80"
      >
        Auto-balance carbs
      </button>
    </div>
  )}

          </div>
        </section>
      </main>

      <footer className="py-8 text-center text-xs text-gray-500 space-y-2 border-t">
        
         <div className="space-x-4">
           <a href="/impressum.html" className="underline">Impressum</a>
           <a href="/disclaimer.html" className="underline">Disclaimer</a>
           <a href="/privacy.html" className="underline">Privacy Policy</a>
         </div>
      </footer>
    </div>
  );
}

/* ----------------- Small UI helpers ----------------- */

function Card({ children }) {
  return <div className="rounded-2xl border border-gray-200 p-4">{children}</div>;
}

function Field({ label, hint, children }) {
  return (
    <div className="mb-4">
      <div className="flex items-baseline justify-between">
        <div className="text-sm font-medium text-gray-700">{label}</div>
        {hint && <div className="text-xs text-gray-500">{hint}</div>}
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
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
      }`}
    >
      {children}
    </button>
  );
}

function InfoTile({ title, value, highlight = false }) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        highlight
          ? "border-blue-300 bg-blue-600 text-white"
          : "border-gray-200 bg-gray-50 text-gray-700"
      }`}
    >
      <div className={`text-xs uppercase tracking-wide ${highlight ? "opacity-90" : ""}`}>{title}</div>
      <div className={`mt-1 ${highlight ? "text-2xl font-bold" : "text-lg font-semibold"}`}>{value}</div>
    </div>
  );
}


function MacroSlider({ label, min, max, value, onChange, subtitle, disabled = false }) {
  return (
    <div className="rounded-2xl border border-gray-200 p-4">
      <div className="text-sm font-medium text-gray-700">{label}</div>
      {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(+e.target.value)}
        className={`w-full mt-3 ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      />
      <div className="mt-2 flex justify-between text-xs text-gray-500">
        <span>{min} g</span>
        <span>{max} g</span>
      </div>
    </div>
  );
}


