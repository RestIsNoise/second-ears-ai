import { useState, useCallback, useRef } from "react";
import { Upload, Loader2, X, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";

const ACCEPTED = [".wav", ".mp3", ".aiff", ".aif"];

interface Props {
  open: boolean;
  onClose: () => void;
  onComparisonStart: (jobId: string, refName: string) => void;
  userMetrics: Record<string, any> | undefined;
  userTrackName: string;
  mode: string;
}

const ReferenceUploadModal = ({ open, onClose, onComparisonStart, userMetrics, userTrackName, mode }: Props) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!ACCEPTED.includes(ext)) {
      toast({ title: "Unsupported format", description: "Please upload WAV, MP3, or AIFF", variant: "destructive", duration: 2500 });
      return;
    }

    setUploading(true);
    try {
      // 1. Upload to Supabase storage
      const path = `references/${Date.now()}-${file.name}`;
      const { error: uploadErr } = await supabase.storage.from("tracks").upload(path, file);
      if (uploadErr) throw new Error(uploadErr.message);

      // 2. Get signed URL (1 hour)
      const { data: urlData, error: urlErr } = await supabase.storage
        .from("tracks")
        .createSignedUrl(path, 3600);
      if (urlErr || !urlData?.signedUrl) throw new Error("Failed to get signed URL");

      // 3. POST to reference comparison
      console.log("[reference] full userMetrics object:", JSON.stringify(userMetrics, null, 2));
      console.log("[reference] userTrackName:", userTrackName, "mode:", mode);
      const res = await fetch(
        "https://secondears-backend-production.up.railway.app/api/reference-comparison",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": "secondears-secret-2024",
          },
          body: JSON.stringify({
            referenceAudioUrl: urlData.signedUrl,
            userMetrics: userMetrics || {},
            userTrackName,
            referenceTrackName: file.name,
            mode,
          }),
        }
      );
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      if (!data.jobId) throw new Error("No jobId returned");

      onComparisonStart(data.jobId, file.name);
      onClose();
      toast({ title: "Comparing against reference…", duration: 2000 });
    } catch (err: any) {
      console.error("[ReferenceUpload] failed:", err);
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }, [userMetrics, userTrackName, mode, onComparisonStart, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-md mx-4 rounded-xl border border-border/60 bg-background shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold tracking-tight">Add Reference Track</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground/50 hover:text-foreground transition-colors rounded p-1 hover:bg-secondary/40">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drop zone */}
        <div className="p-5">
          <input
            ref={fileRef}
            type="file"
            accept=".wav,.mp3,.aiff,.aif"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          <label
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            onClick={() => fileRef.current?.click()}
            className={cn(
              "cursor-pointer flex flex-col items-center justify-center gap-3 rounded-lg p-10 select-none transition-all duration-200",
              uploading ? "pointer-events-none" : "",
              dragOver
                ? "border-2 border-dashed border-foreground/30 bg-secondary/60"
                : "border-2 border-dashed border-border hover:border-foreground/15 hover:bg-secondary/20"
            )}
          >
            {uploading ? (
              <>
                <Loader2 className="w-7 h-7 text-muted-foreground animate-spin" />
                <p className="text-xs text-foreground/60">Uploading & starting comparison…</p>
              </>
            ) : (
              <>
                <Upload className="w-7 h-7 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm text-foreground">Drop your reference track here</p>
                  <p className="text-xs text-muted-foreground mt-1">WAV, MP3, or AIFF</p>
                </div>
              </>
            )}
          </label>

          <p className="text-[10px] text-muted-foreground/40 mt-3 text-center">
            Your track will be compared against this reference to identify specific mix differences.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReferenceUploadModal;
