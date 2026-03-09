import { useState, useCallback, useRef } from "react";
import { Upload, X, FileAudio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/hooks/use-toast";

const ACCEPTED = ".wav,.mp3,.aiff,.aif,.flac";
const MAX_SIZE = 200 * 1024 * 1024;

interface Props {
  open: boolean;
  onClose: () => void;
  projectId: string;
  trackName: string;
  onVersionCreated: () => void;
}

const NewVersionModal = ({ open, onClose, projectId, trackName, onVersionCreated }: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validate = (f: File) => {
    if (!f.type.startsWith("audio/")) {
      toast({ title: "Please upload an audio file", variant: "destructive", duration: 2500 });
      return;
    }
    if (f.size > MAX_SIZE) {
      toast({ title: "File too large (max 200MB)", variant: "destructive", duration: 2500 });
      return;
    }
    setFile(f);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) validate(dropped);
  }, []);

  const handleSubmit = async () => {
    if (!file) return;
    setUploading(true);
    try {
      // 1. Upload to storage
      const storagePath = `${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("tracks").upload(storagePath, file);
      if (upErr) throw new Error(`Upload failed: ${upErr.message}`);

      // 2. Get signed URL
      const { data: urlData, error: urlErr } = await supabase.storage.from("tracks").createSignedUrl(storagePath, 3600);
      if (urlErr || !urlData?.signedUrl) throw new Error("Failed to get signed URL");
      const audioUrl = urlData.signedUrl.startsWith("http")
        ? urlData.signedUrl
        : `https://nllfubvokhybmtnnqeuk.supabase.co/storage/v1${urlData.signedUrl}`;

      // 3. POST to versions API
      const res = await fetch("https://secondears-backend-production.up.railway.app/api/versions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": "secondears-secret-2024" },
        body: JSON.stringify({ project_id: projectId, track_name: file.name, audio_url: audioUrl }),
      });
      if (!res.ok) throw new Error(`Version creation failed: ${res.status}`);

      toast({ title: "Version uploaded", description: file.name, duration: 2000 });
      setFile(null);
      onClose();
      onVersionCreated();
    } catch (err: any) {
      console.error("[NewVersionModal]", err);
      toast({ title: "Upload failed", description: err.message, variant: "destructive", duration: 3000 });
    } finally {
      setUploading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-foreground">Upload new version</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground mb-4">
          Add a new mix version of <span className="font-medium text-foreground/70">{trackName}</span>
        </p>

        {!file ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              dragOver ? "border-primary bg-primary/5" : "border-border hover:border-foreground/20"
            }`}
          >
            <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Drop audio file or click to browse</p>
            <p className="text-[10px] text-muted-foreground/40 mt-1">WAV, MP3, AIFF — max 200MB</p>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED}
              onChange={(e) => { if (e.target.files?.[0]) validate(e.target.files[0]); }}
              className="hidden"
            />
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 px-4 py-3">
            <FileAudio className="w-5 h-5 text-primary shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-[10px] text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
            </div>
            <button onClick={() => setFile(null)} className="text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-5">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={uploading}>Cancel</Button>
          <Button size="sm" onClick={handleSubmit} disabled={!file || uploading}>
            {uploading ? "Uploading…" : "Upload version"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NewVersionModal;
