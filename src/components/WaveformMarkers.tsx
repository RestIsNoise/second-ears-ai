import { useState, useRef, useCallback, useMemo } from "react";
import { SlidersHorizontal, LayoutGrid, Ear, Plus, X } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import type { WaveformMarker, MarkerType } from "@/types/feedback";

const formatTime = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const MARKER_ICON_SIZE = 12;

const markerTypeIcon: Record<MarkerType, React.ReactNode> = {
  technical: <SlidersHorizontal className="w-3 h-3" />,
  structural: <LayoutGrid className="w-3 h-3" />,
  perceptual: <Ear className="w-3 h-3" />,
};

const markerTypeColor: Record<MarkerType, { bg: string; border: string; text: string }> = {
  technical: {
    bg: "hsl(var(--accent) / 0.15)",
    border: "hsl(var(--accent) / 0.3)",
    text: "hsl(var(--accent-foreground))",
  },
  structural: {
    bg: "hsl(210 80% 55% / 0.15)",
    border: "hsl(210 80% 55% / 0.35)",
    text: "hsl(210 80% 55%)",
  },
  perceptual: {
    bg: "hsl(270 60% 55% / 0.15)",
    border: "hsl(270 60% 55% / 0.35)",
    text: "hsl(270 60% 55%)",
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
}

const WaveformMarkers = ({
  markers,
  duration,
  containerWidth,
  activeMarkerId,
  snappedMarkerId,
  hoverX,
  onMarkerClick,
  onAddNote,
}: Props) => {
  const [addNoteAt, setAddNoteAt] = useState<{ time: number; x: number } | null>(null);
  const [noteText, setNoteText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Determine if hover is near any marker but NOT on a marker (show + button)
  const hoverTimeSec = useMemo(() => {
    if (hoverX === null || duration <= 0 || containerWidth <= 0) return null;
    return (hoverX / containerWidth) * duration;
  }, [hoverX, duration, containerWidth]);

  const showPlusButton = hoverX !== null && !snappedMarkerId && !addNoteAt;

  const handlePlusClick = useCallback(() => {
    if (hoverTimeSec === null) return;
    setAddNoteAt({ time: hoverTimeSec, x: hoverX! });
    setNoteText("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [hoverTimeSec, hoverX]);

  const handleSubmitNote = useCallback(() => {
    const trimmed = noteText.trim();
    if (!trimmed || !addNoteAt) return;
    onAddNote?.(trimmed, addNoteAt.time);
    setAddNoteAt(null);
    setNoteText("");
  }, [noteText, addNoteAt, onAddNote]);

  const handleCancelNote = useCallback(() => {
    setAddNoteAt(null);
    setNoteText("");
  }, []);

  if (markers.length === 0 && !onAddNote) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className="absolute left-0 right-0 z-[5]"
        style={{ height: MARKER_ZONE_HEIGHT, overflow: "visible" }}
      >
        {/* Circular markers */}
        {markers.slice(0, 6).map((m) => {
          const isActive = activeMarkerId === m.id;
          const isSnapped = snappedMarkerId === m.id;
          const leftPct = (m.time / duration) * 100;
          const type = m.type || "technical";
          const colors = markerTypeColor[type];

          return (
            <div
              key={m.id}
              className="absolute pointer-events-auto"
              style={{
                left: `${leftPct}%`,
                top: "50%",
                transform: "translate(-50%, -50%)",
              }}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onMarkerClick?.(m)}
                    className="flex items-center justify-center rounded-full transition-all duration-150"
                    style={{
                      width: isActive || isSnapped ? 28 : 24,
                      height: isActive || isSnapped ? 28 : 24,
                      backgroundColor: isActive
                        ? colors.border
                        : colors.bg,
                      border: `1.5px solid ${isActive ? colors.text : isSnapped ? colors.border : "hsl(var(--foreground) / 0.1)"}`,
                      color: isActive || isSnapped ? colors.text : "hsl(var(--foreground) / 0.4)",
                      boxShadow: isActive ? `0 0 8px ${colors.bg}` : "none",
                    }}
                    aria-label={`${formatTime(m.time)} — ${m.label}`}
                  >
                    {markerTypeIcon[type]}
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="max-w-[200px] text-xs"
                >
                  <p className="font-medium">{m.label}</p>
                  <p
                    className="text-muted-foreground tabular-nums mt-0.5"
                    style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10 }}
                  >
                    {formatTime(m.time)}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          );
        })}

        {/* "+" button on hover below timeline */}
        {showPlusButton && hoverX !== null && onAddNote && (
          <div
            className="absolute pointer-events-auto z-[6]"
            style={{
              left: hoverX,
              top: MARKER_ZONE_HEIGHT + 2,
              transform: "translateX(-50%)",
            }}
          >
            <button
              onClick={handlePlusClick}
              className="w-5 h-5 rounded-full flex items-center justify-center transition-all duration-100 hover:scale-110"
              style={{
                backgroundColor: "hsl(var(--foreground) / 0.08)",
                border: "1px solid hsl(var(--foreground) / 0.12)",
                color: "hsl(var(--foreground) / 0.4)",
              }}
              title="Add annotation"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Inline note input */}
        {addNoteAt && (
          <div
            className="absolute z-[10] pointer-events-auto"
            style={{
              left: Math.min(Math.max(addNoteAt.x, 100), containerWidth - 100),
              top: MARKER_ZONE_HEIGHT + 4,
              transform: "translateX(-50%)",
            }}
          >
            <div
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 shadow-lg"
              style={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                minWidth: 200,
              }}
            >
              <span
                className="text-muted-foreground/50 tabular-nums shrink-0"
                style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9 }}
              >
                {formatTime(addNoteAt.time)}
              </span>
              <input
                ref={inputRef}
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); handleSubmitNote(); }
                  if (e.key === "Escape") handleCancelNote();
                }}
                placeholder="Add a note…"
                className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/40 outline-none min-w-0"
              />
              <button
                onClick={handleCancelNote}
                className="text-muted-foreground/40 hover:text-foreground transition-colors shrink-0"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default WaveformMarkers;
