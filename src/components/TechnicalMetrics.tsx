import type { TechnicalMetrics as TechnicalMetricsType } from "@/pages/Analyze";

type Status = { label: string; color: "green" | "orange" | "red" | "blue" };

function lufsStatus(v: number): Status {
  if (v >= -14 && v <= -9) return { label: "Streaming Ready", color: "green" };
  if ((v >= -16 && v < -14) || (v > -9 && v <= -7)) return { label: v > -9 ? "A Bit Hot" : "A Bit Quiet", color: "orange" };
  if (v > -7) return { label: "Too Hot", color: "red" };
  return { label: "Too Quiet", color: "red" };
}

function drStatus(v: number): Status {
  if (v > 8) return { label: "Dynamic", color: "green" };
  if (v >= 6) return { label: "Moderate", color: "orange" };
  return { label: "Over-compressed", color: "red" };
}

function peakStatus(v: number): Status {
  if (v > -0.3) return { label: "Clipping Risk", color: "red" };
  if (v >= -1.0) return { label: "Hot", color: "orange" };
  if (v >= -3.0) return { label: "Safe", color: "green" };
  return { label: "Headroom", color: "green" };
}

function correlationStatus(v: number): Status {
  if (v > 0.4) return { label: "Healthy", color: "green" };
  if (v >= 0) return { label: "Narrow", color: "orange" };
  return { label: "Phase Issues", color: "red" };
}

function crestStatus(v: number): Status {
  if (v > 10) return { label: "Dynamic", color: "green" };
  if (v >= 6) return { label: "Compressed", color: "orange" };
  return { label: "Brick-Walled", color: "red" };
}

function subKickStatus(v: number): Status {
  if (v >= 0.8 && v <= 1.2) return { label: "Balanced", color: "green" };
  if (v < 0.5 || v > 1.5) return { label: v < 0.5 ? "Kick Dominant" : "Sub Heavy", color: "red" };
  return { label: v < 0.8 ? "Kick Dominant" : "Sub Heavy", color: "orange" };
}

function lraStatus(v: number): Status {
  if (v < 3) return { label: "Very Compressed", color: "red" };
  if (v <= 8) return { label: "Compressed", color: "orange" };
  if (v <= 14) return { label: "Dynamic", color: "green" };
  return { label: "Very Dynamic", color: "blue" };
}

const statusColors: Record<string, { badge: string; bar: string }> = {
  green: { badge: "bg-emerald-500/15 text-emerald-600", bar: "bg-emerald-500" },
  orange: { badge: "bg-amber-500/15 text-amber-600", bar: "bg-amber-500" },
  red: { badge: "bg-red-500/15 text-red-600", bar: "bg-red-500" },
  blue: { badge: "bg-blue-500/15 text-blue-600", bar: "bg-blue-500" },
};

/* ── Compact Metric Card ── */
interface MetricCardProps {
  label: string;
  value: number | null;
  unit: string;
  min: number;
  max: number;
  status: Status | null;
  decimals?: number;
}

const MetricCard = ({ label, value, unit, min, max, status, decimals = 1 }: MetricCardProps) => {
  const isMissing = value === null || status === null;
  const pct = isMissing ? 0 : Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const colors = isMissing ? null : statusColors[status.color];

  return (
    <div className="rounded-lg border border-border-subtle bg-background" style={{ padding: "8px 10px" }}>
      <div className="flex items-start justify-between gap-1.5">
        <div className="min-w-0">
          <div className="flex items-baseline gap-1">
            <span
              className="font-semibold text-foreground tabular-nums tracking-tight"
              style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 16, lineHeight: 1.1 }}
            >
              {isMissing ? "—" : value.toFixed(decimals)}
            </span>
            {!isMissing && (
              <span
                className="text-muted-foreground font-medium"
                style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}
              >
                {unit}
              </span>
            )}
          </div>
          <p
            className="text-muted-foreground"
            style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 1, lineHeight: 1.2 }}
          >
            {label}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full font-semibold tracking-wide uppercase ${
            isMissing ? "bg-muted text-muted-foreground/50" : colors!.badge
          }`}
          style={{ fontSize: 8, padding: "2px 6px", lineHeight: 1.2 }}
        >
          {isMissing ? "N/A" : status.label}
        </span>
      </div>
      <div className="rounded-full bg-muted/50 overflow-hidden" style={{ height: 3, marginTop: 6 }}>
        {!isMissing && (
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${colors!.bar}`}
            style={{ width: `${pct}%`, opacity: 0.75 }}
          />
        )}
      </div>
    </div>
  );
};

/* ── Correlation Card ── */
const CorrelationCard = ({ value }: { value: number }) => {
  const status = correlationStatus(value);
  const colors = statusColors[status.color];
  const pct = ((value + 1) / 2) * 100;
  const clampedPct = Math.max(0, Math.min(100, pct));

  return (
    <div className="rounded-lg border border-border-subtle bg-background" style={{ padding: "8px 10px" }}>
      <div className="flex items-start justify-between gap-1.5">
        <div className="min-w-0">
          <span
            className="font-semibold text-foreground tabular-nums tracking-tight"
            style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 16, lineHeight: 1.1 }}
          >
            {value > 0 ? "+" : ""}{value.toFixed(2)}
          </span>
          <p
            className="text-muted-foreground"
            style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 1, lineHeight: 1.2 }}
          >
            Stereo Correlation
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full font-semibold tracking-wide uppercase ${colors.badge}`}
          style={{ fontSize: 8, padding: "2px 6px", lineHeight: 1.2 }}
        >
          {status.label}
        </span>
      </div>
      <div className="relative rounded-full bg-muted/50 overflow-hidden" style={{ height: 3, marginTop: 6 }}>
        <div className="absolute inset-y-0 left-1/2 w-px bg-foreground/10" />
        {clampedPct >= 50 ? (
          <div
            className={`absolute inset-y-0 rounded-full ${colors.bar}`}
            style={{ left: "50%", width: `${clampedPct - 50}%`, opacity: 0.75 }}
          />
        ) : (
          <div
            className={`absolute inset-y-0 rounded-full ${colors.bar}`}
            style={{ left: `${clampedPct}%`, width: `${50 - clampedPct}%`, opacity: 0.75 }}
          />
        )}
      </div>
    </div>
  );
};

/* ── Sub/Kick Card ── */
const SubKickCard = ({ value }: { value: number }) => {
  const status = subKickStatus(value);
  const colors = statusColors[status.color];
  const pct = Math.max(0, Math.min(100, (value / 2) * 100));

  return (
    <div className="rounded-lg border border-border-subtle bg-background" style={{ padding: "8px 10px" }}>
      <div className="flex items-start justify-between gap-1.5">
        <p
          className="text-muted-foreground"
          style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", lineHeight: 1.2 }}
        >
          Sub / Kick Ratio
        </p>
        <span
          className={`shrink-0 rounded-full font-semibold tracking-wide uppercase ${colors.badge}`}
          style={{ fontSize: 8, padding: "2px 6px", lineHeight: 1.2 }}
        >
          {status.label}
        </span>
      </div>
      <div className="flex items-center gap-2" style={{ marginTop: 6 }}>
        <span className="text-muted-foreground/60 shrink-0" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.06em" }}>K</span>
        <div className="relative flex-1 rounded-full bg-muted/50" style={{ height: 4 }}>
          <div className="absolute inset-y-0 bg-emerald-500/10 rounded-full" style={{ left: "40%", width: "20%" }} />
          <div className="absolute top-0 bottom-0 bg-foreground/8" style={{ left: "50%", width: 1 }} />
          <div
            className={`absolute top-1/2 rounded-full border border-background ${colors.bar}`}
            style={{ left: `${pct}%`, width: 8, height: 8, transform: "translate(-50%, -50%)" }}
          />
        </div>
        <span className="text-muted-foreground/60 shrink-0" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.06em" }}>S</span>
        <span
          className="font-semibold text-foreground tabular-nums shrink-0"
          style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }}
        >
          {value.toFixed(2)}
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
    metrics.sub_kick_ratio !== undefined;

  if (!hasAny) return null;

  const il = metrics.integrated_lufs ?? null;
  const stl = metrics.short_term_lufs ?? null;
  const dr = metrics.dynamic_range ?? null;
  const peak = metrics.peak_dbtp ?? null;
  const sc = metrics.stereo_correlation ?? null;
  const cf = metrics.crest_factor ?? null;

  return (
    <section>
      <div className="flex items-baseline justify-between mb-2.5">
        <h2 className="font-mono-brand text-[10px] text-muted-foreground tracking-widest uppercase">
          Technical metrics
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-1.5">
        <MetricCard label="Integrated LUFS" value={il} unit="LUFS" min={-24} max={-6} status={il !== null ? lufsStatus(il) : null} />
        <MetricCard label="Short-Term LUFS" value={stl} unit="LUFS" min={-24} max={-6} status={stl !== null ? lufsStatus(stl) : null} />
        <MetricCard label="LRA · Loudness Range" value={lra} unit="LU" min={0} max={20} status={lra !== null ? lraStatus(lra) : null} />
        <MetricCard label="Dynamic Range" value={dr} unit="DR" min={0} max={20} status={dr !== null ? drStatus(dr) : null} />
        <MetricCard label="Peak dBTP" value={peak} unit="dBTP" min={-6} max={0} status={peak !== null ? peakStatus(peak) : null} />
        {sc !== null ? (
          <CorrelationCard value={sc} />
        ) : (
          <MetricCard label="Stereo Correlation" value={null} unit="" min={-1} max={1} status={null} />
        )}
        <MetricCard label="Crest Factor" value={cf} unit="dB" min={0} max={20} status={cf !== null ? crestStatus(cf) : null} />
        {metrics.sub_kick_ratio !== undefined && (
          <SubKickCard value={metrics.sub_kick_ratio} />
        )}
      </div>
    </section>
  );
};

export default TechnicalMetrics;
