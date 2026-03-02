import { useRef, useEffect, useState, useCallback } from "react";
import WaveSurfer from "wavesurfer.js";
import { Play, Pause, RotateCcw, AlertCircle } from "lucide-react";

interface Marker {
  time: number;
  label: string;
}

interface Props {
  audioFile: File;
  markers?: Marker[];
}

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const WaveformPlayer = ({ audioFile, markers = [] }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeMarker, setActiveMarker] = useState<Marker | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
      const msg = `Waveform source is not File (got ${typeof audioFile}: ${String(audioFile).slice(0, 40)})`;
      console.error("[WaveformPlayer]", msg);
      setError(msg);
      setLoading(false);
      return;
    }

    console.log("[WaveformPlayer]", {
      isFile: audioFile instanceof File,
      sourceType: typeof audioFile,
      fileName: audioFile.name,
      fileType: audioFile.type,
      fileSize: audioFile.size,
    });

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

    ws.loadBlob(audioFile);
    console.log("[WaveformPlayer] loadBlob called — no network fetch");

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

  const handleMarkerClick = (marker: Marker) => {
    if (wsRef.current && duration > 0) {
      wsRef.current.seekTo(marker.time / duration);
      wsRef.current.play();
      setActiveMarker(marker);
    }
  };

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

      {/* Waveform container — canvas only, no text */}
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

        {/* Marker lines — no text inside canvas */}
        {markers.length > 0 && duration > 0 && (
          <div className="absolute inset-0 pointer-events-none z-[2]">
            {markers.map((m, i) => (
              <button
                key={i}
                onClick={() => handleMarkerClick(m)}
                className="absolute top-0 bottom-0 pointer-events-auto"
                style={{ left: `${(m.time / duration) * 100}%` }}
                title={`${formatTime(m.time)} — ${m.label}`}
              >
                <span className="absolute top-0 bottom-0 w-px bg-foreground/25 hover:bg-foreground/60 transition-colors" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Active marker — outside waveform */}
      {activeMarker && (
        <div className="rounded-lg border border-border-subtle bg-secondary/30 px-4 py-3 animate-fade-up">
          <p className="font-mono-brand text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
            {formatTime(activeMarker.time)}
          </p>
          <p className="text-sm text-foreground">{activeMarker.label}</p>
        </div>
      )}

      {/* Controls — CSS grid */}
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
};

export default WaveformPlayer;
