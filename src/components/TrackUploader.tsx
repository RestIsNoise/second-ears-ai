import { useState, useCallback, useRef, useEffect } from "react";
import { Upload, Music, SlidersHorizontal, Ear, Target, Disc3, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/hooks/use-toast";
import { normalizeFeedbackResponse } from "@/lib/normalizeFeedback";
import type { ListeningMode, FeedbackResult } from "@/pages/Analyze";

const modes: { id: ListeningMode; label: string; tag: string; icon: typeof SlidersHorizontal }[] = [
  { id: "technical", label: "Technical", tag: "The engineer", icon: SlidersHorizontal },
  { id: "musical", label: "Musical", tag: "The producer", icon: Music },
  { id: "perception", label: "Perception", tag: "The listener", icon: Ear },
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

  // Reset state on mount so returning to this page is always fresh
  useEffect(() => {
    setFile(null);
    setContext("");
    setGoal("mixing");
    setDragOver(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
        ? (signedData.signedUrl.startsWith("http") ? signedData.signedUrl : `https://nllfubvokhybmtnnqeuk.supabase.co/storage/v1${signedData.signedUrl}`)
        : undefined;
      onProgressStep?.(2);
      const { data: { user: currentUser } } = await supabase.auth.getUser();

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

      // If backend returns a jobId, poll for results
      let result: any;
      if (initialRes.jobId) {
        const POLL_INTERVAL = 4000;
        const MAX_POLLS = 90; // 6 min max
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
          // still processing — continue polling
        }
        if (!result) throw new Error("Analysis timed out. Please try again.");
      } else {
        // Legacy: backend returned result directly
        result = initialRes;
      }
      
      onProgressStep?.(3);
      const normalized = normalizeFeedbackResponse(result, mode, context.trim() || undefined, file.name);
      // Give step 3 "Finalizing" enough time to animate to ~95%+ before switching view
      await new Promise((r) => setTimeout(r, 1800));
      onResult({ normalized, rawResult: result, audioFile: file, storagePath });
    } catch (err: any) {
      const msg = err.message || "Something went wrong. Please try again.";
      onError?.(msg);
      toast({ title: "Analysis failed", description: msg, variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
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
        className="cursor-pointer flex flex-col items-center justify-center gap-3 select-none transition-all duration-100"
        style={{
          padding: "40px 24px",
          backgroundColor: dragOver ? "hsl(var(--panel-content))" : file ? "hsl(var(--card))" : "hsl(var(--card))",
          border: dragOver ? "2px dashed hsl(var(--foreground) / 0.25)" : file ? "2px solid hsl(var(--foreground) / 0.15)" : "2px dashed hsl(var(--foreground) / 0.1)",
          borderRadius: 3,
          boxShadow: "inset 0 2px 6px hsl(var(--panel-inset))",
        }}
      >
        {file ? (
          <>
            <Music className="w-6 h-6 text-foreground/50" />
            <div className="text-center">
              <p className="text-[12px] font-semibold" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{file.name}</p>
              <p className="text-[10px] text-muted-foreground mt-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
            </div>
          </>
        ) : (
          <>
            <Upload className="w-6 h-6 text-foreground/30" />
            <div className="text-center">
              <p className="text-[12px] text-foreground/60 font-medium" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Drop your track here</p>
              <p className="text-[10px] text-foreground/30 mt-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>or click to browse · MP3, WAV, FLAC</p>
            </div>
          </>
        )}
      </div>
      <div>
        <input
          type="text"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && file && !isAnalyzing) { e.preventDefault(); analyze(); } }}
          placeholder="What are you going for?"
          className="w-full border bg-card px-4 py-2.5 text-[12px] text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-ring"
          style={{
            borderColor: "hsl(var(--foreground) / 0.1)",
            borderRadius: 3,
            fontFamily: "'IBM Plex Mono', monospace",
          }}
        />
        <p className="text-[9px] text-foreground/30 mt-1 ml-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Optional: references, goals, or specific concerns.</p>
      </div>
      <div>
        <p
          className="text-[8px] text-foreground/40 tracking-[0.14em] uppercase mb-2 font-bold"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          Listening mode
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {modes.map((m) => (
            <button key={m.id} onClick={() => setMode(m.id)}
              className="text-left transition-all duration-100"
              style={{
                padding: "10px 12px",
                backgroundColor: mode === m.id ? "hsl(var(--panel-bg))" : "hsl(var(--card))",
                border: mode === m.id ? "2px solid hsl(var(--foreground) / 0.2)" : "2px solid hsl(var(--foreground) / 0.06)",
                borderRadius: 3,
                boxShadow: mode === m.id ? "inset 0 2px 4px hsl(var(--panel-inset))" : "none",
              }}
            >
              <m.icon className="w-3.5 h-3.5 mb-1.5 text-foreground/50" />
              <p className="text-[11px] font-bold" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{m.label}</p>
              <p className="text-[9px] text-foreground/35 mt-0.5" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{m.tag}</p>
            </button>
          ))}
        </div>
      </div>
      <div>
        <p
          className="text-[8px] text-foreground/40 tracking-[0.14em] uppercase mb-2 font-bold"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          Goal
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {goals.map((g) => (
            <button key={g.id} onClick={() => setGoal(g.id)}
              className="text-left transition-all duration-100"
              style={{
                padding: "10px 12px",
                backgroundColor: goal === g.id ? "hsl(var(--panel-bg))" : "hsl(var(--card))",
                border: goal === g.id ? "2px solid hsl(var(--foreground) / 0.2)" : "2px solid hsl(var(--foreground) / 0.06)",
                borderRadius: 3,
                boxShadow: goal === g.id ? "inset 0 2px 4px hsl(var(--panel-inset))" : "none",
              }}
            >
              <g.icon className="w-3.5 h-3.5 mb-1.5 text-foreground/50" />
              <p className="text-[11px] font-bold" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{g.label}</p>
            </button>
          ))}
        </div>
      </div>
      <Button
        variant="default"
        size="lg"
        className="w-full h-11 text-[11px] font-bold tracking-[0.06em] uppercase"
        style={{ borderRadius: 3, fontFamily: "'IBM Plex Mono', monospace" }}
        disabled={!file || isAnalyzing}
        onClick={analyze}
      >
        {isAnalyzing ? "Analyzing…" : "Analyze my mix"}
      </Button>
    </div>
  );
};

export default TrackUploader;
