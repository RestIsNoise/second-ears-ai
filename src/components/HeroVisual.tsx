const MONO = "'IBM Plex Mono', 'DM Mono', monospace";

const WAVE = [
  6, 12, 8, 16, 5, 19, 11, 14, 7, 21, 7, 17, 12, 18, 4, 14, 9, 22,
  8, 17, 10, 19, 6, 20, 12, 15, 7, 19, 11, 18, 5, 13, 9, 21, 9, 18,
  6, 15, 12, 19, 5, 17, 9, 19, 7, 20, 11, 14, 10, 22, 8, 17, 13, 19,
  6, 15, 11, 20, 9, 18, 7, 13, 12, 19, 6, 16, 10, 21,
];

const MARKERS = [
  { i: 12, sev: "high" },
  { i: 28, sev: "med" },
  { i: 44, sev: "low" },
  { i: 58, sev: "med" },
];

const sevColor = (s: string) =>
  s === "high" ? "#E24B4A" : s === "med" ? "#EF9F27" : "#4ade80";
const sevBg = (s: string) =>
  s === "high" ? "#3a1010" : s === "med" ? "#3a2a08" : "#0f2a18";

const Tag = ({
  label,
  text,
  color,
  bg,
  border,
}: {
  label: string;
  text: string;
  color: string;
  bg: string;
  border: string;
}) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "3px 8px",
      borderRadius: 999,
      background: bg,
      border: `1px solid ${border}`,
    }}
  >
    <span
      style={{
        fontSize: 8,
        fontWeight: 700,
        letterSpacing: "0.14em",
        color,
        textTransform: "uppercase",
      }}
    >
      {label}
    </span>
    <span style={{ fontSize: 9, fontWeight: 500, color: "#d8d8d0" }}>{text}</span>
  </div>
);

const FeedbackCard = ({
  idx,
  ts,
  sev,
  mode,
  title,
  desc,
  fix,
  faded,
}: {
  idx: string;
  ts: string;
  sev: "high" | "med" | "low";
  mode: string;
  title: string;
  desc: string;
  fix: string;
  faded?: boolean;
}) => (
  <div
    style={{
      background: "#141414",
      border: "1px solid #232323",
      borderLeft: `2px solid ${sevColor(sev)}`,
      borderRadius: 4,
      padding: "8px 10px",
      marginBottom: 6,
      opacity: faded ? 0.35 : 1,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
      <span style={{ fontSize: 9, fontWeight: 700, color: "#555", fontFamily: MONO }}>{idx}</span>
      <span
        style={{
          fontSize: 8,
          color: "#888",
          background: "rgba(255,255,255,0.06)",
          padding: "1px 5px",
          borderRadius: 2,
          fontFamily: MONO,
        }}
      >
        {ts}
      </span>
      <span
        style={{
          fontSize: 8,
          fontWeight: 700,
          letterSpacing: "0.06em",
          padding: "1px 5px",
          borderRadius: 2,
          background: sevBg(sev),
          color: sevColor(sev),
          textTransform: "uppercase",
          fontFamily: MONO,
        }}
      >
        {sev}
      </span>
      <span
        style={{
          fontSize: 8,
          fontWeight: 600,
          letterSpacing: "0.08em",
          padding: "1px 5px",
          borderRadius: 2,
          background: "rgba(255,255,255,0.05)",
          color: "#999",
          fontFamily: MONO,
        }}
      >
        {mode}
      </span>
    </div>
    <div style={{ fontSize: 10.5, fontWeight: 600, color: "#e8e8e0", lineHeight: 1.35, marginBottom: 4 }}>
      {title}
    </div>
    <div
      style={{
        fontSize: 9,
        color: "#8a8a82",
        lineHeight: 1.5,
        fontFamily: MONO,
        marginBottom: 6,
        whiteSpace: "pre-line",
      }}
    >
      {desc}
    </div>
    <div
      style={{
        background: "#0e0e0e",
        borderLeft: "2px solid #e8e8e0",
        padding: "5px 8px",
        borderRadius: "0 3px 3px 0",
      }}
    >
      <div
        style={{
          fontSize: 7.5,
          fontWeight: 700,
          letterSpacing: "0.18em",
          color: "#888",
          marginBottom: 2,
          fontFamily: MONO,
        }}
      >
        FIX
      </div>
      <div style={{ fontSize: 9, color: "#a8a89e", lineHeight: 1.5, fontFamily: MONO, whiteSpace: "pre-line" }}>
        {fix}
      </div>
    </div>
  </div>
);

const Gauge = ({
  label,
  status,
  statusColor,
  value,
  unit,
  fill,
}: {
  label: string;
  status: string;
  statusColor: string;
  value: string;
  unit: string;
  fill: number;
}) => (
  <div style={{ marginBottom: 8 }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
      <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.12em", color: "#999", fontFamily: MONO }}>
        {label}
      </span>
      <span
        style={{
          fontSize: 7,
          fontWeight: 700,
          letterSpacing: "0.1em",
          color: statusColor,
          background: `${statusColor}1f`,
          padding: "1px 5px",
          borderRadius: 2,
          textTransform: "uppercase",
          fontFamily: MONO,
        }}
      >
        {status}
      </span>
    </div>
    <div style={{ position: "relative", height: 4, background: "#0a0a0a", borderRadius: 2, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, display: "flex" }}>
        <div style={{ flex: 1, borderRight: "1px solid #1a1a1a" }} />
        <div style={{ flex: 1, borderRight: "1px solid #1a1a1a" }} />
        <div style={{ flex: 1, borderRight: "1px solid #1a1a1a" }} />
        <div style={{ flex: 1 }} />
      </div>
      <div
        style={{
          position: "absolute",
          left: `${fill}%`,
          top: -1,
          width: 2,
          height: 6,
          background: statusColor,
          borderRadius: 1,
        }}
      />
    </div>
    <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginTop: 3 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: "#F0EDE8", letterSpacing: "-0.01em", fontFamily: MONO }}>
        {value}
      </span>
      <span style={{ fontSize: 8, color: "#666", fontFamily: MONO }}>{unit}</span>
    </div>
  </div>
);

const SectionHead = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      fontSize: 7.5,
      fontWeight: 700,
      letterSpacing: "0.2em",
      color: "#666",
      marginBottom: 6,
      fontFamily: MONO,
    }}
  >
    {children}
  </div>
);

const Todo = ({ text, done }: { text: string; done?: boolean }) => (
  <div
    style={{
      display: "flex",
      alignItems: "flex-start",
      gap: 7,
      padding: "7px 0",
      borderBottom: "1px solid #1c1c1c",
    }}
  >
    <div
      style={{
        width: 11,
        height: 11,
        borderRadius: 2,
        border: `1px solid ${done ? "#EF9F27" : "#444"}`,
        background: done ? "#EF9F27" : "transparent",
        marginTop: 1,
        flexShrink: 0,
        position: "relative",
      }}
    >
      {done && (
        <span
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 8,
            color: "#0a0a0a",
            fontWeight: 900,
            lineHeight: 1,
          }}
        >
          ✓
        </span>
      )}
    </div>
    <div
      style={{
        fontSize: 9.5,
        color: done ? "#555" : "#c8c8c0",
        lineHeight: 1.4,
        textDecoration: done ? "line-through" : "none",
        fontFamily: MONO,
      }}
    >
      {text}
    </div>
  </div>
);

const HeroVisual = () => {
  return (
    <div
      style={{
        fontFamily: MONO,
        position: "relative",
        background: "#0d0d0d",
        border: "1px solid #232323",
        borderRadius: 8,
        boxShadow: "0 30px 80px -20px rgba(0,0,0,0.85), 0 12px 30px -8px rgba(0,0,0,0.6)",
        overflow: "hidden",
      }}
    >
      {/* Browser chrome */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          background: "#111",
          borderBottom: "1px solid #232323",
        }}
      >
        <div style={{ display: "flex", gap: 5 }}>
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#FF5F57" }} />
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#FEBC2E" }} />
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#28C840" }} />
        </div>
        <span style={{ fontSize: 9, color: "#666", letterSpacing: "0.06em" }}>secondear.app</span>
        <span style={{ width: 24 }} />
      </div>

      {/* Track header */}
      <div
        style={{
          padding: "10px 14px 8px",
          borderBottom: "1px solid #1c1c1c",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#F0EDE8" }}>
            mitch_oliver_out_of_space.wav
          </span>
          <span
            style={{
              fontSize: 7,
              fontWeight: 700,
              letterSpacing: "0.14em",
              padding: "2px 5px",
              borderRadius: 2,
              background: "#1a1a1a",
              color: "#888",
              border: "1px solid #2a2a2a",
            }}
          >
            v2
          </span>
        </div>
        <span style={{ fontSize: 8, color: "#555", letterSpacing: "0.06em" }}>3:42 · 44.1 kHz · STEREO</span>
      </div>

      {/* Bio */}
      <div style={{ padding: "10px 14px 8px" }}>
        <p
          style={{
            fontSize: 10,
            lineHeight: 1.55,
            color: "#a8a89e",
            fontFamily: MONO,
            margin: 0,
          }}
        >
          This track presents a heavily limited and frequency-imbalanced master.
          <br />
          The sound is dense and lacks dynamic movement. Listener fatigue spikes
          <br />
          in the densest sections.
        </p>
      </div>

      {/* Status tags */}
      <div
        style={{
          padding: "0 14px 10px",
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
        }}
      >
        <Tag label="ISSUE" text="Heavily Limited Dynamics" color="#E24B4A" bg="#2a1010" border="#5a1f1f" />
        <Tag label="WIN" text="Driving Rhythmic Foundation" color="#4ade80" bg="#0f2a18" border="#1f5a3a" />
        <Tag label="RELEASE" text="Released" color="#999" bg="#1a1a1a" border="#333" />
      </div>

      {/* Waveform — compact */}
      <div style={{ padding: "8px 14px 8px", borderTop: "1px solid #1c1c1c", borderBottom: "1px solid #1c1c1c" }}>
        <div style={{ position: "relative", height: 26, display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 1.5, height: "100%", flex: 1 }}>
            {WAVE.map((h, i) => {
              const marker = MARKERS.find((m) => m.i === i);
              const scaledH = Math.max(3, Math.round(h * 0.6));
              return (
                <div key={i} style={{ position: "relative", height: "100%", display: "flex", alignItems: "center" }}>
                  <div
                    style={{
                      width: 2,
                      height: scaledH,
                      borderRadius: 1,
                      background: marker ? sevColor(marker.sev) : "rgba(160,155,145,0.28)",
                    }}
                  />
                  {marker && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: -2,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: sevColor(marker.sev),
                        border: "1.5px solid #0d0d0d",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <span style={{ fontSize: 7, color: "#444" }}>0:00</span>
          <span style={{ fontSize: 7, color: "#444" }}>1:51</span>
          <span style={{ fontSize: 7, color: "#444" }}>3:42</span>
        </div>
      </div>

      {/* 3-column panels */}
      <div style={{ display: "grid", gridTemplateColumns: "0.55fr 1.25fr 1fr 0.85fr", gap: 0 }}>
        {/* MODULES SIDEBAR */}
        <div
          style={{
            padding: "10px 10px",
            borderRight: "1px solid #1c1c1c",
            background: "#0a0a0a",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingBottom: 6,
              marginBottom: 6,
              borderBottom: "1px solid #1c1c1c",
            }}
          >
            <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.18em", color: "#888", fontFamily: MONO }}>
              MODULES
            </span>
            <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", color: "#555", fontFamily: MONO }}>
              3/6
            </span>
          </div>
          {[
            { label: "SECONDEAR NOTES", active: true },
            { label: "REFERENCE MATCH", active: false },
            { label: "DEEP READ", active: false },
            { label: "TECHNICAL METRICS", active: true },
            { label: "HUMAN FEEDBACK", active: false },
            { label: "NEXT MOVES", active: true },
          ].map((m) => (
            <div
              key={m.label}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "6px 6px 6px 7px",
                marginBottom: 2,
                borderLeft: m.active ? "2px solid #F0EDE8" : "2px solid transparent",
                background: m.active ? "rgba(255,255,255,0.02)" : "transparent",
              }}
            >
              <span
                style={{
                  fontSize: 8.5,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  color: m.active ? "#e8e8e0" : "#555",
                  fontFamily: MONO,
                }}
              >
                {m.label}
              </span>
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: m.active ? "#4ade80" : "#3a3a3a",
                  flexShrink: 0,
                  marginLeft: 6,
                }}
              />
            </div>
          ))}
        </div>

        {/* SECONDEAR NOTES */}
        <div style={{ padding: "10px 12px", borderRight: "1px solid #1c1c1c", maxHeight: 280, overflow: "hidden", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ade80" }} />
            <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.18em", color: "#aaa" }}>
              SECONDEAR NOTES
            </span>
          </div>
          <FeedbackCard
            idx="01"
            ts="0:24"
            sev="high"
            mode="TECH"
            title="Heavily limited dynamics"
            desc={"Dynamic range heavily compressed, transients\nrounded off, fatiguing energy plateau."}
            fix={"Reduce gain into limiter. Target -10 to -11\nLUFS for streaming compliance."}
          />
          <FeedbackCard
            idx="02"
            ts="1:08"
            sev="med"
            mode="TECH"
            title="Low-end congestion"
            desc={"Sub band significantly higher than low band,\nburying kick fundamentals."}
            fix={"Surgical EQ cut at 40-60Hz, -2 to -3dB on\nmaster bus."}
          />
          <FeedbackCard
            idx="03"
            ts="2:14"
            sev="low"
            mode="MIX"
            title="Reverb tail too long on snare"
            desc={"Decay smears the second-half groove and softens transients."}
            fix={"Shorten decay to 0.8s, automate down in chorus."}
            faded
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 50,
              background: "linear-gradient(to bottom, transparent, #0d0d0d 85%)",
              pointerEvents: "none",
            }}
          />
        </div>

        {/* TECHNICAL METRICS */}
        <div style={{ padding: "10px 12px", borderRight: "1px solid #1c1c1c" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#EF9F27" }} />
            <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.18em", color: "#aaa" }}>
              TECHNICAL METRICS
            </span>
          </div>

          <SectionHead>LOUDNESS</SectionHead>
          <Gauge label="INT. LUFS" status="HOT" statusColor="#EF9F27" value="−8.9" unit="LUFS" fill={82} />

          <div style={{ height: 4 }} />
          <SectionHead>DYNAMICS</SectionHead>
          <Gauge label="DR" status="CRUSHED" statusColor="#E24B4A" value="2.9" unit="DR" fill={18} />
          <Gauge label="PEAK" status="CLIP" statusColor="#E24B4A" value="0.0" unit="dBTP" fill={98} />

          <div style={{ height: 4 }} />
          <SectionHead>STEREO / BALANCE</SectionHead>
          <Gauge label="STEREO" status="NARROW" statusColor="#EF9F27" value="+0.15" unit="" fill={32} />
        </div>

        {/* NEXT MOVES */}
        <div style={{ padding: "10px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#F0EDE8" }} />
            <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.18em", color: "#aaa" }}>NEXT MOVES</span>
          </div>

          {/* Tabs */}
          <div
            style={{
              display: "flex",
              gap: 4,
              marginBottom: 6,
              padding: 2,
              background: "#0a0a0a",
              border: "1px solid #1c1c1c",
              borderRadius: 4,
            }}
          >
            {[
              { label: "ALL", active: true },
              { label: "OPEN", active: false },
              { label: "DONE", active: false },
            ].map((t) => (
              <span
                key={t.label}
                style={{
                  flex: 1,
                  textAlign: "center",
                  fontSize: 8,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  padding: "3px 0",
                  borderRadius: 2,
                  color: t.active ? "#0a0a0a" : "#777",
                  background: t.active ? "#F0EDE8" : "transparent",
                  fontFamily: MONO,
                }}
              >
                {t.label}
              </span>
            ))}
          </div>

          <Todo text="Reduce limiting on master" />
          <Todo text="Cut 40-60Hz on bass" />
          <Todo text="De-ess vocal at 7kHz" done />
          <Todo text="Re-check LUFS after limiter" />
        </div>
      </div>

      {/* Footer badge */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          padding: "6px 12px",
          background: "#0a0a0a",
          borderTop: "1px solid #1c1c1c",
        }}
      >
        <span
          style={{
            fontSize: 7,
            fontWeight: 700,
            letterSpacing: "0.14em",
            color: "#666",
            background: "#161616",
            border: "1px solid #232323",
            padding: "2px 6px",
            borderRadius: 2,
            textTransform: "uppercase",
          }}
        >
          Real feedback example
        </span>
      </div>
    </div>
  );
};

export default HeroVisual;
