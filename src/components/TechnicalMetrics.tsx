import { useState, useEffect, useRef } from "react";
import type { TechnicalMetrics as TechnicalMetricsType } from "@/pages/Analyze";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Status = { label: string; color: "green" | "orange" | "red" | "blue" };

const MONO = "'IBM Plex Mono', monospace";

const metricTooltips: Record<string, string> = {
  "Int. LUFS": "Integrated loudness. Measures the average volume of the entire track. Streaming targets -14 LUFS. Club music: -9 to -11 LUFS.",
  "ST LUFS": "Short-term loudness. Average volume in 3-second windows. Shows energy peaks across the track.",
  "LRA": "Loudness Range. How dynamic the mix is. Below 4 LU is over-compressed. 6–12 LU is ideal.",
  "DR": "Dynamic Range. Difference between the softest and loudest moments. Below 5 is heavily squashed.",
  "Peak": "True Peak. The maximum peak level. Should not exceed -1 dBTP to avoid distortion on streaming platforms.",
  "Crest": "Crest Factor. Ratio between peak and RMS. Low values indicate over-compression and loss of punch.",
  "Stereo": "Stereo Width. How wide the stereo image is. Values near 0 sound mono and flat.",
  "Sub/Kick": "Sub-frequency vs kick balance. Values above 1.5 indicate excessive sub masking the kick fundamental.",
};

function lufsStatus(v: number): Status {
  if (v >= -14 && v <= -9) return { label: "OK", color: "green" };
  if ((v >= -16 && v < -14) || (v > -9 && v <= -7)) return { label: v > -9 ? "Hot" : "Quiet", color: "orange" };
  if (v > -7) return { label: "Clip", color: "red" };
  return { label: "Low", color: "red" };
}

function drStatus(v: number): Status {
  if (v > 8) return { label: "Dynamic", color: "green" };
  if (v >= 6) return { label: "Mod", color: "orange" };
  return { label: "Crushed", color: "red" };
}

function peakStatus(v: number): Status {
  if (v > -0.3) return { label: "Clip", color: "red" };
  if (v >= -1.0) return { label: "Hot", color: "orange" };
  if (v >= -3.0) return { label: "Safe", color: "green" };
  return { label: "Room", color: "green" };
}

function correlationStatus(v: number): Status {
  if (v > 0.4) return { label: "OK", color: "green" };
  if (v >= 0) return { label: "Narrow", color: "orange" };
  return { label: "Phase", color: "red" };
}

function crestStatus(v: number): Status {
  if (v > 10) return { label: "Dynamic", color: "green" };
  if (v >= 6) return { label: "Comp", color: "orange" };
  return { label: "Brick", color: "red" };
}

function subKickStatus(v: number): Status {
  if (v >= 0.8 && v <= 1.2) return { label: "Bal", color: "green" };
  if (v < 0.5 || v > 1.5) return { label: v < 0.5 ? "Kick" : "Sub", color: "red" };
  return { label: v < 0.8 ? "Kick" : "Sub", color: "orange" };
}

function lraStatus(v: number): Status {
  if (v < 3) return { label: "Flat", color: "red" };
  if (v <= 8) return { label: "Comp", color: "orange" };
  if (v <= 14) return { label: "OK", color: "green" };
  return { label: "Wide", color: "blue" };
}

const ledColors: Record<string, { bg: string; glow: string; muted: string }> = {
  green: { bg: "hsl(145 60% 42%)", glow: "0 0 5px hsl(145 60% 42% / 0.5)", muted: "hsl(145 60% 42% / 0.12)" },
  orange: { bg: "hsl(35 85% 50%)", glow: "0 0 5px hsl(35 85% 50% / 0.5)", muted: "hsl(35 85% 50% / 0.12)" },
  red: { bg: "hsl(0 65% 48%)", glow: "0 0 5px hsl(0 65% 48% / 0.5)", muted: "hsl(0 65% 48% / 0.12)" },
  blue: { bg: "hsl(210 65% 50%)", glow: "0 0 5px hsl(210 65% 50% / 0.5)", muted: "hsl(210 65% 50% / 0.12)" },
};

/* ── Animated number hook ── */
function useAnimatedNumber(target: number | null, animate: boolean, duration = 400, delay = 0) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (target === null || !animate) {
      if (target !== null) setDisplay(target);
      return;
    }
    const startTime = performance.now() + delay;
    const tick = (now: number) => {
      const elapsed = now - startTime;
      if (elapsed < 0) { rafRef.current = requestAnimationFrame(tick); return; }
      const t = Math.min(elapsed / duration, 1);
      setDisplay(t * target);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    setDisplay(0);
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, animate, duration, delay]);

  return target === null ? null : display;
}

/* ── Meter Channel ── */
interface MeterChannelProps {
  label: string;
  value: number | null;
  unit: string;
  min: number;
  max: number;
  status: Status | null;
  decimals?: number;
  thresholds?: { pct: number; label: string }[];
  rowIndex?: number;
  animated?: boolean;
}

const MeterChannel = ({ label, value, unit, min, max, status, decimals = 1, thresholds, rowIndex = 0, animated = false }: MeterChannelProps) => {
  const isMissing = value === null || status === null;
  const pct = isMissing ? 0 : Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const led = isMissing ? null : ledColors[status.color];
  const delay = rowIndex * 80;
  const animatedValue = useAnimatedNumber(value, animated, 400, delay);

  return (
    <div style={{ padding: "10px 14px", borderBottom: "1px solid hsl(0 0% 94%)" }}>
      <div className="flex items-center gap-3">
        {/* Label */}
        <div className="shrink-0" style={{ minWidth: 70 }}>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <span
                className="uppercase cursor-help"
                style={{ fontFamily: MONO, fontSize: 12, letterSpacing: "0.08em", color: isDark ? "#aaa" : "#333", fontWeight: 500 }}
              >
                {label}
              </span>
            </TooltipTrigger>
            {metricTooltips[label] && (
              <TooltipContent
                side="top"
                className="max-w-[200px] text-xs"
                style={{ backgroundColor: "hsl(0 0% 10%)", color: "hsl(0 0% 96%)", border: "1px solid hsl(0 0% 20%)" }}
              >
                {metricTooltips[label]}
              </TooltipContent>
            )}
          </Tooltip>
        </div>

        {/* Gauge bar */}
        <div className="flex-1 relative">
          <div className="relative" style={{ height: 4, borderRadius: 2, backgroundColor: "hsl(0 0% 94%)", overflow: "hidden" }}>
            <div
              style={{
                position: "absolute",
                inset: "0",
                width: animated ? `${pct}%` : `${pct}%`,
                backgroundColor: led ? led.bg : "hsl(0 0% 80%)",
                borderRadius: 2,
                transition: `width 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms`,
              }}
            />
          </div>
          {thresholds?.map((t, i) => (
            <div
              key={i}
              className="absolute"
              style={{ left: `${t.pct}%`, top: -1, bottom: -1, width: 1, backgroundColor: "hsl(var(--foreground) / 0.12)" }}
            >
              <span
                className="absolute"
                style={{ fontFamily: MONO, fontSize: 8, color: "hsl(var(--foreground) / 0.18)", top: -10, left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap", fontWeight: 500 }}
              >
                {t.label}
              </span>
            </div>
          ))}
        </div>

        {/* Status badge */}
        {!isMissing && led && (
          <span
            className="uppercase shrink-0 text-center"
            style={{
              fontFamily: MONO, fontSize: 10, fontWeight: 600, letterSpacing: "0.06em",
              color: led.bg, backgroundColor: led.muted, padding: "2px 6px", borderRadius: 2, lineHeight: 1,
              minWidth: 56, textAlign: "center" as const,
            }}
          >
            {status.label}
          </span>
        )}

        {/* Value */}
        <span
          className="tabular-nums shrink-0"
          style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, color: "hsl(var(--foreground) / 0.9)", letterSpacing: "-0.03em" }}
        >
          {isMissing ? "—" : (animatedValue ?? value).toFixed(decimals)}
        </span>
        <span className="uppercase shrink-0" style={{ fontFamily: MONO, fontSize: 10, color: "#bbb" }}>
          {unit}
        </span>
      </div>
    </div>
  );
};

/* ── Correlation Channel (bipolar) ── */
const CorrelationChannel = ({ value }: { value: number }) => {
  const status = correlationStatus(value);
  const led = ledColors[status.color];
  const pct = ((value + 1) / 2) * 100;
  const clampedPct = Math.max(0, Math.min(100, pct));

  return (
    <div style={{ padding: "10px 14px", borderBottom: "1px solid hsl(0 0% 94%)" }}>
      <div className="flex items-center gap-3">
        <div className="shrink-0" style={{ minWidth: 70 }}>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <span className="uppercase cursor-help" style={{ fontFamily: MONO, fontSize: 12, letterSpacing: "0.08em", color: isDark ? "#aaa" : "#333", fontWeight: 500 }}>Stereo</span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[200px] text-xs" style={{ backgroundColor: "hsl(0 0% 10%)", color: "hsl(0 0% 96%)", border: "1px solid hsl(0 0% 20%)" }}>
              {metricTooltips["Stereo"]}
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex-1 relative">
          <div className="relative" style={{ height: 4, borderRadius: 2, backgroundColor: "hsl(0 0% 94%)", overflow: "hidden" }}>
            <div className="absolute inset-y-0 left-1/2 w-px" style={{ backgroundColor: "hsl(var(--foreground) / 0.15)" }} />
            {clampedPct >= 50 ? (
              <div className="absolute inset-y-0" style={{ left: "50%", width: `${clampedPct - 50}%`, backgroundColor: led.bg, opacity: 0.7, borderRadius: 2 }} />
            ) : (
              <div className="absolute inset-y-0" style={{ left: `${clampedPct}%`, width: `${50 - clampedPct}%`, backgroundColor: led.bg, opacity: 0.7, borderRadius: 2 }} />
            )}
            <div className="absolute" style={{ left: `${clampedPct}%`, top: -1, bottom: -1, width: 2, backgroundColor: led.bg, boxShadow: led.glow, transform: "translateX(-50%)" }} />
          </div>
          <div className="flex justify-between mt-0.5">
            <span style={{ fontFamily: MONO, fontSize: 7, color: "hsl(var(--foreground) / 0.18)", fontWeight: 700 }}>−1</span>
            <span style={{ fontFamily: MONO, fontSize: 7, color: "hsl(var(--foreground) / 0.18)", fontWeight: 700 }}>0</span>
            <span style={{ fontFamily: MONO, fontSize: 7, color: "hsl(var(--foreground) / 0.18)", fontWeight: 700 }}>+1</span>
          </div>
        </div>
        <span className="uppercase shrink-0 text-center" style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", color: led.bg, backgroundColor: led.muted, padding: "2px 6px", borderRadius: 2, lineHeight: 1, minWidth: 56 }}>{status.label}</span>
        <span className="tabular-nums shrink-0" style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, color: "hsl(var(--foreground) / 0.9)", letterSpacing: "-0.03em" }}>{value > 0 ? "+" : ""}{value.toFixed(2)}</span>
      </div>
    </div>
  );
};

/* ── Sub/Kick Channel ── */
const SubKickChannel = ({ value }: { value: number }) => {
  const status = subKickStatus(value);
  const led = ledColors[status.color];
  const pct = Math.max(0, Math.min(100, (value / 2) * 100));

  return (
    <div style={{ padding: "10px 14px" }}>
      <div className="flex items-center gap-3">
        <div className="shrink-0" style={{ minWidth: 70 }}>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <span className="uppercase cursor-help" style={{ fontFamily: MONO, fontSize: 12, letterSpacing: "0.08em", color: isDark ? "#aaa" : "#333", fontWeight: 500 }}>Sub/Kick</span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[200px] text-xs" style={{ backgroundColor: "hsl(0 0% 10%)", color: "hsl(0 0% 96%)", border: "1px solid hsl(0 0% 20%)" }}>
              {metricTooltips["Sub/Kick"]}
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex-1 relative">
          <div className="flex items-center gap-1.5">
            <span style={{ fontFamily: MONO, fontSize: 8, fontWeight: 700, color: "hsl(var(--foreground) / 0.18)" }}>K</span>
            <div className="relative flex-1" style={{ height: 4, borderRadius: 2, backgroundColor: "hsl(0 0% 94%)", overflow: "hidden" }}>
              <div className="absolute inset-y-0" style={{ left: "50%", width: 1, backgroundColor: "hsl(var(--foreground) / 0.12)" }} />
              <div className="absolute" style={{ left: `${pct}%`, top: -1, bottom: -1, width: 2, backgroundColor: led.bg, boxShadow: led.glow, transform: "translateX(-50%)" }} />
            </div>
            <span style={{ fontFamily: MONO, fontSize: 8, fontWeight: 700, color: "hsl(var(--foreground) / 0.18)" }}>S</span>
          </div>
        </div>
        <span className="uppercase shrink-0 text-center" style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", color: led.bg, backgroundColor: led.muted, padding: "2px 6px", borderRadius: 2, lineHeight: 1, minWidth: 56 }}>{status.label}</span>
        <span className="tabular-nums shrink-0" style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, color: "hsl(var(--foreground) / 0.9)" }}>{value.toFixed(2)}</span>
      </div>
    </div>
  );
};

/* ── Section Divider ── */
const SectionDivider = ({ label }: { label: string }) => (
  <div
    style={{
      padding: "16px 14px 8px",
      borderBottom: "1px solid hsl(0 0% 91%)",
      marginBottom: 4,
    }}
  >
    <span
      className="uppercase"
      style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.15em", color: "hsl(0 0% 60%)", fontWeight: 500 }}
    >
      {label}
    </span>
  </div>
);

/* ── Main Component ── */
interface Props {
  metrics: TechnicalMetricsType;
  compact?: boolean;
}

const TechnicalMetrics = ({ metrics }: Props) => {
  const [animated, setAnimated] = useState(false);
  const isDark = typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark";

  useEffect(() => {
    const t = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const hasAny =
    metrics.integrated_lufs !== undefined ||
    metrics.short_term_lufs !== undefined ||
    metrics.dynamic_range !== undefined ||
    metrics.peak_dbtp !== undefined ||
    metrics.stereo_correlation !== undefined ||
    metrics.crest_factor !== undefined ||
    metrics.sub_kick_ratio !== undefined ||
    metrics.lra !== undefined;

  if (!hasAny) return null;

  const il = metrics.integrated_lufs ?? null;
  const stl = metrics.short_term_lufs ?? null;
  const dr = metrics.dynamic_range ?? null;
  const peak = metrics.peak_dbtp ?? null;
  const sc = metrics.stereo_correlation ?? null;
  const cf = metrics.crest_factor ?? null;
  const lra = metrics.lra ?? null;

  const lufsThresholds = [
    { pct: ((-14 - (-24)) / ((-6) - (-24))) * 100, label: "-14" },
    { pct: ((-9 - (-24)) / ((-6) - (-24))) * 100, label: "-9" },
  ];
  const peakThresholds = [
    { pct: ((-3 - (-6)) / (0 - (-6))) * 100, label: "-3" },
    { pct: ((-1 - (-6)) / (0 - (-6))) * 100, label: "-1" },
  ];

  return (
    <TooltipProvider>
    <section
      style={{
        backgroundColor: "hsl(var(--panel-bg))",
        border: "1px solid hsl(var(--foreground) / 0.07)",
        borderRadius: 2,
        boxShadow: "inset 0 1px 4px hsl(var(--panel-inset))",
        overflow: "hidden",
      }}
    >
      {/* Loudness section */}
      <SectionDivider label="Loudness" />
      <MeterChannel label="Int. LUFS" value={il} unit="LUFS" min={-24} max={-6} status={il !== null ? lufsStatus(il) : null} thresholds={lufsThresholds} rowIndex={0} animated={animated} />
      <MeterChannel label="ST LUFS" value={stl} unit="LUFS" min={-24} max={-6} status={stl !== null ? lufsStatus(stl) : null} thresholds={lufsThresholds} rowIndex={1} animated={animated} />
      <MeterChannel label="LRA" value={lra} unit="LU" min={0} max={20} status={lra !== null ? lraStatus(lra) : null} thresholds={[{ pct: 40, label: "8" }, { pct: 70, label: "14" }]} rowIndex={2} animated={animated} />

      {/* Dynamics section */}
      <SectionDivider label="Dynamics" />
      <MeterChannel label="DR" value={dr} unit="DR" min={0} max={20} status={dr !== null ? drStatus(dr) : null} thresholds={[{ pct: 30, label: "6" }, { pct: 40, label: "8" }]} rowIndex={3} animated={animated} />
      <MeterChannel label="Peak" value={peak} unit="dBTP" min={-6} max={0} status={peak !== null ? peakStatus(peak) : null} decimals={1} thresholds={peakThresholds} rowIndex={4} animated={animated} />
      <MeterChannel label="Crest" value={cf} unit="dB" min={0} max={20} status={cf !== null ? crestStatus(cf) : null} thresholds={[{ pct: 30, label: "6" }, { pct: 50, label: "10" }]} rowIndex={5} animated={animated} />

      {/* Stereo section */}
      <SectionDivider label="Stereo / Balance" />
      {sc !== null ? (
        <CorrelationChannel value={sc} />
      ) : (
        <MeterChannel label="Stereo" value={null} unit="" min={-1} max={1} status={null} rowIndex={6} animated={animated} />
      )}
      {metrics.sub_kick_ratio !== undefined && (
        <SubKickChannel value={metrics.sub_kick_ratio} />
      )}
    </section>
    </TooltipProvider>
  );
};

export default TechnicalMetrics;
