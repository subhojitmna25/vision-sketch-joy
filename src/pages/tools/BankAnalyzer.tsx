import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend, ResponsiveContainer
} from "recharts";
import { Upload, FileText, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle, Download, RefreshCw } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  type: "credit" | "debit";
  category: string;
  flag: "normal" | "unusual" | "suspicious";
}

interface Summary {
  totalCredits: number;
  totalDebits: number;
  netFlow: number;
  txCount: number;
  flaggedCount: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { keywords: ["salary","payroll","wages"], label: "Salary" },
  { keywords: ["gst","tax","tds","advance tax","income tax"], label: "Tax Payment" },
  { keywords: ["rent","lease","property"], label: "Rent" },
  { keywords: ["electricity","water","gas","broadband","internet","phone","mobile"], label: "Utilities" },
  { keywords: ["amazon","flipkart","myntra","swiggy","zomato","purchase","shopping"], label: "Shopping" },
  { keywords: ["upi","neft","rtgs","imps","transfer"], label: "Transfer" },
  { keywords: ["insurance","lic","policy"], label: "Insurance" },
  { keywords: ["emi","loan","mortgage"], label: "Loan EMI" },
  { keywords: ["atm","cash withdrawal","cash deposit"], label: "Cash" },
  { keywords: ["interest","dividend"], label: "Income" },
];

function categorise(description: string): string {
  const lower = description.toLowerCase();
  for (const c of CATEGORIES) {
    if (c.keywords.some((k) => lower.includes(k))) return c.label;
  }
  return "Other";
}

function detectFlag(amount: number, avg: number): "normal" | "unusual" | "suspicious" {
  if (amount > avg * 5) return "suspicious";
  if (amount > avg * 2.5) return "unusual";
  return "normal";
}

function parseCSV(text: string): Transaction[] {
  const lines = text.trim().split("\n").slice(1); // skip header
  const raw = lines.map((line, i) => {
    const cols = line.split(",").map((c) => c.replace(/"/g, "").trim());
    const amount = Math.abs(parseFloat(cols[2] || cols[3] || "0"));
    const type: "credit" | "debit" =
      parseFloat(cols[2]) > 0 || cols[4]?.toLowerCase() === "credit" ? "credit" : "debit";
    return { id: i + 1, date: cols[0] || "", description: cols[1] || "",
      amount, type, category: categorise(cols[1] || ""), flag: "normal" as const };
  }).filter((t) => t.amount > 0);

  const avgDebit = raw.filter((t) => t.type === "debit")
    .reduce((s, t) => s + t.amount, 0) / (raw.filter((t) => t.type === "debit").length || 1);

  return raw.map((t) => ({
    ...t,
    flag: t.type === "debit" ? detectFlag(t.amount, avgDebit) : "normal",
  }));
}

// ─── Colours ─────────────────────────────────────────────────────────────────
const PIE_COLORS = ["#6366f1","#22c55e","#f59e0b","#ef4444","#3b82f6","#a855f7","#14b8a6","#f97316"];
const FLAG_STYLE: Record<string, string> = {
  normal: "bg-green-100 text-green-700",
  unusual: "bg-yellow-100 text-yellow-700",
  suspicious: "bg-red-100 text-red-700",
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function BankAnalyzer() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "credit" | "debit">("all");
  const [filterFlag, setFilterFlag] = useState<"all" | "unusual" | "suspicious">("all");
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const process = useCallback((text: string) => {
    setLoading(true);
    setTimeout(() => {
      const txs = parseCSV(text);
      setTransactions(txs);
      const totalCredits = txs.filter((t) => t.type === "credit").reduce((s, t) => s + t.amount, 0);
      const totalDebits  = txs.filter((t) => t.type === "debit").reduce((s, t) => s + t.amount, 0);
      setSummary({
        totalCredits, totalDebits,
        netFlow: totalCredits - totalDebits,
        txCount: txs.length,
        flaggedCount: txs.filter((t) => t.flag !== "normal").length,
      });
      setLoading(false);
    }, 800);
  }, []);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => process(e.target?.result as string);
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  // Demo data
  const loadDemo = () => {
    const demo = `Date,Description,Amount,Type
2025-04-01,Salary Credit,85000,credit
2025-04-02,Amazon Shopping,-3200,debit
2025-04-03,GST Payment,-18000,debit
2025-04-05,UPI Transfer to Rahul,-500,debit
2025-04-07,Electricity Bill,-2200,debit
2025-04-10,Client Payment Received,45000,credit
2025-04-12,ATM Cash Withdrawal,-10000,debit
2025-04-15,LIC Insurance Premium,-8500,debit
2025-04-18,Swiggy Food Order,-850,debit
2025-04-20,Unusual Large Transfer,-250000,debit
2025-04-22,Rent Payment,-25000,debit
2025-04-25,Interest Income,1200,credit
2025-04-28,Loan EMI,-15000,debit
2025-04-30,Dividend Received,3500,credit`;
    process(demo);
  };

  // Chart data
  const categoryData = Object.entries(
    transactions.filter((t) => t.type === "debit")
      .reduce((acc, t) => ({ ...acc, [t.category]: (acc[t.category] || 0) + t.amount }), {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const monthlyData = Object.entries(
    transactions.reduce((acc, t) => {
      const month = t.date.slice(0, 7);
      if (!acc[month]) acc[month] = { month, credit: 0, debit: 0 };
      if (t.type === "credit") acc[month].credit += t.amount;
      else acc[month].debit += t.amount;
      return acc;
    }, {} as Record<string, { month: string; credit: number; debit: number }>)
  ).map(([, v]) => v);

  const filtered = transactions.filter((t) => {
    const matchSearch = t.description.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || t.type === filterType;
    const matchFlag = filterFlag === "all" || t.flag === filterFlag;
    return matchSearch && matchType && matchFlag;
  });

  const fmt = (n: number) => "₹" + Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

  // Download CSV
  const downloadCSV = () => {
    const rows = ["Date,Description,Amount,Type,Category,Flag",
      ...filtered.map((t) => `${t.date},"${t.description}",${t.amount},${t.type},${t.category},${t.flag}`)];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "bank_analysis.csv"; a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🏦 Bank Statement Analyzer</h1>
            <p className="text-gray-500 text-sm mt-1">Upload your bank CSV to auto-categorize and detect anomalies</p>
          </div>
          {transactions.length > 0 && (
            <div className="flex gap-2">
              <button onClick={downloadCSV}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
                <Download size={15} /> Export CSV
              </button>
              <button onClick={() => { setTransactions([]); setSummary(null); }}
                className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-800">
                <RefreshCw size={15} /> Reset
              </button>
            </div>
          )}
        </div>

        {/* Upload Zone */}
        {transactions.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-16 text-center transition-all
                ${dragging ? "border-indigo-500 bg-indigo-50" : "border-gray-300 dark:border-gray-600 hover:border-indigo-400"}`}>
              {loading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-gray-500">Analyzing transactions...</p>
                </div>
              ) : (
                <>
                  <Upload className="mx-auto mb-4 text-gray-400" size={48} />
                  <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Drop your bank statement CSV here</p>
                  <p className="text-gray-400 text-sm mt-1 mb-4">Supports SBI, HDFC, ICICI, Axis, Kotak CSV formats</p>
                  <div className="flex justify-center gap-3">
                    <label className="cursor-pointer px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
                      Browse File
                      <input type="file" accept=".csv" className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                    </label>
                    <button onClick={loadDemo}
                      className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-800">
                      Load Demo Data
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-4">CSV format: Date, Description, Amount, Type</p>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* Summary Cards */}
        {summary && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Total Credits", value: fmt(summary.totalCredits), icon: <TrendingUp size={20} />, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
              { label: "Total Debits",  value: fmt(summary.totalDebits),  icon: <TrendingDown size={20} />, color: "text-red-500",   bg: "bg-red-50 dark:bg-red-900/20" },
              { label: "Net Flow",      value: fmt(summary.netFlow),      icon: summary.netFlow >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />,
                color: summary.netFlow >= 0 ? "text-green-600" : "text-red-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
              { label: "Transactions",  value: summary.txCount.toString(), icon: <FileText size={20} />, color: "text-blue-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
              { label: "Flagged",       value: summary.flaggedCount.toString(), icon: <AlertTriangle size={20} />, color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-900/20" },
            ].map((c) => (
              <div key={c.label} className={`${c.bg} rounded-xl p-4`}>
                <div className={`${c.color} mb-1`}>{c.icon}</div>
                <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Charts */}
        {transactions.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Bar chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Monthly Cash Flow</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => "₹" + (v/1000).toFixed(0) + "k"} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend />
                  <Bar dataKey="credit" name="Credits" fill="#22c55e" radius={[4,4,0,0]} />
                  <Bar dataKey="debit"  name="Debits"  fill="#ef4444" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Expense Breakdown</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Transactions Table */}
        {transactions.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            {/* Filters */}
            <div className="p-4 border-b dark:border-gray-700 flex flex-wrap gap-3">
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search transactions..."
                className="border rounded-lg px-3 py-1.5 text-sm w-56 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)}
                className="border rounded-lg px-3 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="all">All Types</option>
                <option value="credit">Credits Only</option>
                <option value="debit">Debits Only</option>
              </select>
              <select value={filterFlag} onChange={(e) => setFilterFlag(e.target.value as any)}
                className="border rounded-lg px-3 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="all">All Transactions</option>
                <option value="unusual">Unusual</option>
                <option value="suspicious">Suspicious</option>
              </select>
              <span className="ml-auto text-sm text-gray-500 self-center">{filtered.length} transactions</span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    {["Date","Description","Category","Amount","Type","Status"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filtered.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{t.date}</td>
                      <td className="px-4 py-3 text-gray-800 dark:text-white max-w-xs truncate">{t.description}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs">{t.category}</span>
                      </td>
                      <td className={`px-4 py-3 font-semibold ${t.type === "credit" ? "text-green-600" : "text-red-500"}`}>
                        {t.type === "credit" ? "+" : "-"}{fmt(t.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                          ${t.type === "credit" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                          {t.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium w-fit ${FLAG_STYLE[t.flag]}`}>
                          {t.flag === "normal" ? <CheckCircle size={11} /> : <AlertTriangle size={11} />}
                          {t.flag}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
