import { useRef, useEffect, useState, useCallback } from "react";
import WaveSurfer from "wavesurfer.js";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Marker {
  time: number;
  label: string;
}

interface Props {
  audioUrl: string;
  markers?: Marker[];
  onMarkerClick?: (marker: Marker) => void;
}

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const WaveformPlayer = ({ audioUrl, markers = [], onMarkerClick }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "hsl(0 0% 78%)",
      progressColor: "hsl(0 0% 12%)",
      cursorColor: "hsl(0 0% 12%)",
      cursorWidth: 1,
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      height: 64,
      normalize: true,
    });

    ws.load(audioUrl);

    ws.on("ready", () => setDuration(ws.getDuration()));
    ws.on("audioprocess", () => setCurrentTime(ws.getCurrentTime()));
    ws.on("seeking", () => setCurrentTime(ws.getCurrentTime()));
    ws.on("play", () => setPlaying(true));
    ws.on("pause", () => setPlaying(false));
    ws.on("finish", () => setPlaying(false));

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
    }
    onMarkerClick?.(marker);
  };

  return (
    <div className="space-y-4">
      {/* Waveform */}
      <div className="rounded-xl border border-border-subtle bg-secondary/20 p-6">
        <div ref={containerRef} className="w-full" />

        {/* Markers */}
        {markers.length > 0 && duration > 0 && (
          <div className="relative w-full h-6 mt-2">
            {markers.map((m, i) => (
              <button
                key={i}
                onClick={() => handleMarkerClick(m)}
                className="absolute -translate-x-1/2 top-0 flex flex-col items-center group"
                style={{ left: `${(m.time / duration) * 100}%` }}
                title={m.label}
              >
                <span className="w-1 h-3 bg-foreground/40 rounded-full group-hover:bg-foreground transition-colors" />
                <span className="font-mono-brand text-[9px] text-muted-foreground group-hover:text-foreground mt-0.5 whitespace-nowrap transition-colors">
                  {formatTime(m.time)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={togglePlay} className="h-10 w-10">
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={restart} className="h-9 w-9">
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
