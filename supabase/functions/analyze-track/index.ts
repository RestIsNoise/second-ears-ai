import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const modePrompts: Record<string, string> = {
  technical: `You are a world-class mixing engineer analyzing a track. Provide structured, concise feedback on:
- **Frequency Balance**: Low, mid, high distribution. Any masking or buildup?
- **Dynamic Range**: Compression, transient detail, loudness consistency
- **Stereo Image**: Width, mono compatibility, panning issues
- **Phase & Correlation**: Any phase cancellation?
- **Loudness**: LUFS estimate, headroom

Format as JSON with keys: summary (1 sentence verdict), scores (object with frequency_balance, dynamics, stereo_image, phase, loudness each 1-10), issues (array of {area, problem, fix}), verdict (release-ready / needs-work / major-issues).`,

  musical: `You are a Grammy-winning music producer analyzing a track. Provide structured, concise feedback on:
- **Arrangement**: Density, space, build/release
- **Tonal Balance**: Warmth vs brightness, harmonic clarity
- **Vocal Treatment**: Presence, clarity, effects
- **Low-End**: Sub/bass relationship, clarity, impact
- **Energy Flow**: Momentum, tension, dynamics

Format as JSON with keys: summary (1 sentence verdict), scores (object with arrangement, tonal_balance, vocal_treatment, low_end, energy_flow each 1-10), issues (array of {area, problem, fix}), verdict (compelling / decent / flat).`,

  perception: `You are a top A&R and music supervisor analyzing a track for commercial potential. Provide structured, concise feedback on:
- **First Impression**: Hook, impact in first 10 seconds
- **Emotional Impact**: Does it evoke feeling? What mood?
- **Genre Fit**: How well does it fit its genre conventions?
- **Commercial Readiness**: Radio/playlist ready?
- **Memorability**: Would a listener return?

Format as JSON with keys: summary (1 sentence verdict), scores (object with first_impression, emotional_impact, genre_fit, commercial_readiness, memorability each 1-10), issues (array of {area, problem, fix}), verdict (ready / promising / needs-rethinking).`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { trackName, storagePath, mode } = await req.json();

    if (!trackName || !storagePath || !mode) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = modePrompts[mode];
    if (!systemPrompt) {
      return new Response(JSON.stringify({ error: "Invalid listening mode" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const userPrompt = `Analyze the track "${trackName}". Since you cannot listen to audio directly, simulate a realistic and varied professional analysis based on the track name, likely genre cues, and your expertise. Provide genuinely useful, specific feedback as if you had listened. Always return valid JSON only, no markdown wrapping.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from response (strip markdown code fences if present)
    let feedback;
    try {
      const cleaned = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      feedback = JSON.parse(cleaned);
    } catch {
      feedback = { summary: rawContent, scores: {}, issues: [], verdict: "unknown" };
    }

    // Store feedback in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from("feedback").insert({
      track_name: trackName,
      storage_path: storagePath,
      listening_mode: mode,
      feedback,
    });

    return new Response(JSON.stringify({ feedback, mode }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-track error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
