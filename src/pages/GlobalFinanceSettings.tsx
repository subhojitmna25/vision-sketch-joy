import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

// ─── All Continent Presets ────────────────────────────────────────────────────
export interface RegionPreset {
  id: string;
  name: string;
  flag: string;
  continent: string;
  currency: string;
  currencySymbol: string;
  currencyCode: string;
  numberSystem: "western" | "indian" | "arabic" | "east-asian" | "custom";
  groupingSizes: number[];       // e.g. [3] for 1,000,000 or [3,2] for 10,00,000
  groupingSeparator: string;     // "," or "." or " " or "'"
  decimalSeparator: string;      // "." or ","
  symbolPosition: "before" | "after";
  symbolSpace: boolean;
  decimalPlaces: number;
  units: { value: number; label: string; shortLabel: string }[];
}

export const REGION_PRESETS: RegionPreset[] = [
  // ── SOUTH ASIA ──
  {
    id: "in", name: "India", flag: "🇮🇳", continent: "Asia",
    currency: "Indian Rupee", currencySymbol: "₹", currencyCode: "INR",
    numberSystem: "indian", groupingSizes: [3, 2], groupingSeparator: ",", decimalSeparator: ".",
    symbolPosition: "before", symbolSpace: false, decimalPlaces: 2,
    units: [
      { value: 1, label: "Rupees", shortLabel: "" },
      { value: 1000, label: "Thousands", shortLabel: "K" },
      { value: 100000, label: "Lakh", shortLabel: "L" },
      { value: 10000000, label: "Crore", shortLabel: "Cr" },
      { value: 1000000000, label: "Arab", shortLabel: "Ar" },
    ],
  },
  {
    id: "pk", name: "Pakistan", flag: "🇵🇰", continent: "Asia",
    currency: "Pakistani Rupee", currencySymbol: "₨", currencyCode: "PKR",
    numberSystem: "indian", groupingSizes: [3, 2], groupingSeparator: ",", decimalSeparator: ".",
    symbolPosition: "before", symbolSpace: false, decimalPlaces: 2,
    units: [
      { value: 1, label: "Rupees", shortLabel: "" },
      { value: 1000, label: "Thousands", shortLabel: "K" },
      { value: 100000, label: "Lakh", shortLabel: "L" },
      { value: 10000000, label: "Crore", shortLabel: "Cr" },
    ],
  },
  {
    id: "bd", name: "Bangladesh", flag: "🇧🇩", continent: "Asia",
    currency: "Bangladeshi Taka", currencySymbol: "৳", currencyCode: "BDT",
    numberSystem: "indian", groupingSizes: [3, 2], groupingSeparator: ",", decimalSeparator: ".",
    symbolPosition: "before", symbolSpace: false, decimalPlaces: 2,
    units: [
      { value: 1, label: "Taka", shortLabel: "" },
      { value: 100000, label: "Lakh", shortLabel: "L" },
      { value: 10000000, label: "Crore", shortLabel: "Cr" },
    ],
  },
  // ── AMERICAS ──
  {
    id: "us", name: "United States", flag: "🇺🇸", continent: "Americas",
    currency: "US Dollar", currencySymbol: "$", currencyCode: "USD",
    numberSystem: "western", groupingSizes: [3], groupingSeparator: ",", decimalSeparator: ".",
    symbolPosition: "before", symbolSpace: false, decimalPlaces: 2,
    units: [
      { value: 1, label: "Dollars", shortLabel: "" },
      { value: 1000, label: "Thousand", shortLabel: "K" },
      { value: 1000000, label: "Million", shortLabel: "M" },
      { value: 1000000000, label: "Billion", shortLabel: "B" },
      { value: 1000000000000, label: "Trillion", shortLabel: "T" },
    ],
  },
  {
    id: "ca", name: "Canada", flag: "🇨🇦", continent: "Americas",
    currency: "Canadian Dollar", currencySymbol: "C$", currencyCode: "CAD",
    numberSystem: "western", groupingSizes: [3], groupingSeparator: ",", decimalSeparator: ".",
    symbolPosition: "before", symbolSpace: false, decimalPlaces: 2,
    units: [
      { value: 1, label: "Dollars", shortLabel: "" },
      { value: 1000, label: "Thousand", shortLabel: "K" },
      { value: 1000000, label: "Million", shortLabel: "M" },
      { value: 1000000000, label: "Billion", shortLabel: "B" },
    ],
  },
  {
    id: "br", name: "Brazil", flag: "🇧🇷", continent: "Americas",
    currency: "Brazilian Real", currencySymbol: "R$", currencyCode: "BRL",
    numberSystem: "western", groupingSizes: [3], groupingSeparator: ".", decimalSeparator: ",",
    symbolPosition: "before", symbolSpace: true, decimalPlaces: 2,
    units: [
      { value: 1, label: "Reais", shortLabel: "" },
      { value: 1000, label: "Mil", shortLabel: "K" },
      { value: 1000000, label: "Milhão", shortLabel: "M" },
      { value: 1000000000, label: "Bilhão", shortLabel: "B" },
    ],
  },
  {
    id: "mx", name: "Mexico", flag: "🇲🇽", continent: "Americas",
    currency: "Mexican Peso", currencySymbol: "$", currencyCode: "MXN",
    numberSystem: "western", groupingSizes: [3], groupingSeparator: ",", decimalSeparator: ".",
    symbolPosition: "before", symbolSpace: false, decimalPlaces: 2,
    units: [
      { value: 1, label: "Pesos", shortLabel: "" },
      { value: 1000, label: "Mil", shortLabel: "K" },
      { value: 1000000, label: "Millón", shortLabel: "M" },
      { value: 1000000000, label: "Mil Millones", shortLabel: "B" },
    ],
  },
  // ── EUROPE ──
  {
    id: "eu", name: "Eurozone", flag: "🇪🇺", continent: "Europe",
    currency: "Euro", currencySymbol: "€", currencyCode: "EUR",
    numberSystem: "western", groupingSizes: [3], groupingSeparator: ".", decimalSeparator: ",",
    symbolPosition: "after", symbolSpace: true, decimalPlaces: 2,
    units: [
      { value: 1, label: "Euros", shortLabel: "" },
      { value: 1000, label: "Tausend", shortLabel: "Tsd" },
      { value: 1000000, label: "Million", shortLabel: "Mio" },
      { value: 1000000000, label: "Milliarde", shortLabel: "Mrd" },
    ],
  },
  {
    id: "gb", name: "United Kingdom", flag: "🇬🇧", continent: "Europe",
    currency: "British Pound", currencySymbol: "£", currencyCode: "GBP",
    numberSystem: "western", groupingSizes: [3], groupingSeparator: ",", decimalSeparator: ".",
    symbolPosition: "before", symbolSpace: false, decimalPlaces: 2,
    units: [
      { value: 1, label: "Pounds", shortLabel: "" },
      { value: 1000, label: "Thousand", shortLabel: "K" },
      { value: 1000000, label: "Million", shortLabel: "M" },
      { value: 1000000000, label: "Billion", shortLabel: "B" },
    ],
  },
  {
    id: "ch", name: "Switzerland", flag: "🇨🇭", continent: "Europe",
    currency: "Swiss Franc", currencySymbol: "CHF", currencyCode: "CHF",
    numberSystem: "western", groupingSizes: [3], groupingSeparator: "'", decimalSeparator: ".",
    symbolPosition: "before", symbolSpace: true, decimalPlaces: 2,
    units: [
      { value: 1, label: "Francs", shortLabel: "" },
      { value: 1000, label: "Thousand", shortLabel: "K" },
      { value: 1000000, label: "Million", shortLabel: "Mio" },
      { value: 1000000000, label: "Billion", shortLabel: "Mrd" },
    ],
  },
  // ── EAST ASIA ──
  {
    id: "jp", name: "Japan", flag: "🇯🇵", continent: "Asia",
    currency: "Japanese Yen", currencySymbol: "¥", currencyCode: "JPY",
    numberSystem: "east-asian", groupingSizes: [3], groupingSeparator: ",", decimalSeparator: ".",
    symbolPosition: "before", symbolSpace: false, decimalPlaces: 0,
    units: [
      { value: 1, label: "Yen", shortLabel: "" },
      { value: 10000, label: "Man (万)", shortLabel: "万" },
      { value: 100000000, label: "Oku (億)", shortLabel: "億" },
      { value: 1000000000000, label: "Chō (兆)", shortLabel: "兆" },
    ],
  },
  {
    id: "cn", name: "China", flag: "🇨🇳", continent: "Asia",
    currency: "Chinese Yuan", currencySymbol: "¥", currencyCode: "CNY",
    numberSystem: "east-asian", groupingSizes: [3], groupingSeparator: ",", decimalSeparator: ".",
    symbolPosition: "before", symbolSpace: false, decimalPlaces: 2,
    units: [
      { value: 1, label: "Yuan", shortLabel: "" },
      { value: 10000, label: "Wàn (万)", shortLabel: "万" },
      { value: 100000000, label: "Yì (亿)", shortLabel: "亿" },
    ],
  },
  {
    id: "kr", name: "South Korea", flag: "🇰🇷", continent: "Asia",
    currency: "Korean Won", currencySymbol: "₩", currencyCode: "KRW",
    numberSystem: "east-asian", groupingSizes: [3], groupingSeparator: ",", decimalSeparator: ".",
    symbolPosition: "before", symbolSpace: false, decimalPlaces: 0,
    units: [
      { value: 1, label: "Won", shortLabel: "" },
      { value: 10000, label: "Man-won (만원)", shortLabel: "만" },
      { value: 100000000, label: "Eok-won (억원)", shortLabel: "억" },
    ],
  },
  // ── MIDDLE EAST ──
  {
    id: "ae", name: "UAE", flag: "🇦🇪", continent: "Middle East",
    currency: "UAE Dirham", currencySymbol: "د.إ", currencyCode: "AED",
    numberSystem: "western", groupingSizes: [3], groupingSeparator: ",", decimalSeparator: ".",
    symbolPosition: "before", symbolSpace: true, decimalPlaces: 2,
    units: [
      { value: 1, label: "Dirhams", shortLabel: "" },
      { value: 1000, label: "Thousand", shortLabel: "K" },
      { value: 1000000, label: "Million", shortLabel: "M" },
      { value: 1000000000, label: "Billion", shortLabel: "B" },
    ],
  },
  {
    id: "sa", name: "Saudi Arabia", flag: "🇸🇦", continent: "Middle East",
    currency: "Saudi Riyal", currencySymbol: "﷼", currencyCode: "SAR",
    numberSystem: "western", groupingSizes: [3], groupingSeparator: ",", decimalSeparator: ".",
    symbolPosition: "before", symbolSpace: true, decimalPlaces: 2,
    units: [
      { value: 1, label: "Riyals", shortLabel: "" },
      { value: 1000, label: "Thousand", shortLabel: "K" },
      { value: 1000000, label: "Million", shortLabel: "M" },
      { value: 1000000000, label: "Billion", shortLabel: "B" },
    ],
  },
  // ── AFRICA ──
  {
    id: "ng", name: "Nigeria", flag: "🇳🇬", continent: "Africa",
    currency: "Nigerian Naira", currencySymbol: "₦", currencyCode: "NGN",
    numberSystem: "western", groupingSizes: [3], groupingSeparator: ",", decimalSeparator: ".",
    symbolPosition: "before", symbolSpace: false, decimalPlaces: 2,
    units: [
      { value: 1, label: "Naira", shortLabel: "" },
      { value: 1000, label: "Thousand", shortLabel: "K" },
      { value: 1000000, label: "Million", shortLabel: "M" },
      { value: 1000000000, label: "Billion", shortLabel: "B" },
    ],
  },
  {
    id: "za", name: "South Africa", flag: "🇿🇦", continent: "Africa",
    currency: "South African Rand", currencySymbol: "R", currencyCode: "ZAR",
    numberSystem: "western", groupingSizes: [3], groupingSeparator: " ", decimalSeparator: ",",
    symbolPosition: "before", symbolSpace: false, decimalPlaces: 2,
    units: [
      { value: 1, label: "Rand", shortLabel: "" },
      { value: 1000, label: "Thousand", shortLabel: "K" },
      { value: 1000000, label: "Million", shortLabel: "M" },
      { value: 1000000000, label: "Billion", shortLabel: "B" },
    ],
  },
  {
    id: "ke", name: "Kenya", flag: "🇰🇪", continent: "Africa",
    currency: "Kenyan Shilling", currencySymbol: "KSh", currencyCode: "KES",
    numberSystem: "western", groupingSizes: [3], groupingSeparator: ",", decimalSeparator: ".",
    symbolPosition: "before", symbolSpace: false, decimalPlaces: 2,
    units: [
      { value: 1, label: "Shillings", shortLabel: "" },
      { value: 1000, label: "Thousand", shortLabel: "K" },
      { value: 1000000, label: "Million", shortLabel: "M" },
    ],
  },
  // ── OCEANIA ──
  {
    id: "au", name: "Australia", flag: "🇦🇺", continent: "Oceania",
    currency: "Australian Dollar", currencySymbol: "A$", currencyCode: "AUD",
    numberSystem: "western", groupingSizes: [3], groupingSeparator: ",", decimalSeparator: ".",
    symbolPosition: "before", symbolSpace: false, decimalPlaces: 2,
    units: [
      { value: 1, label: "Dollars", shortLabel: "" },
      { value: 1000, label: "Thousand", shortLabel: "K" },
      { value: 1000000, label: "Million", shortLabel: "M" },
      { value: 1000000000, label: "Billion", shortLabel: "B" },
    ],
  },
  {
    id: "nz", name: "New Zealand", flag: "🇳🇿", continent: "Oceania",
    currency: "New Zealand Dollar", currencySymbol: "NZ$", currencyCode: "NZD",
    numberSystem: "western", groupingSizes: [3], groupingSeparator: ",", decimalSeparator: ".",
    symbolPosition: "before", symbolSpace: false, decimalPlaces: 2,
    units: [
      { value: 1, label: "Dollars", shortLabel: "" },
      { value: 1000, label: "Thousand", shortLabel: "K" },
      { value: 1000000, label: "Million", shortLabel: "M" },
    ],
  },
  // ── SOUTHEAST ASIA ──
  {
    id: "sg", name: "Singapore", flag: "🇸🇬", continent: "Asia",
    currency: "Singapore Dollar", currencySymbol: "S$", currencyCode: "SGD",
    numberSystem: "western", groupingSizes: [3], groupingSeparator: ",", decimalSeparator: ".",
    symbolPosition: "before", symbolSpace: false, decimalPlaces: 2,
    units: [
      { value: 1, label: "Dollars", shortLabel: "" },
      { value: 1000, label: "Thousand", shortLabel: "K" },
      { value: 1000000, label: "Million", shortLabel: "M" },
      { value: 1000000000, label: "Billion", shortLabel: "B" },
    ],
  },
  {
    id: "id", name: "Indonesia", flag: "🇮🇩", continent: "Asia",
    currency: "Indonesian Rupiah", currencySymbol: "Rp", currencyCode: "IDR",
    numberSystem: "western", groupingSizes: [3], groupingSeparator: ".", decimalSeparator: ",",
    symbolPosition: "before", symbolSpace: false, decimalPlaces: 0,
    units: [
      { value: 1, label: "Rupiah", shortLabel: "" },
      { value: 1000, label: "Ribu", shortLabel: "rb" },
      { value: 1000000, label: "Juta", shortLabel: "jt" },
      { value: 1000000000, label: "Miliar", shortLabel: "M" },
      { value: 1000000000000, label: "Triliun", shortLabel: "T" },
    ],
  },
];

// ─── Custom Format Settings ───────────────────────────────────────────────────
export interface CustomFormatSettings {
  displayUnit: number;           // e.g. 100000 for lakhs
  displayUnitLabel: string;      // e.g. "L" or "Cr" or "M"
  autoScale: boolean;            // auto pick best unit
  showFullNumber: boolean;
  compactThreshold: number;      // show compact above this value
}

// ─── Context Type ─────────────────────────────────────────────────────────────
interface GlobalFinanceContextType {
  preset: RegionPreset;
  setPreset: (preset: RegionPreset) => void;
  customSettings: CustomFormatSettings;
  setCustomSettings: (s: CustomFormatSettings) => void;
  // Formatting functions
  fmt: (value: number, options?: FormatOptions) => string;
  fmtCompact: (value: number) => string;
  fmtFull: (value: number) => string;
  fmtPercent: (value: number, decimals?: number) => string;
  getUnitLabel: (value: number) => string;
  symbol: string;
}

export interface FormatOptions {
  compact?: boolean;
  unit?: number;
  unitLabel?: string;
  showSymbol?: boolean;
  decimals?: number;
  forceSign?: boolean;
}

// ─── Core Formatting Logic ────────────────────────────────────────────────────
function applyGrouping(intStr: string, sizes: number[], sep: string): string {
  if (sizes.length === 1) {
    // Standard western: groups of 3
    return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
  }
  // Indian system: first group of 3, then groups of 2
  const chars = intStr.split("").reverse();
  const parts: string[] = [];
  let i = 0;
  let groupIndex = 0;
  const groupSize = (idx: number) => idx === 0 ? sizes[0] : sizes[Math.min(1, sizes.length - 1)];
  while (i < chars.length) {
    const g = groupSize(groupIndex);
    parts.push(chars.slice(i, i + g).join(""));
    i += g;
    groupIndex++;
  }
  return parts.join(sep).split("").reverse().join("");
}

function formatNumber(value: number, preset: RegionPreset, opts: FormatOptions = {}): string {
  const { showSymbol = true, decimals, forceSign = false } = opts;
  const dp = decimals !== undefined ? decimals : preset.decimalPlaces;
  const absVal = Math.abs(value);
  const sign = value < 0 ? "-" : forceSign && value > 0 ? "+" : "";

  const intPart = Math.floor(absVal);
  const decPart = dp > 0 ? (absVal - intPart).toFixed(dp).slice(1) : "";
  const intStr = applyGrouping(String(intPart), preset.groupingSizes, preset.groupingSeparator);
  const numStr = sign + intStr + (decPart ? preset.decimalSeparator + decPart.slice(1) : "");

  if (!showSymbol) return numStr;
  const sym = preset.currencySymbol;
  const space = preset.symbolSpace ? " " : "";
  return preset.symbolPosition === "before" ? sym + space + numStr : numStr + space + sym;
}

function getBestUnit(value: number, units: RegionPreset["units"]): { value: number; label: string; shortLabel: string } {
  const sorted = [...units].sort((a, b) => b.value - a.value);
  for (const u of sorted) {
    if (Math.abs(value) >= u.value && u.value > 1) return u;
  }
  return units[0];
}

function formatCompact(value: number, preset: RegionPreset, customSettings: CustomFormatSettings): string {
  const absVal = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  let unit: { value: number; shortLabel: string };
  if (customSettings.autoScale) {
    unit = getBestUnit(absVal, preset.units);
  } else {
    unit = { value: customSettings.displayUnit, shortLabel: customSettings.displayUnitLabel };
  }

  if (unit.value <= 1) {
    return formatNumber(value, preset);
  }

  const scaled = absVal / unit.value;
  const dp = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2;
  const num = scaled.toFixed(dp);
  const sym = preset.currencySymbol;
  const space = preset.symbolSpace ? " " : "";
  const numWithUnit = sign + num + " " + unit.shortLabel;

  return preset.symbolPosition === "before"
    ? sym + space + numWithUnit
    : numWithUnit + space + sym;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const GlobalFinanceContext = createContext<GlobalFinanceContextType | null>(null);

const DEFAULT_PRESET = REGION_PRESETS.find(p => p.id === "in")!;
const DEFAULT_CUSTOM: CustomFormatSettings = {
  displayUnit: 10000000,
  displayUnitLabel: "Cr",
  autoScale: true,
  showFullNumber: false,
  compactThreshold: 100000,
};

// Load from localStorage
function loadSaved(): { preset: RegionPreset; custom: CustomFormatSettings } {
  try {
    const savedId = localStorage.getItem("gf_preset_id");
    const savedCustom = localStorage.getItem("gf_custom");
    const preset = REGION_PRESETS.find(p => p.id === savedId) || DEFAULT_PRESET;
    const custom = savedCustom ? JSON.parse(savedCustom) : DEFAULT_CUSTOM;
    return { preset, custom };
  } catch {
    return { preset: DEFAULT_PRESET, custom: DEFAULT_CUSTOM };
  }
}

export function GlobalFinanceProvider({ children }: { children: ReactNode }) {
  const saved = loadSaved();
  const [preset, setPresetState] = useState<RegionPreset>(saved.preset);
  const [customSettings, setCustomSettingsState] = useState<CustomFormatSettings>(saved.custom);

  const setPreset = useCallback((p: RegionPreset) => {
    setPresetState(p);
    localStorage.setItem("gf_preset_id", p.id);
  }, []);

  const setCustomSettings = useCallback((s: CustomFormatSettings) => {
    setCustomSettingsState(s);
    localStorage.setItem("gf_custom", JSON.stringify(s));
  }, []);

  const fmt = useCallback((value: number, opts: FormatOptions = {}): string => {
    if (opts.compact || (customSettings.autoScale && Math.abs(value) >= customSettings.compactThreshold)) {
      return formatCompact(value, preset, customSettings);
    }
    return formatNumber(value, preset, opts);
  }, [preset, customSettings]);

  const fmtCompact = useCallback((value: number): string =>
    formatCompact(value, preset, customSettings), [preset, customSettings]);

  const fmtFull = useCallback((value: number): string =>
    formatNumber(value, preset, { showSymbol: true }), [preset]);

  const fmtPercent = useCallback((value: number, decimals = 2): string =>
    value.toFixed(decimals) + "%", []);

  const getUnitLabel = useCallback((value: number): string => {
    const unit = getBestUnit(value, preset.units);
    return unit.shortLabel || unit.label;
  }, [preset]);

  return (
    <GlobalFinanceContext.Provider value={{
      preset, setPreset, customSettings, setCustomSettings,
      fmt, fmtCompact, fmtFull, fmtPercent, getUnitLabel,
      symbol: preset.currencySymbol,
    }}>
      {children}
    </GlobalFinanceContext.Provider>
  );
}

export function useGlobalFinance() {
  const ctx = useContext(GlobalFinanceContext);
  if (!ctx) throw new Error("useGlobalFinance must be inside GlobalFinanceProvider");
  return ctx;
}
