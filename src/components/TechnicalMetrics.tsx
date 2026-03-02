import type { TechnicalMetrics as TechnicalMetricsType } from "@/pages/Analyze";

type Status = { label: string; color: "green" | "yellow" | "red" };

function lufsStatus(v: number): Status {
  if (v >= -14 && v <= -9) return { label: "Streaming Ready", color: "green" };
  if ((v >= -16 && v < -14) || (v > -9 && v <= -7)) return { label: v > -9 ? "A Bit Hot" : "A Bit Quiet", color: "yellow" };
  if (v > -7) return { label: "Too Hot", color: "red" };
  return { label: "Too Quiet", color: "red" };
}

function drStatus(v: number): Status {
  if (v > 8) return { label: "Dynamic", color: "green" };
  if (v >= 6) return { label: "Moderate", color: "yellow" };
  return { label: "Over-compressed", color: "red" };
}

function peakStatus(v: number): Status {
  if (v < -1) return { label: "Safe", color: "green" };
  return { label: "Clipping Risk", color: "red" };
}

function correlationStatus(v: number): Status {
  if (v > 0.4) return { label: "Healthy", color: "green" };
  if (v >= 0) return { label: "Narrow", color: "yellow" };
  return { label: "Phase Issues", color: "red" };
}

function crestStatus(v: number): Status {
  if (v > 10) return { label: "Dynamic", color: "green" };
  if (v >= 6) return { label: "Compressed", color: "yellow" };
  return { label: "Brick-Walled", color: "red" };
}

const statusColors = {
  green: { badge: "bg-emerald-500/15 text-emerald-400", bar: "bg-emerald-500" },
  yellow: { badge: "bg-amber-500/15 text-amber-400", bar: "bg-amber-500" },
  red: { badge: "bg-red-500/15 text-red-400", bar: "bg-red-500" },
};

interface MetricCardProps {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  status: Status;
  /** Optional zones to color the bar background */
  barZones?: Array<{ from: number; to: number; color: string }>;
}

const MetricCard = ({ label, value, unit, min, max, status }: MetricCardProps) => {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const colors = statusColors[status.color];

  return (
    <div className="rounded-xl border border-border-subtle p-6 space-y-4 bg-background">
      {/* Top row: value + status badge */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span
              className="text-2xl font-bold text-foreground tabular-nums tracking-tight"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {value.toFixed(1)}
            </span>
            <span
              className="text-sm text-muted-foreground font-medium"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {unit}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 tracking-wide">{label}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${colors.badge}`}
        >
          {status.label}
        </span>
      </div>

      {/* Bar */}
      <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${colors.bar}`}
          style={{ width: `${pct}%`, opacity: 0.8 }}
        />
      </div>
    </div>
  );
};

/** Stereo correlation gets a special centered bar */
const CorrelationCard = ({ value }: { value: number }) => {
  const status = correlationStatus(value);
  const colors = statusColors[status.color];
  // Map -1..+1 → 0..100
  const pct = ((value + 1) / 2) * 100;
  const clampedPct = Math.max(0, Math.min(100, pct));

  return (
    <div className="rounded-xl border border-border-subtle p-6 space-y-4 bg-background">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span
              className="text-2xl font-bold text-foreground tabular-nums tracking-tight"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {value > 0 ? "+" : ""}{value.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 tracking-wide">Stereo Correlation</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${colors.badge}`}
        >
          {status.label}
        </span>
      </div>

      {/* Centered bar */}
      <div className="relative h-1.5 rounded-full bg-muted/40 overflow-hidden">
        {/* Center line */}
        <div className="absolute inset-y-0 left-1/2 w-px bg-foreground/10" />
        {/* Fill from center */}
        {clampedPct >= 50 ? (
          <div
            className={`absolute inset-y-0 rounded-full ${colors.bar}`}
            style={{
              left: "50%",
              width: `${clampedPct - 50}%`,
              opacity: 0.8,
            }}
          />
        ) : (
          <div
            className={`absolute inset-y-0 rounded-full ${colors.bar}`}
            style={{
              left: `${clampedPct}%`,
              width: `${50 - clampedPct}%`,
              opacity: 0.8,
            }}
          />
        )}
      </div>
    </div>
  );
};

interface Props {
  metrics: TechnicalMetricsType;
}

const TechnicalMetrics = ({ metrics }: Props) => {
  const hasAny =
    metrics.integrated_lufs !== undefined ||
    metrics.short_term_lufs !== undefined ||
    metrics.dynamic_range !== undefined ||
    metrics.peak_dbtp !== undefined ||
    metrics.stereo_correlation !== undefined ||
    metrics.crest_factor !== undefined;

  if (!hasAny) return null;

  return (
    <section className="space-y-6">
      <h2 className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase">
        Technical metrics
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {metrics.integrated_lufs !== undefined && (
          <MetricCard
            label="Integrated LUFS"
            value={metrics.integrated_lufs}
            unit="LUFS"
            min={-24}
            max={-6}
            status={lufsStatus(metrics.integrated_lufs)}
          />
        )}
        {metrics.short_term_lufs !== undefined && (
          <MetricCard
            label="Short-Term LUFS"
            value={metrics.short_term_lufs}
            unit="LUFS"
            min={-24}
            max={-6}
            status={lufsStatus(metrics.short_term_lufs)}
          />
        )}
        {metrics.dynamic_range !== undefined && (
          <MetricCard
            label="Dynamic Range"
            value={metrics.dynamic_range}
            unit="DR"
            min={0}
            max={20}
            status={drStatus(metrics.dynamic_range)}
          />
        )}
        {metrics.peak_dbtp !== undefined && (
          <MetricCard
            label="Peak dBTP"
            value={metrics.peak_dbtp}
            unit="dBTP"
            min={-6}
            max={0}
            status={peakStatus(metrics.peak_dbtp)}
          />
        )}
        {metrics.stereo_correlation !== undefined && (
          <CorrelationCard value={metrics.stereo_correlation} />
        )}
        {metrics.crest_factor !== undefined && (
          <MetricCard
            label="Crest Factor"
            value={metrics.crest_factor}
            unit="dB"
            min={0}
            max={20}
            status={crestStatus(metrics.crest_factor)}
          />
        )}
      </div>
    </section>
  );
};

export default TechnicalMetrics;
