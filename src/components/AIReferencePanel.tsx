import { Loader2, Copy, Check, AudioWaveform, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

/* ── Types ── */
interface MetricDiff {
  user: string;
  reference: string;
  delta: number;
}

interface Priority {
  issue: string;
  whyItMatters: string;
  suggestedFix: string;
}

export interface ReferenceResult {
  reference_track_name: string;
  metrics_diff: Record<string, MetricDiff>;
  gemini_feedback: {
    summary: string;
    priorities: Priority[];
    whatWorks?: string[];
  };
  reference_metrics?: Record<string, any>;
}

interface Props {
  loading: boolean;
  result: ReferenceResult | null;
  refTrackName: string;
  onUploadClick?: () => void;
}

/* ── Metric display names ── */
const METRIC_LABELS: Record<string, string> = {
  integratedLoudness: "Integrated LUFS",
  integrated_lufs: "Integrated LUFS",
  lra: "LRA",
  loudnessRange: "LRA",
  dynamicRange: "Dynamic Range",
  dynamic_range: "Dynamic Range",
  stereoWidth: "Stereo Width",
  stereo_correlation: "Stereo Width",
  sub: "Sub",
  low: "Low",
  mid: "Mid",
  highMid: "High-Mid",
  high: "High",
  frequencyBalance: "Freq Balance",
};

/* ── Delta color ── */
function deltaColor(delta: number): string {
  const abs = Math.abs(delta);
  if (abs <= 1) return "text-green-600";
  if (abs <= 3) return "text-amber-600";
  return "text-red-600";
}

function deltaBgColor(delta: number): string {
  const abs = Math.abs(delta);
  if (abs <= 1) return "rgba(34,197,94,0.12)";
  if (abs <= 3) return "rgba(245,158,11,0.1)";
  return "rgba(239,68,68,0.1)";
}

function deltaBarColor(delta: number): string {
  const abs = Math.abs(delta);
  if (abs <= 1) return "rgba(34,197,94,0.5)";
  if (abs <= 3) return "rgba(245,158,11,0.5)";
  return "rgba(239,68,68,0.5)";
}

/* ── Copy button ── */
const CopyBtn = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async (e) => {
        e.stopPropagation();
        await navigator.clipboard.writeText(text);
        setCopied(true);
        toast({ title: "Copied", duration: 1200 });
        setTimeout(() => setCopied(false), 2000);
      }}
      className="inline-flex items-center gap-1 text-[9px] text-muted-foreground/40 hover:text-foreground/60 transition-colors"
    >
      {copied ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
    </button>
  );
};

const MONO = "'JetBrains Mono', 'IBM Plex Mono', 'Courier New', monospace";

const AIReferencePanel = ({ loading, result, refTrackName, onUploadClick }: Props) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 py-16">
        <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
        <p className="text-[11px] text-muted-foreground/60">Comparing against reference…</p>
        <p className="text-[9px] text-muted-foreground/40 truncate max-w-[200px]">{refTrackName}</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 py-12">
        <div className="flex flex-col items-center gap-5 rounded-xl border-2 border-dashed border-border/50 px-8 py-10 w-full max-w-[260px]">
          <AudioWaveform className="w-12 h-12 text-muted-foreground/25" strokeWidth={1.5} />
          <p className="text-lg font-medium text-foreground/55 tracking-tight text-center" style={{ fontSize: 18 }}>
            Drop a reference track
          </p>
          {onUploadClick && (
            <button
              onClick={onUploadClick}
              className="rounded-full border border-border/60 px-4 py-1.5 text-[10px] font-medium text-muted-foreground/55 hover:text-foreground/70 hover:border-foreground/15 hover:bg-secondary/20 transition-all duration-150"
            >
              Browse file
            </button>
          )}
        </div>
      </div>
    );
  }

  const { metrics_diff, gemini_feedback } = result;
  const metricEntries = Object.entries(metrics_diff);

  // Find max abs delta for bar scaling
  const maxAbsDelta = Math.max(1, ...metricEntries.map(([, d]) => Math.abs(typeof d.delta === "number" ? d.delta : parseFloat(String(d.delta)) || 0)));

  return (
    <div className="p-3 space-y-4 overflow-y-auto h-full">
      {/* Reference name */}
      <div className="flex items-center gap-2.5">
        <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
        <span
          className="text-[13px] font-bold text-foreground/75 tracking-[0.08em] uppercase truncate"
          style={{ fontFamily: MONO }}
        >
          vs {result.reference_track_name || refTrackName}
        </span>
      </div>

      {/* ── Metrics Analysis Block ── */}
      {metricEntries.length > 0 && (
        <div className="rounded-xl border-2 border-border bg-card/50 overflow-hidden">
          {/* Section Header */}
          <div className="bg-secondary/30 border-b border-border px-4 py-3">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-foreground/75" style={{ fontFamily: MONO }}>
              Metric Comparison
            </h3>
          </div>

          {/* Summary Strip */}
          <div className="px-4 py-2.5 bg-secondary/15 border-b border-border/50">
            {(() => {
              const deltas = metricEntries.map(([, d]) => Math.abs(typeof d.delta === "number" ? d.delta : parseFloat(String(d.delta)) || 0));
              const maxDelta = Math.max(...deltas);
              const minDelta = Math.min(...deltas.filter(d => d > 0));
              const biggestGapMetric = metricEntries.find(([, d]) => Math.abs(typeof d.delta === "number" ? d.delta : parseFloat(String(d.delta)) || 0) === maxDelta)?.[0];
              const closestMatch = metricEntries.find(([, d]) => Math.abs(typeof d.delta === "number" ? d.delta : parseFloat(String(d.delta)) || 0) === minDelta)?.[0];
              
              return (
                <div className="flex items-center gap-3 flex-wrap">
                  {biggestGapMetric && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400/60" />
                      <span className="text-[10px] text-foreground/60" style={{ fontFamily: MONO }}>
                        Biggest gap: <span className="text-foreground/80 font-semibold">{METRIC_LABELS[biggestGapMetric] || biggestGapMetric}</span>
                      </span>
                    </div>
                  )}
                  {closestMatch && closestMatch !== biggestGapMetric && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400/60" />
                      <span className="text-[10px] text-foreground/60" style={{ fontFamily: MONO }}>
                        Closest match: <span className="text-foreground/80 font-semibold">{METRIC_LABELS[closestMatch] || closestMatch}</span>
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Table Header */}
          <div
            className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 text-[10px] uppercase tracking-[0.12em] font-bold text-foreground/70 px-4 py-3 bg-secondary/20"
            style={{ fontFamily: MONO }}
          >
            <span>Metric</span>
            <span className="text-right w-[60px]">Yours</span>
            <span className="text-right w-[60px]">Reference</span>
            <span className="text-right w-[60px] font-black">Delta</span>
          </div>

          {/* Rows */}
          {metricEntries.map(([key, diff], idx) => {
            const label = METRIC_LABELS[key] || key;
            const d = typeof diff.delta === "number" ? diff.delta : parseFloat(String(diff.delta)) || 0;
            const sign = d > 0 ? "+" : "";
            const barWidth = Math.min(100, (Math.abs(d) / maxAbsDelta) * 100);
            const isEven = idx % 2 === 0;

            return (
              <div
                key={key}
                className={`grid grid-cols-[1fr_auto_auto_auto] gap-x-4 items-center px-4 py-3 transition-colors relative ${
                  isEven ? "bg-secondary/8" : "bg-transparent"
                }`}
                style={{
                  borderBottom: idx < metricEntries.length - 1 ? "1px solid hsl(var(--border) / 0.1)" : "none",
                }}
              >
                {/* Mini delta bar */}
                <div
                  className="absolute inset-y-0 left-0 pointer-events-none"
                  style={{
                    width: `${Math.max(4, barWidth * 0.35)}%`,
                    backgroundColor: deltaBarColor(d),
                    opacity: 0.4,
                    borderRadius: "0 2px 2px 0",
                  }}
                />
                <span
                  className="text-[11px] font-semibold text-foreground/80 uppercase truncate relative z-[1]"
                  style={{ fontFamily: MONO }}
                >
                  {label}
                </span>
                <span
                  className="text-[11px] text-foreground/70 text-right tabular-nums w-[60px] relative z-[1] font-medium"
                  style={{ fontFamily: MONO }}
                >
                  {diff.user}
                </span>
                <span
                  className="text-[11px] text-foreground/70 text-right tabular-nums w-[60px] relative z-[1] font-medium"
                  style={{ fontFamily: MONO }}
                >
                  {diff.reference}
                </span>
                <span
                  className={cn("text-[13px] text-right font-black tabular-nums w-[60px] relative z-[1]", deltaColor(d))}
                  style={{ fontFamily: MONO }}
                >
                  {sign}{typeof d === "number" ? d.toFixed(1) : d}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Gemini Comparative Feedback ── */}
      {gemini_feedback && (
        <div className="space-y-2.5">
          {gemini_feedback.summary && (
            <p className="text-[12px] text-foreground/55 leading-relaxed" style={{ lineHeight: 1.6 }}>
              {gemini_feedback.summary}
            </p>
          )}

          {/* Priority cards */}
          {gemini_feedback.priorities?.map((p, i) => {
            const copyText = `${p.issue}\nWhy: ${p.whyItMatters}\nFix: ${p.suggestedFix}`;
            return (
              <div
                key={i}
                className="group rounded-lg border-l-2 border-l-red-400/60 border border-border/40 bg-card/30 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <span
                      className="text-foreground/30 font-medium leading-none pt-0.5 shrink-0"
                      style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 14 }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-[12px] font-semibold tracking-tight text-foreground/80">{p.issue}</h4>
                      {p.whyItMatters && (
                        <p className="text-[11px] text-foreground/55 mt-1" style={{ lineHeight: 1.55 }}>{p.whyItMatters}</p>
                      )}
                      {p.suggestedFix && (
                        <div className="mt-2 flex items-start gap-1.5">
                          <span
                            className="shrink-0 mt-0.5 inline-flex items-center rounded-full bg-foreground text-background px-1.5 py-0.5"
                            style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, letterSpacing: "0.06em" }}
                          >
                            FIX
                          </span>
                          <p className="text-[11px] text-foreground/65" style={{ lineHeight: 1.55 }}>{p.suggestedFix}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <CopyBtn text={copyText} />
                  </div>
                </div>
              </div>
            );
          })}

          {/* What works */}
          {gemini_feedback.whatWorks && gemini_feedback.whatWorks.length > 0 && (
            <div className="mt-2">
              <span
                className="text-[8px] text-muted-foreground/45 uppercase tracking-[0.12em] mb-1.5 block"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Already matching
              </span>
              <div className="space-y-1">
                {gemini_feedback.whatWorks.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px] text-foreground/55">
                    <span className="text-green-500 shrink-0 mt-0.5">✓</span>
                    <span style={{ lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="h-10" />
    </div>
  );
};

export default AIReferencePanel;
