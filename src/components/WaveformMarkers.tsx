import { useState, useRef, useCallback, useMemo, useEffect, forwardRef, useImperativeHandle } from "react";
import { SlidersHorizontal, LayoutGrid, Ear, X, User, CheckSquare, MessageCircle } from "lucide-react";
import type { WaveformMarker, MarkerType } from "@/types/feedback";

const formatTime = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const markerTypeIcon: Record<MarkerType, React.ReactNode> = {
  technical: <SlidersHorizontal className="w-3.5 h-3.5" strokeWidth={2.5} />,
  structural: <LayoutGrid className="w-3.5 h-3.5" strokeWidth={2.5} />,
  perceptual: <Ear className="w-3.5 h-3.5" strokeWidth={2.5} />,
  user: <User className="w-3.5 h-3.5" strokeWidth={2.5} />,
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
    bg: "hsl(40 90% 55% / 0.3)",
    border: "hsl(40 90% 50% / 0.6)",
    text: "hsl(40 90% 45%)",
    icon: "hsl(40 90% 55%)",
  },
};

export const MARKER_ZONE_HEIGHT = 32;

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
}

/* ── Tooltip with boundary-aware positioning ── */
const MarkerTooltip = ({
  marker,
  leftPct,
  containerWidth,
  children,
  hoveredId,
  onHover,
  onLeave,
}: {
  marker: WaveformMarker;
  leftPct: number;
  containerWidth: number;
  children: React.ReactNode;
  hoveredId: string | null;
  onHover: (id: string) => void;
  onLeave: (id: string) => void;
}) => {
  const isVisible = hoveredId === marker.id;
  const isUser = marker.type === "user";
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Compute pixel-based position for boundary detection
  const markerPx = (leftPct / 100) * containerWidth;
  const TOOLTIP_WIDTH = 180; // approximate max tooltip width
  const EDGE_MARGIN = 8;

  let translateX = "-50%";
  let leftOffset = "50%";

  // Near left edge
  if (markerPx < TOOLTIP_WIDTH / 2 + EDGE_MARGIN) {
    translateX = "0%";
    leftOffset = "0";
  }
  // Near right edge
  else if (containerWidth - markerPx < TOOLTIP_WIDTH / 2 + EDGE_MARGIN) {
    translateX = "-100%";
    leftOffset = "100%";
  }

  return (
    <div
      onMouseEnter={() => onHover(marker.id)}
      onMouseLeave={() => onLeave(marker.id)}
      style={{ position: "relative", display: "inline-flex" }}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          className="absolute pointer-events-none"
          style={{
            bottom: "calc(100% + 6px)",
            left: leftOffset,
            transform: `translateX(${translateX})`,
            zIndex: 50,
            whiteSpace: "nowrap",
          }}
        >
          <div
            className="rounded-md px-2.5 py-1.5 shadow-lg text-xs"
            style={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              color: "hsl(var(--popover-foreground))",
              maxWidth: 220,
              whiteSpace: "normal",
            }}
          >
            <p className="font-medium">{marker.label}</p>
            <p
              className="text-muted-foreground tabular-nums mt-0.5"
              style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10 }}
            >
              {formatTime(marker.time)}{isUser ? " · Your note" : ""}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

type InputMode = "todo" | "note";

export interface WaveformMarkersHandle {
  triggerAddAt: (time: number, x: number) => void;
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
}, ref) => {
  const [popoverAt, setPopoverAt] = useState<{ time: number; x: number } | null>(null);
  const [inputMode, setInputMode] = useState<InputMode | null>(null);
  const [inputAt, setInputAt] = useState<{ time: number; x: number } | null>(null);
  const [noteText, setNoteText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Expose triggerAddAt for waveform body clicks
  const triggerAddAt = useCallback((time: number, x: number) => {
    if (onAddNote && !onAddToDo) {
      setInputMode("note");
      setInputAt({ time, x });
      setNoteText("");
      setTimeout(() => inputRef.current?.focus(), 50);
      return;
    }
    if (onAddToDo && !onAddNote) {
      setInputMode("todo");
      setInputAt({ time, x });
      setNoteText("");
      setTimeout(() => inputRef.current?.focus(), 50);
      return;
    }
    // Both available — show popover
    setPopoverAt({ time, x });
  }, [onAddNote, onAddToDo]);

  useImperativeHandle(ref, () => ({ triggerAddAt }), [triggerAddAt]);

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

  const handlePlusClick = useCallback(() => {
    if (hoverTimeSec === null || hoverX === null) return;
    if (onAddNote && !onAddToDo) {
      setInputMode("note");
      setInputAt({ time: hoverTimeSec, x: hoverX });
      setNoteText("");
      setTimeout(() => inputRef.current?.focus(), 50);
      return;
    }
    if (onAddToDo && !onAddNote) {
      setInputMode("todo");
      setInputAt({ time: hoverTimeSec, x: hoverX });
      setNoteText("");
      setTimeout(() => inputRef.current?.focus(), 50);
      return;
    }
    setPopoverAt({ time: hoverTimeSec, x: hoverX });
  }, [hoverTimeSec, hoverX, onAddNote, onAddToDo]);

  const handleSelectMode = useCallback((mode: InputMode) => {
    if (!popoverAt) return;
    setInputMode(mode);
    setInputAt({ time: popoverAt.time, x: popoverAt.x });
    setPopoverAt(null);
    setNoteText("");
    setTimeout(() => inputRef.current?.focus(), 50);
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
      {aiMarkers.slice(0, 6).map((m) => {
        const isActive = activeMarkerId === m.id;
        const isSnapped = snappedMarkerId === m.id;
        const leftPct = (m.time / duration) * 100;
        const type = m.type || "technical";
        const colors = markerTypeColor[type];

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
              hoveredId={hoveredMarkerId}
              onHover={handleMarkerHover}
              onLeave={handleMarkerLeave}
            >
              <button
                onClick={() => onMarkerClick?.(m)}
                className="flex items-center justify-center rounded-full transition-all duration-150"
                style={{
                  width: isActive || isSnapped ? 30 : 26,
                  height: isActive || isSnapped ? 30 : 26,
                  backgroundColor: isActive ? colors.border : colors.bg,
                  border: `1.5px solid ${isActive ? colors.text : isSnapped ? colors.border : colors.border}`,
                  color: isActive || isSnapped ? colors.text : colors.icon,
                  boxShadow: isActive ? `0 0 10px ${colors.bg}` : `0 1px 4px rgba(0,0,0,0.4)`,
                  backdropFilter: "blur(4px)",
                }}
                aria-label={`${formatTime(m.time)} — ${m.label}`}
              >
                {markerTypeIcon[type]}
              </button>
            </MarkerTooltip>
          </div>
        );
      })}

      {/* User annotation markers */}
      {userMarkers.map((m) => {
        const isActive = activeMarkerId === m.id;
        const isSnapped = snappedMarkerId === m.id;
        const leftPct = (m.time / duration) * 100;
        const colors = markerTypeColor.user;

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
              hoveredId={hoveredMarkerId}
              onHover={handleMarkerHover}
              onLeave={handleMarkerLeave}
            >
              <button
                onClick={() => onEditNote?.(m.id)}
                className="flex flex-col items-center transition-all duration-150"
              >
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: isActive || isSnapped ? 26 : 22,
                    height: isActive || isSnapped ? 26 : 22,
                    backgroundColor: isActive ? colors.border : colors.bg,
                    border: `1.5px solid ${isActive ? colors.text : isSnapped ? colors.border : colors.border}`,
                    color: isActive || isSnapped ? colors.text : "hsl(40 80% 45%)",
                    boxShadow: isActive ? `0 0 10px hsl(40 90% 55% / 0.3)` : "none",
                  }}
                >
                  <User className="w-2.5 h-2.5" strokeWidth={2.5} />
                </div>
                <div
                  style={{
                    width: "1.5px",
                    height: 6,
                    backgroundColor: isActive ? colors.text : colors.border,
                    marginTop: -1,
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
              Add to To-Do
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

      {/* Inline text input */}
      {inputAt && inputMode && (
        <div
          className="absolute z-[10] pointer-events-auto"
          style={{
            left: Math.min(Math.max(inputAt.x, 100), containerWidth - 100),
            top: MARKER_ZONE_HEIGHT + 4,
            transform: "translateX(-50%)",
          }}
        >
          <div
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
            style={{
              backgroundColor: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              boxShadow: "0 2px 8px hsl(var(--foreground) / 0.06)",
              minWidth: 200,
            }}
          >
            {inputMode === "todo" ? (
              <CheckSquare className="w-3 h-3 shrink-0" style={{ color: "hsl(var(--foreground) / 0.35)" }} />
            ) : (
              <MessageCircle className="w-3 h-3 shrink-0" style={{ color: "hsl(var(--foreground) / 0.35)" }} />
            )}
            <span
              className="text-muted-foreground/50 tabular-nums shrink-0"
              style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9 }}
            >
              {formatTime(inputAt.time)}
            </span>
            <input
              ref={inputRef}
              type="text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); handleSubmit(); }
                if (e.key === "Escape") handleCancel();
              }}
              placeholder={inputMode === "todo" ? "Add a to-do…" : "Add a note…"}
              className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/40 outline-none min-w-0"
            />
            <button
              onClick={handleCancel}
              className="text-muted-foreground/40 hover:text-foreground transition-colors shrink-0"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

WaveformMarkers.displayName = "WaveformMarkers";
export default WaveformMarkers;
