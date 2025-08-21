// src/pages/OneRepMaxCalculator.jsx
import { useEffect, useMemo, useState } from "react";

/**
 * One-Rep Max (1RM) Calculator
 * ----------------------------
 * - Inputs: weight, reps (1–20), optional RPE (6–10), units (kg/lb), rounding
 * - Formulas: Epley, Brzycki, Lander, Lombardi, Mayhew, O'Conner, Wathan, McGlothin
 * - Average 1RM across formulas + Training Max (90%)
 * - %1RM table and Reps-to-Failure load table (via Epley inverse)
 */

const LB_PER_KG = 2.2046226218;

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function roundToIncrement(x, step) { return step > 0 ? Math.round(x / step) * step : x; }
function toKg(units, val) { return units === "metric" ? val : val / LB_PER_KG; }

// Classic 1RM estimators (w = working weight in kg, r = reps to failure or estimated)
const formulas = {
  Epley: (w, r) => w * (1 + r / 30),
  Brzycki: (w, r) => w * 36 / (37 - r),
  Lander: (w, r) => w / (1.013 - 0.0267123 * r),
  Lombardi: (w, r) => w * Math.pow(r, 0.10),
  Mayhew: (w, r) => (100 * w) / (52.2 + 41.9 * Math.exp(-0.055 * r)),
  "O'Conner": (w, r) => w * (1 + 0.025 * r),
  Wathan: (w, r) => (100 * w) / (48.8 + 53.8 * Math.exp(-0.075 * r)),
  McGlothin: (w, r) => (100 * w) / (101.3 - 2.67123 * r),
};

// Inverse of Epley to estimate load for a given reps at a known 1RM
function loadForReps_Epley(orm, reps) { return orm / (1 + reps / 30); }

export default function OneRepMaxCalculator() {
  const [units, setUnits] = useState("metric"); // 'metric' | 'imperial'
  const [weightInput, setWeightInput] = useState(100); // kg or lb per units
  const [reps, setReps] = useState(5);
  const [rpe, setRpe] = useState(10); // optional RPE (6–10); 10 = to failure
  const [useRpe, setUseRpe] = useState(false);
  const [roundInc, setRoundInc] = useState(2.5); // rounding increment in current units

  // Title (bulletproof during HMR)
  useEffect(() => { document.title = "1RM Calculator"; }, []);

  // Convert working weight to kg for calc
  const workingKg = useMemo(() => toKg(units, weightInput), [units, weightInput]);

  // Effective reps to FAILURE using RPE (approx): reps_to_failure ≈ reps + (10 - RPE)
  const effReps = useMemo(() => {
    if (!useRpe) return reps;
    const rir = clamp(10 - rpe, 0, 4); // typical RIR range used
    return clamp(reps + rir, 1, 20);
  }, [reps, rpe, useRpe]);

  // Compute all 1RMs (kg) and the average
  const estimates = useMemo(() => {
    const out = Object.entries(formulas).map(([name, fn]) => {
      const raw = fn(workingKg, effReps);
      return { name, kg: raw };
    });
    // filter out invalid (e.g., Brzycki blows up near 37 reps — not our range but be safe)
    const valid = out.filter(x => isFinite(x.kg) && x.kg > 0);
    const avg = valid.reduce((s, x) => s + x.kg, 0) / valid.length;
    return { list: valid, avgKg: avg };
  }, [workingKg, effReps]);

  const trainingMaxKg = useMemo(() => estimates.avgKg * 0.90, [estimates.avgKg]);

  // Rounding helpers (respect current units)
  const roundForUnits = (kg) => {
    const step = units === "metric" ? roundInc : roundInc; // value already in current units
    const val = units === "metric" ? kg : kg * LB_PER_KG;
    const rounded = roundToIncrement(val, step);
    return units === "metric" ? `${rounded.toFixed(1)} kg` : `${Math.round(rounded)} lb`;
  };

  // %1RM table (50%..100%)
  const percentRows = useMemo(() => {
    const pcts = [50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];
    return pcts.map(p => {
      const kg = (estimates.avgKg * p) / 100;
      return { pct: p, load: kg };
    });
  }, [estimates.avgKg]);

  // Reps table using Epley inverse (1..12 reps)
  const repsRows = useMemo(() => {
    const list = [];
    for (let r = 1; r <= 12; r++) {
      list.push({ reps: r, load: loadForReps_Epley(estimates.avgKg, r) });
    }
    return list;
  }, [estimates.avgKg]);

  // Display helpers for inputs
  const displayWeight = units === "metric" ? `${weightInput.toFixed(1)} kg` : `${Math.round(weightInput)} lb`;
  const roundOptions = units === "metric" ? [0.5, 1, 2.5, 5] : [1, 2.5, 5, 10];

  return (
    <>
      <title>1RM Calculator</title>
      <meta name="description" content="Estimate your one-rep max (1RM) from submax sets with optional RPE, see training max and %1RM tables." />

      <div className="min-h-screen bg-white text-slate-900">
        <main className="mx-auto max-w-5xl px-4 py-8 grid gap-6">
          {/* Title + unit toggle */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold tracking-tight">1RM Calculator</h1>
            <div className="inline-flex rounded-xl overflow-hidden border border-slate-200">
              <button
                className={`px-3 py-2 text-sm font-medium ${units === "metric" ? "bg-slate-900 text-white" : "bg-white text-slate-800 hover:bg-slate-50"}`}
                onClick={() => { setUnits("metric"); setRoundInc(2.5); }}
              >
                Metric
              </button>
              <button
                className={`px-3 py-2 text-sm font-medium ${units === "imperial" ? "bg-slate-900 text-white" : "bg-white text-slate-800 hover:bg-slate-50"}`}
                onClick={() => { setUnits("imperial"); setRoundInc(5); }}
              >
                Imperial
              </button>
            </div>
          </div>

          {/* Inputs */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <Field label={`Working set weight: ${displayWeight}`}>
                  <input
                    type="range"
                    min={units === "metric" ? 20 : 45}
                    max={units === "metric" ? 300 : 660}
                    step={units === "metric" ? 0.5 : 1}
                    value={weightInput}
                    onChange={(e) => setWeightInput(+e.target.value)}
                    className="w-full"
                  />
                </Field>

                <Field label={`Reps: ${reps}`}>
                  <input
                    type="range"
                    min={1}
                    max={20}
                    step={1}
                    value={reps}
                    onChange={(e) => setReps(+e.target.value)}
                    className="w-full"
                  />
                </Field>

                <div className="flex items-center justify-between mt-2">
                  <label className="text-sm font-medium text-slate-800">Use RPE</label>
                  <Toggle checked={useRpe} onChange={setUseRpe} />
                </div>

                {useRpe && (
                  <Field label={`RPE: ${rpe.toFixed(1)}`} hint="RPE 10 = to failure; RPE 9 ≈ 1 RIR, etc.">
                    <input
                      type="range"
                      min={6}
                      max={10}
                      step={0.5}
                      value={rpe}
                      onChange={(e) => setRpe(+e.target.value)}
                      className="w-full"
                    />
                  </Field>
                )}

                <Field label="Rounding increment">
                  <div className="flex gap-2 flex-wrap">
                    {roundOptions.map(opt => (
                      <button
                        key={opt}
                        onClick={() => setRoundInc(opt)}
                        className={`px-3 py-1.5 rounded-xl border text-sm ${
                          roundInc === opt ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-800 border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {units === "metric" ? `${opt} kg` : `${opt} lb`}
                      </button>
                    ))}
                  </div>
                </Field>
              </Card>

              {/* Results summary */}
              <Card>
                <h2 className="text-lg font-semibold mb-2">Results</h2>
                <div className="text-sm space-y-2">
                  <Row label="Effective reps to failure" value={`${effReps}`} />
                  <Row
                    label="Average estimated 1RM"
                    value={roundForUnits(estimates.avgKg)}
                  />
                  <Row label="Training Max (90%)" value={roundForUnits(trainingMaxKg)} />
                </div>

                <div className="mt-4">
                  <h3 className="text-sm font-semibold mb-1">By formula</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {estimates.list.map((e) => (
                      <InfoTile key={e.name} title={e.name} value={roundForUnits(e.kg)} />
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </section>

          {/* Tables */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <h3 className="text-sm font-semibold mb-2">% of 1RM</h3>
                <SimpleTable
                  head={["%1RM", "Load"]}
                  rows={percentRows.map(r => [ `${r.pct}%`, roundForUnits(r.load) ])}
                />
              </Card>

              <Card>
                <h3 className="text-sm font-semibold mb-2">Load by reps (Epley)</h3>
                <SimpleTable
                  head={["Reps", "Load"]}
                  rows={repsRows.map(r => [ `${r.reps}`, roundForUnits(r.load) ])}
                />
              </Card>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              Estimates are approximations and vary by lift, technique, and training background. Use them as a guide, not a guarantee.
            </p>
          </section>
        </main>
      </div>
    </>
  );
}

/* ---------------- UI bits ---------------- */
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
function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-slate-600">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
function InfoTile({ title, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="text-xs uppercase tracking-wide text-slate-600">{title}</div>
      <div className="text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}
function SimpleTable({ head, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-600">
            {head.map((h, i) => (
              <th key={i} className="py-1.5 pr-3 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-slate-200">
              {r.map((c, j) => (
                <td key={j} className="py-1.5 pr-3">{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${checked ? "bg-slate-900" : "bg-slate-300"}`}
      aria-pressed={checked}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${checked ? "translate-x-5" : "translate-x-1"}`}
      />
    </button>
  );
}
