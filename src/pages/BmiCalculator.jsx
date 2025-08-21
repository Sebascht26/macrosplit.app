// src/pages/BmiCalculator.jsx
import { useMemo, useState, useEffect } from "react";

/**
 * CDC BMI-for-age percentiles (2–19 y)
 * ------------------------------------
 * If you include LMS data at: src/data/cdc_bmi_lms_bmi_only.json
 * shape: { male: [[L,M,S]...], female: [[L,M,S]...] } for months 24..251 (228 entries)
 * we compute true CDC percentiles. Otherwise we fall back to an IOTF-style proxy.
 *
 * Adults (20+) use fixed CDC categories by BMI.
 */

const LB_PER_KG = 2.2046226218;
const IN_PER_CM = 0.3937007874;

/* ---- IOTF-style proxy cutoffs (compact approximation) ---- */
const IOTF_PROXY = {
  male: {
    2: { u18_5: 14.5, ow25: 18.0, ob30: 20.0 },
    3: { u18_5: 14.4, ow25: 18.2, ob30: 20.4 },
    4: { u18_5: 14.3, ow25: 18.5, ob30: 20.9 },
    5: { u18_5: 14.2, ow25: 18.9, ob30: 21.5 },
    6: { u18_5: 14.3, ow25: 19.4, ob30: 22.2 },
    7: { u18_5: 14.5, ow25: 20.0, ob30: 23.0 },
    8: { u18_5: 14.7, ow25: 20.6, ob30: 23.8 },
    9: { u18_5: 15.0, ow25: 21.2, ob30: 24.6 },
    10: { u18_5: 15.3, ow25: 21.8, ob30: 25.4 },
    11: { u18_5: 15.7, ow25: 22.4, ob30: 26.1 },
    12: { u18_5: 16.1, ow25: 23.0, ob30: 26.8 },
    13: { u18_5: 16.5, ow25: 23.6, ob30: 27.5 },
    14: { u18_5: 16.9, ow25: 24.1, ob30: 28.3 },
    15: { u18_5: 17.4, ow25: 24.6, ob30: 29.0 },
    16: { u18_5: 17.8, ow25: 24.9, ob30: 29.6 },
    17: { u18_5: 18.2, ow25: 25.0, ob30: 29.9 },
    18: { u18_5: 18.5, ow25: 25.0, ob30: 30.0 },
    19: { u18_5: 18.5, ow25: 25.0, ob30: 30.0 }
  },
  female: {
    2: { u18_5: 14.4, ow25: 17.8, ob30: 19.8 },
    3: { u18_5: 14.2, ow25: 18.0, ob30: 20.2 },
    4: { u18_5: 14.1, ow25: 18.4, ob30: 20.7 },
    5: { u18_5: 14.2, ow25: 18.9, ob30: 21.4 },
    6: { u18_5: 14.4, ow25: 19.4, ob30: 22.1 },
    7: { u18_5: 14.7, ow25: 20.0, ob30: 22.9 },
    8: { u18_5: 15.0, ow25: 20.6, ob30: 23.8 },
    9: { u18_5: 15.4, ow25: 21.3, ob30: 24.7 },
    10: { u18_5: 15.8, ow25: 22.0, ob30: 25.6 },
    11: { u18_5: 16.3, ow25: 22.7, ob30: 26.4 },
    12: { u18_5: 16.8, ow25: 23.4, ob30: 27.2 },
    13: { u18_5: 17.2, ow25: 24.0, ob30: 27.8 },
    14: { u18_5: 17.6, ow25: 24.5, ob30: 28.4 },
    15: { u18_5: 18.0, ow25: 24.8, ob30: 28.8 },
    16: { u18_5: 18.3, ow25: 24.9, ob30: 29.1 },
    17: { u18_5: 18.5, ow25: 25.0, ob30: 29.5 },
    18: { u18_5: 18.5, ow25: 25.0, ob30: 30.0 },
    19: { u18_5: 18.5, ow25: 25.0, ob30: 30.0 }
  }
};

function lerp(a,b,t){return a+(b-a)*t;}
function clamp(x,min,max){return Math.max(min,Math.min(max,x));}
function iotfProxyAt(ageYears, sex){
  const s = sex==="female" ? IOTF_PROXY.female : IOTF_PROXY.male;
  const a = clamp(ageYears,2,19);
  const a0 = Math.floor(a), a1 = Math.min(19,a0+1), t = a-a0;
  const p0 = s[a0], p1 = s[a1];
  return {
    u18_5: lerp(p0.u18_5,p1.u18_5,t),
    ow25:  lerp(p0.ow25,  p1.ow25,  t),
    ob30:  lerp(p0.ob30,  p1.ob30,  t),
  };
}

/* ---------- CDC LMS loading (optional) ---------- */
function useCdcLms() {
  const [lms, setLms] = useState(null);
  useEffect(() => {
    let mounted = true;
    import("../data/cdc_bmi_lms_bmi_only.json")
      .then(mod => { if(mounted) setLms(mod.default || mod); })
      .catch(() => { if(mounted) setLms(null); });
    return () => { mounted = false; };
  }, []);
  return lms; // {male: [[L,M,S]...], female: [[L,M,S]...]} or null
}

/* Convert age in years to month index (24..251) */
function ageYearsToMonthIndex(ageYears){
  const months = Math.round(ageYears*12);
  const m = clamp(months,24,251);
  return { m0: m };
}

/* Normal CDF for z -> percentile */
function normCdf(z){
  const b1=0.319381530,b2=-0.356563782,b3=1.781477937,b4=-1.821255978,b5=1.330274429,p=0.2316419;
  const sign=z<0?-1:1,x=Math.abs(z),t=1/(1+p*x);
  const poly=((((b5*t+b4)*t+b3)*t+b2)*t+b1);
  const nd=(1/Math.sqrt(2*Math.PI))*Math.exp(-0.5*x*x);
  const cdf=1-nd*poly*t;
  return sign===1?cdf:1-cdf;
}

/* z from LMS; BMI back from z */
function zFromLms(BMI, L, M, S){
  if(L===0) return Math.log(BMI/M)/S;
  return (Math.pow(BMI/M, L) - 1) / (L*S);
}
function bmiFromZ(z, L, M, S){
  if(L===0) return M * Math.exp(S*z);
  return M * Math.pow(1 + L*S*z, 1/L);
}

/* Child LMS fetcher */
function getLmsAt(ageYears, sex, lms){
  if(!lms || !lms[sex]) return null;
  const { m0 } = ageYearsToMonthIndex(ageYears);
  const idx = m0 - 24; // 0..227
  const row = lms[sex][idx];
  if(!row) return null;
  const [L,M,S] = row;
  return { L, M, S };
}

/* Proxy percentile (when LMS missing): map using u18_5/ow25/ob30 anchors */
function proxyPercentile(bmi, ageYears, sex){
  const { u18_5, ow25, ob30 } = iotfProxyAt(ageYears, sex);
  const minB = Math.max(10, u18_5 - 4);
  const maxB = ob30 + 10;
  if (bmi <= u18_5) {
    const t = (bmi - minB) / (u18_5 - minB);
    return clamp(Math.round(t*5), 0, 5); // 0–5%
  }
  if (bmi <= ow25) {
    const t = (bmi - u18_5) / (ow25 - u18_5);
    return clamp(Math.round(5 + t*80), 5, 85); // 5–85%
  }
  if (bmi <= ob30) {
    const t = (bmi - ow25) / (ob30 - ow25);
    return clamp(Math.round(85 + t*10), 85, 95); // 85–95%
  }
  const t = (bmi - ob30) / (maxB - ob30);
  return clamp(Math.round(95 + t*5), 95, 100); // 95–100%
}

/* CDC child category by percentile */
function childCategoryFromPercentile(p){
  if(p < 5) return { label: "Underweight", band: "under" };
  if(p < 85) return { label: "Healthy Weight", band: "healthy" };
  if(p < 95) return { label: "Overweight", band: "over" };
  return { label: "Obesity", band: "obese" };
}

export default function BmiCalculator() {
  const [units, setUnits] = useState("metric");
  const [sex, setSex] = useState("male");
  const [age, setAge] = useState(25); // years (2–80)
  const [heightCm, setHeightCm] = useState(175);
  const [weightKg, setWeightKg] = useState(70);

  const lms = useCdcLms(); // null until present

  // Imperial helpers
  const totalInches = Math.round(heightCm * IN_PER_CM);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches - feet * 12;
  const pounds = Math.round(weightKg * LB_PER_KG);

  const heightM = heightCm / 100;
  const bmi = useMemo(() => + (weightKg / (heightM * heightM)).toFixed(1), [weightKg, heightM]);
  const ageIsAdult = age >= 20;

  // Adult category
  const adultCategory = useMemo(() => {
    if (!isFinite(bmi)) return "-";
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Healthy Weight";
    if (bmi < 30) return "Overweight";
    if (bmi < 35) return "Obesity (Class I)";
    if (bmi < 40) return "Obesity (Class II)";
    return "Obesity (Class III)";
  }, [bmi]);

  // Child/Teen: CDC LMS percentile if available; else proxy
  const childStats = useMemo(() => {
    if (ageIsAdult) return null;

    const l = getLmsAt(age, sex, lms);
    if (l) {
      const z = zFromLms(bmi, l.L, l.M, l.S);
      const pct = clamp(Math.round(normCdf(z) * 100), 0, 100);
      const cat = childCategoryFromPercentile(pct);
      const z5 = -1.6448536269514729;   // 5th
      const z85 = 1.0364333894937896;   // 85th
      const z95 = 1.6448536269514722;   // 95th
      const t5 = bmiFromZ(z5, l.L, l.M, l.S);
      const t85 = bmiFromZ(z85, l.L, l.M, l.S);
      const t95 = bmiFromZ(z95, l.L, l.M, l.S);
      return { pct, cat, thresholds: { t5, t85, t95 }, hasLms: true };
    }

    const proxy = iotfProxyAt(age, sex);
    const pct = proxyPercentile(bmi, age, sex);
    const cat = childCategoryFromPercentile(pct);
    return {
      pct,
      cat,
      thresholds: { t5: proxy.u18_5, t85: proxy.ow25, t95: proxy.ob30 },
      hasLms: false
    };
  }, [ageIsAdult, age, sex, bmi, lms]);

  const ponderalIndex = useMemo(() => +(weightKg / Math.pow(heightM, 3)).toFixed(1), [weightKg, heightM]);

  // Spectrum positioning
  const spectrumMinBmi = 12, spectrumMaxBmi = 40;
  const adultPointerPct = useMemo(() => {
    const x = clamp(bmi, spectrumMinBmi, spectrumMaxBmi);
    return ((x - spectrumMinBmi) / (spectrumMaxBmi - spectrumMinBmi)) * 100;
  }, [bmi]);
  const childPointerPct = childStats ? clamp(childStats.pct, 0, 100) : 0; // directly percentile %

  // Helpers
  const setHeightFromFtIn = (ft, inch) => {
    const cm = Math.round(((ft * 12) + inch) / IN_PER_CM);
    setHeightCm(clamp(cm, 80, 220)); // allow for children
  };
  const fmtWeight = (kg) => units === "metric" ? `${kg.toFixed(1)} kg` : `${Math.round(kg * LB_PER_KG)} lb`;

  // Healthy weight ranges
  const adultHealthyWeightKg = [18.5 * heightM * heightM, 24.9 * heightM * heightM];
  const childHealthyWeightKg =
    !ageIsAdult && childStats
      ? [childStats.thresholds.t5 * heightM * heightM, childStats.thresholds.t85 * heightM * heightM]
      : null;

  return (
    <>
      {/* React 19 native metadata (no Helmet needed) */}
      <title>BMI Calculator</title>
      <meta
        name="description"
        content="Calculate BMI, BMI-for-age percentiles, healthy weight ranges, and Ponderal Index."
      />

      <div className="min-h-screen bg-white text-slate-900">
        <main className="mx-auto max-w-5xl px-4 py-8 grid gap-6">
          {/* Title + unit toggle */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold tracking-tight">BMI Calculator</h1>
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

          {/* Sex + Age selectors */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm font-medium text-slate-700 mb-2">Sex</div>
                <div className="flex gap-2">
                  <Segmented active={sex === "male"} onClick={() => setSex("male")}>Male</Segmented>
                  <Segmented active={sex === "female"} onClick={() => setSex("female")}>Female</Segmented>
                </div>
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
              </div>
            </div>
          </section>

          {/* Height/Weight inputs */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            {units === "metric" ? (
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <Field label={`Height: ${heightCm} cm`}>
                    <input
                      type="range"
                      min={80}
                      max={220}
                      value={heightCm}
                      onChange={(e) => setHeightCm(+e.target.value)}
                      className="w-full"
                    />
                  </Field>
                  <Field label={`Weight: ${weightKg.toFixed(1)} kg`}>
                    <input
                      type="range"
                      min={10}
                      max={200}
                      step={0.5}
                      value={weightKg}
                      onChange={(e) => setWeightKg(+e.target.value)}
                      className="w-full"
                    />
                  </Field>
                </Card>

                <Results
                  bmi={bmi}
                  adultCategory={adultCategory}
                  ageIsAdult={ageIsAdult}
                  ponderalIndex={ponderalIndex}
                  adultHealthyWeightKg={adultHealthyWeightKg}
                  childHealthyWeightKg={childHealthyWeightKg}
                  units={units}
                  childStats={childStats}
                />
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
                          min={2}
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
                      min={22}
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

                <Results
                  bmi={bmi}
                  adultCategory={adultCategory}
                  ageIsAdult={ageIsAdult}
                  ponderalIndex={ponderalIndex}
                  adultHealthyWeightKg={adultHealthyWeightKg}
                  childHealthyWeightKg={childHealthyWeightKg}
                  units={units}
                  childStats={childStats}
                />
              </div>
            )}

            {/* Spectrum */}
            <div className="mt-6">
              {ageIsAdult ? (
                <AdultSpectrum bmi={bmi} pointerPct={adultPointerPct} />
              ) : (
                <ChildSpectrum pct={childPointerPct} />
              )}
            </div>
          </section>

          {/* Details */}
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-sm font-semibold mb-3">Details</h3>

            {ageIsAdult ? (
              <div className="text-sm text-slate-700 space-y-2">
                <Row label="BMI (kg/m²)" value={bmi.toFixed(1)} />
                <Row label="Adult BMI Category" value={adultCategory} />
                <Row label="Healthy BMI Range (adult)" value={`18.5–24.9`} />
                <Row
                  label="Healthy Weight for Your Height (adult)"
                  value={`${fmtWeight(adultHealthyWeightKg[0])} – ${fmtWeight(adultHealthyWeightKg[1])}`}
                />
                <Row label="Ponderal Index (kg/m³)" value={ponderalIndex.toFixed(1)} />
              </div>
            ) : (
              <div className="text-sm text-slate-700 space-y-2">
                <Row label="BMI (kg/m²)" value={bmi.toFixed(1)} />
                <Row
                  label="BMI-for-Age Percentile"
                  value={childStats?.pct != null ? `${childStats.pct}%` : "—"}
                />
                <Row label="Child/Teen Category" value={childStats?.cat?.label ?? "—"} />
                <Row
                  label="Healthy Weight for Your Height (child/teen)"
                  value={
                    childHealthyWeightKg
                      ? `${fmtWeight(childHealthyWeightKg[0])} – ${fmtWeight(childHealthyWeightKg[1])}`
                      : "—"
                  }
                />
                <Row label="Ponderal Index (kg/m³)" value={ponderalIndex.toFixed(1)} />
              </div>
            )}
          </section>

          {/* Educational footer */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
            <h3 className="text-sm font-semibold">About BMI & Ponderal Index</h3>
            <div className="space-y-2 text-sm text-slate-700">
              <p>
                <strong>BMI (Body Mass Index)</strong> estimates body fatness from weight and height:
                BMI = weight (kg) / height (m)². For adults, categories use fixed cutoffs; for
                ages 2–19, BMI is interpreted using percentiles for age and sex.
              </p>
              <p>
                <strong>Risks when BMI is high (overweight/obesity):</strong> Increased risk of type 2 diabetes,
                high blood pressure, dyslipidemia, coronary heart disease, stroke, sleep apnea, certain cancers,
                and osteoarthritis. In children/teens, high percentiles are linked to cardiometabolic risk factors.
              </p>
              <p>
                <strong>Risks when BMI is low (underweight):</strong> Nutrient deficiencies, low bone mineral density,
                decreased immune function, fertility issues, and in youth, potential impacts on growth and development.
              </p>
              <p>
                <strong>Limitations of BMI:</strong> It doesn’t distinguish fat from muscle, doesn’t capture fat
                distribution (e.g., visceral vs. subcutaneous), and can misclassify very muscular people. Ethnicity,
                age, and body composition can shift health risk at the same BMI. For under-20s, percentiles adjust for
                normal growth patterns.
              </p>
              <p>
                <strong>Ponderal Index (PI)</strong> = weight (kg) / height (m)³. Because it scales with height³,
                PI can be more stable than BMI across different statures (especially helpful in very short or very tall
                individuals and in pediatrics). Use PI alongside BMI for an extra lens on body proportionality.
              </p>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}

/* ---------- Components & helpers ---------- */
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

/** Results panel */
function Results({
  bmi, adultCategory, ageIsAdult, ponderalIndex,
  adultHealthyWeightKg, childHealthyWeightKg, units, childStats
}) {
  return (
    <Card>
      <h2 className="text-lg font-semibold mb-2">Results</h2>
      <div className="text-sm space-y-1">
        <Row label="BMI" value={bmi.toFixed(1)} />
        {ageIsAdult ? (
          <>
            <Row label="Category" value={adultCategory} />
            <Row label="Healthy BMI Range" value="18.5–24.9" />
            <Row
              label="Healthy Weight"
              value={
                units === "metric"
                  ? `${adultHealthyWeightKg[0].toFixed(1)}–${adultHealthyWeightKg[1].toFixed(1)} kg`
                  : `${Math.round(adultHealthyWeightKg[0] * LB_PER_KG)}–${Math.round(adultHealthyWeightKg[1] * LB_PER_KG)} lb`
              }
            />
          </>
        ) : (
          <>
            <Row label="Percentile (BMI-for-Age)" value={childStats?.pct != null ? `${childStats.pct}%` : "—"} />
            <Row label="Category" value={childStats?.cat?.label ?? "—"} />
            {childHealthyWeightKg && (
              <Row
                label="Healthy Weight"
                value={
                  units === "metric"
                    ? `${childHealthyWeightKg[0].toFixed(1)}–${childHealthyWeightKg[1].toFixed(1)} kg`
                    : `${Math.round(childHealthyWeightKg[0] * LB_PER_KG)}–${Math.round(childHealthyWeightKg[1] * LB_PER_KG)} lb`
                }
              />
            )}
          </>
        )}
        <Row label="Ponderal Index" value={ponderalIndex.toFixed(1)} />
      </div>
    </Card>
  );
}

/** Adult BMI spectrum (12–40 BMI) with green/yellow/red scheme */
function AdultSpectrum({ bmi, pointerPct }) {
  return (
    <div className="relative">
      <div className="h-3 w-full rounded-full overflow-hidden border border-slate-200 bg-slate-100 relative">
        {/* Underweight <18.5 (muted yellow) */}
        <div className="absolute h-full" style={{ left: "0%",   width: "17.5%", background: "#fde68a" }} />
        {/* Healthy 18.5–24.9 (green) */}
        <div className="absolute h-full" style={{ left: "17.5%", width: "21.5%", background: "#bbf7d0" }} />
        {/* Overweight 25–29.9 (yellow) */}
        <div className="absolute h-full" style={{ left: "39%",  width: "12.5%", background: "#fef9c3" }} />
        {/* Obesity 30+ (red gradient) */}
        <div className="absolute h-full" style={{ left: "51.5%", width: "12.5%", background: "#fecaca" }} />
        <div className="absolute h-full" style={{ left: "64%",   width: "12.5%", background: "#fca5a5" }} />
        <div className="absolute h-full" style={{ left: "76.5%", width: "23.5%", background: "#f87171" }} />
      </div>
      <Pointer pct={pointerPct} label={`BMI ${isFinite(bmi) ? bmi.toFixed(1) : "-"}`} />
      <div className="mt-1 flex justify-between text-[10px] text-slate-500">
        <span>12</span><span>18.5</span><span>25</span><span>30</span><span>35</span><span>40+</span>
      </div>
      <Legend items={[
        { color: "#fde68a", label: "Underweight" },
        { color: "#bbf7d0", label: "Healthy" },
        { color: "#fef9c3", label: "Overweight" },
        { color: "#f87171", label: "Obesity" },
      ]}/>
    </div>
  );
}

/** Child/Teen percentile spectrum (0–100%) with CDC cutoffs */
function ChildSpectrum({ pct }) {
  const p = clamp(pct ?? 0, 0, 100);
  return (
    <div className="relative">
      {/* Bands: 0–5, 5–85, 85–95, 95–100 */}
      <div className="h-3 w-full rounded-full overflow-hidden border border-slate-200 bg-slate-100 relative">
        <div className="absolute h-full" style={{ left: "0%",   width: "5%",  background: "#fde68a" }} />
        <div className="absolute h-full" style={{ left: "5%",   width: "80%", background: "#bbf7d0" }} />
        <div className="absolute h-full" style={{ left: "85%",  width: "10%", background: "#fef9c3" }} />
        <div className="absolute h-full" style={{ left: "95%",  width: "5%",  background: "#fca5a5" }} />
      </div>

      <Pointer pct={p} label={`${p}%`} />

      <div className="mt-1 flex justify-between text-[10px] text-slate-500">
        <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
      </div>

      <Legend items={[
        { color: "#fde68a", label: "Underweight (<5%)" },
        { color: "#bbf7d0", label: "Healthy (5–<85%)" },
        { color: "#fef9c3", label: "Overweight (85–<95%)" },
        { color: "#fca5a5", label: "Obesity (≥95%)" },
      ]}/>
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
