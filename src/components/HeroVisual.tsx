const MONO = "'IBM Plex Mono', 'DM Mono', monospace";

// Compact waveform for mockup
const WAVE = [
  6, 14, 9, 18, 5, 22, 12, 16, 8, 24, 7, 19, 13, 21, 4, 16, 10, 25,
  8, 19, 11, 21, 6, 23, 13, 17, 7, 22, 12, 20, 5, 15, 9, 24, 9, 20,
  6, 17, 13, 22, 5, 19, 10, 21, 7, 23, 12, 16, 11, 25, 8, 19, 14, 21,
  6, 17, 12, 23, 10, 20, 7, 15, 13, 22, 6, 18, 11, 24,
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

const NotesCard = ({
  idx,
  ts,
  sev,
  title,
  fix,
}: {
  idx: string;
  ts: string;
  sev: "high" | "med" | "low";
  title: string;
  fix: string;
}) => (
  <div
    style={{
      background: "#141414",
      border: "1px solid #232323",
      borderLeft: `2px solid ${sevColor(sev)}`,
      borderRadius: 4,
      padding: "8px 10px",
      marginBottom: 6,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
      <span style={{ fontSize: 9, fontWeight: 700, color: "#555" }}>{idx}</span>
      <span
        style={{
          fontSize: 8,
          color: "#888",
          background: "rgba(255,255,255,0.06)",
          padding: "1px 4px",
          borderRadius: 2,
        }}
      >
        {ts}
      </span>
      <span
        style={{
          fontSize: 8,
          fontWeight: 600,
          letterSpacing: "0.04em",
          padding: "1px 5px",
          borderRadius: 2,
          background: sevBg(sev),
          color: sevColor(sev),
          textTransform: "uppercase",
        }}
      >
        {sev}
      </span>
    </div>
    <div style={{ fontSize: 10, fontWeight: 600, color: "#e8e8e0", lineHeight: 1.35, marginBottom: 4 }}>
      {title}
    </div>
    <div
      style={{
        background: "#0e0e0e",
        borderLeft: "2px solid #e8e8e0",
        padding: "4px 7px",
        borderRadius: "0 3px 3px 0",
      }}
    >
      <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: "0.18em", color: "#888", marginBottom: 2 }}>
        FIX
      </div>
      <div style={{ fontSize: 9, color: "#a8a89e", lineHeight: 1.4 }}>{fix}</div>
    </div>
  </div>
);

const Metric = ({
  label,
  value,
  unit,
  status,
  statusColor,
}: {
  label: string;
  value: string;
  unit?: string;
  status: string;
  statusColor: string;
}) => (
  <div
    style={{
      background: "#141414",
      border: "1px solid #232323",
      borderRadius: 4,
      padding: "8px 10px",
      marginBottom: 6,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
      <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.16em", color: "#777" }}>{label}</span>
      <span
        style={{
          fontSize: 7,
          fontWeight: 700,
          letterSpacing: "0.1em",
          color: statusColor,
          background: `${statusColor}1a`,
          padding: "1px 4px",
          borderRadius: 2,
          textTransform: "uppercase",
        }}
      >
        {status}
      </span>
    </div>
    <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
      <span style={{ fontSize: 16, fontWeight: 600, color: "#F0EDE8", letterSpacing: "-0.02em" }}>{value}</span>
      {unit && <span style={{ fontSize: 9, color: "#666" }}>{unit}</span>}
    </div>
    <div style={{ marginTop: 6, height: 3, background: "#0a0a0a", borderRadius: 2, overflow: "hidden" }}>
      <div style={{ height: "100%", width: "62%", background: statusColor, opacity: 0.7 }} />
    </div>
  </div>
);

const Todo = ({ text, done }: { text: string; done?: boolean }) => (
  <div
    style={{
      display: "flex",
      alignItems: "flex-start",
      gap: 6,
      padding: "6px 0",
      borderBottom: "1px solid #1c1c1c",
    }}
  >
    <div
      style={{
        width: 10,
        height: 10,
        borderRadius: 2,
        border: "1px solid #444",
        background: done ? "#EF9F27" : "transparent",
        marginTop: 1,
        flexShrink: 0,
      }}
    />
    <div
      style={{
        fontSize: 9,
        color: done ? "#555" : "#c8c8c0",
        lineHeight: 1.4,
        textDecoration: done ? "line-through" : "none",
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
        boxShadow: "0 30px 80px -20px rgba(0,0,0,0.8), 0 12px 30px -8px rgba(0,0,0,0.6)",
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
          <span style={{ fontSize: 11, fontWeight: 600, color: "#F0EDE8" }}>vida_retro_v4.mp3</span>
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
            v4
          </span>
        </div>
        <span style={{ fontSize: 8, color: "#555", letterSpacing: "0.06em" }}>3:42 · 44.1 kHz · STEREO</span>
      </div>

      {/* Waveform with markers */}
      <div style={{ padding: "12px 14px 10px", borderBottom: "1px solid #1c1c1c" }}>
        <div style={{ position: "relative", height: 40, display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 1.5, height: "100%", flex: 1 }}>
            {WAVE.map((h, i) => {
              const marker = MARKERS.find((m) => m.i === i);
              return (
                <div key={i} style={{ position: "relative", height: "100%", display: "flex", alignItems: "center" }}>
                  <div
                    style={{
                      width: 2,
                      height: h,
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
      <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr 0.9fr", gap: 0 }}>
        {/* SECONDEAR NOTES */}
        <div style={{ padding: "10px 12px", borderRight: "1px solid #1c1c1c" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ade80" }} />
            <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.18em", color: "#aaa" }}>
              SECONDEAR NOTES
            </span>
          </div>
          <NotesCard
            idx="01"
            ts="0:24"
            sev="high"
            title="Vocal sibilance peaks at 7 kHz"
            fix="Apply de-esser, threshold around −18 dB"
          />
          <NotesCard
            idx="02"
            ts="1:08"
            sev="med"
            title="Low-end buildup masks kick"
            fix="Cut 80–120 Hz on bass by 2–3 dB"
          />
          <NotesCard
            idx="03"
            ts="2:14"
            sev="low"
            title="Reverb tail too long on snare"
            fix="Shorten decay to 0.8s in chorus"
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
          <Metric label="LUFS" value="−9.4" unit="dB" status="HOT" statusColor="#EF9F27" />
          <Metric label="DR" value="6.2" unit="dB" status="LOW" statusColor="#E24B4A" />
          <Metric label="PEAK" value="−0.3" unit="dB" status="OK" statusColor="#4ade80" />
          <Metric label="STEREO" value="0.62" status="OK" statusColor="#4ade80" />
        </div>

        {/* NEXT MOVES */}
        <div style={{ padding: "10px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#F0EDE8" }} />
            <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.18em", color: "#aaa" }}>NEXT MOVES</span>
          </div>
          <Todo text="Fix: De-ess vocal at 7 kHz" />
          <Todo text="Fix: Cut 80–120 Hz on bass" />
          <Todo text="Fix: Tighten snare reverb" done />
          <Todo text="Re-check LUFS after limiter" />
          <Todo text="Reference against 'Blinding Lights'" />
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
