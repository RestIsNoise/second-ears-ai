import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/** Extract valid JSON from markdown-fenced or raw text, fixing trailing commas.
 *  Handles duplicated fence blocks (Gemini sometimes echoes the JSON twice). */
function trySalvageJson(text: string): Record<string, unknown> | null {
  // Collect ALL fenced blocks and also try the raw text itself
  const candidates: string[] = [];

  // If the text is an error wrapper, unwrap it first
  let source = text;
  const rawMatch = source.match(/Raw response:\s*([\s\S]*)/);
  if (rawMatch) source = rawMatch[1];

  // Grab every fenced block (non-greedy, one at a time)
  const fenceRe = /```(?:json)?\s*\n?([\s\S]*?)```/g;
  let m: RegExpExecArray | null;
  while ((m = fenceRe.exec(source)) !== null) {
    candidates.push(m[1].trim());
  }

  // Also try the raw source itself (no fences)
  if (candidates.length === 0) candidates.push(source.trim());

  for (const raw of candidates) {
    // Fix trailing commas before } or ] (common Gemini issue)
    const jsonStr = raw.replace(/,\s*([\]}])/g, "$1");
    try {
      const parsed = JSON.parse(jsonStr);
      if (typeof parsed === "object" && parsed !== null) return parsed;
    } catch { /* try next candidate */ }
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and forward request
    const { audioUrl, mode, fileName, userContext } = await req.json();

    const backendUrl =
      "https://secondears-backend-production.up.railway.app/api/feedback";
    console.log("Proxying to:", backendUrl, { audioUrl, mode, fileName, userContext });

    const fetchHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "x-api-key": "secondears-secret-2024",
    };

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: fetchHeaders,
      body: JSON.stringify({ audioUrl, mode, fileName, userContext }),
    });

    let responseText = await response.text();
    console.log("Backend response status:", response.status);

    // If the backend returned an error with raw Gemini output wrapped in code fences,
    // try to salvage the JSON instead of forwarding the error.
    if (response.status >= 400 || responseText.includes("malformed JSON")) {
      const salvaged = trySalvageJson(responseText);
      if (salvaged) {
        console.log("Salvaged JSON from malformed backend response");
        return new Response(JSON.stringify(salvaged), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(responseText, {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Proxy error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
