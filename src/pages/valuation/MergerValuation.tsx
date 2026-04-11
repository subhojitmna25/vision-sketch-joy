import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import jsPDF from "jspdf";

const fmt = (n: number) => "₹" + Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
const fmtCr = (n: number) => n >= 10000000 ? "₹" + (n / 10000000).toFixed(2) + " Cr" : "₹" + (n / 100000).toFixed(2) + " L";

// ── 1. Swap Ratio Calculator ──
function SwapRatio() {
  const [acquirerEPS, setAcquirerEPS] = useState(40);
  const [acquirerPE, setAcquirerPE] = useState(20);
  const [acquirerShares, setAcquirerShares] = useState(10000000);
  const [targetEPS, setTargetEPS] = useState(25);
  const [targetPE, setTargetPE] = useState(15);
  const [targetShares, setTargetShares] = useState(5000000);

  const result = useMemo(() => {
    const acquirerPrice = acquirerEPS * acquirerPE;
    const targetPrice = targetEPS * targetPE;
    const swapRatio = targetPrice / acquirerPrice;
    const newShares = Math.round(targetShares * swapRatio);
    const totalShares = acquirerShares + newShares;
    const combinedEarnings = acquirerEPS * acquirerShares + targetEPS * targetShares;
    const postEPS = combinedEarnings / totalShares;
    const epsAccretion = ((postEPS - acquirerEPS) / acquirerEPS) * 100;
    return { acquirerPrice, targetPrice, swapRatio, newShares, totalShares, postEPS: postEPS.toFixed(2), epsAccretion: epsAccretion.toFixed(2) };
  }, [acquirerEPS, acquirerPE, acquirerShares, targetEPS, targetPE, targetShares]);

  const chartData = [
    { label: "Acquirer", value: result.acquirerPrice },
    { label: "Target", value: result.targetPrice },
  ];

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl p-4 space-y-3">
            <h4 className="font-semibold text-teal-800 dark:text-teal-300">🏢 Acquirer</h4>
            {[
              { label: "EPS (₹)", val: acquirerEPS, set: setAcquirerEPS, step: 1 },
              { label: "P/E Multiple", val: acquirerPE, set: setAcquirerPE, step: 1 },
              { label: "Shares Outstanding", val: acquirerShares, set: setAcquirerShares, step: 100000 },
            ].map(({ label, val, set, step }) => (
              <div key={label}><label className="text-xs text-gray-500 block mb-1">{label}</label>
                <input type="number" value={val} step={step} onChange={e => set(+e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" /></div>
            ))}
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 space-y-3">
            <h4 className="font-semibold text-purple-800 dark:text-purple-300">🎯 Target</h4>
            {[
              { label: "EPS (₹)", val: targetEPS, set: setTargetEPS, step: 1 },
              { label: "P/E Multiple", val: targetPE, set: setTargetPE, step: 1 },
              { label: "Shares Outstanding", val: targetShares, set: setTargetShares, step: 100000 },
            ].map(({ label, val, set, step }) => (
              <div key={label}><label className="text-xs text-gray-500 block mb-1">{label}</label>
                <input type="number" value={val} step={step} onChange={e => set(+e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" /></div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700">
            <h4 className="font-semibold mb-3">Swap Ratio Analysis</h4>
            <div className="text-3xl font-bold text-teal-600">{result.swapRatio.toFixed(4)} : 1</div>
            <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
              <div><span className="text-gray-500 block">New Shares Issued</span><span className="font-medium">{result.newShares.toLocaleString("en-IN")}</span></div>
              <div><span className="text-gray-500 block">Post-Merger EPS</span><span className="font-medium">₹{result.postEPS}</span></div>
              <div><span className="text-gray-500 block">EPS Accretion</span><span className={`font-medium ${parseFloat(result.epsAccretion) >= 0 ? "text-green-600" : "text-red-500"}`}>{result.epsAccretion}%</span></div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border dark:border-gray-700 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="label" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#14b8a6" radius={[4,4,0,0]} name="Share Price (₹)" /></BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 2. Synergy Analysis ──
function SynergyAnalysis() {
  const [revSynergy, setRevSynergy] = useState(50000000);
  const [costSynergy, setCostSynergy] = useState(30000000);
  const [integrationCost, setIntegrationCost] = useState(20000000);
  const [realization, setRealization] = useState(3);
  const [discount, setDiscount] = useState(12);

  const result = useMemo(() => {
    const totalAnnual = revSynergy + costSynergy;
    let npv = -integrationCost;
    const data = [];
    for (let y = 1; y <= 5; y++) {
      const realized = y <= realization ? totalAnnual * (y / realization) : totalAnnual;
      const pv = realized / Math.pow(1 + discount / 100, y);
      npv += pv;
      data.push({ year: `Y${y}`, synergy: Math.round(realized / 100000), pv: Math.round(pv / 100000) });
    }
    return { totalAnnual, npv, data };
  }, [revSynergy, costSynergy, integrationCost, realization, discount]);

  const COLORS = ["#3b82f6", "#10b981"];
  const pieData = [
    { name: "Revenue Synergy", value: revSynergy },
    { name: "Cost Synergy", value: costSynergy },
  ];

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 space-y-3">
          <h4 className="font-semibold text-blue-800 dark:text-blue-300">🔄 Synergy Inputs</h4>
          {[
            { label: "Annual Revenue Synergy (₹)", val: revSynergy, set: setRevSynergy, step: 5000000 },
            { label: "Annual Cost Synergy (₹)", val: costSynergy, set: setCostSynergy, step: 5000000 },
            { label: "Integration Cost (₹)", val: integrationCost, set: setIntegrationCost, step: 5000000 },
            { label: "Realization Period (years)", val: realization, set: setRealization, step: 1 },
            { label: "Discount Rate (%)", val: discount, set: setDiscount, step: 0.5 },
          ].map(({ label, val, set, step }) => (
            <div key={label}><label className="text-xs text-gray-500 block mb-1">{label}</label>
              <input type="number" value={val} step={step} onChange={e => set(+e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" /></div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700">
            <h4 className="font-semibold mb-2">Synergy NPV</h4>
            <div className={`text-3xl font-bold ${result.npv >= 0 ? "text-green-600" : "text-red-500"}`}>{fmtCr(result.npv)}</div>
            <div className="text-sm text-gray-500 mt-1">Annual Synergy (at full realization): {fmtCr(result.totalAnnual)}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border dark:border-gray-700 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={pieData} cx="50%" cy="50%" outerRadius={55} dataKey="value" label={({ name }) => name.split(" ")[0]}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie><Tooltip /></PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border dark:border-gray-700 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={result.data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="year" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="synergy" fill="#3b82f6" radius={[4,4,0,0]} name="Synergy (₹L)" /></BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 3. Fairness Opinion ──
function FairnessOpinion() {
  const [offerPrice, setOfferPrice] = useState(500);
  const [dcfLow, setDcfLow] = useState(420);
  const [dcfHigh, setDcfHigh] = useState(550);
  const [compLow, setCompLow] = useState(380);
  const [compHigh, setCompHigh] = useState(510);
  const [bookValue, setBookValue] = useState(300);
  const [wkHigh, setWkHigh] = useState(530);
  const [wkLow, setWkLow] = useState(350);

  const ranges = [
    { method: "DCF", low: dcfLow, high: dcfHigh, color: "#3b82f6" },
    { method: "Comparable", low: compLow, high: compHigh, color: "#10b981" },
    { method: "52-Wk Range", low: wkLow, high: wkHigh, color: "#f59e0b" },
    { method: "Book Value", low: bookValue, high: bookValue, color: "#8b5cf6" },
  ];

  const isFair = ranges.filter(r => offerPrice >= r.low && offerPrice <= r.high).length >= 2;

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 space-y-3">
          <h4 className="font-semibold text-green-800 dark:text-green-300">📊 Valuation Ranges</h4>
          <div><label className="text-xs text-gray-500 block mb-1">Offer Price (₹)</label>
            <input type="number" value={offerPrice} step={10} onChange={e => setOfferPrice(+e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" /></div>
          {[
            { label: "DCF Low / High", low: dcfLow, high: dcfHigh, setLow: setDcfLow, setHigh: setDcfHigh },
            { label: "Comparable Low / High", low: compLow, high: compHigh, setLow: setCompLow, setHigh: setCompHigh },
            { label: "52-Wk Low / High", low: wkLow, high: wkHigh, setLow: setWkLow, setHigh: setWkHigh },
          ].map(r => (
            <div key={r.label} className="grid grid-cols-2 gap-2">
              <div><label className="text-xs text-gray-500 block mb-1">{r.label.split("/")[0]}</label>
                <input type="number" value={r.low} onChange={e => r.setLow(+e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" /></div>
              <div><label className="text-xs text-gray-500 block mb-1">{r.label.split("/")[1]}</label>
                <input type="number" value={r.high} onChange={e => r.setHigh(+e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" /></div>
            </div>
          ))}
          <div><label className="text-xs text-gray-500 block mb-1">Book Value (₹)</label>
            <input type="number" value={bookValue} onChange={e => setBookValue(+e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" /></div>
        </div>
        <div className="space-y-4">
          <div className={`rounded-xl p-4 border ${isFair ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700" : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700"}`}>
            <h4 className="font-semibold mb-2">Fairness Opinion</h4>
            <div className={`text-2xl font-bold ${isFair ? "text-green-600" : "text-red-600"}`}>
              {isFair ? "✅ FAIR" : "❌ NOT FAIR"}
            </div>
            <div className="text-sm text-gray-500 mt-1">Offer price {fmt(offerPrice)} falls within {ranges.filter(r => offerPrice >= r.low && offerPrice <= r.high).length}/{ranges.length} valuation ranges</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700">
            <h4 className="text-sm font-semibold mb-3">Valuation Football Field</h4>
            <div className="space-y-3">
              {ranges.map(r => (
                <div key={r.method} className="flex items-center gap-3">
                  <span className="w-24 text-xs text-gray-500">{r.method}</span>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-4 relative">
                    <div className="absolute h-4 rounded-full opacity-60" style={{
                      left: `${(r.low / 700) * 100}%`,
                      width: `${((r.high - r.low) / 700) * 100}%`,
                      backgroundColor: r.color,
                    }} />
                    <div className="absolute w-0.5 h-6 -top-1 bg-red-500" style={{ left: `${(offerPrice / 700) * 100}%` }} />
                  </div>
                  <span className="text-xs text-gray-400 w-20">{fmt(r.low)}–{fmt(r.high)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const TABS = [
  { key: "swap", label: "Swap Ratio" },
  { key: "synergy", label: "Synergy Analysis" },
  { key: "fairness", label: "Fairness Opinion" },
];

export default function MergerValuation() {
  const [tab, setTab] = useState("swap");

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Merger & Acquisition Report", 14, 22);
    doc.setFontSize(10);
    doc.text(`Analysis: ${TABS.find(t => t.key === tab)?.label}`, 14, 32);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 14, 38);
    doc.save("merger-valuation-report.pdf");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">🔄 Merger & Acquisition</h1>
              <p className="text-gray-500 mt-1">Swap ratio, synergy analysis, fairness opinion</p>
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
          {tab === "swap" && <SwapRatio />}
          {tab === "synergy" && <SynergyAnalysis />}
          {tab === "fairness" && <FairnessOpinion />}
        </motion.div>
      </div>
    </div>
  );
}
