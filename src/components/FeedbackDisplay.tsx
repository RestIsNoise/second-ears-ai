import { useState, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import WaveformPlayer from "@/components/WaveformPlayer";
import type { WaveformPlayerHandle } from "@/components/WaveformPlayer";
import FeedbackTimeline from "@/components/FeedbackTimeline";
import TechnicalMetrics from "@/components/TechnicalMetrics";
import type { FeedbackResult } from "@/pages/Analyze";
import type { FeedbackItem, WaveformMarker } from "@/types/feedback";

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

function parseTimeSec(val: unknown): number {
  if (typeof val === "number" && Number.isFinite(val)) return val;
  if (typeof val === "string") {
    const match = val.match(/^(\d+):(\d+)$/);
    if (match) return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
    const n = parseFloat(val);
    if (Number.isFinite(n)) return n;
  }
  return NaN;
}

function extractTimelineItems(result: FeedbackResult): FeedbackItem[] {
  const { feedback, mode } = result;
  const items: FeedbackItem[] = [];

  if (feedback.top_priorities && feedback.timestamps && feedback.timestamps.length > 0) {
    feedback.top_priorities.forEach((p, i) => {
      const ts = feedback.timestamps?.[i];
      if (ts) {
        const sec = parseTimeSec(ts.time);
        if (Number.isFinite(sec)) {
          items.push({
            id: `tp-${i}`,
            timestampSec: sec,
            title: p.title,
            observation: p.why,
            fix: p.fix,
            severity: i === 0 ? "high" : i < 3 ? "med" : "low",
            mode,
          });
        }
      }
    });
  }

  if (items.length === 0 && feedback.timestamps && feedback.timestamps.length > 0) {
    feedback.timestamps.forEach((ts, i) => {
      const sec = parseTimeSec(ts.time);
      if (Number.isFinite(sec)) {
        items.push({
          id: `ts-${i}`,
          timestampSec: sec,
          title: ts.label,
          observation: "",
          fix: "",
          severity: "med",
          mode,
        });
      }
    });
  }

  return items;
}

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
      className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
      title="Copy fix to clipboard"
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      <span>{copied ? "Copied" : "Copy fix"}</span>
    </button>
  );
};

const FeedbackDisplay = ({
  result,
  onReset,
  audioFile,
}: {
  result: FeedbackResult;
  onReset: () => void;
  audioFile?: File;
}) => {
  const { feedback, mode } = result;
  const waveformRef = useRef<WaveformPlayerHandle>(null);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);

  const rawTimelineItems = useMemo(() => extractTimelineItems(result), [result]);

  const timelineItems = useMemo(() => {
    if (rawTimelineItems.length > 0) return rawTimelineItems;
    if (audioDuration <= 0 || !feedback.top_priorities || feedback.top_priorities.length === 0) return [];

    const priorities = feedback.top_priorities.slice(0, 8);
    const count = priorities.length;
    const startPct = 0.15;
    const endPct = 0.90;
    const step = count > 1 ? (endPct - startPct) / (count - 1) : 0;

    return priorities.map((p, i): FeedbackItem => ({
      id: `auto-${i}`,
      timestampSec: audioDuration * (startPct + step * i),
      title: p.title,
      observation: p.why,
      fix: p.fix,
      severity: i === 0 ? "high" : i < 3 ? "med" : "low",
      mode,
    }));
  }, [rawTimelineItems, audioDuration, feedback.top_priorities, mode]);

  const hasTimeline = timelineItems.length > 0;

  const markers: WaveformMarker[] = useMemo(() => {
    const m = timelineItems.map((item) => ({
      id: item.id,
      time: item.timestampSec,
      label: item.title,
      severity: item.severity,
    }));
    if (m.length > 0) {
      console.log(`[SecondEars] markers.length=${m.length}, first=`, m[0]);
    } else {
      console.log(`[SecondEars] No markers generated. duration=${audioDuration}, priorities=${feedback.top_priorities?.length ?? 0}`);
    }
    return m;
  }, [timelineItems, audioDuration, feedback.top_priorities]);

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

  // Executive summary data
  const topIssue = feedback.top_priorities?.[0]?.title;
  const biggestWin = feedback.what_works?.[0]?.title;
  const metrics = feedback.technical_metrics;
  const releaseReadiness = useMemo(() => {
    if (!metrics) return null;
    const lufs = metrics.integrated_lufs;
    const peak = metrics.peak_dbtp;
    if (lufs !== undefined && peak !== undefined) {
      if (lufs >= -14 && lufs <= -9 && peak < -1) return "Ready";
      if ((lufs >= -16 && lufs <= -7) && peak < 0) return "Almost there";
      return "Needs work";
    }
    return null;
  }, [metrics]);

  const hasExecutiveSummary = topIssue || biggestWin || releaseReadiness;

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="gap-2 text-muted-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> New analysis
        </Button>

        <div className="space-y-2">
          {feedback.track_name && (
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
              {feedback.track_name}
            </h1>
          )}
          <p className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase">
            {modeLabels[mode]} analysis
          </p>
        </div>
      </div>

      {/* Waveform + A/B placeholder */}
      {audioFile && (
        <div className="mt-8 md:mt-10">
          <WaveformPlayer
            ref={waveformRef}
            audioFile={audioFile}
            markers={markers}
            activeMarkerId={activeItemId}
            onMarkerClick={handleMarkerClick}
            onTimeUpdate={handleTimeUpdate}
            onDurationReady={setAudioDuration}
          />
          {/* A/B Compare placeholder */}
          <div className="flex items-center gap-2 mt-3">
            <div className="flex items-center rounded-md border border-border-subtle overflow-hidden">
              <span className="px-2.5 py-1 text-[11px] font-medium text-foreground bg-secondary/60">
                A
              </span>
              <span
                className="px-2.5 py-1 text-[11px] text-muted-foreground/40 cursor-not-allowed"
                title="Upload updated bounce to compare"
              >
                B
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground/40">Original</span>
          </div>
        </div>
      )}

      {/* Overall Impression */}
      {feedback.overall_impression && (
        <section className="mt-8">
          <p className="text-lg md:text-xl font-medium leading-relaxed tracking-tight max-w-[70ch]">
            {feedback.overall_impression}
          </p>
        </section>
      )}

      {/* Executive Summary Strip */}
      {hasExecutiveSummary && (
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
          {topIssue && (
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono-brand text-[10px] text-muted-foreground/50 uppercase tracking-wider">Top issue</span>
              <span className="text-[13px] text-foreground">{topIssue}</span>
            </div>
          )}
          {biggestWin && (
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono-brand text-[10px] text-muted-foreground/50 uppercase tracking-wider">Biggest win</span>
              <span className="text-[13px] text-foreground">{biggestWin}</span>
            </div>
          )}
          {releaseReadiness && (
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono-brand text-[10px] text-muted-foreground/50 uppercase tracking-wider">Release</span>
              <span className="text-[13px] text-foreground">{releaseReadiness}</span>
            </div>
          )}
        </div>
      )}

      {/* Timeline Feedback */}
      {hasTimeline && (
        <section className="mt-8 md:mt-10">
          <h2 className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase mb-5">
            Timeline feedback
          </h2>
          <FeedbackTimeline
            items={timelineItems}
            activeItemId={activeItemId}
            onItemClick={handleItemClick}
          />
        </section>
      )}

      {/* Fallback: Top Priorities without timestamps */}
      {!hasTimeline && feedback.top_priorities && feedback.top_priorities.length > 0 && (
        <section className="mt-8 md:mt-10">
          <h2 className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase mb-5">
            Top priorities
          </h2>
          <div className="space-y-[18px]">
            {feedback.top_priorities.map((item, i) => {
              const copyText = `${item.title}\nWhy: ${item.why}\nFix: ${item.fix}`;
              return (
                <div key={i} className="rounded-xl border border-border-subtle p-6 md:p-8 bg-background">
                  <div className="flex items-start gap-5">
                    <span className="font-mono-brand text-2xl text-muted-foreground/40 font-medium leading-none pt-0.5">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1 max-w-[70ch]">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-lg font-semibold tracking-tight">{item.title}</h3>
                        <CopyFixButton text={copyText} />
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed mt-2.5">{item.why}</p>
                      <div className="mt-3.5">
                        <p className="text-sm text-foreground/80 leading-relaxed">
                          <span className="font-mono-brand text-[10px] text-muted-foreground uppercase tracking-wider mr-2">
                            Fix
                          </span>
                          {item.fix}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Technical Metrics */}
      {feedback.technical_metrics && (
        <div className="mt-8 md:mt-10">
          <TechnicalMetrics metrics={feedback.technical_metrics} />
        </div>
      )}

      {/* Full Analysis */}
      {feedback.fullAnalysis && (
        <section className="mt-8 md:mt-10">
          <h2 className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase mb-5">
            Full analysis
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(mode === "musical"
              ? [
                  { key: "energyArc" as const, label: "Energy Arc" },
                  { key: "sectionContrast" as const, label: "Section Contrast" },
                  { key: "grooveContinuity" as const, label: "Groove Continuity" },
                  { key: "hookClarity" as const, label: "Hook Clarity" },
                ]
              : mode === "perception"
              ? [
                  { key: "subLowTranslation" as const, label: "Sub & Low Translation" },
                  { key: "headroomTransients" as const, label: "Headroom & Transients" },
                  { key: "stereoFoldDown" as const, label: "Stereo Fold-Down" },
                  { key: "listenerFatigue" as const, label: "Listener Fatigue" },
                ]
              : [
                  { key: "mixBalance" as const, label: "Mix Balance" },
                  { key: "dynamics" as const, label: "Dynamics & Loudness" },
                  { key: "stereoSpace" as const, label: "Stereo & Space" },
                  { key: "frequencyBalance" as const, label: "Frequency Balance" },
                ]
            ).map(({ key, label }) =>
              feedback.fullAnalysis?.[key] ? (
                <div key={key} className="rounded-xl border border-border-subtle p-6 md:p-8 bg-background flex flex-col">
                  <h3 className="text-base font-semibold tracking-tight mb-3">{label}</h3>
                  <p className="text-sm text-muted-foreground max-w-[70ch]" style={{ lineHeight: 1.575 }}>{feedback.fullAnalysis[key]}</p>
                </div>
              ) : null
            )}
          </div>
        </section>
      )}

      {/* What Works */}
      {feedback.what_works && feedback.what_works.length > 0 && (
        <section className="mt-8 md:mt-10">
          <h2 className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase mb-5">
            {modeWhatWorksLabel[mode] || "What works"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {feedback.what_works.map((item: any, i: number) => {
              if (i === 0) console.log("WhatWorks item:", item);
              const body =
                item.detail || item.description || item.whyItWorks || item.body || "";

              return (
                <div key={i} className="rounded-xl border border-border-subtle p-6 md:p-8 bg-background flex flex-col">
                  <h3 className="text-base font-semibold tracking-tight">{item.title}</h3>
                  {body && (
                    <p className="text-sm text-muted-foreground max-w-[70ch] mt-2" style={{ lineHeight: 1.575 }}>{body}</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Fix One Thing */}
      {feedback.fix_one_thing && (
        <section className="mt-8 md:mt-10">
          <h2 className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase mb-5">
            {modeFixOneLabel[mode] || "If you fix only one thing today"}
          </h2>
          <div className="rounded-xl border-2 border-foreground/10 p-8 md:p-10 bg-secondary/20 max-w-[70ch]">
            {feedback.fix_one_thing.how && !feedback.fix_one_thing.why ? (
              <div className="flex items-start justify-between gap-3">
                <p className="text-base text-foreground leading-relaxed">
                  {feedback.fix_one_thing.how}
                </p>
                <CopyFixButton text={feedback.fix_one_thing.how} />
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-xl font-bold tracking-tight mb-3">
                    {feedback.fix_one_thing.title}
                  </h3>
                  <CopyFixButton
                    text={`${feedback.fix_one_thing.title}\nWhy: ${feedback.fix_one_thing.why || ""}\nHow: ${feedback.fix_one_thing.how || ""}`}
                  />
                </div>
                {feedback.fix_one_thing.why && (
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {feedback.fix_one_thing.why}
                  </p>
                )}
                <p className="text-sm text-foreground/80 leading-relaxed">
                  <span className="font-mono-brand text-[10px] text-muted-foreground uppercase tracking-wider mr-2">
                    How
                  </span>
                  {feedback.fix_one_thing.how}
                </p>
              </>
            )}
          </div>
        </section>
      )}

      {/* Legacy fallback */}
      {feedback.issues && feedback.issues.length > 0 && !feedback.top_priorities && (
        <section className="mt-8 md:mt-10">
          <h2 className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase mb-5">
            Issues & fixes
          </h2>
          <div className="space-y-[18px]">
            {feedback.issues.map((issue, i) => (
              <div key={i} className="rounded-xl border border-border-subtle p-6 bg-background">
                <p className="text-sm font-medium">{issue.area}</p>
                <p className="text-sm text-muted-foreground mt-2">{issue.problem}</p>
                <p className="text-sm text-foreground/80 mt-3">
                  <span className="font-mono-brand text-[10px] text-muted-foreground uppercase tracking-wider mr-2">
                    Fix
                  </span>
                  {issue.fix}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Your Focus */}
      {result.context && (
        <section className="mt-8 md:mt-10">
          <h2 className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase mb-5">
            Your focus
          </h2>
          <div className="rounded-xl border border-border-subtle p-6 md:p-8 bg-background max-w-[70ch]">
            <p className="text-sm text-foreground leading-relaxed line-clamp-4">
              {result.context}
            </p>
            {feedback.focus_response && (
              <div className="mt-5 pt-5 border-t border-border-subtle">
                <p className="font-mono-brand text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                  Response to your request
                </p>
                <p className="text-sm text-muted-foreground" style={{ lineHeight: 1.575 }}>
                  {feedback.focus_response}
                </p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default FeedbackDisplay;
