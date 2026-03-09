import { useState, useCallback, useRef, useEffect } from "react";
import { Upload, Music, Activity, Eye, Target, Disc3, CheckCircle2, ArrowRight, Shield } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/hooks/use-toast";
import { normalizeFeedbackResponse } from "@/lib/normalizeFeedback";
import type { ListeningMode, FeedbackResult } from "@/pages/Analyze";

const MONO = "'IBM Plex Mono', 'DM Mono', monospace";

const modes: { id: ListeningMode; label: string; desc: string; icon: typeof Activity }[] = [
  { id: "technical", label: "Technical", desc: "Mix balance, spectrum, dynamics", icon: Activity },
  { id: "musical", label: "Musical", desc: "Energy, arrangement, emotion", icon: Music },
  { id: "perception", label: "Perception", desc: "First impression, fatigue, clarity", icon: Eye },
];

type Goal = "mixing" | "mastering" | "release_check";
const goals: { id: Goal; label: string; icon: typeof Target }[] = [
  { id: "mixing", label: "Mixing", icon: Disc3 },
  { id: "mastering", label: "Mastering", icon: Target },
  { id: "release_check", label: "Release check", icon: CheckCircle2 },
];

interface Props {
  onResult: (result: FeedbackResult) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (v: boolean) => void;
  onProgressStep?: (step: number) => void;
  onError?: (msg: string) => void;
  defaultMode?: ListeningMode;
}

const TrackUploader = ({ onResult, isAnalyzing, setIsAnalyzing, onProgressStep, onError, defaultMode }: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<ListeningMode>(defaultMode || "technical");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [context, setContext] = useState("");
  const [goal, setGoal] = useState<Goal>("mixing");

  useEffect(() => {
    setFile(null);
    setContext("");
    setGoal("mixing");
    setDragOver(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const MAX_FILE_SIZE = 200 * 1024 * 1024;

  const validateAndSetFile = useCallback((f: File) => {
    if (!f.type.startsWith("audio/")) {
      toast({ title: "Please upload an audio file", variant: "destructive", duration: 2500 });
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      toast({ title: "File too large", description: "Maximum file size is 200MB", variant: "destructive", duration: 2500 });
      return;
    }
    setFile(f);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) validateAndSetFile(dropped);
  }, [validateAndSetFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) validateAndSetFile(selected);
  };

  const analyze = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    onProgressStep?.(0);
    try {
      const storagePath = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("tracks").upload(storagePath, file);
      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
      onProgressStep?.(1);
      const { data: signedData, error: signedError } = await supabase.storage.from("tracks").createSignedUrl(storagePath, 3600);
      if (signedError) console.warn("[TrackUploader] Signed URL failed:", signedError.message);
      const fullSignedUrl = signedData?.signedUrl
        ? (signedData.signedUrl.startsWith("http") ? signedData.signedUrl : `https://ltkkcqthnnnyskvomjeb.supabase.co/storage/v1${signedData.signedUrl}`)
        : undefined;
      onProgressStep?.(2);
      const feedbackRes = await fetch(
        "https://secondears-backend-production.up.railway.app/api/feedback",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": "secondears-secret-2024" },
          body: JSON.stringify({ audioUrl: fullSignedUrl, fileName: file.name, mode, userContext: context.trim() || undefined, goal }),
        }
      );
      if (!feedbackRes.ok) throw new Error(`Backend error: ${feedbackRes.status}`);
      const initialRes = await feedbackRes.json();

      let result: any;
      if (initialRes.jobId) {
        const POLL_INTERVAL = 4000;
        const MAX_POLLS = 90;
        let polls = 0;
        while (polls < MAX_POLLS) {
          await new Promise((r) => setTimeout(r, POLL_INTERVAL));
          polls++;
          const statusRes = await fetch(
            `https://secondears-backend-production.up.railway.app/api/feedback/status/${initialRes.jobId}`,
            { headers: { "x-api-key": "secondears-secret-2024" } }
          );
          if (!statusRes.ok) throw new Error(`Status check failed: ${statusRes.status}`);
          const statusData = await statusRes.json();
          console.log("[poll] raw:", JSON.stringify(statusData));
          if (statusData.status === "done") {
            console.log("[poll] done - result keys:", Object.keys(statusData.result || {}));
            console.log("[poll] feedback:", JSON.stringify(statusData.result?.feedback));
            result = statusData.result;
            break;
          }
          if (statusData.status === "error") {
            throw new Error(statusData.error || "Analysis failed on the server");
          }
        }
        if (!result) throw new Error("Analysis timed out. Please try again.");
      } else {
        result = initialRes;
      }

      onProgressStep?.(3);
      const normalized = normalizeFeedbackResponse(result, mode, context.trim() || undefined, file.name);
      await new Promise((r) => setTimeout(r, 1800));
      onResult({ normalized, audioFile: file });
    } catch (err: any) {
      const msg = err.message || "Something went wrong. Please try again.";
      onError?.(msg);
      toast({ title: "Analysis failed", description: msg, variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* ═══ UPLOAD ZONE ═══ */}
      <input
        id="track-file-input"
        ref={fileInputRef}
        type="file"
        accept=".mp3,.wav,.flac,audio/*"
        onChange={handleFileChange}
        className="sr-only"
      />
      <div
        role="button"
        tabIndex={0}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className="cursor-pointer select-none transition-all duration-150 rounded-lg overflow-hidden"
        style={{
          border: dragOver
            ? "2px solid hsl(var(--foreground) / 0.35)"
            : file
              ? "1px solid hsl(var(--foreground) / 0.20)"
              : "2px dashed hsl(var(--border-subtle))",
          backgroundColor: dragOver
            ? "hsl(var(--foreground) / 0.06)"
            : file
              ? "hsl(var(--foreground) / 0.03)"
              : "hsl(var(--secondary) / 0.3)",
          padding: file ? "16px 20px" : "32px 20px",
        }}
      >
        {file ? (
          <div className="flex items-center gap-3">
            <div
              className="shrink-0 flex items-center justify-center rounded-md"
              style={{
                width: 40,
                height: 40,
                backgroundColor: "hsl(var(--foreground) / 0.08)",
              }}
            >
              <Music className="w-5 h-5" style={{ color: "hsl(var(--foreground) / 0.65)" }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate" style={{ color: "hsl(var(--foreground))" }}>{file.name}</p>
              <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                {(file.size / (1024 * 1024)).toFixed(1)} MB · Click to replace
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div
              className="flex items-center justify-center rounded-lg"
              style={{
                width: 52,
                height: 52,
                backgroundColor: "hsl(var(--foreground) / 0.06)",
                border: "1px solid hsl(var(--border-subtle) / 0.5)",
              }}
            >
              <Upload className="w-6 h-6" style={{ color: "hsl(var(--foreground) / 0.45)" }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: "hsl(var(--foreground) / 0.85)" }}>
                Drop your mix here
              </p>
              <p className="text-xs mt-1.5" style={{ color: "hsl(var(--muted-foreground) / 0.7)" }}>
                or <span className="underline underline-offset-2" style={{ color: "hsl(var(--foreground) / 0.6)" }}>browse files</span> · MP3, WAV, FLAC up to 200 MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ═══ MODE + GOAL SELECTORS ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Listening mode */}
        <div>
          <p
            className="uppercase mb-2"
            style={{
              fontFamily: MONO,
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.10em",
              color: "hsl(var(--foreground) / 0.50)",
            }}
          >
            Listening mode
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {modes.map((m) => {
              const active = mode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className="rounded-md text-left transition-all duration-100 p-3"
                  style={{
                    border: active
                      ? "1.5px solid hsl(var(--foreground) / 0.30)"
                      : "1px solid hsl(var(--border-subtle) / 0.6)",
                    backgroundColor: active
                      ? "hsl(var(--foreground) / 0.08)"
                      : "transparent",
                    boxShadow: active
                      ? "inset 0 0 0 1px hsl(var(--foreground) / 0.06)"
                      : "none",
                  }}
                >
                  <m.icon
                    className="w-3.5 h-3.5 mb-1.5"
                    style={{ color: active ? "hsl(var(--foreground) / 0.85)" : "hsl(var(--foreground) / 0.35)" }}
                  />
                  <p
                    className="text-xs font-medium"
                    style={{ color: active ? "hsl(var(--foreground))" : "hsl(var(--foreground) / 0.70)" }}
                  >
                    {m.label}
                  </p>
                  <p
                    className="mt-0.5"
                    style={{
                      fontFamily: MONO,
                      fontSize: 9,
                      color: active ? "hsl(var(--muted-foreground))" : "hsl(var(--muted-foreground) / 0.5)",
                      lineHeight: 1.3,
                    }}
                  >
                    {m.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Goal */}
        <div>
          <p
            className="uppercase mb-2"
            style={{
              fontFamily: MONO,
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.10em",
              color: "hsl(var(--foreground) / 0.50)",
            }}
          >
            Goal
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {goals.map((g) => {
              const active = goal === g.id;
              return (
                <button
                  key={g.id}
                  onClick={() => setGoal(g.id)}
                  className="rounded-md text-left transition-all duration-100 p-3"
                  style={{
                    border: active
                      ? "1.5px solid hsl(var(--foreground) / 0.30)"
                      : "1px solid hsl(var(--border-subtle) / 0.6)",
                    backgroundColor: active
                      ? "hsl(var(--foreground) / 0.08)"
                      : "transparent",
                    boxShadow: active
                      ? "inset 0 0 0 1px hsl(var(--foreground) / 0.06)"
                      : "none",
                  }}
                >
                  <g.icon
                    className="w-3.5 h-3.5 mb-1.5"
                    style={{ color: active ? "hsl(var(--foreground) / 0.85)" : "hsl(var(--foreground) / 0.35)" }}
                  />
                  <p
                    className="text-xs font-medium"
                    style={{ color: active ? "hsl(var(--foreground))" : "hsl(var(--foreground) / 0.70)" }}
                  >
                    {g.label}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ CONTEXT INPUT ═══ */}
      <div>
        <p
          className="uppercase mb-2"
          style={{
            fontFamily: MONO,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: "0.10em",
            color: "hsl(var(--foreground) / 0.50)",
          }}
        >
          Context <span style={{ color: "hsl(var(--muted-foreground) / 0.4)", fontWeight: 400 }}>· optional</span>
        </p>
        <input
          type="text"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && file && !isAnalyzing) { e.preventDefault(); analyze(); } }}
          placeholder="What are you going for? References, goals, concerns…"
          className="w-full rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          style={{
            border: "1px solid hsl(var(--border-subtle) / 0.6)",
            backgroundColor: "hsl(var(--background))",
            padding: "10px 14px",
            color: "hsl(var(--foreground))",
          }}
        />
      </div>

      {/* ═══ CTA ═══ */}
      <div>
        <button
          disabled={!file || isAnalyzing}
          onClick={analyze}
          className="w-full flex items-center justify-center gap-2 rounded-md font-medium transition-all duration-100 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            height: 48,
            fontSize: 14,
            backgroundColor: file ? "hsl(var(--foreground))" : "hsl(var(--foreground) / 0.15)",
            color: file ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground) / 0.40)",
            border: "1px solid transparent",
            boxShadow: file ? "0 1px 3px hsl(var(--foreground) / 0.15)" : "none",
          }}
        >
          {isAnalyzing ? "Analyzing…" : "Analyze my mix"}
          {!isAnalyzing && file && <ArrowRight className="w-4 h-4" />}
        </button>
        <div
          className="flex items-center justify-center gap-3 mt-2.5"
          style={{
            fontFamily: MONO,
            fontSize: 10,
            color: "hsl(var(--muted-foreground) / 0.5)",
          }}
        >
          <span>~2 min processing</span>
          <span style={{ color: "hsl(var(--border-subtle))" }}>·</span>
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            Audio never stored permanently
          </span>
        </div>
      </div>
    </div>
  );
};

export default TrackUploader;
