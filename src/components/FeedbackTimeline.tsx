import { useRef, useEffect, useState } from "react";
import { Copy, Check, Plus } from "lucide-react";
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
      className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/40 hover:text-foreground/60 transition-colors shrink-0"
      title="Copy fix to clipboard"
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
    </button>
  );
};

interface Props {
  items: FeedbackItem[];
  activeItemId: string | null;
  onItemClick: (item: FeedbackItem) => void;
  onAddToDo?: (item: FeedbackItem) => void;
  todoItemIds?: Set<string>;
}

const FeedbackTimeline = ({ items, activeItemId, onItemClick, onAddToDo, todoItemIds }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (!activeItemId) return;
    const el = itemRefs.current.get(activeItemId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeItemId]);

  const sorted = [...items].sort((a, b) => a.timestampSec - b.timestampSec);

  return (
    <div ref={containerRef} className="space-y-2">
      {sorted.map((item) => {
        const isActive = activeItemId === item.id;
        const alreadyAdded = todoItemIds?.has(item.id);

        return (
          <button
            key={item.id}
            ref={(el) => {
              if (el) itemRefs.current.set(item.id, el as unknown as HTMLDivElement);
              else itemRefs.current.delete(item.id);
            }}
            onClick={() => onItemClick(item)}
            style={{ scrollMarginTop: 80, scrollMarginBottom: 80 }}
            className={`w-full text-left rounded-xl border p-3.5 md:p-4 transition-all duration-200 ${
              isActive
                ? "border-foreground/15 bg-secondary/50"
                : "border-border-subtle bg-background hover:border-foreground/10 hover:bg-secondary/20"
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Time badge + severity dot */}
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
                  {formatTime(item.timestampSec)}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold tracking-tight text-foreground leading-snug">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-1.5 shrink-0">
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
                            : "text-muted-foreground/40 hover:text-foreground/60"
                        }`}
                        title={alreadyAdded ? "Already in To-Do" : "Add to To-Do list"}
                      >
                        {alreadyAdded ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Plus className="w-3 h-3" />
                        )}
                        <span className="hidden sm:inline">{alreadyAdded ? "Added" : "To-Do"}</span>
                      </button>
                    )}
                    <CopyFixInline item={item} />
                  </div>
                </div>
                {item.observation && (
                  <p className="text-[13px] text-foreground/55 leading-relaxed mt-1" style={{ lineHeight: 1.5 }}>
                    {item.observation}
                  </p>
                )}
                {item.fix && (
                  <div className="mt-2">
                    <p className="text-[13px] text-foreground/70 leading-relaxed" style={{ lineHeight: 1.5 }}>
                      <span
                        className="text-muted-foreground uppercase tracking-wider mr-2"
                        style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: 10,
                        }}
                      >
                        {item.mode === "musical" ? "Arrange" : item.mode === "perception" ? "System" : "Fix"}
                      </span>
                      {item.fix}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default FeedbackTimeline;
