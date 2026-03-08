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

/* ── Color palette by keyword ── */
const GROUP_COLORS: Record<string, string> = {
  kick: "25 95% 55%",
  bass: "25 95% 55%",
  drum: "45 95% 55%",
  perc: "45 80% 50%",
  synth: "175 65% 45%",
  pad: "175 50% 50%",
  lead: "175 65% 45%",
  vox: "270 60% 60%",
  vocal: "270 60% 60%",
  fx: "210 60% 55%",
};

const PALETTE = [
  "25 85% 55%",
  "45 90% 52%",
  "175 60% 45%",
  "270 55% 58%",
  "210 55% 52%",
  "340 60% 55%",
  "140 50% 45%",
  "15 70% 50%",
];

function resolveTrackColorHSL(track: AlsTrack, allTracks: AlsTrack[]): string {
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

/* ── Layout constants ── */
const TRACK_ROW_HEIGHT = 30;
const LABEL_WIDTH = 140;
const RULER_HEIGHT = 32;

/* ── Time formatting ── */
function beatsToTime(beats: number, bpm: number): string {
  if (!bpm || !isFinite(bpm) || bpm <= 0) return "0:00";
  const seconds = (beats / bpm) * 60;
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ── Clip block ── */
interface ClipBlockProps {
  name: string;
  left: number;
  width: number;
  colorHSL: string;
  height: number;
}

const ClipBlock = ({ name, left, width, colorHSL, height }: ClipBlockProps) => {
  const showName = width > 44;
  return (
    <div
      className="absolute rounded-[3px] cursor-default transition-[filter] duration-100 hover:brightness-[1.15]"
      style={{
        left,
        width,
        top: 3,
        height: height - 6,
        background: `linear-gradient(180deg, hsl(${colorHSL} / 0.82) 0%, hsl(${colorHSL} / 0.58) 100%)`,
        boxShadow: `inset 0 1px 0 hsl(${colorHSL} / 0.25)`,
      }}
      title={name}
    >
      {showName && (
        <span
          className="block truncate text-[7.5px] font-medium px-1.5 leading-none select-none"
          style={{
            color: "hsl(0 0% 100% / 0.88)",
            lineHeight: `${height - 6}px`,
          }}
        >
          {name.length > 24 ? name.slice(0, 24) + "…" : name}
        </span>
      )}
    </div>
  );
};

/* ── Right-side track label ── */
interface TrackLabelProps {
  name: string;
  colorHSL: string;
  isGroup: boolean;
  isChild: boolean;
  isHovered: boolean;
  isCollapsed?: boolean;
  onToggle?: () => void;
  childCount?: number;
}

const TrackLabel = ({ name, colorHSL, isGroup, isChild, isHovered, isCollapsed, onToggle, childCount }: TrackLabelProps) => (
  <div
    className={cn(
      "shrink-0 flex items-center gap-1.5 border-l border-border-subtle/30 transition-colors duration-100 px-2.5",
      isHovered ? "bg-secondary/50" : "bg-card/20"
    )}
    style={{ width: LABEL_WIDTH, height: TRACK_ROW_HEIGHT }}
  >
    {isGroup && onToggle && (
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className="shrink-0 w-4 h-4 flex items-center justify-center rounded-sm hover:bg-secondary/60 transition-colors"
      >
        {isCollapsed
          ? <ChevronRight className="w-3 h-3 text-muted-foreground/70" />
          : <ChevronDown className="w-3 h-3 text-muted-foreground/70" />}
      </button>
    )}
    {!isGroup && isChild && <div className="w-4 shrink-0" />}
    <div
      className="shrink-0 rounded-full"
      style={{ width: 5, height: 5, backgroundColor: `hsl(${colorHSL})` }}
    />
    <span
      className={cn(
        "text-[10px] truncate flex-1",
        isGroup ? "font-semibold text-foreground/75" : "text-muted-foreground/65"
      )}
      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
    >
      {name}
    </span>
    {isGroup && childCount !== undefined && childCount > 0 && (
      <span className="text-[8px] text-muted-foreground/40 shrink-0 font-mono">{childCount}</span>
    )}
  </div>
);

/* ── Mobile lane card ── */
interface MobileLaneCardProps {
  trackName: string;
  colorHSL: string;
  isGroup: boolean;
  clipCount: number;
}

const MobileLaneCard = ({ trackName, colorHSL, isGroup, clipCount }: MobileLaneCardProps) => (
  <div className="flex items-center gap-2.5 px-3 py-2 border-b border-border-subtle/30 last:border-0">
    <div
      className="shrink-0 rounded-full"
      style={{ width: 5, height: 5, backgroundColor: `hsl(${colorHSL})` }}
    />
    <span className={cn("text-xs flex-1 truncate", isGroup ? "font-semibold text-foreground/80" : "text-muted-foreground/70")}>
      {trackName}
    </span>
    <Badge variant="outline" className="text-[9px] font-mono shrink-0">
      {clipCount}
    </Badge>
  </div>
);

/* ── Ruler ── */
interface RulerProps {
  totalBeats: number;
  pxPerBeat: number;
  bpm: number;
  totalWidth: number;
}

const Ruler = ({ totalBeats, pxPerBeat, bpm, totalWidth }: RulerProps) => {
  const beatsPerBar = 4;
  const totalBars = Math.ceil(totalBeats / beatsPerBar);

  // Determine label interval based on density
  const barWidthPx = beatsPerBar * pxPerBeat;
  let labelEvery = 1;
  if (barWidthPx < 20) labelEvery = 16;
  else if (barWidthPx < 40) labelEvery = 8;
  else if (barWidthPx < 80) labelEvery = 4;
  else if (barWidthPx < 160) labelEvery = 2;

  return (
    <div className="relative flex-1 overflow-hidden" style={{ minWidth: totalWidth, height: RULER_HEIGHT }}>
      {Array.from({ length: totalBars }, (_, i) => {
        const barNum = i + 1;
        const x = i * beatsPerBar * pxPerBeat;
        const isPrimary = i % labelEvery === 0;
        const isMid = labelEvery > 1 && i % (labelEvery / 2) === 0 && !isPrimary;

        return (
          <div key={i} className="absolute top-0" style={{ left: x, height: RULER_HEIGHT }}>
            {/* Tick */}
            <div
              className="absolute bottom-0 w-px"
              style={{
                height: isPrimary ? 10 : isMid ? 7 : 4,
                backgroundColor: isPrimary
                  ? "hsl(var(--foreground) / 0.18)"
                  : isMid
                    ? "hsl(var(--foreground) / 0.10)"
                    : "hsl(var(--foreground) / 0.05)",
              }}
            />
            {/* Label */}
            {isPrimary && (
              <div className="absolute top-1 left-1.5 flex items-baseline gap-1.5 select-none">
                <span
                  className="text-[9px] text-foreground/45 font-medium"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {barNum}
                </span>
                <span
                  className="text-[7px] text-muted-foreground/30"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {beatsToTime(i * beatsPerBar, bpm)}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ── Main component ── */
const AlsAnalyzer = () => {
  const [session, setSession] = useState<AlsSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [hoveredTrack, setHoveredTrack] = useState<number | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  const toggleGroup = useCallback((groupName: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupName)) next.delete(groupName);
      else next.add(groupName);
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

  /* ── Compute layout data (preserves original track order) ── */
  const layoutData = useMemo(() => {
    if (!session) return null;
    let maxEnd = 0;
    const tracksWithEnds = session.tracks
      .filter((t) => t.clips.length > 0)
      .map((t) => ({
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
    return { tracksWithEnds, totalBeats, pxPerBeat, totalWidth };
  }, [session]);

  /* ── Build visible track list with collapse logic ── */
  const visibleTracks = useMemo(() => {
    if (!layoutData) return [];
    const result: Array<typeof layoutData.tracksWithEnds[0] & { _index: number }> = [];
    const hiddenParents = new Set<string>();
    for (let i = 0; i < layoutData.tracksWithEnds.length; i++) {
      const t = layoutData.tracksWithEnds[i];
      if (t.parentId && (collapsedGroups.has(t.parentId) || hiddenParents.has(t.parentId))) {
        hiddenParents.add(t.name);
        continue;
      }
      result.push({ ...t, _index: i });
    }
    return result;
  }, [layoutData, collapsedGroups]);

  /* ── Child count per group ── */
  const childCounts = useMemo(() => {
    if (!layoutData) return {};
    const counts: Record<string, number> = {};
    for (const t of layoutData.tracksWithEnds) {
      if (t.parentId) {
        counts[t.parentId] = (counts[t.parentId] || 0) + 1;
      }
    }
    return counts;
  }, [layoutData]);

  /* ── Upload state ── */
  if (!session || !layoutData) {
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
          className={cn(
            "cursor-pointer flex flex-col items-center justify-center gap-4 rounded-lg p-12 select-none transition-all duration-200",
            dragOver
              ? "border-2 border-dashed border-foreground/30 bg-secondary/80"
              : "border-2 border-dashed border-border-subtle hover:border-foreground/15 hover:bg-secondary/30"
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

  const { tracksWithEnds, totalBeats, pxPerBeat, totalWidth } = layoutData;
  const bpm = session.bpm;

  /* ── Mobile: simplified stacked cards ── */
  if (isMobile) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium truncate max-w-[160px]">{fileName}</span>
          </div>
          <button
            onClick={() => { setSession(null); setFileName(null); }}
            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Upload new
          </button>
        </div>
        <div className="flex items-center gap-2">
          {bpm > 0 && (
            <Badge variant="secondary" className="text-[10px] font-mono">{Math.round(bpm)} BPM</Badge>
          )}
          <Badge variant="outline" className="text-[10px] font-mono">{tracksWithEnds.length} tracks</Badge>
        </div>
        <div className="rounded-lg border border-border-subtle/50 overflow-hidden bg-card/40">
          {tracksWithEnds.map((track, i) => {
            const colorHSL = resolveTrackColorHSL(track, session.tracks);
            const isGroup = track.type === "group";
            return (
              <MobileLaneCard
                key={i}
                trackName={track.name}
                colorHSL={colorHSL}
                isGroup={isGroup}
                clipCount={track.clips.length}
              />
            );
          })}
        </div>
      </div>
    );
  }

  /* ── Desktop: DAW timeline ── */
  return (
    <div className="space-y-3">
      {/* Transport bar */}
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
            {tracksWithEnds.length} tracks
          </Badge>
          <span
            className="text-[10px] text-muted-foreground/45 font-mono"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
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

      {/* DAW canvas */}
      <div className="rounded-lg border border-border-subtle/50 overflow-hidden bg-card/20">
        {/* Ruler row */}
        <div
          className="flex border-b border-border-subtle/40"
          style={{ height: RULER_HEIGHT }}
        >
          {/* Left spacer (clean, no header) */}
          <div
            className="shrink-0 border-r border-border-subtle/30 bg-secondary/15"
            style={{ width: 12 }}
          />

          {/* Ruler */}
          <div className="flex-1 overflow-hidden bg-secondary/10">
            <Ruler
              totalBeats={totalBeats}
              pxPerBeat={pxPerBeat}
              bpm={bpm}
              totalWidth={totalWidth}
            />
          </div>

          {/* Right label column header */}
          <div
            className="shrink-0 border-l border-border-subtle/30 bg-secondary/15 flex items-end px-2.5 pb-1"
            style={{ width: LABEL_WIDTH }}
          >
            <span
              className="text-[7px] text-muted-foreground/35 uppercase tracking-[0.15em]"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Tracks
            </span>
          </div>
        </div>

        {/* Track lanes */}
        <div className="overflow-auto max-h-[60vh] scrollbar-thin">
          <div style={{ minWidth: 12 + totalWidth + LABEL_WIDTH }}>
            {visibleTracks.map((track) => {
              const isGroup = track.type === "group";
              const isChild = !!track.parentId;
              const colorHSL = resolveTrackColorHSL(track, session.tracks);
              const isHovered = hoveredTrack === track._index;

              return (
                <div
                  key={track._index}
                  className="flex items-stretch border-b border-border-subtle/15 transition-colors duration-75"
                  style={{ height: TRACK_ROW_HEIGHT }}
                  onMouseEnter={() => setHoveredTrack(track._index)}
                  onMouseLeave={() => setHoveredTrack(null)}
                >
                  {/* Left color strip */}
                  <div
                    className={cn(
                      "shrink-0 border-r border-border-subtle/20 transition-colors duration-75",
                      isHovered ? "bg-secondary/40" : "bg-transparent"
                    )}
                    style={{ width: 12 }}
                  >
                    <div
                      className="h-full"
                      style={{
                        width: 3,
                        marginLeft: isChild ? 6 : 3,
                        backgroundColor: `hsl(${colorHSL} / ${isGroup ? 0.7 : 0.35})`,
                        borderRadius: 1,
                      }}
                    />
                  </div>

                  {/* Clip lane */}
                  <div
                    className={cn(
                      "relative flex-1 min-w-0 transition-colors duration-75",
                      isHovered ? "bg-secondary/20" : "bg-transparent"
                    )}
                    style={{ width: totalWidth }}
                  >
                    {/* Subtle bar grid */}
                    {(() => {
                      const beatsPerBar = 4;
                      const barCount = Math.ceil(totalBeats / beatsPerBar);
                      const labelEvery = beatsPerBar * pxPerBeat < 80 ? 4 : 1;
                      return Array.from({ length: barCount }, (_, bi) => {
                        const isPrimary = bi % labelEvery === 0;
                        return (
                          <div
                            key={bi}
                            className="absolute top-0 h-full w-px"
                            style={{
                              left: bi * beatsPerBar * pxPerBeat,
                              backgroundColor: isPrimary
                                ? "hsl(var(--foreground) / 0.04)"
                                : "hsl(var(--foreground) / 0.02)",
                            }}
                          />
                        );
                      });
                    })()}

                    {/* Clips */}
                    {track.clips.map((clip, ci) => {
                      const left = clip.start * pxPerBeat;
                      const width = Math.max((clip.resolvedEnd - clip.start) * pxPerBeat, 3);
                      return (
                        <ClipBlock
                          key={ci}
                          name={clip.name}
                          left={left}
                          width={width}
                          colorHSL={colorHSL}
                          height={TRACK_ROW_HEIGHT}
                        />
                      );
                    })}
                  </div>

                  {/* Right-side label */}
                  <TrackLabel
                    name={track.name}
                    colorHSL={colorHSL}
                    isGroup={isGroup}
                    isChild={isChild}
                    isHovered={isHovered}
                    isCollapsed={collapsedGroups.has(track.name)}
                    onToggle={isGroup ? () => toggleGroup(track.name) : undefined}
                    childCount={childCounts[track.name]}
                  />
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
