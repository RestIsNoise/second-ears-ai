import type { TechnicalMetrics as TechnicalMetricsType } from "@/pages/Analyze";

interface MetricBarProps {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  idealMin?: number;
  idealMax?: number;
  dangerMin?: number;
  dangerMax?: number;
  zones?: Array<{ from: number; to: number; color: string }>;
  invert?: boolean;
}

const MetricBar = ({
  label,
  value,
  unit,
  min,
  max,
  idealMin,
  idealMax,
  zones,
}: MetricBarProps) => {
  const pct = ((value - min) / (max - min)) * 100;
  const clampedPct = Math.max(0, Math.min(100, pct));

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span
          className="text-foreground tabular-nums font-medium"
          style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }}
        >
          {value.toFixed(1)}{" "}
          <span className="text-muted-foreground text-xs">{unit}</span>
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-muted/40 overflow-hidden">
        {/* Zone highlights */}
        {zones &&
          zones.map((z, i) => {
            const left = ((z.from - min) / (max - min)) * 100;
            const width = ((z.to - z.from) / (max - min)) * 100;
            return (
              <div
                key={i}
                className="absolute inset-y-0 rounded-full"
                style={{
                  left: `${Math.max(0, left)}%`,
                  width: `${Math.min(100 - Math.max(0, left), width)}%`,
                  backgroundColor: z.color,
                  opacity: 0.15,
                }}
              />
            );
          })}
        {/* Ideal zone border */}
        {idealMin !== undefined && idealMax !== undefined && (
          <div
            className="absolute inset-y-0 border border-foreground/20 rounded-full"
            style={{
              left: `${((idealMin - min) / (max - min)) * 100}%`,
              width: `${((idealMax - idealMin) / (max - min)) * 100}%`,
            }}
          />
        )}
        {/* Value indicator */}
        <div
          className="absolute top-0 h-full rounded-full bg-foreground/70 transition-all duration-500"
          style={{ width: `${clampedPct}%` }}
        />
      </div>
      {/* Scale labels */}
      <div className="flex justify-between">
        <span
          className="text-muted-foreground"
          style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.02em" }}
        >
          {min}
        </span>
        <span
          className="text-muted-foreground"
          style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.02em" }}
        >
          {max}
        </span>
      </div>
    </div>
  );
};

/** Correlation meter: centered at 0, range -1 to +1 */
const CorrelationMeter = ({ value }: { value: number }) => {
  // Map -1..+1 to 0..100%
  const pct = ((value + 1) / 2) * 100;
  const clampedPct = Math.max(0, Math.min(100, pct));

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-foreground">Stereo Correlation</span>
        <span
          className="text-foreground tabular-nums font-medium"
          style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }}
        >
          {value > 0 ? "+" : ""}
          {value.toFixed(2)}
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-muted/40 overflow-hidden">
        {/* Red zone: -1 to 0 */}
        <div
          className="absolute inset-y-0 rounded-l-full"
          style={{ left: "0%", width: "25%", backgroundColor: "hsl(0 70% 50%)", opacity: 0.12 }}
        />
        {/* Yellow zone: 0 to 0.3 */}
        <div
          className="absolute inset-y-0"
          style={{ left: "50%", width: "15%", backgroundColor: "hsl(45 80% 50%)", opacity: 0.12 }}
        />
        {/* Green zone: 0.3 to 1 */}
        <div
          className="absolute inset-y-0 rounded-r-full"
          style={{ left: "65%", width: "35%", backgroundColor: "hsl(140 60% 40%)", opacity: 0.12 }}
        />
        {/* Center line at 0 */}
        <div
          className="absolute inset-y-0 w-px bg-foreground/20"
          style={{ left: "50%" }}
        />
        {/* Value indicator dot */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-background transition-all duration-500"
          style={{
            left: `${clampedPct}%`,
            transform: `translateX(-50%) translateY(-50%)`,
            backgroundColor:
              value < 0
                ? "hsl(0 70% 50%)"
                : value < 0.3
                ? "hsl(45 80% 50%)"
                : "hsl(140 60% 40%)",
          }}
        />
      </div>
      <div className="flex justify-between">
        <span
          className="text-muted-foreground"
          style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9 }}
        >
          -1
        </span>
        <span
          className="text-muted-foreground"
          style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9 }}
        >
          0
        </span>
        <span
          className="text-muted-foreground"
          style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9 }}
        >
          +1
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
    metrics.stereo_correlation !== undefined;

  if (!hasAny) return null;

  return (
    <section className="space-y-6">
      <h2 className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase">
        Technical metrics
      </h2>
      <div className="rounded-xl border border-border-subtle p-8 bg-background space-y-8">
        {metrics.integrated_lufs !== undefined && (
          <MetricBar
            label="Integrated LUFS"
            value={metrics.integrated_lufs}
            unit="LUFS"
            min={-24}
            max={-6}
            idealMin={-14}
            idealMax={-9}
            zones={[{ from: -14, to: -9, color: "hsl(140 60% 40%)" }]}
          />
        )}
        {metrics.short_term_lufs !== undefined && (
          <MetricBar
            label="Short-Term LUFS"
            value={metrics.short_term_lufs}
            unit="LUFS"
            min={-24}
            max={-6}
            idealMin={-14}
            idealMax={-9}
            zones={[{ from: -14, to: -9, color: "hsl(140 60% 40%)" }]}
          />
        )}
        {metrics.dynamic_range !== undefined && (
          <MetricBar
            label="Dynamic Range"
            value={metrics.dynamic_range}
            unit="DR"
            min={0}
            max={20}
            zones={[{ from: 8, to: 20, color: "hsl(140 60% 40%)" }]}
          />
        )}
        {metrics.peak_dbtp !== undefined && (
          <MetricBar
            label="Peak dBTP"
            value={metrics.peak_dbtp}
            unit="dBTP"
            min={-6}
            max={0}
            zones={[
              { from: -6, to: -1, color: "hsl(140 60% 40%)" },
              { from: -1, to: 0, color: "hsl(0 70% 50%)" },
            ]}
          />
        )}
        {metrics.stereo_correlation !== undefined && (
          <CorrelationMeter value={metrics.stereo_correlation} />
        )}
      </div>
    </section>
  );
};

export default TechnicalMetrics;
