// src/pages/MacroCalculator.jsx
import { useEffect, useMemo, useState } from "react";

const ACTIVITY_STEPS = [
  { key: 1, label: "Sedentary", mult: 1.2, desc: "Desk job, little to no exercise" },
  { key: 2, label: "Light", mult: 1.375, desc: "1–3 light workouts/week or on-feet part of day" },
  { key: 3, label: "Moderate", mult: 1.55, desc: "3–5 moderate workouts/week" },
  { key: 4, label: "Active", mult: 1.725, desc: "6–7 hard sessions/week or physical job" },
  { key: 5, label: "Very Active", mult: 1.9, desc: "Athlete-level training + physical job" },
];

const DIETS = [
  { key: "balanced", label: "Balanced", protein_g_per_kg: 1.8, fat_pct: 0.30, blurb: "≈1.8 g/kg protein, ~30% kcal fat, rest carbs." },
  { key: "high_protein", label: "High Protein", protein_g_per_kg: 2.2, fat_pct: 0.25, blurb: "More protein, moderate fat (~25%)." },
  { key: "low_fat", label: "Low Fat", protein_g_per_kg: 2.0, fat_pct: 0.20, blurb: "Lower fat (~20%) to push more carbs." },
  { key: "endurance", label: "Endurance / High-Carb", protein_g_per_kg: 1.6, fat_pct: 0.25, blurb: "Prioritizes carbs for training." },
  { key: "cut", label: "Cut (Lean Out)", protein_g_per_kg: 2.4, fat_pct: 0.25, blurb: "Higher protein for satiety/retention." },
  { key: "keto", label: "Keto-ish", protein_g_per_kg: 1.8, fat_pct: 0.65, blurb: "High fat (~65%), minimal carbs." },
  { key: "custom", label: "Custom (no preset)", blurb: "No automatic changes to macros." },
];

const LB_PER_KG = 2.2046226218;

function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max);
}

export default function MacroCalculator() {
  // Units & calorie calc
  const [units, setUnits] = useState("metric");        // 'metric' | 'imperial'
  const [mode, setMode] = useState("calculate");       // 'calculate' | 'custom'
  const [age, setAge] = useState(25);
  const [height, setHeight] = useState(175);           // cm
  const [weight, setWeight] = useState(70);            // kg
  const [sex, setSex] = useState("male");              // 'male' | 'female'
  const [activityIndex, setActivityIndex] = useState(3);
  const [goalRate, setGoalRate] = useState(0);         // kg/wk or lb/wk depending on units
  const [customCalories, setCustomCalories] = useState(2200);

  // Diet preset (now in Step 2)
  const [dietKey, setDietKey] = useState("balanced");

  // Macros
  const [protein, setProtein] = useState(140);
  const [fat, setFat] = useState(56);
  const [carbs, setCarbs] = useState(250);
  const [lockMacrosToCalories, setLockMacrosToCalories] = useState(true);

  // UI helpers
  const [showActivityHelp, setShowActivityHelp] = useState(false);

  // Imperial display (core state is metric)
  const displayedLbs = Math.round(weight * LB_PER_KG);
  const totalInches = Math.round(height / 2.54);
  const displayedFt = Math.floor(totalInches / 12);
  const displayedIn = totalInches - displayedFt * 12;

  const activity = useMemo(
    () => ACTIVITY_STEPS.find((a) => a.key === activityIndex) ?? ACTIVITY_STEPS[2],
    [activityIndex]
  );

  // Mifflin–St Jeor BMR (metric)
  const bmr = useMemo(() => {
    const base = 10 * weight + 6.25 * height - 5 * age;
    return Math.round(sex === "male" ? base + 5 : base - 161);
  }, [age, height, weight, sex]);

  // Base TDEE from BMR × activity
  const baseTDEE = useMemo(() => Math.round(bmr * activity.mult), [bmr, activity.mult]);

  // kcal per unit mass change
  const deltaPerUnit = units === "metric" ? 7700 : 3500;

  // In Calculate mode, we let user directly adjust target kcal AND goal rate; keep them in sync.
  const [targetKcalCalc, setTargetKcalCalc] = useState(baseTDEE);

  // Helpers for two-way binding between goalRate and targetKcalCalc
  const caloriesFromRate = (rate) => Math.max(0, Math.round(baseTDEE + (deltaPerUnit * rate) / 7));
  const rateFromCalories = (kcal) => +( ((kcal - baseTDEE) * 7) / deltaPerUnit ).toFixed(units === "metric" ? 2 : 2);

  // Recompute target kcal if baseTDEE or units change (keep the same rate feel)
  useEffect(() => {
    setTargetKcalCalc(caloriesFromRate(goalRate));
  }, [baseTDEE, deltaPerUnit]); // eslint-disable-line

  // Calories used for the rest of the UI
  const calcCalories = mode === "custom" ? Math.max(0, Math.round(customCalories || 0)) : targetKcalCalc;

  // Macro calories + helpers
  const proteinKcal = protein * 4;
  const fatKcal = fat * 9;
  const carbKcal = carbs * 4;
  const macroCalories = proteinKcal + fatKcal + carbKcal;

  const pct = (part) => (calcCalories > 0 ? Math.round((part / calcCalories) * 100) : 0);
  const gPerKg = (grams) => (weight > 0 ? (grams / weight).toFixed(2) : "0.00");

  // Auto-balance carbs when locked (up to 1000 g)
  useEffect(() => {
    if (!lockMacrosToCalories) return;
    const remaining = calcCalories - (proteinKcal + fatKcal);
    setCarbs(clamp(Math.round(remaining / 4), 0, 1000));
  }, [lockMacrosToCalories, calcCalories, proteinKcal, fatKcal]);

  const autoBalanceCarbs = () => {
    const remaining = calcCalories - (proteinKcal + fatKcal);
    setCarbs(clamp(Math.round(remaining / 4), 0, 1000));
  };

  // Apply diet preset (sets protein & fat; carbs adjusts if locked)
  const applyDietPreset = (key) => {
    setDietKey(key);
    const d = DIETS.find((x) => x.key === key);
    if (!d || key === "custom") return;
    const p = clamp(Math.round(weight * d.protein_g_per_kg), 40, 300);
    const f = clamp(Math.round(((calcCalories || 0) * d.fat_pct) / 9), 20, 200);
    setProtein(p);
    setFat(f);
    if (lockMacrosToCalories) {
      const remaining = calcCalories - (p * 4 + f * 9);
      setCarbs(clamp(Math.round(remaining / 4), 0, 1000));
    }
  };

  // Unit switch: keep the *rate* equivalent when toggling
  const switchUnits = (target) => {
    if (target === units) return;
    setGoalRate((prev) => {
      if (target === "imperial") return +(prev * LB_PER_KG).toFixed(2); // kg/wk -> lb/wk
      return +(prev / LB_PER_KG).toFixed(2);                            // lb/wk -> kg/wk
    });
    setUnits(target);
  };

  // Height setter for imperial sliders
  const setHeightFromFtIn = (ft, inch) => {
    const cm = Math.round(ft * 12 + inch) * 2.54;
    setHeight(clamp(Math.round(cm), 120, 220));
  };

  useEffect(() => {
    document.title = "Macro Calculator";
  }, []);

  const carbsFloored =
    lockMacrosToCalories && carbs === 0 && calcCalories - (proteinKcal + fatKcal) <= 0;

  // Ranges
  const rateRange = units === "metric"
    ? { min: -1.25, max: 0.75, step: 0.25, unit: "kg/week" }
    : { min: -2.5, max: 1.5, step: 0.5, unit: "lb/week" };

  const kcalMin = Math.max(1000, baseTDEE - 1500);
  const kcalMax = Math.min(6000, baseTDEE + 1500);

  return (
    <>
      <title>Macro Calculator</title>
      <meta name="description" content="Calculate daily macros (protein, carbs, fats) based on your calories, goals, and activity." />

      <div className="min-h-screen bg-white text-slate-900">
        <main className="mx-auto max-w-5xl px-4 py-8 grid gap-6">
          {/* Title */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold tracking-tight">Macronutrient Calculator</h1>

            {/* Units */}
            <div className="inline-flex rounded-xl overflow-hidden border border-slate-200">
              <button
                className={`px-3 py-2 text-sm font-medium ${units === "metric" ? "bg-slate-900 text-white" : "bg-white text-slate-800 hover:bg-slate-50"}`}
                onClick={() => switchUnits("metric")}
              >
                Metric
              </button>
              <button
                className={`px-3 py-2 text-sm font-medium ${units === "imperial" ? "bg-slate-900 text-white" : "bg-white text-slate-800 hover:bg-slate-50"}`}
                onClick={() => switchUnits("imperial")}
              >
                Imperial
              </button>
            </div>
          </div>

          {/* STEP 1: CALORIES */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Step 1 · Calories</h2>

              {/* Mode */}
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
                  Custom calories
                </button>
              </div>
            </div>

            {/* CALCULATE MODE */}
            {mode === "calculate" ? (
              <div className="mt-2 grid md:grid-cols-2 gap-6">
                {/* Left: demographics */}
                <Card>
                  <Field label={`Age: ${age} yrs`}>
                    <input type="range" min={15} max={80} value={age} onChange={(e) => setAge(+e.target.value)} className="w-full" />
                  </Field>

                  {units === "metric" ? (
                    <>
                      <Field label={`Height: ${height} cm`}>
                        <input type="range" min={140} max={210} value={height} onChange={(e) => setHeight(+e.target.value)} className="w-full" />
                      </Field>
                      <Field label={`Weight: ${weight.toFixed(1)} kg`}>
                        <input type="range" min={40} max={200} step={0.5} value={weight} onChange={(e) => setWeight(+e.target.value)} className="w-full" />
                      </Field>
                    </>
                  ) : (
                    <>
                      <Field label={`Height: ${displayedFt} ft ${displayedIn} in`}>
                        <div className="space-y-2">
                          <div>
                            <div className="text-xs text-slate-500 mb-1">Feet</div>
                            <input type="range" min={4} max={7} value={displayedFt} onChange={(e) => setHeightFromFtIn(+e.target.value, displayedIn)} className="w-full" />
                          </div>
                          <div>
                            <div className="text-xs text-slate-500 mb-1">Inches</div>
                            <input type="range" min={0} max={11} value={displayedIn} onChange={(e) => setHeightFromFtIn(displayedFt, +e.target.value)} className="w-full" />
                          </div>
                        </div>
                      </Field>
                      <Field label={`Weight: ${displayedLbs} lb`}>
                        <input
                          type="range" min={90} max={440} step={1} value={displayedLbs}
                          onChange={(e) => { const lbs = +e.target.value; setWeight(parseFloat((lbs / LB_PER_KG).toFixed(1))); }}
                          className="w-full"
                        />
                      </Field>
                    </>
                  )}
                </Card>

                {/* Right: sex, activity, goal + target kcal (linked) */}
                <Card>
                  <div className="mb-4">
                    <div className="text-sm font-medium text-slate-700 mb-2">Sex</div>
                    <div className="flex gap-2">
                      <Segmented active={sex === "male"} onClick={() => setSex("male")}>Male</Segmented>
                      <Segmented active={sex === "female"} onClick={() => setSex("female")}>Female</Segmented>
                    </div>
                  </div>

                  <Field label={`Activity: ${activity.label} (×${activity.mult})`}>
                    <input type="range" min={1} max={5} step={1} value={activityIndex} onChange={(e) => setActivityIndex(+e.target.value)} className="w-full" />
                    <div className="mt-1 text-xs text-slate-500">{activity.desc}</div>

                    <button
                      type="button"
                      onClick={() => setShowActivityHelp((s) => !s)}
                      className="mt-2 text-xs underline text-slate-700 hover:text-slate-900"
                    >
                      {showActivityHelp ? "Hide help" : "Help me choose"}
                    </button>

                    {showActivityHelp && (
                      <div className="mt-2 text-xs text-slate-600 rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1">
                        <p><strong>Sedentary:</strong> Desk work, <em>&lt;5k steps/day</em>, rare exercise.</p>
                        <p><strong>Light:</strong> 1–3 light sessions/week or ~6–8k steps/day.</p>
                        <p><strong>Moderate:</strong> 3–5 moderate sessions/week or ~8–10k steps/day.</p>
                        <p><strong>Active:</strong> 6–7 hard sessions/week, frequent sports, or physical job.</p>
                        <p><strong>Very Active:</strong> Manual labor + regular training, or endurance athlete.</p>
                      </div>
                    )}
                  </Field>

                  {/* Linked gain/loss & target kcal sliders */}
                  <Field
                    label={`Goal: ${goalRate.toFixed(2)} ${rateRange.unit} (${goalRate === 0 ? "Maintain" : goalRate < 0 ? "Lose" : "Gain"})`}
                  >
                    <input
                      type="range"
                      min={rateRange.min}
                      max={rateRange.max}
                      step={rateRange.step}
                      value={goalRate}
                      onChange={(e) => {
                        const r = +e.target.value;
                        setGoalRate(r);
                        setTargetKcalCalc(caloriesFromRate(r));
                      }}
                      className="w-full"
                    />
                  </Field>

                  <Field label={`Target calories: ${targetKcalCalc} kcal/day`}>
                    <input
                      type="range"
                      min={kcalMin}
                      max={kcalMax}
                      step={10}
                      value={targetKcalCalc}
                      onChange={(e) => {
                        const kc = +e.target.value;
                        setTargetKcalCalc(kc);
                        setGoalRate(rateFromCalories(kc));
                      }}
                      className="w-full"
                    />
                    <div className="mt-1 text-xs text-slate-500">Base TDEE ≈ {baseTDEE} kcal/day</div>
                  </Field>
                </Card>
              </div>
            ) : (
              // CUSTOM MODE
              <div className="mt-2 max-w-sm">
                <label className="block text-sm font-medium text-slate-700 mb-1">Custom calories</label>
                <input
                  type="number" inputMode="numeric" min={0}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-700"
                  value={customCalories}
                  onChange={(e) => setCustomCalories(+e.target.value)}
                />
              </div>
            )}

            {/* Info tiles (hide BMR in custom mode; activity tile removed) */}
            <div className="mt-6 grid sm:grid-cols-3 gap-4">
              {mode === "calculate" && <InfoTile title="BMR (Mifflin-St Jeor)" value={`${bmr} kcal/day`} />}
              <InfoTile title="Target calories" value={`${calcCalories} kcal/day`} highlight />
            </div>
          </section>

          {/* STEP 2: MACROS */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Step 2 · Macros (grams)</h2>
              <label className="inline-flex items-center gap-2 select-none">
                <input
                  type="checkbox" className="sr-only"
                  checked={lockMacrosToCalories}
                  onChange={(e) => setLockMacrosToCalories(e.target.checked)}
                />
                <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${lockMacrosToCalories ? "bg-slate-900" : "bg-slate-300"}`}>
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${lockMacrosToCalories ? "translate-x-5" : "translate-x-1"}`} />
                </span>
                <span className="text-sm font-medium">
                  {lockMacrosToCalories ? "Locked (auto carbs)" : "Unlocked (edit carbs freely)"}
                </span>
              </label>
            </div>

            {/* Diet preset moved here */}
            <div className="mb-4 p-3 rounded-xl border border-slate-200 bg-slate-50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="text-sm font-medium">Diet preset</div>
                <div className="flex items-center gap-2">
                  <select
                    value={dietKey}
                    onChange={(e) => applyDietPreset(e.target.value)}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-700"
                  >
                    {DIETS.map((d) => (
                      <option key={d.key} value={d.key}>{d.label}</option>
                    ))}
                  </select>
                  <span className="hidden sm:block text-xs text-slate-600">
                    {DIETS.find(d => d.key === dietKey)?.blurb}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <MacroSlider
                theme="protein"
                label={`Protein: ${protein} g  ·  ${gPerKg(protein)} g/kg  ·  ${pct(proteinKcal)}%`}
                min={40} max={300} value={protein} onChange={(v) => setProtein(v)}
              />
              <MacroSlider
                theme="fat"
                label={`Fat: ${fat} g  ·  ${gPerKg(fat)} g/kg  ·  ${pct(fatKcal)}%`}
                min={20} max={200} value={fat} onChange={(v) => setFat(v)}
              />
              <MacroSlider
                theme="carb"
                label={`Carbs: ${carbs} g  ·  ${gPerKg(carbs)} g/kg  ·  ${pct(carbKcal)}%`}
                min={0} max={1000} value={carbs} onChange={(v) => setCarbs(v)}
                disabled={lockMacrosToCalories}
              />
            </div>

            <div className="mt-6 grid sm:grid-cols-4 gap-4">
              <InfoTile theme="protein" title="Protein kcal" value={`${proteinKcal}`} />
              <InfoTile theme="fat" title="Fat kcal" value={`${fatKcal}`} />
              <InfoTile theme="carb" title="Carb kcal" value={`${carbKcal}`} />
              <InfoTile title="Macros total" value={`${macroCalories} kcal`} />
            </div>

            <div className="mt-4">
              {carbsFloored && (
                <div className="text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 inline-block">
                  Protein + Fat exceed target. Carbs floored at 0 g. Reduce Protein/Fat or increase calories.
                </div>
              )}
            </div>
          </section>

          {/* Explainers */}
          <section className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Diet presets explained</h3>
              <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-slate-700">
                {DIETS.filter((d) => d.key !== "custom").map((d) => (
                  <li key={d.key}><span className="font-medium">{d.label}:</span> {d.blurb}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Macro basics</h3>
              <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-slate-700">
                <li><span className="font-medium">Protein</span> (4 kcal/g): muscle repair/retention. Typical 1.6–2.4 g/kg.</li>
                <li><span className="font-medium">Fat</span> (9 kcal/g): hormones & absorption. Often 20–40% of calories (≥0.6 g/kg common floor).</li>
                <li><span className="font-medium">Carbohydrates</span> (4 kcal/g): primary fuel; adjust to fill remaining calories based on training and goals.</li>
              </ul>
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
function Field({ label, children }) {
  return (
    <div className="mb-4">
      <div className="flex items-baseline justify-between">
        <div className="text-sm font-medium text-slate-800">{label}</div>
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
        active ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-800 border-slate-300 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

function InfoTile({ title, value, highlight = false, theme }) {
  const styles = {
    protein: "border-rose-200 bg-rose-50 text-rose-800",
    fat: "border-amber-200 bg-amber-50 text-amber-800",
    carb: "border-green-200 bg-green-50 text-green-800",
    default: "border-slate-200 bg-slate-50 text-slate-800",
  };
  const klass = theme
    ? styles[theme] ?? styles.default
    : highlight
      ? "border-slate-900 bg-slate-900 text-white"
      : styles.default;

  return (
    <div className={`rounded-2xl border p-5 ${klass}`}>
      <div className="text-xs uppercase tracking-wide">{title}</div>
      <div className={`mt-1 ${highlight ? "text-2xl font-bold" : "text-lg font-semibold"}`}>{value}</div>
    </div>
  );
}

function MacroSlider({ theme = "default", label, min, max, value, onChange, disabled = false }) {
  const themes = {
    protein: { border: "border-rose-200", left: "border-l-4 border-rose-500", text: "text-rose-700", accent: "#e11d48" },
    fat:     { border: "border-amber-200", left: "border-l-4 border-amber-500", text: "text-amber-700", accent: "#f59e0b" },
    carb:    { border: "border-green-200", left: "border-l-4 border-green-600", text: "text-green-700", accent: "#16a34a" },
    default: { border: "border-slate-200", left: "border-l-4 border-slate-400", text: "text-slate-700", accent: "#0f172a" },
  };
  const t = themes[theme] ?? themes.default;

  return (
    <div className={`rounded-2xl border ${t.border} bg-white p-4 ${t.left}`}>
      <div className={`text-sm font-medium ${t.text}`}>{label}</div>
      <input
        type="range" min={min} max={max} step={1} value={value} disabled={disabled}
        onChange={(e) => onChange(+e.target.value)}
        className={`w-full mt-3 ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        style={{ accentColor: t.accent }}
      />
      <div className="mt-2 flex justify-between text-xs text-slate-500">
        <span>{min} g</span>
        <span>{max} g</span>
      </div>
    </div>
  );
}
