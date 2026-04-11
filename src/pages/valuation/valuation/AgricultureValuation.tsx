import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import jsPDF from "jspdf";

const fmt = (n: number) => "₹" + Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
const fmtCr = (n: number) => n >= 10000000 ? "₹" + (n / 10000000).toFixed(2) + " Cr" : "₹" + (n / 100000).toFixed(2) + "L";

// ── 1. Agricultural Land Value ────────────────────────────────────────────────
function AgriLandValue() {
  const STATES = ["Andhra Pradesh", "Bihar", "Gujarat", "Haryana", "Karnataka", "Kerala",
    "Madhya Pradesh", "Maharashtra", "Odisha", "Punjab", "Rajasthan", "Tamil Nadu",
    "Telangana", "Uttar Pradesh", "West Bengal"];

  const BASE_RATES: Record<string, number> = {
    "Punjab": 8000000, "Haryana": 7000000, "Maharashtra": 5000000, "Gujarat": 4000000,
    "Karnataka": 3500000, "Tamil Nadu": 4500000, "Telangana": 3000000, "West Bengal": 2500000,
    "Andhra Pradesh": 2500000, "Kerala": 4000000, "Rajasthan": 1500000, "Madhya Pradesh": 1200000,
    "Uttar Pradesh": 2000000, "Bihar": 1800000, "Odisha": 1200000,
  };

  const [inp, setInp] = useState({
    state: "West Bengal", landType: "Irrigated", area: 2, areaUnit: "Acre",
    soilType: "Alluvial", water: "Canal", road: "State Road",
  });
  const set = (k: keyof typeof inp) => (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) =>
    setInp(p => ({ ...p, [k]: k === "area" ? +e.target.value : e.target.value }));

  const r = useMemo(() => {
    const basePerAcre = BASE_RATES[inp.state] || 2000000;
    const areaInAcres = inp.areaUnit === "Acre" ? inp.area : inp.areaUnit === "Hectare" ? inp.area * 2.47 : inp.area / 43560;

    const landAdj: Record<string, number> = { "Irrigated": 1.3, "Rainfed": 1.0, "Orchard": 1.5, "Fallow": 0.7 };
    const soilAdj: Record<string, number> = { "Black": 1.2, "Alluvial": 1.1, "Red": 1.0, "Laterite": 0.85 };
    const waterAdj: Record<string, number> = { "Canal": 1.3, "Borewell": 1.1, "River": 1.25, "Rain-fed": 0.9 };
    const roadAdj: Record<string, number> = { "Highway": 1.2, "State Road": 1.0, "Village Road": 0.85, "No Road": 0.7 };

    const adjRate = basePerAcre * (landAdj[inp.landType] || 1) * (soilAdj[inp.soilType] || 1) *
      (waterAdj[inp.water] || 1) * (roadAdj[inp.road] || 1);
    const marketValue = adjRate * areaInAcres;
    const rrValue = marketValue * 0.8;
    const stampDuty = rrValue * 0.06;
    const regFee = Math.min(rrValue * 0.01, 30000);
    return { adjRate: Math.round(adjRate), marketValue: Math.round(marketValue), rrValue: Math.round(rrValue), stampDuty: Math.round(stampDuty), regFee: Math.round(regFee), areaInAcres };
  }, [inp]);

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">State</label>
            <select value={inp.state} onChange={set("state")}
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              {STATES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Area</label>
              <input type="number" value={inp.area} step={0.5} onChange={set("area")}
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Unit</label>
              <select value={inp.areaUnit} onChange={set("areaUnit")}
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                {["Acre", "Hectare", "Sqft"].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>
          {[
            { label: "Land Type", key: "landType" as const, opts: ["Irrigated", "Rainfed", "Orchard", "Fallow"] },
            { label: "Soil Type", key: "soilType" as const, opts: ["Alluvial", "Black", "Red", "Laterite"] },
            { label: "Water Source", key: "water" as const, opts: ["Canal", "Borewell", "River", "Rain-fed"] },
            { label: "Road Access", key: "road" as const, opts: ["Highway", "State Road", "Village Road", "No Road"] },
          ].map(({ label, key, opts }) => (
            <div key={key}>
              <label className="text-xs text-gray-500 block mb-1">{label}</label>
              <select value={inp[key]} onChange={set(key)}
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                {opts.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-5 text-center">
            <p className="text-xs text-gray-500">Estimated Market Value</p>
            <p className="text-3xl font-extrabold text-green-700 dark:text-green-400 my-2">{fmtCr(r.marketValue)}</p>
            <p className="text-xs text-gray-500">@ {fmt(r.adjRate)} per acre · {r.areaInAcres.toFixed(2)} acres</p>
          </div>
          {[
            { label: "Ready Reckoner Value", value: fmtCr(r.rrValue), color: "text-blue-600" },
            { label: "Stamp Duty (6%)", value: fmt(r.stampDuty), color: "text-orange-500" },
            { label: "Registration Fee", value: fmt(r.regFee), color: "text-purple-600" },
            { label: "Total Transaction Cost", value: fmt(r.rrValue + r.stampDuty + r.regFee), color: "text-red-600" },
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

// ── 2. Crop Income Capitalization ─────────────────────────────────────────────
function CropIncomeCapitalization() {
  const CROPS: Record<string, { yield: number; price: number; cost: number }> = {
    "Rice/Paddy":   { yield: 25, price: 2200, cost: 35000 },
    "Wheat":        { yield: 20, price: 2200, cost: 28000 },
    "Sugarcane":    { yield: 400, price: 350, cost: 80000 },
    "Cotton":       { yield: 8, price: 6500, cost: 40000 },
    "Soybean":      { yield: 12, price: 4500, cost: 25000 },
    "Groundnut":    { yield: 15, price: 5000, cost: 35000 },
    "Vegetables":   { yield: 100, price: 1500, cost: 60000 },
    "Banana":       { yield: 300, price: 1200, cost: 90000 },
  };

  const [crop, setCrop] = useState("Rice/Paddy");
  const [area, setArea] = useState(2);
  const [capRate, setCapRate] = useState(6);
  const [custom, setCustom] = useState({ yield: 0, price: 0, cost: 0, useCustom: false });

  const data = custom.useCustom ? custom : CROPS[crop];

  const r = useMemo(() => {
    const grossRevenue = data.yield * data.price * area;
    const inputCosts = data.cost * area;
    const netIncome = grossRevenue - inputCosts;
    const landValue = netIncome / (capRate / 100);
    const chartData = [5, 6, 7, 8, 9].map(r => ({
      rate: r + "%", value: Math.round(netIncome / (r / 100) / 100000),
    }));
    return { grossRevenue, inputCosts, netIncome, landValue, chartData };
  }, [data, area, capRate, custom]);

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Crop Type</label>
            <select value={crop} onChange={e => setCrop(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              {Object.keys(CROPS).map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Area (Acres)</label>
            <input type="number" value={area} step={0.5} onChange={e => setArea(+e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Capitalization Rate (%)</label>
            <input type="range" min={3} max={12} step={0.5} value={capRate} onChange={e => setCapRate(+e.target.value)}
              className="w-full accent-indigo-600" />
            <p className="text-xs text-indigo-600 font-medium text-right">{capRate}%</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-xs text-gray-600 dark:text-gray-300 space-y-1">
            <p>📊 Default values for {crop}:</p>
            <p>Yield: {CROPS[crop]?.yield} qtl/acre · Price: ₹{CROPS[crop]?.price}/qtl · Cost: ₹{CROPS[crop]?.cost}/acre</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="bg-lime-50 dark:bg-lime-900/20 rounded-xl p-5 text-center">
            <p className="text-xs text-gray-500">Capitalized Land Value</p>
            <p className="text-3xl font-extrabold text-lime-700 dark:text-lime-400 my-2">{fmtCr(r.landValue)}</p>
            <p className="text-xs text-gray-500">{fmtCr(r.landValue / area)} per acre</p>
          </div>
          {[
            { label: "Gross Revenue", value: fmt(r.grossRevenue), color: "text-green-600" },
            { label: "Less: Input Costs", value: `-${fmt(r.inputCosts)}`, color: "text-red-500" },
            { label: "Net Farm Income", value: fmt(r.netIncome), color: "text-blue-600" },
            { label: `÷ Cap Rate (${capRate}%)`, value: "= Land Value", color: "text-gray-500" },
          ].map(c => (
            <div key={c.label} className="flex justify-between p-2.5 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-300">{c.label}</span>
              <span className={`font-bold ${c.color}`}>{c.value}</span>
            </div>
          ))}
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={r.chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="rate" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => v + "L"} />
              <Tooltip formatter={(v: number) => `₹${v}L`} />
              <Bar dataKey="value" fill="#84cc16" name="Land Value (₹L)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── 3. LARR Act Compensation ──────────────────────────────────────────────────
function LARRCompensation() {
  const [inp, setInp] = useState({ marketValue: 2000000, area: 1, areaType: "Rural", purpose: "Government", urgency: false });
  const set = (k: keyof typeof inp) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setInp(p => ({ ...p, [k]: k === "marketValue" || k === "area" ? +e.target.value : k === "urgency" ? (e.target as HTMLInputElement).checked : e.target.value }));

  const r = useMemo(() => {
    const totalMarket = inp.marketValue * inp.area;
    const solatiumPct = inp.areaType === "Rural" ? 100 : 30;
    const solatium = totalMarket * solatiumPct / 100;
    const annuity = inp.areaType === "Rural" ? totalMarket * 0.12 : 0;
    const interestOnDelay = totalMarket * 0.09;
    const urgencyMultiplier = inp.urgency ? totalMarket * 0.2 : 0;
    const totalCompensation = totalMarket + solatium + annuity + interestOnDelay + urgencyMultiplier;
    const rows = [
      { item: "Market Value of Land", amount: totalMarket },
      { item: `Solatium (${solatiumPct}%)`, amount: solatium },
      { item: "Annual Annuity (12% for Rural)", amount: annuity },
      { item: "Interest on Delayed Payment (9%)", amount: interestOnDelay },
      { item: "Urgency Clause Premium (20%)", amount: urgencyMultiplier },
    ];
    return { totalMarket, solatium, annuity, interestOnDelay, urgencyMultiplier, totalCompensation, rows };
  }, [inp]);

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
            <p className="text-xs text-orange-700 dark:text-orange-300 font-medium">📋 As per LARR Act, 2013</p>
            <p className="text-xs text-gray-500 mt-1">Right to Fair Compensation and Transparency in Land Acquisition, Rehabilitation and Resettlement Act, 2013</p>
          </div>
          {[
            { label: "Market Value per Acre (₹)", key: "marketValue" as const, step: 100000 },
            { label: "Area (Acres)", key: "area" as const, step: 0.5 },
          ].map(({ label, key, step }) => (
            <div key={key}>
              <label className="text-xs text-gray-500 block mb-1">{label}</label>
              <input type="number" value={inp[key] as number} step={step} onChange={set(key)}
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          ))}
          {[
            { label: "Area Type", key: "areaType" as const, opts: ["Rural", "Urban", "Semi-Urban"] },
            { label: "Acquiring Authority", key: "purpose" as const, opts: ["Government", "PPP Project", "Private"] },
          ].map(({ label, key, opts }) => (
            <div key={key}>
              <label className="text-xs text-gray-500 block mb-1">{label}</label>
              <select value={inp[key] as string} onChange={set(key)}
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                {opts.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={inp.urgency} onChange={set("urgency")} id="urgency" />
            <label htmlFor="urgency" className="text-sm text-gray-600 dark:text-gray-300">Urgency Clause Applied</label>
          </div>
        </div>
        <div className="space-y-3">
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-5 text-center">
            <p className="text-xs text-gray-500">Total LARR Compensation</p>
            <p className="text-3xl font-extrabold text-orange-700 dark:text-orange-400 my-2">{fmtCr(r.totalCompensation)}</p>
            <p className="text-xs text-gray-500">Multiplier: {(r.totalCompensation / r.totalMarket).toFixed(2)}x of market value</p>
          </div>
          <div className="space-y-2">
            {r.rows.map((row, i) => (
              <div key={i} className="flex justify-between p-2.5 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-300">{row.item}</span>
                <span className={`font-bold ${row.amount > 0 ? "text-green-600" : "text-gray-400"}`}>{row.amount > 0 ? fmt(row.amount) : "N/A"}</span>
              </div>
            ))}
            <div className="flex justify-between p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg border border-orange-200">
              <span className="font-bold text-orange-800 dark:text-orange-300">Total Compensation</span>
              <span className="font-extrabold text-orange-700 dark:text-orange-400">{fmt(r.totalCompensation)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 4. Plantation Valuation ───────────────────────────────────────────────────
function PlantationValuation() {
  const PLANTATIONS: Record<string, { yieldPerAcre: number; price: number; life: number; replantCost: number }> = {
    "Tea":     { yieldPerAcre: 800,  price: 150,  life: 50, replantCost: 200000 },
    "Coffee":  { yieldPerAcre: 600,  price: 200,  life: 40, replantCost: 180000 },
    "Rubber":  { yieldPerAcre: 400,  price: 180,  life: 30, replantCost: 150000 },
    "Coconut": { yieldPerAcre: 6000, price: 25,   life: 60, replantCost: 100000 },
    "Mango":   { yieldPerAcre: 5000, price: 30,   life: 40, replantCost: 120000 },
    "Cashew":  { yieldPerAcre: 500,  price: 180,  life: 35, replantCost: 80000  },
  };

  const [type, setType] = useState("Tea");
  const [inp, setInp] = useState({ area: 5, age: 10, opexPct: 40, discountRate: 8, landValue: 500000 });
  const set = (k: keyof typeof inp) => (e: React.ChangeEvent<HTMLInputElement>) => setInp(p => ({ ...p, [k]: +e.target.value }));

  const r = useMemo(() => {
    const p = PLANTATIONS[type];
    const remainingLife = p.life - inp.age;
    const annualRev = p.yieldPerAcre * p.price * inp.area;
    const annualOpex = annualRev * inp.opexPct / 100;
    const annualNOI = annualRev - annualOpex;
    const pvNOI = annualNOI * (1 - Math.pow(1 + inp.discountRate / 100, -remainingLife)) / (inp.discountRate / 100);
    const pvReplant = p.replantCost * inp.area / Math.pow(1 + inp.discountRate / 100, remainingLife);
    const plantationValue = pvNOI - pvReplant;
    const totalValue = plantationValue + inp.landValue * inp.area;
    return { annualRev, annualNOI, pvNOI, pvReplant, plantationValue, totalValue, remainingLife };
  }, [type, inp]);

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Plantation Type</label>
            <select value={type} onChange={e => setType(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              {Object.keys(PLANTATIONS).map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          {[
            { label: "Area (Acres)", key: "area" as const, step: 0.5 },
            { label: "Age of Plantation (years)", key: "age" as const, step: 1 },
            { label: "Operating Expenses (% of Revenue)", key: "opexPct" as const, step: 1 },
            { label: "Discount Rate (%)", key: "discountRate" as const, step: 0.5 },
            { label: "Land Value per Acre (₹)", key: "landValue" as const, step: 50000 },
          ].map(({ label, key, step }) => (
            <div key={key}>
              <label className="text-xs text-gray-500 block mb-1">{label}</label>
              <input type="number" value={inp[key]} step={step} onChange={set(key)}
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          ))}
          <div className="p-3 bg-lime-50 dark:bg-lime-900/20 rounded-xl text-xs text-gray-600 dark:text-gray-300">
            <p>Yield: {PLANTATIONS[type]?.yieldPerAcre} kg/acre · Price: ₹{PLANTATIONS[type]?.price}/kg</p>
            <p>Remaining life: {r.remainingLife} years</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="bg-lime-50 dark:bg-lime-900/20 rounded-xl p-5 text-center">
            <p className="text-xs text-gray-500">Total Plantation Value</p>
            <p className="text-3xl font-extrabold text-lime-700 dark:text-lime-400 my-2">{fmtCr(r.totalValue)}</p>
          </div>
          {[
            { label: "Annual Revenue", value: fmt(r.annualRev), color: "text-green-600" },
            { label: "Annual Net Income (NOI)", value: fmt(r.annualNOI), color: "text-blue-600" },
            { label: "PV of Future NOI", value: fmtCr(r.pvNOI), color: "text-indigo-600" },
            { label: "Less: PV of Replanting Cost", value: `-${fmtCr(r.pvReplant)}`, color: "text-red-500" },
            { label: "Plantation Value", value: fmtCr(r.plantationValue), color: "text-green-600" },
            { label: "+ Land Value", value: fmtCr(inp.landValue * inp.area), color: "text-blue-600" },
          ].map(c => (
            <div key={c.label} className="flex justify-between p-2.5 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-300">{c.label}</span>
              <span className={`font-bold ${c.color}`}>{c.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 5. Land Development Potential ─────────────────────────────────────────────
function LandDevelopmentPotential() {
  const [inp, setInp] = useState({ agriValue: 1500000, distanceFromCity: 15, zoning: "Agricultural", fsi: 1.0, area: 1 });
  const set = (k: keyof typeof inp) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setInp(p => ({ ...p, [k]: k === "zoning" ? e.target.value : +e.target.value }));

  const r = useMemo(() => {
    const distanceFactor = Math.max(1 - inp.distanceFromCity * 0.03, 0.3);
    const zoningMultiplier = inp.zoning === "Agricultural" ? 1.0 : inp.zoning === "NA Plot" ? 2.5 : inp.zoning === "Residential" ? 3.5 : 4.5;
    const developedValue = inp.agriValue * zoningMultiplier * distanceFactor;
    const devPremium = developedValue - inp.agriValue;
    const builtupArea = inp.area * 43560 * inp.fsi;
    const saleRatePerSqft = developedValue / (inp.area * 43560);
    const grossDevValue = builtupArea * saleRatePerSqft;
    return { developedValue, devPremium, devPremiumPct: (devPremium / inp.agriValue) * 100, builtupArea, grossDevValue };
  }, [inp]);

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          {[
            { label: "Current Agricultural Value per Acre (₹)", key: "agriValue" as const, step: 100000 },
            { label: "Area (Acres)", key: "area" as const, step: 0.5 },
            { label: "Distance from City Center (km)", key: "distanceFromCity" as const, step: 1 },
            { label: "Applicable FSI / FAR", key: "fsi" as const, step: 0.25 },
          ].map(({ label, key, step }) => (
            <div key={key}>
              <label className="text-xs text-gray-500 block mb-1">{label}</label>
              <input type="number" value={inp[key] as number} step={step} onChange={set(key)}
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          ))}
          <div>
            <label className="text-xs text-gray-500 block mb-1">Current Zoning Status</label>
            <select value={inp.zoning} onChange={set("zoning")}
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              {["Agricultural", "NA Plot", "Residential", "Commercial"].map(z => <option key={z}>{z}</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-3">
          {[
            { label: "Current Agri Value (total)", value: fmtCr(inp.agriValue * inp.area), color: "text-gray-600 dark:text-gray-300" },
            { label: "Potential Developed Value", value: fmtCr(r.developedValue * inp.area), color: "text-green-600" },
            { label: "Development Premium", value: fmtCr(r.devPremium * inp.area), color: "text-blue-600" },
            { label: "Premium % over Agri Value", value: r.devPremiumPct.toFixed(0) + "%", color: "text-purple-600" },
            { label: "Potential Builtup Area", value: r.builtupArea.toLocaleString("en-IN", { maximumFractionDigits: 0 }) + " sqft", color: "text-indigo-600" },
            { label: "Gross Development Value", value: fmtCr(r.grossDevValue), color: "text-orange-600" },
          ].map(c => (
            <div key={c.label} className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-300">{c.label}</span>
              <span className={`font-bold ${c.color}`}>{c.value}</span>
            </div>
          ))}
          <div className={`p-4 rounded-xl text-center font-semibold ${r.devPremiumPct > 100 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
            {r.devPremiumPct > 200 ? "🏆 High Development Potential" : r.devPremiumPct > 100 ? "✅ Good Development Potential" : "⚠️ Moderate Potential"}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
const TABS = [
  { key: "land",       label: "🌾 Land Value" },
  { key: "crop",       label: "🌾 Crop Income" },
  { key: "larr",       label: "⚖️ LARR Act" },
  { key: "plantation", label: "🌴 Plantation" },
  { key: "dev",        label: "🏗️ Dev. Potential" },
];

export default function AgricultureValuation() {
  const [tab, setTab] = useState("land");
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🌾 Agricultural Land Valuation</h1>
            <p className="text-gray-500 text-sm mt-1">Land Value, Crop Capitalization, LARR Act, Plantation, Development Potential</p>
          </div>
          <button onClick={() => { const d = new jsPDF(); d.text("Agricultural Valuation Report", 20, 20); d.text(`Date: ${new Date().toLocaleDateString("en-IN")}`, 20, 35); d.save("agri-valuation.pdf"); }}
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
          {tab === "land"       && <AgriLandValue />}
          {tab === "crop"       && <CropIncomeCapitalization />}
          {tab === "larr"       && <LARRCompensation />}
          {tab === "plantation" && <PlantationValuation />}
          {tab === "dev"        && <LandDevelopmentPotential />}
        </motion.div>
      </div>
    </div>
  );
}
