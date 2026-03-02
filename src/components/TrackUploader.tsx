import { useState, useCallback } from "react";
import { Upload, Music, Activity, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { ListeningMode, FeedbackResult } from "@/pages/Analyze";


const modes: { id: ListeningMode; label: string; tag: string; icon: typeof Activity }[] = [
  { id: "technical", label: "Technical", tag: "The engineer", icon: Activity },
  { id: "musical", label: "Musical", tag: "The producer", icon: Music },
  { id: "perception", label: "Perception", tag: "The listener", icon: Eye },
];

interface Props {
  onResult: (result: FeedbackResult) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (v: boolean) => void;
}

const TrackUploader = ({ onResult, isAnalyzing, setIsAnalyzing }: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<ListeningMode>("technical");
  const [dragOver, setDragOver] = useState(false);
  const [context, setContext] = useState("");

  const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB

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

    try {
      // Upload file to storage
      const storagePath = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("tracks")
        .upload(storagePath, file);

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      console.log("[TrackUploader] Uploaded to bucket: tracks, path:", storagePath);

      // Create signed URL for playback (1 hour expiry)
      const { data: signedData, error: signedError } = await supabase.storage
        .from("tracks")
        .createSignedUrl(storagePath, 3600);

      if (signedError) {
        console.warn("[TrackUploader] Signed URL failed:", signedError.message);
      } else {
        console.log("[TrackUploader] Signed URL created:", signedData?.signedUrl?.substring(0, 80) + "...");
      }

      // Send to analyze-track edge function (uses Lovable AI gateway)
      const { data: result, error } = await supabase.functions.invoke("analyze-track", {
        body: { trackName: file.name, storagePath, mode, context: context.trim() || undefined },
      });

      if (error) throw error;

      console.log("Full API response:", JSON.stringify(result, null, 2));

      const fb = result?.feedback;

      const normalized = {
        track_name: fb?.track_name || file.name,
        overall_impression: fb?.overall_impression || "",
        top_priorities: (fb?.top_priorities || []).map((p: any) => ({
          title: p.title,
          why: p.why,
          fix: p.fix,
        })),
        what_works: (fb?.what_works || []).map((w: any) =>
          typeof w === "string"
            ? { title: w, detail: "" }
            : { title: w.title ?? "", detail: w.detail ?? "" }
        ),
        fix_one_thing: fb?.fix_one_thing || undefined,
        timestamps: fb?.timestamps || [],
        technical_metrics: fb?.technical_metrics || undefined,
        fullAnalysis: fb?.fullAnalysis || undefined,
        focus_response: fb?.focus_response || undefined,
      };

      console.log("Normalized feedback:", JSON.stringify(normalized, null, 2));

      onResult({
        feedback: normalized,
        mode,
        audioFile: file,
        context: context.trim() || undefined,
      });

      // Storage cleanup disabled — keep file so waveform can load reliably
      // TODO: re-enable cleanup once waveform loading is confirmed stable
      console.log("[TrackUploader] Skipping storage cleanup for:", storagePath);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Analysis failed",
        description: err.message || "Something went wrong",
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
        className={`relative flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-12 cursor-pointer transition-colors ${
          dragOver
            ? "border-foreground/30 bg-secondary/80"
            : file
            ? "border-foreground/20 bg-secondary/40"
            : "border-border-subtle hover:border-foreground/15 hover:bg-secondary/30"
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
          placeholder="What are you going for?"
          className="w-full rounded-xl border border-border-subtle bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
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
                  ? "border-foreground bg-foreground/[0.07] shadow-[0_0_0_1px_hsl(var(--foreground)/0.15)]"
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
