import type { TechnicalMetrics as TechnicalMetricsType } from "@/pages/Analyze";

type Status = { label: string; color: "green" | "orange" | "red" };

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

/* ── LED colors ── */
const ledStyles: Record<string, { bg: string; glow: string }> = {
  green: { bg: "#34c759", glow: "0 0 6px #34c75966" },
  orange: { bg: "#ff9500", glow: "0 0 6px #ff950066" },
  red: { bg: "#ff3b30", glow: "0 0 6px #ff3b3066" },
};

const barFill: Record<string, string> = {
  green: "#34c759",
  orange: "#ff9500",
  red: "#ff3b30",
};

/* ── VU-style segmented bar ── */
const VuBar = ({ pct, color }: { pct: number; color: string }) => {
  const segments = 20;
  const filled = Math.round((pct / 100) * segments);
  const fill = barFill[color] || "#34c759";

  return (
    <div className="flex gap-px mt-2.5">
      {Array.from({ length: segments }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 4,
            height: 4,
            borderRadius: 0.5,
            background: i < filled ? fill : "#2a2a2a",
            opacity: i < filled ? 0.85 : 1,
          }}
        />
      ))}
    </div>
  );
};

/* ── LED badge ── */
const LedBadge = ({ status }: { status: Status | null }) => {
  if (!status) {
    return (
      <span
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 9,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "#555",
          background: "#1e1e1e",
          padding: "2px 6px",
          borderRadius: 3,
        }}
      >
        N/A
      </span>
    );
  }

  const led = ledStyles[status.color];

  return (
    <span
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 9,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: "#fff",
        background: led.bg,
        boxShadow: led.glow,
        padding: "2px 6px",
        borderRadius: 3,
        lineHeight: 1,
      }}
    >
      {status.label}
    </span>
  );
};

/* ── Metric Card ── */
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

  return (
    <div
      style={{
        background: "#141414",
        border: "1px solid #2a2a2a",
        borderRadius: 4,
        padding: "10px 12px",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 19,
                color: isMissing ? "#555" : "#e8e8e8",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {isMissing ? "—" : value.toFixed(decimals)}
            </span>
            {!isMissing && (
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 11,
                  color: "#888",
                }}
              >
                {unit}
              </span>
            )}
          </div>
          <p
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              color: "#666",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginTop: 3,
            }}
          >
            {label}
          </p>
        </div>
        <LedBadge status={isMissing ? null : status} />
      </div>
      <VuBar pct={pct} color={status?.color || "green"} />
    </div>
  );
};

/* ── Correlation Card ── */
const CorrelationCard = ({ value }: { value: number }) => {
  const status = correlationStatus(value);
  const pct = ((value + 1) / 2) * 100;
  const clampedPct = Math.max(0, Math.min(100, pct));

  return (
    <div
      style={{
        background: "#141414",
        border: "1px solid #2a2a2a",
        borderRadius: 4,
        padding: "10px 12px",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 19,
              color: "#e8e8e8",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {value > 0 ? "+" : ""}{value.toFixed(2)}
          </span>
          <p
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              color: "#666",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginTop: 3,
            }}
          >
            Stereo Correlation
          </p>
        </div>
        <LedBadge status={status} />
      </div>

      {/* Bipolar VU bar */}
      <div className="flex gap-px mt-2.5 items-center">
        {Array.from({ length: 20 }).map((_, i) => {
          const segPct = (i / 20) * 100;
          const isFilled = clampedPct >= 50
            ? segPct >= 50 && segPct < clampedPct
            : segPct >= clampedPct && segPct < 50;
          return (
            <div
              key={i}
              style={{
                width: 4,
                height: i === 10 ? 6 : 4,
                borderRadius: 0.5,
                background: isFilled ? barFill[status.color] : "#2a2a2a",
                opacity: isFilled ? 0.85 : 1,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

/* ── Sub/Kick Card ── */
const SubKickCard = ({ value }: { value: number }) => {
  const status = subKickStatus(value);
  const pct = Math.max(0, Math.min(100, (value / 2) * 100));
  const led = ledStyles[status.color];

  return (
    <div
      style={{
        background: "#141414",
        border: "1px solid #2a2a2a",
        borderRadius: 4,
        padding: "10px 12px",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <p
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            color: "#666",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Sub / Kick Ratio
        </p>
        <LedBadge status={status} />
      </div>

      <div className="mt-3">
        <div className="flex justify-between mb-1.5">
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 9,
              color: "#555",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Kick
          </span>
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 9,
              color: "#555",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Sub
          </span>
        </div>

        {/* Track */}
        <div
          className="relative"
          style={{ height: 6, background: "#2a2a2a", borderRadius: 1 }}
        >
          {/* Sweet zone indicator */}
          <div
            className="absolute inset-y-0"
            style={{ left: "40%", width: "20%", background: "#34c75910", borderRadius: 1 }}
          />
          {/* Center mark */}
          <div
            className="absolute top-0 bottom-0"
            style={{ left: "50%", width: 1, background: "#333" }}
          />
          {/* Indicator dot */}
          <div
            className="absolute top-1/2"
            style={{
              left: `${pct}%`,
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#e8e8e8",
              transform: "translate(-50%, -50%)",
              boxShadow: `0 0 8px ${led.bg}88`,
              border: `2px solid ${led.bg}`,
            }}
          />
        </div>
      </div>

      <div className="text-center mt-2">
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 15,
            color: "#e8e8e8",
            fontWeight: 600,
            fontVariantNumeric: "tabular-nums",
          }}
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

const TechnicalMetrics = ({ metrics, compact }: Props) => {
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
      <div className="flex items-baseline justify-between mb-3">
        <h2
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            color: "#666",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          Technical metrics
        </h2>
      </div>
      <div className={`grid gap-2 ${compact ? "grid-cols-1" : "grid-cols-2 gap-2.5"}`}>
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
        <div className="mt-2">
          <SubKickCard value={metrics.sub_kick_ratio} />
        </div>
      )}
    </section>
  );
};

export default TechnicalMetrics;
