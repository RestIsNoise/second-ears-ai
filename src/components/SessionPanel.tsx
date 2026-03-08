import { useState, useCallback, useRef } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/* ── Types from the backend ── */
interface AlsClip {
  name: string;
  start: number;
  end: number;
}

interface AlsTrack {
  name: string;
  type: string;
  parentId: string | null;
  colorIndex: number;
  clips: AlsClip[];
}

interface AlsSession {
  bpm: number;
  totalBeats: number;
  tracks: AlsTrack[];
}

/* ── Colour mapping by group name keyword ── */
const GROUP_COLORS: Record<string, string> = {
  kick: "hsl(25 95% 55%)",   // orange
  bass: "hsl(25 95% 55%)",
  drum: "hsl(45 95% 55%)",   // yellow
  synth: "hsl(175 65% 45%)", // teal
  vox: "hsl(270 60% 60%)",   // purple
  vocal: "hsl(270 60% 60%)",
};

const DEFAULT_CLIP_COLOR = "hsl(var(--muted-foreground) / 0.35)";

function resolveClipColor(track: AlsTrack, allTracks: AlsTrack[]): string {
  // Check self name first, then parent
  const names = [track.name];
  if (track.parentId) {
    const parent = allTracks.find((t) => t.name === track.parentId || t.name === track.parentId);
    if (parent) names.push(parent.name);
  }

  for (const n of names) {
    const lower = n.toLowerCase();
    for (const [key, color] of Object.entries(GROUP_COLORS)) {
      if (lower.includes(key)) return color;
    }
  }
  return DEFAULT_CLIP_COLOR;
}

const TRACK_ROW_HEIGHT = 22;
const TRACK_NAME_WIDTH = 60;
const BEATS_PER_PX = 0.25; // 4px per beat

const SessionPanel = () => {
  const [session, setSession] = useState<AlsSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch(
        "https://secondears-backend-production.up.railway.app/api/parse-als",
        {
          method: "POST",
          headers: { "x-api-key": "secondears-secret-2024" },
          body: form,
        }
      );

      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data: AlsSession = await res.json();
      setSession(data);
    } catch (err: any) {
      console.error("[SessionPanel] parse failed:", err);
      setError(err.message || "Failed to parse .als file");
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── STATE 1: Upload ── */
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <input
          ref={fileInputRef}
          type="file"
          accept=".als"
          className="hidden"
          onChange={handleFileChange}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="w-full max-w-xs aspect-[3/2] flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border-subtle hover:border-foreground/20 transition-colors cursor-pointer bg-secondary/10 hover:bg-secondary/20"
        >
          {loading ? (
            <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
          ) : (
            <Upload className="w-6 h-6 text-muted-foreground/50" />
          )}
          <span className="text-xs text-muted-foreground/60 font-medium">
            {loading ? "Parsing…" : "Upload Ableton Session (.als)"}
          </span>
        </button>

        {error && (
          <p className="mt-3 text-xs text-destructive max-w-xs text-center">{error}</p>
        )}
      </div>
    );
  }

  /* ── STATE 2: Arranger view ── */
  const totalWidth = session.totalBeats / BEATS_PER_PX;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* BPM badge */}
      <div className="flex items-center gap-2 px-3 py-2 shrink-0">
        <Badge variant="secondary" className="text-[10px] font-mono-brand tracking-wider">
          {Math.round(session.bpm)} BPM
        </Badge>
      </div>

      {/* Scrollable arranger */}
      <div className="flex-1 overflow-auto min-h-0 scrollbar-thin">
        <div style={{ minWidth: TRACK_NAME_WIDTH + totalWidth }}>
          {session.tracks.map((track, i) => {
            const isGroup = track.type === "group" || (!track.parentId && session.tracks.some((t) => t.parentId === track.name));
            const isChild = !!track.parentId;
            const clipColor = resolveClipColor(track, session.tracks);

            return (
              <div
                key={i}
                className="flex items-stretch border-b border-border-subtle/50"
                style={{ height: TRACK_ROW_HEIGHT }}
              >
                {/* Track name */}
                <div
                  className="shrink-0 flex items-center overflow-hidden border-r border-border-subtle/40"
                  style={{
                    width: TRACK_NAME_WIDTH,
                    paddingLeft: isChild ? 12 : 0,
                    borderLeft: isGroup ? `3px solid ${clipColor}` : undefined,
                  }}
                >
                  <span
                    className={`text-[9px] truncate px-1.5 ${
                      isGroup
                        ? "font-bold text-foreground/70"
                        : "text-muted-foreground/60"
                    }`}
                  >
                    {track.name}
                  </span>
                </div>

                {/* Clips lane */}
                <div className="relative flex-1 min-w-0" style={{ width: totalWidth }}>
                  {track.clips.map((clip, ci) => {
                    const left = clip.start / BEATS_PER_PX;
                    const width = Math.max((clip.end - clip.start) / BEATS_PER_PX, 2);
                    const showName = width > 30;

                    return (
                      <div
                        key={ci}
                        className="absolute top-[2px] rounded-[3px]"
                        style={{
                          left,
                          width,
                          height: TRACK_ROW_HEIGHT - 4,
                          backgroundColor: clipColor,
                          opacity: 0.85,
                        }}
                        title={clip.name}
                      >
                        {showName && (
                          <span className="block truncate text-[7px] font-medium text-white/90 px-1 leading-[18px]">
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
  );
};

export default SessionPanel;
