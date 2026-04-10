import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Keyboard, X } from "lucide-react";

const SHORTCUTS = [
  { keys: ["Ctrl", "D"],  description: "Dashboard",             route: "/dashboard" },
  { keys: ["Ctrl", "C"],  description: "Clients",               route: "/dashboard/clients" },
  { keys: ["Ctrl", "T"],  description: "Tax Optimizer",         route: "/dashboard/tools/tax-optimizer" },
  { keys: ["Ctrl", "B"],  description: "Bank Analyzer",         route: "/dashboard/tools/bank-analyzer" },
  { keys: ["Ctrl", "L"],  description: "LBO Tool",              route: "/dashboard/tools/lbo" },
  { keys: ["Ctrl", "I"],  description: "Investment Analyzer",   route: "/dashboard/tools/investment" },
  { keys: ["?"],          description: "Show Keyboard Shortcuts", route: null },
  { keys: ["Esc"],        description: "Close Modal / Dialog",   route: null },
];

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const handler = useCallback((e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

    if (e.key === "?") { e.preventDefault(); setShowModal(true); return; }
    if (e.key === "Escape") { setShowModal(false); return; }

    if (e.ctrlKey || e.metaKey) {
      const shortcut = SHORTCUTS.find(s => s.keys.length === 2 && s.keys[1].toLowerCase() === e.key.toLowerCase());
      if (shortcut?.route) {
        e.preventDefault();
        navigate(shortcut.route);
      }
    }
  }, [navigate]);

  useEffect(() => {
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handler]);

  return { showModal, setShowModal };
}

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
            className="relative bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 z-10 border">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Keyboard className="text-primary" size={20} />
                <h2 className="font-bold text-card-foreground">Keyboard Shortcuts</h2>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2">
              {SHORTCUTS.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                  <span className="text-sm text-muted-foreground">{s.description}</span>
                  <div className="flex items-center gap-1">
                    {s.keys.map((k, j) => (
                      <span key={j}>
                        <kbd className="px-2 py-0.5 bg-muted border rounded text-xs font-mono text-muted-foreground">
                          {k}
                        </kbd>
                        {j < s.keys.length - 1 && <span className="text-muted-foreground text-xs mx-0.5">+</span>}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground mt-4 text-center">Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">?</kbd> anytime to open this</p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
