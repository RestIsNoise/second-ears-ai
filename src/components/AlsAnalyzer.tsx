import { useState, useCallback, useRef } from "react";
import { Upload, Loader2, Music } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

interface AlsClip {
  name: string;
  start: number;
  duration?: number;
  end?: number;
}

interface AlsTrack {
  name: string;
  colorIndex: number;
  type?: string;
  parentId?: string | null;
  clips: AlsClip[];
}

interface AlsSession {
  bpm: number;
  totalBeats?: number;
  tracks: AlsTrack[];
}

/* ── Color palette by keyword ── */
const GROUP_COLORS: Record<string, string> = {
  kick: "hsl(25 95% 55%)",
  bass: "hsl(25 95% 55%)",
  drum: "hsl(45 95% 55%)",
  perc: "hsl(45 80% 50%)",
  synth: "hsl(175 65% 45%)",
  pad: "hsl(175 50% 50%)",
  lead: "hsl(175 65% 45%)",
  vox: "hsl(270 60% 60%)",
  vocal: "hsl(270 60% 60%)",
  fx: "hsl(210 60% 55%)",
};

const PALETTE = [
  "hsl(25 85% 55%)",
  "hsl(45 90% 52%)",
  "hsl(175 60% 45%)",
  "hsl(270 55% 58%)",
  "hsl(210 55% 52%)",
  "hsl(340 60% 55%)",
  "hsl(140 50% 45%)",
  "hsl(15 70% 50%)",
];

function resolveTrackColor(track: AlsTrack, allTracks: AlsTrack[]): string {
  const names = [track.name];
  if (track.parentId) {
    const parent = allTracks.find((t) => t.name === track.parentId);
    if (parent) names.push(parent.name);
  }
  for (const n of names) {
    const lower = n.toLowerCase();
    for (const [key, color] of Object.entries(GROUP_COLORS)) {
      if (lower.includes(key)) return color;
    }
  }
  return PALETTE[track.colorIndex % PALETTE.length];
}

const TRACK_ROW_HEIGHT = 28;
const TRACK_NAME_WIDTH = 120;

const AlsAnalyzer = () => {
  const [session, setSession] = useState<AlsSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".als")) {
      toast({ title: "Please upload an Ableton Live Set (.als)", variant: "destructive", duration: 2500 });
      return;
    }
    setLoading(true);
    setFileName(file.name);
    try {
      const form = new FormData();
      form.append("als", file);
      const res = await fetch(
        "https://secondears-backend-production.up.railway.app/api/parse-als",
        { method: "POST", headers: { "x-api-key": "secondears-secret-2024" }, body: form }
      );
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data: AlsSession = await res.json();
      setSession(data);
    } catch (err: any) {
      console.error("[AlsAnalyzer] parse failed:", err);
      toast({ title: "Failed to parse session", description: err.message, variant: "destructive" });
      setFileName(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  /* ── Upload state ── */
  if (!session) {
    return (
      <div className="space-y-6">
        <input
          ref={fileInputRef}
          type="file"
          accept=".als"
          className="hidden"
          onChange={handleFileChange}
        />
        <label
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer flex flex-col items-center justify-center gap-4 rounded-xl p-12 select-none transition-all duration-150 ${
            dragOver
              ? "border-2 border-dashed border-foreground/30 bg-secondary/80"
              : "border-2 border-dashed border-border-subtle hover:border-foreground/15 hover:bg-secondary/30"
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
              <div className="text-center">
                <p className="text-sm text-foreground">Parsing session…</p>
                <p className="text-xs text-muted-foreground mt-1">{fileName}</p>
              </div>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm text-foreground">Drop your Ableton session here</p>
                <p className="text-xs text-muted-foreground mt-1">or click to browse · .als files</p>
              </div>
            </>
          )}
        </label>
      </div>
    );
  }

  /* ── Compute layout ── */
  let maxEnd = 0;
  const tracksWithEnds = session.tracks.map((t) => ({
    ...t,
    clips: t.clips.map((c) => {
      const clipEnd = c.end ?? c.start + (c.duration ?? 0);
      if (clipEnd > maxEnd) maxEnd = clipEnd;
      return { ...c, resolvedEnd: clipEnd };
    }),
  }));
  const totalBeats = session.totalBeats || maxEnd || 128;
  const pxPerBeat = 4;
  const totalWidth = totalBeats * pxPerBeat;

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Music className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium truncate max-w-[200px]">{fileName}</span>
          <Badge variant="secondary" className="text-[10px] font-mono-brand tracking-wider">
            {Math.round(session.bpm)} BPM
          </Badge>
          <Badge variant="outline" className="text-[10px] font-mono-brand tracking-wider">
            {session.tracks.length} tracks
          </Badge>
        </div>
        <button
          onClick={() => { setSession(null); setFileName(null); }}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Upload new
        </button>
      </div>

      {/* DAW-style arranger */}
      <div className="rounded-xl border border-border-subtle overflow-hidden bg-card/50">
        {/* Beat ruler */}
        <div className="flex border-b border-border-subtle/60" style={{ height: 20 }}>
          <div className="shrink-0 border-r border-border-subtle/40" style={{ width: TRACK_NAME_WIDTH }} />
          <div className="relative flex-1 overflow-hidden" style={{ minWidth: totalWidth }}>
            {Array.from({ length: Math.ceil(totalBeats / 4) }, (_, i) => (
              <div
                key={i}
                className="absolute top-0 h-full border-l border-border-subtle/30"
                style={{ left: i * 4 * pxPerBeat }}
              >
                <span className="text-[8px] text-muted-foreground/40 font-mono-brand pl-1 leading-[20px]">
                  {i * 4 + 1}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Track rows */}
        <div className="overflow-auto max-h-[60vh] scrollbar-thin">
          <div style={{ minWidth: TRACK_NAME_WIDTH + totalWidth }}>
            {tracksWithEnds.map((track, i) => {
              const isGroup = track.type === "group";
              const isChild = !!track.parentId;
              const color = resolveTrackColor(track, session.tracks);

              return (
                <div
                  key={i}
                  className="flex items-stretch border-b border-border-subtle/30 hover:bg-secondary/20 transition-colors"
                  style={{ height: TRACK_ROW_HEIGHT }}
                >
                  {/* Track name */}
                  <div
                    className="shrink-0 flex items-center overflow-hidden border-r border-border-subtle/30"
                    style={{
                      width: TRACK_NAME_WIDTH,
                      paddingLeft: isChild ? 16 : 8,
                      borderLeft: `3px solid ${color}`,
                    }}
                  >
                    <span
                      className={`text-[10px] truncate ${
                        isGroup ? "font-bold text-foreground/80" : "text-muted-foreground/70"
                      }`}
                    >
                      {track.name}
                    </span>
                  </div>

                  {/* Clips lane */}
                  <div className="relative flex-1 min-w-0" style={{ width: totalWidth }}>
                    {track.clips.map((clip, ci) => {
                      const left = clip.start * pxPerBeat;
                      const width = Math.max((clip.resolvedEnd - clip.start) * pxPerBeat, 3);
                      const showName = width > 40;

                      return (
                        <div
                          key={ci}
                          className="absolute top-[3px] rounded-[3px]"
                          style={{
                            left,
                            width,
                            height: TRACK_ROW_HEIGHT - 6,
                            backgroundColor: color,
                            opacity: 0.8,
                          }}
                          title={clip.name}
                        >
                          {showName && (
                            <span className="block truncate text-[8px] font-medium text-white/90 px-1.5 leading-[22px]">
                              {clip.name}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlsAnalyzer;
