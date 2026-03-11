import type { TechnicalMetrics as TechnicalMetricsType } from "@/pages/Analyze";

type Status = { label: string; color: "green" | "orange" | "red" | "blue" };

const MONO = "'IBM Plex Mono', monospace";

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

/* Status LED colors */
const ledColors: Record<string, { bg: string; glow: string; muted: string }> = {
  green: { bg: "hsl(145 60% 42%)", glow: "0 0 5px hsl(145 60% 42% / 0.5)", muted: "hsl(145 60% 42% / 0.12)" },
  orange: { bg: "hsl(35 85% 50%)", glow: "0 0 5px hsl(35 85% 50% / 0.5)", muted: "hsl(35 85% 50% / 0.12)" },
  red: { bg: "hsl(0 65% 48%)", glow: "0 0 5px hsl(0 65% 48% / 0.5)", muted: "hsl(0 65% 48% / 0.12)" },
  blue: { bg: "hsl(210 65% 50%)", glow: "0 0 5px hsl(210 65% 50% / 0.5)", muted: "hsl(210 65% 50% / 0.12)" },
};

const SEGMENTS = 32;

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
}

const MeterChannel = ({ label, value, unit, min, max, status, decimals = 1, thresholds }: MeterChannelProps) => {
  const isMissing = value === null || status === null;
  const pct = isMissing ? 0 : Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const led = isMissing ? null : ledColors[status.color];

  return (
    <div
      style={{
        padding: "0",
        borderBottom: "1px solid hsl(var(--foreground) / 0.04)",
      }}
    >
      <div className="flex items-stretch">
        {/* Left: label column */}
        <div
          className="flex items-center shrink-0"
          style={{
            width: 90,
            padding: "10px 0 10px 12px",
            borderRight: "1px solid hsl(var(--foreground) / 0.05)",
          }}
        >
          <span
            className="text-foreground/50 uppercase tracking-[0.04em] font-medium truncate"
            style={{ fontFamily: MONO, fontSize: 11 }}
          >
            {label}
          </span>
        </div>

        {/* Center: meter + thresholds */}
        <div className="flex-1 flex flex-col justify-center px-2" style={{ padding: "12px 14px" }}>
          {/* Segmented bar */}
          <div className="relative">
            <div className="flex gap-px" style={{ height: 7 }}>
              {Array.from({ length: SEGMENTS }).map((_, i) => {
                const segPct = ((i + 1) / SEGMENTS) * 100;
                const filled = pct >= segPct;
                // Color ramp: last 20% of bar shifts to warm/red for "hot" zones
                const isHotZone = i >= SEGMENTS * 0.8;
                const fillColor = filled && led
                  ? (isHotZone && (status?.color === "red" || status?.color === "orange") ? led.bg : led.bg)
                  : "hsl(var(--foreground) / 0.035)";
                return (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      backgroundColor: fillColor,
                      opacity: filled ? (0.4 + (i / SEGMENTS) * 0.6) : 1,
                      borderRadius: 0,
                    }}
                  />
                );
              })}
            </div>
            {/* Threshold tick marks */}
            {thresholds?.map((t, i) => (
              <div
                key={i}
                className="absolute"
                style={{
                  left: `${t.pct}%`,
                  top: -1,
                  bottom: -2,
                  width: 1,
                  backgroundColor: "hsl(var(--foreground) / 0.12)",
                }}
              >
                <span
                  className="absolute text-foreground/18 font-medium"
                  style={{
                    fontFamily: MONO,
                    fontSize: 8,
                    top: -9,
                    left: "50%",
                    transform: "translateX(-50%)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: value + unit + LED */}
        <div
          className="flex items-center gap-2.5 shrink-0"
          style={{
            padding: "14px 14px 14px 0",
            borderLeft: "1px solid hsl(var(--foreground) / 0.05)",
            minWidth: 115,
            justifyContent: "flex-end",
          }}
        >
          {/* Status tag */}
          {!isMissing && led && (
            <span
              className="font-medium uppercase tracking-[0.05em]"
              style={{
                fontFamily: MONO,
                fontSize: 10,
                color: led.bg,
                padding: "4px 7px",
                backgroundColor: led.muted,
                borderRadius: 2,
                lineHeight: 1,
              }}
            >
              {status.label}
            </span>
          )}
          <span
            className="text-foreground/90 tabular-nums font-medium"
            style={{ fontFamily: MONO, fontSize: 18, letterSpacing: "-0.03em" }}
          >
            {isMissing ? "—" : value.toFixed(decimals)}
          </span>
          <span
            className="text-foreground/35 font-normal uppercase"
            style={{ fontFamily: MONO, fontSize: 11 }}
          >
            {unit}
          </span>
          {/* LED */}
          <div
            className="w-[8px] h-[8px] rounded-full shrink-0"
            style={{
              backgroundColor: led ? led.bg : "hsl(var(--foreground) / 0.08)",
              boxShadow: led ? led.glow : "none",
            }}
          />
        </div>
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
    <div style={{ borderBottom: "1px solid hsl(var(--foreground) / 0.04)" }}>
      <div className="flex items-stretch">
        {/* Label */}
        <div
          className="flex items-center shrink-0"
          style={{ width: 90, padding: "8px 0 8px 12px", borderRight: "1px solid hsl(var(--foreground) / 0.05)" }}
        >
          <span className="text-foreground/50 uppercase tracking-[0.06em] font-medium" style={{ fontFamily: MONO, fontSize: 12 }}>
            Stereo
          </span>
        </div>

        {/* Bipolar meter */}
        <div className="flex-1 flex flex-col justify-center" style={{ padding: "9px 10px" }}>
          <div className="relative" style={{ height: 6 }}>
            {/* Background segments */}
            <div className="absolute inset-0 flex gap-px">
              {Array.from({ length: SEGMENTS }).map((_, i) => (
                <div
                  key={i}
                  style={{ flex: 1, backgroundColor: "hsl(var(--foreground) / 0.035)" }}
                />
              ))}
            </div>
            {/* Center line */}
            <div className="absolute inset-y-0 left-1/2 w-px" style={{ backgroundColor: "hsl(var(--foreground) / 0.15)" }} />
            {/* L / R scale labels */}
            <span className="absolute text-foreground/15 font-bold" style={{ fontFamily: MONO, fontSize: 7, top: -10, left: 0 }}>−1</span>
            <span className="absolute text-foreground/15 font-bold" style={{ fontFamily: MONO, fontSize: 7, top: -10, left: "50%", transform: "translateX(-50%)" }}>0</span>
            <span className="absolute text-foreground/15 font-bold" style={{ fontFamily: MONO, fontSize: 7, top: -10, right: 0 }}>+1</span>
            {/* Fill */}
            {clampedPct >= 50 ? (
              <div
                className="absolute inset-y-0"
                style={{ left: "50%", width: `${clampedPct - 50}%`, backgroundColor: led.bg, opacity: 0.7 }}
              />
            ) : (
              <div
                className="absolute inset-y-0"
                style={{ left: `${clampedPct}%`, width: `${50 - clampedPct}%`, backgroundColor: led.bg, opacity: 0.7 }}
              />
            )}
            {/* Needle */}
            <div
              className="absolute"
              style={{
                left: `${clampedPct}%`,
                top: -1,
                bottom: -1,
                width: 2,
                backgroundColor: led.bg,
                boxShadow: led.glow,
                transform: "translateX(-50%)",
              }}
            />
          </div>
        </div>

        {/* Value */}
        <div
          className="flex items-center gap-1.5 shrink-0"
          style={{ padding: "8px 12px 8px 0", borderLeft: "1px solid hsl(var(--foreground) / 0.05)", minWidth: 95, justifyContent: "flex-end" }}
        >
          <span
            className="font-medium uppercase tracking-[0.06em]"
            style={{ fontFamily: MONO, fontSize: 10, color: led.bg, padding: "4px 7px", backgroundColor: led.muted, borderRadius: 2, lineHeight: 1 }}
          >
            {status.label}
          </span>
          <span className="text-foreground/90 tabular-nums font-medium" style={{ fontFamily: MONO, fontSize: 16, letterSpacing: "-0.03em" }}>
            {value > 0 ? "+" : ""}{value.toFixed(2)}
          </span>
          <div className="w-[8px] h-[8px] rounded-full shrink-0" style={{ backgroundColor: led.bg, boxShadow: led.glow }} />
        </div>
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
    <div>
      <div className="flex items-stretch">
        {/* Label */}
        <div
          className="flex items-center shrink-0"
          style={{ width: 100, padding: "12px 0 12px 14px", borderRight: "1px solid hsl(var(--foreground) / 0.05)" }}
        >
          <span className="text-foreground/50 uppercase tracking-[0.06em] font-medium" style={{ fontFamily: MONO, fontSize: 12 }}>
            Sub/Kick
          </span>
        </div>

        {/* Bipolar meter with needle */}
        <div className="flex-1 flex flex-col justify-center" style={{ padding: "9px 10px" }}>
          <div className="flex items-center gap-1.5">
            <span className="text-foreground/18 shrink-0" style={{ fontFamily: MONO, fontSize: 8, fontWeight: 700 }}>K</span>
            <div className="relative flex-1" style={{ height: 6 }}>
              <div className="absolute inset-0 flex gap-px">
                {Array.from({ length: SEGMENTS }).map((_, i) => (
                  <div key={i} style={{ flex: 1, backgroundColor: "hsl(var(--foreground) / 0.035)" }} />
                ))}
              </div>
              <div className="absolute inset-y-0" style={{ left: "50%", width: 1, backgroundColor: "hsl(var(--foreground) / 0.12)" }} />
              {/* Needle */}
              <div
                className="absolute"
                style={{
                  left: `${pct}%`,
                  top: -2,
                  bottom: -2,
                  width: 2,
                  backgroundColor: led.bg,
                  boxShadow: led.glow,
                  transform: "translateX(-50%)",
                }}
              />
            </div>
            <span className="text-foreground/18 shrink-0" style={{ fontFamily: MONO, fontSize: 8, fontWeight: 700 }}>S</span>
          </div>
        </div>

        {/* Value */}
        <div
          className="flex items-center gap-1.5 shrink-0"
          style={{ padding: "8px 12px 8px 0", borderLeft: "1px solid hsl(var(--foreground) / 0.05)", minWidth: 95, justifyContent: "flex-end" }}
        >
          <span
            className="font-medium uppercase tracking-[0.06em]"
            style={{ fontFamily: MONO, fontSize: 10, color: led.bg, padding: "4px 7px", backgroundColor: led.muted, borderRadius: 2, lineHeight: 1 }}
          >
            {status.label}
          </span>
          <span className="text-foreground/90 tabular-nums font-medium" style={{ fontFamily: MONO, fontSize: 16 }}>
            {value.toFixed(2)}
          </span>
          <div className="w-[8px] h-[8px] rounded-full shrink-0" style={{ backgroundColor: led.bg, boxShadow: led.glow }} />
        </div>
      </div>
    </div>
  );
};

/* ── Section Divider ── */
const SectionDivider = ({ label }: { label: string }) => (
  <div
    style={{
      padding: "6px 12px",
      backgroundColor: "hsl(var(--panel-header))",
      borderBottom: "1px solid hsl(var(--foreground) / 0.06)",
      borderTop: "1px solid hsl(var(--foreground) / 0.06)",
    }}
  >
    <span
      className="text-foreground/25 uppercase tracking-[0.12em] font-bold"
      style={{ fontFamily: MONO, fontSize: 9 }}
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

  // LUFS thresholds: -14 and -9
  const lufsThresholds = [
    { pct: ((-14 - (-24)) / ((-6) - (-24))) * 100, label: "-14" },
    { pct: ((-9 - (-24)) / ((-6) - (-24))) * 100, label: "-9" },
  ];
  // Peak threshold: -1 dBTP
  const peakThresholds = [
    { pct: ((-3 - (-6)) / (0 - (-6))) * 100, label: "-3" },
    { pct: ((-1 - (-6)) / (0 - (-6))) * 100, label: "-1" },
  ];

  return (
    <section
      style={{
        backgroundColor: "hsl(var(--panel-bg))",
        border: "1px solid hsl(var(--foreground) / 0.07)",
        borderRadius: 2,
        boxShadow: "inset 0 1px 4px hsl(var(--panel-inset))",
        overflow: "hidden",
      }}
    >
      {/* Module header */}
      <div
        className="flex items-center"
        style={{
          padding: "7px 12px",
          backgroundColor: "hsl(var(--panel-header))",
          borderBottom: "2px solid hsl(var(--foreground) / 0.08)",
        }}
      >
        <span
          className="text-foreground/45 uppercase tracking-[0.14em] font-extrabold"
          style={{ fontFamily: MONO, fontSize: 9 }}
        >
          Metering
        </span>
      </div>

      {/* Loudness section */}
      <SectionDivider label="Loudness" />
      <MeterChannel label="Int. LUFS" value={il} unit="LUFS" min={-24} max={-6} status={il !== null ? lufsStatus(il) : null} thresholds={lufsThresholds} />
      <MeterChannel label="ST LUFS" value={stl} unit="LUFS" min={-24} max={-6} status={stl !== null ? lufsStatus(stl) : null} thresholds={lufsThresholds} />
      <MeterChannel label="LRA" value={lra} unit="LU" min={0} max={20} status={lra !== null ? lraStatus(lra) : null} thresholds={[{ pct: 40, label: "8" }, { pct: 70, label: "14" }]} />

      {/* Dynamics section */}
      <SectionDivider label="Dynamics" />
      <MeterChannel label="DR" value={dr} unit="DR" min={0} max={20} status={dr !== null ? drStatus(dr) : null} thresholds={[{ pct: 30, label: "6" }, { pct: 40, label: "8" }]} />
      <MeterChannel label="Peak" value={peak} unit="dBTP" min={-6} max={0} status={peak !== null ? peakStatus(peak) : null} decimals={1} thresholds={peakThresholds} />
      <MeterChannel label="Crest" value={cf} unit="dB" min={0} max={20} status={cf !== null ? crestStatus(cf) : null} thresholds={[{ pct: 30, label: "6" }, { pct: 50, label: "10" }]} />

      {/* Stereo section */}
      <SectionDivider label="Stereo / Balance" />
      {sc !== null ? (
        <CorrelationChannel value={sc} />
      ) : (
        <MeterChannel label="Stereo" value={null} unit="" min={-1} max={1} status={null} />
      )}
      {metrics.sub_kick_ratio !== undefined && (
        <SubKickChannel value={metrics.sub_kick_ratio} />
      )}
    </section>
  );
};

export default TechnicalMetrics;
