// src/pages/CalorieCalculator.jsx
import { useEffect, useMemo, useState } from "react";

const ACTIVITY_STEPS = [
  { key: 1, label: "Sedentary", mult: 1.2, desc: "Desk job, little to no exercise" },
  { key: 2, label: "Light", mult: 1.375, desc: "1–3 light workouts/week or on-feet part of day" },
  { key: 3, label: "Moderate", mult: 1.55, desc: "3–5 moderate workouts/week" },
  { key: 4, label: "Active", mult: 1.725, desc: "6–7 hard sessions/week or physical job" },
  { key: 5, label: "Very Active", mult: 1.9, desc: "Athlete-level training + physical job" },
];

const LB_PER_KG = 2.2046226218;

function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max);
}

export default function CalorieCalculator() {
  const [units, setUnits] = useState("metric"); // 'metric' | 'imperial'
  const [age, setAge] = useState(25);
  const [height, setHeight] = useState(175);    // cm
  const [weight, setWeight] = useState(70);     // kg
  const [sex, setSex] = useState("male");
  const [activityIndex, setActivityIndex] = useState(3);
  const [goalRate, setGoalRate] = useState(0);  // kg/wk or lb/wk
  const [showActivityHelp, setShowActivityHelp] = useState(false);

  // Imperial display helpers (state stays metric)
  const displayedLbs = Math.round(weight * LB_PER_KG);
  const totalInches = Math.round(height / 2.54);
  const displayedFt = Math.floor(totalInches / 12);
  const displayedIn = totalInches - displayedFt * 12;

  const activity = useMemo(
    () => ACTIVITY_STEPS.find((a) => a.key === activityIndex) ?? ACTIVITY_STEPS[2],
    [activityIndex]
  );

  // Mifflin–St Jeor (metric)
  const bmr = useMemo(() => {
    const base = 10 * weight + 6.25 * height - 5 * age;
    return Math.round(sex === "male" ? base + 5 : base - 161);
  }, [age, height, weight, sex]);

  const baseTDEE = useMemo(() => Math.round(bmr * activity.mult), [bmr, activity.mult]);

  // kcal per unit body mass change
  const deltaPerUnit = units === "metric" ? 7700 : 3500;

  // Linked sliders: goalRate ↔ targetKcal
  const caloriesFromRate = (rate) => Math.max(0, Math.round(baseTDEE + (deltaPerUnit * rate) / 7));
  const rateFromCalories = (kcal) => +(((kcal - baseTDEE) * 7) / deltaPerUnit).toFixed(2);

  const [targetKcal, setTargetKcal] = useState(baseTDEE);
  useEffect(() => {
    setTargetKcal(caloriesFromRate(goalRate));
    // eslint-disable-next-line
  }, [baseTDEE, deltaPerUnit]);

  // Ranges (more realistic: faster loss than gain)
  const rateRange = units === "metric"
    ? { min: -1.25, max: 0.75, step: 0.25, unit: "kg/week" }
    : { min: -2.5,  max: 1.5,  step: 0.5,  unit: "lb/week" };

  const kcalMin = Math.max(1000, baseTDEE - 1500);
  const kcalMax = Math.min(6000, baseTDEE + 1500);

  // Unit switch keeps intent for goal rate
  const switchUnits = (target) => {
    if (target === units) return;
    setGoalRate((prev) => (target === "imperial" ? +(prev * LB_PER_KG).toFixed(2) : +(prev / LB_PER_KG).toFixed(2)));
    setUnits(target);
  };

  const setHeightFromFtIn = (ft, inch) => {
    const cm = Math.round(ft * 12 + inch) * 2.54;
    setHeight(clamp(Math.round(cm), 120, 220));
  };

  useEffect(() => {
    document.title = "Calorie Calculator";
  }, []);

  return (
    <>
      <title>Calorie Calculator</title>
      <meta name="description" content="Estimate daily calories (TDEE) using BMR, activity, and desired rate of change." />

      <div className="min-h-screen bg-white text-slate-900">
        <main className="mx-auto max-w-5xl px-4 py-8 grid gap-6">
          {/* Top bar */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold tracking-tight">Calorie Calculator (TDEE)</h1>
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

          {/* Inputs */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <Card>
              {/* Two columns for inputs */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Left column: age/height/weight */}
                <div>
                  <Slider label={`Age: ${age} yrs`}>
                    <input type="range" min={15} max={80} value={age} onChange={(e) => setAge(+e.target.value)} className="w-full" />
                  </Slider>

                  {units === "metric" ? (
                    <>
                      <Slider label={`Height: ${height} cm`}>
                        <input type="range" min={140} max={210} value={height} onChange={(e) => setHeight(+e.target.value)} className="w-full" />
                      </Slider>
                      <Slider label={`Weight: ${weight.toFixed(1)} kg`} className="last:mb-0">
                        <input type="range" min={40} max={200} step={0.5} value={weight} onChange={(e) => setWeight(+e.target.value)} className="w-full" />
                      </Slider>
                    </>
                  ) : (
                    <>
                      <Slider label={`Height: ${displayedFt} ft ${displayedIn} in`}>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-xs text-slate-500 mb-1">Feet</div>
                            <input type="range" min={4} max={7} value={displayedFt} onChange={(e) => setHeightFromFtIn(+e.target.value, displayedIn)} className="w-full" />
                          </div>
                          <div>
                            <div className="text-xs text-slate-500 mb-1">Inches</div>
                            <input type="range" min={0} max={11} value={displayedIn} onChange={(e) => setHeightFromFtIn(displayedFt, +e.target.value)} className="w-full" />
                          </div>
                        </div>
                      </Slider>

                      <Slider label={`Weight: ${displayedLbs} lb`} className="last:mb-0">
                        <input
                          type="range" min={90} max={440} step={1} value={displayedLbs}
                          onChange={(e) => { const lbs = +e.target.value; setWeight(parseFloat((lbs / LB_PER_KG).toFixed(1))); }}
                          className="w-full"
                        />
                      </Slider>
                    </>
                  )}
                </div>

                {/* Right column: sex, activity, goal rate */}
                <div>
                  <div className="mb-4">
                    <div className="text-sm font-medium text-slate-700 mb-2">Sex</div>
                    <div className="flex gap-2">
                      <Segmented active={sex === "male"} onClick={() => setSex("male")}>Male</Segmented>
                      <Segmented active={sex === "female"} onClick={() => setSex("female")}>Female</Segmented>
                    </div>
                  </div>

                  <Slider label={`Activity: ${activity.label} (×${activity.mult})`}>
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
                        <p><strong>Sedentary:</strong> Desk work, &lt;5k steps/day, rare exercise.</p>
                        <p><strong>Light:</strong> 1–3 light sessions/week or ~6–8k steps/day.</p>
                        <p><strong>Moderate:</strong> 3–5 moderate sessions/week or ~8–10k steps/day.</p>
                        <p><strong>Active:</strong> 6–7 hard sessions/week, frequent sports, or physical job.</p>
                        <p><strong>Very Active:</strong> Manual labor + regular training, or endurance athlete.</p>
                      </div>
                    )}
                  </Slider>

                  <Slider label={`Goal: ${goalRate.toFixed(2)} ${rateRange.unit} (${goalRate === 0 ? "Maintain" : goalRate < 0 ? "Lose" : "Gain"})`} className="last:mb-0">
                    <input
                      type="range"
                      min={rateRange.min} max={rateRange.max} step={rateRange.step}
                      value={goalRate}
                      onChange={(e) => {
                        const r = +e.target.value;
                        setGoalRate(r);
                        setTargetKcal(caloriesFromRate(r));
                      }}
                      className="w-full"
                    />
                  </Slider>
                </div>

                {/* Full-width: target calories (spans both columns → no empty space on right) */}
                <div className="md:col-span-2">
                  <Slider label={`Target calories: ${targetKcal} kcal/day`} className="last:mb-0">
                    <input
                      type="range" min={kcalMin} max={kcalMax} step={10}
                      value={targetKcal}
                      onChange={(e) => {
                        const kc = +e.target.value;
                        setTargetKcal(kc);
                        setGoalRate(rateFromCalories(kc));
                      }}
                      className="w-full"
                    />
                    <div className="mt-1 text-xs text-slate-500">Base TDEE ≈ {baseTDEE} kcal/day</div>
                  </Slider>
                </div>
              </div>
            </Card>

            {/* Info tiles */}
            <div className="mt-6 grid sm:grid-cols-3 gap-4">
              <InfoTile title="BMR (Mifflin-St Jeor)" value={`${bmr} kcal/day`} />
              <InfoTile title="Target calories" value={`${targetKcal} kcal/day`} highlight />
            </div>
          </section>
        </main>
      </div>
    </>
  );
}

/* ---------- Small UI helpers (tidy slider layout) ---------- */
function Card({ children }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4">{children}</div>;
}
function Slider({ label, children, className = "" }) {
  return (
    <div className={`mb-4 last:mb-0 ${className}`}>
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-medium text-slate-800">{label}</div>
      </div>
      <div>{children}</div>
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
function InfoTile({ title, value, highlight = false }) {
  return (
    <div className={`rounded-2xl border p-5 ${highlight ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-slate-50 text-slate-800"}`}>
      <div className="text-xs uppercase tracking-wide">{title}</div>
      <div className={`mt-1 ${highlight ? "text-2xl font-bold" : "text-lg font-semibold"}`}>{value}</div>
    </div>
  );
}
