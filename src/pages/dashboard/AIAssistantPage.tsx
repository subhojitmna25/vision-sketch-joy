import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Bot, User, Sparkles } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const suggestions = [
  "What are the GST filing deadlines for Q4?",
  "Explain Section 80C deductions",
  "How to calculate advance tax for FY 2025-26?",
  "What's the TDS rate on professional fees?",
];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your AI tax and finance assistant. I can help with GST queries, income tax provisions, compliance deadlines, and general accounting questions. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Simulated AI response (will connect to Lovable AI later)
    setTimeout(() => {
      const responses: Record<string, string> = {
        gst: "**GST Filing Deadlines for Q4 (Jan–Mar 2026):**\n\n- **GSTR-1**: 11th of the following month\n- **GSTR-3B**: 20th of the following month\n- **GSTR-9**: December 31st (annual)\n- **GSTR-9C**: December 31st (reconciliation)\n\nMake sure your clients have their invoices reconciled before filing. Need help with any specific return?",
        "80c": "**Section 80C Deductions (FY 2025-26):**\n\nMaximum deduction: **₹1,50,000**\n\nEligible investments:\n- EPF / VPF\n- PPF (Public Provident Fund)\n- ELSS Mutual Funds (3-year lock-in)\n- NSC (National Savings Certificate)\n- Life Insurance Premium\n- 5-year Fixed Deposits\n- Sukanya Samriddhi Yojana\n- Home Loan Principal Repayment\n- Tuition Fees (up to 2 children)\n\nWould you like me to help calculate the optimal 80C planning for a specific client?",
        tds: "**TDS Rate on Professional Fees (Section 194J):**\n\n- **Technical Services**: 2%\n- **Professional Services**: 10%\n- **Threshold**: ₹30,000 per annum\n\n**Important Notes:**\n- If PAN not furnished: 20% TDS\n- For individuals/HUF not liable to audit: No TDS if payment < ₹30,000\n- Due date for deposit: 7th of the following month\n\nShould I help with TDS calculations for a specific payment?",
      };

      const lowerText = text.toLowerCase();
      let reply = "That's a great question! Let me analyze this for you.\n\nBased on current Indian tax regulations, I'd recommend consulting the latest CBDT circulars for the most accurate guidance. Would you like me to help with:\n\n1. **Tax calculations** for specific scenarios\n2. **Compliance deadlines** and reminders\n3. **GST-related** queries\n4. **ITR filing** assistance\n\nFeel free to ask anything specific!";

      if (lowerText.includes("gst") || lowerText.includes("deadline")) reply = responses.gst;
      else if (lowerText.includes("80c") || lowerText.includes("deduction")) reply = responses["80c"];
      else if (lowerText.includes("tds") || lowerText.includes("professional")) reply = responses.tds;

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      setIsLoading(false);
    }, 1200);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground font-['Space_Grotesk'] flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-accent" /> AI Assistant
        </h1>
        <p className="text-sm text-muted-foreground">Ask anything about tax, compliance, or accounting</p>
      </div>

      {/* Chat area */}
      <Card className="flex-1 flex flex-col shadow-card overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                msg.role === "assistant" ? "bg-accent/10" : "bg-primary"
              }`}>
                {msg.role === "assistant" ? <Bot className="h-4 w-4 text-accent" /> : <User className="h-4 w-4 text-primary-foreground" />}
              </div>
              <div className={`max-w-[75%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
              }`}>
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-accent" />
              </div>
              <div className="bg-muted rounded-xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0.15s" }} />
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0.3s" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="text-xs px-3 py-1.5 rounded-full border bg-card text-muted-foreground hover:bg-muted transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t">
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about tax, GST, compliance..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button type="submit" disabled={!input.trim() || isLoading} className="bg-gradient-gold text-gold-foreground hover:opacity-90">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
