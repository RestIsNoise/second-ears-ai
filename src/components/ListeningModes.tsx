import { SlidersHorizontal, Music, Ear } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const modes = [
  {
    icon: SlidersHorizontal,
    name: "Technical",
    tag: "Engineer view",
    accent: "0 0% 40%",
    description: "Loudness, dynamics, stereo image, and mix translation — focused on what to fix first.",
    points: ["Frequency balance", "Punch and headroom", "Stereo and mono compatibility", "Loudness control"],
  },
  {
    icon: Music,
    name: "Musical",
    tag: "Producer view",
    accent: "0 0% 30%",
    description: "Arrangement flow, section contrast, hook clarity, and emotional momentum.",
    points: ["Arrangement pacing", "Tonal balance", "Vocal presence", "Low-end weight"],
  },
  {
    icon: Ear,
    name: "Perception",
    tag: "Listener view",
    accent: "0 0% 20%",
    description: "How the mix translates on real speakers: impact, clarity, fatigue, and room response.",
    points: ["Speaker translation", "Listener impact", "Ear fatigue", "Playback compatibility"],
  },
];

const ListeningModes = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section
      ref={ref}
      id="modes"
      className={`relative py-24 md:py-32 px-6 overflow-visible reveal ${isVisible ? "is-visible" : ""}`}
      style={{ background: "hsl(var(--surface-c))" }}
    >
      <div className="channel-strip-line absolute top-0 left-0 right-0" />
      <div className="channel-strip-line absolute bottom-0 left-0 right-0" />

      {/* Faint grid texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--border-subtle) / 0.08) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border-subtle) / 0.08) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="mx-auto relative" style={{ maxWidth: 900 }}>
        {/* Right-aligned heading */}
        <div className="md:text-right mb-12 md:mb-14 reveal-child" style={{ "--stagger": "0ms" } as React.CSSProperties}>
          <p
            className="text-[10px] text-muted-foreground/40 tracking-[0.2em] uppercase mb-3"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Three perspectives
          </p>
          <h2 className="text-[1.5rem] md:text-[1.75rem] font-semibold tracking-[-0.035em] leading-tight">
            Listening modes
          </h2>
          <p className="text-[12.5px] text-muted-foreground/50 mt-2 leading-relaxed md:ml-auto max-w-xs">
            Each mode listens for different things. Run one or all three.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {modes.map((mode, i) => (
            <div
              key={mode.name}
              className="relative rounded-lg overflow-hidden flex flex-col reveal-child group"
              style={{
                "--stagger": `${100 + i * 120}ms`,
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border-subtle) / 0.45)",
                boxShadow:
                  "0 2px 8px hsl(0 0% 0% / 0.04), 0 8px 24px hsl(0 0% 0% / 0.03), inset 0 1px 0 hsl(0 0% 100% / 0.55)",
              } as React.CSSProperties}
            >
              {/* Panel header */}
              <div
                className="px-7 pt-7 pb-5"
                style={{ borderBottom: "1px solid hsl(var(--border-subtle) / 0.2)" }}
              >
                <div className="flex items-center justify-between mb-3.5">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center reveal-pop"
                    style={{
                      "--stagger": `${220 + i * 120}ms`,
                      background: "hsl(var(--surface-b))",
                      border: "1px solid hsl(var(--border-subtle) / 0.5)",
                      boxShadow:
                        "inset 0 1px 0 hsl(0 0% 100% / 0.6), inset 0 -1px 0 hsl(0 0% 0% / 0.03), 0 1px 3px hsl(0 0% 0% / 0.06)",
                    } as React.CSSProperties}
                  >
                    <mode.icon className="w-4 h-4 text-foreground/50" strokeWidth={1.5} />
                  </div>
                  <span
                    className="text-[8.5px] text-muted-foreground/35 uppercase"
                    style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.10em", fontWeight: 500 }}
                  >
                    {mode.tag}
                  </span>
                </div>
                <h3
                  className="text-[14px] text-foreground/85 uppercase"
                  style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.06em", fontWeight: 700 }}
                >
                  {mode.name}
                </h3>
                <p className="text-[11.5px] text-muted-foreground/45 leading-[1.65] mt-2">
                  {mode.description}
                </p>
              </div>

              {/* Feature list */}
              <div className="px-5 py-4 flex-1 flex flex-col justify-end">
                <ul className="space-y-0">
                  {mode.points.map((point, j) => (
                    <li
                      key={point}
                      className="text-[11.5px] text-foreground/60 flex items-center gap-2.5 py-[7px]"
                      style={{
                        borderTop: j > 0 ? "1px solid hsl(var(--border-subtle) / 0.12)" : "none",
                      }}
                    >
                      <span
                        className="w-1 h-1 rounded-full shrink-0"
                        style={{ background: "hsl(var(--foreground) / 0.18)" }}
                      />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bottom accent line */}
              <div
                className="h-[2px] w-full mt-auto"
                style={{
                  background: `linear-gradient(90deg, hsl(${mode.accent} / 0.25), hsl(${mode.accent} / 0.08))`,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ListeningModes;
