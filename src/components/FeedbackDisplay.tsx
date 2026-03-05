import { useState, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Check, ChevronDown, FileDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import WaveformPlayer from "@/components/WaveformPlayer";
import type { WaveformPlayerHandle } from "@/components/WaveformPlayer";
import FeedbackTimeline from "@/components/FeedbackTimeline";
import ShareBlock from "@/components/ShareBlock";
import TechnicalMetrics from "@/components/TechnicalMetrics";
import ToDoPanel from "@/components/ToDoPanel";
import type { FeedbackResult } from "@/pages/Analyze";
import type { NormalizedFeedback, NormalizedTimelineItem } from "@/lib/normalizeFeedback";
import type { FeedbackItem, WaveformMarker, ToDoItem } from "@/types/feedback";
import { exportAnalysisPdf } from "@/lib/exportPdf";

const modeLabels: Record<string, string> = {
  technical: "Technical",
  musical: "Musical",
  perception: "Perception",
};

const modeWhatWorksLabel: Record<string, string> = {
  technical: "What works",
  musical: "What lands",
  perception: "What translates",
};

const modeFixOneLabel: Record<string, string> = {
  technical: "If you fix only one thing today",
  musical: "Focus here",
  perception: "Urgent fix",
};

/** Small copy button component */
const CopyFixButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
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
      className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/40 hover:text-foreground/60 transition-colors"
      title="Copy fix to clipboard"
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      <span>{copied ? "Copied" : "Copy fix"}</span>
    </button>
  );
};

/** Full Analysis card text — hard cut at 2 sentences */
const AnalysisCardText = ({ text }: { text: string }) => {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const displayText = sentences.slice(0, 2).join("").trim();

  return (
    <p className="text-[13px] text-foreground/55 max-w-[70ch]" style={{ lineHeight: 1.6 }}>
      {displayText}
    </p>
  );
};

/** Collapsible section wrapper */
const CollapsibleSection = ({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between group mb-5"
      >
        <h2 className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase">
          {title}
        </h2>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground/40 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && children}
    </section>
  );
};

/** Convert normalized timeline items to internal FeedbackItems */
function toFeedbackItems(items: NormalizedTimelineItem[], mode: string): FeedbackItem[] {
  return items.map((item, i) => ({
    id: `tl-${i}`,
    timestampSec: item.timestampSec >= 0 ? item.timestampSec : 0,
    title: item.title,
    observation: item.description,
    fix: item.actionText,
    severity: (i === 0 ? "high" : i < 3 ? "med" : "low") as "high" | "med" | "low",
    mode,
  }));
}

const FeedbackDisplay = ({
  result,
  onReset,
  audioFile,
}: {
  result: FeedbackResult;
  onReset: () => void;
  audioFile?: File;
}) => {
  const n = result.normalized;
  const { mode } = n;
  const waveformRef = useRef<WaveformPlayerHandle>(null);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [todoItems, setTodoItems] = useState<ToDoItem[]>([]);

  // Convert normalized timeline to FeedbackItems
  const rawTimelineItems = useMemo(() => toFeedbackItems(n.timelineItems, mode), [n.timelineItems, mode]);

  const timelineItems = useMemo(() => {
    const withTs = rawTimelineItems.filter((i) => i.timestampSec > 0);
    if (withTs.length > 0) return withTs;
    if (audioDuration <= 0 || rawTimelineItems.length === 0) return rawTimelineItems;
    const count = rawTimelineItems.length;
    const startPct = 0.15;
    const endPct = 0.90;
    const step = count > 1 ? (endPct - startPct) / (count - 1) : 0;
    return rawTimelineItems.map((item, i) => ({
      ...item,
      id: `auto-${i}`,
      timestampSec: audioDuration * (startPct + step * i),
    }));
  }, [rawTimelineItems, audioDuration]);

  const hasTimeline = timelineItems.length > 0;

  const markers: WaveformMarker[] = useMemo(() => {
    return timelineItems
      .filter((i) => i.timestampSec > 0)
      .map((item) => ({
        id: item.id,
        time: item.timestampSec,
        label: item.title,
        severity: item.severity,
      }));
  }, [timelineItems]);

  // To-Do management
  const todoSourceIds = useMemo(() => new Set(todoItems.filter(t => t.sourceId).map(t => t.sourceId!)), [todoItems]);

  const handleAddToDoFromFeedback = useCallback((item: FeedbackItem) => {
    const actionText = item.fix || item.title;
    setTodoItems((prev) => [
      ...prev,
      {
        id: `todo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        text: actionText,
        timestampSec: item.timestampSec,
        done: false,
        sourceId: item.id,
      },
    ]);
    toast({ title: "Added to To-Do", duration: 1200 });
  }, []);

  const handleAddToDoNote = useCallback((text: string) => {
    setTodoItems((prev) => [
      ...prev,
      {
        id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        text,
        timestampSec: 0,
        done: false,
      },
    ]);
  }, []);

  const handleToggleToDo = useCallback((id: string) => {
    setTodoItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  }, []);

  const handleToDoItemClick = useCallback((item: ToDoItem) => {
    if (item.timestampSec > 0) {
      waveformRef.current?.seekTo(item.timestampSec);
      const feedbackItem = timelineItems.find((fi) => fi.id === item.sourceId);
      if (feedbackItem) setActiveItemId(feedbackItem.id);
    }
  }, [timelineItems]);

  const handleMarkerClick = useCallback(
    (marker: WaveformMarker) => {
      setActiveItemId(marker.id);
      waveformRef.current?.seekTo(marker.time);
    },
    []
  );

  const handleItemClick = useCallback(
    (item: FeedbackItem) => {
      setActiveItemId(item.id);
      waveformRef.current?.seekTo(item.timestampSec);
    },
    []
  );

  const handleTimeUpdate = useCallback(
    (time: number) => {
      if (timelineItems.length === 0) return;
      let nearest: FeedbackItem | null = null;
      for (const item of timelineItems) {
        if (item.timestampSec <= time + 0.5) {
          nearest = item;
        }
      }
      if (nearest && nearest.id !== activeItemId) {
        setActiveItemId(nearest.id);
      }
    },
    [timelineItems, activeItemId]
  );

  // Release readiness from metrics
  const releaseReadiness = useMemo(() => {
    if (n.releaseStatus) return n.releaseStatus;
    const lufs = n.metrics.integratedLufs;
    const peak = n.metrics.peakDbtp;
    if (lufs !== null && peak !== null) {
      if (lufs >= -14 && lufs <= -9 && peak < -1) return "Ready";
      if ((lufs >= -16 && lufs <= -7) && peak < 0) return "Almost there";
      return "Needs work";
    }
    return null;
  }, [n.releaseStatus, n.metrics]);

  const hasExecutiveSummary = n.topIssue || n.biggestWin || releaseReadiness;

  // Convert normalized metrics to TechnicalMetrics component shape
  const technicalMetrics = useMemo(() => {
    const m = n.metrics;
    const hasAny = Object.values(m).some((v) => v !== null);
    if (!hasAny) return undefined;
    return {
      integrated_lufs: m.integratedLufs ?? undefined,
      short_term_lufs: m.shortTermLufs ?? undefined,
      dynamic_range: m.dynamicRange ?? undefined,
      peak_dbtp: m.peakDbtp ?? undefined,
      stereo_correlation: m.stereoCorrelation ?? undefined,
      crest_factor: m.crestFactor ?? undefined,
      sub_kick_ratio: m.subKickRatio ?? undefined,
    };
  }, [n.metrics]);

  // Full analysis cards by mode
  const fullAnalysisCards = useMemo(() => {
    const fa = n.fullAnalysis;
    if (mode === "musical") {
      return [
        { key: "energyArc", label: "Energy Arc", text: fa.energyArc },
        { key: "sectionContrast", label: "Section Contrast", text: fa.sectionContrast },
        { key: "grooveContinuity", label: "Groove Continuity", text: fa.grooveContinuity },
        { key: "hookClarity", label: "Hook Clarity", text: fa.hookClarity },
      ];
    }
    if (mode === "perception") {
      return [
        { key: "subLowTranslation", label: "Sub & Low Translation", text: fa.subLowTranslation },
        { key: "headroomTransients", label: "Headroom & Transients", text: fa.headroomTransients },
        { key: "stereoFoldDown", label: "Stereo Fold-Down", text: fa.stereoFoldDown },
        { key: "listenerFatigue", label: "Listener Fatigue", text: fa.listenerFatigue },
      ];
    }
    return [
      { key: "mixBalance", label: "Mix Balance", text: fa.mixBalance },
      { key: "dynamics", label: "Dynamics & Loudness", text: fa.dynamics },
      { key: "stereoSpace", label: "Stereo & Space", text: fa.stereoSpace },
      { key: "frequencyBalance", label: "Frequency Balance", text: fa.frequencyBalance },
    ];
  }, [n.fullAnalysis, mode]);

  const hasFullAnalysis = fullAnalysisCards.some((c) => c.text);

  return (
    <div className="animate-fade-up">
      {/* ═══════════════════════════════════════════════════════
          ROW 1 — Full-width: Header + Waveform + Summary
          ═══════════════════════════════════════════════════════ */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="gap-2 text-muted-foreground mb-5"
        >
          <ArrowLeft className="w-4 h-4" /> New analysis
        </Button>

        <div className="space-y-1.5">
          {n.trackName && (
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
                {n.trackName}
              </h1>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportAnalysisPdf(n, releaseReadiness)}
                className="gap-1.5 shrink-0 mt-1"
              >
                <FileDown className="w-4 h-4" />
                Export PDF
              </Button>
            </div>
          )}
          <p className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase">
            {modeLabels[mode]} analysis
          </p>
        </div>
      </div>

      {/* Full-width Waveform */}
      {audioFile && (
        <div className="mt-7 md:mt-8 w-full overflow-hidden">
          <WaveformPlayer
            ref={waveformRef}
            audioFile={audioFile}
            markers={markers}
            activeMarkerId={activeItemId}
            onMarkerClick={handleMarkerClick}
            onTimeUpdate={handleTimeUpdate}
            onDurationReady={setAudioDuration}
          />
          {/* A/B Compare */}
          <div className="flex items-center gap-2.5 mt-3">
            <div className="flex items-center rounded-md border border-border-subtle overflow-hidden">
              <span className="px-2.5 py-1 text-[11px] font-medium text-foreground bg-secondary/60">A</span>
              <span
                className="px-2.5 py-1 text-[11px] text-muted-foreground/40 cursor-not-allowed"
                title="Upload updated bounce to compare"
              >B</span>
            </div>
            <span className="text-[10px] text-muted-foreground/40" title="Upload an updated mix to compare side by side">
              Original · <span className="underline decoration-dotted underline-offset-2 cursor-help">Compare?</span>
            </span>
          </div>
        </div>
      )}

      {/* Response to Your Request (top-level, when focus_response exists) */}
      {n.yourFocus.question && n.yourFocus.response && n.yourFocus.response !== "No direct focus response available for this run." && (
        <section className="mt-7">
          <p className="font-mono-brand text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
            Response to your request
          </p>
          <p className="text-sm text-foreground/60 leading-relaxed max-w-[70ch]" style={{ lineHeight: 1.575 }}>
            {n.yourFocus.response}
          </p>
        </section>
      )}

      {/* Overall Impression */}
      {n.overallImpression && (
        <section className="mt-7">
          <p className="text-lg md:text-xl font-medium leading-relaxed tracking-tight max-w-[70ch]">
            {n.overallImpression}
          </p>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          ROW 2 — 70/30 split: Timeline (left) + Sidebar (right)
          ═══════════════════════════════════════════════════════ */}
      <div className="mt-10 md:mt-12 flex flex-col lg:flex-row gap-8 lg:gap-8 items-start">
        {/* Left column (70%) — timeline feedback cards */}
        <div className="w-full lg:w-[70%] min-w-0">
          {/* Timeline Feedback */}
          {hasTimeline && (
            <section>
              <h2 className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase mb-5">
                Timeline feedback
              </h2>
              <FeedbackTimeline
                items={timelineItems}
                activeItemId={activeItemId}
                onItemClick={handleItemClick}
                onAddToDo={handleAddToDoFromFeedback}
                todoItemIds={todoSourceIds}
              />
            </section>
          )}

          {/* Fallback: Top Priorities without timestamps (when no timeline) */}
          {!hasTimeline && n.timelineItems.length > 0 && (
            <section>
              <h2 className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase mb-5">
                Top priorities
              </h2>
              <div className="space-y-2">
                {n.timelineItems.map((item, i) => {
                  const copyText = `${item.title}\nWhy: ${item.description}\n${item.actionLabel}: ${item.actionText}`;
                  return (
                    <div key={i} className="rounded-xl border border-border-subtle p-4 md:p-5 bg-background">
                      <div className="flex items-start gap-4">
                        <span className="font-mono-brand text-2xl text-muted-foreground/30 font-medium leading-none pt-0.5">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div className="flex-1 max-w-[70ch]">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="text-lg font-semibold tracking-tight">{item.title}</h3>
                            <CopyFixButton text={copyText} />
                          </div>
                          {item.description && (
                            <p className="text-[13px] text-foreground/55 leading-relaxed mt-1.5" style={{ lineHeight: 1.55 }}>{item.description}</p>
                          )}
                          {item.actionText && (
                            <div className="mt-2">
                              <p className="text-[13px] text-foreground/70 leading-relaxed" style={{ lineHeight: 1.55 }}>
                                <span className="font-mono-brand text-[10px] text-muted-foreground uppercase tracking-wider mr-2">{item.actionLabel}</span>
                                {item.actionText}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* Right column (30%) — sticky sidebar: Executive Summary + To-Do + Share */}
        <div className="w-full lg:w-[30%] lg:sticky lg:top-24 space-y-5 order-last" style={{ maxHeight: "calc(100vh - 8rem)" }}>
          {/* Top Issue / Biggest Win mini cards in sidebar */}
          {hasExecutiveSummary && (
            <div className="space-y-3">
              {n.topIssue && (
                <div className="rounded-xl border border-border-subtle bg-background px-4 py-3">
                  <p className="font-mono-brand text-[10px] text-muted-foreground/50 uppercase tracking-wider mb-1">Top issue</p>
                  <p className="text-[13px] font-medium text-foreground">{n.topIssue}</p>
                </div>
              )}
              {n.biggestWin && (
                <div className="rounded-xl border border-border-subtle bg-background px-4 py-3">
                  <p className="font-mono-brand text-[10px] text-muted-foreground/50 uppercase tracking-wider mb-1">Biggest win</p>
                  <p className="text-[13px] font-medium text-foreground">{n.biggestWin}</p>
                </div>
              )}
              {releaseReadiness && (
                <div className="rounded-xl border border-border-subtle bg-background px-4 py-3">
                  <p className="font-mono-brand text-[10px] text-muted-foreground/50 uppercase tracking-wider mb-1">Release</p>
                  <p className="text-[13px] font-medium text-foreground">{releaseReadiness}</p>
                </div>
              )}
            </div>
          )}

          <ToDoPanel
            items={todoItems}
            onToggle={handleToggleToDo}
            onAdd={handleAddToDoNote}
            onItemClick={handleToDoItemClick}
          />
          <ShareBlock />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          ROW 3 — Full-width collapsible sections
          ═══════════════════════════════════════════════════════ */}
      <div className="mt-10 md:mt-14 space-y-6 border-t border-border-subtle pt-8">
        {/* Technical Metrics */}
        {technicalMetrics && (
          <CollapsibleSection title="Technical metrics" defaultOpen={false}>
            <TechnicalMetrics metrics={technicalMetrics} />
          </CollapsibleSection>
        )}

        {/* Full Analysis */}
        {hasFullAnalysis && (
          <CollapsibleSection title="Full analysis" defaultOpen={false}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {fullAnalysisCards.map(({ key, label, text }) =>
                text ? (
                  <div key={key} className="rounded-xl border border-border-subtle p-4 md:p-5 bg-background flex flex-col">
                    <h3 className="text-[15px] font-semibold tracking-tight mb-2">{label}</h3>
                    <AnalysisCardText text={text} />
                  </div>
                ) : null
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* What Works */}
        {n.whatWorks.length > 0 && (
          <CollapsibleSection title={modeWhatWorksLabel[mode] || "What works"} defaultOpen={false}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {n.whatWorks.map((item, i) => (
                <div key={i} className={`rounded-xl border border-border-subtle bg-background flex flex-col ${item.description ? "p-4 md:p-5" : "p-4"}`}>
                  <h3 className="text-base font-semibold tracking-tight">{item.title}</h3>
                  {item.description && (
                    <p className="text-[13px] text-foreground/55 max-w-[70ch] mt-1.5" style={{ lineHeight: 1.575 }}>{item.description}</p>
                  )}
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Fix One Thing */}
        {n.ifFixOneThing && (n.ifFixOneThing.title || n.ifFixOneThing.how || n.ifFixOneThing.why) && (
          <CollapsibleSection title={modeFixOneLabel[mode] || "If you fix only one thing today"} defaultOpen={true}>
            <div className="rounded-xl border-2 border-foreground/10 p-5 md:p-6 bg-secondary/20 max-w-[70ch]">
              {n.ifFixOneThing.how && !n.ifFixOneThing.why && !n.ifFixOneThing.title ? (
                <div className="flex items-start justify-between gap-3">
                  <p className="text-base text-foreground leading-relaxed">{n.ifFixOneThing.how}</p>
                  <CopyFixButton text={n.ifFixOneThing.how} />
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-xl font-bold tracking-tight mb-2">{n.ifFixOneThing.title}</h3>
                    <CopyFixButton
                      text={`${n.ifFixOneThing.title}\nWhy: ${n.ifFixOneThing.why || ""}\nHow: ${n.ifFixOneThing.how || ""}`}
                    />
                  </div>
                  {n.ifFixOneThing.why && (
                    <p className="text-[13px] text-foreground/55 leading-relaxed mb-3" style={{ lineHeight: 1.55 }}>
                      {n.ifFixOneThing.why}
                    </p>
                  )}
                  {n.ifFixOneThing.how && (
                    <p className="text-[13px] text-foreground/70 leading-relaxed" style={{ lineHeight: 1.55 }}>
                      <span className="font-mono-brand text-[10px] text-muted-foreground uppercase tracking-wider mr-2">How</span>
                      {n.ifFixOneThing.how}
                    </p>
                  )}
                </>
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* Your Focus */}
        {n.yourFocus.question && (
          <CollapsibleSection title="Your focus" defaultOpen={false}>
            <div className="rounded-xl border border-border-subtle p-5 md:p-6 bg-background max-w-[70ch]">
              <p className="font-mono-brand text-[10px] text-muted-foreground/50 uppercase tracking-wider mb-2">
                You asked
              </p>
              <p className="text-[13px] text-foreground/70 leading-relaxed italic mb-4" style={{ lineHeight: 1.575 }}>
                &ldquo;{n.yourFocus.question}&rdquo;
              </p>
              <p className="font-mono-brand text-[10px] text-muted-foreground/50 uppercase tracking-wider mb-2">
                Response
              </p>
              <p className="text-[13px] text-foreground/60 leading-relaxed" style={{ lineHeight: 1.575 }}>
                {n.yourFocus.response || "No direct focus response available for this run."}
              </p>
            </div>
          </CollapsibleSection>
        )}
      </div>
    </div>
  );
};

export default FeedbackDisplay;
