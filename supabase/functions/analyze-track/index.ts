import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const technicalMetricsBlock = `
  "technical_metrics": {
    "integrated_lufs": <number between -24 and -6>,
    "short_term_lufs": <number between -24 and -6>,
    "dynamic_range": <number between 2 and 18>,
    "peak_dbtp": <number between -6 and 0>,
    "stereo_correlation": <number between -0.2 and 1.0>,
    "crest_factor": <number between 3 and 18>
  },
  "fullAnalysis": {
    "mixBalance": "2-3 sentences analyzing the overall mix balance, level relationships between elements, and how well instruments sit together.",
    "dynamics": "2-3 sentences analyzing dynamics processing, loudness, compression, and transient handling.",
    "stereoSpace": "2-3 sentences analyzing the stereo image, spatial placement of elements, and use of width/depth.",
    "frequencyBalance": "2-3 sentences analyzing the frequency spectrum, tonal balance, and how different frequency ranges interact."
  },`;

const musicalMetricsBlock = `
  "technical_metrics": {
    "integrated_lufs": <number between -24 and -6>,
    "short_term_lufs": <number between -24 and -6>,
    "dynamic_range": <number between 2 and 18>,
    "peak_dbtp": <number between -6 and 0>,
    "stereo_correlation": <number between -0.2 and 1.0>,
    "crest_factor": <number between 3 and 18>
  },
  "fullAnalysis": {
    "energyArc": "2-3 sentences analyzing how energy builds, peaks, and releases across the track. Does the arrangement create satisfying momentum?",
    "sectionContrast": "2-3 sentences analyzing contrast between sections (verse/chorus/bridge). Do transitions feel impactful? Is there enough variation?",
    "grooveContinuity": "2-3 sentences analyzing rhythmic feel, groove consistency, and how well rhythmic elements lock together throughout.",
    "hookClarity": "2-3 sentences analyzing melodic hooks, memorable moments, and whether the main ideas land clearly and stick."
  },`;

const perceptionMetricsBlock = `
  "technical_metrics": {
    "integrated_lufs": <number between -24 and -6>,
    "short_term_lufs": <number between -24 and -6>,
    "dynamic_range": <number between 2 and 18>,
    "peak_dbtp": <number between -6 and 0>,
    "stereo_correlation": <number between -0.2 and 1.0>,
    "crest_factor": <number between 3 and 18>
  },
  "fullAnalysis": {
    "mixBalance": "2-3 sentences analyzing the overall mix balance, level relationships between elements, and how well instruments sit together.",
    "dynamics": "2-3 sentences analyzing dynamics processing, loudness, compression, and transient handling.",
    "stereoSpace": "2-3 sentences analyzing the stereo image, spatial placement of elements, and use of width/depth.",
    "frequencyBalance": "2-3 sentences analyzing the frequency spectrum, tonal balance, and how different frequency ranges interact."
  },`;

const modePrompts: Record<string, string> = {
  technical: `You are a world-class mixing engineer analyzing a track. Provide structured, concise feedback.

Return valid JSON only (no markdown) with this exact structure:
{
  "track_name": "<the track name provided>",
  "overall_impression": "1-2 sentence summary of the mix quality",
${technicalMetricsBlock}
  "top_priorities": [
    { "title": "short issue name", "why": "why this matters", "fix": "specific actionable fix" },
    { "title": "...", "why": "...", "fix": "..." },
    { "title": "...", "why": "...", "fix": "..." }
  ],
  "what_works": [
    { "title": "strength name", "detail": "why this works well" },
    { "title": "...", "detail": "..." }
  ],
  "fix_one_thing": { "title": "the single most impactful fix", "why": "why this matters most", "how": "step-by-step how to fix it" },
  "focus_response": "<If the artist provided context about their intent, write 2-4 sentences directly addressing their specific question or goal. Be concrete and reference the track. If no context was provided, set to null.>",
  "timestamps": []
}

Focus on: frequency balance, dynamic range, stereo image, phase correlation, loudness.
Generate realistic technical_metrics values based on likely genre characteristics and production quality.`,

  musical: `You are a Grammy-winning music producer analyzing a track. Provide structured, concise feedback.

Return valid JSON only (no markdown) with this exact structure:
{
  "track_name": "<the track name provided>",
  "overall_impression": "1-2 sentence summary of the musical quality",
${musicalMetricsBlock}
  "top_priorities": [
    { "title": "short issue name", "why": "why this matters", "fix": "specific actionable fix" },
    { "title": "...", "why": "...", "fix": "..." },
    { "title": "...", "why": "...", "fix": "..." }
  ],
  "what_works": [
    { "title": "strength name", "detail": "why this works well" },
    { "title": "...", "detail": "..." }
  ],
  "fix_one_thing": { "title": "the single most impactful fix", "why": "why this matters most", "how": "step-by-step how to fix it" },
  "focus_response": "<If the artist provided context about their intent, write 2-4 sentences directly addressing their specific question or goal. Be concrete and reference the track. If no context was provided, set to null.>",
  "timestamps": []
}

Focus on: arrangement, tonal balance, vocal treatment, low-end, energy flow.
Generate realistic technical_metrics values based on likely genre characteristics and production quality.`,

  perception: `You are a top A&R and music supervisor analyzing a track for commercial potential. Provide structured, concise feedback.

Return valid JSON only (no markdown) with this exact structure:
{
  "track_name": "<the track name provided>",
  "overall_impression": "1-2 sentence summary of commercial potential",
${perceptionMetricsBlock}
  "top_priorities": [
    { "title": "short issue name", "why": "why this matters", "fix": "specific actionable fix" },
    { "title": "...", "why": "...", "fix": "..." },
    { "title": "...", "why": "...", "fix": "..." }
  ],
  "what_works": [
    { "title": "strength name", "detail": "why this works well" },
    { "title": "...", "detail": "..." }
  ],
  "fix_one_thing": { "title": "the single most impactful fix", "why": "why this matters most", "how": "step-by-step how to fix it" },
  "focus_response": "<If the artist provided context about their intent, write 2-4 sentences directly addressing their specific question or goal. Be concrete and reference the track. If no context was provided, set to null.>",
  "timestamps": []
}

Focus on: first impression, emotional impact, genre fit, commercial readiness, memorability.
Generate realistic technical_metrics values based on likely genre characteristics and production quality.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { trackName, storagePath, mode, context } = await req.json();

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

    const contextLine = context ? ` The artist says about their intent: "${context}".` : "";
    const userPrompt = `Analyze the track "${trackName}".${contextLine} Since you cannot listen to audio directly, simulate a realistic and varied professional analysis based on the track name, likely genre cues, and your expertise. Provide genuinely useful, specific feedback as if you had listened. Always return valid JSON only, no markdown wrapping.`;

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
    } catch (parseErr) {
      console.warn("Primary JSON parse failed, attempting extraction:", parseErr);
      // Try to extract JSON object from the raw content
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          feedback = JSON.parse(jsonMatch[0]);
        } catch {
          console.error("Secondary JSON parse also failed");
        }
      }
      if (!feedback) {
        feedback = {
          track_name: trackName,
          overall_impression: rawContent,
          top_priorities: [],
          what_works: [],
          fix_one_thing: null,
          timestamps: [],
        };
      }
    }

    // Ensure track_name is set
    feedback.track_name = feedback.track_name || trackName;

    // Generate a signed URL for playback
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: signedData } = await supabase.storage
      .from("tracks")
      .createSignedUrl(storagePath, 3600);

    // Store feedback in database
    await supabase.from("feedback").insert({
      track_name: trackName,
      storage_path: storagePath,
      listening_mode: mode,
      feedback,
    });

    return new Response(
      JSON.stringify({
        feedback,
        mode,
        audioUrl: signedData?.signedUrl || null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("analyze-track error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
