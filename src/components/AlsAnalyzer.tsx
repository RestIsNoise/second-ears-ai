import { useState, useCallback, useRef, useMemo } from "react";
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

/* ── Ableton-inspired color palette ── */
const ABLETON_COLORS = [
  "0 72% 51%",     // red
  "25 90% 52%",    // orange
  "45 93% 47%",    // yellow
  "142 55% 42%",   // green
  "175 60% 41%",   // teal
  "199 70% 48%",   // blue
  "262 52% 55%",   // purple
  "330 65% 52%",   // pink
  "16 75% 48%",    // burnt orange
  "88 45% 42%",    // olive
  "210 55% 52%",   // steel blue
  "280 40% 50%",   // muted purple
];

const GROUP_COLORS: Record<string, string> = {
  kick: "0 72% 51%",
  bass: "25 90% 52%",
  drum: "45 93% 47%",
  perc: "45 80% 45%",
  synth: "175 60% 41%",
  pad: "199 70% 48%",
  lead: "142 55% 42%",
  vox: "262 52% 55%",
  vocal: "262 52% 55%",
  fx: "210 55% 52%",
};

function resolveColor(track: AlsTrack, allTracks: AlsTrack[]): string {
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
  return ABLETON_COLORS[track.colorIndex % ABLETON_COLORS.length];
}

/* ── Constants ── */
const ROW_H = 28;
const LABEL_W = 160;
const RULER_H = 28;
const PX_PER_BEAT = 4;

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
  const clipScrollRef = useRef<HTMLDivElement>(null);
  const rulerScrollRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const toggleGroup = useCallback((name: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }, []);

  /* ── Sync horizontal scroll between ruler and clips ── */
  const syncScroll = useCallback((source: "ruler" | "clips") => {
    const ruler = rulerScrollRef.current;
    const clips = clipScrollRef.current;
    if (!ruler || !clips) return;
    if (source === "clips") ruler.scrollLeft = clips.scrollLeft;
    else clips.scrollLeft = ruler.scrollLeft;
  }, []);

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
      console.log("[AlsAnalyzer] Track order from .als:", data.tracks.map((t, i) => `${i}: ${t.name} (type=${t.type ?? "track"}, parent=${t.parentId ?? "none"})`));
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

  /* ── Visible tracks (collapse logic, preserves .als order) ── */
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

  /* ── Ruler ticks ── */
  const rulerTicks = useMemo(() => {
    const beatsPerBar = 4;
    const barW = beatsPerBar * PX_PER_BEAT;
    const totalBars = Math.ceil(totalBeats / beatsPerBar);
    // auto-thin labels
    let every = 1;
    if (barW < 18) every = 16;
    else if (barW < 36) every = 8;
    else if (barW < 72) every = 4;
    else if (barW < 140) every = 2;

    const ticks: Array<{ x: number; label: string | null; major: boolean }> = [];
    for (let i = 0; i < totalBars; i++) {
      const x = i * beatsPerBar * PX_PER_BEAT;
      const isMajor = i % every === 0;
      ticks.push({
        x,
        major: isMajor,
        label: isMajor ? beatsToTime(i * beatsPerBar, bpm) : null,
      });
    }
    return ticks;
  }, [totalBeats, bpm]);

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
        <div className="rounded-lg border border-border/50 overflow-hidden" style={{ backgroundColor: "hsl(var(--muted) / 0.5)" }}>
          {allTracks.map((track, i) => {
            const color = resolveColor(track, session.tracks);
            return (
              <div key={i} className="flex items-center gap-2.5 px-3 py-2 border-b border-border/20 last:border-0">
                <div className="shrink-0 w-[6px] h-[6px] rounded-full" style={{ backgroundColor: `hsl(${color})` }} />
                <span className={cn("text-xs flex-1 truncate", track.type === "group" ? "font-semibold text-foreground/80" : "text-muted-foreground/70")}>
                  {track.name}
                </span>
                <Badge variant="outline" className="text-[9px] font-mono shrink-0">{track.clips.length}</Badge>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────
     Desktop: Ableton Live-style arrangement
     ───────────────────────────────────────────── */
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
          <span className="text-[10px] text-muted-foreground/50 font-mono">
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
        className="rounded-lg overflow-hidden border border-border/40"
        style={{ backgroundColor: "hsl(var(--muted))" }}
      >
        {/* ── Header row: label spacer + ruler ── */}
        <div className="flex" style={{ height: RULER_H }}>
          {/* Label column header */}
          <div
            className="shrink-0 flex items-end px-3 pb-1 border-r"
            style={{
              width: LABEL_W,
              backgroundColor: "hsl(var(--muted) / 0.8)",
              borderColor: "hsl(var(--border) / 0.3)",
            }}
          >
            <span className="text-[8px] uppercase tracking-[0.12em] text-muted-foreground/40 font-medium">
              Tracks
            </span>
          </div>

          {/* Ruler (scrolls with clips) */}
          <div
            ref={rulerScrollRef}
            className="flex-1 overflow-hidden relative"
            onScroll={() => syncScroll("ruler")}
            style={{ backgroundColor: "hsl(var(--muted) / 0.6)" }}
          >
            <div className="relative" style={{ width: totalWidth, height: RULER_H }}>
              {rulerTicks.map((tick, i) => (
                <div key={i} className="absolute top-0" style={{ left: tick.x, height: RULER_H }}>
                  {/* Tick line */}
                  <div
                    className="absolute bottom-0 w-px"
                    style={{
                      height: tick.major ? 10 : 5,
                      backgroundColor: tick.major
                        ? "hsl(var(--foreground) / 0.15)"
                        : "hsl(var(--foreground) / 0.06)",
                    }}
                  />
                  {/* Time label */}
                  {tick.label && (
                    <span
                      className="absolute top-1.5 left-1 text-[9px] text-muted-foreground/50 select-none whitespace-nowrap"
                      style={{ fontFamily: "'DM Mono', 'IBM Plex Mono', monospace" }}
                    >
                      {tick.label}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Track area ── */}
        <div className="flex" style={{ maxHeight: 420 }}>
          {/* ── Fixed left: track names ── */}
          <div
            className="shrink-0 overflow-y-auto overflow-x-hidden scrollbar-thin border-r"
            style={{
              width: LABEL_W,
              maxHeight: 420,
              backgroundColor: "hsl(var(--muted) / 0.7)",
              borderColor: "hsl(var(--border) / 0.3)",
            }}
          >
            {visibleTracks.map((track, vi) => {
              const isGroup = track.type === "group";
              const isChild = !!track.parentId;
              const color = resolveColor(track, session.tracks);
              const count = childCounts[track.name];

              return (
                <div
                  key={track._i}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 select-none transition-colors duration-75",
                    isGroup
                      ? "bg-foreground/[0.03]"
                      : vi % 2 === 0
                        ? "bg-transparent"
                        : "bg-foreground/[0.015]"
                  )}
                  style={{
                    height: ROW_H,
                    paddingLeft: isChild ? 28 : 10,
                  }}
                >
                  {/* Group chevron */}
                  {isGroup && (
                    <button
                      onClick={() => toggleGroup(track.name)}
                      className="shrink-0 w-4 h-4 flex items-center justify-center rounded-sm hover:bg-foreground/[0.06] transition-colors"
                    >
                      {collapsedGroups.has(track.name)
                        ? <ChevronRight className="w-3 h-3 text-muted-foreground/60" />
                        : <ChevronDown className="w-3 h-3 text-muted-foreground/60" />}
                    </button>
                  )}

                  {/* Color dot */}
                  <div
                    className="shrink-0 rounded-full"
                    style={{
                      width: 6,
                      height: 6,
                      backgroundColor: `hsl(${color})`,
                    }}
                  />

                  {/* Track name */}
                  <span
                    className={cn(
                      "text-[10px] truncate flex-1",
                      isGroup ? "font-semibold text-foreground/70" : "text-foreground/50"
                    )}
                    style={{ fontFamily: "'DM Mono', 'IBM Plex Mono', monospace" }}
                  >
                    {track.name}
                  </span>

                  {/* Child count badge */}
                  {isGroup && count && count > 0 && (
                    <span className="text-[8px] text-muted-foreground/35 font-mono shrink-0">{count}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Scrollable right: clip lanes ── */}
          <div
            ref={clipScrollRef}
            className="flex-1 overflow-auto scrollbar-thin"
            style={{ maxHeight: 420 }}
            onScroll={() => syncScroll("clips")}
          >
            <div style={{ width: totalWidth }}>
              {visibleTracks.map((track, vi) => {
                const isGroup = track.type === "group";
                const color = resolveColor(track, session.tracks);

                return (
                  <div
                    key={track._i}
                    className={cn(
                      "relative",
                      isGroup
                        ? "bg-foreground/[0.03]"
                        : vi % 2 === 0
                          ? "bg-transparent"
                          : "bg-foreground/[0.015]"
                    )}
                    style={{ height: ROW_H, width: totalWidth }}
                  >
                    {/* Bar grid lines */}
                    {rulerTicks.map((tick, ti) =>
                      tick.major ? (
                        <div
                          key={ti}
                          className="absolute top-0 h-full w-px"
                          style={{
                            left: tick.x,
                            backgroundColor: "hsl(var(--foreground) / 0.04)",
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
                          className="absolute rounded-[3px] cursor-default hover:brightness-110 transition-[filter] duration-75"
                          style={{
                            left,
                            width: w,
                            top: 3,
                            height: ROW_H - 6,
                            backgroundColor: `hsl(${color} / 0.75)`,
                            boxShadow: `inset 0 1px 0 hsl(${color} / 0.2), 0 1px 2px hsl(0 0% 0% / 0.08)`,
                          }}
                          title={clip.name}
                        >
                          {w > 40 && (
                            <span
                              className="block truncate text-[8px] font-medium px-1.5 select-none"
                              style={{
                                color: "hsl(0 0% 100% / 0.85)",
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
