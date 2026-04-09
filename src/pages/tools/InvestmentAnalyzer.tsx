import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area
} from "recharts";

// ─── Types ───────────────────────────────────────────────────────────────────
interface DCFInputs {
  revenue: number;
  growthRate: number;
  ebitdaMargin: number;
  taxRate: number;
  capexPct: number;
  wcPct: number;
  wacc: number;
  terminalGrowth: number;
  sharesOutstanding: number;
  netDebt: number;
}

interface RatioInputs {
  revenue: number; ebitda: number; pat: number;
  totalDebt: number; equity: number; currentAssets: number;
  currentLiabilities: number; interestExpense: number;
  marketCap: number; bookValue: number;
}

interface SIPInputs {
  monthlyAmount: number;
  annualReturn: number;
  years: number;
}

const fmt = (n: number) => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
const fmtCr = (n: number) => "₹" + (n / 10000000).toFixed(2) + " Cr";

// ─── DCF Calculator ──────────────────────────────────────────────────────────
function DCFCalculator() {
  const [inp, setInp] = useState<DCFInputs>({
    revenue: 100, growthRate: 15, ebitdaMargin: 25, taxRate: 25,
    capexPct: 5, wcPct: 3, wacc: 12, terminalGrowth: 4,
    sharesOutstanding: 10, netDebt: 20,
  });
  const [scenario, setScenario] = useState<"base" | "bull" | "bear">("base");

  const multiplier = scenario === "bull" ? 1.3 : scenario === "bear" ? 0.7 : 1;

  const result = useMemo(() => {
    const fcfs: number[] = [];
    let rev = inp.revenue * multiplier;
    for (let y = 1; y <= 5; y++) {
      rev *= 1 + (inp.growthRate * multiplier) / 100;
      const ebitda = rev * (inp.ebitdaMargin / 100);
      const nopat = ebitda * (1 - inp.taxRate / 100);
      const capex = rev * (inp.capexPct / 100);
      const wc = rev * (inp.wcPct / 100);
      fcfs.push(nopat - capex - wc);
    }
    const terminalFCF = fcfs[4] * (1 + inp.terminalGrowth / 100);
    const terminalValue = terminalFCF / ((inp.wacc - inp.terminalGrowth) / 100);
    const pvFCFs = fcfs.reduce((s, fcf, i) => s + fcf / Math.pow(1 + inp.wacc / 100, i + 1), 0);
    const pvTerminal = terminalValue / Math.pow(1 + inp.wacc / 100, 5);
    const enterpriseValue = pvFCFs + pvTerminal;
    const equityValue = enterpriseValue - inp.netDebt;
    const pricePerShare = equityValue / inp.sharesOutstanding;
    return { fcfs, pvFCFs, pvTerminal, enterpriseValue, equityValue, pricePerShare };
  }, [inp, multiplier]);

  const chartData = result.fcfs.map((fcf, i) => ({ year: `Y${i + 1}`, FCF: Math.round(fcf) }));

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {(["bear", "base", "bull"] as const).map((s) => (
          <button key={s} onClick={() => setScenario(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all
              ${scenario === s
                ? s === "bull" ? "bg-green-500 text-white" : s === "bear" ? "bg-red-500 text-white" : "bg-indigo-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {s === "bull" ? "🚀" : s === "bear" ? "🐻" : "📊"} {s} Case
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="space-y-3">
          {[
            { label: "Revenue (₹ Cr)", key: "revenue" as const, step: 1 },
            { label: "Revenue Growth (%)", key: "growthRate" as const, step: 1 },
            { label: "EBITDA Margin (%)", key: "ebitdaMargin" as const, step: 1 },
            { label: "Tax Rate (%)", key: "taxRate" as const, step: 1 },
            { label: "Capex (% of Revenue)", key: "capexPct" as const, step: 0.5 },
            { label: "Working Capital (% Rev)", key: "wcPct" as const, step: 0.5 },
            { label: "WACC (%)", key: "wacc" as const, step: 0.5 },
            { label: "Terminal Growth (%)", key: "terminalGrowth" as const, step: 0.5 },
            { label: "Shares Outstanding (Cr)", key: "sharesOutstanding" as const, step: 1 },
            { label: "Net Debt (₹ Cr)", key: "netDebt" as const, step: 1 },
          ].map(({ label, key, step }) => (
            <div key={key}>
              <label className="text-xs text-gray-500 block mb-0.5">{label}</label>
              <input type="number" value={inp[key]} step={step}
                onChange={(e) => setInp((p) => ({ ...p, [key]: parseFloat(e.target.value) || 0 }))}
                className="w-full border rounded-lg px-3 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          ))}
        </div>

        {/* Results */}
        <div className="space-y-4">
          {[
            { label: "PV of FCFs",          value: fmtCr(result.pvFCFs * 10000000),      color: "text-blue-600" },
            { label: "PV of Terminal Value", value: fmtCr(result.pvTerminal * 10000000),  color: "text-purple-600" },
            { label: "Enterprise Value",     value: fmtCr(result.enterpriseValue * 10000000), color: "text-indigo-600" },
            { label: "Equity Value",         value: fmtCr(result.equityValue * 10000000), color: "text-green-600" },
            { label: "Intrinsic Price/Share", value: fmt(result.pricePerShare * 10000000 / 10000000), color: "text-orange-600" },
          ].map((c) => (
            <div key={c.label} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-300">{c.label}</span>
              <span className={`font-bold ${c.color}`}>{c.value}</span>
            </div>
          ))}

          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="fcfGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => `₹${v} Cr`} />
              <Area type="monotone" dataKey="FCF" stroke="#6366f1" fill="url(#fcfGrad)" name="Free Cash Flow (Cr)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─── Ratio Analyzer ──────────────────────────────────────────────────────────
function RatioAnalyzer() {
  const [inp, setInp] = useState<RatioInputs>({
    revenue: 500, ebitda: 100, pat: 60, totalDebt: 200,
    equity: 300, currentAssets: 250, currentLiabilities: 150,
    interestExpense: 20, marketCap: 1000, bookValue: 300,
  });

  const r = useMemo(() => ({
    peRatio: inp.marketCap / inp.pat,
    pbRatio: inp.marketCap / inp.bookValue,
    evEbitda: (inp.marketCap + inp.totalDebt) / inp.ebitda,
    deRatio: inp.totalDebt / inp.equity,
    roe: (inp.pat / inp.equity) * 100,
    roce: (inp.ebitda / (inp.equity + inp.totalDebt)) * 100,
    currentRatio: inp.currentAssets / inp.currentLiabilities,
    quickRatio: (inp.currentAssets * 0.8) / inp.currentLiabilities,
    interestCoverage: inp.ebitda / inp.interestExpense,
    ebitdaMargin: (inp.ebitda / inp.revenue) * 100,
    patMargin: (inp.pat / inp.revenue) * 100,
    assetTurnover: inp.revenue / (inp.equity + inp.totalDebt),
  }), [inp]);

  const getRating = (key: string, val: number): { label: string; color: string } => {
    const rules: Record<string, [number, number]> = {
      peRatio: [15, 30], pbRatio: [1, 4], evEbitda: [8, 20],
      deRatio: [0, 1.5], roe: [15, 100], roce: [12, 100],
      currentRatio: [1.5, 100], quickRatio: [1, 100],
      interestCoverage: [3, 100], ebitdaMargin: [15, 100],
      patMargin: [10, 100], assetTurnover: [0.5, 100],
    };
    const [low, high] = rules[key] || [0, 100];
    const good = val >= low && val <= high;
    return good
      ? { label: "Healthy ✅", color: "text-green-600 bg-green-50" }
      : { label: val < low ? "Low ⚠️" : "High ⚠️", color: "text-red-600 bg-red-50" };
  };

  const ratios = Object.entries(r).map(([key, val]) => {
    const labels: Record<string, string> = {
      peRatio: "P/E Ratio", pbRatio: "P/B Ratio", evEbitda: "EV/EBITDA",
      deRatio: "Debt/Equity", roe: "ROE (%)", roce: "ROCE (%)",
      currentRatio: "Current Ratio", quickRatio: "Quick Ratio",
      interestCoverage: "Interest Coverage", ebitdaMargin: "EBITDA Margin (%)",
      patMargin: "PAT Margin (%)", assetTurnover: "Asset Turnover",
    };
    return { key, label: labels[key], value: val, rating: getRating(key, val) };
  });

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-3">
        <h4 className="font-medium text-gray-700 dark:text-gray-300">Input Financials (₹ Cr)</h4>
        {Object.entries(inp).map(([key, val]) => (
          <div key={key}>
            <label className="text-xs text-gray-500 capitalize block mb-0.5">
              {key.replace(/([A-Z])/g, " $1")}
            </label>
            <input type="number" value={val}
              onChange={(e) => setInp((p) => ({ ...p, [key]: parseFloat(e.target.value) || 0 }))}
              className="w-full border rounded-lg px-3 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <h4 className="font-medium text-gray-700 dark:text-gray-300">Calculated Ratios</h4>
        {ratios.map(({ key, label, value, rating }) => (
          <div key={key} className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800 dark:text-white text-sm">{value.toFixed(2)}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rating.color}`}>{rating.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SIP Calculator ──────────────────────────────────────────────────────────
function SIPCalculator() {
  const [inp, setInp] = useState<SIPInputs>({ monthlyAmount: 10000, annualReturn: 12, years: 20 });

  const result = useMemo(() => {
    const monthlyRate = inp.annualReturn / 100 / 12;
    const months = inp.years * 12;
    const corpus = inp.monthlyAmount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
    const invested = inp.monthlyAmount * months;
    return { corpus, invested, returns: corpus - invested, chartData: Array.from({ length: inp.years }, (_, i) => {
      const m = (i + 1) * 12;
      const c = inp.monthlyAmount * ((Math.pow(1 + monthlyRate, m) - 1) / monthlyRate) * (1 + monthlyRate);
      return { year: `Y${i + 1}`, Corpus: Math.round(c), Invested: inp.monthlyAmount * m };
    }) };
  }, [inp]);

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          {[
            { label: "Monthly SIP Amount (₹)", key: "monthlyAmount" as const, step: 500, min: 500 },
            { label: "Expected Annual Return (%)", key: "annualReturn" as const, step: 0.5, min: 1 },
            { label: "Investment Period (Years)", key: "years" as const, step: 1, min: 1 },
          ].map(({ label, key, step, min }) => (
            <div key={key}>
              <label className="text-xs text-gray-500 block mb-1">{label}</label>
              <input type="number" value={inp[key]} step={step} min={min}
                onChange={(e) => setInp((p) => ({ ...p, [key]: parseFloat(e.target.value) || 0 }))}
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          ))}

          <div className="space-y-3 pt-2">
            {[
              { label: "Total Invested", value: fmt(result.invested), color: "text-blue-600" },
              { label: "Total Returns", value: fmt(result.returns), color: "text-green-600" },
              { label: "Final Corpus", value: fmt(result.corpus), color: "text-indigo-700" },
              { label: "Wealth Multiplier", value: (result.corpus / result.invested).toFixed(2) + "x", color: "text-purple-600" },
            ].map((c) => (
              <div key={c.label} className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-300">{c.label}</span>
                <span className={`font-bold ${c.color}`}>{c.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={result.chartData}>
              <defs>
                <linearGradient id="corpusGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => "₹" + (v / 100000).toFixed(0) + "L"} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Area type="monotone" dataKey="Corpus" stroke="#6366f1" fill="url(#corpusGrad)" name="Corpus" />
              <Line type="monotone" dataKey="Invested" stroke="#22c55e" strokeDasharray="5 5" dot={false} name="Invested" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
const TABS = ["DCF Valuation", "Ratio Analysis", "SIP Calculator"] as const;
type Tab = typeof TABS[number];

export default function InvestmentAnalyzer() {
  const [tab, setTab] = useState<Tab>("DCF Valuation");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">💹 Investment Analyzer</h1>
          <p className="text-gray-500 text-sm mt-1">DCF Valuation · Ratio Analysis · SIP Calculator</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${tab === t ? "bg-white dark:bg-gray-700 shadow text-indigo-600 dark:text-indigo-400" : "text-gray-500 hover:text-gray-700"}`}>
              {t}
            </button>
          ))}
        </div>

        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          {tab === "DCF Valuation" && <DCFCalculator />}
          {tab === "Ratio Analysis" && <RatioAnalyzer />}
          {tab === "SIP Calculator" && <SIPCalculator />}
        </motion.div>
      </div>
    </div>
  );
}
