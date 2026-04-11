import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import jsPDF from "jspdf";

const fmt = (n: number) => "₹" + Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
const fmtCr = (n: number) => n >= 10000000 ? "₹" + (n / 10000000).toFixed(2) + " Cr" : "₹" + (n / 100000).toFixed(2) + " L";

// ── 1. MACT Compensation ──
function MACTCompensation() {
  const [age, setAge] = useState(35);
  const [income, setIncome] = useState(500000);
  const [disability, setDisability] = useState(100);
  const [dependents, setDependents] = useState(3);

  const result = useMemo(() => {
    const multiplierTable: Record<string, number> = {};
    for (let a = 15; a <= 70; a++) {
      if (a <= 15) multiplierTable[a.toString()] = 15;
      else if (a <= 20) multiplierTable[a.toString()] = 18;
      else if (a <= 25) multiplierTable[a.toString()] = 17;
      else if (a <= 30) multiplierTable[a.toString()] = 16;
      else if (a <= 35) multiplierTable[a.toString()] = 15;
      else if (a <= 40) multiplierTable[a.toString()] = 14;
      else if (a <= 45) multiplierTable[a.toString()] = 13;
      else if (a <= 50) multiplierTable[a.toString()] = 12;
      else if (a <= 55) multiplierTable[a.toString()] = 11;
      else if (a <= 60) multiplierTable[a.toString()] = 9;
      else if (a <= 65) multiplierTable[a.toString()] = 7;
      else multiplierTable[a.toString()] = 5;
    }
    const mult = multiplierTable[Math.min(70, Math.max(15, age)).toString()] || 10;
    const addForFuture = income * 0.40;
    const totalIncome = income + addForFuture;
    const deduction = dependents > 0 ? totalIncome / 3 : 0;
    const annualLoss = (totalIncome - deduction) * (disability / 100);
    const totalCompensation = annualLoss * mult;
    const conventional = 100000 + 15000 + 50000;
    return { mult, annualLoss, totalCompensation, conventional, grandTotal: totalCompensation + conventional };
  }, [age, income, disability, dependents]);

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 space-y-3">
          <h4 className="font-semibold text-red-800 dark:text-red-300">⚖️ MACT Inputs</h4>
          {[
            { label: "Age of Deceased/Victim", val: age, set: setAge, step: 1 },
            { label: "Monthly Income (₹)", val: income, set: setIncome, step: 5000 },
            { label: "Disability % (100 = death)", val: disability, set: setDisability, step: 5 },
            { label: "Number of Dependents", val: dependents, set: setDependents, step: 1 },
          ].map(({ label, val, set, step }) => (
            <div key={label}>
              <label className="text-xs text-gray-500 block mb-1">{label}</label>
              <input type="number" value={val} step={step} onChange={e => set(+e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700">
          <h4 className="font-semibold mb-3">MACT Compensation</h4>
          <div className="text-3xl font-bold text-red-600">{fmtCr(result.grandTotal)}</div>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Multiplier</span><span className="font-medium">{result.mult}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Annual Loss of Dependency</span><span className="font-medium">{fmt(result.annualLoss)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Loss of Dependency Total</span><span className="font-medium">{fmtCr(result.totalCompensation)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Conventional Heads</span><span className="font-medium">{fmt(result.conventional)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 2. Workers' Compensation ──
function WorkersCompensation() {
  const [monthlyWage, setMonthlyWage] = useState(25000);
  const [ageAtInjury, setAgeAtInjury] = useState(30);
  const [disabilityPct, setDisabilityPct] = useState(50);
  const [isTemporary, setIsTemporary] = useState(false);

  const result = useMemo(() => {
    const factor = ageAtInjury <= 25 ? 228.54 : ageAtInjury <= 30 ? 219.36 : ageAtInjury <= 35 ? 207.98 : ageAtInjury <= 40 ? 193.04 : ageAtInjury <= 45 ? 176.86 : ageAtInjury <= 50 ? 159.80 : ageAtInjury <= 55 ? 140.84 : 121.29;
    const comp = isTemporary
      ? monthlyWage * 0.5 * 12 * 5 * (disabilityPct / 100)
      : monthlyWage * factor * (disabilityPct / 100);
    const minDeath = 120000;
    const deathComp = monthlyWage * 0.5 * factor;
    return { factor, compensation: Math.round(comp), deathComp: Math.round(Math.max(deathComp, minDeath)) };
  }, [monthlyWage, ageAtInjury, disabilityPct, isTemporary]);

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 space-y-3">
          <h4 className="font-semibold text-amber-800 dark:text-amber-300">🏭 WC Act Inputs</h4>
          {[
            { label: "Monthly Wages (₹)", val: monthlyWage, set: setMonthlyWage, step: 1000 },
            { label: "Age at Injury", val: ageAtInjury, set: setAgeAtInjury, step: 1 },
            { label: "Disability %", val: disabilityPct, set: setDisabilityPct, step: 5 },
          ].map(({ label, val, set, step }) => (
            <div key={label}>
              <label className="text-xs text-gray-500 block mb-1">{label}</label>
              <input type="number" value={val} step={step} onChange={e => set(+e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          ))}
          <div className="flex items-center gap-2 mt-2">
            <input type="checkbox" checked={isTemporary} onChange={e => setIsTemporary(e.target.checked)} className="accent-amber-500" />
            <label className="text-sm text-gray-600 dark:text-gray-300">Temporary Disablement</label>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700">
          <h4 className="font-semibold mb-3">Compensation Amount</h4>
          <div className="text-3xl font-bold text-amber-600">{fmt(result.compensation)}</div>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Relevant Factor</span><span>{result.factor}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Death Compensation</span><span className="font-medium">{fmt(result.deathComp)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 3. Stamp Duty Calculator ──
function StampDutyCalc() {
  const [propValue, setPropValue] = useState(5000000);
  const [state, setState] = useState("Maharashtra");
  const states: Record<string, { stamp: number; reg: number }> = {
    Maharashtra: { stamp: 5, reg: 1 },
    Karnataka: { stamp: 5, reg: 1 },
    Delhi: { stamp: 6, reg: 1 },
    "Tamil Nadu": { stamp: 7, reg: 1 },
    "West Bengal": { stamp: 6, reg: 1 },
    Gujarat: { stamp: 4.9, reg: 1 },
    Rajasthan: { stamp: 5, reg: 1 },
    UP: { stamp: 7, reg: 1 },
  };

  const s = states[state] || { stamp: 5, reg: 1 };
  const stampDuty = propValue * s.stamp / 100;
  const regFee = propValue * s.reg / 100;
  const total = stampDuty + regFee;

  const chartData = Object.entries(states).map(([st, v]) => ({
    state: st, stamp: v.stamp, total: v.stamp + v.reg,
  }));

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 space-y-3">
          <h4 className="font-semibold text-indigo-800 dark:text-indigo-300">📜 Stamp Duty Inputs</h4>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Property Value (₹)</label>
            <input type="number" value={propValue} step={100000} onChange={e => setPropValue(+e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">State</label>
            <select value={state} onChange={e => setState(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              {Object.keys(states).map(st => <option key={st} value={st}>{st}</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700">
            <h4 className="font-semibold mb-3">Duty Breakdown</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Stamp Duty ({s.stamp}%)</span><span className="font-medium">{fmt(stampDuty)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Registration ({s.reg}%)</span><span className="font-medium">{fmt(regFee)}</span></div>
              <div className="flex justify-between border-t pt-2"><span className="font-semibold">Total Payable</span><span className="font-bold text-indigo-600">{fmt(total)}</span></div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border dark:border-gray-700 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="state" tick={{ fontSize: 9 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="total" fill="#6366f1" radius={[4,4,0,0]} name="Total %" /></BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

const TABS = [
  { key: "mact", label: "MACT Compensation" },
  { key: "wc", label: "Workers' Comp" },
  { key: "stamp", label: "Stamp Duty" },
];

export default function LegalValuation() {
  const [tab, setTab] = useState("mact");

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Legal & Court Valuation Report", 14, 22);
    doc.setFontSize(10);
    doc.text(`Method: ${TABS.find(t => t.key === tab)?.label}`, 14, 32);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 14, 38);
    doc.save("legal-valuation-report.pdf");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">⚖️ Legal & Court Valuation</h1>
              <p className="text-gray-500 mt-1">MACT, WC Act, stamp duty, compensation calculators</p>
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
          {tab === "mact" && <MACTCompensation />}
          {tab === "wc" && <WorkersCompensation />}
          {tab === "stamp" && <StampDutyCalc />}
        </motion.div>
      </div>
    </div>
  );
}
