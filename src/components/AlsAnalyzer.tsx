import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { Upload, Loader2, Music, ChevronRight, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

/* ── Monochrome palette (no rainbow) ── */
const MONO_FONT = "'DM Mono', 'JetBrains Mono', monospace";
const CLIP_FILL = "0 0% 24%";
const CLIP_FILL_ALT = "0 0% 19%";
const STRIP_COLOR = "hsl(0 0% 100% / 0.07)";

/* ── Constants ── */
const ROW_H = 28;
const LABEL_W = 160;
const RULER_H = 26;
const PX_PER_BEAT = 4;
const MAX_VIEW_H = 420;

/* ── Helpers ── */
function beatsToTime(beats: number, bpm: number): string {
  if (!bpm || !isFinite(bpm) || bpm <= 0) return "0:00";
  const s = (beats / bpm) * 60;
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

/* ── Main component ── */
const AlsAnalyzer = () => {
  const [session, setSession] = useState<AlsSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Scroll sync refs */
  const labelColRef = useRef<HTMLDivElement>(null);
  const clipAreaRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<HTMLDivElement>(null);
  const isSyncing = useRef(false);

  const isMobile = useIsMobile();

  const toggleGroup = useCallback((name: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }, []);

  /* ── Sync scroll ── */
  useEffect(() => {
    const labelEl = labelColRef.current;
    const clipEl = clipAreaRef.current;
    const rulerEl = rulerRef.current;
    if (!labelEl || !clipEl || !rulerEl) return;

    const onClipScroll = () => {
      if (isSyncing.current) return;
      isSyncing.current = true;
      labelEl.scrollTop = clipEl.scrollTop;
      rulerEl.scrollLeft = clipEl.scrollLeft;
      isSyncing.current = false;
    };

    const onLabelScroll = () => {
      if (isSyncing.current) return;
      isSyncing.current = true;
      clipEl.scrollTop = labelEl.scrollTop;
      isSyncing.current = false;
    };

    clipEl.addEventListener("scroll", onClipScroll);
    labelEl.addEventListener("scroll", onLabelScroll);
    return () => {
      clipEl.removeEventListener("scroll", onClipScroll);
      labelEl.removeEventListener("scroll", onLabelScroll);
    };
  });

  const uploadFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".als")) {
      toast({ title: "Please upload an Ableton Live Set (.als)", variant: "destructive", duration: 2500 });
      return;
    }
    setLoading(true);
    setFileName(file.name);
    setCollapsedGroups(new Set());
    try {
      const form = new FormData();
      form.append("als", file);
      const res = await fetch(
        "https://secondears-backend-production.up.railway.app/api/parse-als",
        { method: "POST", headers: { "x-api-key": "secondears-secret-2024" }, body: form }
      );
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data: AlsSession = await res.json();
      console.log("[AlsAnalyzer] Track order:", data.tracks.map((t, i) => `${i}: ${t.name} (type=${t.type ?? "track"}, parent=${t.parentId ?? "none"})`));
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
    const tracks = session.tracks
      .filter((t) => t.clips.length > 0)
      .map((t) => ({
        ...t,
        clips: t.clips.map((c) => {
          const end = c.end ?? c.start + (c.duration ?? 0);
          if (end > maxEnd) maxEnd = end;
          return { ...c, resolvedEnd: end };
        }),
      }));
    const totalBeats = session.totalBeats || maxEnd || 128;
    return { tracks, totalBeats, totalWidth: totalBeats * PX_PER_BEAT };
  }, [session]);

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

  /* ── Ruler ticks ── */
  const rulerTicks = useMemo(() => {
    if (!layoutData) return [];
    const tb = layoutData.totalBeats;
    const bpmVal = session?.bpm ?? 120;
    const beatsPerBar = 4;
    const barW = beatsPerBar * PX_PER_BEAT;
    const totalBars = Math.ceil(tb / beatsPerBar);
    let every = 1;
    if (barW < 18) every = 16;
    else if (barW < 36) every = 8;
    else if (barW < 72) every = 4;
    else if (barW < 140) every = 2;

    const ticks: Array<{ x: number; label: string | null; major: boolean }> = [];
    for (let i = 0; i < totalBars; i++) {
      const x = i * beatsPerBar * PX_PER_BEAT;
      const isMajor = i % every === 0;
      ticks.push({ x, major: isMajor, label: isMajor ? beatsToTime(i * beatsPerBar, bpmVal) : null });
    }
    return ticks;
  }, [layoutData, session?.bpm]);

  /* ── Upload dropzone ── */
  if (!session || !layoutData) {
    return (
      <div className="space-y-6">
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

  const { tracks: allTracks, totalBeats, totalWidth } = layoutData;
  const bpm = session.bpm;
  const trackContentH = visibleTracks.length * ROW_H;

  /* ── Mobile fallback ── */
  if (isMobile) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium truncate max-w-[160px]">{fileName}</span>
          </div>
          <button onClick={() => { setSession(null); setFileName(null); }} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
            Upload new
          </button>
        </div>
        <div className="flex items-center gap-2">
          {bpm > 0 && <Badge variant="secondary" className="text-[10px] font-mono">{Math.round(bpm)} BPM</Badge>}
          <Badge variant="outline" className="text-[10px] font-mono">{allTracks.length} tracks</Badge>
        </div>
        <div
          className="rounded-lg overflow-hidden"
          style={{ backgroundColor: "hsl(var(--secondary))" }}
        >
          {allTracks.map((track, i) => {
            const color = resolveColor(track, session.tracks);
            return (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-2.5 px-3",
                  i % 2 === 0 ? "bg-foreground/[0.02]" : "bg-transparent"
                )}
                style={{ height: ROW_H }}
              >
                <div className="shrink-0 w-[6px] h-[6px] rounded-full" style={{ backgroundColor: `hsl(${color})` }} />
                <span className={cn("text-[10px] flex-1 truncate", track.type === "group" ? "font-semibold text-foreground/70" : "text-foreground/50")}
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  {track.name}
                </span>
                <span className="text-[8px] text-muted-foreground/40 font-mono shrink-0">{track.clips.length}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────
     Desktop: Ableton Live arrangement view
     ─────────────────────────────────────────────
     Layout:
     ┌──────────┬──────────────────────────┐
     │ "Tracks" │  Ruler (h-scrolls)       │  <- RULER_H
     ├──────────┼──────────────────────────┤
     │ Labels   │  Clips (h+v scrolls)     │  <- MAX_VIEW_H
     │ (v-sync) │                          │
     └──────────┴──────────────────────────┘
     Left column: fixed width, no h-scroll, v-scroll synced.
     Right area: h+v scroll, ruler h-synced to clips.
  */
  return (
    <div className="space-y-2.5">
      {/* Transport strip */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Music className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium truncate max-w-[200px]">{fileName}</span>
          {bpm > 0 && (
            <Badge variant="secondary" className="text-[10px] font-mono tracking-wider">
              {Math.round(bpm)} BPM
            </Badge>
          )}
          <Badge variant="outline" className="text-[10px] font-mono tracking-wider">
            {allTracks.length} tracks
          </Badge>
          <span className="text-[10px] text-muted-foreground/45 font-mono">
            {beatsToTime(totalBeats, bpm)}
          </span>
        </div>
        <button
          onClick={() => { setSession(null); setFileName(null); }}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Upload new
        </button>
      </div>

      {/* ── DAW Container ── */}
      <div
        className="rounded-lg overflow-hidden"
        style={{ backgroundColor: "hsl(var(--secondary))" }}
      >
        {/* ═══ ROW 1: Ruler bar ═══ */}
        <div className="flex" style={{ height: RULER_H }}>
          {/* Label column header */}
          <div
            className="shrink-0 flex items-end px-3 pb-1"
            style={{
              width: LABEL_W,
              borderRight: "1px solid hsl(var(--border) / 0.25)",
            }}
          >
            <span
              className="text-[7px] uppercase tracking-[0.14em] text-muted-foreground/35 font-medium select-none"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              Tracks
            </span>
          </div>

          {/* Ruler — syncs horizontally with clip area */}
          <div
            ref={rulerRef}
            className="flex-1 overflow-hidden relative"
            style={{ borderBottom: "1px solid hsl(var(--border) / 0.15)" }}
          >
            <div className="relative" style={{ width: totalWidth, height: RULER_H }}>
              {rulerTicks.map((tick, i) => (
                <div key={i} className="absolute top-0" style={{ left: tick.x, height: RULER_H }}>
                  <div
                    className="absolute bottom-0 w-px"
                    style={{
                      height: tick.major ? 10 : 4,
                      backgroundColor: tick.major
                        ? "hsl(var(--foreground) / 0.12)"
                        : "hsl(var(--foreground) / 0.05)",
                    }}
                  />
                  {tick.label && (
                    <span
                      className="absolute top-[5px] left-[3px] text-[8px] text-muted-foreground/40 select-none whitespace-nowrap"
                      style={{ fontFamily: "'DM Mono', monospace" }}
                    >
                      {tick.label}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ ROW 2: Labels + Clips ═══ */}
        <div className="flex" style={{ maxHeight: MAX_VIEW_H }}>

          {/* ── Left: track names (v-scroll synced, no h-scroll) ── */}
          <div
            ref={labelColRef}
            className="shrink-0 overflow-y-auto overflow-x-hidden"
            style={{
              width: LABEL_W,
              maxHeight: MAX_VIEW_H,
              borderRight: "1px solid hsl(var(--border) / 0.25)",
              /* Hide scrollbar visually — scroll driven by sync */
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            <style>{`.als-label-col::-webkit-scrollbar { display: none; }`}</style>
            <div className="als-label-col" style={{ height: trackContentH }}>
              {visibleTracks.map((track, vi) => {
                const isGroup = track.type === "group";
                const isChild = !!track.parentId;
                const color = resolveColor(track, session.tracks);
                const count = childCounts[track.name];

                return (
                  <div
                    key={track._i}
                    className={cn(
                      "flex items-center gap-1.5 select-none",
                      isGroup
                        ? "bg-foreground/[0.04]"
                        : vi % 2 === 0
                          ? "bg-transparent"
                          : "bg-foreground/[0.018]"
                    )}
                    style={{
                      height: ROW_H,
                      paddingLeft: isChild ? 26 : 10,
                      paddingRight: 8,
                    }}
                  >
                    {/* Group chevron */}
                    {isGroup && (
                      <button
                        onClick={() => toggleGroup(track.name)}
                        className="shrink-0 w-4 h-4 flex items-center justify-center rounded-sm hover:bg-foreground/[0.06] transition-colors"
                      >
                        {collapsedGroups.has(track.name)
                          ? <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
                          : <ChevronDown className="w-3 h-3 text-muted-foreground/50" />}
                      </button>
                    )}

                    {/* Color dot */}
                    <div
                      className="shrink-0 rounded-full"
                      style={{ width: 6, height: 6, backgroundColor: `hsl(${color})` }}
                    />

                    {/* Track name */}
                    <span
                      className={cn(
                        "text-[10px] truncate flex-1 leading-none",
                        isGroup ? "font-semibold text-foreground/65" : "text-foreground/45"
                      )}
                      style={{ fontFamily: "'DM Mono', monospace" }}
                    >
                      {track.name}
                    </span>

                    {/* Child count */}
                    {isGroup && count != null && count > 0 && (
                      <span className="text-[8px] text-muted-foreground/30 font-mono shrink-0">{count}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Right: clip lanes (h+v scroll, drives all sync) ── */}
          <div
            ref={clipAreaRef}
            className="flex-1 overflow-auto scrollbar-thin"
            style={{ maxHeight: MAX_VIEW_H }}
          >
            <div style={{ width: totalWidth, height: trackContentH }}>
              {visibleTracks.map((track, vi) => {
                const isGroup = track.type === "group";
                const color = resolveColor(track, session.tracks);

                return (
                  <div
                    key={track._i}
                    className={cn(
                      "relative",
                      isGroup
                        ? "bg-foreground/[0.04]"
                        : vi % 2 === 0
                          ? "bg-transparent"
                          : "bg-foreground/[0.018]"
                    )}
                    style={{ height: ROW_H }}
                  >
                    {/* Vertical bar grid */}
                    {rulerTicks.map((tick, ti) =>
                      tick.major ? (
                        <div
                          key={ti}
                          className="absolute top-0 h-full w-px"
                          style={{
                            left: tick.x,
                            backgroundColor: "hsl(var(--foreground) / 0.035)",
                          }}
                        />
                      ) : null
                    )}

                    {/* Clips */}
                    {track.clips.map((clip, ci) => {
                      const left = clip.start * PX_PER_BEAT;
                      const w = Math.max((clip.resolvedEnd - clip.start) * PX_PER_BEAT, 3);
                      return (
                        <div
                          key={ci}
                          className="absolute rounded-[3px] hover:brightness-110 transition-[filter] duration-75"
                          style={{
                            left,
                            width: w,
                            top: 3,
                            height: ROW_H - 6,
                            backgroundColor: `hsl(${color} / 0.72)`,
                            boxShadow: `inset 0 1px 0 hsl(${color} / 0.18)`,
                          }}
                          title={clip.name}
                        >
                          {w > 38 && (
                            <span
                              className="block truncate text-[8px] font-medium px-1.5 select-none"
                              style={{
                                color: "hsl(0 0% 100% / 0.82)",
                                lineHeight: `${ROW_H - 6}px`,
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
        </div>
      </div>
    </div>
  );
};

export default AlsAnalyzer;
