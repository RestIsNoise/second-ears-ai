import { useState, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import { Play, Pause, RotateCcw, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import WaveformPlayer from "@/components/WaveformPlayer";
import type { WaveformPlayerHandle } from "@/components/WaveformPlayer";
import type { WaveformMarker } from "@/types/feedback";

const formatTime = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const ACCEPTED_FORMATS = ".mp3,.wav,.aiff,.aif";

interface Props {
  audioFileA: File;
  markersA?: WaveformMarker[];
  activeMarkerId?: string | null;
  onMarkerClick?: (marker: WaveformMarker) => void;
  onTimeUpdate?: (time: number) => void;
  onDurationReady?: (duration: number) => void;
  onAddNote?: (text: string, timestampSec: number) => void;
}

const ABCompare = forwardRef<WaveformPlayerHandle, Props>(({
  audioFileA,
  markersA = [],
  activeMarkerId,
  onMarkerClick,
  onTimeUpdate,
  onDurationReady,
  onAddNote,
}, ref) => {
  const playerARef = useRef<WaveformPlayerHandle>(null);
  const playerBRef = useRef<WaveformPlayerHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Forward ref to player A for external seekTo calls
  useImperativeHandle(ref, () => ({
    seekTo: (timeSec: number) => playerARef.current?.seekTo(timeSec),
    getCurrentTime: () => playerARef.current?.getCurrentTime() ?? 0,
    play: () => playerARef.current?.play(),
    pause: () => playerARef.current?.pause(),
    isPlaying: () => playerARef.current?.isPlaying() ?? false,
    setVolume: (v: number) => playerARef.current?.setVolume(v),
    getDuration: () => playerARef.current?.getDuration() ?? 0,
  }));

  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [crossfade, setCrossfade] = useState(50); // 0 = full A, 100 = full B
  const [syncPlaying, setSyncPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [durationA, setDurationA] = useState(0);
  const [durationB, setDurationB] = useState(0);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReferenceFile(file);
      setCrossfade(50);
    }
    // Reset input so same file can be re-selected
    e.target.value = "";
  }, []);

  const handleRemoveReference = useCallback(() => {
    setReferenceFile(null);
    setCrossfade(50);
    setSyncPlaying(false);
  }, []);

  const handleCrossfadeChange = useCallback((value: number[]) => {
    const v = value[0];
    setCrossfade(v);
    // Volume: A goes from 1→0 as slider goes 0→100
    const volA = 1 - v / 100;
    const volB = v / 100;
    playerARef.current?.setVolume(volA);
    playerBRef.current?.setVolume(volB);
  }, []);

  const handleSyncPlay = useCallback(() => {
    if (syncPlaying) {
      playerARef.current?.pause();
      playerBRef.current?.pause();
      setSyncPlaying(false);
    } else {
      // Sync positions — start both from A's current position
      const t = playerARef.current?.getCurrentTime() ?? 0;
      playerBRef.current?.seekTo(t);
      // Set volumes based on crossfade
      const volA = 1 - crossfade / 100;
      const volB = crossfade / 100;
      playerARef.current?.setVolume(volA);
      playerBRef.current?.setVolume(volB);
      playerARef.current?.play();
      playerBRef.current?.play();
      setSyncPlaying(true);
    }
  }, [syncPlaying, crossfade]);

  const handleSyncRestart = useCallback(() => {
    playerARef.current?.seekTo(0);
    playerBRef.current?.seekTo(0);
    if (syncPlaying) {
      playerARef.current?.play();
      playerBRef.current?.play();
    }
  }, [syncPlaying]);

  const handleTimeUpdateA = useCallback((time: number) => {
    setCurrentTime(time);
    onTimeUpdate?.(time);
  }, [onTimeUpdate]);

  const handleDurationReadyA = useCallback((d: number) => {
    setDurationA(d);
    onDurationReady?.(d);
  }, [onDurationReady]);

  const maxDuration = Math.max(durationA, durationB);

  // If no reference, show single player + upload button
  if (!referenceFile) {
    return (
      <div>
        <WaveformPlayer
          ref={playerARef}
          audioFile={audioFileA}
          markers={markersA}
          activeMarkerId={activeMarkerId}
          onMarkerClick={onMarkerClick}
          onTimeUpdate={handleTimeUpdateA}
          onDurationReady={handleDurationReadyA}
          onAddNote={onAddNote}
        />
        <div className="mt-3">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_FORMATS}
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <Upload className="w-3.5 h-3.5" />
            Add reference track
          </Button>
        </div>
      </div>
    );
  }

  // Dual waveform mode
  return (
    <div className="space-y-0">
      {/* Track A — analyzed track */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span
            className="inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold"
            style={{
              backgroundColor: "hsl(var(--foreground) / 0.08)",
              color: "hsl(var(--foreground) / 0.6)",
            }}
          >
            A
          </span>
          <span className="text-xs text-muted-foreground truncate">{audioFileA.name}</span>
        </div>
        <WaveformPlayer
          ref={playerARef}
          audioFile={audioFileA}
          markers={markersA}
          activeMarkerId={activeMarkerId}
          onMarkerClick={onMarkerClick}
          onTimeUpdate={handleTimeUpdateA}
          onDurationReady={handleDurationReadyA}
          onAddNote={onAddNote}
          hideControls
        />
      </div>

      {/* Crossfader */}
      <div className="py-3 px-1">
        <div className="flex items-center gap-3">
          <span
            className="text-[10px] font-bold tabular-nums shrink-0"
            style={{
              color: crossfade <= 50
                ? "hsl(var(--foreground) / 0.8)"
                : "hsl(var(--foreground) / 0.3)",
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            A
          </span>
          <div className="flex-1">
            <Slider
              value={[crossfade]}
              onValueChange={handleCrossfadeChange}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
          <span
            className="text-[10px] font-bold tabular-nums shrink-0"
            style={{
              color: crossfade >= 50
                ? "hsl(var(--foreground) / 0.8)"
                : "hsl(var(--foreground) / 0.3)",
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            B
          </span>
        </div>
      </div>

      {/* Track B — reference track */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span
            className="inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold"
            style={{
              backgroundColor: "hsl(var(--foreground) / 0.08)",
              color: "hsl(var(--foreground) / 0.6)",
            }}
          >
            B
          </span>
          <span className="text-xs text-muted-foreground truncate flex-1">{referenceFile.name}</span>
          <button
            onClick={handleRemoveReference}
            className="text-muted-foreground/40 hover:text-destructive transition-colors p-0.5"
            title="Remove reference track"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <WaveformPlayer
          ref={playerBRef}
          audioFile={referenceFile}
          onDurationReady={(d) => setDurationB(d)}
          hideControls
        />
      </div>

      {/* Synced transport controls */}
      <div className="flex items-center gap-3 pt-3">
        <button
          onClick={handleSyncPlay}
          className="w-8 h-8 rounded-full border border-border-subtle flex items-center justify-center text-foreground hover:bg-secondary/60 transition-colors"
        >
          {syncPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
        </button>
        <button
          onClick={handleSyncRestart}
          className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
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
          {formatTime(maxDuration)}
        </span>

        {/* Crossfade position indicator */}
        <span
          className="text-muted-foreground/40 tabular-nums ml-auto"
          style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10 }}
        >
          {crossfade <= 25 ? "A" : crossfade >= 75 ? "B" : "A+B"}
        </span>
      </div>
    </div>
  );
});

ABCompare.displayName = "ABCompare";
export default ABCompare;
