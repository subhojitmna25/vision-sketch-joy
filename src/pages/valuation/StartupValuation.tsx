import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import jsPDF from "jspdf";

const fmt = (n: number) => "₹" + Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
const fmtCr = (n: number) => n >= 10000000 ? "₹" + (n / 10000000).toFixed(2) + " Cr" : "₹" + (n / 100000).toFixed(2) + " L";

// ── 1. Berkus Method ──
function BerkusMethod() {
  const factors = [
    { label: "Sound Idea (basic value)", key: "idea" },
    { label: "Prototype / Technology", key: "proto" },
    { label: "Quality Management Team", key: "team" },
    { label: "Strategic Relationships", key: "relations" },
    { label: "Product Rollout / Sales", key: "sales" },
  ];
  const [scores, setScores] = useState<Record<string, number>>({ idea: 3, proto: 2, team: 4, relations: 2, sales: 1 });
  const maxPerFactor = 5000000; // ₹50L max per factor

  const total = useMemo(() => Object.values(scores).reduce((s, v) => s + v * (maxPerFactor / 5), 0), [scores]);
  const chartData = factors.map(f => ({ name: f.label.split("(")[0].trim(), value: scores[f.key] * (maxPerFactor / 5) / 100000 }));

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 space-y-3">
          <h4 className="font-semibold text-orange-800 dark:text-orange-300">🚀 Berkus Factors (Rate 0–5)</h4>
          {factors.map(f => (
            <div key={f.key}>
              <label className="text-xs text-gray-500 block mb-1">{f.label}</label>
              <input type="range" min={0} max={5} step={1} value={scores[f.key]}
                onChange={e => setScores(p => ({ ...p, [f.key]: +e.target.value }))}
                className="w-full accent-orange-500" />
              <div className="text-xs text-right text-gray-400">{scores[f.key]}/5 → {fmtCr(scores[f.key] * maxPerFactor / 5)}</div>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700">
            <h4 className="font-semibold mb-2">Pre-Revenue Valuation</h4>
            <div className="text-3xl font-bold text-orange-600">{fmtCr(total)}</div>
            <div className="text-sm text-gray-500">Max: {fmtCr(maxPerFactor * 5)}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border dark:border-gray-700 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical"><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" tick={{ fontSize: 10 }} /><YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={100} /><Tooltip /><Bar dataKey="value" fill="#f97316" radius={[0,4,4,0]} name="₹ Lakhs" /></BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 2. Scorecard Method ──
function ScorecardMethod() {
  const [avgPre, setAvgPre] = useState(20000000);
  const weights = [
    { label: "Team Strength", key: "team", w: 0.30 },
    { label: "Market Size", key: "market", w: 0.25 },
    { label: "Product/Technology", key: "product", w: 0.15 },
    { label: "Competitive Environment", key: "compete", w: 0.10 },
    { label: "Marketing/Sales", key: "sales", w: 0.10 },
    { label: "Need for Additional Funding", key: "funding", w: 0.05 },
    { label: "Other Factors", key: "other", w: 0.05 },
  ];
  const [ratings, setRatings] = useState<Record<string, number>>({ team: 1.2, market: 1.0, product: 0.8, compete: 1.0, sales: 0.9, funding: 1.0, other: 1.0 });

  const result = useMemo(() => {
    const factor = weights.reduce((s, w) => s + w.w * (ratings[w.key] || 1), 0);
    return { factor, valuation: Math.round(avgPre * factor) };
  }, [avgPre, ratings]);

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 space-y-3">
          <h4 className="font-semibold text-indigo-800 dark:text-indigo-300">📋 Scorecard Inputs</h4>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Regional Avg Pre-Money (₹)</label>
            <input type="number" value={avgPre} step={1000000} onChange={e => setAvgPre(+e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          {weights.map(w => (
            <div key={w.key}>
              <label className="text-xs text-gray-500 block mb-1">{w.label} (Wt: {(w.w * 100).toFixed(0)}%) — Rating: {ratings[w.key].toFixed(1)}x</label>
              <input type="range" min={0.5} max={1.5} step={0.1} value={ratings[w.key]}
                onChange={e => setRatings(p => ({ ...p, [w.key]: +e.target.value }))}
                className="w-full accent-indigo-500" />
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700">
          <h4 className="font-semibold mb-2">Scorecard Valuation</h4>
          <div className="text-3xl font-bold text-indigo-600">{fmtCr(result.valuation)}</div>
          <div className="text-sm text-gray-500 mt-1">Composite Factor: {result.factor.toFixed(2)}x</div>
          <div className="mt-4 space-y-2">
            {weights.map(w => (
              <div key={w.key} className="flex justify-between text-sm">
                <span className="text-gray-500">{w.label}</span>
                <span className={`font-medium ${ratings[w.key] >= 1 ? "text-green-600" : "text-red-500"}`}>{ratings[w.key].toFixed(1)}x</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 3. VC Method ──
function VCMethod() {
  const [exitRev, setExitRev] = useState(100000000);
  const [exitMult, setExitMult] = useState(5);
  const [roi, setRoi] = useState(10);
  const [years, setYears] = useState(5);

  const result = useMemo(() => {
    const exitVal = exitRev * exitMult;
    const preMoney = exitVal / Math.pow(roi, 1);
    const postMoney = exitVal / roi;
    return { exitVal, preMoney: Math.round(postMoney), postMoney: Math.round(postMoney) };
  }, [exitRev, exitMult, roi, years]);

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 space-y-3">
          <h4 className="font-semibold text-green-800 dark:text-green-300">🏦 VC Method Inputs</h4>
          {[
            { label: "Expected Exit Revenue (₹)", val: exitRev, set: setExitRev, step: 10000000 },
            { label: "Exit Revenue Multiple", val: exitMult, set: setExitMult, step: 0.5 },
            { label: "Target ROI (x)", val: roi, set: setRoi, step: 1 },
            { label: "Years to Exit", val: years, set: setYears, step: 1 },
          ].map(({ label, val, set, step }) => (
            <div key={label}>
              <label className="text-xs text-gray-500 block mb-1">{label}</label>
              <input type="number" value={val} step={step} onChange={e => set(+e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700">
          <h4 className="font-semibold mb-3">VC Valuation</h4>
          <div className="space-y-3">
            <div><span className="text-gray-500 text-xs block">Exit Value</span><span className="text-2xl font-bold text-green-600">{fmtCr(result.exitVal)}</span></div>
            <div><span className="text-gray-500 text-xs block">Post-Money Today</span><span className="text-2xl font-bold text-blue-600">{fmtCr(result.postMoney)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 4. Risk Factor Summation ──
function RiskFactor() {
  const [baseVal, setBaseVal] = useState(20000000);
  const risks = [
    "Management", "Stage of Business", "Legislation/Political", "Manufacturing",
    "Sales & Marketing", "Funding/Capital", "Competition", "Technology",
    "Litigation", "International", "Reputation", "Exit Potential",
  ];
  const [adjustments, setAdj] = useState<Record<string, number>>(Object.fromEntries(risks.map(r => [r, 0])));
  const adjustPerUnit = 2500000;

  const result = useMemo(() => {
    const totalAdj = Object.values(adjustments).reduce((s, v) => s + v * adjustPerUnit, 0);
    return { totalAdj, final: baseVal + totalAdj };
  }, [baseVal, adjustments]);

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 space-y-3 max-h-[500px] overflow-y-auto">
          <h4 className="font-semibold text-red-800 dark:text-red-300">⚠️ Risk Factors (−2 to +2)</h4>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Base Valuation (₹)</label>
            <input type="number" value={baseVal} step={1000000} onChange={e => setBaseVal(+e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          {risks.map(r => (
            <div key={r} className="flex items-center gap-2">
              <span className="text-xs text-gray-600 dark:text-gray-300 w-28 flex-shrink-0">{r}</span>
              <input type="range" min={-2} max={2} step={1} value={adjustments[r]}
                onChange={e => setAdj(p => ({ ...p, [r]: +e.target.value }))}
                className="flex-1 accent-red-500" />
              <span className={`text-xs w-8 text-center font-medium ${adjustments[r] > 0 ? "text-green-600" : adjustments[r] < 0 ? "text-red-600" : "text-gray-400"}`}>{adjustments[r] > 0 ? "+" : ""}{adjustments[r]}</span>
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700">
          <h4 className="font-semibold mb-3">Risk-Adjusted Valuation</h4>
          <div className="text-3xl font-bold text-red-600">{fmtCr(result.final)}</div>
          <div className="text-sm text-gray-500 mt-1">Net Adjustment: {result.totalAdj >= 0 ? "+" : ""}{fmtCr(result.totalAdj)}</div>
        </div>
      </div>
    </div>
  );
}

const TABS = [
  { key: "berkus", label: "Berkus Method" },
  { key: "scorecard", label: "Scorecard" },
  { key: "vc", label: "VC Method" },
  { key: "risk", label: "Risk Factor" },
];

export default function StartupValuation() {
  const [tab, setTab] = useState("berkus");

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Startup Valuation Report", 14, 22);
    doc.setFontSize(10);
    doc.text(`Method: ${TABS.find(t => t.key === tab)?.label}`, 14, 32);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 14, 38);
    doc.save("startup-valuation-report.pdf");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">🚀 Startup Valuation</h1>
              <p className="text-gray-500 mt-1">Berkus, Scorecard, VC method, Risk factor summation</p>
            </div>
            <button onClick={exportPDF} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">Export PDF</button>
          </div>
        </motion.div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${tab === t.key ? "bg-indigo-600 text-white shadow" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
              {t.label}
            </button>
          ))}
        </div>

        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {tab === "berkus" && <BerkusMethod />}
          {tab === "scorecard" && <ScorecardMethod />}
          {tab === "vc" && <VCMethod />}
          {tab === "risk" && <RiskFactor />}
        </motion.div>
      </div>
    </div>
  );
}
