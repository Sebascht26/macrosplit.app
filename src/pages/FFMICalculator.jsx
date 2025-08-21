// src/pages/FFMICalculator.jsx
import { useEffect, useMemo, useState } from "react";

/**
 * FFMI (Fat-Free Mass Index)
 * --------------------------
 * FFMI = FFM (kg) / height(m)^2
 * FFM (kg) = weight_kg * (1 - bodyFat%)
 * Height-normalized FFMI (to 1.8 m):
 * FFMI_norm = FFMI + 6.1 * (1.8 - height_m)
 */

const LB_PER_KG = 2.2046226218;
const IN_PER_CM = 0.3937007874;

function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max);
}

export default function FFMICalculator() {
  // Units & inputs
  const [units, setUnits] = useState("metric"); // 'metric' | 'imperial'
  const [sex, setSex] = useState("male"); // 'male' | 'female'
  const [heightCm, setHeightCm] = useState(178);
  const [weightKg, setWeightKg] = useState(78);
  const [bodyFat, setBodyFat] = useState(15); // 3–60 %

  // Bulletproof title (helps during HMR)
  useEffect(() => {
    document.title = "FFMI Calculator";
  }, []);

  // Derived imperial displays
  const totalInches = Math.round(heightCm * IN_PER_CM);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches - feet * 12;
  const pounds = Math.round(weightKg * LB_PER_KG);

  const heightM = heightCm / 100;
  const bmi = useMemo(() => +(weightKg / (heightM * heightM)).toFixed(1), [weightKg, heightM]);

  // Lean mass (kg)
  const ffmKg = useMemo(() => {
    const bf = clamp(bodyFat, 0, 100) / 100;
    return +(weightKg * (1 - bf)).toFixed(1);
  }, [weightKg, bodyFat]);

  // FFMI raw & normalized to 1.8 m
  const ffmi = useMemo(() => +(ffmKg / (heightM * heightM)).toFixed(1), [ffmKg, heightM]);
  const ffmiNorm = useMemo(() => +(ffmi + 6.1 * (1.8 - heightM)).toFixed(1), [ffmi, heightM]);

  // Category (rough guidance; not diagnostic)
  const ffmiCategory = useMemo(() => {
    const x = ffmiNorm; // use normalized for comparison
    if (sex === "male") {
      if (x < 17) return "Below average";
      if (x < 19) return "Average";
      if (x < 21) return "Fit";
      if (x < 23) return "Muscular";
      if (x < 25) return "Very muscular";
      return "Exceptional";
    } else {
      if (x < 14) return "Below average";
      if (x < 16) return "Average";
      if (x < 18) return "Fit";
      if (x < 20) return "Muscular";
      if (x < 22) return "Very muscular";
      return "Exceptional";
    }
  }, [ffmiNorm, sex]);

  // Spectrum pointer (normalized FFMI on a 12–28 scale)
  const spectrumMin = 12, spectrumMax = 28;
  const pointerPct = useMemo(() => {
    const v = clamp(ffmiNorm, spectrumMin, spectrumMax);
    return ((v - spectrumMin) / (spectrumMax - spectrumMin)) * 100;
  }, [ffmiNorm]);

  // Helpers
  const setHeightFromFtIn = (ft, inch) => {
    const cm = Math.round(((ft * 12) + inch) / IN_PER_CM);
    setHeightCm(clamp(cm, 120, 220));
  };
  const fmtMass = (kg) => units === "metric" ? `${kg.toFixed(1)} kg` : `${Math.round(kg * LB_PER_KG)} lb`;

  return (
    <>
      {/* React 19 document metadata */}
      <title>FFMI Calculator</title>
      <meta name="description" content="Calculate FFMI and height-normalized FFMI from weight, height, and body-fat percentage." />

      <div className="min-h-screen bg-white text-slate-900">
        <main className="mx-auto max-w-5xl px-4 py-8 grid gap-6">
          {/* Title + unit toggle */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold tracking-tight">FFMI Calculator</h1>
            <div className="inline-flex rounded-xl overflow-hidden border border-slate-200">
              <button
                className={`px-3 py-2 text-sm font-medium ${units === "metric" ? "bg-slate-900 text-white" : "bg-white text-slate-800 hover:bg-slate-50"}`}
                onClick={() => setUnits("metric")}
              >
                Metric
              </button>
              <button
                className={`px-3 py-2 text-sm font-medium ${units === "imperial" ? "bg-slate-900 text-white" : "bg-white text-slate-800 hover:bg-slate-50"}`}
                onClick={() => setUnits("imperial")}
              >
                Imperial
              </button>
            </div>
          </div>

          {/* Sex selector */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm font-medium text-slate-700 mb-2">Sex (for category ranges)</div>
                <div className="flex gap-2">
                  <Segmented active={sex === "male"} onClick={() => setSex("male")}>Male</Segmented>
                  <Segmented active={sex === "female"} onClick={() => setSex("female")}>Female</Segmented>
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="text-sm text-slate-600">
                  FFMI categories are approximate and only used for rough comparison. They don’t diagnose health or performance.
                </div>
              </div>
            </div>
          </section>

          {/* Inputs */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                {units === "metric" ? (
                  <>
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
                        min={40}
                        max={200}
                        step={0.5}
                        value={weightKg}
                        onChange={(e) => setWeightKg(+e.target.value)}
                        className="w-full"
                      />
                    </Field>
                  </>
                ) : (
                  <>
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
                  </>
                )}

                <Field label={`Body Fat: ${bodyFat}%`} hint="Estimate via calipers, BIA scale, DEXA, or tape method">
                  <input
                    type="range"
                    min={3}
                    max={60}
                    step={1}
                    value={bodyFat}
                    onChange={(e) => setBodyFat(+e.target.value)}
                    className="w-full"
                  />
                  <div className="mt-1 flex justify-between text-xs text-slate-500">
                    <span>Lean</span><span>Typical</span><span>Higher</span>
                  </div>
                </Field>
              </Card>

              <Results
                bmi={bmi}
                ffmKg={ffmKg}
                ffmi={ffmi}
                ffmiNorm={ffmiNorm}
                ffmiCategory={ffmiCategory}
                fmtMass={fmtMass}
              />
            </div>

            {/* Spectrum */}
            <div className="mt-6">
              <FfmiSpectrum pointerPct={pointerPct} ffmiNorm={ffmiNorm} sex={sex} />
            </div>
          </section>

          {/* Educational footer */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
            <h3 className="text-sm font-semibold">About FFMI</h3>
            <div className="space-y-2 text-sm text-slate-700">
              <p>
                <strong>What is FFMI?</strong> Fat-Free Mass Index estimates how much lean tissue (muscle, bone, water, organs)
                you carry relative to your height. It’s calculated from <em>fat-free mass</em> divided by height squared—similar
                in form to BMI, but using lean mass instead of total weight.
              </p>
              <p>
                <strong>FFMI vs BMI:</strong> BMI rises with either fat or muscle, while FFMI rises primarily with lean mass.
                That makes FFMI more useful for lifters and athletes when tracking muscularity.
              </p>
              <p>
                <strong>Height-normalized FFMI:</strong> Because taller people naturally score lower, a common convention
                adjusts FFMI to a reference height of 1.8 m: <code>FFMI<sub>norm</sub> = FFMI + 6.1 × (1.8 − height)</code>.
                We report both values above.
              </p>
              <p>
                <strong>Limitations:</strong> FFMI depends on how accurately body fat is measured (calipers, BIA, DEXA, etc.),
                and hydration or food intake can shift results. FFMI is not a direct measure of strength, performance, or health.
              </p>
              <p>
                <strong>How to use it:</strong> Track changes over time with the <em>same</em> measurement method, and pair FFMI
                with performance metrics, photos, and circumference measurements for a fuller picture.
              </p>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}

/* ---------------- Components ---------------- */
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
function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-slate-600">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function Results({ bmi, ffmKg, ffmi, ffmiNorm, ffmiCategory, fmtMass }) {
  return (
    <Card>
      <h2 className="text-lg font-semibold mb-2">Results</h2>
      <div className="text-sm space-y-1">
        <Row label="BMI (kg/m²)" value={bmi.toFixed(1)} />
        <Row label="Lean Mass" value={fmtMass(ffmKg)} />
        <Row label="FFMI" value={ffmi.toFixed(1)} />
        <Row label="FFMI (normalized to 1.8 m)" value={ffmiNorm.toFixed(1)} />
        <Row label="Category" value={ffmiCategory} />
      </div>
    </Card>
  );
}

/** ---- Dynamic FFMI spectrum aligned to sex-specific categories ---- */
function FfmiSpectrum({ pointerPct, ffmiNorm, sex }) {
  const min = 12, max = 28;
  const thresholds = sex === "male" ? [17, 19, 21, 23, 25] : [14, 16, 18, 20, 22];
  const bounds = [min, ...thresholds, max];

  // Colors for each category band (6 bands):
  // 0 Below avg, 1 Average, 2 Fit, 3 Muscular, 4 Very muscular, 5 Exceptional
  const colors = ["#fde68a", "#bbf7d0", "#86efac", "#fef9c3", "#fdba74", "#fca5a5"];
  const labels = sex === "male"
    ? ["<17", "17–<19", "19–<21", "21–<23", "23–<25", "≥25"]
    : ["<14", "14–<16", "16–<18", "18–<20", "20–<22", "≥22"];
  const names  = ["Below avg", "Average", "Fit", "Muscular", "Very muscular", "Exceptional"];

  const segments = bounds.slice(0, -1).map((start, i) => {
    const end = bounds[i + 1];
    const left = ((start - min) / (max - min)) * 100;
    const width = ((end - start) / (max - min)) * 100;
    return { left, width, color: colors[i], name: names[i], label: labels[i] };
  });

  return (
    <div className="relative">
      <div className="h-3 w-full rounded-full overflow-hidden border border-slate-200 bg-slate-100 relative">
        {segments.map((s, idx) => (
          <div
            key={idx}
            className="absolute h-full"
            style={{ left: `${s.left}%`, width: `${s.width}%`, background: s.color }}
            title={`${s.name} (${s.label})`}
          />
        ))}
      </div>

      <Pointer pct={pointerPct} label={`FFMIₙ ${isFinite(ffmiNorm) ? ffmiNorm.toFixed(1) : "-"}`} />

      <div className="mt-1 flex justify-between text-[10px] text-slate-500">
        <span>{min}</span><span>{(min+4)}</span><span>{(min+8)}</span><span>{(min+12)}</span><span>{max}</span>
      </div>

      <Legend
        items={segments.map((s) => ({ color: s.color, label: `${s.name} (${s.label})` }))}
      />
    </div>
  );
}

function Pointer({ pct, label }) {
  return (
    <div className="relative">
      <div className="absolute -top-5" style={{ left: `calc(${pct}% - 12px)` }}>
        <div className="text-[10px] bg-white border border-slate-200 rounded px-1 py-0.5 shadow-sm">{label}</div>
        <div className="mx-auto h-2 w-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-slate-200" />
      </div>
    </div>
  );
}
function Legend({ items }) {
  return (
    <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-slate-600">
      {items.map((it, i) => (
        <span key={i} className="inline-flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: it.color }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}
