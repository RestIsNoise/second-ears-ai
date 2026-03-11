import { useRef, useEffect, useState } from "react";
import { Copy, Check, Plus, AudioLines } from "lucide-react";
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
          const sev = severityConfig[item.severity] || severityConfig.low;

          return (
            <div
              key={item.id}
              ref={(el) => {
                if (el) itemRefs.current.set(item.id, el);
                else itemRefs.current.delete(item.id);
              }}
              onClick={() => onItemClick(item)}
              className="group relative w-full text-left cursor-pointer transition-all duration-100"
              style={{
                scrollMarginTop: 32,
                scrollMarginBottom: 160,
              }}
            >
              {/* ═══ EVENT HEADER STRIP ═══ */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 16px",
                    backgroundColor: isActive ? accent.bg : "hsl(var(--panel-header))",
                    borderLeft: `3px solid ${accent.border}`,
                    borderBottom: "1px solid hsl(var(--foreground) / 0.04)",
                    borderTop: idx === 0 ? "none" : "1px solid hsl(var(--foreground) / 0.06)",
                  }}
                >
                  {/* Index */}
                  <span
                    className="text-foreground/22 font-medium shrink-0"
                    style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.02em" }}
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </span>

                  {/* Timestamp */}
                  <span
                    className="text-foreground/55 tabular-nums font-medium shrink-0"
                    style={{
                      fontFamily: MONO,
                      fontSize: 11,
                      backgroundColor: "hsl(var(--foreground) / 0.04)",
                      padding: "2px 5px",
                      borderRadius: 2,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {formatTime(item.timestampSec)}
                  </span>

                {/* Severity LED + label */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div
                    className="w-[7px] h-[7px] rounded-full"
                    style={{
                      backgroundColor: sev.color,
                      boxShadow: sev.glow,
                    }}
                  />
                  <span
                    className="font-medium uppercase tracking-[0.04em]"
                    style={{
                      fontFamily: MONO,
                      fontSize: 10,
                      color: sev.color,
                    }}
                  >
                    {sev.label}
                  </span>
                </div>

                {/* Vote buttons — always visible in header */}
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

                {/* Mode tag */}
                <span
                  className={cn("text-foreground/25 font-medium uppercase tracking-[0.06em] shrink-0", !analysisId && "ml-auto")}
                  style={{ fontFamily: MONO, fontSize: 11 }}
                >
                  {accent.tag}
                </span>

                {/* Hover actions */}
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  {onAddToDo && (
                    <button
                      onClick={(e) => { e.stopPropagation(); if (!alreadyAdded) onAddToDo(item); }}
                      disabled={alreadyAdded}
                      className={`inline-flex items-center text-[10px] uppercase tracking-wider font-medium transition-colors shrink-0 p-0.5 ${
                        alreadyAdded ? "text-foreground/15 cursor-default" : "text-foreground/30 hover:text-foreground/60"
                      }`}
                      style={{ fontFamily: MONO }}
                    >
                      {alreadyAdded ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    </button>
                  )}
                  <CopyFixInline item={item} />
                </div>
              </div>

              {/* ═══ ISSUE BODY ═══ */}
              <div
                style={{
                  padding: "16px 20px 20px 24px",
                  borderLeft: `3px solid ${isActive ? accent.border : "hsl(var(--foreground) / 0.04)"}`,
                  backgroundColor: isActive ? accent.bg : "transparent",
                  transition: "background-color 0.1s, border-color 0.15s",
                }}
              >
                {/* Title */}
                <h3
                  className="text-[17px] font-medium tracking-tight text-foreground/85 leading-snug"
                  title={item.title}
                >
                  {item.title}
                </h3>

                {/* Observation */}
                {item.observation && <ClampedObservation text={item.observation} />}

                {/* ── FIX / ACTION BLOCK ── */}
                {item.fix && (
                  <div
                    className="mt-4"
                    style={{
                      backgroundColor: "hsl(var(--panel-bg))",
                      border: "1px solid hsl(var(--foreground) / 0.05)",
                      borderLeft: `2px solid ${accent.border}`,
                      borderRadius: "0 2px 2px 0",
                      padding: "12px 14px",
                      boxShadow: "inset 0 1px 2px hsl(var(--panel-inset))",
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="shrink-0 mt-[2px] inline-flex items-center"
                        style={{
                          fontFamily: MONO,
                          fontSize: 11,
                          fontWeight: 600,
                          letterSpacing: "0.06em",
                          lineHeight: 1,
                          padding: "3px 7px",
                          backgroundColor: accent.border,
                          color: "hsl(0 0% 100%)",
                          borderRadius: 1,
                        }}
                      >
                        {item.mode === "musical" ? "ARR" : item.mode === "perception" ? "SYS" : "FIX"}
                      </span>
                      <p
                        className="text-[15px] text-foreground/65"
                        style={{ lineHeight: 1.75, fontFamily: MONO }}
                      >
                        {item.fix}
                      </p>
                    </div>
                  </div>
                )}

                {/* Vote buttons */}
                {analysisId && (
                  <div className="mt-1.5">
                    <FeedbackVoteButtons
                      analysisId={analysisId}
                      priorityIndex={sorted.indexOf(item)}
                      userId={user?.id}
                      initialUserVote={null}
                    />
                  </div>
                )}
              </div>

              {/* Bottom separator — heavier groove between events */}
              <div
                style={{
                  height: 2,
                  background: "linear-gradient(to bottom, hsl(var(--foreground) / 0.06), hsl(0 0% 100% / 0.02))",
                }}
              />
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
};

export default FeedbackTimeline;
