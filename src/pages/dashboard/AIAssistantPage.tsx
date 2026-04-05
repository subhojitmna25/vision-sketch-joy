import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Bot, User, Sparkles, Copy, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

const suggestions = [
  "Analyze my finances",
  "GST deadline?",
  "Tax saving tips",
  "Explain TDS",
];

export default function AIAssistantPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your AI CA assistant powered by Claude. I can help with GST queries, income tax provisions, compliance deadlines, financial analysis, and general accounting questions. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch financial context for AI
  const { data: financialContext } = useQuery({
    queryKey: ["ai-context", user?.id],
    queryFn: async () => {
      try {
        const [clientsRes, invoicesRes, expensesRes] = await Promise.all([
          supabase.from("clients").select("name, status, type").limit(20),
          supabase.from("invoices").select("invoice_number, amount, status, due_date").limit(20),
          supabase.from("expenses").select("category, amount, status, date").limit(20),
        ]);
        return {
          clients: clientsRes.data ?? [],
          invoices: invoicesRes.data ?? [],
          expenses: expensesRes.data ?? [],
          totalRevenue: (invoicesRes.data ?? []).filter(i => i.status === "Paid").reduce((s, i) => s + Number(i.amount), 0),
          totalExpenses: (expensesRes.data ?? []).reduce((s, e) => s + Number(e.amount), 0),
        };
      } catch {
        return null;
      }
    },
    enabled: !!user,
    staleTime: 60000,
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const clearChat = () => {
    setMessages([{
      role: "assistant",
      content: "Chat cleared. How can I help you?",
    }]);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Message = { role: "user", content: text };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && prev.length === allMessages.length + 1) {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages, context: financialContext }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Request failed (${resp.status})`);
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.trim() === "" || line.startsWith(":")) continue;

          // Anthropic SSE format: "event: content_block_delta" then "data: {...}"
          if (line.startsWith("event:")) continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            // Anthropic streaming format
            if (parsed.type === "content_block_delta" && parsed.delta?.text) {
              upsertAssistant(parsed.delta.text);
            }
            // OpenAI-compatible format fallback
            if (parsed.choices?.[0]?.delta?.content) {
              upsertAssistant(parsed.choices[0].delta.content);
            }
          } catch {
            // Incomplete JSON, put it back
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // If no content was streamed, add a fallback
      if (!assistantSoFar) {
        upsertAssistant("I received your message but couldn't generate a response. Please try again.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to get AI response");
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-['Space_Grotesk'] flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-accent" /> AI Assistant
          </h1>
          <p className="text-sm text-muted-foreground">Powered by Claude — Ask anything about tax, compliance, or accounting</p>
        </div>
        <Button variant="ghost" size="sm" onClick={clearChat} aria-label="Clear chat">
          <Trash2 className="h-4 w-4 mr-1" /> Clear
        </Button>
      </div>

      <Card className="flex-1 flex flex-col shadow-card overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={`msg-${i}-${msg.role}`} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                msg.role === "assistant" ? "bg-accent/10" : "bg-primary"
              }`}>
                {msg.role === "assistant" ? <Bot className="h-4 w-4 text-accent" /> : <User className="h-4 w-4 text-primary-foreground" />}
              </div>
              <div className={`max-w-[75%] rounded-xl px-4 py-3 text-sm leading-relaxed relative group ${
                msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
              }`}>
                {msg.role === "assistant" ? (
                  <>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                    {msg.content && i > 0 && (
                      <button
                        onClick={() => copyToClipboard(msg.content)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-background/50"
                        aria-label="Copy response"
                      >
                        <Copy className="h-3 w-3 text-muted-foreground" />
                      </button>
                    )}
                  </>
                ) : (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                )}
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
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

        {messages.length <= 1 && (
          <div className="px-4 pb-2 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button key={s} onClick={() => sendMessage(s)} className="text-xs px-3 py-1.5 rounded-full border bg-card text-muted-foreground hover:bg-muted transition-colors">
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="p-4 border-t">
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about tax, GST, compliance..."
              className="flex-1"
              disabled={isLoading}
              aria-label="Chat message input"
            />
            <Button type="submit" disabled={!input.trim() || isLoading} className="bg-gradient-gold text-gold-foreground hover:opacity-90" aria-label="Send message">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
