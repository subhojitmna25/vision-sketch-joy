import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Keyboard, X } from "lucide-react";

// ─── Shortcut definitions ─────────────────────────────────────────────────────
const SHORTCUTS = [
  { keys: ["Ctrl", "N"],  description: "New Invoice",           route: "/invoices/new" },
  { keys: ["Ctrl", "D"],  description: "Dashboard",             route: "/" },
  { keys: ["Ctrl", "C"],  description: "Clients",               route: "/clients" },
  { keys: ["Ctrl", "R"],  description: "Reports",               route: "/reports" },
  { keys: ["Ctrl", "T"],  description: "Tax Optimizer",         route: "/tools/tax-optimizer" },
  { keys: ["Ctrl", "B"],  description: "Bank Analyzer",         route: "/tools/bank-analyzer" },
  { keys: ["Ctrl", "L"],  description: "LBO Tool",              route: "/tools/lbo" },
  { keys: ["Ctrl", "I"],  description: "Investment Analyzer",   route: "/tools/investment" },
  { keys: ["Ctrl", "K"],  description: "Calculators",           route: "/tools/calculators" },
  { keys: ["?"],          description: "Show Keyboard Shortcuts", route: null },
  { keys: ["Esc"],        description: "Close Modal / Dialog",   route: null },
];

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const handler = useCallback((e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

    if (e.key === "?") { e.preventDefault(); setShowModal(true); return; }
    if (e.key === "Escape") { setShowModal(false); return; }

    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case "n": e.preventDefault(); navigate("/invoices/new"); break;
        case "d": e.preventDefault(); navigate("/"); break;
        case "c": e.preventDefault(); navigate("/clients"); break;
        case "r": e.preventDefault(); navigate("/reports"); break;
        case "t": e.preventDefault(); navigate("/tools/tax-optimizer"); break;
        case "b": e.preventDefault(); navigate("/tools/bank-analyzer"); break;
        case "l": e.preventDefault(); navigate("/tools/lbo"); break;
        case "i": e.preventDefault(); navigate("/tools/investment"); break;
        case "k": e.preventDefault(); navigate("/tools/calculators"); break;
      }
    }
  }, [navigate]);

  useEffect(() => {
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handler]);

  return { showModal, setShowModal };
}

// ─── Modal Component ──────────────────────────────────────────────────────────
interface Props { open: boolean; onClose: () => void; }

export function KeyboardShortcutsModal({ open, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Keyboard className="text-indigo-500" size={20} />
                <h2 className="font-bold text-gray-800 dark:text-white">Keyboard Shortcuts</h2>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2">
              {SHORTCUTS.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b dark:border-gray-700 last:border-0">
                  <span className="text-sm text-gray-600 dark:text-gray-300">{s.description}</span>
                  <div className="flex items-center gap-1">
                    {s.keys.map((k, j) => (
                      <span key={j}>
                        <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono text-gray-700 dark:text-gray-300">
                          {k}
                        </kbd>
                        {j < s.keys.length - 1 && <span className="text-gray-400 text-xs mx-0.5">+</span>}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-400 mt-4 text-center">Press <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">?</kbd> anytime to open this</p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
