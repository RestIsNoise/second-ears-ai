import { useState, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import { Play, Pause, RotateCcw, X, RefreshCw, Headphones, Volume2, VolumeX, Repeat, SkipBack, SkipForward } from "lucide-react";
import WaveformPlayer from "@/components/WaveformPlayer";
import type { WaveformPlayerHandle } from "@/components/WaveformPlayer";
import type { WaveformMarker } from "@/types/feedback";
import type { FrequencyData } from "@/lib/parseFrequencyData";

const MONO = "'JetBrains Mono', 'IBM Plex Mono', 'Courier New', monospace";
const SHELL_BG = "#191919";
const MIXER_BG = "#131315";
const DIVIDER = "rgba(255,255,255,0.07)";
const BEVEL_LIGHT = "rgba(255,255,255,0.04)";
const BEVEL_DARK = "rgba(0,0,0,0.4)";
const ACCEPTED_FORMATS = ".mp3,.wav,.aiff,.aif";
const DECK_A_COLOR = "#9A9590";  // warm charcoal/smoke
const DECK_B_COLOR = "#78A8B2";  // desaturated teal

const AMBER = '#C8820A';
const CYAN = '#1BA8C0';

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
  frequencyDataA?: FrequencyData | null;
  frequencyDataB?: FrequencyData | null;
}

/* ── Mixer button ── */
const MixerBtn = ({
  onClick, active, disabled, title, children, size = 28,
  activeColor,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
  size?: number;
  activeColor?: string;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="deck-btn flex items-center justify-center transition-all duration-100"
    style={{
      width: size,
      height: size,
      borderRadius: 4,
      backgroundColor: active ? (activeColor || "rgba(255,255,255,0.12)") : "#1A1A1A",
      border: `1px solid ${active ? (activeColor || "rgba(255,255,255,0.20)") : "rgba(255,255,255,0.08)"}`,
      color: active ? (activeColor ? "#000" : "#ffffff") : "rgba(255,255,255,0.50)",
      boxShadow: active
        ? `0 0 6px ${activeColor || "rgba(255,255,255,0.1)"}, inset 0 1px 0 rgba(255,255,255,0.1)`
        : `inset 0 1px 0 ${BEVEL_LIGHT}`,
    }}
    title={title}
  >
    {children}
  </button>
);

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
  const [isMono, setIsMono] = useState(false);
  const [masterVolume, setMasterVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [soloMode, setSoloMode] = useState<"off" | "a" | "b">("off");

  // Marker navigation helpers
  const sortedMarkers = [...markersA].sort((a, b) => a.time - b.time);
  const markerCount = sortedMarkers.length;

  const jumpToMarker = useCallback((direction: "prev" | "next") => {
    if (sortedMarkers.length === 0) return;
    const t = playerARef.current?.getCurrentTime() ?? 0;
    let target: WaveformMarker | null = null;
    if (direction === "next") {
      target = sortedMarkers.find((m) => m.time > t + 0.5) || null;
      if (!target) target = sortedMarkers[0]; // wrap
    } else {
      for (let i = sortedMarkers.length - 1; i >= 0; i--) {
        if (sortedMarkers[i].time < t - 1) { target = sortedMarkers[i]; break; }
      }
      if (!target) target = sortedMarkers[sortedMarkers.length - 1]; // wrap
    }
    if (target) {
      playerARef.current?.seekTo(target.time);
      playerBRef.current?.seekTo(target.time);
      onMarkerClick?.(target);
    }
  }, [sortedMarkers, onMarkerClick]);

  const handleSourceSelect = useCallback((deck: "a" | "b") => {
    const mv = isMuted ? 0 : masterVolume / 100;
    if (soloMode === deck) {
      // Deselect — return to crossfade blend
      setSoloMode("off");
      playerARef.current?.setVolume((1 - crossfade / 100) * mv);
      playerBRef.current?.setVolume((crossfade / 100) * mv);
    } else {
      // Snap to selected source
      setSoloMode(deck);
      setCrossfade(deck === "a" ? 0 : 100);
      playerARef.current?.setVolume(deck === "a" ? mv : 0);
      playerBRef.current?.setVolume(deck === "b" ? mv : 0);
    }
  }, [soloMode, crossfade, isMuted, masterVolume]);

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
    const mv = isMuted ? 0 : masterVolume / 100;
    const volA = (1 - v / 100) * mv;
    const volB = (v / 100) * mv;
    playerARef.current?.setVolume(volA);
    playerBRef.current?.setVolume(volB);
  }, [isMuted, masterVolume]);

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

  // Single deck mode
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

  // Dual deck mode — DJ mixer layout
  const cfPct = crossfade;

  return (
    <div
      className="overflow-hidden"
      style={{
        borderRadius: 0,
        border: "none",
        backgroundColor: SHELL_BG,
      }}
    >
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
        containerStyle={{ borderRadius: 0, border: "none", boxShadow: "none" }}
      />

      {/* ═══ Mixer strip — heavier, more machined ═══ */}
      <div
        className="flex items-center gap-3 px-3"
        style={{
          paddingTop: 8,
          paddingBottom: 8,
          backgroundColor: MIXER_BG,
          borderTop: `2px solid rgba(0,0,0,0.5)`,
          borderBottom: `2px solid rgba(0,0,0,0.5)`,
          boxShadow: `inset 0 1px 0 ${BEVEL_LIGHT}, inset 0 -1px 0 ${BEVEL_DARK}, 0 1px 4px rgba(0,0,0,0.3)`,
        }}
      >
        {/* LEFT: Transport cluster */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleSyncPlay}
            className="deck-btn deck-btn-primary flex items-center justify-center transition-all duration-100"
            style={{
              width: 34,
              height: 30,
              borderRadius: 4,
              backgroundColor: syncPlaying ? "#ffffff" : "#1E1E1E",
              border: `1px solid ${syncPlaying ? "#ffffff" : "rgba(255,255,255,0.12)"}`,
              color: syncPlaying ? "#000000" : "rgba(255,255,255,0.85)",
              boxShadow: syncPlaying
                ? "0 0 10px rgba(255,255,255,0.25), inset 0 1px 0 rgba(255,255,255,0.2)"
                : `inset 0 1px 0 ${BEVEL_LIGHT}, inset 0 -1px 0 ${BEVEL_DARK}`,
            }}
          >
            {syncPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
          </button>
          <MixerBtn onClick={handleSyncRestart} title="Restart">
            <RotateCcw className="w-3 h-3" />
          </MixerBtn>

          {/* Divider */}
          <div style={{ width: 1, height: 18, backgroundColor: "rgba(255,255,255,0.08)", marginLeft: 2, marginRight: 2 }} />

          {/* Prev / Next marker */}
          <MixerBtn onClick={() => jumpToMarker("prev")} disabled={markerCount === 0} title="Previous marker">
            <SkipBack className="w-3 h-3" />
          </MixerBtn>
          <MixerBtn onClick={() => jumpToMarker("next")} disabled={markerCount === 0} title="Next marker">
            <SkipForward className="w-3 h-3" />
          </MixerBtn>

          {/* Marker count */}
          {markerCount > 0 && (
            <span
              className="tabular-nums shrink-0"
              style={{ fontFamily: MONO, fontSize: 9, color: "rgba(255,255,255,0.25)", fontWeight: 600, letterSpacing: "0.04em", marginLeft: 2 }}
            >
              {markerCount}
            </span>
          )}

          {/* Time */}
          <span
            className="tabular-nums leading-none ml-2 shrink-0"
            style={{ fontFamily: MONO, fontSize: 13, letterSpacing: "0.02em", color: "rgba(255,255,255,0.85)", fontWeight: 500 }}
          >
            {formatTime(currentTime)}
            <span style={{ color: "rgba(255,255,255,0.18)" }}> / </span>
            <span style={{ color: "rgba(255,255,255,0.35)" }}>{formatTime(maxDuration)}</span>
          </span>
        </div>

        {/* CENTER: Crossfader */}
        <div className="flex flex-col items-center mx-auto" style={{ maxWidth: 280, width: "100%" }}>
          <div className="flex items-center gap-2.5 w-full">
            {/* A source select */}
            <button
              onClick={() => handleSourceSelect("a")}
              className="shrink-0 uppercase tabular-nums transition-all duration-150"
              style={{
                fontFamily: MONO,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.06em",
                color: soloMode === "a" ? "#000" : (soloMode === "off" && cfPct <= 50 ? DECK_A_COLOR : "rgba(255,255,255,0.25)"),
                backgroundColor: soloMode === "a" ? DECK_A_COLOR : "transparent",
                padding: "3px 8px",
                borderRadius: 3,
                border: `1px solid ${soloMode === "a" ? DECK_A_COLOR : "rgba(255,255,255,0.10)"}`,
                boxShadow: soloMode === "a" ? `0 0 8px ${DECK_A_COLOR}44` : "none",
              }}
              title={soloMode === "a" ? "Return to blend" : "Monitor A only"}
            >
              A
            </button>

            {/* Crossfader track */}
            <div className="flex-1 relative" style={{ height: 22 }}>
              <div
                className="absolute top-1/2 left-0 right-0 -translate-y-1/2 pointer-events-none"
                style={{
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: "rgba(255,255,255,0.06)",
                  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.5)",
                }}
              />
              <div
                className="absolute top-1/2 left-0 right-0 -translate-y-1/2 pointer-events-none"
                style={{
                  height: 4,
                  borderRadius: 2,
                  background: `linear-gradient(to right, ${DECK_A_COLOR} ${100 - cfPct}%, ${DECK_B_COLOR} ${100 - cfPct}%)`,
                  opacity: soloMode !== "off" ? 0.2 : 0.50,
                }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none"
                style={{
                  left: "50%",
                  width: 1,
                  height: 10,
                  backgroundColor: "rgba(255,255,255,0.15)",
                  borderRadius: 1,
                }}
              />
              <input
                type="range"
                min={0}
                max={100}
                value={crossfade}
                onChange={handleCrossfadeChange}
                className="w-full crossfader-input"
                style={{
                  height: 22,
                  WebkitAppearance: "none",
                  appearance: "none",
                  background: "transparent",
                  cursor: "pointer",
                  position: "relative",
                  zIndex: 2,
                  opacity: soloMode !== "off" ? 0.4 : 1,
                }}
              />
            </div>

            {/* B source select */}
            <button
              onClick={() => handleSourceSelect("b")}
              className="shrink-0 uppercase tabular-nums transition-all duration-150"
              style={{
                fontFamily: MONO,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.06em",
                color: soloMode === "b" ? "#000" : (soloMode === "off" && cfPct >= 50 ? DECK_B_COLOR : "rgba(255,255,255,0.25)"),
                backgroundColor: soloMode === "b" ? DECK_B_COLOR : "transparent",
                padding: "3px 8px",
                borderRadius: 3,
                border: `1px solid ${soloMode === "b" ? DECK_B_COLOR : "rgba(255,255,255,0.10)"}`,
                boxShadow: soloMode === "b" ? `0 0 8px ${DECK_B_COLOR}44` : "none",
              }}
              title={soloMode === "b" ? "Return to blend" : "Monitor B only"}
            >
              B
            </button>
          </div>
        </div>

        {/* RIGHT: Utility cluster */}
        <div className="flex items-center gap-1 shrink-0">
          <MixerBtn onClick={() => setIsMono(!isMono)} active={isMono} title={isMono ? "Mono" : "Stereo"}>
            <Headphones className="w-3.5 h-3.5" />
          </MixerBtn>

          {/* Volume with hover slider */}
          <div className="relative group flex items-center">
            <MixerBtn
              onClick={() => {
                if (isMuted) {
                  setIsMuted(false);
                  playerARef.current?.setVolume((1 - crossfade / 100) * (masterVolume / 100));
                  playerBRef.current?.setVolume((crossfade / 100) * (masterVolume / 100));
                } else {
                  setIsMuted(true);
                  playerARef.current?.setVolume(0);
                  playerBRef.current?.setVolume(0);
                }
              }}
              active={isMuted}
              title="Master volume"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </MixerBtn>
            <div
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center p-2 rounded"
              style={{
                backgroundColor: "#0A0A0A",
                border: `1px solid ${DIVIDER}`,
                boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
              }}
            >
              <input
                type="range"
                min={0}
                max={100}
                value={isMuted ? 0 : masterVolume}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setMasterVolume(v);
                  setIsMuted(v === 0);
                  const volA = (1 - crossfade / 100) * (v / 100);
                  const volB = (crossfade / 100) * (v / 100);
                  playerARef.current?.setVolume(volA);
                  playerBRef.current?.setVolume(volB);
                }}
                className="crossfader-input"
                style={{
                  writingMode: "vertical-lr",
                  direction: "rtl",
                  height: 80,
                  width: 18,
                  WebkitAppearance: "none",
                  appearance: "none",
                  background: "transparent",
                  cursor: "pointer",
                }}
              />
            </div>
          </div>

          <MixerBtn onClick={() => setIsLooping(!isLooping)} active={isLooping} title="Loop">
            <Repeat className="w-3.5 h-3.5" />
          </MixerBtn>
        </div>
      </div>

      {/* Deck B — reference track */}
      <div
        className="relative"
        style={{
          borderTop: `1px solid ${DIVIDER}`,
          borderBottom: "2px solid rgba(0,0,0,0.4)",
          backgroundColor: "#0E0E10",
          paddingBottom: 10,
          boxShadow: "inset 0 2px 6px rgba(0,0,0,0.3)",
        }}
      >
        <WaveformPlayer
          ref={playerBRef}
          audioFile={activeRefFile}
          onDurationReady={(d) => setDurationB(d)}
          hideControls
          label={`Reference Track · ${activeRefName || "Loaded track"}`}
          deckVariant="b"
          outlineMode
          containerStyle={{ borderRadius: 0, border: "none", boxShadow: "none", paddingBottom: 6 }}
        />
        {/* Overlay controls */}
        {!audioFileB && (
          <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
            <MixerBtn onClick={() => fileInputRef.current?.click()} title="Replace reference" size={22}>
              <RefreshCw className="w-2.5 h-2.5" />
            </MixerBtn>
            <MixerBtn onClick={handleRemoveReference} title="Remove reference" size={22}>
              <X className="w-2.5 h-2.5" />
            </MixerBtn>
          </div>
        )}
      </div>
    </div>
  );
});

ABCompare.displayName = "ABCompare";
export default ABCompare;
