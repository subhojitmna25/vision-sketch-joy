import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { X, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";

const STEPS = [
  {
    title: "Welcome to CA Financial Assist! 👋",
    description: "Your all-in-one platform for managing clients, invoices, compliance, and advanced financial analysis. Let's take a quick tour!",
    icon: "🏦",
    route: "/",
    highlight: null,
  },
  {
    title: "Analytics Dashboard 📊",
    description: "Your homepage shows real-time KPIs — Revenue, Expenses, Profit, and Pending Invoices. All your key numbers at a glance.",
    icon: "📊",
    route: "/",
    highlight: null,
  },
  {
    title: "Manage Your Clients 👥",
    description: "Add clients with PAN, GSTIN, and contact details. Each client gets their own profile with compliance tracking and invoice history.",
    icon: "👥",
    route: "/clients",
    highlight: null,
  },
  {
    title: "Create Invoices 🧾",
    description: "Generate professional GST invoices with auto-calculated CGST/SGST. Export as PDF with one click and track payment status.",
    icon: "🧾",
    route: "/invoices",
    highlight: null,
  },
  {
    title: "Compliance Calendar 📅",
    description: "Never miss a deadline! All Indian compliance dates (GSTR-1, TDS, ITR, Advance Tax) are pre-loaded with color-coded alerts.",
    icon: "📅",
    route: "/compliance",
    highlight: null,
  },
  {
    title: "LBO & Investment Tools 💹",
    description: "Professional-grade financial tools: LBO analysis with IRR/MOIC, DCF valuation, ratio analysis, and SIP calculator.",
    icon: "💹",
    route: "/tools/lbo",
    highlight: null,
  },
  {
    title: "AI Tax Optimizer 🤖",
    description: "AI analyzes your income and finds every possible tax saving. Get personalized strategies to minimize your tax outgo.",
    icon: "🤖",
    route: "/tools/tax-optimizer",
    highlight: null,
  },
  {
    title: "You're All Set! 🎉",
    description: "Press ? anytime to see keyboard shortcuts. Click the AI chat bubble (bottom-right) to ask any CA or tax question. Let's get started!",
    icon: "🎉",
    route: "/",
    highlight: null,
  },
];

const STORAGE_KEY = "ca_onboarding_done";

export function useOnboarding() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) setTimeout(() => setShow(true), 800);
  }, []);

  const complete = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setShow(false);
  };

  const restart = () => {
    localStorage.removeItem(STORAGE_KEY);
    setShow(true);
  };

  return { show, complete, restart };
}

interface Props { show: boolean; onComplete: () => void; }

export function OnboardingTour({ show, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const current = STEPS[step];

  const next = () => {
    if (step < STEPS.length - 1) {
      const nextStep = STEPS[step + 1];
      navigate(nextStep.route);
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const prev = () => {
    if (step > 0) {
      navigate(STEPS[step - 1].route);
      setStep(step - 1);
    }
  };

  const skip = () => onComplete();

  useEffect(() => {
    if (show && current) navigate(current.route);
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          {/* Overlay */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto" />

          {/* Tour Card */}
          <div className="absolute inset-0 flex items-end md:items-center justify-center p-4 pointer-events-none">
            <motion.div key={step} initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20 }}
              transition={{ type: "spring", damping: 20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 pointer-events-auto">

              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-1">
                  {STEPS.map((_, i) => (
                    <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-indigo-500" : i < step ? "w-3 bg-indigo-300" : "w-3 bg-gray-200 dark:bg-gray-600"}`} />
                  ))}
                </div>
                <button onClick={skip} className="text-gray-400 hover:text-gray-600 text-sm flex items-center gap-1">
                  <X size={14} /> Skip
                </button>
              </div>

              {/* Content */}
              <div className="text-center py-4">
                <div className="text-5xl mb-4">{current.icon}</div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{current.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{current.description}</p>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-4">
                <button onClick={prev} disabled={step === 0}
                  className="flex items-center gap-1 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30">
                  <ArrowLeft size={14} /> Back
                </button>

                <span className="text-xs text-gray-400">{step + 1} of {STEPS.length}</span>

                <button onClick={next}
                  className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">
                  {step === STEPS.length - 1 ? (
                    <><CheckCircle size={14} /> Get Started!</>
                  ) : (
                    <>Next <ArrowRight size={14} /></>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
