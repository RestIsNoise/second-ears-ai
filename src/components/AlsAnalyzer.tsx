import { useState, useCallback, useRef, useMemo } from "react";
import { Upload, Loader2, Music, Volume2, VolumeX, Headphones } from "lucide-react";
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
const TRACK_ROW_HEIGHT = 32;
const TRACK_HEADER_WIDTH = 160;
const RULER_HEIGHT = 28;

/* ── Time formatting ── */
function beatsToTime(beats: number, bpm: number): string {
  const seconds = (beats / bpm) * 60;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ── Sub-components ── */

interface TrackHeaderProps {
  name: string;
  colorHSL: string;
  isGroup: boolean;
  isChild: boolean;
  isHovered: boolean;
}

const TrackHeader = ({ name, colorHSL, isGroup, isChild, isHovered }: TrackHeaderProps) => (
  <div
    className={cn(
      "shrink-0 flex items-center gap-2 border-r border-border-subtle/40 transition-colors duration-150",
      isHovered ? "bg-secondary/60" : "bg-card/30"
    )}
    style={{
      width: TRACK_HEADER_WIDTH,
      paddingLeft: isChild ? 20 : 10,
      height: TRACK_ROW_HEIGHT,
    }}
  >
    {/* Color chip */}
    <div
      className="shrink-0 rounded-sm"
      style={{
        width: 4,
        height: 16,
        backgroundColor: `hsl(${colorHSL})`,
      }}
    />
    <span
      className={cn(
        "text-[10px] truncate flex-1",
        isGroup ? "font-semibold text-foreground/80" : "text-muted-foreground/70"
      )}
    >
      {name}
    </span>
    {/* Visual affordances (UI only) */}
    <div className="flex items-center gap-0.5 shrink-0 mr-1.5 opacity-0 group-hover/lane:opacity-60 transition-opacity duration-200">
      <Volume2 className="w-[10px] h-[10px] text-muted-foreground" />
      <Headphones className="w-[10px] h-[10px] text-muted-foreground" />
    </div>
  </div>
);

interface ClipBlockProps {
  name: string;
  left: number;
  width: number;
  colorHSL: string;
  height: number;
}

const ClipBlock = ({ name, left, width, colorHSL, height }: ClipBlockProps) => {
  const showName = width > 40;
  return (
    <div
      className="absolute rounded-[4px] transition-all duration-100 hover:brightness-110 hover:shadow-sm cursor-default"
      style={{
        left,
        width,
        top: 3,
        height: height - 6,
        background: `linear-gradient(180deg, hsl(${colorHSL} / 0.85) 0%, hsl(${colorHSL} / 0.65) 100%)`,
        boxShadow: `inset 0 1px 0 hsl(${colorHSL} / 0.3), 0 1px 2px hsl(0 0% 0% / 0.08)`,
      }}
      title={name}
    >
      {showName && (
        <span
          className="block truncate text-[8px] font-medium px-1.5 leading-none"
          style={{
            color: "hsl(0 0% 100% / 0.9)",
            lineHeight: `${height - 6}px`,
          }}
        >
          {name.length > 22 ? name.slice(0, 22) + "…" : name}
        </span>
      )}
    </div>
  );
};

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
      className="shrink-0 rounded-sm"
      style={{ width: 4, height: 20, backgroundColor: `hsl(${colorHSL})` }}
    />
    <span className={cn("text-xs flex-1 truncate", isGroup ? "font-semibold text-foreground/80" : "text-muted-foreground/70")}>
      {trackName}
    </span>
    <Badge variant="outline" className="text-[9px] font-mono-brand shrink-0">
      {clipCount}
    </Badge>
  </div>
);

/* ── Main component ── */
const AlsAnalyzer = () => {
  const [session, setSession] = useState<AlsSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [hoveredTrack, setHoveredTrack] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

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

  /* ── Compute layout data ── */
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
            "cursor-pointer flex flex-col items-center justify-center gap-4 rounded-xl p-12 select-none transition-all duration-200",
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

  /* ── Ruler marks ── */
  const barInterval = 4; // beats per bar
  const barCount = Math.ceil(totalBeats / barInterval);

  /* ── Mobile: simplified stacked cards ── */
  if (isMobile) {
    return (
      <div className="space-y-3">
        {/* Header */}
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

        {/* Stats */}
        <div className="flex items-center gap-2">
          {bpm > 0 && (
            <Badge variant="secondary" className="text-[10px] font-mono-brand">{Math.round(bpm)} BPM</Badge>
          )}
          <Badge variant="outline" className="text-[10px] font-mono-brand">{tracksWithEnds.length} tracks</Badge>
        </div>

        {/* Lane cards */}
        <div className="rounded-xl border border-border-subtle overflow-hidden bg-card/40">
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
            <Badge variant="secondary" className="text-[10px] font-mono-brand tracking-wider">
              {Math.round(bpm)} BPM
            </Badge>
          )}
          <Badge variant="outline" className="text-[10px] font-mono-brand tracking-wider">
            {tracksWithEnds.length} tracks
          </Badge>
          <span className="text-[10px] text-muted-foreground/50 font-mono-brand">
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
      <div className="rounded-xl border border-border-subtle overflow-hidden bg-card/30 shadow-sm">
        {/* Timeline ruler */}
        <div
          className="flex border-b border-border-subtle/60 bg-secondary/30"
          style={{ height: RULER_HEIGHT }}
        >
          {/* Empty header corner */}
          <div
            className="shrink-0 border-r border-border-subtle/40 flex items-end px-2 pb-1"
            style={{ width: TRACK_HEADER_WIDTH }}
          >
            <span className="text-[8px] text-muted-foreground/40 font-mono-brand uppercase tracking-widest">
              Tracks
            </span>
          </div>

          {/* Ruler ticks */}
          <div className="relative flex-1 overflow-hidden" style={{ minWidth: totalWidth }}>
            {Array.from({ length: barCount }, (_, i) => {
              const beat = i * barInterval;
              const x = beat * pxPerBeat;
              const isMajor = i % 4 === 0;
              return (
                <div
                  key={i}
                  className="absolute top-0 h-full"
                  style={{ left: x }}
                >
                  {/* Tick line */}
                  <div
                    className={cn(
                      "absolute bottom-0 w-px",
                      isMajor ? "h-3 bg-foreground/15" : "h-2 bg-foreground/8"
                    )}
                  />
                  {/* Label: bar number + time on major ticks */}
                  {isMajor && (
                    <div className="absolute top-0.5 left-1 flex flex-col leading-none">
                      <span className="text-[9px] font-mono-brand text-foreground/40 font-medium">
                        {i + 1}
                      </span>
                      <span className="text-[7px] font-mono-brand text-muted-foreground/30">
                        {beatsToTime(beat, bpm)}
                      </span>
                    </div>
                  )}
                  {!isMajor && (
                    <span className="absolute top-1 left-1 text-[8px] font-mono-brand text-muted-foreground/25">
                      {i + 1}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Track lanes */}
        <div className="overflow-auto max-h-[60vh] scrollbar-thin">
          <div style={{ minWidth: TRACK_HEADER_WIDTH + totalWidth }}>
            {tracksWithEnds.map((track, i) => {
              const isGroup = track.type === "group";
              const isChild = !!track.parentId;
              const colorHSL = resolveTrackColorHSL(track, session.tracks);
              const isHovered = hoveredTrack === i;

              return (
                <div
                  key={i}
                  className="group/lane flex items-stretch border-b border-border-subtle/20 transition-colors duration-100"
                  style={{ height: TRACK_ROW_HEIGHT }}
                  onMouseEnter={() => setHoveredTrack(i)}
                  onMouseLeave={() => setHoveredTrack(null)}
                >
                  {/* Track header */}
                  <TrackHeader
                    name={track.name}
                    colorHSL={colorHSL}
                    isGroup={isGroup}
                    isChild={isChild}
                    isHovered={isHovered}
                  />

                  {/* Clip lane */}
                  <div
                    className={cn(
                      "relative flex-1 min-w-0 transition-colors duration-100",
                      isHovered ? "bg-secondary/30" : "bg-transparent"
                    )}
                    style={{ width: totalWidth }}
                  >
                    {/* Subtle bar grid lines */}
                    {Array.from({ length: barCount }, (_, bi) => {
                      const isMajor = bi % 4 === 0;
                      return (
                        <div
                          key={bi}
                          className={cn(
                            "absolute top-0 h-full w-px",
                            isMajor ? "bg-foreground/[0.04]" : "bg-foreground/[0.02]"
                          )}
                          style={{ left: bi * barInterval * pxPerBeat }}
                        />
                      );
                    })}

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
