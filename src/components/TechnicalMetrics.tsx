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

function subKickStatus(v: number): Status {
  if (v >= 0.8 && v <= 1.2) return { label: "Balanced", color: "green" };
  if (v < 0.5 || v > 1.5) return { label: v < 0.5 ? "Kick Dominant" : "Sub Heavy", color: "red" };
  return { label: v < 0.8 ? "Kick Dominant" : "Sub Heavy", color: "yellow" };
}

const statusColors = {
  green: { badge: "bg-emerald-500/15 text-emerald-500", bar: "bg-emerald-500" },
  yellow: { badge: "bg-amber-500/15 text-amber-500", bar: "bg-amber-500" },
  red: { badge: "bg-red-500/15 text-red-500", bar: "bg-red-500" },
};

interface MetricCardProps {
  label: string;
  value: number | null;
  unit: string;
  min: number;
  max: number;
  status: Status | null;
}

const MetricCard = ({ label, value, unit, min, max, status }: MetricCardProps) => {
  const isMissing = value === null || status === null;
  const pct = isMissing ? 0 : Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const colors = isMissing ? null : statusColors[status.color];

  return (
    <div className="rounded-xl border border-border-subtle p-5 bg-background flex flex-col justify-between min-h-[128px]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span
              className="text-2xl font-bold text-foreground tabular-nums tracking-tight"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {isMissing ? "—" : value.toFixed(1)}
            </span>
            {!isMissing && (
              <span
                className="text-sm text-muted-foreground font-medium"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                {unit}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1 tracking-wide">{label}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${
            isMissing ? "bg-muted text-muted-foreground/50" : colors!.badge
          }`}
        >
          {isMissing ? "N/A" : status.label}
        </span>
      </div>
      <div className="h-1 rounded-full bg-muted/50 overflow-hidden mt-4">
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

const CorrelationCard = ({ value }: { value: number }) => {
  const status = correlationStatus(value);
  const colors = statusColors[status.color];
  const pct = ((value + 1) / 2) * 100;
  const clampedPct = Math.max(0, Math.min(100, pct));

  return (
    <div className="rounded-xl border border-border-subtle p-5 bg-background flex flex-col justify-between min-h-[128px]">
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

      <div className="relative h-1 rounded-full bg-muted/50 overflow-hidden mt-4">
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

const SubKickCard = ({ value }: { value: number }) => {
  const status = subKickStatus(value);
  const colors = statusColors[status.color];
  // 0 = full KICK, 2 = full SUB, 1 = balanced center
  const pct = Math.max(0, Math.min(100, (value / 2) * 100));

  return (
    <div className="rounded-xl border border-border-subtle p-5 bg-background flex flex-col justify-between min-h-[128px]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground tracking-wide">Sub / Kick Ratio</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${colors.badge}`}
        >
          {status.label}
        </span>
      </div>

      <div className="mt-4">
        <div className="flex justify-between mb-2">
          <span
            className="text-[10px] text-muted-foreground/70 font-semibold tracking-widest uppercase"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Kick
          </span>
          <span
            className="text-[10px] text-muted-foreground/70 font-semibold tracking-widest uppercase"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Sub
          </span>
        </div>

        {/* Track with balanced zone and dot indicator */}
        <div className="relative h-1.5 rounded-full bg-muted/50">
          {/* Balanced zone highlight */}
          <div
            className="absolute inset-y-0 bg-emerald-500/10 rounded-full"
            style={{ left: "40%", width: "20%" }}
          />
          {/* Center tick */}
          <div className="absolute top-1/2 left-1/2 -translate-x-px -translate-y-1/2 w-0.5 h-3 bg-foreground/8" />
          {/* Indicator dot — sits centered on the track */}
          <div
            className={`absolute top-1/2 w-3 h-3 rounded-full border-2 border-background shadow-sm transition-all duration-700 ease-out ${colors.bar}`}
            style={{
              left: `calc(${pct}% - 6px)`,
              transform: "translateY(-50%)",
            }}
          />
        </div>
      </div>

      <div className="mt-3 text-center">
        <span
          className="text-lg font-bold text-foreground tabular-nums tracking-tight"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          {value.toFixed(2)}
        </span>
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
    metrics.crest_factor !== undefined ||
    metrics.sub_kick_ratio !== undefined;

  if (!hasAny) return null;

  if (metrics.peak_dbtp === undefined) {
    console.warn("[metrics] peak dBTP missing, rendering placeholder card");
  }

  const definedCount = [
    metrics.integrated_lufs,
    metrics.short_term_lufs,
    metrics.dynamic_range,
    metrics.peak_dbtp,
    metrics.stereo_correlation,
    metrics.crest_factor,
  ].filter((v) => v !== undefined).length;

  const isPartial = definedCount < 4;

  const il = metrics.integrated_lufs ?? null;
  const stl = metrics.short_term_lufs ?? null;
  const dr = metrics.dynamic_range ?? null;
  const peak = metrics.peak_dbtp ?? null;
  const sc = metrics.stereo_correlation ?? null;
  const cf = metrics.crest_factor ?? null;

  return (
    <section>
      <div className="flex items-baseline justify-between mb-5">
        <h2 className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase">
          Technical metrics
        </h2>
        <span className="font-mono-brand text-[10px] text-muted-foreground/40 tracking-wide">
          {isPartial ? "Partial measurement" : "Measured on full track"}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Integrated LUFS" value={il} unit="LUFS" min={-24} max={-6} status={il !== null ? lufsStatus(il) : null} />
        <MetricCard label="Short-Term LUFS" value={stl} unit="LUFS" min={-24} max={-6} status={stl !== null ? lufsStatus(stl) : null} />
        <MetricCard label="Dynamic Range" value={dr} unit="DR" min={0} max={20} status={dr !== null ? drStatus(dr) : null} />
        <MetricCard label="Peak dBTP" value={peak} unit="dBTP" min={-6} max={0} status={peak !== null ? peakStatus(peak) : null} />
        {sc !== null ? (
          <CorrelationCard value={sc} />
        ) : (
          <MetricCard label="Stereo Correlation" value={null} unit="" min={-1} max={1} status={null} />
        )}
        <MetricCard label="Crest Factor" value={cf} unit="dB" min={0} max={20} status={cf !== null ? crestStatus(cf) : null} />
      </div>
      {metrics.sub_kick_ratio !== undefined && (
        <div className="mt-3">
          <SubKickCard value={metrics.sub_kick_ratio} />
        </div>
      )}
    </section>
  );
};

export default TechnicalMetrics;
