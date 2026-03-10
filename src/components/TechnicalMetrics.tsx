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

/* Status LED colors — hardware indicator style */
const ledColors: Record<string, { bg: string; glow: string }> = {
  green: { bg: "hsl(145 60% 42%)", glow: "0 0 4px hsl(145 60% 42% / 0.4)" },
  orange: { bg: "hsl(35 85% 50%)", glow: "0 0 4px hsl(35 85% 50% / 0.4)" },
  red: { bg: "hsl(0 65% 48%)", glow: "0 0 4px hsl(0 65% 48% / 0.4)" },
  blue: { bg: "hsl(210 65% 50%)", glow: "0 0 4px hsl(210 65% 50% / 0.4)" },
};

/* ── Meter Row — horizontal strip like a hardware channel meter ── */
interface MeterRowProps {
  label: string;
  value: number | null;
  unit: string;
  min: number;
  max: number;
  status: Status | null;
  decimals?: number;
}

const MeterRow = ({ label, value, unit, min, max, status, decimals = 1 }: MeterRowProps) => {
  const isMissing = value === null || status === null;
  const pct = isMissing ? 0 : Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const led = isMissing ? null : ledColors[status.color];

  return (
    <div
      style={{
        padding: "6px 8px",
        borderBottom: "1px solid hsl(var(--foreground) / 0.05)",
      }}
    >
      {/* Top line: label + value + LED */}
      <div className="flex items-center justify-between gap-2 mb-1">
        <span
          className="text-foreground/45 uppercase tracking-[0.08em] font-bold truncate"
          style={{ fontFamily: MONO, fontSize: 8 }}
        >
          {label}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="text-foreground/80 tabular-nums font-bold"
            style={{ fontFamily: MONO, fontSize: 13, letterSpacing: "-0.02em" }}
          >
            {isMissing ? "—" : value.toFixed(decimals)}
          </span>
          {!isMissing && (
            <span
              className="text-foreground/35 font-medium uppercase"
              style={{ fontFamily: MONO, fontSize: 8 }}
            >
              {unit}
            </span>
          )}
          {/* LED indicator */}
          <div
            className="w-[6px] h-[6px] rounded-full shrink-0"
            style={{
              backgroundColor: led ? led.bg : "hsl(var(--foreground) / 0.1)",
              boxShadow: led ? led.glow : "none",
            }}
          />
        </div>
      </div>
      {/* Segmented meter bar */}
      <div className="flex gap-[1px]" style={{ height: 3 }}>
        {Array.from({ length: 20 }).map((_, i) => {
          const segPct = (i + 1) * 5;
          const filled = pct >= segPct;
          return (
            <div
              key={i}
              className="flex-1"
              style={{
                backgroundColor: filled && led
                  ? `${led.bg}`
                  : "hsl(var(--foreground) / 0.04)",
                opacity: filled ? (0.5 + (i / 20) * 0.5) : 1,
                borderRadius: 0.5,
              }}
            />
          );
        })}
      </div>
      {/* Status label */}
      {!isMissing && (
        <div className="mt-1 flex justify-end">
          <span
            className="text-foreground/30 uppercase tracking-[0.1em] font-bold"
            style={{ fontFamily: MONO, fontSize: 7 }}
          >
            {status.label}
          </span>
        </div>
      )}
    </div>
  );
};

/* ── Correlation Row ── */
const CorrelationRow = ({ value }: { value: number }) => {
  const status = correlationStatus(value);
  const led = ledColors[status.color];
  const pct = ((value + 1) / 2) * 100;
  const clampedPct = Math.max(0, Math.min(100, pct));

  return (
    <div
      style={{
        padding: "6px 8px",
        borderBottom: "1px solid hsl(var(--foreground) / 0.05)",
      }}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <span
          className="text-foreground/45 uppercase tracking-[0.08em] font-bold"
          style={{ fontFamily: MONO, fontSize: 8 }}
        >
          Stereo Corr
        </span>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="text-foreground/80 tabular-nums font-bold"
            style={{ fontFamily: MONO, fontSize: 13, letterSpacing: "-0.02em" }}
          >
            {value > 0 ? "+" : ""}{value.toFixed(2)}
          </span>
          <div
            className="w-[6px] h-[6px] rounded-full shrink-0"
            style={{ backgroundColor: led.bg, boxShadow: led.glow }}
          />
        </div>
      </div>
      {/* Bipolar meter */}
      <div className="relative" style={{ height: 3 }}>
        <div className="absolute inset-0 flex gap-[1px]">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="flex-1"
              style={{
                backgroundColor: "hsl(var(--foreground) / 0.04)",
                borderRadius: 0.5,
              }}
            />
          ))}
        </div>
        <div className="absolute inset-y-0 left-1/2 w-px" style={{ backgroundColor: "hsl(var(--foreground) / 0.12)" }} />
        {clampedPct >= 50 ? (
          <div
            className="absolute inset-y-0"
            style={{
              left: "50%",
              width: `${clampedPct - 50}%`,
              backgroundColor: led.bg,
              opacity: 0.7,
              borderRadius: "0 1px 1px 0",
            }}
          />
        ) : (
          <div
            className="absolute inset-y-0"
            style={{
              left: `${clampedPct}%`,
              width: `${50 - clampedPct}%`,
              backgroundColor: led.bg,
              opacity: 0.7,
              borderRadius: "1px 0 0 1px",
            }}
          />
        )}
      </div>
      <div className="mt-1 flex justify-end">
        <span
          className="text-foreground/30 uppercase tracking-[0.1em] font-bold"
          style={{ fontFamily: MONO, fontSize: 7 }}
        >
          {status.label}
        </span>
      </div>
    </div>
  );
};

/* ── Sub/Kick Row ── */
const SubKickRow = ({ value }: { value: number }) => {
  const status = subKickStatus(value);
  const led = ledColors[status.color];
  const pct = Math.max(0, Math.min(100, (value / 2) * 100));

  return (
    <div style={{ padding: "6px 8px" }}>
      <div className="flex items-center justify-between gap-2 mb-1">
        <span
          className="text-foreground/45 uppercase tracking-[0.08em] font-bold"
          style={{ fontFamily: MONO, fontSize: 8 }}
        >
          Sub/Kick
        </span>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="text-foreground/80 tabular-nums font-bold"
            style={{ fontFamily: MONO, fontSize: 13 }}
          >
            {value.toFixed(2)}
          </span>
          <div
            className="w-[6px] h-[6px] rounded-full shrink-0"
            style={{ backgroundColor: led.bg, boxShadow: led.glow }}
          />
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-foreground/25 shrink-0" style={{ fontFamily: MONO, fontSize: 7, fontWeight: 700 }}>K</span>
        <div className="relative flex-1" style={{ height: 3 }}>
          <div className="absolute inset-0 flex gap-[1px]">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="flex-1"
                style={{ backgroundColor: "hsl(var(--foreground) / 0.04)", borderRadius: 0.5 }}
              />
            ))}
          </div>
          <div className="absolute inset-y-0" style={{ left: "50%", width: 1, backgroundColor: "hsl(var(--foreground) / 0.1)" }} />
          <div
            className="absolute top-1/2 rounded-full"
            style={{
              left: `${pct}%`,
              width: 6,
              height: 6,
              transform: "translate(-50%, -50%)",
              backgroundColor: led.bg,
              boxShadow: led.glow,
            }}
          />
        </div>
        <span className="text-foreground/25 shrink-0" style={{ fontFamily: MONO, fontSize: 7, fontWeight: 700 }}>S</span>
      </div>
      <div className="mt-1 flex justify-end">
        <span
          className="text-foreground/30 uppercase tracking-[0.1em] font-bold"
          style={{ fontFamily: MONO, fontSize: 7 }}
        >
          {status.label}
        </span>
      </div>
    </div>
  );
};

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

  return (
    <section
      style={{
        backgroundColor: "hsl(var(--panel-bg))",
        border: "1px solid hsl(var(--foreground) / 0.06)",
        borderRadius: 3,
        boxShadow: "inset 0 1px 3px hsl(var(--panel-inset))",
        overflow: "hidden",
      }}
    >
      {/* Section header strip */}
      <div
        className="flex items-center justify-between px-2.5 py-[5px]"
        style={{
          backgroundColor: "hsl(var(--panel-header))",
          borderBottom: "1px solid hsl(var(--foreground) / 0.08)",
        }}
      >
        <span
          className="text-foreground/40 uppercase tracking-[0.14em] font-extrabold"
          style={{ fontFamily: MONO, fontSize: 7 }}
        >
          Metering
        </span>
        <span
          className="text-foreground/15 uppercase tracking-[0.1em] font-bold"
          style={{ fontFamily: MONO, fontSize: 6 }}
        >
          {[il, stl, dr, peak, sc, cf, lra].filter(v => v !== null).length} ch
        </span>
      </div>

      {/* Meter rows */}
      <MeterRow label="Int. LUFS" value={il} unit="LUFS" min={-24} max={-6} status={il !== null ? lufsStatus(il) : null} />
      <MeterRow label="ST LUFS" value={stl} unit="LUFS" min={-24} max={-6} status={stl !== null ? lufsStatus(stl) : null} />
      <MeterRow label="LRA" value={lra} unit="LU" min={0} max={20} status={lra !== null ? lraStatus(lra) : null} />
      <MeterRow label="DR" value={dr} unit="DR" min={0} max={20} status={dr !== null ? drStatus(dr) : null} />
      <MeterRow label="Peak dBTP" value={peak} unit="dBTP" min={-6} max={0} status={peak !== null ? peakStatus(peak) : null} />
      {sc !== null ? (
        <CorrelationRow value={sc} />
      ) : (
        <MeterRow label="Stereo Corr" value={null} unit="" min={-1} max={1} status={null} />
      )}
      <MeterRow label="Crest" value={cf} unit="dB" min={0} max={20} status={cf !== null ? crestStatus(cf) : null} />
      {metrics.sub_kick_ratio !== undefined && (
        <SubKickRow value={metrics.sub_kick_ratio} />
      )}
    </section>
  );
};

export default TechnicalMetrics;
