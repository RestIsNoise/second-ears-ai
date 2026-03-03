import { useState, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
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

/** Parse a time value that could be a number (seconds) or a string like "0:30" or "1:15" */
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

/** Convert API feedback data into FeedbackItems for the timeline */
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

  // Extract items with real timestamps first
  const rawTimelineItems = useMemo(() => extractTimelineItems(result), [result]);

  // If no timeline items but we have priorities + duration, auto-generate timestamps
  const timelineItems = useMemo(() => {
    if (rawTimelineItems.length > 0) return rawTimelineItems;
    if (audioDuration <= 0 || !feedback.top_priorities || feedback.top_priorities.length === 0) return [];

    const priorities = feedback.top_priorities.slice(0, 8);
    const count = priorities.length;
    // Place markers evenly across 15%..90% of duration
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
    // Debug log
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

  // During playback, find nearest marker to current time
  const handleTimeUpdate = useCallback(
    (time: number) => {
      if (timelineItems.length === 0) return;
      // Find the most recent marker the playhead has passed
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

      {/* Waveform */}
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
        </div>
      )}

      {/* Overall Impression */}
      {feedback.overall_impression && (
        <section className="mt-10">
          <p className="text-lg md:text-xl font-medium leading-relaxed tracking-tight max-w-[70ch]">
            {feedback.overall_impression}
          </p>
        </section>
      )}

      {/* Timeline Feedback */}
      {hasTimeline && (
        <section className="mt-8 md:mt-12">
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
        <section className="mt-8 md:mt-12">
          <h2 className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase mb-5">
            Top priorities
          </h2>
          <div className="space-y-[18px]">
            {feedback.top_priorities.map((item, i) => (
              <div key={i} className="rounded-xl border border-border-subtle p-6 md:p-8 bg-background">
                <div className="flex items-start gap-5">
                  <span className="font-mono-brand text-2xl text-muted-foreground/40 font-medium leading-none pt-0.5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 max-w-[70ch]">
                    <h3 className="text-lg font-semibold tracking-tight">{item.title}</h3>
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
            ))}
          </div>
        </section>
      )}

      {/* Technical Metrics */}
      {feedback.technical_metrics && (
        <div className="mt-8 md:mt-12">
          <TechnicalMetrics metrics={feedback.technical_metrics} />
        </div>
      )}

      {/* Full Analysis */}
      {feedback.fullAnalysis && (
        <section className="mt-8 md:mt-12">
          <h2 className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase mb-5">
            Full analysis
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: "mixBalance" as const, label: "Mix Balance" },
              { key: "dynamics" as const, label: "Dynamics & Loudness" },
              { key: "stereoSpace" as const, label: "Stereo & Space" },
              { key: "frequencyBalance" as const, label: "Frequency Balance" },
            ].map(({ key, label }) =>
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
        <section className="mt-8 md:mt-12">
          <h2 className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase mb-5">
            What works
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
        <section className="mt-8 md:mt-12">
          <h2 className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase mb-5">
            If you fix only one thing today
          </h2>
          <div className="rounded-xl border-2 border-foreground/10 p-8 md:p-10 bg-secondary/20 max-w-[70ch]">
            {feedback.fix_one_thing.how && !feedback.fix_one_thing.why ? (
              <p className="text-base text-foreground leading-relaxed">
                {feedback.fix_one_thing.how}
              </p>
            ) : (
              <>
                <h3 className="text-xl font-bold tracking-tight mb-3">
                  {feedback.fix_one_thing.title}
                </h3>
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
        <section className="mt-8 md:mt-12">
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

      {/* Your Focus — bottom of results */}
      {result.context && (
        <section className="mt-8 md:mt-12">
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
