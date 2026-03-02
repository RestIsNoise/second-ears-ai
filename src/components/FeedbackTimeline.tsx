import { useRef, useEffect } from "react";
import type { FeedbackItem } from "@/types/feedback";

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const severityDot: Record<string, string> = {
  high: "bg-foreground/70",
  med: "bg-foreground/40",
  low: "bg-foreground/20",
};

interface Props {
  items: FeedbackItem[];
  activeItemId: string | null;
  onItemClick: (item: FeedbackItem) => void;
}

const FeedbackTimeline = ({ items, activeItemId, onItemClick }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Auto-scroll to active item
  useEffect(() => {
    if (!activeItemId) return;
    const el = itemRefs.current.get(activeItemId);
    if (el) {
      const rect = el.getBoundingClientRect();
      const targetY = window.innerHeight - 120;
      const scrollBy = rect.top - targetY;
      if (Math.abs(scrollBy) > 10) {
        window.scrollBy({ top: scrollBy, behavior: "smooth" });
      }
    }
  }, [activeItemId]);

  const sorted = [...items].sort((a, b) => a.timestampSec - b.timestampSec);

  return (
    <div ref={containerRef} className="space-y-3 pb-[280px] md:pb-[220px]">
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
            className={`w-full text-left rounded-xl border p-6 md:p-8 transition-colors duration-200 ${
              isActive
                ? "border-foreground/20 bg-secondary/40"
                : "border-border-subtle bg-background hover:border-foreground/10"
            }`}
          >
            <div className="flex items-start gap-4">
              {/* Time badge + severity dot */}
              <div className="flex flex-col items-center gap-1.5 pt-0.5 shrink-0">
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
              <div className="flex-1 min-w-0 space-y-2">
                <h3 className="text-sm font-semibold tracking-tight text-foreground leading-snug">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.observation}
                </p>
                {item.fix && (
                  <div className="pt-1">
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
