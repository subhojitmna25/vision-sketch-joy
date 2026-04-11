import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import jsPDF from "jspdf";

const fmt = (n: number) => "₹" + Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
const fmtCr = (n: number) => n >= 10000000 ? "₹" + (n / 10000000).toFixed(2) + " Cr" : "₹" + (n / 100000).toFixed(2) + " L";

// ── 1. Graham Formula ──
function GrahamFormula() {
  const [eps, setEps] = useState(25);
  const [growth, setGrowth] = useState(15);
  const [aaa, setAaa] = useState(7.5);

  const result = useMemo(() => {
    const intrinsic = (eps * (8.5 + 2 * growth) * 4.4) / aaa;
    return { intrinsic: Math.round(intrinsic), margin30: Math.round(intrinsic * 0.7), margin50: Math.round(intrinsic * 0.5) };
  }, [eps, growth, aaa]);

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 space-y-3">
          <h4 className="font-semibold text-green-800 dark:text-green-300">📊 Graham Number Inputs</h4>
          {[
            { label: "EPS (₹)", val: eps, set: setEps, step: 1 },
            { label: "Growth Rate (%)", val: growth, set: setGrowth, step: 0.5 },
            { label: "AAA Bond Yield (%)", val: aaa, set: setAaa, step: 0.1 },
          ].map(({ label, val, set, step }) => (
            <div key={label}>
              <label className="text-xs text-gray-500 block mb-1">{label}</label>
              <input type="number" value={val} step={step} onChange={e => set(+e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700">
          <h4 className="font-semibold mb-3">Intrinsic Value</h4>
          <div className="text-3xl font-bold text-green-600">{fmt(result.intrinsic)}</div>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">30% Margin of Safety</span><span className="font-medium text-blue-600">{fmt(result.margin30)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">50% Margin of Safety</span><span className="font-medium text-orange-600">{fmt(result.margin50)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 2. DDM (Dividend Discount Model) ──
function DDMMethod() {
  const [div, setDiv] = useState(10);
  const [divGrowth, setDivGrowth] = useState(8);
  const [req, setReq] = useState(12);

  const result = useMemo(() => {
    if (req <= divGrowth) return { value: 0, yield_: 0 };
    const value = (div * (1 + divGrowth / 100)) / ((req - divGrowth) / 100);
    return { value: Math.round(value), yield_: ((div / value) * 100) };
  }, [div, divGrowth, req]);

  const chartData = useMemo(() => {
    const data = [];
    let d = div;
    for (let y = 1; y <= 10; y++) {
      d = d * (1 + divGrowth / 100);
      data.push({ year: `Year ${y}`, dividend: Math.round(d) });
    }
    return data;
  }, [div, divGrowth]);

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 space-y-3">
          <h4 className="font-semibold text-purple-800 dark:text-purple-300">💰 DDM Inputs</h4>
          {[
            { label: "Current Annual Dividend (₹)", val: div, set: setDiv, step: 1 },
            { label: "Dividend Growth Rate (%)", val: divGrowth, set: setDivGrowth, step: 0.5 },
            { label: "Required Rate of Return (%)", val: req, set: setReq, step: 0.5 },
          ].map(({ label, val, set, step }) => (
            <div key={label}>
              <label className="text-xs text-gray-500 block mb-1">{label}</label>
              <input type="number" value={val} step={step} onChange={e => set(+e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700">
            <h4 className="font-semibold mb-3">Fair Value (DDM)</h4>
            <div className="text-3xl font-bold text-purple-600">{fmt(result.value)}</div>
            <div className="text-sm text-gray-500 mt-1">Dividend Yield: {result.yield_.toFixed(2)}%</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border dark:border-gray-700 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="year" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="dividend" fill="#9333ea" radius={[4,4,0,0]} /></BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 3. FCF Valuation ──
function FCFValuation() {
  const [fcf, setFcf] = useState(5000000);
  const [fcfGrowth, setFcfGrowth] = useState(12);
  const [wacc, setWacc] = useState(10);
  const [tgr, setTgr] = useState(3);
  const [shares, setShares] = useState(100000);
  const [debt, setDebt] = useState(10000000);

  const result = useMemo(() => {
    let pvFCF = 0;
    let cf = fcf;
    const projections = [];
    for (let y = 1; y <= 5; y++) {
      cf = cf * (1 + fcfGrowth / 100);
      const pv = cf / Math.pow(1 + wacc / 100, y);
      pvFCF += pv;
      projections.push({ year: `Y${y}`, fcf: Math.round(cf / 100000), pv: Math.round(pv / 100000) });
    }
    const terminalVal = (cf * (1 + tgr / 100)) / ((wacc - tgr) / 100);
    const pvTerminal = terminalVal / Math.pow(1 + wacc / 100, 5);
    const ev = pvFCF + pvTerminal;
    const equity = ev - debt;
    const perShare = equity / shares;
    return { ev, equity, perShare: Math.round(perShare), pvFCF, pvTerminal, projections };
  }, [fcf, fcfGrowth, wacc, tgr, shares, debt]);

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 space-y-3">
          <h4 className="font-semibold text-blue-800 dark:text-blue-300">📈 FCF Inputs</h4>
          {[
            { label: "Current FCF (₹)", val: fcf, set: setFcf, step: 100000 },
            { label: "FCF Growth Rate (%)", val: fcfGrowth, set: setFcfGrowth, step: 0.5 },
            { label: "WACC (%)", val: wacc, set: setWacc, step: 0.5 },
            { label: "Terminal Growth (%)", val: tgr, set: setTgr, step: 0.5 },
            { label: "Total Shares", val: shares, set: setShares, step: 1000 },
            { label: "Net Debt (₹)", val: debt, set: setDebt, step: 100000 },
          ].map(({ label, val, set, step }) => (
            <div key={label}>
              <label className="text-xs text-gray-500 block mb-1">{label}</label>
              <input type="number" value={val} step={step} onChange={e => set(+e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700">
            <h4 className="font-semibold mb-3">Intrinsic Value per Share</h4>
            <div className="text-3xl font-bold text-blue-600">{fmt(result.perShare)}</div>
            <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
              <div><span className="text-gray-500 block">Enterprise Value</span><span className="font-medium">{fmtCr(result.ev)}</span></div>
              <div><span className="text-gray-500 block">Equity Value</span><span className="font-medium">{fmtCr(result.equity)}</span></div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border dark:border-gray-700 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={result.projections}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="year" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="fcf" fill="#3b82f6" radius={[4,4,0,0]} name="FCF (₹L)" /><Bar dataKey="pv" fill="#93c5fd" radius={[4,4,0,0]} name="PV (₹L)" /></BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 4. Peer Comparison ──
function PeerComparison() {
  const [peers, setPeers] = useState([
    { name: "Company A", pe: 22, pb: 3.5, roe: 18, debt_eq: 0.4 },
    { name: "Company B", pe: 18, pb: 2.8, roe: 15, debt_eq: 0.6 },
    { name: "Company C", pe: 28, pb: 4.2, roe: 22, debt_eq: 0.2 },
  ]);
  const [target, setTarget] = useState({ eps: 30, bvps: 180 });

  const avg = useMemo(() => ({
    pe: peers.reduce((s, p) => s + p.pe, 0) / peers.length,
    pb: peers.reduce((s, p) => s + p.pb, 0) / peers.length,
    roe: peers.reduce((s, p) => s + p.roe, 0) / peers.length,
  }), [peers]);

  const fairPE = Math.round(avg.pe * target.eps);
  const fairPB = Math.round(avg.pb * target.bvps);

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 space-y-3">
          <h4 className="font-semibold text-orange-800 dark:text-orange-300">🔍 Target Company</h4>
          <div>
            <label className="text-xs text-gray-500 block mb-1">EPS (₹)</label>
            <input type="number" value={target.eps} onChange={e => setTarget(p => ({ ...p, eps: +e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Book Value per Share (₹)</label>
            <input type="number" value={target.bvps} onChange={e => setTarget(p => ({ ...p, bvps: +e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <h4 className="font-semibold text-orange-800 dark:text-orange-300 pt-2">Peer Averages</h4>
          <div className="text-sm space-y-1">
            <div className="flex justify-between"><span className="text-gray-500">Avg P/E</span><span>{avg.pe.toFixed(1)}x</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Avg P/B</span><span>{avg.pb.toFixed(1)}x</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Avg ROE</span><span>{avg.roe.toFixed(1)}%</span></div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700">
            <h4 className="font-semibold mb-3">Fair Value Estimates</h4>
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-gray-500 text-xs block">P/E Based</span><span className="text-2xl font-bold text-orange-600">{fmt(fairPE)}</span></div>
              <div><span className="text-gray-500 text-xs block">P/B Based</span><span className="text-2xl font-bold text-indigo-600">{fmt(fairPB)}</span></div>
            </div>
          </div>
          <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 dark:bg-gray-700"><th className="px-3 py-2 text-left">Peer</th><th className="px-3 py-2">P/E</th><th className="px-3 py-2">P/B</th><th className="px-3 py-2">ROE</th><th className="px-3 py-2">D/E</th></tr></thead>
              <tbody>{peers.map(p => (
                <tr key={p.name} className="border-t dark:border-gray-700"><td className="px-3 py-2 font-medium">{p.name}</td><td className="px-3 py-2 text-center">{p.pe}x</td><td className="px-3 py-2 text-center">{p.pb}x</td><td className="px-3 py-2 text-center">{p.roe}%</td><td className="px-3 py-2 text-center">{p.debt_eq}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 5. PE Multiple ──
function PEMultiple() {
  const [eps, setEps] = useState(35);
  const [sector, setSector] = useState("IT");
  const sectors: Record<string, { low: number; mid: number; high: number }> = {
    IT: { low: 18, mid: 25, high: 35 },
    Banking: { low: 8, mid: 14, high: 22 },
    FMCG: { low: 30, mid: 42, high: 55 },
    Pharma: { low: 15, mid: 22, high: 30 },
    Auto: { low: 12, mid: 18, high: 28 },
  };

  const pe = sectors[sector];
  const data = [
    { label: "Bear", pe: pe.low, value: eps * pe.low },
    { label: "Base", pe: pe.mid, value: eps * pe.mid },
    { label: "Bull", pe: pe.high, value: eps * pe.high },
  ];

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl p-4 space-y-3">
          <h4 className="font-semibold text-teal-800 dark:text-teal-300">📈 P/E Multiple Inputs</h4>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Earnings Per Share (₹)</label>
            <input type="number" value={eps} step={1} onChange={e => setEps(+e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Sector</label>
            <select value={sector} onChange={e => setSector(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              {Object.keys(sectors).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700">
            <h4 className="font-semibold mb-3">Valuation Range</h4>
            <div className="grid grid-cols-3 gap-3 text-center">
              {data.map(d => (
                <div key={d.label} className="space-y-1">
                  <div className="text-xs text-gray-500">{d.label} ({d.pe}x)</div>
                  <div className={`text-xl font-bold ${d.label === "Bear" ? "text-red-500" : d.label === "Base" ? "text-yellow-600" : "text-green-600"}`}>{fmt(d.value)}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border dark:border-gray-700 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="label" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#14b8a6" radius={[4,4,0,0]} /></BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

const TABS = [
  { key: "graham", label: "Graham Formula" },
  { key: "ddm", label: "DDM" },
  { key: "fcf", label: "FCF Valuation" },
  { key: "peer", label: "Peer Comparison" },
  { key: "pe", label: "P/E Multiple" },
];

export default function StockValuation() {
  const [tab, setTab] = useState("graham");

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Stock & Equity Valuation Report", 14, 22);
    doc.setFontSize(10);
    doc.text(`Method: ${TABS.find(t => t.key === tab)?.label}`, 14, 32);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 14, 38);
    doc.save("stock-valuation-report.pdf");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">📈 Stock & Equity Valuation</h1>
              <p className="text-gray-500 mt-1">Graham formula, DDM, FCF, peer comparison, P/E multiples</p>
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
          {tab === "graham" && <GrahamFormula />}
          {tab === "ddm" && <DDMMethod />}
          {tab === "fcf" && <FCFValuation />}
          {tab === "peer" && <PeerComparison />}
          {tab === "pe" && <PEMultiple />}
        </motion.div>
      </div>
    </div>
  );
}
