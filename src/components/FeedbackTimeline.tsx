import { useRef, useEffect } from "react";
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

const severityDot: Record<string, string> = {
  high: "bg-foreground/70",
  med: "bg-foreground/40",
  low: "bg-foreground/25",
};

/** Left border color by mode */
const modeBorderColor: Record<string, string> = {
  technical: "border-l-amber-400",
  musical: "border-l-blue-400",
  perception: "border-l-purple-400",
};

const MONO = "'IBM Plex Mono', monospace";

/* ── Observation with 3-line clamp + expand ── */
const ClampedObservation = ({ text }: { text: string }) => {
  const [expanded, setExpanded] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);
  const [isClamped, setIsClamped] = useState(false);

  useEffect(() => {
    const el = textRef.current;
    if (el) {
      setIsClamped(el.scrollHeight > el.clientHeight + 2);
    }
  }, [text]);

  return (
    <div>
      <p
        ref={textRef}
        className="text-[13px] text-foreground/60 mt-2 max-w-[45ch]"
        style={{
          lineHeight: 1.65,
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
          className="inline-flex items-center gap-0.5 mt-1 text-[11px] text-foreground/40 hover:text-foreground/65 transition-colors"
        >
          <ChevronDown className="w-3 h-3" />
          Expand
        </button>
      )}
    </div>
  );
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
    <TooltipProvider>
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
              className={`group relative w-full text-left rounded-lg border-l-[3px] ${borderColor} border border-border/50 p-4 transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-secondary/60 border-r-foreground/8 border-t-foreground/8 border-b-foreground/8 shadow-sm"
                  : "bg-card/60 hover:bg-secondary/30"
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
                <div className="flex flex-col items-center gap-1.5 pt-0.5 shrink-0">
                  <div className={`w-2 h-2 rounded-full ${severityDot[item.severity] || "bg-foreground/20"}`} />
                  <span
                    className="text-foreground/50 tabular-nums"
                    style={{
                      fontFamily: MONO,
                      fontSize: 11,
                      letterSpacing: "0.01em",
                    }}
                  >
                    @{formatTime(item.timestampSec)}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-12 max-w-[50ch]">
                  <h3
                    className="text-[14px] font-semibold tracking-tight text-foreground/90 leading-snug"
                    title={item.title}
                  >
                    {item.title}
                  </h3>

                  {/* Observation — clamped to 3 lines */}
                  {item.observation && (
                    <ClampedObservation text={item.observation} />
                  )}

                  {/* FIX block — always visible, stronger separator */}
                  {item.fix && (
                    <>
                      <div
                        className="my-3"
                        style={{ height: 2, background: "linear-gradient(to right, hsl(var(--foreground) / 0.08), hsl(var(--foreground) / 0.03), transparent)" }}
                      />
                      <div className="flex items-start gap-2">
                        <span
                          className="shrink-0 mt-0.5 inline-flex items-center rounded px-2 py-[3px]"
                          style={{
                            fontFamily: MONO,
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: "0.05em",
                            lineHeight: 1,
                            backgroundColor: "hsl(var(--foreground) / 0.9)",
                            color: "hsl(var(--background))",
                          }}
                        >
                          {item.mode === "musical" ? "ARRANGE" : item.mode === "perception" ? "SYSTEM" : "FIX"}
                        </span>
                        <p className="text-[13px] text-foreground/70 max-w-[42ch]" style={{ lineHeight: 1.65 }}>
                          {item.fix}
                        </p>
                      </div>
                    </>
                  )}

                  {/* Vote buttons */}
                  {analysisId && (
                    <div className="mt-2">
                      <FeedbackVoteButtons
                        analysisId={analysisId}
                        priorityIndex={sorted.indexOf(item)}
                        userId={user?.id}
                        initialUserVote={null}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
};

export default FeedbackTimeline;
