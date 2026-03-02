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

  const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB

  const validateAndSetFile = (f: File) => {
    if (!f.type.startsWith("audio/")) {
      toast({ title: "Please upload an audio file", variant: "destructive" });
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      toast({ title: "File too large", description: "Maximum file size is 200MB", variant: "destructive" });
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

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("tracks")
        .getPublicUrl(storagePath);

      // Send URL to backend via proxy edge function
      const { data: feedback, error } = await supabase.functions.invoke("proxy-feedback", {
        body: { audioUrl: urlData.publicUrl, mode, fileName: file.name },
      });

      if (error) throw error;

      console.log("Full API response:", JSON.stringify(feedback, null, 2));

      // Extract from top-level or nested .feedback
      const fb = feedback?.feedback;

      const priorities = (feedback?.priorities || fb?.priorities || []).map((p: any) => ({
        title: p.issue ?? p.title,
        why: p.whyItMatters ?? p.why,
        fix: p.suggestedFix ?? p.fix,
      }));

      const whatWorks = feedback?.whatWorks || fb?.whatWorks || [];

      const rawFix = feedback?.fixOneThingToday ?? fb?.ifFixOneThing ?? fb?.fixOneThingToday ?? "";
      const fixOneThing = typeof rawFix === "string"
        ? { title: "Fix one thing", why: "", how: rawFix }
        : { title: rawFix.title ?? rawFix.issue ?? "", why: rawFix.why ?? rawFix.whyItMatters ?? "", how: rawFix.how ?? rawFix.suggestedFix ?? rawFix.fix ?? "" };

      const overallImpression = feedback?.overallImpression ?? fb?.overallImpression ?? "";

      // Use storage public URL for waveform (more reliable), with blob fallback
      const storageAudioUrl = urlData.publicUrl;
      const blobUrl = URL.createObjectURL(file);

      const normalized = {
        track_name: file.name,
        overall_impression: overallImpression,
        top_priorities: priorities,
        what_works: whatWorks.map((w: any) =>
          typeof w === "string"
            ? { title: w, detail: "" }
            : { title: w.title ?? w.strength ?? w.area ?? "", detail: w.detail ?? w.why ?? w.description ?? "" }
        ),
        fix_one_thing: rawFix ? fixOneThing : undefined,
        timestamps: feedback?.timestamps ?? fb?.timestamps,
      };

      console.log("Normalized feedback:", JSON.stringify(normalized, null, 2));

      onResult({
        feedback: normalized,
        mode,
        audioUrl: storageAudioUrl,
      });

      // Defer storage cleanup so waveform can load from the public URL
      setTimeout(async () => {
        await supabase.storage.from("tracks").remove([storagePath]);
      }, 60000);
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
    <div className="space-y-8">
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
              className={`rounded-lg border p-4 text-left transition-colors ${
                mode === m.id
                  ? "border-foreground bg-secondary"
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
