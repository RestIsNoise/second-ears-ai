import { Activity, Music, Eye } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const modes = [
  {
    icon: Activity,
    name: "Technical",
    tag: "Engineer view",
    accent: "35 55% 55%",
    description: "Loudness, dynamics, stereo image, and mix translation — focused on what to fix first.",
    points: ["Frequency balance", "Punch and headroom", "Stereo and mono compatibility", "Loudness control"],
  },
  {
    icon: Music,
    name: "Musical",
    tag: "Producer view",
    accent: "215 45% 55%",
    description: "Arrangement flow, section contrast, hook clarity, and emotional momentum.",
    points: ["Arrangement pacing", "Tonal balance", "Vocal presence", "Low-end weight"],
  },
  {
    icon: Eye,
    name: "Perception",
    tag: "Listener view",
    accent: "270 35% 55%",
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
      className={`relative py-18 md:py-24 px-6 overflow-visible reveal ${isVisible ? "is-visible" : ""}`}
      style={{ background: "hsl(var(--surface-c))" }}
    >
      <div className="channel-strip-line absolute top-0 left-0 right-0" />
      <div className="channel-strip-line absolute bottom-0 left-0 right-0" />

      {/* Faint grid texture — only this section */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--border-subtle) / 0.08) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border-subtle) / 0.08) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="max-w-3xl mx-auto relative">
        {/* Right-aligned heading — asymmetry */}
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

        <div className="grid md:grid-cols-3 gap-3">
          {modes.map((mode, i) => (
            <div
              key={mode.name}
              className="rounded-lg p-5 md:p-6 flex flex-col gap-3.5 transition-all duration-200 reveal-child group"
              style={{
                "--stagger": `${100 + i * 120}ms`,
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border-subtle) / 0.4)",
                boxShadow: "0 1px 3px hsl(0 0% 0% / 0.03), inset 0 1px 0 hsl(0 0% 100% / 0.5)",
              } as React.CSSProperties}
            >
              {/* Mode accent bar */}
              <div
                className="h-px w-full rounded-full mb-1"
                style={{ background: `linear-gradient(90deg, hsl(${mode.accent} / 0.4), hsl(${mode.accent} / 0.05))` }}
              />
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-md flex items-center justify-center reveal-pop"
                  style={{
                    "--stagger": `${220 + i * 120}ms`,
                    background: `hsl(${mode.accent} / 0.08)`,
                    border: `1px solid hsl(${mode.accent} / 0.12)`,
                  } as React.CSSProperties}
                >
                  <mode.icon className="w-4 h-4" style={{ color: `hsl(${mode.accent} / 0.7)` }} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-[13px] font-semibold tracking-[-0.02em]">{mode.name}</h3>
                  <p
                    className="text-[9px] text-muted-foreground/35 tracking-[0.1em]"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {mode.tag}
                  </p>
                </div>
              </div>
              <p className="text-[12px] text-muted-foreground/55 leading-[1.65]">{mode.description}</p>
              <ul className="space-y-1.5 mt-auto pt-2" style={{ borderTop: "1px solid hsl(var(--border-subtle) / 0.2)" }}>
                {mode.points.map((point) => (
                  <li key={point} className="text-[11.5px] text-foreground/65 flex items-center gap-2">
                    <span
                      className="w-[3px] h-[3px] rounded-full"
                      style={{ background: `hsl(${mode.accent} / 0.35)` }}
                    />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ListeningModes;
