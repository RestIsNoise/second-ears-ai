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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type.startsWith("audio/")) setFile(dropped);
    else toast({ title: "Please upload an audio file", variant: "destructive" });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  const analyze = async () => {
    if (!file) return;
    setIsAnalyzing(true);

    try {
      // Upload to storage
      const path = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("tracks")
        .upload(path, file);

      if (uploadError) throw uploadError;

      // Call edge function
      const { data, error } = await supabase.functions.invoke("analyze-track", {
        body: { trackName: file.name, storagePath: path, mode },
      });

      if (error) throw error;

      // Create a local audio URL from the uploaded file for waveform playback
      const audioUrl = URL.createObjectURL(file);
      const resultData = data as FeedbackResult;
      resultData.audioUrl = audioUrl;
      onResult(resultData);
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
