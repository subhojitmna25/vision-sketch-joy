import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from "recharts";

interface Inputs {
  entryEBITDA: number;
  entryMultiple: number;
  revenueGrowth: number;
  ebitdaMargin: number;
  debtEquityRatio: number;
  interestRate: number;
  holdPeriod: number;
  exitMultiple: number;
  initialEquity: number;
}

interface YearRow {
  year: number;
  revenue: number;
  ebitda: number;
  interest: number;
  netIncome: number;
  debtBalance: number;
  debtRepaid: number;
}

const DEFAULT: Inputs = {
  entryEBITDA: 10000000,
  entryMultiple: 8,
  revenueGrowth: 15,
  ebitdaMargin: 25,
  debtEquityRatio: 2,
  interestRate: 10,
  holdPeriod: 5,
  exitMultiple: 10,
  initialEquity: 0,
};

function calcIRR(cashflows: number[]): number {
  let rate = 0.2;
  for (let i = 0; i < 200; i++) {
    const npv = cashflows.reduce((s, cf, t) => s + cf / Math.pow(1 + rate, t), 0);
    const dnpv = cashflows.reduce((s, cf, t) => s - t * cf / Math.pow(1 + rate, t + 1), 0);
    const newRate = rate - npv / dnpv;
    if (Math.abs(newRate - rate) < 1e-7) return newRate;
    rate = newRate;
  }
  return rate;
}

const fmt = (n: number) => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
const fmtPct = (n: number) => (n * 100).toFixed(1) + "%";
const fmtX = (n: number) => n.toFixed(2) + "x";

export default function LBOAnalyzer() {
  const [inp, setInp] = useState<Inputs>(DEFAULT);

  const set = (k: keyof Inputs) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setInp((p) => ({ ...p, [k]: parseFloat(e.target.value) || 0 }));

  const results = useMemo(() => {
    const entryEV = inp.entryEBITDA * inp.entryMultiple;
    const totalDebt = entryEV * (inp.debtEquityRatio / (1 + inp.debtEquityRatio));
    const equity = entryEV - totalDebt;
    const initialRevenue = inp.entryEBITDA / (inp.ebitdaMargin / 100);

    const rows: YearRow[] = [];
    let debtBalance = totalDebt;

    for (let y = 1; y <= inp.holdPeriod; y++) {
      const revenue = initialRevenue * Math.pow(1 + inp.revenueGrowth / 100, y);
      const ebitda = revenue * (inp.ebitdaMargin / 100);
      const interest = debtBalance * (inp.interestRate / 100);
      const netIncome = ebitda - interest;
      const debtRepaid = Math.min(Math.max(netIncome * 0.6, 0), debtBalance);
      debtBalance -= debtRepaid;
      rows.push({ year: y, revenue, ebitda, interest, netIncome, debtBalance, debtRepaid });
    }

    const exitEBITDA = rows[rows.length - 1].ebitda;
    const exitEV = exitEBITDA * inp.exitMultiple;
    const exitEquity = Math.max(exitEV - rows[rows.length - 1].debtBalance, 0);
    const moic = exitEquity / equity;
    const irr = calcIRR([-equity, ...Array(inp.holdPeriod - 1).fill(0), exitEquity]);

    return { entryEV, equity, totalDebt, rows, exitEV, exitEquity, moic, irr, exitEBITDA };
  }, [inp]);

  const chartData = results.rows.map((r) => ({
    name: `Year ${r.year}`,
    EBITDA: Math.round(r.ebitda / 1000),
    Debt: Math.round(r.debtBalance / 1000),
  }));

  const sensitivityRows = [6, 7, 8, 9, 10];
  const sensitivityCols = [8, 9, 10, 11, 12];

  const getSensIRR = (entryM: number, exitM: number) => {
    const entryEV = inp.entryEBITDA * entryM;
    const debt = entryEV * (inp.debtEquityRatio / (1 + inp.debtEquityRatio));
    const eq = entryEV - debt;
    const initRev = inp.entryEBITDA / (inp.ebitdaMargin / 100);
    let db = debt;
    let lastEBITDA = 0;
    for (let y = 1; y <= inp.holdPeriod; y++) {
      const rev = initRev * Math.pow(1 + inp.revenueGrowth / 100, y);
      const ebitda = rev * (inp.ebitdaMargin / 100);
      const interest = db * (inp.interestRate / 100);
      const ni = ebitda - interest;
      db -= Math.min(Math.max(ni * 0.6, 0), db);
      lastEBITDA = ebitda;
    }
    const exitEV = lastEBITDA * exitM;
    const exitEq = Math.max(exitEV - db, 0);
    return calcIRR([-eq, ...Array(inp.holdPeriod - 1).fill(0), exitEq]);
  };

  const irrColor = (irr: number) =>
    irr > 0.25 ? "bg-green-100 text-green-800" :
    irr > 0.15 ? "bg-yellow-100 text-yellow-800" :
    "bg-red-100 text-red-700";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📊 LBO Analysis Tool</h1>
          <p className="text-gray-500 text-sm mt-1">Leveraged Buyout model with IRR, MOIC & sensitivity analysis</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Inputs */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-800 dark:text-white">📥 Deal Parameters</h3>

            {[
              { label: "Entry EBITDA (₹)", key: "entryEBITDA" as const, step: 100000 },
              { label: "Entry EV/EBITDA Multiple", key: "entryMultiple" as const, step: 0.5 },
              { label: "Revenue Growth Rate (%)", key: "revenueGrowth" as const, step: 1 },
              { label: "EBITDA Margin (%)", key: "ebitdaMargin" as const, step: 1 },
              { label: "Debt/Equity Ratio", key: "debtEquityRatio" as const, step: 0.1 },
              { label: "Interest Rate (%)", key: "interestRate" as const, step: 0.5 },
              { label: "Exit EV/EBITDA Multiple", key: "exitMultiple" as const, step: 0.5 },
            ].map(({ label, key, step }) => (
              <div key={key}>
                <label className="text-xs text-gray-500 block mb-1">{label}</label>
                <input type="number" value={inp[key]} step={step} onChange={set(key)}
                  className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
            ))}

            <div>
              <label className="text-xs text-gray-500 block mb-1">Hold Period (Years)</label>
              <select value={inp.holdPeriod} onChange={set("holdPeriod")}
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                {[3, 4, 5, 6, 7].map((y) => <option key={y} value={y}>{y} Years</option>)}
              </select>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-2 space-y-5">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Entry EV",    value: fmt(results.entryEV),    color: "text-blue-600" },
                { label: "Equity In",   value: fmt(results.equity),     color: "text-purple-600" },
                { label: "Exit Equity", value: fmt(results.exitEquity), color: "text-green-600" },
                { label: "Total Debt",  value: fmt(results.totalDebt),  color: "text-red-500" },
              ].map((c) => (
                <motion.div key={c.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm text-center">
                  <p className={`text-lg font-bold ${c.color}`}>{c.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{c.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Returns */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-5 text-white text-center">
                <p className="text-4xl font-extrabold">{fmtPct(results.irr)}</p>
                <p className="text-indigo-200 text-sm mt-1">IRR (Internal Rate of Return)</p>
                <p className="text-xs text-indigo-300 mt-2">
                  {results.irr > 0.25 ? "🟢 Excellent" : results.irr > 0.15 ? "🟡 Good" : "🔴 Below Hurdle"}
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-xl p-5 text-white text-center">
                <p className="text-4xl font-extrabold">{fmtX(results.moic)}</p>
                <p className="text-green-200 text-sm mt-1">MOIC (Money-on-Money)</p>
                <p className="text-xs text-green-300 mt-2">
                  {results.moic > 3 ? "🟢 Strong Return" : results.moic > 2 ? "🟡 Good Return" : "🔴 Low Return"}
                </p>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-4">EBITDA & Debt Paydown (₹000s)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => `₹${v}k`} />
                  <Bar dataKey="EBITDA" fill="#6366f1" radius={[4,4,0,0]} />
                  <Bar dataKey="Debt" fill="#ef4444" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Projection Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b dark:border-gray-700">
            <h3 className="font-semibold text-gray-800 dark:text-white">📋 Year-by-Year Projections</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {["Year","Revenue","EBITDA","Interest","Net Income","Debt Repaid","Debt Balance"].map((h) => (
                    <th key={h} className="text-right first:text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {results.rows.map((r) => (
                  <tr key={r.year} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">Year {r.year}</td>
                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">{fmt(r.revenue)}</td>
                    <td className="px-4 py-3 text-right text-indigo-600 font-medium">{fmt(r.ebitda)}</td>
                    <td className="px-4 py-3 text-right text-red-500">{fmt(r.interest)}</td>
                    <td className={`px-4 py-3 text-right font-medium ${r.netIncome >= 0 ? "text-green-600" : "text-red-500"}`}>{fmt(r.netIncome)}</td>
                    <td className="px-4 py-3 text-right text-green-600">{fmt(r.debtRepaid)}</td>
                    <td className="px-4 py-3 text-right text-orange-500">{fmt(r.debtBalance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sensitivity Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b dark:border-gray-700">
            <h3 className="font-semibold text-gray-800 dark:text-white">🔢 IRR Sensitivity Table</h3>
            <p className="text-xs text-gray-500 mt-1">Entry Multiple (rows) vs Exit Multiple (columns)</p>
          </div>
          <div className="overflow-x-auto p-4">
            <table className="text-sm">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-xs text-gray-500">Entry \ Exit</th>
                  {sensitivityCols.map((c) => (
                    <th key={c} className="px-3 py-2 text-xs text-gray-500">{c}x</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sensitivityRows.map((row) => (
                  <tr key={row}>
                    <td className="px-3 py-2 font-medium text-gray-700 dark:text-gray-300">{row}x</td>
                    {sensitivityCols.map((col) => {
                      const irr = getSensIRR(row, col);
                      return (
                        <td key={col} className="px-3 py-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${irrColor(irr)}`}>
                            {fmtPct(irr)}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex gap-4 mt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 inline-block"/>  &gt;25% IRR</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-100 inline-block"/> 15-25% IRR</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 inline-block"/>   &lt;15% IRR</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
