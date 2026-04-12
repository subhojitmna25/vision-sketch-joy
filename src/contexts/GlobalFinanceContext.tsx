import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, ChevronDown, ChevronRight, Settings, Check, X, RefreshCw, Sliders } from "lucide-react";
import { useGlobalFinance, REGION_PRESETS, RegionPreset, CustomFormatSettings } from "./GlobalFinanceContext";

// ─── Continent grouping ───────────────────────────────────────────────────────
const CONTINENTS = ["Asia", "Americas", "Europe", "Middle East", "Africa", "Oceania"];

// ─── Demo numbers to preview ──────────────────────────────────────────────────
const DEMO_NUMBERS = [
  1234,
  98765,
  1234567,
  98765432,
  1234567890,
  9876543210,
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function GlobalFinanceSettings() {
  const { preset, setPreset, customSettings, setCustomSettings, fmt, fmtFull, fmtCompact } = useGlobalFinance();
  const [activeContinent, setActiveContinent] = useState(preset.continent);
  const [tab, setTab] = useState<"region" | "format" | "units">("region");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return REGION_PRESETS.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.currencyCode.toLowerCase().includes(q) ||
      p.currency.toLowerCase().includes(q) ||
      p.currencySymbol.includes(q)
    );
  }, [search]);

  const byContinent = useMemo(() => {
    const map: Record<string, RegionPreset[]> = {};
    CONTINENTS.forEach(c => { map[c] = []; });
    filtered.forEach(p => {
      if (!map[p.continent]) map[p.continent] = [];
      map[p.continent].push(p);
    });
    return map;
  }, [filtered]);

  const handlePresetSelect = (p: RegionPreset) => {
    setPreset(p);
    // Reset custom unit to match new preset's largest unit
    const largestUnit = [...p.units].sort((a, b) => b.value - a.value)[0];
    setCustomSettings({
      ...customSettings,
      displayUnit: largestUnit.value,
      displayUnitLabel: largestUnit.shortLabel || largestUnit.label,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Globe className="text-indigo-500" size={24} />
            Global Finance Settings
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Configure currency, number format, and units for any region worldwide
          </p>
        </div>

        {/* Current Selection Banner */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-5 text-white flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-5xl">{preset.flag}</span>
            <div>
              <p className="font-bold text-xl">{preset.name}</p>
              <p className="text-indigo-200 text-sm">{preset.currency} · {preset.currencyCode} · {preset.currencySymbol}</p>
              <p className="text-indigo-200 text-xs mt-0.5">{preset.numberSystem} number system · {preset.continent}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-indigo-200 text-xs mb-1">Sample Preview</p>
            <div className="space-y-0.5">
              <p className="font-mono font-bold text-lg">{fmt(98765432)}</p>
              <p className="font-mono text-sm text-indigo-200">{fmtFull(1234567)}</p>
              <p className="font-mono text-sm text-indigo-200">{fmtCompact(9876543210)}</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 bg-white dark:bg-gray-800 p-1 rounded-xl w-fit shadow-sm">
          {[
            { key: "region", label: "🌍 Select Region", icon: Globe },
            { key: "format", label: "🔢 Number Format", icon: Settings },
            { key: "units",  label: "📐 Units & Scale",  icon: Sliders },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${tab === t.key ? "bg-indigo-600 text-white shadow" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB 1: Region Selector ── */}
        {tab === "region" && (
          <div className="grid md:grid-cols-3 gap-5">
            {/* Left: Continent + Search */}
            <div className="space-y-3">
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search country or currency..."
                className="w-full border rounded-xl px-4 py-2.5 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white" />

              {!search && (
                <div className="space-y-1">
                  {CONTINENTS.filter(c => byContinent[c]?.length > 0).map(c => (
                    <button key={c} onClick={() => setActiveContinent(c)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                        ${activeContinent === c ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
                      <span>{c}</span>
                      <span className="text-xs text-gray-400">{byContinent[c]?.length} regions</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Region Cards */}
            <div className="md:col-span-2">
              <div className="grid sm:grid-cols-2 gap-3">
                {(search ? filtered : (byContinent[activeContinent] || [])).map(p => (
                  <motion.button key={p.id} onClick={() => handlePresetSelect(p)}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className={`text-left p-4 rounded-xl border-2 transition-all
                      ${preset.id === p.id
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-300"}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{p.flag}</span>
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-white text-sm">{p.name}</p>
                          <p className="text-xs text-gray-500">{p.currencySymbol} · {p.currencyCode}</p>
                        </div>
                      </div>
                      {preset.id === p.id && <Check size={16} className="text-indigo-600 mt-1 shrink-0" />}
                    </div>
                    <div className="mt-2 pt-2 border-t dark:border-gray-700">
                      <p className="text-xs font-mono text-gray-600 dark:text-gray-400">
                        {p.currencySymbol}1{p.groupingSeparator}234{p.groupingSeparator === "." ? "" : ""}
                        {p.groupingSizes[0] === 3 && p.groupingSizes.length === 1 ? "000" : "00"}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{p.numberSystem} · {p.units.map(u => u.shortLabel || u.label.split(" ")[0]).filter(Boolean).join(" / ")}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: Number Format ── */}
        {tab === "format" && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="font-semibold text-gray-800 dark:text-white">⚙️ Format Configuration</h3>

              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Grouping Separator</label>
                <div className="flex gap-2">
                  {[",", ".", " ", "'"].map(s => (
                    <button key={s} onClick={() => setPreset({ ...preset, groupingSeparator: s })}
                      className={`px-4 py-2 rounded-lg border text-sm font-mono font-bold transition-all
                        ${preset.groupingSeparator === s ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
                      {s === " " ? "Space" : s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Decimal Separator</label>
                <div className="flex gap-2">
                  {[".", ","].map(s => (
                    <button key={s} onClick={() => setPreset({ ...preset, decimalSeparator: s })}
                      className={`px-4 py-2 rounded-lg border text-sm font-mono font-bold transition-all
                        ${preset.decimalSeparator === s ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Decimal Places</label>
                <div className="flex gap-2">
                  {[0, 1, 2, 3].map(d => (
                    <button key={d} onClick={() => setPreset({ ...preset, decimalPlaces: d })}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all
                        ${preset.decimalPlaces === d ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Symbol Position</label>
                <div className="flex gap-2">
                  {[{ v: "before", l: "Before (₹100)" }, { v: "after", l: "After (100€)" }].map(o => (
                    <button key={o.v} onClick={() => setPreset({ ...preset, symbolPosition: o.v as any })}
                      className={`px-4 py-2 rounded-lg border text-sm transition-all
                        ${preset.symbolPosition === o.v ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Symbol Space</label>
                <div className="flex gap-2">
                  {[{ v: false, l: "No Space (₹100)" }, { v: true, l: "Space (₹ 100)" }].map(o => (
                    <button key={String(o.v)} onClick={() => setPreset({ ...preset, symbolSpace: o.v })}
                      className={`px-4 py-2 rounded-lg border text-sm transition-all
                        ${preset.symbolSpace === o.v ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Grouping System</label>
                <div className="flex gap-2">
                  {[
                    { v: JSON.stringify([3]), l: "Western (1,000,000)" },
                    { v: JSON.stringify([3, 2]), l: "Indian (10,00,000)" },
                  ].map(o => (
                    <button key={o.v} onClick={() => setPreset({ ...preset, groupingSizes: JSON.parse(o.v) })}
                      className={`px-3 py-2 rounded-lg border text-xs transition-all
                        ${JSON.stringify(preset.groupingSizes) === o.v ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Custom Currency Symbol</label>
                <input value={preset.currencySymbol}
                  onChange={e => setPreset({ ...preset, currencySymbol: e.target.value })}
                  className="w-32 border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
            </div>

            {/* Preview */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-4">👁️ Live Preview</h3>
              <div className="space-y-3">
                {DEMO_NUMBERS.map(n => (
                  <div key={n} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <span className="text-xs text-gray-400 font-mono">{n.toLocaleString()}</span>
                    <div className="text-right">
                      <p className="font-bold text-gray-800 dark:text-white">{fmtCompact(n)}</p>
                      <p className="text-xs text-gray-400 font-mono">{fmtFull(n)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: Units & Scale ── */}
        {tab === "units" && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="font-semibold text-gray-800 dark:text-white">📐 Scale & Unit Settings</h3>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto Scale</p>
                  <p className="text-xs text-gray-400">Automatically pick best unit (K, L, Cr, M, B)</p>
                </div>
                <button onClick={() => setCustomSettings({ ...customSettings, autoScale: !customSettings.autoScale })}
                  className={`relative w-12 h-6 rounded-full transition-all ${customSettings.autoScale ? "bg-indigo-600" : "bg-gray-300"}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${customSettings.autoScale ? "left-7" : "left-1"}`} />
                </button>
              </div>

              {!customSettings.autoScale && (
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-2">Fixed Display Unit</label>
                  <div className="grid grid-cols-2 gap-2">
                    {preset.units.filter(u => u.value > 1).map(u => (
                      <button key={u.value} onClick={() => setCustomSettings({ ...customSettings, displayUnit: u.value, displayUnitLabel: u.shortLabel || u.label })}
                        className={`p-3 rounded-xl border text-sm transition-all text-left
                          ${customSettings.displayUnit === u.value ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-400 text-indigo-700 dark:text-indigo-300" : "border-gray-200 dark:border-gray-700 hover:border-indigo-300"}`}>
                        <p className="font-bold">{u.shortLabel || u.label}</p>
                        <p className="text-xs text-gray-400">{u.value.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{u.label}</p>
                      </button>
                    ))}
                    {/* Custom unit */}
                    <div className="p-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
                      <p className="text-xs text-gray-500 mb-1">Custom unit value</p>
                      <input type="number" value={customSettings.displayUnit}
                        onChange={e => setCustomSettings({ ...customSettings, displayUnit: +e.target.value })}
                        className="w-full border rounded px-2 py-1 text-xs dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                      <input value={customSettings.displayUnitLabel}
                        onChange={e => setCustomSettings({ ...customSettings, displayUnitLabel: e.target.value })}
                        placeholder="Label (e.g. K)"
                        className="w-full border rounded px-2 py-1 text-xs mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">
                  Compact Threshold (show compact above this)
                </label>
                <select value={customSettings.compactThreshold}
                  onChange={e => setCustomSettings({ ...customSettings, compactThreshold: +e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <option value={1000}>1,000 (Always compact)</option>
                  <option value={10000}>10,000</option>
                  <option value={100000}>1,00,000 (1 Lakh)</option>
                  <option value={1000000}>10,00,000 (10 Lakhs)</option>
                  <option value={10000000}>1,00,00,000 (1 Crore)</option>
                  <option value={999999999999}>Never compact</option>
                </select>
              </div>

              {/* Unit table for current preset */}
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-2">Units for {preset.name}</label>
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      {["Name", "Value", "Short Label", "Example"].map(h =>
                        <th key={h} className="px-2 py-1.5 text-left text-gray-500">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {preset.units.map((u, i) => (
                      <tr key={i} className="border-b dark:border-gray-700">
                        <td className="px-2 py-1.5 text-gray-700 dark:text-gray-300">{u.label}</td>
                        <td className="px-2 py-1.5 font-mono text-gray-500">{u.value.toLocaleString()}</td>
                        <td className="px-2 py-1.5 font-bold text-indigo-600">{u.shortLabel || "—"}</td>
                        <td className="px-2 py-1.5 font-mono text-gray-700 dark:text-gray-300">{fmtCompact(u.value * 123.45)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Side-by-side comparison */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-4">🔄 Format Comparison</h3>
              <div className="space-y-3">
                {DEMO_NUMBERS.map(n => (
                  <div key={n} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">Raw: {n}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-2">
                        <p className="text-xs text-gray-400 mb-1">Compact</p>
                        <p className="font-bold text-gray-800 dark:text-white text-sm">{fmtCompact(n)}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-2">
                        <p className="text-xs text-gray-400 mb-1">Full</p>
                        <p className="font-bold text-gray-800 dark:text-white text-sm">{fmtFull(n)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={() => {
                const original = REGION_PRESETS.find(p => p.id === preset.id);
                if (original) setPreset(original);
                setCustomSettings({ ...customSettings, autoScale: true });
              }}
                className="mt-4 w-full flex items-center justify-center gap-2 py-2 border rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                <RefreshCw size={14} /> Reset to Region Defaults
              </button>
            </div>
          </div>
        )}

        {/* Quick Switcher Footer */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 mb-3 uppercase">Quick Switch — Popular Regions</p>
          <div className="flex flex-wrap gap-2">
            {["in", "us", "gb", "eu", "ae", "sg", "au", "jp"].map(id => {
              const p = REGION_PRESETS.find(r => r.id === id)!;
              return (
                <button key={id} onClick={() => handlePresetSelect(p)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm transition-all border
                    ${preset.id === id ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-200 dark:border-gray-700 hover:border-indigo-300 text-gray-700 dark:text-gray-300"}`}>
                  <span>{p.flag}</span>
                  <span>{p.currencySymbol}</span>
                  <span className="text-xs opacity-75">{p.currencyCode}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Compact Currency Switcher (for navbar) ───────────────────────────────────
export function CurrencySwitcherButton() {
  const { preset, setPreset } = useGlobalFinance();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 transition-all">
        <span>{preset.flag}</span>
        <span className="font-medium">{preset.currencySymbol}</span>
        <span className="text-xs text-gray-400">{preset.currencyCode}</span>
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            className="absolute right-0 top-12 w-72 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
            <div className="p-3 border-b dark:border-gray-700 flex justify-between items-center">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Switch Currency</p>
              <button onClick={() => setOpen(false)}><X size={14} className="text-gray-400" /></button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {CONTINENTS.map(continent => {
                const regions = REGION_PRESETS.filter(p => p.continent === continent);
                if (!regions.length) return null;
                return (
                  <div key={continent}>
                    <p className="px-3 py-1.5 text-xs font-bold text-gray-400 uppercase bg-gray-50 dark:bg-gray-700">{continent}</p>
                    {regions.map(p => (
                      <button key={p.id} onClick={() => { setPreset(p); setOpen(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all
                          ${preset.id === p.id ? "bg-indigo-50 dark:bg-indigo-900/30" : ""}`}>
                        <div className="flex items-center gap-2">
                          <span>{p.flag}</span>
                          <div className="text-left">
                            <p className="text-sm text-gray-700 dark:text-gray-300">{p.name}</p>
                            <p className="text-xs text-gray-400">{p.currency}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-indigo-600">{p.currencySymbol}</p>
                          <p className="text-xs text-gray-400">{p.currencyCode}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
