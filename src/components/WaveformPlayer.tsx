import { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef, useMemo } from "react";
import WaveSurfer from "wavesurfer.js";
import { Play, Pause, RotateCcw, AlertCircle } from "lucide-react";
import WaveformMarkers, { MARKER_ZONE_HEIGHT } from "@/components/WaveformMarkers";
import FrequencyEnergyBar from "@/components/FrequencyEnergyBar";
import type { WaveformMarker } from "@/types/feedback";
import type { FrequencyData } from "@/lib/parseFrequencyData";

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
  onAddToDo?: (text: string, timestampSec: number) => void;
  onEditNote?: (markerId: string) => void;
  hideControls?: boolean;
  label?: string;
  waveColor?: string;
  progressColor?: string;
  outlineMode?: boolean;
  deckVariant?: "a" | "b";
  containerStyle?: React.CSSProperties;
  frequencyData?: FrequencyData | null;
}

const MONO = "'JetBrains Mono', 'IBM Plex Mono', 'Courier New', monospace";

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

/* ── Deck colors — sober palette ── */
const DECK_COLORS = {
  a: {
    wave: "rgba(160, 155, 145, 0.28)",
    progress: "#8A8580",
    accent: "#9A9590",
    glow: "rgba(140, 135, 125, 0.10)",
    dim: "rgba(160, 155, 145, 0.10)",
  },
  b: {
    wave: "rgba(90, 145, 155, 0.28)",
    progress: "#6A9EA8",
    accent: "#78A8B2",
    glow: "rgba(90, 145, 155, 0.12)",
    dim: "rgba(90, 145, 155, 0.10)",
  },
};

const SHELL_BG = "#191919";
const LANE_BG = "#111113";
const DIVIDER = "rgba(255,255,255,0.07)";
const BEVEL_LIGHT = "rgba(255,255,255,0.04)";
const BEVEL_DARK = "rgba(0,0,0,0.4)";
const HEADER_BG = "#161618";

/* ── Time ruler helpers ── */
const RULER_HEIGHT = 20;
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
  accentColor: string;
}

const TimeRuler = ({
  duration, containerWidth, currentTime, playing,
  hoverX, hoverTime, markers, snappedMarkerId, accentColor,
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
    <div className="relative select-none" style={{ height: RULER_HEIGHT, width: "100%", backgroundColor: "rgba(0,0,0,0.35)" }}>
      {/* Top edge bevel */}
      <div className="absolute top-0 left-0 right-0" style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.03)" }} />
      <div className="absolute top-0 left-0 right-0" style={{ height: RULER_HEIGHT }}>
        {/* Bottom border — double machined */}
        <div className="absolute bottom-0 left-0 right-0" style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.06)" }} />
        <div className="absolute bottom-[-1px] left-0 right-0" style={{ height: "1px", backgroundColor: "rgba(0,0,0,0.3)" }} />

        {ticks.map(({ time, isMajor }) => {
          const leftPct = (time / duration) * 100;
          return (
            <div key={time} className="absolute bottom-0" style={{ left: `${leftPct}%`, transform: "translateX(-0.5px)" }}>
              <div
                style={{
                  width: isMajor ? "1px" : "0.5px",
                  height: isMajor ? 11 : 5,
                  backgroundColor: isMajor ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.08)",
                }}
              />
              {isMajor && (
                <span
                  className="absolute whitespace-nowrap tabular-nums"
                  style={{
                    fontFamily: MONO,
                    fontSize: 7.5,
                    lineHeight: 1,
                    letterSpacing: "0.06em",
                    color: "rgba(255,255,255,0.38)",
                    fontWeight: 600,
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

        {/* Playhead tick — stronger */}
        <div
          className="absolute bottom-0 z-[4] pointer-events-none"
          style={{
            left: `${playheadPct}%`,
            transform: "translateX(-0.5px)",
            transition: playing ? "none" : "left 0.1s ease-out",
          }}
        >
          <div style={{ width: "2px", height: 14, backgroundColor: accentColor, boxShadow: `0 0 6px ${accentColor}` }} />
        </div>

        {/* Hover tooltip */}
        {hoverX !== null && (
          <div className="absolute pointer-events-none z-[6]" style={{ left: hoverX, top: -2, transform: "translateX(-50%)" }}>
            <span
              className="px-1.5 py-0.5 tabular-nums whitespace-nowrap"
              style={{
                fontFamily: MONO,
                fontSize: 8.5,
                lineHeight: 1,
                letterSpacing: "0.03em",
                color: snappedMarker ? "#ffffff" : "rgba(255,255,255,0.65)",
                backgroundColor: "rgba(0,0,0,0.92)",
                border: `0.5px solid rgba(255,255,255,${snappedMarker ? "0.2" : "0.06"})`,
                fontWeight: snappedMarker ? 700 : 500,
                borderRadius: 2,
              }}
            >
              {snappedMarker ? `▸ ${formatTimePrecise(snappedMarker.time)}` : formatTimePrecise(hoverTime)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Main component ── */

const WaveformPlayer = forwardRef<WaveformPlayerHandle, Props>(
  ({ audioFile, markers = [], activeMarkerId, onMarkerClick, onTimeUpdate, onDurationReady, onAddNote, onAddToDo, onEditNote, hideControls, label, waveColor, progressColor, outlineMode, deckVariant = "a", containerStyle, frequencyData }, ref) => {
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

    const colors = DECK_COLORS[deckVariant];
    const resolvedWaveColor = waveColor || colors.wave;
    const resolvedProgressColor = progressColor || colors.progress;

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
        waveColor: resolvedWaveColor,
        progressColor: resolvedProgressColor,
        cursorColor: "transparent",
        cursorWidth: 0,
        barWidth: 1,
        barGap: 1,
        barRadius: 0,
        height: 80,
        normalize: true,
        interact: true,
      };

      if (outlineMode) {
        const outlineColor = resolvedWaveColor;
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
    }, [audioFile, resolvedWaveColor, resolvedProgressColor]);

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
    const WAVEFORM_HEIGHT = 94;

    const deckLabel = deckVariant === "a" ? "A" : "B";

    return (
      <div
        className="overflow-hidden deck-shell"
        style={{
          backgroundColor: SHELL_BG,
          borderRadius: 0,
          border: "none",
          ...containerStyle,
        }}
      >
        {/* Label bar — track name + deck badge */}
        {label && (
          <div
            className="flex items-center gap-2 px-3 py-1.5"
            style={{
              borderBottom: `1px solid ${DIVIDER}`,
              background: `linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)`,
            }}
          >
            {/* Deck badge */}
            <span
              className="shrink-0 flex items-center justify-center"
              style={{
                width: 18,
                height: 18,
                borderRadius: 3,
                backgroundColor: colors.accent,
                fontFamily: MONO,
                fontSize: 9,
                fontWeight: 700,
                color: "#000000",
                letterSpacing: "0.02em",
              }}
            >
              {deckLabel}
            </span>
            <div className="min-w-0 flex-1">
              <span
                className="uppercase tracking-[0.06em] truncate block"
                style={{
                  fontFamily: MONO,
                  fontSize: 10,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.75)",
                }}
              >
                {label}
              </span>
              {duration > 0 && (
                <span
                  className="tabular-nums block"
                  style={{
                    fontFamily: MONO,
                    fontSize: 8,
                    color: "rgba(255,255,255,0.30)",
                    letterSpacing: "0.04em",
                    marginTop: 1,
                  }}
                >
                  {formatTime(duration)} · {audioFile?.type?.split("/")?.[1]?.toUpperCase() || "AUDIO"}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Waveform lane */}
        <div style={{ backgroundColor: LANE_BG, padding: "0 10px" }}>
          {error && (
            <div
              className="rounded flex items-start gap-3 m-2 p-2.5"
              style={{
                backgroundColor: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.15)",
              }}
            >
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "#ef4444" }} />
              <div>
                <p className="text-xs font-medium" style={{ color: "#ef4444" }}>Waveform failed</p>
                <p className="text-[10px] mt-0.5 break-all" style={{ color: "rgba(255,255,255,0.35)" }}>{error}</p>
              </div>
            </div>
          )}

          {/* Ruler + waveform + markers */}
          <div
            ref={wrapperRef}
            className="relative overflow-visible cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* Time ruler */}
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
                accentColor={colors.accent}
              />
            )}

            {/* Waveform container */}
            <div className="relative" style={{ height: WAVEFORM_HEIGHT, marginTop: 1 }}>
              {/* Deck glow removed — clean edge */}

              {loading && !error && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: colors.accent, opacity: 0.6 }} />
                </div>
              )}
              <div
                ref={containerRef}
                className="absolute left-0 right-0"
                style={{ top: 4, bottom: 4 }}
              />

              {/* Markers */}
              {duration > 0 && containerWidth > 0 && (markers.length > 0 || onAddNote || onAddToDo) && (
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
                    onAddToDo={onAddToDo}
                    onEditNote={onEditNote}
                  />
                </div>
              )}

              {/* Playhead — bright accent */}
              {duration > 0 && (
                <div
                  className="absolute top-0 bottom-0 pointer-events-none z-[3]"
                  style={{
                    left: `${playheadPct}%`,
                    width: "2px",
                    backgroundColor: "#ffffff",
                    transition: playing ? "none" : "left 0.1s ease-out",
                    boxShadow: `0 0 8px rgba(255,255,255,0.5), 0 0 3px ${colors.accent}`,
                  }}
                />
              )}

              {/* Hover cursor */}
              {hoverX !== null && duration > 0 && (
                <div
                  className="absolute top-0 bottom-0 pointer-events-none z-[3]"
                  style={{
                    left: snappedMarkerId_hover
                      ? `${(markers.find(m => m.id === snappedMarkerId_hover)!.time / duration) * 100}%`
                      : hoverX,
                    width: snappedMarkerId_hover ? "1px" : "0.5px",
                    backgroundColor: snappedMarkerId_hover
                      ? "rgba(255,255,255,0.35)"
                      : "rgba(255,255,255,0.15)",
                    transition: "width 0.1s, background-color 0.1s",
                  }}
                />
              )}
            </div>
          </div>

          {/* Frequency energy bars */}
          {frequencyData && (
            <FrequencyEnergyBar
              bands={[
                { label: "SUB", value: frequencyData.sub },
                { label: "LOW", value: frequencyData.low },
                { label: "MID", value: frequencyData.mid },
                { label: "HIGH", value: frequencyData.high },
              ]}
              color={colors.accent}
              dimColor={colors.dim}
            />
          )}
        </div>

        {/* Controls row — industrial cluster */}
        {!hideControls && (
          <div
            className="flex items-center gap-3 px-3 py-2"
            style={{
              borderTop: `1px solid ${DIVIDER}`,
              background: `linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.15) 100%)`,
            }}
          >
            {/* Transport cluster */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={togglePlay}
                disabled={!!error || loading}
                className="deck-btn deck-btn-primary flex items-center justify-center transition-all duration-100 disabled:opacity-30"
                style={{
                  width: 34,
                  height: 30,
                  borderRadius: 4,
                  backgroundColor: playing ? colors.accent : "#1E1E1E",
                  border: `1px solid ${playing ? colors.accent : "rgba(255,255,255,0.12)"}`,
                  color: playing ? "#000000" : "rgba(255,255,255,0.85)",
                  boxShadow: playing
                    ? `0 0 8px ${colors.glow}, inset 0 1px 0 rgba(255,255,255,0.15)`
                    : `inset 0 1px 0 ${BEVEL_LIGHT}, inset 0 -1px 0 ${BEVEL_DARK}`,
                }}
              >
                {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
              </button>
              <button
                onClick={restart}
                disabled={!!error || loading}
                className="deck-btn flex items-center justify-center transition-all duration-100 disabled:opacity-30"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 4,
                  backgroundColor: "#1A1A1A",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.50)",
                  boxShadow: `inset 0 1px 0 ${BEVEL_LIGHT}`,
                }}
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>

            {/* Time readout */}
            <span
              className="tabular-nums leading-none"
              style={{
                fontFamily: MONO,
                fontSize: 14,
                letterSpacing: "0.02em",
                color: "rgba(255,255,255,0.85)",
                fontWeight: 500,
              }}
            >
              {formatTime(currentTime)}
              <span style={{ color: "rgba(255,255,255,0.20)" }}> / </span>
              <span style={{ color: "rgba(255,255,255,0.40)" }}>{formatTime(duration)}</span>
            </span>
          </div>
        )}
      </div>
    );
  }
);

WaveformPlayer.displayName = "WaveformPlayer";
export default WaveformPlayer;
