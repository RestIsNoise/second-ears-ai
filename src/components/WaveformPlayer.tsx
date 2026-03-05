import { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef, useMemo } from "react";
import WaveSurfer from "wavesurfer.js";
import { Play, Pause, RotateCcw, AlertCircle } from "lucide-react";
import WaveformMarkers, { MARKER_ZONE_HEIGHT } from "@/components/WaveformMarkers";
import type { WaveformMarker } from "@/types/feedback";

export interface WaveformPlayerHandle {
  seekTo: (timeSec: number) => void;
  getCurrentTime: () => number;
  play: () => void;
  pause: () => void;
  isPlaying: () => boolean;
  setVolume: (v: number) => void;
  getDuration: () => number;
}

interface Props {
  audioFile: File;
  markers?: WaveformMarker[];
  activeMarkerId?: string | null;
  onMarkerClick?: (marker: WaveformMarker) => void;
  onTimeUpdate?: (time: number) => void;
  onDurationReady?: (duration: number) => void;
  onAddNote?: (text: string, timestampSec: number) => void;
  onEditNote?: (markerId: string) => void;
  hideControls?: boolean;
  label?: string;
  /** Custom waveform color (default: "#d0d0d0") */
  waveColor?: string;
  /** Custom progress color (default: "#1a1a1a") */
  progressColor?: string;
  /** Render hollow/outline bars instead of solid filled bars */
  outlineMode?: boolean;
}

const formatTime = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const formatTimePrecise = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return "0:00.0";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const tenths = Math.floor((s % 1) * 10);
  return `${m}:${sec.toString().padStart(2, "0")}.${tenths}`;
};

/* ── Time ruler helpers ── */

const RULER_HEIGHT = 22;
const MIN_LABEL_GAP_PX = 64;
const MARKER_SNAP_PX = 14;

function pickInterval(duration: number, containerWidth: number): { major: number; minor: number } {
  const candidates: [number, number][] = [
    [5, 1], [10, 2], [15, 5], [20, 5], [30, 10], [60, 15], [120, 30],
  ];
  for (const [major, minor] of candidates) {
    const tickCount = duration / major;
    const pxPerTick = containerWidth / tickCount;
    if (pxPerTick >= MIN_LABEL_GAP_PX) return { major, minor };
  }
  return { major: 120, minor: 30 };
}

interface RulerProps {
  duration: number;
  containerWidth: number;
  currentTime: number;
  playing: boolean;
  hoverX: number | null;
  hoverTime: number;
  markers: WaveformMarker[];
  snappedMarkerId: string | null;
}

const TimeRuler = ({
  duration, containerWidth, currentTime, playing,
  hoverX, hoverTime, markers, snappedMarkerId,
}: RulerProps) => {
  const { major, minor } = useMemo(
    () => pickInterval(duration, containerWidth),
    [duration, containerWidth]
  );

  if (duration <= 0 || containerWidth <= 0) return null;

  const ticks: { time: number; isMajor: boolean }[] = [];
  for (let t = 0; t <= duration; t += minor) {
    ticks.push({ time: t, isMajor: t % major === 0 });
  }

  const playheadPct = (currentTime / duration) * 100;
  const snappedMarker = snappedMarkerId ? markers.find(m => m.id === snappedMarkerId) : null;

  return (
    <div className="relative select-none" style={{ height: RULER_HEIGHT, width: "100%" }}>
      <div className="absolute top-0 left-0 right-0" style={{ height: RULER_HEIGHT }}>
        {/* Bottom border line */}
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{ height: "1px", backgroundColor: "hsl(var(--foreground) / 0.08)" }}
        />

        {/* Ticks + labels */}
        {ticks.map(({ time, isMajor }) => {
          const leftPct = (time / duration) * 100;
          return (
            <div
              key={time}
              className="absolute bottom-0"
              style={{ left: `${leftPct}%`, transform: "translateX(-0.5px)" }}
            >
              <div
                style={{
                  width: isMajor ? "1px" : "0.5px",
                  height: isMajor ? 10 : 5,
                  backgroundColor: isMajor
                    ? "hsl(var(--foreground) / 0.35)"
                    : "hsl(var(--foreground) / 0.1)",
                }}
              />
              {isMajor && (
                <span
                  className="absolute whitespace-nowrap tabular-nums"
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 9,
                    lineHeight: 1,
                    letterSpacing: "0.02em",
                    color: "hsl(var(--foreground) / 0.4)",
                    bottom: 13,
                    left: 0,
                    transform: time === 0 ? "none" : "translateX(-50%)",
                  }}
                >
                  {formatTime(time)}
                </span>
              )}
            </div>
          );
        })}

        {/* Playhead tick on ruler */}
        <div
          className="absolute bottom-0 z-[4] pointer-events-none"
          style={{
            left: `${playheadPct}%`,
            transform: "translateX(-0.5px)",
            transition: playing ? "none" : "left 0.1s ease-out",
          }}
        >
          <div style={{ width: "1px", height: 12, backgroundColor: "hsl(var(--foreground) / 0.7)" }} />
        </div>

        {/* Hover tooltip */}
        {hoverX !== null && (
          <div
            className="absolute pointer-events-none z-[6]"
            style={{ left: hoverX, top: -2, transform: "translateX(-50%)" }}
          >
            <span
              className="rounded px-1.5 py-0.5 tabular-nums whitespace-nowrap"
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 9,
                lineHeight: 1,
                letterSpacing: "0.02em",
                color: snappedMarker ? "hsl(var(--foreground) / 0.9)" : "hsl(var(--foreground) / 0.6)",
                backgroundColor: "hsl(var(--background) / 0.95)",
                border: `0.5px solid hsl(var(--foreground) / ${snappedMarker ? "0.15" : "0.08"})`,
                fontWeight: snappedMarker ? 500 : 400,
              }}
            >
              {snappedMarker
                ? `▸ ${formatTimePrecise(snappedMarker.time)}`
                : formatTimePrecise(hoverTime)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Main component ── */

const WaveformPlayer = forwardRef<WaveformPlayerHandle, Props>(
  ({ audioFile, markers = [], activeMarkerId, onMarkerClick, onTimeUpdate, onDurationReady, onAddNote, onEditNote, hideControls, label, waveColor, progressColor, outlineMode }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const wsRef = useRef<WaveSurfer | null>(null);
    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [hoverX, setHoverX] = useState<number | null>(null);
    const [hoverTime, setHoverTime] = useState<number>(0);
    const [containerWidth, setContainerWidth] = useState(0);

    useImperativeHandle(ref, () => ({
      seekTo: (timeSec: number) => {
        if (wsRef.current && duration > 0) {
          wsRef.current.seekTo(timeSec / duration);
        }
      },
      getCurrentTime: () => currentTime,
      play: () => wsRef.current?.play(),
      pause: () => wsRef.current?.pause(),
      isPlaying: () => playing,
      setVolume: (v: number) => wsRef.current?.setVolume(v),
      getDuration: () => duration,
    }));

    useEffect(() => {
      if (!wrapperRef.current) return;
      const ro = new ResizeObserver((entries) => {
        for (const entry of entries) setContainerWidth(entry.contentRect.width);
      });
      ro.observe(wrapperRef.current);
      return () => ro.disconnect();
    }, []);

    useEffect(() => {
      if (wsRef.current) { wsRef.current.destroy(); wsRef.current = null; }
      setError(null); setLoading(true); setDuration(0); setCurrentTime(0); setPlaying(false);
      if (!containerRef.current || !audioFile) return;
      if (!(audioFile instanceof File)) {
        setError(`Waveform source is not File (got ${typeof audioFile})`);
        setLoading(false);
        return;
      }

      const wsOptions: Record<string, any> = {
        container: containerRef.current,
        waveColor: waveColor || "#d0d0d0",
        progressColor: progressColor || "#1a1a1a",
        cursorColor: "transparent",
        cursorWidth: 0,
        barWidth: 1,
        barGap: 1,
        barRadius: 0,
        height: 84,
        normalize: true,
        interact: true,
      };

      if (outlineMode) {
        const outlineColor = waveColor || "#d0d0d0";
        const outlineProgressColor = progressColor || "#1a1a1a";
        wsOptions.waveColor = "transparent";
        wsOptions.progressColor = "transparent";
        wsOptions.renderFunction = (channels: Float32Array[], ctx: CanvasRenderingContext2D) => {
          const { width, height } = ctx.canvas;
          const channel = channels[0];
          const step = Math.ceil(channel.length / width);
          const mid = height / 2;
          ctx.lineWidth = 1;

          for (let i = 0; i < width; i += 2) {
            let max = 0;
            for (let j = i * step; j < (i + 1) * step && j < channel.length; j++) {
              const v = Math.abs(channel[j]);
              if (v > max) max = v;
            }
            const barH = Math.max(1, max * mid);
            ctx.strokeStyle = outlineColor;
            ctx.strokeRect(i, mid - barH, 1, barH * 2);
          }
        };
      }

      const ws = WaveSurfer.create(wsOptions as any);

      const onResize = () => ws.setOptions({ width: containerRef.current?.clientWidth });
      window.addEventListener("resize", onResize);

      ws.on("ready", () => { const d = ws.getDuration(); setDuration(d); setLoading(false); onDurationReady?.(d); });
      ws.on("audioprocess", () => { const t = ws.getCurrentTime(); setCurrentTime(t); onTimeUpdate?.(t); });
      ws.on("seeking", () => { const t = ws.getCurrentTime(); setCurrentTime(t); onTimeUpdate?.(t); });
      ws.on("play", () => setPlaying(true));
      ws.on("pause", () => setPlaying(false));
      ws.on("finish", () => setPlaying(false));
      ws.on("error", (err) => {
        setError(typeof err === "string" ? err : (err as any)?.message || String(err));
        setLoading(false);
      });

      ws.loadBlob(audioFile);
      wsRef.current = ws;

      return () => { window.removeEventListener("resize", onResize); ws.destroy(); wsRef.current = null; };
    }, [audioFile, waveColor, progressColor]);

    const togglePlay = useCallback(() => wsRef.current?.playPause(), []);
    const restart = useCallback(() => { wsRef.current?.seekTo(0); wsRef.current?.play(); }, []);

    const snappedMarkerId_hover = useMemo(() => {
      if (hoverX === null || duration <= 0 || containerWidth <= 0 || markers.length === 0) return null;
      for (const m of markers) {
        const markerX = (m.time / duration) * containerWidth;
        if (Math.abs(markerX - hoverX) <= MARKER_SNAP_PX) return m.id;
      }
      return null;
    }, [hoverX, duration, containerWidth, markers]);

    const handleMouseMove = useCallback(
      (e: React.MouseEvent) => {
        if (!wrapperRef.current || duration <= 0) return;
        const rect = wrapperRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const pct = Math.max(0, Math.min(1, x / rect.width));
        setHoverX(x);
        setHoverTime(pct * duration);
      },
      [duration]
    );

    const handleMouseLeave = useCallback(() => setHoverX(null), []);

    const playheadPct = duration > 0 ? (currentTime / duration) * 100 : 0;
    const hasMarkers = markers.length > 0;
    const WAVEFORM_HEIGHT = 96;

    return (
      <div className="rounded-xl border border-border-subtle bg-background p-4 md:p-5 space-y-0">
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-3 mb-2.5">
            <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-destructive">Waveform failed to load</p>
              <p className="text-xs text-muted-foreground mt-1 break-all">{error}</p>
            </div>
          </div>
        )}

        {/* Ruler + waveform + markers — single hover zone */}
        <div
          ref={wrapperRef}
          className="relative overflow-visible cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Time ruler — reduced gap */}
          {duration > 0 && containerWidth > 0 && (
            <TimeRuler
              duration={duration}
              containerWidth={containerWidth}
              currentTime={currentTime}
              playing={playing}
              hoverX={hoverX}
              hoverTime={hoverTime}
              markers={markers}
              snappedMarkerId={snappedMarkerId_hover}
            />
          )}

          {/* Waveform container with markers overlaid */}
          <div className="relative" style={{ height: WAVEFORM_HEIGHT, marginTop: 2 }}>
            {loading && !error && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="w-3 h-3 rounded-full bg-muted-foreground/30 animate-pulse" />
              </div>
            )}
            <div
              ref={containerRef}
              className="absolute left-0 right-0"
              style={{ top: 6, bottom: 6 }}
            />

          {/* Markers overlaid and vertically centered on the waveform */}
            {duration > 0 && containerWidth > 0 && (markers.length > 0 || onAddNote) && (
              <div
                className="absolute left-0 right-0 z-[5] pointer-events-none"
                style={{
                  top: (WAVEFORM_HEIGHT - MARKER_ZONE_HEIGHT) / 2,
                  height: MARKER_ZONE_HEIGHT,
                }}
              >
                <WaveformMarkers
                  markers={markers}
                  duration={duration}
                  containerWidth={containerWidth}
                  activeMarkerId={activeMarkerId}
                  snappedMarkerId={snappedMarkerId_hover}
                  hoverX={hoverX}
                  onMarkerClick={onMarkerClick}
                  onAddNote={onAddNote}
                  onEditNote={onEditNote}
                />
              </div>
            )}

            {/* Playhead line spanning waveform */}
            {duration > 0 && (
              <div
                className="absolute top-0 bottom-0 pointer-events-none z-[3]"
                style={{
                  left: `${playheadPct}%`,
                  width: "1px",
                  backgroundColor: "hsl(var(--foreground) / 0.5)",
                  transition: playing ? "none" : "left 0.1s ease-out",
                }}
              />
            )}

            {/* Hover cursor line */}
            {hoverX !== null && duration > 0 && (
              <div
                className="absolute top-0 bottom-0 pointer-events-none z-[3]"
                style={{
                  left: snappedMarkerId_hover
                    ? `${(markers.find(m => m.id === snappedMarkerId_hover)!.time / duration) * 100}%`
                    : hoverX,
                  width: snappedMarkerId_hover ? "1px" : "0.5px",
                  backgroundColor: snappedMarkerId_hover
                    ? "hsl(var(--foreground) / 0.3)"
                    : "hsl(var(--foreground) / 0.12)",
                  transition: "width 0.1s, background-color 0.1s",
                }}
              />
            )}
          </div>
        </div>

        {/* Controls row */}
        {!hideControls && (
          <div className="flex items-center gap-3 pt-2.5">
            {label && (
              <span className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground/50 mr-1">
                {label}
              </span>
            )}
            <button
              onClick={togglePlay}
              disabled={!!error || loading}
              className="w-8 h-8 rounded-full border border-border-subtle flex items-center justify-center text-foreground hover:bg-secondary/60 disabled:text-muted-foreground/30 disabled:hover:bg-transparent transition-colors"
            >
              {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
            </button>
            <button
              onClick={restart}
              disabled={!!error || loading}
              className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:text-muted-foreground/30 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <span
              className="text-foreground/80 tabular-nums leading-none ml-1"
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 13,
                letterSpacing: "-0.01em",
              }}
            >
              {formatTime(currentTime)}
              <span className="text-muted-foreground/40">&nbsp;/&nbsp;</span>
              {formatTime(duration)}
            </span>
          </div>
        )}
      </div>
    );
  }
);

WaveformPlayer.displayName = "WaveformPlayer";
export default WaveformPlayer;