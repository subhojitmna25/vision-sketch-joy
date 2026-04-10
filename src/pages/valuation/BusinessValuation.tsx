import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import jsPDF from "jspdf";

const fmt = (n: number) => "₹" + Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
const fmtCr = (n: number) => n >= 10000000 ? "₹" + (n / 10000000).toFixed(2) + " Cr" : "₹" + (n / 100000).toFixed(2) + "L";

// ── 1. DCF ────────────────────────────────────────────────────────────────────
function DCFMethod() {
  const [inp, setInp] = useState({ revenue: 50, growth: 15, ebitdaMargin: 20, tax: 25, capex: 5, wc: 3, wacc: 12, termGrowth: 4, netDebt: 10, shares: 10 });
  const set = (k: keyof typeof inp) => (e: React.ChangeEvent<HTMLInputElement>) => setInp(p => ({ ...p, [k]: +e.target.value }));

  const r = useMemo(() => {
    const fcfs: { year: string; FCF: number }[] = [];
    let rev = inp.revenue;
    for (let y = 1; y <= 5; y++) {
      rev *= 1 + inp.growth / 100;
      const ebitda = rev * inp.ebitdaMargin / 100;
      const nopat = ebitda * (1 - inp.tax / 100);
      const fcf = nopat - (rev * inp.capex / 100) - (rev * inp.wc / 100);
      fcfs.push({ year: `Y${y}`, FCF: +fcf.toFixed(2) });
    }
    const termFCF = fcfs[4].FCF * (1 + inp.termGrowth / 100);
    const termVal = termFCF / ((inp.wacc - inp.termGrowth) / 100);
    const pvFCF = fcfs.reduce((s, f, i) => s + f.FCF / Math.pow(1 + inp.wacc / 100, i + 1), 0);
    const pvTerm = termVal / Math.pow(1 + inp.wacc / 100, 5);
    const ev = pvFCF + pvTerm;
    const equity = ev - inp.netDebt;
    const perShare = equity / inp.shares;
    return { fcfs, pvFCF, pvTerm, ev, equity, perShare };
  }, [inp]);

  // Sensitivity table
  const waccRange = [10, 11, 12, 13, 14];
  const growthRange = [3, 4, 5, 6, 7];

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-3 gap-5">
        <div className="space-y-3">
          {[
            { label: "Revenue (₹ Cr)", key: "revenue" as const, step: 1 },
            { label: "Growth Rate (%)", key: "growth" as const, step: 1 },
            { label: "EBITDA Margin (%)", key: "ebitdaMargin" as const, step: 1 },
            { label: "Tax Rate (%)", key: "tax" as const, step: 1 },
            { label: "Capex (% Rev)", key: "capex" as const, step: 0.5 },
            { label: "Working Capital (% Rev)", key: "wc" as const, step: 0.5 },
            { label: "WACC (%)", key: "wacc" as const, step: 0.5 },
            { label: "Terminal Growth (%)", key: "termGrowth" as const, step: 0.5 },
            { label: "Net Debt (₹ Cr)", key: "netDebt" as const, step: 1 },
            { label: "Shares Outstanding (Cr)", key: "shares" as const, step: 1 },
          ].map(({ label, key, step }) => (
            <div key={key}>
              <label className="text-xs text-gray-500 block mb-1">{label}</label>
              <input type="number" value={inp[key]} step={step} onChange={set(key)}
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {[
            { label: "PV of FCFs", value: fmtCr(r.pvFCF * 10000000), color: "text-blue-600" },
            { label: "PV of Terminal Value", value: fmtCr(r.pvTerm * 10000000), color: "text-purple-600" },
            { label: "Enterprise Value", value: fmtCr(r.ev * 10000000), color: "text-indigo-600" },
            { label: "Less: Net Debt", value: `-${fmtCr(inp.netDebt * 10000000)}`, color: "text-red-500" },
            { label: "Equity Value", value: fmtCr(r.equity * 10000000), color: "text-green-600" },
            { label: "Value per Share", value: fmt(r.perShare * 10000000 / inp.shares / 10000000 * inp.shares), color: "text-orange-600" },
          ].map(c => (
            <div key={c.label} className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-300">{c.label}</span>
              <span className={`font-bold ${c.color}`}>{c.value}</span>
            </div>
          ))}
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={r.fcfs}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number) => `₹${v} Cr`} />
              <Bar dataKey="FCF" fill="#6366f1" name="Free Cash Flow" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">Sensitivity: EV (₹ Cr) — WACC vs Terminal Growth</p>
          <table className="text-xs w-full">
            <thead>
              <tr>
                <th className="p-1.5 text-gray-500">WACC\g</th>
                {growthRange.map(g => <th key={g} className="p-1.5 text-gray-500">{g}%</th>)}
              </tr>
            </thead>
            <tbody>
              {waccRange.map(w => (
                <tr key={w}>
                  <td className="p-1.5 font-medium text-gray-700 dark:text-gray-300">{w}%</td>
                  {growthRange.map(g => {
                    const pvF = r.fcfs.reduce((s, f, i) => s + f.FCF / Math.pow(1 + w / 100, i + 1), 0);
                    const tv = r.fcfs[4].FCF * (1 + g / 100) / ((w - g) / 100);
                    const pvT = tv / Math.pow(1 + w / 100, 5);
                    const ev = pvF + pvT;
                    const isBase = w === inp.wacc && g === inp.termGrowth;
                    return (
                      <td key={g} className={`p-1.5 text-center rounded ${isBase ? "bg-indigo-100 text-indigo-800 font-bold" : "text-gray-600 dark:text-gray-400"}`}>
                        {ev.toFixed(0)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── 2. EBITDA Multiple ────────────────────────────────────────────────────────
function EBITDAMultiple() {
  const MULTIPLES: Record<string, [number, number]> = {
    "IT Services": [15, 25], "Manufacturing": [6, 10], "Retail": [8, 12],
    "Healthcare": [12, 18], "FMCG": [20, 30], "Real Estate": [10, 15],
    "Pharma": [14, 22], "Telecom": [6, 9], "Infrastructure": [8, 12],
    "Banking / NBFC": [10, 15], "Auto": [7, 11], "Chemicals": [9, 14],
  };
  const [industry, setIndustry] = useState("IT Services");
  const [ebitda, setEbitda] = useState(100);
  const [netDebt, setNetDebt] = useState(50);
  const [custom, setCustom] = useState(false);
  const [customMult, setCustomMult] = useState(12);

  const [low, high] = MULTIPLES[industry];
  const mid = (low + high) / 2;
  const mult = custom ? customMult : mid;

  const r = useMemo(() => ({
    evLow: ebitda * low, evMid: ebitda * mid, evHigh: ebitda * high,
    ev: ebitda * mult,
    eqLow: ebitda * low - netDebt, eqMid: ebitda * mid - netDebt, eqHigh: ebitda * high - netDebt,
    eq: ebitda * mult - netDebt,
  }), [ebitda, netDebt, low, mid, high, mult]);

  const chartData = [
    { name: "Low", EV: r.evLow, Equity: Math.max(r.eqLow, 0) },
    { name: "Mid", EV: r.evMid, Equity: Math.max(r.eqMid, 0) },
    { name: "High", EV: r.evHigh, Equity: Math.max(r.eqHigh, 0) },
  ];

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Industry</label>
            <select value={industry} onChange={e => setIndustry(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              {Object.keys(MULTIPLES).map(k => <option key={k}>{k}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">LTM EBITDA (₹ Cr)</label>
            <input type="number" value={ebitda} step={5} onChange={e => setEbitda(+e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Net Debt (₹ Cr)</label>
            <input type="number" value={netDebt} step={5} onChange={e => setNetDebt(+e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="custom" checked={custom} onChange={e => setCustom(e.target.checked)} />
            <label htmlFor="custom" className="text-sm text-gray-600 dark:text-gray-300">Use custom multiple</label>
          </div>
          {custom && (
            <input type="number" value={customMult} step={0.5} onChange={e => setCustomMult(+e.target.value)}
              placeholder="Custom multiple"
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          )}
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
            <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">
              Industry Range ({industry}): <strong>{low}x — {high}x</strong>
            </p>
          </div>
        </div>
        <div className="space-y-4">
          {[
            { label: "Enterprise Value (Low)", value: fmtCr(r.evLow * 10000000), color: "text-red-500" },
            { label: "Enterprise Value (Mid)", value: fmtCr(r.evMid * 10000000), color: "text-yellow-600" },
            { label: "Enterprise Value (High)", value: fmtCr(r.evHigh * 10000000), color: "text-green-600" },
            { label: "Equity Value (Mid)", value: fmtCr(r.eqMid * 10000000), color: "text-indigo-600" },
          ].map(c => (
            <div key={c.label} className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-300">{c.label}</span>
              <span className={`font-bold ${c.color}`}>{c.value}</span>
            </div>
          ))}
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => `₹${v} Cr`} />
              <Bar dataKey="EV" fill="#6366f1" name="Enterprise Value" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Equity" fill="#22c55e" name="Equity Value" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── 3. Asset-Based ────────────────────────────────────────────────────────────
function AssetBased() {
  const [inp, setInp] = useState({ totalAssets: 500, totalLiabilities: 200, goodwill: 50, patents: 20, brand: 30, hiddenLiab: 10 });
  const set = (k: keyof typeof inp) => (e: React.ChangeEvent<HTMLInputElement>) => setInp(p => ({ ...p, [k]: +e.target.value }));

  const r = useMemo(() => {
    const bookValue = inp.totalAssets - inp.totalLiabilities;
    const adjustedNAV = bookValue + inp.goodwill + inp.patents + inp.brand - inp.hiddenLiab;
    const liquidation = (inp.totalAssets - inp.goodwill - inp.patents - inp.brand) * 0.7 - inp.totalLiabilities - inp.hiddenLiab;
    return { bookValue, adjustedNAV, liquidation };
  }, [inp]);

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase">Balance Sheet Items (₹ Cr)</p>
          {[
            { label: "Total Assets", key: "totalAssets" as const },
            { label: "Total Liabilities", key: "totalLiabilities" as const },
            { label: "Goodwill", key: "goodwill" as const },
            { label: "Patents / IP", key: "patents" as const },
            { label: "Brand Value", key: "brand" as const },
            { label: "Hidden / Contingent Liabilities", key: "hiddenLiab" as const },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="text-xs text-gray-500 block mb-1">{label}</label>
              <input type="number" value={inp[key]} step={5} onChange={set(key)}
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {[
            { label: "Book Value (NAV)", value: fmtCr(r.bookValue * 10000000), color: "text-blue-600", desc: "Total Assets − Total Liabilities" },
            { label: "Adjusted NAV", value: fmtCr(r.adjustedNAV * 10000000), color: "text-green-600", desc: "Book Value + Intangibles − Hidden Liabilities" },
            { label: "Liquidation Value", value: fmtCr(r.liquidation * 10000000), color: "text-orange-600", desc: "70% of tangible assets − all liabilities" },
          ].map(c => (
            <div key={c.label} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <p className="text-sm text-gray-500">{c.label}</p>
              <p className={`text-2xl font-extrabold ${c.color} my-1`}>{c.value}</p>
              <p className="text-xs text-gray-400">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 4. Comparable Transactions ────────────────────────────────────────────────
function ComparableTransactions() {
  const [subject, setSubject] = useState({ revenue: 80, ebitda: 16 });
  const [deals, setDeals] = useState([
    { company: "TechCo Acquisition 2024", dealValue: 1200, revenue: 90, ebitda: 18 },
    { company: "Infra Deal 2023",         dealValue: 850,  revenue: 70, ebitda: 14 },
    { company: "SaaS Merger 2024",        dealValue: 1500, revenue: 100, ebitda: 22 },
  ]);

  const r = useMemo(() => {
    const multiples = deals.map(d => ({
      ...d, evRevMult: d.dealValue / d.revenue, evEbitdaMult: d.dealValue / d.ebitda,
    }));
    const avgRevMult = multiples.reduce((s, m) => s + m.evRevMult, 0) / multiples.length;
    const avgEbitdaMult = multiples.reduce((s, m) => s + m.evEbitdaMult, 0) / multiples.length;
    const evByRev = subject.revenue * avgRevMult;
    const evByEbitda = subject.ebitda * avgEbitdaMult;
    const low = Math.min(evByRev, evByEbitda) * 0.9;
    const high = Math.max(evByRev, evByEbitda) * 1.1;
    return { multiples, avgRevMult, avgEbitdaMult, evByRev, evByEbitda, low, high };
  }, [subject, deals]);

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">Subject Company (₹ Cr)</p>
          {[
            { label: "Revenue (LTM)", key: "revenue" as const },
            { label: "EBITDA (LTM)", key: "ebitda" as const },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="text-xs text-gray-500 block mb-1">{label}</label>
              <input type="number" value={subject[key]} step={1}
                onChange={e => setSubject(p => ({ ...p, [key]: +e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          ))}
        </div>
        <div className="md:col-span-2 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "EV/Revenue (avg)", value: r.avgRevMult.toFixed(1) + "x", color: "text-blue-600" },
              { label: "EV/EBITDA (avg)", value: r.avgEbitdaMult.toFixed(1) + "x", color: "text-purple-600" },
              { label: "Valuation Range", value: `${fmtCr(r.low * 10000000)} — ${fmtCr(r.high * 10000000)}`, color: "text-green-600" },
            ].map(c => (
              <div key={c.label} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-center">
                <p className={`text-lg font-bold ${c.color}`}>{c.value}</p>
                <p className="text-xs text-gray-500 mt-1">{c.label}</p>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>{["Deal", "Deal Value", "Revenue", "EBITDA", "EV/Rev", "EV/EBITDA"].map(h =>
                  <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500">{h}</th>)}
                </tr>
              </thead>
              <tbody>{r.multiples.map((d, i) => (
                <tr key={i} className="border-b dark:border-gray-700">
                  <td className="px-3 py-2">
                    <input value={d.company} onChange={e => setDeals(p => p.map((x, j) => j === i ? { ...x, company: e.target.value } : x))}
                      className="w-36 border rounded px-2 py-1 text-xs dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                  </td>
                  {(["dealValue", "revenue", "ebitda"] as const).map(k => (
                    <td key={k} className="px-3 py-2">
                      <input type="number" value={d[k]} onChange={e => setDeals(p => p.map((x, j) => j === i ? { ...x, [k]: +e.target.value } : x))}
                        className="w-20 border rounded px-2 py-1 text-xs dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </td>
                  ))}
                  <td className="px-3 py-2 font-medium text-blue-600">{d.evRevMult.toFixed(1)}x</td>
                  <td className="px-3 py-2 font-medium text-purple-600">{d.evEbitdaMult.toFixed(1)}x</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 5. Earnings Multiple ──────────────────────────────────────────────────────
function EarningsMultiple() {
  const PE_BY_SECTOR: Record<string, number> = {
    "IT / Software": 30, "FMCG": 50, "Pharma": 25, "Banking": 15,
    "Auto": 18, "Infrastructure": 20, "Retail": 22, "Healthcare": 28,
    "Manufacturing": 16, "Real Estate": 18, "Telecom": 12, "Chemicals": 22,
  };
  const [sector, setSector] = useState("IT / Software");
  const [pat, setPat] = useState(20);
  const [shares, setShares] = useState(10);
  const [custPE, setCustPE] = useState(false);
  const [peMult, setPeMult] = useState(25);

  const pe = custPE ? peMult : PE_BY_SECTOR[sector];
  const equityValue = pat * pe;
  const perShare = (equityValue * 10000000) / (shares * 10000000);

  const chartData = Object.entries(PE_BY_SECTOR).slice(0, 8).map(([s, p]) => ({
    name: s.split(" ")[0], PE: p, selected: s === sector,
  }));

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Sector</label>
            <select value={sector} onChange={e => setSector(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              {Object.keys(PE_BY_SECTOR).map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Net Profit / PAT (₹ Cr)</label>
            <input type="number" value={pat} step={1} onChange={e => setPat(+e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Shares Outstanding (Cr)</label>
            <input type="number" value={shares} step={1} onChange={e => setShares(+e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="custpe" checked={custPE} onChange={e => setCustPE(e.target.checked)} />
            <label htmlFor="custpe" className="text-sm text-gray-600 dark:text-gray-300">Custom P/E Multiple</label>
          </div>
          {custPE && (
            <input type="number" value={peMult} step={1} onChange={e => setPeMult(+e.target.value)}
              placeholder="Custom P/E"
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          )}
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
            <p className="text-xs text-indigo-700 dark:text-indigo-300">Sector P/E ({sector}): <strong>{PE_BY_SECTOR[sector]}x</strong></p>
          </div>
          {[
            { label: "Applied P/E Multiple", value: pe + "x", color: "text-indigo-600" },
            { label: "Equity / Market Cap", value: fmtCr(equityValue * 10000000), color: "text-green-600" },
            { label: "Intrinsic Value per Share", value: "₹" + perShare.toFixed(0), color: "text-orange-600" },
          ].map(c => (
            <div key={c.label} className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-300">{c.label}</span>
              <span className={`font-bold ${c.color}`}>{c.value}</span>
            </div>
          ))}
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-3 uppercase">Sector P/E Comparison</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={60} />
              <Tooltip formatter={(v: number) => `${v}x`} />
              <Bar dataKey="PE" name="P/E Ratio" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.selected ? "#6366f1" : "#e0e7ff"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
const TABS = [
  { key: "dcf",    label: "📉 DCF Method" },
  { key: "ebitda", label: "📊 EBITDA Multiple" },
  { key: "asset",  label: "🏗️ Asset-Based" },
  { key: "comp",   label: "🔄 Comparable Transactions" },
  { key: "pe",     label: "💰 Earnings Multiple" },
];

export default function BusinessValuation() {
  const [tab, setTab] = useState("dcf");

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Business Valuation Report", 20, 20);
    doc.setFontSize(12);
    doc.text(`Method: ${TABS.find(t => t.key === tab)?.label}`, 20, 35);
    doc.text(`Date: ${new Date().toLocaleDateString("en-IN")}`, 20, 45);
    doc.text("Prepared by: CA Financial Assist", 20, 55);
    doc.setFontSize(10);
    doc.text("This is a computer-generated valuation report.", 20, 75);
    doc.text("Please consult a registered valuer for official purposes.", 20, 85);
    doc.save("business-valuation.pdf");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🏭 Business & Company Valuation</h1>
            <p className="text-gray-500 text-sm mt-1">5 professional valuation methods with sensitivity analysis</p>
          </div>
          <button onClick={exportPDF} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">
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
          {tab === "dcf"    && <DCFMethod />}
          {tab === "ebitda" && <EBITDAMultiple />}
          {tab === "asset"  && <AssetBased />}
          {tab === "comp"   && <ComparableTransactions />}
          {tab === "pe"     && <EarningsMultiple />}
        </motion.div>
      </div>
    </div>
  );
}
