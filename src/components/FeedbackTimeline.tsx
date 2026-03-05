import { useRef, useEffect, useState } from "react";
import { Copy, Check, Plus, AudioLines } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { FeedbackItem } from "@/types/feedback";

const formatTime = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const severityDot: Record<string, string> = {
  high: "bg-foreground/70",
  med: "bg-foreground/40",
  low: "bg-foreground/25",
};

/** Left border color by mode — technical=amber, structural/musical=blue, perceptual=purple */
const modeBorderColor: Record<string, string> = {
  technical: "border-l-amber-400",
  musical: "border-l-blue-400",
  perception: "border-l-purple-400",
};

const CopyFixInline = ({ item }: { item: FeedbackItem }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = [
      item.title,
      item.observation ? `Why: ${item.observation}` : "",
      item.fix ? `Fix: ${item.fix}` : "",
    ].filter(Boolean).join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({ title: "Copied", duration: 1500 });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Copy failed", variant: "destructive", duration: 1500 });
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/50 hover:text-foreground/70 transition-colors shrink-0"
      title="Copy fix to clipboard"
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      <span>{copied ? "Copied" : "Copy"}</span>
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
}

const FeedbackTimeline = ({ items, activeItemId, onItemClick, onAddToDo, todoItemIds, scrollContainerRef }: Props) => {
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
      const scrollTarget = elTop - containerHeight / 2 + elHeight / 2;
      scrollParent.scrollTo({ top: scrollTarget, behavior: "smooth" });
    } else {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeItemId, scrollContainerRef]);

  const sorted = [...items].sort((a, b) => a.timestampSec - b.timestampSec);

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <AudioLines className="w-8 h-8 text-muted-foreground/30 animate-pulse" />
        <p className="text-sm text-muted-foreground/50">Analyzing your track…</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-3">
      {sorted.map((item) => {
        const isActive = activeItemId === item.id;
        const alreadyAdded = todoItemIds?.has(item.id);
        const borderColor = modeBorderColor[item.mode] || "border-l-foreground/20";

        return (
          <div
            key={item.id}
            ref={(el) => {
              if (el) itemRefs.current.set(item.id, el);
              else itemRefs.current.delete(item.id);
            }}
            onClick={() => onItemClick(item)}
            style={{ scrollMarginTop: 32, scrollMarginBottom: 160 }}
            className={`group relative w-full text-left rounded-lg border-l-2 ${borderColor} border border-border-subtle p-4 transition-all duration-200 cursor-pointer ${
              isActive
                ? "bg-secondary/50 border-r-foreground/10 border-t-foreground/10 border-b-foreground/10"
                : "bg-background hover:bg-secondary/20"
            }`}
          >
            {/* Hover-only action buttons — top right */}
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onAddToDo && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!alreadyAdded) onAddToDo(item);
                  }}
                  disabled={alreadyAdded}
                  className={`inline-flex items-center gap-0.5 text-[10px] transition-colors shrink-0 ${
                    alreadyAdded
                      ? "text-muted-foreground/30 cursor-default"
                      : "text-muted-foreground/50 hover:text-foreground/70"
                  }`}
                  title={alreadyAdded ? "Already in To-Do" : "Add to To-Do list"}
                >
                  {alreadyAdded ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                  <span>{alreadyAdded ? "Added" : "To-Do"}</span>
                </button>
              )}
              <CopyFixInline item={item} />
            </div>

            <div className="flex items-start gap-3">
              {/* Timestamp column */}
              <div className="flex flex-col items-center gap-1 pt-0.5 shrink-0">
                <div className={`w-1.5 h-1.5 rounded-full ${severityDot[item.severity] || "bg-foreground/20"}`} />
                <span
                  className="text-muted-foreground tabular-nums"
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 11,
                    letterSpacing: "0.02em",
                  }}
                >
                  @{formatTime(item.timestampSec)}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pr-12">
                <h3
                  className="text-[15px] font-semibold tracking-tight text-foreground leading-snug truncate max-w-[28ch]"
                  title={item.title}
                >
                  {item.title}
                </h3>
                {item.observation && (
                  <p className="text-[13px] text-foreground/55 mt-1.5" style={{ lineHeight: 1.6 }}>
                    {item.observation}
                  </p>
                )}
                {item.fix && (
                  <div className="mt-2.5 flex items-start gap-2">
                    <span
                      className="shrink-0 mt-0.5 inline-flex items-center rounded-full bg-foreground text-background px-2 py-0.5"
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 9,
                        letterSpacing: "0.06em",
                        lineHeight: 1,
                      }}
                    >
                      {item.mode === "musical" ? "ARRANGE" : item.mode === "perception" ? "SYSTEM" : "FIX"}
                    </span>
                    <p className="text-[13px] text-foreground/70" style={{ lineHeight: 1.6 }}>
                      {item.fix}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FeedbackTimeline;
