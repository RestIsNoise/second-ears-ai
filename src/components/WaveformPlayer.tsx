import { useRef, useEffect, useState, useCallback } from "react";
import WaveSurfer from "wavesurfer.js";
import { Play, Pause, RotateCcw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Marker {
  time: number;
  label: string;
}

interface Props {
  audioUrl: string;
  markers?: Marker[];
}

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const isValidUrl = (url: string) =>
  typeof url === "string" && /^https?:\/\/.+/i.test(url);

const WaveformPlayer = ({ audioUrl, markers = [] }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeMarker, setActiveMarker] = useState<Marker | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cleanup previous instance
    if (wsRef.current) {
      wsRef.current.destroy();
      wsRef.current = null;
    }

    setError(null);
    setLoading(true);
    setDuration(0);
    setCurrentTime(0);
    setPlaying(false);

    if (!containerRef.current) return;

    if (!isValidUrl(audioUrl)) {
      console.error("[WaveformPlayer] Invalid audioUrl:", audioUrl);
      setError(`Invalid audio URL: ${audioUrl}`);
      setLoading(false);
      return;
    }

    console.log("[WaveformPlayer] Initializing with URL:", audioUrl);

    // Create a media element with CORS enabled
    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audio.preload = "metadata";
    audio.src = audioUrl;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "hsl(0 0% 72%)",
      progressColor: "hsl(0 0% 5%)",
      cursorColor: "hsl(0 0% 5%)",
      cursorWidth: 1,
      barWidth: 2,
      barGap: 2,
      barRadius: 1,
      height: 72,
      normalize: true,
      interact: true,
      media: audio,
    });

    ws.on("ready", () => {
      const dur = ws.getDuration();
      console.log("[WaveformPlayer] Ready — duration:", dur);
      setDuration(dur);
      setLoading(false);
    });

    ws.on("audioprocess", () => setCurrentTime(ws.getCurrentTime()));
    ws.on("seeking", () => setCurrentTime(ws.getCurrentTime()));
    ws.on("play", () => setPlaying(true));
    ws.on("pause", () => setPlaying(false));
    ws.on("finish", () => setPlaying(false));

    ws.on("error", (err) => {
      const msg = typeof err === "string" ? err : (err as any)?.message || String(err);
      console.error("[WaveformPlayer] Error:", msg);
      setError(msg);
      setLoading(false);
    });

    wsRef.current = ws;

    return () => {
      ws.destroy();
      wsRef.current = null;
    };
  }, [audioUrl]);

  const togglePlay = useCallback(() => wsRef.current?.playPause(), []);
  const restart = useCallback(() => {
    wsRef.current?.seekTo(0);
    wsRef.current?.play();
  }, []);

  const handleMarkerClick = (marker: Marker) => {
    if (wsRef.current && duration > 0) {
      wsRef.current.seekTo(marker.time / duration);
      wsRef.current.play();
      setActiveMarker(marker);
    }
  };

  return (
    <div className="space-y-4">
      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-destructive">Waveform failed to load</p>
            <p className="text-xs text-muted-foreground mt-1 break-all">{error}</p>
          </div>
        </div>
      )}

      {/* Waveform + markers overlay */}
      <div className="rounded-xl border border-border-subtle bg-background p-6">
        {loading && !error && (
          <p className="font-mono-brand text-xs text-muted-foreground tracking-wider animate-pulse mb-2">
            Loading waveform…
          </p>
        )}
        <div className="relative">
          <div ref={containerRef} className="w-full" />

          {/* Marker lines overlaid on waveform */}
          {markers.length > 0 && duration > 0 && (
            <div className="absolute inset-0 pointer-events-none">
              {markers.map((m, i) => (
                <button
                  key={i}
                  onClick={() => handleMarkerClick(m)}
                  className="absolute top-0 bottom-0 pointer-events-auto group"
                  style={{ left: `${(m.time / duration) * 100}%` }}
                  title={m.label}
                >
                  <span className="absolute top-0 bottom-0 w-px bg-foreground/40 group-hover:bg-foreground transition-colors" />
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono-brand text-[9px] text-muted-foreground group-hover:text-foreground transition-colors bg-background px-1">
                    {formatTime(m.time)} — {m.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active marker comment */}
      {activeMarker && (
        <div className="rounded-lg border border-border-subtle bg-secondary/30 px-4 py-3 animate-fade-up">
          <p className="font-mono-brand text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
            {formatTime(activeMarker.time)}
          </p>
          <p className="text-sm text-foreground">{activeMarker.label}</p>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={togglePlay} className="h-10 w-10" disabled={!!error || loading}>
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={restart} className="h-9 w-9" disabled={!!error || loading}>
          <RotateCcw className="w-3.5 h-3.5" />
        </Button>
        <span className="font-mono-brand text-xs text-muted-foreground tracking-wider">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  );
};

export default WaveformPlayer;
