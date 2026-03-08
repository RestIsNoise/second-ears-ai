import { Loader2, Copy, Check, AudioWaveform } from "lucide-react";
import { useState } from "react";
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
  if (abs <= 1) return "text-green-500";
  if (abs <= 3) return "text-amber-500";
  return "text-red-500";
}

function deltaBg(delta: number): string {
  const abs = Math.abs(delta);
  if (abs <= 1) return "bg-green-500/8";
  if (abs <= 3) return "bg-amber-500/8";
  return "bg-red-500/8";
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
      className="inline-flex items-center gap-1 text-[9px] text-muted-foreground/35 hover:text-foreground/60 transition-colors"
    >
      {copied ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
    </button>
  );
};

const AIReferencePanel = ({ loading, result, refTrackName, onUploadClick }: Props) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 py-16">
        <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
        <p className="text-[11px] text-muted-foreground/50">Comparing against reference…</p>
        <p className="text-[9px] text-muted-foreground/30 truncate max-w-[200px]">{refTrackName}</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 py-12">
        <div className="flex flex-col items-center gap-5 rounded-xl border-2 border-dashed border-border/50 px-8 py-10 w-full max-w-[260px]">
          <AudioWaveform className="w-12 h-12 text-muted-foreground/20" strokeWidth={1.5} />
          <p className="text-lg font-medium text-foreground/50 tracking-tight text-center" style={{ fontSize: 18 }}>
            Drop a reference track
          </p>
          {onUploadClick && (
            <button
              onClick={onUploadClick}
              className="rounded-full border border-border/60 px-4 py-1.5 text-[10px] font-medium text-muted-foreground/50 hover:text-foreground/70 hover:border-foreground/15 hover:bg-secondary/20 transition-all duration-150"
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

  return (
    <div className="p-3 space-y-4 overflow-y-auto h-full">
      {/* Reference name */}
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-accent-foreground/30 shrink-0" />
        <span
          className="text-[9px] text-muted-foreground/45 tracking-[0.1em] uppercase truncate"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          vs {result.reference_track_name || refTrackName}
        </span>
      </div>

      {/* ── Metrics Comparison Table ── */}
      {metricEntries.length > 0 && (
        <div className="rounded-lg border border-border/40 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-4 gap-0 text-[8px] uppercase tracking-[0.1em] text-muted-foreground/40 bg-secondary/30 px-2.5 py-1.5"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            <span>Metric</span>
            <span className="text-right">Yours</span>
            <span className="text-right">Ref</span>
            <span className="text-right">Δ</span>
          </div>

          {/* Rows */}
          {metricEntries.map(([key, diff]) => {
            const label = METRIC_LABELS[key] || key;
            const d = typeof diff.delta === "number" ? diff.delta : parseFloat(String(diff.delta)) || 0;
            const sign = d > 0 ? "+" : "";

            return (
              <div
                key={key}
                className={cn(
                  "grid grid-cols-4 gap-0 px-2.5 py-1.5 border-t border-border/20 transition-colors",
                  deltaBg(d)
                )}
              >
                <span className="text-[10px] text-foreground/55 truncate" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  {label}
                </span>
                <span className="text-[10px] text-foreground/60 text-right font-mono">{diff.user}</span>
                <span className="text-[10px] text-foreground/60 text-right font-mono">{diff.reference}</span>
                <span className={cn("text-[10px] text-right font-mono font-semibold", deltaColor(d))}>
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
          {/* Summary */}
          {gemini_feedback.summary && (
            <p className="text-[11px] text-foreground/50 leading-relaxed" style={{ lineHeight: 1.6 }}>
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
                      className="text-muted-foreground/25 font-medium leading-none pt-0.5 shrink-0"
                      style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 14 }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-[12px] font-semibold tracking-tight text-foreground/75">{p.issue}</h4>
                      {p.whyItMatters && (
                        <p className="text-[11px] text-foreground/45 mt-1" style={{ lineHeight: 1.55 }}>{p.whyItMatters}</p>
                      )}
                      {p.suggestedFix && (
                        <div className="mt-2 flex items-start gap-1.5">
                          <span
                            className="shrink-0 mt-0.5 inline-flex items-center rounded-full bg-foreground text-background px-1.5 py-0.5"
                            style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, letterSpacing: "0.06em" }}
                          >
                            FIX
                          </span>
                          <p className="text-[11px] text-foreground/60" style={{ lineHeight: 1.55 }}>{p.suggestedFix}</p>
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
                className="text-[8px] text-muted-foreground/35 uppercase tracking-[0.12em] mb-1.5 block"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Already matching
              </span>
              <div className="space-y-1">
                {gemini_feedback.whatWorks.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px] text-foreground/45">
                    <span className="text-green-500 shrink-0 mt-0.5">✓</span>
                    <span style={{ lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="h-20" />
    </div>
  );
};

export default AIReferencePanel;
