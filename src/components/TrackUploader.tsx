import { useState, useCallback, useRef } from "react";
import { Upload, Music, Activity, Eye } from "lucide-react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    onProgressStep?.(0);
    try {
      const storagePath = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("tracks").upload(storagePath, file);
      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
      onProgressStep?.(1);
      const { data: signedData, error: signedError } = await supabase.storage.from("tracks").createSignedUrl(storagePath, 3600);
      if (signedError) console.warn("[TrackUploader] Signed URL failed:", signedError.message);
      onProgressStep?.(2);
      const { data: result, error } = await supabase.functions.invoke("proxy-feedback", {
        body: { audioUrl: signedData?.signedUrl || undefined, fileName: file.name, mode, userContext: context.trim() || undefined },
      });
      if (error) throw error;
      onProgressStep?.(3);
      const normalized = normalizeFeedbackResponse(result, mode, context.trim() || undefined, file.name);
      await new Promise((r) => setTimeout(r, 600));
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
    <div className="space-y-6">
      <input
        id="track-file-input"
        ref={fileInputRef}
        type="file"
        accept=".mp3,.wav,.flac,audio/*"
        onChange={handleFileChange}
        style={{position:"fixed",top:"-9999px",left:"-9999px",width:"1px",height:"1px",opacity:0}}
      />
      <label
        htmlFor="track-file-input"
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
      </label>
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
      <Button variant="hero" size="lg" className="w-full h-12 text-sm" disabled={!file || isAnalyzing} onClick={analyze}>
        {isAnalyzing ? "Analyzing…" : "Analyze my mix"}
      </Button>
    </div>
  );
};

export default TrackUploader;
