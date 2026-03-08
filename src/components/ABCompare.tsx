import { useState, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import { Play, Pause, RotateCcw, X, RefreshCw, Headphones, Volume2, VolumeX, Repeat, AudioWaveform } from "lucide-react";
import WaveformPlayer from "@/components/WaveformPlayer";
import type { WaveformPlayerHandle } from "@/components/WaveformPlayer";
import type { WaveformMarker } from "@/types/feedback";

const MONO = "'JetBrains Mono', 'IBM Plex Mono', 'Courier New', monospace";
const DARK_BG = "#252525";
const DARKER_BG = "#202020";
const ACCEPTED_FORMATS = ".mp3,.wav,.aiff,.aif";

const formatTime = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

interface Props {
  audioFileA: File;
  audioFileB?: File | null;
  refTrackName?: string;
  markersA?: WaveformMarker[];
  activeMarkerId?: string | null;
  onMarkerClick?: (marker: WaveformMarker) => void;
  onTimeUpdate?: (time: number) => void;
  onDurationReady?: (duration: number) => void;
  onAddNote?: (text: string, timestampSec: number) => void;
  onAddToDo?: (text: string, timestampSec: number) => void;
  onEditNote?: (markerId: string) => void;
}

const ABCompare = forwardRef<WaveformPlayerHandle, Props>(({
  audioFileA,
  audioFileB,
  refTrackName,
  markersA = [],
  activeMarkerId,
  onMarkerClick,
  onTimeUpdate,
  onDurationReady,
  onAddNote,
  onAddToDo,
  onEditNote,
}, ref) => {
  const playerARef = useRef<WaveformPlayerHandle>(null);
  const playerBRef = useRef<WaveformPlayerHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    seekTo: (timeSec: number) => playerARef.current?.seekTo(timeSec),
    getCurrentTime: () => playerARef.current?.getCurrentTime() ?? 0,
    play: () => playerARef.current?.play(),
    pause: () => playerARef.current?.pause(),
    isPlaying: () => playerARef.current?.isPlaying() ?? false,
    setVolume: (v: number) => playerARef.current?.setVolume(v),
    getDuration: () => playerARef.current?.getDuration() ?? 0,
  }));

  const [localRefFile, setLocalRefFile] = useState<File | null>(null);
  const [crossfade, setCrossfade] = useState(50);
  const [syncPlaying, setSyncPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [durationA, setDurationA] = useState(0);
  const [durationB, setDurationB] = useState(0);

  // Use external ref file or local one
  const activeRefFile = audioFileB || localRefFile;
  const activeRefName = refTrackName || localRefFile?.name || "";

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setLocalRefFile(file); setCrossfade(50); }
    e.target.value = "";
  }, []);

  const handleRemoveReference = useCallback(() => {
    setLocalRefFile(null);
    setCrossfade(50);
    setSyncPlaying(false);
  }, []);

  const handleCrossfadeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setCrossfade(v);
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
      const t = playerARef.current?.getCurrentTime() ?? 0;
      playerBRef.current?.seekTo(t);
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

  // Single deck mode — no reference
  if (!activeRefFile) {
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
          onAddToDo={onAddToDo}
          onEditNote={onEditNote}
          label={audioFileA.name}
          deckVariant="a"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_FORMATS}
          onChange={handleFileSelect}
          style={{ position: "absolute", top: -9999, left: -9999 }}
        />
      </div>
    );
  }

  // Dual deck mode
  return (
    <div className="space-y-0">
      <input
        id="ref-track-replace"
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_FORMATS}
        onChange={handleFileSelect}
        style={{ position: "absolute", top: -9999, left: -9999 }}
      />

      {/* Deck A */}
      <WaveformPlayer
        ref={playerARef}
        audioFile={audioFileA}
        markers={markersA}
        activeMarkerId={activeMarkerId}
        onMarkerClick={onMarkerClick}
        onTimeUpdate={handleTimeUpdateA}
        onDurationReady={handleDurationReadyA}
        onAddNote={onAddNote}
        onAddToDo={onAddToDo}
        onEditNote={onEditNote}
        hideControls
        label={audioFileA.name}
        deckVariant="a"
      />

      {/* ── Crossfader strip ── */}
      <div
        className="flex items-center gap-3 px-4 py-2.5"
        style={{
          backgroundColor: DARKER_BG,
          borderTop: "1px solid rgba(255,255,255,0.04)",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        {/* Synced transport */}
        <button
          onClick={handleSyncPlay}
          className="flex items-center justify-center transition-colors shrink-0"
          style={{
            width: 32,
            height: 32,
            borderRadius: 4,
            backgroundColor: DARK_BG,
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#CCCCCC",
          }}
        >
          {syncPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
        </button>
        <button
          onClick={handleSyncRestart}
          className="flex items-center justify-center transition-colors shrink-0"
          style={{ width: 28, height: 28, borderRadius: 4, color: "rgba(255,255,255,0.4)" }}
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Time */}
        <span
          className="tabular-nums leading-none shrink-0"
          style={{ fontFamily: MONO, fontSize: 15, letterSpacing: "0.02em", color: "#CCCCCC" }}
        >
          {formatTime(currentTime)}
          <span style={{ color: "rgba(255,255,255,0.25)" }}>&nbsp;/&nbsp;</span>
          <span style={{ color: "rgba(255,255,255,0.4)" }}>{formatTime(maxDuration)}</span>
        </span>

        {/* Crossfader */}
        <div className="flex items-center gap-2 flex-1 min-w-0 ml-2">
          <span
            className="shrink-0 uppercase"
            style={{
              fontFamily: MONO,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: crossfade <= 50 ? "#C8820A" : "rgba(255,255,255,0.25)",
            }}
          >
            A
          </span>
          <div className="flex-1 relative" style={{ height: 20 }}>
            <input
              type="range"
              min={0}
              max={100}
              value={crossfade}
              onChange={handleCrossfadeChange}
              className="w-full crossfader-input"
              style={{
                height: 20,
                WebkitAppearance: "none",
                appearance: "none",
                background: "transparent",
                cursor: "pointer",
              }}
            />
            {/* Custom track behind the native input */}
            <div
              className="absolute top-1/2 left-0 right-0 -translate-y-1/2 pointer-events-none"
              style={{
                height: 4,
                borderRadius: 2,
                background: `linear-gradient(to right, #C8820A ${crossfade}%, #1BA8C0 ${crossfade}%)`,
                opacity: 0.4,
              }}
            />
          </div>
          <span
            className="shrink-0 uppercase"
            style={{
              fontFamily: MONO,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: crossfade >= 50 ? "#1BA8C0" : "rgba(255,255,255,0.25)",
            }}
          >
            B
          </span>
        </div>
      </div>

      {/* Deck B — reference */}
      <div className="relative">
        <WaveformPlayer
          ref={playerBRef}
          audioFile={activeRefFile}
          onDurationReady={(d) => setDurationB(d)}
          hideControls
          label={activeRefName}
          deckVariant="b"
          outlineMode
        />
        {/* Overlay controls */}
        <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
          {!audioFileB && (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center transition-colors"
                style={{
                  width: 24, height: 24, borderRadius: 4,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.4)",
                }}
                title="Replace reference track"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
              <button
                onClick={handleRemoveReference}
                className="flex items-center justify-center transition-colors"
                style={{
                  width: 24, height: 24, borderRadius: 4,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.4)",
                }}
                title="Remove reference track"
              >
                <X className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

ABCompare.displayName = "ABCompare";
export default ABCompare;
