import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useEffect } from "react";

const MONO = "'IBM Plex Mono', monospace";

type TagType = "NEW" | "IMPROVED" | "FIX";

const tagColors: Record<TagType, { bg: string; text: string; border: string }> = {
  NEW: { bg: "rgba(34,197,94,0.08)", text: "#4ade80", border: "rgba(34,197,94,0.25)" },
  IMPROVED: { bg: "rgba(59,130,246,0.08)", text: "#60a5fa", border: "rgba(59,130,246,0.25)" },
  FIX: { bg: "rgba(234,179,8,0.08)", text: "#facc15", border: "rgba(234,179,8,0.25)" },
};

interface Entry {
  date: string;
  version: string;
  title: string;
  tag: TagType;
  description: string;
}

const entries: Entry[] = [
  {
    date: "March 2026",
    version: "v1.2",
    title: "PDF Export redesign",
    tag: "NEW",
    description:
      "Fully redesigned export with technical metrics, timeline feedback, and Deep Read in a professional layout.",
  },
  {
    date: "March 2026",
    version: "v1.2",
    title: "Reference Match",
    tag: "NEW",
    description:
      "Upload a reference track and compare waveforms A/B side by side.",
  },
  {
    date: "March 2026",
    version: "v1.1",
    title: "Goal context",
    tag: "NEW",
    description:
      "Choose between Mixing, Mastering, or Release Check to focus the AI feedback.",
  },
  {
    date: "March 2026",
    version: "v1.0",
    title: "Stripe paywall",
    tag: "IMPROVED",
    description:
      "Free plan limited to 3 analyses/month. Pro plan unlocks all modes and unlimited tracks.",
  },
  {
    date: "March 2026",
    version: "v1.0",
    title: "Deep Read module",
    tag: "NEW",
    description:
      "Extended analysis covering mix balance, arrangement, tonal character, and stereo field.",
  },
];

const Changelog = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero header — dark */}
      <section
        style={{ background: "hsl(0 0% 5%)", paddingTop: 100, paddingBottom: 56 }}
        className="px-6"
      >
        <div className="max-w-3xl mx-auto">
          <p
            style={{
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: "0.2em",
              color: "#555",
              textTransform: "uppercase",
              fontWeight: 600,
              marginBottom: 14,
            }}
          >
            Changelog
          </p>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: "#e8e8e0",
              letterSpacing: "-0.02em",
            }}
          >
            What's new in SecondEar
          </h1>
          <p
            style={{
              fontFamily: MONO,
              fontSize: 13,
              color: "#666",
              marginTop: 10,
            }}
          >
            Updates, improvements, and new features.
          </p>
        </div>
      </section>

      {/* Entry list */}
      <section className="px-6" style={{ background: "hsl(0 0% 7.5%)" }}>
        <div className="max-w-3xl mx-auto py-12">
          <div className="flex flex-col">
            {entries.map((entry, i) => {
              const tag = tagColors[entry.tag];
              return (
                <div
                  key={i}
                  style={{
                    padding: "28px 0",
                    borderBottom:
                      i < entries.length - 1
                        ? "1px solid hsl(0 0% 12%)"
                        : "none",
                  }}
                >
                  {/* Meta row */}
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: 11,
                        color: "#555",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {entry.date}
                    </span>
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: 10,
                        color: "#888",
                        border: "1px solid #333",
                        padding: "2px 8px",
                        borderRadius: 3,
                        letterSpacing: "0.04em",
                        fontWeight: 500,
                      }}
                    >
                      {entry.version}
                    </span>
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        color: tag.text,
                        background: tag.bg,
                        border: `1px solid ${tag.border}`,
                        padding: "2px 8px",
                        borderRadius: 3,
                        textTransform: "uppercase",
                      }}
                    >
                      {entry.tag}
                    </span>
                  </div>

                  {/* Title */}
                  <h2
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: "#e8e8e0",
                      marginBottom: 6,
                    }}
                  >
                    {entry.title}
                  </h2>

                  {/* Description */}
                  <p
                    style={{
                      fontSize: 13,
                      color: "#888",
                      lineHeight: 1.7,
                    }}
                  >
                    {entry.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Changelog;
