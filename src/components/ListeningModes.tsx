import { Activity, Music, Eye } from "lucide-react";

const modes = [
  {
    icon: Activity,
    name: "Technical",
    tag: "The engineer",
    description: "Frequency balance, dynamic range, stereo width, phase issues, loudness. The objective, measurable side of your mix.",
    points: ["EQ curve analysis", "Dynamic range scoring", "Stereo correlation", "LUFS metering"],
  },
  {
    icon: Music,
    name: "Musical",
    tag: "The producer",
    description: "Arrangement, tonal balance, harmonic clarity, vocal presence. How your mix feels as a piece of music.",
    points: ["Arrangement density", "Tonal warmth vs. brightness", "Vocal-instrument balance", "Low-end clarity"],
  },
  {
    icon: Eye,
    name: "Perception",
    tag: "The listener",
    description: "First impressions, emotional impact, genre fit, commercial readiness. How your audience will actually hear it.",
    points: ["Genre benchmarking", "Emotional impact score", "Release readiness", "A/B comparison"],
  },
];

const ListeningModes = () => (
  <section id="modes" className="py-24 px-6 bg-secondary/50">
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-16">
        <p className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase mb-4">Three perspectives</p>
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Listening modes</h2>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {modes.map((mode) => (
          <div
            key={mode.name}
            className="bg-background rounded-xl border border-border-subtle p-8 flex flex-col gap-6 hover:border-foreground/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                <mode.icon className="w-4 h-4 text-foreground" />
              </div>
              <div>
                <h3 className="font-semibold tracking-tight">{mode.name}</h3>
                <p className="font-mono-brand text-xs text-muted-foreground">{mode.tag}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{mode.description}</p>
            <ul className="space-y-2 mt-auto">
              {mode.points.map((point) => (
                <li key={point} className="text-sm text-foreground flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-foreground/30" />
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

export default ListeningModes;
