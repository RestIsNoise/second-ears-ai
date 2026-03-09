import { useState, useCallback, useRef, useEffect } from "react";
import { Upload, Loader2, ChevronRight, ChevronDown } from "lucide-react";
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

/* ── Monochrome palette ── */
const LANE_BG_GROUP = "#1A1A1A";
const LANE_BG_CHILD = "#141414";
const LANE_BG_DEFAULT = "#171717";
const CLIP_FILL = "#3A3A3A";
const CLIP_FILL_ALT = "#2E2E2E";
const ACCENT = "#C8820A"; // single accent for playhead/selection
const RULER_MAJOR = "rgba(255,255,255,0.18)";
const RULER_MINOR = "rgba(255,255,255,0.06)";
const RULER_TEXT = "rgba(255,255,255,0.35)";
const LANE_BORDER = "rgba(255,255,255,0.04)";
const COLOR_STRIP = "rgba(255,255,255,0.08)";
const MONO = "'JetBrains Mono', 'IBM Plex Mono', 'DM Mono', monospace";

const TRACK_ROW_HEIGHT = 30;
const LABEL_WIDTH = 140;
const STRIP_WIDTH = 12;
const BEATS_PER_PX = 0.25;

/* ── Ruler component ── */
const Ruler = ({ totalBeats, bpm }: { totalBeats: number; bpm: number }) => {
  const totalWidth = totalBeats / BEATS_PER_PX;
  const beatsPerBar = 4;
  const totalBars = Math.ceil(totalBeats / beatsPerBar);
  const barWidth = beatsPerBar / BEATS_PER_PX;

  // Adaptive label thinning
  const labelEvery = barWidth < 30 ? 8 : barWidth < 60 ? 4 : barWidth < 120 ? 2 : 1;

  const ticks: React.ReactNode[] = [];
  for (let bar = 0; bar <= totalBars; bar++) {
    const x = bar * barWidth;
    const isMajor = bar % labelEvery === 0;

    ticks.push(
      <div
        key={bar}
        style={{
          position: "absolute",
          left: x,
          top: 0,
          width: 1,
          height: isMajor ? 14 : 7,
          backgroundColor: isMajor ? RULER_MAJOR : RULER_MINOR,
        }}
      />
    );

    if (isMajor) {
      const seconds = (bar * beatsPerBar * 60) / bpm;
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      ticks.push(
        <span
          key={`l-${bar}`}
          style={{
            position: "absolute",
            left: x + 3,
            top: 1,
            fontSize: 9,
            fontFamily: MONO,
            color: RULER_TEXT,
            whiteSpace: "nowrap",
            userSelect: "none",
          }}
        >
          {bar + 1}
          <span style={{ opacity: 0.5, marginLeft: 3 }}>
            {m}:{s.toString().padStart(2, "0")}
          </span>
        </span>
      );
    }
  }

  return (
    <div
      style={{
        position: "relative",
        height: 20,
        width: totalWidth,
        backgroundColor: "#0E0E0E",
        borderBottom: `1px solid ${LANE_BORDER}`,
        marginLeft: STRIP_WIDTH,
        marginRight: LABEL_WIDTH,
      }}
    >
      {ticks}
    </div>
  );
};

/* ── Main component ── */
const SessionPanel = () => {
  const [session, setSession] = useState<AlsSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleGroup = useCallback((name: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

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

  /* ── Determine visibility per track ── */
  const getVisibleTracks = useCallback(
    (tracks: AlsTrack[]) => {
      // Build set of collapsed group names (including nested)
      const hiddenParents = new Set<string>();
      // Walk in order, track which parents are collapsed
      const visible: Array<{ track: AlsTrack; index: number; isGroup: boolean; isChild: boolean }> = [];

      // First pass: identify groups
      const groupNames = new Set<string>();
      for (const t of tracks) {
        const hasChildren = tracks.some((c) => c.parentId === t.name);
        if (t.type === "group" || hasChildren) groupNames.add(t.name);
      }

      // Second pass: filter
      for (let i = 0; i < tracks.length; i++) {
        const t = tracks[i];
        const isGroup = groupNames.has(t.name);
        const isChild = !!t.parentId;

        // If this track's parent is collapsed, hide it
        if (isChild && collapsedGroups.has(t.parentId!)) continue;
        // Also hide if any ancestor is collapsed (nested groups)
        if (isChild) {
          let hidden = false;
          let parent = t.parentId;
          while (parent) {
            if (collapsedGroups.has(parent)) { hidden = true; break; }
            const parentTrack = tracks.find((p) => p.name === parent);
            parent = parentTrack?.parentId || null;
          }
          if (hidden) continue;
        }

        visible.push({ track: t, index: i, isGroup, isChild });
      }

      return visible;
    },
    [collapsedGroups]
  );

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
  const visibleTracks = getVisibleTracks(session.tracks);

  // Count children for group badges
  const childCount = (groupName: string) =>
    session.tracks.filter((t) => t.parentId === groupName).length;

  return (
    <div className="flex flex-col h-full min-h-0" style={{ backgroundColor: "#111111" }}>
      {/* BPM badge */}
      <div className="flex items-center gap-2 px-3 py-2 shrink-0" style={{ backgroundColor: "#0E0E0E", borderBottom: `1px solid ${LANE_BORDER}` }}>
        <Badge variant="secondary" className="text-[10px] tracking-wider" style={{ fontFamily: MONO, backgroundColor: "#1E1E1E", color: "rgba(255,255,255,0.5)", border: "none" }}>
          {Math.round(session.bpm)} BPM
        </Badge>
        <span style={{ fontSize: 9, fontFamily: MONO, color: "rgba(255,255,255,0.25)" }}>
          {session.tracks.length} tracks
        </span>
      </div>

      {/* Ruler */}
      <div className="shrink-0 overflow-x-auto overflow-y-hidden scrollbar-thin" style={{ display: "flex" }}>
        <div style={{ minWidth: STRIP_WIDTH + totalWidth + LABEL_WIDTH }}>
          <Ruler totalBeats={session.totalBeats} bpm={session.bpm} />
        </div>
      </div>

      {/* Scrollable arranger */}
      <div className="flex-1 overflow-auto min-h-0 scrollbar-thin">
        <div style={{ minWidth: STRIP_WIDTH + totalWidth + LABEL_WIDTH }}>
          {visibleTracks.map(({ track, index, isGroup, isChild }) => {
            const isCollapsed = collapsedGroups.has(track.name);
            const laneBg = isGroup ? LANE_BG_GROUP : isChild ? LANE_BG_CHILD : LANE_BG_DEFAULT;

            return (
              <div
                key={index}
                className="flex items-stretch"
                style={{
                  height: TRACK_ROW_HEIGHT,
                  borderBottom: `1px solid ${LANE_BORDER}`,
                  backgroundColor: laneBg,
                }}
              >
                {/* Left: minimal color strip */}
                <div
                  style={{
                    width: STRIP_WIDTH,
                    backgroundColor: isGroup ? "rgba(255,255,255,0.06)" : COLOR_STRIP,
                    flexShrink: 0,
                  }}
                />

                {/* Clips lane */}
                <div className="relative flex-1 min-w-0" style={{ width: totalWidth }}>
                  {track.clips.map((clip, ci) => {
                    const left = clip.start / BEATS_PER_PX;
                    const width = Math.max((clip.end - clip.start) / BEATS_PER_PX, 2);
                    const showName = width > 40;
                    const fill = ci % 2 === 0 ? CLIP_FILL : CLIP_FILL_ALT;

                    return (
                      <div
                        key={ci}
                        style={{
                          position: "absolute",
                          left,
                          width,
                          top: 3,
                          height: TRACK_ROW_HEIGHT - 6,
                          backgroundColor: fill,
                          borderRadius: 2,
                          transition: "filter 0.1s",
                          cursor: "default",
                        }}
                        className="hover:brightness-125"
                        title={clip.name}
                      >
                        {showName && (
                          <span
                            style={{
                              display: "block",
                              fontSize: 8,
                              fontFamily: MONO,
                              color: "rgba(255,255,255,0.55)",
                              padding: "0 4px",
                              lineHeight: `${TRACK_ROW_HEIGHT - 6}px`,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {clip.name.length > 20 ? clip.name.slice(0, 20) + "…" : clip.name}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Right: track label */}
                <div
                  className="shrink-0 flex items-center border-l"
                  style={{
                    width: LABEL_WIDTH,
                    borderColor: LANE_BORDER,
                    paddingLeft: isChild ? 20 : 8,
                    paddingRight: 8,
                    backgroundColor: isGroup ? "rgba(255,255,255,0.02)" : "transparent",
                  }}
                >
                  {isGroup && (
                    <button
                      onClick={() => toggleGroup(track.name)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 16,
                        height: 16,
                        marginRight: 4,
                        borderRadius: 2,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "rgba(255,255,255,0.35)",
                        flexShrink: 0,
                      }}
                      className="hover:bg-white/5"
                    >
                      {isCollapsed ? (
                        <ChevronRight className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>
                  )}
                  <span
                    style={{
                      fontSize: 9,
                      fontFamily: MONO,
                      color: isGroup ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.4)",
                      fontWeight: isGroup ? 600 : 400,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      flex: 1,
                    }}
                  >
                    {track.name}
                  </span>
                  {isGroup && isCollapsed && (
                    <span
                      style={{
                        fontSize: 8,
                        fontFamily: MONO,
                        color: "rgba(255,255,255,0.2)",
                        marginLeft: 4,
                        flexShrink: 0,
                      }}
                    >
                      {childCount(track.name)}
                    </span>
                  )}
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
