import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import jsPDF from "jspdf";

const fmt = (n: number) => "₹" + Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
const fmtCr = (n: number) => n >= 10000000 ? "₹" + (n / 10000000).toFixed(2) + " Cr" : "₹" + (n / 100000).toFixed(2) + "L";

// ── 1. Brand Valuation ────────────────────────────────────────────────────────
function BrandValuation() {
  const [inp, setInp] = useState({ brandedRevenue: 500, brandContribution: 25, discountRate: 12, growthRate: 8 });
  const [strength, setStrength] = useState({ awareness: 70, loyalty: 65, quality: 75, associations: 60, leadership: 55, stability: 70, market: 65 });
  const set = (k: keyof typeof inp) => (e: React.ChangeEvent<HTMLInputElement>) => setInp(p => ({ ...p, [k]: +e.target.value }));
  const setStr = (k: keyof typeof strength) => (e: React.ChangeEvent<HTMLInputElement>) => setStrength(p => ({ ...p, [k]: +e.target.value }));

  const r = useMemo(() => {
    const avgStrength = Object.values(strength).reduce((s, v) => s + v, 0) / Object.values(strength).length;
    const brandStrengthScore = avgStrength / 100;
    const brandEarnings = inp.brandedRevenue * 10000000 * inp.brandContribution / 100;
    const brandMultiple = 5 + brandStrengthScore * 20;
    const brandValue = brandEarnings * brandMultiple / (inp.discountRate / 100 - inp.growthRate / 100);
    const radarData = Object.entries(strength).map(([k, v]) => ({ subject: k.charAt(0).toUpperCase() + k.slice(1), value: v }));
    return { avgStrength: avgStrength.toFixed(1), brandStrengthScore, brandEarnings, brandMultiple, brandValue, radarData };
  }, [inp, strength]);

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-3 gap-6">
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase">Financial Inputs</p>
          {[
            { label: "Branded Revenue (₹ Cr)", key: "brandedRevenue" as const, step: 10 },
            { label: "Brand Contribution (%)", key: "brandContribution" as const, step: 1 },
            { label: "Discount Rate (%)", key: "discountRate" as const, step: 0.5 },
            { label: "Growth Rate (%)", key: "growthRate" as const, step: 0.5 },
          ].map(({ label, key, step }) => (
            <div key={key}>
              <label className="text-xs text-gray-500 block mb-1">{label}</label>
              <input type="number" value={inp[key]} step={step} onChange={set(key)}
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          ))}
          <p className="text-xs font-semibold text-gray-500 uppercase mt-2">Brand Strength (0-100)</p>
          {Object.entries(strength).map(([k, v]) => (
            <div key={k}>
              <div className="flex justify-between">
                <label className="text-xs text-gray-500 capitalize">{k}</label>
                <span className="text-xs font-bold text-indigo-600">{v}</span>
              </div>
              <input type="range" min={0} max={100} value={v} onChange={setStr(k as keyof typeof strength)}
                className="w-full accent-indigo-600" />
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl p-5 text-white text-center">
            <p className="text-pink-100 text-sm">Brand Value</p>
            <p className="text-3xl font-extrabold my-2">{fmtCr(r.brandValue)}</p>
            <p className="text-pink-100 text-sm">Brand Strength: {r.avgStrength}/100</p>
          </div>
          {[
            { label: "Brand Earnings", value: fmtCr(r.brandEarnings), color: "text-blue-600" },
            { label: "Brand Multiple", value: r.brandMultiple.toFixed(1) + "x", color: "text-purple-600" },
            { label: "Brand Strength Score", value: (r.brandStrengthScore * 100).toFixed(1) + "%", color: "text-indigo-600" },
          ].map(c => (
            <div key={c.label} className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-300">{c.label}</span>
              <span className={`font-bold ${c.color}`}>{c.value}</span>
            </div>
          ))}
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">Brand Strength Radar</p>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={r.radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
              <Radar name="Score" dataKey="value" stroke="#ec4899" fill="#ec4899" fillOpacity={0.4} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── 2. Goodwill Valuation ─────────────────────────────────────────────────────
function GoodwillValuation() {
  const [inp, setInp] = useState({ avgProfit: 50, capitalEmployed: 200, normalReturn: 15, yearsPurchase: 4, capRate: 20 });
  const set = (k: keyof typeof inp) => (e: React.ChangeEvent<HTMLInputElement>) => setInp(p => ({ ...p, [k]: +e.target.value }));

  const r = useMemo(() => {
    const normalProfit = inp.capitalEmployed * inp.normalReturn / 100;
    const superProfit = Math.max(inp.avgProfit - normalProfit, 0);
    const method1 = superProfit * inp.yearsPurchase;
    const method2 = superProfit / (inp.capRate / 100);
    const method3 = inp.avgProfit / (inp.normalReturn / 100);
    const avgGoodwill = (method1 + method2 + method3) / 3;
    return { normalProfit, superProfit, method1, method2, method3, avgGoodwill };
  }, [inp]);

  const chartData = [
    { method: "Super Profit\n× Years Purchase", value: Math.round(r.method1) },
    { method: "Capitalisation\nof Super Profit", value: Math.round(r.method2) },
    { method: "Capitalisation\nof Avg Profit", value: Math.round(r.method3) },
  ];

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          {[
            { label: "Average Maintainable Profit (₹ Cr)", key: "avgProfit" as const, step: 5 },
            { label: "Capital Employed (₹ Cr)", key: "capitalEmployed" as const, step: 10 },
            { label: "Normal Return on Capital (%)", key: "normalReturn" as const, step: 0.5 },
            { label: "Years of Purchase (Method 1)", key: "yearsPurchase" as const, step: 1 },
            { label: "Capitalization Rate % (Method 2)", key: "capRate" as const, step: 1 },
          ].map(({ label, key, step }) => (
            <div key={key}>
              <label className="text-xs text-gray-500 block mb-1">{label}</label>
              <input type="number" value={inp[key]} step={step} onChange={set(key)}
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          ))}
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl space-y-1 text-xs">
            <p className="font-medium text-indigo-700 dark:text-indigo-300">📊 Workings:</p>
            <p>Normal Profit = ₹{r.normalProfit.toFixed(0)} Cr ({inp.capitalEmployed} × {inp.normalReturn}%)</p>
            <p>Super Profit = ₹{r.superProfit.toFixed(0)} Cr (Avg − Normal)</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-5 text-white text-center">
            <p className="text-indigo-200 text-sm">Average Goodwill Value</p>
            <p className="text-3xl font-extrabold my-2">{fmtCr(r.avgGoodwill * 10000000)}</p>
            <p className="text-indigo-200 text-sm">Average of 3 methods</p>
          </div>
          {[
            { label: "Method 1: Super Profit × Years", value: fmtCr(r.method1 * 10000000), color: "text-blue-600" },
            { label: "Method 2: Capitalisation of Super Profit", value: fmtCr(r.method2 * 10000000), color: "text-purple-600" },
            { label: "Method 3: Capitalisation of Avg Profit", value: fmtCr(r.method3 * 10000000), color: "text-green-600" },
          ].map(c => (
            <div key={c.label} className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-300">{c.label}</span>
              <span className={`font-bold ${c.color}`}>{c.value}</span>
            </div>
          ))}
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="method" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number) => `₹${v} Cr`} />
              <Bar dataKey="value" name="Goodwill (₹ Cr)" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── 3. Customer Base Valuation ─────────────────────────────────────────────────
function CustomerBaseValuation() {
  const [inp, setInp] = useState({ customers: 50000, avgRevenue: 12000, retentionRate: 85, cac: 5000, grossMargin: 60, discountRate: 14 });
  const set = (k: keyof typeof inp) => (e: React.ChangeEvent<HTMLInputElement>) => setInp(p => ({ ...p, [k]: +e.target.value }));

  const r = useMemo(() => {
    const monthlyChurn = (100 - inp.retentionRate) / 100 / 12;
    const avgLifespan = 1 / monthlyChurn / 12;
    const clv = (inp.avgRevenue * inp.grossMargin / 100 * avgLifespan) - inp.cac;
    const totalCustomerValue = clv * inp.customers;
    const annualRevenue = inp.customers * inp.avgRevenue;
    const pvCustomerBase = totalCustomerValue / (1 + inp.discountRate / 100);
    return { monthlyChurn: (monthlyChurn * 100).toFixed(2), avgLifespan: avgLifespan.toFixed(1), clv, totalCustomerValue, annualRevenue, pvCustomerBase };
  }, [inp]);

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          {[
            { label: "Number of Customers", key: "customers" as const, step: 1000 },
            { label: "Average Revenue per Customer per Year (₹)", key: "avgRevenue" as const, step: 1000 },
            { label: "Annual Retention Rate (%)", key: "retentionRate" as const, step: 1 },
            { label: "Customer Acquisition Cost (₹)", key: "cac" as const, step: 500 },
            { label: "Gross Margin (%)", key: "grossMargin" as const, step: 1 },
            { label: "Discount Rate (%)", key: "discountRate" as const, step: 0.5 },
          ].map(({ label, key, step }) => (
            <div key={key}>
              <label className="text-xs text-gray-500 block mb-1">{label}</label>
              <input type="number" value={inp[key]} step={step} onChange={set(key)}
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl p-5 text-white text-center">
            <p className="text-teal-100 text-sm">Total Customer Base Value</p>
            <p className="text-3xl font-extrabold my-2">{fmtCr(r.pvCustomerBase)}</p>
            <p className="text-teal-100 text-sm">{inp.customers.toLocaleString()} customers</p>
          </div>
          {[
            { label: "Monthly Churn Rate", value: r.monthlyChurn + "%", color: "text-red-500" },
            { label: "Avg Customer Lifespan", value: r.avgLifespan + " years", color: "text-blue-600" },
            { label: "Customer Lifetime Value (CLV)", value: fmt(r.clv), color: "text-green-600" },
            { label: "Total CLV (all customers)", value: fmtCr(r.totalCustomerValue), color: "text-indigo-600" },
            { label: "Annual Revenue from Base", value: fmtCr(r.annualRevenue), color: "text-purple-600" },
          ].map(c => (
            <div key={c.label} className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-300">{c.label}</span>
              <span className={`font-bold ${c.color}`}>{c.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 4. Software / Technology Valuation ────────────────────────────────────────
function SoftwareValuation() {
  const [inp, setInp] = useState({ devCost: 5000000, annualRevenue: 20000000, royaltyRate: 8, remainingLife: 8, discountRate: 15, growthRate: 10 });
  const set = (k: keyof typeof inp) => (e: React.ChangeEvent<HTMLInputElement>) => setInp(p => ({ ...p, [k]: +e.target.value }));

  const r = useMemo(() => {
    const royaltyIncome = inp.annualRevenue * inp.royaltyRate / 100;
    const pvFactor = (1 - Math.pow(1 + inp.growthRate / 100, inp.remainingLife) / Math.pow(1 + inp.discountRate / 100, inp.remainingLife)) / ((inp.discountRate - inp.growthRate) / 100);
    const reliefFromRoyalty = royaltyIncome * pvFactor;
    const costApproach = inp.devCost * (1 + inp.growthRate / 100);
    const incomeApproach = inp.annualRevenue * pvFactor * 0.3;
    const avgValue = (reliefFromRoyalty + costApproach + incomeApproach) / 3;
    const rows = Array.from({ length: inp.remainingLife }, (_, i) => {
      const rev = inp.annualRevenue * Math.pow(1 + inp.growthRate / 100, i + 1);
      const royalty = rev * inp.royaltyRate / 100;
      const pv = royalty / Math.pow(1 + inp.discountRate / 100, i + 1);
      return { year: i + 1, Revenue: Math.round(rev / 100000), Royalty: Math.round(royalty / 100000), PV: Math.round(pv / 100000) };
    });
    return { reliefFromRoyalty, costApproach, incomeApproach, avgValue, rows };
  }, [inp]);

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          {[
            { label: "Development Cost (₹)", key: "devCost" as const, step: 100000 },
            { label: "Annual Revenue Attributed (₹)", key: "annualRevenue" as const, step: 500000 },
            { label: "Royalty Rate (%)", key: "royaltyRate" as const, step: 0.5 },
            { label: "Remaining Useful Life (years)", key: "remainingLife" as const, step: 1 },
            { label: "Discount Rate (%)", key: "discountRate" as const, step: 0.5 },
            { label: "Revenue Growth Rate (%)", key: "growthRate" as const, step: 0.5 },
          ].map(({ label, key, step }) => (
            <div key={key}>
              <label className="text-xs text-gray-500 block mb-1">{label}</label>
              <input type="number" value={inp[key]} step={step} onChange={set(key)}
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl p-5 text-white text-center">
            <p className="text-violet-100 text-sm">Average Software Value</p>
            <p className="text-3xl font-extrabold my-2">{fmtCr(r.avgValue)}</p>
            <p className="text-violet-100 text-sm">Average of 3 methods</p>
          </div>
          {[
            { label: "Relief from Royalty Method", value: fmtCr(r.reliefFromRoyalty), color: "text-blue-600" },
            { label: "Cost Approach (Replacement)", value: fmtCr(r.costApproach), color: "text-purple-600" },
            { label: "Income Approach (30% attribution)", value: fmtCr(r.incomeApproach), color: "text-green-600" },
          ].map(c => (
            <div key={c.label} className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-300">{c.label}</span>
              <span className={`font-bold ${c.color}`}>{c.value}</span>
            </div>
          ))}
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={r.rows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => v + "L"} />
              <Tooltip formatter={(v: number) => `₹${v}L`} />
              <Bar dataKey="Revenue" fill="#8b5cf6" name="Revenue" radius={[4, 4, 0, 0]} />
              <Bar dataKey="PV" fill="#6366f1" name="PV of Royalty" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── 5. Franchise Value ────────────────────────────────────────────────────────
function FranchiseValue() {
  const [inp, setInp] = useState({ franchiseFee: 2000000, royaltyPct: 5, franchiseTerm: 10, annualSales: 30000000, salesGrowth: 8, discountRate: 14 });
  const set = (k: keyof typeof inp) => (e: React.ChangeEvent<HTMLInputElement>) => setInp(p => ({ ...p, [k]: +e.target.value }));

  const r = useMemo(() => {
    const rows = Array.from({ length: inp.franchiseTerm }, (_, i) => {
      const sales = inp.annualSales * Math.pow(1 + inp.salesGrowth / 100, i + 1);
      const royalty = sales * inp.royaltyPct / 100;
      const pv = royalty / Math.pow(1 + inp.discountRate / 100, i + 1);
      return { year: i + 1, Sales: Math.round(sales / 100000), Royalty: Math.round(royalty / 100000), PV: Math.round(pv / 100000) };
    });
    const pvRoyalties = rows.reduce((s, r) => s + r.PV * 100000, 0);
    const franchisePremium = pvRoyalties - inp.franchiseFee;
    const totalFranchiseValue = pvRoyalties + inp.franchiseFee;
    return { rows, pvRoyalties, franchisePremium, totalFranchiseValue };
  }, [inp]);

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          {[
            { label: "Franchise Fee Paid (₹)", key: "franchiseFee" as const, step: 100000 },
            { label: "Royalty Rate on Sales (%)", key: "royaltyPct" as const, step: 0.5 },
            { label: "Remaining Franchise Term (years)", key: "franchiseTerm" as const, step: 1 },
            { label: "Current Annual Sales (₹)", key: "annualSales" as const, step: 1000000 },
            { label: "Sales Growth Rate (% p.a.)", key: "salesGrowth" as const, step: 0.5 },
            { label: "Discount Rate (%)", key: "discountRate" as const, step: 0.5 },
          ].map(({ label, key, step }) => (
            <div key={key}>
              <label className="text-xs text-gray-500 block mb-1">{label}</label>
              <input type="number" value={inp[key]} step={step} onChange={set(key)}
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-5 text-white text-center">
            <p className="text-orange-100 text-sm">Franchise Value</p>
            <p className="text-3xl font-extrabold my-2">{fmtCr(r.totalFranchiseValue)}</p>
          </div>
          {[
            { label: "PV of Future Royalties", value: fmtCr(r.pvRoyalties), color: "text-blue-600" },
            { label: "Franchise Fee Paid", value: fmt(inp.franchiseFee), color: "text-gray-600 dark:text-gray-300" },
            { label: "Franchise Premium Value", value: fmtCr(r.franchisePremium), color: r.franchisePremium > 0 ? "text-green-600" : "text-red-500" },
          ].map(c => (
            <div key={c.label} className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-300">{c.label}</span>
              <span className={`font-bold ${c.color}`}>{c.value}</span>
            </div>
          ))}
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={r.rows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => v + "L"} />
              <Tooltip formatter={(v: number) => `₹${v}L`} />
              <Bar dataKey="Royalty" fill="#f97316" name="Royalty (₹L)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="PV" fill="#6366f1" name="PV (₹L)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
const TABS = [
  { key: "brand",    label: "🏪 Brand Value" },
  { key: "goodwill", label: "✨ Goodwill" },
  { key: "customer", label: "👥 Customer Base" },
  { key: "software", label: "💻 Software/Tech" },
  { key: "franchise",label: "🏬 Franchise" },
];

export default function IntangibleValuation() {
  const [tab, setTab] = useState("brand");
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🏪 Brand & Intangible Asset Valuation</h1>
            <p className="text-gray-500 text-sm mt-1">Brand, Goodwill, Customer Base, Software, Franchise Value</p>
          </div>
          <button onClick={() => { const d = new jsPDF(); d.text("Intangible Asset Valuation Report", 20, 20); d.text(`Date: ${new Date().toLocaleDateString("en-IN")}`, 20, 35); d.save("intangible-valuation.pdf"); }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">
            📄 Export PDF
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
                ${tab === t.key ? "bg-indigo-600 text-white shadow" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border dark:border-gray-700 hover:bg-gray-50"}`}>
              {t.label}
            </button>
          ))}
        </div>
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          {tab === "brand"     && <BrandValuation />}
          {tab === "goodwill"  && <GoodwillValuation />}
          {tab === "customer"  && <CustomerBaseValuation />}
          {tab === "software"  && <SoftwareValuation />}
          {tab === "franchise" && <FranchiseValue />}
        </motion.div>
      </div>
    </div>
  );
}
