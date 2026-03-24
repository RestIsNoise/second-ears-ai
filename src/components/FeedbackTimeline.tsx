import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { Copy, Check, Plus, AudioLines } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import FeedbackVoteButtons from "@/components/FeedbackVoteButtons";
import { useAuth } from "@/hooks/useAuth";
import type { FeedbackItem } from "@/types/feedback";

const formatTime = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const MONO = "'IBM Plex Mono', monospace";

/** Mode-linked accent colors */
const modeAccent: Record<string, { border: string; bg: string; text: string; tag: string }> = {
  technical: {
    border: "hsl(35 55% 55%)",
    bg: "hsl(35 40% 50% / 0.06)",
    text: "hsl(35 45% 45%)",
    tag: "TECH",
  },
  musical: {
    border: "hsl(215 45% 55%)",
    bg: "hsl(215 35% 50% / 0.06)",
    text: "hsl(215 40% 48%)",
    tag: "MUSC",
  },
  perception: {
    border: "hsl(270 35% 55%)",
    bg: "hsl(270 28% 50% / 0.06)",
    text: "hsl(270 30% 48%)",
    tag: "PERC",
  },
};

const defaultAccent = modeAccent.technical;

const severityConfig: Record<string, { label: string; color: string; glow: string }> = {
  high: { label: "HIGH", color: "hsl(0 55% 50%)", glow: "0 0 4px hsl(0 55% 50% / 0.35)" },
  med: { label: "MED", color: "hsl(35 70% 55%)", glow: "0 0 4px hsl(35 70% 55% / 0.3)" },
  low: { label: "LOW", color: "hsl(var(--foreground) / 0.2)", glow: "none" },
};

/* ── Observation (always fully visible) ── */
const ClampedObservation = ({ text }: { text: string }) => (
  <div className="mt-2.5">
    <p
      className="text-[15px] text-foreground/55"
      style={{ fontFamily: MONO, lineHeight: 1.75 }}
    >
      {text}
    </p>
  </div>
);

const CopyFixInline = ({ item }: { item: FeedbackItem }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = [item.title, item.observation ? `Why: ${item.observation}` : "", item.fix ? `Fix: ${item.fix}` : ""].filter(Boolean).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({ title: "Copied", duration: 1500 });
      setTimeout(() => setCopied(false), 2000);
    } catch { toast({ title: "Copy failed", variant: "destructive", duration: 1500 }); }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-[8px] text-foreground/20 hover:text-foreground/50 transition-colors shrink-0 uppercase tracking-[0.1em] font-bold"
      style={{ fontFamily: MONO }}
      title="Copy"
    >
      {copied ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
    </button>
  );
};

/* ── Toggle button for adding/removing from Next Moves ── */
const ToDoToggleButton = ({
  item,
  alreadyAdded,
  onAdd,
  onRemove,
}: {
  item: FeedbackItem;
  alreadyAdded: boolean;
  onAdd: (item: FeedbackItem) => void;
  onRemove?: (item: FeedbackItem) => void;
}) => {
  const [flashGreen, setFlashGreen] = useState(false);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (alreadyAdded) {
      onRemove?.(item);
    } else {
      onAdd(item);
      setFlashGreen(true);
      setTimeout(() => setFlashGreen(false), 1500);
    }
  }, [item, alreadyAdded, onAdd, onRemove]);

  const isGreen = alreadyAdded || flashGreen;

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center p-0.5 transition-colors"
      style={{ color: isGreen ? "#22c55e" : undefined }}
      title={alreadyAdded ? "Remove from Next Moves" : "Add to Next Moves"}
    >
      {isGreen
        ? <Check className="w-3.5 h-3.5" />
        : <Plus className="w-3.5 h-3.5" style={{ color: "hsl(0 0% 70%)" }} />
      }
    </button>
  );
};

interface Props {
  items: FeedbackItem[];
  activeItemId: string | null;
  onItemClick: (item: FeedbackItem) => void;
  onAddToDo?: (item: FeedbackItem) => void;
  onRemoveToDo?: (item: FeedbackItem) => void;
  todoItemIds?: Set<string>;
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
  analysisId?: string | null;
}

const FeedbackTimeline = ({ items, activeItemId, onItemClick, onAddToDo, onRemoveToDo, todoItemIds, scrollContainerRef, analysisId }: Props) => {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const isDark = useMemo(() => typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark", []);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (!activeItemId) return;
    const el = itemRefs.current.get(activeItemId);
    if (!el) return;
    const scrollParent = scrollContainerRef?.current;
    if (scrollParent) {
      const elTop = el.offsetTop;
      const elHeight = el.offsetHeight;
      const containerHeight = scrollParent.clientHeight;
      scrollParent.scrollTo({ top: elTop - containerHeight / 2 + elHeight / 2, behavior: "smooth" });
    } else {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeItemId, scrollContainerRef]);

  const sorted = [...items].sort((a, b) => a.timestampSec - b.timestampSec);

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <AudioLines className="w-6 h-6 text-foreground/15 animate-pulse" />
        <p className="text-[10px] text-foreground/30" style={{ fontFamily: MONO }}>Analyzing…</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div ref={containerRef} className="space-y-0">
        {sorted.map((item, idx) => {
          const isActive = activeItemId === item.id;
          const alreadyAdded = todoItemIds?.has(item.id);
          const accent = modeAccent[item.mode] || defaultAccent;
          const sev = severityConfig[item.severity] || severityConfig.low;

          return (
            <div
              key={item.id}
              ref={(el) => {
                if (el) itemRefs.current.set(item.id, el);
                else itemRefs.current.delete(item.id);
              }}
              onClick={() => onItemClick(item)}
              className={cn("group cursor-pointer")}
              style={{
                opacity: 0,
                transform: "translateY(10px)",
                animation: `card-enter 0.3s ease forwards ${idx * 0.08}s`,
                scrollMarginTop: 32,
                scrollMarginBottom: 160,
                background: isActive
                  ? accent.bg
                  : isDark
                    ? "#1a1a1a"
                    : "#fafaf8",
                border: `1px solid ${isActive ? accent.border : isDark ? "#2a2a2a" : "hsl(0 0% 91%)"}`,
                borderLeft: `3px solid ${isActive ? accent.border : isDark ? "rgba(232,232,224,0.3)" : "rgba(17,17,17,0.3)"}`,
                borderRadius: 8,
                padding: 20,
                marginBottom: 12,
                transition: "background 0.15s ease, box-shadow 0.2s, border-color 0.15s",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.boxShadow = isDark ? "0 2px 8px rgba(0,0,0,0.2)" : "0 2px 8px rgba(0,0,0,0.06)";
                el.style.background = isActive ? accent.bg : isDark ? "#1e1e1e" : "#f5f5f2";
                el.style.borderLeftColor = isDark ? "#e8e8e0" : "#111";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.boxShadow = "none";
                el.style.background = isActive ? accent.bg : isDark ? "#1a1a1a" : "#fafaf8";
                el.style.borderLeftColor = isActive ? accent.border : isDark ? "rgba(232,232,224,0.3)" : "rgba(17,17,17,0.3)";
              }}
            >
              {/* ═══ CARD HEADER ROW ═══ */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Index */}
                <span
                  style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: isDark ? "#555" : "#bbb", letterSpacing: "0.02em" }}
                >
                  {String(idx + 1).padStart(2, "0")}
                </span>

                {/* Timestamp */}
                <span
                  className="cursor-pointer transition-colors duration-150"
                  style={{
                    fontFamily: MONO,
                    fontSize: 11,
                    color: isDark ? "#888" : "hsl(0 0% 50%)",
                    backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                    padding: "1px 6px",
                    borderRadius: 3,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
                  }}
                >
                  {formatTime(item.timestampSec)}
                </span>

                {/* Severity badge */}
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    padding: "3px 8px",
                    borderRadius: 4,
                    backgroundColor: item.severity === "high" ? "#fff0f0" : item.severity === "med" ? "#fff8e6" : "#f5f5f5",
                    color: item.severity === "high" ? "#cc0000" : item.severity === "med" ? "#996600" : "#666",
                    textTransform: "uppercase" as const,
                  }}
                >
                  {sev.label}
                </span>

                {/* Mode tag */}
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: "0.06em",
                    padding: "3px 8px",
                    borderRadius: 3,
                    backgroundColor: "#f0f0f0",
                    color: "#333",
                    textTransform: "uppercase" as const,
                  }}
                >
                  {accent.tag}
                </span>

                {/* Vote buttons */}
                {analysisId && (
                  <div className="shrink-0 ml-auto">
                    <FeedbackVoteButtons
                      analysisId={analysisId}
                      priorityIndex={idx}
                      userId={user?.id}
                      initialUserVote={null}
                    />
                  </div>
                )}

                {/* Hover actions */}
                <div className={cn("flex items-center gap-1.5 shrink-0", !analysisId && "ml-auto", !alreadyAdded && "opacity-0 group-hover:opacity-100 transition-opacity")}>
                  {onAddToDo && (
                    <ToDoToggleButton
                      item={item}
                      alreadyAdded={!!alreadyAdded}
                      onAdd={onAddToDo}
                      onRemove={onRemoveToDo}
                    />
                  )}
                  <CopyFixInline item={item} />
                </div>
              </div>

              {/* ═══ TITLE ═══ */}
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: isDark ? "#e8e8e0" : undefined,
                  margin: "8px 0",
                  lineHeight: 1.4,
                }}
                className={isDark ? "" : "text-foreground"}
              >
                {item.title}
              </h3>

              {/* ═══ DESCRIPTION ═══ */}
              {item.observation && (
                <p
                  style={{
                    fontSize: 14,
                    lineHeight: 1.7,
                    color: isDark ? "#2a2520" : "hsl(0 0% 33%)",
                    fontFamily: MONO,
                  }}
                >
                  {item.observation}
                </p>
              )}

              {/* ═══ FIX BLOCK ═══ */}
              {item.fix && (
                <div
                  style={{
                    marginTop: 12,
                    backgroundColor: isDark ? "#141414" : "#f4f4f2",
                    borderLeft: isDark ? "3px solid #e8e8e0" : "3px solid #111",
                    borderRadius: "0 6px 6px 0",
                    padding: "12px 16px",
                  }}
                >
                  <div
                    style={{
                      fontFamily: MONO,
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.18em",
                      color: "#888",
                      marginBottom: 6,
                      textTransform: "uppercase" as const,
                    }}
                  >
                    {item.mode === "musical" ? "ARR" : item.mode === "perception" ? "SYS" : "FIX"}
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      lineHeight: 1.6,
                      color: isDark ? "#aaa" : "hsl(0 0% 27%)",
                      fontFamily: MONO,
                    }}
                  >
                    {item.fix}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
};

export default FeedbackTimeline;
