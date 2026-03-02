import { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import WaveSurfer from "wavesurfer.js";
import { Play, Pause, RotateCcw, AlertCircle } from "lucide-react";
import { createPortal } from "react-dom";
import type { WaveformMarker } from "@/types/feedback";

export interface WaveformPlayerHandle {
  seekTo: (timeSec: number) => void;
  getCurrentTime: () => number;
}

interface Props {
  audioFile: File;
  markers?: WaveformMarker[];
  activeMarkerId?: string | null;
  onMarkerClick?: (marker: WaveformMarker) => void;
  onTimeUpdate?: (time: number) => void;
  onDurationReady?: (duration: number) => void;
}

const formatTime = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

/** Portal tooltip positioned relative to anchor element */
const MarkerTooltip = ({
  anchorEl,
  time,
  title,
  summary,
}: {
  anchorEl: HTMLElement;
  time: string;
  title: string;
  summary?: string;
}) => {
  const rect = anchorEl.getBoundingClientRect();
  return (
    <div
      className="pointer-events-none fixed"
      style={{
        top: rect.bottom + 6,
        left: rect.left + rect.width / 2,
        transform: "translateX(-50%)",
        zIndex: 9999,
        maxWidth: 260,
      }}
    >
      <div className="rounded-md border border-border bg-background px-3 py-2 shadow-sm">
        <div className="flex items-baseline gap-2">
          <span
            className="text-muted-foreground tabular-nums shrink-0"
            style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}
          >
            {time}
          </span>
          <span className="text-foreground text-xs font-medium leading-snug">{title}</span>
        </div>
        {summary && (
          <p className="text-muted-foreground text-[11px] leading-relaxed mt-1">{summary}</p>
        )}
      </div>
    </div>
  );
};



const WaveformPlayer = forwardRef<WaveformPlayerHandle, Props>(
  ({ audioFile, markers = [], activeMarkerId, onMarkerClick, onTimeUpdate, onDurationReady }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const wsRef = useRef<WaveSurfer | null>(null);
    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);
    const markerElRefs = useRef<Map<string, HTMLElement>>(new Map());

    useImperativeHandle(ref, () => ({
      seekTo: (timeSec: number) => {
        if (wsRef.current && duration > 0) {
          wsRef.current.seekTo(timeSec / duration);
        }
      },
      getCurrentTime: () => currentTime,
    }));

    useEffect(() => {
      if (wsRef.current) {
        wsRef.current.destroy();
        wsRef.current = null;
      }
      setError(null);
      setLoading(true);
      setDuration(0);
      setCurrentTime(0);
      setPlaying(false);

      if (!containerRef.current || !audioFile) return;

      if (!(audioFile instanceof File)) {
        const msg = `Waveform source is not File (got ${typeof audioFile})`;
        setError(msg);
        setLoading(false);
        return;
      }

      const ws = WaveSurfer.create({
        container: containerRef.current,
        waveColor: "#b8b8b8",
        progressColor: "#111111",
        cursorColor: "transparent",
        cursorWidth: 0,
        barWidth: 1,
        barGap: 1,
        barRadius: 0,
        height: 84,
        normalize: true,
        interact: true,
      });

      const onResize = () => ws.setOptions({ width: containerRef.current?.clientWidth });
      window.addEventListener("resize", onResize);

      ws.on("ready", () => {
        const d = ws.getDuration();
        setDuration(d);
        setLoading(false);
        onDurationReady?.(d);
      });

      ws.on("audioprocess", () => {
        const t = ws.getCurrentTime();
        setCurrentTime(t);
        onTimeUpdate?.(t);
      });
      ws.on("seeking", () => {
        const t = ws.getCurrentTime();
        setCurrentTime(t);
        onTimeUpdate?.(t);
      });
      ws.on("play", () => setPlaying(true));
      ws.on("pause", () => setPlaying(false));
      ws.on("finish", () => setPlaying(false));
      ws.on("error", (err) => {
        const msg = typeof err === "string" ? err : (err as any)?.message || String(err);
        setError(msg);
        setLoading(false);
      });

      ws.loadBlob(audioFile);
      wsRef.current = ws;

      return () => {
        window.removeEventListener("resize", onResize);
        ws.destroy();
        wsRef.current = null;
      };
    }, [audioFile]);

    const togglePlay = useCallback(() => wsRef.current?.playPause(), []);
    const restart = useCallback(() => {
      wsRef.current?.seekTo(0);
      wsRef.current?.play();
    }, []);

    return (
      <div className="space-y-3">
        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-destructive">Waveform failed to load</p>
              <p className="text-xs text-muted-foreground mt-1 break-all">{error}</p>
            </div>
          </div>
        )}

        {/* Waveform container */}
        <div
          className="relative overflow-hidden rounded-xl border border-border-subtle bg-background"
          style={{ height: 96, padding: 0 }}
        >
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

          {/* Markers as pin icons */}
          {markers.length > 0 && duration > 0 && (
            <div className="absolute inset-0 pointer-events-none z-[2]">
              {markers.slice(0, 8).map((m) => {
                const isActive = activeMarkerId === m.id;
                const isHovered = hoveredMarker === m.id;
                const leftPct = `${(m.time / duration) * 100}%`;



                // Truncate title to max 8 words
                const titleWords = m.label.split(/\s+/);
                const shortTitle = titleWords.length > 8 ? titleWords.slice(0, 8).join(" ") + "…" : m.label;
                const summary = m.label.length > 80 ? m.label.slice(0, 80) : m.label;

                return (
                  <div key={m.id} className="absolute pointer-events-auto" style={{ left: leftPct, top: 0, transform: "translateX(-50%)" }}>
                    <button
                      ref={(el) => {
                        if (el) markerElRefs.current.set(m.id, el);
                        else markerElRefs.current.delete(m.id);
                      }}
                      onClick={() => onMarkerClick?.(m)}
                      onMouseEnter={() => setHoveredMarker(m.id)}
                      onMouseLeave={() => setHoveredMarker(null)}
                      className={`flex items-center justify-center w-[18px] h-[18px] rounded-full transition-all duration-150 ${
                        isActive ? "scale-125 ring-2 ring-foreground/20" : isHovered ? "scale-110 ring-2 ring-foreground/15" : ""
                      }`}
                      style={{ marginTop: 2 }}
                      aria-label={`${formatTime(m.time)} — ${m.label}`}
                    >
                      {/* Diamond cue marker */}
                      <svg width="10" height="10" viewBox="0 0 10 10" className="transition-colors duration-150">
                        <rect
                          x="5" y="0" width="5" height="5"
                          transform="rotate(45 5 5)"
                          className={isActive || isHovered ? "fill-foreground" : "fill-muted-foreground/40"}
                        />
                      </svg>
                    </button>

                    {/* Portal tooltip */}
                    {isHovered && markerElRefs.current.get(m.id) && createPortal(
                      <MarkerTooltip
                        anchorEl={markerElRefs.current.get(m.id)!}
                        time={formatTime(m.time)}
                        title={shortTitle}
                        summary={shortTitle !== summary ? summary : undefined}
                      />,
                      document.body
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Controls */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "24px 24px auto",
            gap: 20,
            alignItems: "center",
          }}
        >
          <button
            onClick={togglePlay}
            disabled={!!error || loading}
            className="w-6 h-6 flex items-center justify-center text-foreground disabled:text-muted-foreground/40"
          >
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={restart}
            disabled={!!error || loading}
            className="w-6 h-6 flex items-center justify-center text-foreground disabled:text-muted-foreground/40"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <span
            className="text-muted-foreground tabular-nums leading-none"
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 16,
              letterSpacing: "0.01em",
            }}
          >
            {formatTime(currentTime)}&nbsp;/&nbsp;{formatTime(duration)}
          </span>
        </div>
      </div>
    );
  }
);

WaveformPlayer.displayName = "WaveformPlayer";
export default WaveformPlayer;
