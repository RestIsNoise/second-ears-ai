import { useRef, useEffect, useState } from "react";
import { Copy, Check, Plus, AudioLines, ChevronDown } from "lucide-react";
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
const modeAccent: Record<string, { border: string; bg: string; text: string }> = {
  technical: {
    border: "hsl(35 55% 55%)",
    bg: "hsl(35 40% 50% / 0.08)",
    text: "hsl(35 45% 45%)",
  },
  musical: {
    border: "hsl(215 45% 55%)",
    bg: "hsl(215 35% 50% / 0.08)",
    text: "hsl(215 40% 48%)",
  },
  perception: {
    border: "hsl(270 35% 55%)",
    bg: "hsl(270 28% 50% / 0.08)",
    text: "hsl(270 30% 48%)",
  },
};

const defaultAccent = modeAccent.technical;

/* ── Observation with 3-line clamp + expand ── */
const ClampedObservation = ({ text }: { text: string }) => {
  const [expanded, setExpanded] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);
  const [isClamped, setIsClamped] = useState(false);

  useEffect(() => {
    const el = textRef.current;
    if (el) setIsClamped(el.scrollHeight > el.clientHeight + 2);
  }, [text]);

  return (
    <div>
      <p
        ref={textRef}
        className="text-[12px] text-foreground/55 mt-1"
        style={{
          fontFamily: MONO,
          lineHeight: 1.55,
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: expanded ? "unset" : 3,
          overflow: expanded ? "visible" : "hidden",
        }}
      >
        {text}
      </p>
      {isClamped && !expanded && (
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
          className="inline-flex items-center gap-0.5 mt-0.5 text-[9px] text-foreground/30 hover:text-foreground/55 transition-colors uppercase tracking-wider font-bold"
          style={{ fontFamily: MONO }}
        >
          <ChevronDown className="w-2.5 h-2.5" />
          more
        </button>
      )}
    </div>
  );
};

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
      className="inline-flex items-center gap-1 text-[9px] text-foreground/25 hover:text-foreground/60 transition-colors shrink-0 uppercase tracking-wider font-bold"
      style={{ fontFamily: MONO }}
      title="Copy"
    >
      {copied ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
    </button>
  );
};

interface Props {
  items: FeedbackItem[];
  activeItemId: string | null;
  onItemClick: (item: FeedbackItem) => void;
  onAddToDo?: (item: FeedbackItem) => void;
  todoItemIds?: Set<string>;
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
  analysisId?: string | null;
}

const FeedbackTimeline = ({ items, activeItemId, onItemClick, onAddToDo, todoItemIds, scrollContainerRef, analysisId }: Props) => {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
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

          return (
            <div
              key={item.id}
              ref={(el) => {
                if (el) itemRefs.current.set(item.id, el);
                else itemRefs.current.delete(item.id);
              }}
              onClick={() => onItemClick(item)}
              className="group relative w-full text-left cursor-pointer transition-colors duration-100"
              style={{
                scrollMarginTop: 32,
                scrollMarginBottom: 160,
                padding: "8px 10px",
                borderLeft: `3px solid ${accent.border}`,
                borderBottom: "1px solid hsl(var(--foreground) / 0.05)",
                backgroundColor: isActive ? accent.bg : "transparent",
                boxShadow: isActive ? `inset 0 0 0 1px hsl(var(--foreground) / 0.06)` : "none",
              }}
            >
              {/* Hover actions — top right */}
              <div className="absolute top-1.5 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {onAddToDo && (
                  <button
                    onClick={(e) => { e.stopPropagation(); if (!alreadyAdded) onAddToDo(item); }}
                    disabled={alreadyAdded}
                    className={`inline-flex items-center gap-0.5 text-[8px] uppercase tracking-wider font-bold transition-colors shrink-0 ${
                      alreadyAdded ? "text-foreground/15 cursor-default" : "text-foreground/30 hover:text-foreground/60"
                    }`}
                    style={{ fontFamily: MONO }}
                  >
                    {alreadyAdded ? <Check className="w-2.5 h-2.5" /> : <Plus className="w-2.5 h-2.5" />}
                  </button>
                )}
                <CopyFixInline item={item} />
              </div>

              {/* Index + timestamp header line */}
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-foreground/20 font-bold"
                  style={{ fontFamily: MONO, fontSize: 8, letterSpacing: "0.04em" }}
                >
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span
                  className="text-foreground/40 tabular-nums font-bold"
                  style={{ fontFamily: MONO, fontSize: 9 }}
                >
                  @{formatTime(item.timestampSec)}
                </span>
                {/* Severity pip */}
                <div
                  className="w-[5px] h-[5px] rounded-full"
                  style={{
                    backgroundColor: item.severity === "high" ? "hsl(0 55% 50%)" : item.severity === "med" ? "hsl(35 70% 55%)" : "hsl(var(--foreground) / 0.15)",
                  }}
                />
              </div>

              {/* Title */}
              <h3
                className="text-[13px] font-bold tracking-tight text-foreground/85 leading-snug pr-10"
                title={item.title}
              >
                {item.title}
              </h3>

              {/* Observation */}
              {item.observation && <ClampedObservation text={item.observation} />}

              {/* FIX block */}
              {item.fix && (
                <>
                  <div
                    className="my-1.5"
                    style={{
                      height: 1,
                      background: `linear-gradient(to right, ${accent.border}40, transparent)`,
                    }}
                  />
                  <div className="flex items-start gap-1.5">
                    <span
                      className="shrink-0 mt-[1px] inline-flex items-center"
                      style={{
                        fontFamily: MONO,
                        fontSize: 8,
                        fontWeight: 800,
                        letterSpacing: "0.06em",
                        lineHeight: 1,
                        padding: "2px 5px",
                        backgroundColor: accent.border,
                        color: "hsl(0 0% 100%)",
                        borderRadius: 2,
                      }}
                    >
                      {item.mode === "musical" ? "ARR" : item.mode === "perception" ? "SYS" : "FIX"}
                    </span>
                    <p
                      className="text-[11px] text-foreground/65"
                      style={{ lineHeight: 1.5, fontFamily: MONO }}
                    >
                      {item.fix}
                    </p>
                  </div>
                </>
              )}

              {/* Vote buttons */}
              {analysisId && (
                <div className="mt-1">
                  <FeedbackVoteButtons
                    analysisId={analysisId}
                    priorityIndex={sorted.indexOf(item)}
                    userId={user?.id}
                    initialUserVote={null}
                  />
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
