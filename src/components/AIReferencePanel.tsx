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
        className="flex items-center gap-2 px-3 py-2"
        style={{ borderBottom: "1px solid hsl(var(--foreground) / 0.06)" }}
      >
        <div className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: "hsl(35 85% 50%)", boxShadow: "0 0 3px hsl(35 85% 50% / 0.4)" }} />
        <span
          className="text-[9px] font-extrabold text-foreground/55 tracking-[0.1em] uppercase truncate"
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
            className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-3 py-[7px]"
            style={{
              backgroundColor: "hsl(var(--panel-header))",
              borderBottom: "1px solid hsl(var(--foreground) / 0.06)",
            }}
          >
    <span className="text-foreground/30 uppercase tracking-[0.1em] font-extrabold" style={{ fontFamily: MONO, fontSize: 8 }}>Metric</span>
            <span className="text-foreground/30 uppercase tracking-[0.1em] font-extrabold text-right w-[52px]" style={{ fontFamily: MONO, fontSize: 8 }}>You</span>
            <span className="text-foreground/30 uppercase tracking-[0.1em] font-extrabold text-right w-[52px]" style={{ fontFamily: MONO, fontSize: 8 }}>Ref</span>
            <span className="text-foreground/30 uppercase tracking-[0.1em] font-extrabold text-right w-[48px]" style={{ fontFamily: MONO, fontSize: 8 }}>Δ</span>
          </div>

          {metricEntries.map(([key, diff], idx) => {
            const label = METRIC_LABELS[key] || key;
            const d = typeof diff.delta === "number" ? diff.delta : parseFloat(String(diff.delta)) || 0;
            const led = deltaLed(d);
            const sign = d > 0 ? "+" : "";

            return (
              <div
                key={key}
                className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 items-center px-3 py-[7px]"
                style={{
                  borderBottom: idx < metricEntries.length - 1 ? "1px solid hsl(var(--foreground) / 0.03)" : "none",
                }}
              >
                <span className="text-[10px] font-bold text-foreground/55 uppercase truncate" style={{ fontFamily: MONO }}>{label}</span>
                <span className="text-[10px] text-foreground/50 text-right tabular-nums w-[52px] font-medium" style={{ fontFamily: MONO }}>{diff.user}</span>
                <span className="text-[10px] text-foreground/50 text-right tabular-nums w-[52px] font-medium" style={{ fontFamily: MONO }}>{diff.reference}</span>
                <div className="flex items-center justify-end gap-1.5 w-[48px]">
                  <span className="text-[11px] font-extrabold tabular-nums" style={{ fontFamily: MONO, color: led.bg }}>
                    {sign}{d.toFixed(1)}
                  </span>
                  <div className="w-[5px] h-[5px] rounded-full shrink-0" style={{ backgroundColor: led.bg, boxShadow: led.glow }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Feedback ── */}
      {gemini_feedback && (
        <div className="p-3 space-y-2">
          {gemini_feedback.summary && (
            <p className="text-[12px] text-foreground/50" style={{ lineHeight: 1.65, fontFamily: MONO }}>
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
                  padding: "8px 10px",
                  borderBottom: "1px solid hsl(var(--foreground) / 0.04)",
                }}
              >
                <div className="flex items-start justify-between gap-1.5">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <span className="text-foreground/15 font-bold shrink-0" style={{ fontFamily: MONO, fontSize: 9 }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-[11px] font-bold tracking-tight text-foreground/75" style={{ fontFamily: MONO }}>{p.issue}</h4>
                      {p.whyItMatters && (
                        <p
                          className={cn("text-[10px] text-foreground/45 mt-1 transition-all", !isExpanded && "line-clamp-3")}
                          style={{ lineHeight: 1.5, fontFamily: MONO }}
                        >
                          {p.whyItMatters}
                        </p>
                      )}
                      {p.whyItMatters && p.whyItMatters.length > 150 && (
                        <button
                          onClick={() => toggleCard(i)}
                          className="mt-0.5 text-[8px] text-foreground/20 hover:text-foreground/45 uppercase tracking-wider font-bold"
                          style={{ fontFamily: MONO }}
                        >
                          {isExpanded ? "Less" : "More"}
                        </button>
                      )}
                      {p.suggestedFix && (
                        <div className="mt-1.5 pt-1.5 flex items-start gap-1.5" style={{ borderTop: "1px solid hsl(var(--foreground) / 0.05)" }}>
                          <span
                            className="shrink-0 mt-[1px]"
                            style={{
                              fontFamily: MONO, fontSize: 7, fontWeight: 800,
                              letterSpacing: "0.06em", padding: "1px 4px",
                              backgroundColor: "hsl(0 55% 50% / 0.7)", color: "white", borderRadius: 1,
                            }}
                          >
                            FIX
                          </span>
                          <p className="text-[10px] text-foreground/55" style={{ lineHeight: 1.5, fontFamily: MONO }}>{p.suggestedFix}</p>
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
            <div className="mt-2 pt-2" style={{ borderTop: "1px solid hsl(var(--foreground) / 0.05)" }}>
              <span className="text-[7px] text-foreground/25 uppercase tracking-[0.14em] mb-1.5 block font-extrabold" style={{ fontFamily: MONO }}>
                Matching
              </span>
              <div className="space-y-1">
                {gemini_feedback.whatWorks.map((item, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[10px] text-foreground/45" style={{ fontFamily: MONO }}>
                    <span className="shrink-0 mt-0.5" style={{ color: "hsl(145 60% 42%)", fontSize: 9 }}>✓</span>
                    <span style={{ lineHeight: 1.45 }}>{item}</span>
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
