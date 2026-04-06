import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Copy, Trash2, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const STORAGE_KEY = "ca-floating-chat-history";
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

const quickChips = ["GST deadline?", "ITR filing date?", "TDS rates", "80C deductions"];

function loadHistory(): Message[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(msgs: Message[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
  } catch {}
}

export default function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(loadHistory);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    saveHistory(messages);
  }, [messages]);

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied");
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const sendMessage = useCallback(async (text: string) => {
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
        body: JSON.stringify({ messages: allMessages }),
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
          if (line.startsWith("event:")) continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.type === "content_block_delta" && parsed.delta?.text) {
              upsertAssistant(parsed.delta.text);
            }
            if (parsed.choices?.[0]?.delta?.content) {
              upsertAssistant(parsed.choices[0].delta.content);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (!assistantSoFar) {
        upsertAssistant("Sorry, I couldn't generate a response. Please try again.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to get AI response");
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, an error occurred. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading]);

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent shadow-elevated flex items-center justify-center text-primary-foreground hover:scale-110 transition-transform"
          aria-label="Open AI chat"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[520px] bg-card border rounded-2xl shadow-elevated flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-accent" />
              <span className="font-semibold text-sm text-foreground">CA Assistant</span>
            </div>
            <div className="flex gap-1">
              <button onClick={clearChat} className="p-1.5 rounded-md hover:bg-muted transition-colors" aria-label="Clear chat">
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </button>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-md hover:bg-muted transition-colors" aria-label="Close chat">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <Bot className="h-10 w-10 text-accent/40 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Ask me anything about Indian taxation</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={`fc-${i}-${msg.role}`} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === "assistant" ? "bg-accent/10" : "bg-primary"
                }`}>
                  {msg.role === "assistant" ? <Bot className="h-3.5 w-3.5 text-accent" /> : <User className="h-3.5 w-3.5 text-primary-foreground" />}
                </div>
                <div className={`max-w-[75%] rounded-xl px-3 py-2 text-xs leading-relaxed relative group ${
                  msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                }`}>
                  {msg.role === "assistant" ? (
                    <>
                      <div className="prose prose-xs max-w-none dark:prose-invert">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                      {msg.content && (
                        <button
                          onClick={() => copyText(msg.content)}
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-background/50"
                          aria-label="Copy response"
                        >
                          <Copy className="h-3 w-3 text-muted-foreground" />
                        </button>
                      )}
                    </>
                  ) : (
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                  )}
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center">
                  <Bot className="h-3.5 w-3.5 text-accent" />
                </div>
                <div className="bg-muted rounded-xl px-3 py-2 flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" />
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0.15s" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0.3s" }} />
                </div>
              </div>
            )}
          </div>

          {/* Quick chips */}
          {messages.length === 0 && (
            <div className="px-3 pb-1 flex flex-wrap gap-1.5">
              {quickChips.map((c) => (
                <button
                  key={c}
                  onClick={() => sendMessage(c)}
                  className="text-[11px] px-2.5 py-1 rounded-full border bg-card text-muted-foreground hover:bg-muted transition-colors"
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t">
            <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about tax, GST..."
                className="flex-1 h-9 text-xs"
                disabled={isLoading}
                aria-label="Chat message"
              />
              <Button type="submit" size="sm" disabled={!input.trim() || isLoading} className="h-9 w-9 p-0 bg-gradient-gold text-gold-foreground" aria-label="Send">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
