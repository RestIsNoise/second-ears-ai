import { useState, useCallback, useRef, useEffect } from "react";
import { Upload, Music, Activity, Eye, Target, Disc3, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/hooks/use-toast";
import { normalizeFeedbackResponse } from "@/lib/normalizeFeedback";
import type { ListeningMode, FeedbackResult } from "@/pages/Analyze";

const modes: { id: ListeningMode; label: string; tag: string; icon: typeof Activity }[] = [
  { id: "technical", label: "Technical", tag: "The engineer", icon: Activity },
  { id: "musical", label: "Musical", tag: "The producer", icon: Music },
  { id: "perception", label: "Perception", tag: "The listener", icon: Eye },
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

      // Create project + version so backend can link the analysis
      let versionId: string | undefined;
      if (currentUser) {
        const { data: project, error: projErr } = await supabase
          .from("projects")
          .insert({ name: file.name, user_id: currentUser.id })
          .select("id")
          .single();
        if (projErr) console.error("[TrackUploader] project create failed:", projErr.message);
        if (project) {
          const { data: version, error: verErr } = await supabase
            .from("versions")
            .insert({ project_id: project.id, version_number: 1, track_name: file.name, audio_url: fullSignedUrl, storage_path: storagePath })
            .select("id")
            .single();
          if (verErr) console.error("[TrackUploader] version create failed:", verErr.message);
          if (version) versionId = version.id;
        }
      }

      const feedbackRes = await fetch(
        "https://secondears-backend-production.up.railway.app/api/feedback",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": "secondears-secret-2024" },
          body: JSON.stringify({ audioUrl: fullSignedUrl, fileName: file.name, mode, userContext: context.trim() || undefined, goal, user_id: currentUser?.id, version_id: versionId }),
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
      onResult({ normalized, audioFile: file, storagePath });
    } catch (err: any) {
      const msg = err.message || "Something went wrong. Please try again.";
      onError?.(msg);
      toast({ title: "Analysis failed", description: msg, variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
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
        className={`cursor-pointer flex flex-col items-center justify-center gap-4 rounded-xl p-12 select-none transition-all duration-150 ${
          dragOver ? "border-2 border-dashed border-foreground/30 bg-secondary/80"
          : file ? "border border-solid border-foreground/20 bg-secondary/30"
          : "border-2 border-dashed border-border-subtle hover:border-foreground/15 hover:bg-secondary/30"
        }`}
      >
        {file ? (
          <>
            <Music className="w-8 h-8 text-foreground/60" />
            <div className="text-center">
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
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
      </div>
      <div>
        <input
          type="text"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && file && !isAnalyzing) { e.preventDefault(); analyze(); } }}
          placeholder="What are you going for?"
          className="w-full rounded-xl border border-border-subtle bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="text-[11px] text-muted-foreground/50 mt-1.5 ml-1">Optional: references, goals, or specific concerns.</p>
      </div>
      <div>
        <p className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase mb-3">Listening mode</p>
        <div className="grid grid-cols-3 gap-3">
          {modes.map((m) => (
            <button key={m.id} onClick={() => setMode(m.id)}
              className={`rounded-lg border p-4 text-left transition-all duration-150 ${
                mode === m.id ? "border-foreground bg-foreground/10 shadow-[0_0_0_1px_hsl(var(--foreground)/0.18)]"
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
      <div>
        <p className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase mb-3">Goal</p>
        <div className="grid grid-cols-3 gap-3">
          {goals.map((g) => (
            <button key={g.id} onClick={() => setGoal(g.id)}
              className={`rounded-lg border p-4 text-left transition-all duration-150 ${
                goal === g.id ? "border-foreground bg-foreground/10 shadow-[0_0_0_1px_hsl(var(--foreground)/0.18)]"
                : "border-border-subtle hover:border-foreground/10"
              }`}
            >
              <g.icon className="w-4 h-4 mb-2 text-foreground/70" />
              <p className="text-sm font-medium">{g.label}</p>
            </button>
          ))}
        </div>
      </div>
      <Button variant="hero" size="lg" className="w-full h-12 text-sm" disabled={!file || isAnalyzing} onClick={analyze}>
        {isAnalyzing ? "Analyzing…" : "Analyze my mix"}
      </Button>
    </div>
  );
};

export default TrackUploader;
