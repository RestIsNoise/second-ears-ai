import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { Upload, Loader2, Music, ChevronRight, ChevronDown, Maximize2, ZoomIn } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

/* ── Types ── */
interface AlsClip {
  name: string;
  start: number;
  duration?: number;
  end?: number;
}

interface AlsTrack {
  id?: number;
  name: string;
  colorIndex: number;
  type?: string;
  parentId?: string | null;
  groupId?: number | null;
  clips: AlsClip[];
}

interface AlsSession {
  bpm: number;
  totalBeats?: number;
  tracks: AlsTrack[];
}

/* ── Ableton-style DAW palette (flat, no glow/blur) ── */
const MONO_FONT = "'DM Mono', 'JetBrains Mono', monospace";
const BG_MAIN = "#1D1F23";
const BG_HEADER = "#282B30";
const BG_RULER = "#252830";
const BG_LANE_A = "#23262B";
const BG_LANE_B = "#202329";
const BG_GROUP = "#2A2D33";
const GRID_LINE = "#3A3F47";
const GRID_MINOR = "#2E3238";
const TEXT_PRIMARY = "#D5D9E0";
const TEXT_SECONDARY = "#A9B0BC";
const TEXT_DIM = "#7B8290";
const CLIP_A = "#7C8594";
const CLIP_B = "#636B78";
const CLIP_C = "#8B92A0";
const ACCENT = "#BFC7D6";
const BORDER_MAIN = "#3A3F47";
const BORDER_SUBTLE = "#2E3238";

/* ── Constants ── */
const LABEL_W = 155;
const RULER_H = 26;
const OVERVIEW_ROW_H = 22;
const DETAIL_ROW_H = 28;

/* ── Helpers ── */
function beatsToTime(beats: number, bpm: number): string {
  if (!bpm || !isFinite(bpm) || bpm <= 0) return "0:00";
  const s = (beats / bpm) * 60;
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

interface AlsAnalyzerProps {
  onLoaded?: () => void;
}

/* ── Main component ── */
const AlsAnalyzer = ({ onLoaded }: AlsAnalyzerProps) => {
  const [session, setSession] = useState<AlsSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [detailMode, setDetailMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const hasNotified = useRef(false);

  const isMobile = useIsMobile();

  /* Measure container width */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) setContainerWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* Notify parent when session loads */
  useEffect(() => {
    if (session && onLoaded && !hasNotified.current) {
      hasNotified.current = true;
      // Small delay so DOM has rendered
      setTimeout(() => onLoaded(), 150);
    }
  }, [session, onLoaded]);

  const toggleGroup = useCallback((name: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }, []);

  const uploadFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".als")) {
      toast({ title: "Please upload an Ableton Live Set (.als)", variant: "destructive", duration: 2500 });
      return;
    }
    setLoading(true);
    setFileName(file.name);
    setCollapsedGroups(new Set());
    hasNotified.current = false;
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

  /* ── Layout data ── */
  const layoutData = useMemo(() => {
    if (!session) return null;
    let maxEnd = 0;

    // Build a map from track id to track name for groupId resolution
    const idToName: Record<number, string> = {};
    for (const t of session.tracks) {
      if (t.id != null) idToName[t.id] = t.name;
    }

    const tracks = session.tracks
      .filter((t) => t.clips.length > 0 || t.type === "GroupTrack" || t.type === "group")
      .map((t) => {
        // Resolve parentId from groupId if not already set
        let resolvedParentId = t.parentId ?? null;
        if (!resolvedParentId && t.groupId != null) {
          resolvedParentId = idToName[t.groupId] ?? null;
        }
        return {
          ...t,
          parentId: resolvedParentId,
          // Normalize type: "GroupTrack" → "group"
          type: t.type === "GroupTrack" ? "group" : t.type,
          clips: t.clips.map((c) => {
            const end = c.end ?? c.start + (c.duration ?? 0);
            if (end > maxEnd) maxEnd = end;
            return { ...c, resolvedEnd: end };
          }),
        };
      });
    const totalBeats = session.totalBeats || maxEnd || 128;
    return { tracks, totalBeats };
  }, [session]);

  /* ── Dynamic scale: fit-to-width ── */
  const clipAreaWidth = Math.max(containerWidth - LABEL_W - 2, 100);
  const pxPerBeat = useMemo(() => {
    if (!layoutData || clipAreaWidth <= 0) return 4;
    if (detailMode) return 4; // fixed in detail mode
    return clipAreaWidth / layoutData.totalBeats;
  }, [layoutData, clipAreaWidth, detailMode]);

  const totalWidth = useMemo(() => {
    if (!layoutData) return 0;
    return layoutData.totalBeats * pxPerBeat;
  }, [layoutData, pxPerBeat]);

  const ROW_H = detailMode ? DETAIL_ROW_H : OVERVIEW_ROW_H;

  /* ── Visible tracks ── */
  const visibleTracks = useMemo(() => {
    if (!layoutData) return [];
    const result: Array<(typeof layoutData.tracks)[0] & { _i: number }> = [];
    const hidden = new Set<string>();
    for (let i = 0; i < layoutData.tracks.length; i++) {
      const t = layoutData.tracks[i];
      if (t.parentId && (collapsedGroups.has(t.parentId) || hidden.has(t.parentId))) {
        hidden.add(t.name);
        continue;
      }
      result.push({ ...t, _i: i });
    }
    return result;
  }, [layoutData, collapsedGroups]);

  /* ── Child counts ── */
  const childCounts = useMemo(() => {
    if (!layoutData) return {} as Record<string, number>;
    const c: Record<string, number> = {};
    for (const t of layoutData.tracks) {
      if (t.parentId) c[t.parentId] = (c[t.parentId] || 0) + 1;
    }
    return c;
  }, [layoutData]);

  /* ── Ruler ticks (adaptive to actual pixel width) ── */
  const rulerTicks = useMemo(() => {
    if (!layoutData) return [];
    const tb = layoutData.totalBeats;
    const bpmVal = session?.bpm ?? 120;
    const beatsPerBar = 4;
    const barW = beatsPerBar * pxPerBeat;
    const totalBars = Math.ceil(tb / beatsPerBar);
    let every = 1;
    if (barW < 12) every = 32;
    else if (barW < 18) every = 16;
    else if (barW < 36) every = 8;
    else if (barW < 72) every = 4;
    else if (barW < 140) every = 2;

    const ticks: Array<{ x: number; label: string | null; major: boolean }> = [];
    for (let i = 0; i < totalBars; i++) {
      const x = i * beatsPerBar * pxPerBeat;
      const isMajor = i % every === 0;
      ticks.push({ x, major: isMajor, label: isMajor ? beatsToTime(i * beatsPerBar, bpmVal) : null });
    }
    return ticks;
  }, [layoutData, session?.bpm, pxPerBeat]);

  /* ── Upload dropzone ── */
  if (!session || !layoutData) {
    return (
      <div ref={containerRef} className="space-y-6">
        <input ref={fileInputRef} type="file" accept=".als" className="hidden" onChange={handleFileChange} />
        <label
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "cursor-pointer flex flex-col items-center justify-center gap-4 rounded-lg p-12 select-none transition-all duration-200",
            dragOver
              ? "border-2 border-dashed border-foreground/30 bg-secondary/80"
              : "border-2 border-dashed border-border hover:border-foreground/15 hover:bg-secondary/30"
          )}
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

  const { tracks: allTracks, totalBeats } = layoutData;
  const bpm = session.bpm;
  const trackContentH = visibleTracks.length * ROW_H;

  /* ── Mobile fallback ── */
  if (isMobile) {
    return (
      <div ref={containerRef} className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium truncate max-w-[160px]">{fileName}</span>
          </div>
          <button onClick={() => { setSession(null); setFileName(null); }} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
            Upload new
          </button>
        </div>
        <div
          className="rounded-lg overflow-hidden"
          style={{ backgroundColor: "hsl(var(--secondary))" }}
        >
          {allTracks.map((track, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center gap-2.5 px-3",
                i % 2 === 0 ? "bg-foreground/[0.02]" : "bg-transparent"
              )}
              style={{ height: ROW_H }}
            >
              <div className="shrink-0 w-[6px] h-[6px] rounded-full" style={{ backgroundColor: "hsl(0 0% 100% / 0.07)" }} />
              <span className={cn("text-[10px] flex-1 truncate", track.type === "group" ? "font-semibold text-foreground/70" : "text-foreground/50")}
                style={{ fontFamily: MONO_FONT }}
              >
                {track.name}
              </span>
              <span className="text-[8px] text-muted-foreground/40 font-mono shrink-0">{track.clips.length}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────
     Desktop: Full-width overview arrangement
     Layout (labels on RIGHT):
     ┌──────────────────────────┬──────────┐
     │  Ruler                   │ "Tracks" │
     ├──────────────────────────┼──────────┤
     │  Clips (fit-to-width)    │ Labels   │
     └──────────────────────────┴──────────┘
  */
  return (
    <div ref={containerRef} className="space-y-0">
      {/* Transport header */}
      <div
        className="flex items-center justify-between px-3 py-1.5 rounded-t-md"
        style={{ backgroundColor: BG_HEADER, borderBottom: `1px solid ${BORDER_MAIN}` }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Music className="w-3 h-3 shrink-0" style={{ color: TEXT_DIM }} />
          <span
            className="text-[11px] font-semibold truncate max-w-[200px]"
            style={{ fontFamily: MONO_FONT, color: TEXT_PRIMARY }}
          >
            {fileName}
          </span>
          {bpm > 0 && (
            <span className="text-[10px] font-mono tabular-nums shrink-0" style={{ color: TEXT_SECONDARY }}>
              {Math.round(bpm)} BPM
            </span>
          )}
          <span className="text-[10px] font-mono shrink-0" style={{ color: TEXT_DIM }}>
            {allTracks.length} trk · {beatsToTime(totalBeats, bpm)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <button
            onClick={() => setDetailMode((v) => !v)}
            className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] transition-colors"
            style={{
              fontFamily: MONO_FONT,
              color: detailMode ? TEXT_PRIMARY : TEXT_SECONDARY,
              backgroundColor: detailMode ? "rgba(255,255,255,0.08)" : "transparent",
              border: `1px solid ${detailMode ? BORDER_MAIN : "transparent"}`,
            }}
            title={detailMode ? "Switch to Overview" : "Switch to Detail"}
          >
            {detailMode ? <Maximize2 className="w-3 h-3" /> : <ZoomIn className="w-3 h-3" />}
            {detailMode ? "Overview" : "Detail"}
          </button>
          <button
            onClick={() => { setSession(null); setFileName(null); hasNotified.current = false; }}
            className="text-[10px] transition-colors px-1.5 py-0.5"
            style={{ fontFamily: MONO_FONT, color: TEXT_DIM }}
            onMouseEnter={(e) => (e.currentTarget.style.color = TEXT_PRIMARY)}
            onMouseLeave={(e) => (e.currentTarget.style.color = TEXT_DIM)}
          >
            Upload new
          </button>
        </div>
      </div>

      {/* ── DAW Container ── */}
      <div className="rounded-b-md overflow-hidden" style={{ backgroundColor: BG_MAIN }}>

        {/* ═══ Ruler ═══ */}
        <div className="flex" style={{ height: RULER_H }}>
          <div className="flex-1 overflow-hidden relative" style={{ backgroundColor: BG_RULER, borderBottom: `1px solid ${BORDER_MAIN}` }}>
            <div className="relative" style={{ width: detailMode ? totalWidth : "100%", height: RULER_H }}>
              {rulerTicks.map((tick, i) => (
                <div key={i} className="absolute top-0" style={{ left: tick.x, height: RULER_H }}>
                  <div
                    className="absolute bottom-0 w-px"
                    style={{
                      height: tick.major ? 14 : 5,
                      backgroundColor: tick.major ? TEXT_DIM : GRID_MINOR,
                    }}
                  />
                  {tick.label && (
                    <span
                      className="absolute whitespace-nowrap tabular-nums select-none"
                      style={{
                        fontFamily: MONO_FONT,
                        fontSize: 9,
                        fontWeight: 600,
                        color: TEXT_SECONDARY,
                        bottom: 14,
                        left: 3,
                      }}
                    >
                      {tick.label}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div
            className="shrink-0 flex items-end px-2 pb-1"
            style={{ width: LABEL_W, backgroundColor: BG_RULER, borderLeft: `1px solid ${BORDER_MAIN}`, borderBottom: `1px solid ${BORDER_MAIN}` }}
          >
            <span
              className="text-[8px] uppercase tracking-[0.12em] font-semibold select-none"
              style={{ fontFamily: MONO_FONT, color: TEXT_DIM }}
            >
              Tracks
            </span>
          </div>
        </div>

        {/* ═══ Clips + Labels ═══ */}
        <div className={cn("flex", detailMode && "overflow-auto scrollbar-thin")} style={detailMode ? { maxHeight: 400 } : undefined}>
          {/* Clip lanes */}
          <div className={cn("flex-1 min-w-0", detailMode && "overflow-auto scrollbar-thin")} style={detailMode ? { maxHeight: 400 } : undefined}>
            <div style={{ width: detailMode ? totalWidth : "100%", height: trackContentH }}>
              {visibleTracks.map((track, vi) => {
                const isGroup = track.type === "group";
                const laneBg = isGroup ? BG_GROUP : vi % 2 === 0 ? BG_LANE_A : BG_LANE_B;
                return (
                  <div
                    key={track._i}
                    className="relative"
                    style={{
                      height: ROW_H,
                      backgroundColor: laneBg,
                      borderBottom: `1px solid ${BORDER_SUBTLE}`,
                    }}
                  >
                    {/* Vertical grid lines */}
                    {rulerTicks.map((tick, ti) =>
                      tick.major ? (
                        <div
                          key={ti}
                          className="absolute top-0 h-full w-px"
                          style={{ left: tick.x, backgroundColor: GRID_MINOR }}
                        />
                      ) : null
                    )}

                    {/* Clips */}
                    {track.clips.map((clip, ci) => {
                      const left = clip.start * pxPerBeat;
                      const w = Math.max((clip.resolvedEnd - clip.start) * pxPerBeat, 2);
                      const fills = [CLIP_A, CLIP_B, CLIP_C];
                      const fill = fills[ci % 3];
                      const showName = w > (detailMode ? 38 : 45);
                      return (
                        <div
                          key={ci}
                          className="absolute rounded-[1px] hover:brightness-110 transition-[filter] duration-75"
                          style={{
                            left,
                            width: w,
                            top: 2,
                            height: ROW_H - 4,
                            backgroundColor: fill,
                            borderLeft: `1px solid rgba(255,255,255,0.1)`,
                            borderTop: `1px solid rgba(255,255,255,0.06)`,
                          }}
                          title={clip.name}
                        >
                          {showName && (
                            <span
                              className="block truncate font-medium px-1 select-none"
                              style={{
                                color: "#E8ECF1",
                                lineHeight: `${ROW_H - 4}px`,
                                fontFamily: MONO_FONT,
                                fontSize: detailMode ? 9 : 7,
                              }}
                            >
                              {clip.name}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: track labels */}
          <div
            className="shrink-0 overflow-y-hidden overflow-x-hidden"
            style={{ width: LABEL_W, borderLeft: `1px solid ${BORDER_MAIN}` }}
          >
            <div style={{ height: trackContentH }}>
              {visibleTracks.map((track, vi) => {
                const isGroup = track.type === "group";
                const isChild = !!track.parentId;
                const count = childCounts[track.name];
                const laneBg = isGroup ? BG_GROUP : vi % 2 === 0 ? BG_LANE_A : BG_LANE_B;

                return (
                  <div
                    key={track._i}
                    className="flex items-center gap-1 select-none"
                    style={{
                      height: ROW_H,
                      paddingLeft: isChild ? 18 : 6,
                      paddingRight: 6,
                      backgroundColor: laneBg,
                      borderBottom: `1px solid ${BORDER_SUBTLE}`,
                    }}
                  >
                    {isGroup && (
                      <button
                        onClick={() => toggleGroup(track.name)}
                        className="shrink-0 w-4 h-4 flex items-center justify-center rounded-sm transition-colors"
                        style={{ color: TEXT_SECONDARY }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                      >
                        {collapsedGroups.has(track.name)
                          ? <ChevronRight className="w-3 h-3" />
                          : <ChevronDown className="w-3 h-3" />}
                      </button>
                    )}

                    <span
                      className="truncate flex-1 leading-none"
                      style={{
                        fontFamily: MONO_FONT,
                        fontSize: detailMode ? 10 : 9,
                        fontWeight: isGroup ? 600 : 400,
                        color: isGroup ? TEXT_PRIMARY : TEXT_SECONDARY,
                        letterSpacing: "0.01em",
                      }}
                    >
                      {track.name}
                    </span>

                    {isGroup && collapsedGroups.has(track.name) && count != null && count > 0 && (
                      <span className="text-[8px] font-mono shrink-0" style={{ color: TEXT_DIM }}>{count}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlsAnalyzer;
