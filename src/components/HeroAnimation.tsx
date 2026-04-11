import { useState, useEffect, useCallback } from "react";

const MONO = "'IBM Plex Mono', 'DM Mono', monospace";

// ── Waveform bars (mimic the real player) ──
const WAVEFORM_HEIGHTS = [
  12, 28, 18, 35, 10, 40, 22, 32, 16, 42, 14, 34, 24, 38, 8, 30, 20, 44,
  15, 33, 19, 37, 11, 41, 23, 31, 13, 39, 21, 36, 9, 29, 17, 43, 16, 36,
  12, 32, 24, 40, 10, 34, 18, 38, 14, 42, 22, 30, 20, 44, 15, 33, 26, 38,
  11, 30, 22, 42, 18, 36, 14, 28, 24, 40, 12, 34, 20, 44, 16, 32,
];

const METRICS = [
  { label: "Int. LUFS", value: "−8.9", unit: "LUFS", status: "Hot", statusColor: "orange" as const },
  { label: "DR", value: "2.9", unit: "DR", status: "Crushed", statusColor: "red" as const },
  { label: "Stereo", value: "+0.15", unit: "", status: "Narrow", statusColor: "orange" as const },
  { label: "Peak", value: "0.0", unit: "dBTP", status: "Clip", statusColor: "red" as const },
];

const LED_COLORS = {
  green: { bg: "hsl(145 60% 42%)", muted: "hsl(145 60% 42% / 0.12)" },
  orange: { bg: "hsl(35 85% 50%)", muted: "hsl(35 85% 50% / 0.12)" },
  red: { bg: "hsl(0 65% 48%)", muted: "hsl(0 65% 48% / 0.12)" },
};

const FEEDBACK_CARDS = [
  {
    time: "0:14",
    severity: "high" as const,
    title: "Low-end buildup below 80 Hz",
    fix: "High-pass at 60 Hz on master bus",
  },
  {
    time: "1:32",
    severity: "med" as const,
    title: "Vocal sibilance around 6–8 kHz",
    fix: "De-esser targeting 6.5 kHz, −4 dB",
  },
  {
    time: "2:48",
    severity: "low" as const,
    title: "Solid stereo width in chorus",
    fix: "No action — imaging is well balanced",
  },
];

const SEVERITY_MAP = {
  high: { label: "HIGH", bg: "#fff0f0", color: "#cc0000" },
  med: { label: "MED", bg: "#fff8e6", color: "#996600" },
  low: { label: "LOW", bg: "#f5f5f5", color: "#666" },
};

const BORDER_COLORS = {
  high: "hsl(0 55% 50%)",
  med: "hsl(35 70% 55%)",
  low: "rgba(17,17,17,0.3)",
};

// Timings
const STEP_DURATIONS = [2200, 3000, 3500];
const TRANSITION_MS = 450;

const HeroAnimation = () => {
  const [step, setStep] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [progressWidth, setProgressWidth] = useState(0);
  const [visibleMetrics, setVisibleMetrics] = useState(0);
  const [visibleCards, setVisibleCards] = useState(0);

  const advanceStep = useCallback(() => {
    setTransitioning(true);
    setTimeout(() => {
      setStep((s) => (s + 1) % 3);
      setTransitioning(false);
    }, TRANSITION_MS);
  }, []);

  useEffect(() => {
    const timer = setTimeout(advanceStep, STEP_DURATIONS[step]);
    return () => clearTimeout(timer);
  }, [step, advanceStep]);

  useEffect(() => {
    setProgressWidth(0);
    setVisibleMetrics(0);
    setVisibleCards(0);

    if (step === 1) {
      requestAnimationFrame(() => setProgressWidth(100));
      METRICS.forEach((_, i) => {
        setTimeout(() => setVisibleMetrics((v) => Math.max(v, i + 1)), 300 + i * 500);
      });
    }
    if (step === 2) {
      FEEDBACK_CARDS.forEach((_, i) => {
        setTimeout(() => setVisibleCards((v) => Math.max(v, i + 1)), 200 + i * 700);
      });
    }
  }, [step]);

  const phaseStyle = (active: boolean): React.CSSProperties => ({
    opacity: active && !transitioning ? 1 : 0,
    transform: active && !transitioning ? "translateY(0)" : "translateY(8px)",
    transition: `opacity ${TRANSITION_MS}ms ease, transform ${TRANSITION_MS}ms ease`,
    position: "absolute",
    inset: 0,
    pointerEvents: active ? "auto" : "none",
  });

  return (
    <div style={{ fontFamily: MONO, position: "relative" }}>
      {/* Animation area */}
      <div style={{ position: "relative", minHeight: 340, maxHeight: 460, overflow: "hidden" }}>

        {/* ═══ PHASE 1 — Track Loaded ═══ */}
        <div style={phaseStyle(step === 0)}>
          <div style={{ padding: "8px 0" }}>
            {/* Filename + metadata bar — mimics waveform player header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: "#F0EDE8", letterSpacing: "-0.01em" }}>
                vida_retro_v4.mp3
              </span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.06em" }}>
                3:42 · 44.1 kHz · Stereo
              </span>
            </div>

            {/* Waveform — matches SHELL_BG #191919, LANE_BG #111113 */}
            <div
              style={{
                background: "#111113",
                padding: "20px 14px",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 1.5, height: 48, justifyContent: "center" }}>
                {WAVEFORM_HEIGHTS.map((h, i) => (
                  <div
                    key={i}
                    style={{
                      width: 2,
                      height: h,
                      borderRadius: 1,
                      background: "rgba(160, 155, 145, 0.28)",
                      flexShrink: 0,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Transport bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "8px 14px",
              }}
            >
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>0:00</span>
              <div style={{ flex: 1, height: 2, borderRadius: 1, background: "rgba(255,255,255,0.08)" }} />
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>3:42</span>
            </div>
          </div>
        </div>

        {/* ═══ PHASE 2 — Analyzing ═══ */}
        <div style={phaseStyle(step === 1)}>
          <div style={{ padding: "8px 0" }}>
            {/* Progress sweep over waveform */}
            <div
              style={{
                background: "#111113",
                padding: "20px 14px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 1.5, height: 48, justifyContent: "center" }}>
                {WAVEFORM_HEIGHTS.map((h, i) => (
                  <div
                    key={i}
                    style={{
                      width: 2,
                      height: h,
                      borderRadius: 1,
                      background: "rgba(160, 155, 145, 0.28)",
                      flexShrink: 0,
                    }}
                  />
                ))}
              </div>
              {/* Sweep line */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: 0,
                  width: `${progressWidth}%`,
                  background: "rgba(255,255,255,0.04)",
                  borderRight: "2px solid #F0EDE8",
                  transition: "width 2.4s ease-in-out",
                }}
              />
            </div>

            {/* Metrics — styled exactly like TechnicalMetrics MeterChannel rows */}
            <div style={{ marginTop: 4 }}>
              {METRICS.map((m, i) => {
                const led = LED_COLORS[m.statusColor];
                const visible = i < visibleMetrics;
                return (
                  <div
                    key={m.label}
                    style={{
                      opacity: visible ? 1 : 0,
                      transform: visible ? "translateY(0)" : "translateY(6px)",
                      transition: `opacity 400ms ease, transform 400ms ease`,
                      padding: "10px 14px",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    {/* Label */}
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: 12,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "#aaa",
                        fontWeight: 500,
                        minWidth: 70,
                      }}
                    >
                      {m.label}
                    </span>
                    {/* Gauge placeholder */}
                    <div style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: visible ? "60%" : "0%",
                          background: led.bg,
                          borderRadius: 2,
                          transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                      />
                    </div>
                    {/* Status chip */}
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: led.bg,
                        backgroundColor: led.muted,
                        padding: "2px 6px",
                        borderRadius: 2,
                        minWidth: 56,
                        textAlign: "center",
                        lineHeight: 1,
                      }}
                    >
                      {m.status}
                    </span>
                    {/* Value */}
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: 18,
                        fontWeight: 700,
                        color: "rgba(240,237,232,0.9)",
                        letterSpacing: "-0.03em",
                        minWidth: 48,
                        textAlign: "right",
                      }}
                    >
                      {m.value}
                    </span>
                    {m.unit && (
                      <span style={{ fontFamily: MONO, fontSize: 10, color: "#666", textTransform: "uppercase" }}>
                        {m.unit}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ═══ PHASE 3 — Feedback Cards ═══ */}
        <div style={phaseStyle(step === 2)}>
          <div style={{ padding: "4px 0", display: "flex", flexDirection: "column", gap: 8 }}>
            {FEEDBACK_CARDS.map((card, idx) => {
              const sev = SEVERITY_MAP[card.severity];
              const borderColor = BORDER_COLORS[card.severity];
              const visible = idx < visibleCards;

              return (
                <div
                  key={idx}
                  style={{
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateY(0)" : "translateY(10px)",
                    transition: `opacity 400ms ease, transform 400ms ease`,
                    background: "#1a1a1a",
                    border: "1px solid #2a2a2a",
                    borderLeft: `3px solid ${borderColor}`,
                    borderRadius: 8,
                    padding: "14px 16px",
                  }}
                >
                  {/* Header row — matches FeedbackTimeline exactly */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {/* Index */}
                    <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: "#555", letterSpacing: "0.02em" }}>
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    {/* Timestamp chip */}
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: 11,
                        color: "#888",
                        backgroundColor: "rgba(255,255,255,0.06)",
                        padding: "1px 6px",
                        borderRadius: 3,
                      }}
                    >
                      {card.time}
                    </span>
                    {/* Severity badge — exact match */}
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: "0.04em",
                        padding: "3px 8px",
                        borderRadius: 4,
                        backgroundColor: sev.bg,
                        color: sev.color,
                        textTransform: "uppercase",
                      }}
                    >
                      {sev.label}
                    </span>
                    {/* Mode tag */}
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: 10,
                        fontWeight: 500,
                        letterSpacing: "0.06em",
                        padding: "3px 8px",
                        borderRadius: 3,
                        backgroundColor: "rgba(255,255,255,0.06)",
                        color: "#aaa",
                        textTransform: "uppercase",
                      }}
                    >
                      TECH
                    </span>
                  </div>

                  {/* Title — matches FeedbackTimeline */}
                  <h3
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: "#e8e8e0",
                      margin: "6px 0 0",
                      lineHeight: 1.4,
                    }}
                  >
                    {card.title}
                  </h3>


                  {/* Fix block — only show for high/med */}
                  {card.severity !== "low" && (
                    <div
                      style={{
                        marginTop: 8,
                        backgroundColor: "#141414",
                        borderLeft: "3px solid #e8e8e0",
                        borderRadius: "0 6px 6px 0",
                        padding: "8px 14px",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: MONO,
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: "0.18em",
                          color: "#888",
                          marginBottom: 4,
                          textTransform: "uppercase",
                        }}
                      >
                        FIX
                      </div>
                      <p
                        style={{
                          fontSize: 12,
                          lineHeight: 1.5,
                          color: "#aaa",
                          fontFamily: MONO,
                        }}
                      >
                        {card.fix}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step dots */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
        {[0, 1, 2].map((s) => (
          <div
            key={s}
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: step === s ? "#F0EDE8" : "rgba(255,255,255,0.12)",
              transition: "background 300ms ease",
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroAnimation;
