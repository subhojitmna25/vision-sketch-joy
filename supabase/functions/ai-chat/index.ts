import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert CA (Chartered Accountant) assistant for Indian taxation. Help with GST, ITR, TDS, tax planning, compliance deadlines, and accounting queries. Be concise and professional.`;

async function tryClaudeAPI(messages: any[]) {
  const key = Deno.env.get("Claude_api_key");
  if (!key) return null;

  const anthropicMessages = messages
    .filter((m: any) => m.role === "user" || m.role === "assistant")
    .map((m: any) => ({ role: m.role, content: m.content }));

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: anthropicMessages,
      stream: true,
    }),
  });

  if (!res.ok) {
    console.error("Claude error:", res.status, await res.text());
    return null;
  }
  return res;
}

async function tryLovableAI(messages: any[]) {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("No AI API keys configured");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      stream: true,
    }),
  });

  if (!res.ok) {
    const status = res.status;
    const t = await res.text();
    console.error("Lovable AI error:", status, t);
    if (status === 429) throw new Error("Rate limit exceeded. Please try again later.");
    if (status === 402) throw new Error("AI credits exhausted. Please add funds.");
    throw new Error("AI gateway error");
  }
  return res;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let response = await tryClaudeAPI(messages);
    if (!response) {
      console.log("Claude unavailable, falling back to Lovable AI");
      response = await tryLovableAI(messages);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-chat error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg.includes("Rate limit") ? 429 : msg.includes("credits") ? 402 : 500;
    return new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
