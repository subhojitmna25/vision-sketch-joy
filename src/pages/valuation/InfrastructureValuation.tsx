import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import jsPDF from "jspdf";

const fmt = (n: number) => "₹" + Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
const fmtCr = (n: number) => n >= 10000000 ? "₹" + (n / 10000000).toFixed(2) + " Cr" : "₹" + (n / 100000).toFixed(2) + " L";

// ── 1. NPV/IRR Project Valuation ──
function NPVIRRMethod() {
  const [initInvest, setInitInvest] = useState(500000000);
  const [annualCF, setAnnualCF] = useState(80000000);
  const [cfGrowth, setCfGrowth] = useState(5);
  const [discount, setDiscount] = useState(12);
  const [projectLife, setProjectLife] = useState(20);

  const result = useMemo(() => {
    let npv = -initInvest;
    let cf = annualCF;
    const flows = [{ year: 0, cf: -initInvest / 10000000, cumulative: -initInvest / 10000000 }];
    let cumulative = -initInvest;
    let paybackYear = 0;
    const cashFlows = [-initInvest];

    for (let y = 1; y <= projectLife; y++) {
      cf = y === 1 ? annualCF : cf * (1 + cfGrowth / 100);
      const pv = cf / Math.pow(1 + discount / 100, y);
      npv += pv;
      cumulative += cf;
      cashFlows.push(cf);
      if (cumulative >= 0 && paybackYear === 0) paybackYear = y;
      flows.push({ year: y, cf: Math.round(cf / 10000000), cumulative: Math.round(cumulative / 10000000) });
    }

    // Simple IRR approximation
    let irr = 0;
    for (let r = 0; r <= 100; r += 0.5) {
      let testNPV = -initInvest;
      let testCF = annualCF;
      for (let y = 1; y <= projectLife; y++) {
        testCF = y === 1 ? annualCF : testCF * (1 + cfGrowth / 100);
        testNPV += testCF / Math.pow(1 + r / 100, y);
      }
      if (testNPV <= 0) { irr = r - 0.5; break; }
      irr = r;
    }

    return { npv, irr, paybackYear, flows, profitabilityIndex: (npv + initInvest) / initInvest };
  }, [initInvest, annualCF, cfGrowth, discount, projectLife]);

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 space-y-3">
          <h4 className="font-semibold text-yellow-800 dark:text-yellow-300">🏗️ Project Inputs</h4>
          {[
            { label: "Initial Investment (₹)", val: initInvest, set: setInitInvest, step: 10000000 },
            { label: "Year 1 Cash Flow (₹)", val: annualCF, set: setAnnualCF, step: 5000000 },
            { label: "CF Growth Rate (%)", val: cfGrowth, set: setCfGrowth, step: 0.5 },
            { label: "Discount Rate (%)", val: discount, set: setDiscount, step: 0.5 },
            { label: "Project Life (years)", val: projectLife, set: setProjectLife, step: 1 },
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
            <h4 className="font-semibold mb-3">Project Metrics</h4>
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-gray-500 text-xs block">NPV</span><span className={`text-xl font-bold ${result.npv >= 0 ? "text-green-600" : "text-red-500"}`}>{fmtCr(result.npv)}</span></div>
              <div><span className="text-gray-500 text-xs block">IRR</span><span className="text-xl font-bold text-blue-600">{result.irr.toFixed(1)}%</span></div>
              <div><span className="text-gray-500 text-xs block">Payback Period</span><span className="text-xl font-bold">{result.paybackYear} yrs</span></div>
              <div><span className="text-gray-500 text-xs block">Profitability Index</span><span className="text-xl font-bold">{result.profitabilityIndex.toFixed(2)}x</span></div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border dark:border-gray-700 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={result.flows.slice(0, 15)}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="year" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Line type="monotone" dataKey="cumulative" stroke="#eab308" strokeWidth={2} name="Cumulative (₹Cr)" /><Line type="monotone" dataKey="cf" stroke="#3b82f6" strokeWidth={2} name="Cash Flow (₹Cr)" /></LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 2. Toll Road Valuation ──
function TollRoadValuation() {
  const [dailyTraffic, setDailyTraffic] = useState(15000);
  const [avgToll, setAvgToll] = useState(120);
  const [trafficGrowth, setTrafficGrowth] = useState(5);
  const [opex, setOpex] = useState(30);
  const [concession, setConcession] = useState(25);
  const [discount, setDiscount] = useState(10);

  const result = useMemo(() => {
    let npv = 0;
    let traffic = dailyTraffic;
    const data = [];
    for (let y = 1; y <= concession; y++) {
      traffic = y === 1 ? dailyTraffic : traffic * (1 + trafficGrowth / 100);
      const revenue = traffic * 365 * avgToll;
      const expense = revenue * opex / 100;
      const netCF = revenue - expense;
      const pv = netCF / Math.pow(1 + discount / 100, y);
      npv += pv;
      if (y <= 15) data.push({ year: `Y${y}`, revenue: Math.round(revenue / 10000000), net: Math.round(netCF / 10000000) });
    }
    return { npv, data };
  }, [dailyTraffic, avgToll, trafficGrowth, opex, concession, discount]);

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 space-y-3">
          <h4 className="font-semibold text-blue-800 dark:text-blue-300">🛣️ Toll Road Inputs</h4>
          {[
            { label: "Daily Traffic (vehicles)", val: dailyTraffic, set: setDailyTraffic, step: 500 },
            { label: "Avg Toll per Vehicle (₹)", val: avgToll, set: setAvgToll, step: 10 },
            { label: "Traffic Growth (%/yr)", val: trafficGrowth, set: setTrafficGrowth, step: 0.5 },
            { label: "Opex as % of Revenue", val: opex, set: setOpex, step: 5 },
            { label: "Concession Period (years)", val: concession, set: setConcession, step: 1 },
            { label: "Discount Rate (%)", val: discount, set: setDiscount, step: 0.5 },
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
            <h4 className="font-semibold mb-2">Concession Value (NPV)</h4>
            <div className="text-3xl font-bold text-blue-600">{fmtCr(result.npv)}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border dark:border-gray-700 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={result.data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="year" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="revenue" fill="#3b82f6" radius={[4,4,0,0]} name="Revenue (₹Cr)" /><Bar dataKey="net" fill="#22c55e" radius={[4,4,0,0]} name="Net CF (₹Cr)" /></BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 3. Solar/Power Plant ──
function SolarPlantValuation() {
  const [capacity, setCapacity] = useState(50);
  const [cuf, setCuf] = useState(22);
  const [tariff, setTariff] = useState(3.5);
  const [tariffEsc, setTariffEsc] = useState(2);
  const [opexPerMW, setOpexPerMW] = useState(800000);
  const [ppaYears, setPpaYears] = useState(25);
  const [discount, setDiscount] = useState(10);

  const result = useMemo(() => {
    let npv = 0;
    const data = [];
    for (let y = 1; y <= ppaYears; y++) {
      const t = tariff * Math.pow(1 + tariffEsc / 100, y - 1);
      const generation = capacity * 1000 * (cuf / 100) * 8760; // kWh
      const revenue = generation * t;
      const expense = opexPerMW * capacity * Math.pow(1.03, y - 1);
      const net = revenue - expense;
      const pv = net / Math.pow(1 + discount / 100, y);
      npv += pv;
      if (y <= 15) data.push({ year: `Y${y}`, revenue: Math.round(revenue / 10000000), net: Math.round(net / 10000000) });
    }
    const annualGen = capacity * 1000 * (cuf / 100) * 8760;
    return { npv, annualGenGWh: (annualGen / 1000000).toFixed(1), data };
  }, [capacity, cuf, tariff, tariffEsc, opexPerMW, ppaYears, discount]);

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 space-y-3">
          <h4 className="font-semibold text-amber-800 dark:text-amber-300">☀️ Solar Plant Inputs</h4>
          {[
            { label: "Capacity (MW)", val: capacity, set: setCapacity, step: 5 },
            { label: "CUF (%)", val: cuf, set: setCuf, step: 1 },
            { label: "Tariff (₹/kWh)", val: tariff, set: setTariff, step: 0.1 },
            { label: "Tariff Escalation (%/yr)", val: tariffEsc, set: setTariffEsc, step: 0.5 },
            { label: "Opex per MW (₹/yr)", val: opexPerMW, set: setOpexPerMW, step: 50000 },
            { label: "PPA Period (years)", val: ppaYears, set: setPpaYears, step: 1 },
            { label: "Discount Rate (%)", val: discount, set: setDiscount, step: 0.5 },
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
            <h4 className="font-semibold mb-2">Plant Value (NPV)</h4>
            <div className="text-3xl font-bold text-amber-600">{fmtCr(result.npv)}</div>
            <div className="text-sm text-gray-500 mt-1">Annual Generation: {result.annualGenGWh} GWh</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border dark:border-gray-700 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={result.data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="year" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="revenue" fill="#f59e0b" radius={[4,4,0,0]} name="Revenue (₹Cr)" /><Bar dataKey="net" fill="#10b981" radius={[4,4,0,0]} name="Net (₹Cr)" /></BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

const TABS = [
  { key: "npvirr", label: "NPV / IRR" },
  { key: "toll", label: "Toll Road" },
  { key: "solar", label: "Solar / Power" },
];

export default function InfrastructureValuation() {
  const [tab, setTab] = useState("npvirr");

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Infrastructure Valuation Report", 14, 22);
    doc.setFontSize(10);
    doc.text(`Method: ${TABS.find(t => t.key === tab)?.label}`, 14, 32);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 14, 38);
    doc.save("infrastructure-valuation-report.pdf");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">🏗️ Infrastructure Valuation</h1>
              <p className="text-gray-500 mt-1">NPV/IRR, toll roads, power plants, solar projects</p>
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
          {tab === "npvirr" && <NPVIRRMethod />}
          {tab === "toll" && <TollRoadValuation />}
          {tab === "solar" && <SolarPlantValuation />}
        </motion.div>
      </div>
    </div>
  );
}
