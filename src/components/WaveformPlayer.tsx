import { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import WaveSurfer from "wavesurfer.js";
import { Play, Pause, RotateCcw, AlertCircle } from "lucide-react";
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

const WaveformPlayer = forwardRef<WaveformPlayerHandle, Props>(
  ({ audioFile, markers = [], activeMarkerId, onMarkerClick, onTimeUpdate, onDurationReady }, ref) => {
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
        waveColor: "#d0d0d0",
        progressColor: "#1a1a1a",
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

    const handleMouseLeave = useCallback(() => {
      setHoverX(null);
    }, []);

    return (
      <div className="rounded-xl border border-border-subtle bg-background p-4 space-y-3">
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-destructive">Waveform failed to load</p>
              <p className="text-xs text-muted-foreground mt-1 break-all">{error}</p>
            </div>
          </div>
        )}

        {/* Waveform container */}
        <div
          ref={wrapperRef}
          className="relative overflow-visible"
          style={{ height: 96 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
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

          {/* Hover cursor line + tooltip */}
          {hoverX !== null && duration > 0 && (
            <>
              <div
                className="absolute top-0 bottom-0 pointer-events-none z-[3]"
                style={{
                  left: hoverX,
                  width: "0.5px",
                  backgroundColor: "hsl(var(--foreground) / 0.25)",
                }}
              />
              <div
                className="absolute pointer-events-none z-[5]"
                style={{
                  left: hoverX,
                  top: -24,
                  transform: "translateX(-50%)",
                }}
              >
                <span
                  className="text-muted-foreground tabular-nums whitespace-nowrap"
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 9,
                    lineHeight: 1,
                    letterSpacing: "0.02em",
                  }}
                >
                  {formatTime(hoverTime)}
                </span>
              </div>
            </>
          )}

          {/* Triangle markers */}
          {markers.length > 0 && duration > 0 && (
            <div className="absolute inset-0 pointer-events-none z-[2]" style={{ overflow: "visible" }}>
              {markers.slice(0, 8).map((m) => {
                const isActive = activeMarkerId === m.id;
                const leftPct = `${(m.time / duration) * 100}%`;

                return (
                  <div
                    key={m.id}
                    className="absolute pointer-events-auto flex flex-col items-center"
                    style={{ left: leftPct, top: 0, transform: "translateX(-50%)" }}
                  >
                    <button
                      onClick={() => onMarkerClick?.(m)}
                      className="group flex flex-col items-center"
                      aria-label={`${formatTime(m.time)} — ${m.label}`}
                    >
                      <svg
                        width={isActive ? "12" : "10"}
                        height={isActive ? "10" : "8"}
                        viewBox={isActive ? "0 0 12 10" : "0 0 10 8"}
                        className="transition-all duration-150"
                      >
                        <polygon
                          points={isActive ? "6,0 12,10 0,10" : "5,0 10,8 0,8"}
                          className={
                            isActive
                              ? "fill-foreground"
                              : "fill-muted-foreground/[0.55] group-hover:fill-foreground/80"
                          }
                        />
                      </svg>
                      <span
                        className={`mt-0.5 tabular-nums whitespace-nowrap transition-colors duration-150 ${
                          isActive
                            ? "text-foreground"
                            : "text-muted-foreground/[0.55] group-hover:text-foreground/80"
                        }`}
                        style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: 9,
                          lineHeight: 1,
                        }}
                      >
                        {formatTime(m.time)}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Controls */}
        <div
          className="flex items-center"
          style={{ gap: 16 }}
        >
          <button
            onClick={togglePlay}
            disabled={!!error || loading}
            className="w-6 h-6 flex items-center justify-center text-foreground disabled:text-muted-foreground/40 transition-colors"
          >
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={restart}
            disabled={!!error || loading}
            className="w-6 h-6 flex items-center justify-center text-foreground disabled:text-muted-foreground/40 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <span
            className="text-muted-foreground tabular-nums leading-none"
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 13,
              letterSpacing: "-0.01em",
            }}
          >
            {formatTime(currentTime)}<span className="text-muted-foreground/40">&nbsp;/&nbsp;</span>{formatTime(duration)}
          </span>
        </div>
      </div>
    );
  }
);

WaveformPlayer.displayName = "WaveformPlayer";
export default WaveformPlayer;
