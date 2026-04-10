import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const CATEGORIES = [
  { icon: "🏠", title: "Real Estate",         desc: "Residential, commercial & land valuation",    route: "/valuation/real-estate",     count: 5, color: "from-blue-500 to-blue-600" },
  { icon: "🏭", title: "Business & Company",  desc: "DCF, EBITDA multiples, asset-based methods",  route: "/valuation/business",         count: 5, color: "from-indigo-500 to-indigo-600" },
  { icon: "📈", title: "Stock & Equity",       desc: "Graham formula, DDM, FCF, peer comparison",   route: "/valuation/stock",            count: 5, color: "from-green-500 to-green-600" },
  { icon: "🚀", title: "Startup",              desc: "Berkus, Scorecard, VC method, Risk factor",   route: "/valuation/startup",          count: 5, color: "from-orange-500 to-orange-600" },
  { icon: "🏗️", title: "Infrastructure",      desc: "NPV/IRR, toll roads, power plants, solar",    route: "/valuation/infrastructure",   count: 5, color: "from-yellow-500 to-yellow-600" },
  { icon: "💎", title: "Assets & Property",   desc: "Machinery, vehicles, gold, IP, collectibles", route: "/valuation/assets",           count: 6, color: "from-purple-500 to-purple-600" },
  { icon: "🌾", title: "Agricultural Land",   desc: "Crop income, LARR Act, plantation value",     route: "/valuation/agriculture",      count: 5, color: "from-lime-500 to-lime-600" },
  { icon: "🏪", title: "Brand & Intangibles", desc: "Goodwill, brand, patents, customer base",     route: "/valuation/intangibles",      count: 5, color: "from-pink-500 to-pink-600" },
  { icon: "⚖️", title: "Legal & Court",       desc: "MACT, WC Act, stamp duty, compensation",     route: "/valuation/legal",            count: 5, color: "from-red-500 to-red-600" },
  { icon: "🔄", title: "Merger & Acquisition",desc: "Merger analysis, swap ratio, fairness opinion",route: "/valuation/merger",          count: 5, color: "from-teal-500 to-teal-600" },
  { icon: "📋", title: "Valuation Summary",   desc: "All saved valuations, certificates & reports", route: "/valuation/summary",         count: 3, color: "from-gray-500 to-gray-600" },
];

export default function ValuationHub() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center py-8">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-3">
              🏛️ Valuation Calculator Hub
            </h1>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Professional-grade valuation tools for every asset class —
              from real estate to startups, stocks to agricultural land.
            </p>
            <div className="flex justify-center gap-6 mt-6 text-sm text-gray-500">
              <span className="flex items-center gap-1">✅ <strong>11</strong> Categories</span>
              <span className="flex items-center gap-1">✅ <strong>55+</strong> Calculators</span>
              <span className="flex items-center gap-1">✅ PDF Export</span>
              <span className="flex items-center gap-1">✅ Indian Standards</span>
            </div>
          </motion.div>
        </div>

        {/* Category Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {CATEGORIES.map((cat, i) => (
            <motion.div key={cat.title}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => navigate(cat.route)}
              className="cursor-pointer group bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700">
              <div className={`h-2 bg-gradient-to-r ${cat.color}`} />
              <div className="p-5">
                <div className="text-4xl mb-3">{cat.icon}</div>
                <h3 className="font-bold text-gray-800 dark:text-white text-lg group-hover:text-indigo-600 transition-colors">
                  {cat.title}
                </h3>
                <p className="text-gray-500 text-sm mt-1 leading-relaxed">{cat.desc}</p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-full font-medium">
                    {cat.count} calculators
                  </span>
                  <span className="text-indigo-500 group-hover:translate-x-1 transition-transform text-lg">→</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick Access */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
          <h3 className="font-bold text-xl mb-2">🎯 Most Used Calculators</h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {[
              { label: "Ready Reckoner Valuation", route: "/valuation/real-estate" },
              { label: "Business DCF Valuation",   route: "/valuation/business" },
              { label: "Startup Berkus Method",    route: "/valuation/startup" },
              { label: "Stamp Duty Calculator",    route: "/valuation/legal" },
            ].map((q) => (
              <button key={q.label} onClick={() => navigate(q.route)}
                className="text-left p-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium transition-all">
                {q.label} →
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
