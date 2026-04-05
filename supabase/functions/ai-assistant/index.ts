import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an expert CA (Chartered Accountant) and financial advisor specializing in Indian taxation (GST, ITR, TDS, Income Tax Act, Companies Act 2013). Help users with: tax planning, compliance deadlines, accounting entries, financial analysis, and regulatory guidance. When given financial data context, analyze it and provide specific actionable insights. Always use ₹ for currency. Format responses with markdown for clarity.`;

async function tryClaudeAPI(messages: any[], systemPrompt: string) {
  const CLAUDE_API_KEY = Deno.env.get("Claude_api_key");
  if (!CLAUDE_API_KEY) return null;

  const anthropicMessages = messages
    .filter((m: any) => m.role === "user" || m.role === "assistant")
    .map((m: any) => ({ role: m.role, content: m.content }));

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": CLAUDE_API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      messages: anthropicMessages,
      stream: true,
    }),
  });

  if (!response.ok) {
    console.error("Claude API error:", response.status, await response.text());
    return null;
  }
  return response;
}

async function tryLovableAI(messages: any[], systemPrompt: string) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("No AI API keys configured");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      stream: true,
    }),
  });

  if (!response.ok) {
    const status = response.status;
    const t = await response.text();
    console.error("Lovable AI error:", status, t);
    if (status === 429) throw new Error("Rate limit exceeded. Please try again later.");
    if (status === 402) throw new Error("AI credits exhausted. Please add funds.");
    throw new Error("AI gateway error");
  }
  return response;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, context } = await req.json();
    const systemPrompt = context
      ? `${SYSTEM_PROMPT}\n\nUser's current financial context:\n${JSON.stringify(context)}`
      : SYSTEM_PROMPT;

    // Try Claude first, fall back to Lovable AI
    let response = await tryClaudeAPI(messages, systemPrompt);
    if (!response) {
      console.log("Claude unavailable, falling back to Lovable AI");
      response = await tryLovableAI(messages, systemPrompt);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-assistant error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg.includes("Rate limit") ? 429 : msg.includes("credits") ? 402 : 500;
    return new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
