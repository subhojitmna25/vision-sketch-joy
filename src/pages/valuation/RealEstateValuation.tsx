import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import jsPDF from "jspdf";

const fmt = (n: number) => "₹" + Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
const fmtL = (n: number) => "₹" + (n / 100000).toFixed(2) + "L";
const fmtCr = (n: number) => n >= 10000000 ? "₹" + (n / 10000000).toFixed(2) + " Cr" : fmtL(n);

// ── 1. Sales Comparison ───────────────────────────────────────────────────────
function SalesComparison() {
  const [subject, setSubject] = useState({ area: 1200, age: 5, grade: "B", floor: 3 });
  const [comps, setComps] = useState([
    { address: "Comp 1 - Park Street", price: 9500000, area: 1100, age: 3, grade: "A", floor: 2 },
    { address: "Comp 2 - MG Road",     price: 7800000, area: 1300, age: 8, grade: "B", floor: 5 },
    { address: "Comp 3 - Salt Lake",   price: 8200000, area: 1150, age: 5, grade: "B", floor: 1 },
  ]);

  const result = useMemo(() => {
    const gradeAdj: Record<string, number> = { A: 1.1, B: 1.0, C: 0.9 };
    const adjusted = comps.map((c) => {
      const basePSF = c.price / c.area;
      const ageDiff = (c.age - subject.age) * 0.005;
      const gradeDiff = (gradeAdj[subject.grade] - gradeAdj[c.grade]);
      const floorDiff = (subject.floor - c.floor) * 0.005;
      const adjPSF = basePSF * (1 + gradeDiff - ageDiff + floorDiff);
      return { ...c, basePSF: Math.round(basePSF), adjPSF: Math.round(adjPSF), adjValue: Math.round(adjPSF * subject.area) };
    });
    const avgPSF = adjusted.reduce((s, c) => s + c.adjPSF, 0) / adjusted.length;
    return { adjusted, avgPSF: Math.round(avgPSF), finalValue: Math.round(avgPSF * subject.area) };
  }, [subject, comps]);

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Subject Property */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 space-y-3">
          <h4 className="font-semibold text-indigo-800 dark:text-indigo-300">📍 Subject Property</h4>
          {[
            { label: "Built-up Area (sqft)", key: "area", step: 50 },
            { label: "Age of Building (years)", key: "age", step: 1 },
            { label: "Floor Number", key: "floor", step: 1 },
          ].map(({ label, key, step }) => (
            <div key={key}>
              <label className="text-xs text-gray-500 block mb-1">{label}</label>
              <input type="number" value={(subject as any)[key]} step={step}
                onChange={e => setSubject(p => ({ ...p, [key]: +e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          ))}
          <div>
            <label className="text-xs text-gray-500 block mb-1">Location Grade</label>
            <select value={subject.grade} onChange={e => setSubject(p => ({ ...p, grade: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              <option value="A">A — Prime</option>
              <option value="B">B — Good</option>
              <option value="C">C — Average</option>
            </select>
          </div>
        </div>

        {/* Result */}
        <div className="space-y-3">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-5 text-center">
            <p className="text-sm text-gray-500">Estimated Market Value</p>
            <p className="text-4xl font-extrabold text-green-700 dark:text-green-400 my-2">{fmtCr(result.finalValue)}</p>
            <p className="text-sm text-gray-500">@ {fmt(result.avgPSF)} per sqft</p>
          </div>
          <div className="space-y-2">
            {result.adjusted.map((c, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm">
                <span className="text-gray-600 dark:text-gray-300 truncate flex-1">{c.address}</span>
                <div className="text-right ml-3">
                  <p className="font-semibold text-gray-800 dark:text-white">{fmtCr(c.adjValue)}</p>
                  <p className="text-xs text-gray-400">{fmt(c.adjPSF)}/sqft</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comparables Editor */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>{["Comparable", "Sale Price (₹)", "Area (sqft)", "Age (yrs)", "Grade"].map(h =>
              <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500">{h}</th>)}
            </tr>
          </thead>
          <tbody>{comps.map((c, i) => (
            <tr key={i} className="border-b dark:border-gray-700">
              <td className="px-3 py-2">
                <input value={c.address} onChange={e => setComps(p => p.map((x, j) => j === i ? { ...x, address: e.target.value } : x))}
                  className="w-full border rounded px-2 py-1 text-xs dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </td>
              {(["price", "area", "age"] as const).map(k => (
                <td key={k} className="px-3 py-2">
                  <input type="number" value={c[k]} onChange={e => setComps(p => p.map((x, j) => j === i ? { ...x, [k]: +e.target.value } : x))}
                    className="w-24 border rounded px-2 py-1 text-xs dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </td>
              ))}
              <td className="px-3 py-2">
                <select value={c.grade} onChange={e => setComps(p => p.map((x, j) => j === i ? { ...x, grade: e.target.value } : x))}
                  className="border rounded px-2 py-1 text-xs dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <option>A</option><option>B</option><option>C</option>
                </select>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

// ── 2. Income Approach ────────────────────────────────────────────────────────
function IncomeApproach() {
  const [inp, setInp] = useState({ monthlyRent: 25000, vacancy: 5, opex: 20, capRate: 5, growth: 5 });
  const set = (k: keyof typeof inp) => (e: React.ChangeEvent<HTMLInputElement>) => setInp(p => ({ ...p, [k]: +e.target.value }));

  const r = useMemo(() => {
    const gri = inp.monthlyRent * 12;
    const vacancy = gri * inp.vacancy / 100;
    const egi = gri - vacancy;
    const opex = egi * inp.opex / 100;
    const noi = egi - opex;
    const value = noi / (inp.capRate / 100);
    const projection = Array.from({ length: 5 }, (_, i) => {
      const yr = i + 1;
      const rent = inp.monthlyRent * 12 * Math.pow(1 + inp.growth / 100, yr);
      const noiYr = rent * (1 - inp.vacancy / 100) * (1 - inp.opex / 100);
      return { year: `Y${yr}`, NOI: Math.round(noiYr), Rent: Math.round(rent) };
    });
    return { gri, vacancy, egi, opex, noi, value, projection };
  }, [inp]);

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          {[
            { label: "Monthly Rent (₹)", key: "monthlyRent" as const, step: 1000 },
            { label: "Vacancy Rate (%)", key: "vacancy" as const, step: 0.5 },
            { label: "Operating Expenses (% of EGI)", key: "opex" as const, step: 1 },
            { label: "Cap Rate (%)", key: "capRate" as const, step: 0.25 },
            { label: "Rent Growth Rate (% p.a.)", key: "growth" as const, step: 0.5 },
          ].map(({ label, key, step }) => (
            <div key={key}>
              <label className="text-xs text-gray-500 block mb-1">{label}</label>
              <input type="number" value={inp[key]} step={step} onChange={set(key)}
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-5 text-center">
            <p className="text-sm text-gray-500">Property Value (Income Approach)</p>
            <p className="text-3xl font-extrabold text-green-700 dark:text-green-400 my-2">{fmtCr(r.value)}</p>
          </div>
          {[
            { label: "Gross Rental Income", value: fmtCr(r.gri) },
            { label: "Less: Vacancy Loss", value: `-${fmtCr(r.vacancy)}` },
            { label: "Effective Gross Income", value: fmtCr(r.egi) },
            { label: "Less: Operating Expenses", value: `-${fmtCr(r.opex)}` },
            { label: "Net Operating Income (NOI)", value: fmtCr(r.noi) },
          ].map(c => (
            <div key={c.label} className="flex justify-between p-2.5 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm">
              <span className="text-gray-600 dark:text-gray-300">{c.label}</span>
              <span className="font-semibold text-gray-800 dark:text-white">{c.value}</span>
            </div>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={r.projection}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={v => (v / 100000).toFixed(0) + "L"} />
          <Tooltip formatter={(v: number) => fmtCr(v)} />
          <Bar dataKey="NOI" fill="#22c55e" name="NOI" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Rent" fill="#6366f1" name="Gross Rent" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── 3. Cost Approach ──────────────────────────────────────────────────────────
function CostApproach() {
  const [inp, setInp] = useState({ landValue: 3000000, constructionCost: 2500, area: 1200, age: 8, lifespan: 60, salvage: 10 });
  const set = (k: keyof typeof inp) => (e: React.ChangeEvent<HTMLInputElement>) => setInp(p => ({ ...p, [k]: +e.target.value }));

  const r = useMemo(() => {
    const rcn = inp.constructionCost * inp.area;
    const depRate = (1 - inp.salvage / 100) / inp.lifespan;
    const depreciation = rcn * depRate * inp.age;
    const depreciatedValue = Math.max(rcn - depreciation, rcn * inp.salvage / 100);
    const totalValue = inp.landValue + depreciatedValue;
    return { rcn, depreciation, depreciatedValue, totalValue };
  }, [inp]);

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          {[
            { label: "Land Value (₹)", key: "landValue" as const, step: 100000 },
            { label: "Construction Cost (₹/sqft)", key: "constructionCost" as const, step: 100 },
            { label: "Built-up Area (sqft)", key: "area" as const, step: 50 },
            { label: "Age of Building (years)", key: "age" as const, step: 1 },
            { label: "Total Life of Building (years)", key: "lifespan" as const, step: 5 },
            { label: "Salvage Value (%)", key: "salvage" as const, step: 1 },
          ].map(({ label, key, step }) => (
            <div key={key}>
              <label className="text-xs text-gray-500 block mb-1">{label}</label>
              <input type="number" value={inp[key]} step={step} onChange={set(key)}
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-5 text-center">
            <p className="text-sm text-gray-500">Total Property Value</p>
            <p className="text-3xl font-extrabold text-purple-700 dark:text-purple-400 my-2">{fmtCr(r.totalValue)}</p>
          </div>
          {[
            { label: "Land Value", value: fmtCr(inp.landValue), color: "text-blue-600" },
            { label: "Replacement Cost New (RCN)", value: fmtCr(r.rcn), color: "text-gray-700 dark:text-gray-300" },
            { label: "Less: Depreciation", value: `-${fmtCr(r.depreciation)}`, color: "text-red-500" },
            { label: "Depreciated Structure Value", value: fmtCr(r.depreciatedValue), color: "text-green-600" },
            { label: "Land + Depreciated Value", value: fmtCr(r.totalValue), color: "text-purple-600" },
          ].map(c => (
            <div key={c.label} className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-300">{c.label}</span>
              <span className={`font-semibold ${c.color}`}>{c.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 4. Ready Reckoner ─────────────────────────────────────────────────────────
function ReadyReckoner() {
  const [inp, setInp] = useState({ state: "West Bengal", city: "Kolkata", propType: "Residential Flat", area: 1000, rrRate: 6500 });
  const set = (k: keyof typeof inp) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setInp(p => ({ ...p, [k]: k === "area" || k === "rrRate" ? +e.target.value : e.target.value }));

  const STAMP: Record<string, { male: number; female: number; joint: number }> = {
    "West Bengal": { male: 7, female: 6, joint: 6.5 },
    "Maharashtra": { male: 6, female: 5, joint: 5.5 },
    "Karnataka":   { male: 5.6, female: 5.6, joint: 5.6 },
    "Delhi":       { male: 6, female: 4, joint: 5 },
    "Tamil Nadu":  { male: 7, female: 7, joint: 7 },
    "Gujarat":     { male: 4.9, female: 4.9, joint: 4.9 },
    "Rajasthan":   { male: 6, female: 5, joint: 5.5 },
    "UP":          { male: 7, female: 7, joint: 7 },
  };

  const r = useMemo(() => {
    const rrValue = inp.area * inp.rrRate;
    const marketValue = rrValue * 1.15;
    const s = STAMP[inp.state] || { male: 6, female: 5, joint: 5.5 };
    const stampMale = rrValue * s.male / 100;
    const stampFemale = rrValue * s.female / 100;
    const regFee = Math.min(rrValue * 0.01, 30000);
    return { rrValue, marketValue, stampMale, stampFemale, regFee, rates: s };
  }, [inp]);

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">State</label>
            <select value={inp.state} onChange={set("state")}
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              {Object.keys(STAMP).map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Property Type</label>
            <select value={inp.propType} onChange={set("propType")}
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              {["Residential Flat", "Independent House/Villa", "Commercial Office", "Shop/Retail", "Plot/Land"].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          {[
            { label: "Area (sqft)", key: "area" as const, step: 50 },
            { label: "Ready Reckoner Rate (₹/sqft)", key: "rrRate" as const, step: 100 },
          ].map(({ label, key, step }) => (
            <div key={key}>
              <label className="text-xs text-gray-500 block mb-1">{label}</label>
              <input type="number" value={inp[key]} step={step} onChange={set(key)}
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Ready Reckoner Value</p>
            <p className="text-2xl font-extrabold text-blue-700 dark:text-blue-400">{fmtCr(r.rrValue)}</p>
            <p className="text-xs text-gray-400 mt-1">Estimated Market Value: {fmtCr(r.marketValue)}</p>
          </div>
          <div className="space-y-2">
            {[
              { label: `Stamp Duty (Male Buyer) @ ${r.rates.male}%`, value: fmtCr(r.stampMale), color: "text-orange-600" },
              { label: `Stamp Duty (Female Buyer) @ ${r.rates.female}%`, value: fmtCr(r.stampFemale), color: "text-green-600" },
              { label: "Registration Fee (1%, max ₹30,000)", value: fmt(r.regFee), color: "text-purple-600" },
              { label: "Total Cost (Male)", value: fmtCr(r.rrValue + r.stampMale + r.regFee), color: "text-red-600" },
            ].map(c => (
              <div key={c.label} className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-300">{c.label}</span>
                <span className={`font-semibold ${c.color}`}>{c.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 5. Rental Yield ───────────────────────────────────────────────────────────
function RentalYield() {
  const [inp, setInp] = useState({ propPrice: 8000000, monthlyRent: 25000, annualMaint: 50000, propTax: 10000 });
  const set = (k: keyof typeof inp) => (e: React.ChangeEvent<HTMLInputElement>) => setInp(p => ({ ...p, [k]: +e.target.value }));

  const r = useMemo(() => {
    const grossRent = inp.monthlyRent * 12;
    const netRent = grossRent - inp.annualMaint - inp.propTax;
    const grossYield = (grossRent / inp.propPrice) * 100;
    const netYield = (netRent / inp.propPrice) * 100;
    const priceToRent = inp.propPrice / grossRent;
    const breakeven = inp.propPrice / netRent;
    return { grossRent, netRent, grossYield, netYield, priceToRent, breakeven };
  }, [inp]);

  const compare = [
    { label: "Gross Rental Yield", value: r.grossYield.toFixed(2) + "%", benchmark: "4-6%", good: r.grossYield >= 4 },
    { label: "Net Rental Yield", value: r.netYield.toFixed(2) + "%", benchmark: "2-4%", good: r.netYield >= 2 },
    { label: "Bank FD Returns", value: "6.5-7%", benchmark: "—", good: false },
    { label: "Equity Market (avg)", value: "12-15%", benchmark: "—", good: false },
  ];

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          {[
            { label: "Property Price (₹)", key: "propPrice" as const, step: 100000 },
            { label: "Monthly Rent (₹)", key: "monthlyRent" as const, step: 500 },
            { label: "Annual Maintenance (₹)", key: "annualMaint" as const, step: 1000 },
            { label: "Annual Property Tax (₹)", key: "propTax" as const, step: 1000 },
          ].map(({ label, key, step }) => (
            <div key={key}>
              <label className="text-xs text-gray-500 block mb-1">{label}</label>
              <input type="number" value={inp[key]} step={step} onChange={set(key)}
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500">Gross Yield</p>
              <p className="text-2xl font-extrabold text-green-700">{r.grossYield.toFixed(2)}%</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500">Net Yield</p>
              <p className="text-2xl font-extrabold text-blue-700">{r.netYield.toFixed(2)}%</p>
            </div>
          </div>
          {[
            { label: "Annual Gross Rent", value: fmtCr(r.grossRent) },
            { label: "Annual Net Rent", value: fmtCr(r.netRent) },
            { label: "Price-to-Rent Ratio", value: r.priceToRent.toFixed(1) + "x" },
            { label: "Breakeven (years)", value: r.breakeven.toFixed(1) + " years" },
          ].map(c => (
            <div key={c.label} className="flex justify-between p-2.5 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm">
              <span className="text-gray-600 dark:text-gray-300">{c.label}</span>
              <span className="font-semibold text-gray-800 dark:text-white">{c.value}</span>
            </div>
          ))}
          <div className="space-y-2 pt-1">
            <p className="text-xs font-semibold text-gray-500 uppercase">vs Other Investments</p>
            {compare.map(c => (
              <div key={c.label} className="flex justify-between items-center p-2.5 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-300">{c.label}</span>
                <span className={`text-sm font-bold ${c.good ? "text-green-600" : "text-gray-600 dark:text-gray-300"}`}>{c.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PDF Export ────────────────────────────────────────────────────────────────
function exportPDF(tab: string, value: string) {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text("Real Estate Valuation Report", 20, 20);
  doc.setFontSize(12);
  doc.text(`Method: ${tab}`, 20, 35);
  doc.text(`Valuation Date: ${new Date().toLocaleDateString("en-IN")}`, 20, 45);
  doc.text(`Estimated Value: ${value}`, 20, 55);
  doc.setFontSize(10);
  doc.text("This report is generated by CA Financial Assist.", 20, 80);
  doc.text("For professional use only. Verify with a registered valuer.", 20, 90);
  doc.save("real-estate-valuation.pdf");
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const TABS = [
  { key: "sales",   label: "🏘️ Sales Comparison" },
  { key: "income",  label: "💰 Income Approach" },
  { key: "cost",    label: "🏗️ Cost Approach" },
  { key: "rr",      label: "📋 Ready Reckoner" },
  { key: "yield",   label: "📈 Rental Yield" },
];

export default function RealEstateValuation() {
  const [tab, setTab] = useState("sales");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🏠 Real Estate Valuation</h1>
            <p className="text-gray-500 text-sm mt-1">5 professional valuation methods as per Indian standards</p>
          </div>
          <button onClick={() => exportPDF(TABS.find(t => t.key === tab)?.label || "", "See report")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">
            📄 Export PDF
          </button>
        </div>

        {/* Tab Bar */}
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
          {tab === "sales"  && <SalesComparison />}
          {tab === "income" && <IncomeApproach />}
          {tab === "cost"   && <CostApproach />}
          {tab === "rr"     && <ReadyReckoner />}
          {tab === "yield"  && <RentalYield />}
        </motion.div>
      </div>
    </div>
  );
}
