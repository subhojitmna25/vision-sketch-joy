import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert Indian Chartered Accountant AI assistant. You specialize in:
- Indian Income Tax (IT Act, sections, deductions, exemptions)
- GST (filing deadlines, rates, ITC, returns)
- TDS/TCS rates and compliance
- Company law and ROC filings
- Audit and accounting standards (Ind AS, SA)
- Tax planning and advisory
- Financial analysis for CA practices

Always provide accurate, up-to-date information based on Indian tax laws. Use ₹ for currency. Format responses with markdown for clarity. If unsure, recommend consulting the latest CBDT/CBIC circulars.`;

const MAX_MESSAGES = 50;
const MAX_MESSAGE_LENGTH = 10000;

async function authenticateUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Error("Missing authorization header");

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");
  return user;
}

function validateMessages(messages: unknown): { role: string; content: string }[] {
  if (!Array.isArray(messages)) throw new Error("messages must be an array");
  if (messages.length === 0) throw new Error("messages array is empty");
  if (messages.length > MAX_MESSAGES) throw new Error(`Too many messages (max ${MAX_MESSAGES})`);

  return messages.map((m, i) => {
    if (!m || typeof m !== "object") throw new Error(`Invalid message at index ${i}`);
    if (typeof m.role !== "string" || !["user", "assistant"].includes(m.role)) {
      throw new Error(`Invalid role at index ${i}`);
    }
    if (typeof m.content !== "string" || m.content.length === 0) {
      throw new Error(`Empty content at index ${i}`);
    }
    if (m.content.length > MAX_MESSAGE_LENGTH) {
      throw new Error(`Message too long at index ${i}`);
    }
    return { role: m.role, content: m.content };
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    await authenticateUser(req);

    const body = await req.json();
    const messages = validateMessages(body.messages);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI service not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      console.error("AI gateway error:", status);
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    const msg = e instanceof Error ? e.message : "An error occurred";
    const isAuth = msg === "Unauthorized" || msg === "Missing authorization header";
    const status = isAuth ? 401 : msg.includes("Invalid") || msg.includes("must be") || msg.includes("empty") || msg.includes("too long") || msg.includes("Too many") ? 400 : 500;
    return new Response(JSON.stringify({ error: isAuth ? "Authentication required" : msg }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
