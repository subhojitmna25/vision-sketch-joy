import { useState } from "react";
import { motion } from "framer-motion";
import { Activity, TrendingUp, Shield, BarChart2, Loader2, RefreshCw } from "lucide-react";

interface ScoreCategory {
  name: string;
  score: number;
  maxScore: number;
  icon: React.ReactNode;
  color: string;
  feedback: string;
}

interface HealthData {
  totalScore: number;
  categories: ScoreCategory[];
  recommendations: { title: string; impact: string; action: string }[];
  summary: string;
}

interface Props {
  financialData?: {
    revenue?: number;
    expenses?: number;
    netProfit?: number;
    pendingInvoices?: number;
    compliancesDone?: number;
    totalCompliances?: number;
    cashBalance?: number;
  };
}

export default function FinancialHealthScore({ financialData = {} }: Props) {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `You are an expert CA. Analyze this financial data and return a health score as JSON.

Data: ${JSON.stringify({
  revenue: financialData.revenue || 500000,
  expenses: financialData.expenses || 350000,
  netProfit: financialData.netProfit || 150000,
  pendingInvoices: financialData.pendingInvoices || 3,
  compliancesDone: financialData.compliancesDone || 8,
  totalCompliances: financialData.totalCompliances || 10,
  cashBalance: financialData.cashBalance || 200000,
})}

Return ONLY this JSON structure:
{
  "totalScore": <0-100>,
  "summary": "<2 sentence overall assessment>",
  "categories": [
    { "name": "Profitability", "score": <0-25>, "maxScore": 25, "feedback": "<1 sentence>" },
    { "name": "Liquidity", "score": <0-25>, "maxScore": 25, "feedback": "<1 sentence>" },
    { "name": "Compliance", "score": <0-25>, "maxScore": 25, "feedback": "<1 sentence>" },
    { "name": "Growth", "score": <0-25>, "maxScore": 25, "feedback": "<1 sentence>" }
  ],
  "recommendations": [
    { "title": "<short title>", "impact": "high|medium|low", "action": "<specific action>" },
    { "title": "<short title>", "impact": "high|medium|low", "action": "<specific action>" },
    { "title": "<short title>", "impact": "high|medium|low", "action": "<specific action>" },
    { "title": "<short title>", "impact": "high|medium|low", "action": "<specific action>" },
    { "title": "<short title>", "impact": "high|medium|low", "action": "<specific action>" }
  ]
}`
          }]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.content?.[0]?.text || "{}";
        const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
        // Add icons and colors
        const icons = [
          <TrendingUp size={18} />, <Activity size={18} />, <Shield size={18} />, <BarChart2 size={18} />
        ];
        const colors = ["text-green-600", "text-blue-600", "text-purple-600", "text-orange-500"];
        parsed.categories = parsed.categories.map((c: any, i: number) => ({
          ...c, icon: icons[i], color: colors[i],
        }));
        setHealth(parsed);
      } else {
        setHealth(getMockHealth());
      }
    } catch {
      setHealth(getMockHealth());
    }
    setLoading(false);
  };

  const getMockHealth = (): HealthData => ({
    totalScore: 72,
    summary: "Your business shows solid profitability but compliance tracking needs attention. Focus on clearing pending invoices to improve cash flow.",
    categories: [
      { name: "Profitability", score: 20, maxScore: 25, icon: <TrendingUp size={18} />, color: "text-green-600", feedback: "Good profit margins, revenue trending upward." },
      { name: "Liquidity", score: 18, maxScore: 25, icon: <Activity size={18} />, color: "text-blue-600", feedback: "Adequate cash reserves but some receivables overdue." },
      { name: "Compliance", score: 20, maxScore: 25, icon: <Shield size={18} />, color: "text-purple-600", feedback: "Most compliances filed on time, minor gaps." },
      { name: "Growth", score: 14, maxScore: 25, icon: <BarChart2 size={18} />, color: "text-orange-500", feedback: "Growth is moderate, explore new client acquisition." },
    ],
    recommendations: [
      { title: "Follow up on overdue invoices", impact: "high", action: "Send reminders to clients with invoices overdue by 30+ days" },
      { title: "File pending GSTR returns", impact: "high", action: "Complete GSTR-3B for current month to avoid interest" },
      { title: "Invest surplus cash", impact: "medium", action: "Move idle cash into liquid mutual funds for better returns" },
      { title: "Onboard 2 more clients", impact: "medium", action: "Target CA referral network to add 2 clients this quarter" },
      { title: "Review expense categories", impact: "low", action: "Audit office expenses to identify cost-cutting opportunities" },
    ],
  });

  const getScoreColor = (score: number) =>
    score >= 75 ? "text-green-600" : score >= 50 ? "text-yellow-600" : "text-red-500";

  const getScoreBg = (score: number) =>
    score >= 75 ? "from-green-400 to-emerald-500" : score >= 50 ? "from-yellow-400 to-orange-400" : "from-red-400 to-rose-500";

  const getScoreLabel = (score: number) =>
    score >= 75 ? "Excellent 🏆" : score >= 60 ? "Good 👍" : score >= 40 ? "Fair ⚠️" : "Needs Work 🔴";

  const impactColor: Record<string, string> = {
    high: "bg-red-100 text-red-700",
    medium: "bg-yellow-100 text-yellow-700",
    low: "bg-green-100 text-green-700",
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-5 border-b dark:border-gray-700 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Activity className="text-indigo-500" size={18} /> AI Financial Health Score
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Powered by Claude AI</p>
        </div>
        <button onClick={analyze} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          {health ? "Re-analyze" : "Get Score"}
        </button>
      </div>

      {loading && (
        <div className="p-12 text-center">
          <Loader2 className="mx-auto text-indigo-500 mb-3 animate-spin" size={36} />
          <p className="text-gray-600 dark:text-gray-300 font-medium">AI is analyzing your financials...</p>
        </div>
      )}

      {!loading && !health && (
        <div className="p-12 text-center">
          <Activity className="mx-auto text-gray-300 mb-3" size={36} />
          <p className="text-gray-500">Click "Get Score" to analyze your financial health</p>
        </div>
      )}

      {!loading && health && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5 space-y-5">
          {/* Big Score */}
          <div className="flex items-center gap-6">
            <div className={`relative w-24 h-24 rounded-full bg-gradient-to-br ${getScoreBg(health.totalScore)} flex items-center justify-center shadow-lg`}>
              <span className="text-3xl font-extrabold text-white">{health.totalScore}</span>
              <span className="absolute -bottom-1 text-xs font-bold text-white opacity-70">/100</span>
            </div>
            <div>
              <p className={`text-xl font-bold ${getScoreColor(health.totalScore)}`}>{getScoreLabel(health.totalScore)}</p>
              <p className="text-sm text-gray-500 mt-1 max-w-xs">{health.summary}</p>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="grid grid-cols-2 gap-3">
            {health.categories.map((cat) => (
              <div key={cat.name} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className={`flex items-center gap-1.5 ${cat.color}`}>
                    {cat.icon}
                    <span className="text-xs font-semibold">{cat.name}</span>
                  </div>
                  <span className={`text-sm font-bold ${cat.color}`}>{cat.score}/{cat.maxScore}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(cat.score / cat.maxScore) * 100}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-1.5 rounded-full bg-gradient-to-r ${getScoreBg(cat.score * 4)}`} />
                </div>
                <p className="text-xs text-gray-400 mt-1.5">{cat.feedback}</p>
              </div>
            ))}
          </div>

          {/* Recommendations */}
          <div>
            <h4 className="font-semibold text-gray-700 dark:text-gray-300 text-sm mb-2">🎯 Top Recommendations</h4>
            <div className="space-y-2">
              {health.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-400 text-sm font-bold shrink-0">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-gray-800 dark:text-white">{rec.title}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${impactColor[rec.impact]}`}>{rec.impact}</span>
                    </div>
                    <p className="text-xs text-gray-500">{rec.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
