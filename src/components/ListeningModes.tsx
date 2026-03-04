import { Activity, Music, Eye } from "lucide-react";

const modes = [
  {
    icon: Activity,
    name: "Technical",
    tag: "Engineer view",
    description: "LUFS, dynamic range, stereo width, phase. Numbers and meters.",
    points: ["EQ curve", "DR scoring", "Stereo correlation", "LUFS"],
  },
  {
    icon: Music,
    name: "Musical",
    tag: "Producer view",
    description: "Arrangement, tonal balance, vocal presence. How the track works as music.",
    points: ["Arrangement density", "Tonal balance", "Vocal clarity", "Low-end weight"],
  },
  {
    icon: Eye,
    name: "Perception",
    tag: "Listener view",
    description: "System translation, first impressions, genre context. How it sounds on other speakers.",
    points: ["System translation", "First impression", "Genre fit", "Playback check"],
  },
];

const ListeningModes = () => (
  <section id="modes" className="py-14 md:py-16 px-6 bg-secondary/50 overflow-visible">
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-8 md:mb-10">
        <p className="font-mono-brand text-xs text-muted-foreground tracking-widest uppercase mb-3">Three perspectives</p>
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Listening modes</h2>
      </div>
      <div className="grid md:grid-cols-3 gap-5">
        {modes.map((mode) => (
          <div
            key={mode.name}
            className="bg-background rounded-xl border border-border-subtle p-7 md:p-8 flex flex-col gap-5 hover:border-foreground/10 transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <mode.icon className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold tracking-tight">{mode.name}</h3>
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
