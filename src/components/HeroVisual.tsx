const MONO = "'IBM Plex Mono', 'DM Mono', monospace";

// Waveform bars — varied heights for visual interest
const WAVEFORM_HEIGHTS = [
  10, 24, 16, 32, 8, 38, 20, 28, 14, 40, 12, 30, 22, 36, 6, 26, 18, 42,
  13, 31, 17, 35, 9, 39, 21, 27, 11, 37, 19, 34, 7, 25, 15, 41, 14, 34,
  10, 28, 22, 38, 8, 32, 16, 36, 12, 40, 20, 26, 18, 42, 13, 31, 24, 36,
  9, 28, 20, 40, 16, 34, 12, 24, 22, 38, 10, 30, 18, 42, 14, 28, 24, 36,
  11, 32, 19, 38, 8, 34, 22, 40, 15, 30, 26, 42, 12, 28, 20, 36, 16, 34,
];

// Anchor point — index into WAVEFORM_HEIGHTS where the connector line starts
const ANCHOR_INDEX = 28; // roughly at 0:49 position (~31% through)

const HeroVisual = () => {
  return (
    <div style={{ fontFamily: MONO, position: "relative", padding: "12px 0 0" }}>

      {/* ── Waveform section ── */}
      <div>
        {/* Metadata bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 4px 10px",
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: "#F0EDE8", letterSpacing: "-0.01em" }}>
            vida_retro_v4.mp3
          </span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.06em" }}>
            3:42 · 44.1 kHz · Stereo
          </span>
        </div>

        {/* Waveform lane */}
        <div
          style={{
            background: "#111113",
            padding: "18px 10px",
            borderRadius: 2,
            border: "1px solid rgba(255,255,255,0.06)",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 1.5, height: 44, justifyContent: "center" }}>
            {WAVEFORM_HEIGHTS.map((h, i) => (
              <div
                key={i}
                style={{
                  width: 2,
                  height: h,
                  borderRadius: 1,
                  background: i === ANCHOR_INDEX
                    ? "rgba(226, 75, 74, 0.6)"
                    : "rgba(160, 155, 145, 0.28)",
                  flexShrink: 0,
                  position: "relative",
                }}
              >
                {/* Anchor dot */}
                {i === ANCHOR_INDEX && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: -8,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: "rgba(240,237,232,0.5)",
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Time markers */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "6px 4px 0",
          }}
        >
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontWeight: 500 }}>0:00</span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontWeight: 500 }}>3:42</span>
        </div>
      </div>

      {/* ── Connector line from waveform to card ── */}
      {/* Positioned at the anchor bar's approximate X position (31%) */}
      <div
        style={{
          position: "absolute",
          left: `calc(10px + ${ANCHOR_INDEX} * (2px + 1.5px) + 1px)`,
          top: 108,
          width: 1,
          height: 48,
          background: "rgba(240,237,232,0.15)",
        }}
      />

      {/* ── Feedback card ── */}
      <div
        style={{
          marginTop: 48,
          marginLeft: 24,
          maxWidth: 420,
        }}
      >
        <div
          style={{
            background: "#1a1a1a",
            border: "1px solid #2a2a2a",
            borderLeft: "3px solid hsl(38 92% 50%)",
            borderRadius: 8,
            padding: "16px 18px",
          }}
        >
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Index */}
            <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: "#555", letterSpacing: "0.02em" }}>
              04
            </span>
            {/* Timestamp */}
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
              3:36
            </span>
            {/* Severity badge */}
            <span
              style={{
                fontFamily: MONO,
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.04em",
                padding: "3px 8px",
                borderRadius: 4,
                backgroundColor: "#3a2a08",
                color: "#EF9F27",
                textTransform: "uppercase" as const,
              }}
            >
              MED
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
                textTransform: "uppercase" as const,
              }}
            >
              TECH
            </span>
          </div>

          {/* Title */}
          <h3
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "#e8e8e0",
              margin: "8px 0 0",
              lineHeight: 1.4,
            }}
          >
            Stereo image collapses in the densest section
          </h3>

          <p
            style={{
              fontSize: 12,
              lineHeight: 1.6,
              color: "#9a9a92",
              fontFamily: MONO,
              margin: "8px 0 0",
            }}
          >
            Around 3:30 the mix narrows noticeably and loses depth, even though levels are stable. Listener fatigue spikes here.
          </p>

          {/* Fix block */}
          <div
            style={{
              marginTop: 10,
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
                textTransform: "uppercase" as const,
              }}
            >
              FIX
            </div>
            <p
              style={{
                fontSize: 12,
                lineHeight: 1.6,
                color: "#aaa",
                fontFamily: MONO,
                margin: 0,
              }}
            >
              Pan supporting elements wider in this section, or automate the reverb sends up by 1–2 dB to restore space.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroVisual;
