import { useState, useCallback } from "react";
import { Upload, Music, Activity, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { ListeningMode, FeedbackResult, TechnicalMetrics } from "@/pages/Analyze";

/** Map backend metrics shape to internal TechnicalMetrics */
function normalizeMetrics(fb: any): TechnicalMetrics | undefined {
  const toNum = (v: unknown): number | undefined => {
    if (v == null) return undefined;
    const n = typeof v === "number" ? v : parseFloat(String(v));
    return Number.isFinite(n) ? n : undefined;
  };

  // Always try flat fields first (backend canonical shape), then nested fallback
  const il = fb?.integratedLoudness ?? fb?.integrated_lufs ?? fb?.technical_metrics?.integrated_lufs;
  const dr = fb?.dynamicRange ?? fb?.dynamic_range ?? fb?.technical_metrics?.dynamic_range;
  const sw = fb?.stereoWidth ?? fb?.stereo_correlation ?? fb?.technical_metrics?.stereo_correlation;
  const skr = fb?.subKickRatio ?? fb?.sub_kick_ratio ?? fb?.technical_metrics?.sub_kick_ratio;
  const cf = fb?.transientDensity ?? fb?.crest_factor ?? fb?.technical_metrics?.crest_factor;
  const rms = fb?.rms ?? fb?.technical_metrics?.short_term_lufs;
  const peak = fb?.peak_dbtp ?? fb?.peakDbtp ?? fb?.technical_metrics?.peak_dbtp;

  const hasAny = il != null || dr != null || sw != null || skr != null || cf != null || rms != null || peak != null;
  if (!hasAny) {
    console.warn("[normalizeMetrics] No metric fields found on fb:", Object.keys(fb || {}));
    return undefined;
  }

  const result: TechnicalMetrics = {
    integrated_lufs: toNum(il),
    short_term_lufs: toNum(rms),
    dynamic_range: toNum(dr),
    peak_dbtp: toNum(peak),
    stereo_correlation: toNum(sw),
    crest_factor: toNum(cf),
    sub_kick_ratio: toNum(skr),
  };

  console.log("[normalizeMetrics] Result:", result);
  return result;
}

const modes: { id: ListeningMode; label: string; tag: string; icon: typeof Activity }[] = [
  { id: "technical", label: "Technical", tag: "The engineer", icon: Activity },
  { id: "musical", label: "Musical", tag: "The producer", icon: Music },
  { id: "perception", label: "Perception", tag: "The listener", icon: Eye },
];

interface Props {
  onResult: (result: FeedbackResult) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (v: boolean) => void;
  onProgressStep?: (step: number) => void;
  onError?: (msg: string) => void;
}

const TrackUploader = ({ onResult, isAnalyzing, setIsAnalyzing, onProgressStep, onError }: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<ListeningMode>("technical");
  const [dragOver, setDragOver] = useState(false);
  const [context, setContext] = useState("");

  const MAX_FILE_SIZE = 200 * 1024 * 1024;

  const validateAndSetFile = (f: File) => {
    if (!f.type.startsWith("audio/")) {
      toast({ title: "Please upload an audio file", variant: "destructive", duration: 2500 });
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      toast({ title: "File too large", description: "Maximum file size is 200MB", variant: "destructive", duration: 2500 });
      return;
    }
    setFile(f);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) validateAndSetFile(dropped);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) validateAndSetFile(selected);
  };

  const analyze = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    onProgressStep?.(0); // Uploading track

    try {
      const storagePath = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("tracks")
        .upload(storagePath, file);

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      console.log("[TrackUploader] Uploaded to bucket: tracks, path:", storagePath);
      onProgressStep?.(1); // Reading audio

      const { data: signedData, error: signedError } = await supabase.storage
        .from("tracks")
        .createSignedUrl(storagePath, 3600);

      if (signedError) {
        console.warn("[TrackUploader] Signed URL failed:", signedError.message);
      } else {
        console.log("[TrackUploader] Signed URL created:", signedData?.signedUrl?.substring(0, 80) + "...");
      }

      onProgressStep?.(2); // Generating feedback

      const { data: result, error } = await supabase.functions.invoke("proxy-feedback", {
        body: {
          audioUrl: signedData?.signedUrl || undefined,
          fileName: file.name,
          mode,
          userContext: context.trim() || undefined,
        },
      });

      if (error) throw error;

      onProgressStep?.(3); // Finalizing report

      console.log("Full API response:", JSON.stringify(result, null, 2));

      let fb = result?.feedback;

      // Safety net: if overall_impression contains a JSON string (edge function parse failure),
      // try to re-parse it and use that as the actual feedback object
      if (
        fb &&
        typeof fb.overall_impression === "string" &&
        fb.overall_impression.trim().startsWith("{") &&
        (!fb.top_priorities || fb.top_priorities.length === 0)
      ) {
        try {
          const reparsed = JSON.parse(fb.overall_impression);
          if (reparsed && typeof reparsed === "object" && reparsed.overall_impression) {
            console.log("[TrackUploader] Re-parsed feedback from overall_impression string");
            fb = reparsed;
          }
        } catch {
          console.warn("[TrackUploader] overall_impression looks like JSON but failed to parse");
        }
      }

      // Normalize mode-specific schemas into common internal format
      let rawPriorities: any[] = [];
      let rawWorks: any[] = [];
      let rawFixOne: any = undefined;

      if (mode === "musical") {
        rawPriorities = (fb?.arrangementNotes || fb?.top_priorities || []).map((p: any) => ({
          title: p.section || p.title || "",
          why: p.observation || p.why || "",
          fix: p.arrangement_move || p.suggestion || p.fix || "",
          time: p.timestamp ?? p.time,
        }));
        rawWorks = fb?.whatLands || fb?.what_works || [];
        rawFixOne = fb?.focusHere || fb?.fix_one_thing;
      } else if (mode === "perception") {
        rawPriorities = (fb?.systemNotes || fb?.top_priorities || []).map((p: any) => ({
          title: p.observation || p.title || "",
          why: p.translationRisk || p.why || "",
          fix: p.fix || "",
          time: p.timestamp ?? p.time,
        }));
        rawWorks = fb?.whatTranslates || fb?.what_works || [];
        rawFixOne = fb?.urgentFix || fb?.fix_one_thing;
      } else {
        // Technical (default)
        rawPriorities = (fb?.priorities || fb?.top_priorities || []).map((p: any) => ({
          title: p.issue || p.title || "",
          why: p.whyItMatters || p.why || "",
          fix: p.suggestedFix || p.fix || "",
          time: p.timestamp ?? p.time,
        }));
        rawWorks = fb?.whatWorks || fb?.what_works || [];
        rawFixOne = fb?.ifFixOneThing || fb?.fix_one_thing;
      }

      const normalized = {
        track_name: fb?.track_name || file.name,
        overall_impression: fb?.overallImpression || fb?.overall_impression || "",
        top_priorities: rawPriorities.map((p: any) => ({
          title: p.title,
          why: p.why,
          fix: p.fix,
        })),
        what_works: (rawWorks || []).map((w: any) =>
          typeof w === "string"
            ? { title: w, detail: "" }
            : {
                title: w.title ?? "",
                detail: w.detail || w.description || w.whyItWorks || w.body || "",
              }
        ),
        fix_one_thing: rawFixOne
          ? {
              title: rawFixOne.title || "",
              why: rawFixOne.why || rawFixOne.whyItMatters || "",
              how: rawFixOne.how || rawFixOne.suggestion || rawFixOne.fix || "",
            }
          : undefined,
        timestamps: rawPriorities
          .map((p: any, i: number) => {
            const t = p.time;
            if (t !== undefined && t !== null) return { time: t, label: p.title };
            return null;
          })
          .filter(Boolean) as Array<{ time: number; label: string }>,
        technical_metrics: normalizeMetrics(fb),
        fullAnalysis: fb?.fullAnalysis || undefined,
        focus_response: fb?.focus_response || undefined,
      };

      console.log("Normalized feedback:", JSON.stringify(normalized, null, 2));

      // Brief pause so user sees "Finalizing report" complete
      await new Promise((r) => setTimeout(r, 600));

      onResult({
        feedback: normalized,
        mode,
        audioFile: file,
        context: context.trim() || undefined,
      });

      console.log("[TrackUploader] Skipping storage cleanup for:", storagePath);
    } catch (err: any) {
      console.error(err);
      const msg = err.message || "Something went wrong. Please try again.";
      onError?.(msg);
      toast({
        title: "Analysis failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <label
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center gap-4 rounded-xl p-12 cursor-pointer transition-all duration-150 ${
          dragOver
            ? "border-2 border-dashed border-foreground/30 bg-secondary/80"
            : file
            ? "border border-solid border-foreground/20 bg-secondary/30"
            : "border-2 border-dashed border-border-subtle hover:border-foreground/15 hover:bg-secondary/30"
        }`}
      >
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        {file ? (
          <>
            <Music className="w-8 h-8 text-foreground/60" />
            <div className="text-center">
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {(file.size / (1024 * 1024)).toFixed(1)} MB
              </p>
            </div>
          </>
        ) : (
          <>
            <Upload className="w-8 h-8 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm text-foreground">Drop your track here</p>
              <p className="text-xs text-muted-foreground mt-1">or click to browse · MP3, WAV, FLAC</p>
            </div>
          </>
        )}
      </label>

      {/* Context input */}
      <div>
        <input
          type="text"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && file && !isAnalyzing) {
              e.preventDefault();
              analyze();
            }
          }}
          placeholder="What are you going for?"
          className="w-full rounded-xl border border-border-subtle bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="text-[11px] text-muted-foreground/50 mt-1.5 ml-1">
          Optional: references, goals, or specific concerns.
        </p>
      </div>

      {/* Mode selector */}
      <div>
        <p className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase mb-3">
          Listening mode
        </p>
        <div className="grid grid-cols-3 gap-3">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`rounded-lg border p-4 text-left transition-all duration-150 ${
                mode === m.id
                  ? "border-foreground bg-foreground/10 shadow-[0_0_0_1px_hsl(var(--foreground)/0.18)]"
                  : "border-border-subtle hover:border-foreground/10"
              }`}
            >
              <m.icon className="w-4 h-4 mb-2 text-foreground/70" />
              <p className="text-sm font-medium">{m.label}</p>
              <p className="font-mono-brand text-[10px] text-muted-foreground">{m.tag}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Analyze button */}
      <Button
        variant="hero"
        size="lg"
        className="w-full h-12 text-sm"
        disabled={!file || isAnalyzing}
        onClick={analyze}
      >
        {isAnalyzing ? "Analyzing…" : "Analyze my mix"}
      </Button>
    </div>
  );
};

export default TrackUploader;
