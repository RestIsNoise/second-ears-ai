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
      className={`py-16 md:py-20 px-6 bg-secondary/40 overflow-visible reveal ${isVisible ? "is-visible" : ""}`}
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10 md:mb-12 reveal-child" style={{ "--stagger": "0ms" } as React.CSSProperties}>
          <p
            className="text-[10px] text-muted-foreground/60 tracking-[0.18em] uppercase mb-3"
            style={{ fontFamily: "'IBM Plex Mono', 'DM Mono', monospace" }}
          >
            Three perspectives
          </p>
          <h2 className="text-2xl md:text-[1.75rem] font-semibold tracking-tight">Listening modes</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {modes.map((mode, i) => (
            <div
              key={mode.name}
              className="bg-background rounded-lg border border-border-subtle/50 p-6 md:p-7 flex flex-col gap-4 hover:border-foreground/10 transition-colors reveal-child"
              style={{ "--stagger": `${100 + i * 100}ms` } as React.CSSProperties}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-secondary/60 flex items-center justify-center reveal-pop" style={{ "--stagger": `${200 + i * 100}ms` } as React.CSSProperties}>
                  <mode.icon className="w-[18px] h-[18px] text-foreground/80" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold tracking-tight">{mode.name}</h3>
                  <p
                    className="text-[10px] text-muted-foreground/55 tracking-wide"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {mode.tag}
                  </p>
                </div>
              </div>
              <p className="text-[13px] text-muted-foreground/70 leading-relaxed">{mode.description}</p>
              <ul className="space-y-2 mt-auto">
                {mode.points.map((point) => (
                  <li key={point} className="text-[13px] text-foreground/80 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-foreground/20" />
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
