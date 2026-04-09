import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert CA (Chartered Accountant) assistant for Indian taxation. Help with GST, ITR, TDS, tax planning, compliance deadlines, and accounting queries. Be concise and professional.`;

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
      throw new Error(`Message too long at index ${i} (max ${MAX_MESSAGE_LENGTH} chars)`);
    }
    return { role: m.role, content: m.content };
  });
}

async function tryClaudeAPI(messages: { role: string; content: string }[]) {
  const key = Deno.env.get("Claude_api_key");
  if (!key) return null;

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
      messages,
      stream: true,
    }),
  });

  if (!res.ok) {
    console.error("Claude error:", res.status);
    return null;
  }
  return res;
}

async function tryLovableAI(messages: { role: string; content: string }[]) {
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
    console.error("Lovable AI error:", status);
    if (status === 429) throw new Error("Rate limit exceeded. Please try again later.");
    if (status === 402) throw new Error("AI credits exhausted. Please add funds.");
    throw new Error("AI service unavailable");
  }
  return res;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    await authenticateUser(req);

    const body = await req.json();
    const messages = validateMessages(body.messages);

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
    const msg = e instanceof Error ? e.message : "An error occurred";
    const isAuth = msg === "Unauthorized" || msg === "Missing authorization header";
    const status = isAuth ? 401 : msg.includes("Rate limit") ? 429 : msg.includes("credits") ? 402 : msg.includes("Invalid") || msg.includes("must be") || msg.includes("empty") || msg.includes("too long") || msg.includes("Too many") ? 400 : 500;
    return new Response(JSON.stringify({ error: isAuth ? "Authentication required" : msg }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
