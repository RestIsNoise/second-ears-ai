import { Loader2, Copy, Check, AudioWaveform, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const MONO = "'IBM Plex Mono', 'DM Mono', monospace";

/* ── Types ── */
interface MetricDiff { user: string; reference: string; delta: number; }
interface Priority { issue: string; whyItMatters: string; suggestedFix: string; }
export interface ReferenceResult {
  reference_track_name: string;
  metrics_diff: Record<string, MetricDiff>;
  gemini_feedback: { summary: string; priorities: Priority[]; whatWorks?: string[]; };
  reference_metrics?: Record<string, any>;
}

interface Props {
  loading: boolean;
  result: ReferenceResult | null;
  refTrackName: string;
  onUploadClick?: () => void;
}

const METRIC_LABELS: Record<string, string> = {
  integratedLoudness: "Int. LUFS", integrated_lufs: "Int. LUFS",
  lra: "LRA", loudnessRange: "LRA",
  dynamicRange: "DR", dynamic_range: "DR",
  stereoWidth: "Stereo W", stereo_correlation: "Stereo W",
  sub: "Sub", low: "Low", mid: "Mid", highMid: "Hi-Mid", high: "High",
  frequencyBalance: "Freq Bal",
};

function deltaLed(delta: number): { bg: string; glow: string } {
  const abs = Math.abs(delta);
  if (abs <= 1) return { bg: "hsl(145 60% 42%)", glow: "0 0 3px hsl(145 60% 42% / 0.3)" };
  if (abs <= 3) return { bg: "hsl(35 85% 50%)", glow: "0 0 3px hsl(35 85% 50% / 0.3)" };
  return { bg: "hsl(0 65% 48%)", glow: "0 0 3px hsl(0 65% 48% / 0.3)" };
}

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
      className="inline-flex items-center text-[8px] text-foreground/20 hover:text-foreground/50 transition-colors uppercase tracking-wider font-bold"
      style={{ fontFamily: MONO }}
    >
      {copied ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
    </button>
  );
};

const AIReferencePanel = ({ loading, result, refTrackName, onUploadClick }: Props) => {
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const toggleCard = useCallback((idx: number) => {
    setExpandedCards((prev) => { const n = new Set(prev); if (n.has(idx)) n.delete(idx); else n.add(idx); return n; });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 py-16">
        <Loader2 className="w-4 h-4 text-foreground/20 animate-spin" />
        <p className="text-[9px] text-foreground/25 uppercase tracking-wider font-bold" style={{ fontFamily: MONO }}>Comparing…</p>
        <p className="text-[8px] text-foreground/15 truncate max-w-[180px]" style={{ fontFamily: MONO }}>{refTrackName}</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 py-12">
        <div
          className="flex flex-col items-center gap-4 w-full max-w-[220px] px-6 py-8"
          style={{
            border: "1px dashed hsl(var(--foreground) / 0.1)",
            borderRadius: 3,
            backgroundColor: "hsl(var(--panel-bg))",
          }}
        >
          <AudioWaveform className="w-8 h-8 text-foreground/10" strokeWidth={1.5} />
          <p className="text-[10px] text-foreground/35 text-center font-bold uppercase tracking-wider" style={{ fontFamily: MONO }}>
            Drop reference
          </p>
          {onUploadClick && (
            <button
              onClick={onUploadClick}
              className="text-[9px] font-bold uppercase tracking-[0.1em] text-foreground/40 hover:text-foreground/70 transition-colors"
              style={{
                fontFamily: MONO,
                padding: "4px 10px",
                border: "1px solid hsl(var(--foreground) / 0.1)",
                borderRadius: 2,
                backgroundColor: "hsl(var(--panel-header))",
              }}
            >
              Browse
            </button>
          )}
        </div>
      </div>
    );
  }

  const { metrics_diff, gemini_feedback } = result;
  const metricEntries = Object.entries(metrics_diff);
  const maxAbsDelta = Math.max(1, ...metricEntries.map(([, d]) => Math.abs(typeof d.delta === "number" ? d.delta : parseFloat(String(d.delta)) || 0)));

  return (
    <div className="overflow-y-auto h-full scrollbar-thin">
      {/* Reference name */}
      <div
        className="flex items-center gap-2.5 px-5 py-4"
        style={{ borderBottom: "1px solid hsl(var(--foreground) / 0.06)" }}
      >
        <div className="w-[7px] h-[7px] rounded-full" style={{ backgroundColor: "hsl(35 85% 50%)", boxShadow: "0 0 3px hsl(35 85% 50% / 0.4)" }} />
        <span
          className="text-[13px] font-medium text-foreground/55 tracking-[0.1em] uppercase truncate"
          style={{ fontFamily: MONO }}
        >
          vs {result.reference_track_name || refTrackName}
        </span>
      </div>

      {/* ── Metrics Table ── */}
      {metricEntries.length > 0 && (
        <div
          style={{
            borderBottom: "1px solid hsl(var(--foreground) / 0.06)",
          }}
        >
          {/* Table header */}
          <div
            className="grid grid-cols-[1fr_auto_auto_auto] gap-x-5 px-5 py-3"
            style={{
              backgroundColor: "hsl(var(--panel-header))",
              borderBottom: "1px solid hsl(var(--foreground) / 0.06)",
            }}
          >
    <span className="text-foreground/35 uppercase tracking-[0.1em] font-medium" style={{ fontFamily: MONO, fontSize: 10 }}>Metric</span>
            <span className="text-foreground/35 uppercase tracking-[0.1em] font-medium text-right w-[60px]" style={{ fontFamily: MONO, fontSize: 10 }}>You</span>
            <span className="text-foreground/35 uppercase tracking-[0.1em] font-medium text-right w-[60px]" style={{ fontFamily: MONO, fontSize: 10 }}>Ref</span>
            <span className="text-foreground/35 uppercase tracking-[0.1em] font-medium text-right w-[56px]" style={{ fontFamily: MONO, fontSize: 10 }}>Δ</span>
          </div>

          {metricEntries.map(([key, diff], idx) => {
            const label = METRIC_LABELS[key] || key;
            const d = typeof diff.delta === "number" ? diff.delta : parseFloat(String(diff.delta)) || 0;
            const led = deltaLed(d);
            const sign = d > 0 ? "+" : "";

            return (
              <div
                key={key}
                className="grid grid-cols-[1fr_auto_auto_auto] gap-x-5 items-center px-5 py-3"
                style={{
                  borderBottom: idx < metricEntries.length - 1 ? "1px solid hsl(var(--foreground) / 0.03)" : "none",
                }}
              >
                <span className="text-[13px] font-medium text-foreground/55 uppercase truncate" style={{ fontFamily: MONO }}>{label}</span>
                <span className="text-[13px] text-foreground/50 text-right tabular-nums w-[60px] font-medium" style={{ fontFamily: MONO }}>{diff.user}</span>
                <span className="text-[13px] text-foreground/50 text-right tabular-nums w-[60px] font-medium" style={{ fontFamily: MONO }}>{diff.reference}</span>
                <div className="flex items-center justify-end gap-1.5 w-[56px]">
                  <span className="text-[14px] font-medium tabular-nums" style={{ fontFamily: MONO, color: led.bg }}>
                    {sign}{d.toFixed(1)}
                  </span>
                  <div className="w-[7px] h-[7px] rounded-full shrink-0" style={{ backgroundColor: led.bg, boxShadow: led.glow }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Feedback ── */}
      {gemini_feedback && (
        <div className="p-5 space-y-4">
          {gemini_feedback.summary && (
            <p className="text-[14px] text-foreground/55" style={{ lineHeight: 1.75, fontFamily: MONO }}>
              {gemini_feedback.summary}
            </p>
          )}

          {gemini_feedback.priorities?.map((p, i) => {
            const copyText = `${p.issue}\nWhy: ${p.whyItMatters}\nFix: ${p.suggestedFix}`;
            const isExpanded = expandedCards.has(i);
            return (
              <div
                key={i}
                className="group"
                style={{
                  borderLeft: "3px solid hsl(0 55% 50% / 0.5)",
                  padding: "12px 14px",
                  borderBottom: "1px solid hsl(var(--foreground) / 0.04)",
                }}
              >
                <div className="flex items-start justify-between gap-1.5">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <span className="text-foreground/22 font-medium shrink-0" style={{ fontFamily: MONO, fontSize: 13 }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-[15px] font-medium tracking-tight text-foreground/75" style={{ fontFamily: MONO }}>{p.issue}</h4>
                      {p.whyItMatters && (
                        <p
                          className={cn("text-[13px] text-foreground/45 mt-2 transition-all", !isExpanded && "line-clamp-3")}
                          style={{ lineHeight: 1.7, fontFamily: MONO }}
                        >
                          {p.whyItMatters}
                        </p>
                      )}
                      {p.whyItMatters && p.whyItMatters.length > 150 && (
                        <button
                          onClick={() => toggleCard(i)}
                          className="mt-1 text-[9px] text-foreground/20 hover:text-foreground/45 uppercase tracking-wider font-bold"
                          style={{ fontFamily: MONO }}
                        >
                          {isExpanded ? "Less" : "More"}
                        </button>
                      )}
                      {p.suggestedFix && (
                        <div className="mt-2 pt-2 flex items-start gap-2" style={{ borderTop: "1px solid hsl(var(--foreground) / 0.05)" }}>
                          <span
                            className="shrink-0 mt-[1px]"
                             style={{
                              fontFamily: MONO, fontSize: 10, fontWeight: 700,
                              letterSpacing: "0.06em", padding: "3px 7px",
                              backgroundColor: "hsl(0 55% 50% / 0.7)", color: "white", borderRadius: 1,
                            }}
                          >
                            FIX
                          </span>
                          <p className="text-[14px] text-foreground/55" style={{ lineHeight: 1.7, fontFamily: MONO }}>{p.suggestedFix}</p>
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

          {gemini_feedback.whatWorks && gemini_feedback.whatWorks.length > 0 && (
            <div className="mt-3 pt-3" style={{ borderTop: "1px solid hsl(var(--foreground) / 0.05)" }}>
              <span className="text-[10px] text-foreground/30 uppercase tracking-[0.14em] mb-2.5 block font-medium" style={{ fontFamily: MONO }}>
                Matching
              </span>
              <div className="space-y-1.5">
                {gemini_feedback.whatWorks.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-[12px] text-foreground/45" style={{ fontFamily: MONO }}>
                    <span className="shrink-0 mt-0.5" style={{ color: "hsl(145 60% 42%)", fontSize: 11 }}>✓</span>
                    <span style={{ lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="h-6" />
    </div>
  );
};

export default AIReferencePanel;
