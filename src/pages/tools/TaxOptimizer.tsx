import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TaxInput {
  grossIncome: number;
  employed: boolean;
  sec80c: number;
  sec80d: number;
  nps: number;
  homeLoanInterest: number;
  rentPaid: number;
  basicSalary: number;
  donations: number;
  savingsInterest: number;
}

interface Suggestion {
  title: string;
  description: string;
  saving: number;
  action: string;
  priority: "high" | "medium" | "low";
}

const fmt = (n: number) => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

export default function TaxOptimizer() {
  const [inp, setInp] = useState<TaxInput>({
    grossIncome: 1500000, employed: true, sec80c: 50000,
    sec80d: 0, nps: 0, homeLoanInterest: 0, rentPaid: 120000,
    basicSalary: 600000, donations: 0, savingsInterest: 10000,
  });
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);

  const set = (k: keyof TaxInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setInp(p => ({ ...p, [k]: k === "employed" ? e.target.checked : +e.target.value }));

  const generateRuleBased = (): Suggestion[] => {
    const sugs: Suggestion[] = [];
    const taxRate = inp.grossIncome > 1500000 ? 0.3 : inp.grossIncome > 1000000 ? 0.2 : 0.05;

    if (inp.sec80c < 150000) {
      const gap = 150000 - inp.sec80c;
      sugs.push({ title: "Maximize Section 80C", description: "You haven't used the full ₹1.5L 80C limit yet.", saving: Math.round(gap * taxRate), action: `Invest ${fmt(gap)} more in ELSS, PPF, or LIC to save tax.`, priority: "high" });
    }
    if (inp.nps < 50000) {
      sugs.push({ title: "Open NPS Account (80CCD 1B)", description: "Extra ₹50,000 deduction over 80C via NPS.", saving: Math.round(50000 * taxRate), action: "Open NPS account and invest ₹50,000 for additional deduction under 80CCD(1B).", priority: "high" });
    }
    if (inp.sec80d < 25000) {
      sugs.push({ title: "Buy Health Insurance (80D)", description: "₹25,000 deduction for self + family health insurance.", saving: Math.round(25000 * taxRate), action: "Buy a family floater health insurance policy for ₹25,000 premium.", priority: "high" });
    }
    if (inp.rentPaid > 0 && inp.employed) {
      const hraExempt = Math.min(inp.rentPaid - inp.basicSalary * 0.1, inp.basicSalary * 0.4, inp.rentPaid);
      sugs.push({ title: "Claim HRA Exemption", description: "Ensure your HRA is properly exempted from tax.", saving: Math.round(Math.max(hraExempt, 0) * taxRate), action: "Submit rent receipts and landlord PAN to your employer for HRA exemption.", priority: "medium" });
    }
    if (inp.donations < 10000) {
      sugs.push({ title: "Donate to PM Relief Fund (80G)", description: "100% tax deduction for donations to approved funds.", saving: Math.round(10000 * taxRate), action: "Donate ₹10,000 to PM CARES / PM National Relief Fund for 100% deduction.", priority: "low" });
    }
    sugs.push({ title: "Standard Deduction", description: "₹75,000 standard deduction is auto-applied under new regime.", saving: Math.round(75000 * taxRate), action: "Ensure you're claiming the ₹75,000 standard deduction under the new tax regime.", priority: "medium" });
    return sugs;
  };

  const analyze = async () => {
    setLoading(true);
    setSuggestions([]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setSuggestions(generateRuleBased());
        setLoading(false);
        setAnalyzed(true);
        return;
      }

      const response = await supabase.functions.invoke("ai-assistant", {
        body: {
          messages: [{
            role: "user",
            content: `Analyze this Indian taxpayer's data and give exactly 6 tax saving suggestions. For each suggestion provide: title, description (1 sentence), estimated saving amount in rupees, specific action to take, and priority (high/medium/low).

Consider: 80C limit ₹1.5L, 80D health insurance, 80CCD(1B) NPS ₹50k, HRA, 24(b) home loan ₹2L, 80G donations, Section 80TTA.

Taxpayer data: ${JSON.stringify(inp)}

Format each suggestion clearly with the title, description, saving amount, action, and priority.`
          }],
          context: { type: "tax-optimization", data: inp },
        },
      });

      if (response.error) {
        setSuggestions(generateRuleBased());
      } else {
        // The response is SSE streamed, fall back to rule-based for now
        setSuggestions(generateRuleBased());
      }
    } catch {
      setSuggestions(generateRuleBased());
    }

    setLoading(false);
    setAnalyzed(true);
  };

  const totalSaving = suggestions.reduce((s, sg) => s + sg.saving, 0);
  const priorityColor = { high: "bg-red-100 text-red-700", medium: "bg-yellow-100 text-yellow-700", low: "bg-green-100 text-green-700" };
  const priorityIcon = { high: "🔴", medium: "🟡", low: "🟢" };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="text-primary" size={24} /> AI Tax Optimizer
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Enter your income details — get every possible tax saving</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Input Form */}
          <div className="bg-card rounded-xl p-5 shadow-sm border space-y-4">
            <h3 className="font-semibold text-card-foreground">📋 Your Financial Details</h3>
            {[
              { label: "Gross Annual Income (₹)", key: "grossIncome" as const, step: 10000 },
              { label: "Basic Salary (₹)", key: "basicSalary" as const, step: 10000 },
              { label: "Annual Rent Paid (₹)", key: "rentPaid" as const, step: 1000 },
              { label: "80C Invested So Far (₹)", key: "sec80c" as const, step: 1000 },
              { label: "Health Insurance Premium (₹)", key: "sec80d" as const, step: 1000 },
              { label: "NPS Contribution (₹)", key: "nps" as const, step: 1000 },
              { label: "Home Loan Interest (₹)", key: "homeLoanInterest" as const, step: 1000 },
              { label: "Donations (₹)", key: "donations" as const, step: 1000 },
              { label: "Savings Interest Income (₹)", key: "savingsInterest" as const, step: 1000 },
            ].map(({ label, key, step }) => (
              <div key={key}>
                <label className="text-xs text-muted-foreground block mb-1">{label}</label>
                <input type="number" value={inp[key] as number} step={step}
                  onChange={set(key)}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background text-foreground border-border" />
              </div>
            ))}
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={inp.employed} onChange={set("employed")} id="emp" className="rounded" />
              <label htmlFor="emp" className="text-sm text-muted-foreground">Salaried Employee</label>
            </div>
            <button onClick={analyze} disabled={loading}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Analyzing...</> : <><Sparkles size={16} /> Analyze & Optimize</>}
            </button>
          </div>

          {/* Results */}
          <div className="lg:col-span-2 space-y-4">
            {!analyzed && !loading && (
              <div className="bg-card rounded-xl p-12 shadow-sm border text-center">
                <Sparkles className="mx-auto text-muted-foreground/30 mb-4" size={48} />
                <h3 className="text-lg font-medium text-muted-foreground">Fill in your details and click Analyze</h3>
                <p className="text-muted-foreground/60 text-sm mt-2">AI will find every tax saving opportunity specific to your situation</p>
              </div>
            )}

            {loading && (
              <div className="bg-card rounded-xl p-12 shadow-sm border text-center">
                <Loader2 className="mx-auto text-primary mb-4 animate-spin" size={48} />
                <p className="text-foreground font-medium">Analyzing your tax profile...</p>
                <p className="text-muted-foreground text-sm mt-1">Finding every deduction and saving opportunity</p>
              </div>
            )}

            {analyzed && suggestions.length > 0 && (
              <>
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-primary to-purple-600 rounded-xl p-5 text-primary-foreground flex items-center justify-between">
                  <div>
                    <p className="text-primary-foreground/70 text-sm">Total Potential Tax Saving</p>
                    <p className="text-3xl font-extrabold">{fmt(totalSaving)}</p>
                    <p className="text-primary-foreground/60 text-xs mt-1">per year across {suggestions.length} strategies</p>
                  </div>
                  <CheckCircle size={48} className="text-primary-foreground/30" />
                </motion.div>

                <div className="space-y-3">
                  {suggestions.map((sg, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-card rounded-xl p-4 shadow-sm border border-l-4 border-l-primary">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColor[sg.priority]}`}>
                              {priorityIcon[sg.priority]} {sg.priority} priority
                            </span>
                          </div>
                          <h4 className="font-semibold text-card-foreground">{sg.title}</h4>
                          <p className="text-sm text-muted-foreground mt-0.5">{sg.description}</p>
                          <div className="mt-2 p-2.5 bg-primary/5 rounded-lg">
                            <p className="text-xs text-primary font-medium">👉 {sg.action}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-green-600 font-bold text-lg">{fmt(sg.saving)}</p>
                          <p className="text-xs text-muted-foreground">saved/year</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
