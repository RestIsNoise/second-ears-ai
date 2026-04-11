import { useState, useEffect, useCallback } from "react";

const MONO = "'IBM Plex Mono', 'DM Mono', monospace";

// Waveform bars — static, thin vertical lines
const WAVEFORM_HEIGHTS = [
  18, 30, 22, 38, 14, 42, 26, 34, 20, 44, 16, 36, 28, 40, 12, 32, 24, 46,
  19, 35, 21, 39, 15, 43, 27, 33, 17, 41, 25, 37, 13, 31, 23, 45, 20, 38,
  16, 34, 28, 42, 14, 36, 22, 40, 18, 44, 26, 32, 24, 46, 19, 35,
];

const METRICS = ["LUFS", "DR", "Stereo", "Peak"];

const FEEDBACK_CARDS = [
  {
    time: "0:14",
    severity: "high" as const,
    title: "Low-end buildup below 80 Hz",
    fix: "Apply high-pass at 60 Hz on the master bus",
  },
  {
    time: "1:32",
    severity: "med" as const,
    title: "Vocal sibilance around 6–8 kHz",
    fix: "Use a de-esser targeting 6.5 kHz, −4 dB",
  },
  {
    time: "2:48",
    severity: "low" as const,
    title: "Solid stereo width in the chorus",
    fix: "No action needed — imaging is well balanced",
  },
];

const SEVERITY_MAP = {
  high: { label: "HIGH", color: "#E24B4A" },
  med: { label: "MED", color: "#EF9F27" },
  low: { label: "LOW", color: "#16a34a" },
};

// Total cycle: 2s upload + 2.5s analyzing + 3s feedback + transitions
const STEP_DURATIONS = [2000, 2500, 3000];
const TRANSITION_MS = 450;

const HeroAnimation = () => {
  const [step, setStep] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  // Analyzing sub-state
  const [progressWidth, setProgressWidth] = useState(0);
  const [visibleMetrics, setVisibleMetrics] = useState(0);
  // Feedback sub-state
  const [visibleCards, setVisibleCards] = useState(0);

  const advanceStep = useCallback(() => {
    setTransitioning(true);
    setTimeout(() => {
      setStep((s) => (s + 1) % 3);
      setTransitioning(false);
    }, TRANSITION_MS);
  }, []);

  // Step timer
  useEffect(() => {
    const timer = setTimeout(advanceStep, STEP_DURATIONS[step]);
    return () => clearTimeout(timer);
  }, [step, advanceStep]);

  // Reset sub-states on step change
  useEffect(() => {
    setProgressWidth(0);
    setVisibleMetrics(0);
    setVisibleCards(0);

    if (step === 1) {
      // Animate progress bar
      requestAnimationFrame(() => setProgressWidth(100));
      // Stagger metrics
      METRICS.forEach((_, i) => {
        setTimeout(() => setVisibleMetrics((v) => Math.max(v, i + 1)), 400 + i * 450);
      });
    }

    if (step === 2) {
      FEEDBACK_CARDS.forEach((_, i) => {
        setTimeout(() => setVisibleCards((v) => Math.max(v, i + 1)), 200 + i * 600);
      });
    }
  }, [step]);

  const stepStyle = (visible: boolean): React.CSSProperties => ({
    opacity: visible && !transitioning ? 1 : 0,
    transform: visible && !transitioning ? "translateY(0)" : "translateY(6px)",
    transition: `opacity ${TRANSITION_MS}ms ease, transform ${TRANSITION_MS}ms ease`,
    position: "absolute" as const,
    inset: 0,
  });

  return (
    <div style={{ fontFamily: MONO, color: "#F0EDE8", position: "relative" }}>
      {/* Container frame */}
      <div
        style={{
          background: "#080808",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 6,
          overflow: "hidden",
        }}
      >
        {/* Window dots */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "10px 14px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "hsl(0 0% 25%)" }} />
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "hsl(0 0% 25%)" }} />
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "hsl(0 0% 25%)" }} />
        </div>

        {/* Animation area */}
        <div style={{ position: "relative", minHeight: 280, padding: "24px 28px" }}>
          {/* Step 1 — Upload */}
          <div style={stepStyle(step === 0)}>
            <div style={{ padding: "24px 28px" }}>
              <p
                style={{
                  fontSize: 9,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase" as const,
                  color: "rgba(255,255,255,0.35)",
                  marginBottom: 16,
                }}
              >
                Track loaded
              </p>
              <p style={{ fontSize: 14, color: "#F0EDE8", marginBottom: 24 }}>
                vida_retro_v4.mp3
              </p>
              {/* Waveform */}
              <div style={{ display: "flex", alignItems: "center", gap: 2, height: 48 }}>
                {WAVEFORM_HEIGHTS.map((h, i) => (
                  <div
                    key={i}
                    style={{
                      width: 2,
                      height: h,
                      borderRadius: 1,
                      background: "rgba(255,255,255,0.18)",
                      flexShrink: 0,
                    }}
                  />
                ))}
              </div>
              <p
                style={{
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  color: "rgba(255,255,255,0.25)",
                  marginTop: 16,
                }}
              >
                3:42 · 44.1 kHz · Stereo
              </p>
            </div>
          </div>

          {/* Step 2 — Analyzing */}
          <div style={stepStyle(step === 1)}>
            <div style={{ padding: "24px 28px" }}>
              <p
                style={{
                  fontSize: 9,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase" as const,
                  color: "rgba(255,255,255,0.35)",
                  marginBottom: 20,
                }}
              >
                Analyzing
              </p>
              {/* Progress bar */}
              <div
                style={{
                  height: 2,
                  background: "rgba(255,255,255,0.08)",
                  borderRadius: 1,
                  overflow: "hidden",
                  marginBottom: 32,
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${progressWidth}%`,
                    background: "#F0EDE8",
                    borderRadius: 1,
                    transition: "width 2s ease-in-out",
                  }}
                />
              </div>
              {/* Metrics */}
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap" as const }}>
                {METRICS.map((m, i) => (
                  <div
                    key={m}
                    style={{
                      opacity: i < visibleMetrics ? 1 : 0,
                      transform: i < visibleMetrics ? "translateY(0)" : "translateY(6px)",
                      transition: "opacity 400ms ease, transform 400ms ease",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase" as const,
                        color: "rgba(255,255,255,0.5)",
                      }}
                    >
                      {m}
                    </span>
                    <div
                      style={{
                        width: 3,
                        height: 3,
                        borderRadius: "50%",
                        background: "#F0EDE8",
                        marginTop: 8,
                        marginLeft: "auto",
                        marginRight: "auto",
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Step 3 — Feedback */}
          <div style={stepStyle(step === 2)}>
            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column" as const, gap: 10 }}>
              {FEEDBACK_CARDS.map((card, i) => {
                const sev = SEVERITY_MAP[card.severity];
                return (
                  <div
                    key={i}
                    style={{
                      opacity: i < visibleCards ? 1 : 0,
                      transform: i < visibleCards ? "translateY(0)" : "translateY(8px)",
                      transition: "opacity 400ms ease, transform 400ms ease",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 4,
                      padding: "14px 16px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <span
                        style={{
                          fontSize: 10,
                          color: "rgba(255,255,255,0.35)",
                          letterSpacing: "0.06em",
                        }}
                      >
                        {card.time}
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase" as const,
                          color: sev.color,
                          border: `1px solid ${sev.color}`,
                          borderRadius: 3,
                          padding: "1px 6px",
                        }}
                      >
                        {sev.label}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#F0EDE8", marginBottom: 4 }}>
                      {card.title}
                    </p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
                      Fix: {card.fix}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Step dots */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
        {[0, 1, 2].map((s) => (
          <div
            key={s}
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: step === s ? "#F0EDE8" : "rgba(255,255,255,0.15)",
              transition: "background 300ms ease",
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroAnimation;
