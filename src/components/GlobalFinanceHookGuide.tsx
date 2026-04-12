/**
 * GLOBAL FINANCE HOOK — Drop-in replacement for all hardcoded fmt/fmtCr functions
 * 
 * HOW TO USE IN ALL YOUR EXISTING PAGES:
 * 
 * Step 1: Import the hook at top of any page
 *   import { useGlobalFinance } from "../context/GlobalFinanceContext";
 * 
 * Step 2: Inside your component, call the hook
 *   const { fmt, fmtCompact, fmtFull, fmtPercent, symbol, preset } = useGlobalFinance();
 * 
 * Step 3: Replace old hardcoded formatters with the hook functions:
 * 
 *   OLD:  const fmt = (n) => "₹" + n.toLocaleString("en-IN");
 *   NEW:  const { fmt } = useGlobalFinance();
 * 
 *   OLD:  const fmtCr = (n) => "₹" + (n/10000000).toFixed(2) + " Cr";
 *   NEW:  const { fmtCompact } = useGlobalFinance();
 * 
 *   OLD:  "₹" + value
 *   NEW:  fmt(value)
 * 
 *   OLD:  fmtCr(someValue)
 *   NEW:  fmtCompact(someValue)
 * 
 *   OLD:  value.toFixed(2) + "%"
 *   NEW:  fmtPercent(value)
 * 
 *   OLD:  "₹" (hardcoded symbol)
 *   NEW:  symbol  (from hook, changes with region)
 * 
 * ─────────────────────────────────────────────────────────────────────────────
 * 
 * EXAMPLES:
 * 
 * // In RealEstateValuation.tsx:
 * function SalesComparison() {
 *   const { fmt, fmtCompact, preset } = useGlobalFinance();
 *   // Now fmt(1234567) returns "₹12.35L" for India or "$1.23M" for USA
 *   // fmtCompact(98765432) returns "₹9.88Cr" for India or "$98.77M" for USA
 * }
 * 
 * // In BusinessValuation.tsx:
 * function DCFMethod() {
 *   const { fmtCompact, fmtPercent, symbol } = useGlobalFinance();
 *   return <p>Enterprise Value: {fmtCompact(enterpriseValue * 10000000)}</p>
 * }
 * 
 * // In LBOAnalyzer.tsx:
 * export default function LBOAnalyzer() {
 *   const { fmt, fmtCompact, fmtPercent } = useGlobalFinance();
 *   // Replace fmt(r.entryEV) etc. — all work globally now
 * }
 * 
 * ─────────────────────────────────────────────────────────────────────────────
 * AVAILABLE FUNCTIONS:
 * 
 * fmt(value, options?)
 *   → Smart formatter: compact if large, full if small
 *   → Options: { compact, unit, showSymbol, decimals, forceSign }
 * 
 * fmtCompact(value)
 *   → Always compact: "₹12.5Cr" / "$12.5M" / "€12.5Mio"
 * 
 * fmtFull(value)
 *   → Always full: "₹12,50,00,000" / "$12,500,000" / "€12.500.000"
 * 
 * fmtPercent(value, decimals?)
 *   → "12.50%" (works the same globally)
 * 
 * getUnitLabel(value)
 *   → "Cr" for India / "M" for USA / "亿" for China
 * 
 * symbol
 *   → "₹" / "$" / "€" / "£" etc.
 * 
 * preset
 *   → Full preset object with all region info
 * 
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Quick replacement map for all your existing files ────────────────────────

export const REPLACEMENT_GUIDE = `
FILES TO UPDATE:
================

1. RealEstateValuation.tsx
   - Remove: const fmt = (n) => "₹" + ...
   - Remove: const fmtL = ...
   - Remove: const fmtCr = ...
   - Add at top of file: import { useGlobalFinance } from "../context/GlobalFinanceContext";
   - Add inside each component: const { fmt, fmtCompact, fmtFull } = useGlobalFinance();

2. BusinessValuation.tsx
   - Same pattern as above

3. StockValuation.tsx
   - Same pattern as above

4. StartupValuation.tsx  
   - For fmtL (lakh), use fmtCompact — it auto-picks lakh for Indian preset
   - For fmtCr, use fmtCompact

5. InfrastructureValuation.tsx
   - Same pattern
   - For pct(), use fmtPercent()

6. AssetValuation.tsx
   - Same pattern
   - fmt stays the same, replace fmtCr with fmtCompact

7. AgricultureValuation.tsx
   - Same pattern

8. IntangibleValuation.tsx
   - Same pattern

9. LBOAnalyzer.tsx
   - Replace: const fmt = (n) => "₹" + ...
   - Replace: const fmtX = (n) => n.toFixed(2) + "x"  (keep this one, it's fine)

10. InvestmentAnalyzer.tsx
    - Same pattern

11. FinancialCalculators.tsx
    - Same pattern

12. BankAnalyzer.tsx
    - Replace: const fmt = (n) => "₹" + ...
    - All fmt() calls will now work globally
`;

// ─── Wrapper component example showing global context usage ──────────────────
import React from "react";
import { useGlobalFinance } from "./GlobalFinanceContext";

/**
 * Example: A KPI card that works for ANY region
 * Numbers automatically format based on selected region
 */
export function GlobalKPICard({
  title, value, change, icon
}: {
  title: string;
  value: number;
  change?: number;
  icon?: string;
}) {
  const { fmt, fmtPercent, symbol } = useGlobalFinance();
  const isPositive = (change ?? 0) >= 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500">{title}</p>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
      <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{fmt(value)}</p>
      {change !== undefined && (
        <p className={`text-xs mt-1 ${isPositive ? "text-green-600" : "text-red-500"}`}>
          {isPositive ? "▲" : "▼"} {fmtPercent(Math.abs(change))} vs last month
        </p>
      )}
    </div>
  );
}

/**
 * Example: An input that shows currency symbol from current region
 */
export function CurrencyInput({
  value, onChange, label, step = 1000
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  step?: number;
}) {
  const { symbol, preset } = useGlobalFinance();
  return (
    <div>
      <label className="text-xs text-gray-500 block mb-1">{label}</label>
      <div className="relative">
        {preset.symbolPosition === "before" && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">{symbol}</span>
        )}
        <input
          type="number"
          value={value}
          step={step}
          onChange={e => onChange(+e.target.value)}
          className={`w-full border rounded-lg py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white
            ${preset.symbolPosition === "before" ? "pl-8 pr-3" : "pl-3 pr-8"}`}
        />
        {preset.symbolPosition === "after" && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">{symbol}</span>
        )}
      </div>
    </div>
  );
}

/**
 * Example: Table cell with proper formatting
 */
export function MoneyCell({ value, positive }: { value: number; positive?: boolean }) {
  const { fmt } = useGlobalFinance();
  const color = positive === undefined ? "text-gray-800 dark:text-white" : positive ? "text-green-600" : "text-red-500";
  return <span className={`font-semibold ${color}`}>{fmt(value)}</span>;
}
