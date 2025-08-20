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
  const [units, setUnits] = useState("metric");
  const [mode, setMode] = useState("calculate");
  const [age, setAge] = useState(25);
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(70);
  const [sex, setSex] = useState("male");
  const [activityIndex, setActivityIndex] = useState(3);
  const [goalRate, setGoalRate] = useState(0);
  const [customCalories, setCustomCalories] = useState(2200);

  const [protein, setProtein] = useState(140);
  const [fat, setFat] = useState(56);
  const [carbs, setCarbs] = useState(250);
  const [lockMacrosToCalories, setLockMacrosToCalories] = useState(true);

  const displayedLbs = Math.round(weight * LB_PER_KG);
  const totalInches = Math.round(height / 2.54);
  const displayedFt = Math.floor(totalInches / 12);
  const displayedIn = totalInches - displayedFt * 12;

  const activity = useMemo(
    () => ACTIVITY_STEPS.find(a => a.key === activityIndex) ?? ACTIVITY_STEPS[2],
    [activityIndex]
  );

  const bmr = useMemo(() => {
    const base = 10 * weight + 6.25 * height - 5 * age;
    return Math.round(sex === "male" ? base + 5 : base - 161);
  }, [age, height, weight, sex]);

  const deltaPerUnit = units === "metric" ? 7700 : 3500;
  const calcCalories = useMemo(() => {
    if (mode === "custom") return Math.max(0, Math.round(customCalories || 0));
    const dailyDelta = (deltaPerUnit * goalRate) / 7;
    const tdee = bmr * activity.mult + dailyDelta;
    return Math.max(0, Math.round(tdee));
  }, [mode, customCalories, bmr, activity.mult, goalRate, deltaPerUnit]);

  const macroCalories = protein * 4 + fat * 9 + carbs * 4;
  const kcalDiff = calcCalories - macroCalories;
  const KCAL_TOL = 15;

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
    const p = clamp(Math.round(weight * 2.0), 60, 260);
    const f = clamp(Math.round(weight * 0.8), 35, 120);
    setProtein(p);
    setFat(f);
    if (!lockMacrosToCalories) autoBalanceCarbs();
  };

  const switchUnits = (target) => {
    if (target === units) return;
    setGoalRate(prev => {
      if (target === "imperial") return +(prev * LB_PER_KG).toFixed(2);
      return +(prev / LB_PER_KG).toFixed(2);
    });
    setUnits(target);
  };

  const setHeightFromFtIn = (ft, inch) => {
    const cm = Math.round(((ft * 12) + inch) * 2.54);
    setHeight(clamp(cm, 120, 220));
  };

  return (
    <div className="min-h-screen bg-gray-100">
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

          {/* ...rest of calorie + macro UI unchanged... */}
        </section>
      </main>
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
      <div className="text-xs uppercase tracking-wide">{title}</div>
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
