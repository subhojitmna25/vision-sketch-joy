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

  const getMockHealth = (): HealthData => {
    const revenue = financialData.revenue || 500000;
    const expenses = financialData.expenses || 350000;
    const netProfit = financialData.netProfit || (revenue - expenses);
    const compliancesDone = financialData.compliancesDone || 8;
    const totalCompliances = financialData.totalCompliances || 10;

    const profitScore = Math.min(25, Math.round((netProfit / revenue) * 100));
    const liquidityScore = Math.min(25, financialData.cashBalance ? Math.round((financialData.cashBalance / expenses) * 25) : 18);
    const complianceScore = Math.round((compliancesDone / totalCompliances) * 25);
    const growthScore = Math.min(25, Math.round((netProfit / revenue) * 50));
    const totalScore = profitScore + liquidityScore + complianceScore + growthScore;

    return {
      totalScore,
      summary: `Your business shows ${totalScore >= 70 ? "solid" : "moderate"} financial health. ${financialData.pendingInvoices ? `Focus on clearing ${financialData.pendingInvoices} pending invoices.` : "Keep up the good work."}`,
      categories: [
        { name: "Profitability", score: profitScore, maxScore: 25, icon: <TrendingUp size={18} />, color: "text-green-600", feedback: `Profit margin at ${((netProfit / revenue) * 100).toFixed(0)}%.` },
        { name: "Liquidity", score: liquidityScore, maxScore: 25, icon: <Activity size={18} />, color: "text-blue-600", feedback: "Cash reserves assessment based on expense coverage." },
        { name: "Compliance", score: complianceScore, maxScore: 25, icon: <Shield size={18} />, color: "text-purple-600", feedback: `${compliancesDone}/${totalCompliances} compliances filed on time.` },
        { name: "Growth", score: growthScore, maxScore: 25, icon: <BarChart2 size={18} />, color: "text-orange-500", feedback: "Growth potential based on current margins." },
      ],
      recommendations: [
        { title: "Follow up on overdue invoices", impact: "high", action: "Send reminders to clients with invoices overdue by 30+ days" },
        { title: "File pending GSTR returns", impact: "high", action: "Complete GSTR-3B for current month to avoid interest" },
        { title: "Invest surplus cash", impact: "medium", action: "Move idle cash into liquid mutual funds for better returns" },
        { title: "Onboard 2 more clients", impact: "medium", action: "Target CA referral network to add 2 clients this quarter" },
        { title: "Review expense categories", impact: "low", action: "Audit office expenses to identify cost-cutting opportunities" },
      ],
    };
  };

  const analyze = async () => {
    setLoading(true);
    // Use rule-based analysis (works without external API)
    await new Promise(r => setTimeout(r, 800));
    setHealth(getMockHealth());
    setLoading(false);
  };

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
    <div className="bg-card rounded-2xl shadow-sm overflow-hidden border">
      <div className="p-5 border-b flex items-center justify-between">
        <div>
          <h3 className="font-bold text-card-foreground flex items-center gap-2">
            <Activity className="text-primary" size={18} /> Financial Health Score
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Smart analysis of your financials</p>
        </div>
        <button onClick={analyze} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          {health ? "Re-analyze" : "Get Score"}
        </button>
      </div>

      {loading && (
        <div className="p-12 text-center">
          <Loader2 className="mx-auto text-primary mb-3 animate-spin" size={36} />
          <p className="text-foreground font-medium">Analyzing your financials...</p>
        </div>
      )}

      {!loading && !health && (
        <div className="p-12 text-center">
          <Activity className="mx-auto text-muted-foreground/30 mb-3" size={36} />
          <p className="text-muted-foreground">Click "Get Score" to analyze your financial health</p>
        </div>
      )}

      {!loading && health && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5 space-y-5">
          <div className="flex items-center gap-6">
            <div className={`relative w-24 h-24 rounded-full bg-gradient-to-br ${getScoreBg(health.totalScore)} flex items-center justify-center shadow-lg`}>
              <span className="text-3xl font-extrabold text-white">{health.totalScore}</span>
              <span className="absolute -bottom-1 text-xs font-bold text-white opacity-70">/100</span>
            </div>
            <div>
              <p className={`text-xl font-bold ${getScoreColor(health.totalScore)}`}>{getScoreLabel(health.totalScore)}</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">{health.summary}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {health.categories.map((cat) => (
              <div key={cat.name} className="bg-muted/50 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className={`flex items-center gap-1.5 ${cat.color}`}>
                    {cat.icon}
                    <span className="text-xs font-semibold">{cat.name}</span>
                  </div>
                  <span className={`text-sm font-bold ${cat.color}`}>{cat.score}/{cat.maxScore}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(cat.score / cat.maxScore) * 100}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-1.5 rounded-full bg-gradient-to-r ${getScoreBg(cat.score * 4)}`} />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">{cat.feedback}</p>
              </div>
            ))}
          </div>

          <div>
            <h4 className="font-semibold text-muted-foreground text-sm mb-2">🎯 Top Recommendations</h4>
            <div className="space-y-2">
              {health.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <span className="text-muted-foreground text-sm font-bold shrink-0">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-card-foreground">{rec.title}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${impactColor[rec.impact]}`}>{rec.impact}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{rec.action}</p>
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
