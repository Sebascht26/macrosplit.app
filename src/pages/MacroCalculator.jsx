// src/pages/MacroCalculator.jsx
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

export default function MacroCalculator() {
  // Units & calorie calc
  const [units, setUnits] = useState("metric"); // 'metric' | 'imperial'
  const [mode, setMode] = useState("calculate"); // 'calculate' | 'custom'
  const [age, setAge] = useState(25);
  const [height, setHeight] = useState(175); // cm
  const [weight, setWeight] = useState(70);  // kg
  const [sex, setSex] = useState("male");    // 'male' | 'female'
  const [activityIndex, setActivityIndex] = useState(3); // 1..5
  const [goalRate, setGoalRate] = useState(0); // kg/wk or lb/wk depending on units
  const [customCalories, setCustomCalories] = useState(2200);

  // Macros
  const [protein, setProtein] = useState(140);
  const [fat, setFat] = useState(56);
  const [carbs, setCarbs] = useState(250);
  const [lockMacrosToCalories, setLockMacrosToCalories] = useState(true);

  // Derived displays for imperial (keep core state metric)
  const displayedLbs = Math.round(weight * LB_PER_KG);
  const totalInches = Math.round(height / 2.54);
  const displayedFt = Math.floor(totalInches / 12);
  const displayedIn = totalInches - displayedFt * 12;

  const activity = useMemo(
    () => ACTIVITY_STEPS.find(a => a.key === activityIndex) ?? ACTIVITY_STEPS[2],
    [activityIndex]
  );

  // Mifflin–St Jeor BMR (metric)
  const bmr = useMemo(() => {
    const base = 10 * weight + 6.25 * height - 5 * age;
    return Math.round(sex === "male" ? base + 5 : base - 161);
  }, [age, height, weight, sex]);

  // Calories target
  const deltaPerUnit = units === "metric" ? 7700 : 3500; // kcal per kg or per lb
  const calcCalories = useMemo(() => {
    if (mode === "custom") return Math.max(0, Math.round(customCalories || 0));
    const dailyDelta = (deltaPerUnit * goalRate) / 7;
    const tdee = bmr * activity.mult + dailyDelta;
    return Math.max(0, Math.round(tdee));
  }, [mode, customCalories, bmr, activity.mult, goalRate, deltaPerUnit]);

  // Macro calories + tolerance
  const macroCalories = protein * 4 + fat * 9 + carbs * 4;
  const kcalDiff = calcCalories - macroCalories;
  const KCAL_TOL = 15;

  // Auto-balance carbs when locked
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
    const p = clamp(Math.round(weight * 2.0), 60, 300); // ≈2.0 g/kg
    const f = clamp(Math.round(weight * 0.8), 30, 150); // ≈0.8 g/kg
    setProtein(p);
    setFat(f);
    if (!lockMacrosToCalories) autoBalanceCarbs();
  };

  // Unit switch: convert goalRate so delta stays consistent
  const switchUnits = (target) => {
    if (target === units) return;
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

  // 🔒 Bulletproof title (helps during HMR or exotic setups)
  useEffect(() => {
    document.title = "Macro Calculator";
  }, []);

  return (
    <>
      {/* React 19: head metadata directly in JSX */}
      <title>Macro Calculator</title>
      <meta
        name="description"
        content="Calculate daily macros (protein, carbs, fats) based on your calories, goals, and activity."
      />

      <div className="min-h-screen bg-white text-slate-900">
        <main className="mx-auto max-w-5xl px-4 py-8 grid gap-6">
          {/* Page title + actions */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold tracking-tight">Macronutrient Calculator</h1>
            <div className="flex gap-2">
              <button
                onClick={applySmartDefaults}
                className="rounded-xl px-3 py-2 text-sm font-medium bg-slate-900 text-white hover:bg-slate-800"
              >
                Smart defaults
              </button>
              {!lockMacrosToCalories && (
                <button
                  onClick={autoBalanceCarbs}
                  className="rounded-xl px-3 py-2 text-sm font-medium bg-slate-100 border border-slate-200 text-slate-900 hover:bg-slate-200"
                >
                  Auto-balance carbs
                </button>
              )}
            </div>
          </div>

          {/* STEP 1: CALORIES */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Step 1 · Calories</h2>
              <div className="inline-flex rounded-xl overflow-hidden border border-slate-200">
                <button
                  className={`px-3 py-2 text-sm font-medium ${units === "metric" ? "bg-slate-900 text-white" : "bg-white text-slate-800 hover:bg-slate-50"}`}
                  onClick={() => switchUnits("metric")}
                >
                  Metric (kg/cm)
                </button>
                <button
                  className={`px-3 py-2 text-sm font-medium ${units === "imperial" ? "bg-slate-900 text-white" : "bg-white text-slate-800 hover:bg-slate-50"}`}
                  onClick={() => switchUnits("imperial")}
                >
                  Imperial (lb/ft/in)
                </button>
              </div>
            </div>

            {/* Mode Toggle */}
            <div className="inline-flex rounded-xl overflow-hidden border border-slate-200">
              <button
                className={`px-4 py-2 text-sm font-medium ${mode === "calculate" ? "bg-slate-900 text-white" : "bg-white text-slate-800 hover:bg-slate-50"}`}
                onClick={() => setMode("calculate")}
              >
                Calculate
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium ${mode === "custom" ? "bg-slate-900 text-white" : "bg-white text-slate-800 hover:bg-slate-50"}`}
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
                            <div className="text-xs text-slate-500 mb-1">Feet</div>
                            <input type="range" min={4} max={7} value={displayedFt}
                              onChange={(e) => setHeightFromFtIn(+e.target.value, displayedIn)}
                              className="w-full" />
                          </div>
                          <div>
                            <div className="text-xs text-slate-500 mb-1">Inches</div>
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
                    <div className="text-sm font-medium text-slate-700 mb-2">Sex</div>
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
                    <div className="mt-1 text-xs text-slate-500">{activity.desc}</div>
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
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Custom calories</label>
                <input
                  type="number"
                  inputMode="numeric"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-700"
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
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Step 2 · Macros (grams)</h2>
              <label className="inline-flex items-center gap-2 select-none">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={lockMacrosToCalories}
                  onChange={(e) => setLockMacrosToCalories(e.target.checked)}
                />
                <span
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    lockMacrosToCalories ? "bg-slate-900" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                      lockMacrosToCalories ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
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
                <div className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 inline-block">
                  Macros closely match your target (±{KCAL_TOL} kcal).
                </div>
              ) : lockMacrosToCalories ? (
                <div className="text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 inline-block">
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
      </div>
    </>
  );
}

/* ----------------- Small UI helpers ----------------- */
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
function InfoTile({ title, value, highlight = false }) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        highlight
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-slate-50 text-slate-800"
      }`}
    >
      <div className="text-xs uppercase tracking-wide">{title}</div>
      <div className={`mt-1 ${highlight ? "text-2xl font-bold" : "text-lg font-semibold"}`}>{value}</div>
    </div>
  );
}
function MacroSlider({ label, min, max, value, onChange, subtitle, disabled = false }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-sm font-medium text-slate-800">{label}</div>
      {subtitle && <div className="text-xs text-slate-500">{subtitle}</div>}
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
      <div className="mt-2 flex justify-between text-xs text-slate-500">
        <span>{min} g</span>
        <span>{max} g</span>
      </div>
    </div>
  );
}
