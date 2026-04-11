import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import jsPDF from "jspdf";

const fmt = (n: number) => "₹" + Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
const fmtCr = (n: number) => n >= 10000000 ? "₹" + (n / 10000000).toFixed(2) + " Cr" : "₹" + (n / 100000).toFixed(2) + "L";

// ── 1. Machinery & Equipment ──────────────────────────────────────────────────
function MachineryValuation() {
  const [inp, setInp] = useState({ originalCost: 5000000, purchaseYear: 2018, usefulLife: 15, salvagePct: 10, method: "SLM", rcnAdj: 105 });
  const set = (k: keyof typeof inp) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setInp(p => ({ ...p, [k]: k === "method" ? e.target.value : +e.target.value }));

  const currentYear = new Date().getFullYear();

  const r = useMemo(() => {
    const age = currentYear - inp.purchaseYear;
    const salvage = inp.originalCost * inp.salvagePct / 100;
    const depreciable = inp.originalCost - salvage;
    let bookValue = 0;
    const schedule: { year: number; depreciation: number; bookValue: number }[] = [];
    let bv = inp.originalCost;
    for (let y = 1; y <= Math.min(age, inp.usefulLife); y++) {
      let dep = 0;
      if (inp.method === "SLM") dep = depreciable / inp.usefulLife;
      else if (inp.method === "WDV") dep = bv * (1 - Math.pow(inp.salvagePct / 100, 1 / inp.usefulLife));
      else dep = (2 / inp.usefulLife) * bv;
      bv = Math.max(bv - dep, salvage);
      schedule.push({ year: inp.purchaseYear + y, depreciation: Math.round(dep), bookValue: Math.round(bv) });
    }
    bookValue = bv;
    const rcn = inp.originalCost * inp.rcnAdj / 100;
    const marketValue = Math.max(bookValue * 1.1, salvage);
    return { age, bookValue, salvage, rcn, marketValue, schedule };
  }, [inp, currentYear]);

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          {[
            { label: "Original Cost (₹)", key: "originalCost" as const, step: 100000 },
            { label: "Purchase Year", key: "purchaseYear" as const, step: 1 },
            { label: "Useful Life (years)", key: "usefulLife" as const, step: 1 },
            { label: "Salvage Value (%)", key: "salvagePct" as const, step: 1 },
            { label: "Replacement Cost Adjustment (%)", key: "rcnAdj" as const, step: 1 },
          ].map(({ label, key, step }) => (
            <div key={key}>
              <label className="text-xs text-gray-500 block mb-1">{label}</label>
              <input type="number" value={inp[key] as number} step={step} onChange={set(key)}
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          ))}
          <div>
            <label className="text-xs text-gray-500 block mb-1">Depreciation Method</label>
            <select value={inp.method} onChange={set("method")}
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              <option value="SLM">Straight Line Method (SLM)</option>
              <option value="WDV">Written Down Value (WDV)</option>
              <option value="DDB">Double Declining Balance</option>
            </select>
          </div>
        </div>
        <div className="space-y-3">
          {[
            { label: "Asset Age", value: r.age + " years", color: "text-gray-700 dark:text-gray-300" },
            { label: "Current Book Value", value: fmt(r.bookValue), color: "text-blue-600" },
            { label: "Salvage / Scrap Value", value: fmt(r.salvage), color: "text-orange-500" },
            { label: "Replacement Cost New (RCN)", value: fmt(r.rcn), color: "text-purple-600" },
            { label: "Estimated Market Value", value: fmt(r.marketValue), color: "text-green-600" },
            { label: "Depreciation %", value: ((1 - r.bookValue / inp.originalCost) * 100).toFixed(1) + "%", color: "text-red-500" },
          ].map(c => (
            <div key={c.label} className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-300">{c.label}</span>
              <span className={`font-bold ${c.color}`}>{c.value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">Depreciation Schedule</p>
        <table className="w-full text-xs">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>{["Year", "Depreciation (₹)", "Book Value (₹)"].map(h =>
              <th key={h} className="px-3 py-2 text-left text-gray-500">{h}</th>)}
            </tr>
          </thead>
          <tbody>{r.schedule.map((s, i) => (
            <tr key={i} className={`border-b dark:border-gray-700 ${i === r.schedule.length - 1 ? "bg-indigo-50 dark:bg-indigo-900/20 font-bold" : ""}`}>
              <td className="px-3 py-1.5 text-gray-700 dark:text-gray-300">{s.year}</td>
              <td className="px-3 py-1.5 text-red-500">{fmt(s.depreciation)}</td>
              <td className="px-3 py-1.5 text-green-600">{fmt(s.bookValue)}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

// ── 2. Vehicle Valuation ──────────────────────────────────────────────────────
function VehicleValuation() {
  const DEP_RATES: Record<string, number[]> = {
    "Car (Petrol/Diesel)":   [15, 20, 20, 15, 15, 10, 10, 5, 5, 5],
    "Luxury Car":            [20, 20, 20, 15, 10, 10, 5, 0, 0, 0],
    "Two Wheeler":           [15, 15, 15, 15, 10, 10, 10, 5, 5, 0],
    "Commercial Vehicle":    [15, 15, 15, 15, 15, 10, 10, 5, 0, 0],
    "Electric Vehicle":      [10, 15, 15, 15, 15, 10, 10, 5, 5, 0],
  };

  const [inp, setInp] = useState({ vehicleType: "Car (Petrol/Diesel)", exShowroom: 1200000, purchaseYear: 2021, km: 45000, condition: "Good" });
  const set = (k: keyof typeof inp) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setInp(p => ({ ...p, [k]: k === "exShowroom" || k === "purchaseYear" || k === "km" ? +e.target.value : e.target.value }));

  const r = useMemo(() => {
    const age = new Date().getFullYear() - inp.purchaseYear;
    const rates = DEP_RATES[inp.vehicleType] || DEP_RATES["Car (Petrol/Diesel)"];
    let value = inp.exShowroom;
    for (let y = 0; y < Math.min(age, rates.length); y++) value *= (1 - rates[y] / 100);
    const condAdj = inp.condition === "Excellent" ? 1.1 : inp.condition === "Good" ? 1.0 : inp.condition === "Fair" ? 0.85 : 0.70;
    const kmAdj = Math.max(1 - (inp.km / 200000) * 0.15, 0.7);
    const marketValue = value * condAdj * kmAdj;
    const idv = value * 0.95;
    return { age, bookValue: Math.round(value), marketValue: Math.round(marketValue), idv: Math.round(idv) };
  }, [inp]);

  const chartData = Array.from({ length: Math.min(10, new Date().getFullYear() - inp.purchaseYear + 5) }, (_, i) => {
    const rates = DEP_RATES[inp.vehicleType] || [];
    let v = inp.exShowroom;
    for (let y = 0; y < Math.min(i + 1, rates.length); y++) v *= (1 - rates[y] / 100);
    return { year: inp.purchaseYear + i + 1, Value: Math.round(v) };
  });

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Vehicle Type</label>
            <select value={inp.vehicleType} onChange={set("vehicleType")}
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              {Object.keys(DEP_RATES).map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          {[
            { label: "Ex-Showroom Price (₹)", key: "exShowroom" as const, step: 50000 },
            { label: "Year of Purchase", key: "purchaseYear" as const, step: 1 },
            { label: "Current Mileage (km)", key: "km" as const, step: 5000 },
          ].map(({ label, key, step }) => (
            <div key={key}>
              <label className="text-xs text-gray-500 block mb-1">{label}</label>
              <input type="number" value={inp[key] as number} step={step} onChange={set(key)}
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          ))}
          <div>
            <label className="text-xs text-gray-500 block mb-1">Vehicle Condition</label>
            <select value={inp.condition} onChange={set("condition")}
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              {["Excellent", "Good", "Fair", "Poor"].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-3">
          {[
            { label: "Vehicle Age", value: r.age + " years", color: "text-gray-700 dark:text-gray-300" },
            { label: "Depreciated Book Value", value: fmt(r.bookValue), color: "text-blue-600" },
            { label: "Market / Resale Value", value: fmt(r.marketValue), color: "text-green-600" },
            { label: "Insurance IDV", value: fmt(r.idv), color: "text-purple-600" },
            { label: "Depreciation from new", value: ((1 - r.bookValue / inp.exShowroom) * 100).toFixed(1) + "%", color: "text-red-500" },
          ].map(c => (
            <div key={c.label} className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-300">{c.label}</span>
              <span className={`font-bold ${c.color}`}>{c.value}</span>
            </div>
          ))}
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => (v / 100000).toFixed(0) + "L"} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Bar dataKey="Value" fill="#6366f1" name="Market Value" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── 3. Jewellery & Gold ───────────────────────────────────────────────────────
function JewelleryValuation() {
  const [inp, setInp] = useState({ weight: 50, purity: 22, goldRate: 7200, makingPct: 12, stonesValue: 15000, wastage: 5 });
  const set = (k: keyof typeof inp) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setInp(p => ({ ...p, [k]: k === "purity" ? +e.target.value : +e.target.value }));

  const r = useMemo(() => {
    const pureGoldWeight = inp.weight * (inp.purity / 24) * (1 - inp.wastage / 100);
    const goldValue = pureGoldWeight * inp.goldRate;
    const makingCharges = goldValue * inp.makingPct / 100;
    const totalJewelleryValue = goldValue + makingCharges + inp.stonesValue;
    const gst = totalJewelleryValue * 0.03;
    const totalWithGST = totalJewelleryValue + gst;
    const resaleValue = goldValue * 0.9;
    const insuranceValue = totalWithGST * 1.1;
    const breakdown = [
      { name: "Pure Gold Value", value: Math.round(goldValue) },
      { name: "Making Charges", value: Math.round(makingCharges) },
      { name: "Stones/Diamonds", value: inp.stonesValue },
      { name: "GST (3%)", value: Math.round(gst) },
    ];
    return { pureGoldWeight, goldValue, makingCharges, totalJewelleryValue, gst, totalWithGST, resaleValue, insuranceValue, breakdown };
  }, [inp]);

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          {[
            { label: "Weight of Jewellery (grams)", key: "weight" as const, step: 1 },
            { label: "Gold Rate per gram (₹)", key: "goldRate" as const, step: 100 },
            { label: "Making Charges (%)", key: "makingPct" as const, step: 1 },
            { label: "Stones / Diamond Value (₹)", key: "stonesValue" as const, step: 1000 },
            { label: "Wastage (%)", key: "wastage" as const, step: 0.5 },
          ].map(({ label, key, step }) => (
            <div key={key}>
              <label className="text-xs text-gray-500 block mb-1">{label}</label>
              <input type="number" value={inp[key]} step={step} onChange={set(key)}
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          ))}
          <div>
            <label className="text-xs text-gray-500 block mb-1">Gold Purity</label>
            <select value={inp.purity} onChange={set("purity")}
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              <option value={24}>24 Karat (99.9% pure)</option>
              <option value={22}>22 Karat (91.6% pure)</option>
              <option value={18}>18 Karat (75% pure)</option>
              <option value={14}>14 Karat (58.3% pure)</option>
            </select>
          </div>
        </div>
        <div className="space-y-3">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500">Pure Gold Weight</p>
            <p className="text-2xl font-extrabold text-yellow-700 dark:text-yellow-400">{r.pureGoldWeight.toFixed(2)}g</p>
          </div>
          {[
            { label: "Gold Value", value: fmt(r.goldValue), color: "text-yellow-600" },
            { label: "Making Charges", value: fmt(r.makingCharges), color: "text-orange-500" },
            { label: "Total Jewellery Value", value: fmt(r.totalJewelleryValue), color: "text-blue-600" },
            { label: "+ GST 3%", value: fmt(r.gst), color: "text-gray-500" },
            { label: "Total with GST", value: fmt(r.totalWithGST), color: "text-indigo-600" },
            { label: "Resale / Melt Value", value: fmt(r.resaleValue), color: "text-green-600" },
            { label: "Insurance Value", value: fmt(r.insuranceValue), color: "text-purple-600" },
          ].map(c => (
            <div key={c.label} className="flex justify-between p-2.5 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-300">{c.label}</span>
              <span className={`font-bold ${c.color}`}>{c.value}</span>
            </div>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={r.breakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
            {r.breakdown.map((_, i) => <Cell key={i} fill={["#f59e0b", "#f97316", "#a855f7", "#6366f1"][i]} />)}
          </Pie>
          <Tooltip formatter={(v: number) => fmt(v)} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── 4. IP / Patent Valuation ──────────────────────────────────────────────────
function IPValuation() {
  const [inp, setInp] = useState({ ipType: "Patent", annualRoyalty: 5000000, remainingLife: 10, discountRate: 14, growthRate: 5, royaltyRate: 5, revenue: 100000000 });
  const set = (k: keyof typeof inp) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setInp(p => ({ ...p, [k]: k === "ipType" ? e.target.value : +e.target.value }));

  const r = useMemo(() => {
    // Income approach
    const pvRoyalty = inp.annualRoyalty * (1 - Math.pow(1 + inp.growthRate / 100, inp.remainingLife) / Math.pow(1 + inp.discountRate / 100, inp.remainingLife)) / ((inp.discountRate - inp.growthRate) / 100);
    // Relief from Royalty
    const royaltyIncome = inp.revenue * inp.royaltyRate / 100;
    const pvRelief = royaltyIncome * (1 - Math.pow(1 + inp.growthRate / 100, inp.remainingLife) / Math.pow(1 + inp.discountRate / 100, inp.remainingLife)) / ((inp.discountRate - inp.growthRate) / 100);
    const avgValue = (pvRoyalty + pvRelief) / 2;
    const rows = Array.from({ length: inp.remainingLife }, (_, i) => {
      const royalty = inp.annualRoyalty * Math.pow(1 + inp.growthRate / 100, i + 1);
      const pv = royalty / Math.pow(1 + inp.discountRate / 100, i + 1);
      return { year: i + 1, Royalty: Math.round(royalty / 100000), PV: Math.round(pv / 100000) };
    });
    return { pvRoyalty, pvRelief, avgValue, rows };
  }, [inp]);

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">IP Type</label>
            <select value={inp.ipType} onChange={set("ipType")}
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              {["Patent", "Trademark", "Copyright", "Software", "Trade Secret"].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          {[
            { label: "Annual Royalty / License Income (₹)", key: "annualRoyalty" as const, step: 100000 },
            { label: "Revenue to Apply Royalty Rate to (₹)", key: "revenue" as const, step: 1000000 },
            { label: "Royalty Rate (%)", key: "royaltyRate" as const, step: 0.5 },
            { label: "Remaining Legal Life (years)", key: "remainingLife" as const, step: 1 },
            { label: "Discount Rate (%)", key: "discountRate" as const, step: 0.5 },
            { label: "Royalty Growth Rate (%)", key: "growthRate" as const, step: 0.5 },
          ].map(({ label, key, step }) => (
            <div key={key}>
              <label className="text-xs text-gray-500 block mb-1">{label}</label>
              <input type="number" value={inp[key] as number} step={step} onChange={set(key)}
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {[
            { label: "Income Approach Value", value: fmtCr(r.pvRoyalty), color: "text-blue-600" },
            { label: "Relief from Royalty Value", value: fmtCr(r.pvRelief), color: "text-purple-600" },
            { label: "Average IP Fair Value", value: fmtCr(r.avgValue), color: "text-green-600" },
          ].map(c => (
            <div key={c.label} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <p className="text-xs text-gray-500">{c.label}</p>
              <p className={`text-2xl font-extrabold ${c.color} my-1`}>{c.value}</p>
            </div>
          ))}
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={r.rows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => v + "L"} />
              <Tooltip formatter={(v: number) => `₹${v}L`} />
              <Bar dataKey="Royalty" fill="#6366f1" name="Royalty (₹L)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="PV" fill="#22c55e" name="PV (₹L)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── 5. Fixed Asset Register ───────────────────────────────────────────────────
function FixedAssetRegister() {
  const [assets, setAssets] = useState([
    { id: 1, name: "Office Building",    cost: 20000000, date: "2015-01-01", life: 40, type: "Building" },
    { id: 2, name: "Manufacturing Plant",cost: 8000000,  date: "2018-06-15", life: 15, type: "Machinery" },
    { id: 3, name: "Office Computers",   cost: 500000,   date: "2022-04-01", life: 5,  type: "Electronics" },
    { id: 4, name: "Company Car",        cost: 1200000,  date: "2021-07-01", life: 8,  type: "Vehicle" },
    { id: 5, name: "Furniture & Fixtures",cost: 800000,  date: "2020-01-01", life: 10, type: "Furniture" },
  ]);

  const currentYear = new Date().getFullYear();

  const enriched = useMemo(() => assets.map(a => {
    const age = currentYear - new Date(a.date).getFullYear();
    const depRate = 1 / a.life;
    const accDep = Math.min(a.cost * depRate * age, a.cost * 0.95);
    const wdv = Math.max(a.cost - accDep, a.cost * 0.05);
    return { ...a, age, accDep: Math.round(accDep), wdv: Math.round(wdv) };
  }), [assets, currentYear]);

  const totals = enriched.reduce((s, a) => ({
    cost: s.cost + a.cost, accDep: s.accDep + a.accDep, wdv: s.wdv + a.wdv,
  }), { cost: 0, accDep: 0, wdv: 0 });

  const addAsset = () => setAssets(p => [...p, { id: Date.now(), name: "New Asset", cost: 1000000, date: "2023-01-01", life: 10, type: "Machinery" }]);
  const removeAsset = (id: number) => setAssets(p => p.filter(a => a.id !== id));

  const exportExcel = () => {
    const rows = ["Asset Name,Cost,Date,Life,Age,Acc. Depreciation,WDV",
      ...enriched.map(a => `${a.name},${a.cost},${a.date},${a.life},${a.age},${a.accDep},${a.wdv}`)
    ].join("\n");
    const blob = new Blob([rows], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "fixed_asset_register.csv";
    link.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Gross Block", value: fmtCr(totals.cost), color: "text-blue-600" },
            { label: "Accumulated Dep.", value: fmtCr(totals.accDep), color: "text-red-500" },
            { label: "Net Block (WDV)", value: fmtCr(totals.wdv), color: "text-green-600" },
          ].map(c => (
            <div key={c.label} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-center">
              <p className="text-xs text-gray-500">{c.label}</p>
              <p className={`text-lg font-bold ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={addAsset} className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm">+ Add Asset</button>
          <button onClick={exportExcel} className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700">📥 Export CSV</button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>{["Asset Name", "Type", "Cost (₹)", "Date", "Life", "Age", "Acc. Dep (₹)", "WDV (₹)", ""].map(h =>
              <th key={h} className="px-2 py-2 text-left text-gray-500 font-semibold">{h}</th>)}
            </tr>
          </thead>
          <tbody>{enriched.map(a => (
            <tr key={a.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="px-2 py-1.5">
                <input value={a.name} onChange={e => setAssets(p => p.map(x => x.id === a.id ? { ...x, name: e.target.value } : x))}
                  className="w-32 border rounded px-1 py-0.5 text-xs dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </td>
              <td className="px-2 py-1.5">
                <select value={a.type} onChange={e => setAssets(p => p.map(x => x.id === a.id ? { ...x, type: e.target.value } : x))}
                  className="border rounded px-1 py-0.5 text-xs dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  {["Building", "Machinery", "Electronics", "Vehicle", "Furniture", "Land"].map(t => <option key={t}>{t}</option>)}
                </select>
              </td>
              <td className="px-2 py-1.5">
                <input type="number" value={a.cost} onChange={e => setAssets(p => p.map(x => x.id === a.id ? { ...x, cost: +e.target.value } : x))}
                  className="w-24 border rounded px-1 py-0.5 text-xs dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </td>
              <td className="px-2 py-1.5">
                <input type="date" value={a.date} onChange={e => setAssets(p => p.map(x => x.id === a.id ? { ...x, date: e.target.value } : x))}
                  className="border rounded px-1 py-0.5 text-xs dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </td>
              <td className="px-2 py-1.5">
                <input type="number" value={a.life} onChange={e => setAssets(p => p.map(x => x.id === a.id ? { ...x, life: +e.target.value } : x))}
                  className="w-12 border rounded px-1 py-0.5 text-xs dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </td>
              <td className="px-2 py-1.5 text-gray-600 dark:text-gray-300">{a.age}y</td>
              <td className="px-2 py-1.5 text-red-500 font-medium">{fmt(a.accDep)}</td>
              <td className="px-2 py-1.5 text-green-600 font-medium">{fmt(a.wdv)}</td>
              <td className="px-2 py-1.5">
                <button onClick={() => removeAsset(a.id)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
const TABS = [
  { key: "machinery", label: "⚙️ Machinery" },
  { key: "vehicle",   label: "🚗 Vehicle" },
  { key: "gold",      label: "💍 Jewellery & Gold" },
  { key: "ip",        label: "📜 IP / Patent" },
  { key: "far",       label: "📋 Asset Register" },
];

export default function AssetValuation() {
  const [tab, setTab] = useState("machinery");
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">💎 Asset & Property Valuation</h1>
            <p className="text-gray-500 text-sm mt-1">Machinery, Vehicles, Jewellery, IP, Fixed Asset Register</p>
          </div>
          <button onClick={() => { const d = new jsPDF(); d.text("Asset Valuation Report", 20, 20); d.text(`Date: ${new Date().toLocaleDateString("en-IN")}`, 20, 35); d.save("asset-valuation.pdf"); }}
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
          {tab === "machinery" && <MachineryValuation />}
          {tab === "vehicle"   && <VehicleValuation />}
          {tab === "gold"      && <JewelleryValuation />}
          {tab === "ip"        && <IPValuation />}
          {tab === "far"       && <FixedAssetRegister />}
        </motion.div>
      </div>
    </div>
  );
}
