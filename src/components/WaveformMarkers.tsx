import { useState, useRef, useCallback, useMemo, useEffect, forwardRef, useImperativeHandle } from "react";
import { SlidersHorizontal, Music, Ear, X, CheckSquare, MessageCircle } from "lucide-react";
import type { WaveformMarker, MarkerType } from "@/types/feedback";

const formatTime = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const markerTypeIcon: Record<MarkerType, React.ReactNode> = {
  technical: <SlidersHorizontal className="w-3.5 h-3.5" strokeWidth={2.5} />,
  structural: <Music className="w-3.5 h-3.5" strokeWidth={2.5} />,
  perceptual: <Ear className="w-3 h-3" strokeWidth={2.5} />,
  user: <MessageCircle className="w-3.5 h-3.5" strokeWidth={2.5} />,
};

const markerTypeColor: Record<MarkerType, { bg: string; border: string; text: string; icon: string }> = {
  technical: {
    bg: "hsl(var(--accent) / 0.25)",
    border: "hsl(var(--accent) / 0.5)",
    text: "hsl(var(--accent-foreground))",
    icon: "hsl(var(--accent-foreground))",
  },
  structural: {
    bg: "hsl(210 80% 55% / 0.25)",
    border: "hsl(210 80% 55% / 0.5)",
    text: "hsl(210 80% 65%)",
    icon: "hsl(210 80% 70%)",
  },
  perceptual: {
    bg: "hsl(270 60% 55% / 0.25)",
    border: "hsl(270 60% 55% / 0.5)",
    text: "hsl(270 60% 65%)",
    icon: "hsl(270 60% 70%)",
  },
  user: {
    bg: "hsl(45 100% 72% / 0.18)",
    border: "hsl(45 90% 58% / 0.55)",
    text: "hsl(42 95% 62%)",
    icon: "hsl(42 90% 58%)",
  },
};

export const MARKER_ZONE_HEIGHT = 44;

interface Props {
  markers: WaveformMarker[];
  duration: number;
  containerWidth: number;
  activeMarkerId?: string | null;
  snappedMarkerId: string | null;
  hoverX: number | null;
  onMarkerClick?: (marker: WaveformMarker) => void;
  onAddNote?: (text: string, timestampSec: number) => void;
  onAddToDo?: (text: string, timestampSec: number) => void;
  onEditNote?: (markerId: string) => void;
  onComposerChange?: (state: ComposerState | null) => void;
}

/* ── Tooltip with boundary-aware positioning ── */
const MarkerTooltip = ({
  marker,
  leftPct,
  containerWidth,
  verticalPosition,
  children,
  hoveredId,
  onHover,
  onLeave,
}: {
  marker: WaveformMarker;
  leftPct: number;
  containerWidth: number;
  verticalPosition?: "top" | "bottom";
  children: React.ReactNode;
  hoveredId: string | null;
  onHover: (id: string) => void;
  onLeave: (id: string) => void;
}) => {
  const isVisible = hoveredId === marker.id;
  const isUser = marker.type === "user";

  const markerPx = (leftPct / 100) * containerWidth;
  const TOOLTIP_WIDTH = 200;
  const EDGE_MARGIN = 8;

  let translateX = "-50%";
  let leftOffset = "50%";

  if (markerPx < TOOLTIP_WIDTH / 2 + EDGE_MARGIN) {
    translateX = "0%";
    leftOffset = "0";
  } else if (containerWidth - markerPx < TOOLTIP_WIDTH / 2 + EDGE_MARGIN) {
    translateX = "-100%";
    leftOffset = "100%";
  }

  // Vertical: default above, but if marker is in top portion show below
  const showBelow = verticalPosition === "top";

  const positionStyle: React.CSSProperties = showBelow
    ? { top: "calc(100% + 6px)", left: leftOffset, transform: `translateX(${translateX})` }
    : { bottom: "calc(100% + 6px)", left: leftOffset, transform: `translateX(${translateX})` };

  return (
    <div
      onMouseEnter={() => onHover(marker.id)}
      onMouseLeave={() => onLeave(marker.id)}
      style={{ position: "relative", display: "inline-flex" }}
    >
      {children}
      {isVisible && (
        <div
          className="absolute pointer-events-none"
          style={{
            ...positionStyle,
            zIndex: 50,
            whiteSpace: "nowrap",
          }}
        >
           <div
             style={{
               backgroundColor: "#111",
               color: "#fff",
               padding: "4px 10px",
               borderRadius: 3,
               fontFamily: "'IBM Plex Mono', monospace",
               fontSize: 11,
               whiteSpace: "normal",
               maxWidth: 220,
             }}
           >
             {marker.label}
           </div>
        </div>
      )}
    </div>
  );
};

type InputMode = "todo" | "note";

export interface ComposerState {
  mode: InputMode;
  time: number;
  x: number;
}

export interface WaveformMarkersHandle {
  triggerAddAt: (time: number, x: number) => void;
  getComposerState: () => ComposerState | null;
  submitComposer: (text: string) => void;
  cancelComposer: () => void;
}

const WaveformMarkers = forwardRef<WaveformMarkersHandle, Props>(({
  markers,
  duration,
  containerWidth,
  activeMarkerId,
  snappedMarkerId,
  hoverX,
  onMarkerClick,
  onAddNote,
  onAddToDo,
  onEditNote,
  onComposerChange,
}, ref) => {
  const [popoverAt, setPopoverAt] = useState<{ time: number; x: number } | null>(null);
  const [inputMode, setInputMode] = useState<InputMode | null>(null);
  const [inputAt, setInputAt] = useState<{ time: number; x: number } | null>(null);
  const [noteText, setNoteText] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);

  // Notify parent of composer state changes
  useEffect(() => {
    const state = inputAt && inputMode ? { mode: inputMode, time: inputAt.time, x: inputAt.x } : null;
    onComposerChange?.(state);
  }, [inputAt, inputMode, onComposerChange]);

  // Expose triggerAddAt for waveform body clicks
  const triggerAddAt = useCallback((time: number, x: number) => {
    if (onAddNote && !onAddToDo) {
      setInputMode("note");
      setInputAt({ time, x });
      setNoteText("");
      return;
    }
    if (onAddToDo && !onAddNote) {
      setInputMode("todo");
      setInputAt({ time, x });
      setNoteText("");
      return;
    }
    // Both available — show popover
    setPopoverAt({ time, x });
  }, [onAddNote, onAddToDo]);

  useImperativeHandle(ref, () => ({
    triggerAddAt,
    getComposerState: () => inputAt && inputMode ? { mode: inputMode, time: inputAt.time, x: inputAt.x } : null,
    submitComposer: (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !inputAt || !inputMode) return;
      if (inputMode === "todo") onAddToDo?.(trimmed, inputAt.time);
      else onAddNote?.(trimmed, inputAt.time);
      setInputAt(null); setInputMode(null); setNoteText("");
    },
    cancelComposer: () => { setInputAt(null); setInputMode(null); setPopoverAt(null); setNoteText(""); },
  }), [triggerAddAt, inputAt, inputMode, onAddNote, onAddToDo, noteText]);

  // Single hovered marker with 100ms delay
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMarkerHover = useCallback((id: string) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => setHoveredMarkerId(id), 100);
  }, []);

  const handleMarkerLeave = useCallback((id: string) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setHoveredMarkerId((prev) => (prev === id ? null : prev));
  }, []);

  const hoverTimeSec = useMemo(() => {
    if (hoverX === null || duration <= 0 || containerWidth <= 0) return null;
    return (hoverX / containerWidth) * duration;
  }, [hoverX, duration, containerWidth]);

  const hasAnyAction = onAddNote || onAddToDo;

  // Close popover on outside click
  useEffect(() => {
    if (!popoverAt) return;
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverAt(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [popoverAt]);


  const handleSelectMode = useCallback((mode: InputMode) => {
    if (!popoverAt) return;
    setInputMode(mode);
    setInputAt({ time: popoverAt.time, x: popoverAt.x });
    setPopoverAt(null);
    setNoteText("");
  }, [popoverAt]);

  const handleSubmit = useCallback(() => {
    const trimmed = noteText.trim();
    if (!trimmed || !inputAt || !inputMode) return;
    if (inputMode === "todo") {
      onAddToDo?.(trimmed, inputAt.time);
    } else {
      onAddNote?.(trimmed, inputAt.time);
    }
    setInputAt(null);
    setInputMode(null);
    setNoteText("");
  }, [noteText, inputAt, inputMode, onAddNote, onAddToDo]);

  const handleCancel = useCallback(() => {
    setInputAt(null);
    setInputMode(null);
    setPopoverAt(null);
    setNoteText("");
  }, []);

  const aiMarkers = markers.filter(m => (m.type || "technical") !== "user");
  const userMarkers = markers.filter(m => m.type === "user");

  if (markers.length === 0 && !hasAnyAction) return null;

  return (
    <div
      className="absolute left-0 right-0 z-[5] pointer-events-none"
      style={{ height: MARKER_ZONE_HEIGHT, overflow: "visible" }}
    >
      {/* AI markers */}
      {aiMarkers.slice(0, 6).map((m, idx) => {
        const isActive = activeMarkerId === m.id;
        const isSnapped = snappedMarkerId === m.id;
        const leftPct = (m.time / duration) * 100;
        const highlighted = isActive || isSnapped;
        const sev = m.severity || "low";
        const sevGlow =
          sev === "high" ? "0 0 10px rgba(239,68,68,0.5)" :
          sev === "med" ? "0 0 10px rgba(251,191,36,0.4)" : "none";
        const mType = m.type || "technical";
        const TypeIcon = mType === "structural" ? Music : mType === "perceptual" ? Ear : SlidersHorizontal;

        return (
          <div
            key={m.id}
            className="absolute pointer-events-auto"
            data-marker-btn
            style={{
              left: `${leftPct}%`,
              top: "50%",
              transform: "translate(-50%, -50%)",
            }}
          >
            <MarkerTooltip
              marker={m}
              leftPct={leftPct}
              containerWidth={containerWidth}
              verticalPosition="top"
              hoveredId={hoveredMarkerId}
              onHover={handleMarkerHover}
              onLeave={handleMarkerLeave}
            >
              <button
                onClick={() => onMarkerClick?.(m)}
                className="flex flex-col items-center group"
                aria-label={`${formatTime(m.time)} — ${m.label}`}
              >
                <div
                  className="flex items-center justify-center rounded-full transition-all duration-150 group-hover:scale-125"
                  style={{
                    width: 28,
                    height: 28,
                    backgroundColor: highlighted ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.12)",
                    border: `1.5px solid rgba(255,255,255,${highlighted ? 0.6 : 0.4})`,
                    boxShadow: `0 2px 8px rgba(0,0,0,0.4)${sevGlow !== "none" ? `, ${sevGlow}` : ""}`,
                    backdropFilter: "blur(4px)",
                  }}
                >
                  <TypeIcon
                    style={{ width: 11, height: 11, color: "rgba(255,255,255,0.85)" }}
                    strokeWidth={2.5}
                  />
                </div>
                {/* Vertical stem */}
                <div
                  style={{
                    width: 2,
                    height: 10,
                    backgroundColor: "rgba(255,255,255,0.2)",
                    marginTop: -1,
                  }}
                />
              </button>
            </MarkerTooltip>
          </div>
        );
      })}

      {/* Human comment markers — compact badge style */}
      {userMarkers.map((m) => {
        const isActive = activeMarkerId === m.id;
        const isSnapped = snappedMarkerId === m.id;
        const leftPct = (m.time / duration) * 100;
        const highlighted = isActive || isSnapped;

        return (
          <div
            key={m.id}
            className="absolute pointer-events-auto"
            data-marker-btn
            style={{
              left: `${leftPct}%`,
              top: "50%",
              transform: "translate(-50%, -50%)",
            }}
          >
            <MarkerTooltip
              marker={m}
              leftPct={leftPct}
              containerWidth={containerWidth}
              verticalPosition="top"
              hoveredId={hoveredMarkerId}
              onHover={handleMarkerHover}
              onLeave={handleMarkerLeave}
            >
              <button
                onClick={() => onEditNote?.(m.id)}
                className="flex flex-col items-center transition-all duration-150"
              >
                {/* Rounded-square badge — distinct from circular AI markers */}
                <div
                  className="flex items-center gap-1 select-none"
                  style={{
                    padding: "2px 5px",
                    borderRadius: 4,
                    backgroundColor: highlighted
                      ? "hsl(42 95% 62% / 0.25)"
                      : "hsl(45 100% 72% / 0.12)",
                    border: `1.5px solid ${highlighted ? "hsl(42 95% 62% / 0.7)" : "hsl(45 90% 58% / 0.4)"}`,
                    boxShadow: highlighted
                      ? "0 0 8px hsl(42 95% 62% / 0.2), 0 1px 3px rgba(0,0,0,0.3)"
                      : "0 1px 3px rgba(0,0,0,0.35)",
                    backdropFilter: "blur(6px)",
                  }}
                >
                  <MessageCircle
                    className="shrink-0"
                    style={{
                      width: 10,
                      height: 10,
                      color: highlighted ? "hsl(42 95% 68%)" : "hsl(42 80% 55%)",
                    }}
                    strokeWidth={2.5}
                  />
                  <span
                    className="truncate"
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 8,
                      fontWeight: 600,
                      letterSpacing: "0.04em",
                      color: highlighted ? "hsl(42 95% 72%)" : "hsl(42 60% 50%)",
                      maxWidth: 48,
                      lineHeight: 1,
                    }}
                  >
                    {formatTime(m.time)}
                  </span>
                </div>
                {/* Stem */}
                <div
                  style={{
                    width: 1,
                    height: 5,
                    backgroundColor: highlighted ? "hsl(42 95% 62% / 0.5)" : "hsl(45 90% 58% / 0.25)",
                    marginTop: -0.5,
                  }}
                />
              </button>
            </MarkerTooltip>
          </div>
        );
      })}

      {/* No floating + button — waveform body click handles adding markers */}

      {/* Popover menu */}
      {popoverAt && (
        <div
          ref={popoverRef}
          className="absolute z-[12] pointer-events-auto"
          style={{
            left: Math.min(Math.max(popoverAt.x, 70), containerWidth - 70),
            top: MARKER_ZONE_HEIGHT + 6,
            transform: "translateX(-50%)",
          }}
        >
          <div
            className="rounded-lg py-1 min-w-[140px]"
            style={{
              backgroundColor: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              boxShadow: "0 2px 8px hsl(var(--foreground) / 0.06)",
            }}
          >
            <button
              onClick={() => handleSelectMode("todo")}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors hover:bg-secondary/50"
              style={{ color: "hsl(var(--foreground) / 0.8)" }}
            >
              <CheckSquare className="w-3.5 h-3.5 shrink-0" style={{ color: "hsl(var(--foreground) / 0.45)" }} />
              Add to Next Moves
            </button>
            <button
              onClick={() => handleSelectMode("note")}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors hover:bg-secondary/50"
              style={{ color: "hsl(var(--foreground) / 0.8)" }}
            >
              <MessageCircle className="w-3.5 h-3.5 shrink-0" style={{ color: "hsl(var(--foreground) / 0.45)" }} />
              Add Note
            </button>
          </div>
        </div>
      )}

    </div>
  );
});

WaveformMarkers.displayName = "WaveformMarkers";
export default WaveformMarkers;
