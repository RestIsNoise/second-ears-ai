import { useRef, useEffect, useState } from "react";
import { Copy, Check } from "lucide-react";
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
  low: "bg-foreground/20",
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
      className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0"
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
}

const FeedbackTimeline = ({ items, activeItemId, onItemClick }: Props) => {
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
    <div ref={containerRef} className="space-y-3.5">
      {sorted.map((item) => {
        const isActive = activeItemId === item.id;

        return (
          <button
            key={item.id}
            ref={(el) => {
              if (el) itemRefs.current.set(item.id, el as unknown as HTMLDivElement);
              else itemRefs.current.delete(item.id);
            }}
            onClick={() => onItemClick(item)}
            style={{ scrollMarginTop: 80, scrollMarginBottom: 80 }}
            className={`w-full text-left rounded-xl border p-5 md:p-7 transition-colors duration-200 ${
              isActive
                ? "border-foreground/20 bg-secondary/40"
                : "border-border-subtle bg-background hover:border-foreground/10"
            }`}
          >
            <div className="flex items-start gap-4">
              {/* Time badge + severity dot */}
              <div className="flex flex-col items-center gap-1 pt-[3px] shrink-0">
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
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold tracking-tight text-foreground leading-snug">
                    {item.title}
                  </h3>
                  <CopyFixInline item={item} />
                </div>
                {item.observation && (
                  <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                    {item.observation}
                  </p>
                )}
                {item.fix && (
                  <div className="mt-3">
                    <p className="text-sm text-foreground/80 leading-relaxed">
                      <span
                        className="text-muted-foreground uppercase tracking-wider mr-2"
                        style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: 10,
                        }}
                      >
                        Fix
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
