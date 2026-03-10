import { Activity, Music, Eye } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const modes = [
  {
    icon: Activity,
    name: "Technical",
    tag: "Engineer view",
    description: "Loudness, dynamics, stereo image, and mix translation — focused on what to fix first.",
    points: ["Frequency balance", "Punch and headroom", "Stereo and mono compatibility", "Loudness control"],
  },
  {
    icon: Music,
    name: "Musical",
    tag: "Producer view",
    description: "Arrangement flow, section contrast, hook clarity, and emotional momentum.",
    points: ["Arrangement pacing", "Tonal balance", "Vocal presence", "Low-end weight"],
  },
  {
    icon: Eye,
    name: "Perception",
    tag: "Listener view",
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
      className={`relative py-16 md:py-20 px-6 overflow-visible studio-grid-bg reveal ${isVisible ? "is-visible" : ""}`}
      style={{ background: "hsl(var(--surface-c))" }}
    >
      <div className="channel-strip-line absolute top-0 left-0 right-0" />
      <div className="channel-strip-line absolute bottom-0 left-0 right-0" />

      <div className="max-w-3xl mx-auto relative">
        <div className="text-center mb-10 md:mb-12 reveal-child" style={{ "--stagger": "0ms" } as React.CSSProperties}>
          <p
            className="text-[10px] text-muted-foreground/50 tracking-[0.18em] uppercase mb-3"
            style={{ fontFamily: "'IBM Plex Mono', 'DM Mono', monospace" }}
          >
            Three perspectives
          </p>
          <h2 className="text-[1.35rem] md:text-[1.5rem] font-semibold tracking-[-0.03em]">Listening modes</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          {modes.map((mode, i) => (
            <div
              key={mode.name}
              className="rounded-lg p-5 md:p-6 flex flex-col gap-3.5 transition-colors reveal-child"
              style={{
                "--stagger": `${100 + i * 100}ms`,
                background: "hsl(var(--surface-a))",
                border: "1px solid hsl(var(--border-subtle) / 0.5)",
                boxShadow: "0 1px 3px hsl(0 0% 0% / 0.04), inset 0 1px 0 hsl(0 0% 100% / 0.5)",
              } as React.CSSProperties}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-md flex items-center justify-center reveal-pop"
                  style={{
                    "--stagger": `${200 + i * 100}ms`,
                    background: "hsl(var(--surface-c))",
                    border: "1px solid hsl(var(--border-subtle) / 0.4)",
                    boxShadow: "inset 0 1px 0 hsl(0 0% 100% / 0.35)",
                  } as React.CSSProperties}
                >
                  <mode.icon className="w-4 h-4 text-foreground/60" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-[13px] font-semibold tracking-[-0.02em]">{mode.name}</h3>
                  <p
                    className="text-[9px] text-muted-foreground/40 tracking-[0.1em]"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {mode.tag}
                  </p>
                </div>
              </div>
              <p className="text-[12px] text-muted-foreground/60 leading-[1.65]">{mode.description}</p>
              <ul className="space-y-1.5 mt-auto">
                {mode.points.map((point) => (
                  <li key={point} className="text-[12px] text-foreground/70 flex items-center gap-2">
                    <span
                      className="w-1 h-1 rounded-full"
                      style={{ background: "hsl(var(--foreground) / 0.15)" }}
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
